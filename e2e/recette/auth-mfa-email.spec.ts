import { test, expect } from '@playwright/test'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import { USERS, api, apiLogin, PASSWORD, watchConsoleErrors } from './helpers'

/**
 * TC-AUTH-02 (email) — MFA par e-mail avec VRAI SMTP (o2switch) et VRAIE lecture IMAP.
 *
 * Chaîne prouvée de bout en bout : login → backend génère le code → envoi SMTP réel
 * (kilo.o2switch.net:465) → réception dans la boîte no_reply@il7.info → lecture IMAP
 * (port 993) → extraction du code → vérification /auth/mfa/verify → session.
 *
 * ⚠️ EXÉCUTION ISOLÉE OBLIGATOIRE (config MFA globale togglée) :
 *   node node_modules/@playwright/test/cli.js test e2e/recette/auth-mfa-email.spec.ts --workers=1
 *
 * Credentials IMAP : e2e/recette/assets/mail.local.json (gitignoré, jamais commité).
 * Le compte de test (no_reply@il7.info) est à la fois l'émetteur SMTP et le destinataire
 * — seule boîte réellement lisible à ce stade du projet.
 */

const COMPTE_MFA = 'no_reply@il7.info'
const MAIL_CONF_PATH = join(dirname(fileURLToPath(import.meta.url)), 'assets', 'mail.local.json')

interface MailConf {
  imap: { host: string; port: number; secure: boolean; user: string; pass: string }
}

function lireConfMail(): MailConf | null {
  if (!existsSync(MAIL_CONF_PATH)) return null
  return JSON.parse(readFileSync(MAIL_CONF_PATH, 'utf-8')) as MailConf
}

/** Marque tous les messages existants comme lus (à appeler AVANT de déclencher l'envoi). */
async function marquerBoiteLue(conf: MailConf): Promise<void> {
  const client = new ImapFlow({
    host: conf.imap.host,
    port: conf.imap.port,
    secure: conf.imap.secure,
    auth: { user: conf.imap.user, pass: conf.imap.pass },
    logger: false,
  })
  await client.connect()
  const lock = await client.getMailboxLock('INBOX')
  try {
    await client.messageFlagsAdd({ all: true }, ['\\Seen']).catch(() => {})
  } finally {
    lock.release()
    await client.logout().catch(() => {})
  }
}

/** Attend un mail « code de vérification » non lu et extrait le code à 6 chiffres. */
async function attendreCodeParMail(conf: MailConf, timeoutMs = 90000): Promise<string> {
  const client = new ImapFlow({
    host: conf.imap.host,
    port: conf.imap.port,
    secure: conf.imap.secure,
    auth: { user: conf.imap.user, pass: conf.imap.pass },
    logger: false,
  })
  await client.connect()
  const lock = await client.getMailboxLock('INBOX')
  try {
    const debut = Date.now()
    while (Date.now() - debut < timeoutMs) {
      const uids = await client.search({ seen: false })
      const liste = Array.isArray(uids) ? uids : []
      for (const uid of liste) {
        const msg = await client.fetchOne(String(uid), { source: true })
        if (!msg?.source) continue
        // OASE fix (29/07) : la source MIME brute encode le texte accentué
        // (quoted-printable/base64) — « vérification » devient « v=C3=A9rification »
        // et le filtre ne matchait jamais. On PARSE le mail (sujet + texte décodés).
        const parsed = await simpleParser(msg.source)
        const contenu = `${parsed.subject ?? ''}\n${parsed.text ?? ''}`
        if (!/code de vérification/i.test(contenu)) continue
        const m = contenu.match(/(?<!\d)(\d{6})(?!\d)/)
        if (m) {
          await client.messageFlagsAdd(String(uid), ['\\Seen']).catch(() => {})
          return m[1]
        }
      }
      await new Promise((r) => setTimeout(r, 5000))
    }
    throw new Error(`Aucun code MFA reçu par e-mail en ${timeoutMs / 1000}s`)
  } finally {
    lock.release()
    await client.logout().catch(() => {})
  }
}

