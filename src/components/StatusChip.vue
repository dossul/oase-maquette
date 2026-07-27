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
    brouillon: 'mdi-pencil-circle',
    soumis: 'mdi-send-circle',
    en_instruction: 'mdi-clock-outline',
    action_requise: 'mdi-alert-circle',
    approuve: 'mdi-check-circle',
    rejete: 'mdi-close-circle',
    expire: 'mdi-calendar-remove',
    archive: 'mdi-archive',
    // Alias legacy
    en_cours: 'mdi-clock-outline',
  }
  return icons[props.statut]
})
</script>
