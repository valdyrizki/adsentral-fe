<template>
  <div v-if="count" class="flex flex-wrap items-center gap-2 text-xs">
    <span class="text-gray-500">{{ count }} {{ noun }} pernah terjual:</span>
    <UButton size="xs" color="neutral" variant="outline" :disabled="disabled" @click="emit('set', 'SKIP')">Skip semua yang pernah terjual</UButton>
    <UButton size="xs" color="warning" variant="outline" :disabled="disabled" @click="emit('set', 'ADD')">Tambah ulang semua yang pernah terjual</UButton>
  </div>
</template>

<script lang="ts" setup>
import type { StockDuplicateAction } from '~/types/product/ProductStockItemRequest'

// Aksi cepat untuk semua baris berstatus DUPLICATE_SENT
withDefaults(defineProps<{ count: number; noun?: string; disabled?: boolean }>(), { noun: 'akun' })
const emit = defineEmits<{ set: [action: StockDuplicateAction] }>()
</script>
