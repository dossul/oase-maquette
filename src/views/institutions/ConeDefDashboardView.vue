<template>
  <div>
    <PageHeader
      title="Tableau de bord CONEDEF"
      subtitle="Cycle d'evaluation des depenses fiscales, revenue forgone et synchronisation avec le rapport annuel"
      icon="mdi-chart-box-outline"
    >
      <template #actions>
        <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-book-open-variant">Notes methodologiques</v-btn>
        <v-btn color="primary" size="small" prepend-icon="mdi-file-chart-outline">Preparer l annexe LFI</v-btn>
      </template>
    </PageHeader>

    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Rapports d'evaluation disponibles</v-card-title>
          <v-data-table :headers="headers" :items="reports" hover>
            <template #item.statut="{ item }">
              <v-chip :color="statusColor(item.statut)" size="x-small" variant="tonal">{{ item.statut }}</v-chip>
            </template>
            <template #item.couverture="{ item }">
              <div class="d-flex align-center ga-3">
                <v-progress-linear :model-value="item.couverture" color="primary" rounded height="8" style="max-width: 120px" />
                <span class="text-caption font-weight-semibold">{{ item.couverture }}%</span>
              </div>
            </template>
          </v-data-table>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Cohérence sectorielle</v-card-title>
          <v-card-text>
            <div v-for="item in sectors" :key="item.label" class="mb-3">
              <div class="d-flex justify-space-between text-caption mb-1">
                <span>{{ item.label }}</span>
                <span class="font-weight-bold">{{ item.value }}</span>
              </div>
              <v-progress-linear :model-value="item.progress" :color="item.color" rounded height="10" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Cycle CONEDEF visible</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Collecte OASE / MRD" prepend-icon="mdi-database-arrow-down-outline" />
            <v-list-item title="Qualification revenu forgone" prepend-icon="mdi-calculator-variant-outline" />
            <v-list-item title="Validation UPF / CONEDEF" prepend-icon="mdi-stamp" />
            <v-list-item title="Synchronisation rapport annuel" prepend-icon="mdi-file-sync-outline" />
            <v-list-item title="Publication des rapports 2019-2024" prepend-icon="mdi-publish" />
          </v-list>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Marquage methodologique</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Confirme" prepend-icon="mdi-check-decagram-outline" />
            <v-list-item title="Provisoire" prepend-icon="mdi-timer-sand" />
            <v-list-item title="A confirmer" prepend-icon="mdi-help-circle-outline" />
            <v-list-item title="Non evaluable" prepend-icon="mdi-close-octagon-outline" />
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'

const kpis = [
  { label: 'Rapports consolides', value: '6', icon: 'mdi-file-chart-outline', color: 'primary', subtitle: '2019 a 2024' },
  { label: 'Mesures evaluables 2024', value: '532 / 1316', icon: 'mdi-chart-donut', color: 'info', subtitle: 'Revenue forgone' },
  { label: 'Annexe LFI en preparation', value: '2027', icon: 'mdi-briefcase-clock-outline', color: 'warning', subtitle: 'Cycle en cours' },
  { label: 'Ecarts sectoriels critiques', value: '2', icon: 'mdi-scale-balance', color: 'error', subtitle: 'Primaire et industrie' },
]

const headers = [
  { title: 'Rapport', key: 'rapport' },
  { title: 'Periode', key: 'periode' },
  { title: 'Couverture', key: 'couverture' },
  { title: 'Statut', key: 'statut' },
]

const reports = [
  { rapport: 'Rapport dépenses fiscales 2024', periode: 'Exercice 2024', couverture: 41, statut: 'En consolidation' },
  { rapport: 'Rapport dépenses fiscales 2023', periode: 'Exercice 2023', couverture: 88, statut: 'Publie' },
  { rapport: 'Rapport dépenses fiscales 2022', periode: 'Exercice 2022', couverture: 84, statut: 'Publie' },
]

const sectors = [
  { label: 'Tertiaire vs priorites nationales', value: 'Sur-represente', progress: 82, color: 'warning' },
  { label: 'Primaire / agriculture', value: 'Sous-couvert', progress: 31, color: 'error' },
  { label: 'Industrie / transformation', value: 'A renforcer', progress: 48, color: 'warning' },
  { label: 'Extractif', value: 'A qualifier', progress: 55, color: 'info' },
]

const statusColor = (value: string) => ({ Publie: 'success', 'En consolidation': 'warning' } as Record<string, string>)[value] || 'secondary'
</script>
