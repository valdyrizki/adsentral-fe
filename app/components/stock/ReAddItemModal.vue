<template>
  <UModal v-model:open="open" title="Tambah Ulang ke Stok" :description="item?.product_name ?? undefined" :ui="{ content: 'sm:max-w-2xl' }">
    <template #body>
      <div v-if="item" class="space-y-4">
        <UAlert
          icon="i-lucide-shield-alert"
          color="warning"
          variant="subtle"
          title="Pastikan akun sudah aman"
          description="Detail akun ini sudah pernah dikirim ke buyer. Data lama sudah terisi; ganti password, password email, 2FA, dan cookie bila perlu sebelum menyimpan."
        />
        <!-- Form tambah stok, terisi apa adanya dari item lama. Konfirmasi duplikat ditangani form. -->
        <StockItemForm :product-id="item.product_id" :prefill="item" @added="onAdded" />
      </div>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import type { ProductStockItemResponse } from '~/types/product/ProductStockItemResponse'

defineProps<{ item: ProductStockItemResponse | null }>()
const emit = defineEmits<{ added: [] }>()
const open = defineModel<boolean>('open', { default: false })

function onAdded() {
  open.value = false
  emit('added')
}
</script>
