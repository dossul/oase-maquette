<template>
  <div>
    <PageHeader title="Analyse sectorielle et géographique" subtitle="Drill-down par secteur, type d'impôt ou région" icon="mdi-chart-areaspline"/>
    <v-row class="mb-4">
      <v-col cols="6" md="3">
        <v-select v-model="filterSecteur" :items="secteurs" label="Secteur" clearable hide-details/>
      </v-col>
      <v-col cols="6" md="3">
        <v-select v-model="filterImpot" :items="['Douanes','IS','TVA','IRCM','Tous']" label="Type d'impôt" hide-details/>
      </v-col>
      <v-col cols="6" md="3">
        <v-select v-model="filterStatut" :items="['Accordée','Suspendue','Expirée','Toutes']" label="Statut" hide-details/>
      </v-col>
      <v-col cols="6" md="3">
        <v-select v-model="compareYear" :items="['2026 vs 2025','2025 vs 2024','2024 vs 2023']" label="Comparaison" hide-details/>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">
            Analyse par secteur — {{ filterSecteur || 'Tous secteurs' }}
            <v-chip color="primary" size="x-small" variant="tonal" class="ms-2">Drill-down</v-chip>
          </v-card-title>
          <v-card-text>
            <div v-for="s in drillData" :key="s.secteur" class="mb-4">
              <div class="d-flex align-center justify-space-between mb-1">
                <span class="font-weight-semibold text-body-2 cursor-pointer text-primary" @click="filterSecteur=s.secteur">{{ s.secteur }}</span>
                <div class="d-flex align-center ga-2">
                  <span class="font-weight-bold">{{ s.n2026 }}M</span>
                  <v-chip :color="s.variation>=0?'error':'success'" size="x-small" variant="tonal">{{ s.variation>=0?'+':'' }}{{ s.variation }}%</v-chip>
                </div>
              </div>
              <v-progress-linear :model-value="(s.n2026/234)*100" color="primary" rounded height="10" bg-color="surface-light"/>
              <div v-if="filterSecteur===s.secteur" class="mt-2 ms-2">
                <v-chip v-for="b in s.beneficiaires" :key="b" size="x-small" variant="outlined" class="me-1 mb-1">{{ b }}</v-chip>
              </div>
            </div>
          </v-card-text>
        </v-card>
        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Concentration — Les 5 premiers bénéficiaires</v-card-title>
          <v-card-text>
            <v-alert type="info" variant="tonal" density="compact" rounded="lg" class="mb-4">
              Les 5 premiers bénéficiaires représentent <strong>47,3%</strong> du coût total des exonérations.
            </v-alert>
            <v-progress-linear :model-value="47.3" color="warning" rounded height="16" class="mb-2">
              <template #default><span style="font-size:0.7rem;font-weight:700;color:white">47,3%</span></template>
            </v-progress-linear>
            <div class="text-caption text-medium-emphasis">Indice de concentration Herfindahl-Hirschman (HHI): 0.42 — Concentration modérée</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Comparaison {{ compareYear }}</v-card-title>
          <v-card-text>
            <div v-for="c in comparatif" :key="c.label" class="mb-3">
              <div class="d-flex justify-space-between text-caption mb-1">
                <span>{{ c.label }}</span>
                <v-chip :color="c.variation>=0?'error':'success'" size="x-small" variant="tonal">{{ c.variation>=0?'+':'' }}{{ c.variation }}%</v-chip>
              </div>
              <div class="d-flex ga-1">
                <v-progress-linear :model-value="c.n1" color="primary" rounded height="8" class="flex-1"/>
                <v-progress-linear :model-value="c.n2" color="secondary" rounded height="8" class="flex-1"/>
              </div>
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
import { ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
const filterSecteur = ref<string|null>(null)
const filterImpot = ref('Tous')
const filterStatut = ref('Toutes')
const compareYear = ref('2026 vs 2025')
const secteurs = ['Mines & Hydrocarbures','Zone Franche','Agriculture','Énergie','Numérique','Santé','Transport']
const drillData = [
  { secteur: 'Mines & Hydrocarbures', n2026: 234, variation: +18.2, beneficiaires: ['MINES DU NORD TOGO','PETRO-TOGO SA','GOLDEN MINES'] },
  { secteur: 'Zone Franche', n2026: 198, variation: +5.4, beneficiaires: ['LOMÉ TEXTILE ZF SAS','AGRO-PROCESSING ZES'] },
  { secteur: 'Agriculture', n2026: 145, variation: -2.1, beneficiaires: ['AGRO-TOGO INVEST SA','AGRI-PLUS TOGO'] },
  { secteur: 'Énergie', n2026: 112, variation: +32.1, beneficiaires: ['ENERGIE SOLAIRE TOGO','VOLTALIA TOGO'] },
  { secteur: 'Numérique', n2026: 89, variation: +14.7, beneficiaires: ['NUMERIQUE AFRIQUE SA','TOGO TELECOM'] },
]
const comparatif = [
  { label: 'Total exonérations', n1: 70, n2: 60, variation: 16.7 },
  { label: 'Mines', n1: 65, n2: 55, variation: 18.2 },
  { label: 'Zone Franche', n1: 55, n2: 52, variation: 5.8 },
  { label: 'Agriculture', n1: 40, n2: 41, variation: -2.4 },
]
</script>
