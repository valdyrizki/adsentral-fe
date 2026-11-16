<template>
  <div class="space-y-6">
    <UCard class="shadow-sm">
      <div class="flex flex-col sm:flex-row gap-3 sm:items-center">
        <USelect v-model="filterStatus" :items="statusOptions" class="sm:w-48" />
        <UInput v-model="transactionInput" icon="mdi:magnify" placeholder="ID transaksi" class="sm:w-56" />
        <UBadge v-if="merchantId" color="neutral" variant="subtle" class="cursor-pointer" @click="clearMerchant">
          Filter toko #{{ merchantId }} ✕
        </UBadge>
        <UButton icon="mdi:refresh" color="neutral" variant="outline" class="sm:ml-auto" @click="refresh()">Refresh</UButton>
      </div>
    </UCard>

    <ClientOnly>
      <template #fallback>
        <USkeleton class="h-40 w-full" />
      </template>
      <UCard class="shadow-sm">
        <AppLoadingSkeleton v-if="pending" />
        <UAlert
          v-else-if="error"
          color="error"
          icon="mdi:alert-circle"
          title="Terjadi Kesalahan"
          :description="apiErrorMessage(error, 'Gagal memuat garansi')"
        />
        <div v-else-if="!items.length" class="py-10 text-center text-gray-400 text-sm">
          <UIcon name="mdi:shield-check-outline" class="text-3xl mb-2" />
          <p>Tidak ada klaim garansi untuk filter ini.</p>
        </div>
        <div v-else class="divide-y divide-gray-100">
          <div v-for="g in items" :key="g.id" class="py-3 flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div class="min-w-0 flex-1 space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-semibold text-gray-800">{{ g.id }}</span>
                <UBadge :color="statusColor(g.status)" variant="subtle" size="xs">{{ statusLabel(g.status) }}</UBadge>
              </div>
              <p class="text-xs text-gray-500">
                {{ g.merchant_name }} · pembeli {{ g.buyer_name }} · {{ g.product?.name }}
              </p>
              <p class="text-sm text-gray-700 line-clamp-2">{{ g.complain_description }}</p>
            </div>
            <div class="sm:text-right text-xs text-gray-500 flex-shrink-0 space-y-1">
              <p>Diajukan {{ formatDate(g.created_at) }}</p>
              <p v-if="g.status === 'IN_REVIEW' && g.review_deadline">Batas review {{ formatDate(g.review_deadline) }}</p>
              <NuxtLink v-if="g.transaction?.id" :to="`/admin/order/${g.transaction.id}`" class="text-primary-600 hover:underline">
                Transaksi {{ g.transaction.id }}
              </NuxtLink>
            </div>
          </div>
        </div>

        <div v-if="data && data.total_pages > 1" class="flex justify-center pt-4">
          <UPagination
            :page="page + 1"
            :total="data.total_elements"
            :items-per-page="perPage"
            :sibling-count="1"
            show-edges
            @update:page="(p) => { page = p - 1 }"
          />
        </div>
      </UCard>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { useAdminSellerApi } from '~/composables/api/admin-seller'
import type { GuaranteeResponse, GuaranteeStatus } from '~/types/guarantee/GuaranteeResponse'
import type { PageResponse } from '~/types/PageResponse'

// Daftar klaim garansi untuk CS (EP06-08); filter toko bisa datang dari detail seller (?merchant_id=)
definePageMeta({ layout: 'admin', label: 'Garansi' })

const route = useRoute()
const router = useRouter()
const { fetchAdminGuarantees } = useAdminSellerApi()

// ===== FILTER & PAGINATION =====
const page = ref(0)
const perPage = 20
const statusOptions = [
  { label: 'Semua status', value: 'ALL' },
  { label: 'Menunggu review', value: 'IN_REVIEW' },
  { label: 'Diproses', value: 'IN_PROGRESS' },
  { label: 'Selesai', value: 'DONE' },
  { label: 'Ditolak', value: 'REJECTED' },
]
const filterStatus = ref<GuaranteeStatus | 'ALL'>('ALL')
const merchantId = computed(() => {
  const v = Number(route.query.merchant_id)
  return Number.isInteger(v) && v > 0 ? v : undefined
})
const transactionInput = ref('')
const transactionId = ref('')
let debounce: ReturnType<typeof setTimeout> | undefined
watch(transactionInput, (v) => {
  clearTimeout(debounce)
  debounce = setTimeout(() => {
    transactionId.value = v.trim()
    page.value = 0
  }, 400)
})
watch([filterStatus, merchantId], () => { page.value = 0 })

function clearMerchant() {
  router.replace({ query: { ...route.query, merchant_id: undefined } })
}

// ===== FETCH =====
const { data, pending, error, refresh } = useAsyncData<PageResponse<GuaranteeResponse>>(
  'admin-guarantees',
  () => fetchAdminGuarantees({
    page: page.value,
    size: perPage,
    status: filterStatus.value,
    merchantId: merchantId.value,
    transactionId: transactionId.value || undefined,
  }),
  { watch: [page, filterStatus, merchantId, transactionId], server: false },
)
const items = computed(() => data.value?.content ?? [])

// ===== HELPERS =====
const formatDate = (v: string) => dayjs(v).format('DD MMM YYYY, HH:mm')
const statusLabel = (s: GuaranteeStatus) =>
  ({ IN_REVIEW: 'Menunggu review', IN_PROGRESS: 'Diproses', DONE: 'Selesai', REJECTED: 'Ditolak' } as const)[s] ?? s
const statusColor = (s: GuaranteeStatus) =>
  s === 'DONE' ? 'success' : s === 'REJECTED' ? 'error' : s === 'IN_PROGRESS' ? 'info' : 'warning'
</script>
