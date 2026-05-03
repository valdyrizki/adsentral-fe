<template>
  <div class="space-y-6">

    <!-- Saldo Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">

      <!-- Saldo Efektif -->
      <div class="bg-gradient-to-br from-primary to-teal-600 rounded-2xl p-6 text-white shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <div class="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <UIcon name="i-heroicons-check-circle" class="text-white text-lg" />
            </div>
            <p class="text-sm font-medium text-white/80">Saldo Efektif</p>
          </div>
          <UButton
            size="xs"
            icon="mdi:refresh"
            color="neutral"
            variant="ghost"
            :loading="balanceLoading"
            class="text-white/70 hover:text-white hover:bg-white/10"
            @click="handleRefresh"
          />
        </div>
        <USkeleton v-if="balanceLoading" class="h-9 w-40 rounded-lg bg-white/30 mb-2" />
        <p v-else class="text-3xl font-bold mb-1">{{ formatRp(balanceStore.balance) }}</p>
        <p class="text-xs text-white/60">Tersedia untuk ditarik</p>
        <div class="flex gap-2 mt-4">
          <UButton
            size="sm"
            color="primary"
            variant="outline"
            icon="mdi:cash-minus"
            class="border-white/30 text-white hover:bg-white/10 flex-1 justify-center"
            @click="isWithdrawalOpen = true"
          >
            Tarik Dana
          </UButton>
          <UButton
            size="sm"
            color="primary"
            variant="outline"
            icon="mdi:cash-plus"
            class="border-white/30 text-white hover:bg-white/10 flex-1 justify-center"
            @click="isDepositOpen = true"
          >
            Deposit
          </UButton>
        </div>
      </div>

      <!-- Saldo Ditahan -->
      <div class="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
            <UIcon name="i-heroicons-lock-closed" class="text-amber-500 text-lg" />
          </div>
          <p class="text-sm font-medium text-amber-700">Saldo Ditahan</p>
        </div>
        <USkeleton v-if="balanceLoading" class="h-9 w-40 rounded-lg bg-amber-200 mb-2" />
        <p v-else class="text-3xl font-bold text-amber-700 mb-1">{{ formatRp(balanceStore.balanceHeld) }}</p>
        <p class="text-xs text-amber-500">Menunggu transaksi selesai</p>
        <div class="mt-4 bg-amber-100 rounded-xl p-3">
          <div class="flex items-start gap-2">
            <UIcon name="i-heroicons-information-circle" class="text-amber-500 text-sm mt-0.5 flex-shrink-0" />
            <p class="text-xs text-amber-600 leading-relaxed">
              Dana akan otomatis cair ke saldo efektif setelah pembeli mengkonfirmasi penerimaan pesanan.
            </p>
          </div>
        </div>
      </div>

      <!-- Total Saldo -->
      <div class="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
            <UIcon name="i-heroicons-calculator" class="text-gray-500 text-lg" />
          </div>
          <p class="text-sm font-medium text-gray-600">Total Saldo</p>
        </div>
        <USkeleton v-if="balanceLoading" class="h-9 w-40 rounded-lg bg-gray-200 mb-2" />
        <p v-else class="text-3xl font-bold text-gray-800 mb-1">{{ formatRp(balanceStore.balanceTotal) }}</p>
        <p class="text-xs text-gray-400">Efektif + Ditahan</p>
        <div class="mt-4 space-y-2">
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-500 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-primary inline-block" />
              Saldo Efektif
            </span>
            <span class="font-semibold text-gray-800">{{ formatRp(balanceStore.balance) }}</span>
          </div>
          <div class="flex justify-between items-center text-sm">
            <span class="text-gray-500 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              Saldo Ditahan
            </span>
            <span class="font-semibold text-amber-600">{{ formatRp(balanceStore.balanceHeld) }}</span>
          </div>
          <USeparator />
          <div class="flex justify-between items-center text-sm font-bold text-gray-800">
            <span>Total</span>
            <span>{{ formatRp(balanceStore.balanceTotal) }}</span>
          </div>
        </div>
      </div>

    </div>

    <!-- Riwayat Saldo -->
    <UCard class="shadow-sm">
      <template #header>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p class="font-semibold text-gray-800">Riwayat Saldo</p>
          <div class="flex items-center gap-2">
            <USelect v-model="perPageValue" :items="perPageItems" class="w-24" />
            <UButton
              size="sm"
              icon="mdi:refresh"
              color="neutral"
              variant="outline"
              :loading="historyLoading"
              @click="refreshHistory()"
            >
              Refresh
            </UButton>
          </div>
        </div>
      </template>

      <!-- Loading -->
      <AppLoadingSkeleton v-if="historyLoading" />

      <!-- Error -->
      <UAlert
        v-else-if="historyError"
        title="Terjadi Kesalahan"
        :description="historyError.message || 'Gagal memuat riwayat saldo'"
        icon="icon-park-solid:error"
        color="error"
        class="mb-4"
      />

      <!-- Empty -->
      <div
        v-else-if="!depositHistory?.content?.length"
        class="py-12 text-center"
      >
        <UIcon name="i-heroicons-inbox" class="text-4xl text-gray-300 mb-3" />
        <p class="text-gray-400 text-sm">Belum ada riwayat transaksi saldo.</p>
      </div>

      <!-- Data -->
      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="deposit in depositHistory.content"
          :key="deposit.id"
          class="flex items-center gap-4 py-4 px-2 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <!-- Icon type -->
          <div class="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <UIcon name="mdi:cash-plus" class="text-green-500 text-xl" />
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5 flex-wrap">
              <UBadge color="success" variant="soft" size="xs">DEPOSIT</UBadge>
              <UBadge color="info" variant="soft" size="xs">{{ deposit.payment_method }}</UBadge>
            </div>
            <p class="text-sm font-medium text-gray-800 truncate">#{{ deposit.payment_id }}</p>
            <p class="text-xs text-gray-400">{{ dayjs(deposit.created_at).format('DD MMM YYYY, HH:mm') }}</p>
          </div>

          <!-- Jumlah -->
          <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
            <p class="text-base font-bold text-green-600">+ {{ formatRp(deposit.amount) }}</p>
            <AppPaymentStatusBadge :status="deposit.status" />
          </div>

          <!-- Aksi -->
          <div class="flex flex-col gap-1 flex-shrink-0 ml-2">
            <UButton
              v-if="deposit.status === 'UNPAID'"
              size="xs"
              color="primary"
              variant="soft"
              icon="mdi:payment"
            >
              Bayar
            </UButton>
            <UButton
              v-if="deposit.status === 'UNPAID'"
              size="xs"
              color="error"
              variant="soft"
              icon="material-symbols:cancel"
              :loading="cancellingId === deposit.payment_id"
              @click="handleCancel(deposit)"
            >
              Batalkan
            </UButton>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="depositHistory && depositHistory.total_pages > 1 && !historyLoading"
        class="flex justify-center items-center pt-4"
      >
        <UPagination
          :page="page + 1"
          :total="depositHistory.total_elements"
          :items-per-page="perPageValue"
          :sibling-count="1"
          show-edges
          @update:page="onPageChange"
        />
      </div>
    </UCard>

    <!-- Modals -->
    <UModal v-model:open="isWithdrawalOpen" title="Tarik Dana">
      <template #body>
        <FormWithdrawal @withdrawal-success="handleWithdrawalSuccess" />
      </template>
    </UModal>

    <UModal v-model:open="isDepositOpen" title="Deposit Saldo">
      <template #body>
        <FormDeposit
          :loading="submittingDeposit"
          @submit="handleDepositSubmit"
          @cancel="isDepositOpen = false"
        />
      </template>
    </UModal>

  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { useBalanceApi } from '~/composables/api/balance'
