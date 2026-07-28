<template>
  <div>
    <PageHeader title="Instruction des agréments" subtitle="Gestion des demandes d'agrément au régime ZF / Code des investissements" icon="mdi-clipboard-text">
      <template #actions>
        <v-btn color="primary" size="small" prepend-icon="mdi-plus" @click="newDemandeDialog=true">Nouvelle demande</v-btn>
      </template>
    </PageHeader>

    <v-row>
      <!-- Table demandes -->
      <v-col cols="12" md="7">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Demandes d'agrément reçues</v-card-title>
          <v-progress-linear v-if="loading" indeterminate color="primary"/>
          <v-alert v-if="loadError" type="error" variant="tonal" density="compact" class="ma-3">{{ loadError }}</v-alert>
          <v-data-table :headers="headers" :items="agrement" hover @click:row="(_, {item}) => openDemande(item)">
            <template #item.statut="{ item }">
              <v-chip :color="statutColor(item.statut)" size="x-small" variant="tonal">{{ item.statutLabel }}</v-chip>
            </template>
            <template #item.emplois="{ item }">
              <!-- TODO(endpoint): les emplois projetés ne sont pas exposés par GET /demandes — vague B backend -->
              <span class="font-weight-medium">{{ item.emplois != null ? item.emplois.toLocaleString('fr-FR') : '—' }}</span>
            </template>
            <template #no-data>
              <div class="text-center pa-6 text-medium-emphasis text-body-2">Aucune demande d'agrément enregistrée.</div>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <!-- Formulaire instruction -->
      <v-col cols="12" md="5">
        <v-card v-if="selected" rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-0 text-body-1 font-weight-semibold d-flex align-center justify-space-between">
            Formulaire d'instruction
            <v-chip :color="statutColor(selected.statut)" size="x-small" variant="tonal">{{ selected.statutLabel }}</v-chip>
          </v-card-title>
          <v-card-text class="pa-4">

            <!-- Identité -->
            <v-text-field :model-value="selected.entreprise" label="Entreprise" readonly class="mb-3"/>

            <v-row dense class="mb-0">
              <v-col cols="6">
                <v-select
                  :model-value="selected.regime"
                  :items="regimes"
                  item-title="label"
                  item-value="value"
                  label="Régime demandé"
                  readonly
                  class="mb-3"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field :model-value="selected.emplois != null ? selected.emplois.toLocaleString('fr-FR') : '—'" label="Emplois projetés" readonly class="mb-3"/>
              </v-col>
            </v-row>

            <!-- Sélecteur Localisation ZF/ZES -->
            <!-- TODO(endpoint): aucun endpoint ne fournit le référentiel des zones ZF/ZES — sélecteur désactivé en attendant la vague B backend -->
            <v-select
              v-model="selected.localisation"
              :items="zonesDisponibles"
              item-title="label"
              item-value="value"
              label="Localisation ZF / ZES"
              prepend-inner-icon="mdi-map-marker"
              class="mb-3"
              :disabled="zonesDisponibles.length === 0"
              :hint="zonesDisponibles.length === 0 ? 'Référentiel des zones non disponible (endpoint à venir)' : (selected.localisation ? zoneHint(selected.localisation) : '')"
              persistent-hint
            >
              <template #item="{ item, props }">
                <v-list-item v-bind="props">
                  <template #subtitle>
                    <span class="text-caption text-medium-emphasis">{{ item.raw.region }} · {{ item.raw.type }}</span>
                  </template>
                </v-list-item>
              </template>
            </v-select>

            <v-row dense>
              <v-col cols="6">
                <v-text-field v-model="selected.montantInvest" label="Montant investissement (FCFA)" type="number" class="mb-3"/>
              </v-col>
              <v-col cols="6">
                <v-text-field v-model="selected.dureeConvention" label="Durée convention (ans)" type="number" class="mb-3" suffix="ans"/>
              </v-col>
            </v-row>

            <v-textarea v-model="selected.evalPlan" label="Plan d'investissement (évaluation)" rows="2" class="mb-3"/>

            <!-- Éligibilité -->
            <div class="mb-4">
              <div class="label-micro text-medium-emphasis mb-2">Vérification éligibilité</div>
              <div class="d-flex flex-wrap ga-1">
                <v-chip
                  v-for="c in criteres"
                  :key="c.label"
                  :color="c.ok?'success':'error'"
                  size="small"
                  variant="tonal"
                  :prepend-icon="c.ok?'mdi-check':'mdi-close'"
                >{{ c.label }}</v-chip>
              </div>
              <div class="text-caption text-medium-emphasis mt-2">
                {{ criteres.filter(c=>c.ok).length }}/{{ criteres.length }} critères satisfaits
              </div>
            </div>

            <div class="mb-4">
              <div class="label-micro text-medium-emphasis mb-2">Variante de regime specialisee</div>
              <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="mb-2 text-caption">
                Documentation normative des régimes (processus MRD) — ne reflète pas l'activité du dossier.
              </v-alert>
              <v-tabs v-model="regimeDetailTab" color="primary" density="compact" class="mb-2">
                <v-tab value="zf">Zone franche</v-tab>
                <v-tab value="ci">Code investissements</v-tab>
                <v-tab value="textile">Textile 2022-021</v-tab>
              </v-tabs>
              <v-window v-model="regimeDetailTab">
                <v-window-item v-for="item in regimeDetails" :key="item.value" :value="item.value">
                  <div class="text-caption text-medium-emphasis mb-2">{{ item.subtitle }}</div>
                  <v-list density="compact" class="pa-0">
                    <v-list-item v-for="point in item.points" :key="point" :title="point" prepend-icon="mdi-check-circle-outline" />
                  </v-list>
                </v-window-item>
              </v-window>
            </div>

            <div class="mb-4">
              <div class="label-micro text-medium-emphasis mb-2">Synthese O2 de l'agrement</div>
              <v-table density="compact">
                <tbody>
                  <tr v-for="item in o2Rows" :key="item.label">
                    <td class="text-caption font-weight-semibold" style="width: 42%;">{{ item.label }}</td>
                    <td class="text-caption">{{ item.value }}</td>
                  </tr>
                </tbody>
              </v-table>
            </div>

            <!-- Workflow de validation -->
            <div class="mb-4">
              <div class="label-micro text-medium-emphasis mb-2">Étape de validation</div>
              <v-stepper v-model="selected.etape" :items="workflowItems" flat style="box-shadow:none"/>
              <div class="d-flex ga-2 mt-2">
                <v-btn size="x-small" variant="outlined" prepend-icon="mdi-arrow-left" :disabled="selected.etape<=1" @click="selected.etape--">Précédent</v-btn>
                <v-btn size="x-small" color="primary" variant="tonal" prepend-icon="mdi-arrow-right" :disabled="selected.etape>=3" @click="selected.etape++">Étape suivante</v-btn>
              </div>
            </div>

            <!-- Notes / Observations -->
            <v-textarea v-model="selected.notes" label="Observations de l'instructeur" rows="2" class="mb-4"/>

            <!-- Actions -->
            <v-divider class="mb-4"/>
            <div class="d-flex ga-2 mb-3">
              <v-btn color="success" variant="tonal" size="small" prepend-icon="mdi-check" @click="selected.statut='approuve';selected.statutLabel='Approuvé'">Valider</v-btn>
              <v-btn color="warning" variant="tonal" size="small" prepend-icon="mdi-comment-alert" @click="selected.statut='action_requise';selected.statutLabel='Action requise'">Demander complément</v-btn>
              <v-btn color="error" variant="tonal" size="small" prepend-icon="mdi-close">Rejeter</v-btn>
            </div>

            <!-- ✅ Bouton générer convention type → ouvre DocumentViewer -->
            <v-btn
              color="primary"
              block
              prepend-icon="mdi-file-certificate"
              :disabled="!selected.localisation"
              @click="openConventionViewer"
            >
              Générer la convention type
            </v-btn>
            <div v-if="!selected.localisation" class="text-caption text-medium-emphasis mt-1 text-center">
              Sélectionnez d'abord une localisation ZF/ZES
            </div>

          </v-card-text>
        </v-card>

        <v-card v-else rounded="lg" elevation="0" color="surface-light" class="pa-6 text-center">
          <v-icon icon="mdi-cursor-pointer" size="36" color="secondary" class="mb-2"/>
          <div class="text-body-2 text-medium-emphasis">Sélectionnez une demande pour instruire</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- ═══ Convention type viewer fullscreen ═══ -->
    <v-dialog v-model="conventionDialog" fullscreen transition="dialog-bottom-transition">
      <v-card>
        <v-toolbar color="secondary" density="compact">
          <v-btn icon="mdi-close" @click="conventionDialog=false"/>
          <v-toolbar-title class="text-body-2">
            Convention type — {{ selected?.entreprise }} · {{ selected?.localisation }}
          </v-toolbar-title>
          <v-spacer/>
          <v-chip color="success" variant="tonal" size="x-small" class="me-2">Pré-remplie</v-chip>
          <v-btn prepend-icon="mdi-download" size="small" variant="tonal" color="white" class="me-2">Télécharger PDF</v-btn>
          <v-btn prepend-icon="mdi-send" size="small" color="white" variant="tonal" class="me-2" @click="conventionDialog=false;selected && (selected.statut='approuve')">
            Transmettre pour signature
          </v-btn>
        </v-toolbar>

        <div style="height:calc(100vh - 48px)" class="d-flex align-center justify-center">
          <!-- TODO(endpoint): la generation du PDF de convention type n'est pas raccordee au backend — etat vide honnete en attendant la vague B -->
          <div class="text-center pa-8 text-medium-emphasis">
            <v-icon icon="mdi-file-pdf-box" size="64" class="mb-4 opacity-30"/>
            <div class="text-body-1 font-weight-semibold mb-2">Convention type non disponible</div>
            <div class="text-body-2">La generation du document de convention sera branchee sur le backend (module documents) dans une prochaine version.</div>
          </div>
        </div>
      </v-card>
    </v-dialog>

    <!-- Nouvelle demande dialog -->
    <v-dialog v-model="newDemandeDialog" max-width="560">
      <v-card rounded="xl">
        <v-card-title class="pa-5">Déposer une demande d'agrément</v-card-title>
        <v-card-text class="pa-5">
          <v-row>
            <v-col cols="12"><v-text-field v-model="newDemande.entreprise" label="Nom de l'entreprise" prepend-inner-icon="mdi-domain"/></v-col>
            <v-col cols="6">
              <v-select v-model="newDemande.regime" :items="regimes" item-title="label" item-value="value" label="Régime demandé"/>
            </v-col>
            <v-col cols="6">
              <v-select v-model="newDemande.localisation" :items="zonesDisponibles" item-title="label" item-value="value" label="Zone / Localisation"/>
            </v-col>
            <v-col cols="6"><v-text-field v-model="newDemande.emplois" label="Emplois projetés" type="number"/></v-col>
            <v-col cols="6"><v-text-field v-model="newDemande.montantInvest" label="Investissement (FCFA)" type="number"/></v-col>
            <v-col cols="12"><v-textarea v-model="newDemande.evalPlan" label="Description du projet" rows="2"/></v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="newDemandeDialog=false">Annuler</v-btn>
          <v-btn color="primary" @click="addDemande">Soumettre</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import { listerDemandes } from '../../services/backoffice'
