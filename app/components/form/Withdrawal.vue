<template>
  <div class="space-y-5 p-1">

    <UAlert
      v-if="error"
      :description="error"
      color="error"
      icon="material-symbols:error-outline"
    />

    <!-- Peringatan ada withdrawal pending -->
    <UAlert
      v-if="hasPendingWithdrawal"
      title="Ada Penarikan yang Sedang Diproses"
      description="Tunggu sampai penarikan sebelumnya selesai atau dibatalkan sebelum mengajukan penarikan baru."
      color="warning"
      icon="mdi:clock-alert-outline"
    />

    <!-- Info rekening tujuan -->
    <div v-if="bankAccount" class="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
      <p class="text-xs font-medium text-gray-400 uppercase tracking-wide">Dana akan ditransfer ke</p>
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
          <UIcon name="mdi:bank" class="text-primary-500" />
        </div>
        <div>
          <p class="font-semibold text-gray-800 text-sm">{{ bankAccount.bank_name }} — {{ bankAccount.account_number }}</p>
          <p class="text-xs text-gray-500">a.n. {{ bankAccount.account_holder_name }}</p>
        </div>
      </div>
    </div>

    <!-- Peringatan jika belum ada rekening -->
    <UAlert
      v-else
      title="Rekening bank belum diatur"
      description="Tambahkan rekening bank terlebih dahulu sebelum melakukan penarikan dana."
      color="warning"
      icon="mdi:bank-alert-outline"
    >
      <template #actions>
        <UButton size="xs" color="warning" variant="soft" to="/seller/bank-account">
          Atur Rekening
        </UButton>
      </template>
    </UAlert>

    <!-- Form input -->
    <UFormField label="Jumlah Penarikan" required>
      <UInputCurrency
        v-model="amount"
        placeholder="Masukkan jumlah penarikan"
        class="w-full"
        inputmode="numeric"
        :disabled="!bankAccount || hasPendingWithdrawal"
      />
      <template #hint>
        <span class="text-xs text-gray-400">Min Rp 50.000 · Maks Rp 5.000.000</span>
      </template>
    </UFormField>

    <!-- Saldo tersedia -->
    <div class="flex justify-between text-sm px-1">
      <span class="text-gray-400">Saldo tersedia</span>
      <span class="font-semibold text-gray-700">{{ formatRp(balanceStore.balance) }}</span>
    </div>

    <UFormField label="Catatan (opsional)">
      <UTextarea
        v-model="notes"
        placeholder="Catatan untuk admin..."
        :rows="2"
        :disabled="!bankAccount || hasPendingWithdrawal"
        class="w-full"
      />
    </UFormField>

    <div class="flex justify-end gap-2 pt-1">
      <UButton color="neutral" variant="outline" @click="$emit('cancel')">Batal</UButton>
      <UButton
        color="primary"
        icon="mdi:cash-minus"
        :loading="loading"
        :disabled="!bankAccount || hasPendingWithdrawal"
        @click="handleSubmit"
      >
        Tarik Dana
      </UButton>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useBankAccountApi } from '~/composables/api/bank-account'
import { useBalanceApi } from '~/composables/api/balance'
import type { BankAccountResponse } from '~/types/bank-account/BankAccountResponse'

const emit = defineEmits<{
  'withdrawal-success': []
  'cancel': []
}>()

const toast = useToast()
const balanceStore = useBalanceStore()
const { fetchBankAccount } = useBankAccountApi()
const { fetchWithdrawal, fetchWithdrawalHistory } = useBalanceApi()

const loading = ref(false)
const error = ref<string | null>(null)
const amount = ref<number>(0)
const notes = ref('')

const { data: bankAccount } = await useAsyncData<BankAccountResponse | null>(
  'withdrawal-bank-account',
  () => fetchBankAccount(),
  { server: false }
)

const { data: withdrawalCheck } = await useAsyncData(
  'withdrawal-pending-check',
  () => fetchWithdrawalHistory(0, 1),
  { server: false }
)

const hasPendingWithdrawal = computed(
  () => withdrawalCheck.value?.content?.[0]?.status === 'PENDING'
)

function formatRp(val: number) {
  return 'Rp ' + val.toLocaleString('id-ID')
}

async function handleSubmit() {
  error.value = null

  if (!amount.value || amount.value < 50000) {
    error.value = 'Jumlah penarikan minimal Rp 50.000.'
    return
  }
  if (amount.value > 5000000) {
    error.value = 'Jumlah penarikan maksimal Rp 5.000.000.'
    return
  }
  if (amount.value > balanceStore.balance) {
    error.value = 'Jumlah penarikan melebihi saldo tersedia.'
    return
  }

  try {
    loading.value = true
    await fetchWithdrawal({ amount: amount.value, notes: notes.value || undefined })
    toast.add({
      title: 'Penarikan Dana Diajukan',
      description: `Permintaan penarikan ${formatRp(amount.value)} sedang diproses.`,
      color: 'success',
      icon: 'mdi:check-circle',
    })
    emit('withdrawal-success')
  } catch (err: any) {
    error.value = err.statusMessage || 'Gagal mengajukan penarikan dana.'
  } finally {
    loading.value = false
  }
}
</script>
