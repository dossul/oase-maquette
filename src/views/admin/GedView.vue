<template>
  <div>
    <PageHeader
      title="GED et signatures"
      subtitle="Pièces de premier rang, second rang, versioning documentaire et signatures qualifiées"
      icon="mdi-file-cabinet"
    >
      <template #actions>
        <v-btn color="secondary" variant="tonal" size="small" prepend-icon="mdi-folder-plus-outline">Nouveau gabarit</v-btn>
        <v-btn color="primary" size="small" prepend-icon="mdi-pen-lock">Configurer TSA</v-btn>
      </template>
    </PageHeader>

    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="7">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Catalogue documentaire OASE</v-card-title>
          <v-data-table :headers="headers" :items="rows" hover>
            <template #item.niveau="{ item }">
              <v-chip :color="item.niveau === 'Premier rang' ? 'primary' : 'secondary'" size="x-small" variant="tonal">{{ item.niveau }}</v-chip>
            </template>
            <template #item.tsa="{ item }">
              <v-chip :color="item.tsa === 'Oui' ? 'success' : 'warning'" size="x-small" variant="outlined">{{ item.tsa }}</v-chip>
            </template>
          </v-data-table>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Contrôles probants visibles</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Hash SHA-256 sur pièce justificative" prepend-icon="mdi-shield-key-outline" />
            <v-list-item title="Versioning des actes et pièces" prepend-icon="mdi-source-branch" />
            <v-list-item title="Journal de consultation sensible" prepend-icon="mdi-history" />
            <v-list-item title="Horodatage qualifié TSA" prepend-icon="mdi-clock-check-outline" />
            <v-list-item title="Rétention et archivage documentaire" prepend-icon="mdi-archive-lock-outline" />
          </v-list>
        </v-card>
      </v-col>

      <v-col cols="12" md="5">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Signature qualifiée visible en maquette</v-card-title>
          <v-card-text>
            <div class="d-flex flex-wrap ga-2 mb-3">
              <v-chip color="success" variant="tonal" size="small" prepend-icon="mdi-check-decagram">Valide</v-chip>
              <v-chip color="error" variant="tonal" size="small" prepend-icon="mdi-eye-lock-outline">Confidentiel</v-chip>
            </div>
            <div class="mb-2 text-body-2"><strong>Signataire :</strong> Directeur général</div>
            <div class="mb-2 text-body-2"><strong>Horodatage :</strong> 2026-06-01 22:14:32 UTC</div>
            <div class="mb-2 text-body-2"><strong>Empreinte :</strong> `8f1c...a7d9`</div>
            <div class="mb-2 text-body-2"><strong>Autorité :</strong> TSA MEF / PKI souveraine</div>
            <div class="text-body-2"><strong>Diffusion :</strong> Consultation restreinte, export public interdit</div>
          </v-card-text>
        </v-card>

        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Gabarits couverts</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Attestation CI annuelle" prepend-icon="mdi-file-sign" />
            <v-list-item title="Quittancement douanier" prepend-icon="mdi-receipt-text-check-outline" />
            <v-list-item title="Convention / agrément" prepend-icon="mdi-file-certificate-outline" />
            <v-list-item title="Lettre de relance documentaire" prepend-icon="mdi-email-outline" />
          </v-list>
        </v-card>

        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Matrice de confidentialite</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item v-for="rule in confidentialityRules" :key="rule.title" :title="rule.title" :subtitle="rule.subtitle" rounded="lg">
              <template #prepend>
                <v-icon :icon="rule.icon" :color="rule.color" />
              </template>
            </v-list-item>
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
  { label: 'Pièces premier rang', value: '7', icon: 'mdi-file-star-outline', color: 'primary', subtitle: 'Contrôle avant soumission' },
  { label: 'Pièces second rang', value: '8', icon: 'mdi-file-tree-outline', color: 'info', subtitle: 'Évaluation de performance' },
  { label: 'Documents sous TSA', value: '14', icon: 'mdi-pen-lock', color: 'success', subtitle: 'Maquette probante' },
  { label: 'Consultations sensibles', value: '28', icon: 'mdi-eye-lock-outline', color: 'warning', subtitle: 'Journalisées' },
]

const headers = [
  { title: 'Type documentaire', key: 'type' },
  { title: 'Niveau', key: 'niveau' },
  { title: 'Versioning', key: 'versioning' },
  { title: 'TSA', key: 'tsa' },
]

const rows = [
  { type: 'Quitus fiscal OTR', niveau: 'Premier rang', versioning: 'Oui', tsa: 'Oui' },
  { type: 'Récépissé DAS', niveau: 'Premier rang', versioning: 'Oui', tsa: 'Non' },
  { type: 'États financiers', niveau: 'Premier rang', versioning: 'Oui', tsa: 'Non' },
  { type: 'Emplois / investissements / CA', niveau: 'Second rang', versioning: 'Oui', tsa: 'Non' },
]

const confidentialityRules = [
  { title: 'Public', subtitle: 'Jeux agreges, sans donnees nominatives ni secret fiscal', icon: 'mdi-earth', color: 'success' },
  { title: 'Interne', subtitle: 'Visible aux services habilites, export limite', icon: 'mdi-domain', color: 'info' },
  { title: 'Restreint', subtitle: 'Visible au cercle metier defini dans les habilitations', icon: 'mdi-account-lock-outline', color: 'warning' },
  { title: 'Confidentiel', subtitle: 'Telechargement, impression et partage journalises', icon: 'mdi-eye-lock-outline', color: 'error' },
]
</script>
