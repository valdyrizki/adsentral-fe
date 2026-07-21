<template>
  <div class="space-y-6">

    <ClientOnly>
      <template #fallback>
        <div class="space-y-4">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div v-for="i in 4" :key="i" class="bg-white border border-gray-200 rounded-xl p-4">
              <USkeleton class="h-3 w-24 rounded mb-2" />
              <USkeleton class="h-7 w-20 rounded" />
            </div>
          </div>
          <UCard class="shadow-sm"><AppLoadingSkeleton /></UCard>
        </div>
      </template>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard v-for="stat in statsCards" :key="stat.label" class="shadow-sm">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs text-gray-400 mb-1">{{ stat.label }}</p>
            <p class="text-xl font-bold text-gray-800">{{ stat.value }}</p>
          </div>
          <div :class="`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.bgColor}`">
            <UIcon :name="stat.icon" :class="`text-xl ${stat.iconColor}`" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Filters -->
    <UCard class="shadow-sm">
      <div class="flex flex-col sm:flex-row gap-3">
        <USelect
          v-model="filterStatus"
          :items="statusOptions"
          placeholder="Semua Status"
          value-key="value"
          class="w-full sm:w-52"
          @update:model-value="handleFilter"
        />
        <USelect v-model="perPageValue" :items="perPageItems" class="w-full sm:w-24" />
        <UButton icon="mdi:refresh" color="neutral" variant="outline" :loading="pending" @click="refresh()">
          Refresh
        </UButton>
      </div>
    </UCard>

    <!-- Table -->
    <UCard class="shadow-sm">
      <template #header>
        <div class="flex items-center justify-between">
          <p class="font-semibold text-gray-800">
            Semua Permintaan Penarikan
            <span v-if="withdrawals?.total_elements" class="text-xs text-gray-400 font-normal ml-2">
              ({{ withdrawals.total_elements }} total)
            </span>
          </p>
        </div>
      </template>

      <AppLoadingSkeleton v-if="pending" />

      <UAlert
        v-else-if="error"
        title="Terjadi Kesalahan"
        :description="error.message || 'Gagal memuat data'"
        icon="mdi:alert-circle:error"
        color="error"
      />

      <div v-else-if="!withdrawals?.content?.length" class="py-10 text-center text-gray-400 text-sm">
        <UIcon name="mdi:cash-remove" class="text-4xl text-gray-300 mb-3" />
        <p>Tidak ada data penarikan.</p>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="item in withdrawals.content"
          :key="item.id"
          class="py-4 px-2 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <div class="flex flex-col sm:flex-row gap-4">

            <!-- Icon + Info Seller -->
            <div class="flex gap-3 flex-1 min-w-0">
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

              <div class="flex-1 min-w-0">
                <!-- Seller -->
                <p class="text-sm font-semibold text-gray-800">{{ item.user.full_name ?? item.user.username }}</p>
                <p class="text-xs text-gray-400">{{ item.user.email }}</p>
                <!-- Bank -->
                <p class="text-xs text-gray-600 mt-1">{{ item.bank_name }} — {{ item.account_number }}</p>
                <p class="text-xs text-gray-400">a.n. {{ item.account_holder_name }}</p>
                <!-- Tanggal -->
                <p class="text-xs text-gray-400 mt-1">{{ dayjs(item.created_at).format('DD MMM YYYY, HH:mm') }}</p>
                <!-- Catatan seller -->
                <p v-if="item.notes" class="text-xs text-gray-400 italic mt-0.5">Catatan: {{ item.notes }}</p>
              </div>
            </div>

            <!-- Jumlah + Status + Aksi -->
            <div class="flex flex-col gap-2 sm:items-end sm:flex-shrink-0">
              <p class="text-lg font-bold text-gray-800">{{ formatRp(item.amount) }}</p>
              <UBadge
                :color="item.status === 'COMPLETED' ? 'success' : item.status === 'REJECTED' ? 'error' : item.status === 'CANCELLED' ? 'neutral' : 'warning'"
                variant="soft"
                size="sm"
              >
                {{ statusLabel(item.status) }}
              </UBadge>

              <!-- Rincian jika COMPLETED -->
              <div v-if="item.status === 'COMPLETED'" class="text-xs text-right text-gray-400 space-y-0.5">
                <p>Biaya admin: {{ formatRp(item.admin_fee) }}</p>
                <p class="text-green-600 font-medium">Diterima: {{ formatRp(item.amount_received) }}</p>
                <p v-if="item.processed_by">Oleh: {{ item.processed_by }}</p>
              </div>

              <!-- Estimasi biaya jika PENDING -->
              <div v-else-if="item.status === 'PENDING'" class="text-xs text-right text-gray-400 space-y-0.5">
                <p>Biaya admin (WD_FEE): {{ formatRp(wdFee) }}</p>
                <p class="text-green-600 font-medium">Estimasi diterima: {{ formatRp(item.amount - wdFee) }}</p>
              </div>

              <!-- Alasan jika REJECTED -->
              <div v-if="item.status === 'REJECTED' && item.admin_notes" class="text-xs text-right text-red-500 max-w-[200px]">
                <p>{{ item.admin_notes }}</p>
                <p v-if="item.processed_by" class="text-gray-400">Oleh: {{ item.processed_by }}</p>
              </div>

              <!-- Action buttons -->
              <div class="flex gap-2 mt-1 flex-wrap justify-end">
                <template v-if="item.status === 'PENDING'">
                  <UButton
                    size="xs"
                    color="success"
                    variant="soft"
                    icon="mdi:bank-transfer"
                    @click="openApprove(item)"
                  >
                    Tandai Selesai
                  </UButton>
                  <UButton
                    size="xs"
                    color="error"
                    variant="soft"
                    icon="mdi:close-circle"
                    @click="openReject(item)"
                  >
                    Tolak
                  </UButton>
                </template>
                <UButton
                  size="xs"
                  color="neutral"
                  variant="outline"
                  icon="mdi:eye"
                  :to="`/admin/withdrawal/${item.id}`"
                >
                  Detail
                </UButton>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="withdrawals && withdrawals.total_pages > 1 && !pending"
        class="flex justify-center items-center pt-4"
      >
        <UPagination
          :page="page + 1"
          :total="withdrawals.total_elements"
          :items-per-page="perPageValue"
          :sibling-count="1"
          show-edges
          @update:page="onPageChange"
        />
      </div>
    </UCard>
    </ClientOnly>

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

          <!-- Instruksi -->
          <UAlert
            title="Pastikan transfer sudah dilakukan"
            description="Tandai selesai hanya setelah Anda benar-benar mentransfer dana ke rekening seller di bawah ini."
            color="warning"
            icon="mdi:information-outline"
          />

          <div v-if="selectedItem" class="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-1">
            <p class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Transfer ke</p>
            <p class="text-sm font-semibold text-gray-800">{{ selectedItem.seller_name }}</p>
            <p class="text-sm text-gray-700">{{ selectedItem.bank_name }} — {{ selectedItem.account_number }}</p>
            <p class="text-xs text-gray-500">a.n. {{ selectedItem.account_holder_name }}</p>
            <p class="text-lg font-bold text-gray-800 mt-2">{{ formatRp(selectedItem.amount) }}</p>
          </div>

          <div class="flex justify-between items-center text-sm px-1">
            <span class="text-gray-400">Biaya Admin (otomatis)</span>
            <span class="font-semibold text-gray-700">{{ formatRp(wdFee) }}</span>
          </div>

          <div v-if="selectedItem" class="rounded-lg bg-green-50 border border-green-200 px-4 py-3 flex justify-between items-center">
            <span class="text-sm text-gray-600">Jumlah diterima seller</span>
            <span class="text-base font-bold text-green-700">{{ formatRp(selectedItem.amount - wdFee) }}</span>
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

          <div v-if="selectedItem" class="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-1">
            <p class="text-sm font-semibold text-gray-800">{{ selectedItem.seller_name }}</p>
            <p class="text-xs text-gray-500">{{ selectedItem.bank_name }} — {{ selectedItem.account_number }}</p>
            <p class="text-base font-bold text-gray-800 mt-2">{{ formatRp(selectedItem.amount) }}</p>
          </div>

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
import { useSystemSettingApi } from '~/composables/api/system-setting'
import type { AdminWithdrawalResponse } from '~/types/balance/AdminWithdrawalResponse'
import type { PageResponse } from '~/types/PageResponse'

