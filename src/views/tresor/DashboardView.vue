<template>
  <div>
    <PageHeader
      title="Tableau de bord Trésor / GUDEF"
      subtitle="Suivi des rapprochements, remboursements, archives et renouvellements cote DGTCP"
      icon="mdi-bank"
    >
      <template #actions>
        <v-chip color="info" variant="tonal" size="small" prepend-icon="mdi-shield-sync">
          GUDEF + SIGFiP + OASE
        </v-chip>
      </template>
    </PageHeader>

    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
      <!-- TODO(endpoint): écarts GUDEF/OASE et taux de flux certifiés sans endpoint — KPIs masques. -->
    </v-row>

    <v-alert v-if="error" type="warning" variant="tonal" rounded="lg" density="compact" class="mb-4">{{ error }}</v-alert>

    <v-row>
      <v-col cols="12" md="7">
        <!-- TODO(endpoint): flux GUDEF/SIGFiP à régulariser sans endpoint de rapprochement — carte masquee. -->

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Calendrier des echeances d'archivage</v-card-title>
          <v-progress-linear v-if="loading" indeterminate color="primary" class="mx-4" />
          <v-list v-if="deadlines.length" density="comfortable" class="pa-2">
            <v-list-item v-for="deadline in deadlines" :key="deadline.title" :title="deadline.title" :subtitle="deadline.subtitle" rounded="lg">
              <template #prepend><v-avatar :color="deadline.color" size="34" rounded="lg"><v-icon :icon="deadline.icon" color="white" size="18" /></v-avatar></template>
              <template #append><v-chip :color="deadline.color" size="x-small" variant="tonal">{{ deadline.badge }}</v-chip></template>
            </v-list-item>
          </v-list>
          <v-card-text v-else-if="!loading" class="pa-4">
            <v-alert type="info" variant="tonal" rounded="lg" density="compact">
              Aucune échéance de convention à moins de 90 jours.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Visibilite DGTCP a ajouter dans la maquette</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Lecture consolidee des flux GUDEF et SIGFiP" prepend-icon="mdi-database-search" />
            <v-list-item title="Validation des ecarts avant cloture budgetaire" prepend-icon="mdi-stamp" />
            <v-list-item title="Consultation des archives et renouvellements" prepend-icon="mdi-archive-clock" />
            <v-list-item title="Pieces justificatives rattachees aux ecarts" prepend-icon="mdi-file-link-outline" />
            <v-list-item title="Journal des relances vers OTR / DGBF" prepend-icon="mdi-history" />
          </v-list>
        </v-card>

        <!-- TODO(endpoint): synthèse trimestrielle (taux de rapprochement, dossiers archivés, délais)
             sans endpoint — carte masquee. -->
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import { api } from '../../services/api'
import { listerConventionsReelles, type ConventionApi } from '../../services/backoffice'
import { listerRapports } from '../../services/rapports'

const loading = ref(false)
const error = ref<string | null>(null)
const conventions = ref<ConventionApi[]>([])
const totalDemandes = ref<number | null>(null)
const nbRapports = ref<number | null>(null)

onMounted(async () => {
  loading.value = true
  const errors: string[] = []
  try {
    // GET /conventions — accessible au rôle agent_dgtcp (RBAC élargi, vague C backend).
    conventions.value = await listerConventionsReelles()
  } catch {
    errors.push('Conventions non accessibles avec ce profil.')
  }
  try {
    const res = await api<{ data: unknown[]; meta?: { total?: number } }>('/demandes?limit=1')
    totalDemandes.value = res.meta?.total ?? res.data.length
  } catch {
    errors.push('Demandes non accessibles avec ce profil.')
  }
  try {
    // GET /rapports — accessible au rôle agent_dgtcp (RBAC élargi, vague C backend).
    nbRapports.value = (await listerRapports()).length
  } catch {
    errors.push('Rapports non accessibles avec ce profil.')
  }
  error.value = errors.length ? errors.join(' ') : null
  loading.value = false
})

const JOURS_ECHEANCE = 90

/** Échéances réelles : conventions dont la dateFin tombe dans les 90 prochains jours. */
const echeancesProches = computed(() => {
  const now = Date.now()
  const horizon = now + JOURS_ECHEANCE * 24 * 3600 * 1000
  return conventions.value
    .filter((c) => {
      if (!c.dateFin) return false
      const t = new Date(c.dateFin).getTime()
      return t >= now && t <= horizon
    })
    .sort((a, b) => new Date(a.dateFin).getTime() - new Date(b.dateFin).getTime())
})

const kpis = computed(() => [
  { label: 'Echeances < 90 jours', value: String(echeancesProches.value.length), icon: 'mdi-calendar-alert', color: 'warning', subtitle: 'Conventions (API /conventions)', to: '/tresor/archives' },
  { label: 'Conventions suivies', value: String(conventions.value.length), icon: 'mdi-file-document-outline', color: 'primary', subtitle: 'Registre OASE (API /conventions)', to: '/tresor/archives' },
  { label: 'Demandes suivies', value: totalDemandes.value === null ? '—' : String(totalDemandes.value), icon: 'mdi-file-document-outline', color: 'info', subtitle: 'API /demandes', to: '/tresor/archives' },
  { label: 'Rapports disponibles', value: nbRapports.value === null ? '—' : String(nbRapports.value), icon: 'mdi-file-chart', color: 'secondary', subtitle: 'API /rapports' },
])

const deadlines = computed(() =>
  echeancesProches.value.map((c) => {
    const jours = Math.max(0, Math.round((new Date(c.dateFin).getTime() - Date.now()) / (24 * 3600 * 1000)))
    return {
      title: `${c.reference} — ${c.contribuables?.raisonSociale ?? c.regimeCode}`,
      subtitle: `Échéance le ${new Date(c.dateFin).toLocaleDateString('fr-FR')} — à archiver ou reconduire`,
      badge: `J-${jours}`,
      color: jours <= 30 ? 'error' : 'warning',
      icon: 'mdi-calendar-alert',
    }
  }),
)
</script>
