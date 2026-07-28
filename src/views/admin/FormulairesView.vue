<template>
  <div>
    <PageHeader
      title="Formulaires dynamiques"
      subtitle="Catalogue des formulaires, versions publiees et regles de transition sans rupture des dossiers existants"
      icon="mdi-form-select"
    >
    </PageHeader>

    <v-alert type="info" variant="tonal" rounded="lg" class="mb-4">
      <!-- TODO(endpoint): l'API v1 n'expose aucun endpoint de gestion des formulaires
           dynamiques (catalogue, versions, transitions) — à prévoir vague B backend. -->
      Le pilotage configurable des formulaires (catalogue, versions, transitions) n'est pas encore
      instrumente cote backend : les sections ci-dessous restent vides tant que l'API ne l'expose pas.
    </v-alert>

    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <v-tabs v-model="tab" color="primary" density="compact" class="mb-3">
      <v-tab value="catalogue" prepend-icon="mdi-view-list">Catalogue</v-tab>
      <v-tab value="versions" prepend-icon="mdi-source-branch">Versions</v-tab>
      <v-tab value="transitions" prepend-icon="mdi-swap-horizontal">Transitions</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="catalogue">
        <v-card rounded="lg" elevation="1">
          <div class="text-center pa-10 text-medium-emphasis">
            <v-icon icon="mdi-form-select" size="48" class="mb-3 opacity-40"/>
            <div class="text-body-1 font-weight-semibold mb-1">Aucun formulaire publie</div>
            <div class="text-caption">Le catalogue des formulaires sera alimente par l'API des qu'un endpoint dedie existera.</div>
          </div>
        </v-card>
      </v-window-item>

      <v-window-item value="versions">
        <v-row>
          <v-col cols="12" md="7">
            <v-card rounded="lg" elevation="1">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Versions publiees et dates d'effet</v-card-title>
              <div class="text-center pa-10 text-medium-emphasis">
                <v-icon icon="mdi-source-branch" size="48" class="mb-3 opacity-40"/>
                <div class="text-body-1 font-weight-semibold mb-1">Aucune version historisee</div>
                <div class="text-caption">L'historique des versions sera disponible avec l'endpoint formulaires.</div>
              </div>
            </v-card>
          </v-col>
          <v-col cols="12" md="5">
            <!-- Documentation fonctionnelle (principes de versioning) — sans donnees d'activite. -->
            <v-card rounded="lg" elevation="1" class="mb-4">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Principes de versioning prevus</v-card-title>
              <v-list density="compact" class="pa-2">
                <v-list-item title="Brouillon, validation, publication, retrait, rollback" prepend-icon="mdi-clipboard-check-outline" />
                <v-list-item title="Date d'effet et date de fin d'effet" prepend-icon="mdi-calendar-range" />
                <v-list-item title="Schema fige pour les dossiers deja ouverts" prepend-icon="mdi-lock-outline" />
                <v-list-item title="Relecture des historiques selon leur version d'origine" prepend-icon="mdi-book-clock-outline" />
                <v-list-item title="Compatibilite ascendante sans perte de donnees" prepend-icon="mdi-database-sync-outline" />
              </v-list>
            </v-card>
            <v-card rounded="lg" elevation="1">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Composition type d'une version</v-card-title>
              <v-card-text class="text-body-2">
                <div class="mb-2"><strong>Pieces 1er rang :</strong> quitus OTR, DAS, etats financiers, carte OTR</div>
                <div class="mb-2"><strong>Pieces 2e rang :</strong> emplois, investissements, CA, masse salariale</div>
                <div><strong>Regles :</strong> eligibilite, confidentialite, validations et alertes liees</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <v-window-item value="transitions">
        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Regles de transition</v-card-title>
          <div class="text-center pa-10 text-medium-emphasis">
            <v-icon icon="mdi-swap-horizontal" size="48" class="mb-3 opacity-40"/>
            <div class="text-body-1 font-weight-semibold mb-1">Aucune regle de transition definie</div>
            <div class="text-caption">Les regles de transition seront gerees par l'API des que l'endpoint formulaires existera.</div>
          </div>
        </v-card>
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'

const tab = ref('catalogue')

// Aucun endpoint formulaires dans l'API v1 : indicateurs explicitement « non instrumentes ».
const kpis = [
  { label: 'Formulaires actifs', value: '—', icon: 'mdi-form-select', color: 'primary', subtitle: 'Non instrumente' },
  { label: 'Versions historisees', value: '—', icon: 'mdi-source-branch', color: 'info', subtitle: 'Non instrumente' },
  { label: 'Transitions sans impact', value: '—', icon: 'mdi-shield-check', color: 'success', subtitle: 'Non instrumente' },
  { label: 'Brouillons en revue', value: '—', icon: 'mdi-file-edit-outline', color: 'warning', subtitle: 'Non instrumente' },
]
</script>
