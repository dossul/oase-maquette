<template>
  <div>
    <!-- Hero -->
    <div style="background:linear-gradient(135deg,#1A3A5C 0%,#2774AE 60%,#1B8F4C 100%);padding:80px 0 60px">
      <v-container style="max-width:1280px">
        <v-row align="center">
          <v-col cols="12" md="7">
            <div class="d-flex align-center ga-3 mb-5">
              <v-avatar color="rgba(255,255,255,0.15)" size="56" rounded="lg">
                <v-icon icon="mdi-shield-check" color="white" size="28"/>
              </v-avatar>
              <div>
                <div style="font-size:1.6rem;font-weight:800;color:#fff;letter-spacing:-0.02em">OASE Open Data</div>
                <div style="font-size:0.75rem;color:rgba(255,255,255,0.7);letter-spacing:0.08em;text-transform:uppercase">Portail de transparence fiscale — République Togolaise</div>
              </div>
            </div>
            <p style="font-size:1.1rem;color:rgba(255,255,255,0.9);max-width:560px;line-height:1.7;margin-bottom:32px">
              Accédez librement aux données agrégées sur les exonérations fiscales et douanières accordées au Togo. Des données publiques, ouvertes et vérifiables.
            </p>
            <div class="d-flex ga-3 flex-wrap">
              <v-btn color="white" size="large" rounded="lg" to="/opendata/tableaux-de-bord" prepend-icon="mdi-chart-bar" style="color:#2774AE">Explorer les données</v-btn>
              <v-btn variant="outlined" color="white" size="large" rounded="lg" to="/opendata/datasets" prepend-icon="mdi-download">Télécharger</v-btn>
            </div>
          </v-col>
          <v-col cols="12" md="5" class="d-none d-md-flex justify-center">
            <v-row dense>
              <v-col v-for="k in heroKpis" :key="k.label" cols="6">
                <v-card color="rgba(255,255,255,0.12)" rounded="lg" style="backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.2)" class="pa-4 mb-3">
                  <div style="font-size:1.5rem;font-weight:800;color:#fff">{{ k.value }}</div>
                  <div style="font-size:0.72rem;color:rgba(255,255,255,0.7)">{{ k.label }}</div>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Search bar -->
    <v-container style="max-width:1280px;margin-top:-28px">
      <v-card rounded="xl" elevation="4" class="pa-4">
        <v-row align="center" dense>
          <v-col cols="12" md="5"><v-text-field v-model="search" label="Rechercher des données (secteur, type, période…)" prepend-inner-icon="mdi-magnify" hide-details/></v-col>
          <v-col cols="6" md="2"><v-select v-model="filterSecteur" :items="secteurs" label="Secteur" hide-details clearable/></v-col>
          <v-col cols="6" md="2"><v-select v-model="filterAnnee" :items="['2026','2025','2024','2023']" label="Année" hide-details/></v-col>
          <v-col cols="12" md="3"><v-btn color="primary" block size="large" rounded="lg" prepend-icon="mdi-magnify">Rechercher</v-btn></v-col>
        </v-row>
      </v-card>
    </v-container>

    <!-- Quick nav cards -->
    <v-container style="max-width:1280px;margin-top:40px">
      <v-row>
        <v-col v-for="c in navCards" :key="c.title" cols="12" sm="6" md="3">
          <v-card :to="c.to" rounded="lg" elevation="1" hover class="pa-5 text-center">
            <v-icon :icon="c.icon" color="primary" size="40" class="mb-3"/>
            <div class="font-weight-bold text-body-1 mb-1">{{ c.title }}</div>
            <div class="text-caption text-medium-emphasis">{{ c.desc }}</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Key indicators -->
      <div class="mt-12 mb-4">
        <div class="text-h6 font-weight-bold mb-1">Indicateurs clés {{ filterAnnee }}</div>
        <div class="text-medium-emphasis text-body-2">Données agrégées et anonymisées — Mise à jour trimestrielle</div>
      </div>
      <v-row>
        <v-col v-for="k in publicKpis" :key="k.label" cols="6" md="3">
          <KpiCard v-bind="k"/>
        </v-col>
      </v-row>

      <div class="mt-12 mb-4">
        <div class="text-h6 font-weight-bold mb-1">Indicateurs obligatoires publies</div>
        <div class="text-medium-emphasis text-body-2">Jeux publics issus du workflow de validation, anonymisation et versioning</div>
      </div>
      <v-row class="mb-8">
        <v-col cols="12" md="7">
          <v-card rounded="lg" elevation="1">
            <v-data-table :headers="indicatorHeaders" :items="mandatoryIndicators" hover density="comfortable">
              <template #item.statut="{ item }">
                <v-chip :color="item.statut === 'Publié' ? 'success' : 'warning'" size="x-small" variant="tonal">{{ item.statut }}</v-chip>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
        <v-col cols="12" md="5">
          <v-card rounded="lg" elevation="1" class="mb-4">
            <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Preuve de publication</v-card-title>
            <v-card-text class="pa-4">
              <div class="text-body-2 mb-2"><strong>Lot public :</strong> PUB-2026-T2-004</div>
              <div class="text-body-2 mb-2"><strong>Date :</strong> 01/06/2026</div>
              <div class="text-body-2 mb-2"><strong>Version :</strong> v4.2</div>
              <div class="text-body-2"><strong>Validation :</strong> UPF / administration OASE</div>
            </v-card-text>
          </v-card>

          <v-card rounded="lg" elevation="1">
            <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Garanties publiques</v-card-title>
            <v-list density="compact" class="pa-2">
              <v-list-item title="Aucune donnee nominative" prepend-icon="mdi-incognito" />
              <v-list-item title="Versionnement des jeux diffuses" prepend-icon="mdi-source-branch" />
              <v-list-item title="Journal de diffusion conserve" prepend-icon="mdi-history" />
              <v-list-item title="Qualite et source documentees" prepend-icon="mdi-check-decagram-outline" />
            </v-list>
          </v-card>
        </v-col>
      </v-row>

      <!-- FAQ -->
      <div class="mt-12 mb-4">
        <div class="text-h6 font-weight-bold mb-1">Questions fréquentes</div>
      </div>
      <v-expansion-panels variant="accordion" class="mb-10">
        <v-expansion-panel v-for="faq in faqs" :key="faq.q" :title="faq.q">
          <template #text><p class="text-body-2 text-medium-emphasis">{{ faq.r }}</p></template>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-container>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import KpiCard from '../../components/KpiCard.vue'
