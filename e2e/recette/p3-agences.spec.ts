import { test, expect, type Page } from '@playwright/test'
import {
  PASSWORD,
  USERS,
  apiLogin,
  api,
  injectSession,
  ensurePin,
  watchConsoleErrors,
} from './helpers'

/**
 * RECETTE P3 — Agence de promotion (TC-P3-01, TC-P3-02)
 * Référence : docs/tests/04_PLAN_RECETTE_EXONERATION.md §6
 * Compte : komlan.kodjo@api.tg (agent_agence, institution API — inst-005)
 */

// Demande seedée rattachée à l'organe CI → HORS périmètre agence (zone franche / code invest.)
const DEMANDE_HORS_PERIMETRE = 'd0000000-0000-0000-0000-000000000002' // DEM-2026-0002 (CI)

/** Login UI réel via le formulaire, SANS assertion finale : retourne l'URL d'atterrissage observée. */
async function tryUiLogin(page: Page, email: string): Promise<string> {
  await page.goto('/login')
  await page.evaluate(() => localStorage.clear())
  await page.goto('/login')
  await page.getByRole('textbox', { name: /Identifiant|E-mail|Email/i }).fill(email)
  await page.getByRole('textbox', { name: /Mot de passe/i }).fill(PASSWORD)
  const loginResponse = page.waitForResponse(
    (r) => r.url().includes('/api/v1/auth/login') && r.request().method() === 'POST',
  )
  await page.getByRole('button', { name: /Se connecter/i }).click()
  const res = await loginResponse
  expect(res.status(), `login UI ${email}`).toBe(200)
  await page.waitForTimeout(3000)
  return page.url()
}

test.describe('P3 — Agence de promotion', () => {
  test('TC-P3-01 — dashboard agence et conventions de son périmètre', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    const token = await apiLogin(request, USERS.p3.email)
    await ensurePin(request, token)

    await test.step('Précondition API : GET /conventions accessible pour agent_agence', async () => {
      const res = await api(request, token).get('/conventions')
      // Attendu 200 (rôle AGENT_AGENCE autorisé dans conventions.controller.ts:16-24)
      // Observé : 403 ROLE_NON_AUTORISE (le serveur tourne sur un build du 15/07 antérieur au
      // correctif des rôles — dist/ reconstruit le 27/07 mais processus jamais redémarré).
      expect.soft(res.status(), 'GET /conventions agent_agence devrait renvoyer 200').toBe(200)
    })

    await test.step('Étape UI 1 : login P3 → redirection vers /agences/dashboard', async () => {
      const landing = await tryUiLogin(page, USERS.p3.email)
      // Attendu : /agences/dashboard — observé : coincé sur /login
      // (rôle 'agent_agence' inconnu de useDefaultRoute.ts → fallback '/portail/dashboard' →
      // la garde reboucle ; même bug bloquant que pour agent_ci).
      expect.soft(landing, 'atterrissage après login agent_agence').toMatch(/\/agences/)
    })

    await test.step('Étape UI 2 : dashboard agence + conventions actives (données réelles API)', async () => {
      await injectSession(page, request, USERS.p3.email)
      await page.goto('/agences/dashboard').catch(() => undefined)
      await page.waitForTimeout(1500)
      // Attendu : « Tableau de bord Agence » + liste « Conventions actives »
      // Observé : la garde affiche le portail contribuable à la place (fallback rôle).
      await expect.soft(page.getByText('Tableau de bord Agence')).toBeVisible({ timeout: 5000 })
      await expect.soft(page.getByText('Conventions actives')).toBeVisible({ timeout: 2000 })
      await expect(
        page.getByText('Impossible de charger les conventions'),
        'le dashboard agence ne devrait pas afficher d\'erreur de chargement des conventions',
      ).not.toBeVisible({ timeout: 2000 })
    })

    await test.step('Étape UI 3 : page Conventions filtrée par scope agence (RLS)', async () => {
      await page.goto('/agences/conventions').catch(() => undefined)
      await page.waitForTimeout(1000)
      await expect.soft(page.getByText('Gestion des conventions')).toBeVisible({ timeout: 5000 })
      // NOTE : ConventionsView est alimentée par mockConventions (mock/data.ts), pas par l'API —
      // le filtrage RLS agence n'est pas vérifiable sur cet écran (constat de recette).
    })

    expect(consoleErrors.filter((e) => !/favicon|net::/i.test(e)), 'erreurs console').toEqual([])
  })

  test('TC-P3-02 — instruction dans le périmètre agence + refus hors périmètre (403)', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    const token = await apiLogin(request, USERS.p3.email)
    await ensurePin(request, token)

    await test.step('API : file d\'instruction agence listable (GET /demandes, scope agence)', async () => {
      const res = await api(request, token).get('/demandes')
      // Attendu 200 + dossiers zone franche / code des investissements uniquement — observé 500
      expect.soft(res.status(), 'GET /demandes agent_agence').toBe(200)
    })

    await test.step('API : accès direct à un dossier HORS périmètre → 403', async () => {
      // Observé : 200 avec le détail complet → FUITE RLS
      // (scope.service.ts:184-203 — demandeMatchesScope ignore le scope AGENT_AGENCE).
      const res = await api(request, token).get(`/demandes/${DEMANDE_HORS_PERIMETRE}`)
      expect.soft(res.status(), 'agent_agence ne devrait pas lire un dossier CI (403 attendu)').toBe(403)
    })

    await test.step('API : prise en charge HORS périmètre → 403', async () => {
      const res = await api(request, token).post(`/demandes/${DEMANDE_HORS_PERIMETRE}/prendre-en-charge`)
      expect.soft(res.status(), 'prendre-en-charge hors périmètre devrait être refusé (403)').toBe(403)
    })

    await test.step('UI : l\'espace agence expose une file d\'instruction (même flux que P2)', async () => {
      const landing = await tryUiLogin(page, USERS.p3.email)
      expect.soft(landing, 'atterrissage après login agent_agence').toMatch(/\/agences/)
      await injectSession(page, request, USERS.p3.email)
      await page.goto('/agences/dashboard').catch(() => undefined)
      await page.waitForTimeout(1500)
      // Attendu (plan §6) : l'agence instruit « le même flux que P2 » dans son périmètre.
      // Constat : aucune vue /agences/* (Dashboard/Conventions/Agrements/Engagements) ne propose
      // d'instruction de demandes — aucune route /agences/dossiers n'existe (router.ts:61-64).
      const lienInstruction = page.getByRole('link', { name: /instru|dossier|demande/i })
      await expect(
        lienInstruction.first(),
        'aucun accès « instruction des demandes » dans l\'espace agence',
      ).toBeVisible({ timeout: 3000 })
    })

    expect(consoleErrors.filter((e) => !/favicon|net::/i.test(e)), 'erreurs console').toEqual([])
  })
})
