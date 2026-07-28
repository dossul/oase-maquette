<template>
  <div>
    <v-container style="max-width:1280px" class="py-8">
      <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-6">
        <div>
          <h1 style="font-size:1.6rem;font-weight:700;letter-spacing:-0.02em">Tableaux de bord publics</h1>
          <p class="text-medium-emphasis text-body-2 mt-1">Données agrégées et anonymisées — Source : API publique OASE /rapports/opendata</p>
        </div>
      </div>

      <!-- KPIs publics -->
      <v-row v-if="kpis.length" class="mb-8">
        <v-col v-for="k in kpis" :key="k.label" cols="6" md="3"><KpiCard v-bind="k"/></v-col>
      </v-row>
      <v-alert v-else-if="!loading" type="info" variant="tonal" rounded="lg" density="compact" class="mb-6">
        Les indicateurs agrégés ne sont pas encore publiés.
      </v-alert>

      <!-- Évolution annuelle des montants accordés (réel) -->
      <v-card rounded="lg" elevation="1" class="mb-6">
        <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Évolution annuelle des montants accordés</v-card-title>
        <v-card-text>
          <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
          <div v-for="a in evolutionAnnuelle" :key="a.annee" class="mb-3">
            <div class="d-flex justify-space-between text-caption mb-1">
              <span class="font-weight-medium">{{ a.annee }}</span>
              <span class="font-weight-bold">{{ formatMontantCompact(a.montant) }}</span>
            </div>
            <v-progress-linear :model-value="(a.montant / maxEvolution) * 100" color="primary" rounded height="10"/>
          </div>
          <v-alert v-if="!loading && !evolutionAnnuelle.length" type="info" variant="tonal" rounded="lg" density="compact">
            Aucun montant approuvé publié pour le moment.
          </v-alert>
        </v-card-text>
      </v-card>

      <!-- Montants par type d'impôt (réel) -->
      <v-card rounded="lg" elevation="1" class="mb-6">
        <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Montants accordés par type d'impôt</v-card-title>
        <v-card-text>
          <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
          <div v-for="t in montantsParImpot" :key="t.label" class="mb-3">
            <div class="d-flex justify-space-between text-caption mb-1">
              <span class="font-weight-medium">{{ t.label }}</span>
              <span class="font-weight-bold">{{ formatMontantCompact(t.montant) }} — {{ t.count }} mesure(s)</span>
            </div>
            <v-progress-linear :model-value="(t.montant / maxImpot) * 100" color="primary" rounded height="10"/>
          </div>
          <v-alert v-if="!loading && !montantsParImpot.length" type="info" variant="tonal" rounded="lg" density="compact">
            Aucune mesure publiée pour le moment.
          </v-alert>
          <div class="mt-4 pa-3 rounded-lg text-caption text-medium-emphasis" style="background:rgba(0,0,0,0.04)">
            📝 Source : API OASE /rapports/opendata — montants des demandes approuvées, agrégés et anonymisés.
          </div>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import KpiCard from '../../components/KpiCard.vue'
import { listerMesuresOpenData, formatMontantCompact, type MesureOpenData } from '../../services/rapports'

// Données réelles : mesures publiées + agrégats financiers
// (GET /rapports/opendata — endpoint PUBLIC, accessible sans authentification).
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

const impotsCouverts = computed(() =>
  [...new Set(mesures.value.map((m) => m.version?.impotConcerne).filter((i): i is string => !!i))],
)

const montantTotalAccorde = computed(() =>
  mesures.value.reduce((acc, m) => acc + Number(m.agregats?.montantTotalAccorde ?? 0), 0),
)
const totalApprouvees = computed(() =>
  mesures.value.reduce((acc, m) => acc + (m.agregats?.nombreDemandesApprouvees ?? 0), 0),
)

// KPIs calculés sur données réelles (API publique).
const kpis = computed(() =>
  mesures.value.length
    ? [
        { label: 'Mesures publiées', value: String(mesures.value.length), icon: 'mdi-label-multiple', color: 'primary' },
        { label: 'Impôts concernés', value: String(impotsCouverts.value.length), icon: 'mdi-bank-outline', color: 'info' },
        { label: 'Montant total accordé', value: formatMontantCompact(montantTotalAccorde.value), icon: 'mdi-currency-usd', color: 'success' },
        { label: 'Demandes approuvées', value: String(totalApprouvees.value), icon: 'mdi-check-decagram', color: 'warning' },
      ]
    : [],
)

// Évolution annuelle réelle (somme des montants approuvés par année, toutes mesures).
const evolutionAnnuelle = computed(() => {
  const parAnnee = new Map<number, number>()
  for (const m of mesures.value) {
    for (const a of m.agregats?.montantParAnnee ?? []) {
      parAnnee.set(a.annee, (parAnnee.get(a.annee) ?? 0) + Number(a.montant))
    }
  }
  return [...parAnnee.entries()].sort((a, b) => a[0] - b[0]).map(([annee, montant]) => ({ annee, montant }))
})
const maxEvolution = computed(() => Math.max(1, ...evolutionAnnuelle.value.map((a) => a.montant)))

// Montants réels par type d'impôt.
const montantsParImpot = computed(() =>
  impotsCouverts.value
    .map((impot) => {
      const lignes = mesures.value.filter((m) => m.version?.impotConcerne === impot)
      return {
        label: impot,
        count: lignes.length,
        montant: lignes.reduce((acc, m) => acc + Number(m.agregats?.montantTotalAccorde ?? 0), 0),
      }
    })
    .sort((a, b) => b.montant - a.montant),
)
const maxImpot = computed(() => Math.max(1, ...montantsParImpot.value.map((t) => t.montant)))
</script>
