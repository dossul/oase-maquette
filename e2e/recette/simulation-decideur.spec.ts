import { test, expect } from '@playwright/test'
import { USERS, api, apiLogin, injectSession, watchConsoleErrors } from './helpers'

/**
 * TC-DEC-02 — Simulation fiscale décideur : calcul réel + export réel.
 *
 * Avant : compute() simulait une latence (setTimeout 600ms) et le bouton
 * « Exporter rapport simulation » ne faisait rien.
 * Désormais : calcul instantané sur les paramètres INSEED (GET /referentiels/inseed)
 * et export d'un vrai fichier rapport téléchargé côté client.
 */

test.describe.configure({ mode: 'serial', timeout: 120000 })

test.describe('TC-DEC-02 — Simulation décideur', () => {
  test('API — le référentiel INSEED est accessible au décideur', async ({ request }) => {
    const decideur = await apiLogin(request, USERS.p4.email)
    const res = await api(request, decideur).get('/referentiels/inseed')
    expect(res.status()).toBe(200)
    const corps = await res.json()
    // Le référentiel expose les paramètres macro (PIB, multiplicateurs)
    expect(Object.keys(corps).length).toBeGreaterThan(0)
  })

  test('UI — calcul instantané, résultats réels et export téléchargé', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    await injectSession(page, request, USERS.p4.email)
    await page.goto('/decideur/simulation')

    await expect(page.getByRole('heading', { name: /Simulation et prospective/i })).toBeVisible()
    // Référentiel INSEED chargé depuis l'API (ou repli explicite signalé)
    await expect(
      page.getByText(/Paramètres INSEED chargés depuis l'API|repli|indisponible/i).first(),
    ).toBeVisible({ timeout: 15000 })

    // Paramétrage : taux 20%, durée 36 mois, assiette 2 Mds
    await page.getByRole('spinbutton', { name: /Taux d'exonération/i }).fill('20')
    await page.getByRole('spinbutton', { name: /Durée/i }).fill('36')
    await page.getByRole('spinbutton', { name: /Assiette estimée/i }).fill('2')

    await page.getByRole('button', { name: /Calculer l'impact/i }).click()

    // Résultats réels : manque à gagner = 2 Mds × (36/12) × 20% = 1,2 Mds FCFA
    await expect(page.getByText('Manque à gagner estimé')).toBeVisible()
    await expect(page.getByText('-1.2 Mds FCFA')).toBeVisible()
    await expect(page.getByText('Emplois créés estimés')).toBeVisible()
    await expect(page.getByText('Ratio coût/bénéfice')).toBeVisible()

    // Scénarios comparés recalculés sur les mêmes paramètres réels
    await expect(page.getByText(/Alternative A \(15% \/ 48 mois\)/)).toBeVisible()
    await expect(page.getByText(/Alternative B \(25% \/ 24 mois\)/)).toBeVisible()

    // Export réel : un fichier doit être téléchargé
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 10000 }),
      page.getByRole('button', { name: /Exporter rapport simulation/i }).click(),
    ])
    expect(download.suggestedFilename()).toMatch(/^simulation-oase-.*\.txt$/)

    const erreursJs = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to load resource'))
    expect(erreursJs, 'erreurs JS sur la simulation décideur').toEqual([])
  })
})
