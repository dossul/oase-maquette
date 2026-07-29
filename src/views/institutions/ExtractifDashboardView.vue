<template>
  <div>
    <PageHeader
      title="Tableau de bord extractif"
      subtitle="Conventions minieres et petrolieres par phase, rapprochement ITIE et suivi des avantages"
      icon="mdi-pickaxe"
    >
      <template #actions>
        <!-- Pas de bouton « Croiser ITIE » tant que le endpoint ITIE (phase E4) n'existe pas —
             un bouton sans action réelle est de la décoration. -->
        <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-refresh" :loading="loading" @click="charger">Actualiser</v-btn>
      </template>
    </PageHeader>

    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
      <!-- TODO(endpoint): phases recherche/exploitation et écarts ITIE sans endpoint — KPIs masques. -->
    </v-row>

    <v-alert v-if="error" type="error" variant="tonal" rounded="lg" density="compact" class="mb-4">{{ error }}</v-alert>

    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Conventions suivies</v-card-title>
          <v-data-table :headers="headers" :items="rows" :loading="loading" hover no-data-text="Aucune convention enregistrée pour le moment." @click:row="(_, { item }) => ouvrirDetail(item.raw)">
            <template #item.statut="{ item }">
              <v-chip :color="statusColor(item.statut)" size="x-small" variant="outlined">{{ item.statut }}</v-chip>
            </template>
            <template #item.echeance="{ item }">
              <v-chip v-if="item.echeanceProche" color="error" size="x-small" variant="tonal" prepend-icon="mdi-alarm">{{ item.echeance }}</v-chip>
              <span v-else>{{ item.echeance }}</span>
            </template>
          </v-data-table>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Workflow visible par etapes</v-card-title>
          <v-stepper model-value="4" alt-labels>
            <v-stepper-header>
              <v-stepper-item title="Demande permis" value="1" />
              <v-stepper-item title="Negociation" value="2" />
              <v-stepper-item title="Conseil des ministres" value="3" />
              <v-stepper-item title="Ratification / application OTR" value="4" />
              <v-stepper-item title="Suivi DGMG + ITIE" value="5" />
            </v-stepper-header>
          </v-stepper>
        </v-card>

        <!-- TODO(endpoint): lignes O2 par convention (codes additionnels, montants, hashes de pièces)
             sans endpoint probant — carte masquee pour ne pas afficher de références fictives. -->
      </v-col>

      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Contrôle extractif — périmètre couvert</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Phases recherche / exploitation / production" prepend-icon="mdi-layers-outline" />
            <v-list-item title="Avantages differencies par phase" prepend-icon="mdi-format-list-bulleted-square" />
            <v-list-item title="Passage Conseil des ministres / AN" prepend-icon="mdi-bank-outline" />
            <v-list-item title="Suivi premier baril / obligations" prepend-icon="mdi-oil" />
            <v-list-item title="Rapprochement avec publications ITIE" prepend-icon="mdi-file-compare-outline" />
          </v-list>
        </v-card>

        <!-- TODO(endpoint): rapprochement ITIE sans endpoint — carte "Ecarts ITIE" masquee. -->

        <v-card rounded="lg" elevation="1" class="mt-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Points de contrôle extractif</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Convention ratifiee et annexes techniques" prepend-icon="mdi-file-certificate-outline" />
            <v-list-item title="Phase recherche / exploitation / production rattachee" prepend-icon="mdi-layers-triple-outline" />
            <v-list-item title="Code additionnel et flux Sydonia rattaches" prepend-icon="mdi-barcode" />
            <v-list-item title="Reference budgetaire, ITIE et suivi DGMG / CONEDEF" prepend-icon="mdi-source-merge" />
            <v-list-item title="Diffusion confidentielle des actes et avantages sensibles" prepend-icon="mdi-eye-lock-outline" />
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Détail d'une convention (données réelles GET /conventions) -->
    <v-dialog v-model="dialog" max-width="560">
      <v-card v-if="selection" rounded="lg">
        <v-card-title class="d-flex align-center justify-space-between pa-4 pb-2">
          <span class="text-body-1 font-weight-semibold">{{ selection.reference }}</span>
          <v-btn icon="mdi-close" size="x-small" variant="text" @click="dialog = false" />
        </v-card-title>
        <v-card-text class="pa-4 pt-0">
          <div class="mb-3">
            <div class="text-caption text-medium-emphasis text-uppercase font-weight-bold mb-1">Contribuable</div>
            <div class="font-weight-semibold">{{ selection.contribuables?.raisonSociale ?? '—' }}</div>
            <div class="text-caption text-medium-emphasis">NIF {{ selection.contribuables?.nif ?? '—' }}</div>
          </div>
          <v-row dense>
            <v-col cols="6"><div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">Régime</div><div>{{ selection.regimeCode }}</div></v-col>
            <v-col cols="6"><div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">Statut</div><v-chip :color="statusColor(selection.statutCode)" size="x-small" variant="outlined">{{ selection.statutCode }}</v-chip></v-col>
            <v-col cols="6"><div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">Début</div><div>{{ formatDate(selection.dateDebut) }}</div></v-col>
            <v-col cols="6"><div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">Échéance</div><div>{{ formatDate(selection.dateFin) }}</div></v-col>
            <v-col cols="6"><div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">Montant estimé</div><div class="font-weight-semibold text-primary">{{ formatMontant(selection.montantEstime) }}</div></v-col>
            <v-col cols="6"><div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">Emplois</div><div>{{ selection.emploisCrees ?? 0 }} créés / {{ selection.emploisEngages ?? 0 }} engagés</div></v-col>
          </v-row>
          <div v-if="selection.objet" class="mt-3">
            <div class="text-caption text-medium-emphasis text-uppercase font-weight-bold mb-1">Objet</div>
            <div class="text-body-2">{{ selection.objet }}</div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import { listerConventionsReelles, type ConventionApi } from '../../services/backoffice'

