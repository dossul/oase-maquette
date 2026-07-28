<template>
  <div>
    <PageHeader
      title="Registre central des mesures"
      subtitle="Vue consolidée par base juridique — agrégats réels (demandes, décisions, montants accordés)"
      icon="mdi-database-eye"
    >
      <template #actions>
        <v-chip color="primary" variant="tonal" size="small" prepend-icon="mdi-api">
          API /registre-central/mesures
        </v-chip>
      </template>
    </PageHeader>

    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
    <v-alert v-if="error" type="error" variant="tonal" rounded="lg" density="compact" class="mb-4">{{ error }}</v-alert>

    <v-card rounded="lg" elevation="1" class="mb-4">
      <v-card-text class="pa-4">
        <v-row dense>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="search"
              label="Recherche mesure, libellé, impôt, organe..."
              prepend-inner-icon="mdi-magnify"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="6" md="3">
            <v-select v-model="filterImpot" :items="impots" label="Impôt concerné" hide-details clearable />
          </v-col>
          <v-col cols="6" md="3">
            <v-select v-model="filterStatut" :items="['Active', 'Inactive']" label="Statut" hide-details clearable />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card rounded="lg" elevation="1">
      <v-data-table
        :headers="headers"
        :items="filteredItems"
        :search="search"
        :loading="loading"
        hover
        no-data-text="Aucune mesure au registre central."
        @click:row="(_, { item }) => openDetails(item)"
      >
        <template #item.impotConcerne="{ item }">
          <v-chip v-if="item.impotConcerne" size="x-small" color="primary" variant="tonal">{{ item.impotConcerne }}</v-chip>
          <span v-else class="text-medium-emphasis">—</span>
        </template>
        <template #item.estActive="{ item }">
          <v-chip :color="item.estActive ? 'success' : 'secondary'" size="x-small" variant="tonal">
            {{ item.estActive ? 'Active' : 'Inactive' }}
          </v-chip>
        </template>
        <template #item.montantTotalAccorde="{ item }">
          <span class="font-weight-semibold">{{ formatFcfa(item.montantTotalAccorde) }}</span>
        </template>
        <template #item.derniereDecision="{ item }">
          <span v-if="item.derniereDecision">
            {{ item.derniereDecision.typeCode }} — {{ formatDate(item.derniereDecision.date) }}
          </span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>
        <template #item.actions="{ item }">
          <v-btn size="x-small" variant="tonal" color="primary" @click.stop="openDetails(item)">Détail</v-btn>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="detailsDialog" max-width="720">
      <v-card v-if="selected" rounded="xl">
        <v-card-title class="pa-5 d-flex align-center justify-space-between">
          <div>
            <div class="text-h6">{{ selected.codeMesure }}</div>
            <div class="text-body-2 text-medium-emphasis">{{ selected.libelle || 'Libellé non renseigné' }}</div>
          </div>
          <v-chip :color="selected.estActive ? 'success' : 'secondary'" size="small" variant="tonal">
            {{ selected.estActive ? 'Active' : 'Inactive' }}
          </v-chip>
        </v-card-title>
        <v-card-text class="pa-5 pt-0">
          <v-card variant="outlined" rounded="lg" class="mb-3">
            <v-card-title class="text-body-2 font-weight-semibold">Base juridique</v-card-title>
            <v-list density="comfortable">
              <v-list-item title="Code mesure" :subtitle="selected.codeMesure" prepend-icon="mdi-identifier" />
              <v-list-item title="Type de texte" :subtitle="selected.typeTexte1 || '—'" prepend-icon="mdi-gavel" />
              <v-list-item title="Impôt concerné" :subtitle="selected.impotConcerne || '—'" prepend-icon="mdi-bank-outline" />
              <v-list-item title="Organe de gestion" :subtitle="selected.organeGestionCode || '—'" prepend-icon="mdi-office-building" />
            </v-list>
          </v-card>

          <v-card variant="outlined" rounded="lg">
            <v-card-title class="text-body-2 font-weight-semibold">Agrégats réels (demandes et décisions)</v-card-title>
            <v-list density="comfortable">
              <v-list-item title="Demandes déposées" :subtitle="String(selected.nombreDemandes)" prepend-icon="mdi-file-document-outline" />
              <v-list-item title="Demandes approuvées" :subtitle="String(selected.nombreApprouvees)" prepend-icon="mdi-check-decagram" />
              <v-list-item title="Montant total accordé" :subtitle="formatFcfa(selected.montantTotalAccorde)" prepend-icon="mdi-currency-usd" />
              <v-list-item
                title="Dernière décision"
                :subtitle="selected.derniereDecision ? `${selected.derniereDecision.typeCode} — ${formatDate(selected.derniereDecision.date)}` : 'Aucune décision enregistrée'"
                prepend-icon="mdi-file-sign"
              />
            </v-list>
          </v-card>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="detailsDialog = false">Fermer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import { listerMesuresRegistre, formatFcfa, type MesureRegistre } from '../../services/decideur'

