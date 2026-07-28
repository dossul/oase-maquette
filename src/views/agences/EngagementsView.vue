<template>
  <div>
    <PageHeader title="Suivi des engagements" subtitle="Vérification du respect des obligations contractuelles des contribuables" icon="mdi-chart-timeline"/>
    <AlertBanner
      v-if="conventionsEnDefaut.length > 0"
      type="error"
      :title="`${conventionsEnDefaut.length} entreprise(s) en défaut d'engagements`"
      :text="`${conventionsEnDefaut.map(c => c.contribuable).join(', ')} : emplois créés inférieurs aux emplois engagés.`"
    />
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
    <v-alert v-if="loadError" type="error" variant="tonal" density="compact" class="mb-4">{{ loadError }}</v-alert>
    <v-card rounded="lg" elevation="1" class="mb-4">
      <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Tableau de bord des engagements par convention</v-card-title>
      <v-card-text class="pa-4">
        <div v-if="!loading && engagements.length === 0 && !loadError" class="text-center pa-8 text-medium-emphasis">
          <v-icon icon="mdi-file-certificate-outline" size="48" class="mb-3 opacity-30"/>
          <div class="text-body-2">Aucune convention enregistrée pour le moment.</div>
        </div>
        <div v-for="conv in engagements" :key="conv.id" class="mb-6">
          <div class="d-flex align-center justify-space-between mb-2">
            <div>
              <span class="font-weight-semibold text-body-2">{{ conv.reference }}</span>
              <span class="text-caption text-medium-emphasis ms-2">— {{ conv.contribuable }}</span>
            </div>
            <v-chip :color="conv.alerte?'error':'success'" size="x-small" variant="tonal">{{ conv.alerte?'Défaut':'Conforme' }}</v-chip>
          </div>
          <v-row dense>
            <v-col cols="12" sm="6">
              <div class="d-flex justify-space-between text-caption mb-1">
                <span>Emplois créés</span>
                <span><strong>{{ conv.emploisCrees }}</strong> / {{ conv.emploisEngages }} engagés</span>
              </div>
              <v-progress-linear
                :model-value="conv.emploisEngages > 0 ? (conv.emploisCrees/conv.emploisEngages)*100 : 0"
                :color="conv.emploisCrees<conv.emploisEngages*0.8?'error':'success'"
                rounded height="8"
              />
            </v-col>
            <!-- TODO(endpoint): le suivi des investissements (réalisé vs engagé) n'est pas exposé par GET /conventions — vague B backend -->
          </v-row>
          <div class="d-flex ga-2 mt-2">
            <v-btn size="x-small" variant="tonal" color="primary" prepend-icon="mdi-file-plus">Rapport annuel</v-btn>
            <v-btn v-if="conv.alerte" size="x-small" variant="tonal" color="warning" prepend-icon="mdi-pause">Suspension cond.</v-btn>
            <v-btn v-if="conv.alerte" size="x-small" variant="tonal" color="error" prepend-icon="mdi-close">Résiliation</v-btn>
            <v-btn v-else size="x-small" variant="tonal" color="success" prepend-icon="mdi-check">Maintenir</v-btn>
          </div>
          <v-divider class="mt-4"/>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import AlertBanner from '../../components/AlertBanner.vue'
import { listerConventionsReelles } from '../../services/backoffice'

interface EngagementLigne {
  id: string
  reference: string
  contribuable: string
  emploisCrees: number
  emploisEngages: number
  alerte: boolean
}

const engagements = ref<EngagementLigne[]>([])
const loading = ref(false)
const loadError = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    const data = await listerConventionsReelles()
    engagements.value = data.map((c) => {
      const emploisEngages = c.emploisEngages ?? 0
      const emploisCrees = c.emploisCrees ?? 0
      return {
        id: c.id,
        reference: c.reference,
        contribuable: c.contribuables?.raisonSociale ?? '—',
        emploisCrees,
        emploisEngages,
        // Défaut = emplois créés < emplois engagés (règle métier du lot).
        alerte: emploisEngages > 0 && emploisCrees < emploisEngages,
      }
    })
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Impossible de charger les conventions'
  } finally {
    loading.value = false
  }
})

const conventionsEnDefaut = computed(() => engagements.value.filter(c => c.alerte))
</script>
