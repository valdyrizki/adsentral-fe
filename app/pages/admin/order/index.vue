<template>
  <div class="space-y-6">

    <!-- Filters -->
    <UCard class="shadow-sm">
      <div class="flex flex-col sm:flex-row gap-3">
        <UInput
          v-model="search"
          icon="i-heroicons-magnifying-glass"
          placeholder="Cari ID / produk..."
          class="flex-1"
          clearable
          @keyup.enter="handleSearchEnter"
        />
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

    <!-- List -->
    <ClientOnly>
      <template #fallback>
        <UCard class="shadow-sm">
          <div class="divide-y divide-gray-100">
            <div v-for="i in 5" :key="i" class="flex gap-4 py-4 px-2">
              <USkeleton class="w-20 h-20 rounded-xl flex-none" />
              <div class="flex-1 space-y-2">
                <USkeleton class="h-4 w-48 rounded" />
                <USkeleton class="h-3 w-32 rounded" />
                <USkeleton class="h-3 w-64 rounded" />
              </div>
            </div>
          </div>
        </UCard>
      </template>
    <UCard class="shadow-sm">
      <template #header>
        <p class="font-semibold text-gray-800">
          Semua Pesanan
          <span v-if="transactionPagination?.total_elements" class="text-xs text-gray-400 font-normal ml-2">
            ({{ transactionPagination.total_elements }} total)
          </span>
        </p>
      </template>

      <AppLoadingSkeleton v-if="pending" />

      <UAlert
        v-else-if="error"
        title="Terjadi Kesalahan"
        :description="error.message || 'Gagal memuat data pesanan'"
        icon="mdi:alert-circle:error"
        color="error"
      />

      <div v-else-if="!transactionPagination?.content?.length" class="py-10 text-center text-gray-400 text-sm">
        <UIcon name="i-heroicons-inbox" class="text-4xl text-gray-300 mb-3" />
        <p>Tidak ada pesanan ditemukan.</p>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="tx in transactionPagination.content"
          :key="tx.id"
          class="flex flex-row gap-4 py-4 px-2 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <!-- Product Image -->
          <div class="flex-none">
            <img
              :src="getImageUrl(tx.product?.banner_url)"
              :alt="tx.product?.name"
              class="w-20 h-20 rounded-xl object-cover border border-gray-100"
            />
          </div>

          <!-- Info -->
          <div class="flex-grow flex flex-col min-w-0">
            <div class="flex flex-col gap-0.5">
              <NuxtLink :to="`/admin/order/${tx.id}`" class="text-xs font-mono text-gray-400 hover:text-primary">
                #{{ tx.id }}
              </NuxtLink>
              <p class="text-sm font-semibold text-gray-800 truncate">{{ tx.product?.name }}</p>
              <p class="text-xs text-gray-500">
                {{ tx.buyer_username }} · {{ tx.qty }} pcs × Rp {{ tx.price.toLocaleString('id-ID') }}
              </p>
            </div>

            <div class="mt-auto flex flex-wrap gap-3 pt-3 text-xs text-gray-400">
              <span class="flex items-center gap-1">
                <UIcon name="fa6-solid:rupiah-sign" class="text-gray-400" />
                <span class="font-semibold text-gray-700">{{ tx.total_price.toLocaleString('id-ID') }}</span>
              </span>
              <span class="flex items-center gap-1">
                <UIcon name="mdi:calendar" />
                {{ dayjs(tx.created_at).format('DD MMM YYYY, HH:mm') }}
              </span>
              <span class="flex items-center gap-1">
                <UIcon name="mdi:cart" />
                {{ tx.product?.sold ?? 0 }} Terjual
              </span>
            </div>
          </div>

          <!-- Status + Actions -->
          <div class="ml-auto flex-none flex flex-col gap-2 items-end">
            <TransactionStatusBadge :status="tx.status" />

            <UButton
              :to="`/admin/order/${tx.id}`"
              size="xs"
              variant="ghost"
              color="neutral"
              icon="i-heroicons-eye"
              label="Detail"
            />

            <!-- <UButton
              v-if="tx.status === 'PAID'"
              icon="mdi:check-circle"
              size="xs"
              color="success"
              variant="soft"
              :loading="acceptingId === tx.id"
              @click="handleConfirmOrder(tx.id)"
            >
              Terima
            </UButton>

            <UButton
              v-if="['UNPAID', 'PAID'].includes(tx.status)"
              icon="mdi:close-circle"
              size="xs"
              color="error"
              variant="soft"
              :loading="rejectingId === tx.id"
              @click="openRejectModal(tx.id)"
            >
              Tolak
            </UButton> -->
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="transactionPagination && transactionPagination.total_pages > 1 && !pending"
        class="flex justify-center items-center pt-4"
      >
        <UPagination
          :page="page + 1"
          :total="transactionPagination.total_elements"
          :items-per-page="perPageValue"
          :sibling-count="1"
          show-edges
          @update:page="onPageChange"
        />
      </div>
    </UCard>
    </ClientOnly>

  </div>

  <RejectTxModal
    v-model="isRejectingModal"
    :loading="rejectingId === selectedTxId"
    :error="rejectError"
    @submit="handleReject"
  />
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import TransactionStatusBadge from '~/components/app/TransactionStatusBadge.vue'
import { useTransactionApi } from '~/composables/api/transaction'
import type { PageResponse } from '~/types/PageResponse'
import type { TransactionResponse } from '~/types/TransactionResponse'

