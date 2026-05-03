<template>
  <div class="w-full">
    <div class="m-1 sm:m-3 border rounded-2xl border-blue-200 bg-gray-100">
      <div class="p-4 md:p-6">

        <UBreadcrumb :items="breadcrumb" class="mb-4" />
        <h1 class="text-2xl font-bold text-gray-800 mb-1">Riwayat Pembayaran</h1>
        <p class="text-gray-500 text-sm mb-6">Semua transaksi pembayaran yang pernah Anda lakukan.</p>

        <!-- Filter -->
        <div class="flex flex-col sm:flex-row gap-3 mb-6">
          <UInput
            v-model="search"
            placeholder="Cari ID pembayaran..."
            icon="i-heroicons-magnifying-glass"
            class="flex-1"
            clearable
            @keyup.enter="handleSearch"
          />
          <USelect
            v-model="perPageValue"
            :items="perPageItems"
            class="w-full sm:w-28"
          />
        </div>

        <!-- Loading -->
        <AppLoadingSkeleton v-if="pending" />

        <!-- Error -->
        <UAlert
          v-else-if="error"
          title="Terjadi Kesalahan"
          :description="error.message || 'Gagal memuat data pembayaran'"
          icon="icon-park-solid:error"
          color="error"
          class="mb-4"
        />

        <!-- Empty -->
        <UAlert
          v-else-if="!payments?.content?.length"
          title="Belum ada pembayaran"
          description="Riwayat pembayaran Anda akan muncul di sini."
          icon="ix:anomaly-found"
          color="neutral"
        />

        <!-- List -->
        <div v-else class="space-y-3">
          <div
            v-for="payment in payments.content"
            :key="payment.id"
            class="bg-white rounded-2xl border border-blue-100 p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div class="flex flex-col sm:flex-row sm:items-center gap-3">

              <!-- Icon -->
              <div
                :class="`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${payment.payment_type === 'DEPOSIT' ? 'bg-green-100' : 'bg-primary/10'}`"
              >
                <UIcon
                  :name="payment.payment_type === 'DEPOSIT' ? 'i-heroicons-arrow-down-circle' : 'i-heroicons-shopping-bag'"
                  :class="`text-xl ${payment.payment_type === 'DEPOSIT' ? 'text-green-600' : 'text-primary'}`"
                />
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <p class="text-sm font-semibold text-gray-800 truncate">#{{ payment.id }}</p>
                  <UBadge
                    :color="payment.payment_type === 'DEPOSIT' ? 'success' : 'primary'"
                    variant="subtle"
                    size="xs"
                  >
                    {{ payment.payment_type === 'DEPOSIT' ? 'Deposit' : 'Transaksi' }}
                  </UBadge>
                  <UBadge v-if="payment.payment_method" color="info" variant="soft" size="xs">
                    {{ payment.payment_method.payment_gateway }}
                  </UBadge>
                </div>
                <p class="text-xs text-gray-400">
                  {{ payment.user?.full_name ?? payment.user?.username ?? '-' }}
                  · {{ dayjs(payment.created_at).format('DD MMM YYYY, HH:mm') }}
                </p>
              </div>

              <!-- Amount & Status -->
              <div class="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1">
                <p class="text-base font-bold text-gray-800">Rp {{ payment.amount.toLocaleString('id-ID') }}</p>
                <PaymentStatusBadge :status="payment.status" />
              </div>

              <!-- Proof & Action -->
              <div class="flex flex-col gap-2 items-end sm:ml-2 flex-shrink-0">
                <UButton
                  v-if="payment.payment_proof_url"
                  :to="config.public.backendUrl + '/' + payment.payment_proof_url"
                  target="_blank"
                  size="xs"
                  variant="soft"
                  color="info"
                  icon="i-heroicons-photo"
                >
                  Lihat Bukti
                </UButton>
                <UButton
                  :to="`/payment/${payment.id}`"
                  size="xs"
                  variant="outline"
                  color="primary"
                  icon="i-heroicons-eye"
                >
                  Detail
                </UButton>
              </div>

            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div
          v-if="payments && payments.total_pages > 1 && !pending"
          class="flex justify-center items-center pt-6"
        >
          <UPagination
            :page="page + 1"
            :total="payments.total_elements"
            :items-per-page="perPageValue"
            :sibling-count="1"
            show-edges
            @update:page="onPageChange"
          />
        </div>

      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import PaymentStatusBadge from '~/components/app/PaymentStatusBadge.vue'
import { usePaymentApi } from '~/composables/api/payment'
import type { PageResponse } from '~/types/PageResponse'
import type { PaymentResponse } from '~/types/payment/PaymentResponse'

definePageMeta({ layout: 'default' })

useHead({ title: 'Riwayat Pembayaran — Adsentral' })

const config = useRuntimeConfig()
const { fetchMyPayments } = usePaymentApi()

const breadcrumb = [
  { label: 'Home', icon: 'i-lucide-home', to: '/' },
  { label: 'Riwayat Pembayaran', icon: 'i-heroicons-credit-card' },
]

const page = ref(0)
const perPageValue = ref(20)
const perPageItems = [10, 20, 50]
const search = ref('')
const keyword = ref('')

let searchTimeout: ReturnType<typeof setTimeout> | null = null

const {
  data: payments,
  pending,
  error,
  refresh,
} = await useAsyncData<PageResponse<PaymentResponse>>(
  () => `my-payments-${page.value}-${perPageValue.value}-${keyword.value}`,
  () => fetchMyPayments(page.value, perPageValue.value, keyword.value),
  { watch: [page, perPageValue], server: false }
)

watch(search, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    keyword.value = val
    page.value = 0
    refresh()
  }, 500)
})

function handleSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  keyword.value = search.value
  page.value = 0
  refresh()
}

function onPageChange(newPage: number) {
  page.value = newPage - 1
}
</script>