const search = ref('')
const filterSecteur = ref(null)
const filterAnnee = ref('2026')
const secteurs = ['Mines','Zone Franche','Agriculture','Énergie','Numérique','Santé','Transport']
const heroKpis = [
  { label: 'Total exonérations 2025', value: '724 Mds FCFA' },
  { label: 'Bénéficiaires actifs', value: '1 102' },
  { label: 'Types d\'exonération', value: '6' },
  { label: 'Taux / PIB', value: '3,8%' },
]
const navCards = [
  { to: '/opendata/tableaux-de-bord', icon: 'mdi-chart-bar', title: 'Tableaux de bord', desc: 'Visualisations interactives' },
  { to: '/opendata/datasets', icon: 'mdi-database', title: 'Jeux de données', desc: 'CSV, JSON, XLSX' },
  { to: '/opendata/rapports', icon: 'mdi-file-chart', title: 'Rapports officiels', desc: 'Rapport annuel UEMOA' },
  { to: '/login', icon: 'mdi-lock', title: 'Espace sécurisé', desc: 'Connexion agents' },
]
const publicKpis = [
  { label: 'Dépenses fiscales 2025', value: '724 Mds FCFA', icon: 'mdi-currency-usd', color: 'primary' },
  { label: 'Secteur principal', value: 'Mines', icon: 'mdi-diamond', color: 'secondary' },
  { label: '% du PIB', value: '3,8%', icon: 'mdi-chart-line', color: 'info' },
  { label: 'Rapports publiés', value: 4, icon: 'mdi-file-chart', color: 'success' },
]
const indicatorHeaders = [
  { title: 'Indicateur', key: 'label' },
  { title: 'Frequence', key: 'frequence' },
  { title: 'Statut', key: 'statut' },
]
const mandatoryIndicators = [
  { label: 'Inventaire des bases juridiques', frequence: 'Trimestrielle', statut: 'Publié' },
  { label: 'Mesures actives par impôt / secteur / bénéficiaire agrégé', frequence: 'Trimestrielle', statut: 'Publié' },
  { label: 'Montants annuels agrégés par impôt / fonction budgétaire', frequence: 'Annuelle', statut: 'Publié' },
  { label: 'Rapports d évaluation des dépenses fiscales', frequence: 'Annuelle', statut: 'Publié' },
  { label: 'Indicateurs de qualité des données', frequence: 'Trimestrielle', statut: 'Publié' },
]
const faqs = [
  { q: 'Qu\'est-ce qu\'une dépense fiscale ?', r: 'Une dépense fiscale est un avantage fiscal accordé à certains contribuables sous forme d\'exonération, de réduction ou de déduction, représentant un manque à gagner pour l\'État.' },
  { q: 'Ces données identifient-elles les bénéficiaires ?', r: 'Non. Toutes les données publiées sont agrégées et anonymisées. Aucune information nominative sur les bénéficiaires n\'est visible.' },
  { q: 'À quelle fréquence les données sont-elles mises à jour ?', r: 'Les données agrégées sont mises à jour trimestriellement. Le rapport annuel est publié chaque année avant le 31 mars.' },
  { q: 'Puis-je utiliser ces données dans mes recherches ?', r: 'Oui. Ces données sont publiées sous licence ouverte. Merci de mentionner la source : « OASE — MEF Togo ».' },
]
</script>
