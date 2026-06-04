<template>
  <div>
    <v-container style="max-width:1280px" class="py-8">
      <PageHeader title="Jeux de données ouverts" subtitle="Téléchargez les données agrégées et anonymisées en formats ouverts" icon="mdi-database"/>
      <v-card rounded="lg" elevation="1" class="mb-6">
        <v-card-text class="pa-4">
          <v-row dense>
            <v-col cols="12" md="6"><v-text-field v-model="search" label="Rechercher un jeu de données…" prepend-inner-icon="mdi-magnify" hide-details clearable/></v-col>
            <v-col cols="6" md="3"><v-select v-model="filterTheme" :items="themes" label="Thème" hide-details clearable/></v-col>
          </v-row>
        </v-card-text>
        <v-list class="pa-0">
          <v-list-item v-for="(d, i) in filteredDatasets" :key="d.id" :divider="i<filteredDatasets.length-1" class="px-4 py-4">
            <template #prepend>
              <v-avatar color="primary" size="44" rounded="lg">
                <v-icon icon="mdi-database" color="white" size="22"/>
              </v-avatar>
            </template>
            <template #title><span class="font-weight-semibold text-body-2">{{ d.titre }}</span></template>
            <template #subtitle>
              <div class="text-caption mt-1">{{ d.description }}</div>
              <div class="d-flex align-center ga-2 mt-1">
                <v-chip size="x-small" variant="outlined">Période: {{ d.periode }}</v-chip>
                <v-chip size="x-small" variant="outlined">MàJ: {{ d.majDate }}</v-chip>
                <v-chip size="x-small" variant="outlined">{{ d.lignes }} enregistrements</v-chip>
                <v-chip size="x-small" :color="d.statut === 'Publié' ? 'success' : 'warning'" variant="tonal">{{ d.statut }}</v-chip>
              </div>
            </template>
            <template #append>
              <div class="d-flex ga-1">
                <v-btn v-for="fmt in d.formats" :key="fmt" size="x-small" :color="fmtColor(fmt)" variant="tonal" @click="() => {}">{{ fmt }}</v-btn>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </v-card>

      <v-row class="mb-6">
        <v-col cols="12" md="7">
          <v-card rounded="lg" elevation="1" class="h-100">
            <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Workflow public de publication</v-card-title>
            <v-card-text class="pa-4">
              <v-stepper model-value="4" alt-labels>
                <v-stepper-header>
                  <v-stepper-item title="1. Sélection" value="1" />
                  <v-stepper-item title="2. Anonymisation" value="2" />
                  <v-stepper-item title="3. Validation" value="3" />
                  <v-stepper-item title="4. Publication" value="4" />
                  <v-stepper-item title="5. Journal" value="5" />
                </v-stepper-header>
              </v-stepper>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="5">
          <v-card rounded="lg" elevation="1" class="h-100">
            <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Garanties de diffusion</v-card-title>
            <v-list density="compact" class="pa-2">
              <v-list-item title="Anonymisation obligatoire" subtitle="Aucune donnee nominative publiee" prepend-icon="mdi-incognito" />
              <v-list-item title="Versionnement dataset" subtitle="Historique des lots de diffusion" prepend-icon="mdi-source-branch" />
              <v-list-item title="Validation avant publication" subtitle="UPF / administration" prepend-icon="mdi-check-decagram-outline" />
              <v-list-item title="Journal de diffusion" subtitle="Preuve et traçabilite des publications" prepend-icon="mdi-history" />
            </v-list>
          </v-card>
        </v-col>
      </v-row>

      <!-- Conditions utilisation -->
      <v-card rounded="lg" elevation="1" class="mb-6">
        <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Conditions d'utilisation</v-card-title>
        <v-card-text class="pa-4">
          <v-row>
            <v-col cols="12" md="8">
              <div class="text-body-2 text-medium-emphasis">
                Ces données sont publiées sous <strong>Licence Ouverte v2.0</strong>. Vous êtes libre de les réutiliser, les redistribuer et les adapter à condition de mentionner la source.
              </div>
              <v-chip color="success" variant="tonal" size="small" class="mt-3" prepend-icon="mdi-creative-commons">Licence Ouverte v2.0 — MEF Togo / OASE</v-chip>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card rounded="lg" elevation="1" class="mb-6">
        <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Provenance et qualite</v-card-title>
        <v-data-table :headers="qualityHeaders" :items="qualityRows" hover density="comfortable">
          <template #item.qualite="{ item }">
            <v-chip :color="item.qualite === 'Certifie' ? 'success' : 'warning'" size="x-small" variant="tonal">{{ item.qualite }}</v-chip>
          </template>
        </v-data-table>
      </v-card>

      <!-- Swagger API -->
      <v-card rounded="lg" elevation="1">
        <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold d-flex align-center ga-2">
          <v-icon icon="mdi-api" color="primary" size="20"/>
          API REST publique — Documentation développeurs
        </v-card-title>
        <v-card-text class="pa-4">
          <v-alert type="info" variant="tonal" rounded="lg" density="compact" class="mb-4">
            Une API REST publique est disponible pour accéder programmatiquement aux données agrégées. Aucune authentification requise.
          </v-alert>
          <div class="pa-4 rounded-lg mb-4" style="background:#1E293B;font-family:monospace;font-size:0.8rem;color:#E2E8F0">
            <span style="color:#94A3B8">GET</span> <span style="color:#38BDF8">https://opendata.oase.mef.tg/api/v1/exonerations</span><br/>
            <span style="color:#94A3B8">GET</span> <span style="color:#38BDF8">https://opendata.oase.mef.tg/api/v1/exonerations?annee=2025&secteur=mines</span><br/>
            <span style="color:#94A3B8">GET</span> <span style="color:#38BDF8">https://opendata.oase.mef.tg/api/v1/depenses-fiscales/totaux</span>
          </div>
          <v-expansion-panels variant="accordion">
            <v-expansion-panel title="GET /exonerations — Liste des exonérations agrégées">
              <template #text>
                <div class="pa-3 rounded-lg" style="background:#1E293B;font-family:monospace;font-size:0.75rem;color:#E2E8F0">
                  { "data": [ { "secteur": "Mines", "type": "douaniere", "annee": 2025, "montant_mds_fcfa": 234.1, "nb_beneficiaires": 12 } ], "total": 1102, "page": 1 }
                </div>
              </template>
            </v-expansion-panel>
            <v-expansion-panel title="GET /depenses-fiscales/totaux — Totaux par année">
              <template #text>
                <div class="pa-3 rounded-lg" style="background:#1E293B;font-family:monospace;font-size:0.75rem;color:#E2E8F0">
                  { "2025": { "total_mds": 724.3, "pct_pib": 3.8 }, "2024": { "total_mds": 680.1, "pct_pib": 3.6 } }
                </div>
              </template>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
