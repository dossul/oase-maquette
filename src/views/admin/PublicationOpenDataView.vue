<template>
  <div>
    <PageHeader
      title="Publication open data"
      subtitle="Préparation, anonymisation, validation et publication des jeux publics et indicateurs obligatoires"
      icon="mdi-publish"
    >
    </PageHeader>

    <v-alert v-if="loadError" type="error" variant="tonal" rounded="lg" density="compact" class="mb-4">
      {{ loadError }}
    </v-alert>

    <v-row v-if="loading" class="mb-4">
      <v-col v-for="n in 4" :key="n" cols="6" md="3">
        <v-skeleton-loader type="card" rounded="lg"/>
      </v-col>
    </v-row>

    <v-row v-else class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Workflow de publication</v-card-title>
          <!-- Étapes du processus (documentation fonctionnelle — pas un état d'avancement réel) -->
          <v-stepper alt-labels>
            <v-stepper-header>
              <v-stepper-item title="1. Sélection" value="1" />
              <v-stepper-item title="2. Anonymisation" value="2" />
              <v-stepper-item title="3. Validation" value="3" />
              <v-stepper-item title="4. Publication" value="4" />
              <v-stepper-item title="5. Journal" value="5" />
            </v-stepper-header>
          </v-stepper>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">5 indicateurs open data obligatoires</v-card-title>
          <v-data-table :headers="headers" :items="rows" hover>
            <template #item.statut="{ item }">
              <v-chip :color="statusColor(item.statut)" size="x-small" variant="tonal">{{ item.statut }}</v-chip>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Mesures exposées (GET /rapports/opendata)</v-card-title>
          <v-progress-linear v-if="loading" indeterminate color="primary"/>
          <v-list v-else-if="mesures.length" density="compact" class="pa-2">
            <v-list-item
              v-for="m in mesures" :key="m.codeMesure"
              :title="m.codeMesure"
              :subtitle="m.version?.libelle ?? ''"
              prepend-icon="mdi-database-outline"
              rounded="lg"
            />
          </v-list>
          <div v-else class="text-center pa-6 text-medium-emphasis">
            <v-icon icon="mdi-database-off-outline" size="36" class="mb-2 opacity-40"/>
            <div class="text-body-2">Aucune mesure exposée.</div>
          </div>
        </v-card>

        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Matrice de diffusion</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Public" prepend-icon="mdi-earth" />
            <v-list-item title="Interne" prepend-icon="mdi-domain" />
            <v-list-item title="Restreint" prepend-icon="mdi-account-lock-outline" />
            <v-list-item title="Sensible / exclu" prepend-icon="mdi-eye-off-outline" />
          </v-list>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Traçabilité visible</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Version du dataset" prepend-icon="mdi-source-branch" />
            <v-list-item title="Date de publication" prepend-icon="mdi-calendar-check-outline" />
            <v-list-item title="Validateur UPF / admin" prepend-icon="mdi-account-check-outline" />
            <v-list-item title="Règles appliquées" prepend-icon="mdi-filter-cog-outline" />
            <v-list-item title="Journal des diffusions" prepend-icon="mdi-history" />
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import { api } from '../../services/api'

interface MesureOpenData {
  codeMesure: string
  version?: { libelle?: string; impotConcerne?: string | null } | null
}
interface Rapport { id: string; typeRapportCode?: string; periodeAnnee?: number }

const loading = ref(true)
const loadError = ref<string | null>(null)
const mesures = ref<MesureOpenData[]>([])
const rapports = ref<Rapport[]>([])

const kpis = computed(() => [
  { label: 'Mesures exposées', value: mesures.value.length, icon: 'mdi-database-check-outline', color: 'primary', subtitle: 'GET /rapports/opendata' },
  { label: 'Rapports générés', value: rapports.value.length, icon: 'mdi-file-chart-outline', color: 'success', subtitle: 'GET /rapports' },
  // TODO(endpoint): suivi des lots anonymisés / rejets qualité non exposé par l'API v1.
  { label: 'Lots anonymisés', value: '—', icon: 'mdi-incognito', color: 'info', subtitle: 'Non instrumenté' },
  { label: 'Rejets qualité', value: '—', icon: 'mdi-alert-circle-outline', color: 'warning', subtitle: 'Non instrumenté' },
])

const headers = [
  { title: 'Indicateur', key: 'indicateur' },
  { title: 'Jeu source', key: 'source' },
  { title: 'Statut', key: 'statut' },
]

// Les 5 indicateurs obligatoires sont une exigence normative (documentation) ;
// le statut reflète honnêtement la disponibilité réelle des données dans l'API v1.
const rows = computed(() => [
  { indicateur: 'Inventaire ouvert des bases juridiques', source: 'Référentiel juridique', statut: mesures.value.length ? 'Données disponibles' : 'Aucune donnée' },
  { indicateur: 'Mesures actives par impôt / secteur / contribuable', source: 'Registre central', statut: mesures.value.length ? 'Données disponibles' : 'Aucune donnée' },
  { indicateur: 'Montants annuels agrégés par impôt / fonction budgétaire', source: 'Annexe budgetaire', statut: 'Non instrumenté' },
  { indicateur: 'Rapports CONEDEF 2019-2024', source: 'Bibliothèque rapports', statut: 'Non instrumenté' },
  { indicateur: 'Indicateurs de qualité des données', source: 'Gouvernance données', statut: 'Non instrumenté' },
])

const statusColor = (value: string) => ({ 'Données disponibles': 'success', 'Aucune donnée': 'warning', 'Non instrumenté': 'secondary' } as Record<string, string>)[value] || 'secondary'

onMounted(async () => {
  loading.value = true
  loadError.value = null
  try {
    const [m, r] = await Promise.all([
      api<MesureOpenData[]>('/rapports/opendata'),
      api<Rapport[]>('/rapports'),
    ])
    mesures.value = Array.isArray(m) ? m : []
    rapports.value = Array.isArray(r) ? r : []
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Erreur de chargement des données open data'
  } finally {
    loading.value = false
  }
})
</script>
