<template>
  <div>
    <PageHeader
      title="Mobile MVP OASE"
      subtitle="Projection mobile des parcours minimaux : suivi dossier, notifications, verification QR et synchronisation"
      icon="mdi-cellphone"
    >
      <template #actions>
        <v-chip color="info" variant="tonal" size="small" prepend-icon="mdi-cellphone-arrow-down">Projection mobile — maquette conceptuelle</v-chip>
      </template>
    </PageHeader>

    <!-- TODO(endpoint): KPIs d'usage mobile sans endpoint — section masquee. -->

    <v-row>
      <v-col cols="12" md="4">
        <v-card rounded="xl" elevation="2" class="pa-3 mx-auto" style="max-width: 320px; background: #0f172a;">
          <div style="height: 26px; width: 120px; margin: 0 auto 12px; border-radius: 20px; background: rgba(255,255,255,0.12);" />
          <v-card rounded="xl" class="overflow-hidden">
            <div style="background:linear-gradient(135deg,#1A3A5C 0%,#2774AE 65%,#1B8F4C 100%);padding:20px;color:#fff">
              <div class="text-subtitle-2 font-weight-bold">OASE Mobile</div>
              <div class="text-caption" style="opacity:0.8">{{ dossier ? `Demande ${dossier.reference}` : 'Aucune demande' }}</div>
            </div>
            <div class="pa-4">
              <template v-if="dossier">
                <v-chip color="info" size="small" variant="tonal" prepend-icon="mdi-progress-check" class="mb-3">{{ statutLabel }}</v-chip>
                <div class="text-body-2 font-weight-bold mb-1">Suivi rapide du dossier</div>
                <div class="text-caption text-medium-emphasis mb-3">{{ dossier.contribuable?.raisonSociale ?? 'Dossier en cours de traitement' }}</div>
                <v-timeline density="compact" side="end" truncate-line="both">
                  <v-timeline-item dot-color="success" size="small">
                    <div class="text-caption font-weight-semibold">Depot</div>
                    <div class="text-caption text-medium-emphasis">{{ formatDate(dossier.dateDepot) }}</div>
                  </v-timeline-item>
                  <v-timeline-item dot-color="info" size="small">
                    <div class="text-caption font-weight-semibold">Statut actuel : {{ statutLabel }}</div>
                    <div class="text-caption text-medium-emphasis">{{ formatDate(dossier.updatedAt) }}</div>
                  </v-timeline-item>
                </v-timeline>
              </template>
              <v-alert v-else type="info" variant="tonal" rounded="lg" density="compact" class="mb-2">
                Aucune demande accessible pour ce compte.
              </v-alert>
              <v-btn block color="primary" rounded="lg" prepend-icon="mdi-qrcode-scan" class="mt-2">Verifier QR</v-btn>
            </div>
          </v-card>
        </v-card>
        <div class="text-caption text-medium-emphasis text-center mt-2" style="max-width: 320px; margin: 0 auto;">
          Aperçu conceptuel — le dossier affiché est une demande réelle (API /demandes).
        </div>
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
import { computed, onMounted, ref } from 'vue'
import PageHeader from '../../components/PageHeader.vue'
import { api } from '../../services/api'
import type { DemandeApi } from '../../services/backoffice'
import { STATUT_LABELS, type StatutDemande } from '../../types'

// Démo de suivi : on utilise une VRAIE demande accessible au compte connecté (GET /demandes?limit=1).
const dossier = ref<DemandeApi | null>(null)

onMounted(async () => {
  try {
    const res = await api<{ data: DemandeApi[] }>('/demandes?limit=1')
    dossier.value = res.data[0] ?? null
  } catch {
    dossier.value = null
  }
})

const statutLabel = computed(() =>
  dossier.value ? (STATUT_LABELS[dossier.value.statutCode as StatutDemande] ?? dossier.value.statutCode) : '',
)

const formatDate = (iso: string | null) => (iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—')

const headers = [
  { title: 'Parcours', key: 'parcours' },
  { title: 'Usage', key: 'usage' },
  { title: 'Statut', key: 'statut' },
]

const rows = [
  { parcours: 'Suivi de dossier', usage: 'Contribuable / operateur', statut: 'Visible' },
  { parcours: 'Reception des notifications', usage: 'Contribuable / agent', statut: 'Visible' },
  { parcours: 'Verification QR du document signe', usage: 'Controle terrain', statut: 'Visible' },
  { parcours: 'Saisie complete de demande', usage: 'Mobile avance', statut: 'Partiel' },
]
</script>
