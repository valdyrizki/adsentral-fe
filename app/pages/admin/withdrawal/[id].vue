<template>
  <div class="space-y-6">

    <!-- Back -->
    <UButton
      to="/admin/withdrawal"
      icon="mdi:arrow-left"
      color="neutral"
      variant="ghost"
      size="sm"
    >
      Kembali ke Daftar
    </UButton>

    <AppLoadingSkeleton v-if="pending" />

    <UAlert
      v-else-if="error"
      title="Terjadi Kesalahan"
      :description="error.message || 'Gagal memuat detail penarikan'"
      icon="mdi:alert-circle:error"
      color="error"
    />

    <template v-else-if="withdrawal">

      <!-- Status Banner -->
      <div
        class="rounded-2xl p-5 flex items-center gap-4"
        :class="{
          'bg-amber-50 border border-amber-200': withdrawal.status === 'PENDING',
          'bg-green-50 border border-green-200': withdrawal.status === 'COMPLETED',
          'bg-red-50 border border-red-200': withdrawal.status === 'REJECTED',
          'bg-gray-50 border border-gray-200': withdrawal.status === 'CANCELLED',
        }"
      >
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          :class="{
            'bg-amber-100': withdrawal.status === 'PENDING',
            'bg-green-100': withdrawal.status === 'COMPLETED',
            'bg-red-100': withdrawal.status === 'REJECTED',
            'bg-gray-200': withdrawal.status === 'CANCELLED',
          }"
        >
          <UIcon
            :name="withdrawal.status === 'COMPLETED' ? 'mdi:check-circle' : withdrawal.status === 'REJECTED' ? 'mdi:close-circle' : withdrawal.status === 'CANCELLED' ? 'mdi:cancel' : 'mdi:clock-outline'"
            class="text-2xl"
            :class="{
              'text-amber-500': withdrawal.status === 'PENDING',
              'text-green-500': withdrawal.status === 'COMPLETED',
              'text-red-500': withdrawal.status === 'REJECTED',
              'text-gray-400': withdrawal.status === 'CANCELLED',
            }"
          />
        </div>
        <div>
          <p class="font-semibold text-gray-800">{{ statusLabel(withdrawal.status) }}</p>
          <p class="text-xs text-gray-500 mt-0.5">
            <template v-if="withdrawal.status === 'PENDING'">Menunggu proses transfer oleh admin</template>
            <template v-else-if="withdrawal.status === 'COMPLETED'">Transfer selesai diproses pada {{ dayjs(withdrawal.processed_at).format('DD MMM YYYY, HH:mm') }}</template>
            <template v-else-if="withdrawal.status === 'REJECTED'">Ditolak pada {{ dayjs(withdrawal.processed_at).format('DD MMM YYYY, HH:mm') }}</template>
            <template v-else>Dibatalkan oleh seller</template>
          </p>
        </div>
        <UBadge
          :color="withdrawal.status === 'COMPLETED' ? 'success' : withdrawal.status === 'REJECTED' ? 'error' : withdrawal.status === 'CANCELLED' ? 'neutral' : 'warning'"
          variant="soft"
          class="ml-auto"
        >
          {{ statusLabel(withdrawal.status) }}
        </UBadge>
      </div>

      <!-- Alert Anomali -->
      <UAlert
        v-if="isAnomalous"
        title="Peringatan: Potensi Anomali"
        color="error"
        icon="mdi:alert-circle"
        variant="subtle"
      >
        <template #description>
          <p class="text-sm">
            Jumlah penarikan (<strong>{{ formatRp(withdrawal.amount) }}</strong>) melebihi estimasi saldo tersedia berdasarkan riwayat.
          </p>
          <div class="mt-2 text-xs space-y-1 text-gray-600">
            <div class="flex justify-between">
              <span>Total Transaksi Selesai</span>
              <span>{{ formatRp(sellerSum?.total_amount ?? 0) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Total Deposit Sukses</span>
              <span>{{ formatRp(depositSum?.total_amount ?? 0) }}</span>
            </div>
            <div class="flex justify-between text-red-600">
              <span>Total Penarikan Selesai</span>
              <span>- {{ formatRp(withdrawalSum?.total_amount_received ?? 0) }}</span>
            </div>
            <div class="flex justify-between font-semibold border-t pt-1 mt-1">
              <span>Estimasi Tersedia</span>
              <span>{{ formatRp((sellerSum?.total_amount ?? 0) + (depositSum?.total_amount ?? 0) - (withdrawalSum?.total_amount_received ?? 0)) }}</span>
            </div>
            <div class="flex justify-between font-semibold text-red-700">
              <span>Permintaan Penarikan</span>
              <span>{{ formatRp(withdrawal.amount) }}</span>
            </div>
          </div>
          <p class="mt-2 text-xs text-gray-500">Harap verifikasi manual sebelum memproses transfer.</p>
        </template>
      </UAlert>

      <!-- Row 1: 3 Ringkasan (dipindah ke atas) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <!-- Ringkasan Transaksi -->
        <UCard class="shadow-sm">
          <template #header>
            <p class="font-semibold text-gray-800 flex items-center gap-2">
              <UIcon name="mdi:chart-bar" class="text-primary" /> Transaksi
              <UBadge color="success" variant="soft" size="xs">Selesai</UBadge>
            </p>
          </template>
          <AppLoadingSkeleton v-if="sumPending" />
          <UAlert v-else-if="sumError" :description="sumError.message || 'Gagal memuat data'" color="error" icon="mdi:alert-circle:error" />
          <div v-else-if="sellerSum" class="space-y-3">
            <div class="bg-gray-50 rounded-xl p-3">
              <p class="text-xs text-gray-400 mb-0.5">Jumlah Transaksi</p>
              <p class="text-2xl font-bold text-gray-800">{{ sellerSum.total_transactions }}</p>
            </div>
            <div class="bg-primary-50 rounded-xl p-3">
              <p class="text-xs text-gray-400 mb-0.5">Total Nilai</p>
              <p class="text-xl font-bold text-primary">{{ formatRp(sellerSum.total_amount) }}</p>
            </div>
          </div>
        </UCard>

        <!-- Ringkasan Deposit -->
        <UCard class="shadow-sm">
          <template #header>
            <p class="font-semibold text-gray-800 flex items-center gap-2">
              <UIcon name="mdi:arrow-down-circle" class="text-green-500" /> Deposit
              <UBadge color="success" variant="soft" size="xs">Sukses</UBadge>
            </p>
          </template>
          <AppLoadingSkeleton v-if="depositSumPending" />
          <UAlert v-else-if="depositSumError" :description="depositSumError.message || 'Gagal memuat data'" color="error" icon="mdi:alert-circle:error" />
          <div v-else-if="depositSum" class="space-y-3">
            <div class="bg-gray-50 rounded-xl p-3">
              <p class="text-xs text-gray-400 mb-0.5">Jumlah Deposit</p>
              <p class="text-2xl font-bold text-gray-800">{{ depositSum.total_deposits }}</p>
            </div>
            <div class="bg-green-50 rounded-xl p-3">
              <p class="text-xs text-gray-400 mb-0.5">Total Nominal</p>
              <p class="text-xl font-bold text-green-600">{{ formatRp(depositSum.total_amount) }}</p>
            </div>
          </div>
        </UCard>

        <!-- Ringkasan Penarikan -->
        <UCard class="shadow-sm">
          <template #header>
            <p class="font-semibold text-gray-800 flex items-center gap-2">
              <UIcon name="mdi:cash-minus" class="text-red-500" /> Penarikan
              <UBadge color="success" variant="soft" size="xs">Selesai</UBadge>
            </p>
          </template>
          <AppLoadingSkeleton v-if="withdrawalSumPending" />
          <UAlert v-else-if="withdrawalSumError" :description="withdrawalSumError.message || 'Gagal memuat data'" color="error" icon="mdi:alert-circle:error" />
          <div v-else-if="withdrawalSum" class="space-y-3">
            <div class="bg-gray-50 rounded-xl p-3">
              <p class="text-xs text-gray-400 mb-0.5">Jumlah Penarikan</p>
              <p class="text-2xl font-bold text-gray-800">{{ withdrawalSum.total_withdrawals }}</p>
            </div>
            <div class="bg-red-50 rounded-xl p-3">
              <p class="text-xs text-gray-400 mb-0.5">Total Ditarik</p>
              <p class="text-xl font-bold text-red-500">{{ formatRp(withdrawalSum.total_amount) }}</p>
            </div>
            <div class="bg-orange-50 rounded-xl p-3">
              <p class="text-xs text-gray-400 mb-0.5">Diterima Seller</p>
              <p class="text-xl font-bold text-orange-600">{{ formatRp(withdrawalSum.total_amount_received) }}</p>
            </div>
          </div>
        </UCard>

      </div>

      <!-- Row 2: Info Seller + Rekening Tujuan -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <!-- Info Seller -->
        <UCard class="shadow-sm">
          <template #header>
            <p class="font-semibold text-gray-800 flex items-center gap-2">
              <UIcon name="mdi:account" class="text-primary" /> Info Seller
            </p>
          </template>
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Nama</span>
              <span class="font-medium text-gray-800">{{ withdrawal.user.full_name ?? withdrawal.user.username }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Username</span>
              <span class="text-gray-600">{{ withdrawal.user.username }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Email</span>
              <span class="text-gray-600">{{ withdrawal.user.email }}</span>
            </div>
          </div>
        </UCard>

        <!-- Rekening Tujuan -->
        <UCard class="shadow-sm">
          <template #header>
            <p class="font-semibold text-gray-800 flex items-center gap-2">
              <UIcon name="mdi:bank" class="text-primary" /> Rekening Tujuan Transfer
            </p>
          </template>
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Bank</span>
              <span class="font-medium text-gray-800">{{ withdrawal.bank_name }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">No. Rekening</span>
              <span class="font-mono font-semibold text-gray-800">{{ withdrawal.account_number }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Atas Nama</span>
              <span class="font-medium text-gray-800">{{ withdrawal.account_holder_name }}</span>
            </div>
          </div>
        </UCard>

      </div>

      <!-- Rincian Dana -->
      <UCard class="shadow-sm">
        <template #header>
          <p class="font-semibold text-gray-800 flex items-center gap-2">
            <UIcon name="mdi:cash-multiple" class="text-primary" /> Rincian Dana
          </p>
        </template>
        <div class="space-y-3">
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">Jumlah Penarikan</span>
            <span class="font-semibold text-gray-800">{{ formatRp(withdrawal.amount) }}</span>
          </div>
          <template v-if="withdrawal.status === 'COMPLETED'">
            <div class="flex justify-between text-sm">
              <span class="text-gray-400">Biaya Admin</span>
              <span class="text-red-500">- {{ formatRp(withdrawal.admin_fee) }}</span>
            </div>
            <USeparator />
            <div class="flex justify-between text-sm font-bold">
              <span class="text-gray-700">Diterima Seller</span>
              <span class="text-green-600">{{ formatRp(withdrawal.amount_received) }}</span>
            </div>
          </template>
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">Tanggal Pengajuan</span>
            <span class="text-gray-600">{{ dayjs(withdrawal.created_at).format('DD MMM YYYY, HH:mm') }}</span>
          </div>
          <div v-if="withdrawal.notes" class="flex justify-between text-sm">
            <span class="text-gray-400">Catatan Seller</span>
            <span class="text-gray-600 italic text-right max-w-[60%]">{{ withdrawal.notes }}</span>
          </div>
        </div>
      </UCard>

      <!-- Info Proses (jika sudah diproses) -->
      <UCard v-if="withdrawal.status === 'COMPLETED' || withdrawal.status === 'REJECTED'" class="shadow-sm">
        <template #header>
          <p class="font-semibold text-gray-800 flex items-center gap-2">
            <UIcon name="mdi:account-check" class="text-primary" /> Info Proses
          </p>
        </template>
        <div class="space-y-3">
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">Diproses oleh</span>
            <span class="font-medium text-gray-800">{{ withdrawal.processed_by ?? '-' }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">Waktu Proses</span>
            <span class="text-gray-600">{{ withdrawal.processed_at ? dayjs(withdrawal.processed_at).format('DD MMM YYYY, HH:mm') : '-' }}</span>
          </div>
          <div v-if="withdrawal.status === 'REJECTED' && withdrawal.admin_notes" class="pt-1">
            <p class="text-xs text-gray-400 mb-1">Alasan Penolakan</p>
            <div class="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              <p class="text-sm text-red-700">{{ withdrawal.admin_notes }}</p>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Action (hanya PENDING) -->
      <div v-if="withdrawal.status === 'PENDING'" class="flex gap-3 justify-end">
        <UButton
          color="error"
          variant="soft"
          icon="mdi:close-circle"
          @click="openReject"
        >
          Tolak
        </UButton>
        <UButton
          color="success"
          icon="mdi:bank-transfer"
          @click="openApprove"
        >
          Tandai Transfer Selesai
        </UButton>
      </div>

    </template>

    <!-- Modal Tandai Selesai -->
    <UModal v-model:open="isApproveOpen" title="Konfirmasi Transfer Selesai">
      <template #body>
        <div class="space-y-4 p-1">
          <UAlert
            v-if="actionError"
            :description="actionError"
            color="error"
            icon="material-symbols:error-outline"
          />
          <UAlert
            title="Pastikan transfer sudah dilakukan"
            description="Tandai selesai hanya setelah Anda benar-benar mentransfer dana ke rekening seller."
            color="warning"
            icon="mdi:information-outline"
          />
          <UFormField label="Biaya Admin (Rp)" hint="Biaya yang dipotong dari jumlah penarikan">
            <UInputCurrency
              v-model="adminFeeInput"
              placeholder="0"
              class="w-full"
              inputmode="numeric"
            />
          </UFormField>
          <div v-if="withdrawal" class="rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex justify-between items-center">
            <span class="text-sm text-gray-600">Jumlah diterima seller</span>
            <span class="text-base font-bold text-green-700">{{ formatRp(withdrawal.amount - adminFeeInput) }}</span>
          </div>
          <div class="flex justify-end gap-2 pt-1">
            <UButton color="neutral" variant="outline" @click="isApproveOpen = false">Batal</UButton>
            <UButton color="success" icon="mdi:bank-transfer" :loading="actionLoading" @click="handleApprove">
              Tandai Transfer Selesai
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <!-- Modal Tolak -->
    <UModal v-model:open="isRejectOpen" title="Tolak Penarikan">
      <template #body>
        <div class="space-y-4 p-1">
          <UAlert
            v-if="actionError"
            :description="actionError"
            color="error"
            icon="material-symbols:error-outline"
          />
          <UFormField label="Alasan Penolakan" required>
            <UTextarea
              v-model="rejectReason"
              placeholder="Masukkan alasan penolakan..."
              :rows="3"
              class="w-full"
            />
          </UFormField>
          <div class="flex justify-end gap-2 pt-1">
            <UButton color="neutral" variant="outline" @click="isRejectOpen = false">Batal</UButton>
            <UButton color="error" icon="mdi:close-circle" :loading="actionLoading" @click="handleReject">
              Tolak Penarikan
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { useAdminWithdrawalApi } from '~/composables/api/admin-withdrawal'
import type { AdminWithdrawalResponse } from '~/types/balance/AdminWithdrawalResponse'
import type { SellerTransactionSumResponse } from '~/types/balance/SellerTransactionSumResponse'
import type { DepositSumResponse } from '~/types/balance/DepositSumResponse'
import type { WithdrawalSumResponse } from '~/types/balance/WithdrawalSumResponse'

definePageMeta({ layout: 'admin', label: 'Detail Penarikan Dana' })

const route = useRoute()
const toast = useToast()
const { fetchWithdrawalDetail, fetchSellerTransactionSum, fetchSellerDepositSum, fetchSellerWithdrawalSum, approveWithdrawal, rejectWithdrawal } = useAdminWithdrawalApi()

const id = route.params.id as string

const {
  data: withdrawal,
  pending,
  error,
  refresh,
} = await useAsyncData<AdminWithdrawalResponse>(
  `admin-withdrawal-${id}`,
  () => fetchWithdrawalDetail(id),
  { server: false }
)

// ===== SELLER TRANSACTION SUM =====
const {
  data: sellerSum,
  pending: sumPending,
  error: sumError,
} = await useAsyncData<SellerTransactionSumResponse | null>(
  `seller-sum-${id}`,
  async () => {
    if (!withdrawal.value?.user?.id) return null
    return fetchSellerTransactionSum(withdrawal.value.user.id, 'COMPLETE')
  },
  { watch: [withdrawal], server: false }
)

function formatRp(val: number) {
  return 'Rp ' + val.toLocaleString('id-ID')
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    PENDING: 'Menunggu',
    COMPLETED: 'Selesai',
    REJECTED: 'Ditolak',
    CANCELLED: 'Dibatalkan',
  }
  return map[status] ?? status
}

// ===== WITHDRAWAL SUM =====
const {
  data: withdrawalSum,
  pending: withdrawalSumPending,
  error: withdrawalSumError,
} = await useAsyncData<WithdrawalSumResponse | null>(
  `seller-withdrawal-sum-${id}`,
  async () => {
    if (!withdrawal.value?.user?.id) return null
    return fetchSellerWithdrawalSum(withdrawal.value.user.id, 'COMPLETED')
  },
  { watch: [withdrawal], server: false }
)

// ===== DEPOSIT SUM =====
const {
  data: depositSum,
  pending: depositSumPending,
  error: depositSumError,
} = await useAsyncData<DepositSumResponse | null>(
  `seller-deposit-sum-${id}`,
  async () => {
    if (!withdrawal.value?.user?.id) return null
    return fetchSellerDepositSum(withdrawal.value.user.id, 'PAID')
  },
  { watch: [withdrawal], server: false }
)

// ===== ANOMALY CHECK =====
const isAnomalous = computed(() => {
  if (!sellerSum.value || !depositSum.value || !withdrawalSum.value || !withdrawal.value) return false
  const estimatedAvailable =
    sellerSum.value.total_amount +
    depositSum.value.total_amount -
    withdrawalSum.value.total_amount_received
  return withdrawal.value.amount > estimatedAvailable
})

// ===== ACTION STATE =====
const isApproveOpen = ref(false)
const isRejectOpen = ref(false)
const adminFeeInput = ref<number>(0)
const rejectReason = ref('')
const actionLoading = ref(false)
const actionError = ref<string | null>(null)

function openApprove() {
  adminFeeInput.value = 0
  actionError.value = null
  isApproveOpen.value = true
}

function openReject() {
  rejectReason.value = ''
  actionError.value = null
  isRejectOpen.value = true
}

async function handleApprove() {
  if (!withdrawal.value) return
  if (adminFeeInput.value < 0) {
    actionError.value = 'Biaya admin tidak boleh negatif.'
    return
  }
  if (adminFeeInput.value >= withdrawal.value.amount) {
    actionError.value = 'Biaya admin tidak boleh melebihi jumlah penarikan.'
    return
  }

  try {
    actionLoading.value = true
    actionError.value = null
    await approveWithdrawal(withdrawal.value.id, adminFeeInput.value)
    toast.add({
      title: 'Transfer Ditandai Selesai',
      description: `Seller menerima ${formatRp(withdrawal.value.amount - adminFeeInput.value)}.`,
      color: 'success',
      icon: 'mdi:bank-transfer',
    })
    isApproveOpen.value = false
    await refresh()
  } catch (err: any) {
    actionError.value = err.statusMessage || 'Gagal memproses penarikan.'
  } finally {
    actionLoading.value = false
  }
}

async function handleReject() {
  if (!withdrawal.value) return
  if (!rejectReason.value.trim()) {
    actionError.value = 'Alasan penolakan harus diisi.'
    return
  }

  try {
    actionLoading.value = true
    actionError.value = null
    await rejectWithdrawal(withdrawal.value.id, rejectReason.value.trim())
    toast.add({
      title: 'Penarikan Ditolak',
      description: 'Permintaan penarikan telah ditolak.',
      color: 'warning',
      icon: 'mdi:close-circle',
    })
    isRejectOpen.value = false
    await refresh()
  } catch (err: any) {
    actionError.value = err.statusMessage || 'Gagal menolak penarikan.'
  } finally {
    actionLoading.value = false
  }
}
</script>
