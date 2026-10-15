<template>
  <div class="space-y-6">

    <!-- Merchant Info Bar -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-blue-100 rounded-2xl p-4 shadow-sm">
      <div class="flex items-center gap-3">
        <ClientOnly>
          <img
            v-if="merchantStore.merchant"
            :src="getImageUrl(merchantStore.merchant.logo_url)"
            class="w-12 h-12 rounded-xl object-cover border border-gray-200"
            alt="logo toko"
          />
        <div v-else class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
          <UIcon name="material-symbols:store" class="text-primary text-2xl" />
        </div>
        <div>
          <p class="font-bold text-gray-800 text-lg">{{ merchantStore.merchant?.name ?? 'Toko Saya' }}</p>
          <p class="text-xs text-gray-400">{{ user }}</p>
        </div>
        
        </ClientOnly>
      </div>
      <div class="flex gap-2 flex-wrap">
        <UButton
          v-if="merchantStore.merchant"
          :to="`/merchant/${merchantStore.merchant.id}`"
          size="sm"
          icon="material-symbols:storefront-outline"
          variant="outline"
          color="primary"
        >
          Lihat Toko
        </UButton>
        <UButton to="/seller/product/create" size="sm" icon="i-heroicons-plus" color="primary">
          Tambah Produk
        </UButton>
        <UButton to="/seller/order" size="sm" icon="i-lucide-package" variant="outline" color="primary">
          Lihat Pesanan
        </UButton>
      </div>
    </div>

    <!-- Ringkasan: Keuangan, Pesanan, Produk (masing-masing endpoint sendiri, dimuat paralel) -->
    <ClientOnly>
      <template #fallback>
        <div class="space-y-6">
          <UCard v-for="i in 3" :key="i" class="shadow-sm">
            <template #header><USkeleton class="h-5 w-40 rounded" /></template>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <USkeleton v-for="j in 3" :key="j" class="h-20 rounded-xl" />
            </div>
          </UCard>
        </div>
      </template>
      <div class="space-y-6">
        <SellerSummaryCard
          title="Ringkasan Keuangan"
          icon="i-heroicons-banknotes"
          :pending="financePending"
          :error="financeError"
          grid-class="grid-cols-1 sm:grid-cols-3"
          @retry="refreshFinance()"
        >
          <SellerSummaryTile
            v-for="item in financeItems"
            :key="item.label"
            v-bind="item"
          />
        </SellerSummaryCard>

        <SellerSummaryCard
          title="Ringkasan Pesanan"
          icon="i-lucide-package"
          :pending="orderSummaryPending"
          :error="orderSummaryError"
          grid-class="grid-cols-2 lg:grid-cols-3"
          :skeleton-count="6"
          @retry="refreshOrderSummary()"
        >
          <SellerSummaryTile
            v-for="item in sellerOrderSummaryItems"
            :key="item.key"
            :label="item.label"
            :value="orderSummary?.[item.key] ?? 0"
            :icon="item.icon"
            :color="item.color"
            :bg-color="item.bgColor"
            :to="item.to"
          />
        </SellerSummaryCard>

        <SellerSummaryCard
          title="Ringkasan Produk"
          icon="i-lucide-box"
          :pending="productSummaryPending"
          :error="productSummaryError"
          @retry="refreshProductSummary()"
        >
          <SellerSummaryTile
            v-for="item in productItems"
            :key="item.label"
            v-bind="item"
          />
        </SellerSummaryCard>
      </div>
    </ClientOnly>

    <!-- Penalty Status Card -->
    <UCard v-if="penaltyStat && (penaltyStat.suspend_status !== 'NONE' || (merchantStore.merchant?.penalty_points ?? 0) > 0)"
      class="shadow-sm border"
      :class="{
        'border-red-200 bg-red-50': penaltyStat.suspend_status === 'PERMANENT' || penaltyStat.suspend_status === 'TEMPORARY',
        'border-orange-200 bg-orange-50': penaltyStat.suspend_status === 'WARNING' || (penaltyStat.suspend_status === 'NONE' && penaltyStat.active_points > 0),
      }"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-heroicons-shield-exclamation" class="text-lg text-gray-500" />
          <p class="font-semibold text-gray-800">Status Penalty Akun</p>
        </div>
      </template>
      <div class="flex items-center gap-4">
        <div
          class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
          :class="{
            'bg-red-100': penaltyStat.suspend_status === 'PERMANENT' || penaltyStat.suspend_status === 'TEMPORARY',
            'bg-orange-100': penaltyStat.suspend_status === 'WARNING',
            'bg-green-100': penaltyStat.suspend_status === 'NONE',
          }"
        >
          <UIcon
            :name="penaltyStat.suspend_status === 'PERMANENT' ? 'i-heroicons-x-circle'
              : penaltyStat.suspend_status === 'TEMPORARY' ? 'i-heroicons-no-symbol'
              : penaltyStat.suspend_status === 'WARNING' ? 'i-heroicons-exclamation-triangle'
              : 'i-heroicons-shield-check'"
            class="text-2xl"
            :class="{
              'text-red-500': penaltyStat.suspend_status === 'PERMANENT' || penaltyStat.suspend_status === 'TEMPORARY',
              'text-orange-500': penaltyStat.suspend_status === 'WARNING',
              'text-green-500': penaltyStat.suspend_status === 'NONE',
            }"
          />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="text-sm font-semibold text-gray-800">
              {{
                penaltyStat.suspend_status === 'PERMANENT' ? 'Suspend Permanen' :
                penaltyStat.suspend_status === 'TEMPORARY' ? 'Suspend Sementara' :
                penaltyStat.suspend_status === 'WARNING' ? 'Peringatan' :
                'Normal'
              }}
            </p>
            <UBadge
              :color="penaltyStat.suspend_status === 'PERMANENT' || penaltyStat.suspend_status === 'TEMPORARY' ? 'error'
                : penaltyStat.suspend_status === 'WARNING' ? 'warning'
                : 'success'"
              variant="subtle"
              size="xs"
            >
              {{ merchantStore.merchant?.penalty_points ?? 0 }} poin aktif
            </UBadge>
            <UBadge v-if="penaltyStat.verified_seller" color="primary" variant="subtle" size="xs" icon="mdi:check-decagram">
              Seller Terverifikasi
            </UBadge>
          </div>
          <p class="text-xs text-gray-400 mt-1">
            {{
              penaltyStat.suspend_status === 'PERMANENT'
                ? 'Akun Anda disuspend permanen. Hubungi admin untuk informasi lebih lanjut.'
                : penaltyStat.suspend_status === 'TEMPORARY' && penaltyStat.suspend_until
                ? `Disuspend hingga ${dayjs(penaltyStat.suspend_until).format('DD MMM YYYY')}. Aktivitas toko dibatasi.`
                : penaltyStat.suspend_status === 'WARNING'
                ? 'Anda memiliki poin penalty aktif. Pelanggaran lebih lanjut dapat menyebabkan suspensi.'
                : 'Akun Anda dalam kondisi baik. Tidak ada penalty aktif.'
            }}
          </p>
        </div>
      </div>
    </UCard>

    <!-- Balance Card -->
    <ClientOnly>
      <template #fallback>
        <UCard class="shadow-sm overflow-hidden">
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <UIcon name="i-heroicons-banknotes" class="text-primary text-lg" />
                <p class="font-semibold text-gray-800">Informasi Saldo</p>
              </div>
            </div>
          </template>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <USkeleton v-for="i in 3" :key="i" class="h-40 rounded-2xl" />
          </div>
        </UCard>
      </template>
      <UCard class="shadow-sm overflow-hidden">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon name="i-heroicons-banknotes" class="text-primary text-lg" />
              <p class="font-semibold text-gray-800">Informasi Saldo</p>
            </div>
            <div class="flex items-center gap-2">
              <UButton
                size="xs"
                icon="mdi:refresh"
                color="neutral"
                variant="outline"
                :loading="balanceLoading"
                @click="balanceStore.loadBalance({ force: true })"
              >
                Refresh
              </UButton>
              <UButton size="xs" to="/seller/balance" variant="soft" color="primary" trailing-icon="i-heroicons-arrow-right">
                Kelola Saldo
              </UButton>
            </div>
          </div>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">

          <!-- Saldo Jualan (bisa ditarik) -->
          <div class="bg-gradient-to-br from-primary to-teal-600 rounded-2xl p-5 text-white">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <UIcon name="i-heroicons-check-circle" class="text-white text-base" />
              </div>
              <p class="text-sm font-medium text-white/80">Saldo Jualan</p>
            </div>
            <USkeleton v-if="balanceLoading" class="h-8 w-36 rounded-lg bg-white/30 mb-1" />
            <p v-else class="text-2xl font-bold">{{ formatRp(balanceStore.salesBalance) }}</p>
            <p class="text-xs text-white/60 mt-1">Tersedia untuk ditarik</p>
            <UButton
              size="xs"
              color="primary"
              variant="solid"
              icon="mdi:cash-minus"
              class="mt-3 border-white/30 text-white hover:bg-white/10"
              @click="isWithdrawalOpen = true"
            >
              Tarik Dana
            </UButton>
          </div>

          <!-- Saldo Belanja (dari top up) -->
          <div class="bg-sky-50 border border-sky-200 rounded-2xl p-5">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                <UIcon name="i-heroicons-shopping-bag" class="text-sky-500 text-base" />
              </div>
              <p class="text-sm font-medium text-sky-700">Saldo Belanja</p>
            </div>
            <USkeleton v-if="balanceLoading" class="h-8 w-36 rounded-lg bg-sky-200 mb-1" />
            <p v-else class="text-2xl font-bold text-sky-700">{{ formatRp(balanceStore.depositBalance) }}</p>
            <p class="text-xs text-sky-500 mt-1">Hasil top up, hanya bisa dipakai belanja</p>
          </div>

          <!-- Dana Tertahan -->
          <div class="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div class="flex items-center gap-2 mb-3">
              <div class="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <UIcon name="i-heroicons-lock-closed" class="text-amber-500 text-base" />
              </div>
              <p class="text-sm font-medium text-amber-700">Dana Tertahan</p>
            </div>
            <USkeleton v-if="balanceLoading" class="h-8 w-36 rounded-lg bg-amber-200 mb-1" />
            <p v-else class="text-2xl font-bold text-amber-700">{{ formatRp(balanceStore.salesHeld) }}</p>
            <p class="text-xs text-amber-500 mt-1">Escrow belum cair / penarikan diproses</p>
            <div class="mt-3 flex items-center gap-1 text-xs text-amber-600">
              <UIcon name="i-heroicons-information-circle" class="text-sm" />
              Dana akan cair otomatis saat pesanan selesai
            </div>
          </div>

        </div>
      </UCard>
    </ClientOnly>

    <UModal v-model:open="isWithdrawalOpen" title="Tarik Dana">
      <template #body>
        <FormWithdrawal @withdrawal-success="handleWithdrawalSuccess" />
      </template>
    </UModal>

    <!-- Chart & Status Summary -->
    <ClientOnly>
      <template #fallback>
        <div class="grid grid-cols-1 gap-6">
          <UCard class="shadow-sm">
            <template #header>
              <div class="flex items-center justify-between">
                <p class="font-semibold text-gray-800">Grafik Pendapatan</p>
                <span class="text-xs text-gray-400">6 bulan terakhir · dari 20 pesanan terbaru</span>
              </div>
            </template>
            <USkeleton class="h-64 w-full rounded-lg" />
          </UCard>
        </div>
      </template>
      <div class="grid grid-cols-1 gap-6">

        <!-- Sales Chart -->
        <UCard class="shadow-sm">
          <template #header>
            <div class="flex items-center justify-between">
              <p class="font-semibold text-gray-800">Grafik Pendapatan</p>
              <span class="text-xs text-gray-400">6 bulan terakhir · dari 20 pesanan terbaru</span>
            </div>
          </template>
          <div class="h-64">
            <USkeleton v-if="pending" class="h-full w-full rounded-lg" />
            <UChart
              v-else-if="chartData"
              type="line"
              :data="chartData"
              :options="{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: {
                    ticks: { callback: (v: number | string) => 'Rp ' + Number(v).toLocaleString('id-ID') }
                  }
                }
              }"
            />
          </div>
        </UCard>

      </div>
    </ClientOnly>

    <!-- Recent Orders -->
    <ClientOnly>
      <template #fallback>
        <UCard class="shadow-sm">
          <template #header>
            <div class="flex items-center justify-between">
              <p class="font-semibold text-gray-800">Pesanan Terbaru</p>
              <UButton to="/seller/order" size="sm" variant="ghost" trailing-icon="i-heroicons-arrow-right">
                Lihat semua
              </UButton>
            </div>
          </template>
          <AppLoadingSkeleton />
        </UCard>
      </template>
      <UCard class="shadow-sm">
        <template #header>
          <div class="flex items-center justify-between">
            <p class="font-semibold text-gray-800">Pesanan Terbaru</p>
            <UButton to="/seller/order" size="sm" variant="ghost" trailing-icon="i-heroicons-arrow-right">
              Lihat semua
            </UButton>
          </div>
        </template>

        <AppLoadingSkeleton v-if="pending" />

        <UAlert
          v-else-if="error"
          title="Gagal memuat data"
          :description="error.message"
          color="error"
          icon="mdi:alert-circle:error"
        />

        <div v-else-if="!recentOrders.length" class="py-8 text-center text-gray-400 text-sm">
          Belum ada pesanan masuk.
        </div>

        <div v-else class="divide-y divide-gray-100">
          <div
            v-for="tx in recentOrders"
            :key="tx.id"
            class="flex items-center gap-3 py-3 hover:bg-gray-50 rounded-xl px-2 transition-colors"
          >
            <img
              :src="getImageUrl(tx.product?.banner_url)"
              :alt="tx.product?.name"
              class="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-gray-100"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 truncate">{{ tx.product?.name }}</p>
              <p class="text-xs text-gray-400">
                {{ tx.buyer_username }} · {{ dayjs(tx.created_at).format('DD MMM YYYY') }}
              </p>
            </div>
            <div class="flex flex-col items-end gap-1 flex-shrink-0">
              <p class="text-sm font-semibold text-gray-800">
                Rp {{ tx.total_price.toLocaleString('id-ID') }}
              </p>
              <TransactionStatusBadge :status="tx.status" />
            </div>
            <UButton :to="`/seller/order/${tx.id}`" size="xs" variant="ghost" icon="i-heroicons-eye" />
          </div>
        </div>
      </UCard>
    </ClientOnly>

    <!-- Quick Actions -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <NuxtLink
        v-for="action in quickActions"
        :key="action.label"
        :to="action.to"
        :class="`flex flex-col items-center justify-center gap-2 bg-white border border-blue-100 rounded-2xl p-5 shadow-sm hover:border-primary hover:shadow-md transition-all text-center group`"
      >
        <div :class="`w-11 h-11 rounded-xl flex items-center justify-center ${action.bgColor}`">
          <UIcon :name="action.icon" :class="`text-xl ${action.iconColor}`" />
        </div>
        <p class="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">{{ action.label }}</p>
      </NuxtLink>
    </div>

  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import TransactionStatusBadge from '~/components/app/TransactionStatusBadge.vue'
