<template>
  <div>
    <PageHeader
      title="Tableau de bord ministère sectoriel"
      subtitle="Avis sectoriels, contributions sur les mesures et campagnes de mise à jour"
      icon="mdi-office-building"
    >
      <template #actions>
        <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-file-send">Soumettre un avis</v-btn>
        <v-btn color="primary" size="small" prepend-icon="mdi-update">Mettre a jour un lot</v-btn>
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
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Demandes d'avis et contributions attendues</v-card-title>
          <v-data-table :headers="headers" :items="avisRows" hover>
            <template #item.priorite="{ item }">
              <v-chip :color="priorityColor(item.priorite)" size="x-small" variant="tonal">{{ item.priorite }}</v-chip>
            </template>
            <template #item.statut="{ item }">
              <v-chip :color="statusColor(item.statut)" size="x-small" variant="outlined">{{ item.statut }}</v-chip>
            </template>
            <template #item.actions="{ item }">
              <v-btn size="x-small" variant="tonal" color="primary">Traiter</v-btn>
            </template>
          </v-data-table>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Campagnes de mise a jour sectorielle</v-card-title>
          <v-list density="comfortable" class="pa-2">
            <v-list-item v-for="campaign in campaigns" :key="campaign.title" :title="campaign.title" :subtitle="campaign.subtitle" rounded="lg">
              <template #append>
                <div style="min-width: 120px">
                  <v-progress-linear :model-value="campaign.progress" color="primary" rounded height="8" class="mb-1" />
                  <div class="text-caption text-medium-emphasis text-right">{{ campaign.progress }}%</div>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Eléments couverts dans la maquette</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Contribution par structure et par dossier" prepend-icon="mdi-account-edit-outline" />
            <v-list-item title="Avis sectoriel avant validation" prepend-icon="mdi-comment-check-outline" />
            <v-list-item title="Relances sur donnees manquantes" prepend-icon="mdi-bell-ring-outline" />
            <v-list-item title="Suivi des engagements sectoriels" prepend-icon="mdi-chart-box-outline" />
            <v-list-item title="Historique des mises a jour" prepend-icon="mdi-history" />
          </v-list>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Points focaux suivis</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item v-for="focal in focals" :key="focal.nom" :title="focal.nom" :subtitle="focal.role" rounded="lg">
              <template #append><v-chip size="x-small" color="info" variant="tonal">{{ focal.portefeuille }}</v-chip></template>
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
  { label: 'Avis attendus', value: '14', icon: 'mdi-comment-clock-outline', color: 'warning', subtitle: 'Delai < 7 jours' },
  { label: 'Contributions traitees', value: '38', icon: 'mdi-file-check-outline', color: 'success', subtitle: 'Campagne 2026' },
  { label: 'Mises a jour sectorielles', value: '9', icon: 'mdi-database-refresh-outline', color: 'primary', subtitle: 'En validation UPF' },
  { label: 'Ecarts a documenter', value: '6', icon: 'mdi-alert-circle-outline', color: 'error', subtitle: 'A consolider avant arbitrage' },
]

const headers = [
  { title: 'Objet', key: 'objet' },
  { title: 'Structure', key: 'structure' },
  { title: 'Priorite', key: 'priorite' },
  { title: 'Echeance', key: 'echeance' },
  { title: 'Statut', key: 'statut' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const avisRows = [
  { objet: 'Avis sur mesure agricole LOFI 2026', structure: 'Min. Agriculture', priorite: 'Haute', echeance: '03/06/2026', statut: 'En attente' },
  { objet: 'Validation impact emploi textile', structure: 'Min. Industrie', priorite: 'Moyenne', echeance: '05/06/2026', statut: 'En cours' },
  { objet: 'Confirmation benefices energie solaire', structure: 'Min. Energie', priorite: 'Haute', echeance: '07/06/2026', statut: 'A completer' },
]

const campaigns = [
  { title: 'Mise a jour des mesures agriculture / logement social', subtitle: 'Croisement base juridique + benefices attendus', progress: 68 },
  { title: 'Consolidation des indicateurs de second rang', subtitle: 'Emplois, investissements, CA, VA', progress: 54 },
  { title: 'Qualification des objectifs ODD par secteur', subtitle: 'Alignement OASE / priorites nationales', progress: 81 },
]

const focals = [
  { nom: 'A. Mensah', role: 'Point focal agriculture', portefeuille: 'Primaire' },
  { nom: 'K. Bado', role: 'Point focal industrie', portefeuille: 'Secondaire' },
  { nom: 'S. Atayi', role: 'Point focal energie', portefeuille: 'Transition' },
]

const priorityColor = (value: string) => ({ Haute: 'error', Moyenne: 'warning' } as Record<string, string>)[value] || 'info'
const statusColor = (value: string) => ({ 'En attente': 'warning', 'En cours': 'info', 'A completer': 'error' } as Record<string, string>)[value] || 'success'
</script>
