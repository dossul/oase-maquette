import { test, expect, type Page, type TestInfo } from '@playwright/test'
import { API, watchConsoleErrors } from './helpers'

/**
 * GROUPE P6 — Portail public / Open Data (recette contre backend réel, SANS authentification).
 * Le plan de recette (docs/tests/04_PLAN_RECETTE_EXONERATION.md) excluait P6 du périmètre ;
 * cette spec comble le manque identifié dans docs/qa/RAPPORT_COUVERTURE_TESTS_2026-07-28.md §3.1.
 *
 * Règle d'or : aucune page publique ne doit rediriger vers /login, produire d'erreur
 * console, ni recevoir de réponse API ≥ 400.
 */

interface ApiError {
  status: number
  method: string
  url: string
}

/** Collecte les réponses API 4xx/5xx pendant le parcours. */
function watchApiErrors(page: Page): ApiError[] {
  const errors: ApiError[] = []
  page.on('response', (res) => {
    if (res.url().includes('/api/') && res.status() >= 400) {
      errors.push({ status: res.status(), method: res.request().method(), url: res.url() })
    }
  })
  return errors
}

async function attachApiErrors(info: TestInfo, errors: ApiError[]) {
  if (errors.length === 0) return
  await info.attach('appels-api-en-erreur', {
    body: errors.map((e) => `${e.method} ${e.url} → ${e.status}`).join('\n'),
    contentType: 'text/plain',
  })
}

/** Asserts communs à toutes les pages publiques P6. */
async function expectPagePubliqueSaine(
  page: Page,
  info: TestInfo,
  consoleErrors: string[],
  apiErrors: ApiError[],
) {
  // Jamais de redirection vers /login sur une page publique
  await expect(page).not.toHaveURL(/\/login/)
  await attachApiErrors(info, apiErrors)
  const erreursJs = consoleErrors.filter(
    (e) => !e.includes('favicon') && !e.includes('Failed to load resource'),
  )
  expect(erreursJs, 'erreurs JS/pageerror sur page publique P6').toEqual([])
  expect(
    apiErrors,
    `appels API en erreur sur page publique :\n${apiErrors.map((e) => `${e.method} ${e.url} → ${e.status}`).join('\n')}`,
  ).toEqual([])
}

test.describe('P6 — Portail public / Open Data', () => {
  test('TC-P6-01 — page d’accueil open data accessible anonymement', async ({ page }, info) => {
    const consoleErrors = watchConsoleErrors(page)
    const apiErrors = watchApiErrors(page)

    await page.goto('/opendata')
    await expect(
      page.getByText(/données agrégées sur les exonérations fiscales et douanières/),
    ).toBeVisible({ timeout: 15000 })
    // KPIs publics calculés sur données réelles
    await expect(page.getByText(/Mesures publiées/).first()).toBeVisible({ timeout: 15000 })
    await expect(page.getByText(/Montant total accordé/).first()).toBeVisible({ timeout: 15000 })

    await expectPagePubliqueSaine(page, info, consoleErrors, apiErrors)
  })

  test('TC-P6-02 — tableaux de bord publics', async ({ page }, info) => {
    const consoleErrors = watchConsoleErrors(page)
    const apiErrors = watchApiErrors(page)

    await page.goto('/opendata/tableaux-de-bord')
    await expect(
      page.getByRole('heading', { name: 'Tableaux de bord publics' }),
    ).toBeVisible({ timeout: 15000 })

    await expectPagePubliqueSaine(page, info, consoleErrors, apiErrors)
  })

  test('TC-P6-03 — jeux de données ouverts téléchargeables', async ({ page }, info) => {
    const consoleErrors = watchConsoleErrors(page)
    const apiErrors = watchApiErrors(page)

    await page.goto('/opendata/datasets')
    await expect(page.getByText('Jeux de données ouverts')).toBeVisible({ timeout: 15000 })
    // Preuve de données réelles : l'extrait du premier enregistrement de l'API est affiché
    await expect(
      page.getByText(/Extrait réel — GET \/api\/v1\/rapports\/opendata/),
    ).toBeVisible({ timeout: 15000 })

    await expectPagePubliqueSaine(page, info, consoleErrors, apiErrors)
  })

  test('TC-P6-04 — bibliothèque des rapports publiés', async ({ page }, info) => {
    const consoleErrors = watchConsoleErrors(page)
    const apiErrors = watchApiErrors(page)

    await page.goto('/opendata/rapports')
    await expect(page.getByText('Bibliothèque des rapports publiés')).toBeVisible({ timeout: 15000 })

    await expectPagePubliqueSaine(page, info, consoleErrors, apiErrors)
  })

  test('TC-P6-05 — API publique /rapports/opendata répond 200 sans token', async ({ request }) => {
    const res = await request.get(`${API}/rapports/opendata`)
    expect(res.status(), 'GET /rapports/opendata anonyme').toBe(200)
    const body = await res.json()
    const rows = Array.isArray(body) ? body : (body.data ?? [])
    expect(Array.isArray(rows), 'payload tableau attendu').toBe(true)
    expect(rows.length, 'au moins une mesure publiée en open data').toBeGreaterThan(0)
  })
})
