<template>
  <div>
    <PageHeader
      title="Tableau de bord ministère sectoriel"
      subtitle="Suivi des dossiers en instruction et des conventions sectorielles"
      icon="mdi-office-building"
    />

    <v-alert v-if="erreur" type="error" variant="tonal" rounded="lg" density="compact" class="mb-4">{{ erreur }}</v-alert>

    <!-- KPIs réels (GET /demandes + GET /conventions) -->
    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">
            Dossiers en instruction (source : GET /demandes)
          </v-card-title>
          <v-data-table
            :headers="demandeHeaders"
            :items="demandes"
            :loading="chargement"
            hover
            density="compact"
            no-data-text="Aucun dossier en instruction dans votre périmètre."
          >
            <template #item.montant="{ item }">
              {{ formatMontant(item.montantFcfa) }}
            </template>
            <template #item.depot="{ item }">
              {{ item.dateDepot ? new Date(item.dateDepot).toLocaleDateString('fr-FR') : '—' }}
            </template>
            <template #item.statut="{ item }">
              <v-chip size="x-small" color="info" variant="tonal">{{ item.statutCode }}</v-chip>
            </template>
          </v-data-table>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">
            Conventions sectorielles suivies (source : GET /conventions)
          </v-card-title>
          <v-data-table
            :headers="conventionHeaders"
            :items="conventions"
            :loading="chargement"
            hover
            density="compact"
            no-data-text="Aucune convention enregistrée."
          >
            <template #item.contribuable="{ item }">
              {{ item.contribuables?.raisonSociale ?? '—' }}
            </template>
            <template #item.echeance="{ item }">
              {{ item.dateFin ? new Date(item.dateFin).toLocaleDateString('fr-FR') : '—' }}
            </template>
            <template #item.statut="{ item }">
              <v-chip :color="item.statutCode === 'active' ? 'success' : 'secondary'" size="x-small" variant="tonal">{{ item.statutCode }}</v-chip>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Eléments couverts dans la maquette</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Contribution par structure et par dossier" prepend-icon="mdi-account-edit-outline" />
            <v-list-item title="Avis sectoriel avant validation" prepend-icon="mdi-comment-check-outline" />
            <v-list-item title="Relances sur donnees manquantes" prepend-icon="mdi-bell-ring-outline" />
            <v-list-item title="Suivi des engagements sectoriels" prepend-icon="mdi-chart-box-outline" />
            <v-list-item title="Historique des mises a jour" prepend-icon="mdi-history" />
          </v-list>
        </v-card>

        <!-- TODO(endpoint): GET /campagnes et GET /avis-sectoriels requis pour les campagnes
             de mise à jour et les avis formels — sections non affichées (pas de données réelles). -->
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import { api, ApiError } from '../../services/api'
import type { DemandeApi } from '../../services/demandes'

interface ConventionApi {
  id: string
  reference: string
  regimeCode?: string | null
  statutCode: string
  dateDebut?: string | null
  dateFin?: string | null
  contribuables?: { raisonSociale: string } | null
}

const chargement = ref(false)
const erreur = ref('')
const demandes = ref<DemandeApi[]>([])
const totalDossiers = ref(0)
const conventions = ref<ConventionApi[]>([])

onMounted(async () => {
  chargement.value = true
  try {
    const [d, c] = await Promise.all([
      api<{ data: DemandeApi[]; meta: { total: number } }>('/demandes?limit=10'),
      api<ConventionApi[]>('/conventions'),
    ])
    demandes.value = d.data
    totalDossiers.value = d.meta.total
    conventions.value = c
  } catch (e) {
    erreur.value = e instanceof ApiError ? e.message : 'Impossible de charger les données sectorielles.'
  } finally {
    chargement.value = false
  }
})

const kpis = computed(() => {
  const actives = conventions.value.filter((cv) => cv.statutCode === 'active').length
  return [
    { label: 'Dossiers dans le périmètre', value: String(totalDossiers.value), icon: 'mdi-folder-open-outline', color: 'primary', subtitle: 'Source : API /demandes' },
    { label: 'Conventions actives', value: String(actives), icon: 'mdi-file-sign', color: 'success', subtitle: `sur ${conventions.value.length} convention(s)` },
  ]
})

const demandeHeaders = [
  { title: 'Référence', key: 'reference' },
  { title: 'Montant', key: 'montant' },
  { title: 'Dépôt', key: 'depot' },
  { title: 'Statut', key: 'statut' },
]

const conventionHeaders = [
  { title: 'Référence', key: 'reference' },
  { title: 'Contribuable', key: 'contribuable' },
  { title: 'Échéance', key: 'echeance' },
  { title: 'Statut', key: 'statut' },
]

const formatMontant = (v?: string) => {
  const n = Number(v ?? 0)
  return n ? `${n.toLocaleString('fr-FR')} FCFA` : '—'
}
</script>