import { useTransactionApi } from '~/composables/api/transaction'
import { usePenaltyApi } from '~/composables/api/penalty'
import { useSellerSummaryApi } from '~/composables/api/seller-summary'
import type { MyPenaltyStat } from '~/composables/api/penalty'
import type { PageResponse } from '~/types/PageResponse'
import type { TransactionResponse } from '~/types/TransactionResponse'

definePageMeta({ layout: 'seller', label: 'Dashboard' })

const merchantStore = useMerchantStore()
const authStore = useAuthStore()
const balanceStore = useBalanceStore()
const user = computed(() => authStore.user?.username ?? '-')
const { fetchTxSeller } = useTransactionApi()
const { fetchMyPenaltyStat } = usePenaltyApi()
const { fetchOrderSummary, fetchProductSummary, fetchFinanceSummary } = useSellerSummaryApi()

// ===== RINGKASAN (paralel, tidak di-await, tanpa polling) =====
const {
  data: financeSummary,
  pending: financePending,
  error: financeError,
  refresh: refreshFinance,
} = useAsyncData('seller-dashboard-finance-summary', fetchFinanceSummary, { server: false })

const {
  data: orderSummary,
  pending: orderSummaryPending,
  error: orderSummaryError,
  refresh: refreshOrderSummary,
} = useAsyncData('seller-dashboard-order-summary', fetchOrderSummary, { server: false })

