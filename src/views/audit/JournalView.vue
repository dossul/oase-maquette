<template>
  <div>
    <PageHeader title="Journal d'audit inaltérable" subtitle="Traçabilité complète de toutes les actions — Lecture seule absolue" icon="mdi-shield-lock">
      <template #actions>
        <v-chip color="error" variant="tonal" size="small" prepend-icon="mdi-lock" class="me-2">Inaltérable</v-chip>
        <ExportButton
          label="Export certifié"
          policy-label="Politique de diffusion"
          restriction-note="Format bloqué hors habilitation audit renforcée"
          :disabled-formats="['excel']"
          :formats="[
            {value:'csv',label:'CSV signé numériquement',icon:'mdi-file-delimited'},
            {value:'pdf',label:'PDF avec empreinte',icon:'mdi-file-pdf-box'},
            {value:'excel',label:'Excel nominatif',icon:'mdi-microsoft-excel'}
          ]"
          @export="() => {}"
        />
      </template>
    </PageHeader>
    <v-alert type="warning" variant="tonal" rounded="lg" density="compact" class="mb-4">
      Ce journal est en lecture seule. Aucune modification, suppression ou édition n'est possible. Toute consultation est elle-même journalisée.
    </v-alert>
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">{{ error }}</v-alert>
    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1">
          <v-card-text class="pa-4">
            <v-row dense>
              <v-col cols="12" md="4"><v-text-field v-model="search" label="Référence dossier, utilisateur, action…" prepend-inner-icon="mdi-magnify" hide-details clearable/></v-col>
              <v-col cols="6" md="2"><v-select v-model="filterAction" :items="actionsConnues" label="Action" hide-details/></v-col>
              <v-col cols="6" md="2"><v-select v-model="filterStructure" :items="structuresConnues" label="Structure" hide-details/></v-col>
              <v-col cols="6" md="2"><v-text-field v-model="dateDebut" label="Du" type="date" hide-details/></v-col>
              <v-col cols="6" md="2"><v-text-field v-model="dateFin" label="Au" type="date" hide-details/></v-col>
            </v-row>
          </v-card-text>
          <v-data-table-server
            :headers="headers"
            :items="logsFiltres"
            :items-length="total"
            :loading="loading"
            v-model:page="page"
            v-model:items-per-page="limit"
            @update:options="charger"
            hover
            density="comfortable"
          >
            <template #item.horodatage="{ item }">
              <span class="text-caption font-weight-medium">{{ formatDate(item.horodatage) }}</span>
            </template>
            <template #item.utilisateur="{ item }">
              <span class="text-caption">{{ item.utilisateurId ? item.utilisateurId.slice(0, 8) + '…' : 'système' }}</span>
            </template>
            <template #item.structure="{ item }">
              <span class="text-caption">{{ item.institution || '—' }}</span>
            </template>
            <template #item.role="{ item }">
              <span class="text-caption">{{ item.roleAuMoment || '—' }}</span>
            </template>
            <template #item.action="{ item }">
              <v-chip :color="actionColor(item.action)" size="x-small" variant="tonal" class="font-weight-bold">{{ item.action }}</v-chip>
            </template>
            <template #item.ancienneValeur="{ item }">
              <span class="text-caption">{{ formatValeur(item.ancienneValeur) }}</span>
            </template>
            <template #item.nouvelleValeur="{ item }">
              <span class="text-caption">{{ formatValeur(item.nouvelleValeur) }}</span>
            </template>
            <template #item.ip="{ item }">
              <span class="text-caption">{{ item.ip || '—' }}</span>
            </template>
            <template #item.sensible="{ item }">
              <v-icon v-if="actionSensible(item.action)" icon="mdi-alert-circle" color="warning" size="16"/>
            </template>
          </v-data-table-server>
        </v-card>

        <v-card rounded="lg" elevation="1" class="mt-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Cas ultra-spécifiques tracés</v-card-title>
          <v-card-text class="pa-4 pt-2">
            <v-tabs v-model="caseTab" color="primary" density="compact" class="mb-3">
              <v-tab value="diplomatique">Diplomatique</v-tab>
              <v-tab value="extractif">Extractif</v-tab>
              <v-tab value="textile">Textile</v-tab>
            </v-tabs>
            <v-window v-model="caseTab">
              <v-window-item v-for="item in specialCases" :key="item.value" :value="item.value">
                <div class="text-caption text-medium-emphasis mb-2">{{ item.subtitle }}</div>
                <v-list density="compact" class="pa-0">
                  <v-list-item v-for="point in item.points" :key="point" :title="point" prepend-icon="mdi-shield-check-outline" />
                </v-list>
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Chaîne de preuve</v-card-title>
          <v-card-text class="pa-4">
            <div class="text-body-2 mb-2"><strong>Empreinte du lot :</strong> `{{ empreinteCourte }}`</div>
            <div class="text-body-2 mb-2"><strong>Dernier scellement :</strong> {{ dernierScellement }}</div>
            <div class="text-body-2 mb-2"><strong>Autorité :</strong> PKI souveraine MEF</div>
            <div class="text-body-2 mb-4"><strong>Diffusion :</strong> export nominatif reserve aux profils audit renforces</div>
            <v-btn color="primary" variant="tonal" block prepend-icon="mdi-shield-check" :loading="verificationEnCours" @click="verifierChaine">
              Vérifier l'intégrité de la chaîne
            </v-btn>
            <v-alert v-if="verification && verification.breaks.length === 0" type="success" variant="tonal" density="compact" class="mt-3">
              Chaîne intègre : {{ verification.verified }} entrées vérifiées, 0 rupture.
            </v-alert>
            <v-alert v-else-if="verification" type="error" variant="tonal" density="compact" class="mt-3">
              <div class="font-weight-bold mb-1">{{ verification.breaks.length }} rupture(s) détectée(s) sur {{ verification.verified }} entrées :</div>
              <div v-for="(b, i) in verification.breaks" :key="i" class="text-caption">{{ b }}</div>
            </v-alert>
          </v-card-text>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Evenements sensibles</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item v-for="item in sensitiveEvents" :key="item.title" :title="item.title" :subtitle="item.subtitle" rounded="lg">
              <template #prepend><v-icon :icon="item.icon" :color="item.color" /></template>
            </v-list-item>
          </v-list>
        </v-card>

        <v-card rounded="lg" elevation="1" class="mt-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Axes de preuve transverse</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Accès dossiers confidentiels et diffusion restreinte" prepend-icon="mdi-eye-lock-outline" />
            <v-list-item title="Hash documentaire, TSA et scellement de lot" prepend-icon="mdi-lock-check-outline" />
            <v-list-item title="Exports bloqués, autorisés ou contre-signés" prepend-icon="mdi-file-export-outline" />
            <v-list-item title="Références dossier, convention, accord et registre central croisées" prepend-icon="mdi-source-merge" />
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import ExportButton from '../../components/ExportButton.vue'
import { listerAuditLogs, verifierChaineAudit, type AuditLogEntry, type VerificationChaine } from '../../services/audit'

