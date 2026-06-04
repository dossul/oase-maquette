<template>
  <div>
    <PageHeader
      title="Formulaires dynamiques"
      subtitle="Catalogue des formulaires, versions publiees et regles de transition sans rupture des dossiers existants"
      icon="mdi-form-select"
    >
      <template #actions>
        <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-history">Historique</v-btn>
        <v-btn color="primary" size="small" prepend-icon="mdi-plus-circle" @click="createDialog = true">Nouvelle version</v-btn>
      </template>
    </PageHeader>

    <v-alert type="info" variant="tonal" rounded="lg" class="mb-4">
      La maquette represente ici un pilotage 100 % configurable des formulaires. Une nouvelle version peut etre preparee, relue et publiee sans invalider les donnees collectees avec les versions precedentes.
    </v-alert>

    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <v-tabs v-model="tab" color="primary" density="compact" class="mb-3">
      <v-tab value="catalogue" prepend-icon="mdi-view-list">Catalogue</v-tab>
      <v-tab value="versions" prepend-icon="mdi-source-branch">Versions</v-tab>
      <v-tab value="transitions" prepend-icon="mdi-swap-horizontal">Transitions</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="catalogue">
        <v-card rounded="lg" elevation="1">
          <v-data-table :headers="formHeaders" :items="forms" hover>
            <template #item.regime="{ item }">
              <v-chip size="x-small" color="primary" variant="tonal">{{ item.regime }}</v-chip>
            </template>
            <template #item.versionActive="{ item }">
              <v-chip size="x-small" color="success" variant="tonal">v{{ item.versionActive }}</v-chip>
            </template>
            <template #item.compatibilite="{ item }">
              <v-chip :color="compatColor(item.compatibilite)" size="x-small" variant="tonal">{{ item.compatibilite }}</v-chip>
            </template>
            <template #item.actions="{ item }">
              <v-btn size="x-small" variant="tonal" color="primary" class="me-1" @click="openPreview(item)">Previsualiser</v-btn>
              <v-btn size="x-small" variant="tonal" color="secondary">Versionner</v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <v-window-item value="versions">
        <v-row>
          <v-col cols="12" md="7">
            <v-card rounded="lg" elevation="1">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Versions publiees et dates d'effet</v-card-title>
              <v-data-table :headers="versionHeaders" :items="versions" hover>
                <template #item.statut="{ item }">
                  <v-chip :color="versionStatusColor(item.statut)" size="x-small" variant="tonal">{{ item.statut }}</v-chip>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
          <v-col cols="12" md="5">
            <v-card rounded="lg" elevation="1" class="mb-4">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Principes visibles dans la maquette</v-card-title>
              <v-list density="compact" class="pa-2">
                <v-list-item title="Brouillon, validation, publication, retrait, rollback" prepend-icon="mdi-clipboard-check-outline" />
                <v-list-item title="Date d'effet et date de fin d'effet" prepend-icon="mdi-calendar-range" />
                <v-list-item title="Schema fige pour les dossiers deja ouverts" prepend-icon="mdi-lock-outline" />
                <v-list-item title="Relecture des historiques selon leur version d'origine" prepend-icon="mdi-book-clock-outline" />
                <v-list-item title="Compatibilite ascendante sans perte de donnees" prepend-icon="mdi-database-sync-outline" />
              </v-list>
            </v-card>
            <v-card rounded="lg" elevation="1">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Composition type d'une version</v-card-title>
              <v-card-text class="text-body-2">
                <div class="mb-2"><strong>Champs :</strong> 27 a 42 selon le regime</div>
                <div class="mb-2"><strong>Pieces 1er rang :</strong> quitus OTR, DAS, etats financiers, carte OTR</div>
                <div class="mb-2"><strong>Pieces 2e rang :</strong> emplois, investissements, CA, masse salariale</div>
                <div><strong>Regles :</strong> eligibilite, confidentialite, validations et alertes liees</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <v-window-item value="transitions">
        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Regles de transition visibles par les equipes metier</v-card-title>
          <v-data-table :headers="transitionHeaders" :items="transitions" hover>
            <template #item.impact="{ item }">
              <v-chip :color="impactColor(item.impact)" size="x-small" variant="tonal">{{ item.impact }}</v-chip>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>
    </v-window>

    <v-dialog v-model="previewDialog" max-width="920">
      <v-card v-if="selectedForm" rounded="xl">
        <v-card-title class="pa-5">
          {{ selectedForm.nom }} — v{{ selectedForm.versionActive }}
        </v-card-title>
        <v-card-text class="pa-5 pt-0">
          <v-row>
            <v-col cols="12" md="7">
              <v-card variant="outlined" rounded="lg">
                <v-card-title class="text-body-2 font-weight-semibold">Apercu du formulaire</v-card-title>
                <v-card-text>
                  <v-row dense>
                    <v-col cols="12" md="6"><v-text-field label="Beneficiaire / structure" density="compact" /></v-col>
                    <v-col cols="12" md="6"><v-text-field label="NIF / reference institutionnelle" density="compact" /></v-col>
                    <v-col cols="12" md="6"><v-select :items="['Public','Interne','Restreint','Confidentiel']" label="Confidentialite" density="compact" /></v-col>
                    <v-col cols="12" md="6"><v-text-field label="Date d'effet" type="date" density="compact" /></v-col>
                    <v-col cols="12" md="6"><v-text-field label="Montant brut taxable" density="compact" /></v-col>
                    <v-col cols="12" md="6"><v-text-field label="Taux applique" density="compact" /></v-col>
                    <v-col cols="12" md="6"><v-text-field label="Code additionnel / SI" density="compact" /></v-col>
                    <v-col cols="12" md="6"><v-text-field label="Piece probante PDF + hash" density="compact" /></v-col>
                    <v-col cols="12"><v-textarea label="Motif / base juridique / commentaire" rows="3" density="compact" /></v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="12" md="5">
              <v-card variant="outlined" rounded="lg" class="mb-3">
                <v-card-title class="text-body-2 font-weight-semibold">Version active</v-card-title>
                <v-card-text class="text-body-2">
                  <div class="mb-2"><strong>Regime :</strong> {{ selectedForm.regime }}</div>
                  <div class="mb-2"><strong>Champs :</strong> {{ selectedForm.champs }}</div>
                  <div class="mb-2"><strong>Pieces obligatoires :</strong> {{ selectedForm.pieces }}</div>
                  <div><strong>Date d'effet :</strong> {{ selectedForm.dateEffet }}</div>
                </v-card-text>
              </v-card>
              <v-card variant="outlined" rounded="lg">
                <v-card-title class="text-body-2 font-weight-semibold">Garanties de coherence</v-card-title>
                <v-list density="compact" class="pa-2">
                  <v-list-item title="Aucun dossier existant n'est remappe de force" prepend-icon="mdi-lock-check-outline" />
                  <v-list-item title="Les nouvelles demandes utilisent la version publiee" prepend-icon="mdi-file-replace-outline" />
                  <v-list-item title="Les anciennes versions restent consultables" prepend-icon="mdi-history" />
                  <v-list-item title="Les 17 attributs O2 peuvent etre rendus obligatoires par version" prepend-icon="mdi-format-list-checks" />
                </v-list>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="previewDialog = false">Fermer</v-btn>
          <v-btn color="primary">Ouvrir dans le catalogue</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="createDialog" max-width="620">
      <v-card rounded="xl">
        <v-card-title class="pa-5">Preparer une nouvelle version</v-card-title>
        <v-card-text class="pa-5 pt-0">
          <v-row dense>
            <v-col cols="12" md="6"><v-select :items="forms.map(f => f.nom)" label="Formulaire source" density="compact" /></v-col>
            <v-col cols="12" md="6"><v-text-field label="Nouvelle version" value="v4" density="compact" /></v-col>
            <v-col cols="12" md="6"><v-text-field label="Date d'effet" type="date" density="compact" /></v-col>
            <v-col cols="12" md="6"><v-select :items="['Sans impact historique', 'Compatibilite a verifier', 'Migration guidee']" label="Mode transition" density="compact" /></v-col>
            <v-col cols="12"><v-textarea rows="3" label="Justification de version" density="compact" /></v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="createDialog = false">Annuler</v-btn>
          <v-btn color="primary" @click="createDialog = false">Creer le brouillon</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'

