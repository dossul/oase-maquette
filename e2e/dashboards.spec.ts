import { test, expect } from '@playwright/test'
import { gotoDashboard, loginAs } from './fixtures/auth'

test.describe('Dashboards P1 / P2 / P3 / P4 / P5 / P7', () => {
  test('P1 — Portail contribuable : KPIs, filtres et liste de demandes', async ({ page }) => {
    await gotoDashboard(page, 'contribuable')
    await expect(page.locator('text=Mon Tableau de bord')).toBeVisible()

    // KPIs
    await expect(page.getByText('Demandes en cours').first()).toBeVisible()
    await expect(page.getByText('Demandes approuvées actives').first()).toBeVisible()
    await expect(page.getByText('Actions requises').first()).toBeVisible()

    // Liste de demandes mockées
    await expect(page.getByText('OASE-2026-0042').first()).toBeVisible()
    await expect(page.getByText('OASE-2026-0039').first()).toBeVisible()

    // Filtre "Actives" (bouton pill — statut canonique 'approuve')
    await page.getByRole('button', { name: 'Actives', exact: true }).click()
    await expect(page.getByText('OASE-2026-0039').first()).toBeVisible()
    await expect(page.getByText('OASE-2026-0042').first()).not.toBeVisible()

    // Bouton nouvelle demande
    await expect(page.locator('[href="/portail/nouvelle-demande"]').first()).toBeVisible()
  })

  test('P2 — Back-office OTR : file de traitement et alertes', async ({ page }) => {
    await gotoDashboard(page, 'agent_ci')
    await expect(page.locator('text=Tableau de bord — Back-office')).toBeVisible()

    // KPI d'attente (libellé réel : "En attente (Soumis / En instruction)")
    await expect(page.getByText(/En attente/).first()).toBeVisible()
    await expect(page.locator('text=File de traitement')).toBeVisible()
    await expect(page.locator('text=Alertes système')).toBeVisible()
    await expect(page.locator('text=Productivité ce mois')).toBeVisible()

    // Dossiers mockés
    await expect(page.locator('text=OASE-2026-0042')).toBeVisible()
  })

  test('P3 — Agence : conventions actives et zones franches', async ({ page }) => {
    await gotoDashboard(page, 'agent_agence')
    await expect(page.locator('text=Tableau de bord Agence')).toBeVisible()

    await expect(page.getByText('Conventions actives').first()).toBeVisible()
    await expect(page.getByText('Zones franches — Togo').first()).toBeVisible()
    await expect(page.getByText('ZFI Lomé').first()).toBeVisible()

    // Conventions mockées (shape réelle : contribuables.raisonSociale)
    await expect(page.getByText('ZFI-2024-012').first()).toBeVisible()
    await expect(page.getByText('LOMÉ TEXTILE ZF SAS').first()).toBeVisible()
  })

  test('P4 — Décideur : KPIs stratégiques, évolution et top secteurs', async ({ page }) => {
    await gotoDashboard(page, 'decideur')
    await expect(page.locator('text=Tableau de bord stratégique')).toBeVisible()

    await expect(page.getByText('Total exonéré').first()).toBeVisible()
    await expect(page.getByText('Exonérations actives').first()).toBeVisible()
    await expect(page.getByText('Contribuables').first()).toBeVisible()

    await expect(page.getByText('Évolution mensuelle').first()).toBeVisible()
    // Libellés réels de la vue actuelle : "Top secteurs (FCFA)" et "Répartition par statut"
    await expect(page.getByText('Top secteurs').first()).toBeVisible()
    await expect(page.getByText('Répartition par statut').first()).toBeVisible()
  })

  test('P5 — Audit : anomalies prioritaires et missions', async ({ page }) => {
    await gotoDashboard(page, 'auditeur')
    await expect(page.getByRole('heading', { name: 'Tableau de bord Audit' })).toBeVisible()

    await expect(page.getByText('Anomalies prioritaires').first()).toBeVisible()
    await expect(page.getByText('Anomalies nouvelles').first()).toBeVisible()
    await expect(page.getByText(/Missions d'audit en cours/i).first()).toBeVisible()

    // Anomalies mockées (shape réelle : demandes.reference / description)
    await expect(page.locator('text=OASE-2025-0075')).toBeVisible()
    await expect(page.locator('text=Dépassement quota de 340%')).toBeVisible()
  })

  test('P7 — Admin : gestion des utilisateurs avec KPIs et tableau', async ({ page }) => {
    await gotoDashboard(page, 'admin_si')
    await expect(page.locator('text=Gestion des utilisateurs')).toBeVisible()

    await expect(page.getByText('Comptes actifs').first()).toBeVisible()
    await expect(page.getByText('Structures').first()).toBeVisible()
    await expect(page.getByText('Rôles actifs').first()).toBeVisible()

    // Tableau des utilisateurs mockés (rôles canoniques : agent_ci → "Agent CI (OTR)")
    await expect(page.getByText('k.abalo@otr.tg').first()).toBeVisible()
    await expect(page.getByText('Agent CI (OTR)').first()).toBeVisible()
  })

  test('P1 — message d\'erreur si le backend des demandes échoue', async ({ page }) => {
    await loginAs(page, 'contribuable')
    await page.route('**/api/v1/demandes', async (route) => {
      await route.fulfill({ status: 500, json: { message: 'Service indisponible' } })
    })
    // Rechargement : la session persiste (localStorage) et la vue relance son fetch → 500.
    await page.reload()

    await expect(page.locator('text=Impossible de charger les demandes')).toBeVisible()
  })

  test('P5 — message d\'erreur si le backend des anomalies échoue', async ({ page }) => {
    await loginAs(page, 'auditeur')
    await page.route('**/api/v1/anomalies', async (route) => {
      await route.fulfill({ status: 500, json: { message: 'Service indisponible' } })
    })
    await page.reload()

    await expect(page.locator('text=Impossible de charger les anomalies')).toBeVisible()
  })

  test('P7 — message d\'erreur si le backend des utilisateurs échoue', async ({ page }) => {
    await loginAs(page, 'admin_si')
    await page.route('**/api/v1/utilisateurs', async (route) => {
      await route.fulfill({ status: 500, json: { message: 'Service indisponible' } })
    })
    await page.reload()

    await expect(page.locator('text=Impossible de charger les utilisateurs')).toBeVisible()
  })
})
