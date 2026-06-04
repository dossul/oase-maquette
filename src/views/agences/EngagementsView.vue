<template>
  <div>
    <PageHeader title="Suivi des engagements" subtitle="Vérification du respect des obligations contractuelles des bénéficiaires" icon="mdi-chart-timeline"/>
    <AlertBanner type="error" title="2 entreprises en défaut d'engagements" text="TOGO PHARMA ZF et LOMÉ TEXTILE ZF SAS n'ont pas atteint les seuils contractuels d'emplois et d'investissements." />
    <v-card rounded="lg" elevation="1" class="mb-4">
      <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Tableau de bord des engagements par convention</v-card-title>
      <v-card-text class="pa-4">
        <div v-for="conv in engagements" :key="conv.id" class="mb-6">
          <div class="d-flex align-center justify-space-between mb-2">
            <div>
              <span class="font-weight-semibold text-body-2">{{ conv.reference }}</span>
              <span class="text-caption text-medium-emphasis ms-2">— {{ conv.beneficiaire }}</span>
            </div>
            <v-chip :color="conv.alerte?'error':'success'" size="x-small" variant="tonal">{{ conv.alerte?'Défaut':'Conforme' }}</v-chip>
          </div>
          <v-row dense>
            <v-col cols="12" sm="6">
              <div class="d-flex justify-space-between text-caption mb-1">
                <span>Emplois créés</span>
                <span><strong>{{ conv.emploisCrees }}</strong> / {{ conv.emploisEngages }} engagés</span>
              </div>
              <v-progress-linear :model-value="(conv.emploisCrees/conv.emploisEngages)*100" :color="conv.emploisCrees<conv.emploisEngages*0.8?'error':'success'" rounded height="8"/>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="d-flex justify-space-between text-caption mb-1">
                <span>Investissements</span>
                <span><strong>{{ conv.investRealise }}Mds</strong> / {{ conv.investEngage }}Mds</span>
              </div>
              <v-progress-linear :model-value="(conv.investRealise/conv.investEngage)*100" :color="conv.investRealise<conv.investEngage*0.8?'warning':'success'" rounded height="8"/>
            </v-col>
          </v-row>
          <div class="d-flex ga-2 mt-2">
            <v-btn size="x-small" variant="tonal" color="primary" prepend-icon="mdi-file-plus">Rapport annuel</v-btn>
            <v-btn v-if="conv.alerte" size="x-small" variant="tonal" color="warning" prepend-icon="mdi-pause">Suspension cond.</v-btn>
            <v-btn v-if="conv.alerte" size="x-small" variant="tonal" color="error" prepend-icon="mdi-close">Résiliation</v-btn>
            <v-btn v-else size="x-small" variant="tonal" color="success" prepend-icon="mdi-check">Maintenir</v-btn>
          </div>
          <v-divider class="mt-4"/>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>
<script setup lang="ts">
import PageHeader from '../../components/PageHeader.vue'
import AlertBanner from '../../components/AlertBanner.vue'
const engagements = [
  { id: 'C001', reference: 'ZFI-2024-012', beneficiaire: 'LOMÉ TEXTILE ZF SAS', emploisCrees: 312, emploisEngages: 450, investRealise: 0.6, investEngage: 0.89, alerte: true },
  { id: 'C002', reference: 'ZES-2023-008', beneficiaire: 'AGRO-PROCESSING ZES', emploisCrees: 620, emploisEngages: 800, investRealise: 0.95, investEngage: 1.2, alerte: false },
  { id: 'C003', reference: 'CI-2025-003', beneficiaire: 'ENERGIE SOLAIRE TOGO', emploisCrees: 95, emploisEngages: 180, investRealise: 0.28, investEngage: 0.56, alerte: true },
]
</script>
