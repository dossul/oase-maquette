<template>
  <div>
    <!-- Navigation Drawer (Sidebar) -->
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      color="secondary"
      width="260"
      permanent
    >
      <!-- Logo -->
      <div class="d-flex align-center ga-2 px-4 py-4" style="border-bottom:1px solid rgba(255,255,255,0.1)">
        <v-icon icon="mdi-shield-check" color="white" size="24" />
        <div v-if="!rail" class="text-truncate">
          <div style="font-size:1rem;font-weight:700;color:#fff;line-height:1">OASE</div>
          <div style="font-size:0.58rem;color:rgba(255,255,255,0.55);letter-spacing:0.1em;text-transform:uppercase">Suivi des Exonérations</div>
        </div>
      </div>

      <!-- Persona switcher (mock) -->
      <div v-if="!rail" class="px-3 py-2" style="border-bottom:1px solid rgba(255,255,255,0.08)">
        <v-select
          v-model="currentPersona"
          :items="personas"
          item-title="label"
          item-value="value"
          density="compact"
          variant="solo"
          bg-color="rgba(255,255,255,0.08)"
          hide-details
          style="font-size:0.78rem"
          @update:model-value="onPersonaChange"
        />
      </div>

      <!-- Nav items -->
      <v-list nav density="compact" class="py-2" color="white">
        <template v-for="item in currentNavItems" :key="item.to">
          <v-list-item
            :to="item.to"
            :prepend-icon="item.icon"
            :title="item.title"
            rounded="lg"
            active-color="white"
            :active-class="'nav-active-item'"
            style="color:rgba(255,255,255,0.8);margin-bottom:2px"
          />
        </template>
      </v-list>

      <template #append>
        <div style="border-top:1px solid rgba(255,255,255,0.1)" class="pa-2">
          <v-list-item
            prepend-icon="mdi-logout"
            title="Déconnexion"
            to="/login"
            rounded="lg"
            style="color:rgba(255,255,255,0.6)"
            density="compact"
          />
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Top App Bar -->
    <v-app-bar color="surface" elevation="0" height="60" style="border-bottom:1px solid rgba(0,0,0,0.08)">
      <v-btn :icon="rail ? 'mdi-menu' : 'mdi-menu-open'" variant="text" @click="rail = !rail" />

      <!-- Breadcrumb -->
      <v-breadcrumbs :items="breadcrumbs" density="compact" class="pa-0 px-1">
        <template #divider><v-icon size="14" icon="mdi-chevron-right" /></template>
      </v-breadcrumbs>

      <v-spacer />

      <!-- Persona badge -->
      <v-chip v-if="currentPersonaLabel" size="small" color="primary" variant="tonal" class="me-2 d-none d-md-flex">
        {{ currentPersonaLabel }}
      </v-chip>

      <!-- Search -->
      <v-btn icon="mdi-magnify" variant="text" size="small" class="me-1" />

      <!-- Notifications -->
      <v-btn icon variant="text" size="small" class="me-1" @click="$router.push('/notifications')">
        <v-badge :content="unreadCount" color="error" :model-value="unreadCount > 0">
          <v-icon icon="mdi-bell" />
        </v-badge>
      </v-btn>

      <!-- User menu -->
      <v-menu>
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="text" class="me-2">
            <v-avatar size="32" color="primary" class="me-1">
              <span style="font-size:0.75rem;font-weight:600;color:white">{{ userInitials }}</span>
            </v-avatar>
            <span class="d-none d-md-inline text-body-2 text-medium-emphasis">{{ currentUser.prenom }} {{ currentUser.nom }}</span>
            <v-icon icon="mdi-chevron-down" size="16" />
          </v-btn>
        </template>
        <v-list min-width="200" density="compact">
          <v-list-item prepend-icon="mdi-account-circle" title="Mon profil" to="/portail/profil" />
          <v-list-item prepend-icon="mdi-history" title="Historique connexions" />
          <v-divider />
          <v-list-item prepend-icon="mdi-theme-light-dark" title="Basculer le thème" @click="toggleTheme" />
          <v-divider />
          <v-list-item prepend-icon="mdi-logout" title="Déconnexion" to="/login" base-color="error" />
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Main content -->
    <v-main>
      <div style="padding:24px;min-height:calc(100vh - 60px)">
        <slot />
      </div>
    </v-main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTheme } from 'vuetify'
