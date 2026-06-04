<template>
  <div>
    <PageHeader title="Simulation et prospective" subtitle="Évaluez l'impact fiscal d'une décision avant sa mise en œuvre" icon="mdi-calculator-variant">
      <template #actions>
        <v-btn size="small" variant="text" color="primary" prepend-icon="mdi-information-outline" @click="showTips=!showTips">
          {{ showTips ? 'Masquer l\'aide' : 'Comment utiliser ?' }}
        </v-btn>
      </template>
    </PageHeader>

    <!-- ── Tips panel ── -->
    <v-expand-transition>
      <v-alert
        v-if="showTips"
        type="info"
        variant="tonal"
        rounded="lg"
        class="mb-4"
        closable
        @click:close="showTips=false"
      >
        <template #title>
          <span class="font-weight-semibold">Guide d'utilisation — Simulation fiscale</span>
        </template>
        <v-row dense class="mt-1">
          <v-col cols="12" md="6">
            <div class="d-flex align-start ga-2 mb-2">
              <v-avatar color="info" size="22" class="mt-0 flex-shrink-0"><span style="font-size:10px;font-weight:700">1</span></v-avatar>
              <div class="text-body-2"><strong>Paramétrez le scénario</strong> — Choisissez le type d'exonération, le secteur cible, le taux (%), la durée et l'assiette estimée (base taxable en Mds FCFA).</div>
            </div>
            <div class="d-flex align-start ga-2 mb-2">
              <v-avatar color="info" size="22" class="mt-0 flex-shrink-0"><span style="font-size:10px;font-weight:700">2</span></v-avatar>
              <div class="text-body-2"><strong>Lancez le calcul</strong> — Cliquez sur « Calculer l'impact » pour obtenir une estimation du manque à gagner fiscal, des emplois induits et de l'impact sur le PIB.</div>
            </div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="d-flex align-start ga-2 mb-2">
              <v-avatar color="info" size="22" class="mt-0 flex-shrink-0"><span style="font-size:10px;font-weight:700">3</span></v-avatar>
              <div class="text-body-2"><strong>Comparez les scénarios</strong> — Les 3 alternatives (taux/durée différents) sont générées automatiquement. Cliquez sur l'une d'elles pour charger ses paramètres.</div>
            </div>
            <div class="d-flex align-start ga-2">
              <v-avatar color="info" size="22" class="mt-0 flex-shrink-0"><span style="font-size:10px;font-weight:700">4</span></v-avatar>
              <div class="text-body-2"><strong>Méthode :</strong> Revenue foregone — les estimations utilisent les données INSEED (PIB sectoriel, FBCF 2025) et un multiplicateur sectoriel d'emploi calibré sur les données OIT/Togo.</div>
            </div>
          </v-col>
        </v-row>
        <v-divider class="my-2"/>
        <div class="text-caption text-medium-emphasis">
          ⚠️ Ces simulations sont des estimations à titre indicatif. Elles ne constituent pas un engagement budgétaire officiel. Tout scénario retenu doit faire l'objet d'une validation UPF avant transmission à la DGBF.
        </div>
      </v-alert>
    </v-expand-transition>

    <v-row>
      <!-- ── Formulaire ── -->
      <v-col cols="12" md="5">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Paramètres du scénario</v-card-title>
          <v-card-text class="pa-4">
            <v-select v-model="form.type" :items="types" label="Type d'exonération" class="mb-3"/>
            <v-select v-model="form.secteur" :items="secteurs" label="Secteur cible" class="mb-3" :hint="`Paramètres calibrés INSEED — modifiables dans Admin > Paramètres`" persistent-hint/>
            <v-text-field
              v-model.number="form.taux"
              label="Taux d'exonération (%)"
              type="number"
              suffix="%"
              :rules="[v => v > 0 && v <= 100 || 'Entre 1 et 100']"
              class="mb-3"
            />
            <v-text-field
              v-model.number="form.duree"
              label="Durée (mois)"
              type="number"
              :rules="[v => v > 0 || 'Durée > 0']"
              class="mb-3"
            />
            <v-text-field
              v-model.number="form.assiette"
              label="Assiette estimée (Mds FCFA)"
              type="number"
              :hint="`= ${(form.assiette * 1000).toLocaleString('fr-FR')} millions FCFA`"
              persistent-hint
              class="mb-4"
            />
            <v-btn color="primary" block prepend-icon="mdi-play" :loading="computing" @click="compute">Calculer l'impact</v-btn>
          </v-card-text>
        </v-card>

        <!-- Scénarios comparés -->
        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center justify-space-between">
            Scénarios comparés
            <v-tooltip text="Cliquez sur un scénario pour charger ses paramètres" location="top">
              <template #activator="{ props }">
                <v-icon v-bind="props" icon="mdi-information-outline" size="16" color="medium-emphasis"/>
              </template>
            </v-tooltip>
          </v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item
              v-for="s in dynamicScenarios"
              :key="s.id"
              :subtitle="`Taux ${s.taux}% · ${s.duree} mois · Impact: ${formatMds(s.impact)} Mds`"
              :class="activeScenario===s.id ? 'bg-primary-tonal' : undefined"
              rounded="lg"
              class="mb-1 cursor-pointer"
              @click="loadScenario(s)"
            >
              <template #prepend>
                <v-icon
                  :icon="activeScenario===s.id ? 'mdi-radiobox-marked' : 'mdi-radiobox-blank'"
                  :color="activeScenario===s.id ? 'primary' : 'medium-emphasis'"
                  size="18"
                  class="me-2"
                />
              </template>
              <template #title><span class="text-body-2 font-weight-medium">{{ s.label }}</span></template>
              <template #append>
                <v-chip :color="s.impact < 0 ? 'error' : 'success'" size="x-small" variant="tonal">
                  {{ s.impact > 0 ? '+' : '' }}{{ formatMds(s.impact) }}M
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- ── Résultats ── -->
      <v-col cols="12" md="7">
        <v-card v-if="result" rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center ga-2">
            Résultats de la simulation
            <v-chip color="info" size="x-small" variant="tonal">{{ form.secteur }} · {{ form.taux }}% · {{ form.duree }} mois</v-chip>
          </v-card-title>
          <v-card-text class="pa-4">
            <v-row dense class="mb-2">
              <v-col v-for="r in resultMetrics" :key="r.label" cols="6">
                <v-card
                  :color="r.highlight ? 'error' : undefined"
                  :variant="r.highlight ? 'tonal' : 'outlined'"
                  rounded="lg"
                  class="pa-3"
                >
                  <div class="label-micro text-medium-emphasis mb-1">{{ r.label }}</div>
                  <div class="font-weight-bold text-h6" :class="r.highlight ? 'text-error' : ''">{{ r.value }}</div>
                  <div v-if="r.sub" class="text-caption text-medium-emphasis mt-1">{{ r.sub }}</div>
                </v-card>
              </v-col>
            </v-row>

            <v-alert type="warning" variant="tonal" rounded="lg" class="mb-4" density="compact">
              <strong>Méthode :</strong> Revenue foregone — Données INSEED (PIB sectoriel {{ form.secteur }}, FBCF 2025)
            </v-alert>

            <!-- Évolution mensuelle -->
            <div>
              <div class="label-micro text-medium-emphasis mb-2">Évolution prévisionnelle de l'impact (mensuel)</div>
              <div v-for="(m, i) in previsionnelle" :key="i" class="mb-1 d-flex align-center ga-2">
                <div style="width:50px;font-size:0.72rem;color:#64748B">M+{{ i+1 }}</div>
                <v-progress-linear
                  :model-value="(m / maxPrevi) * 100"
                  color="error"
                  rounded
                  height="8"
                  class="flex-grow-1"
                />
                <div style="width:60px;font-size:0.72rem;font-weight:600;text-align:right">{{ m }}M</div>
              </div>
            </div>

            <v-btn variant="tonal" color="primary" class="mt-4" prepend-icon="mdi-download">
              Exporter rapport simulation
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- Empty state -->
        <v-card v-else rounded="lg" elevation="0" color="surface-light" class="pa-8 text-center">
          <v-icon icon="mdi-calculator-variant" size="48" color="secondary" class="mb-3"/>
          <div class="text-body-1 font-weight-medium mb-2">Aucune simulation lancée</div>
          <div class="text-body-2 text-medium-emphasis mb-4">Remplissez les paramètres à gauche et cliquez sur <strong>« Calculer l'impact »</strong> pour obtenir une estimation.</div>
          <v-btn variant="tonal" color="primary" size="small" prepend-icon="mdi-information-outline" @click="showTips=true">
            Voir le guide d'utilisation
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import { secteurParamsList, pibTogo, getSecteurParam } from '../../composables/useRefParams'

