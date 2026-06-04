<template>
  <div>
    <PageHeader
      title="Tableau de bord extractif"
      subtitle="Conventions minieres et petrolieres par phase, rapprochement ITIE et suivi des avantages"
      icon="mdi-pickaxe"
    >
      <template #actions>
        <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-source-merge">Croiser ITIE</v-btn>
        <v-btn color="primary" size="small" prepend-icon="mdi-file-cog-outline">Ouvrir une convention</v-btn>
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
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Conventions par phase</v-card-title>
          <v-data-table :headers="headers" :items="rows" hover>
            <template #item.phase="{ item }">
              <v-chip :color="phaseColor(item.phase)" size="x-small" variant="tonal">{{ item.phase }}</v-chip>
            </template>
            <template #item.statut="{ item }">
              <v-chip :color="statusColor(item.statut)" size="x-small" variant="outlined">{{ item.statut }}</v-chip>
            </template>
          </v-data-table>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Workflow visible par etapes</v-card-title>
          <v-stepper model-value="4" alt-labels>
            <v-stepper-header>
              <v-stepper-item title="Demande permis" value="1" />
              <v-stepper-item title="Negociation" value="2" />
              <v-stepper-item title="Conseil des ministres" value="3" />
              <v-stepper-item title="Ratification / application OTR" value="4" />
              <v-stepper-item title="Suivi DGMG + ITIE" value="5" />
            </v-stepper-header>
          </v-stepper>
        </v-card>

        <v-card rounded="lg" elevation="1" class="mt-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">O2 et pieces critiques par convention</v-card-title>
          <v-data-table :headers="o2Headers" :items="o2Rows" hover>
            <template #item.confidentialite="{ item }">
              <v-chip :color="item.confidentialite === 'Confidentiel' ? 'error' : 'warning'" size="x-small" variant="outlined">{{ item.confidentialite }}</v-chip>
            </template>
            <template #item.phase="{ item }">
              <v-chip :color="phaseColor(item.phase)" size="x-small" variant="tonal">{{ item.phase }}</v-chip>
            </template>
          </v-data-table>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Controle extractif dans la maquette</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Phases recherche / exploitation / production" prepend-icon="mdi-layers-outline" />
            <v-list-item title="Avantages differencies par phase" prepend-icon="mdi-format-list-bulleted-square" />
            <v-list-item title="Passage Conseil des ministres / AN" prepend-icon="mdi-bank-outline" />
            <v-list-item title="Suivi premier baril / obligations" prepend-icon="mdi-oil" />
            <v-list-item title="Rapprochement avec publications ITIE" prepend-icon="mdi-file-compare-outline" />
          </v-list>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Ecarts ITIE</v-card-title>
          <v-card-text>
            <div v-for="gap in gaps" :key="gap.label" class="mb-3">
              <div class="d-flex justify-space-between text-caption mb-1">
                <span>{{ gap.label }}</span>
                <span class="font-weight-bold">{{ gap.value }}</span>
              </div>
              <v-progress-linear :model-value="gap.progress" :color="gap.color" rounded height="8" />
            </div>
          </v-card-text>
        </v-card>

        <v-card rounded="lg" elevation="1" class="mt-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Checklists extractives visibles</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Convention ratifiee et annexes techniques" prepend-icon="mdi-file-certificate-outline" />
            <v-list-item title="Phase recherche / exploitation / production rattachee" prepend-icon="mdi-layers-triple-outline" />
            <v-list-item title="Code additionnel et flux Sydonia rattaches" prepend-icon="mdi-barcode" />
            <v-list-item title="Reference budgetaire, ITIE et suivi DGMG / CONEDEF" prepend-icon="mdi-source-merge" />
            <v-list-item title="Diffusion confidentielle des actes et avantages sensibles" prepend-icon="mdi-eye-lock-outline" />
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
  { label: 'Conventions actives', value: '22', icon: 'mdi-file-document-outline', color: 'primary', subtitle: 'Mines et hydrocarbures' },
  { label: 'Phases recherche', value: '9', icon: 'mdi-magnify-scan', color: 'info', subtitle: 'Avantages imports equipements' },
  { label: 'Phases exploitation', value: '11', icon: 'mdi-factory', color: 'success', subtitle: 'IS / IRPP / TVA locale' },
  { label: 'Ecarts ITIE ouverts', value: '4', icon: 'mdi-alert-circle-outline', color: 'warning', subtitle: 'A rapprocher' },
]

const headers = [
  { title: 'Convention', key: 'convention' },
  { title: 'Operateur', key: 'operateur' },
  { title: 'Phase', key: 'phase' },
  { title: 'Statut', key: 'statut' },
  { title: 'Echeance', key: 'echeance' },
]

const rows = [
  { convention: 'CM-2025-17', operateur: 'Mines du Nord Togo', phase: 'Recherche', statut: 'En suivi', echeance: '15/03/2030' },
  { convention: 'CP-2024-08', operateur: 'Petro Togo SA', phase: 'Exploitation', statut: 'Ratifiée', echeance: '01/12/2059' },
  { convention: 'CM-2026-02', operateur: 'Golden Mines', phase: 'Production', statut: 'Conseil des ministres', echeance: '09/09/2061' },
]

const gaps = [
  { label: 'Correspondance avantages / ITIE', value: '82%', progress: 82, color: 'success' },
  { label: 'Chronologie phases', value: '69%', progress: 69, color: 'warning' },
  { label: 'Pieces ministerielles rattachees', value: '74%', progress: 74, color: 'info' },
]

const o2Headers = [
  { title: 'Convention', key: 'convention' },
  { title: 'Phase', key: 'phase' },
  { title: 'Code additionnel', key: 'codeAdditionnel' },
  { title: 'Montant brut taxable', key: 'montantBrut' },
  { title: 'Pieces / hash', key: 'piece' },
  { title: 'Confidentialite', key: 'confidentialite' },
]

const o2Rows = [
  { convention: 'CM-2025-17', phase: 'Recherche', codeAdditionnel: 'DOU-MIN-2026-08', montantBrut: '420 000 000 FCFA', piece: 'convention_miniere_17.pdf / 1ab3...ff04', confidentialite: 'Confidentiel' },
  { convention: 'CP-2024-08', phase: 'Exploitation', codeAdditionnel: 'DOU-PET-2026-05', montantBrut: '1 260 000 000 FCFA', piece: 'convention_petrole_08.pdf / 7ce2...ab41', confidentialite: 'Restreint' },
  { convention: 'CM-2026-02', phase: 'Production', codeAdditionnel: 'DOU-MIN-2026-12', montantBrut: '860 000 000 FCFA', piece: 'annexe_production_02.pdf / 9af0...cd33', confidentialite: 'Confidentiel' },
]

const phaseColor = (value: string) => ({ Recherche: 'info', Exploitation: 'warning', Production: 'success' } as Record<string, string>)[value] || 'secondary'
const statusColor = (value: string) => ({ 'En suivi': 'info', Ratifiée: 'success', 'Conseil des ministres': 'warning' } as Record<string, string>)[value] || 'secondary'
</script>
