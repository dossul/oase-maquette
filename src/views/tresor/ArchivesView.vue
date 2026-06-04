<template>
  <div>
    <PageHeader
      title="Archives et renouvellements"
      subtitle="Suivi des mesures echues, archivage probant et renouvellements avant cloture"
      icon="mdi-archive-clock"
    >
      <template #actions>
        <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-calendar-alert">Echeances 90 jours</v-btn>
        <v-btn color="primary" size="small" prepend-icon="mdi-archive-arrow-down">Lancer l archivage</v-btn>
      </template>
    </PageHeader>

    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1">
          <v-data-table :headers="headers" :items="archives" hover>
            <template #item.type="{ item }">
              <v-chip size="x-small" color="primary" variant="tonal">{{ item.type }}</v-chip>
            </template>
            <template #item.statut="{ item }">
              <v-chip :color="statusColor(item.statut)" size="x-small" variant="tonal">{{ item.statut }}</v-chip>
            </template>
            <template #item.actions="{ item }">
              <v-btn size="x-small" variant="tonal" color="primary" class="me-1">{{ item.statut === 'A archiver' ? 'Archiver' : 'Consulter' }}</v-btn>
              <v-btn size="x-small" variant="tonal" color="secondary">{{ item.statut === 'Renouvellement' ? 'Renouveler' : 'Journal' }}</v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Regles visibles dans la maquette</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Archivage automatique a l echeance" prepend-icon="mdi-timer-lock-outline" />
            <v-list-item title="Controle des pieces avant cloture" prepend-icon="mdi-file-check-outline" />
            <v-list-item title="Conservation des references et journaux" prepend-icon="mdi-history" />
            <v-list-item title="Passage actif -> expire -> archive -> renouvele" prepend-icon="mdi-swap-horizontal-bold" />
          </v-list>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Lots imminents</v-card-title>
          <v-list density="comfortable" class="pa-2">
            <v-list-item v-for="lot in lots" :key="lot.title" :title="lot.title" :subtitle="lot.subtitle" rounded="lg">
              <template #append><v-chip :color="lot.color" size="x-small" variant="tonal">{{ lot.badge }}</v-chip></template>
            </v-list-item>
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
  { label: 'Mesures a archiver', value: '42', icon: 'mdi-archive-arrow-down', color: 'warning', subtitle: 'Echeance <= 90 jours' },
  { label: 'Archives conformes', value: '248', icon: 'mdi-archive-check', color: 'success', subtitle: 'Journal et pieces conserves' },
  { label: 'Renouvellements ouverts', value: '9', icon: 'mdi-refresh-circle', color: 'error', subtitle: 'Decision attendue' },
  { label: 'Mesures deja renouvelees', value: '17', icon: 'mdi-check-circle', color: 'info', subtitle: 'Campagne 2026' },
]

const headers = [
  { title: 'Mesure', key: 'mesure' },
  { title: 'Beneficiaire', key: 'beneficiaire' },
  { title: 'Type', key: 'type' },
  { title: 'Echeance', key: 'echeance' },
  { title: 'Statut', key: 'statut' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const archives = [
  { mesure: 'MES-2024-00977', beneficiaire: 'Programme logement social', type: 'LFI / loi speciale', echeance: '31/12/2024', statut: 'Archivee' },
  { mesure: 'MES-2026-00124', beneficiaire: 'Mission diplomatique Canada', type: 'Accord de siege', echeance: '31/12/2026', statut: 'Renouvellement' },
  { mesure: 'MES-2025-00411', beneficiaire: 'Mines du Nord Togo', type: 'Convention miniere', echeance: '15/03/2030', statut: 'Suivi phase' },
  { mesure: 'MES-2025-00210', beneficiaire: 'Zone franche textile Kara', type: 'Zone franche', echeance: '30/09/2026', statut: 'A archiver' },
]

const lots = [
  { title: 'Lot accords de siege', subtitle: '18 dossiers a revoir avant cloture', badge: 'J-30', color: 'warning' },
  { title: 'Lot zones franches', subtitle: '11 dossiers arrivent a echeance', badge: 'J-60', color: 'info' },
  { title: 'Lot lois speciales 2024', subtitle: 'Pret pour bascule archive', badge: 'Pret', color: 'success' },
]

const statusColor = (value: string) =>
  ({ Archivee: 'success', Renouvellement: 'warning', 'Suivi phase': 'info', 'A archiver': 'error' } as Record<string, string>)[value] || 'secondary'
</script>
