<template>
  <div>
    <PageHeader
      title="Rapportage ITIE"
      :subtitle="`Statistiques du périmètre extractif ${annee} — calculées uniquement depuis les données OASE ; les indicateurs exigeant des sources externes sont déclarés, jamais inventés`"
      icon="mdi-file-compare-outline"
    >
      <template #actions>
        <v-btn color="primary" variant="tonal" size="small" prepend-icon="mdi-download" :loading="exportEnCours" @click="exporter">
          Exporter la déclaration (CSV)
        </v-btn>
        <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-refresh" :loading="loading" @click="charger">Actualiser</v-btn>
      </template>
    </PageHeader>

    <v-alert v-if="error" type="error" variant="tonal" rounded="lg" density="compact" class="mb-4">{{ error }}</v-alert>

    <template v-if="stats">
      <v-row class="mb-4">
        <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
          <KpiCard v-bind="kpi" />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <v-card rounded="lg" elevation="1" class="mb-4">
            <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Production {{ annee }} par substance</v-card-title>
            <v-data-table :headers="headersFlux" :items="lignesProduction" density="compact" no-data-text="Aucune production déclarée cette année." />
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card rounded="lg" elevation="1" class="mb-4">
            <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Exportations {{ annee }} par substance</v-card-title>
            <v-data-table :headers="headersFlux" :items="lignesExportations" density="compact" no-data-text="Aucune exportation déclarée cette année." />
          </v-card>
        </v-col>
      </v-row>

      <v-card rounded="lg" elevation="1" class="mb-4">
        <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Répartition des revenus par entité du périmètre</v-card-title>
        <v-data-table :headers="headersEntites" :items="lignesEntites" :loading="loading" hover no-data-text="Aucune entité dans le périmètre.">
          <template #item.ecart="{ item }">
            <v-chip :color="item.ecartRedevanceFcfa > 0 ? 'error' : 'success'" size="x-small" :variant="item.ecartRedevanceFcfa > 0 ? 'tonal' : 'outlined'">
              {{ item.ecartRedevanceFcfa > 0 ? formatMontant(item.ecartRedevanceFcfa) : 'Aucun' }}
            </v-chip>
          </template>
        </v-data-table>
      </v-card>

      <!-- Indicateurs NON calculables depuis OASE — déclarés honnêtement avec la source manquante -->
      <v-card rounded="lg" elevation="1" color="warning" variant="tonal">
        <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">
          <v-icon start>mdi-source-branch-sync</v-icon>Indicateurs ITIE non calculables depuis OASE
        </v-card-title>
        <v-card-text class="pa-4 pt-0">
          <p class="text-body-2 mb-3">
            Ces indicateurs du cadre ITIE exigent des données externes à la plateforme. Ils ne sont
            <strong>pas</strong> estimés ni remplacés par des valeurs fictives.
          </p>
          <v-list density="compact" bg-color="transparent" class="pa-0">
            <v-list-item v-for="n in stats.nonCalculables" :key="n.indicateur" :title="n.indicateur" :subtitle="`Source requise : ${n.sourceRequise}`" prepend-icon="mdi-database-off-outline" />
          </v-list>
        </v-card-text>
      </v-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import { statistiquesItie, telechargerDeclarationItie, type StatistiquesItieApi } from '../../services/backoffice'

const annee = 2024 // Année de référence du jeu de recette (seed E3)
const loading = ref(false)
const exportEnCours = ref(false)
const error = ref<string | null>(null)
const stats = ref<StatistiquesItieApi | null>(null)

async function charger() {
  loading.value = true
  error.value = null
  try {
    stats.value = await statistiquesItie(annee)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Impossible de charger les statistiques ITIE.'
  } finally {
    loading.value = false
  }
}

async function exporter() {
  exportEnCours.value = true
  error.value = null
  try {
    await telechargerDeclarationItie(annee)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Export impossible.'
  } finally {
    exportEnCours.value = false
  }
}

onMounted(charger)

const formatMontant = (v: number) => `${v.toLocaleString('fr-FR')} FCFA`
const formatVolume = (v: number) => `${v.toLocaleString('fr-FR')} t`

const kpis = computed(() => {
  if (!stats.value) return []
  const c = stats.value.calculees
  return [
    { label: 'Sociétés du périmètre', value: String(c.societesPerimetre), icon: 'mdi-domain', color: 'primary', subtitle: `${c.conventionsActives} conventions actives` },
    { label: 'Permis actifs', value: String(c.permisActifs), icon: 'mdi-map-marker-radius-outline', color: 'secondary', subtitle: 'Répertoire minier' },
    {
      label: 'Redevances recouvrées',
      value: `${c.redevances.tauxRecouvrement} %`,
      icon: 'mdi-cash-check',
      color: c.redevances.tauxRecouvrement >= 100 ? 'success' : 'warning',
      subtitle: `${formatMontant(c.redevances.montantPayeFcfa)} / ${formatMontant(c.redevances.montantDuFcfa)}`,
    },
    {
      label: 'CFLDR versé',
      value: `${c.transfertsCfldr.tauxVersement} %`,
      icon: 'mdi-city-variant-outline',
      color: c.transfertsCfldr.tauxVersement >= 100 ? 'success' : 'warning',
      subtitle: `${formatMontant(c.transfertsCfldr.montantEncaisseFcfa)} / ${formatMontant(c.transfertsCfldr.montantDuFcfa)}`,
    },
  ]
})

const headersFlux = [
  { title: 'Substance', key: 'substance' },
  { title: 'Volume', key: 'volume' },
  { title: 'Valeur', key: 'valeur' },
]

const formaterFlux = (lignes: Array<{ substance: string; volumeT: number; valeurFcfa: number }>) =>
  lignes.map((l) => ({ substance: l.substance, volume: formatVolume(l.volumeT), valeur: formatMontant(l.valeurFcfa) }))
const lignesProduction = computed(() => formaterFlux(stats.value?.calculees.productionParSubstance ?? []))
const lignesExportations = computed(() => formaterFlux(stats.value?.calculees.exportationsParSubstance ?? []))

const headersEntites = [
  { title: 'NIF', key: 'nif' },
  { title: 'Société', key: 'raisonSociale' },
  { title: 'Production', key: 'production' },
  { title: 'Exportations', key: 'exportations' },
  { title: 'Redevance due', key: 'du' },
  { title: 'Redevance payée', key: 'payee' },
  { title: 'Écart', key: 'ecart' },
]

const lignesEntites = computed(() =>
  (stats.value?.calculees.repartitionParEntite ?? []).map((e) => ({
    ...e,
    production: formatVolume(e.volumeProductionT),
    exportations: formatMontant(e.valeurExportationsFcfa),
    du: formatMontant(e.redevanceDuFcfa),
    payee: formatMontant(e.redevancePayeeFcfa),
  })),
)
</script>
