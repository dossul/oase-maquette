<template>
  <div>
    <PageHeader title="Tableau de bord Agence" subtitle="API-ZF — Gestion des zones franches et conventions d'investissement" icon="mdi-factory" />
    <v-row class="mb-5">
      <v-col v-for="k in kpis" :key="k.label" cols="6" md="3"><KpiCard v-bind="k" /></v-col>
    </v-row>
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">{{ error }}</v-alert>
    <AlertBanner type="warning" title="3 notifications OTR non transmises" text="Des conventions actives n'ont pas encore été notifiées à l'OTR." />
    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center justify-space-between">
            Conventions actives
            <v-btn size="x-small" variant="tonal" to="/agences/conventions">Voir tout</v-btn>
          </v-card-title>
          <v-list lines="two" class="pa-0">
            <v-list-item v-for="(c, i) in conventions" :key="c.id" to="/agences/conventions" :divider="i<conventions.length-1" class="px-4 py-3">
              <template #prepend><v-avatar color="primary" size="36" rounded="lg"><v-icon icon="mdi-file-certificate" color="white" size="18"/></v-avatar></template>
              <template #title><span class="font-weight-semibold text-body-2">{{ c.reference }} — {{ c.beneficiaire }}</span></template>
              <template #subtitle><span class="text-caption">{{ c.regime }} · Expire {{ formatDate(c.dateFin) }}</span></template>
              <template #append><v-chip :color="c.statut==='active'?'success':'warning'" size="x-small" variant="tonal">{{ c.statut }}</v-chip></template>
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
import { listerConventions } from '../../services/conventions'
const conventions = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    const res = await listerConventions()
    conventions.value = res.data.map((c) => ({
      ...c,
      reference: c.reference || c.id,
      statut: c.statut || 'active',
      dateFin: c.dateFin || c.echeance || new Date().toISOString(),
    }))
  } catch (e) {
    error.value = 'Impossible de charger les conventions'
  } finally {
    loading.value = false
  }
})

const kpis = computed(() => [
  { label: 'Conventions actives', value: conventions.value.filter(c => c.statut === 'active').length, icon: 'mdi-file-certificate', color: 'success', trend: 2, to: '/agences/conventions' },
  { label: 'Échéances < 90j', value: conventions.value.filter(c => c.statut === 'active').slice(0, 3).length, icon: 'mdi-calendar-alert', color: 'warning', to: '/agences/conventions' },
  { label: 'Agréments en instruction', value: 0, icon: 'mdi-clipboard-text', color: 'info', to: '/agences/agrements' },
  { label: 'Défauts d\'engagement', value: 0, icon: 'mdi-account-alert', color: 'error', to: '/agences/engagements' },
])
const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '-'
</script>
