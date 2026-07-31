import { test, expect } from '@playwright/test'
import { watchConsoleErrors } from './helpers'

/**
 * AUTH LOGIN UI — [Recette 29/07] bug remonté par l'utilisateur :
 * pendant un redéploiement API, le formulaire affichait « Identifiant ou mot de
 * passe incorrect. Tentative X/5 » alors que le serveur était simplement down.
 *
 * Fix : seul un 401 (CREDENTIALS_INVALIDES) incrémente le compteur ; un 400
 * affiche le message de validation ; une erreur réseau/5xx affiche un message
 * technique SANS incrémenter. Ce test prouve les deux premiers chemins en réel.
 */

const CONTRIBUABLE = 'kossiwa.amele@texlome.tg'
const BON_MDP = 'Oase@2026!'

test.describe('Auth — formulaire de connexion UI (vraie soumission)', () => {
  test('TC-AUTH-UI-01 — mauvais mot de passe : message identifiants + compteur 1/5', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/Identifiant/).fill(CONTRIBUABLE)
    await page.getByLabel('Mot de passe', { exact: true }).fill('MauvaisMotDePasse#99')
    await page.getByRole('button', { name: 'Se connecter' }).click()

    await expect(page.getByText('Identifiant ou mot de passe incorrect. Tentative 1/5.')).toBeVisible({ timeout: 15000 })
    // On reste sur /login, pas de session créée
    await expect(page).toHaveURL(/\/login/)
  })

  test('TC-AUTH-UI-02 — bons identifiants : redirection vers le portail contribuable', async ({ page }) => {
    const consoleErrors = watchConsoleErrors(page)

    await page.goto('/login')
    await page.getByLabel(/Identifiant/).fill(CONTRIBUABLE)
    await page.getByLabel('Mot de passe', { exact: true }).fill(BON_MDP)
    await page.getByRole('button', { name: 'Se connecter' }).click()

    // Redirection vers le dashboard du rôle (p1 = contribuable → /portail/dashboard)
    await expect(page).toHaveURL(/\/portail\/dashboard/, { timeout: 20000 })
    // Aucune erreur « identifiants incorrects » affichée
    await expect(page.getByText('Identifiant ou mot de passe incorrect')).not.toBeVisible()

    const erreursJs = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to load resource'))
    expect(erreursJs, 'erreurs JS après login UI').toEqual([])
  })

  test('TC-AUTH-UI-03 — email avec espaces (copier-coller) : login accepté grâce au trim', async ({ page }) => {
    // [Recette 31/07] échec 401 constaté en démonstration publique : saisie d'identifiant
    // entourée d'espaces. Le frontend trimme désormais l'email avant l'envoi.
    await page.goto('/login')
    await page.getByLabel(/Identifiant/).fill(`  ${CONTRIBUABLE}  `)
    await page.getByLabel('Mot de passe', { exact: true }).fill(BON_MDP)
    await page.getByRole('button', { name: 'Se connecter' }).click()

    await expect(page).toHaveURL(/\/portail\/dashboard/, { timeout: 20000 })
    await expect(page.getByText('Identifiant ou mot de passe incorrect')).not.toBeVisible()
  })
})
