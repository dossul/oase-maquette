<template>
  <div>
    <PageHeader
      title="Gouvernance des donnees"
      subtitle="Qualite, campagnes de mise a jour, referentiels et points focaux OASE"
      icon="mdi-database-cog"
    >
      <template #actions>
        <v-btn color="primary" size="small" prepend-icon="mdi-refresh" :loading="loading" @click="charger">Rafraichir</v-btn>
      </template>
    </PageHeader>

    <v-alert v-if="loadError" type="error" variant="tonal" rounded="lg" density="compact" class="mb-4">
      {{ loadError }}
    </v-alert>

    <v-row v-if="loading" class="mb-4">
      <v-col v-for="n in 4" :key="n" cols="6" md="3">
        <v-skeleton-loader type="card" rounded="lg"/>
      </v-col>
    </v-row>

    <v-row v-else class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <v-tabs v-model="tab" color="primary" density="compact" class="mb-3">
      <v-tab value="qualite" prepend-icon="mdi-shield-check">Qualite</v-tab>
      <v-tab value="campagnes" prepend-icon="mdi-calendar-sync">Campagnes</v-tab>
      <v-tab value="referentiels" prepend-icon="mdi-shape-outline">Referentiels</v-tab>
      <v-tab value="pointsfocaux" prepend-icon="mdi-account-group">Points focaux</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="qualite">
        <v-row>
          <v-col cols="12" md="7">
            <!-- TODO(endpoint): pas de métrique de complétude par domaine dans l'API v1. -->
            <v-card rounded="lg" elevation="1" class="mb-4">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Controle de completude par domaine</v-card-title>
              <div class="text-center pa-8 text-medium-emphasis">
                <v-icon icon="mdi-gauge-empty" size="40" class="mb-2 opacity-40"/>
                <div class="text-body-2">Indicateurs de completude non instrumentes.</div>
                <div class="text-caption">Ils seront calcules cote backend dans une version ulterieure.</div>
              </div>
            </v-card>

            <v-card rounded="lg" elevation="1">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center justify-space-between">
                Anomalies de donnees (moteur de regles reel)
                <v-chip size="x-small" color="primary" variant="tonal">{{ anomalies.length }} anomalie(s)</v-chip>
              </v-card-title>
              <v-progress-linear v-if="loading" indeterminate color="primary"/>
              <v-data-table v-else :headers="anomalyHeaders" :items="anomalies" hover>
                <template #item.severite="{ item }">
                  <v-chip :color="severityColor(item.severite)" size="x-small" variant="tonal">{{ item.severite }}</v-chip>
                </template>
                <template #item.statut="{ item }">
                  <v-chip :color="item.statut === 'resolue' ? 'success' : 'error'" size="x-small" variant="outlined">{{ item.statut }}</v-chip>
                </template>
                <template #no-data>
                  <div class="text-center pa-6 text-medium-emphasis">
                    <v-icon icon="mdi-check-decagram-outline" size="36" class="mb-2 opacity-40"/>
                    <div class="text-body-2">Aucune anomalie detectee par le moteur de regles.</div>
                  </div>
                </template>
              </v-data-table>
            </v-card>
          </v-col>

          <v-col cols="12" md="5">
            <!-- TODO(endpoint): suivi des flux de certification non exposé par l'API v1. -->
            <v-card rounded="lg" elevation="1" class="mb-4">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Etat des flux de certification</v-card-title>
              <div class="text-center pa-8 text-medium-emphasis">
                <v-icon icon="mdi-source-branch-sync" size="40" class="mb-2 opacity-40"/>
                <div class="text-body-2">Flux de certification non instrumentes.</div>
              </div>
            </v-card>

            <v-card rounded="lg" elevation="1">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Rappels V2 a maquetter</v-card-title>
              <v-list density="compact" class="pa-2">
                <v-list-item title="Distinction brut / corrige / certifie" prepend-icon="mdi-layers-triple-outline" />
                <v-list-item title="Fraicheur par SI source" prepend-icon="mdi-timer-sand" />
                <v-list-item title="Validation de lot avant publication" prepend-icon="mdi-stamp" />
                <v-list-item title="Rapports de completude par institution" prepend-icon="mdi-file-chart-outline" />
                <v-list-item title="Journal des relances points focaux" prepend-icon="mdi-history" />
              </v-list>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- TODO(endpoint): campagnes de fiabilisation non exposées par l'API v1. -->
      <v-window-item value="campagnes">
        <v-card rounded="lg" elevation="1">
          <div class="text-center pa-10 text-medium-emphasis">
            <v-icon icon="mdi-calendar-sync" size="48" class="mb-3 opacity-40"/>
            <div class="text-body-1 font-weight-semibold mb-1">Aucune campagne instrumentee</div>
            <div class="text-caption">Le suivi des campagnes de mise a jour sera disponible avec un endpoint dedie.</div>
          </div>
        </v-card>
      </v-window-item>

      <v-window-item value="referentiels">
        <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="mb-3">
          Nomenclatures officielles OASE (documentation de reference) — les taux de couverture seront calcules quand l'API l'exposera.
        </v-alert>
        <v-row>
          <v-col v-for="refItem in referentiels" :key="refItem.nom" cols="12" md="6" lg="4">
            <v-card rounded="lg" elevation="1" class="h-100">
              <v-card-text class="pa-4">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="text-body-2 font-weight-semibold">{{ refItem.nom }}</div>
                  <v-chip color="info" size="x-small" variant="tonal">Referentiel</v-chip>
                </div>
                <div class="text-caption text-medium-emphasis">{{ refItem.description }}</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- TODO(endpoint): annuaire des points focaux + scores qualité non exposés par l'API v1. -->
      <v-window-item value="pointsfocaux">
        <v-card rounded="lg" elevation="1">
          <div class="text-center pa-10 text-medium-emphasis">
            <v-icon icon="mdi-account-group-outline" size="48" class="mb-3 opacity-40"/>
            <div class="text-body-1 font-weight-semibold mb-1">Points focaux non instrumentes</div>
            <div class="text-caption">L'annuaire des points focaux et leurs scores seront disponibles avec un endpoint dedie.</div>
          </div>
        </v-card>
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import { listerAnomalies, type AnomalieAudit } from '../../services/audit'

