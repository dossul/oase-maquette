import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Auth
    { path: '/', redirect: '/login' },
    // Persona root redirects
    { path: '/portail', redirect: '/portail/dashboard' },
    { path: '/backoffice', redirect: '/backoffice/dashboard' },
    { path: '/agences', redirect: '/agences/dashboard' },
    { path: '/deciseur', redirect: '/decideur/dashboard' },
    { path: '/decideur', redirect: '/decideur/dashboard' },
    { path: '/tresor', redirect: '/tresor/dashboard' },
    { path: '/ministeres', redirect: '/ministeres/dashboard' },
    { path: '/mae', redirect: '/mae/accords-siege' },
    { path: '/extractif', redirect: '/extractif/dashboard' },
    { path: '/conedef', redirect: '/conedef/dashboard' },
    { path: '/dsi', redirect: '/dsi/dashboard' },
    { path: '/audit', redirect: '/audit/dashboard' },
    { path: '/admin', redirect: '/admin/utilisateurs' },
    { path: '/login', component: () => import('../views/auth/LoginView.vue'), meta: { layout: 'auth' } },
    { path: '/mfa', component: () => import('../views/auth/MfaView.vue'), meta: { layout: 'auth' } },
    { path: '/reset-password', component: () => import('../views/auth/ResetPasswordView.vue'), meta: { layout: 'auth' } },
    { path: '/activate', component: () => import('../views/auth/ActivateView.vue'), meta: { layout: 'auth' } },
    { path: '/mobile/mvp', component: () => import('../views/mobile/MobileMvpView.vue'), meta: { layout: 'app', persona: 'Projection mobile OASE' } },

    // Portail Bénéficiaire — Persona 1
    { path: '/portail/dashboard', component: () => import('../views/portail/DashboardView.vue'), meta: { layout: 'app', persona: 'P1 — Contribuable', role: 'beneficiaire' } },
    { path: '/portail/nouvelle-demande', component: () => import('../views/portail/NewDemandeView.vue'), meta: { layout: 'app', persona: 'P1 — Contribuable', role: 'beneficiaire' } },
    { path: '/portail/demandes/:id', component: () => import('../views/portail/DemandeDetailView.vue'), meta: { layout: 'app', persona: 'P1 — Contribuable', role: 'beneficiaire' } },
    { path: '/portail/exonerations-actives', component: () => import('../views/portail/ExonerationsActivesView.vue'), meta: { layout: 'app', persona: 'P1 — Contribuable', role: 'beneficiaire' } },
    { path: '/portail/profil', component: () => import('../views/portail/ProfilView.vue'), meta: { layout: 'app', persona: 'P1 — Contribuable', role: 'beneficiaire' } },

    // Back-office Instruction — Persona 2
    { path: '/backoffice/dashboard', component: () => import('../views/backoffice/DashboardView.vue'), meta: { layout: 'app', persona: 'P2 — Régie financière', role: 'agent_otr' } },
    { path: '/backoffice/dossiers', component: () => import('../views/backoffice/DossiersView.vue'), meta: { layout: 'app', persona: 'P2 — Régie financière', role: 'agent_otr' } },
    { path: '/backoffice/dossiers/:id/instruction', component: () => import('../views/backoffice/InstructionView.vue'), meta: { layout: 'app', persona: 'P2 — Régie financière', role: 'agent_otr' } },
    { path: '/backoffice/dossiers/:id/validation', component: () => import('../views/backoffice/ValidationView.vue'), meta: { layout: 'app', persona: 'P2 — Régie financière', role: 'agent_otr' } },
    { path: '/backoffice/controle', component: () => import('../views/backoffice/ControleView.vue'), meta: { layout: 'app', persona: 'P2 — Régie financière', role: 'agent_otr' } },
    { path: '/backoffice/budget', component: () => import('../views/backoffice/BudgetView.vue'), meta: { layout: 'app', persona: 'P2 — Régie financière (DGBF)', role: 'agent_dgbf' } },
    { path: '/backoffice/workflow-ci-otr', component: () => import('../views/backoffice/WorkflowCiOtrView.vue'), meta: { layout: 'app', persona: 'P2 — Régie financière', role: 'agent_otr' } },
    { path: '/backoffice/workflow-cddi', component: () => import('../views/backoffice/WorkflowCddiView.vue'), meta: { layout: 'app', persona: 'P2 — Régie financière', role: 'agent_otr' } },
    { path: '/backoffice/workflow-zone-franche', component: () => import('../views/backoffice/WorkflowZoneFrancheView.vue'), meta: { layout: 'app', persona: 'P2 — Régie financière', role: 'agent_otr' } },
    { path: '/backoffice/workflow-code-invest', component: () => import('../views/backoffice/WorkflowCodeInvestView.vue'), meta: { layout: 'app', persona: 'P2 — Régie financière', role: 'agent_otr' } },
    { path: '/backoffice/workflow-convention-miniere', component: () => import('../views/backoffice/WorkflowConventionMiniereView.vue'), meta: { layout: 'app', persona: 'P2 — Régie financière', role: 'agent_otr' } },

    // Espace Agences — Persona 3
    { path: '/agences/dashboard', component: () => import('../views/agences/DashboardView.vue'), meta: { layout: 'app', persona: 'P3 — Agence de promotion', role: 'agence' } },
    { path: '/agences/conventions', component: () => import('../views/agences/ConventionsView.vue'), meta: { layout: 'app', persona: 'P3 — Agence de promotion', role: 'agence' } },
    { path: '/agences/agrements', component: () => import('../views/agences/AgrementsView.vue'), meta: { layout: 'app', persona: 'P3 — Agence de promotion', role: 'agence' } },
    { path: '/agences/engagements', component: () => import('../views/agences/EngagementsView.vue'), meta: { layout: 'app', persona: 'P3 — Agence de promotion', role: 'agence' } },

    // Tableau de bord Décideur — Persona 4
    { path: '/decideur/dashboard', component: () => import('../views/decideur/DashboardView.vue'), meta: { layout: 'app', persona: 'P4 — Décideur (UPF/MEF)', role: 'decideur' } },
    { path: '/decideur/analyse', component: () => import('../views/decideur/AnalyseView.vue'), meta: { layout: 'app', persona: 'P4 — Décideur (UPF/MEF)', role: 'decideur' } },
    { path: '/decideur/rapport-annuel', component: () => import('../views/decideur/RapportAnnuelView.vue'), meta: { layout: 'app', persona: 'P4 — Décideur (UPF/MEF)', role: 'decideur' } },
    { path: '/decideur/simulation', component: () => import('../views/decideur/SimulationView.vue'), meta: { layout: 'app', persona: 'P4 — Décideur (UPF/MEF)', role: 'decideur' } },
    { path: '/decideur/referentiel', component: () => import('../views/decideur/ReferentielView.vue'), meta: { layout: 'app', persona: 'P4 — Décideur (UPF/MEF)', role: 'decideur' } },
    { path: '/decideur/registre-central', component: () => import('../views/decideur/RegistreCentralView.vue'), meta: { layout: 'app', persona: 'P4 — Décideur (UPF/MEF)', role: 'decideur' } },

    // Trésor / GUDEF — Persona complémentaire
    { path: '/tresor/dashboard', component: () => import('../views/tresor/DashboardView.vue'), meta: { layout: 'app', persona: 'P2 — DGTCP / GUDEF', role: 'agent_dgtcp' } },
    { path: '/tresor/rapprochements', component: () => import('../views/tresor/RapprochementsView.vue'), meta: { layout: 'app', persona: 'P2 — DGTCP / GUDEF', role: 'agent_dgtcp' } },
    { path: '/tresor/archives', component: () => import('../views/tresor/ArchivesView.vue'), meta: { layout: 'app', persona: 'P2 — DGTCP / GUDEF', role: 'agent_dgtcp' } },

    // Profils institutionnels complémentaires
    { path: '/ministeres/dashboard', component: () => import('../views/institutions/MinisteresDashboardView.vue'), meta: { layout: 'app', persona: 'P3bis — Ministères sectoriels', role: 'ministere_sectoriel' } },
    { path: '/mae/accords-siege', component: () => import('../views/institutions/AccordsSiegeView.vue'), meta: { layout: 'app', persona: 'P3ter — MAE / Accords de siège', role: 'agent_mae' } },
    { path: '/extractif/dashboard', component: () => import('../views/institutions/ExtractifDashboardView.vue'), meta: { layout: 'app', persona: 'P3quater — DGMG / Extractif', role: 'agent_dgmg' } },
    { path: '/conedef/dashboard', component: () => import('../views/institutions/ConeDefDashboardView.vue'), meta: { layout: 'app', persona: 'P4bis — CONEDEF', role: 'agent_conedef' } },
    { path: '/dsi/dashboard', component: () => import('../views/institutions/DsiMefDashboardView.vue'), meta: { layout: 'app', persona: 'P7bis — DSI / MEF', role: 'agent_dsi_mef' } },

    // Module Audit & Contrôle — Persona 5
    { path: '/audit/dashboard', component: () => import('../views/audit/DashboardView.vue'), meta: { layout: 'app', persona: 'P5 — Organe de contrôle', role: 'auditeur' } },
    { path: '/audit/journal', component: () => import('../views/audit/JournalView.vue'), meta: { layout: 'app', persona: 'P5 — Organe de contrôle', role: 'auditeur' } },
    { path: '/audit/anomalies', component: () => import('../views/audit/AnomaliesView.vue'), meta: { layout: 'app', persona: 'P5 — Organe de contrôle', role: 'auditeur' } },
    { path: '/audit/dossiers', component: () => import('../views/audit/DossiersView.vue'), meta: { layout: 'app', persona: 'P5 — Organe de contrôle', role: 'auditeur' } },
    { path: '/audit/missions', component: () => import('../views/audit/MissionsView.vue'), meta: { layout: 'app', persona: 'P5 — Organe de contrôle', role: 'auditeur' } },

    // Portail Open Data — Persona 6 (public)
    { path: '/opendata', component: () => import('../views/opendata/HomeView.vue'), meta: { layout: 'public' } },
    { path: '/opendata/tableaux-de-bord', component: () => import('../views/opendata/TableauxBordView.vue'), meta: { layout: 'public' } },
    { path: '/opendata/datasets', component: () => import('../views/opendata/DatasetsView.vue'), meta: { layout: 'public' } },
    { path: '/opendata/rapports', component: () => import('../views/opendata/RapportsView.vue'), meta: { layout: 'public' } },

    // Administration système — Persona 7
    { path: '/admin/utilisateurs', component: () => import('../views/admin/UtilisateursView.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin' } },
    { path: '/admin/roles', component: () => import('../views/admin/RolesView.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin' } },
    { path: '/admin/connecteurs', component: () => import('../views/admin/ConnecteursView.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin' } },
    { path: '/admin/workflow', component: () => import('../views/admin/WorkflowView.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin' } },
    { path: '/admin/formulaires', component: () => import('../views/admin/FormulairesView.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin' } },
    { path: '/admin/dictionnaire-o2', component: () => import('../views/admin/DictionnaireO2View.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin' } },
    { path: '/admin/gouvernance-donnees', component: () => import('../views/admin/GouvernanceDonneesView.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin' } },
    { path: '/admin/requetes-dynamiques', component: () => import('../views/admin/RequetesDynamiquesView.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin' } },
    { path: '/admin/ged', component: () => import('../views/admin/GedView.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin' } },
    { path: '/admin/publication-open-data', component: () => import('../views/admin/PublicationOpenDataView.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin' } },
    { path: '/admin/regles', component: () => import('../views/admin/ReglesView.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin' } },
    { path: '/admin/parametres', component: () => import('../views/admin/ParametresView.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin' } },
    { path: '/admin/monitoring', component: () => import('../views/admin/MonitoringView.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin' } },

    // Centre de notifications (transversal)
    { path: '/notifications', component: () => import('../views/NotificationsView.vue'), meta: { layout: 'app', persona: 'Tous' } },
  ],
})

export default router
