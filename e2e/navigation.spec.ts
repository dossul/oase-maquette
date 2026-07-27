import { test, expect } from '@playwright/test'
import { gotoDashboard } from './fixtures/auth'
import type { OaseRole } from './fixtures/mocks'

// [Recette E2E] Rôles CANONIQUES et libellés de menus RÉELS (cf. AppLayout.vue navByPersona).
const navExpectations: { role: OaseRole; url: string; items: string[]; personaLabel: string }[] = [
  { role: 'contribuable', url: '/portail/dashboard', personaLabel: 'P1 — Contribuable', items: ['Tableau de bord', 'Nouvelle demande', 'Mes demandes', 'Exonérations actives', 'Mon profil entreprise'] },
  { role: 'agent_ci', url: '/backoffice/dashboard', personaLabel: 'P2 — Régie financière', items: ['Tableau de bord', 'File des dossiers', 'Instruction dossier', 'Workflow CI / OTR', 'Workflow CDDI / GESTEXO', 'Contrôle a posteriori'] },
  { role: 'agent_agence', url: '/agences/dashboard', personaLabel: 'P3 — Agence de promotion', items: ['Tableau de bord', 'Dossiers à instruire', 'Conventions', 'Instruction agréments', 'Suivi des engagements'] },
  { role: 'decideur', url: '/decideur/dashboard', personaLabel: 'P4 — Décideur (UPF/MEF)', items: ['Tableau de bord', 'Registre central', 'Analyse sectorielle', 'Rapport annuel', 'Simulation / Prospective'] },
  { role: 'auditeur', url: '/audit/dashboard', personaLabel: 'P5 — Organe de contrôle', items: ['Tableau de bord audit', 'Journal d\'audit', 'Analyse anomalies', 'Consultation dossiers', 'Missions de contrôle'] },
  { role: 'admin_si', url: '/admin/utilisateurs', personaLabel: 'P7 — Administrateur système', items: ['Gestion utilisateurs', 'Rôles & habilitations', 'Connecteurs SI', 'Workflow BPM', 'Moteur de règles', 'Paramètres & Sécurité'] },
]

test.describe('Navigation par rôle', () => {
  for (const { role, url, personaLabel, items } of navExpectations) {
    test(`P${role === 'contribuable' ? '1' : role === 'agent_ci' ? '2' : role === 'agent_agence' ? '3' : role === 'decideur' ? '4' : role === 'auditeur' ? '5' : '7'} : menu ${role} affiche les bonnes entrées`, async ({ page }) => {
      await gotoDashboard(page, role)
      await expect(page).toHaveURL(new RegExp(`^.*${url}$`))

      // Le persona badge dans l'app-bar
      await expect(page.locator('.v-app-bar').getByText(new RegExp(personaLabel.replace(/[()]/g, '\\$&')))).toBeVisible()

      // Les items de navigation principaux
      for (const item of items) {
        await expect(page.locator('.v-navigation-drawer').getByRole('link', { name: new RegExp(item, 'i') })).toBeVisible()
      }
    })
  }

  test('le sélecteur de persona expose tous les espaces métiers', async ({ page }) => {
    await gotoDashboard(page, 'agent_ci')
    await expect(page).toHaveURL(/\/backoffice\/dashboard/)

    // Ouvrir le sélecteur de persona dans la sidebar
    const personaSelect = page.locator('.v-navigation-drawer .v-select').locator('visible=true').first()
    await personaSelect.click()

    // Les options P1 à P7 doivent être présentes
    await expect(page.locator('.v-overlay__content').getByText('P1 — Contribuable')).toBeVisible()
    await expect(page.locator('.v-overlay__content').getByText('P4 — Décideur (UPF/MEF)')).toBeVisible()
    await expect(page.locator('.v-overlay__content').getByText('P7 — Administrateur système')).toBeVisible()
  })

  test('les liens du menu redirigent vers les bonnes pages', async ({ page }) => {
    await gotoDashboard(page, 'contribuable')
    await page.locator('.v-navigation-drawer').getByRole('link', { name: /Nouvelle demande/i }).click()
    await expect(page).toHaveURL(/\/portail\/nouvelle-demande/)
  })

  test('déconnexion via la sidebar redirige vers /login', async ({ page }) => {
    await gotoDashboard(page, 'agent_ci')
    await page.locator('.v-navigation-drawer').getByRole('link', { name: /Déconnexion/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})