definePageMeta({ layout: 'admin', label: 'Orders' })

const toast = useToast()
const { fetchAllTx, fetchConfirmTx, fetchRejectTx } = useTransactionApi()

// ===== FILTER STATE =====
const page = ref(0)
const perPageValue = ref(10)
const perPageItems = [5, 10, 25, 50]
const search = ref('')
const debouncedSearch = ref('')
const filterStatus = ref('')

const statusOptions = [
  { label: 'Semua Status', value: 'ALL' },
  { label: 'Belum Bayar', value: 'UNPAID' },
  { label: 'Sudah Bayar', value: 'PAID' },
  { label: 'Diproses', value: 'IN_PROGRESS' },
  { label: 'Selesai', value: 'DONE' },
  { label: 'Dibatalkan', value: 'CANCELLED' },
  { label: 'Ditolak', value: 'REJECTED' },
  { label: 'Arbitrage', value: 'ARBITRAGE' },
]

let searchTimeout: ReturnType<typeof setTimeout> | null = null

// ===== FETCH =====
const {
  data: transactionPagination,
  pending,
  error,
  refresh,
} = useAsyncData<PageResponse<TransactionResponse>>(
  'admin-all-tx',
  () => fetchAllTx(page.value, perPageValue.value, debouncedSearch.value, filterStatus.value),
  { watch: [page, perPageValue, debouncedSearch, filterStatus], server: false }
)

watch(search, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 0
    debouncedSearch.value = val
  }, 500)
})

function handleSearchEnter() {
  if (searchTimeout) clearTimeout(searchTimeout)
  page.value = 0
  debouncedSearch.value = search.value
}

function handleFilter() {
  page.value = 0
  refresh()
}

function onPageChange(newPage: number) {
  page.value = newPage - 1
}

// ===== CONFIRM =====
const acceptingId = ref<string | null>(null)

async function handleConfirmOrder(txId: string) {
  acceptingId.value = txId
  try {
    await fetchConfirmTx(txId)
    toast.add({ title: 'Pesanan diterima', color: 'success' })
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Gagal menerima pesanan', description: err.message, color: 'error' })
  } finally {
    acceptingId.value = null
  }
}

// ===== REJECT =====
const selectedTxId = ref<string | null>(null)
const rejectingId = ref<string | null>(null)
const isRejectingModal = ref(false)
const rejectError = ref<string | null>(null)

// function openRejectModal(txId: string) {
//   selectedTxId.value = txId
//   rejectError.value = null
//   isRejectingModal.value = true
// }

async function handleReject(reason: string) {
  if (!selectedTxId.value) return
  rejectingId.value = selectedTxId.value
  try {
    await fetchRejectTx(selectedTxId.value, reason)
    toast.add({ title: 'Pesanan ditolak', color: 'success' })
    isRejectingModal.value = false
    selectedTxId.value = null
    await refresh()
  } catch (err: any) {
    rejectError.value = err.message || 'Gagal menolak pesanan'
    toast.add({ title: 'Gagal menolak pesanan', description: err.message, color: 'error' })
  } finally {
    rejectingId.value = null
  }
}
</script>
