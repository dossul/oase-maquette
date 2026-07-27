<template>
  <div>
    <PageHeader title="Tableau de bord Agence" subtitle="API-ZF — Gestion des zones franches et conventions d'investissement" icon="mdi-factory" />
    <v-row class="mb-5">
      <v-col v-for="k in kpis" :key="k.label" cols="6" md="3"><KpiCard v-bind="k" /></v-col>
    </v-row>
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">{{ error }}</v-alert>
    <AlertBanner type="warning" title="3 notifications OTR non transmises" text="Des conventions du portefeuille n'ont pas encore été notifiées à l'OTR." />
    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center justify-space-between">
            Dossiers à instruire
            <v-btn size="x-small" variant="tonal" to="/agences/dossiers">Voir tout</v-btn>
          </v-card-title>
          <v-list lines="two" class="pa-0">
            <v-list-item v-for="(d, i) in demandes.slice(0, 5)" :key="d.id" :to="`/agences/dossiers/${d.id}/instruction`" :divider="i<Math.min(demandes.length,5)-1" class="px-4 py-3">
              <template #prepend><v-avatar color="info" size="36" rounded="lg"><v-icon icon="mdi-folder-search" color="white" size="18"/></v-avatar></template>
              <template #title><span class="font-weight-semibold text-body-2">{{ d.reference }} — {{ d.contribuable?.raisonSociale ?? '—' }}</span></template>
              <template #subtitle><span class="text-caption">{{ d.secteur ?? 'Exonération' }} · Déposé {{ formatDate(d.dateDepot) }}</span></template>
              <template #append><StatusChip :statut="statutOf(d)" /></template>
            </v-list-item>
            <v-list-item v-if="!demandes.length && !loading" prepend-icon="mdi-inbox-outline">
              <template #title><span class="text-caption text-medium-emphasis">Aucune demande dans votre périmètre d'instruction</span></template>
            </v-list-item>
          </v-list>
        </v-card>
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center justify-space-between">
            Conventions actives
            <v-btn size="x-small" variant="tonal" to="/agences/conventions">Voir tout</v-btn>
          </v-card-title>
          <v-list lines="two" class="pa-0">
            <v-list-item v-for="(c, i) in conventions" :key="c.id" to="/agences/conventions" :divider="i<conventions.length-1" class="px-4 py-3">
              <template #prepend><v-avatar color="primary" size="36" rounded="lg"><v-icon icon="mdi-file-certificate" color="white" size="18"/></v-avatar></template>
              <template #title><span class="font-weight-semibold text-body-2">{{ c.reference }} — {{ c.contribuable }}</span></template>
              <template #subtitle><span class="text-caption">{{ c.regime }} · Expire {{ formatDate(c.dateFin) }}</span></template>
              <template #append><v-chip :color="c.statut==='active'?'success':'warning'" size="x-small" variant="tonal">{{ c.statut }}</v-chip></template>
            </v-list-item>
            <v-list-item v-if="!conventions.length && !loading" prepend-icon="mdi-file-hidden">
              <template #title><span class="text-caption text-medium-emphasis">Aucune convention enregistrée</span></template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Zones franches — Togo</v-card-title>
          <v-card-text class="pa-0">
            <div class="d-flex align-center justify-center" style="height:180px;background:linear-gradient(135deg,#E8EDF2,#F4F6F9);border-radius:0 0 8px 8px">
              <div class="text-center">
                <v-icon icon="mdi-map-marker-radius" size="48" color="primary" class="mb-2"/>
                <div class="d-flex ga-2 justify-center mt-2">
                  <v-chip color="primary" size="x-small" variant="tonal">ZFI Lomé (12)</v-chip>
                  <v-chip color="success" size="x-small" variant="tonal">ZES Kara (3)</v-chip>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Alertes</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item prepend-icon="mdi-calendar-alert" title="ZFI-2024-012 expire dans 45j" rounded="lg" class="mb-1"/>
            <v-list-item prepend-icon="mdi-account-alert" title="TOGO PHARMA ZF — Emplois en défaut" rounded="lg" class="mb-1"/>
            <v-list-item prepend-icon="mdi-api-off" title="3 notifications OTR non transmises" rounded="lg"/>
          </v-list>
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
import StatusChip from '../../components/StatusChip.vue'
import type { StatutDemande } from '../../types'
import { listerConventionsReelles, listerDemandes, type DemandeApi } from '../../services/backoffice'
const conventions = ref<any[]>([])
const demandes = ref<DemandeApi[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    const [convs, dems] = await Promise.all([
      listerConventionsReelles().catch((e) => {
        error.value = 'Impossible de charger les conventions'
        throw e
      }),
      listerDemandes({ limit: 20 }).catch(() => [] as DemandeApi[]),
    ])
    conventions.value = convs.map((c) => ({
      id: c.id,
      reference: c.reference || c.id,
      contribuable: c.contribuables?.raisonSociale ?? '—',
      regime: c.regimeCode ?? '—',
      statut: c.statutCode || 'active',
      dateFin: c.dateFin,
    }))
    demandes.value = dems
  } catch (e) {
    // erreur déjà positionnée (conventions)
  } finally {
    loading.value = false
  }
})

const statutOf = (d: DemandeApi) => d.statutCode as StatutDemande

const kpis = computed(() => [
  { label: 'Conventions', value: conventions.value.filter(c => c.statut === 'active').length, icon: 'mdi-file-certificate', color: 'success', trend: 2, to: '/agences/conventions' },
  { label: 'Dossiers à instruire', value: demandes.value.length, icon: 'mdi-folder-search', color: 'info', to: '/agences/dossiers' },
  { label: 'Agréments en instruction', value: 0, icon: 'mdi-clipboard-text', color: 'info', to: '/agences/agrements' },
  { label: 'Défauts d\'engagement', value: 0, icon: 'mdi-account-alert', color: 'error', to: '/agences/engagements' },
])
const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR') : '-'
</script>