const search = ref('')
const filterAction = ref('Toutes')
const filterStructure = ref('Toutes')
const dateDebut = ref('')
const dateFin = ref('')
const caseTab = ref('diplomatique')

const logs = ref<AuditLogEntry[]>([])
const total = ref(0)
const page = ref(1)
const limit = ref(25)
const loading = ref(false)
const error = ref<string | null>(null)

const verification = ref<VerificationChaine | null>(null)
const verificationEnCours = ref(false)

const headers = [
  { title: '⚠', key: 'sensible', sortable: false, width: 40 },
  { title: 'Horodatage', key: 'horodatage' },
  { title: 'Utilisateur', key: 'utilisateur', sortable: false },
  { title: 'Structure', key: 'structure', sortable: false },
  { title: 'Rôle', key: 'role', sortable: false },
  { title: 'Action', key: 'action' },
  { title: 'Entité', key: 'entite' },
  { title: 'Ancienne valeur', key: 'ancienneValeur', sortable: false },
  { title: 'Nouvelle valeur', key: 'nouvelleValeur', sortable: false },
  { title: 'IP', key: 'ip', sortable: false },
]

const ACTIONS_BASE = ['VALIDATION', 'REJET', 'DEMANDE_COMPLEMENT', 'EXPORT', 'CREATION_COMPTE', 'VISA', 'LOGIN_SUCCES']
const actionsDecouvertes = ref<Set<string>>(new Set())
const structuresDecouvertes = ref<Set<string>>(new Set())

