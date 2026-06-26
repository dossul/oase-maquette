<template>
  <div>
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4" density="compact">{{ error }}</v-alert>
    <slot v-if="!loading && !error" />
  </div>
</template>

<script setup lang="ts">
defineProps<{ loading: boolean; error: string | null }>()
</script>