const search = ref('')
const filterImpot = ref<string | null>(null)
const filterStatut = ref<string | null>(null)
const detailsDialog = ref(false)
const selected = ref<MesureRegistre | null>(null)

const loading = ref(false)
const error = ref<string | null>(null)
const mesures = ref<MesureRegistre[]>([])

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    mesures.value = await listerMesuresRegistre()
  } catch {
    error.value = 'Impossible de charger le registre central des mesures.'
  } finally {
    loading.value = false
  }
})

const headers = [
  { title: 'Mesure', key: 'codeMesure' },
  { title: 'Libellé', key: 'libelle' },
  { title: 'Impôt', key: 'impotConcerne' },
  { title: 'Organe gestion', key: 'organeGestionCode' },
  { title: 'Statut', key: 'estActive' },
  { title: 'Demandes', key: 'nombreDemandes' },
  { title: 'Approuvées', key: 'nombreApprouvees' },
  { title: 'Montant accordé', key: 'montantTotalAccorde' },
  { title: 'Dernière décision', key: 'derniereDecision', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]

const impots = computed(() =>
  [...new Set(mesures.value.map((m) => m.impotConcerne).filter((i): i is string => !!i))].sort(),
)

const totalMontant = computed(() =>
  mesures.value.reduce((acc, m) => acc + Number(m.montantTotalAccorde), 0),
)

const kpis = computed(() => [
  {
    label: 'Mesures au registre',
    value: String(mesures.value.length),
    icon: 'mdi-database',
    color: 'primary',
    subtitle: 'Bases juridiques consolidées',
  },
  {
    label: 'Mesures actives',
    value: String(mesures.value.filter((m) => m.estActive).length),
    icon: 'mdi-check-circle',
    color: 'success',
    subtitle: 'Version courante en vigueur',
  },
  {
    label: 'Demandes déposées',
    value: String(mesures.value.reduce((acc, m) => acc + m.nombreDemandes, 0)),
    icon: 'mdi-file-document-outline',
    color: 'info',
    subtitle: `${mesures.value.reduce((acc, m) => acc + m.nombreApprouvees, 0)} approuvée(s)`,
  },
  {
    label: 'Montant total accordé',
    value: formatFcfa(totalMontant.value),
    icon: 'mdi-currency-usd',
    color: 'warning',
    subtitle: 'Demandes approuvées, toutes mesures',
  },
])

const filteredItems = computed(() =>
  mesures.value.filter((m) => {
    if (filterImpot.value && m.impotConcerne !== filterImpot.value) return false
    if (filterStatut.value === 'Active' && !m.estActive) return false
    if (filterStatut.value === 'Inactive' && m.estActive) return false
    return true
  }),
)

const openDetails = (item: MesureRegistre) => {
  selected.value = item
  detailsDialog.value = true
}

const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR')
</script>
