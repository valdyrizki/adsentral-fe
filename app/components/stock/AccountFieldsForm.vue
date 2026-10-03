<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UFormField label="Tipe Akun" hint="Opsional" help="Jika kosong, otomatis 'Lainnya'" class="md:col-span-2">
        <StockAccountTypeSelect v-model="model.account_type_id" empty-label="Tidak dipilih (otomatis 'Lainnya')" :current-type="currentType" :disabled="disabled" />
      </UFormField>

      <UFormField label="UID">
        <UInput v-model="model.account_uid" placeholder="Contoh: 123456789" class="w-full" :disabled="disabled" />
      </UFormField>
      <UFormField label="Username">
        <UInput v-model="model.account_username" placeholder="Username akun" autocomplete="off" class="w-full" :disabled="disabled" />
      </UFormField>
      <UFormField label="Password">
        <StockSecretInput v-model="model.account_password" placeholder="Password akun" :disabled="disabled" />
      </UFormField>
      <UFormField label="Email">
        <UInput v-model="model.account_email" type="email" placeholder="email@contoh.com" autocomplete="off" class="w-full" :disabled="disabled" />
      </UFormField>
      <UFormField label="Password Email">
        <StockSecretInput v-model="model.account_email_password" placeholder="Password email" :disabled="disabled" />
      </UFormField>
      <UFormField label="2FA Secret Key" help="Secret key, bukan kode 6 digit">
        <StockSecretInput v-model="model.account_two_fa_secret" placeholder="Contoh: JBSWY3DPEHPK3PXP" :disabled="disabled" />
      </UFormField>
      <UFormField label="Cookie" class="md:col-span-2">
        <UTextarea v-model="model.account_cookie" placeholder="Tempel cookie di sini..." :rows="3" autoresize :maxrows="8" class="w-full font-mono text-xs" :disabled="disabled" />
      </UFormField>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { StockAccountForm } from '~/types/product/ProductStockItemRequest'

defineProps<{ disabled?: boolean; currentType?: { id: number; name: string } | null }>()
const model = defineModel<StockAccountForm>({ required: true })
</script>
