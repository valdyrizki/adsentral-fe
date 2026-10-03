<template>
  <UTooltip v-if="meta.hint" :text="meta.hint" :content="{ side: 'top' }" :ui="{ content: 'max-w-72 h-auto whitespace-normal' }">
    <UBadge :color="meta.color" variant="soft" :size="size" trailing-icon="i-lucide-info" class="cursor-help">
      {{ meta.label }}
    </UBadge>
  </UTooltip>
  <UBadge v-else :color="meta.color" variant="soft" :size="size">{{ meta.label }}</UBadge>
</template>

<script lang="ts" setup>
import { STOCK_STATUS_META } from '~/helper/stockAccountHelper'

// Badge status item stok (ACTIVE / SENT / RETURNED / DELETED); RETURNED punya tooltip penjelasan
const props = withDefaults(defineProps<{ status: string; size?: 'xs' | 'sm' | 'md' }>(), { size: 'sm' })

const meta = computed(() => STOCK_STATUS_META[props.status] ?? { label: props.status, color: 'neutral' as const })
</script>
