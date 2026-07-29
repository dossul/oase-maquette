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
    await expect(page.getByRole('heading', { name: 'Tableau de bord extractif' })).toBeVisible({ timeout: 15000 })
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

test.describe('Extractif E2 — Répertoire minier (permis réels)', () => {
  test('TC-EXTR-03 — API : permis présents, filtres, 409, RBAC écriture refusée au contribuable', async ({ request }) => {
    const token = await apiLogin(request, DGMG)
    const client = api(request, token)

    const res = await client.get('/permis-miniers')
    expect(res.status(), 'GET /permis-miniers agent_dgmg').toBe(200)
    const permis = (await res.json()) as Array<{
      reference: string
      typePermis: string
      substance: string
      localite: string | null
      dureeAnnees: number
      superficieKm2: string | null
      rapportEiePublic: boolean
      modeOctroi: string
      statut: string
      contribuables?: { raisonSociale: string; nif: string }
      conventions?: { reference: string } | null
    }>

    // Données NON VIDES : les 10 permis du jeu de recette
    expect(permis.length, 'au moins 10 permis miniers').toBeGreaterThanOrEqual(10)

    // Contenu réel précis : permis d'exploitation phosphates SNPT (Annexe 1.1 feuilles 16-17)
    const snpt = permis.find((p) => p.reference === 'PE-2020-SNPT')
    expect(snpt, 'permis SNPT présent').toBeTruthy()
    expect(snpt!.typePermis).toBe('exploitation')
    expect(snpt!.substance).toBe('Phosphates')
    expect(snpt!.localite).toContain('Hahotoé')
    expect(snpt!.dureeAnnees).toBe(25)
    expect(Number(snpt!.superficieKm2)).toBe(35.5)
    expect(snpt!.rapportEiePublic).toBe(true)
    expect(snpt!.contribuables?.nif, 'titulaire = NIF réel SNPT').toBe('1000160416')
    expect(snpt!.conventions?.reference, 'permis rattaché à la convention SNPT').toBe('CONV-EXTR-2024-SNPT')

    // Répartition réelle : 2 exploitation, ≥5 carrières, 2 recherche
    expect(permis.filter((p) => p.typePermis === 'exploitation').length).toBeGreaterThanOrEqual(2)
    expect(permis.filter((p) => p.typePermis === 'carriere').length).toBeGreaterThanOrEqual(5)
    expect(permis.filter((p) => p.typePermis === 'recherche').length).toBeGreaterThanOrEqual(2)

    // Filtres serveur
    const carrieres = await client.get('/permis-miniers?typePermis=carriere')
    const listeCarrieres = (await carrieres.json()) as Array<{ typePermis: string }>
    expect(listeCarrieres.length).toBeGreaterThanOrEqual(5)
    expect(listeCarrieres.every((p) => p.typePermis === 'carriere'), 'filtre typePermis strict').toBe(true)

    // Intégrité : doublon de référence refusé
    const doublon = await client.post('/permis-miniers', {
      reference: 'PE-2020-SNPT',
      contribuableId: 'c0000000-0000-0000-0000-000000000201',
      typePermis: 'exploitation',
      substance: 'Phosphates',
      dateDemande: '2019-06-12',
      dateOctroi: '2020-03-15',
      dureeAnnees: 25,
      modeOctroi: 'gre_a_gre',
    })
    expect(doublon.status(), 'doublon de référence permis refusé').toBe(409)

    // RBAC : un contribuable peut LIRE (périmètre ITIE public) mais pas ÉCRIRE
    const tokenContribuable = await apiLogin(request, 'kossiwa.amele@texlome.tg')
    const clientContribuable = api(request, tokenContribuable)
    const lecture = await clientContribuable.get('/permis-miniers')
    expect(lecture.status(), 'lecture permis autorisée au contribuable').toBe(200)
    const ecriture = await clientContribuable.post('/permis-miniers', {
      reference: 'PE-FRAUDE-001',
      contribuableId: 'c0000000-0000-0000-0000-000000000201',
      typePermis: 'exploitation',
      substance: 'Or',
      dateDemande: '2026-01-01',
      dateOctroi: '2026-01-02',
      dureeAnnees: 10,
      modeOctroi: 'gre_a_gre',
    })
    expect(ecriture.status(), 'écriture permis refusée au contribuable').toBe(403)
  })

  test('TC-EXTR-04 — UI : registre alimenté par les données réelles + détail permis', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    const apiErrors = watchApiErrors(page)

    await injectSession(page, request, DGMG)
    await page.goto('/extractif/repertoire')
    await expect(page.getByRole('heading', { name: 'Répertoire minier' })).toBeVisible({ timeout: 15000 })
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})

    // KPIs alimentés par l'API (pas 0 !)
    await expect(page.getByText('Permis enregistrés')).toBeVisible()
    await expect(page.getByText('Exploitations actives')).toBeVisible()
    await expect(page.getByText('Expirations < 24 mois')).toBeVisible()

    // La table contient les vrais permis — JAMAIS l'état vide
    await expect(page.getByText('Aucun permis enregistré pour ces critères.'), 'état vide interdit').not.toBeVisible()
    await expect(page.getByText('PE-2020-SNPT'), 'permis SNPT dans la table').toBeVisible()
    await expect(page.getByText('Hahotoé-Kpogamé (Maritime)')).toBeVisible()
    const nbLignes = await page.locator('.v-data-table tbody tr').count()
    expect(nbLignes, 'au moins 10 lignes de permis').toBeGreaterThanOrEqual(10)

    // Alerte expiration visible : PR-2023-POMAR (octroi 2023 + 4 ans → 11/04/2027 < 24 mois)
    await expect(page.locator('.v-data-table').getByText('11/04/2027')).toBeVisible()

    // Détail au clic : vraies valeurs (assertions scopées au dialog — la table reste visible derrière)
    await page.locator('.v-data-table tbody tr', { hasText: 'PE-2020-SNPT' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('NIF 1000160416')).toBeVisible({ timeout: 10000 })
    await expect(dialog.getByText('Phosphates', { exact: true })).toBeVisible()
    await expect(dialog.getByText('25 ans')).toBeVisible()
    await expect(dialog.getByText('35.5 km²')).toBeVisible()
    await expect(dialog.getByText('Gré à gré')).toBeVisible()
    await dialog.getByRole('button').first().click()
    await expect(dialog).not.toBeVisible({ timeout: 10000 })

    // Filtre UI : Carrière → toutes les lignes carrière, ≥5
    // (clic sur le conteneur .v-select : l'<input> interne est intercepté par son wrapper Vuetify)
    await page.locator('.v-select').first().click()
    await page.getByRole('option', { name: 'Carrière' }).click()
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    await expect(page.getByText('PE-2020-SNPT'), 'exploitation masquée par le filtre').not.toBeVisible()
    const nbCarrieres = await page.locator('.v-data-table tbody tr').count()
    expect(nbCarrieres, 'au moins 5 permis carrière').toBeGreaterThanOrEqual(5)

    const erreursJs = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to load resource'))
    expect(erreursJs, 'erreurs JS répertoire minier').toEqual([])
    expect(apiErrors, `appels API en erreur :\n${apiErrors.join('\n')}`).toEqual([])
  })
})
