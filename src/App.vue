<template>
  <v-app>
    <component :is="currentLayout">
      <router-view />
    </component>
  </v-app>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from './layouts/AppLayout.vue'
import AuthLayout from './layouts/AuthLayout.vue'
import PublicLayout from './layouts/PublicLayout.vue'

const route = useRoute()

const currentLayout = computed(() => {
  const layout = route.meta.layout as string
  if (layout === 'auth') return AuthLayout
  if (layout === 'public') return PublicLayout
  return AppLayout
})
</script>
