<template>
  <div>
    <PageHeader title="Supervision des connecteurs SI" subtitle="Monitorer les flux API avec SYDONIA, SIGTAS, SIGFiP et GUDEF" icon="mdi-api">
      <template #actions>
        <v-chip :color="allOk?'success':'error'" variant="tonal" size="small" :prepend-icon="allOk?'mdi-check-circle':'mdi-alert-circle'">
          {{ allOk ? 'Tous actifs' : 'Incidents en cours' }}
        </v-chip>
      </template>
    </PageHeader>

    <v-row class="mb-4">
      <v-col v-for="k in kpis" :key="k.label" cols="6" md="3"><KpiCard v-bind="k"/></v-col>
    </v-row>

    <v-row>
      <v-col v-for="c in connecteurs" :key="c.id" cols="12" md="6">
        <ConnectorStatusCard :connector="c"/>
      </v-col>
    </v-row>

    <!-- API Logs -->
    <v-card rounded="lg" elevation="1" class="mt-4">
      <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center justify-space-between">
        Journal des flux API (dernières 24h)
        <v-btn size="x-small" variant="tonal" prepend-icon="mdi-refresh">Rafraîchir</v-btn>
      </v-card-title>
      <v-data-table :headers="logHeaders" :items="apiLogs" density="comfortable" hover>
        <template #item.statut="{ item }">
          <v-chip :color="item.statut<300?'success':item.statut<500?'warning':'error'" size="x-small" variant="tonal">HTTP {{ item.statut }}</v-chip>
        </template>
        <template #item.systeme="{ item }">
          <v-chip :color="{'SYDONIA':'primary','SIGTAS':'info','SIGFiP':'error','GUDEF':'warning'}[item.systeme]" size="x-small" variant="tonal">{{ item.systeme }}</v-chip>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import ConnectorStatusCard from '../../components/ConnectorStatusCard.vue'
import { mockConnecteurs } from '../../mock/data'
const connecteurs = mockConnecteurs
const allOk = computed(() => connecteurs.every(c => c.statut === 'actif'))
const kpis = computed(() => [
  { label: 'Connecteurs actifs', value: connecteurs.filter(c=>c.statut==='actif').length + ' / ' + connecteurs.length, icon: 'mdi-api', color: 'success', to: '/admin/connecteurs' },
  { label: 'Connecteurs en erreur', value: connecteurs.filter(c=>c.statut==='erreur').length, icon: 'mdi-api-off', color: 'error', to: '/admin/monitoring' },
  { label: 'Volume 24h (total)', value: connecteurs.reduce((a,c)=>a+c.volume24h,0).toLocaleString('fr-FR'), icon: 'mdi-transfer', color: 'info', to: '/admin/monitoring' },
  { label: 'Latence moyenne', value: Math.round(connecteurs.filter(c=>c.latenceMs>0).reduce((a,c)=>a+c.latenceMs,0)/2) + ' ms', icon: 'mdi-clock-fast', color: 'primary', to: '/admin/monitoring' },
])
const logHeaders = [
  { title: 'Horodatage', key: 'heure' }, { title: 'Système', key: 'systeme' }, { title: 'Opération', key: 'operation' },
  { title: 'Statut HTTP', key: 'statut' }, { title: 'Volume (Ko)', key: 'volume' }, { title: 'Latence (ms)', key: 'latence' },
]
const apiLogs = [
  { heure: '10:45:32', systeme: 'SYDONIA', operation: 'GET /exemptions/check', statut: 200, volume: 12, latence: 142 },
  { heure: '10:44:18', systeme: 'SIGTAS', operation: 'POST /taxpayer/status', statut: 200, volume: 8, latence: 218 },
  { heure: '10:30:01', systeme: 'SIGFiP', operation: 'GET /depenses-fiscales', statut: 503, volume: 0, latence: 0 },
  { heure: '09:15:44', systeme: 'SYDONIA', operation: 'POST /quota/deduct', statut: 200, volume: 45, latence: 156 },
  { heure: '08:15:00', systeme: 'SIGFiP', operation: 'GET /budget/exonerations', statut: 503, volume: 0, latence: 0 },
  { heure: '08:00:12', systeme: 'GUDEF', operation: 'MAINTENANCE START', statut: 200, volume: 0, latence: 0 },
]
</script>
