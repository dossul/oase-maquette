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
              <v-progress-linear :model-value="(m.count/maxMensuel)*100" color="error" rounded height="8" class="flex-grow-1"/>
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
import { listerAnomalies, type AnomalieAudit } from '../../services/audit'

interface AnomalieLigne {
  id: string
  dossier: string
  gravite: string
  categorie: string
  statut: string
  description: string
  dateDetection: string | null
}

const anomalies = ref<AnomalieLigne[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const POIDS_GRAVITE: Record<string, number> = { critique: 0, elevee: 1, moyenne: 2, faible: 3 }
const STATUTS_CLOS = ['resolue', 'traitee', 'rejetee']

onMounted(async () => {
  loading.value = true
  try {
    const data = await listerAnomalies()
    anomalies.value = data.map((a: AnomalieAudit) => ({
      id: a.id,
      dossier: a.demandes?.reference || a.demandeId || a.id,
      gravite: a.graviteCode || 'moyenne',
      categorie: a.categorieCode || 'procedurale',
      statut: a.statutCode || 'nouvelle',
      description: a.description || 'Anomalie détectée',
      dateDetection: a.dateDetection || null,
    }))
  } catch {
    error.value = 'Impossible de charger les anomalies'
  } finally {
    loading.value = false
  }
})

const visibleAnomalies = computed(() =>
  anomalies.value
    .filter(a => !STATUTS_CLOS.includes(a.statut))
    .slice()
    .sort((x, y) => (POIDS_GRAVITE[x.gravite] ?? 9) - (POIDS_GRAVITE[y.gravite] ?? 9))
    .slice(0, 4),
)

/** Taux de non-conformité calculé depuis GET /anomalies : part des anomalies non résolues. */
const tauxNonConformite = computed(() => {
  if (anomalies.value.length === 0) return '0%'
  const nonResolues = anomalies.value.filter(a => !STATUTS_CLOS.includes(a.statut)).length
  return `${Math.round((nonResolues / anomalies.value.length) * 100)}%`
})

const kpis = computed(() => [
  { label: 'Anomalies nouvelles', value: anomalies.value.filter(a => a.statut === 'nouvelle').length, icon: 'mdi-scale-unbalanced', color: 'error', to: '/audit/anomalies' },
  { label: 'Critiques', value: anomalies.value.filter(a => a.gravite === 'critique').length, icon: 'mdi-alert-octagon', color: 'warning', to: '/audit/anomalies' },
  { label: 'Élevées', value: anomalies.value.filter(a => a.gravite === 'elevee').length, icon: 'mdi-alert', color: 'error', to: '/audit/anomalies' },
  { label: 'Taux de non-conformité', value: tauxNonConformite.value, icon: 'mdi-check-circle', color: 'success', to: '/audit/anomalies' },
])
const missionHeaders = [{ title: 'Mission', key: 'ref' }, { title: 'Institution', key: 'institution' }, { title: 'Période', key: 'periode' }, { title: 'Statut', key: 'statut' }]
const missions = [
  { ref: 'AUDIT-IGF-2026-001', institution: 'OTR Douanes', periode: 'Jan–Mar 2026', statut: 'En cours' },
  { ref: 'AUDIT-CC-2026-002', institution: 'DGBF', periode: 'Avr 2026', statut: 'Planifiée' },
]
const graviteColor = (g: string) => ({ critique: 'error', elevee: 'warning', moyenne: 'info', faible: 'success' }[g] || 'default')
const categorieColor = (c: string) => ({ juridique: 'error', financiere: 'warning', procedurale: 'info', temporelle: 'secondary', quota: 'warning' }[c] || 'default')

/** Répartition mensuelle réelle des détections sur les 12 derniers mois. */
const MOIS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']
const statsAnomalies = computed(() => {
  const maintenant = new Date()
  const buckets: { mois: string; count: number }[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1)
    buckets.push({ mois: MOIS_FR[d.getMonth()], count: 0 })
  }
  for (const a of anomalies.value) {
    if (!a.dateDetection) continue
    const d = new Date(a.dateDetection)
    const diff = (maintenant.getFullYear() - d.getFullYear()) * 12 + (maintenant.getMonth() - d.getMonth())
    if (diff >= 0 && diff < 12) buckets[11 - diff].count++
  }
  return buckets
})
const maxMensuel = computed(() => Math.max(1, ...statsAnomalies.value.map(m => m.count)))
</script>
