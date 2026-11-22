<template>
  <div class="space-y-6">

    <!-- Welcome Bar -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-primary-100 rounded-2xl p-4 shadow-sm">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
          <UIcon name="i-lucide-shield-check" class="text-primary text-xl" />
        </div>
        <div>
          <p class="font-bold text-gray-800 text-lg">Selamat datang, {{ authStore.user?.full_name ?? authStore.user?.username ?? 'Admin' }}</p>
          <p class="text-xs text-gray-400">{{ authStore.user?.role }} · {{ authStore.user?.email }}</p>
        </div>
      </div>
      <div class="flex gap-2 flex-wrap">
        <UButton to="/admin/order" size="sm" icon="i-lucide-package" variant="outline" color="primary">Kelola Pesanan</UButton>
        <UButton to="/admin/product" size="sm" icon="i-lucide-box" color="primary">Kelola Produk</UButton>
      </div>
    </div>

    <ClientOnly>
      <template #fallback>
        <div class="space-y-6">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div v-for="i in 4" :key="i" class="bg-white border border-gray-200 rounded-xl p-4">
              <USkeleton class="h-3 w-24 rounded mb-2" />
              <USkeleton class="h-7 w-20 rounded" />
            </div>
          </div>
          <UCard class="shadow-sm"><div class="h-64"><AppLoadingSkeleton /></div></UCard>
          <UCard class="shadow-sm"><AppLoadingSkeleton /></UCard>
        </div>
      </template>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard v-for="stat in statsCards" :key="stat.label" class="shadow-sm">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs text-gray-400 mb-1">{{ stat.label }}</p>
            <p class="text-xl font-bold text-gray-800">{{ stat.value }}</p>
            <p v-if="stat.sub" class="text-xs text-gray-400 mt-0.5">{{ stat.sub }}</p>
          </div>
          <div :class="`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.bgColor}`">
            <UIcon :name="stat.icon" :class="`text-xl ${stat.iconColor}`" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Chart + Status Breakdown -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Revenue Chart -->
      <UCard class="lg:col-span-2 shadow-sm">
        <template #header>
          <div class="flex items-center justify-between">
            <p class="font-semibold text-gray-800">Grafik Transaksi Platform</p>
            <span class="text-xs text-gray-400">GMV 6 bulan terakhir</span>
          </div>
        </template>
        <div class="h-64">
          <UChart
            v-if="chartData"
            type="bar"
            :data="chartData"
            :options="{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                y: { ticks: { callback: (v: number | string) => 'Rp ' + Number(v).toLocaleString('id-ID') } }
              }
            }"
          />
        </div>
      </UCard>

      <!-- Status Breakdown -->
      <UCard class="shadow-sm">
        <template #header>
          <div class="flex items-center justify-between">
            <p class="font-semibold text-gray-800">Status Transaksi</p>
            <span class="text-xs text-gray-400">20 transaksi terbaru</span>
          </div>
        </template>
        <div class="space-y-3">
          <div v-for="s in statusBreakdown" :key="s.label" class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span :class="`w-2 h-2 rounded-full ${s.dotColor}`" />
              <span class="text-sm text-gray-600">{{ s.label }}</span>
            </div>
            <UBadge :color="s.color" variant="soft" size="sm">{{ s.count }}</UBadge>
          </div>
        </div>
      </UCard>

    </div>

    <!-- Arbitrage Alert -->
    <UAlert
      v-if="arbitrageCount > 0"
      :title="`${arbitrageCount} transaksi membutuhkan perhatian admin`"
      description="Terdapat transaksi dengan status ARBITRAGE yang perlu ditinjau segera."
      icon="i-heroicons-exclamation-triangle"
      color="warning"
    >
      <template #actions>
        <UButton to="/admin/order" size="sm" color="warning" variant="solid">Tinjau Sekarang</UButton>
      </template>
    </UAlert>

    <!-- Recent Transactions -->
    <UCard class="shadow-sm">
      <template #header>
        <div class="flex items-center justify-between">
          <p class="font-semibold text-gray-800">Transaksi Terbaru</p>
          <UButton to="/admin/order" size="sm" variant="ghost" trailing-icon="i-heroicons-arrow-right">
            Lihat semua
          </UButton>
        </div>
      </template>

      <AppLoadingSkeleton v-if="txPending" />

      <UAlert
        v-else-if="txError"
        title="Gagal memuat data"
        :description="txError.message"
        color="error"
        icon="mdi:alert-circle:error"
      />

      <div v-else-if="!recentTx.length" class="py-8 text-center text-gray-400 text-sm">
        Belum ada transaksi.
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="tx in recentTx"
          :key="tx.id"
          class="flex items-center gap-3 py-3 hover:bg-gray-50 rounded-xl px-2 transition-colors"
        >
          <img
            :src="getImageUrl(tx.product?.banner_url)"
            :alt="tx.product?.name"
            class="w-11 h-11 rounded-lg object-cover flex-shrink-0 border border-gray-100"
          />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-800 truncate">{{ tx.product?.name }}</p>
            <p class="text-xs text-gray-400">
              {{ tx.buyer_username }} → {{ tx.seller_email }} · {{ dayjs(tx.created_at).format('DD MMM YYYY') }}
            </p>
          </div>
          <div class="flex flex-col items-end gap-1 flex-shrink-0">
            <p class="text-sm font-semibold text-gray-800">Rp {{ tx.total_price.toLocaleString('id-ID') }}</p>
            <TransactionStatusBadge :status="tx.status" />
          </div>
          <UButton :to="`/admin/order/${tx.id}`" size="xs" variant="ghost" icon="i-heroicons-eye" />
        </div>
      </div>
    </UCard>

    <!-- Bottom Grid: Produk + Kategori + System Settings -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Produk Terbaru -->
      <UCard class="shadow-sm">
        <template #header>
          <div class="flex items-center justify-between">
            <p class="font-semibold text-gray-800">Produk Terbaru</p>
            <UButton to="/admin/product" size="sm" variant="ghost" trailing-icon="i-heroicons-arrow-right">Semua</UButton>
          </div>
        </template>
        <AppLoadingSkeleton v-if="productPending" />
        <div v-else-if="!recentProducts.length" class="py-6 text-center text-gray-400 text-sm">Belum ada produk.</div>
        <div v-else class="space-y-3">
          <div
            v-for="p in recentProducts"
            :key="p.id"
            class="flex items-center gap-3"
          >
            <img
              :src="getImageUrl(p.banner_url)"
              :alt="p.name"
              class="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 truncate">{{ p.name }}</p>
              <p class="text-xs text-gray-400">Rp {{ p.sell_price?.toLocaleString('id-ID') }}</p>
            </div>
            <UBadge :color="p.status === 'ACTIVE' ? 'success' : 'neutral'" variant="soft" size="xs">
              {{ p.status }}
            </UBadge>
          </div>
        </div>
      </UCard>

      <!-- Kategori -->
      <UCard class="shadow-sm">
        <template #header>
          <p class="font-semibold text-gray-800">Kategori Platform</p>
        </template>
        <AppLoadingSkeleton v-if="categoryPending" />
        <div v-else-if="!categories?.length" class="py-6 text-center text-gray-400 text-sm">Belum ada kategori.</div>
        <div v-else class="space-y-2">
          <div
            v-for="cat in categories"
            :key="cat.id"
            class="flex items-center gap-3 py-1"
          >
            <img
              v-if="cat.image_url"
              :src="cat.image_url"
              :alt="cat.name"
              class="w-8 h-8 rounded-lg object-cover border border-gray-100 flex-shrink-0"
            />
            <div v-else class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <UIcon name="i-lucide-grid-3x3" class="text-gray-400 text-sm" />
            </div>
            <span class="text-sm text-gray-700 flex-1 truncate">{{ cat.name }}</span>
            <UBadge :color="cat.status === 'ACTIVE' ? 'success' : 'neutral'" variant="soft" size="xs">
              {{ cat.status }}
            </UBadge>
          </div>
        </div>
      </UCard>

      <!-- System Settings Snapshot -->
      <UCard class="shadow-sm">
        <template #header>
          <div class="flex items-center justify-between">
            <p class="font-semibold text-gray-800">System Settings</p>
            <UButton to="/admin/settings/system" size="sm" variant="ghost" trailing-icon="i-heroicons-arrow-right">Kelola</UButton>
          </div>
        </template>
        <AppLoadingSkeleton v-if="settingPending" />
        <div v-else-if="!settings?.length" class="py-6 text-center text-gray-400 text-sm">Belum ada setting.</div>
        <div v-else class="space-y-2">
          <div
            v-for="s in settings.slice(0, 7)"
            :key="s.id"
            class="flex items-center justify-between py-1 border-b border-gray-50 last:border-0"
          >
            <span class="text-xs text-gray-500 truncate max-w-[55%]">{{ s.key }}</span>
            <span class="text-xs font-medium text-gray-800 truncate max-w-[40%] text-right">{{ s.value }}</span>
          </div>
        </div>
      </UCard>

    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <NuxtLink
        v-for="action in quickActions"
        :key="action.label"
        :to="action.to"
        class="flex flex-col items-center justify-center gap-2 bg-white border border-primary-100 rounded-2xl p-5 shadow-sm hover:border-primary hover:shadow-md transition-all text-center group"
      >
        <div :class="`w-11 h-11 rounded-xl flex items-center justify-center ${action.bgColor}`">
          <UIcon :name="action.icon" :class="`text-xl ${action.iconColor}`" />
        </div>
        <p class="text-sm font-medium text-gray-700 group-hover:text-primary transition-colors">{{ action.label }}</p>
      </NuxtLink>
    </div>

    </ClientOnly>

  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import TransactionStatusBadge from '~/components/app/TransactionStatusBadge.vue'
