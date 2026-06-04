<template>
  <v-chip
    :color="chipColor"
    variant="tonal"
    size="small"
    :prepend-icon="chipIcon"
    rounded="sm"
    class="font-weight-medium"
    style="font-size:0.72rem"
  >
    {{ chipLabel }}
  </v-chip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { StatutDemande } from '../types'
import { STATUT_COLORS, STATUT_LABELS } from '../types'

const props = defineProps<{
  statut: StatutDemande
}>()

const chipColor = computed(() => STATUT_COLORS[props.statut])
const chipLabel = computed(() => STATUT_LABELS[props.statut])
const chipIcon = computed(() => {
  const icons: Record<StatutDemande, string> = {
    en_cours: 'mdi-clock-outline',
    approuve: 'mdi-check-circle',
    action_requise: 'mdi-alert-circle',
    rejete: 'mdi-close-circle',
    expire: 'mdi-calendar-remove',
    brouillon: 'mdi-pencil-circle',
  }
  return icons[props.statut]
})
</script>