// ── Données de référence ───────────────────────────────────────────────────
const types = [
  'Exonération douanière', 'Exonération IS', 'Exonération TVA',
  'Zone Franche', 'Code des investissements',
]
// Secteurs dynamiques depuis le composable partagé (admin INSEED)
const secteurs = computed(() => secteurParamsList.map(s => s.secteur))

// ── État ──────────────────────────────────────────────────────────────────
const form = ref({ type: 'Exonération TVA', secteur: 'Numérique', taux: 15, duree: 24, assiette: 1.2 })
const computing = ref(false)
const result = ref(false)
const activeScenario = ref('s1')
const showTips = ref(false)

// ── Calcul core — utilise les paramètres INSEED partagés (admin/parametres) ──
function calcImpact(taux: number, duree: number, assiette: number, secteur: string) {
  const params = getSecteurParam(secteur)
  // assiette en Mds FCFA. On estime l'assiette totale sur la durée complète.
  const assietteTotal = assiette * (duree / 12)                               // Mds FCFA sur la durée
  const manque = -(assietteTotal * (taux / 100))                              // Mds FCFA (négatif = coût)
  const emplois = Math.round(assiette * params.emploiMult)                    // emplois directs créés
  // Impact PIB : multiplicateur × valeur ajoutée induite (assiette = proxy FBCF)
  const pibImpact = (assietteTotal * params.pibMult / pibTogo.value) * 100   // % du PIB
  // Ratio : bénéfice socio-économique / coût fiscal
  const salaireMoyenAnnuel = 0.005                                            // 5M FCFA = 0.005 Mds
  const beneficeBrut = emplois * salaireMoyenAnnuel * (duree / 12)
  const ratio = Math.abs(manque) > 0 ? beneficeBrut / Math.abs(manque) : 0
  return { manque, emplois, pibImpact, ratio, params }
}

