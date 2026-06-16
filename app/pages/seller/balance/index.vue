<template>
  <div class="space-y-6">

    <ClientOnly>
      <template #fallback>
        <div class="space-y-4"><AppLoadingSkeleton /></div>
      </template>

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

    <!-- Riwayat Penarikan -->
    <UCard class="shadow-sm">
      <template #header>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p class="font-semibold text-gray-800">Riwayat Penarikan</p>
          <div class="flex items-center gap-2">
            <USelect v-model="withdrawalPerPageValue" :items="perPageItems" class="w-24" />
            <UButton
              size="sm"
              icon="mdi:refresh"
              color="neutral"
              variant="outline"
              :loading="withdrawalLoading"
              @click="refreshWithdrawal()"
            >
              Refresh
            </UButton>
          </div>
        </div>
      </template>

      <!-- Loading -->
      <AppLoadingSkeleton v-if="withdrawalLoading" />

      <!-- Error -->
      <UAlert
        v-else-if="withdrawalError"
        title="Terjadi Kesalahan"
        :description="withdrawalError.message || 'Gagal memuat riwayat penarikan'"
        icon="mdi:alert-circle:error"
        color="error"
        class="mb-4"
      />

      <!-- Empty -->
      <div v-else-if="!withdrawalHistory?.content?.length" class="py-12 text-center">
        <UIcon name="mdi:cash-remove" class="text-4xl text-gray-300 mb-3" />
        <p class="text-gray-400 text-sm">Belum ada riwayat penarikan.</p>
      </div>

      <!-- Data -->
      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="item in withdrawalHistory.content"
          :key="item.id"
          class="py-4 px-2 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <div class="flex items-start gap-4">
            <!-- Icon -->
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              :class="{
                'bg-amber-50': item.status === 'PENDING',
                'bg-green-50': item.status === 'COMPLETED',
                'bg-red-50': item.status === 'REJECTED',
                'bg-gray-100': item.status === 'CANCELLED',
              }"
            >
              <UIcon
                :name="item.status === 'COMPLETED' ? 'mdi:check-circle' : item.status === 'REJECTED' ? 'mdi:close-circle' : item.status === 'CANCELLED' ? 'mdi:cancel' : 'mdi:clock-outline'"
                class="text-xl"
                :class="{
                  'text-amber-500': item.status === 'PENDING',
                  'text-green-500': item.status === 'COMPLETED',
                  'text-red-500': item.status === 'REJECTED',
                  'text-gray-400': item.status === 'CANCELLED',
                }"
              />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="text-sm font-medium text-gray-800">{{ item.bank_name }} — {{ item.account_number }}</p>
                  <p class="text-xs text-gray-500">a.n. {{ item.account_holder_name }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">{{ dayjs(item.created_at).format('DD MMM YYYY, HH:mm') }}</p>
                </div>
                <div class="text-right flex-shrink-0">
                  <p class="text-base font-bold text-red-500">-{{ formatRp(item.amount) }}</p>
                  <UBadge
                    :color="item.status === 'COMPLETED' ? 'success' : item.status === 'REJECTED' ? 'error' : item.status === 'CANCELLED' ? 'neutral' : 'warning'"
                    variant="soft"
                    size="xs"
                    class="mt-1"
                  >
                    {{ item.status === 'COMPLETED' ? 'Selesai' : item.status === 'REJECTED' ? 'Ditolak' : item.status === 'CANCELLED' ? 'Dibatalkan' : 'Menunggu' }}
                  </UBadge>
                </div>
              </div>

              <!-- Rincian biaya (tampil jika COMPLETED) -->
              <div v-if="item.status === 'COMPLETED'" class="mt-2 bg-green-50 rounded-lg px-3 py-2 space-y-1">
                <div class="flex justify-between text-xs text-gray-600">
                  <span>Jumlah Ditarik</span>
                  <span>{{ formatRp(item.amount) }}</span>
                </div>
                <div class="flex justify-between text-xs text-gray-600">
                  <span>Biaya Admin</span>
                  <span class="text-red-500">-{{ formatRp(item.admin_fee) }}</span>
                </div>
                <div class="flex justify-between text-xs font-semibold text-green-700 border-t border-green-200 pt-1">
                  <span>Diterima</span>
                  <span>{{ formatRp(item.amount_received) }}</span>
                </div>
                <div v-if="item.processed_at" class="flex justify-between text-xs text-gray-400">
                  <span>Waktu Proses</span>
                  <span>{{ dayjs(item.processed_at).format('DD MMM YYYY, HH:mm') }}</span>
                </div>
              </div>

              <!-- Catatan admin jika REJECTED -->
              <div v-if="item.status === 'REJECTED' && item.admin_notes" class="mt-2 bg-red-50 rounded-lg px-3 py-2">
                <p class="text-xs text-red-600"><span class="font-medium">Alasan Penolakan:</span> {{ item.admin_notes }}</p>
              </div>

              <!-- Catatan dari seller -->
              <p v-if="item.notes" class="text-xs text-gray-400 italic mt-1.5">Catatan: {{ item.notes }}</p>

              <!-- Tombol Cancel (hanya PENDING) -->
              <div v-if="item.status === 'PENDING'" class="mt-2 flex justify-end">
                <UButton
                  size="xs"
                  color="error"
                  variant="soft"
                  icon="mdi:close-circle-outline"
                  :loading="cancellingId === item.id"
                  @click="handleCancelWithdrawal(item.id)"
                >
                  Batalkan
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="withdrawalHistory && withdrawalHistory.total_pages > 1 && !withdrawalLoading"
        class="flex justify-center items-center pt-4"
      >
        <UPagination
          :page="withdrawalPage + 1"
          :total="withdrawalHistory.total_elements"
          :items-per-page="withdrawalPerPageValue"
          :sibling-count="1"
          show-edges
          @update:page="onWithdrawalPageChange"
        />
      </div>
    </UCard>

    <!-- Mutasi Saldo -->
    <UCard class="shadow-sm">
      <template #header>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p class="font-semibold text-gray-800">Mutasi Saldo</p>
          <div class="flex items-center gap-2">
            <USelect v-model="logPerPageValue" :items="perPageItems" class="w-24" />
            <UButton
              size="sm"
              icon="mdi:refresh"
              color="neutral"
              variant="outline"
              :loading="logLoading"
              @click="refreshLog()"
            >
              Refresh
            </UButton>
          </div>
        </div>
      </template>

      <!-- Loading -->
      <AppLoadingSkeleton v-if="logLoading" />

      <!-- Error -->
      <UAlert
        v-else-if="logError"
        title="Terjadi Kesalahan"
        :description="logError.message || 'Gagal memuat mutasi saldo'"
        icon="mdi:alert-circle:error"
        color="error"
        class="mb-4"
      />

      <!-- Empty -->
      <div v-else-if="!balanceLog?.content?.length" class="py-12 text-center">
        <UIcon name="i-heroicons-inbox" class="text-4xl text-gray-300 mb-3" />
        <p class="text-gray-400 text-sm">Belum ada mutasi saldo.</p>
      </div>

      <!-- Data -->
      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="log in balanceLog.content"
          :key="log.id"
          class="flex items-center gap-4 py-4 px-2 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <!-- Icon CREDIT / DEBIT -->
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            :class="log.type === 'CREDIT' ? 'bg-green-50' : 'bg-red-50'"
          >
            <UIcon
              :name="log.type === 'CREDIT' ? 'mdi:arrow-down-circle' : 'mdi:arrow-up-circle'"
              class="text-xl"
              :class="log.type === 'CREDIT' ? 'text-green-500' : 'text-red-500'"
            />
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-800 truncate">{{ log.description || '-' }}</p>
            <p class="text-xs text-gray-400">{{ dayjs(log.created_at).format('DD MMM YYYY, HH:mm') }}</p>
            <p class="text-xs text-gray-400 mt-0.5">
              {{ formatRp(log.old_balance) }} → {{ formatRp(log.new_balance) }}
            </p>
          </div>

          <!-- Jumlah -->
          <div class="flex-shrink-0 text-right">
            <p
              class="text-base font-bold"
              :class="log.type === 'CREDIT' ? 'text-green-600' : 'text-red-500'"
            >
              {{ log.type === 'CREDIT' ? '+' : '-' }}{{ formatRp(log.amount) }}
            </p>
            <UBadge
              :color="log.type === 'CREDIT' ? 'success' : 'error'"
              variant="soft"
              size="xs"
              class="mt-1"
            >
              {{ log.type === 'CREDIT' ? 'Masuk' : 'Keluar' }}
            </UBadge>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="balanceLog && balanceLog.total_pages > 1 && !logLoading"
        class="flex justify-center items-center pt-4"
      >
        <UPagination
          :page="logPage + 1"
          :total="balanceLog.total_elements"
          :items-per-page="logPerPageValue"
          :sibling-count="1"
          show-edges
          @update:page="onLogPageChange"
        />
      </div>
    </UCard>

    </ClientOnly>

    <!-- Modals -->
    <UModal v-model:open="isWithdrawalOpen" title="Tarik Dana">
      <template #body>
        <FormWithdrawal @withdrawal-success="handleWithdrawalSuccess" @cancel="isWithdrawalOpen = false" />
      </template>
    </UModal>

  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { useBalanceApi } from '~/composables/api/balance'
import type { BalanceLogResponse } from '~/types/balance/BalanceLogResponse'
import type { WithdrawalResponse } from '~/types/balance/WithdrawalResponse'
import type { PageResponse } from '~/types/PageResponse'

definePageMeta({ layout: 'seller', label: 'Kelola Saldo' })

const balanceStore = useBalanceStore()
const toast = useToast()
const { confirm, close: closeConfirm } = useConfirm()
const { fetchBalance, fetchBalanceLog, fetchWithdrawalHistory, cancelWithdrawal } = useBalanceApi()

// ===== MODAL STATE =====
const isWithdrawalOpen = ref(false)

// ===== PAGINATION STATE =====
const perPageItems = [5, 10, 25, 50]

// --- Withdrawal History ---
const withdrawalPage = ref(0)
const withdrawalPerPageValue = ref(10)

// --- Balance Log ---
const logPage = ref(0)
const logPerPageValue = ref(10)

// ===== FETCH BALANCE =====
const { pending: balanceLoading, refresh: refreshBalance } = await useAsyncData(
  'seller-balance',
  async () => {
    const res = await fetchBalance()
    balanceStore.setBalance(res.balance)
    balanceStore.setBalanceHeld(res.balance_held)
  },
  { server: false }
)

// ===== FETCH WITHDRAWAL HISTORY =====
const {
  data: withdrawalHistory,
  pending: withdrawalLoading,
  error: withdrawalError,
  refresh: refreshWithdrawal,
} = await useAsyncData<PageResponse<WithdrawalResponse>>(
  () => `seller-withdrawal-history-${withdrawalPage.value}-${withdrawalPerPageValue.value}`,
  () => fetchWithdrawalHistory(withdrawalPage.value, withdrawalPerPageValue.value),
  { watch: [withdrawalPage, withdrawalPerPageValue], server: false }
)

// ===== FETCH BALANCE LOG =====
const {
  data: balanceLog,
  pending: logLoading,
  error: logError,
  refresh: refreshLog,
} = await useAsyncData<PageResponse<BalanceLogResponse>>(
  () => `seller-balance-log-${logPage.value}-${logPerPageValue.value}`,
  () => fetchBalanceLog(logPage.value, logPerPageValue.value),
  { watch: [logPage, logPerPageValue], server: false }
)

// ===== HELPERS =====
function formatRp(val: number) {
  return 'Rp ' + val.toLocaleString('id-ID')
}

async function handleRefresh() {
  await Promise.all([refreshBalance(), refreshWithdrawal(), refreshLog()])
}

function onWithdrawalPageChange(newPage: number) {
  withdrawalPage.value = newPage - 1
}

function onLogPageChange(newPage: number) {
  logPage.value = newPage - 1
}

// ===== WITHDRAWAL =====
function handleWithdrawalSuccess() {
  isWithdrawalOpen.value = false
  refreshBalance()
  refreshWithdrawal()
  refreshLog()
}

const cancellingId = ref<string | null>(null)

async function handleCancelWithdrawal(id: string) {
  const ok = await confirm({
    title: 'Batalkan Penarikan',
    message: 'Apakah Anda yakin ingin membatalkan permintaan penarikan ini?',
    confirmText: 'Ya, Batalkan',
    cancelText: 'Tidak',
  })
  if (!ok) return

  try {
    cancellingId.value = id
    await cancelWithdrawal(id)
    toast.add({
      title: 'Penarikan Dibatalkan',
      description: 'Permintaan penarikan berhasil dibatalkan.',
      color: 'success',
      icon: 'mdi:check-circle',
    })
    await Promise.all([refreshBalance(), refreshWithdrawal(), refreshLog()])
  } catch (err: any) {
    toast.add({
      title: 'Gagal Membatalkan',
      description: err.statusMessage || 'Terjadi kesalahan, coba lagi.',
      color: 'error',
      icon: 'mdi:close-circle',
    })
  } finally {
    cancellingId.value = null
    closeConfirm()
  }
}
</script>