definePageMeta({ layout: 'admin', label: 'Manajemen Penarikan Dana' })

const toast = useToast()
const { fetchAllWithdrawals, approveWithdrawal, rejectWithdrawal } = useAdminWithdrawalApi()
const { fetchAllSystemSetting } = useSystemSettingApi()

// ===== WD_FEE (biaya admin penarikan, otomatis dari system setting) =====
const { data: systemSettings } = await useAsyncData(
  'admin-withdrawal-system-settings',
  () => fetchAllSystemSetting(),
  { server: false }
)

const wdFee = computed(() => {
  const setting = (systemSettings.value ?? []).find(s => s.key === 'WD_FEE')
  const parsed = Number(setting?.value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 2500
})

// ===== FILTER =====
const page = ref(0)
const perPageValue = ref(20)
const perPageItems = [10, 20, 50, 100]
const filterStatus = ref('ALL')

const statusOptions = [
  { label: 'Semua Status', value: 'ALL' },
  { label: 'Menunggu', value: 'PENDING' },
  { label: 'Selesai', value: 'COMPLETED' },
  { label: 'Ditolak', value: 'REJECTED' },
  { label: 'Dibatalkan', value: 'CANCELLED' },
]

// ===== FETCH =====
const {
  data: withdrawals,
  pending,
  error,
  refresh,
} = await useAsyncData<PageResponse<AdminWithdrawalResponse>>(
  'admin-withdrawals',
  () => fetchAllWithdrawals(page.value, perPageValue.value, filterStatus.value),
  { watch: [page, perPageValue, filterStatus], server: false }
)

// ===== STATS =====
const statsCards = computed(() => {
  const list = withdrawals.value?.content ?? []
  const pending_ = list.filter(w => w.status === 'PENDING').length
  const completed = list.filter(w => w.status === 'COMPLETED').length
  const rejected = list.filter(w => w.status === 'REJECTED').length
  const totalAmount = list
    .filter(w => w.status === 'COMPLETED')
    .reduce((s, w) => s + w.amount_received, 0)

  return [
    { label: 'Menunggu', value: pending_.toString(), icon: 'mdi:clock-outline', bgColor: 'bg-amber-50', iconColor: 'text-amber-500' },
    { label: 'Selesai', value: completed.toString(), icon: 'mdi:check-circle', bgColor: 'bg-green-50', iconColor: 'text-green-500' },
    { label: 'Ditolak', value: rejected.toString(), icon: 'mdi:close-circle', bgColor: 'bg-red-50', iconColor: 'text-red-500' },
    { label: 'Total Dicairkan', value: formatRp(totalAmount), icon: 'mdi:cash-multiple', bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
  ]
})

// ===== HELPERS =====
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

function onPageChange(newPage: number) {
  page.value = newPage - 1
}

function handleFilter() {
  page.value = 0
  refresh()
}

// ===== ACTION STATE =====
const isApproveOpen = ref(false)
const isRejectOpen = ref(false)
const selectedItem = ref<AdminWithdrawalResponse | null>(null)
const rejectReason = ref('')
const actionLoading = ref(false)
const actionError = ref<string | null>(null)

function openApprove(item: AdminWithdrawalResponse) {
  selectedItem.value = item
  actionError.value = null
  isApproveOpen.value = true
}

function openReject(item: AdminWithdrawalResponse) {
  selectedItem.value = item
  rejectReason.value = ''
  actionError.value = null
  isRejectOpen.value = true
}

// ===== APPROVE =====
async function handleApprove() {
  if (!selectedItem.value) return
  if (wdFee.value >= selectedItem.value.amount) {
    actionError.value = 'Biaya admin (WD_FEE) tidak boleh melebihi jumlah penarikan.'
    return
  }

  try {
    actionLoading.value = true
    actionError.value = null
    await approveWithdrawal(selectedItem.value.id, wdFee.value)
    toast.add({
      title: 'Transfer Ditandai Selesai',
      description: `Seller menerima ${formatRp(selectedItem.value.amount - wdFee.value)}.`,
      color: 'success',
      icon: 'mdi:bank-transfer',
    })
    isApproveOpen.value = false
    await refresh()
  } catch (err: any) {
    actionError.value = err.statusMessage || 'Gagal menyetujui penarikan.'
  } finally {
    actionLoading.value = false
  }
}

// ===== REJECT =====
async function handleReject() {
  if (!selectedItem.value) return
  if (!rejectReason.value.trim()) {
    actionError.value = 'Alasan penolakan harus diisi.'
    return
  }

  try {
    actionLoading.value = true
    actionError.value = null
    await rejectWithdrawal(selectedItem.value.id, rejectReason.value.trim())
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