import { useTransactionApi } from '~/composables/api/transaction'
import { useProductsApi } from '~/composables/api/product'
import { useCategoryApi } from '~/composables/api/category'
import { useSystemSettingApi } from '~/composables/api/system-setting'
import { useFinanceApi } from '~/composables/api/finance'
import type { PageResponse } from '~/types/PageResponse'
import type { TransactionResponse } from '~/types/TransactionResponse'
import type { ProductResponse } from '~/types/product/ProductResponse'
import type { CategoryResponse } from '~/types/CategoryResponse'
import type { SystemSettingResponse } from '~/types/system-setting/SystemSettingResponse'

definePageMeta({ layout: 'admin', label: 'Dashboard' })

const authStore = useAuthStore()
const { fetchAllTx } = useTransactionApi()
const { getProducts } = useProductsApi()
const { fetchCategories } = useCategoryApi()
const { fetchAllSystemSetting } = useSystemSettingApi()
const { fetchMonthlyMetrics } = useFinanceApi()
const alertsStore = useAlertsStore()

// Angka platform dari BE (F-69): daftar transaksi di bawah hanya 20 terbaru, jadi tidak dipakai untuk total/grafik
const { data: metrics } = useAsyncData('admin-dashboard-metrics', () => fetchMonthlyMetrics(6), { server: false })

