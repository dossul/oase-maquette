<template>
  <div>
    <PageHeader title="Suivi budgétaire — Dépenses fiscales" subtitle="Suivi des exonérations comme dépenses fiscales (DGBF / LFI)" icon="mdi-chart-bar">
      <template #actions>
        <ExportButton label="Exporter annexe LFI" :formats="[{value:'xlsx',label:'Excel LFI',icon:'mdi-microsoft-excel'},{value:'pdf',label:'PDF',icon:'mdi-file-pdf-box'}]" @export="() => {}" size="small" />
      </template>
    </PageHeader>

    <!-- SIGFiP status -->
    <v-card variant="outlined" rounded="lg" class="mb-5" :color="sigfipStatus==='error'?'error':undefined">
      <v-card-text class="pa-3 d-flex align-center ga-3">
        <v-icon :icon="sigfipStatus==='error'?'mdi-api-off':'mdi-api'" :color="sigfipStatus==='error'?'error':'success'" size="22" />
        <div class="flex-grow-1">
          <div class="font-weight-semibold text-body-2">Connecteur SIGFiP — {{ sigfipStatus==='error'?'⚠ INDISPONIBLE':'Synchronisé' }}</div>
          <div class="text-caption text-medium-emphasis">{{ sigfipStatus==='error'?'Dernière synchronisation: 27/04/2026 08:15 (il y a 2h30)':'Dernière synchronisation: 27/04/2026 10:45' }}</div>
        </div>
        <v-btn size="small" variant="tonal" :color="sigfipStatus==='error'?'error':'success'" prepend-icon="mdi-refresh" @click="sigfipStatus='ok'">Re-synchroniser</v-btn>
      </v-card-text>
    </v-card>

    <v-row class="mb-4">
      <v-col v-for="k in kpis" :key="k.label" cols="6" md="3"><KpiCard v-bind="k" /></v-col>
    </v-row>

    <!-- Comparatif prévi/réa -->
    <v-card rounded="lg" elevation="1" class="mb-4">
      <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Comparatif Prévisions LFI vs Réalisations 2026 (Mds FCFA)</v-card-title>
      <v-card-text>
        <div class="d-flex flex-wrap ga-3 mb-4">
          <v-chip color="primary" variant="tonal" size="small" prepend-icon="mdi-chart-line">Réalisations</v-chip>
          <v-chip color="secondary" variant="outlined" size="small" prepend-icon="mdi-minus">Prévisions LFI</v-chip>
        </div>
        <div v-for="row in comparatif" :key="row.mois" class="mb-3">
          <div class="d-flex justify-space-between text-caption mb-1">
            <span class="font-weight-medium">{{ row.mois }}</span>
            <span>Réa: <strong>{{ row.realise }}M</strong> / LFI: {{ row.lfi }}M
              <v-chip :color="row.realise>row.lfi?'error':'success'" size="x-small" variant="tonal" class="ms-1">{{ row.realise>row.lfi?'+':'' }}{{ row.realise-row.lfi }}M</v-chip>
            </span>
          </div>
          <v-progress-linear :model-value="(row.realise/row.lfi)*100" :color="row.realise>row.lfi?'error':'primary'" rounded height="8" />
        </div>
      </v-card-text>
    </v-card>

    <!-- Budget table -->
    <v-card rounded="lg" elevation="1">
      <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Tableau des dépenses fiscales (nomenclature LFI)</v-card-title>
      <v-data-table :headers="headers" :items="depenses" hover density="comfortable">
        <template #item.ecart="{ item }">
          <span :class="item.ecart>0?'text-error font-weight-bold':'text-success'">{{ item.ecart>0?'+':'' }}{{ item.ecart }}M</span>
        </template>
        <template #item.alerte="{ item }">
          <v-chip v-if="item.ecart>30" color="error" size="x-small" variant="tonal" prepend-icon="mdi-alert">Dépassement</v-chip>
          <v-chip v-else color="success" size="x-small" variant="tonal">OK</v-chip>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import ExportButton from '../../components/ExportButton.vue'
import KpiCard from '../../components/KpiCard.vue'
const sigfipStatus = ref<'ok'|'error'>('error')
const kpis = [
  { label: 'Total dépenses fiscales', value: '847,3 Mds', icon: 'mdi-chart-bar', color: 'primary', subtitle: 'Jan–Avr 2026', to: '/decideur/analyse' },
  { label: 'Prévisions LFI 2026', value: '1 200 Mds', icon: 'mdi-file-chart', color: 'secondary', to: '/decideur/rapport-annuel' },
  { label: 'Taux d\'exécution', value: '70,6%', icon: 'mdi-percent', color: 'info', trend: 3.2, to: '/backoffice/budget' },
  { label: 'Dépassements sectoriels', value: '3', icon: 'mdi-alert', color: 'error', to: '/backoffice/dossiers' },
]
const comparatif = [
  { mois: 'Janvier', realise: 62, lfi: 70 }, { mois: 'Février', realise: 71, lfi: 70 },
  { mois: 'Mars', realise: 85, lfi: 72 }, { mois: 'Avril', realise: 78, lfi: 72 },
]
const headers = [{ title: 'Secteur', key: 'secteur' }, { title: 'Type impôt', key: 'type' }, { title: 'Prévision LFI (M)', key: 'lfi' }, { title: 'Réalisation (M)', key: 'realise' }, { title: 'Écart (M)', key: 'ecart' }, { title: 'Alerte', key: 'alerte', sortable: false }]
const depenses = [
  { secteur: 'Mines & Hydrocarbures', type: 'Douanes + IS', lfi: 180, realise: 234, ecart: 54 },
  { secteur: 'Zone Franche', type: 'IS + TVA + Douanes', lfi: 200, realise: 198, ecart: -2 },
  { secteur: 'Agriculture', type: 'TVA + Douanes', lfi: 150, realise: 145, ecart: -5 },
  { secteur: 'Énergie', type: 'IS + Douanes', lfi: 80, realise: 112, ecart: 32 },
  { secteur: 'Numérique', type: 'IS + TVA', lfi: 100, realise: 89, ecart: -11 },
]
</script>