// ── Métriques résultats (reactives) ──────────────────────────────────────
const resultMetrics = computed(() => {
  const { manque, emplois, pibImpact, ratio } = calcImpact(
    form.value.taux, form.value.duree, form.value.assiette, form.value.secteur
  )
  const manqueMds = Math.abs(manque)
  const manqueLabel = manqueMds >= 1
    ? `-${manqueMds.toFixed(1)} Mds FCFA`
    : `-${Math.round(manqueMds * 1000)} M FCFA`

  return [
    {
      label: 'Manque à gagner estimé',
      value: manqueLabel,
      sub: `sur ${form.value.duree} mois`,
      highlight: true,
    },
    {
      label: 'Emplois créés estimés',
      value: emplois.toLocaleString('fr-FR'),
      sub: `Secteur ${form.value.secteur}`,
      highlight: false,
    },
    {
      label: 'Impact PIB (% direct)',
      value: pibImpact >= 0.1 ? `+${pibImpact.toFixed(1)}%` : `+${pibImpact.toFixed(2)}%`,
      sub: 'Multiplicateur INSEED',
      highlight: false,
    },
    {
      label: 'Ratio coût/bénéfice',
      value: `1 : ${ratio.toFixed(1)}`,
      sub: ratio >= 1 ? 'Favorable' : 'Défavorable',
      highlight: false,
    },
  ]
})

// ── Évolution mensuelle ───────────────────────────────────────────────────
const previsionnelle = computed(() => {
  const duree = Math.min(Math.max(Math.round(form.value.duree), 1), 24)
  const { manque } = calcImpact(form.value.taux, form.value.duree, form.value.assiette, form.value.secteur)
  const totalAbs = Math.abs(manque) >= 1
    ? Math.abs(manque) * 1000   // Mds → millions
    : Math.round(Math.abs(manque) * 1000) // < 1 Mds → millions directs

  // Courbe en cloche : montée progressive, plateau, descente
  const months = Array.from({ length: 12 }, (_, i) => {
    const t = i / 11
    // montée quadratique jusqu'au milieu, puis descente
    const bell = t < 0.5 ? 2 * t * t * 2 : 1 - 2 * (t - 1) * (t - 1) * 2
    const factor = Math.max(0.3, Math.min(1, bell + 0.4))
    return Math.round((totalAbs / 12) * factor)
  })

  // Normaliser pour que la somme ≈ totalAbs
  const sum = months.reduce((a, b) => a + b, 0)
  if (sum === 0) return months
  return months.map(v => Math.round((v / sum) * totalAbs))
})

const maxPrevi = computed(() => Math.max(...previsionnelle.value, 1))

// ── Scénarios dynamiques ─────────────────────────────────────────────────
const dynamicScenarios = computed(() => {
  const { taux, duree, assiette, secteur } = form.value
  // Impact en millions pour affichage dans les chips
  const toM = (mds: number) => Math.round(mds * 1000)
  const s1Impact = calcImpact(taux, duree, assiette, secteur).manque
  const s2Taux = Math.max(1, taux - 5)
  const s2Duree = duree + 12
  const s2Impact = calcImpact(s2Taux, s2Duree, assiette, secteur).manque
  const s3Taux = Math.min(100, taux + 5)
  const s3Duree = Math.max(6, duree - 12)
  const s3Impact = calcImpact(s3Taux, s3Duree, assiette, secteur).manque

  return [
    { id: 's1', label: `Scénario actuel (${taux}% / ${duree} mois)`, taux, duree, impact: toM(s1Impact) },
    { id: 's2', label: `Alternative A (${s2Taux}% / ${s2Duree} mois)`, taux: s2Taux, duree: s2Duree, impact: toM(s2Impact) },
    { id: 's3', label: `Alternative B (${s3Taux}% / ${s3Duree} mois)`, taux: s3Taux, duree: s3Duree, impact: toM(s3Impact) },
  ]
})

// ── Helpers ───────────────────────────────────────────────────────────────
function formatMds(val: number) {
  return Math.round(val).toLocaleString('fr-FR')
}

function loadScenario(s: { id: string; taux: number; duree: number }) {
  activeScenario.value = s.id
  form.value.taux = s.taux
  form.value.duree = s.duree
  // Relancer le calcul automatiquement si résultats déjà affichés
  if (result.value) compute()
}

// Réinitialiser l'indicateur de résultat quand les paramètres changent (avant calcul)
watch(
  () => [form.value.type, form.value.secteur, form.value.taux, form.value.duree, form.value.assiette],
  () => { activeScenario.value = 's1' }
)

const compute = () => {
  computing.value = true
  setTimeout(() => {
    computing.value = false
    result.value = true
  }, 600)
}
</script>