// ===== FETCH ALL IN PARALLEL =====
const [
  { data: txData, pending: txPending, error: txError },
  { data: productData, pending: productPending },
  { data: categories, pending: categoryPending },
  { data: settings, pending: settingPending },
] = await Promise.all([
  useAsyncData<PageResponse<TransactionResponse>>(
    'admin-dashboard-tx',
    () => fetchAllTx(0, 20, ''),
    { server: false }
  ),
  useAsyncData<PageResponse<ProductResponse>>(
    'admin-dashboard-products',
    () => getProducts(0, 10),
    { server: false }
  ),
  useAsyncData<CategoryResponse[]>(
    'admin-dashboard-categories',
    () => fetchCategories(),
    { server: false }
  ),
  useAsyncData<SystemSettingResponse[]>(
    'admin-dashboard-settings',
    () => fetchAllSystemSetting(),
    { server: false }
  ),
])

// ===== DERIVED DATA =====
const recentTx = computed(() => txData.value?.content?.slice(0, 8) ?? [])
const recentProducts = computed(() => productData.value?.content?.slice(0, 5) ?? [])

// Semua transaksi ARBITRAGE menunggu keputusan, dari /admin/alerts (null = belum dimuat/gagal)
const arbitrageCount = computed(() => alertsStore.admin?.arbitrage_pending ?? null)

