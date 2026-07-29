<template>
  <div>
    <PageHeader
      title="Flux financiers extractifs"
      subtitle="Production, exportations, redevances minières et transferts aux communes (CFLDR 0,75 %) — Annexe 1.1 ITIE feuilles 3 à 6"
      icon="mdi-swap-horizontal-bold"
    >
      <template #actions>
        <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-refresh" :loading="loading" @click="charger">Actualiser</v-btn>
      </template>
    </PageHeader>

    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" variant="tonal" rounded="lg" density="compact" class="mb-4">{{ error }}</v-alert>

    <v-card rounded="lg" elevation="1">
      <v-tabs v-model="onglet" color="primary" class="px-4 pt-2">
        <v-tab value="productions">Production</v-tab>
        <v-tab value="exportations">Exportations</v-tab>
        <v-tab value="redevances">Redevances minières</v-tab>
        <v-tab value="transferts">Transferts communes (CFLDR)</v-tab>
      </v-tabs>
      <v-divider />
      <v-tabs-window v-model="onglet">
        <!-- Feuille 4 : production -->
        <v-tabs-window-item value="productions">
          <v-data-table :headers="headersProductions" :items="lignesProductions" :loading="loading" hover no-data-text="Aucune production déclarée." />
        </v-tabs-window-item>

        <!-- Feuille 3 : exportations -->
        <v-tabs-window-item value="exportations">
          <v-data-table :headers="headersExportations" :items="lignesExportations" :loading="loading" hover no-data-text="Aucune exportation déclarée." />
        </v-tabs-window-item>

        <!-- Feuille 5 : redevances -->
        <v-tabs-window-item value="redevances">
          <v-data-table :headers="headersRedevances" :items="lignesRedevances" :loading="loading" hover no-data-text="Aucune redevance déclarée.">
            <template #item.solde="{ item }">
              <v-chip :color="item.impaye ? 'error' : 'success'" size="x-small" :variant="item.impaye ? 'tonal' : 'outlined'">
                {{ item.impaye ? `Impayé ${formatMontant(item.solde)}` : 'Soldée' }}
              </v-chip>
            </template>
          </v-data-table>
        </v-tabs-window-item>

        <!-- Feuille 6 : transferts communes CFLDR -->
        <v-tabs-window-item value="transferts">
          <v-data-table :headers="headersTransferts" :items="lignesTransferts" :loading="loading" hover no-data-text="Aucun transfert déclaré.">
            <template #item.solde="{ item }">
              <v-chip :color="item.partiel ? 'warning' : 'success'" size="x-small" :variant="item.partiel ? 'tonal' : 'outlined'">
                {{ item.partiel ? `Reste ${formatMontant(item.solde)}` : 'Soldé' }}
              </v-chip>
            </template>
          </v-data-table>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import {
  listerProductions,
  listerExportations,
  listerRedevances,
  listerTransfertsCommunes,
  type ProductionApi,
  type ExportationApi,
  type RedevanceApi,
  type TransfertCommuneApi,
} from '../../services/backoffice'

const loading = ref(false)
const error = ref<string | null>(null)
const onglet = ref('productions')

const productions = ref<ProductionApi[]>([])
const exportations = ref<ExportationApi[]>([])
const redevances = ref<RedevanceApi[]>([])
const transferts = ref<TransfertCommuneApi[]>([])

async function charger() {
  loading.value = true
  error.value = null
  try {
    ;[productions.value, exportations.value, redevances.value, transferts.value] = await Promise.all([
      listerProductions(),
      listerExportations(),
      listerRedevances(),
      listerTransfertsCommunes(),
    ])
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Impossible de charger les flux financiers.'
  } finally {
    loading.value = false
  }
}

onMounted(charger)

const nombre = (v: string | number | null) => (v == null ? 0 : Number(v))
const formatMontant = (v: string | number | null) => (v == null ? '—' : `${nombre(v).toLocaleString('fr-FR')} FCFA`)
const formatVolume = (v: string | number | null) => (v == null ? '—' : `${nombre(v).toLocaleString('fr-FR')} t`)
const formatDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—')
const periode = (annee: number, mois: number) => `${String(mois).padStart(2, '0')}/${annee}`

// KPIs calculés sur données réelles (année la plus récente déclarée)
const kpis = computed(() => {
  const totalRedevanceDu = redevances.value.reduce((s, r) => s + nombre(r.montantDuFcfa), 0)
  const totalRedevancePaye = redevances.value.reduce((s, r) => s + nombre(r.montantPayeFcfa), 0)
  const totalTransfertDu = transferts.value.reduce((s, t) => s + nombre(t.montantDuFcfa), 0)
  const totalTransfertEncaisse = transferts.value.reduce((s, t) => s + nombre(t.montantEncaisseFcfa), 0)
  return [
    { label: 'Lignes de production', value: String(productions.value.length), icon: 'mdi-factory', color: 'primary', subtitle: 'Source : API /flux-extractifs' },
    { label: 'Exportations déclarées', value: String(exportations.value.length), icon: 'mdi-ferry', color: 'secondary', subtitle: 'Toutes substances confondues' },
    {
      label: 'Redevances recouvrées',
      value: totalRedevanceDu > 0 ? `${Math.round((totalRedevancePaye / totalRedevanceDu) * 100)} %` : '—',
      icon: 'mdi-cash-check',
      color: totalRedevancePaye >= totalRedevanceDu ? 'success' : 'warning',
      subtitle: `${formatMontant(totalRedevancePaye)} / ${formatMontant(totalRedevanceDu)}`,
    },
    {
      label: 'CFLDR versé aux communes',
      value: totalTransfertDu > 0 ? `${Math.round((totalTransfertEncaisse / totalTransfertDu) * 100)} %` : '—',
      icon: 'mdi-city-variant-outline',
      color: totalTransfertEncaisse >= totalTransfertDu ? 'success' : 'warning',
      subtitle: `${formatMontant(totalTransfertEncaisse)} / ${formatMontant(totalTransfertDu)}`,
    },
  ]
})

