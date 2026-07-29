import { test, expect, type Page } from '@playwright/test'
import { api, apiLogin, injectSession, watchConsoleErrors } from './helpers'

function watchApiErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('response', (res) => {
    if (res.url().includes('/api/') && res.status() >= 400) errors.push(`${res.request().method()} ${res.url()} → ${res.status()}`)
  })
  return errors
}

/**
 * MODULE EXTRACTIF (DGMG / ITIE) — Phase E1 : conventions réelles du périmètre ITIE 2024.
 *
 * Données de recette : 10 sociétés extractives avec NIF réels (SNPT 1000160416,
 * SCANTOGO 1000161343, STM 1001950093, WACEM, GRANUTOGO, TOGO CARRIERE, CIMCO,
 * POMAR, TdE, TOGO RAIL — source kb/itie formulaire de cadrage) et 10 conventions
 * créées via POST /conventions (webbridge/e1-creer-conventions.mjs).
 *
 * Règle d'or (leçon du 29/07) : un smoke « 0 erreur » sur des DONNÉES VIDES ne prouve
 * rien. Chaque test ici exige des données réelles non vides et des valeurs précises.
 */

const DGMG = 'agent.dgmg@oase.tg'

test.describe('Extractif E1 — Conventions du périmètre ITIE (données réelles)', () => {
  test('TC-EXTR-01 — API : conventions présentes, champs réels, conflit 409', async ({ request }) => {
    const token = await apiLogin(request, DGMG)
    const client = api(request, token)

    const res = await client.get('/conventions')
    expect(res.status(), 'GET /conventions agent_dgmg').toBe(200)
    const conventions = (await res.json()) as Array<{
      reference: string
      regimeCode: string
      statutCode: string
      dateFin: string
      montantEstime: string | null
      emploisEngages: number | null
      contribuables?: { raisonSociale: string; nif: string }
    }>

    // Données NON VIDES : les 10 conventions du périmètre ITIE
    expect(conventions.length, 'au moins 10 conventions extractives').toBeGreaterThanOrEqual(10)

    // Contenu réel précis : SNPT avec son NIF réel, régime Minier, montant réel
    const snpt = conventions.find((c) => c.reference === 'CONV-EXTR-2024-SNPT')
    expect(snpt, 'convention SNPT présente').toBeTruthy()
    expect(snpt!.contribuables?.nif, 'NIF réel SNPT (formulaire de cadrage ITIE)').toBe('1000160416')
    expect(snpt!.regimeCode).toBe('Minier')
    expect(Number(snpt!.montantEstime), 'montant estimé SNPT = 15 Mds FCFA').toBe(15000000000)
    expect(snpt!.emploisEngages).toBe(1200)

    // Majorité Minier + au moins une échéance < 12 mois (POMAR, fin 2026)
    const minier = conventions.filter((c) => c.regimeCode === 'Minier')
    expect(minier.length, 'majorité de conventions régime Minier').toBeGreaterThanOrEqual(8)
    const dans12mois = conventions.filter(
      (c) => new Date(c.dateFin).getTime() - Date.now() < 365 * 24 * 3600 * 1000,
    )
    expect(dans12mois.length, 'au moins POMAR arrive à échéance < 12 mois').toBeGreaterThanOrEqual(1)

    // Intégrité : la re-création d'une référence existante doit être refusée (409)
    const doublon = await client.post('/conventions', {
      reference: 'CONV-EXTR-2024-SNPT',
      contribuableId: 'c0000000-0000-0000-0000-000000000201',
      regimeCode: 'Minier',
      dateDebut: '2024-01-01',
      dateFin: '2034-12-31',
    })
    expect(doublon.status(), 'doublon de référence refusé').toBe(409)
  })

  test('TC-EXTR-02 — UI : dashboard alimenté par les données réelles + détail convention', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    const apiErrors = watchApiErrors(page)

    await injectSession(page, request, DGMG)
    await page.goto('/extractif/dashboard')
    await expect(page.getByText('Tableau de bord extractif')).toBeVisible({ timeout: 15000 })
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})

    // KPI alimenté par l'API (pas 0 !)
    await expect(page.getByText('Conventions enregistrees')).toBeVisible()
    await expect(page.getByText('Échéances < 12 mois')).toBeVisible()
    await expect(page.getByText('Emplois engagés')).toBeVisible()

    // La table contient les vraies conventions — JAMAIS l'état vide
    await expect(page.getByText('Aucune convention enregistrée pour le moment.'), 'état vide interdit').not.toBeVisible()
    await expect(page.getByText('CONV-EXTR-2024-SNPT'), 'SNPT dans la table').toBeVisible()
    await expect(page.getByText('SOCIETE NOUVELLE DES PHOSPHATES DU TOGO (SNPT)')).toBeVisible()
    await expect(page.getByText('CONV-EXTR-2022-POMAR'), 'POMAR dans la table').toBeVisible()
    const nbLignes = await page.locator('.v-data-table tbody tr', { hasText: 'CONV-EXTR-' }).count()
    expect(nbLignes, 'au moins 10 lignes de conventions').toBeGreaterThanOrEqual(10)

    // Alerte échéance visible sur POMAR (fin 2026 < 12 mois)
    await expect(page.locator('.v-data-table').getByText('31/12/2026')).toBeVisible()

    // Détail au clic : vraies valeurs (NIF réel, montant, emplois)
    await page.locator('.v-data-table tbody tr', { hasText: 'CONV-EXTR-2024-SNPT' }).click()
    await expect(page.getByText('NIF 1000160416')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('15 Mds FCFA')).toBeVisible()
    await expect(page.getByText('80 créés / 1200 engagés')).toBeVisible()
    await page.keyboard.press('Escape')

    const erreursJs = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to load resource'))
    expect(erreursJs, 'erreurs JS dashboard extractif').toEqual([])
    expect(apiErrors, `appels API en erreur :\n${apiErrors.join('\n')}`).toEqual([])
  })
})