const actionsConnues = computed(() => [
  ...new Set([...ACTIONS_BASE, ...actionsDecouvertes.value].sort()),
  'Toutes',
])
const structuresConnues = computed(() => [...structuresDecouvertes.value].sort().concat('Toutes'))

async function charger() {
  loading.value = true
  error.value = null
  try {
    const res = await listerAuditLogs({
      page: page.value,
      limit: limit.value,
      ...(filterAction.value !== 'Toutes' ? { action: filterAction.value } : {}),
    })
    logs.value = res.items
    total.value = res.total
    for (const l of res.items) {
      if (l.action) actionsDecouvertes.value.add(l.action)
      if (l.institution) structuresDecouvertes.value.add(l.institution)
    }
  } catch {
    error.value = "Impossible de charger le journal d'audit"
  } finally {
    loading.value = false
  }
}

onMounted(charger)
watch(filterAction, () => { page.value = 1; charger() })

/** Filtres complémentaires côté client (page courante) : acteur, structure, période. */
const logsFiltres = computed(() => logs.value.filter(l => {
  if (filterStructure.value !== 'Toutes' && (l.institution || '') !== filterStructure.value) return false
  if (dateDebut.value && l.horodatage < `${dateDebut.value}T00:00:00`) return false
  if (dateFin.value && l.horodatage > `${dateFin.value}T23:59:59`) return false
  const q = search.value.trim().toLowerCase()
  if (q) {
    const haystack = [l.utilisateurId, l.roleAuMoment, l.institution, l.action, l.entite, l.entiteId, l.demandeId]
      .filter(Boolean).join(' ').toLowerCase()
    if (!haystack.includes(q)) return false
  }
  return true
}))

async function verifierChaine() {
  verificationEnCours.value = true
  try {
    verification.value = await verifierChaineAudit()
  } catch {
    error.value = "Échec de la vérification de la chaîne d'audit"
  } finally {
    verificationEnCours.value = false
  }
}

const empreinteCourte = computed(() => {
  const h = logs.value[0]?.empreinteSha256
  return h ? `${h.slice(0, 4)}...${h.slice(-4)}` : '—'
})
const dernierScellement = computed(() => logs.value[0] ? `${formatDate(logs.value[0].horodatage)} UTC` : '—')

const formatDate = (iso: string) => new Date(iso).toLocaleString('fr-FR')
const formatValeur = (v: unknown) => (v == null ? '—' : JSON.stringify(v))
const actionColor = (a: string) => {
  if (/VALIDATION|APPROUVEE/.test(a)) return 'success'
  if (/REJET/.test(a)) return 'error'
  if (/COMPLEMENT/.test(a)) return 'warning'
  if (/EXPORT/.test(a)) return 'info'
  if (/CREATION|CREEE/.test(a)) return 'secondary'
  if (/VISA/.test(a)) return 'primary'
  return 'default'
}
const actionSensible = (a: string) => /REJET|VALIDATION|EXPORT_RAPPORT|APPROUVEE/.test(a)

const sensitiveEvents = [
  { title: 'Export nominatif bloque', subtitle: 'Absence d habilitation audit renforcee', icon: 'mdi-download-lock-outline', color: 'warning' },
  { title: 'Consultation dossier confidentiel', subtitle: 'Evenement journalise avec IP et session', icon: 'mdi-eye-lock-outline', color: 'error' },
  { title: 'Validation avec contre-signature', subtitle: 'Double approbation tracee dans le journal', icon: 'mdi-pen-lock', color: 'success' },
]
const specialCases = [
  {
    value: 'diplomatique',
    subtitle: 'Traçabilité des accords de siège, listes personnel et consultations restreintes.',
    points: ['Journal des consultations MAE / OTR', 'Contrôle des diffusions restreintes', 'Rattachement note verbale, liste personnel et véhicules'],
  },
  {
    value: 'extractif',
    subtitle: 'Suivi des conventions minières et pétrolières, par phase et par avantage.',
    points: ['Historique des phases recherche / exploitation / production', 'Rapprochement ITIE / DGMG / CONEDEF', 'Scellement des conventions et annexes techniques'],
  },
  {
    value: 'textile',
    subtitle: 'Suivi des cas sectoriels textile / habillement avec obligations export et emploi.',
    points: ['Alertes sur échéances loi 2022-021', 'Blocage d export nominatif hors habilitation', 'Croisement avec engagements et conventions sectorielles'],
  },
]
</script>
