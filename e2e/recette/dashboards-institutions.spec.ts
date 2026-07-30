import { test, expect } from '@playwright/test'
import { USERS, api, apiLogin, injectSession, watchConsoleErrors } from './helpers'

/**
 * TC-INST-01 — Dashboards institutionnels branchés sur données réelles.
 *
 * Avant cette passe, DsiMefDashboardView et MinisteresDashboardView étaient
 * 100 % statiques (états vides TODO) et ConeDefDashboardView minimal.
 * Désormais :
 *   - DSI/MEF      → GET /connecteurs + /connecteurs/status + /health (rôle agent_dsi_mef ajouté)
 *   - Ministères   → GET /demandes + GET /conventions (rôle agent_ministere ajouté en lecture)
 *   - CONEDEF      → GET /rapports + GET /conventions (rôle agent_conedef ajouté en lecture)
 */

const DSI = 'agent.dsi.mef@oase.tg'
const MINISTERE = 'agent.ministere@oase.tg'
const CONEDEF = 'agent.conedef@oase.tg'

test.describe.configure({ mode: 'serial', timeout: 120000 })

test.describe('TC-INST-01 — Dashboards institutionnels', () => {
  test('API — RBAC élargi : dsi_mef lit /connecteurs, ministere et conedef lisent /conventions', async ({ request }) => {
    const dsi = await apiLogin(request, DSI)
    expect((await api(request, dsi).get('/connecteurs')).status()).toBe(200)
    const status = await api(request, dsi).get('/connecteurs/status')
    expect(status.status()).toBe(200)
    const corps = await status.json()
    expect(corps.connecteurs.length).toBeGreaterThanOrEqual(5)

    // Le contribuable n'a PAS accès aux connecteurs (périmètre sensible)
    const contribuable = await apiLogin(request, USERS.p1.email)
    expect((await api(request, contribuable).get('/connecteurs')).status()).toBe(403)

    const ministere = await apiLogin(request, MINISTERE)
    expect((await api(request, ministere).get('/conventions')).status()).toBe(200)
    const conedef = await apiLogin(request, CONEDEF)
    expect((await api(request, conedef).get('/conventions')).status()).toBe(200)
  })

  test('UI DSI/MEF — interfaces SI réelles, santé API, KPIs', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    await injectSession(page, request, DSI)
    await page.goto('/dsi/dashboard')

    await expect(page.getByRole('heading', { name: /Tableau de bord DSI/i })).toBeVisible()
    // Santé API réelle
    await expect(page.getByText(/API opérationnelle/i)).toBeVisible({ timeout: 15000 })
    // Interfaces réelles du registre
    await expect(page.getByRole('cell', { name: 'Sydonia World' })).toBeVisible()
    await expect(page.getByRole('cell', { name: /E-TAX/ })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'SIGFiP', exact: true })).toBeVisible()
    // KPI réel : 5 interfaces déclarées
    await expect(page.getByText('Interfaces déclarées')).toBeVisible()

    const erreursJs = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to load resource'))
    expect(erreursJs, 'erreurs JS sur le dashboard DSI').toEqual([])
  })

  test('UI Ministères — dossiers et conventions réels, aucun chiffre fictif', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    await injectSession(page, request, MINISTERE)
    await page.goto('/ministeres/dashboard')

    await expect(page.getByRole('heading', { name: /Tableau de bord ministère sectoriel/i })).toBeVisible()
    // Dossiers réels (seed : demandes OASE)
    await expect(page.getByText('Dossiers dans le périmètre')).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('cell', { name: /DEM-/ }).first()).toBeVisible()
    // Conventions réelles
    await expect(page.getByRole('cell', { name: /CONV-/ }).first()).toBeVisible()
    await expect(page.getByText('Conventions actives')).toBeVisible()

    const erreursJs = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to load resource'))
    expect(erreursJs, 'erreurs JS sur le dashboard ministères').toEqual([])
  })

  test('UI CONEDEF — rapports réels + KPIs enrichis', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    await injectSession(page, request, CONEDEF)
    await page.goto('/conedef/dashboard')

    await expect(page.getByRole('heading', { name: /Tableau de bord CONEDEF/i })).toBeVisible()
    await expect(page.getByText('Rapports generes')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Dernier exercice couvert')).toBeVisible()
    await expect(page.getByText('Conventions actives')).toBeVisible()

    const erreursJs = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to load resource'))
    expect(erreursJs, 'erreurs JS sur le dashboard CONEDEF').toEqual([])
  })
})