// ===== STATS CARDS =====
const statsCards = computed(() => {
  const totalTx = txData.value?.total_elements ?? 0
  const totalProduct = productData.value?.total_elements ?? 0
  const totalCategory = categories.value?.length ?? 0

  const gmv = metrics.value ? metrics.value.reduce((sum, m) => sum + m.gmv, 0) : null

  return [
    {
      label: 'Total Transaksi',
      value: totalTx.toString(),
      sub: 'Semua waktu',
      icon: 'i-lucide-shopping-cart',
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-500',
    },
    {
      label: 'GMV 6 Bulan',
      value: gmv === null ? '-' : 'Rp ' + gmv.toLocaleString('id-ID'),
      sub: 'Nilai transaksi selesai',
      icon: 'i-heroicons-banknotes',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-500',
    },
    {
      label: 'Total Produk',
      value: totalProduct.toString(),
      sub: 'Terdaftar di platform',
      icon: 'i-lucide-package',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-500',
    },
    {
      label: 'Perlu Ditinjau',
      value: arbitrageCount.value === null ? '-' : arbitrageCount.value.toString(),
      sub: 'Arbitrase menunggu keputusan',
      icon: 'i-heroicons-exclamation-triangle',
      bgColor: (arbitrageCount.value ?? 0) > 0 ? 'bg-red-50' : 'bg-gray-50',
      iconColor: (arbitrageCount.value ?? 0) > 0 ? 'text-red-500' : 'text-gray-400',
    },
  ]
})

// ===== STATUS BREAKDOWN =====
const statusBreakdown = computed(() => {
  const list = txData.value?.content ?? []
  const count = (s: string) => list.filter(t => t.status === s).length
  return [
    { label: 'Menunggu Bayar',      count: count('UNPAID'),    color: 'warning' as const, dotColor: 'bg-yellow-400' },
    { label: 'Menunggu Konfirmasi', count: count('PAID'),      color: 'info' as const,    dotColor: 'bg-primary-400' },
    { label: 'Diproses',            count: count('IN_PROGRESS'), color: 'primary' as const, dotColor: 'bg-primary' },
    { label: 'Dikirim',             count: count('DELIVERED'), color: 'primary' as const, dotColor: 'bg-primary-400' },
    { label: 'Selesai',             count: count('DONE') + count('COMPLETE'), color: 'success' as const, dotColor: 'bg-green-400' },
    { label: 'Arbitrage',           count: count('ARBITRAGE'), color: 'error' as const,   dotColor: 'bg-red-400' },
    { label: 'Dibatalkan',          count: count('CANCELLED') + count('REJECTED'), color: 'error' as const, dotColor: 'bg-gray-400' },
  ]
})

// ===== CHART =====
// GMV per bulan dari metrik BE (urut terlama → terbaru)
const chartData = computed(() => {
  if (!metrics.value) return null
  const labels = metrics.value.map(m => dayjs(`${m.year}-${String(m.month).padStart(2, '0')}-01`).format('MMM YYYY'))
  const data = metrics.value.map(m => m.gmv)
  return {
    labels,
    datasets: [{
      label: 'GMV',
      data,
      backgroundColor: 'rgba(14, 165, 233, 0.7)',
      borderColor: '#01909E',
      borderRadius: 6,
    }],
  }
})

// ===== QUICK ACTIONS =====
const quickActions = [
  { label: 'Kelola Pesanan',  to: '/admin/order',    icon: 'i-lucide-shopping-cart', bgColor: 'bg-primary-50',   iconColor: 'text-primary-500' },
  { label: 'Kelola Produk',   to: '/admin/product',  icon: 'i-lucide-box',           bgColor: 'bg-purple-50', iconColor: 'text-purple-500' },
  { label: 'System Settings', to: '/admin/settings/system', icon: 'i-lucide-settings',      bgColor: 'bg-green-50',  iconColor: 'text-green-500' },
  { label: 'Chat',            to: '/admin/chat',     icon: 'mdi:chat',               bgColor: 'bg-yellow-50', iconColor: 'text-yellow-500' },
]
</script>
