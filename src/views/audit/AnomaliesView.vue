<template>
  <div>
    <PageHeader title="Analyse des anomalies" subtitle="Anomalies détectées par le moteur de règles OASE" icon="mdi-alert-circle">
      <template #actions>
        <ExportButton label="Exporter les anomalies" @export="() => {}"/>
      </template>
    </PageHeader>
    <v-row class="mb-4">
      <v-col v-for="s in stats" :key="s.label" cols="6" md="3"><KpiCard v-bind="s"/></v-col>
    </v-row>
    <v-card rounded="lg" elevation="1">
      <v-card-text class="pa-4">
        <v-row dense>
          <v-col cols="6" md="3"><v-select v-model="filterCategorie" :items="['juridique','financiere','procedurale','temporelle','Toutes']" label="Catégorie" hide-details/></v-col>
          <v-col cols="6" md="3"><v-select v-model="filterGravite" :items="['critique','elevee','moyenne','faible','Toutes']" label="Gravité" hide-details/></v-col>
          <v-col cols="6" md="3"><v-select v-model="filterStatut" :items="['nouvelle','examinee','traitee','Toutes']" label="Statut" hide-details/></v-col>
        </v-row>
      </v-card-text>
      <v-data-table :headers="headers" :items="filteredAnomalies" hover>
        <template #item.gravite="{ item }">
          <v-chip :color="{'critique':'error','elevee':'warning','moyenne':'info','faible':'success'}[item.gravite]" size="x-small" variant="tonal" class="font-weight-bold">{{ item.gravite }}</v-chip>
        </template>
        <template #item.categorie="{ item }">
          <v-chip :color="{'juridique':'error','financiere':'warning','procedurale':'info','temporelle':'secondary'}[item.categorie]" size="x-small" variant="outlined">{{ item.categorie }}</v-chip>
        </template>
        <template #item.statut="{ item }">
          <v-chip :color="item.statut==='nouvelle'?'error':item.statut==='examinee'?'warning':'success'" size="x-small" variant="tonal">{{ item.statut }}</v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn v-if="item.statut!=='traitee'" size="x-small" color="primary" variant="tonal" @click="item.statut='examinee'" class="me-1">Marquer examinée</v-btn>
          <v-btn size="x-small" color="secondary" variant="tonal">Dossier</v-btn>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import ExportButton from '../../components/ExportButton.vue'
import { mockAnomalies } from '../../mock/data'
const filterCategorie = ref('Toutes')
const filterGravite = ref('Toutes')
const filterStatut = ref('Toutes')
const stats = [
  { label: 'Anomalies critiques', value: mockAnomalies.filter(a=>a.gravite==='critique').length, icon: 'mdi-alert-octagon', color: 'error', to: '/audit/anomalies' },
  { label: 'Élevées', value: mockAnomalies.filter(a=>a.gravite==='elevee').length, icon: 'mdi-alert', color: 'warning', to: '/audit/anomalies' },
  { label: 'Nouvelles (non examinées)', value: mockAnomalies.filter(a=>a.statut==='nouvelle').length, icon: 'mdi-new-box', color: 'info', to: '/audit/anomalies' },
  { label: 'Traitées', value: mockAnomalies.filter(a=>a.statut==='traitee').length, icon: 'mdi-check-circle', color: 'success', to: '/audit/journal' },
]
const headers = [
  { title: 'ID', key: 'id' }, { title: 'Catégorie', key: 'categorie' }, { title: 'Gravité', key: 'gravite' },
  { title: 'Description', key: 'description' }, { title: 'Dossier', key: 'dossier' },
  { title: 'Détection', key: 'dateDetection' }, { title: 'Statut', key: 'statut' },
  { title: 'Actions', key: 'actions', sortable: false },
]
const filteredAnomalies = computed(() => mockAnomalies.filter(a => {
  if (filterCategorie.value !== 'Toutes' && a.categorie !== filterCategorie.value) return false
  if (filterGravite.value !== 'Toutes' && a.gravite !== filterGravite.value) return false
  if (filterStatut.value !== 'Toutes' && a.statut !== filterStatut.value) return false
  return true
}))
</script>
