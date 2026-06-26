<template>
  <div>
    <PageHeader title="Tableau de bord stratégique" subtitle="Pilotage de la politique fiscale en temps réel — UPF / MEF" icon="mdi-chart-areaspline">
      <template #actions>
        <v-select v-model="periode" :items="['Mois courant','Trimestre','Année 2026','Personnalisée']" hide-details density="compact" style="width:180px" class="me-2"/>
        <ExportButton label="Exporter la vue" :formats="[{value:'pdf',label:'PDF',icon:'mdi-file-pdf-box'},{value:'ppt',label:'PowerPoint',icon:'mdi-presentation'}]" @export="() => {}"/>
      </template>
    </PageHeader>
    <v-row class="mb-5">
      <v-col v-for="k in kpis" :key="k.label" cols="6" md="3"><KpiCard v-bind="k" /></v-col>
    </v-row>
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">{{ error }}</v-alert>
    <v-row>
      <!-- Évolution mensuelle sparkline -->
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Évolution mensuelle — Coût des exonérations vs LFI (Mds FCFA)</v-card-title>
          <v-card-text>
            <div class="d-flex ga-3 mb-3">
              <v-chip color="primary" size="x-small" variant="tonal">Réalisations 2026</v-chip>
              <v-chip color="secondary" size="x-small" variant="outlined">Réalisations 2025</v-chip>
              <v-chip color="info" size="x-small" variant="outlined">Prévisions LFI</v-chip>
            </div>
            <div v-for="row in evolutionData" :key="row.mois" class="mb-2 d-flex align-center ga-3">
              <div style="width:40px;font-size:0.72rem;font-weight:600;color:#6B7280">{{ row.mois }}</div>
              <div class="flex-grow-1">
                <v-progress-linear :model-value="(row.montant/150)*100" color="primary" rounded height="10" bg-color="surface-light"/>
              </div>
              <div style="width:60px;font-size:0.75rem;font-weight:700;text-align:right">{{ row.montant }}M</div>
              <v-chip :color="row.montant>row.lfi?'error':'success'" size="x-small" variant="tonal" style="min-width:60px">LFI: {{ row.lfi }}M</v-chip>
            </div>
          </v-card-text>
        </v-card>
        <v-row>
          <v-col cols="12" sm="6">
            <v-card rounded="lg" elevation="1">
              <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold">Top 10 secteurs (Mds FCFA)</v-card-title>
              <v-card-text class="pa-3">
                <div v-for="s in topSecteurs" :key="s.secteur" class="mb-2">
                  <div class="d-flex justify-space-between text-caption mb-1">
                    <span class="text-truncate" style="max-width:140px">{{ s.secteur }}</span>
                    <span class="font-weight-bold">{{ s.montant }}M</span>
                  </div>
                  <v-progress-linear :model-value="(s.montant/234)*100" color="primary" rounded height="6"/>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6">
            <v-card rounded="lg" elevation="1">
              <v-card-title class="pa-4 pb-2 text-body-2 font-weight-semibold">Répartition par type d'impôt</v-card-title>
              <v-card-text>
                <div v-for="t in repartitionType" :key="t.label" class="mb-3">
                  <div class="d-flex justify-space-between text-caption mb-1">
                    <span>{{ t.label }}</span>
                    <span class="font-weight-bold">{{ t.pct }}%</span>
                  </div>
                  <v-progress-linear :model-value="t.pct" :color="t.color" rounded height="8"/>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Carte — Exonérations par région</v-card-title>
          <v-card-text class="pa-0">
            <div class="d-flex align-center justify-center" style="height:200px;background:linear-gradient(135deg,#E8EDF2,#F4F6F9);border-radius:0 0 8px 8px">
              <div class="text-center">
                <v-icon icon="mdi-map" size="48" color="primary" class="mb-2"/>
                <div class="text-caption text-medium-emphasis">Carte choroplèthe Togo</div>
              </div>
            </div>
          </v-card-text>
          <v-list density="compact" class="pa-2">
            <v-list-item v-for="r in regions" :key="r.nom" :title="r.nom" :subtitle="`${r.count} dossiers`" rounded="lg">
              <template #append><span class="font-weight-bold text-primary text-caption">{{ r.montant }}M</span></template>
            </v-list-item>
          </v-list>
        </v-card>
        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Top 5 bénéficiaires</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item v-for="(b,i) in topBenef" :key="b.nom" :subtitle="b.type" rounded="lg">
              <template #prepend><v-avatar :color="['primary','secondary','info','success','warning'][i]" size="28" rounded="sm"><span style="font-size:0.7rem;color:white;font-weight:700">{{ i+1 }}</span></v-avatar></template>
              <template #title><span class="text-body-2 font-weight-medium">{{ b.nom }}</span></template>
              <template #append><span class="font-weight-bold text-body-2">{{ b.montant }}M</span></template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'
import ExportButton from '../../components/ExportButton.vue'
import { getKpisP4, getKpisP5 } from '../../services/dashboards'
import { mockEvolutionMensuelle, mockTopSecteurs, mockRegions } from '../../mock/data'
const periode = ref('Année 2026')
const p4 = ref<any>(null)
const p5 = ref<any>(null)
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  try {
    const [res4, res5] = await Promise.all([getKpisP4(), getKpisP5()])
    p4.value = res4.data
    p5.value = res5.data
  } catch (e) {
    error.value = 'Impossible de charger les indicateurs'
  } finally {
    loading.value = false
  }
})

const kpis = computed(() => [
  { label: 'Total exonéré', value: p5.value ? new Intl.NumberFormat('fr-FR').format(p5.value.totalAccorde) + ' FCFA' : '—', icon: 'mdi-currency-usd', color: 'primary', subtitle: 'Montants accordés', to: '/decideur/analyse' },
  { label: 'Exonérations actives', value: p4.value ? p4.value.totalDemandes : '—', icon: 'mdi-check-circle', color: 'success', to: '/decideur/analyse' },
  { label: 'Bénéficiaires', value: p5.value ? p5.value.nombreBeneficiaires : '—', icon: 'mdi-chart-line', color: 'info', to: '/decideur/rapport-annuel' },
  { label: 'Alertes non traitées', value: '—', icon: 'mdi-alert', color: 'warning', to: '/decideur/simulation' },
])
const evolutionData = mockEvolutionMensuelle.slice(0, 6)
const topSecteurs = mockTopSecteurs.slice(0, 7)
const repartitionType = computed(() => {
  if (!p5.value?.parImpot) {
    return [
      { label: 'Droits de douane', pct: 42, color: 'primary' },
      { label: 'TVA', pct: 28, color: 'info' },
      { label: 'Impôt sur les sociétés', pct: 22, color: 'success' },
      { label: 'Autres', pct: 8, color: 'secondary' },
    ]
  }
  const total = p5.value.totalAccorde || 1
  return p5.value.parImpot.map((i: any) => ({
    label: i.impotConcerne || 'Autres',
    pct: Math.round((i._sum?.montantExonerationAccorde || 0) / total * 100),
    color: 'primary',
  }))
})
const regions = mockRegions
const topBenef = [
  { nom: 'MINES DU NORD TOGO', type: 'Mines', montant: 234 },
  { nom: 'LOMÉ TEXTILE ZF SAS', type: 'Zone Franche', montant: 198 },
  { nom: 'PORT DE LOMÉ SARL', type: 'Transport', montant: 156 },
  { nom: 'AGRO-TOGO INVEST SA', type: 'Agriculture', montant: 120 },
  { nom: 'ENERGIE SOLAIRE TOGO', type: 'Énergie', montant: 112 },
]
</script>