const headersProductions = [
  { title: 'Période', key: 'periode' },
  { title: 'Société', key: 'societe' },
  { title: 'Substance', key: 'substance' },
  { title: 'Produit', key: 'produit' },
  { title: 'Vendu', key: 'vendu' },
  { title: 'Traité', key: 'traite' },
  { title: 'Valeur marchande', key: 'valeur' },
  { title: 'CA', key: 'ca' },
  { title: 'Permis', key: 'permis' },
]
const lignesProductions = computed(() =>
  productions.value.map((p) => ({
    periode: periode(p.annee, p.mois),
    societe: p.contribuables?.raisonSociale ?? '—',
    substance: p.substance,
    produit: formatVolume(p.volumeProduitT),
    vendu: formatVolume(p.volumeVenduT),
    traite: formatVolume(p.volumeTraiteT),
    valeur: formatMontant(p.valeurMarchandeFcfa),
    ca: formatMontant(p.chiffreAffairesFcfa),
    permis: p.permisMiniers?.reference ?? '—',
  })),
)

const headersExportations = [
  { title: 'Période', key: 'periode' },
  { title: 'Société', key: 'societe' },
  { title: 'Substance', key: 'substance' },
  { title: 'Volume', key: 'volume' },
  { title: 'Valeur FCFA', key: 'valeurFcfa' },
  { title: 'Valeur USD', key: 'valeurUsd' },
  { title: 'Destination', key: 'destination' },
]
const lignesExportations = computed(() =>
  exportations.value.map((e) => ({
    periode: periode(e.annee, e.mois),
    societe: e.contribuables?.raisonSociale ?? '—',
    substance: e.substance,
    volume: formatVolume(e.volumeT),
    valeurFcfa: formatMontant(e.valeurFcfa),
    valeurUsd: e.valeurUsd != null ? `${nombre(e.valeurUsd).toLocaleString('fr-FR')} USD` : '—',
    destination: e.destination ?? '—',
  })),
)

const headersRedevances = [
  { title: 'Période', key: 'periode' },
  { title: 'Société', key: 'societe' },
  { title: 'Substance', key: 'substance' },
  { title: 'Assiette', key: 'assiette' },
  { title: 'Taux', key: 'taux' },
  { title: 'Montant dû', key: 'du' },
  { title: 'Payé', key: 'paye' },
  { title: 'Date paiement', key: 'datePaiement' },
  { title: 'Référence', key: 'reference' },
  { title: 'Solde', key: 'solde' },
]
const lignesRedevances = computed(() =>
  redevances.value.map((r) => {
    const solde = nombre(r.montantDuFcfa) - nombre(r.montantPayeFcfa)
    return {
      periode: `T${r.trimestre} ${r.annee}`,
      societe: r.contribuables?.raisonSociale ?? '—',
      substance: r.substance,
      assiette: formatMontant(r.baseAssietteFcfa),
      taux: r.taux != null ? `${r.taux} %` : '—',
      du: formatMontant(r.montantDuFcfa),
      paye: formatMontant(r.montantPayeFcfa),
      datePaiement: formatDate(r.datePaiement),
      reference: r.referencePaiement ?? '—',
      solde,
      impaye: solde > 0,
    }
  }),
)

const headersTransferts = [
  { title: 'Année', key: 'annee' },
  { title: 'Société', key: 'societe' },
  { title: 'Commune', key: 'commune' },
  { title: 'CA annuel', key: 'ca' },
  { title: 'Dû (0,75 %)', key: 'du' },
  { title: 'Encaissé', key: 'encaisse' },
  { title: 'Date', key: 'date' },
  { title: 'Solde', key: 'solde' },
]
const lignesTransferts = computed(() =>
  transferts.value.map((t) => {
    const solde = nombre(t.montantDuFcfa) - nombre(t.montantEncaisseFcfa)
    return {
      annee: t.annee,
      societe: t.contribuables?.raisonSociale ?? '—',
      commune: t.commune,
      ca: formatMontant(t.chiffreAffairesAnnuelFcfa),
      du: formatMontant(t.montantDuFcfa),
      encaisse: formatMontant(t.montantEncaisseFcfa),
      date: formatDate(t.dateEncaissement),
      solde,
      partiel: solde > 0,
    }
  }),
)
</script>
