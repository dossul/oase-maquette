<template>
  <div>
    <PageHeader
      title="Rapprochements inter-systemes"
      subtitle="Vue DGTCP — cohérence demandes approuvées ↔ actes d'attestation (données réelles OASE)"
      icon="mdi-source-merge"
    >
      <template #actions>
        <v-btn color="primary" size="small" prepend-icon="mdi-refresh" :loading="chargement" @click="charger">
          Relancer le rapprochement
        </v-btn>
      </template>
    </PageHeader>

    <v-alert v-if="erreur" type="error" variant="tonal" rounded="lg" density="compact" class="mb-4">{{ erreur }}</v-alert>

    <!-- KPIs réels (GET /rapprochements) -->
    <v-row class="mb-4">
      <v-col v-for="kpi in kpiCards" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <v-card rounded="lg" elevation="1" class="mb-4">
      <v-card-text class="pa-4">
        <v-row dense>
          <v-col cols="12" md="6">
            <v-text-field v-model="search" label="Recherche référence, contribuable, NIF..." prepend-inner-icon="mdi-magnify" hide-details clearable />
          </v-col>
          <v-col cols="6" md="3">
            <v-select v-model="filterStatut" :items="statuts" label="Statut" hide-details clearable />
          </v-col>
          <v-col cols="6" md="3">
            <v-select v-model="filterImpact" :items="impacts" label="Impact" hide-details clearable />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-4">
      Rapprochement interne OASE : chaque demande <strong>approuvée</strong> est confrontée aux actes d'attestation émis (montants, présence).
      Les rapprochements avec les SI externes (GUDEF, SIGFiP, Sydonia, E-TAX) sont volontairement hors périmètre à cette étape du projet.
    </v-alert>

    <v-card rounded="lg" elevation="1">
      <v-data-table
        :headers="headers"
        :items="filteredRows"
        :search="search"
        :loading="chargement"
        :items-per-page="25"
        hover
        no-data-text="Aucune demande approuvée à rapprocher."
      >
        <template #item.contribuable="{ item }">
          <div class="text-body-2">{{ item.contribuable }}</div>
          <div class="text-caption text-medium-emphasis">NIF {{ item.nif }}</div>
        </template>
        <template #item.montants="{ item }">
          <div class="text-body-2">{{ fmt(item.montantDemande) }}</div>
          <div class="text-caption" :class="item.ecart !== 0 ? 'text-error' : 'text-medium-emphasis'">
            attesté : {{ fmt(item.montantAtteste) }}
          </div>
        </template>
        <template #item.statut="{ item }">
          <v-chip :color="statusColor(item.statut)" size="x-small" variant="tonal">{{ statutLabel(item.statut) }}</v-chip>
        </template>
        <template #item.impact="{ item }">
          <v-chip :color="impactColor(item.impact)" size="x-small" variant="outlined">{{ item.impact }}</v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn size="x-small" variant="tonal" color="primary" @click="openRow(item)">Détail</v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="detailDialog" max-width="860">
      <v-card v-if="selected" rounded="xl">
        <v-card-title class="pa-5">{{ selected.reference }} — {{ selected.contribuable }}</v-card-title>
        <v-card-text class="pa-5 pt-0">
          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="outlined" rounded="lg" class="mb-3">
                <v-card-title class="text-body-2 font-weight-semibold">Lecture de l'écart</v-card-title>
                <v-card-text class="text-body-2">
                  <div class="mb-2"><strong>Flux :</strong> {{ selected.flux }}</div>
                  <div class="mb-2"><strong>Système source :</strong> {{ selected.systeme }}</div>
                  <div class="mb-2"><strong>Montant approuvé :</strong> {{ fmt(selected.montantDemande) }}</div>
                  <div class="mb-2"><strong>Montant attesté :</strong> {{ fmt(selected.montantAtteste) }}</div>
                  <div class="mb-2">
                    <strong>Écart :</strong>
                    <span :class="selected.ecart !== 0 ? 'text-error font-weight-bold' : ''">
                      {{ selected.ecart > 0 ? '+' : '' }}{{ fmt(selected.ecart) }}
                    </span>
                  </div>
                  <div class="mb-2"><strong>Décision d'approbation :</strong> {{ selected.dateDecision ? new Date(selected.dateDecision).toLocaleDateString('fr-FR') : '—' }}</div>
                  <div><strong>Impact :</strong> {{ selected.impact }}</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card variant="outlined" rounded="lg" class="mb-3">
                <v-card-title class="text-body-2 font-weight-semibold">Justification attendue</v-card-title>
                <v-card-text class="text-body-2">{{ selected.justification }}</v-card-text>
              </v-card>
              <v-card variant="outlined" rounded="lg">
                <v-card-title class="text-body-2 font-weight-semibold">Actions possibles</v-card-title>
                <v-list density="compact" class="pa-2">
                  <v-list-item title="Consulter la demande et ses pièces (module Instruction)" prepend-icon="mdi-file-search-outline" />
                  <v-list-item title="Vérifier l'acte d'attestation (module Attestations)" prepend-icon="mdi-certificate-outline" />
                  <v-list-item title="Escalader avant clôture budgétaire" prepend-icon="mdi-arrow-up-bold-circle-outline" />
                </v-list>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="detailDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import { ApiError } from '../../services/api'
