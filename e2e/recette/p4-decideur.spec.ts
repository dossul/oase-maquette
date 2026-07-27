import { test, expect, type APIRequestContext } from '@playwright/test'
import {
  API,
  PIN,
  USERS,
  apiLogin,
  api,
  loginAs,
  ensurePin,
  watchConsoleErrors,
} from './helpers'

/**
 * GROUPE P4 — Décideur stratégique (recette contre backend réel).
 * Référence : docs/tests/04_PLAN_RECETTE_EXONERATION.md (TC-P4-01..03).
 *
 * Fixtures base (seedées en SQL par la session QA, demandes en_instruction) :
 *   - DEM-2026-QAP401 (d4040000-0000-4000-8000-000000000401) : NIF conforme, sans quota
 *   - DEM-2026-QAP402..406 : quota_consomme = quota_total = 10 000 000 (quota épuisé)
 */

const ADMIN = 'kossi.sewavi@dgtcp.tg' // p7 — utilisé uniquement pour poser les préconditions
const FIXTURE_SANS_QUOTA = 'd4040000-0000-4000-8000-000000000401'

/** Retourne l'id d'une demande en_instruction (précondition posée via API si besoin). */
async function ensureDemandeEnInstruction(request: APIRequestContext): Promise<string> {
  const t4 = await apiLogin(request, USERS.p4.email)
  const detail = await api(request, t4).get(`/demandes/${FIXTURE_SANS_QUOTA}`)
  if (detail.ok()) {
    const d = await detail.json()
    if (d.statutCode === 'en_instruction') return FIXTURE_SANS_QUOTA
  }
  // Fixture consommée : recrée une demande via admin (parcours API complet)
  const t7 = await apiLogin(request, ADMIN)
  const c7 = api(request, t7)
  const ref = await c7.get(`/demandes/${FIXTURE_SANS_QUOTA}`).catch(() => null)
  let bjv = 'b1000000-0000-0000-0000-000000000001'
  let contrib = 'c0000000-0000-0000-0000-000000000001'
  if (ref && ref.ok()) {
    const j = await ref.json()
    bjv = j.baseJuridiqueVersionId
    contrib = j.contribuableId
  }
  const created = await c7.post('/demandes', {
    contribuableId: contrib,
    baseJuridiqueVersionId: bjv,
    montantFcfa: 5000000,
    secteur: 'QA Recette P4',
  })
  expect(created.status(), 'création demande précondition').toBeLessThan(300)
  const dem = await created.json()
  await c7.post(`/demandes/${dem.id}/soumettre`)
  const pec = await c7.post(`/demandes/${dem.id}/prendre-en-charge`)
  expect(pec.status(), 'prise en charge précondition').toBeLessThan(300)
  return dem.id as string
}

/** Retourne l'id d'une fixture à quota épuisé encore en_instruction. */
async function pickFixtureQuotaEpuise(request: APIRequestContext): Promise<string> {
  const t4 = await apiLogin(request, USERS.p4.email)
  const res = await api(request, t4).get('/demandes?statutCode=en_instruction&limit=100')
  expect(res.status(), 'listage fixtures quota').toBe(200)
  const body = await res.json()
  const fixture = (body.data as { id: string; reference: string }[]).find((d) =>
    /^DEM-2026-QAP40[2-9]$/.test(d.reference),
  )
  expect(fixture, 'aucune fixture quota épuisée disponible (DEM-2026-QAP402..406)').toBeTruthy()
  return fixture!.id
}

