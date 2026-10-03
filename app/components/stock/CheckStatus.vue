<template>
  <div class="flex flex-col gap-0.5" :title="check.message">
    <UBadge :color="STOCK_CHECK_STATUS_META[check.status].color" variant="soft" size="sm" class="w-fit">
      {{ stockCheckStatusLabel(check) }}
    </UBadge>
    <span v-if="check.existing_product_name" class="text-gray-500">Produk: {{ check.existing_product_name }}</span>
    <span v-else-if="check.status === 'INVALID'" class="text-red-600">{{ check.message }}</span>
  </div>
</template>

<script lang="ts" setup>
import type { StockBulkCheckRow } from '~/types/product/StockBulkCheck'

// Badge status satu baris hasil cek duplikat
defineProps<{ check: StockBulkCheckRow }>()
</script>