const {
  data: productSummary,
  pending: productSummaryPending,
  error: productSummaryError,
  refresh: refreshProductSummary,
} = useAsyncData('seller-dashboard-product-summary', fetchProductSummary, { server: false })

const financeItems = computed(() => [
  { label: 'Transaksi Hari Ini', value: formatRupiah(financeSummary.value?.today_transaction_amount), icon: 'i-heroicons-sun', color: 'text-sky-500', bgColor: 'bg-sky-50' },
  { label: 'Seluruh Pendapatan Bersih', value: formatRupiah(financeSummary.value?.total_income), icon: 'i-heroicons-banknotes', color: 'text-green-500', bgColor: 'bg-green-50' },
  { label: 'Pendapatan yang sudah ditarik', value: formatRupiah(financeSummary.value?.withdrawn), icon: 'mdi:cash-check', color: 'text-teal-500', bgColor: 'bg-teal-50', to: '/seller/balance' },
])

const productItems = computed(() => [
  { label: 'Produk Aktif', value: productSummary.value?.active ?? 0, icon: 'i-heroicons-check-circle', color: 'text-green-500', bgColor: 'bg-green-50', to: '/seller/product' },
  { label: 'Produk sedang direview', value: productSummary.value?.in_review ?? 0, icon: 'i-heroicons-clock', color: 'text-blue-500', bgColor: 'bg-blue-50', to: '/seller/product' },
  { label: 'Produk diblokir', value: productSummary.value?.blocked ?? 0, icon: 'i-heroicons-no-symbol', color: 'text-red-500', bgColor: 'bg-red-50', to: '/seller/product' },
])