import { STATUT_LABELS, type StatutDemande } from '../../types'

interface Demande {
  entreprise: string
  regime: string
  emplois: number | null
  statut: string
  statutLabel: string
  localisation: string
  montantInvest: string
  dureeConvention: number | null
  evalPlan: string
  notes: string
  etape: number
}

const selected = ref<Demande | null>(null)
const conventionDialog = ref(false)
const newDemandeDialog = ref(false)
const regimeDetailTab = ref('zf')
const loading = ref(false)
const loadError = ref<string | null>(null)

const newDemande = ref({ entreprise: '', regime: '', localisation: '', emplois: '', montantInvest: '', evalPlan: '' })

// TODO(endpoint): aucun endpoint ne fournit le référentiel des zones ZF/ZES — liste vide (vague B backend)
const zonesDisponibles: { value: string; label: string; region: string; type: string }[] = []

const regimes = [
  { value: 'ZFI', label: 'Zone Franche Industrielle (ZFI)' },
  { value: 'ZES', label: 'Zone Économique Spéciale (ZES)' },
  { value: 'CI', label: "Code des Investissements" },
  { value: 'ZFP', label: 'Zone Franche Portuaire' },
]

const workflowItems = ['Agent instructeur', 'Directeur Agence', 'Notification MEF']

