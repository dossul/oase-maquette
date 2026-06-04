<template>
  <v-alert
    v-if="show"
    :type="type"
    :title="title"
    :text="text"
    variant="tonal"
    closable
    rounded="lg"
    class="mb-4"
    @click:close="show = false"
  >
    <template v-if="$slots.default" #text>
      <slot />
    </template>
  </v-alert>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  text?: string
}>()

const show = ref(true)
</script>
