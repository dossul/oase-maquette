import { expect, type Page } from '@playwright/test'
import { defaultDashboardForRole, defaultPassword, installApiMocks, mockUsers, type OaseRole } from './mocks'

function emailField(page: Page) {
  return page.getByRole('textbox', { name: /Identifiant \(e-mail institutionnel ou RCCM\)|E-mail|Email/i })
}

function passwordField(page: Page) {
  return page.getByRole('textbox', { name: /Mot de passe/i })
}

function submitButton(page: Page) {
  return page.getByRole('button', { name: /Se connecter/i })
}

/**
 * Connecte un utilisateur via le formulaire de login.
 * Le backend est mocké (localhost:3000 n'a pas besoin d'être démarré).
 * Cette helper remplit les champs, clique sur "Se connecter" et attend
 * la redirection RÉELLE de LoginView vers le dashboard par défaut du rôle
 * (comportement actuel de l'app : router.push(getDefaultRouteForRole(role))).
 */
export async function loginAs(page: Page, role: OaseRole, mockOptions: Omit<Parameters<typeof installApiMocks>[1], 'user'> = {}) {
  const user = mockUsers[role]
  await installApiMocks(page, { user, ...mockOptions })

  await page.goto('/login')
  await expect(page).toHaveTitle(/OASE/)

  await emailField(page).fill(user.email)
  await passwordField(page).fill(defaultPassword)

  const loginResponse = page.waitForResponse('**/api/v1/auth/login')
  await submitButton(page).click()
  await loginResponse

  // LoginView redirige vers le dashboard par défaut du rôle (session Pinia établie).
  await expect(page).toHaveURL(new RegExp(defaultDashboardForRole[role].replace(/\//g, '\\/')))
}

/**
 * Connecte un utilisateur avec MFA obligatoire.
 * Le login renvoie mfaRequired=true, la page /mfa est affichée,
 * puis la vue MFA redirige automatiquement vers /portail/dashboard.
 */
export async function loginWithMfa(page: Page, role: OaseRole = 'agent_ci') {
  const user = mockUsers[role]
  await installApiMocks(page, { user, mfaRequired: true })

  await page.goto('/login')
  await emailField(page).fill(user.email)
  await passwordField(page).fill(defaultPassword)

  const loginResponse = page.waitForResponse('**/api/v1/auth/login')
  await submitButton(page).click()
  await loginResponse

  await expect(page).toHaveURL(/\/mfa/)
  await expect(page.locator('text=Vérification en 2 étapes')).toBeVisible()

  // La maquette simule un OTP de 6 chiffres ; la vue redirige dès la saisie complète.
  await page.locator('.v-otp-input input').first().waitFor()
  const inputs = page.locator('.v-otp-input input')
  for (let i = 0; i < 6; i++) {
    await inputs.nth(i).fill(String((i + 1) % 10))
  }

  // La vue MFA redirige automatiquement une fois l'OTP complet saisi.
  await expect(page).toHaveURL(/\/portail\/dashboard/)
}

/**
 * Navigue vers le dashboard par défaut du rôle après authentification.
 * Après loginAs, l'app est DÉJÀ sur le dashboard (redirection post-login) ;
 * on clique quand même le lien du menu (présent dans la sidebar) pour
 * reproduire un parcours utilisateur réel et attendre le layout complet.
 */
export async function gotoDashboard(page: Page, role: OaseRole, mockOptions: Omit<Parameters<typeof installApiMocks>[1], 'user'> = {}) {
  await loginAs(page, role, mockOptions)
  const route = defaultDashboardForRole[role]
  await page.locator(`[href="${route}"]`).first().click()
  await expect(page.locator('header, .v-app-bar')).toBeVisible()
}

/**
 * Clique sur le lien menant au dashboard du rôle (dans la sidebar).
 * Préserve la session Pinia (pas de rechargement complet).
 */
export async function clickDashboardLink(page: Page, role: OaseRole) {
  const route = defaultDashboardForRole[role]
  await page.locator(`[href="${route}"]`).first().click()
}

/**
 * Déconnecte l'utilisateur et nettoie le stockage local.
 */
export async function logout(page: Page) {
  await page.goto('/login')
  await page.evaluate(() => localStorage.clear())
}
