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

test.describe('Extractif E3 — Flux financiers (production, exportations, redevances, CFLDR)', () => {
  test('TC-EXTR-05 — API : 4 flux alimentés, valeurs réelles, doublons refusés', async ({ request }) => {
    const token = await apiLogin(request, DGMG)
    const client = api(request, token)

    // Production (feuille 4) : SNPT juin 2024 — volumes et valeur exacts du seed
    const resProd = await client.get('/flux-extractifs/productions?annee=2024')
    expect(resProd.status()).toBe(200)
    const productions = (await resProd.json()) as Array<{
      annee: number
      mois: number
      substance: string
      volumeProduitT: string
      valeurMarchandeFcfa: string
      contribuables?: { nif: string }
      permisMiniers?: { reference: string } | null
    }>
    expect(productions.length, 'au moins 3 lignes de production 2024').toBeGreaterThanOrEqual(3)
    const prodSnpt = productions.find((p) => p.contribuables?.nif === '1000160416' && p.mois === 6)
    expect(prodSnpt, 'production SNPT juin 2024 présente').toBeTruthy()
    expect(Number(prodSnpt!.volumeProduitT), '95 000 t produites').toBe(95000)
    expect(Number(prodSnpt!.valeurMarchandeFcfa), 'valeur marchande 1,25 Mds FCFA').toBe(1250000000)
    expect(prodSnpt!.permisMiniers?.reference, 'production rattachée au permis SNPT').toBe('PE-2020-SNPT')

    // Exportations (feuille 3) : SNPT juin → Inde
    const exportations = (await (await client.get('/flux-extractifs/exportations?annee=2024')).json()) as Array<{
      mois: number
      volumeT: string
      destination: string | null
      contribuables?: { nif: string }
    }>
    expect(exportations.length, 'au moins 3 exportations 2024').toBeGreaterThanOrEqual(3)
    const expSnpt = exportations.find((e) => e.contribuables?.nif === '1000160416' && e.mois === 6)
    expect(expSnpt!.destination).toBe('Inde')
    expect(Number(expSnpt!.volumeT)).toBe(85000)

    // Redevances (feuille 5) : SNPT T1 — dû = payé = 122,5 M FCFA
    const redevances = (await (await client.get('/flux-extractifs/redevances?annee=2024')).json()) as Array<{
      trimestre: number
      montantDuFcfa: string
      montantPayeFcfa: string
      referencePaiement: string | null
      contribuables?: { nif: string }
    }>
    expect(redevances.length, 'au moins 3 redevances 2024').toBeGreaterThanOrEqual(3)
    const redSnptT1 = redevances.find((r) => r.contribuables?.nif === '1000160416' && r.trimestre === 1)
    expect(Number(redSnptT1!.montantDuFcfa)).toBe(122500000)
    expect(Number(redSnptT1!.montantPayeFcfa)).toBe(122500000)
    expect(redSnptT1!.referencePaiement).toBe('QTR-2024-T1-SNPT')

    // Transferts CFLDR (feuille 6) : SNPT soldé, STM partiel (30 M / 60,75 M)
    const transferts = (await (await client.get('/flux-extractifs/transferts-communes?annee=2024')).json()) as Array<{
      commune: string
      montantDuFcfa: string
      montantEncaisseFcfa: string
      contribuables?: { nif: string }
    }>
    expect(transferts.length, 'au moins 2 transferts CFLDR 2024').toBeGreaterThanOrEqual(2)
    const cfldrSnpt = transferts.find((t) => t.contribuables?.nif === '1000160416')
    expect(cfldrSnpt!.commune).toBe('Lacs 1')
    expect(Number(cfldrSnpt!.montantDuFcfa), 'dû CFLDR = 0,75 % du CA').toBe(93750000)
    expect(Number(cfldrSnpt!.montantEncaisseFcfa)).toBe(93750000)
    const cfldrStm = transferts.find((t) => t.contribuables?.nif === '1001950093')
    expect(Number(cfldrStm!.montantEncaisseFcfa), 'encaissement STM volontairement partiel').toBeLessThan(Number(cfldrStm!.montantDuFcfa))

    // Intégrité : doublon de période refusé (409)
    const doublon = await client.post('/flux-extractifs/productions', {
      contribuableId: 'c0000000-0000-0000-0000-000000000201',
      annee: 2024,
      mois: 6,
      substance: 'Phosphates',
      volumeProduitT: 1,
    })
    expect(doublon.status(), 'doublon production période refusé').toBe(409)

    // RBAC : un contribuable lit mais n'écrit pas
    const clientContribuable = api(request, await apiLogin(request, 'kossiwa.amele@texlome.tg'))
    expect((await clientContribuable.get('/flux-extractifs/productions')).status()).toBe(200)
    const ecriture = await clientContribuable.post('/flux-extractifs/redevances', {
      contribuableId: 'c0000000-0000-0000-0000-000000000201',
      annee: 2025,
      trimestre: 1,
      substance: 'Or',
    })
    expect(ecriture.status(), 'écriture flux refusée au contribuable').toBe(403)
  })

  test('TC-EXTR-06 — UI : écran flux alimenté, 4 onglets, soldes calculés', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    const apiErrors = watchApiErrors(page)

    await injectSession(page, request, DGMG)
    await page.goto('/extractif/flux')
    await expect(page.getByRole('heading', { name: 'Flux financiers extractifs' })).toBeVisible({ timeout: 15000 })
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})

    // KPIs alimentés par l'API (pas « — » vide)
    await expect(page.getByText('Lignes de production')).toBeVisible()
    await expect(page.getByText('Redevances recouvrées')).toBeVisible()
    await expect(page.getByText('CFLDR versé aux communes')).toBeVisible()

    // Onglet Production : vraies lignes — JAMAIS l'état vide
    await expect(page.getByText('Aucune production déclarée.'), 'état vide interdit').not.toBeVisible()
    await expect(page.getByText('06/2024').first()).toBeVisible()
    await expect(page.getByText('95 000 t').first(), 'volume SNPT juin 2024').toBeVisible()
    await expect(page.getByText('PE-2020-SNPT').first(), 'production rattachée au permis SNPT').toBeVisible()

    // Onglet Exportations : destination Inde
    await page.getByRole('tab', { name: 'Exportations' }).click()
    await expect(page.getByText('Inde')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('85 000 t')).toBeVisible()

    // Onglet Redevances : SNPT soldée, référence réelle
    await page.getByRole('tab', { name: 'Redevances minières' }).click()
    await expect(page.getByText('QTR-2024-T1-SNPT')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('122 500 000 FCFA').first()).toBeVisible()
    await expect(page.getByText('Soldée').first()).toBeVisible()

    // Onglet Transferts : SNPT soldé, STM reste 30 750 000 FCFA
    await page.getByRole('tab', { name: 'Transferts communes (CFLDR)' }).click()
    await expect(page.getByText('Lacs 1')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Tône 3')).toBeVisible()
    await expect(page.getByText('Reste 30 750 000 FCFA')).toBeVisible()

    const erreursJs = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to load resource'))
    expect(erreursJs, 'erreurs JS flux financiers').toEqual([])
    expect(apiErrors, `appels API en erreur :\n${apiErrors.join('\n')}`).toEqual([])
  })
})

