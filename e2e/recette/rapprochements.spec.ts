import { test, expect } from '@playwright/test'
import { USERS, api, apiLogin, injectSession, watchConsoleErrors } from './helpers'

/**
 * TC-TRESOR-01 — Rapprochements trésor (DGTCP) sur données réelles.
 *
 * Avant : RapprochementsView était une coquille vide (TODO endpoint, boutons morts).
 * Désormais : GET /rapprochements calcule le rapprochement réel demandes approuvées
 * ↔ actes d'attestation (montants, présence) — écarts budgétaires et documentaires.
 */

const DGTCP = 'agent.dgtcp@oase.tg'

test.describe.configure({ mode: 'serial', timeout: 120000 })

test.describe('TC-TRESOR-01 — Rapprochements trésor', () => {
  test('API — données réelles cohérentes + RBAC', async ({ request }) => {
    const dgtcp = await apiLogin(request, DGTCP)
    const res = await api(request, dgtcp).get('/rapprochements')
    expect(res.status()).toBe(200)
    const { data, kpis } = await res.json()

    // Volumes réels : au moins les 30 demandes approuvées du seed
    // (le total croît à chaque recette P4 qui approuve une demande — on vérifie la cohérence, pas un chiffre figé)
    expect(kpis.total).toBeGreaterThanOrEqual(30)
    expect(kpis.reconciles + kpis.enEcart + kpis.aJustifier).toBe(kpis.total)
    expect(data.length).toBe(kpis.total)

    // Cohérence interne : chaque ligne reconcile a un écart nul, chaque a_justifier n'a pas d'attestation
    for (const l of data) {
      if (l.statut === 'reconcile') expect(l.ecart).toBe(0)
      if (l.statut === 'a_justifier') expect(l.montantAtteste).toBe(0)
      if (l.statut === 'en_ecart') expect(l.ecart).not.toBe(0)
    }

    // RBAC : contribuable refusé
    const contribuable = await apiLogin(request, USERS.p1.email)
    expect((await api(request, contribuable).get('/rapprochements')).status()).toBe(403)
  })

  test('UI — KPIs réels, table, filtres et détail', async ({ page, request }) => {
    const consoleErrors = watchConsoleErrors(page)
    await injectSession(page, request, DGTCP)
    await page.goto('/tresor/rapprochements')

    await expect(page.getByRole('heading', { name: /Rapprochements inter-systemes/i })).toBeVisible()

    // KPIs réels
    await expect(page.getByText('Demandes rapprochées')).toBeVisible({ timeout: 15000 })
    await expect(page.getByText('Réconciliées')).toBeVisible()
    await expect(page.getByText('À justifier')).toBeVisible()

    // Lignes réelles du registre
    await expect(page.getByRole('cell', { name: /DEM-2026-/ }).first()).toBeVisible()

    // Filtre réel : uniquement les lignes à justifier
    await page.locator('.v-select').first().click()
    await page.getByRole('option', { name: 'À justifier' }).click()
    const cellulesStatut = page.getByRole('cell', { name: 'À justifier' })
    await expect(cellulesStatut.first()).toBeVisible()
    expect(await cellulesStatut.count()).toBeGreaterThanOrEqual(1)
    // Aucune ligne réconciliée ne doit rester visible
    expect(await page.getByRole('cell', { name: 'Réconcilié', exact: true }).count()).toBe(0)

    // Détail réel d'une ligne
    await page.getByRole('button', { name: 'Détail' }).first().click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText(/Justification attendue/i)).toBeVisible()
    await expect(dialog.getByText(/Montant approuvé/i)).toBeVisible()
    await dialog.getByRole('button', { name: 'Fermer' }).click()
    await expect(dialog).not.toBeVisible()

    // Relancer le rapprochement = recalcul réel
    await page.getByRole('button', { name: /Relancer le rapprochement/i }).click()
    await expect(page.getByRole('cell', { name: /DEM-2026-/ }).first()).toBeVisible()

    const erreursJs = consoleErrors.filter((e) => !e.includes('favicon') && !e.includes('Failed to load resource'))
    expect(erreursJs, 'erreurs JS sur les rapprochements trésor').toEqual([])
  })
})
