<template>
  <div v-if="check.status === 'DUPLICATE_SENT'" class="inline-flex rounded-md border border-gray-200 overflow-hidden">
    <button
      type="button"
      class="px-2 py-0.5"
      :class="model !== 'ADD' ? 'bg-gray-700 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
      :disabled="disabled"
      @click="model = 'SKIP'"
    >
      Skip
    </button>
    <button
      type="button"
      class="px-2 py-0.5 border-l border-gray-200"
      :class="model === 'ADD' ? 'bg-amber-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
      :disabled="disabled"
      @click="model = 'ADD'"
    >
      Tambah ulang
    </button>
  </div>
  <span
    v-else-if="check.status === 'DUPLICATE_ACTIVE' || check.status === 'DUPLICATE_IN_FILE'"
    class="inline-flex items-center gap-1 text-gray-500"
    title="Baris ini hanya bisa dilewati"
  >
    <UIcon name="i-lucide-lock" class="size-3" /> Skip
  </span>
  <span v-else-if="check.status === 'NEW'" class="text-green-600">Tambah</span>
</template>

<script lang="ts" setup>
import type { StockDuplicateAction } from '~/types/product/ProductStockItemRequest'
import type { StockBulkCheckRow } from '~/types/product/StockBulkCheck'

// Pilihan per baris: Skip / Tambah ulang hanya untuk akun yang pernah terjual; lainnya terkunci
defineProps<{ check: StockBulkCheckRow; disabled?: boolean }>()
const model = defineModel<StockDuplicateAction | undefined>()
</script>
