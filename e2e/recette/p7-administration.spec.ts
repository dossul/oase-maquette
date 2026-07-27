import { test, expect, type Page } from '@playwright/test'
import { execSync } from 'node:child_process'
import { API, USERS, apiLogin, api, watchConsoleErrors } from './helpers'

/**
 * GROUPE P7 — Administration système (TC-P7-01 à TC-P7-04).
 * Référence : docs/tests/04_PLAN_RECETTE_EXONERATION.md §9.
 *
 * ⚠ WORKAROUND (bug applicatif BUG-ROLES, rapporté) : le backend renvoie le rôle
 * `admin_si` pour p7 mais le frontend (useDefaultRoute.ts / isAdminRole) ne connaît
 * que `admin` → p7 ne peut pas se connecter via /login (boucle de redirection).
 * Pour tester l'UI admin, on injecte la session avec le rôle normalisé `admin`
 * (le token JWT backend reste `admin_si`, les appels API sont donc réels).
 */
async function injectAdminSession(page: Page, request: Parameters<typeof apiLogin>[0]) {
  const token = await apiLogin(request, USERS.p7.email)
  const me = await api(request, token).get('/utilisateurs/me')
  const user = me.ok() ? await me.json() : null
  if (user) user.role = 'admin' // normalisation frontend (workaround BUG-ROLES)
  await page.goto('/login')
  await page.evaluate(
    ([t, u]) => {
      localStorage.setItem('oase_token', t as string)
      if (u) localStorage.setItem('oase_user', JSON.stringify(u))
    },
    [token, user],
  )
  return token
}

/** Sélectionne une option dans un v-select Vuetify identifié par son label. */
async function selectVuetify(page: Page, scope: ReturnType<Page['locator']>, label: RegExp, optionText: string) {
  await scope.locator('.v-select', { hasText: label }).first().click()
  const option = page.locator('.v-overlay-container .v-list-item', { hasText: optionText }).first()
  await expect(option).toBeVisible()
  await option.click()
}