import type { DepositResponse } from '~/types/balance/DepositResponse'
import type { DepositRequest } from '~/types/balance/DepositRequest'
import type { PageResponse } from '~/types/PageResponse'
import type { StringIdRequest } from '~/types/StringIdRequest'

definePageMeta({ layout: 'seller', label: 'Kelola Saldo' })

const balanceStore = useBalanceStore()
const toast = useToast()
const { confirm } = useConfirm()
const { fetchBalance, fetchDepositHistory, fetchDepositBalance, fetchDepositCancel } = useBalanceApi()

// ===== MODAL STATE =====
const isWithdrawalOpen = ref(false)
const isDepositOpen = ref(false)
const submittingDeposit = ref(false)
const cancellingId = ref<string | null>(null)

// ===== PAGINATION STATE =====
const page = ref(0)
const perPageValue = ref(10)
const perPageItems = [5, 10, 25, 50]

// ===== FETCH BALANCE =====
const { pending: balanceLoading, refresh: refreshBalance } = await useAsyncData(
  'seller-balance',
  async () => {
    const res = await fetchBalance()
    balanceStore.setBalance(res.balance)
  },
  { server: false }
)

// ===== FETCH HISTORY =====
const {
  data: depositHistory,
  pending: historyLoading,
  error: historyError,
  refresh: refreshHistory,
} = await useAsyncData<PageResponse<DepositResponse>>(
  () => `seller-deposit-history-${page.value}-${perPageValue.value}`,
  () => fetchDepositHistory(page.value, perPageValue.value),
  { watch: [page, perPageValue], server: false }
)

// ===== HELPERS =====
function formatRp(val: number) {
  return 'Rp ' + val.toLocaleString('id-ID')
}

async function handleRefresh() {
  await Promise.all([refreshBalance(), refreshHistory()])
}

function onPageChange(newPage: number) {
  page.value = newPage - 1
}

// ===== WITHDRAWAL =====
function handleWithdrawalSuccess() {
  isWithdrawalOpen.value = false
  refreshBalance()
  refreshHistory()
}

// ===== DEPOSIT =====
async function handleDepositSubmit(payload: DepositRequest) {
  submittingDeposit.value = true
  try {
    const deposit = await fetchDepositBalance(payload)
    toast.add({ title: 'Deposit Dibuat', description: 'Silakan lanjutkan pembayaran', color: 'success' })
    isDepositOpen.value = false
    refreshBalance()
    refreshHistory()
    if (deposit.checkout_url) window.open(deposit.checkout_url, '_blank')
  } catch (err: any) {
    toast.add({ title: 'Deposit Gagal', description: err.statusMessage || 'Terjadi kesalahan', color: 'error' })
  } finally {
    submittingDeposit.value = false
  }
}

// ===== CANCEL DEPOSIT =====
async function handleCancel(deposit: DepositResponse) {
  const yes = await confirm({
    title: 'Batalkan Deposit?',
    message: 'Deposit yang dibatalkan tidak bisa dikembalikan. Yakin?',
    confirmText: 'Ya, Batalkan',
    cancelText: 'Tidak',
    confirmColor: 'error',
  })
  if (!yes) return

  cancellingId.value = deposit.payment_id
  try {
    await fetchDepositCancel(deposit.payment_id)
    toast.add({ title: 'Deposit Dibatalkan', color: 'success' })
    await Promise.all([refreshBalance(), refreshHistory()])
  } catch {
    toast.add({ title: 'Gagal Membatalkan Deposit', color: 'error' })
  } finally {
    cancellingId.value = null
  }
}
</script>
