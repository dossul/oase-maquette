import { test, expect, type Page } from '@playwright/test'
import {
  API,
  PASSWORD,
  PIN,
  USERS,
  apiLogin,
  api,
  injectSession,
  ensurePin,
  watchConsoleErrors,
} from './helpers'

/**
 * RECETTE P2 — Agent instructeur (TC-P2-01 .. TC-P2-05)
 * Référence : docs/tests/04_PLAN_RECETTE_EXONERATION.md §5
 *
 * CONSTATS D'ENVIRONNEMENT (vérifiés pendant la recette) :
 * - [BLOQUANT UI] Le mapping de rôles frontend (src/composables/useDefaultRoute.ts) utilise
 *   d'anciens noms ('agent_otr', 'agence') alors que le backend renvoie 'agent_ci' /
 *   'agent_agence' → la garde du routeur (src/plugins/router.ts:149) reboucle vers
 *   '/portail/dashboard' : après un login réussi, un agent CI reste coincé sur /login et
 *   toute route /backoffice/* affiche le portail contribuable au lieu de la vue demandée.
 * - [BACKEND] GET /demandes renvoie 500 pour tous les rôles agents (ScopeService
 *   src/common/services/scope.service.ts utilise la relation `baseJuridiqueVersion`
 *   singulier alors que le schéma Prisma la nomme `baseJuridiqueVersions`).
 * - [FRONT] DossiersView / InstructionView / ValidationView sont 100 % mock (mock/data.ts) :
 *   aucun appel API, pas de bouton « Prendre en charge », pas de PIN dans les dialogues.
 */

const DEMANDE_SOUMISE_CI = 'd0000000-0000-0000-0000-000000000002' // DEM-2026-0002 (seed, organe CI)

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
  // Laisse le routeur tenter sa redirection (qui échoue pour les rôles agents — constat recette)
  await page.waitForTimeout(3000)
  return page.url()
}

/** Session injectée + navigation directe : retourne l'URL finale et si le contenu attendu est rendu. */
async function gotoAvecSession(page: Page, request: Parameters<typeof injectSession>[1], email: string, path: string) {
  await injectSession(page, request, email)
  await page.goto(path).catch(() => undefined)
  await page.waitForTimeout(1500)
  return page.url()
}

