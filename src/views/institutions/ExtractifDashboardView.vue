<template>
  <div>
    <PageHeader
      title="Tableau de bord extractif"
      subtitle="Conventions minieres et petrolieres par phase, rapprochement ITIE et suivi des avantages"
      icon="mdi-pickaxe"
    >
      <template #actions>
        <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-source-merge">Croiser ITIE</v-btn>
        <v-btn color="primary" size="small" prepend-icon="mdi-file-cog-outline">Ouvrir une convention</v-btn>
      </template>
    </PageHeader>

    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
      <!-- TODO(endpoint): phases recherche/exploitation et écarts ITIE sans endpoint — KPIs masques. -->
    </v-row>

    <v-alert v-if="error" type="error" variant="tonal" rounded="lg" density="compact" class="mb-4">{{ error }}</v-alert>

    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Conventions suivies</v-card-title>
          <v-data-table :headers="headers" :items="rows" :loading="loading" hover no-data-text="Aucune convention enregistrée pour le moment.">
            <template #item.statut="{ item }">
              <v-chip :color="statusColor(item.statut)" size="x-small" variant="outlined">{{ item.statut }}</v-chip>
            </template>
          </v-data-table>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Workflow visible par etapes</v-card-title>
          <v-stepper model-value="4" alt-labels>
            <v-stepper-header>
              <v-stepper-item title="Demande permis" value="1" />
              <v-stepper-item title="Negociation" value="2" />
              <v-stepper-item title="Conseil des ministres" value="3" />
              <v-stepper-item title="Ratification / application OTR" value="4" />
              <v-stepper-item title="Suivi DGMG + ITIE" value="5" />
            </v-stepper-header>
          </v-stepper>
        </v-card>

        <!-- TODO(endpoint): lignes O2 par convention (codes additionnels, montants, hashes de pièces)
             sans endpoint probant — carte masquee pour ne pas afficher de références fictives. -->
      </v-col>

      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Controle extractif dans la maquette</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Phases recherche / exploitation / production" prepend-icon="mdi-layers-outline" />
            <v-list-item title="Avantages differencies par phase" prepend-icon="mdi-format-list-bulleted-square" />
            <v-list-item title="Passage Conseil des ministres / AN" prepend-icon="mdi-bank-outline" />
            <v-list-item title="Suivi premier baril / obligations" prepend-icon="mdi-oil" />
            <v-list-item title="Rapprochement avec publications ITIE" prepend-icon="mdi-file-compare-outline" />
          </v-list>
        </v-card>

        <!-- TODO(endpoint): rapprochement ITIE sans endpoint — carte "Ecarts ITIE" masquee. -->

        <v-card rounded="lg" elevation="1" class="mt-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Checklists extractives visibles</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Convention ratifiee et annexes techniques" prepend-icon="mdi-file-certificate-outline" />
            <v-list-item title="Phase recherche / exploitation / production rattachee" prepend-icon="mdi-layers-triple-outline" />
            <v-list-item title="Code additionnel et flux Sydonia rattaches" prepend-icon="mdi-barcode" />
            <v-list-item title="Reference budgetaire, ITIE et suivi DGMG / CONEDEF" prepend-icon="mdi-source-merge" />
            <v-list-item title="Diffusion confidentielle des actes et avantages sensibles" prepend-icon="mdi-eye-lock-outline" />
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
import { listerConventionsReelles, type ConventionApi } from '../../services/backoffice'

const loading = ref(false)
const error = ref<string | null>(null)
const conventions = ref<ConventionApi[]>([])

onMounted(async () => {
  loading.value = true
  try {
    conventions.value = await listerConventionsReelles()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Impossible de charger les conventions.'
  } finally {
    loading.value = false
  }
})

// KPI calculé sur données réelles (GET /conventions). Les KPIs par phase et les écarts
// ITIE sont masqués : aucun endpoint ne les expose (TODO backend).
const kpis = computed(() => [
  { label: 'Conventions enregistrees', value: String(conventions.value.length), icon: 'mdi-file-document-outline', color: 'primary', subtitle: 'Source : API /conventions' },
])

const headers = [
  { title: 'Reference', key: 'reference' },
  { title: 'Contribuable', key: 'contribuable' },
  { title: 'Regime', key: 'regime' },
  { title: 'Statut', key: 'statut' },
  { title: 'Echeance', key: 'echeance' },
]

const rows = computed(() =>
  conventions.value.map((c) => ({
    reference: c.reference,
    contribuable: c.contribuables?.raisonSociale ?? '—',
    regime: c.regimeCode,
    statut: c.statutCode,
    echeance: c.dateFin ? new Date(c.dateFin).toLocaleDateString('fr-FR') : '—',
  })),
)

const statusColor = (value: string) =>
  ({ active: 'success', en_attente: 'warning', expiree: 'error' } as Record<string, string>)[value] || 'secondary'
</script>
