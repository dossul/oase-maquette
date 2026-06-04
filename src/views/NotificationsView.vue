<template>
  <div>
    <PageHeader title="Centre de notifications" subtitle="Historique complet de vos alertes et messages" icon="mdi-bell">
      <template #actions>
        <v-chip color="warning" variant="tonal" size="small" class="me-2" prepend-icon="mdi-history">Journalisées</v-chip>
        <v-btn size="small" variant="tonal" prepend-icon="mdi-check-all" @click="markAllRead">Tout marquer comme lu</v-btn>
      </template>
    </PageHeader>

    <v-row class="mb-4">
      <v-col cols="6" md="3" v-for="kpi in kpis" :key="kpi.label">
        <v-card rounded="lg" elevation="1">
          <v-card-text class="pa-4">
            <div class="text-caption text-medium-emphasis">{{ kpi.label }}</div>
            <div class="text-h6 font-weight-bold">{{ kpi.value }}</div>
            <div class="text-caption">{{ kpi.subtitle }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filtres -->
    <v-card rounded="lg" elevation="1" class="mb-4">
      <v-card-text class="pa-3">
        <v-row align="center">
          <v-col cols="12" md="4">
            <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" placeholder="Rechercher dans les notifications..." clearable hide-details density="compact" />
          </v-col>
          <v-col cols="6" md="3">
            <v-select v-model="filterType" :items="typeItems" label="Type" hide-details density="compact" />
          </v-col>
          <v-col cols="6" md="3">
            <v-select v-model="filterLu" :items="luItems" label="Statut" hide-details density="compact" />
          </v-col>
          <v-col cols="12" md="2" class="d-flex justify-end">
            <v-chip color="primary" variant="tonal" size="small">{{ nonLus }} non lues</v-chip>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Liste notifications -->
    <v-card rounded="lg" elevation="1">
      <v-list class="pa-2" lines="two">
        <template v-for="(notif, idx) in filteredNotifs" :key="notif.id">
          <v-list-item
            :class="['rounded-lg', 'mb-1', !notif.lu ? 'bg-primary-lighten-5' : '']"
            :style="!notif.lu ? { background: 'rgba(39,116,174,0.06)' } : {}"
            @click="notif.lu = true"
          >
            <template #prepend>
              <v-avatar :color="typeColor(notif.type)" size="38" class="me-3">
                <v-icon :icon="typeIcon(notif.type)" size="20" color="white" />
              </v-avatar>
            </template>
            <template #title>
              <div class="d-flex align-center ga-2">
                <span class="text-body-2 font-weight-semibold">{{ notif.titre }}</span>
                <v-chip v-if="!notif.lu" color="primary" size="x-small" variant="flat">Nouveau</v-chip>
              </div>
            </template>
            <template #subtitle>
              <div class="text-body-2 mt-1">{{ notif.message }}</div>
              <div class="d-flex align-center ga-3 mt-1">
                <span class="text-caption text-medium-emphasis">
                  <v-icon icon="mdi-clock-outline" size="12" class="me-1" />
                  {{ formatDate(notif.date) }}
                </span>
                <v-chip v-if="notif.dossier" size="x-small" variant="outlined" color="secondary" :to="`/portail/demandes/1`">{{ notif.dossier }}</v-chip>
                <v-chip size="x-small" variant="tonal" :color="proofColor(notif.type)">{{ proofLabel(notif.type) }}</v-chip>
              </div>
            </template>
            <template #append>
              <v-btn icon="mdi-close" size="x-small" variant="text" @click.stop="dismiss(notif.id)" />
            </template>
          </v-list-item>
          <v-divider v-if="idx < filteredNotifs.length - 1" class="mb-1" />
        </template>

        <div v-if="filteredNotifs.length === 0" class="pa-8 text-center text-medium-emphasis">
          <v-icon icon="mdi-bell-off-outline" size="48" class="mb-3 opacity-30" />
          <div class="text-body-1">Aucune notification</div>
        </div>
      </v-list>
    </v-card>

    <v-row class="mt-4">
      <v-col cols="12" md="6">
        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Notifications sensibles visibles</v-card-title>
          <v-list density="compact" class="pa-2">
            <v-list-item title="Expiration accord de siège" subtitle="Relance MAE + OTR avec diffusion restreinte" prepend-icon="mdi-flag-outline" />
            <v-list-item title="Écart ITIE / extractif" subtitle="Alerte conjointe DGMG / CONEDEF / audit" prepend-icon="mdi-pickaxe" />
            <v-list-item title="Convention textile à réévaluer" subtitle="Suivi sectoriel sur loi 2022-021" prepend-icon="mdi-tshirt-crew-outline" />
            <v-list-item title="Blocage export nominatif" subtitle="Tentative d accès hors habilitation" prepend-icon="mdi-download-lock-outline" />
          </v-list>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card rounded="lg" elevation="1">
          <v-card-title class="pa-4 pb-2 text-body-1 font-weight-semibold">Preuve et diffusion</v-card-title>
          <v-card-text class="pa-4">
            <div class="text-body-2 mb-2"><strong>Chaîne de preuve :</strong> chaque notification sensible est journalisée</div>
            <div class="text-body-2 mb-2"><strong>Niveaux :</strong> public, interne, restreint, confidentiel</div>
            <div class="text-body-2 mb-2"><strong>Routage :</strong> persona, structure et contexte métier</div>
            <div class="text-body-2"><strong>Référence :</strong> dossier, convention, accord ou lot de données rattaché</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import { mockNotifications } from '../mock/data'

const search = ref('')
const filterType = ref('tous')
const filterLu = ref('tous')

const notifications = ref(mockNotifications.map(n => ({ ...n })))

const typeItems = ['tous', 'action', 'info', 'alerte', 'systeme']
const luItems = ['tous', 'non lues', 'lues']

const nonLus = computed(() => notifications.value.filter(n => !n.lu).length)
const kpis = computed(() => [
  { label: 'Non lues', value: String(nonLus.value), subtitle: 'Relances actives' },
  { label: 'Sensibles', value: String(notifications.value.filter(n => n.type === 'alerte').length), subtitle: 'Diffusion restreinte' },
  { label: 'Bloquantes', value: String(notifications.value.filter(n => !n.lu && n.type !== 'info').length), subtitle: 'Action requise' },
  { label: 'Journalisées', value: '100%', subtitle: 'Traçabilité' },
])

const filteredNotifs = computed(() => {
  return notifications.value.filter(n => {
    if (search.value && !n.titre.toLowerCase().includes(search.value.toLowerCase()) && !n.message.toLowerCase().includes(search.value.toLowerCase())) return false
    if (filterType.value !== 'tous' && n.type !== filterType.value) return false
    if (filterLu.value === 'non lues' && n.lu) return false
    if (filterLu.value === 'lues' && !n.lu) return false
    return true
  })
})

function typeIcon(type: string) {
  const icons: Record<string, string> = { action: 'mdi-alert', info: 'mdi-information', alerte: 'mdi-bell-alert', systeme: 'mdi-cog' }
  return icons[type] ?? 'mdi-bell'
}
function typeColor(type: string) {
  const colors: Record<string, string> = { action: 'warning', info: 'info', alerte: 'error', systeme: 'secondary' }
  return colors[type] ?? 'primary'
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function markAllRead() {
  notifications.value.forEach(n => (n.lu = true))
}
function dismiss(id: string) {
  const idx = notifications.value.findIndex(n => n.id === id)
  if (idx !== -1) notifications.value.splice(idx, 1)
}
function proofLabel(type: string) {
  return ({ action: 'Action requise', info: 'Information', alerte: 'Alerte sensible', systeme: 'Système' } as Record<string, string>)[type] || 'Notification'
}
function proofColor(type: string) {
  return ({ action: 'warning', info: 'info', alerte: 'error', systeme: 'secondary' } as Record<string, string>)[type] || 'primary'
}
</script>
