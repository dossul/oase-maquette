<template>
  <v-card variant="outlined" rounded="lg" class="mb-3">
    <v-card-text class="pa-4">
      <div class="d-flex align-center justify-space-between">
        <div class="d-flex align-center ga-3">
          <v-avatar :color="statusColor" size="40" rounded="lg">
            <v-icon icon="mdi-api" color="white" size="20" />
          </v-avatar>
          <div>
            <div class="font-weight-semibold text-body-1">{{ connector.nom }}</div>
            <div class="text-caption text-medium-emphasis">{{ connector.systeme }}</div>
          </div>
        </div>
        <div class="text-end">
          <v-chip :color="statusColor" size="x-small" variant="tonal" class="mb-1">
            {{ statusLabel }}
          </v-chip>
          <div class="text-caption text-medium-emphasis d-block">
            Dernier sync: {{ formatDate(connector.dernierSync) }}
          </div>
        </div>
      </div>

      <v-divider class="my-3" />

      <v-row dense>
        <v-col cols="4">
          <div class="label-micro text-medium-emphasis">Latence</div>
          <div class="font-weight-bold text-body-2">
            {{ connector.statut === 'actif' ? `${connector.latenceMs} ms` : '—' }}
          </div>
        </v-col>
        <v-col cols="4">
          <div class="label-micro text-medium-emphasis">Taux erreur</div>
          <div class="font-weight-bold text-body-2" :class="connector.tauxErreur > 5 ? 'text-error' : 'text-success'">
            {{ connector.statut === 'actif' ? `${connector.tauxErreur}%` : '—' }}
          </div>
        </v-col>
        <v-col cols="4">
          <div class="label-micro text-medium-emphasis">Volume 24h</div>
          <div class="font-weight-bold text-body-2">{{ connector.volume24h.toLocaleString('fr-FR') }}</div>
        </v-col>
      </v-row>

      <div class="mt-3 d-flex ga-2">
        <v-btn size="x-small" variant="tonal" color="primary" prepend-icon="mdi-connection">Tester</v-btn>
        <v-btn size="x-small" variant="tonal" prepend-icon="mdi-history">Logs</v-btn>
        <v-btn size="x-small" variant="tonal" prepend-icon="mdi-cog">Config</v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Connecteur } from '../types'

const props = defineProps<{ connector: Connecteur }>()

const statusColor = computed(() => {
  const map = { actif: 'success', erreur: 'error', maintenance: 'warning' }
  return map[props.connector.statut]
})
const statusLabel = computed(() => {
  const map = { actif: 'Actif', erreur: 'Erreur', maintenance: 'Maintenance' }
  return map[props.connector.statut]
})
const formatDate = (d: string) => new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
</script>
