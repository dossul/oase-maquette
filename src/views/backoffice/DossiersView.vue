<template>
  <div>
    <PageHeader title="Liste des dossiers" subtitle="Recherchez, filtrez et gérez tous les dossiers d'exonération" icon="mdi-folder-multiple">
      <template #actions>
        <ExportButton @export="() => {}" size="small" />
      </template>
    </PageHeader>
    <v-card rounded="lg" elevation="1">
      <v-card-text class="pa-4">
        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field v-model="search" label="Recherche (référence, NIF, RCCM, contribuable…)" prepend-inner-icon="mdi-magnify" hide-details clearable />
          </v-col>
          <v-col cols="6" md="2">
            <v-select v-model="filterStatut" :items="statutItems" item-title="title" item-value="value" label="Statut" hide-details clearable />
          </v-col>
          <v-col cols="6" md="2">
            <v-select v-model="filterSecteur" :items="secteurItems" label="Secteur" hide-details clearable />
          </v-col>
          <v-col cols="6" md="2">
            <v-text-field v-model="filterPeriode" label="Période" type="month" hide-details />
          </v-col>
        </v-row>
      </v-card-text>
      <v-progress-linear v-if="loading" indeterminate color="primary" />
      <v-alert v-if="error" type="error" variant="tonal" density="compact" class="ma-4">{{ error }}</v-alert>
      <v-alert v-if="info" type="success" variant="tonal" density="compact" class="ma-4" closable @click:close="info=null">{{ info }}</v-alert>
      <v-data-table
        :headers="headers"
        :items="filteredDossiers"
        :search="search"
        :items-per-page="50"
        hover
        @click:row="(_, { item }) => $router.push(`${basePath}/dossiers/${item.id}/instruction`)"
      >
        <template #item.contribuable="{ item }">
          <span class="text-body-2">{{ item.contribuable }}</span>
          <div class="text-caption text-medium-emphasis">{{ item.nif }}</div>
        </template>
        <template #item.statut="{ item }">
          <StatusChip :statut="item.statut" />
        </template>
        <template #item.montantFCFA="{ item }">
          <span class="font-weight-semibold">{{ formatMontant(item.montantFCFA) }}</span>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            v-if="item.statut === 'soumis'"
            size="x-small"
            color="warning"
            variant="tonal"
            class="me-1"
            :loading="takingChargeId === item.id"
            @click.stop="prendreEnChargeDossier(item.id)"
          >Prendre en charge</v-btn>
          <v-btn :to="`${basePath}/dossiers/${item.id}/instruction`" size="x-small" color="primary" variant="tonal" class="me-1" @click.stop>Instruire</v-btn>
          <v-btn v-if="basePath === '/backoffice'" :to="`${basePath}/dossiers/${item.id}/validation`" size="x-small" color="success" variant="tonal" @click.stop>Valider</v-btn>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '../../components/PageHeader.vue'
import ExportButton from '../../components/ExportButton.vue'
import StatusChip from '../../components/StatusChip.vue'
import { STATUT_LABELS, type StatutDemande } from '../../types'
import { listerDemandes, prendreEnCharge, type DemandeApi } from '../../services/backoffice'

const route = useRoute()
// La vue est mutualisée : /backoffice/dossiers (P2) et /agences/dossiers (P3).
const basePath = computed(() => (route.path.startsWith('/agences') ? '/agences' : '/backoffice'))

interface DossierRow {
  id: string
  reference: string
  contribuable: string
  nif: string
  secteur: string
  dateDepot: string
  statut: StatutDemande
  montantFCFA: number
}

const search = ref('')
const filterStatut = ref<string | null>(null)
const filterSecteur = ref<string | null>(null)
const filterPeriode = ref('')
const dossiers = ref<DossierRow[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const info = ref<string | null>(null)
const takingChargeId = ref<string | null>(null)

// Taxonomie centralisée : les statuts proposés au filtre sont ceux de STATUT_LABELS (hors alias legacy).
const statutItems = (Object.keys(STATUT_LABELS) as StatutDemande[])
  .filter((s) => s !== 'en_cours' && s !== 'brouillon')
  .map((s) => ({ title: STATUT_LABELS[s], value: s }))

const secteurItems = computed(() => [...new Set(dossiers.value.map((d) => d.secteur).filter((s) => s && s !== '—'))])

const headers = [
  { title: 'Référence', key: 'reference' },
  { title: 'Contribuable', key: 'contribuable' },
  { title: 'Secteur', key: 'secteur' },
  { title: 'Dépôt', key: 'dateDepot' },
  { title: 'Statut', key: 'statut' },
  { title: 'Montant', key: 'montantFCFA' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const toRow = (d: DemandeApi): DossierRow => ({
  id: d.id,
  reference: d.reference,
  contribuable: d.contribuable?.raisonSociale ?? '—',
  nif: d.contribuable?.nif ?? '',
  secteur: d.secteur ?? '—',
  dateDepot: d.dateDepot ? new Date(d.dateDepot).toLocaleDateString('fr-FR') : '—',
  statut: d.statutCode as StatutDemande,
  montantFCFA: Number(d.montantFcfa ?? 0),
})

async function reload() {
  loading.value = true
  error.value = null
  try {
    dossiers.value = (await listerDemandes({ limit: 100 })).map(toRow)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Impossible de charger les dossiers'
  } finally {
    loading.value = false
  }
}

async function prendreEnChargeDossier(id: string) {
  takingChargeId.value = id
  error.value = null
  info.value = null
  try {
    await prendreEnCharge(id)
    info.value = 'Dossier pris en charge — il est maintenant en instruction sous votre nom.'
    await reload()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'La prise en charge a échoué'
  } finally {
    takingChargeId.value = null
  }
}

const filteredDossiers = computed(() => dossiers.value.filter((d) => {
  if (filterStatut.value && d.statut !== filterStatut.value) return false
  if (filterSecteur.value && d.secteur !== filterSecteur.value) return false
  if (filterPeriode.value && !(d.dateDepot || '').endsWith(filterPeriode.value.split('-').reverse().join('/'))) return false
  return true
}))

const formatMontant = (v: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v) + ' F'

onMounted(reload)
</script>