test.describe('P2 — Agent instructeur', () => {
  test('TC-P2-01 — prise en charge d\'un dossier en file d\'attente', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    const token = await apiLogin(request, USERS.p2_ci.email)
    await ensurePin(request, token)

    await test.step('Précondition API : file d\'instruction agent CI listable (GET /demandes)', async () => {
      const res = await api(request, token).get('/demandes')
      // Attendu 200 — observé 500 (bug ScopeService)
      expect.soft(res.status(), 'GET /demandes agent_ci devrait renvoyer 200').toBe(200)
    })

    await test.step('Précondition API : la transition prendre-en-charge existe côté backend', async () => {
      // Vérifié en exploration : POST /demandes/:id/prendre-en-charge → 200, statut → en_instruction.
      const detail = await api(request, token).get(`/demandes/${DEMANDE_SOUMISE_CI}`)
      expect(detail.status(), 'GET /demandes/:id agent_ci').toBe(200)
    })

    await test.step('Étape UI 1 : login P2 → l\'agent quitte /login vers son espace backoffice', async () => {
      const landing = await tryUiLogin(page, USERS.p2_ci.email)
      // Attendu : /backoffice/... — observé : coincé sur /login (boucle de redirection de la garde)
      expect.soft(landing, 'atterrissage après login agent_ci').toMatch(/\/backoffice/)
    })

    await test.step('Étape UI 2 : /backoffice/dossiers affiche la file réelle (RLS organe CI)', async () => {
      await gotoAvecSession(page, request, USERS.p2_ci.email, '/backoffice/dossiers')
      // Attendu : vue « Liste des dossiers » avec les dossiers backend (ex. DEM-2026-0002)
      // Observé : le portail contribuable (P1) est rendu à la place (fallback de la garde)
      await expect.soft(page.getByText('Liste des dossiers')).toBeVisible({ timeout: 5000 })
      await expect.soft(page.getByText('DEM-2026-0002').first()).toBeVisible({ timeout: 2000 })
    })

    await test.step('Étape UI 3 : action « Prendre en charge » → POST /demandes/:id/prendre-en-charge 200', async () => {
      // Attendu par le plan : clic Instruire → « Prendre en charge » → statut en_instruction,
      // instructeur = P2, disparition de la file « soumis ».
      await expect(
        page.getByRole('button', { name: /Prendre en charge/i }).first(),
        'bouton « Prendre en charge » absent de la file d\'instruction (vue 100 % mock)',
      ).toBeVisible({ timeout: 3000 })
    })

    expect(consoleErrors.filter((e) => !/favicon|net::/i.test(e)), 'erreurs console').toEqual([])
  })

  test('TC-P2-02 — instruction détaillée : pièces, commentaire, montant, PIN, valider étape', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    const token = await apiLogin(request, USERS.p2_ci.email)
    await ensurePin(request, token)

    await test.step('Précondition API : dossier pris en charge par P2', async () => {
      const detail = await api(request, token).get(`/demandes/${DEMANDE_SOUMISE_CI}`)
      expect(detail.status(), 'GET /demandes/:id agent_ci').toBe(200)
      const d = await detail.json()
      if (d.statutCode === 'soumis') {
        const pec = await api(request, token).post(`/demandes/${DEMANDE_SOUMISE_CI}/prendre-en-charge`)
        expect(pec.status(), 'POST prendre-en-charge').toBe(200)
      }
    })

    await test.step('Précondition API : endpoint de validation d\'étape disponible', async () => {
      // Attendu par le plan : POST /workflow/etapes/:id/valider en 200.
      // Constat : le serveur API en cours n'expose AUCUNE route /workflow (vérifié via /api/docs-json).
      const docs = await request.get(`${API.replace('/api/v1', '')}/api/docs-json`)
      const paths = Object.keys((await docs.json()).paths || {})
      expect.soft(
        paths.some((p) => p.includes('/workflow/')),
        'aucune route /workflow/* exposée par le backend (validation d\'étape introuvable)',
      ).toBe(true)
    })

    await test.step('Étape UI 1 : login P2', async () => {
      const landing = await tryUiLogin(page, USERS.p2_ci.email)
      expect.soft(landing, 'atterrissage après login agent_ci').toMatch(/\/backoffice/)
    })

    await test.step('Étape UI 2 : /backoffice/dossiers/:id/instruction — pièces + visionneuse PDF', async () => {
      await gotoAvecSession(page, request, USERS.p2_ci.email, `/backoffice/dossiers/${DEMANDE_SOUMISE_CI}/instruction`)
      await expect.soft(page.getByText("Formulaire d'instruction")).toBeVisible({ timeout: 5000 })
      await expect.soft(page.getByText('Pièces du dossier')).toBeVisible({ timeout: 2000 })
      await expect.soft(page.getByText('Visionneuse PDF intégrée')).toBeVisible({ timeout: 2000 })
    })

    await test.step('Étape UI 3 : saisie avis + montant évalué', async () => {
      const avis = page.getByLabel(/Avis technique de l'agent/i)
      if (await avis.isVisible().catch(() => false)) {
        await avis.fill('Avis favorable — dossier complet, contrôles SIGTAS/SYDONIA OK.')
        await page.getByLabel(/Montant évalué/i).fill('12000000')
      } else {
        expect.soft(false, 'formulaire d\'instruction inaccessible (garde routeur)').toBe(true)
      }
    })

    await test.step('Étape UI 4 : PIN de signature exigé + « Valider et transmettre » → POST /workflow/etapes/:id/valider', async () => {
      const valider = page.getByRole('button', { name: /Valider et transmettre/i })
      if (await valider.isVisible().catch(() => false)) await valider.click()
      const pinField = page.getByLabel(/PIN/i)
      await expect(
        pinField,
        'champ PIN de signature absent du flux « Valider et transmettre » (InstructionView sans PIN ni appel API)',
      ).toBeVisible({ timeout: 3000 })
      await pinField.fill(PIN)
    })

    expect(consoleErrors.filter((e) => !/favicon|net::/i.test(e)), 'erreurs console').toEqual([])
  })

  test('TC-P2-03 — demander un complément motivé au bénéficiaire', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    const token = await apiLogin(request, USERS.p2_ci.email)
    await ensurePin(request, token)

    await test.step('Étape UI 1 : login P2', async () => {
      const landing = await tryUiLogin(page, USERS.p2_ci.email)
      expect.soft(landing, 'atterrissage après login agent_ci').toMatch(/\/backoffice/)
    })

    await test.step('Étape UI 2 : ouvrir l\'instruction et cliquer « Demander complément »', async () => {
      await gotoAvecSession(page, request, USERS.p2_ci.email, `/backoffice/dossiers/${DEMANDE_SOUMISE_CI}/instruction`)
      const btn = page.getByRole('button', { name: /Demander compl[eè]ment/i })
      await expect.soft(btn).toBeVisible({ timeout: 5000 })
      if (await btn.isVisible().catch(() => false)) await btn.click()
    })

    await test.step('Étape UI 3 : motif précis obligatoire → POST /demandes/:id/demander-complement 200', async () => {
      // Attendu : champ motif (ex. « RCCM expiré ») → statut action_requise + notification P1.
      // Observé (maquette/src/views/backoffice/InstructionView.vue:184) : le champ motif n'est
      // rendu QUE pour l'action 'rejeter' ; la boîte « complément » n'a ni motif ni appel API.
      const motif = page.getByRole('textbox', { name: /motif|compl[eè]ment|message/i })
      await expect(
        motif,
        'champ motif du complément absent de la boîte de dialogue (demande de complément non motivable)',
      ).toBeVisible({ timeout: 3000 })
      await motif.fill('RCCM expiré — merci de fournir la version à jour.')
    })

    expect(consoleErrors.filter((e) => !/favicon|net::/i.test(e)), 'erreurs console').toEqual([])
  })

  test('TC-P2-04 — rejeter une demande avec motif obligatoire + PIN', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    const token = await apiLogin(request, USERS.p2_ci.email)
    await ensurePin(request, token)

    await test.step('Étape UI 1 : login P2', async () => {
      const landing = await tryUiLogin(page, USERS.p2_ci.email)
      expect.soft(landing, 'atterrissage après login agent_ci').toMatch(/\/backoffice/)
    })

    await test.step('Étape UI 2 : ouvrir l\'instruction et cliquer « Rejeter »', async () => {
      await gotoAvecSession(page, request, USERS.p2_ci.email, `/backoffice/dossiers/${DEMANDE_SOUMISE_CI}/instruction`)
      const btn = page.getByRole('button', { name: /^Rejeter$/i })
      await expect.soft(btn).toBeVisible({ timeout: 5000 })
      if (await btn.isVisible().catch(() => false)) await btn.click()
    })

    await test.step('Étape UI 3 : motif obligatoire + PIN → POST /demandes/:id/rejeter 200, statut rejeté', async () => {
      const motif = page.getByLabel(/Motif du rejet/i)
      if (await motif.isVisible().catch(() => false)) {
        await motif.fill('Dettes fiscales SIGTAS non régularisées — rejet motivé.')
      } else {
        expect.soft(false, 'boîte de dialogue de rejet inaccessible (garde routeur)').toBe(true)
      }
      // Attendu : saisie du PIN de signature avant confirmation.
      // Observé (InstructionView.vue:180-193) : pas de champ PIN, confirmAction() ferme juste
      // la boîte sans aucun appel API — la demande n'est jamais rejetée.
      const pinField = page.getByLabel(/PIN/i)
      await expect(
        pinField,
        'champ PIN absent de la boîte de dialogue de rejet (et aucun appel POST /rejeter)',
      ).toBeVisible({ timeout: 3000 })
    })

    expect(consoleErrors.filter((e) => !/favicon|net::/i.test(e)), 'erreurs console').toEqual([])
  })

  test('TC-P2-05 — file d\'instruction filtrée et RLS (agent_ci vs agent_dgbf)', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)

    await test.step('API : GET /demandes agent_ci (scope organe CI)', async () => {
      const tokenCi = await apiLogin(request, USERS.p2_ci.email)
      const resCi = await api(request, tokenCi).get('/demandes')
      // Attendu 200 + uniquement dossiers CI — observé 500 (bug ScopeService)
      expect.soft(resCi.status(), 'GET /demandes agent_ci').toBe(200)
    })

    await test.step('API : GET /demandes agent_dgbf (scope workflow DGBF)', async () => {
      const tokenDgbf = await apiLogin(request, USERS.p2_dgbf.email)
      const resDgbf = await api(request, tokenDgbf).get('/demandes')
      expect.soft(resDgbf.status(), 'GET /demandes agent_dgbf').toBe(200)
    })

    await test.step('API : aucune donnée d\'un autre organe via accès direct (GET /demandes/:id)', async () => {
      // DEM-2026-0002 relève de l'organe CI — un agent DGBF ne doit PAS y accéder (403 attendu).
      // Observé : 200 avec le détail complet → FUITE RLS (scope.service.ts:184-203,
      // demandeMatchesScope ne contrôle ni organe ni étapes workflow).
      const tokenDgbf = await apiLogin(request, USERS.p2_dgbf.email)
      const res = await api(request, tokenDgbf).get(`/demandes/${DEMANDE_SOUMISE_CI}`)
      expect.soft(res.status(), 'agent_dgbf ne devrait pas lire un dossier CI (403 attendu)').toBe(403)
    })

    await test.step('UI : dashboard backoffice agent_ci affiche la file réelle', async () => {
      const landing = await tryUiLogin(page, USERS.p2_ci.email)
      expect.soft(landing, 'atterrissage après login agent_ci').toMatch(/\/backoffice/)
      await gotoAvecSession(page, request, USERS.p2_ci.email, '/backoffice/dashboard')
      // La vue appelle GET /demandes (500 backend) → alerte d'erreur au lieu de la file
      await expect.soft(page.getByText('File de traitement')).toBeVisible({ timeout: 5000 })
      await expect(
        page.getByText('Impossible de charger la file de traitement'),
        'le dashboard ne devrait pas afficher d\'erreur de chargement',
      ).not.toBeVisible({ timeout: 3000 })
    })

    expect(consoleErrors.filter((e) => !/favicon|net::/i.test(e)), 'erreurs console').toEqual([])
  })
})