const agrement = ref<Demande[]>([])

onMounted(async () => {
  loading.value = true
  try {
    // NB : le type zone franche / code investissements n'est pas identifiable
    // de façon fiable via baseJuridiqueVersion — on affiche toutes les demandes.
    const data = await listerDemandes()
    agrement.value = data.map((d) => {
      const statutCode = (d.statutCode || 'soumis') as StatutDemande
      return {
        entreprise: d.contribuable?.raisonSociale ?? '—',
        regime: '',
        emplois: null, // TODO(endpoint): emplois projetés non exposés par GET /demandes
        statut: statutCode,
        statutLabel: STATUT_LABELS[statutCode] ?? statutCode,
        localisation: '',
        montantInvest: d.montantFcfa ?? '',
        dureeConvention: null, // TODO(endpoint): durée de convention non exposée
        evalPlan: '',
        notes: '',
        etape: 1,
      }
    })
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Impossible de charger les demandes'
  } finally {
    loading.value = false
  }
})

const criteres = computed(() => [
  { label: 'Investissement ≥ seuil', ok: selected.value ? Number(selected.value.montantInvest) >= 500000000 : false },
  { label: 'Emplois locaux ≥ 60%', ok: selected.value ? (selected.value.emplois ?? 0) >= 50 : false },
  { label: 'Secteur prioritaire', ok: true },
  { label: 'Plan financier validé', ok: selected.value ? !!selected.value.evalPlan || !!selected.value.montantInvest : false },
  { label: 'Zone sélectionnée', ok: selected.value ? !!selected.value.localisation : false },
])