type FormItem = {
  nom: string
  regime: string
  versionActive: number
  champs: number
  pieces: number
  dateEffet: string
  compatibilite: string
}

const tab = ref('catalogue')
const previewDialog = ref(false)
const createDialog = ref(false)
const selectedForm = ref<FormItem | null>(null)

const kpis = [
  { label: 'Formulaires actifs', value: '18', icon: 'mdi-form-select', color: 'primary', subtitle: 'Toutes familles confondues' },
  { label: 'Versions historisees', value: '46', icon: 'mdi-source-branch', color: 'info', subtitle: 'Relecture des anciens dossiers' },
  { label: 'Transitions sans impact', value: '14', icon: 'mdi-shield-check', color: 'success', subtitle: 'Compatibilite preservee' },
  { label: 'Brouillons en revue', value: '5', icon: 'mdi-file-edit-outline', color: 'warning', subtitle: 'A publier apres validation' },
]

const forms: FormItem[] = [
  { nom: 'Demande exonération standard', regime: 'OTR / CI', versionActive: 3, champs: 31, pieces: 4, dateEffet: '01/06/2026', compatibilite: 'Compatible' },
  { nom: 'Accord de siege', regime: 'MAE / OTR', versionActive: 2, champs: 27, pieces: 5, dateEffet: '15/05/2026', compatibilite: 'Historise' },
  { nom: 'Convention miniere / petroliere', regime: 'DGMG', versionActive: 4, champs: 42, pieces: 6, dateEffet: '01/07/2026', compatibilite: 'Transition guidee' },
  { nom: 'Zone franche textile / habillement', regime: 'SAZOF', versionActive: 2, champs: 34, pieces: 5, dateEffet: '10/06/2026', compatibilite: 'Compatible' },
]