const loading = ref(false)
const error = ref<string | null>(null)
const conventions = ref<ConventionApi[]>([])
const dialog = ref(false)
const selection = ref<ConventionApi | null>(null)

async function charger() {
  loading.value = true
  error.value = null
  try {
    conventions.value = await listerConventionsReelles()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Impossible de charger les conventions.'
  } finally {
    loading.value = false
  }
}

onMounted(charger)

function ouvrirDetail(c: ConventionApi) {
  selection.value = c
  dialog.value = true
}

const formatDate = (d: string) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—')
const formatMontant = (m: string | number | null) =>
  m == null ? '—' : `${(Number(m) / 1e9).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mds FCFA`

// Échéance à moins de 12 mois (alerte visible — convention POMAR 2026-12-31 au moment de la recette)
const DANS_12_MOIS = 365 * 24 * 3600 * 1000
const echeanceProche = (c: ConventionApi) =>
  c.statutCode === 'active' && c.dateFin != null && new Date(c.dateFin).getTime() - Date.now() < DANS_12_MOIS

// KPIs calculés sur données réelles (GET /conventions). Les KPIs par phase et les écarts
// ITIE sont masqués : aucun endpoint ne les expose encore (phases E2-E4).
const kpis = computed(() => [
  { label: 'Conventions enregistrees', value: String(conventions.value.length), icon: 'mdi-file-document-outline', color: 'primary', subtitle: 'Source : API /conventions' },
  {
    label: 'Échéances < 12 mois',
    value: String(conventions.value.filter(echeanceProche).length),
    icon: 'mdi-alarm',
    color: 'error',
    subtitle: 'Conventions actives arrivant à terme',
  },
  {
    label: 'Emplois engagés',
    value: conventions.value.reduce((s, c) => s + (c.emploisEngages ?? 0), 0).toLocaleString('fr-FR'),
    icon: 'mdi-account-hard-hat-outline',
    color: 'secondary',
    subtitle: 'Somme des engagements conventions',
  },
])

const headers = [
  { title: 'Reference', key: 'reference' },
  { title: 'Contribuable', key: 'contribuable' },
  { title: 'Regime', key: 'regime' },
  { title: 'Statut', key: 'statut' },
  { title: 'Echeance', key: 'echeance' },
]

const rows = computed(() =>
  conventions.value.map((c) => ({
    reference: c.reference,
    contribuable: c.contribuables?.raisonSociale ?? '—',
    regime: c.regimeCode,
    statut: c.statutCode,
    echeance: c.dateFin ? new Date(c.dateFin).toLocaleDateString('fr-FR') : '—',
    echeanceProche: echeanceProche(c),
    raw: c,
  })),
)

const statusColor = (value: string) =>
  ({ active: 'success', en_attente: 'warning', expiree: 'error' } as Record<string, string>)[value] || 'secondary'
</script>