test.describe('P4 — Décideur', () => {
  test('TC-P4-01 — approbation finale avec PIN, attestation PDF et notification', async ({
    page,
    request,
  }) => {
    const consoleErrors = watchConsoleErrors(page)
    const nc: string[] = [] // non-conformités relevées

    // ── Préconditions (API) ────────────────────────────────────────────────
    const demandeId = await ensureDemandeEnInstruction(request)
    const t4 = await apiLogin(request, USERS.p4.email)
    await ensurePin(request, t4)

    // ── Étapes UI : P4 cherche la file d'approbation ──────────────────────
    await loginAs(page, 'p4')
    await page.goto('/decideur/dashboard')
    await expect(page.getByText('Tableau de bord stratégique')).toBeVisible()
    // La file d'approbation se charge en async (latence réseau prod) : attendre
    // explicitement qu'au moins une action soit rendue avant de compter.
    await page
      .getByRole('button', { name: /approuv|décision|signer/i })
      .first()
      .waitFor({ state: 'visible', timeout: 15000 })
      .catch(() => {})

    const actionsDashboard = await page
      .getByRole('button', { name: /approuv|décision|signer/i })
      .count()
    const liensDashboard = await page.getByRole('link', { name: /approuv|décision/i }).count()

    await page.goto('/decideur/analyse')
    await expect(page.getByRole('heading', { name: /Analyse sectorielle/ })).toBeVisible()
    const actionsAnalyse = await page.getByRole('button', { name: /approuv|décision|signer/i }).count()

    await page.goto('/decideur/registre-central')
    await page.waitForLoadState('networkidle')
    const actionsRegistre = await page.getByRole('button', { name: /approuv|décision|signer/i }).count()

    if (actionsDashboard + liensDashboard + actionsAnalyse + actionsRegistre === 0) {
      nc.push(
        "Aucune file d'approbation ni action « Approuver »/« Signer » dans l'UI décideur " +
          '(/decideur/dashboard, /decideur/analyse, /decideur/registre-central) : ' +
          "le parcours d'approbation finale avec saisie du PIN n'existe pas côté maquette.",
      )
    }

    // ── Diagnostic API (contrat attendu par le TC) ─────────────────────────
    const c4 = api(request, t4)
    const blocages = await c4.get(`/demandes/${demandeId}/blocages`)
    if (blocages.ok()) {
      const liste = (await blocages.json()) as { bloque: boolean; gravite: string; libelle: string }[]
      const bloquant = liste.find((b) => b.bloque && b.gravite === 'critique')
      if (bloquant) nc.push(`Précondition fausse : blocage critique inattendu « ${bloquant.libelle} »`)
    }

    const appro = await c4.post(`/demandes/${demandeId}/decisions/approuver`, {
      pin: PIN,
      motif: 'QA recette TC-P4-01',
    })
    const approBody = await appro.json().catch(() => ({}))
    if (appro.status() !== 200 && appro.status() !== 201) {
      nc.push(
        `POST /demandes/:id/decisions/approuver → ${appro.status()} au lieu de 200 ` +
          `(payload: ${JSON.stringify(approBody).slice(0, 300)})`,
      )
      // Variante sans corps : le DTO rejette pin/motif, que se passe-t-il ensuite ?
      const approVide = await c4.post(`/demandes/${demandeId}/decisions/approuver`, {})
      if (approVide.status() >= 500) {
        nc.push(
          `POST /demandes/:id/decisions/approuver (corps vide) → ${approVide.status()} : ` +
            'endpoint inutilisable (400 avec pin, 500 sans)',
        )
      }
    } else {
      // Vérifications attendues par le TC en cas de succès
      if (!approBody?.acte?.documentUrl) nc.push('Attestation PDF générée : acte.documentUrl absent de la réponse')
      if (!approBody?.acte?.qrCodeHash) nc.push('QR code de vérification absent de la réponse')
      const detail = await c4.get(`/demandes/${demandeId}`)
      const dj = await detail.json()
      if (dj.statutCode !== 'approuve') nc.push(`Statut après approbation = ${dj.statutCode} (attendu approuve)`)
    }

    // Attestation PDF : la demande seedée approuvée doit fournir un PDF téléchargeable
    const SEED_APPROUVEE = 'd0000000-0000-0000-0000-000000000101'
    const dl = await c4.get(`/attestations/demandes/${SEED_APPROUVEE}/download`)
    if (dl.status() !== 200) {
      nc.push(`GET /attestations/demandes/:id/download (demande approuvée seedée) → ${dl.status()}`)
    } else if (!(dl.headers()['content-type'] ?? '').includes('pdf')) {
      nc.push(
        `Attestation téléchargée non PDF : Content-Type « ${dl.headers()['content-type']} » ` +
          '(attendu application/pdf)',
      )
    }

    // Notification P1 : le plan attend une notification du contribuable
    const t1b = await apiLogin(request, USERS.p1b.email)
    const notifs = await api(request, t1b).get('/notifications')
    if (notifs.ok()) {
      const liste = await notifs.json()
      const liee = (Array.isArray(liste) ? liste : liste.data ?? []).find((n: { demandeId?: string }) =>
        JSON.stringify(n).includes(demandeId),
      )
      if (!liee) nc.push('Aucune notification générée pour le contribuable après approbation')
    }

    expect(
      consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to load resource')),
      'erreurs console pendant le parcours P4',
    ).toEqual([])
    expect(nc, `Non-conformités TC-P4-01 :\n- ${nc.join('\n- ')}`).toEqual([])
  })

  test("TC-P4-02 — blocage d'approbation si quota épuisé (422 QUOTA_EPUISE)", async ({
    page,
    request,
  }) => {
    const consoleErrors = watchConsoleErrors(page)
    const nc: string[] = []

    // ── Précondition : fixture quota épuisé (quota_consomme = quota_total) ──
    const demandeId = await pickFixtureQuotaEpuise(request)
    const t4 = await apiLogin(request, USERS.p4.email)
    const c4 = api(request, t4)

    // ── Étape UI : le décideur consulte son tableau de bord ───────────────
    await loginAs(page, 'p4')
    await page.goto('/decideur/dashboard')
    await expect(page.getByText('Tableau de bord stratégique')).toBeVisible()
    // Pas d'UI d'approbation : la tentative est faite au niveau API (contrat du TC)

    // ── Tentative 1 : endpoint décision (le quota doit bloquer) ───────────
    // Note : le DTO de decisions/approuver rejette pin/motif (décorateurs absents),
    // on tente donc d'abord avec PIN (contrat du TC), puis sans corps pour atteindre
    // l'évaluation des règles de blocage.
    const tentPin = await c4.post(`/demandes/${demandeId}/decisions/approuver`, {
      pin: PIN,
      motif: 'QA recette TC-P4-02 — quota épuisé',
    })
    const tentPinBody = await tentPin.json().catch(() => ({}))
    if (tentPin.status() === 400 && Array.isArray(tentPinBody?.message)) {
      nc.push(
        'decisions/approuver rejette le PIN côté DTO (« property pin should not exist ») : ' +
          'le contrat du TC (PIN + commentaire) est inapplicable',
      )
    }

    const tent1 = await c4.post(`/demandes/${demandeId}/decisions/approuver`, {})
    const tent1Body = await tent1.json().catch(() => ({}))
    if (tent1.status() === 200 || tent1.status() === 201) {
      nc.push('CRITIQUE : approbation acceptée malgré le quota épuisé (decisions/approuver)')
    } else if (tent1.status() !== 422 || tent1Body?.code !== 'QUOTA_EPUISE') {
      nc.push(
        `Refus quota via decisions/approuver : attendu 422 + code QUOTA_EPUISE, ` +
          `obtenu ${tent1.status()} + code ${tent1Body?.code ?? JSON.stringify(tent1Body).slice(0, 200)}`,
      )
    }

    // Aucune transition vers approuvé
    const apresTent1 = await (await c4.get(`/demandes/${demandeId}`)).json()
    if (apresTent1.statutCode !== 'en_instruction') {
      nc.push(`Statut après refus = ${apresTent1.statutCode} (attendu en_instruction)`)
    }

    // ── Tentative 2 : endpoint alternatif POST /demandes/:id/approuver ─────
    const tent2 = await c4.post(`/demandes/${demandeId}/approuver`, {
      pin: PIN,
      commentaire: 'QA recette TC-P4-02 — quota épuisé',
    })
    if (tent2.status() === 200 || tent2.status() === 201) {
      const apresTent2 = await (await c4.get(`/demandes/${demandeId}`)).json()
      nc.push(
        `CRITIQUE : POST /demandes/:id/approuver contourne le contrôle quota ` +
          `(→ ${tent2.status()}, statut=${apresTent2.statutCode}) ET ne vérifie pas le PIN`,
      )
    }

    expect(
      consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to load resource')),
      'erreurs console pendant le parcours P4',
    ).toEqual([])
    expect(nc, `Non-conformités TC-P4-02 :\n- ${nc.join('\n- ')}`).toEqual([])
  })

  test('TC-P4-03 — tableaux de bord décideur (KPIs, graphiques, alertes quotas)', async ({
    page,
    request,
  }) => {
    const consoleErrors = watchConsoleErrors(page)
    const nc: string[] = []

    // ── Contrats API attendus ──────────────────────────────────────────────
    const t4 = await apiLogin(request, USERS.p4.email)
    const c4 = api(request, t4)
    const stats = await c4.get('/demandes/stats/par-statut')
    if (stats.status() !== 200) nc.push(`GET /demandes/stats/par-statut → ${stats.status()}`)
    const quotas = await c4.get('/quotas')
    if (quotas.status() !== 200) {
      nc.push(
        `GET /quotas (rôle decideur) → ${quotas.status()} ${JSON.stringify(await quotas.json().catch(() => ({}))).slice(0, 120)}`,
      )
    }

    // ── UI : /decideur/dashboard ───────────────────────────────────────────
    await loginAs(page, 'p4')
    await page.goto('/decideur/dashboard')
    await expect(page.getByText('Tableau de bord stratégique')).toBeVisible()

    await expect(page.getByText('Total exonéré')).toBeVisible()
    await expect(page.getByText('Exonérations actives')).toBeVisible()
    await expect(page.getByText('Contribuables', { exact: true }).first()).toBeVisible()

    // KPI « Alertes non traitées » : câblé en dur à « — » dans la vue
    const kpiAlertes = page.locator('.kpi-card', { hasText: 'Alertes non traitées' })
    await expect(kpiAlertes).toBeVisible()
    const valAlertes = (await kpiAlertes.locator('.kpi-value').innerText()).trim()
    if (valAlertes === '—' || valAlertes === '') {
      nc.push(`KPI « Alertes non traitées » non alimenté (valeur « ${valAlertes} ») : aucune alerte quota 80 %/100 %`)
    }

    // Alertes visuelles quotas 80 % (orange) / 100 % (rouge) : recherche dans la page
    const alertesQuota = await page.getByText(/quota/i).count()
    if (alertesQuota === 0) {
      nc.push("Aucune alerte visuelle de quota (seuils 80 %/100 %) sur le tableau de bord décideur")
    }

    // ── UI : /decideur/analyse ─────────────────────────────────────────────
    await page.goto('/decideur/analyse')
    await expect(page.getByRole('heading', { name: /Analyse sectorielle/ })).toBeVisible()
    await expect(page.getByText('Analyse par secteur')).toBeVisible()
    await expect(page.getByText(/Comparaison 2026 vs 2025/)).toBeVisible()

    // Le graphique « Répartition par type d'impôt » du dashboard retombe sur des
    // données fictives car GET /dashboards/p5 renvoie montantParImpot vide.
    const t4b = await apiLogin(request, USERS.p4.email)
    const p5 = await api(request, t4b).get('/dashboards/p5')
    if (p5.ok()) {
      const p5j = await p5.json()
      const parImpot = p5j.montantParImpot ?? p5j.parImpot ?? []
      if (parImpot.length === 0) {
        nc.push('GET /dashboards/p5 : répartition par impôt vide — les graphiques par type d\'impôt affichent des données fictives')
      }
      if (String(p5j.montantTotalAccorde ?? p5j.totalAccorde) === '0') {
        nc.push('GET /dashboards/p5 : montant total exonéré = 0 alors que 4 demandes sont approuvées — KPI « Total exonéré » incohérent')
      }
    }

    expect(
      consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to load resource')),
      'erreurs console pendant le parcours P4',
    ).toEqual([])
    expect(nc, `Non-conformités TC-P4-03 :\n- ${nc.join('\n- ')}`).toEqual([])
  })
})
