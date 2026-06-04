<template>
  <div>
    <PageHeader
      title="Requetes dynamiques"
      subtitle="Constructeur transverse de requetes, exports et jeux de colonnes selon le role et la confidentialite"
      icon="mdi-table-search"
    >
      <template #actions>
        <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-content-save-outline">Sauvegarder</v-btn>
        <v-btn color="primary" size="small" prepend-icon="mdi-download">Executer & exporter</v-btn>
      </template>
    </PageHeader>

    <v-row>
      <v-col cols="12" md="4">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Constructeur</v-card-title>
          <v-card-text>
            <v-select :items="['Registre central', 'Archives', 'Rapprochements', 'Rapports CONEDEF']" label="Source" density="compact" class="mb-2" />
            <v-select :items="['Mesure', 'Beneficiaire', 'Regime', 'Secteur', 'Montant exonere', 'Qualite donnee']" label="Colonnes visibles" multiple chips closable-chips density="compact" class="mb-2" />
            <v-select :items="['Public', 'Interne', 'Restreint', 'Confidentiel']" label="Niveau de confidentialite" density="compact" class="mb-2" />
            <v-textarea label="Filtres logiques" rows="4" density="compact" model-value="regime = 'Zone franche' AND statut_rapprochement != 'Reconcile'" />
          </v-card-text>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Bibliotheque officielle</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Annexe LFI par impôt / fonction budgétaire" prepend-icon="mdi-briefcase-outline" />
            <v-list-item title="Liste mesures temporaires a echeance 90 jours" prepend-icon="mdi-calendar-alert-outline" />
            <v-list-item title="Rapport qualite de donnees par institution" prepend-icon="mdi-file-chart-outline" />
            <v-list-item title="Preparation rapport CONEDEF" prepend-icon="mdi-chart-box-outline" />
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Resultat de previsualisation</v-card-title>
          <v-data-table :headers="headers" :items="rows" hover />
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Regles de sortie</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Exports selon role et confidentialite" prepend-icon="mdi-shield-account-outline" />
            <v-list-item title="Historique des requetes partagees" prepend-icon="mdi-history" />
            <v-list-item title="Colonnes masquees si niveau sensible" prepend-icon="mdi-eye-off-outline" />
            <v-list-item title="Formats CSV / XLSX / PDF / API" prepend-icon="mdi-file-export-outline" />
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import PageHeader from '../../components/PageHeader.vue'

const headers = [
  { title: 'Mesure', key: 'mesure' },
  { title: 'Beneficiaire', key: 'beneficiaire' },
  { title: 'Regime', key: 'regime' },
  { title: 'Montant exonere', key: 'montant' },
  { title: 'Qualite', key: 'qualite' },
]

const rows = [
  { mesure: 'MES-2026-00083', beneficiaire: 'Lome Textile ZF SAS', regime: 'Zone franche', montant: '780 000 000 FCFA', qualite: 'Certifie' },
  { mesure: 'MES-2026-00124', beneficiaire: 'Mission diplomatique Canada', regime: 'Accord de siege', montant: '128 000 000 FCFA', qualite: 'Corrige' },
  { mesure: 'MES-2025-00411', beneficiaire: 'Mines du Nord Togo', regime: 'Convention miniere', montant: '234 000 000 FCFA', qualite: 'Brut' },
]
</script>