const search = ref('')
const filterTheme = ref(null)
const themes = ['Exonérations douanières','Exonérations fiscales','Zones franches','Synthèse annuelle','Données régionales']
const datasets = [
  { id: 1, titre: 'Exonérations douanières 2018–2025', description: 'Données agrégées par secteur, type de produit et année', periode: '2018–2025', majDate: '01/03/2026', lignes: '8 ans × 10 secteurs', formats: ['CSV','JSON','XLSX'], theme: 'Exonérations douanières', statut: 'Publié' },
  { id: 2, titre: 'Exonérations fiscales IS/TVA 2018–2025', description: 'Impôt sur les sociétés et TVA interne, par secteur', periode: '2018–2025', majDate: '01/03/2026', lignes: '8 ans × 10 secteurs', formats: ['CSV','JSON'], theme: 'Exonérations fiscales', statut: 'Publié' },
  { id: 3, titre: 'Conventions Zones Franches actives 2026', description: 'Données agrégées ZFI/ZES — Emplois, investissements', periode: '2026', majDate: '01/04/2026', lignes: '45 conventions', formats: ['CSV','XLSX'], theme: 'Zones franches', statut: 'En validation' },
  { id: 4, titre: 'Rapport annuel dépenses fiscales 2025', description: 'Synthèse complète conforme directive UEMOA 06/2009', periode: '2025', majDate: '28/02/2026', lignes: 'Rapport complet', formats: ['JSON','XLSX'], theme: 'Synthèse annuelle', statut: 'Publié' },
  { id: 5, titre: 'Répartition géographique par région 2025', description: 'Exonérations par région administrative du Togo', periode: '2025', majDate: '01/03/2026', lignes: '5 régions', formats: ['CSV','JSON'], theme: 'Données régionales', statut: 'Publié' },
]
const filteredDatasets = computed(() => datasets.filter(d => {
  if (filterTheme.value && d.theme !== filterTheme.value) return false
  if (search.value && !d.titre.toLowerCase().includes(search.value.toLowerCase())) return false
  return true
}))
const fmtColor = (f: string) => ({ CSV: 'success', JSON: 'info', XLSX: 'primary' }[f] || 'secondary')
const qualityHeaders = [
  { title: 'Jeu', key: 'jeu' },
  { title: 'Source', key: 'source' },
  { title: 'Qualite', key: 'qualite' },
  { title: 'Derniere validation', key: 'validation' },
]
const qualityRows = [
  { jeu: 'Exonérations douanières 2018–2025', source: 'Sydonia / OASE', qualite: 'Certifie', validation: '01/03/2026' },
  { jeu: 'Exonérations fiscales IS/TVA 2018–2025', source: 'E-TAX / DAS / OASE', qualite: 'Certifie', validation: '01/03/2026' },
  { jeu: 'Conventions Zones Franches actives 2026', source: 'SAZOF / OASE', qualite: 'A confirmer', validation: '28/05/2026' },
  { jeu: 'Répartition géographique 2025', source: 'Registre central', qualite: 'Certifie', validation: '01/03/2026' },
]
</script>