import { mockNotifications } from '../mock/data'
import type { NavItem } from '../types'

const route = useRoute()
const router = useRouter()
const theme = useTheme()
const drawer = ref(true)
const rail = ref(false)

const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? 'oaseLight' : 'oaseDark'
}

const unreadCount = computed(() => mockNotifications.filter(n => !n.lu).length)

interface PersonaOption { label: string; value: string; route: string }

const personas: PersonaOption[] = [
  { label: 'P1 — Contribuable', value: 'beneficiaire', route: '/portail/dashboard' },
  { label: 'P2 — Régie financière (OTR)', value: 'agent_otr', route: '/backoffice/dashboard' },
  { label: 'P2 — DGBF', value: 'agent_dgbf', route: '/backoffice/budget' },
  { label: 'P2 — DGTCP / GUDEF', value: 'agent_dgtcp', route: '/tresor/dashboard' },
  { label: 'P3 — Agence de promotion', value: 'agence', route: '/agences/dashboard' },
  { label: 'P3bis — Ministère sectoriel', value: 'ministere_sectoriel', route: '/ministeres/dashboard' },
  { label: 'P3ter — MAE / Accords de siège', value: 'agent_mae', route: '/mae/accords-siege' },
  { label: 'P3quater — DGMG / Extractif', value: 'agent_dgmg', route: '/extractif/dashboard' },
  { label: 'P4 — Décideur (UPF/MEF)', value: 'decideur', route: '/decideur/dashboard' },
  { label: 'P4bis — CONEDEF', value: 'agent_conedef', route: '/conedef/dashboard' },
  { label: 'P5 — Organe de contrôle', value: 'auditeur', route: '/audit/dashboard' },
  { label: 'P7 — Administrateur système', value: 'admin', route: '/admin/utilisateurs' },
  { label: 'P7bis — DSI / MEF', value: 'agent_dsi_mef', route: '/dsi/dashboard' },
  { label: 'Projection mobile OASE', value: 'mobile_mvp', route: '/mobile/mvp' },
]

const currentPersona = ref('beneficiaire')

const currentPersonaLabel = computed(() => {
  const meta = route.meta.persona as string
  return meta || ''
})

const onPersonaChange = (val: string) => {
  const p = personas.find(p => p.value === val)
  if (p) router.push(p.route)
}

