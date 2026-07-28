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

    <!-- TODO(endpoint): aucun endpoint n'expose encore les KPIs avis/contributions sectorielles — section masquee pour ne pas afficher de chiffres fictifs. -->

    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Demandes d'avis et contributions attendues</v-card-title>
          <!-- TODO(endpoint): GET /avis-sectoriels (ou équivalent) requis pour alimenter cette table. -->
          <v-card-text class="pa-4">
            <v-alert type="info" variant="tonal" rounded="lg" density="compact">
              Aucune demande d'avis disponible. Cette section sera alimentée par l'API dès que le module d'avis sectoriels sera exposé.
            </v-alert>
          </v-card-text>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Campagnes de mise a jour sectorielle</v-card-title>
          <!-- TODO(endpoint): GET /campagnes requis pour suivre l'avancement réel des campagnes. -->
          <v-card-text class="pa-4">
            <v-alert type="info" variant="tonal" rounded="lg" density="compact">
              Aucune campagne enregistrée pour le moment.
            </v-alert>
          </v-card-text>
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

        <!-- TODO(endpoint): GET /points-focaux requis — section masquee (pas de donnees reelles). -->
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import PageHeader from '../../components/PageHeader.vue'
</script>
