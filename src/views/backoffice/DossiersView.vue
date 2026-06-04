<template>
  <div>
    <PageHeader title="Liste des dossiers" subtitle="Recherchez, filtrez et gérez tous les dossiers d'exonération" icon="mdi-folder-multiple">
      <template #actions>
        <ExportButton @export="() => {}" size="small" />
      </template>
    </PageHeader>
    <v-card rounded="lg" elevation="1">
      <v-card-text class="pa-4">
        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field v-model="search" label="Recherche (référence, NIF, RCCM, bénéficiaire…)" prepend-inner-icon="mdi-magnify" hide-details clearable />
          </v-col>
          <v-col cols="6" md="2">
            <v-select v-model="filterStatut" :items="statutItems" label="Statut" hide-details clearable />
          </v-col>
          <v-col cols="6" md="2">
            <v-select v-model="filterType" :items="typeItems" label="Type" hide-details clearable />
          </v-col>
          <v-col cols="6" md="2">
            <v-select v-model="filterSecteur" :items="secteurItems" label="Secteur" hide-details clearable />
          </v-col>
          <v-col cols="6" md="2">
            <v-text-field v-model="filterPeriode" label="Période" type="month" hide-details />
          </v-col>
        </v-row>
      </v-card-text>
      <v-data-table :headers="headers" :items="filteredDossiers" :search="search" hover @click:row="(_, { item }) => $router.push(`/backoffice/dossiers/${item.id}/instruction`)">
        <template #item.type="{ item }">
          <span class="text-caption">{{ item.type }}</span>
          <div class="text-caption text-medium-emphasis">{{ dossierMeta[item.id]?.codeAdditionnel }}</div>
        </template>
        <template #item.statut="{ item }">
          <StatusChip :statut="item.statut" />
        </template>
        <template #item.montantFCFA="{ item }">
          <span class="font-weight-semibold">{{ formatMontant(item.montantFCFA) }}</span>
        </template>
        <template #item.etapeActuelle="{ item }">
          <span class="text-caption">{{ item.etapeActuelle }}</span>
        </template>
        <template #item.o2="{ item }">
          <v-chip :color="o2Color(dossierMeta[item.id]?.o2)" size="x-small" variant="tonal">{{ dossierMeta[item.id]?.o2 }}</v-chip>
        </template>
        <template #item.confidentialite="{ item }">
          <v-chip :color="confColor(dossierMeta[item.id]?.confidentialite)" size="x-small" variant="outlined">{{ dossierMeta[item.id]?.confidentialite }}</v-chip>
        </template>
        <template #item.actions="{ item }">
          <v-btn :to="`/backoffice/dossiers/${item.id}/instruction`" size="x-small" color="primary" variant="tonal" class="me-1">Instruire</v-btn>
          <v-btn :to="`/backoffice/dossiers/${item.id}/validation`" size="x-small" color="success" variant="tonal">Valider</v-btn>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import ExportButton from '../../components/ExportButton.vue'
import StatusChip from '../../components/StatusChip.vue'
import { mockDemandes } from '../../mock/data'
const search = ref('')
const filterStatut = ref(null)
const filterType = ref(null)
const filterSecteur = ref(null)
const filterPeriode = ref('')
const statutItems = ['en_cours','approuve','action_requise','rejete','expire']
const typeItems = ['douaniere','fiscale_is','fiscale_tva','zone_franche','code_investissement','sectorielle']
const secteurItems = ['Industrie','Agriculture','Mines','Énergie','Numérique','Santé','Transport']
const headers = [
  { title: 'Référence', key: 'reference' },
  { title: 'Bénéficiaire', key: 'beneficiaire' },
  { title: 'Type', key: 'type' },
  { title: 'Dépôt', key: 'dateDepot' },
  { title: 'Étape', key: 'etapeActuelle' },
  { title: 'O2', key: 'o2' },
  { title: 'Confidentialité', key: 'confidentialite' },
  { title: 'Statut', key: 'statut' },
  { title: 'Montant', key: 'montantFCFA' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const dossierMeta: Record<string, { codeAdditionnel: string; o2: string; confidentialite: string }> = {
  '1': { codeAdditionnel: 'DOU-INV-2026-05', o2: '15/17', confidentialite: 'Interne' },
  '2': { codeAdditionnel: 'DOU-ZF-2026-14', o2: '17/17', confidentialite: 'Interne' },
  '3': { codeAdditionnel: 'FISC-CGI-2026-08', o2: '13/17', confidentialite: 'Restreint' },
  '4': { codeAdditionnel: 'DOU-DIP-2026-03', o2: '14/17', confidentialite: 'Confidentiel' },
}
const filteredDossiers = computed(() => mockDemandes.filter(d => {
  if (filterStatut.value && d.statut !== filterStatut.value) return false
  if (filterType.value && d.type !== filterType.value) return false
  return true
}))
const formatMontant = (v: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(v) + ' F'
const o2Color = (value?: string) => {
  const numeric = parseInt(value || '0', 10)
  if (numeric >= 17) return 'success'
  if (numeric >= 14) return 'warning'
  return 'error'
}
const confColor = (value?: string) => ({ Public: 'success', Interne: 'info', Restreint: 'warning', Confidentiel: 'error' } as Record<string, string>)[value || ''] || 'secondary'
</script>