test.describe('P7 — Administration système', () => {
  test('TC-P7-01 — créer un compte utilisateur avec rôle, structure et canaux de notification', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    await injectAdminSession(page, request)

    // Étape 1 : P7 va sur /admin/utilisateurs
    await page.goto('/admin/utilisateurs')
    await expect(page.getByRole('button', { name: /Créer un compte/i })).toBeVisible()

    // Étape 2 : ouvrir le formulaire de création
    await page.getByRole('button', { name: /Créer un compte/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Créer un nouveau compte')).toBeVisible()

    // Étape 3 : nom, prénom, email institutionnel
    const email = `recette.p7.${Date.now()}@oase-test.tg`
    await dialog.getByLabel(/Prénom/).fill('Recette')
    await dialog.getByLabel(/^Nom/).fill('P7-Creation')
    await dialog.getByLabel(/E-mail institutionnel/).fill(email)

    // Étape 4 : rôle « Agent DGBF » via le sélecteur Rôle RBAC
    await selectVuetify(page, dialog, /Rôle RBAC/, 'Agent DGBF')
    // Étape 5 : structure via le sélecteur Structure
    await selectVuetify(page, dialog, /Structure/, 'DGBF')

    // Étape 6 : canaux de notification (SMS en plus des défauts email + in-app)
    await dialog.locator('.v-checkbox', { hasText: 'SMS' }).click()

    // Étape 7 : soumettre — on attend l'appel POST /utilisateurs
    const postResponse = page.waitForResponse(
      (r) => r.url().includes('/api/v1/utilisateurs') && r.request().method() === 'POST',
    )
    await dialog.getByRole('button', { name: /Créer et envoyer l'invitation/i }).click()
    const res = await postResponse
    const payload = await res.text()

    // Attendu : POST /utilisateurs → 201
    expect(
      res.status(),
      `POST /utilisateurs doit répondre 201. Reçu ${res.status()} — payload: ${payload}`,
    ).toBe(201)

    // Attendu : le dialogue se ferme et l'utilisateur apparaît dans le tableau
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('row', { name: new RegExp(email.replace(/[.@]/g, '\\$&')) })).toBeVisible()

    await test.info().attach('console-errors', { body: JSON.stringify(consoleErrors, null, 2) })
  })

  test('TC-P7-02 — désactiver un utilisateur via l’UI (PATCH attendu)', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    const token = await injectAdminSession(page, request)

    // Précondition (API) : créer un utilisateur de test dédié à la désactivation.
    // NB : le formulaire UI étant en échec (cf. TC-P7-01, HTTP 500), la création
    // de ce compte jetable est posée via l'API avec un institutionId valide.
    const email = `recette.desact.${Date.now()}@oase-test.tg`
    const created = await api(request, token).post('/utilisateurs', {
      email, nom: 'Desactivation', prenom: 'RecetteP7', role: 'contribuable', institutionId: 'inst-001',
    })
    expect(created.status(), 'précondition création utilisateur').toBe(201)
    const userId = (await created.json()).id as string

    // Étape 1 : sélectionner l'utilisateur dans /admin/utilisateurs
    await page.goto('/admin/utilisateurs')
    await page.getByLabel(/Rechercher/).first().fill(email)
    const row = page.getByRole('row', { name: /RecetteP7/ })
    await expect(row).toBeVisible()
    await expect(row.getByText('actif')).toBeVisible()

    // Étape 2 : passer le statut actif → inactif via le bouton de la ligne
    const patchUrls: string[] = []
    page.on('request', (r) => {
      if (r.method() === 'PATCH' && r.url().includes('/api/v1/utilisateurs')) patchUrls.push(r.url())
    })
    await row.getByRole('button', { name: 'Désactiver' }).click()

    // L'UI bascule localement la puce de statut
    await expect(row.getByText('inactif')).toBeVisible()
    // Laisse une fenêtre pour un éventuel appel réseau asynchrone
    await page.waitForTimeout(1500)

    // Attendu : PATCH /utilisateurs/:id en 200 → la désactivation est persistée
    const persisted = await api(request, token).get(`/utilisateurs/${userId}`)
    const persistedBody = await persisted.json()
    expect(
      patchUrls.length,
      `Aucun PATCH /utilisateurs/:id émis par l'UI — statut persisté en base : "${persistedBody.statutCode}" (la désactivation n'est que visuelle)`,
    ).toBeGreaterThan(0)

    await test.info().attach('console-errors', { body: JSON.stringify(consoleErrors, null, 2) })
  })

  test('TC-P7-02 (complément API) — inactif ne peut plus se connecter (401) ; dernier admin protégé (409 DERNIER_ADMIN)', async ({ request }) => {
    const adminToken = await apiLogin(request, USERS.p7.email)
    const client = api(request, adminToken)

    // ── Partie 1 : utilisateur inactif → login 401 ──────────────────────────
    const email = `recette.login401.${Date.now()}@oase-test.tg`
    const created = await client.post('/utilisateurs', {
      email, nom: 'LoginInactif', prenom: 'RecetteP7', role: 'contribuable', institutionId: 'inst-001',
    })
    expect(created.status()).toBe(201)
    const { id, tempPassword } = await created.json()

    // Sanity : le compte fraîchement créé peut se connecter
    const loginAvant = await request.post(`${API}/auth/login`, { data: { email, password: tempPassword } })
    expect(loginAvant.status(), 'login avant désactivation').toBe(200)

    const patch = await client.patch(`/utilisateurs/${id}`, { statutCode: 'inactif' })
    expect(patch.status(), 'PATCH /utilisateurs/:id').toBe(200)

    const loginApres = await request.post(`${API}/auth/login`, { data: { email, password: tempPassword } })
    expect(loginApres.status(), 'un utilisateur inactif ne doit plus pouvoir se connecter').toBe(401)

    // ── Partie 2 : dernier administrateur non désactivable (409 DERNIER_ADMIN) ──
    // Précondition : p7 est le SEUL admin_si actif.
    const admins = await client.get('/utilisateurs?role=admin_si&statutCode=actif')
    const adminsBody = await admins.json()
    expect(adminsBody.meta.total, 'précondition : un seul admin_si actif').toBe(1)

    const me = await client.get('/utilisateurs/me')
    const p7id = (await me.json()).id as string

    // Tentative de désactivation du dernier admin (avec son propre token, encore valide).
    // NB : l'id seed de p7 est « user-001 » (non UUID) — le ParseUUIDPipe du contrôleur
    // peut rejeter la requête en 400 avant même d'atteindre le service ; dans tous les
    // cas le 409 DERNIER_ADMIN attendu par le plan n'existe pas (aucun garde-fou dans
    // UtilisateursService.modifier, oase-api/src/utilisateurs/utilisateurs.service.ts:108).
    const res = await client.patch(`/utilisateurs/${p7id}`, { statutCode: 'inactif' })
    const body = await res.text()

    if (res.status() === 200) {
      // Filet de sécurité : réactivation immédiate de p7 via la base (script d'asset).
      execSync('node ../maquette/e2e/recette/assets/restore-p7.cjs', { cwd: 'oase-api', stdio: 'pipe' })
      const relog = await request.post(`${API}/auth/login`, {
        data: { email: USERS.p7.email, password: 'Oase@2026!' },
      })
      expect(relog.status(), 'restauration p7 après test').toBe(200)
    }

    expect(
      res.status(),
      `La désactivation du dernier admin doit être refusée avec 409 DERNIER_ADMIN. Reçu ${res.status()} — payload: ${body}`,
    ).toBe(409)
    expect(body).toContain('DERNIER_ADMIN')
  })

  test('TC-P7-03 — réinitialisation MFA / PIN d’un utilisateur via l’UI', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    await injectAdminSession(page, request)

    await page.goto('/admin/utilisateurs')
    // Ouvrir la fiche détail du premier utilisateur actif du tableau
    await page.getByRole('row').nth(1).click()
    await expect(page.getByText('Profil de permissions')).toBeVisible()
    await expect(page.getByText('Canaux de notification')).toBeVisible()

    // Attendu (plan §9 TC-P7-03) : boutons « Réinitialiser MFA » / « Réinitialiser PIN »
    const resetButtons = page.getByRole('button', { name: /Réinitialiser (MFA|PIN)/i })
    await page.waitForTimeout(500) // laisse le rendu se stabiliser
    expect(
      await resetButtons.count(),
      'Aucun bouton « Réinitialiser MFA » / « Réinitialiser PIN » dans la fiche utilisateur ' +
        '(les endpoints POST /utilisateurs/:id/reset-mfa et reset-pin existent côté API mais ne sont pas exposés dans l’UI)',
    ).toBeGreaterThan(0)

    await test.info().attach('console-errors', { body: JSON.stringify(consoleErrors, null, 2) })
  })

  test('TC-P7-03 (complément API) — reset-mfa et reset-pin fonctionnels côté backend', async ({ request }) => {
    const adminToken = await apiLogin(request, USERS.p7.email)
    const client = api(request, adminToken)

    const email = `recette.reset.${Date.now()}@oase-test.tg`
    const created = await client.post('/utilisateurs', {
      email, nom: 'ResetMfaPin', prenom: 'RecetteP7', role: 'contribuable', institutionId: 'inst-001',
    })
    expect(created.status()).toBe(201)
    const { id } = await created.json()

    // POST /utilisateurs/:id/reset-mfa → secret + QR code (otpauth URI)
    const resetMfa = await client.post(`/utilisateurs/${id}/reset-mfa`)
    expect(resetMfa.status(), 'reset-mfa').toBe(201)
    const mfaBody = await resetMfa.json()
    expect(mfaBody.mfaQrCodeUri, 'QR code MFA (otpauth URI) retourné').toMatch(/^otpauth:\/\/totp\//)

    // POST /utilisateurs/:id/reset-pin → confirmation
    const resetPin = await client.post(`/utilisateurs/${id}/reset-pin`)
    expect(resetPin.status(), 'reset-pin').toBe(201)
    expect((await resetPin.json()).reset).toBe(true)
  })

  test('TC-P7-04 — configuration des workflows d’exonération (/admin/workflow)', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    await injectAdminSession(page, request)

    // Étape 1 : P7 va sur /admin/workflow
    await page.goto('/admin/workflow')
    await expect(page.getByText('Workflow BPM — Éditeur')).toBeVisible()

    // Étape 2 : templates de circuits par type d'exonération
    for (const type of ['Exonération douanière', 'Exonération IS', 'Exonération TVA', 'Zone Franche', "Convention d'investissement"]) {
      await expect(page.locator('.v-list-item', { hasText: type }).first()).toBeVisible()
    }

    // Étape 3 : étapes du circuit « Exonération douanière » (sélectionné par défaut)
    // — vérification pièces (Instruction OTR), visa DGBF, approbation/signature finale.
    for (const etape of ['Dépôt du dossier', 'Instruction OTR', 'Montant > 50M FCFA ?', 'Visa DGBF', 'Signature Directeur OTR', 'Notification finale contribuable']) {
      await expect(page.locator('.wf-node', { hasText: etape }).first()).toBeVisible()
    }

    // Étape 4 : organes compétents assignés à chaque étape
    for (const acteur of ['Agent OTR Douanes', 'Agent DGBF', 'Directeur OTR']) {
      await expect(page.locator('.wf-node', { hasText: acteur }).first()).toBeVisible()
    }

    // Vérifier l'assignation d'un organe sur l'étape « Visa DGBF » (édition)
    const visaNode = page.locator('.wf-node', { hasText: 'Visa DGBF' }).first()
    await visaNode.locator('.wf-node-header').click()
    const acteurSelect = visaNode.locator('.v-select', { hasText: /Acteur responsable/ })
    await expect(acteurSelect).toBeVisible()
    await acteurSelect.click()
    await page.locator('.v-overlay-container .v-list-item', { hasText: 'Agent DGBF' }).first().click()

    // Étape 5 : sauvegarder → confirmation affichée, version incrémentée
    const apiCalls: string[] = []
    page.on('request', (r) => { if (r.url().includes('/api/v1/')) apiCalls.push(`${r.method()} ${r.url()}`) })
    await page.getByRole('button', { name: /Enregistrer v/ }).click()
    await expect(page.getByText(/Workflow enregistré/)).toBeVisible()
    await expect(page.getByRole('button', { name: /Enregistrer v3\.3/ })).toBeVisible()

    // Observation (rapportée) : aucune persistance API du workflow n'est attendue
    // par le plan au niveau UI, mais on trace les appels pour le rapport.
    await test.info().attach('api-calls-on-save', { body: JSON.stringify(apiCalls, null, 2) })
    await test.info().attach('console-errors', { body: JSON.stringify(consoleErrors, null, 2) })
  })
})
