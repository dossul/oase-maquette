<template>
  <div>
    <PageHeader
      title="Tableau de bord CONEDEF"
      subtitle="Cycle d'evaluation des depenses fiscales, revenue forgone et synchronisation avec le rapport annuel"
      icon="mdi-chart-box-outline"
    />

    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" variant="tonal" rounded="lg" density="compact" class="mb-4">{{ error }}</v-alert>

    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Rapports d'evaluation disponibles</v-card-title>
          <v-data-table :headers="headers" :items="reports" :loading="loading" hover no-data-text="Aucun rapport généré pour le moment.">
            <template #item.statut="{ item }">
              <v-chip :color="statusColor(item.statut)" size="x-small" variant="tonal">{{ item.statut }}</v-chip>
            </template>
          </v-data-table>
        </v-card>

        <!-- TODO(endpoint): jauges de cohérence sectorielle sans endpoint — section masquee. -->
      </v-col>

      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Cycle CONEDEF visible</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Collecte OASE / MRD" prepend-icon="mdi-database-arrow-down-outline" />
            <v-list-item title="Qualification revenu forgone" prepend-icon="mdi-calculator-variant-outline" />
            <v-list-item title="Validation UPF / CONEDEF" prepend-icon="mdi-stamp" />
            <v-list-item title="Synchronisation rapport annuel" prepend-icon="mdi-file-sync-outline" />
            <v-list-item title="Publication des rapports 2019-2024" prepend-icon="mdi-publish" />
          </v-list>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Marquage methodologique</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Confirme" prepend-icon="mdi-check-decagram-outline" />
            <v-list-item title="Provisoire" prepend-icon="mdi-timer-sand" />
            <v-list-item title="A confirmer" prepend-icon="mdi-help-circle-outline" />
            <v-list-item title="Non evaluable" prepend-icon="mdi-close-octagon-outline" />
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import { api } from '../../services/api'
import { listerRapports, labelTypeRapport, type RapportApi } from '../../services/rapports'

interface ConventionApi {
  id: string
  reference: string
  statutCode: string
}

const loading = ref(false)
const error = ref<string | null>(null)
const rapports = ref<RapportApi[]>([])
const conventionsActives = ref<number | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    const [r, c] = await Promise.allSettled([listerRapports(), api<ConventionApi[]>('/conventions')])
    if (r.status === 'fulfilled') rapports.value = r.value
    else error.value = r.reason instanceof Error ? r.reason.message : 'Impossible de charger les rapports.'
    // Les conventions ne sont qu'un KPI d'appoint : un échec ne bloque pas le tableau de bord
    if (c.status === 'fulfilled') conventionsActives.value = c.value.filter((cv) => cv.statutCode === 'active').length
  } finally {
    loading.value = false
  }
})

// KPIs calculés sur données réelles (GET /rapports, GET /conventions).
// Les KPIs "mesures évaluables" et "écarts sectoriels" restent masqués : aucun endpoint ne les expose.
const kpis = computed(() => {
  const aboutis = rapports.value.filter((r) => r.statutCode === 'completed').length
  const exercices = [...new Set(rapports.value.map((r) => r.periodeAnnee).filter(Boolean))].sort().reverse()
  const liste = [
    { label: 'Rapports generes', value: String(rapports.value.length), icon: 'mdi-file-chart-outline', color: 'primary', subtitle: `${aboutis} abouti(s) — Source : API /rapports` },
    { label: 'Dernier exercice couvert', value: exercices.length ? String(exercices[0]) : '—', icon: 'mdi-calendar-check-outline', color: 'info', subtitle: `${exercices.length} exercice(s) au total` },
  ]
  if (conventionsActives.value !== null) {
    liste.push({ label: 'Conventions actives', value: String(conventionsActives.value), icon: 'mdi-file-sign', color: 'success', subtitle: 'Source : API /conventions' })
  }
  return liste
})

const headers = [
  { title: 'Rapport', key: 'rapport' },
  { title: 'Periode', key: 'periode' },
  { title: 'Statut', key: 'statut' },
  { title: 'Genere le', key: 'genereLe' },
]

const reports = computed(() =>
  rapports.value.map((r) => ({
    rapport: labelTypeRapport(r.typeRapportCode),
    periode: r.periodeAnnee ? `Exercice ${r.periodeAnnee}${r.periodeMois ? ` — mois ${r.periodeMois}` : ''}` : '—',
    statut: r.statutCode,
    genereLe: r.dateFin ? new Date(r.dateFin).toLocaleDateString('fr-FR') : '—',
  })),
)

const statusColor = (value: string) =>
  ({ completed: 'success', running: 'info', failed: 'error', pending: 'warning' } as Record<string, string>)[value] || 'secondary'
</script>