const navByPersona: Record<string, NavItem[]> = {
  beneficiaire: [
    { title: 'Tableau de bord', icon: 'mdi-view-dashboard', to: '/portail/dashboard' },
    { title: 'Nouvelle demande', icon: 'mdi-plus-circle', to: '/portail/nouvelle-demande' },
    { title: 'Mes demandes', icon: 'mdi-file-document-multiple', to: '/portail/demandes/1' },
    { title: 'Exonérations actives', icon: 'mdi-check-decagram', to: '/portail/exonerations-actives' },
    { title: 'Mon profil entreprise', icon: 'mdi-domain', to: '/portail/profil' },
    { title: 'Notifications', icon: 'mdi-bell', to: '/notifications' },
  ],
  agent_otr: [
    { title: 'Tableau de bord', icon: 'mdi-view-dashboard', to: '/backoffice/dashboard' },
    { title: 'File des dossiers', icon: 'mdi-folder-multiple', to: '/backoffice/dossiers' },
    { title: 'Instruction dossier', icon: 'mdi-file-search', to: '/backoffice/dossiers/1/instruction' },
    { title: 'Validation / Signature', icon: 'mdi-file-sign', to: '/backoffice/dossiers/1/validation' },
    { title: 'Workflow CI / OTR', icon: 'mdi-timeline-check', to: '/backoffice/workflow-ci-otr' },
    { title: 'Workflow CDDI / GESTEXO', icon: 'mdi-ferry', to: '/backoffice/workflow-cddi' },
    { title: 'Contrôle a posteriori', icon: 'mdi-clipboard-search', to: '/backoffice/controle' },
    { title: 'Notifications', icon: 'mdi-bell', to: '/notifications' },
  ],
  agent_dgbf: [
    { title: 'Tableau de bord', icon: 'mdi-view-dashboard', to: '/backoffice/dashboard' },
    { title: 'File des dossiers', icon: 'mdi-folder-multiple', to: '/backoffice/dossiers' },
    { title: 'Suivi budgétaire', icon: 'mdi-chart-bar', to: '/backoffice/budget' },
    { title: 'Notifications', icon: 'mdi-bell', to: '/notifications' },
  ],
  agent_dgtcp: [
    { title: 'Tableau de bord Trésor', icon: 'mdi-bank', to: '/tresor/dashboard' },
    { title: 'Rapprochements', icon: 'mdi-source-merge', to: '/tresor/rapprochements' },
    { title: 'Archives & renouvellements', icon: 'mdi-archive-clock', to: '/tresor/archives' },
    { title: 'Notifications', icon: 'mdi-bell', to: '/notifications' },
  ],
  agence: [
    { title: 'Tableau de bord', icon: 'mdi-view-dashboard', to: '/agences/dashboard' },
    { title: 'Gestion des conventions', icon: 'mdi-file-certificate', to: '/agences/conventions' },
    { title: 'Instruction agréments', icon: 'mdi-clipboard-text', to: '/agences/agrements' },
    { title: 'Suivi des engagements', icon: 'mdi-chart-timeline', to: '/agences/engagements' },
    { title: 'Notifications', icon: 'mdi-bell', to: '/notifications' },
  ],
  ministere_sectoriel: [
    { title: 'Tableau de bord', icon: 'mdi-office-building', to: '/ministeres/dashboard' },
    { title: 'Notifications', icon: 'mdi-bell', to: '/notifications' },
  ],
  agent_mae: [
    { title: 'Accords de siège', icon: 'mdi-flag', to: '/mae/accords-siege' },
    { title: 'Notifications', icon: 'mdi-bell', to: '/notifications' },
  ],
  agent_dgmg: [
    { title: 'Tableau de bord extractif', icon: 'mdi-pickaxe', to: '/extractif/dashboard' },
    { title: 'Notifications', icon: 'mdi-bell', to: '/notifications' },
  ],
  decideur: [
    { title: 'Tableau de bord', icon: 'mdi-view-dashboard', to: '/decideur/dashboard' },
    { title: 'Registre central', icon: 'mdi-database-eye', to: '/decideur/registre-central' },
    { title: 'Analyse sectorielle', icon: 'mdi-chart-areaspline', to: '/decideur/analyse' },
    { title: 'Rapport annuel', icon: 'mdi-file-chart', to: '/decideur/rapport-annuel' },
    { title: 'Simulation / Prospective', icon: 'mdi-calculator-variant', to: '/decideur/simulation' },
    { title: 'Référentiel juridique', icon: 'mdi-gavel', to: '/decideur/referentiel' },
    { title: 'Notifications', icon: 'mdi-bell', to: '/notifications' },
  ],
  agent_conedef: [
    { title: 'Tableau de bord CONEDEF', icon: 'mdi-chart-box-outline', to: '/conedef/dashboard' },
    { title: 'Notifications', icon: 'mdi-bell', to: '/notifications' },
  ],
  auditeur: [
    { title: 'Tableau de bord audit', icon: 'mdi-view-dashboard', to: '/audit/dashboard' },
    { title: 'Journal d\'audit', icon: 'mdi-shield-lock', to: '/audit/journal' },
    { title: 'Analyse anomalies', icon: 'mdi-alert-circle', to: '/audit/anomalies' },
    { title: 'Consultation dossiers', icon: 'mdi-eye', to: '/audit/dossiers' },
    { title: 'Missions de contrôle', icon: 'mdi-briefcase-search', to: '/audit/missions' },
    { title: 'Notifications', icon: 'mdi-bell', to: '/notifications' },
  ],
  admin: [
    { title: 'Gestion utilisateurs', icon: 'mdi-account-multiple', to: '/admin/utilisateurs' },
    { title: 'Rôles & habilitations', icon: 'mdi-shield-key', to: '/admin/roles' },
    { title: 'Connecteurs SI', icon: 'mdi-api', to: '/admin/connecteurs' },
    { title: 'Workflow BPM', icon: 'mdi-sitemap', to: '/admin/workflow' },
    { title: 'Formulaires dynamiques', icon: 'mdi-form-select', to: '/admin/formulaires' },
    { title: 'Dictionnaire O2', icon: 'mdi-table-column-plus-after', to: '/admin/dictionnaire-o2' },
    { title: 'Gouvernance données', icon: 'mdi-database-cog', to: '/admin/gouvernance-donnees' },
    { title: 'Requêtes dynamiques', icon: 'mdi-table-search', to: '/admin/requetes-dynamiques' },
    { title: 'GED & signatures', icon: 'mdi-file-cabinet', to: '/admin/ged' },
    { title: 'Publication open data', icon: 'mdi-publish', to: '/admin/publication-open-data' },
    { title: 'Moteur de règles', icon: 'mdi-cog-play', to: '/admin/regles' },
    { title: 'Paramètres & Sécurité', icon: 'mdi-cog', to: '/admin/parametres' },
    { title: 'Monitoring système', icon: 'mdi-monitor-dashboard', to: '/admin/monitoring' },
    { title: 'Notifications', icon: 'mdi-bell', to: '/notifications' },
  ],
  agent_dsi_mef: [
    { title: 'Tableau de bord DSI', icon: 'mdi-server-security', to: '/dsi/dashboard' },
    { title: 'Notifications', icon: 'mdi-bell', to: '/notifications' },
  ],
  mobile_mvp: [
    { title: 'Projection mobile', icon: 'mdi-cellphone', to: '/mobile/mvp' },
    { title: 'Notifications', icon: 'mdi-bell-ring-outline', to: '/notifications' },
    { title: 'Open Data', icon: 'mdi-earth', to: '/opendata' },
  ],
}

