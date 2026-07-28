import { test, expect } from '@playwright/test'
import { USERS, api, apiLogin, PASSWORD, watchConsoleErrors } from './helpers'
import { totpCode } from './assets/totp'

/**
 * TC-AUTH-02 — Authentification MFA TOTP (backend réel, compte dédié no_reply@il7.info).
 *
 * ⚠️ EXÉCUTION ISOLÉE OBLIGATOIRE : ce spec active/désactive la config MFA GLOBALE
 * (PATCH /admin/mfa/config). Ne JAMAIS le lancer en parallèle d'autres specs —
 * tout login concurrent exigerait un MFA pendant la fenêtre de test.
 *   node node_modules/@playwright/test/cli.js test e2e/recette/auth-mfa.spec.ts --workers=1
 *
 * Le nettoyage (MFA global désactivé) est garanti par afterEach même en cas d'échec.
 */

const COMPTE_MFA = 'no_reply@il7.info'

/** Active/désactive la politique MFA globale (admin). */
async function setMfaGlobal(request: Parameters<typeof apiLogin>[0], enabled: boolean, canal = 'totp') {
  const adminToken = await apiLogin(request, USERS.p7.email)
  const res = await api(request, adminToken).patch('/admin/mfa/config', {
    enabled,
    defaultChannel: canal,
    channels: ['totp', 'email'],
  })
  expect(res.status(), `PATCH /admin/mfa/config enabled=${enabled}`).toBe(200)
  return adminToken
}

/** Récupère l'id du compte de test MFA (login direct tant que mfaActive=false). */
async function idCompteMfa(request: Parameters<typeof apiLogin>[0], token: string) {
  const me = await api(request, token).get('/utilisateurs/me')
  expect(me.status()).toBe(200)
  return (await me.json()).id as string
}

test.describe.configure({ mode: 'serial', timeout: 120000 })

test.describe('TC-AUTH-02 — MFA TOTP', () => {
  let adminToken = ''

  test.beforeEach(async ({ request }) => {
    // État de départ connu : MFA global OFF (le compte de test garde mfaActive=false)
    adminToken = await setMfaGlobal(request, false)
  })

  test.afterEach(async ({ request }) => {
    // Nettoyage GARANTI : sinon tous les logins de la plateforme exigeraient un MFA
    await setMfaGlobal(request, false)
  })

  test('API — login → mfa_required → code TOTP rejeté si faux, accepté si valide', async ({ request }) => {
    const tokenSansMfa = await apiLogin(request, COMPTE_MFA)
    const userId = await idCompteMfa(request, tokenSansMfa)

    // Admin : MFA global ON (canal TOTP) + secret TOTP frais pour le compte
    await setMfaGlobal(request, true, 'totp')
    const reset = await api(request, adminToken).post(`/utilisateurs/${userId}/reset-mfa`)
    expect(reset.status(), 'reset-mfa admin').toBe(200)
    const { mfaSecret } = await reset.json()
    expect(mfaSecret, 'secret TOTP retourné par reset-mfa').toBeTruthy()

    // Login : pas de token complet, mais un mfa_token temporaire
    const login = await api(request, '').post('/auth/login', { email: COMPTE_MFA, password: PASSWORD })
    expect(login.status()).toBe(200)
    const body = await login.json()
    expect(body.mfa_required, 'mfa_required attendu').toBe(true)
    expect(body.mfa_token, 'mfa_token temporaire attendu').toBeTruthy()
    expect(body.canal).toBe('totp')
    expect(body.access_token, 'PAS de access_token avant vérification MFA').toBeUndefined()

    // Code faux → 401 CODE_MFA_INVALIDE
    const faux = await api(request, '').post('/auth/mfa/verify', {
      mfa_token: body.mfa_token, code: '000000', canal: 'totp',
    })
    expect(faux.status(), 'un faux code TOTP doit être rejeté').toBe(401)

    // Vrai code (généré avec le secret) → 200 + paire de tokens fonctionnelle
    const code = totpCode(mfaSecret)
    const ok = await api(request, '').post('/auth/mfa/verify', {
      mfa_token: body.mfa_token, code, canal: 'totp',
    })
    expect(ok.status(), `vérification TOTP avec le code réel ${code}`).toBe(200)
    const session = await ok.json()
    expect(session.access_token).toBeTruthy()
    const me = await api(request, session.access_token).get('/utilisateurs/me')
    expect(me.status(), 'token post-MFA utilisable immédiatement').toBe(200)
  })

  test('UI — formulaire login → page /mfa → saisie OTP → dashboard', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    const tokenSansMfa = await apiLogin(request, COMPTE_MFA)
    const userId = await idCompteMfa(request, tokenSansMfa)
    await setMfaGlobal(request, true, 'totp')
    const reset = await api(request, adminToken).post(`/utilisateurs/${userId}/reset-mfa`)
    const { mfaSecret } = await reset.json()

    await page.goto('/login')
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear() })
    await page.goto('/login')
    await page.getByRole('textbox', { name: /Identifiant|E-mail|Email/i }).fill(COMPTE_MFA)
    await page.getByRole('textbox', { name: /Mot de passe/i }).fill(PASSWORD)
    await page.getByRole('button', { name: /Se connecter/i }).click()

    // Redirection vers la page de vérification (BUG #11 corrigé : plus de faux « identifiants incorrects »)
    await expect(page).toHaveURL(/\/mfa/, { timeout: 15000 })
    await expect(page.getByText('Vérification en 2 étapes')).toBeVisible()

    // Saisie du code TOTP réel dans le v-otp-input
    const code = totpCode(mfaSecret)
    await page.locator('.v-otp-input input').first().pressSequentially(code, { delay: 60 })
    await page.getByRole('button', { name: /Vérifier/i }).click()

    // Session complète → dashboard du rôle (compte contribuable)
    await expect(page).toHaveURL(/\/portail\/dashboard/, { timeout: 15000 })

    const erreursJs = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to load resource'))
    expect(erreursJs, 'erreurs JS pendant le flux MFA UI').toEqual([])
  })
})
