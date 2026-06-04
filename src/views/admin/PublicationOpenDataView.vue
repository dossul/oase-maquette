<template>
  <div>
    <PageHeader
      title="Publication open data"
      subtitle="Préparation, anonymisation, validation et publication des jeux publics et indicateurs obligatoires"
      icon="mdi-publish"
    >
      <template #actions>
        <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-shield-lock-outline">Règles d'anonymisation</v-btn>
        <v-btn color="primary" size="small" prepend-icon="mdi-send-check-outline">Publier un lot</v-btn>
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
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Workflow de publication</v-card-title>
          <v-stepper model-value="4" alt-labels>
            <v-stepper-header>
              <v-stepper-item title="1. Sélection" value="1" />
              <v-stepper-item title="2. Anonymisation" value="2" />
              <v-stepper-item title="3. Validation" value="3" />
              <v-stepper-item title="4. Publication" value="4" />
              <v-stepper-item title="5. Journal" value="5" />
            </v-stepper-header>
          </v-stepper>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">5 indicateurs open data obligatoires</v-card-title>
          <v-data-table :headers="headers" :items="rows" hover>
            <template #item.statut="{ item }">
              <v-chip :color="statusColor(item.statut)" size="x-small" variant="tonal">{{ item.statut }}</v-chip>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Matrice de diffusion</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Public" prepend-icon="mdi-earth" />
            <v-list-item title="Interne" prepend-icon="mdi-domain" />
            <v-list-item title="Restreint" prepend-icon="mdi-account-lock-outline" />
            <v-list-item title="Sensible / exclu" prepend-icon="mdi-eye-off-outline" />
          </v-list>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Traçabilité visible</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Version du dataset" prepend-icon="mdi-source-branch" />
            <v-list-item title="Date de publication" prepend-icon="mdi-calendar-check-outline" />
            <v-list-item title="Validateur UPF / admin" prepend-icon="mdi-account-check-outline" />
            <v-list-item title="Règles appliquées" prepend-icon="mdi-filter-cog-outline" />
            <v-list-item title="Journal des diffusions" prepend-icon="mdi-history" />
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
  { label: 'Datasets prêts', value: '7', icon: 'mdi-database-check-outline', color: 'primary', subtitle: 'Publication T2 2026' },
  { label: 'Lots anonymisés', value: '5', icon: 'mdi-incognito', color: 'info', subtitle: 'Règles validées' },
  { label: 'Publications versionnées', value: '18', icon: 'mdi-source-branch', color: 'success', subtitle: 'Historique conservé' },
  { label: 'Rejets qualité', value: '2', icon: 'mdi-alert-circle-outline', color: 'warning', subtitle: 'À corriger avant diffusion' },
]

const headers = [
  { title: 'Indicateur', key: 'indicateur' },
  { title: 'Jeu source', key: 'source' },
  { title: 'Statut', key: 'statut' },
]

const rows = [
  { indicateur: 'Inventaire ouvert des bases juridiques', source: 'Référentiel juridique', statut: 'Prêt' },
  { indicateur: 'Mesures actives par impôt / secteur / bénéficiaire', source: 'Registre central', statut: 'Prêt' },
  { indicateur: 'Montants annuels agrégés par impôt / fonction budgétaire', source: 'Annexe budgetaire', statut: 'En validation' },
  { indicateur: 'Rapports CONEDEF 2019-2024', source: 'Bibliothèque rapports', statut: 'Prêt' },
  { indicateur: 'Indicateurs de qualité des données', source: 'Gouvernance données', statut: 'En validation' },
]

const statusColor = (value: string) => ({ 'Prêt': 'success', 'En validation': 'warning' } as Record<string, string>)[value] || 'secondary'
</script>