import {
  listerRapprochements,
  type LigneRapprochement,
  type KpisRapprochement,
  type StatutRapprochement,
} from '../../services/rapprochements'

const search = ref('')
const filterStatut = ref<string | null>(null)
const filterImpact = ref<string | null>(null)
const detailDialog = ref(false)
const selected = ref<LigneRapprochement | null>(null)
const chargement = ref(false)
const erreur = ref('')
const lignes = ref<LigneRapprochement[]>([])
const kpis = ref<KpisRapprochement>({ total: 0, reconciles: 0, enEcart: 0, aJustifier: 0, montantEcarts: 0 })

const charger = async () => {
  chargement.value = true
  erreur.value = ''
  try {
    const res = await listerRapprochements()
    lignes.value = res.data
    kpis.value = res.kpis
  } catch (e) {
    erreur.value = e instanceof ApiError ? e.message : 'Impossible de charger les rapprochements.'
  } finally {
    chargement.value = false
  }
}
onMounted(charger)

const statuts = [
  { title: 'Réconcilié', value: 'reconcile' },
  { title: 'En écart', value: 'en_ecart' },
  { title: 'À justifier', value: 'a_justifier' },
]
const impacts = ['Budgetaire', 'Documentaire']

const headers = [
  { title: 'Référence', key: 'reference' },
  { title: 'Contribuable', key: 'contribuable' },
  { title: 'Montants (approuvé / attesté)', key: 'montants', sortable: false },
  { title: 'Statut', key: 'statut' },
  { title: 'Impact', key: 'impact' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const filteredRows = computed(() =>
  lignes.value.filter((item) => {
    if (filterStatut.value && item.statut !== filterStatut.value) return false
    if (filterImpact.value && item.impact !== filterImpact.value) return false
    return true
  }),
)

const kpiCards = computed(() => [
  { label: 'Demandes rapprochées', value: String(kpis.value.total), icon: 'mdi-source-merge', color: 'primary', subtitle: 'Demandes approuvées' },
  { label: 'Réconciliées', value: String(kpis.value.reconciles), icon: 'mdi-check-decagram-outline', color: 'success', subtitle: 'Montants concordants' },
  { label: 'En écart', value: String(kpis.value.enEcart), icon: 'mdi-alert-circle-outline', color: kpis.value.enEcart > 0 ? 'error' : 'success', subtitle: `${kpis.value.montantEcarts.toLocaleString('fr-FR')} FCFA d'écarts` },
  { label: 'À justifier', value: String(kpis.value.aJustifier), icon: 'mdi-file-document-alert-outline', color: kpis.value.aJustifier > 0 ? 'warning' : 'success', subtitle: 'Attestation manquante' },
])

const openRow = (item: LigneRapprochement) => {
  selected.value = item
  detailDialog.value = true
}

const fmt = (v: number) => `${v.toLocaleString('fr-FR')} FCFA`
const statutLabel = (s: StatutRapprochement) => ({ reconcile: 'Réconcilié', en_ecart: 'En écart', a_justifier: 'À justifier' })[s]
const statusColor = (s: StatutRapprochement) => ({ reconcile: 'success', en_ecart: 'error', a_justifier: 'warning' })[s]
const impactColor = (value: string) => ({ Budgetaire: 'error', Documentaire: 'warning', Pilotage: 'info' } as Record<string, string>)[value] || 'secondary'
</script>
