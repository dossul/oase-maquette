import { test, expect } from '@playwright/test'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import { api, apiLogin, PASSWORD, watchConsoleErrors } from './helpers'

/**
 * TC-AUTH-03 — Réinitialisation / activation de mot de passe par E-MAIL RÉEL.
 *
 * Chaîne prouvée de bout en bout : demande → backend génère le code → envoi
 * SMTP réel (kilo.o2switch.net:465) → réception no_reply@il7.info → lecture
 * IMAP (port 993) → extraction du code → /auth/password/reset-confirm →
 * login avec le nouveau mot de passe → RESTAURATION du mot de passe original.
 *
 * Le compte utilisé est no_reply@il7.info : seule boîte réellement lisible à
 * ce stade du projet (même compte que TC-AUTH-02 email).
 *
 * ⚠️ EXÉCUTION ISOLÉE OBLIGATOIRE (mot de passe du compte modifié pendant le test) :
 *   node node_modules/@playwright/test/cli.js test e2e/recette/auth-password-reset.spec.ts --workers=1
 *
 * Credentials IMAP : e2e/recette/assets/mail.local.json (gitignoré, jamais commité).
 */

const COMPTE = 'no_reply@il7.info'
const MDP_TEMPORAIRE = 'Reset@2026!Temp'
const MAIL_CONF_PATH = join(dirname(fileURLToPath(import.meta.url)), 'assets', 'mail.local.json')

interface MailConf {
  imap: { host: string; port: number; secure: boolean; user: string; pass: string }
}

function lireConfMail(): MailConf | null {
  if (!existsSync(MAIL_CONF_PATH)) return null
  return JSON.parse(readFileSync(MAIL_CONF_PATH, 'utf-8')) as MailConf
}

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

/** Attend un mail « réinitialisation » non lu et extrait le code à 6 chiffres. */
async function attendreCodeReset(conf: MailConf, timeoutMs = 90000): Promise<string> {
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
        // On PARSE le mail : la source MIME brute encode les accents (quoted-printable)
        const parsed = await simpleParser(msg.source)
        const contenu = `${parsed.subject ?? ''}\n${parsed.text ?? ''}`
        if (!/réinitialisation/i.test(contenu)) continue
        const m = contenu.match(/(?<!\d)(\d{6})(?!\d)/)
        if (m) {
          await client.messageFlagsAdd(String(uid), ['\\Seen']).catch(() => {})
          return m[1]
        }
      }
      await new Promise((r) => setTimeout(r, 5000))
    }
    throw new Error(`Aucun code de réinitialisation reçu par e-mail en ${timeoutMs / 1000}s`)
  } finally {
    lock.release()
    await client.logout().catch(() => {})
  }
}

/** Restaure le mot de passe original Oase@2026! — SANS cela toute la suite casse. */
async function restaurerMotDePasse(request: Parameters<typeof apiLogin>[0], mdpActuel: string) {
  const token = await apiLogin(request, COMPTE, mdpActuel)
  const res = await api(request, token).post('/auth/password/change', {
    oldPassword: mdpActuel,
    newPassword: PASSWORD,
    newPasswordConfirm: PASSWORD,
  })
  expect(res.status(), 'restauration du mot de passe original').toBe(200)
  // Vérif : le login avec le mot de passe original refonctionne
  const retour = await api(request, '').post('/auth/login', { email: COMPTE, password: PASSWORD })
  expect(retour.status(), 'login avec le mot de passe restauré').toBe(200)
}

test.describe.configure({ mode: 'serial', timeout: 180000 })

