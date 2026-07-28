<template>
  <div>
    <v-container style="max-width:1280px" class="py-8">
      <PageHeader title="Jeux de données ouverts" subtitle="Téléchargez les données agrégées et anonymisées en formats ouverts" icon="mdi-database"/>
      <v-card rounded="lg" elevation="1" class="mb-6">
        <v-card-text class="pa-4">
          <v-row dense>
            <v-col cols="12" md="6"><v-text-field v-model="search" label="Rechercher un jeu de données…" prepend-inner-icon="mdi-magnify" hide-details clearable/></v-col>
            <v-col cols="6" md="3"><v-select v-model="filterTheme" :items="themes" label="Thème" hide-details clearable/></v-col>
          </v-row>
        </v-card-text>
        <v-progress-linear v-if="loading" indeterminate color="primary" />
        <v-list class="pa-0">
          <v-list-item v-for="(d, i) in filteredDatasets" :key="d.id" :divider="i<filteredDatasets.length-1" class="px-4 py-4">
            <template #prepend>
              <v-avatar color="primary" size="44" rounded="lg">
                <v-icon icon="mdi-database" color="white" size="22"/>
              </v-avatar>
            </template>
            <template #title><span class="font-weight-semibold text-body-2">{{ d.titre }}</span></template>
            <template #subtitle>
              <div class="text-caption mt-1">{{ d.description }}</div>
              <div class="d-flex align-center ga-2 mt-1">
                <v-chip size="x-small" variant="outlined">{{ d.lignes }} enregistrements</v-chip>
                <v-chip size="x-small" color="success" variant="tonal">{{ d.statut }}</v-chip>
              </div>
            </template>
            <template #append>
              <div class="d-flex ga-1">
                <v-btn size="x-small" color="info" variant="tonal" @click="telechargerJson">JSON</v-btn>
              </div>
            </template>
          </v-list-item>
        </v-list>
        <v-card-text v-if="!loading && !filteredDatasets.length" class="pa-4">
          <v-alert type="info" variant="tonal" rounded="lg" density="compact">
            Aucun jeu de données publié pour le moment.
          </v-alert>
        </v-card-text>
      </v-card>

      <v-row class="mb-6">
        <v-col cols="12" md="7">
          <v-card rounded="lg" elevation="1" class="h-100">
            <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Workflow public de publication</v-card-title>
            <v-card-text class="pa-4">
              <v-stepper model-value="4" alt-labels>
                <v-stepper-header>
                  <v-stepper-item title="1. Sélection" value="1" />
                  <v-stepper-item title="2. Anonymisation" value="2" />
                  <v-stepper-item title="3. Validation" value="3" />
                  <v-stepper-item title="4. Publication" value="4" />
                  <v-stepper-item title="5. Journal" value="5" />
                </v-stepper-header>
              </v-stepper>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="5">
          <v-card rounded="lg" elevation="1" class="h-100">
            <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Garanties de diffusion</v-card-title>
            <v-list density="compact" class="pa-2">
              <v-list-item title="Anonymisation obligatoire" subtitle="Aucune donnee nominative publiee" prepend-icon="mdi-incognito" />
              <v-list-item title="Versionnement dataset" subtitle="Historique des lots de diffusion" prepend-icon="mdi-source-branch" />
              <v-list-item title="Validation avant publication" subtitle="UPF / administration" prepend-icon="mdi-check-decagram-outline" />
              <v-list-item title="Journal de diffusion" subtitle="Preuve et traçabilite des publications" prepend-icon="mdi-history" />
            </v-list>
          </v-card>
        </v-col>
      </v-row>

      <!-- Conditions utilisation -->
      <v-card rounded="lg" elevation="1" class="mb-6">
        <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Conditions d'utilisation</v-card-title>
        <v-card-text class="pa-4">
          <v-row>
            <v-col cols="12" md="8">
              <div class="text-body-2 text-medium-emphasis">
                Ces données sont publiées sous <strong>Licence Ouverte v2.0</strong>. Vous êtes libre de les réutiliser, les redistribuer et les adapter à condition de mentionner la source.
              </div>
              <v-chip color="success" variant="tonal" size="small" class="mt-3" prepend-icon="mdi-creative-commons">Licence Ouverte v2.0 — MEF Togo / OASE</v-chip>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- TODO(endpoint): métadonnées de provenance/qualité par jeu sans endpoint — carte masquee. -->

      <!-- Swagger API -->
      <v-card rounded="lg" elevation="1">
        <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center ga-2">
          <v-icon icon="mdi-api" color="primary" size="20"/>
          API REST — Documentation développeurs
        </v-card-title>
        <v-card-text class="pa-4">
          <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-4">
            L'API OASE expose les mesures d'exonération publiables. L'accès requiert actuellement une session authentifiée ; l'ouverture anonyme est en préparation.
          </v-alert>
          <div class="pa-4 rounded-lg mb-4" style="background:#1E293B;font-family:monospace;font-size:0.8rem;color:#E2E8F0">
            <span style="color:#94A3B8">GET</span> <span style="color:#38BDF8">/api/v1/rapports/opendata</span><br/>
            <span style="color:#94A3B8">GET</span> <span style="color:#38BDF8">/api/v1/rapports</span>
          </div>
          <v-expansion-panels v-if="echantillon" variant="accordion">
            <v-expansion-panel title="Extrait réel — GET /api/v1/rapports/opendata (premier enregistrement)">
              <template #text>
                <div class="pa-3 rounded-lg" style="background:#1E293B;font-family:monospace;font-size:0.75rem;color:#E2E8F0;white-space:pre-wrap">{{ echantillon }}</div>
              </template>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import { listerMesuresOpenData, type MesureOpenData } from '../../services/rapports'

const search = ref('')
const filterTheme = ref(null)
const themes = ['Mesures d\'exonération']

// Jeu de données réel : mesures d'exonération publiées (GET /rapports/opendata).
const loading = ref(false)
const mesures = ref<MesureOpenData[]>([])

onMounted(async () => {
  loading.value = true
  try {
    mesures.value = await listerMesuresOpenData()
  } catch {
    mesures.value = []
  } finally {
    loading.value = false
  }
})

const datasets = computed(() =>
  mesures.value.length
    ? [
        {
          id: 1,
          titre: 'Mesures d\'exonération publiées',
          description: 'Codes mesure et bases juridiques associées — données réelles issues du registre OASE',
          lignes: String(mesures.value.length),
          theme: 'Mesures d\'exonération',
          statut: 'Publié',
        },
      ]
    : [],
)

const filteredDatasets = computed(() => datasets.value.filter(d => {
  if (filterTheme.value && d.theme !== filterTheme.value) return false
  if (search.value && !d.titre.toLowerCase().includes(search.value.toLowerCase())) return false
  return true
}))

/** Téléchargement JSON du jeu réel (généré côté client à partir des données API). */
function telechargerJson() {
  const blob = new Blob([JSON.stringify(mesures.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'oase-mesures-exoneration-publiees.json'
  a.click()
  URL.revokeObjectURL(url)
}

const echantillon = computed(() => (mesures.value.length ? JSON.stringify(mesures.value[0], null, 2) : null))
</script>