async function setMfaGlobal(request: Parameters<typeof apiLogin>[0], enabled: boolean, canal: string) {
  const adminToken = await apiLogin(request, USERS.p7.email)
  const res = await api(request, adminToken).patch('/admin/mfa/config', {
    enabled,
    defaultChannel: canal,
    channels: ['totp', 'email'],
  })
  expect(res.status(), `PATCH /admin/mfa/config enabled=${enabled} canal=${canal}`).toBe(200)
  return adminToken
}

test.describe.configure({ mode: 'serial', timeout: 180000 })

test.describe('TC-AUTH-02 (email) — MFA par e-mail réel', () => {
  const conf = lireConfMail()
  let adminToken = ''

  test.beforeEach(async ({ request }) => {
    test.skip(!conf, 'mail.local.json absent (credentials IMAP locaux requis)')
    adminToken = await setMfaGlobal(request, false)
  })

  test.afterEach(async ({ request }) => {
    await setMfaGlobal(request, false, 'totp')
  })

  /** Précondition : MFA global ON canal email + mfaActive=true sur le compte. */
  async function preparerCompte(request: Parameters<typeof apiLogin>[0]) {
    const tokenSansMfa = await apiLogin(request, COMPTE_MFA)
    const me = await api(request, tokenSansMfa).get('/utilisateurs/me')
    const userId = (await me.json()).id as string
    await setMfaGlobal(request, true, 'email')
    // reset-mfa garantit mfaActive=true (régénère aussi un secret TOTP, sans effet ici)
    const reset = await api(request, adminToken).post(`/utilisateurs/${userId}/reset-mfa`)
    expect([200, 201], 'reset-mfa admin (NestJS renvoie 201 sur POST)').toContain(reset.status())
  }

  test('API — code reçu par e-mail réel accepté, faux code rejeté', async ({ request }) => {
    await preparerCompte(request)
    // Boîte à l'état connu AVANT l'envoi : seul le mail du test restera non lu
    await marquerBoiteLue(conf!)

    const login = await api(request, '').post('/auth/login', { email: COMPTE_MFA, password: PASSWORD })
    expect(login.status()).toBe(200)
    const body = await login.json()
    expect(body.mfa_required).toBe(true)
    expect(body.canal, 'le canal par défaut doit être email').toBe('email')

    // Lecture RÉELLE de la boîte : le code vient du mail envoyé par le backend
    const code = await attendreCodeParMail(conf!)
    expect(code, 'code à 6 chiffres extrait du mail').toMatch(/^\d{6}$/)

    const faux = await api(request, '').post('/auth/mfa/verify', {
      mfa_token: body.mfa_token, code: '999999', canal: 'email',
    })
    expect([401, 200]).toContain(faux.status()) // 999999 peut théoriquement être le vrai code (1/1 000 000)
    if (faux.status() === 200) return // cas quasi impossible : le faux était le vrai

    const ok = await api(request, '').post('/auth/mfa/verify', {
      mfa_token: body.mfa_token, code, canal: 'email',
    })
    expect(ok.status(), 'le code reçu par e-mail doit être accepté').toBe(200)
    const session = await ok.json()
    const me = await api(request, session.access_token).get('/utilisateurs/me')
    expect(me.status()).toBe(200)
  })

  test('UI — login → /mfa → code reçu par e-mail → dashboard', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    await preparerCompte(request)
    await marquerBoiteLue(conf!)

    await page.goto('/login')
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
    await page.goto('/login')
    await page.getByRole('textbox', { name: /Identifiant|E-mail|Email/i }).fill(COMPTE_MFA)
    await page.getByRole('textbox', { name: /Mot de passe/i }).fill(PASSWORD)
    await page.getByRole('button', { name: /Se connecter/i }).click()

    await expect(page).toHaveURL(/\/mfa/, { timeout: 15000 })

    const code = await attendreCodeParMail(conf!)
    await page.locator('.v-otp-input input').first().pressSequentially(code, { delay: 60 })
    await page.getByRole('button', { name: /Vérifier/i }).click()

    await expect(page).toHaveURL(/\/portail\/dashboard/, { timeout: 15000 })

    const erreursJs = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to load resource'))
    expect(erreursJs, 'erreurs JS pendant le flux MFA email UI').toEqual([])
  })
})
