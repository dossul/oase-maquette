<template>
  <div>
    <PageHeader
      title="Rapprochements inter-systemes"
      subtitle="Vue DGTCP des ecarts OASE, GUDEF, SIGFiP, Sydonia et E-TAX"
      icon="mdi-source-merge"
    >
      <template #actions>
        <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-filter-check">Filtres avances</v-btn>
        <v-btn color="primary" size="small" prepend-icon="mdi-refresh">Relancer le rapprochement</v-btn>
      </template>
    </PageHeader>

    <v-card rounded="lg" elevation="1" class="mb-4">
      <v-card-text class="pa-4">
        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field v-model="search" label="Recherche flux, mesure, reference..." prepend-inner-icon="mdi-magnify" hide-details clearable />
          </v-col>
          <v-col cols="6" md="2">
            <v-select v-model="filterSysteme" :items="systemes" label="Systeme" hide-details clearable />
          </v-col>
          <v-col cols="6" md="2">
            <v-select v-model="filterStatut" :items="statuts" label="Statut" hide-details clearable />
          </v-col>
          <v-col cols="6" md="2">
            <v-select v-model="filterImpact" :items="impacts" label="Impact" hide-details clearable />
          </v-col>
          <v-col cols="6" md="2">
            <v-select :items="['30 derniers jours', 'Trimestre', 'Campagne 2026']" label="Periode" hide-details />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-4">
      Module de rapprochement inter-systèmes à venir : aucun écart réel n'est encore exposé par l'API (GUDEF, SIGFiP, Sydonia, E-TAX, DAS).
    </v-alert>

    <v-card rounded="lg" elevation="1">
      <!-- TODO(endpoint): GET /rapprochements requis — la table reste vide plutôt que d'afficher des écarts fictifs. -->
      <v-data-table :headers="headers" :items="filteredRows" :search="search" hover no-data-text="Aucun écart de rapprochement à afficher.">
        <template #item.systeme="{ item }">
          <v-chip :color="systemColor(item.systeme)" size="x-small" variant="tonal">{{ item.systeme }}</v-chip>
        </template>
        <template #item.statut="{ item }">
          <v-chip :color="statusColor(item.statut)" size="x-small" variant="tonal">{{ item.statut }}</v-chip>
        </template>
        <template #item.impact="{ item }">
          <v-chip :color="impactColor(item.impact)" size="x-small" variant="outlined">{{ item.impact }}</v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn size="x-small" variant="tonal" color="primary" class="me-1" @click="openRow(item)">Detail</v-btn>
          <v-btn size="x-small" variant="tonal" color="secondary">Justifier</v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="detailDialog" max-width="860">
      <v-card v-if="selected" rounded="xl">
        <v-card-title class="pa-5">{{ selected.flux }}</v-card-title>
        <v-card-text class="pa-5 pt-0">
          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="outlined" rounded="lg" class="mb-3">
                <v-card-title class="text-body-2 font-weight-semibold">Lecture des ecarts</v-card-title>
                <v-card-text class="text-body-2">
                  <div class="mb-2"><strong>Mesure :</strong> {{ selected.mesure }}</div>
                  <div class="mb-2"><strong>Systeme source :</strong> {{ selected.systeme }}</div>
                  <div class="mb-2"><strong>Statut :</strong> {{ selected.statut }}</div>
                  <div><strong>Impact :</strong> {{ selected.impact }}</div>
                </v-card-text>
              </v-card>
              <v-card variant="outlined" rounded="lg">
                <v-card-title class="text-body-2 font-weight-semibold">Justification attendue</v-card-title>
                <v-card-text class="text-body-2">{{ selected.justification }}</v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card variant="outlined" rounded="lg" class="mb-3">
                <v-card-title class="text-body-2 font-weight-semibold">Actions visibles cote maquette</v-card-title>
                <v-list density="compact" class="pa-2">
                  <v-list-item title="Consulter les pieces rattachees" prepend-icon="mdi-file-search-outline" />
                  <v-list-item title="Marquer l'ecart comme justifie" prepend-icon="mdi-check-circle-outline" />
                  <v-list-item title="Relancer la structure contributrice" prepend-icon="mdi-email-fast-outline" />
                  <v-list-item title="Escalader avant cloture budgetaire" prepend-icon="mdi-arrow-up-bold-circle-outline" />
                </v-list>
              </v-card>
              <v-card variant="outlined" rounded="lg">
                <v-card-title class="text-body-2 font-weight-semibold">Historique recent</v-card-title>
                <!-- TODO(endpoint): GET /rapprochements/{id}/historique requis. -->
                <v-card-text class="text-body-2 text-medium-emphasis">Aucun historique disponible.</v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="detailDialog = false">Fermer</v-btn>
          <v-btn color="primary">Ouvrir la fiche mesure</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'

type RapprochementRow = {
  flux: string
  mesure: string
  systeme: string
  statut: string
  impact: string
  justification: string
}

const search = ref('')
const filterSysteme = ref<string | null>(null)
const filterStatut = ref<string | null>(null)
const filterImpact = ref<string | null>(null)
const detailDialog = ref(false)
const selected = ref<RapprochementRow | null>(null)

const systemes = ['GUDEF', 'SIGFiP', 'Sydonia', 'E-TAX', 'DAS']
const statuts = ['Reconcile', 'En ecart', 'A justifier']
const impacts = ['Budgetaire', 'Documentaire', 'Pilotage']

const headers = [
  { title: 'Flux', key: 'flux' },
  { title: 'Mesure', key: 'mesure' },
  { title: 'Systeme', key: 'systeme' },
  { title: 'Statut', key: 'statut' },
  { title: 'Impact', key: 'impact' },
  { title: 'Actions', key: 'actions', sortable: false },
]

// TODO(endpoint): GET /rapprochements requis — aucune ligne réelle disponible.
const rows: RapprochementRow[] = []

const filteredRows = computed(() =>
  rows.filter((item) => {
    if (filterSysteme.value && item.systeme !== filterSysteme.value) return false
    if (filterStatut.value && item.statut !== filterStatut.value) return false
    if (filterImpact.value && item.impact !== filterImpact.value) return false
    return true
  }),
)

const openRow = (item: RapprochementRow) => {
  selected.value = item
  detailDialog.value = true
}

const systemColor = (value: string) => ({ GUDEF: 'warning', SIGFiP: 'error', Sydonia: 'primary', 'E-TAX': 'info', DAS: 'secondary' } as Record<string, string>)[value] || 'secondary'
const statusColor = (value: string) => ({ Reconcile: 'success', 'En ecart': 'error', 'A justifier': 'warning' } as Record<string, string>)[value] || 'secondary'
const impactColor = (value: string) => ({ Budgetaire: 'error', Documentaire: 'warning', Pilotage: 'info' } as Record<string, string>)[value] || 'secondary'
</script>