test.describe('TC-AUTH-03 — Reset/activation mot de passe par e-mail réel', () => {
  const conf = lireConfMail()

  test.beforeEach(async () => {
    test.skip(!conf, 'mail.local.json absent (credentials IMAP locaux requis)')
  })

  test.afterEach(async ({ request }) => {
    // Filet de sécurité : si le test a planté APRES le reset, le mot de passe
    // du compte est le temporaire — on tente la restauration dans tous les cas.
    const loginTemp = await api(request, '').post('/auth/login', { email: COMPTE, password: MDP_TEMPORAIRE })
    if (loginTemp.status() === 200) {
      await restaurerMotDePasse(request, MDP_TEMPORAIRE)
    }
  })

  test('API — code reçu par e-mail réel accepté, faux code rejeté, reset complet', async ({ request }) => {
    await marquerBoiteLue(conf!)

    // 1. Demande — réponse uniforme pour un e-mail inconnu (anti-énumération)
    const inconnu = await api(request, '').post('/auth/password/reset-request', { email: 'personne@inconnu.tg' })
    expect(inconnu.status()).toBe(200)
    expect((await inconnu.json()).data.envoye).toBe(true)

    // 2. Demande pour le vrai compte
    const demande = await api(request, '').post('/auth/password/reset-request', { email: COMPTE })
    expect(demande.status()).toBe(200)
    const corps = await demande.json()
    expect(corps.data.envoye).toBe(true)
    expect(corps.data.expireDans).toBe(900)

    // 3. Lecture RÉELLE de la boîte
    const code = await attendreCodeReset(conf!)
    expect(code, 'code à 6 chiffres extrait du mail').toMatch(/^\d{6}$/)

    // 4. Faux code rejeté
    const faux = await api(request, '').post('/auth/password/reset-confirm', {
      email: COMPTE, code: '000000',
      newPassword: MDP_TEMPORAIRE, newPasswordConfirm: MDP_TEMPORAIRE,
    })
    expect([401, 200]).toContain(faux.status()) // 000000 peut être le vrai code (1/1 000 000)
    if (faux.status() === 200) {
      // Cas quasi impossible : le « faux » code était le vrai — le reset est déjà fait
      await restaurerMotDePasse(request, MDP_TEMPORAIRE)
      return
    }
    expect((await faux.json()).code).toBe('RESET_CODE_INVALIDE')

    // 5. Vrai code accepté
    const ok = await api(request, '').post('/auth/password/reset-confirm', {
      email: COMPTE, code,
      newPassword: MDP_TEMPORAIRE, newPasswordConfirm: MDP_TEMPORAIRE,
    })
    expect(ok.status(), 'le code reçu par e-mail doit être accepté').toBe(200)

    // 6. Login avec le NOUVEAU mot de passe
    const login = await api(request, '').post('/auth/login', { email: COMPTE, password: MDP_TEMPORAIRE })
    expect(login.status(), 'login avec le nouveau mot de passe').toBe(200)

    // 7. Code à usage unique : le rejouer doit échouer
    const rejeu = await api(request, '').post('/auth/password/reset-confirm', {
      email: COMPTE, code,
      newPassword: MDP_TEMPORAIRE, newPasswordConfirm: MDP_TEMPORAIRE,
    })
    expect(rejeu.status(), 'le code consommé ne doit pas être rejouable').toBe(401)

    // 8. RESTAURATION du mot de passe original (obligatoire pour la suite)
    await restaurerMotDePasse(request, MDP_TEMPORAIRE)
  })

  test('UI — /reset-password → code reçu par e-mail → nouveau mot de passe → login', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    await marquerBoiteLue(conf!)

    await page.goto('/reset-password')
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
    await page.goto('/reset-password')

    // Étape 1 : e-mail → envoi du code
    await page.getByRole('textbox', { name: /Adresse e-mail/i }).fill(COMPTE)
    await page.getByRole('button', { name: /Envoyer le code/i }).click()
    await expect(page.getByText(/code de réinitialisation vient d’être envoyé/i)).toBeVisible({ timeout: 15000 })

    // Étape 2 : code lu dans la VRAIE boîte + nouveau mot de passe
    await page.getByRole('button', { name: /J'ai reçu le code/i }).click()
    const code = await attendreCodeReset(conf!)
    await page.getByRole('textbox', { name: /Code à 6 chiffres/i }).fill(code)
    await page.getByRole('textbox', { name: /Nouveau mot de passe/i }).fill(MDP_TEMPORAIRE)
    await page.getByRole('textbox', { name: /Confirmation du mot de passe/i }).fill(MDP_TEMPORAIRE)
    await page.getByRole('button', { name: /Enregistrer le nouveau mot de passe/i }).click()

    // Étape 3 : écran de succès
    await expect(page.getByText(/Mot de passe réinitialisé avec succès/i)).toBeVisible({ timeout: 15000 })

    // Login réel avec le nouveau mot de passe
    await page.goto('/login')
    await page.getByRole('textbox', { name: /Identifiant|E-mail|Email/i }).fill(COMPTE)
    await page.getByRole('textbox', { name: /Mot de passe/i }).fill(MDP_TEMPORAIRE)
    await page.getByRole('button', { name: /Se connecter/i }).click()
    await expect(page).toHaveURL(/\/portail\/dashboard/, { timeout: 15000 })

    // RESTAURATION (le compte est connecté, mais on passe par l'API : plus fiable)
    await restaurerMotDePasse(request, MDP_TEMPORAIRE)

    const erreursJs = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to load resource'))
    expect(erreursJs, 'erreurs JS pendant le flux reset UI').toEqual([])
  })
})