const versions = [
  { formulaire: 'Demande exonération standard', version: 'v3', dateEffet: '01/06/2026', dateFin: '—', statut: 'Active', note: 'Ajout pieces 1er rang' },
  { formulaire: 'Demande exonération standard', version: 'v2', dateEffet: '01/01/2026', dateFin: '31/05/2026', statut: 'Historisee', note: 'Schema campagne 2026 initiale' },
  { formulaire: 'Convention miniere / petroliere', version: 'v4', dateEffet: '01/07/2026', dateFin: '—', statut: 'Brouillon', note: 'Ajout phases recherche / exploitation' },
  { formulaire: 'Accord de siege', version: 'v2', dateEffet: '15/05/2026', dateFin: '—', statut: 'Active', note: 'Listes personnel et immatriculations' },
]

const transitions = [
  { changement: 'Ajout de 2 pieces premier rang', dossiersExistants: 'Conserves en v2', nouveauxDossiers: 'Utilisent v3', impact: 'Sans rupture' },
  { changement: 'Nouveau champ code additionnel', dossiersExistants: 'Lecture seule maintenue', nouveauxDossiers: 'Champ obligatoire', impact: 'Guidee' },
  { changement: 'Scission du regime textile', dossiersExistants: 'Conserves sous ancien libelle', nouveauxDossiers: 'Version specialisee', impact: 'Sans rupture' },
  { changement: 'Circuit multi-visa conventions minieres', dossiersExistants: 'Historique preserve', nouveauxDossiers: 'Nouveau workflow associe', impact: 'Guidee' },
]

const formHeaders = [
  { title: 'Formulaire', key: 'nom' },
  { title: 'Regime', key: 'regime' },
  { title: 'Version active', key: 'versionActive' },
  { title: 'Champs', key: 'champs' },
  { title: 'Pieces', key: 'pieces' },
  { title: 'Date d effet', key: 'dateEffet' },
  { title: 'Compatibilite', key: 'compatibilite' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const versionHeaders = [
  { title: 'Formulaire', key: 'formulaire' },
  { title: 'Version', key: 'version' },
  { title: 'Date d effet', key: 'dateEffet' },
  { title: 'Date de fin', key: 'dateFin' },
  { title: 'Statut', key: 'statut' },
  { title: 'Note', key: 'note' },
]

const transitionHeaders = [
  { title: 'Changement', key: 'changement' },
  { title: 'Dossiers existants', key: 'dossiersExistants' },
  { title: 'Nouveaux dossiers', key: 'nouveauxDossiers' },
  { title: 'Impact', key: 'impact' },
]

const openPreview = (item: FormItem) => {
  selectedForm.value = item
  previewDialog.value = true
}

const compatColor = (value: string) =>
  ({ Compatible: 'success', Historise: 'info', 'Transition guidee': 'warning' } as Record<string, string>)[value] || 'secondary'

const versionStatusColor = (value: string) =>
  ({ Active: 'success', Historisee: 'secondary', Brouillon: 'warning' } as Record<string, string>)[value] || 'secondary'

const impactColor = (value: string) =>
  ({ 'Sans rupture': 'success', Guidee: 'warning' } as Record<string, string>)[value] || 'secondary'
</script>
