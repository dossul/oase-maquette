<template>
  <v-menu>
    <template #activator="{ props }">
      <v-btn v-bind="props" :size="size" variant="tonal" color="secondary" prepend-icon="mdi-export-variant" append-icon="mdi-chevron-down">
        {{ label || 'Exporter' }}
      </v-btn>
    </template>
    <v-list density="compact" min-width="220">
      <v-list-subheader v-if="policyLabel">{{ policyLabel }}</v-list-subheader>
      <v-list-item
        v-for="fmt in formats"
        :key="fmt.value"
        :prepend-icon="fmt.icon"
        :title="formatTitle(fmt)"
        :subtitle="formatSubtitle(fmt)"
        :disabled="isDisabled(fmt.value)"
        @click="handleExport(fmt.value)"
      >
        <template #append v-if="isDisabled(fmt.value)">
          <v-chip size="x-small" color="warning" variant="tonal">Bloque</v-chip>
        </template>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  label?: string
  size?: string
  formats?: { value: string; label: string; icon: string }[]
  disabledFormats?: string[]
  restrictionNote?: string
  policyLabel?: string
}>(), {
  size: 'small',
  formats: () => [
    { value: 'csv', label: 'CSV', icon: 'mdi-file-delimited' },
    { value: 'excel', label: 'Excel (.xlsx)', icon: 'mdi-microsoft-excel' },
    { value: 'pdf', label: 'PDF', icon: 'mdi-file-pdf-box' },
  ],
  disabledFormats: () => [],
  restrictionNote: '',
  policyLabel: '',
})

const emit = defineEmits<{ export: [format: string] }>()

const isDisabled = (format: string) => props.disabledFormats.includes(format)
const handleExport = (format: string) => {
  if (isDisabled(format)) return
  emit('export', format)
}
const formatTitle = (fmt: { value: string; label: string }) => fmt.label
const formatSubtitle = (fmt: { value: string }) => (isDisabled(fmt.value) ? props.restrictionNote : undefined)
</script>
