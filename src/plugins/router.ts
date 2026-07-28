import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getDefaultRouteForRole, isAdminRole, normalizeRole } from '../composables/useDefaultRoute'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Auth
    // OASE [BUG #2] fix : la route racine n'est plus un redirect statique vers /login.
    // Elle est gérée dynamiquement par le `beforeEach` plus bas : si l'utilisateur
    // est authentifié, on redirige vers son dashboard par défaut selon son rôle,
    // sinon vers /login. Auparavant, '/  ' redirigait TOUJOURS vers /login,
    // donc même un utilisateur connecté retombait sur la page de login.
    { path: '/', component: { template: '<div></div>' } },
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
    {
      path: '/demo',
      component: () => import('../views/auth/DemoView.vue'),
      meta: { layout: 'public', demoOnly: true },
    },
    { path: '/mobile/mvp', component: () => import('../views/mobile/MobileMvpView.vue'), meta: { layout: 'app', persona: 'Projection mobile OASE' } },

    // Portail Contribuable — Persona 1
    { path: '/portail/dashboard', component: () => import('../views/portail/DashboardView.vue'), meta: { layout: 'app', persona: 'P1 — Contribuable', role: 'contribuable' } },
    { path: '/portail/nouvelle-demande', component: () => import('../views/portail/NewDemandeView.vue'), meta: { layout: 'app', persona: 'P1 — Contribuable', role: 'contribuable' } },
    { path: '/portail/demandes', component: () => import('../views/portail/MesDemandesView.vue'), meta: { layout: 'app', persona: 'P1 — Contribuable', role: 'contribuable' } },
    { path: '/portail/demandes/:id', component: () => import('../views/portail/DemandeDetailView.vue'), meta: { layout: 'app', persona: 'P1 — Contribuable', role: 'contribuable' } },
    { path: '/portail/exonerations-actives', component: () => import('../views/portail/ExonerationsActivesView.vue'), meta: { layout: 'app', persona: 'P1 — Contribuable', role: 'contribuable' } },
    { path: '/portail/profil', component: () => import('../views/portail/ProfilView.vue'), meta: { layout: 'app', persona: 'P1 — Contribuable', role: 'contribuable' } },

    // Back-office Instruction — Persona 2
    // meta.roles : rôles CANONIQUES autorisés (agent_ci/agent_cddi = instruction OTR,
    // agent_dgbf = suivi budgétaire, cohérent avec les menus de AppLayout).
    { path: '/backoffice/dashboard', component: () => import('../views/backoffice/DashboardView.vue'), meta: { layout: 'app', persona: 'P2 — Régie financière', roles: ['agent_ci', 'agent_cddi', 'agent_dgbf'] } },
    { path: '/backoffice/dossiers', component: () => import('../views/backoffice/DossiersView.vue'), meta: { layout: 'app', persona: 'P2 — Régie financière', roles: ['agent_ci', 'agent_cddi', 'agent_dgbf'] } },
    { path: '/backoffice/dossiers/:id/instruction', component: () => import('../views/backoffice/InstructionView.vue'), meta: { layout: 'app', persona: 'P2 — Régie financière', roles: ['agent_ci', 'agent_cddi'] } },
    { path: '/backoffice/dossiers/:id/validation', component: () => import('../views/backoffice/ValidationView.vue'), meta: { layout: 'app', persona: 'P2 — Régie financière', roles: ['agent_ci', 'agent_cddi'] } },
    { path: '/backoffice/controle', component: () => import('../views/backoffice/ControleView.vue'), meta: { layout: 'app', persona: 'P2 — Régie financière', roles: ['agent_ci', 'agent_cddi'] } },
    { path: '/backoffice/budget', component: () => import('../views/backoffice/BudgetView.vue'), meta: { layout: 'app', persona: 'P2 — Régie financière (DGBF)', role: 'agent_dgbf' } },
    { path: '/backoffice/workflow-ci-otr', component: () => import('../views/backoffice/WorkflowCiOtrView.vue'), meta: { layout: 'app', persona: 'P2 — Régie financière', roles: ['agent_ci', 'agent_cddi'] } },
    { path: '/backoffice/workflow-cddi', component: () => import('../views/backoffice/WorkflowCddiView.vue'), meta: { layout: 'app', persona: 'P2 — Régie financière', roles: ['agent_ci', 'agent_cddi'] } },
    { path: '/backoffice/workflow-zone-franche', component: () => import('../views/backoffice/WorkflowZoneFrancheView.vue'), meta: { layout: 'app', persona: 'P2 — Régie financière', roles: ['agent_ci', 'agent_cddi'] } },
    { path: '/backoffice/workflow-code-invest', component: () => import('../views/backoffice/WorkflowCodeInvestView.vue'), meta: { layout: 'app', persona: 'P2 — Régie financière', roles: ['agent_ci', 'agent_cddi'] } },
    { path: '/backoffice/workflow-convention-miniere', component: () => import('../views/backoffice/WorkflowConventionMiniereView.vue'), meta: { layout: 'app', persona: 'P2 — Régie financière', roles: ['agent_ci', 'agent_cddi'] } },

    // Espace Agences — Persona 3
    { path: '/agences/dashboard', component: () => import('../views/agences/DashboardView.vue'), meta: { layout: 'app', persona: 'P3 — Agence de promotion', role: 'agent_agence' } },
    // Instruction des demandes dans le périmètre agence — même flux que P2 (vues mutualisées).
    { path: '/agences/dossiers', component: () => import('../views/backoffice/DossiersView.vue'), meta: { layout: 'app', persona: 'P3 — Agence de promotion', role: 'agent_agence' } },
    { path: '/agences/dossiers/:id/instruction', component: () => import('../views/backoffice/InstructionView.vue'), meta: { layout: 'app', persona: 'P3 — Agence de promotion', role: 'agent_agence' } },
    { path: '/agences/conventions', component: () => import('../views/agences/ConventionsView.vue'), meta: { layout: 'app', persona: 'P3 — Agence de promotion', role: 'agent_agence' } },
    { path: '/agences/agrements', component: () => import('../views/agences/AgrementsView.vue'), meta: { layout: 'app', persona: 'P3 — Agence de promotion', role: 'agent_agence' } },
    { path: '/agences/engagements', component: () => import('../views/agences/EngagementsView.vue'), meta: { layout: 'app', persona: 'P3 — Agence de promotion', role: 'agent_agence' } },

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
    { path: '/ministeres/dashboard', component: () => import('../views/institutions/MinisteresDashboardView.vue'), meta: { layout: 'app', persona: 'P3bis — Ministères sectoriels', role: 'agent_ministere' } },
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
    { path: '/admin/utilisateurs', component: () => import('../views/admin/UtilisateursView.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin_si' } },
    { path: '/admin/roles', component: () => import('../views/admin/RolesView.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin_si' } },
    { path: '/admin/connecteurs', component: () => import('../views/admin/ConnecteursView.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin_si' } },
    { path: '/admin/workflow', component: () => import('../views/admin/WorkflowView.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin_si' } },
    { path: '/admin/formulaires', component: () => import('../views/admin/FormulairesView.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin_si' } },
    { path: '/admin/dictionnaire-o2', component: () => import('../views/admin/DictionnaireO2View.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin_si' } },
    { path: '/admin/gouvernance-donnees', component: () => import('../views/admin/GouvernanceDonneesView.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin_si' } },
    { path: '/admin/requetes-dynamiques', component: () => import('../views/admin/RequetesDynamiquesView.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin_si' } },
    { path: '/admin/ged', component: () => import('../views/admin/GedView.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin_si' } },
    { path: '/admin/publication-open-data', component: () => import('../views/admin/PublicationOpenDataView.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin_si' } },
    { path: '/admin/regles', component: () => import('../views/admin/ReglesView.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin_si' } },
    { path: '/admin/parametres', component: () => import('../views/admin/ParametresView.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin_si' } },
    { path: '/admin/monitoring', component: () => import('../views/admin/MonitoringView.vue'), meta: { layout: 'app', persona: 'P7 — Administrateur système', role: 'admin_si' } },

    // Centre de notifications (transversal)
    { path: '/notifications', component: () => import('../views/NotificationsView.vue'), meta: { layout: 'app', persona: 'Tous' } },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  // OASE [BUG #12] fix : '/mfa' doit être publique — la page de vérification MFA
  // s'affiche AVANT qu'une session existe (le mfa_token temporaire est en sessionStorage,
  // pas d'access_token). Sans cela, le garde rebouclait /mfa → /login et le flux MFA
  // UI était impossible.
  const publicRoutes = ['login', 'reset-password', 'activate', 'opendata', 'mfa']
  const isPublic = publicRoutes.some((r) => to.path.startsWith(`/${r}`)) || to.meta.layout === 'public'

  // Garde-fou : les routes marquées demoOnly ne sont accessibles qu'en mode démo.
  // Double condition (flag + serveur dev Vite) : un build de production ne peut
  // JAMAIS activer le mode démo, même si un .env.local fuit dans le build.
  if (to.meta.demoOnly) {
    const demoEnabled = (import.meta.env.VITE_DEMO_MODE ?? '').toString().toLowerCase().trim()
    const isDemoMode =
      import.meta.env.DEV &&
      (demoEnabled === '1' || demoEnabled === 'true' || demoEnabled === 'yes' || demoEnabled === 'on')
    if (!isDemoMode) {
      return '/login'
    }
  }

  // OASE [BUG #2] fix : la racine '/' est maintenant gérée dynamiquement.
  // - non authentifié → /login
  // - authentifié → dashboard par défaut selon le rôle
  if (to.path === '/') {
    if (!auth.isAuthenticated) return '/login'
    return getDefaultRouteForRole(auth.user?.role)
  }

  if (!isPublic && !auth.isAuthenticated) {
    return '/login'
  }

  // OASE [BUG #5] fix : un admin peut accéder à n'importe quelle route de l'app,
  // même si la meta.role est différente (ex: /portail/dashboard réservé à 'contribuable').
  // Cela permet à l'admin de naviguer dans tous les profils (vue d'ensemble, support, debug).
  //
  // OASE [Recette E2E] : meta.roles (pluriel, rôles canoniques) ou meta.role (legacy).
  // Les rôles sont comparés APRÈS normalisation (agent_otr→agent_ci, admin→admin_si, …).
  // Si le rôle ne correspond pas, on redirige vers SON dashboard par défaut — jamais
  // vers /login — avec une protection anti-boucle : si la cible calculée est déjà la
  // route demandée, on laisse passer (évite "Infinite redirect in navigation guard").
  const allowedRoles =
    (to.meta.roles as string[] | undefined) ??
    (to.meta.role ? [to.meta.role as string] : undefined)
  if (allowedRoles && allowedRoles.length > 0 && !isAdminRole(auth.user?.role)) {
    const userRole = normalizeRole(auth.user?.role)
    const hasAccess = allowedRoles.some((r) => normalizeRole(r) === userRole)
    if (!hasAccess) {
      const target = getDefaultRouteForRole(auth.user?.role)
      // Anti-boucle : la route par défaut du rôle est elle-même interdite
      // (configuration incohérente) → on laisse passer plutôt que boucler.
      if (target === to.path) return true
      return target
    }
  }

  return true
})

export default router
