<template>
  <div class="mb-6">
    <div class="d-flex align-center justify-space-between flex-wrap ga-3">
      <div>
        <div class="d-flex align-center ga-2 mb-1">
          <v-icon v-if="icon" :icon="icon" :color="iconColor || 'primary'" size="20" />
          <h1 style="font-size:1.4rem;font-weight:700;letter-spacing:-0.02em;margin:0">{{ title }}</h1>
        </div>
        <p v-if="subtitle" class="text-medium-emphasis text-body-2 ma-0">{{ subtitle }}</p>
      </div>
      <div class="d-flex align-center ga-2">
        <slot name="actions" />
      </div>
    </div>
    <v-divider class="mt-4" />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  icon?: string
  iconColor?: string
}>()
</script>
