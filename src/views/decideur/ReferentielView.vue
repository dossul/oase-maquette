<template>
  <div>
    <PageHeader title="Référentiels OASE" subtitle="Textes juridiques (API /bases-juridiques) et nomenclatures normées alimentant OASE" icon="mdi-shape-plus"/>
    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <v-card rounded="lg" elevation="1">
          <v-card-text class="pa-4">
            <div class="text-caption text-medium-emphasis">{{ kpi.label }}</div>
            <div class="text-h6 font-weight-bold">{{ kpi.value }}</div>
            <div class="text-caption">{{ kpi.subtitle }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" variant="tonal" rounded="lg" density="compact" class="mb-4">{{ error }}</v-alert>

    <v-tabs v-model="tab" color="primary" density="compact" class="mb-3">
      <v-tab value="juridique" prepend-icon="mdi-gavel">Juridique</v-tab>
      <v-tab value="normes" prepend-icon="mdi-table-column-plus-after">{{ referentielsNormes.length }} référentiels</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="juridique">
        <v-card rounded="lg" elevation="1">
          <v-card-text class="pa-4">
            <v-row dense>
              <v-col cols="12" md="5"><v-text-field v-model="search" label="Recherche full-text dans les textes…" prepend-inner-icon="mdi-magnify" hide-details clearable/></v-col>
              <v-col cols="6" md="3"><v-select v-model="filterType" :items="typeTextes" label="Type de texte" hide-details clearable/></v-col>
              <v-col cols="6" md="2"><v-select v-model="filterStatut" :items="['En vigueur','Abrogé']" label="Statut" hide-details clearable/></v-col>
            </v-row>
          </v-card-text>
          <v-data-table :headers="headers" :items="filteredTextes" :search="search" :loading="loading" hover no-data-text="Aucun texte juridique au référentiel.">
            <template #item.impotConcerne="{ item }">
              <v-chip v-if="item.impotConcerne" color="info" size="x-small" variant="tonal">{{ item.impotConcerne }}</v-chip>
              <span v-else class="text-medium-emphasis">—</span>
            </template>
            <template #item.dateAdoption="{ item }">
              {{ item.dateAdoption ? new Date(item.dateAdoption).toLocaleDateString('fr-FR') : '—' }}
            </template>
            <template #item.statut="{ item }">
              <v-chip :color="item.estActive ? 'success' : 'error'" size="x-small" variant="tonal">{{ item.estActive ? 'En vigueur' : 'Abrogé' }}</v-chip>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <v-window-item value="normes">
        <v-card rounded="lg" elevation="1">
          <v-data-table :headers="refHeaders" :items="referentielsNormes" hover/>
        </v-card>
      </v-window-item>
    </v-window>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import { listerBasesJuridiques, type ApiBaseJuridiqueVersion } from '../../services/portail'

const search = ref('')
const filterType = ref<string | null>(null)
const filterStatut = ref<string | null>(null)
const tab = ref('juridique')

const loading = ref(false)
const error = ref<string | null>(null)
const textes = ref<ApiBaseJuridiqueVersion[]>([])

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    textes.value = await listerBasesJuridiques()
  } catch {
    error.value = 'Impossible de charger les bases juridiques.'
  } finally {
    loading.value = false
  }
})

const typeTextes = computed(() =>
  [...new Set(textes.value.map((t) => t.typeTexte1).filter((t): t is string => !!t))].sort(),
)

const kpis = computed(() => [
  { label: 'Textes au référentiel', value: String(textes.value.length), subtitle: 'Versions courantes (API)' },
  { label: 'Textes en vigueur', value: String(textes.value.filter((t) => t.estActive).length), subtitle: 'Bases juridiques actives' },
  { label: 'Types de texte', value: String(typeTextes.value.length), subtitle: 'Loi, décret, convention…' },
  { label: 'Référentiels normés', value: String(referentielsNormes.length), subtitle: 'Nomenclatures OASE' },
])

const headers = [
  { title: 'Mesure', key: 'codeMesure' },
  { title: 'Type', key: 'typeTexte1' },
  { title: 'Libellé', key: 'libelle' },
  { title: 'Impôt', key: 'impotConcerne' },
  { title: 'Organe gestion', key: 'organeGestionCode' },
  { title: 'Adoption', key: 'dateAdoption' },
  { title: 'Statut', key: 'statut' },
]
const refHeaders = [
  { title: 'Référentiel', key: 'nom' },
  { title: 'Description', key: 'description' },
  { title: 'Point focal', key: 'pointFocal' },
]

/** Nomenclatures normées OASE (référentiel institutionnel — pas de métrique chiffrée sans source API). */
const referentielsNormes = [
  { nom: 'R_FAMILLE_TEXTE', description: 'Famille de texte et hiérarchie juridique', pointFocal: 'UPF' },
  { nom: 'R_TYPE_ACTE', description: 'Loi, décret, convention, accord, arrêté, agrément', pointFocal: 'UPF' },
  { nom: 'R_NATURE_MESURE', description: 'Exonération, franchise, report, suspension, taux réduit', pointFocal: 'UPF' },
  { nom: 'R_IMPOT_TAXE', description: 'TVA, IS, IRPP, DD, RS, TPI, ADA, DAPP, TSR', pointFocal: 'OTR' },
  { nom: 'R_TYPE_CONTRIBUABLE', description: 'Entreprise, ONG, OI, corps diplomatique, projet public', pointFocal: 'MEF / MAE' },
  { nom: 'R_SECTEUR_BRANCHE', description: 'Secteur et branche NES', pointFocal: 'INSEED' },
  { nom: 'R_OBJECTIF_POLITIQUE', description: 'Objectif fiscal, économique, social, sectoriel, ODD', pointFocal: 'UPF' },
  { nom: 'R_ORGANE', description: 'Organe attributaire, gestionnaire et de contrôle', pointFocal: 'MEF / OTR' },
  { nom: 'R_SYSTEME_INFORMATION', description: 'Sydonia, E-TAX, DAS, GUDEF, SIGFiP, SIGTAS', pointFocal: 'DSI/MEF' },
  { nom: 'R_PORTEE_DUREE', description: 'Temporaire, permanente, renouvelable, par phase', pointFocal: 'UPF' },
  { nom: 'R_FONCTION_BUDGETAIRE', description: 'Rattachement budgétaire et fonction de politique publique', pointFocal: 'DGBF' },
]

const filteredTextes = computed(() =>
  textes.value
    .map((t) => ({ ...t, codeMesure: t.basesJuridiques?.codeMesure ?? '—' }))
    .filter((t) => {
      if (filterStatut.value === 'En vigueur' && !t.estActive) return false
      if (filterStatut.value === 'Abrogé' && t.estActive) return false
      if (filterType.value && t.typeTexte1 !== filterType.value) return false
      return true
    }),
)
</script>
