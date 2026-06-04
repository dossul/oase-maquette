<template>
  <div>
    <v-container style="max-width:1280px" class="py-8">
      <PageHeader title="Bibliothèque des rapports publiés" subtitle="Rapports officiels sur les dépenses fiscales — République Togolaise / MEF" icon="mdi-bookshelf"/>
      <v-card rounded="lg" elevation="1" class="mb-6">
        <v-card-text class="pa-4">
          <v-row dense>
            <v-col cols="12" md="6"><v-text-field v-model="search" label="Rechercher dans les rapports…" prepend-inner-icon="mdi-magnify" hide-details clearable/></v-col>
            <v-col cols="6" md="3"><v-select v-model="filterType" :items="typeRapports" label="Type de rapport" hide-details clearable/></v-col>
            <v-col cols="6" md="3"><v-select v-model="filterAnnee" :items="['2025','2024','2023','2022','2021']" label="Année" hide-details clearable/></v-col>
          </v-row>
        </v-card-text>
      </v-card>
      <v-row>
        <v-col v-for="r in filteredRapports" :key="r.id" cols="12" md="6" lg="4">
          <v-card rounded="lg" elevation="1" hover class="h-100">
            <v-card-text class="pa-5">
              <div class="d-flex align-start ga-4">
                <v-avatar color="error" size="48" rounded="lg">
                  <v-icon icon="mdi-file-pdf-box" color="white" size="24"/>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="font-weight-bold text-body-1 mb-1">{{ r.titre }}</div>
                  <v-chip :color="r.typeColor" size="x-small" variant="tonal" class="mb-2">{{ r.type }}</v-chip>
                  <div class="text-caption text-medium-emphasis mb-3">{{ r.description }}</div>
                  <div class="d-flex align-center ga-2 text-caption text-medium-emphasis">
                    <v-icon icon="mdi-calendar" size="12"/>{{ r.datePublication }}
                    <v-icon icon="mdi-weight" size="12" class="ms-2"/>{{ r.taille }}
                    <v-icon icon="mdi-file-document" size="12" class="ms-2"/>{{ r.pages }} pages
                  </div>
                </div>
              </div>
            </v-card-text>
            <v-card-actions class="pa-4 pt-0">
              <v-btn color="primary" variant="tonal" prepend-icon="mdi-download" size="small" block>Télécharger PDF</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
const search = ref('')
const filterType = ref(null)
const filterAnnee = ref(null)
const typeRapports = ['Rapport annuel','Bulletin trimestriel','Note méthodologique','Rapport d\'audit']
const rapports = [
  { id: 1, titre: 'Rapport Annuel des Dépenses Fiscales 2025', type: 'Rapport annuel', typeColor: 'primary', description: 'Rapport complet conforme directive UEMOA 06/2009 — Inventaire, coût et évaluation des exonérations fiscales et douanières.', datePublication: '28/02/2026', taille: '4,2 Mo', pages: 87, annee: '2025' },
  { id: 2, titre: 'Rapport Annuel des Dépenses Fiscales 2024', type: 'Rapport annuel', typeColor: 'primary', description: 'Exercice fiscal 2024 — Analyse par secteur, type d\'impôt et région.', datePublication: '15/03/2025', taille: '3,8 Mo', pages: 79, annee: '2024' },
  { id: 3, titre: 'Bulletin Trimestriel T1 2026', type: 'Bulletin trimestriel', typeColor: 'info', description: 'Situation des exonérations au 31 mars 2026 — Données provisoires.', datePublication: '15/04/2026', taille: '1,2 Mo', pages: 22, annee: '2026' },
  { id: 4, titre: 'Bulletin Trimestriel T4 2025', type: 'Bulletin trimestriel', typeColor: 'info', description: 'Situation des exonérations au 31 décembre 2025.', datePublication: '15/01/2026', taille: '1,1 Mo', pages: 20, annee: '2025' },
  { id: 5, titre: 'Note Méthodologique — Évaluation des Dépenses Fiscales', type: 'Note méthodologique', typeColor: 'secondary', description: 'Méthode revenue foregone — Définitions, périmètre et sources statistiques (INSEED).', datePublication: '01/01/2026', taille: '0,8 Mo', pages: 35, annee: '2026' },
  { id: 6, titre: 'Rapport Annuel des Dépenses Fiscales 2023', type: 'Rapport annuel', typeColor: 'primary', description: 'Exercice fiscal 2023 — Données définitives.', datePublication: '10/04/2024', taille: '3,1 Mo', pages: 72, annee: '2023' },
]
const filteredRapports = computed(() => rapports.filter(r => {
  if (filterType.value && r.type !== filterType.value) return false
  if (filterAnnee.value && r.annee !== filterAnnee.value) return false
  if (search.value && !r.titre.toLowerCase().includes(search.value.toLowerCase())) return false
  return true
}))
</script>
