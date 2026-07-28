<template>
  <div>
    <PageHeader title="Suivi budgétaire — Dépenses fiscales" subtitle="Suivi des exonérations comme dépenses fiscales (DGBF / LFI)" icon="mdi-chart-bar">
      <template #actions>
        <ExportButton label="Exporter annexe LFI" :formats="[{value:'xlsx',label:'Excel LFI',icon:'mdi-microsoft-excel'},{value:'pdf',label:'PDF',icon:'mdi-file-pdf-box'}]" @export="() => {}" size="small" />
      </template>
    </PageHeader>

    <!-- TODO(endpoint): bannière connecteur SIGFiP masquée — aucun endpoint de statut de synchronisation (vague B backend) -->

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
    <v-alert v-if="loadError" type="warning" variant="tonal" density="compact" class="mb-4">
      {{ loadError }}
    </v-alert>

    <v-row class="mb-4">
      <v-col v-for="k in kpis" :key="k.label" cols="6" md="3"><KpiCard v-bind="k" /></v-col>
    </v-row>

    <!-- TODO(endpoint): comparatif Prévisions LFI vs Réalisations masqué — aucune source de prévisions LFI dans l'API (vague B backend) -->

    <!-- TODO(endpoint): tableau des dépenses fiscales par secteur masqué — la nomenclature LFI sectorielle n'est pas exposée par l'API (vague B backend) -->
    <v-card rounded="lg" elevation="1">
      <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Répartition par impôt (montants accordés réels)</v-card-title>
      <v-data-table :headers="headers" :items="depensesParImpot" hover density="comfortable">
        <template #item.montant="{ item }">
          <span class="font-weight-medium">{{ item.montant }}</span>
        </template>
        <template #no-data>
          <div class="text-center pa-6 text-medium-emphasis text-body-2">
            Aucune donnée disponible (accès au tableau de bord P5 requis).
          </div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import ExportButton from '../../components/ExportButton.vue'
import KpiCard from '../../components/KpiCard.vue'
import { api, ApiError } from '../../services/api'

/** Réponse réelle de GET /dashboards/p5 (montants sérialisés en string). */
interface KpisP5 {
  montantTotalAccorde: string
  montantParImpot: { impot: string; montant: string }[]
  nombreContribuables: number
}

const loading = ref(false)
const loadError = ref<string | null>(null)
const p5 = ref<KpisP5 | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    p5.value = await api<KpisP5>('/dashboards/p5')
  } catch (e) {
    // Ex : rôle agent_dgbf non autorisé sur /dashboards/p5 côté backend actuel.
    loadError.value = e instanceof ApiError && e.status === 403
      ? 'Les indicateurs P5 ne sont pas accessibles avec votre profil (accès décideur/audit requis).'
      : 'Impossible de charger les indicateurs budgétaires'
  } finally {
    loading.value = false
  }
})

function formatMds(montant: string | number): string {
  const mds = Number(montant) / 1e9
  return mds >= 0.01
    ? `${mds.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} Mds`
    : `${Number(montant).toLocaleString('fr-FR')} FCFA`
}

const kpis = computed(() => [
  { label: 'Total dépenses fiscales', value: p5.value ? formatMds(p5.value.montantTotalAccorde) : '—', icon: 'mdi-chart-bar', color: 'primary', subtitle: 'Montants accordés (P5)', to: '/decideur/analyse' },
  // TODO(endpoint): prévisions LFI et taux d'exécution sans source API — masqués (vague B backend)
  { label: 'Prévisions LFI 2026', value: '—', icon: 'mdi-file-chart', color: 'secondary', subtitle: 'Source LFI non raccordée', to: '/decideur/rapport-annuel' },
  { label: 'Taux d\'exécution', value: '—', icon: 'mdi-percent', color: 'info', subtitle: 'Source LFI non raccordée', to: '/backoffice/budget' },
  { label: 'Contribuables bénéficiaires', value: p5.value ? String(p5.value.nombreContribuables) : '—', icon: 'mdi-account-group', color: 'success', subtitle: 'Comptage réel (P5)', to: '/backoffice/dossiers' },
])

const headers = [
  { title: 'Impôt', key: 'impot' },
  { title: 'Montant accordé', key: 'montant' },
]
const depensesParImpot = computed(() =>
  (p5.value?.montantParImpot ?? []).map((l) => ({ impot: l.impot, montant: `${Number(l.montant).toLocaleString('fr-FR')} FCFA` })),
)
</script>
