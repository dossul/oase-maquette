<template>
  <div>
    <PageHeader title="Analyse des anomalies" subtitle="Anomalies détectées par le moteur de règles OASE" icon="mdi-alert-circle">
      <template #actions>
        <ExportButton label="Exporter les anomalies" @export="() => {}"/>
      </template>
    </PageHeader>
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">{{ error }}</v-alert>
    <v-row class="mb-4">
      <v-col v-for="s in stats" :key="s.label" cols="6" md="3"><KpiCard v-bind="s"/></v-col>
    </v-row>
    <v-card rounded="lg" elevation="1">
      <v-card-text class="pa-4">
        <v-row dense>
          <v-col cols="6" md="3"><v-select v-model="filterCategorie" :items="['juridique','financiere','procedurale','temporelle','quota','Toutes']" label="Catégorie" hide-details/></v-col>
          <v-col cols="6" md="3"><v-select v-model="filterGravite" :items="['critique','elevee','moyenne','faible','Toutes']" label="Gravité" hide-details/></v-col>
          <v-col cols="6" md="3"><v-select v-model="filterStatut" :items="['nouvelle','en_cours','resolue','traitee','rejetee','escaladee','Toutes']" label="Statut" hide-details/></v-col>
        </v-row>
      </v-card-text>
      <v-data-table :headers="headers" :items="filteredAnomalies" :loading="loading" hover>
        <template #item.gravite="{ item }">
          <v-chip :color="graviteColor(item.gravite)" size="x-small" variant="tonal" class="font-weight-bold">{{ item.gravite }}</v-chip>
        </template>
        <template #item.categorie="{ item }">
          <v-chip :color="categorieColor(item.categorie)" size="x-small" variant="outlined">{{ item.categorie }}</v-chip>
        </template>
        <template #item.statut="{ item }">
          <v-chip :color="statutColor(item.statut)" size="x-small" variant="tonal">{{ item.statut }}</v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn v-if="item.statut==='nouvelle'" size="x-small" color="primary" variant="tonal" :loading="traitementEnCours===item.id" @click="marquerExaminee(item)" class="me-1">Marquer examinée</v-btn>
          <v-btn size="x-small" color="secondary" variant="tonal" to="/audit/dossiers">Dossier</v-btn>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import ExportButton from '../../components/ExportButton.vue'
import { listerAnomalies, traiterAnomalie, type AnomalieAudit } from '../../services/audit'

interface AnomalieLigne {
  id: string
  categorie: string
  gravite: string
  description: string
  dossier: string
  dateDetection: string
  statut: string
}

const anomalies = ref<AnomalieLigne[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const traitementEnCours = ref<string | null>(null)
const filterCategorie = ref('Toutes')
const filterGravite = ref('Toutes')
const filterStatut = ref('Toutes')

const POIDS_GRAVITE: Record<string, number> = { critique: 0, elevee: 1, moyenne: 2, faible: 3 }
const POIDS_STATUT: Record<string, number> = { nouvelle: 0, en_cours: 1, escaladee: 2, resolue: 3, traitee: 3, rejetee: 4 }

function normaliser(a: AnomalieAudit): AnomalieLigne {
  return {
    id: a.id,
    categorie: a.categorieCode || 'procedurale',
    gravite: a.graviteCode || 'moyenne',
    description: a.description || 'Anomalie détectée',
    dossier: a.demandes?.reference || a.demandeId || '—',
    dateDetection: a.dateDetection ? new Date(a.dateDetection).toLocaleString('fr-FR') : '—',
    statut: a.statutCode || 'nouvelle',
  }
}

async function charger() {
  loading.value = true
  error.value = null
  try {
    const data = await listerAnomalies()
    anomalies.value = data.map(normaliser)
  } catch {
    error.value = 'Impossible de charger les anomalies'
  } finally {
    loading.value = false
  }
}

onMounted(charger)

async function marquerExaminee(item: AnomalieLigne) {
  traitementEnCours.value = item.id
  try {
    const maj = await traiterAnomalie(item.id, 'en_cours')
    item.statut = maj.statutCode || 'en_cours'
  } catch {
    error.value = `Échec du marquage de l'anomalie ${item.id}`
  } finally {
    traitementEnCours.value = null
  }
}

const stats = computed(() => [
  { label: 'Anomalies critiques', value: anomalies.value.filter(a=>a.gravite==='critique').length, icon: 'mdi-alert-octagon', color: 'error', to: '/audit/anomalies' },
  { label: 'Élevées', value: anomalies.value.filter(a=>a.gravite==='elevee').length, icon: 'mdi-alert', color: 'warning', to: '/audit/anomalies' },
  { label: 'Nouvelles (non examinées)', value: anomalies.value.filter(a=>a.statut==='nouvelle').length, icon: 'mdi-new-box', color: 'info', to: '/audit/anomalies' },
  { label: 'Traitées', value: anomalies.value.filter(a=>['traitee','resolue'].includes(a.statut)).length, icon: 'mdi-check-circle', color: 'success', to: '/audit/journal' },
])

const headers = [
  { title: 'ID', key: 'id' }, { title: 'Catégorie', key: 'categorie' }, { title: 'Gravité', key: 'gravite' },
  { title: 'Description', key: 'description' }, { title: 'Dossier', key: 'dossier' },
  { title: 'Détection', key: 'dateDetection' }, { title: 'Statut', key: 'statut' },
  { title: 'Actions', key: 'actions', sortable: false },
]

/** Tri métier : gravité (critique > elevee > moyenne > faible) puis statut (nouvelle d'abord). */
const filteredAnomalies = computed(() => anomalies.value
  .filter(a => {
    if (filterCategorie.value !== 'Toutes' && a.categorie !== filterCategorie.value) return false
    if (filterGravite.value !== 'Toutes' && a.gravite !== filterGravite.value) return false
    if (filterStatut.value !== 'Toutes' && a.statut !== filterStatut.value) return false
    return true
  })
  .slice()
  .sort((x, y) =>
    (POIDS_GRAVITE[x.gravite] ?? 9) - (POIDS_GRAVITE[y.gravite] ?? 9) ||
    (POIDS_STATUT[x.statut] ?? 9) - (POIDS_STATUT[y.statut] ?? 9),
  ))

const graviteColor = (g: string) => ({ critique: 'error', elevee: 'warning', moyenne: 'info', faible: 'success' }[g] || 'default')
const categorieColor = (c: string) => ({ juridique: 'error', financiere: 'warning', procedurale: 'info', temporelle: 'secondary', quota: 'warning' }[c] || 'default')
const statutColor = (s: string) => ({ nouvelle: 'error', en_cours: 'warning', escaladee: 'warning', examinee: 'warning', resolue: 'success', traitee: 'success', rejetee: 'secondary' }[s] || 'default')
</script>
