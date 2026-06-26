<template>
  <div>
    <PageHeader title="Tableau de bord — Back-office" subtitle="Vue opérationnelle de votre charge de travail" icon="mdi-view-dashboard">
      <template #actions>
        <v-chip color="primary" variant="tonal" size="small">OTR Douanes — K. ABALO</v-chip>
      </template>
    </PageHeader>
    <v-row class="mb-5">
      <v-col v-for="k in kpis" :key="k.label" cols="6" md="3"><KpiCard v-bind="k" /></v-col>
    </v-row>
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">{{ error }}</v-alert>
    <!-- New assignment notification alert -->
    <v-alert
      v-if="showNewAlert"
      type="info"
      variant="tonal"
      rounded="lg"
      closable
      class="mb-3"
      @click:close="showNewAlert=false"
    >
      <template #prepend><v-icon icon="mdi-bell-ring" color="info"/></template>
      <strong>Nouveau dossier assigné :</strong> OASE-2026-0044 (NUMERIQUE AFRIQUE SA) vient d'arriver dans votre file. Une notification a été envoyée par e-mail et in-app.
      <template #append>
        <v-btn size="x-small" color="info" variant="tonal" to="/backoffice/dossiers/6/instruction" class="ms-2">Instruire</v-btn>
      </template>
    </v-alert>
    <AlertBanner type="error" title="2 dossiers en retard réglementaire" text="Les dossiers OASE-2026-0029 et OASE-2026-0031 dépassent le délai réglementaire de 15 jours ouvrés. Action urgente requise." />
    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center justify-space-between">
            File de traitement
            <v-btn size="x-small" variant="tonal" to="/backoffice/dossiers">Voir tout</v-btn>
          </v-card-title>
          <v-list lines="two" class="pa-0">
            <v-list-item v-for="(d, i) in queue" :key="d.id" :to="`/backoffice/dossiers/${d.id}/instruction`" :divider="i<queue.length-1" class="px-4 py-3">
              <template #prepend>
                <v-avatar :color="d.priorite==='haute'?'error':'info'" size="36" rounded="lg">
                  <v-icon icon="mdi-folder" color="white" size="18" />
                </v-avatar>
              </template>
              <template #title>
                <div class="d-flex align-center ga-2">
                  <span class="font-weight-semibold text-body-2">{{ d.reference }}</span>
                  <v-chip :color="d.priorite==='haute'?'error':'info'" size="x-small" variant="tonal">{{ d.priorite }}</v-chip>
                </div>
              </template>
              <template #subtitle><span class="text-caption">{{ d.beneficiaire }} · {{ d.type }} · Reçu {{ d.date }}</span></template>
              <template #append>
                <div class="text-end">
                  <div class="text-caption text-medium-emphasis">Délai restant</div>
                  <div class="font-weight-bold text-body-2" :class="d.retard?'text-error':''">{{ d.delai }}</div>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Alertes système</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item v-for="a in alertes" :key="a.id" :prepend-icon="a.icon" :subtitle="a.date" rounded="lg" class="mb-1">
              <template #title><span class="text-body-2" :class="`text-${a.color}`">{{ a.texte }}</span></template>
            </v-list-item>
          </v-list>
        </v-card>
        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Productivité ce mois</v-card-title>
          <v-card-text>
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-body-2">Dossiers traités</span>
              <span class="font-weight-bold">23</span>
            </div>
            <v-progress-linear :model-value="76" color="success" rounded height="8" class="mb-3" />
            <div class="d-flex align-center justify-space-between mb-2">
              <span class="text-body-2">Délai moyen</span>
              <span class="font-weight-bold">8,4 jours</span>
            </div>
            <v-progress-linear :model-value="56" color="info" rounded height="8" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import AlertBanner from '../../components/AlertBanner.vue'
import { listerDemandes } from '../../services/demandes'
const showNewAlert = ref(true)
const demandes = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    const res = await listerDemandes()
    demandes.value = res.data.map((d) => ({
      ...d,
      reference: d.reference || d.id,
      type: d.impotConcerne || d.type || 'TVA',
      date: d.dateDepot ? new Date(d.dateDepot).toLocaleDateString('fr-FR') : '-',
      delai: '15j',
      priorite: 'normale',
      retard: false,
    }))
  } catch (e) {
    error.value = 'Impossible de charger la file de traitement'
  } finally {
    loading.value = false
  }
})

const kpis = computed(() => [
  { label: 'En attente d\'instruction', value: demandes.value.filter(d => d.statutCode === 'en_instruction').length, icon: 'mdi-inbox', color: 'info', to: '/backoffice/dossiers' },
  { label: 'En retard réglementaire', value: 0, icon: 'mdi-alert', color: 'error', to: '/backoffice/dossiers' },
  { label: 'Traités ce mois', value: demandes.value.filter(d => d.statutCode === 'accordee').length, icon: 'mdi-check-circle', color: 'success', to: '/backoffice/dossiers' },
  { label: 'Alertes moteur règles', value: 0, icon: 'mdi-cog-play', color: 'warning', to: '/backoffice/controle' },
])
const queue = computed(() => demandes.value.slice(0, 6))
const alertes = [
  { id: 1, icon: 'mdi-alert-circle', texte: 'LOMÉ LOGISTICS SA — Quota dépassé 340%', date: '18/04/2026', color: 'error' },
  { id: 2, icon: 'mdi-calendar-alert', texte: 'OASE-2025-0098 expire dans 28 jours', date: '26/04/2026', color: 'warning' },
  { id: 3, icon: 'mdi-shield-alert', texte: 'Doublon détecté OASE-2025-0099', date: '25/04/2026', color: 'error' },
  { id: 4, icon: 'mdi-bank-off', texte: 'MINES DU NORD — Dettes SIGTAS signalées', date: '24/04/2026', color: 'warning' },
]
</script>