test.describe('Extractif E4 — Rapportage ITIE (statistiques + export déclaration)', () => {
  test('TC-EXTR-07 — API : statistiques calculées exactes, non-calculables déclarés, CSV Annexe 1.1', async ({ request }) => {
    const token = await apiLogin(request, DGMG)
    const client = api(request, token)

    const res = await client.get('/itie/statistiques?annee=2024')
    expect(res.status(), 'GET /itie/statistiques').toBe(200)
    const stats = (await res.json()) as {
      calculees: {
        societesPerimetre: number
        conventionsActives: number
        permisActifs: number
        productionParSubstance: Array<{ substance: string; volumeT: number; valeurFcfa: number }>
        redevances: { montantDuFcfa: number; montantPayeFcfa: number; tauxRecouvrement: number }
        transfertsCfldr: { montantDuFcfa: number; montantEncaisseFcfa: number; tauxVersement: number }
        repartitionParEntite: Array<{ nif: string; redevanceDuFcfa: number; ecartRedevanceFcfa: number }>
      }
      nonCalculables: Array<{ indicateur: string; sourceRequise: string }>
    }

    // Périmètre réel : 10 sociétés / 10 conventions / 10 permis
    expect(stats.calculees.societesPerimetre).toBe(10)
    expect(stats.calculees.conventionsActives).toBe(10)
    expect(stats.calculees.permisActifs).toBe(10)

    // Production phosphates 2024 : 95 000 + 98 000 = 193 000 t, 2,54 Mds FCFA
    const phosphates = stats.calculees.productionParSubstance.find((p) => p.substance === 'Phosphates')
    expect(phosphates!.volumeT).toBe(193000)
    expect(phosphates!.valeurFcfa).toBe(2540000000)

    // Redevances : dû = payé = 122,5 + 126 + 72 = 320,5 M FCFA → 100 %
    expect(stats.calculees.redevances.montantDuFcfa).toBe(320500000)
    expect(stats.calculees.redevances.montantPayeFcfa).toBe(320500000)
    expect(stats.calculees.redevances.tauxRecouvrement).toBe(100)

    // CFLDR : dû 154,5 M, encaissé 123,75 M → 80 % (STM partiel)
    expect(stats.calculees.transfertsCfldr.montantDuFcfa).toBe(154500000)
    expect(stats.calculees.transfertsCfldr.montantEncaisseFcfa).toBe(123750000)
    expect(stats.calculees.transfertsCfldr.tauxVersement).toBe(80)

    // Répartition : SNPT et STM présents avec écart redevance nul
    const snpt = stats.calculees.repartitionParEntite.find((e) => e.nif === '1000160416')
    expect(snpt, 'SNPT dans la répartition').toBeTruthy()
    expect(snpt!.redevanceDuFcfa).toBe(248500000)
    expect(snpt!.ecartRedevanceFcfa).toBe(0)

    // Honnêteté : les indicateurs externes sont déclarés NON calculables avec source
    expect(stats.nonCalculables.length).toBeGreaterThanOrEqual(4)
    const libelles = stats.nonCalculables.map((n) => n.indicateur + ' ' + n.sourceRequise).join(' ')
    expect(libelles).toContain('PIB')
    expect(libelles).toContain('INSEED')
    expect(libelles).toContain('Réconciliation')

    // Export CSV au format Annexe 1.1 feuille 1
    const resCsv = await client.get('/itie/export-declaration?annee=2024')
    expect(resCsv.status()).toBe(200)
    expect(resCsv.headers()['content-type']).toContain('text/csv')
    const csv = await resCsv.text()
    expect(csv.split('\n')[0]).toContain('ref;nomenclature_flux;paye_a_recu_par;montant_fcfa;montant_devise;commentaires')
    expect(csv).toContain('QTR-2024-T1-SNPT')
    expect(csv).toContain('122500000')
    expect(csv).toContain('CFLDR-2024-Lacs 1')

    // RBAC : lecture autorisée au contribuable (transparence ITIE)
    const clientContribuable = api(request, await apiLogin(request, 'kossiwa.amele@texlome.tg'))
    expect((await clientContribuable.get('/itie/statistiques?annee=2024')).status()).toBe(200)
  })

  test('TC-EXTR-08 — UI : écran ITIE alimenté, écarts visibles, non-calculables affichés, export CSV', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    const apiErrors = watchApiErrors(page)

    await injectSession(page, request, DGMG)
    await page.goto('/extractif/itie')
    await expect(page.getByRole('heading', { name: 'Rapportage ITIE' })).toBeVisible({ timeout: 15000 })
    await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {})

    // KPIs alimentés par l'API
    await expect(page.getByText('Sociétés du périmètre')).toBeVisible()
    await expect(page.getByText('Permis actifs')).toBeVisible()

    // Production par substance : vrais agrégats
    await expect(page.getByText('Production 2024 par substance')).toBeVisible()
    await expect(page.getByText('193 000 t').first(), 'agrégat phosphates 2024').toBeVisible()
    await expect(page.getByText('Manganèse').first()).toBeVisible()

    // Répartition par entité : SNPT avec écart « Aucun »
    await expect(page.getByText('Répartition des revenus par entité du périmètre')).toBeVisible()
    await expect(page.getByText('SOCIETE NOUVELLE DES PHOSPHATES DU TOGO (SNPT)')).toBeVisible()
    await expect(page.getByText('248 500 000 FCFA').first()).toBeVisible()
    await expect(page.getByText('Aucun').first()).toBeVisible()

    // Non-calculables affichés honnêtement — JAMAIS de valeurs fictives
    await expect(page.getByText('Indicateurs ITIE non calculables depuis OASE')).toBeVisible()
    await expect(page.getByText('Contribution du secteur extractif au PIB')).toBeVisible()
    await expect(page.getByText(/Source requise : PIB national.*INSEED/).first()).toBeVisible()

    // Export CSV réel (téléchargement déclenché)
    const telechargement = page.waitForEvent('download', { timeout: 15000 })
    await page.getByRole('button', { name: 'Exporter la déclaration (CSV)' }).click()
    const fichier = await telechargement
    expect(fichier.suggestedFilename()).toBe('declaration-itie-2024.csv')

    const erreursJs = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to load resource'))
    expect(erreursJs, 'erreurs JS rapportage ITIE').toEqual([])
    expect(apiErrors, `appels API en erreur :\n${apiErrors.join('\n')}`).toEqual([])
  })
})
