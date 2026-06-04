<template>
  <div>
    <PageHeader
      title="Tableau de bord DSI / MEF"
      subtitle="Hébergement souverain, sécurité, APIs et continuité de service OASE"
      icon="mdi-server-security"
    >
      <template #actions>
        <v-chip color="success" variant="tonal" size="small" prepend-icon="mdi-shield-lock-outline">Hébergement souverain</v-chip>
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
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Interfaces et contraintes de cadrage visibles</v-card-title>
          <v-data-table :headers="headers" :items="rows" hover>
            <template #item.mode="{ item }">
              <v-chip :color="modeColor(item.mode)" size="x-small" variant="tonal">{{ item.mode }}</v-chip>
            </template>
          </v-data-table>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">PCA, sauvegardes et securite</v-card-title>
          <v-card-text>
            <div v-for="item in controls" :key="item.label" class="mb-3">
              <div class="d-flex justify-space-between text-caption mb-1">
                <span>{{ item.label }}</span>
                <span class="font-weight-bold">{{ item.value }}</span>
              </div>
              <v-progress-linear :model-value="item.progress" :color="item.color" rounded height="8" />
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Livrables Phase 2 visibles</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Catalogue des interfaces" prepend-icon="mdi-api" />
            <v-list-item title="MCD / MLD des 9 entites et 11 referentiels" prepend-icon="mdi-database-edit-outline" />
            <v-list-item title="Matrice RACI et points focaux" prepend-icon="mdi-account-network-outline" />
            <v-list-item title="Plan de migration MRD 2024" prepend-icon="mdi-swap-horizontal-bold" />
            <v-list-item title="Spec workflow et signatures TSA" prepend-icon="mdi-signature-freehand" />
          </v-list>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Risque et conformite</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="API-first et versionning" prepend-icon="mdi-source-branch" />
            <v-list-item title="Sauvegardes chiffrees et restauration" prepend-icon="mdi-database-lock-outline" />
            <v-list-item title="Audits dev / test / prod" prepend-icon="mdi-shield-search-outline" />
            <v-list-item title="Journal securite et traces sensibles" prepend-icon="mdi-history" />
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
  { label: 'Interfaces pilotes', value: '9', icon: 'mdi-api', color: 'primary', subtitle: 'Dont DAS et GUDEF' },
  { label: 'Disponibilite cible', value: '99.9%', icon: 'mdi-server', color: 'success', subtitle: 'PCA / sauvegardes' },
  { label: 'Secrets critiques', value: '14', icon: 'mdi-key-variant', color: 'warning', subtitle: 'A gouverner' },
  { label: 'Alertes securite ouvertes', value: '3', icon: 'mdi-alert-circle-outline', color: 'error', subtitle: 'A traiter prioritairement' },
]

const headers = [
  { title: 'Interface', key: 'interface' },
  { title: 'Frequence', key: 'frequence' },
  { title: 'Protocole', key: 'protocole' },
  { title: 'Mode', key: 'mode' },
]

const rows = [
  { interface: 'Sydonia World', frequence: 'Quotidien', protocole: 'XML / API REST', mode: 'API-first' },
  { interface: 'GESTEXO', frequence: 'Continu', protocole: 'API OTR', mode: 'Interop future' },
  { interface: 'DAS', frequence: 'Annuel', protocole: 'CSV', mode: 'Batch' },
  { interface: 'SIGFiP', frequence: 'Annuel', protocole: 'CSV / API', mode: 'Hybride' },
]

const controls = [
  { label: 'Sauvegardes chiffrees', value: '96%', progress: 96, color: 'success' },
  { label: 'Catalogue interfaces documente', value: '74%', progress: 74, color: 'warning' },
  { label: 'Journal securite exploitable', value: '81%', progress: 81, color: 'info' },
  { label: 'Tests de restauration', value: '67%', progress: 67, color: 'warning' },
]

const modeColor = (value: string) => ({ 'API-first': 'success', Batch: 'info', Hybride: 'warning', 'Interop future': 'secondary' } as Record<string, string>)[value] || 'secondary'
</script>