const regimeDetails = [
  {
    value: 'zf',
    subtitle: 'Regime zone franche avec convention, quotas et suivi des engagements d exportation.',
    points: ['Convention SAZOF ou ZFI rattachee', 'Suivi emplois, export et intrants', 'Code additionnel douanier pour equipements et matieres premieres'],
  },
  {
    value: 'ci',
    subtitle: 'Regime code des investissements avec agrement, duree et obligations d investissement.',
    points: ['Reference agrement et article de rattachement', 'Controle CAPEX et emplois projetes', 'Rapprochement OTR / DGBF a l emission de l acte'],
  },
  {
    value: 'textile',
    subtitle: 'Regime specialise textile / habillement 2022-021 avec suivi sectoriel dedie.',
    points: ['Verifier appartenance textile / habillement', 'Suivre les objectifs export et emplois', 'Rattacher les avantages au regime sectoriel et a la duree autorisee'],
  },
]

const o2Rows = computed(() => {
  if (!selected.value) return []
  // Seules les données réelles du dossier sont affichées.
  // TODO(endpoint): references de mesure/decision, code additionnel et piece probante (hash) non exposes par l'API — vague B backend
  return [
    { label: 'contribuable / regime', value: `${selected.value.entreprise} / ${regimeLabel(selected.value.regime) || '—'}` },
    { label: 'montant brut / investissement', value: `${Number(selected.value.montantInvest || 0).toLocaleString('fr-FR')} FCFA` },
    { label: 'emplois / duree', value: `${selected.value.emplois != null ? selected.value.emplois.toLocaleString('fr-FR') : '—'} / ${selected.value.dureeConvention != null ? selected.value.dureeConvention + ' ans' : '—'}` },
  ]
})

const headers = [
  { title: 'Entreprise', key: 'entreprise' },
  { title: 'Régime', key: 'regime' },
  { title: 'Emplois projetés', key: 'emplois' },
  { title: 'Statut', key: 'statut' },
]

function openDemande(item: Demande) {
  selected.value = item
}

function openConventionViewer() {
  conventionDialog.value = true
}

function statutColor(s: string) {
  return { en_instruction: 'info', soumis: 'info', brouillon: 'default', approuve: 'success', action_requise: 'warning', rejete: 'error', expire: 'default', archive: 'default' }[s] || 'default'
}

function regimeLabel(v?: string) {
  return regimes.find(r => r.value === v)?.label || v || ''
}

function zoneFullLabel(v?: string | null) {
  return zonesDisponibles.find(z => z.value === v)?.label || v || ''
}

function zoneHint(v: string) {
  const z = zonesDisponibles.find(z => z.value === v)
  return z ? `${z.type} · Région ${z.region}` : ''
}

function addDemande() {
  agrement.value.push({
    entreprise: newDemande.value.entreprise,
    regime: newDemande.value.regime,
    emplois: newDemande.value.emplois ? Number(newDemande.value.emplois) : null,
    statut: 'soumis',
    statutLabel: 'Soumis',
    localisation: newDemande.value.localisation,
    montantInvest: newDemande.value.montantInvest,
    dureeConvention: null,
    evalPlan: newDemande.value.evalPlan,
    notes: '',
    etape: 1,
  })
  newDemandeDialog.value = false
  newDemande.value = { entreprise: '', regime: '', localisation: '', emplois: '', montantInvest: '', evalPlan: '' }
}
</script>
