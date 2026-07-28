<template>
  <div>
    <PageHeader title="Mes demandes" subtitle="Historique complet de vos demandes d'exonération" icon="mdi-file-document-multiple">
      <template #actions>
        <ExportButton label="Exporter" size="small" :disabled-formats="['pdf']" @export="onExport" />
      </template>
    </PageHeader>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
    <v-alert v-if="error" type="error" variant="tonal" density="compact" rounded="lg" class="mb-4">{{ error }}</v-alert>

    <v-card rounded="lg" elevation="1">
      <div class="pa-4 pb-2 d-flex align-center flex-wrap ga-3">
        <v-text-field
          v-model="search"
          label="Rechercher (n°, secteur, étape)"
          density="compact"
          variant="outlined"
          hide-details
          clearable
          style="max-width:320px"
          prepend-inner-icon="mdi-magnify"
        />
        <v-spacer />
        <v-chip-group v-model="activeFilter" selected-class="bg-primary text-white" mandatory>
          <v-chip v-for="f in filters" :key="f.value" :value="f.value" size="small" variant="tonal" filter>
            {{ f.label }}
          </v-chip>
        </v-chip-group>
      </div>

      <v-data-table
        :headers="headers"
        :items="filteredDemandes"
        :loading="loading"
        :items-per-page="20"
        hover
        @click:row="openDemande"
      >
        <template #item.reference="{ item }">
          <span class="text-primary font-weight-medium" style="cursor:pointer">{{ item.reference }}</span>
        </template>
        <template #item.statut="{ item }">
          <StatusChip :statut="item.statut" />
        </template>
        <template #item.montant="{ item }">
          <span class="text-body-2 font-weight-medium">{{ formatMontant(item.montant) }}</span>
        </template>
        <template #item.dateDepot="{ item }">
          <span class="text-body-2 text-medium-emphasis">{{ formatDate(item.dateDepot) }}</span>
        </template>
        <template #no-data>
          <div class="pa-8 text-center text-medium-emphasis">
            <v-icon size="40" class="mb-2">mdi-file-search-outline</v-icon>
            <div>Aucune demande ne correspond à ces critères</div>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '../../components/PageHeader.vue'
import StatusChip from '../../components/StatusChip.vue'
import ExportButton from '../../components/ExportButton.vue'
import { listerDemandes } from '../../services/demandes'
import { exporterMesDemandes } from '../../services/portail'
import type { StatutDemande } from '../../types'

interface DemandeLigne {
  id: string
  reference: string
  statut: StatutDemande
  montant: number
  secteur: string
  dateDepot: string
  etapeActuelle: string
}

const router = useRouter()
const demandes = ref<DemandeLigne[]>([])
const loading = ref(false)
const error = ref('')
const search = ref('')
const activeFilter = ref('all')

// Statuts CANONIQUES de l'API (alignés sur DashboardView)
const filters = [
  { label: 'Toutes', value: 'all' },
  { label: 'Brouillons', value: 'brouillon' },
  { label: 'Soumises', value: 'soumis' },
  { label: 'En instruction', value: 'en_instruction' },
  { label: 'Action requise', value: 'action_requise' },
  { label: 'Approuvées', value: 'approuve' },
  { label: 'Rejetées', value: 'rejete' },
  { label: 'Archivées', value: 'archive' },
]

onMounted(async () => {
  loading.value = true
  try {
    const res = await listerDemandes()
    demandes.value = res.data.map((d) => ({
      id: d.id,
      reference: d.reference,
      statut: d.statutCode as StatutDemande,
      montant: Number(d.montantFcfa),
      secteur: d.secteur || '—',
      dateDepot: d.dateDepot ? new Date(d.dateDepot).toISOString() : '',
      etapeActuelle: d.etapeActuelle || d.statutCode,
    }))
  } catch {
    error.value = 'Impossible de charger la liste des demandes'
  } finally {
    loading.value = false
  }
})

const filteredDemandes = computed(() => {
  let list = activeFilter.value === 'all' ? demandes.value : demandes.value.filter(d => d.statut === activeFilter.value)
  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(d =>
      d.reference.toLowerCase().includes(q) ||
      d.secteur.toLowerCase().includes(q) ||
      d.etapeActuelle.toLowerCase().includes(q)
    )
  }
  return list
})

const headers = [
  { title: 'N° demande', key: 'reference' },
  { title: 'Statut', key: 'statut' },
  { title: 'Étape actuelle', key: 'etapeActuelle' },
  { title: 'Secteur', key: 'secteur' },
  { title: 'Montant', key: 'montant', align: 'end' as const },
  { title: 'Déposée le', key: 'dateDepot' },
]

function openDemande(_event: unknown, row: { item: DemandeLigne }) {
  router.push(`/portail/demandes/${row.item.id}`)
}

/** US-P1-11 — export CSV/XLSX généré côté serveur. */
async function onExport(format: string) {
  error.value = ''
  try {
    await exporterMesDemandes(format === 'excel' ? 'xlsx' : 'csv')
  } catch (e) {
    error.value = e instanceof Error ? e.message : "Échec de l'export des demandes"
  }
}

const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—')
const formatMontant = (v: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(v)
</script>