const tab = ref('qualite')
const loading = ref(true)
const loadError = ref<string | null>(null)
const anomaliesApi = ref<AnomalieAudit[]>([])

const anomalies = computed(() =>
  anomaliesApi.value.map(a => ({
    domaine: a.categorieCode,
    description: a.description,
    reference: a.demandes?.reference ?? '—',
    severite: a.graviteCode,
    statut: a.statutCode,
  })),
)

const nbOuvertes = computed(() => anomaliesApi.value.filter(a => a.statutCode === 'nouvelle' || a.statutCode === 'en_cours').length)
const nbCritiques = computed(() => anomaliesApi.value.filter(a => /critique|elevee/i.test(a.graviteCode ?? '')).length)

const kpis = computed(() => [
  { label: 'Anomalies detectees', value: anomaliesApi.value.length, icon: 'mdi-alert-outline', color: 'primary', subtitle: 'GET /anomalies (reel)' },
  { label: 'Anomalies ouvertes', value: nbOuvertes.value, icon: 'mdi-alert-circle-outline', color: 'warning', subtitle: 'Nouvelles ou en cours' },
  { label: 'Gravite elevee / critique', value: nbCritiques.value, icon: 'mdi-alert-octagon-outline', color: 'error', subtitle: 'A traiter en priorite' },
  // TODO(endpoint): complétude moyenne non calculable côté API v1.
  { label: 'Completude moyenne', value: '—', icon: 'mdi-check-decagram', color: 'success', subtitle: 'Non instrumente' },
])

const anomalyHeaders = [
  { title: 'Categorie', key: 'domaine' },
  { title: 'Description', key: 'description' },
  { title: 'Dossier', key: 'reference' },
  { title: 'Severite', key: 'severite' },
  { title: 'Statut', key: 'statut' },
]

// Nomenclatures officielles OASE — contenu normatif de reference (sans metrique fictive).
const referentiels = [
  { nom: 'R_FAMILLE_TEXTE', description: 'Familles de textes, codes, lois de finances, conventions et accords' },
  { nom: 'R_SYSTEME_INFORMATION', description: 'Sydonia, E-TAX, DAS, GUDEF, SIGFiP, SIGTAS' },
  { nom: 'R_TYPE_ACTE', description: 'Loi, decret, convention, accord, arrete, agrement' },
  { nom: 'R_NATURE_MESURE', description: 'Exoneration, franchise, taux reduit, report, credit, suspension' },
  { nom: 'R_IMPOT_TAXE', description: 'TVA, IS, IRPP, DD, RS, TPI, ADA, DAPP, TSR et autres taxes' },
  { nom: 'R_TYPE_CONTRIBUABLE', description: 'Entreprise, ONG, organisme international, diplomatique, projet public' },
  { nom: 'R_SECTEUR_BRANCHE', description: 'Nomenclature sectorielle et branche NES' },
  { nom: 'R_ORGANE', description: 'Structures attributrices, gestionnaires et de controle' },
  { nom: 'R_PORTEE_DUREE', description: 'Temporaire, permanente, renouvelable, par phase' },
  { nom: 'R_OBJECTIF_POLITIQUE', description: 'Objectif fiscal, economique, social, sectoriel' },
  { nom: 'R_FONCTION_BUDGETAIRE', description: 'Fonction de politique publique et rattachement budgetaire' },
]

const severityColor = (value: string) => {
  if (/critique/i.test(value)) return 'error'
  if (/elevee|haute/i.test(value)) return 'warning'
  if (/moyenne/i.test(value)) return 'info'
  return 'secondary'
}

async function charger() {
  loading.value = true
  loadError.value = null
  try {
    anomaliesApi.value = await listerAnomalies()
  } catch (e) {
    anomaliesApi.value = []
    loadError.value = e instanceof Error ? e.message : 'Erreur de chargement des anomalies'
  } finally {
    loading.value = false
  }
}

onMounted(charger)
</script>
