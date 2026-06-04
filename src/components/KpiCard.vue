<template>
  <v-card :color="flat ? 'surface' : 'surface'" variant="elevated" elevation="1" rounded="lg" :to="to" :hover="!!to" class="kpi-card h-100" :style="to ? 'cursor:pointer' : ''"  @click="to ? undefined : $emit('click')"  >
    <v-card-text class="pa-4">
      <div class="d-flex align-start justify-space-between">
        <div class="flex-grow-1 me-3">
          <div class="label-micro text-medium-emphasis mb-2">{{ label }}</div>
          <div class="kpi-value" :style="{ color: valueColor }">{{ value }}</div>
          <div v-if="subtitle" class="text-caption text-medium-emphasis mt-1">{{ subtitle }}</div>
          <div v-if="trend !== undefined" class="d-flex align-center mt-2 ga-1">
            <v-icon
              :icon="trend >= 0 ? 'mdi-trending-up' : 'mdi-trending-down'"
              :color="trend >= 0 ? 'success' : 'error'"
              size="14"
            />
            <span :class="trend >= 0 ? 'text-success' : 'text-error'" style="font-size:0.75rem;font-weight:600">
              {{ trend >= 0 ? '+' : '' }}{{ trend }}%
            </span>
            <span class="text-caption text-medium-emphasis">vs mois préc.</span>
          </div>
        </div>
        <v-avatar :color="color" size="44" rounded="lg">
          <v-icon :icon="icon" color="white" size="22" />
        </v-avatar>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value: string | number
  icon: string
  color: string
  subtitle?: string
  trend?: number
  flat?: boolean
  to?: string
}>()
defineEmits(['click'])

const valueColor = computed(() => {
  const map: Record<string, string> = {
    error: 'rgb(var(--v-theme-error))',
    warning: 'rgb(var(--v-theme-warning))',
    success: 'rgb(var(--v-theme-success))',
  }
  return map[props.color] || 'rgb(var(--v-theme-on-surface))'
})
</script>

<style scoped>
.kpi-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.kpi-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.1) !important;
}
</style>
