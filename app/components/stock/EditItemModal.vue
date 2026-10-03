<template>
  <UModal v-model:open="open" title="Edit Item Stok" :description="item?.product_name ?? undefined" :ui="{ content: 'sm:max-w-2xl' }">
    <template #body>
      <StockItemForm
        v-if="item"
        :item="item"
        @saved="onSaved"
        @stale="onStale"
        @cancel="open = false"
      />
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import type { ProductStockItemResponse } from '~/types/product/ProductStockItemResponse'

defineProps<{ item: ProductStockItemResponse | null }>()

const emit = defineEmits<{
  saved: [item: ProductStockItemResponse]
  stale: []
}>()

const open = defineModel<boolean>('open', { default: false })

function onSaved(updated: ProductStockItemResponse) {
  open.value = false
  emit('saved', updated)
}

// Item sudah tidak ACTIVE: tutup form, halaman induk me-refresh list
function onStale() {
  open.value = false
  emit('stale')
}
</script>
