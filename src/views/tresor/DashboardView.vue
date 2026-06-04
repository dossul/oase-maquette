<template>
  <div>
    <PageHeader
      title="Tableau de bord Trésor / GUDEF"
      subtitle="Suivi des rapprochements, remboursements, archives et renouvellements cote DGTCP"
      icon="mdi-bank"
    >
      <template #actions>
        <v-chip color="info" variant="tonal" size="small" prepend-icon="mdi-shield-sync">
          GUDEF + SIGFiP + OASE
        </v-chip>
      </template>
    </PageHeader>

    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="7">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Flux a regulariser</v-card-title>
          <v-data-table :headers="flowHeaders" :items="flows" hover>
            <template #item.statut="{ item }">
              <v-chip :color="statusColor(item.statut)" size="x-small" variant="tonal">{{ item.statut }}</v-chip>
            </template>
            <template #item.ecart="{ item }">
              <span class="font-weight-semibold">{{ item.ecart }}</span>
            </template>
          </v-data-table>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Calendrier des echeances d'archivage</v-card-title>
          <v-list density="comfortable" class="pa-2">
            <v-list-item v-for="deadline in deadlines" :key="deadline.title" :title="deadline.title" :subtitle="deadline.subtitle" rounded="lg">
              <template #prepend><v-avatar :color="deadline.color" size="34" rounded="lg"><v-icon :icon="deadline.icon" color="white" size="18" /></v-avatar></template>
              <template #append><v-chip :color="deadline.color" size="x-small" variant="tonal">{{ deadline.badge }}</v-chip></template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Visibilite DGTCP a ajouter dans la maquette</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Lecture consolidee des flux GUDEF et SIGFiP" prepend-icon="mdi-database-search" />
            <v-list-item title="Validation des ecarts avant cloture budgetaire" prepend-icon="mdi-stamp" />
            <v-list-item title="Consultation des archives et renouvellements" prepend-icon="mdi-archive-clock" />
            <v-list-item title="Pieces justificatives rattachees aux ecarts" prepend-icon="mdi-file-link-outline" />
            <v-list-item title="Journal des relances vers OTR / DGBF" prepend-icon="mdi-history" />
          </v-list>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Synthese trimestrielle</v-card-title>
          <v-card-text>
            <div v-for="metric in quarterlyMetrics" :key="metric.label" class="mb-3">
              <div class="d-flex justify-space-between text-caption mb-1">
                <span>{{ metric.label }}</span>
                <span class="font-weight-bold">{{ metric.value }}</span>
              </div>
              <v-progress-linear :model-value="metric.progress" :color="metric.color" rounded height="8" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'

const kpis = [
  { label: 'Ecart GUDEF / OASE', value: '18', icon: 'mdi-source-merge', color: 'warning', subtitle: 'Rapprochements en attente', to: '/tresor/rapprochements' },
  { label: 'Archives a valider', value: '42', icon: 'mdi-archive-arrow-down', color: 'info', subtitle: 'Mesures echeance <= 90 j', to: '/tresor/archives' },
  { label: 'Renouvellements sensibles', value: '9', icon: 'mdi-refresh-circle', color: 'error', subtitle: 'Accords de siege / conventions', to: '/tresor/archives' },
  { label: 'Flux certifies T2', value: '83 %', icon: 'mdi-check-decagram', color: 'success', subtitle: 'Cloture budgetaire provisoire', to: '/tresor/rapprochements' },
]

const flowHeaders = [
  { title: 'Flux', key: 'flux' },
  { title: 'Source', key: 'source' },
  { title: 'Ecart', key: 'ecart' },
  { title: 'Derniere sync', key: 'sync' },
  { title: 'Statut', key: 'statut' },
]

const flows = [
  { flux: 'Remboursements TVA diplomatiques', source: 'GUDEF + E-TAX', ecart: '12 lignes', sync: 'Aujourd hui 09:14', statut: 'A completer' },
  { flux: 'Annexe depenses fiscales 2026', source: 'SIGFiP + OASE', ecart: '3 references budgetaires', sync: 'Aujourd hui 08:20', statut: 'En revue' },
  { flux: 'Renouvellements zones franches', source: 'GUDEF + SAZOF', ecart: '0', sync: 'Hier 18:05', statut: 'Conforme' },
  { flux: 'Archives conventions minieres', source: 'DGTCP + DGMG', ecart: '2 pieces manquantes', sync: 'Hier 16:40', statut: 'A completer' },
]

const deadlines = [
  { title: 'Accords de siege - lot juin 2026', subtitle: '18 mesures a archiver ou reconduire', badge: 'J-30', color: 'warning', icon: 'mdi-flag' },
  { title: 'Conventions minieres phase recherche', subtitle: '4 renouvellements a arbitrer', badge: 'J-60', color: 'error', icon: 'mdi-pickaxe' },
  { title: 'Mesures LFI 2024', subtitle: 'Passage en archive budgetaire', badge: 'Pret', color: 'success', icon: 'mdi-archive-check' },
]

const quarterlyMetrics = [
  { label: 'Taux de rapprochement GUDEF', value: '78 %', progress: 78, color: 'primary' },
  { label: 'Dossiers archives avec pieces completes', value: '86 %', progress: 86, color: 'success' },
  { label: 'Renouvellements instruits dans les delais', value: '64 %', progress: 64, color: 'warning' },
  { label: 'Ecarts ouverts > 30 jours', value: '11 %', progress: 11, color: 'error' },
]

const statusColor = (value: string) =>
  ({ Conforme: 'success', 'En revue': 'info', 'A completer': 'warning' } as Record<string, string>)[value] || 'secondary'
</script>
