<template>
  <div>
    <PageHeader
      title="Archives et renouvellements"
      subtitle="Suivi des mesures echues, archivage probant et renouvellements avant cloture"
      icon="mdi-archive-clock"
    >
      <template #actions>
        <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-calendar-alert">Echeances 90 jours</v-btn>
        <v-btn color="primary" size="small" prepend-icon="mdi-archive-arrow-down">Lancer l archivage</v-btn>
      </template>
    </PageHeader>

    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
      <!-- TODO(endpoint): KPIs archives conformes / renouvellements sans compteurs dédiés — masques. -->
    </v-row>

    <v-alert v-if="error" type="error" variant="tonal" rounded="lg" density="compact" class="mb-4">{{ error }}</v-alert>

    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1">
          <v-data-table :headers="headers" :items="archives" :loading="loading" hover no-data-text="Aucune demande archivée pour le moment.">
            <template #item.type="{ item }">
              <v-chip size="x-small" color="primary" variant="tonal">{{ item.type }}</v-chip>
            </template>
            <template #item.statut="{ item }">
              <v-chip :color="statusColor(item.statut)" size="x-small" variant="tonal">{{ item.statut }}</v-chip>
            </template>
            <template #item.actions="{ item }">
              <v-btn size="x-small" variant="tonal" color="primary" class="me-1">{{ item.statut === 'A archiver' ? 'Archiver' : 'Consulter' }}</v-btn>
              <v-btn size="x-small" variant="tonal" color="secondary">{{ item.statut === 'Renouvellement' ? 'Renouveler' : 'Journal' }}</v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Regles visibles dans la maquette</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Archivage automatique a l echeance" prepend-icon="mdi-timer-lock-outline" />
            <v-list-item title="Controle des pieces avant cloture" prepend-icon="mdi-file-check-outline" />
            <v-list-item title="Conservation des references et journaux" prepend-icon="mdi-history" />
            <v-list-item title="Passage actif -> expire -> archive -> renouvele" prepend-icon="mdi-swap-horizontal-bold" />
          </v-list>
        </v-card>

        <!-- TODO(endpoint): lots d'archivage groupés sans endpoint — carte "Lots imminents" masquee. -->
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import { api } from '../../services/api'
import type { DemandeApi } from '../../services/backoffice'
import { STATUT_LABELS, type StatutDemande } from '../../types'

const loading = ref(false)
const error = ref<string | null>(null)
const demandes = ref<DemandeApi[]>([])
const total = ref(0)

onMounted(async () => {
  loading.value = true
  try {
    const res = await api<{ data: DemandeApi[]; meta?: { total?: number } }>('/demandes?statutCode=archive&limit=50')
    demandes.value = res.data
    total.value = res.meta?.total ?? res.data.length
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Impossible de charger les archives.'
  } finally {
    loading.value = false
  }
})

// KPI calculé sur données réelles (GET /demandes?statutCode=archive).
const kpis = computed(() => [
  { label: 'Demandes archivees', value: String(total.value), icon: 'mdi-archive-check', color: 'success', subtitle: 'Source : API /demandes' },
])

const headers = [
  { title: 'Reference', key: 'mesure' },
  { title: 'Contribuable', key: 'contribuable' },
  { title: 'Secteur', key: 'type' },
  { title: 'Depot', key: 'echeance' },
  { title: 'Statut', key: 'statut' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const archives = computed(() =>
  demandes.value.map((d) => ({
    mesure: d.reference,
    contribuable: d.contribuable?.raisonSociale ?? '—',
    type: d.secteur ?? '—',
    echeance: d.dateDepot ? new Date(d.dateDepot).toLocaleDateString('fr-FR') : '—',
    statut: STATUT_LABELS[d.statutCode as StatutDemande] ?? d.statutCode,
  })),
)

const statusColor = (value: string) =>
  ({ Archivee: 'success', Archivé: 'success', Renouvellement: 'warning', 'Suivi phase': 'info', 'A archiver': 'error' } as Record<string, string>)[value] || 'secondary'
</script>
