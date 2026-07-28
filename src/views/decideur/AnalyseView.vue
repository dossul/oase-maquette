<template>
  <div>
    <PageHeader title="Analyse sectorielle et géographique" subtitle="Drill-down par secteur, type d'impôt ou année — données réelles API" icon="mdi-chart-areaspline"/>
    <v-row class="mb-4">
      <v-col cols="6" md="3">
        <v-select v-model="filterSecteur" :items="secteurs" label="Secteur" clearable hide-details/>
      </v-col>
      <v-col cols="6" md="3">
        <v-select v-model="filterImpot" :items="impots" label="Type d'impôt" clearable hide-details/>
      </v-col>
      <v-col cols="6" md="3">
        <v-select v-model="filterStatut" :items="['Accordée','Rejetée','En instruction','Toutes']" label="Statut" hide-details/>
      </v-col>
      <v-col cols="6" md="3">
        <v-select v-model="compareYear" :items="['2026 vs 2025','2025 vs 2024','2024 vs 2023']" label="Comparaison" hide-details/>
      </v-col>
    </v-row>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
    <v-alert v-if="error" type="error" variant="tonal" rounded="lg" density="compact" class="mb-4">{{ error }}</v-alert>

    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">
            Analyse par secteur — {{ filterSecteur || 'Tous secteurs' }}
            <v-chip color="primary" size="x-small" variant="tonal" class="ms-2">Drill-down</v-chip>
          </v-card-title>
          <v-card-text>
            <v-alert v-if="!loading && !drillData.length" type="info" variant="tonal" density="compact" rounded="lg">
              Aucune demande ne correspond aux filtres sélectionnés.
            </v-alert>
            <div v-for="s in drillData" :key="s.secteur" class="mb-4">
              <div class="d-flex align-center justify-space-between mb-1">
                <span class="font-weight-semibold text-body-2 cursor-pointer text-primary" @click="filterSecteur=s.secteur">{{ s.secteur }}</span>
                <div class="d-flex align-center ga-2">
                  <span class="font-weight-bold">{{ formatMontantCompact(s.montant) }}</span>
                  <v-chip size="x-small" variant="tonal" color="info">{{ s.nb }} demande(s)</v-chip>
                </div>
              </div>
              <v-progress-linear :model-value="(s.montant / maxDrill) * 100" color="primary" rounded height="10" bg-color="surface-light"/>
              <div v-if="filterSecteur===s.secteur" class="mt-2 ms-2">
                <v-chip v-for="b in s.contribuables" :key="b" size="x-small" variant="outlined" class="me-1 mb-1">{{ b }}</v-chip>
              </div>
            </div>
          </v-card-text>
        </v-card>
        <v-card v-if="concentration" rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Concentration — Les 5 premiers contribuables</v-card-title>
          <v-card-text>
            <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="mb-4">
              Les 5 premiers contribuables représentent <strong>{{ concentration.top5PctLabel }}%</strong> des montants demandés (périmètre : {{ concentration.nbContribuables }} contribuables).
            </v-alert>
            <v-progress-linear :model-value="concentration.top5Pct" color="warning" rounded height="16" class="mb-2">
              <template #default><span style="font-size:0.7rem;font-weight:700;color:white">{{ concentration.top5PctLabel }}%</span></template>
            </v-progress-linear>
            <div class="text-caption text-medium-emphasis">
              Indice de concentration Herfindahl-Hirschman (HHI) : {{ concentration.hhiLabel }} — {{ concentration.hhiNiveau }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Comparaison {{ compareYear }}</v-card-title>
          <v-card-text>
            <v-alert v-if="!loading && !comparatif.length" type="info" variant="tonal" density="compact" rounded="lg">
              Aucun montant approuvé sur les années comparées.
            </v-alert>
            <div v-for="c in comparatif" :key="c.label" class="mb-3">
              <div class="d-flex justify-space-between text-caption mb-1">
                <span class="text-truncate" style="max-width:60%">{{ c.label }}</span>
                <v-chip v-if="c.variation !== null" :color="c.variation>=0?'error':'success'" size="x-small" variant="tonal">{{ c.variation>=0?'+':'' }}{{ c.variation }}%</v-chip>
              </div>
              <div class="d-flex align-center ga-1 mb-1">
                <v-progress-linear :model-value="c.n1" color="primary" rounded height="8" class="flex-1"/>
                <span class="text-caption font-weight-semibold" style="min-width:70px;text-align:right">{{ c.m1Label }}</span>
              </div>
              <div class="d-flex align-center ga-1">
                <v-progress-linear :model-value="c.n2" color="secondary" rounded height="8" class="flex-1"/>
                <span class="text-caption text-medium-emphasis" style="min-width:70px;text-align:right">{{ c.m2Label }}</span>
              </div>
            </div>
            <div class="text-caption text-medium-emphasis mt-2">
              <v-icon icon="mdi-square" size="10" color="primary" class="me-1"/>{{ anneesComparaison[0] }}
              <v-icon icon="mdi-square" size="10" color="secondary" class="ms-3 me-1"/>{{ anneesComparaison[1] }}
              — montants approuvés (API /rapports/opendata)
            </div>
          </v-card-text>
        </v-card>
        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Répartition géographique</v-card-title>
          <v-card-text class="pa-0">
            <div style="height:160px;background:linear-gradient(135deg,#E8EDF2,#F4F6F9)" class="d-flex align-center justify-center">
              <div class="text-center pa-4">
                <v-icon icon="mdi-map-marker-radius" size="40" color="primary" class="mb-2"/>
                <div class="text-caption text-medium-emphasis">Carte interactive par région</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import { listerDemandesDecideur, type DemandeFile } from '../../services/decideur'
import { listerMesuresOpenData, formatMontantCompact, type MesureOpenData } from '../../services/rapports'

const filterSecteur = ref<string|null>(null)
const filterImpot = ref<string|null>(null)
const filterStatut = ref('Toutes')
const compareYear = ref('2026 vs 2025')

const loading = ref(false)
const error = ref<string | null>(null)
const demandes = ref<DemandeFile[]>([])
const mesuresOd = ref<MesureOpenData[]>([])

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    const [resDemandes, resMesures] = await Promise.all([
      listerDemandesDecideur(),
      listerMesuresOpenData(),
    ])
    demandes.value = resDemandes.data
    mesuresOd.value = resMesures
  } catch {
    error.value = 'Impossible de charger les données d\'analyse.'
  } finally {
    loading.value = false
  }
})

