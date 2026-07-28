<template>
  <div>
    <PageHeader
      title="Moteur de règles"
      subtitle="Détection d'anomalies, contrôle de conformité et actions automatiques"
      icon="mdi-cog-play"
    >
      <template #actions>
        <v-btn color="primary" size="small" prepend-icon="mdi-play-speed" :loading="runAllLoading" @click="runAllDialog=true">
          Exécuter la détection
        </v-btn>
      </template>
    </PageHeader>

    <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="mb-4">
      <!-- TODO(endpoint): pas de CRUD de règles dans l'API v1 (GET/POST/PATCH /regles-blocage absents).
           Les règles affichées sont celles réellement évaluées par le backend via
           GET /demandes/:id/blocages — lecture seule. -->
      Règles réellement évaluées par le backend (blocages par dossier) — lecture seule.
      L'édition des règles sera disponible quand l'API l'exposera.
    </v-alert>

    <v-alert v-if="loadError" type="error" variant="tonal" rounded="lg" density="compact" class="mb-4">
      {{ loadError }}
    </v-alert>

    <!-- KPIs -->
    <v-row v-if="loading" class="mb-4">
      <v-col v-for="n in 4" :key="n" cols="6" md="3">
        <v-skeleton-loader type="card" rounded="lg"/>
      </v-col>
    </v-row>
    <v-row v-else class="mb-4">
      <v-col v-for="k in kpis" :key="k.label" cols="6" md="3">
        <v-card rounded="lg" elevation="1" class="pa-3">
          <div class="d-flex align-center ga-3">
            <v-avatar :color="k.color" size="40" rounded="lg">
              <v-icon :icon="k.icon" color="white" size="20"/>
            </v-avatar>
            <div>
              <div class="text-h5 font-weight-bold" :style="{ color: `rgb(var(--v-theme-${k.color}))` }">{{ k.value }}</div>
              <div class="text-caption text-medium-emphasis">{{ k.label }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-tabs v-model="mainTab" color="primary" density="compact" class="mb-3">
      <v-tab value="rules" prepend-icon="mdi-cog-play">Règles ({{ regles.length }})</v-tab>
      <v-tab value="journal" prepend-icon="mdi-history">Anomalies <v-badge :content="journal.length" color="warning" inline class="ms-1"/></v-tab>
      <v-tab value="stats" prepend-icon="mdi-chart-bar">Statistiques</v-tab>
    </v-tabs>

    <v-window v-model="mainTab">

      <!-- ══ RULES ══ -->
      <v-window-item value="rules">
        <!-- Filters -->
        <v-card rounded="lg" elevation="1" class="mb-3">
          <v-card-text class="pa-3">
            <v-row dense>
              <v-col cols="12" md="6">
                <v-text-field v-model="search" label="Rechercher une règle…" prepend-inner-icon="mdi-magnify" density="compact" hide-details clearable/>
              </v-col>
              <v-col cols="6" md="3">
                <v-select v-model="filterSev" :items="['Toutes','bloquant','avertissement','info']" label="Sévérité" density="compact" hide-details/>
              </v-col>
              <v-col cols="6" md="3">
                <v-select v-model="filterActive" :items="[{title:'Toutes',value:'all'},{title:'Avec blocage actif',value:'active'},{title:'Sans blocage',value:'inactive'}]" label="Déclenchement" density="compact" hide-details/>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-3"/>

        <div v-if="!loading && filteredRegles.length === 0" class="text-center pa-8 text-medium-emphasis">
          <v-icon icon="mdi-filter-off" size="40" class="mb-2 opacity-40"/>
          <div>Aucune règle ne correspond aux filtres.</div>
        </div>

        <div v-for="regle in filteredRegles" :key="regle.code" class="rule-node mb-2" :class="`rule--${regle.severite}`">
          <div class="rule-header">
            <div class="d-flex align-center ga-3 flex-grow-1 min-width-0">
              <v-avatar :color="sevColor(regle.severite)" size="34" rounded="lg">
                <v-icon :icon="sevIcon(regle.severite)" size="16" color="white"/>
              </v-avatar>
              <div class="min-width-0 flex-grow-1">
                <div class="d-flex align-center ga-2 flex-wrap">
                  <span class="text-body-2 font-weight-semibold">{{ regle.libelle }}</span>
                  <v-chip :color="sevColor(regle.severite)" size="x-small" variant="tonal">{{ regle.severite }}</v-chip>
                  <v-chip color="secondary" size="x-small" variant="outlined" prepend-icon="mdi-tag-outline">{{ regle.code }}</v-chip>
                </div>
                <div class="text-caption text-medium-emphasis d-flex align-center ga-3 mt-1">
                  <span><v-icon icon="mdi-play-circle" size="12" class="me-1"/>{{ regle.declenchements }} dossier(s) bloqué(s) / {{ regle.evalues }} évalué(s)</span>
                  <span v-if="regle.details"><v-icon icon="mdi-information-outline" size="12" class="me-1"/>{{ regle.details }}</span>
                </div>
              </div>
            </div>
            <v-chip :color="regle.declenchements > 0 ? 'error' : 'success'" size="x-small" variant="tonal" class="flex-shrink-0">
              {{ regle.declenchements > 0 ? 'Blocage actif' : 'Aucun blocage' }}
            </v-chip>
          </div>
        </div>
      </v-window-item>

      <!-- ══ JOURNAL (anomalies réelles) ══ -->
      <v-window-item value="journal">
        <v-card rounded="lg" elevation="1" class="mt-1">
          <div class="pa-4 pb-2 d-flex align-center justify-space-between flex-wrap ga-2">
            <span class="text-body-1 font-weight-semibold">Anomalies détectées par le moteur (GET /anomalies)</span>
            <div class="d-flex ga-2">
              <v-text-field v-model="journalSearch" placeholder="Filtrer…" prepend-inner-icon="mdi-magnify" density="compact" hide-details clearable style="max-width:220px"/>
              <v-select v-model="journalSevFilter" :items="['Toutes','bloquant','avertissement','info']" density="compact" hide-details style="max-width:160px"/>
            </div>
          </div>
          <v-divider/>
          <v-progress-linear v-if="loading" indeterminate color="primary"/>
          <v-list v-else density="compact" class="pa-2">
            <div v-if="filteredJournal.length === 0" class="text-center pa-6 text-medium-emphasis">
              <v-icon icon="mdi-check-decagram-outline" size="36" class="mb-2 opacity-40"/>
              <div class="text-body-2">Aucune anomalie pour ces filtres.</div>
            </div>
            <v-list-item
              v-for="j in filteredJournal" :key="j.id"
              rounded="lg" class="mb-1 pa-3"
              :style="{ borderLeft: `3px solid ${j.severite === 'bloquant' ? '#C62828' : j.severite === 'avertissement' ? '#E65100' : '#0277BD'}` }"
            >
              <template #prepend>
                <v-avatar :color="sevColor(j.severite)" size="32" rounded="lg">
                  <v-icon :icon="sevIcon(j.severite)" size="16" color="white"/>
                </v-avatar>
              </template>
              <template #title>
                <span class="text-body-2 font-weight-semibold">{{ j.regle }}</span>
              </template>
              <template #subtitle>
                <span class="text-caption">
                  Dossier: <strong>{{ j.dossier }}</strong> · {{ j.date }}
                </span>
              </template>
              <template #append>
                <div class="d-flex flex-column align-end ga-1">
                  <v-chip :color="sevColor(j.severite)" size="x-small" variant="tonal">{{ j.severite }}</v-chip>
                  <v-chip :color="j.resolu ? 'success' : 'error'" size="x-small" variant="outlined">
                    {{ j.resolu ? 'Résolu' : 'En attente' }}
                  </v-chip>
                </div>
              </template>
            </v-list-item>
          </v-list>
          <div class="pa-3 text-caption text-medium-emphasis text-center" style="border-top:1px solid rgba(0,0,0,0.06)">
            {{ filteredJournal.length }} anomalie(s) retournée(s) par l'API
          </div>
        </v-card>
      </v-window-item>

      <!-- ══ STATS ══ -->
      <v-window-item value="stats">
        <v-row class="mt-1">
          <!-- Top rules by trigger count -->
          <v-col cols="12" md="6">
            <v-card rounded="lg" elevation="1" class="mb-4">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">
                Règles — dossiers bloqués (réel)
              </v-card-title>
              <v-card-text class="pa-4">
                <div v-if="topRules.length === 0" class="text-center pa-4 text-medium-emphasis text-caption">Aucune donnée.</div>
                <div v-for="r in topRules" :key="r.code" class="mb-3">
                  <div class="d-flex align-center justify-space-between mb-1">
                    <span class="text-caption font-weight-semibold text-truncate" style="max-width:250px">{{ r.libelle }}</span>
                    <v-chip :color="sevColor(r.severite)" size="x-small" variant="tonal">{{ r.declenchements }}</v-chip>
                  </div>
                  <v-progress-linear
                    :model-value="(r.declenchements / maxDeclenchements) * 100"
                    :color="sevColor(r.severite)"
                    rounded
                    height="6"
                    bg-color="surface-variant"
                  />
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Severity breakdown -->
          <v-col cols="12" md="6">
            <v-card rounded="lg" elevation="1" class="mb-4">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Répartition par sévérité</v-card-title>
              <v-card-text class="pa-4">
                <div v-for="sev in sevStats" :key="sev.label" class="d-flex align-center ga-3 mb-4">
                  <v-avatar :color="sev.color" size="36" rounded="lg">
                    <v-icon :icon="sev.icon" color="white" size="18"/>
                  </v-avatar>
                  <div class="flex-grow-1">
                    <div class="d-flex justify-space-between mb-1">
                      <span class="text-caption font-weight-semibold">{{ sev.label }}</span>
                      <span class="text-caption">{{ sev.count }} règle(s) · {{ sev.triggers }} blocage(s)</span>
                    </div>
                    <v-progress-linear :model-value="sev.pct" :color="sev.color" rounded height="6" bg-color="surface-variant"/>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <!-- Resolution rate -->
            <v-card rounded="lg" elevation="1">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Taux de résolution des anomalies</v-card-title>
              <v-card-text class="pa-4">
                <div class="d-flex align-center ga-4 mb-4">
                  <div class="text-center">
                    <div class="text-h4 font-weight-bold text-success">{{ resolutionRate }}%</div>
                    <div class="text-caption text-medium-emphasis">Taux global</div>
                  </div>
                  <v-divider vertical/>
                  <div class="flex-grow-1">
                    <div class="d-flex justify-space-between mb-1">
                      <span class="text-caption">Anomalies résolues</span>
                      <span class="text-caption font-weight-bold text-success">{{ resolvedCount }}</span>
                    </div>
                    <div class="d-flex justify-space-between">
                      <span class="text-caption">En attente de traitement</span>
                      <span class="text-caption font-weight-bold text-error">{{ pendingCount }}</span>
                    </div>
                  </div>
                </div>
                <v-progress-linear :model-value="resolutionRate" color="success" rounded height="10" bg-color="error-lighten"/>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Recent activity timeline -->
          <v-col cols="12">
            <v-card rounded="lg" elevation="1">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Activité récente</v-card-title>
              <v-card-text class="pa-4">
                <div v-if="journal.length === 0" class="text-center pa-4 text-medium-emphasis text-caption">Aucune anomalie récente.</div>
                <v-timeline v-else density="compact" align="start">
                  <v-timeline-item
                    v-for="j in journal.slice(0,6)" :key="j.id"
                    :dot-color="sevColor(j.severite)"
                    size="x-small"
                  >
                    <div class="d-flex align-center justify-space-between flex-wrap ga-2">
                      <div>
                        <div class="text-body-2 font-weight-semibold">{{ j.regle }}</div>
                        <div class="text-caption text-medium-emphasis">{{ j.dossier }}</div>
                      </div>
                      <div class="d-flex ga-1 align-center">
                        <span class="text-caption text-medium-emphasis">{{ j.date }}</span>
                        <v-chip :color="sevColor(j.severite)" size="x-small" variant="tonal">{{ j.severite }}</v-chip>
                      </div>
                    </div>
                  </v-timeline-item>
                </v-timeline>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

    </v-window>

    <!-- ── Run detection Dialog (POST /anomalies/detecter — réel) ── -->
    <v-dialog v-model="runAllDialog" max-width="400">
      <v-card rounded="xl">
        <v-card-title class="pa-5 pb-3 d-flex align-center ga-2">
          <v-icon icon="mdi-play-speed" color="primary"/>
          Exécuter la détection
        </v-card-title>
        <v-card-text class="pa-5">
          <p class="mb-3">Lance réellement le moteur de règles du backend (POST /anomalies/detecter) sur les dossiers en cours.</p>
          <v-alert type="warning" variant="tonal" density="compact" rounded="lg">
            Les anomalies détectées seront créées en base et journalisées dans l'audit.
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer/>
          <v-btn variant="text" @click="runAllDialog=false">Annuler</v-btn>
          <v-btn color="primary" prepend-icon="mdi-play" :loading="runAllLoading" @click="doRunAll">Confirmer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackColor" timeout="3000" location="bottom right">
      <v-icon :icon="snackColor === 'success' ? 'mdi-check-circle' : 'mdi-alert'" class="me-2"/>
      {{ snackMsg }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import { listerDemandesApi, listerBlocagesDemande } from '../../services/demandes'
import { listerAnomalies, detecterAnomalies, type AnomalieAudit } from '../../services/audit'

// ── Types ────────────────────────────────────────────────────────────────────
interface Regle {
  code: string
  libelle: string
  severite: string // 'bloquant' | 'avertissement' | 'info' (dérivé de la gravité API)
  details?: string
  declenchements: number // dossiers réellement bloqués
  evalues: number // dossiers sur lesquels la règle a été évaluée
}
interface JournalEntry { id: string; regle: string; dossier: string; date: string; severite: string; resolu: boolean }

// ── State ─────────────────────────────────────────────────────────────────────
const mainTab = ref('rules')
const search = ref('')
const filterSev = ref('Toutes')
const filterActive = ref('all')
const journalSearch = ref('')
const journalSevFilter = ref('Toutes')
const runAllDialog = ref(false)
const runAllLoading = ref(false)
const snackbar = ref(false)
const snackMsg = ref('')
const snackColor = ref<'success' | 'error'>('success')
const loading = ref(true)
const loadError = ref<string | null>(null)

const regles = ref<Regle[]>([])
const journal = ref<JournalEntry[]>([])
const nbDossiers = ref(0)
const nbBlocagesActifs = ref(0)

// ── Computed ──────────────────────────────────────────────────────────────────
const filteredRegles = computed(() =>
  regles.value.filter(r => {
    if (filterSev.value !== 'Toutes' && r.severite !== filterSev.value) return false
    if (filterActive.value === 'active' && r.declenchements === 0) return false
    if (filterActive.value === 'inactive' && r.declenchements > 0) return false
    if (search.value && !r.libelle.toLowerCase().includes(search.value.toLowerCase()) && !r.code.toLowerCase().includes(search.value.toLowerCase())) return false
    return true
  })
)

const filteredJournal = computed(() =>
  journal.value.filter(j => {
    if (journalSevFilter.value !== 'Toutes' && j.severite !== journalSevFilter.value) return false
    if (journalSearch.value && !j.regle.toLowerCase().includes(journalSearch.value.toLowerCase()) && !j.dossier.toLowerCase().includes(journalSearch.value.toLowerCase())) return false
    return true
  })
)

const kpis = computed(() => [
  { label: 'Règles évaluées', value: regles.value.length, icon: 'mdi-cog-play', color: 'primary' },
  { label: 'Dossiers évalués', value: nbDossiers.value, icon: 'mdi-folder-multiple-outline', color: 'info' },
  { label: 'Blocages actifs', value: nbBlocagesActifs.value, icon: 'mdi-alert-octagon', color: 'error' },
  { label: 'Anomalies ouvertes', value: pendingCount.value, icon: 'mdi-alert-circle-outline', color: 'warning' },
])

const topRules = computed(() => [...regles.value].sort((a, b) => b.declenchements - a.declenchements).slice(0, 5))
const maxDeclenchements = computed(() => Math.max(...regles.value.map(r => r.declenchements), 1))
const resolvedCount = computed(() => journal.value.filter(j => j.resolu).length)
const pendingCount = computed(() => journal.value.filter(j => !j.resolu).length)
const resolutionRate = computed(() => Math.round((resolvedCount.value / Math.max(journal.value.length, 1)) * 100))

// % calculés réellement depuis les règles/blocages agrégés (plus de valeurs en dur).
const sevStats = computed(() => {
  const total = Math.max(regles.value.length, 1)
  return (['bloquant', 'avertissement', 'info'] as const).map(sev => {
    const rs = regles.value.filter(r => r.severite === sev)
    return {
      label: sev === 'bloquant' ? 'Bloquant' : sev === 'avertissement' ? 'Avertissement' : 'Information',
      color: sevColor(sev),
      icon: sevIcon(sev),
      count: rs.length,
      triggers: rs.reduce((a, r) => a + r.declenchements, 0),
      pct: Math.round((rs.length / total) * 100),
    }
  })
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function sevColor(s: string) { return s === 'bloquant' ? 'error' : s === 'avertissement' ? 'warning' : 'info' }
function sevIcon(s: string) { return s === 'bloquant' ? 'mdi-alert-octagon' : s === 'avertissement' ? 'mdi-alert' : 'mdi-information' }
/** Gravité API → sévérité d'affichage. */
function severiteFromGravite(gravite: string | undefined, bloque: boolean): string {
  const g = (gravite ?? '').toLowerCase()
  if (g === 'critique' || g === 'elevee' || (bloque && g !== 'faible')) return 'bloquant'
  if (g === 'moyenne') return 'avertissement'
  return 'info'
}
function snack(msg: string, color: 'success' | 'error' = 'success') {
  snackMsg.value = msg; snackColor.value = color; snackbar.value = true
}

// ── Chargement réel ───────────────────────────────────────────────────────────
async function charger() {
  loading.value = true
  loadError.value = null
  try {
    const [demandesRes, anomalies] = await Promise.all([
      listerDemandesApi(),
      listerAnomalies().catch(() => [] as AnomalieAudit[]),
    ])
    nbDossiers.value = demandesRes.data.length

    // Évaluation réelle des règles de blocage sur chaque dossier (GET /demandes/:id/blocages).
    const parCode = new Map<string, Regle>()
    let blocagesActifs = 0
    const resultats = await Promise.all(
      demandesRes.data.map(d => listerBlocagesDemande(d.id).catch(() => [])),
    )
    for (const blocages of resultats) {
      for (const b of blocages) {
        const existing = parCode.get(b.code)
        if (existing) {
          existing.evalues++
          if (b.bloque) { existing.declenchements++; blocagesActifs++ }
          if (!existing.details && b.details) existing.details = b.details
        } else {
          if (b.bloque) blocagesActifs++
          parCode.set(b.code, {
            code: b.code,
            libelle: b.libelle,
            severite: severiteFromGravite(b.gravite, b.bloque),
            details: b.details,
            declenchements: b.bloque ? 1 : 0,
            evalues: 1,
          })
        }
      }
    }
    regles.value = [...parCode.values()].sort((a, b) => b.declenchements - a.declenchements)
    nbBlocagesActifs.value = blocagesActifs

    journal.value = anomalies.map(a => ({
      id: a.id,
      regle: a.description,
      dossier: a.demandes?.reference ?? '—',
      date: new Date(a.dateDetection).toLocaleDateString('fr-FR'),
      severite: severiteFromGravite(a.graviteCode, false),
      resolu: a.statutCode === 'resolue' || a.statutCode === 'rejetee',
    }))
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Erreur de chargement du moteur de règles'
  } finally {
    loading.value = false
  }
}

async function doRunAll() {
  runAllLoading.value = true
  try {
    const res = await detecterAnomalies()
    snack(`Détection terminée — ${res.detectees} anomalie(s) détectée(s)`)
    runAllDialog.value = false
    await charger()
  } catch (e) {
    snack(e instanceof Error ? e.message : 'Échec de la détection', 'error')
  } finally {
    runAllLoading.value = false
  }
}

onMounted(charger)
</script>

<style scoped>
.rule-node {
  background: white;
  border-radius: 10px;
  border: 1px solid rgba(0,0,0,0.09);
  border-left: 4px solid #CBD5E1;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  transition: box-shadow 0.2s;
  overflow: hidden;
}
.rule-node:hover { box-shadow: 0 3px 12px rgba(0,0,0,0.1); }
.rule--bloquant { border-left-color: #C62828; }
.rule--avertissement { border-left-color: #E65100; }
.rule--info { border-left-color: #0277BD; }

.rule-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
}
</style>
