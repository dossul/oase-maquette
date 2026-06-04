<template>
  <div>
    <PageHeader
      title="Mobile MVP OASE"
      subtitle="Projection mobile des parcours minimaux : suivi dossier, notifications, verification QR et synchronisation"
      icon="mdi-cellphone"
    />

    <v-row class="mb-4">
      <v-col v-for="kpi in kpis" :key="kpi.label" cols="6" md="3">
        <KpiCard v-bind="kpi" />
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4">
        <v-card rounded="xl" elevation="2" class="pa-3 mx-auto" style="max-width: 320px; background: #0f172a;">
          <div style="height: 26px; width: 120px; margin: 0 auto 12px; border-radius: 20px; background: rgba(255,255,255,0.12);" />
          <v-card rounded="xl" class="overflow-hidden">
            <div style="background:linear-gradient(135deg,#1A3A5C 0%,#2774AE 65%,#1B8F4C 100%);padding:20px;color:#fff">
              <div class="text-subtitle-2 font-weight-bold">OASE Mobile</div>
              <div class="text-caption" style="opacity:0.8">Demande ZF-2026-00482</div>
            </div>
            <div class="pa-4">
              <v-chip color="success" size="small" variant="tonal" prepend-icon="mdi-progress-check" class="mb-3">Validation en cours</v-chip>
              <div class="text-body-2 font-weight-bold mb-1">Suivi rapide du dossier</div>
              <div class="text-caption text-medium-emphasis mb-3">Etape actuelle : contre-signature DGBF</div>
              <v-timeline density="compact" side="end" truncate-line="both">
                <v-timeline-item dot-color="success" size="small">
                  <div class="text-caption font-weight-semibold">Depot confirme</div>
                  <div class="text-caption text-medium-emphasis">27/05 09:14</div>
                </v-timeline-item>
                <v-timeline-item dot-color="info" size="small">
                  <div class="text-caption font-weight-semibold">Instruction OTR</div>
                  <div class="text-caption text-medium-emphasis">28/05 14:08</div>
                </v-timeline-item>
                <v-timeline-item dot-color="warning" size="small">
                  <div class="text-caption font-weight-semibold">Visa budgetaire</div>
                  <div class="text-caption text-medium-emphasis">En attente</div>
                </v-timeline-item>
              </v-timeline>
              <v-btn block color="primary" rounded="lg" prepend-icon="mdi-qrcode-scan" class="mt-2">Verifier QR</v-btn>
            </div>
          </v-card>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" class="mb-4">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Parcours mobiles minimums visibles</v-card-title>
          <v-data-table :headers="headers" :items="rows" hover>
            <template #item.statut="{ item }">
              <v-chip :color="item.statut === 'Visible' ? 'success' : 'warning'" size="x-small" variant="tonal">{{ item.statut }}</v-chip>
            </template>
          </v-data-table>
        </v-card>

        <v-row>
          <v-col cols="12" md="6">
            <v-card rounded="lg" elevation="1" class="h-100">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Notifications push</v-card-title>
              <v-list density="compact" class="pa-2">
                <v-list-item title="Demande de piece complementaire" subtitle="Push + e-mail + SMS" prepend-icon="mdi-bell-ring-outline" />
                <v-list-item title="Document signe disponible" subtitle="Lien vers verification QR" prepend-icon="mdi-file-check-outline" />
                <v-list-item title="Echeance de renouvellement" subtitle="Alerte a 90 / 30 / 7 jours" prepend-icon="mdi-calendar-alert-outline" />
              </v-list>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card rounded="lg" elevation="1" class="h-100">
              <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Mode connectivite degradee</v-card-title>
              <v-list density="compact" class="pa-2">
                <v-list-item title="Lecture des statuts caches" subtitle="Derniere synchro conservee" prepend-icon="mdi-wifi-strength-off-outline" />
                <v-list-item title="File d'envoi differee" subtitle="Pieces et commentaires resynchronises" prepend-icon="mdi-cloud-sync-outline" />
                <v-list-item title="Journal local chiffre" subtitle="Purge apres confirmation serveur" prepend-icon="mdi-cellphone-lock" />
              </v-list>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import PageHeader from '../../components/PageHeader.vue'
import KpiCard from '../../components/KpiCard.vue'

const kpis = [
  { label: 'Parcours mobiles', value: '4', icon: 'mdi-cellphone-check', color: 'primary', subtitle: 'MVP visible' },
  { label: 'Notifications push', value: '3', icon: 'mdi-bell-badge-outline', color: 'info', subtitle: 'Evenements critiques' },
  { label: 'Verification QR', value: 'Oui', icon: 'mdi-qrcode-scan', color: 'success', subtitle: 'Document signe' },
  { label: 'Mode hors ligne', value: 'Partiel', icon: 'mdi-wifi-strength-off-outline', color: 'warning', subtitle: 'Synchronisation differee' },
]

const headers = [
  { title: 'Parcours', key: 'parcours' },
  { title: 'Usage', key: 'usage' },
  { title: 'Statut', key: 'statut' },
]

const rows = [
  { parcours: 'Suivi de dossier', usage: 'Beneficiaire / operateur', statut: 'Visible' },
  { parcours: 'Reception des notifications', usage: 'Beneficiaire / agent', statut: 'Visible' },
  { parcours: 'Verification QR du document signe', usage: 'Controle terrain', statut: 'Visible' },
  { parcours: 'Saisie complete de demande', usage: 'Mobile avance', statut: 'Partiel' },
]
</script>
