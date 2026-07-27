import { test, expect } from '@playwright/test'
import { installApiMocks, mockUsers } from './fixtures/mocks'
import { loginAs, loginWithMfa, logout } from './fixtures/auth'

function emailField(page: Page) {
  return page.getByRole('textbox', { name: /Identifiant \(e-mail institutionnel ou RCCM\)|E-mail|Email/i })
}
function passwordField(page: Page) {
  return page.getByRole('textbox', { name: /Mot de passe/i })
}

import type { Page } from '@playwright/test'

test.describe('Authentification', () => {
  test.beforeEach(async ({ page }) => {
    await logout(page)
  })

  test('login contribuable établit la session sans erreur', async ({ page }) => {
    await loginAs(page, 'contribuable')
    await expect(page.getByText(/Identifiant ou mot de passe incorrect/i)).not.toBeVisible()
    // Comportement actuel : LoginView redirige vers le dashboard par défaut du rôle.
    await expect(page).toHaveURL(/\/portail\/dashboard/)
    await expect(page.locator('text=Mon Tableau de bord')).toBeVisible()
  })

  test('login agent OTR établit la session sans erreur', async ({ page }) => {
    await loginAs(page, 'agent_ci')
    await expect(page.getByText(/Identifiant ou mot de passe incorrect/i)).not.toBeVisible()
    await expect(page).toHaveURL(/\/backoffice\/dashboard/)
  })

  test('flux MFA complet : login → saisie OTP → dashboard portail', async ({ page }) => {
    await loginWithMfa(page, 'contribuable')
    await expect(page).toHaveURL(/\/portail\/dashboard/)
    await expect(page.locator('text=Mon Tableau de bord')).toBeVisible()
  })

  test('message d\'erreur et compteur de tentatives sur échec de login', async ({ page }) => {
    await installApiMocks(page, { loginError: true })
    await page.goto('/login')

    const submit = page.getByRole('button', { name: /Se connecter/i })

    await emailField(page).fill('inconnu@oase.tg')
    await passwordField(page).fill('mauvais')

    const errorResponse = page.waitForResponse('**/api/v1/auth/login')
    await submit.click()
    await errorResponse

    await expect(page.getByText(/Identifiant ou mot de passe incorrect/i)).toBeVisible()
    await expect(page.getByText(/Tentative 1\/5/i)).toBeVisible()

    // Quatre tentatives supplémentaires : le compteur doit atteindre 5.
    for (let i = 2; i <= 5; i++) {
      await submit.click()
      await expect(page.getByText(new RegExp(`Tentative ${i}/5`))).toBeVisible()
    }
  })

  test('état de chargement pendant la soumission du login', async ({ page }) => {
    await installApiMocks(page, { user: mockUsers.contribuable, slow: 600 })
    await page.goto('/login')

    await emailField(page).fill(mockUsers.contribuable.email)
    await passwordField(page).fill('Oase@2026!')
    const submit = page.getByRole('button', { name: /Se connecter/i })

    // Avant clic : bouton n'est pas en chargement.
    await expect(submit).not.toHaveClass(/v-btn--loading/)

    const responsePromise = page.waitForResponse('**/api/v1/auth/login')
    await submit.click()

    // Pendant l'appel API ralenti : le bouton passe en état loading.
    await expect(submit).toHaveClass(/v-btn--loading/)
    await responsePromise

    // Après réponse : le bouton redevient inactif.
    await expect(submit).not.toHaveClass(/v-btn--loading/)
  })

  test('validation du formulaire : e-mail requis et format valide', async ({ page }) => {
    await installApiMocks(page)
    await page.goto('/login')

    const submit = page.getByRole('button', { name: /Se connecter/i })

    // Champ vide (e-mail ET mot de passe vides → 2 messages "Champ requis", d'où le .first()).
    await emailField(page).fill('')
    await submit.click()
    await expect(page.locator('.v-messages__message').filter({ hasText: /Champ requis/i }).first()).toBeVisible()

    // Format invalide.
    await emailField(page).fill('pas-un-email')
    await submit.click()
    await expect(page.locator('.v-messages__message').filter({ hasText: /Format e-mail invalide|E-mail invalide/i }).first()).toBeVisible()
  })

  test('un utilisateur non authentifié est renvoyé vers /login', async ({ page }) => {
    await page.goto('/portail/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('un utilisateur avec un rôle insuffisant est renvoyé vers son dashboard par défaut', async ({ page }) => {
    // [Recette E2E] Comportement CORRECT actuel du guard : un utilisateur authentifié
    // qui vise une route hors de son rôle est redirigé vers SON dashboard par défaut
    // (plus vers /login, avec protection anti-boucle).
    await loginAs(page, 'contribuable')
    await page.goto('/admin/utilisateurs')
    await expect(page).toHaveURL(/\/portail\/dashboard/)
  })
})