// ── Drill-down sectoriel (montants réels des demandes) ──────────────────────
const STATUT_MAP: Record<string, string | null> = {
  'Accordée': 'approuve',
  'Rejetée': 'rejete',
  'En instruction': 'en_instruction',
  'Toutes': null,
}

const demandesFiltrees = computed(() => {
  const statut = STATUT_MAP[filterStatut.value] ?? null
  return demandes.value.filter((d) => !statut || d.statutCode === statut)
})

const secteurs = computed(() =>
  [...new Set(demandes.value.map((d) => d.secteur || 'Non renseigné'))].sort(),
)

const drillData = computed(() => {
  const agg = new Map<string, { montant: number; nb: number; contribuables: Set<string> }>()
  for (const d of demandesFiltrees.value) {
    const secteur = d.secteur || 'Non renseigné'
    const a = agg.get(secteur) ?? { montant: 0, nb: 0, contribuables: new Set<string>() }
    a.montant += Number(d.montantFcfa)
    a.nb++
    if (d.contribuable?.raisonSociale) a.contribuables.add(d.contribuable.raisonSociale)
    agg.set(secteur, a)
  }
  return [...agg.entries()]
    .map(([secteur, a]) => ({ secteur, montant: a.montant, nb: a.nb, contribuables: [...a.contribuables] }))
    .sort((x, y) => y.montant - x.montant)
})
const maxDrill = computed(() => Math.max(1, ...drillData.value.map((s) => s.montant)))

// ── Concentration (top 5 + HHI) — calculée sur les montants réels ──────────
const concentration = computed(() => {
  const agg = new Map<string, number>()
  for (const d of demandesFiltrees.value) {
    const nom = d.contribuable?.raisonSociale
    if (!nom) continue
    agg.set(nom, (agg.get(nom) ?? 0) + Number(d.montantFcfa))
  }
  const montants = [...agg.values()].sort((a, b) => b - a)
  const total = montants.reduce((a, b) => a + b, 0)
  if (!total || !montants.length) return null
  const top5Pct = (montants.slice(0, 5).reduce((a, b) => a + b, 0) / total) * 100
  const hhi = montants.reduce((acc, m) => acc + (m / total) ** 2, 0)
  return {
    top5Pct,
    top5PctLabel: top5Pct.toLocaleString('fr-FR', { maximumFractionDigits: 1 }),
    hhiLabel: hhi.toLocaleString('fr-FR', { maximumFractionDigits: 2 }),
    hhiNiveau: hhi >= 0.25 ? 'Concentration élevée' : hhi >= 0.15 ? 'Concentration modérée' : 'Concentration faible',
    nbContribuables: montants.length,
  }
})

// ── Comparaison pluriannuelle (montants approuvés par année — open data) ────
const anneesComparaison = computed(() => compareYear.value.split(' vs ').map(Number))

const impots = computed(() =>
  [...new Set(mesuresOd.value.map((m) => m.version?.impotConcerne).filter((i): i is string => !!i))].sort(),
)

const mesuresFiltrees = computed(() =>
  mesuresOd.value.filter((m) => !filterImpot.value || m.version?.impotConcerne === filterImpot.value),
)

const comparatif = computed(() => {
  const [y1, y2] = anneesComparaison.value
  const montantAnnee = (m: MesureOpenData, annee: number) =>
    Number(m.agregats?.montantParAnnee?.find((a) => a.annee === annee)?.montant ?? 0)

  const lignes = mesuresFiltrees.value
    .map((m) => ({ label: m.codeMesure, m1: montantAnnee(m, y1), m2: montantAnnee(m, y2) }))
    .filter((l) => l.m1 > 0 || l.m2 > 0)
    .sort((a, b) => (b.m1 + b.m2) - (a.m1 + a.m2))

  const total1 = lignes.reduce((acc, l) => acc + l.m1, 0)
  const total2 = lignes.reduce((acc, l) => acc + l.m2, 0)
  const rows = [{ label: 'Total exonérations', m1: total1, m2: total2 }, ...lignes.slice(0, 3)]
  const max = Math.max(1, ...rows.flatMap((r) => [r.m1, r.m2]))

  return rows
    .filter((r) => r.m1 > 0 || r.m2 > 0)
    .map((r) => ({
      label: r.label,
      n1: (r.m1 / max) * 100,
      n2: (r.m2 / max) * 100,
      m1Label: formatMontantCompact(r.m1),
      m2Label: formatMontantCompact(r.m2),
      variation: r.m2 > 0 ? Math.round(((r.m1 - r.m2) / r.m2) * 1000) / 10 : null,
    }))
})
</script>
