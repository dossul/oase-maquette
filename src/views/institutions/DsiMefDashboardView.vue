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

    <!-- TODO(endpoint): KPIs interfaces/disponibilité/secrets/alertes sans endpoint de monitoring — section masquee. -->

    <v-row>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Interfaces et contraintes de cadrage visibles</v-card-title>
          <!-- TODO(endpoint): GET /connecteurs ou catalogue d'interfaces requis pour les états réels. -->
          <v-card-text class="pa-4">
            <v-alert type="info" variant="tonal" rounded="lg" density="compact">
              Le catalogue d'interfaces n'est pas encore exposé par l'API. Les états d'interconnexion (Sydonia, GESTEXO, DAS, SIGFiP) seront affichés dès disponibilité.
            </v-alert>
          </v-card-text>
        </v-card>

        <!-- TODO(endpoint): métriques PCA/sauvegardes/sécurité sans endpoint de supervision — carte masquee. -->
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
</script>
