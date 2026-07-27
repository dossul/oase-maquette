import { test, expect } from '@playwright/test'
import { gotoDashboard } from './fixtures/auth'
import { installApiMocks } from './fixtures/mocks'

test.describe('Formulaire création utilisateur (P7 — Admin)', () => {
  test.beforeEach(async ({ page }) => {
    await gotoDashboard(page, 'admin_si')
    await expect(page.locator('text=Gestion des utilisateurs')).toBeVisible()
  })

  test('ouvrir le dialogue de création de compte', async ({ page }) => {
    await page.getByRole('button', { name: /Créer un compte/i }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await expect(page.locator('text=Créer un nouveau compte')).toBeVisible()
  })

  test('créer un nouvel utilisateur et le voir dans le tableau', async ({ page }) => {
    await page.getByRole('button', { name: /Créer un compte/i }).click()

    await page.locator('.v-dialog').getByRole('textbox', { name: /Prénom/i }).fill('Abla')
    await page.locator('.v-dialog').getByRole('textbox', { name: 'Nom', exact: true }).fill('SEWOVLA')
    await page.locator('.v-dialog').getByRole('textbox', { name: /E-mail institutionnel/i }).fill('a.sewovla@dgbf.tg')

    // Sélecteur de rôle
    await page.locator('.v-dialog').getByLabel('Rôle RBAC').click({ force: true })
    await page.getByRole('option', { name: /Agent DGBF/i }).click()

    // Sélecteur de structure
    await page.locator('.v-dialog').getByLabel('Structure').click({ force: true })
    await page.getByRole('option', { name: 'DGBF', exact: true }).click()

    // Canaux de notification
    await page.locator('.v-dialog').getByLabel(/SMS/i).check()

    await page.locator('.v-dialog').getByRole('button', { name: /Créer et envoyer l'invitation/i }).click()

    // Le dialogue se ferme et le nouvel utilisateur apparaît dans la liste.
    await expect(page.getByRole('dialog')).toBeHidden()
    // On cible le tableau : la snackbar de succès affiche aussi l'e-mail créé.
    await expect(page.locator('.v-data-table').getByText('a.sewovla@dgbf.tg')).toBeVisible()
  })

  test('annuler la création ferme le dialogue sans ajouter d\'utilisateur', async ({ page }) => {
    await page.getByRole('button', { name: /Créer un compte/i }).click()
    await page.locator('.v-dialog').getByRole('textbox', { name: /E-mail institutionnel/i }).fill('temp@oase.tg')
    await page.getByRole('button', { name: /Annuler/i }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    await expect(page.locator('text=temp@oase.tg')).not.toBeVisible()
  })

  test('message d\'erreur si la création échoue côté API', async ({ page }) => {
    await installApiMocks(page)
    await page.route('**/api/v1/utilisateurs', async (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({ status: 500, json: { message: 'Erreur serveur' } })
      }
      route.continue()
    })

    await page.getByRole('button', { name: /Créer un compte/i }).click()
    await page.locator('.v-dialog').getByRole('textbox', { name: /Prénom/i }).fill('Abla')
    await page.locator('.v-dialog').getByRole('textbox', { name: 'Nom', exact: true }).fill('SEWOVLA')
    await page.locator('.v-dialog').getByRole('textbox', { name: /E-mail institutionnel/i }).fill('a.sewovla@dgbf.tg')
    await page.locator('.v-dialog').getByLabel('Rôle RBAC').click({ force: true })
    await page.getByRole('option', { name: /Agent DGBF/i }).click()
    await page.locator('.v-dialog').getByLabel('Structure').click({ force: true })
    await page.getByRole('option', { name: 'DGBF', exact: true }).click()

    await page.locator('.v-dialog').getByRole('button', { name: /Créer et envoyer l'invitation/i }).click()

    await expect(page.locator('text=Impossible de créer le compte')).toBeVisible()
  })
})
