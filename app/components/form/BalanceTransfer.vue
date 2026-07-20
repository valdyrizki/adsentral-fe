<template>
  <div class="space-y-5 p-1">

    <UAlert
      v-if="error"
      :description="error"
      color="error"
      icon="material-symbols:error-outline"
    />

    <UAlert
      title="Transfer Saldo Jualan ke Saldo Belanja"
      description="Saldo jualan yang dipindahkan akan langsung bisa dipakai belanja, tapi tidak bisa ditarik lagi ke rekening bank."
      color="info"
      icon="mdi:information-outline"
    />

    <div class="flex justify-between text-sm px-1">
      <span class="text-gray-400">Saldo jualan tersedia</span>
      <span class="font-semibold text-gray-700">{{ formatRp(balanceStore.salesBalance) }}</span>
    </div>

    <UFormField label="Jumlah Transfer" required>
      <UInputCurrency
        v-model="amount"
        placeholder="Masukkan jumlah transfer"
        class="w-full"
        inputmode="numeric"
      />
    </UFormField>

    <UFormField label="Catatan (opsional)">
      <UTextarea
        v-model="notes"
        placeholder="Catatan..."
        :rows="2"
        class="w-full"
      />
    </UFormField>

    <div class="flex justify-end gap-2 pt-1">
      <UButton color="neutral" variant="outline" @click="$emit('cancel')">Batal</UButton>
      <UButton
        color="primary"
        icon="mdi:swap-horizontal"
        :loading="loading"
        @click="handleSubmit"
      >
        Transfer
      </UButton>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useBalanceApi } from '~/composables/api/balance'

const emit = defineEmits<{
  'transfer-success': []
  'cancel': []
}>()

const toast = useToast()
const balanceStore = useBalanceStore()
const { fetchBalanceTransfer } = useBalanceApi()

const loading = ref(false)
const error = ref<string | null>(null)
const amount = ref<number>(0)
const notes = ref('')

function formatRp(val: number) {
  return 'Rp ' + val.toLocaleString('id-ID')
}

async function handleSubmit() {
  error.value = null

  if (!amount.value || amount.value <= 0) {
    error.value = 'Jumlah transfer harus lebih dari 0.'
    return
  }
  if (amount.value > balanceStore.salesBalance) {
    error.value = 'Jumlah transfer melebihi saldo jualan tersedia.'
    return
  }

  try {
    loading.value = true
    const result = await fetchBalanceTransfer({ amount: amount.value, notes: notes.value || undefined })
    balanceStore.setBalance(result)
    toast.add({
      title: 'Transfer Berhasil',
      description: `${formatRp(amount.value)} berhasil dipindahkan ke saldo belanja.`,
      color: 'success',
      icon: 'mdi:check-circle',
    })
    emit('transfer-success')
  } catch (err: any) {
    error.value = err.statusMessage || 'Gagal transfer saldo.'
  } finally {
    loading.value = false
  }
}
</script>
