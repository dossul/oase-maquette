<template>
  <div>
    <PageHeader title="Tableau de bord Audit" subtitle="Module Audit & Contrôle — IGF / Cour des comptes" icon="mdi-shield-check">
      <template #actions>
        <v-chip color="error" variant="tonal" size="small" prepend-icon="mdi-eye-lock">Lecture seule</v-chip>
      </template>
    </PageHeader>
    <v-row class="mb-5">
      <v-col v-for="k in kpis" :key="k.label" cols="6" md="3"><KpiCard v-bind="k"/></v-col>
    </v-row>
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">{{ error }}</v-alert>
    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center justify-space-between">
            Anomalies prioritaires (moteur de règles)
            <v-btn size="x-small" variant="tonal" to="/audit/anomalies">Voir tout</v-btn>
          </v-card-title>
          <v-list lines="two" class="pa-0">
            <v-list-item v-for="(a, i) in visibleAnomalies" :key="a.id" :divider="i<visibleAnomalies.length-1" class="px-4 py-3">
              <template #prepend>
                <v-avatar :color="graviteColor(a.gravite)" size="36" rounded="lg">
                  <v-icon icon="mdi-alert-circle" color="white" size="18"/>
                </v-avatar>
              </template>
              <template #title>
                <div class="d-flex align-center ga-2">
                  <span class="font-weight-semibold text-body-2">{{ a.dossier }}</span>
                  <v-chip :color="graviteColor(a.gravite)" size="x-small" variant="tonal">{{ a.gravite }}</v-chip>
                  <v-chip :color="categorieColor(a.categorie)" size="x-small" variant="outlined">{{ a.categorie }}</v-chip>
                </div>
              </template>
              <template #subtitle><span class="text-caption">{{ a.description }}</span></template>
              <template #append>
                <v-btn size="x-small" variant="tonal" color="primary" to="/audit/anomalies">Examiner</v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Missions d'audit en cours</v-card-title>
          <v-data-table :headers="missionHeaders" :items="missions" density="comfortable" hover/>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Statistiques anomalies (12 mois)</v-card-title>
          <v-card-text>
            <div v-for="(m, i) in statsAnomalies" :key="i" class="mb-2 d-flex align-center ga-2">
              <span class="text-caption" style="width:40px">{{ m.mois }}</span>
              <v-progress-linear :model-value="(m.count/12)*100" color="error" rounded height="8" class="flex-grow-1"/>
              <span class="text-caption font-weight-bold" style="width:20px">{{ m.count }}</span>
            </div>
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
import { listerAnomalies } from '../../services/anomalies'
const anomalies = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    const res = await listerAnomalies()
    anomalies.value = res.data.map((a) => ({
      ...a,
      dossier: a.demandeId || a.reference || a.id,
      gravite: a.graviteCode || a.gravite || 'moyenne',
      categorie: a.categorieCode || a.categorie || 'procedurale',
      statut: a.statutCode || a.statut || 'nouvelle',
      description: a.description || 'Anomalie détectée',
    }))
  } catch (e) {
    error.value = 'Impossible de charger les anomalies'
  } finally {
    loading.value = false
  }
})

const visibleAnomalies = computed(() => anomalies.value.filter(a => a.statut === 'nouvelle').slice(0, 4))
const kpis = computed(() => [
  { label: 'Anomalies nouvelles', value: anomalies.value.filter(a => a.statut === 'nouvelle').length, icon: 'mdi-scale-unbalanced', color: 'error', to: '/audit/anomalies' },
  { label: 'Bénéficiaires irréguliers', value: 7, icon: 'mdi-account-alert', color: 'warning', to: '/audit/anomalies' },
  { label: 'Non notifiées SYDONIA', value: 3, icon: 'mdi-api-off', color: 'error', to: '/audit/journal' },
  { label: 'Taux mise en œuvre', value: '68%', icon: 'mdi-check-circle', color: 'success', to: '/audit/missions' },
])
const missionHeaders = [{ title: 'Mission', key: 'ref' }, { title: 'Institution', key: 'institution' }, { title: 'Période', key: 'periode' }, { title: 'Statut', key: 'statut' }]
const missions = [
  { ref: 'AUDIT-IGF-2026-001', institution: 'OTR Douanes', periode: 'Jan–Mar 2026', statut: 'En cours' },
  { ref: 'AUDIT-CC-2026-002', institution: 'DGBF', periode: 'Avr 2026', statut: 'Planifiée' },
]
const graviteColor = (g: string) => ({ critique: 'error', elevee: 'warning', moyenne: 'info', faible: 'success' }[g] || 'default')
const categorieColor = (c: string) => ({ juridique: 'error', financiere: 'warning', procedurale: 'info', temporelle: 'secondary' }[c] || 'default')
const statsAnomalies = [
  { mois: 'Mai', count: 5 }, { mois: 'Jun', count: 3 }, { mois: 'Jul', count: 7 },
  { mois: 'Aoû', count: 4 }, { mois: 'Sep', count: 6 }, { mois: 'Oct', count: 8 },
  { mois: 'Nov', count: 5 }, { mois: 'Déc', count: 9 }, { mois: 'Jan', count: 7 },
  { mois: 'Fév', count: 4 }, { mois: 'Mar', count: 6 }, { mois: 'Avr', count: 8 },
]
</script>