const currentNavItems = computed(() => {
  const meta = route.meta.role as string
  if (meta && navByPersona[meta]) return navByPersona[meta]
  // Fallback: detect from current route prefix
  const path = route.path
  if (path.startsWith('/portail')) return navByPersona.beneficiaire
  if (path.startsWith('/backoffice')) return navByPersona.agent_otr
  if (path.startsWith('/tresor')) return navByPersona.agent_dgtcp
  if (path.startsWith('/agences')) return navByPersona.agence
  if (path.startsWith('/ministeres')) return navByPersona.ministere_sectoriel
  if (path.startsWith('/mae')) return navByPersona.agent_mae
  if (path.startsWith('/extractif')) return navByPersona.agent_dgmg
  if (path.startsWith('/decideur')) return navByPersona.decideur
  if (path.startsWith('/conedef')) return navByPersona.agent_conedef
  if (path.startsWith('/audit')) return navByPersona.auditeur
  if (path.startsWith('/dsi')) return navByPersona.agent_dsi_mef
  if (path.startsWith('/mobile')) return navByPersona.mobile_mvp
  if (path.startsWith('/admin')) return navByPersona.admin
  return navByPersona.beneficiaire
})

const currentUser = ref({ prenom: 'Kofi', nom: 'ABALO', role: 'Agent OTR' })
const userInitials = computed(() => `${currentUser.value.prenom[0]}${currentUser.value.nom[0]}`)

const breadcrumbs = computed(() => {
  const parts = route.path.split('/').filter(Boolean)
  const items = [{ title: 'OASE', to: '/' }]
  let path = ''
  for (const part of parts) {
    path += `/${part}`
    items.push({ title: part.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), to: path })
  }
  return items
})
</script>

<style scoped>
:deep(.nav-active-item) {
  background: rgba(255,255,255,0.15) !important;
  border-left: 3px solid white;
}
:deep(.v-list-item--active) {
  background: rgba(255,255,255,0.15) !important;
}
</style>
