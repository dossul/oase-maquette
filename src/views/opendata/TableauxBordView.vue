<template>
  <div>
    <v-container style="max-width:1280px" class="py-8">
      <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-6">
        <div>
          <h1 style="font-size:1.6rem;font-weight:700;letter-spacing:-0.02em">Tableaux de bord publics</h1>
          <p class="text-medium-emphasis text-body-2 mt-1">Données agrégées et anonymisées — Mise à jour trimestrielle</p>
        </div>
        <div class="d-flex align-center ga-2">
          <v-select v-model="annee" :items="['2026','2025','2024','2023']" label="Année" hide-details density="compact" style="width:120px"/>
        </div>
      </div>

      <!-- KPIs publics -->
      <v-row class="mb-8">
        <v-col v-for="k in kpis" :key="k.label" cols="6" md="3"><KpiCard v-bind="k"/></v-col>
      </v-row>

      <!-- Évolution annuelle -->
      <v-card rounded="lg" elevation="1" class="mb-6">
        <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Évolution annuelle du coût total des exonérations (Mds FCFA)</v-card-title>
        <v-card-text>
          <div class="text-caption text-medium-emphasis mb-4">Données 2018–2025 — Source : MEF / OASE</div>
          <div v-for="row in evolutionAnnuelle" :key="row.annee" class="mb-3 d-flex align-center ga-3">
            <div style="width:44px;font-size:0.8rem;font-weight:700">{{ row.annee }}</div>
            <v-progress-linear :model-value="(row.montant/900)*100" color="primary" rounded height="12" class="flex-grow-1"/>
            <div style="width:80px;font-size:0.8rem;font-weight:700;text-align:right">{{ row.montant }} Mds</div>
          </div>
        </v-card-text>
      </v-card>

      <v-row class="mb-6">
        <!-- Répartition type impôt -->
        <v-col cols="12" md="6">
          <v-card rounded="lg" elevation="1" class="h-100">
            <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Répartition par type d'impôt {{ annee }}</v-card-title>
            <v-card-text>
              <div v-for="t in repartitionType" :key="t.label" class="mb-3">
                <div class="d-flex justify-space-between text-caption mb-1">
                  <span class="font-weight-medium">{{ t.label }}</span>
                  <span class="font-weight-bold">{{ t.pct }}% — {{ t.montant }} Mds</span>
                </div>
                <v-progress-linear :model-value="t.pct" :color="t.color" rounded height="10"/>
              </div>
              <div class="mt-4 pa-3 rounded-lg text-caption text-medium-emphasis" style="background:rgba(0,0,0,0.04)">
                📝 Note méthodologique : Les exonérations douanières incluent les droits de douane et la TVA à l'importation. Les montants sont exprimés en milliards de FCFA courants.
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <!-- Top secteurs -->
        <v-col cols="12" md="6">
          <v-card rounded="lg" elevation="1" class="h-100">
            <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Top secteurs bénéficiaires {{ annee }}</v-card-title>
            <v-card-text>
              <div v-for="(s,i) in topSecteurs" :key="s.secteur" class="mb-3">
                <div class="d-flex justify-space-between text-caption mb-1">
                  <span>{{ i+1 }}. {{ s.secteur }}</span>
                  <span class="font-weight-bold">{{ s.montant }} Mds</span>
                </div>
                <v-progress-linear :model-value="(s.montant/234)*100" color="success" rounded height="8"/>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Map -->
      <v-card rounded="lg" elevation="1" class="mb-6">
        <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Répartition géographique par région</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="4" class="d-flex align-center justify-center">
              <div class="text-center pa-8">
                <v-icon icon="mdi-map" size="80" color="primary" class="mb-3"/>
                <div class="text-body-2 text-medium-emphasis">Carte choroplèthe des dépenses fiscales par région du Togo</div>
              </div>
            </v-col>
            <v-col cols="12" md="8">
              <v-list density="compact" class="pa-2">
                <v-list-item v-for="r in regions" :key="r.nom" :title="r.nom" :subtitle="`${r.count} dossiers actifs`" rounded="lg" class="mb-2">
                  <template #append>
                    <div class="text-end">
                      <div class="font-weight-bold text-primary">{{ r.montant }} Mds</div>
                      <v-progress-linear :model-value="(r.montant/412)*100" color="primary" rounded height="4" style="width:80px"/>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import KpiCard from '../../components/KpiCard.vue'
import { mockTopSecteurs, mockRegions } from '../../mock/data'
const annee = ref('2025')
const kpis = [
  { label: 'Coût total dépenses fiscales', value: '724 Mds FCFA', icon: 'mdi-currency-usd', color: 'primary' },
  { label: '% du PIB', value: '3,8%', icon: 'mdi-chart-line', color: 'info' },
  { label: 'Nombre de bénéficiaires', value: '1 102', icon: 'mdi-domain', color: 'success' },
  { label: 'Types d\'exonérations', value: 6, icon: 'mdi-label-multiple', color: 'secondary' },
]
const evolutionAnnuelle = [
  { annee: '2018', montant: 320 }, { annee: '2019', montant: 380 }, { annee: '2020', montant: 410 },
  { annee: '2021', montant: 490 }, { annee: '2022', montant: 560 }, { annee: '2023', montant: 640 },
  { annee: '2024', montant: 680 }, { annee: '2025', montant: 724 },
]
const repartitionType = [
  { label: 'Droits de douane', pct: 42, montant: 304, color: 'primary' },
  { label: 'TVA (interne + import)', pct: 28, montant: 203, color: 'info' },
  { label: 'Impôt sur les sociétés', pct: 22, montant: 159, color: 'success' },
  { label: 'IRCM & Autres', pct: 8, montant: 58, color: 'secondary' },
]
const topSecteurs = mockTopSecteurs.slice(0, 6)
const regions = mockRegions
</script>
