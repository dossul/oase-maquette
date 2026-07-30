import { test, expect } from '@playwright/test'
import { USERS, api, apiLogin, injectSession, watchConsoleErrors } from './helpers'

/**
 * TC-ADMIN-01 — Complétude admin : matrice RBAC réelle + dictionnaire O2.
 *
 * Avant : l'onglet « Matrice CRUD » de /admin/roles était une configuration
 * locale éditable mais jamais persistée (faux), les onglets Modules/Profils
 * étaient fictifs, et les boutons du dictionnaire O2 étaient morts.
 * Désormais : GET /admin/rbac/matrice expose la matrice RÉELLE dérivée des
 * @Roles des contrôleurs (même source de vérité que le RbacGuard), affichée
 * en lecture seule ; les exports sont de vrais fichiers téléchargeables.
 */

const ADMIN = USERS.p7.email

test.describe.configure({ mode: 'serial', timeout: 120000 })

test.describe('TC-ADMIN-01 — Matrice RBAC réelle et dictionnaire O2', () => {
  test('API — GET /admin/rbac/matrice reflète les @Roles réels + RBAC', async ({ request }) => {
    const admin = await apiLogin(request, ADMIN)
    const res = await api(request, admin).get('/admin/rbac/matrice')
    expect(res.status()).toBe(200)
    const { roles, entrees } = await res.json()

    // Volume réel : tous les endpoints protégés des 27 contrôleurs du périmètre
    expect(entrees.length).toBeGreaterThanOrEqual(100)
    expect(roles.length).toBeGreaterThanOrEqual(10)

    // La matrice reflète les décorateurs réels (vérifiés aussi par rbac.spec.ts)
    const approuver = entrees.find(
      (e: { http: string; chemin: string }) => e.http === 'POST' && e.chemin === '/demandes/:id/approuver',
    )
    expect(approuver).toBeDefined()
    expect(approuver.roles).toEqual(['decideur', 'admin_si'])

    // Modules récents présents
    expect(entrees.some((e: { http: string; chemin: string }) => e.http === 'POST' && e.chemin === '/accords-siege')).toBe(true)
    expect(entrees.some((e: { chemin: string }) => e.chemin === '/rapprochements')).toBe(true)

    // Aucune route publique dans la matrice, aucun rôle technique
    expect(entrees.some((e: { chemin: string }) => e.chemin.startsWith('/auth'))).toBe(false)
    expect(roles).not.toContain('public')
    expect(roles).not.toContain('system')

    // RBAC du endpoint lui-même : contribuable refusé
    const contribuable = await apiLogin(request, USERS.p1.email)
    expect((await api(request, contribuable).get('/admin/rbac/matrice')).status()).toBe(403)
  })

  test('UI — matrice réelle visible, filtre, export CSV ; fictifs supprimés', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    await injectSession(page, request, ADMIN)
    await page.goto('/admin/roles')

    // Onglets : Matrice RBAC / Affectation / Journal — plus d'onglet Modules ni Profils fictifs
    await expect(page.getByRole('tab', { name: /Matrice RBAC/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Affectation/i })).toBeVisible()
    await expect(page.getByRole('tab', { name: /Journal/i })).toBeVisible()
    expect(await page.getByRole('tab', { name: /Modules/i }).count()).toBe(0)
    expect(await page.getByRole('tab', { name: /Profils/i }).count()).toBe(0)
    // Bouton « Créer un rôle » (mort) supprimé
    expect(await page.getByRole('button', { name: /Créer un rôle/i }).count()).toBe(0)

    // Matrice réelle : endpoints et rôles de l'API
    await expect(page.locator('code.endpoint-path', { hasText: '/demandes/:id/approuver' }).first()).toBeVisible({ timeout: 15000 })
    await expect(page.locator('code.endpoint-path', { hasText: '/admin/rbac/matrice' }).first()).toBeVisible()
    await expect(page.locator('code.endpoint-path', { hasText: '/rapprochements' }).first()).toBeVisible()
    await expect(page.getByText('decideur').first()).toBeVisible()
    await expect(page.getByText('admin_si').first()).toBeVisible()

    // Filtre réel : ne garder que les endpoints /rapprochements
    const champFiltre = page.getByRole('textbox', { name: /Filtrer/i })
    await champFiltre.fill('/rapprochements')
    await expect(page.locator('code.endpoint-path', { hasText: '/rapprochements' }).first()).toBeVisible()
    expect(await page.locator('code.endpoint-path', { hasText: '/demandes/:id/approuver' }).count()).toBe(0)
    await champFiltre.fill('')

    // Export CSV réel de la matrice
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Exporter matrice/i }).click(),
    ])
    expect(download.suggestedFilename()).toMatch(/^matrice_rbac_oase_.*\.csv$/)

    // Onglet Affectation : utilisateurs réels toujours présents
    await page.getByRole('tab', { name: /Affectation/i }).click()
    await expect(page.getByRole('cell', { name: /@/ }).first()).toBeVisible({ timeout: 15000 })

    const erreursJs = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to load resource'))
    expect(erreursJs, 'erreurs JS sur /admin/roles').toEqual([])
  })

  test('UI — dictionnaire O2 : export réel, bouton mort supprimé', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    await injectSession(page, request, ADMIN)
    await page.goto('/admin/dictionnaire-o2')

    await expect(page.getByRole('heading', { name: /Dictionnaire O2/i })).toBeVisible()
    // Contenu normatif visible
    await expect(page.getByRole('cell', { name: 'id_mesure' })).toBeVisible({ timeout: 15000 })
    // Bouton « Valider une version » (mort) supprimé
    expect(await page.getByRole('button', { name: /Valider une version/i }).count()).toBe(0)

    // Export réel du dictionnaire
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Exporter le dictionnaire/i }).click(),
    ])
    expect(download.suggestedFilename()).toMatch(/^dictionnaire_o2_oase_.*\.csv$/)

    const erreursJs = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to load resource'))
    expect(erreursJs, 'erreurs JS sur le dictionnaire O2').toEqual([])
  })
})
