import { test, expect, type Page, type TestInfo } from '@playwright/test'
import { USERS, apiLogin, api, loginAs, watchConsoleErrors } from './helpers'

/**
 * GROUPE P5 — Organe de contrôle / Audit (recette contre backend réel).
 * Référence : docs/tests/04_PLAN_RECETTE_EXONERATION.md (TC-P5-01..03).
 */

interface ApiError {
  status: number
  method: string
  url: string
}

/** Collecte les réponses API 4xx/5xx pendant le parcours UI. */
function watchApiErrors(page: Page): ApiError[] {
  const errors: ApiError[] = []
  page.on('response', (res) => {
    if (res.url().includes('/api/') && res.status() >= 400) {
      errors.push({ status: res.status(), method: res.request().method(), url: res.url() })
    }
  })
  return errors
}

/** Attache les erreurs API au rapport Playwright. */
async function attachApiErrors(info: TestInfo, errors: ApiError[]) {
  if (errors.length === 0) return
  await info.attach('appels-api-en-erreur', {
    body: errors.map((e) => `${e.method} ${e.url} → ${e.status}`).join('\n'),
    contentType: 'text/plain',
  })
}

test.describe('P5 — Audit & Contrôle', () => {
  test('TC-P5-01 — dashboard contrôle et anomalies par gravité', async ({ page, request }, info) => {
    const consoleErrors = watchConsoleErrors(page)
    const apiErrors = watchApiErrors(page)
    const nc: string[] = []

    // ── Contrat API attendu : l'auditeur peut lister les anomalies ────────
    const t5 = await apiLogin(request, USERS.p5.email)
    const anomaliesRes = await api(request, t5).get('/anomalies')
    if (anomaliesRes.status() !== 200) {
      nc.push(
        `GET /anomalies (rôle auditeur) → ${anomaliesRes.status()} ` +
          `${JSON.stringify(await anomaliesRes.json().catch(() => ({}))).slice(0, 150)}`,
      )
    }

    // ── UI : /audit/dashboard ──────────────────────────────────────────────
    await loginAs(page, 'p5')
    await expect(page).toHaveURL(/\/audit/)
    await page.goto('/audit/dashboard')
    await expect(page.getByRole('heading', { name: 'Tableau de bord Audit' })).toBeVisible()
    await expect(page.getByText('Lecture seule').first()).toBeVisible()

    // La liste « Anomalies prioritaires » dépend de GET /anomalies (réel)
    const erreurChargement = page.getByText('Impossible de charger les anomalies')
    if (await erreurChargement.isVisible()) {
      nc.push('Dashboard audit : « Anomalies prioritaires » en échec de chargement (API /anomalies KO)')
    } else {
      await expect(page.getByText('Anomalies prioritaires')).toBeVisible()
    }

    // ── UI : /audit/anomalies ──────────────────────────────────────────────
    await page.goto('/audit/anomalies')
    await expect(page.getByRole('heading', { name: 'Analyse des anomalies' })).toBeVisible()

    // Filtres par catégorie / gravité / statut présents
    await expect(page.getByLabel('Catégorie')).toBeVisible()
    await expect(page.getByLabel('Gravité')).toBeVisible()
    await expect(page.getByLabel('Statut')).toBeVisible()

    // Gravités affichées (données réelles — vue câblée sur GET /anomalies)
    for (const g of ['critique', 'elevee', 'moyenne', 'faible']) {
      await expect(page.locator('.v-data-table').getByText(g, { exact: true }).first()).toBeVisible()
    }

    // Anomalies prioritaires en premier : la première ligne doit être une critique
    const premiereGravite = await page
      .locator('.v-data-table tbody tr')
      .first()
      .locator('td')
      .nth(2)
      .innerText()
    if (!/critique/i.test(premiereGravite)) {
      nc.push(`Tri par priorité absent : première anomalie affichée = « ${premiereGravite.trim()} » (attendu critique en premier)`)
    }

    await attachApiErrors(info, apiErrors)
    const erreursJs = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to load resource'))
    expect(erreursJs, 'erreurs JS/pageerror pendant le parcours P5').toEqual([])
    expect(nc, `Non-conformités TC-P5-01 :\n- ${nc.join('\n- ')}`).toEqual([])
  })

  test("TC-P5-02 — journal d'audit et vérification de la chaîne SHA-256", async ({
    page,
    request,
  }, info) => {
    const consoleErrors = watchConsoleErrors(page)
    const apiErrors = watchApiErrors(page)
    const nc: string[] = []

    // ── Contrat API attendu : POST /audit-logs/verify-chain ────────────────
    const t5 = await apiLogin(request, USERS.p5.email)
    const c5 = api(request, t5)

    const verifPost = await c5.post('/audit-logs/verify-chain')
    if (verifPost.status() === 404) {
      const verifGet = await c5.get('/audit-logs/verify-chain')
      if (verifGet.status() !== 200) {
        nc.push(
          `Vérification de chaîne indisponible : POST /audit-logs/verify-chain → 404, ` +
            `GET /audit-logs/verify-chain → ${verifGet.status()} (module audit-logs absent du backend déployé)`,
        )
      } else {
        const body = await verifGet.json()
        if (!Array.isArray(body.breaks) || body.breaks.length > 0) {
          nc.push(`Ruptures de chaîne SHA-256 détectées : ${JSON.stringify(body.breaks).slice(0, 300)}`)
        }
        nc.push('Écart de contrat : la vérification est en GET alors que le plan de recette exige POST /audit-logs/verify-chain (404)')
      }
    } else if (verifPost.status() === 200 || verifPost.status() === 201) {
      const body = await verifPost.json()
      if (!Array.isArray(body.breaks) || body.breaks.length > 0) {
        nc.push(`Ruptures de chaîne SHA-256 : ${JSON.stringify(body.breaks).slice(0, 300)}`)
      }
      if (typeof body.verified !== 'number') nc.push('Réponse verify-chain sans champ « verified »')
    } else {
      nc.push(`POST /audit-logs/verify-chain → ${verifPost.status()}`)
    }

    // Le journal lui-même doit être accessible en lecture
    const logs = await c5.get('/audit-logs?limit=5')
    if (logs.status() !== 200) {
      nc.push(`GET /audit-logs (rôle auditeur) → ${logs.status()} : journal d'audit inaccessible`)
    }

    // ── UI : /audit/journal ────────────────────────────────────────────────
    await loginAs(page, 'p5')
    await page.goto('/audit/journal')
    await expect(page.getByRole('heading', { name: "Journal d'audit inaltérable" })).toBeVisible()
    await expect(page.getByText('Inaltérable', { exact: true })).toBeVisible()

    // Timeline + filtres présents
    await expect(page.getByLabel('Action').first()).toBeVisible()
    await expect(page.getByLabel('Structure').first()).toBeVisible()
    await expect(page.locator('.v-data-table')).toBeVisible()

    await attachApiErrors(info, apiErrors)
    const erreursJs = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to load resource'))
    expect(erreursJs, 'erreurs JS/pageerror pendant le parcours P5').toEqual([])
    expect(nc, `Non-conformités TC-P5-02 :\n- ${nc.join('\n- ')}`).toEqual([])
  })

  test("TC-P5-03 — consultation d'un dossier en lecture seule (aucune action)", async ({
    page,
  }, info) => {
    const consoleErrors = watchConsoleErrors(page)
    const apiErrors = watchApiErrors(page)

    await loginAs(page, 'p5')
    await page.goto('/audit/dossiers')
    await expect(page.getByRole('heading', { name: 'Consultation des dossiers' })).toBeVisible()
    await expect(page.getByText(/Lecture seule — Aucune action possible/)).toBeVisible()

    // Ouvrir le premier dossier de la liste.
    // ⚠️ Attendre une VRAIE ligne de données (référence DEM-) : la première ligne du
    // tbody pendant le chargement est le placeholder « Loading items… » — cliquer
    // dessus ne déclenche pas @click:row (flaky constaté en prod le 28/07/2026).
    const premiereLigne = page.locator('.v-data-table tbody tr', { hasText: 'DEM-' }).first()
    await expect(premiereLigne).toBeVisible({ timeout: 15000 })
    await premiereLigne.click()

    // Panneau de détail : informations complètes affichées
    // (chargement async du détail — latence prod → timeouts élargis)
    const drawer = page.locator('.v-navigation-drawer')
    await expect(drawer.getByText('Contribuable', { exact: true })).toBeVisible({ timeout: 15000 })
    await expect(drawer.getByText('NIF', { exact: true })).toBeVisible({ timeout: 10000 })
    await expect(drawer.getByText('Montant', { exact: true })).toBeVisible({ timeout: 10000 })
    await expect(drawer.getByText('Base juridique', { exact: true })).toBeVisible({ timeout: 10000 })
    await expect(drawer.getByText('Consultation confidentielle — journalisée')).toBeVisible({ timeout: 10000 })

    // Onglet Documents accessible
    await drawer.getByRole('tab', { name: /Documents/ }).click()
    await expect(drawer.getByText(/pièce\(s\)/)).toBeVisible()

    // AUCUN bouton d'action métier (Valider / Rejeter / Demander complément / Approuver)
    const actionsInterdites = page.getByRole('button', {
      name: /valider|rejeter|complément|approuver/i,
    })
    await expect(actionsInterdites).toHaveCount(0)

    // Erreurs API pendant la consultation : signalées au rapport sans invalider
    // le critère métier (lecture seule respectée)
    await attachApiErrors(info, apiErrors)
    const erreursJs = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to load resource'))
    expect(erreursJs, 'erreurs JS/pageerror pendant le parcours P5').toEqual([])
  })
})