const { data: penaltyStat } = await useAsyncData<MyPenaltyStat | null>(
  'seller-dashboard-penalty',
  async () => {
    if (!authStore.accessToken) return null
    return await fetchMyPenaltyStat()
  },
  { server: false, watch: [() => authStore.accessToken] }
)

// Load merchant info & balance
await Promise.allSettled([
  merchantStore.setMyMerchant(),
  balanceStore.loadBalance(),
])

const { pending: balanceLoading } = useAsyncData(
  'seller-dashboard-balance',
  () => balanceStore.loadBalance({ force: true }),
  { server: false }
)

const isWithdrawalOpen = ref(false)

function handleWithdrawalSuccess() {
  isWithdrawalOpen.value = false
  balanceStore.loadBalance({ force: true })
  refreshFinance()
}

function formatRp(val: number) {
  return 'Rp ' + val.toLocaleString('id-ID')
}

// Fetch recent seller transactions (last 20 for stats + table)
const {
  data: txData,
  pending,
  error,
} = await useAsyncData<PageResponse<TransactionResponse>>(
  'seller-dashboard-tx',
  () => fetchTxSeller(0, 20, ''),
  { server: false }
)

const recentOrders = computed(() => txData.value?.content?.slice(0, 8) ?? [])

// ===== CHART — group DONE/COMPLETE by month (last 6 months) =====
const chartData = computed(() => {
  const list = txData.value?.content ?? []
  const months = Array.from({ length: 6 }, (_, i) =>
    dayjs().subtract(5 - i, 'month')
  )
  const labels = months.map(m => m.format('MMM YYYY'))
  const data = months.map(m => {
    return list
      .filter(t =>
        ['DONE', 'COMPLETE'].includes(t.status) &&
        dayjs(t.created_at).format('MMM YYYY') === m.format('MMM YYYY')
      )
      .reduce((sum, t) => sum + t.total_price, 0)
  })

  return {
    labels,
    datasets: [
      {
        label: 'Pendapatan',
        data,
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }
})

// ===== QUICK ACTIONS =====
const quickActions = [
  { label: 'Tambah Produk', to: '/seller/product/create', icon: 'i-heroicons-plus-circle', bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
  { label: 'Kelola Produk', to: '/seller/product', icon: 'i-lucide-package', bgColor: 'bg-purple-50', iconColor: 'text-purple-500' },
  { label: 'Kelola Pesanan', to: '/seller/order', icon: 'i-lucide-shopping-cart', bgColor: 'bg-green-50', iconColor: 'text-green-500' },
  { label: 'Chat Pembeli', to: '/seller/chat', icon: 'mdi:chat', bgColor: 'bg-yellow-50', iconColor: 'text-yellow-500' },
]
</script>
