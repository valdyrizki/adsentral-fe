<template>
  <div class="space-y-6">

    <!-- Filter Periode -->
    <UCard class="shadow-sm">
      <div class="flex flex-col sm:flex-row gap-3 items-end">
        <UFormField label="Tahun">
          <USelect v-model="selectedYear" :items="yearOptions" class="w-32" />
        </UFormField>
        <UFormField label="Bulan">
          <USelect v-model="selectedMonth" :items="monthOptions" value-key="value" class="w-40" />
        </UFormField>
        <UButton icon="mdi:refresh" color="neutral" variant="outline" :loading="pendingSummary" @click="refreshSummary()">
          Refresh
        </UButton>
      </div>
    </UCard>

    <ClientOnly>
      <template #fallback>
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div v-for="i in 4" :key="i" class="bg-white border border-gray-200 rounded-xl p-4">
              <USkeleton class="h-3 w-24 rounded mb-2" />
              <USkeleton class="h-7 w-28 rounded" />
            </div>
          </div>
          <UCard class="shadow-sm"><AppLoadingSkeleton /></UCard>
        </div>
      </template>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Saldo Bisnis -->
        <UCard class="shadow-sm lg:col-span-1">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs text-gray-400 mb-1">Saldo Bisnis</p>
              <AppLoadingSkeleton v-if="pendingBalance" class="h-7 w-28" />
              <template v-else>
                <p class="text-xl font-bold" :class="balance < 0 ? 'text-red-600' : 'text-gray-800'">
                  Rp {{ balance.toLocaleString('id-ID') }}
                </p>
                <p v-if="balance < 0" class="text-xs text-red-500 mt-1">
                  <UIcon name="mdi:alert-circle" class="size-3" /> Pengeluaran melebihi pemasukan
                </p>
              </template>
            </div>
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10">
              <UIcon name="mdi:bank-outline" class="text-xl text-primary" />
            </div>
          </div>
        </UCard>

        <!-- Total Pemasukan -->
        <UCard class="shadow-sm">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs text-gray-400 mb-1">Pemasukan</p>
              <p class="text-xl font-bold text-green-600">
                Rp {{ (summary?.total_credit ?? 0).toLocaleString('id-ID') }}
              </p>
              <p class="text-xs text-gray-400 mt-1">{{ periodLabel }}</p>
            </div>
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-green-50">
              <UIcon name="mdi:trending-up" class="text-xl text-green-500" />
            </div>
          </div>
        </UCard>

        <!-- Total Pengeluaran -->
        <UCard class="shadow-sm">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs text-gray-400 mb-1">Pengeluaran</p>
              <p class="text-xl font-bold text-red-500">
                Rp {{ (summary?.total_debit ?? 0).toLocaleString('id-ID') }}
              </p>
              <p class="text-xs text-gray-400 mt-1">{{ periodLabel }}</p>
            </div>
            <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-red-50">
              <UIcon name="mdi:trending-down" class="text-xl text-red-400" />
            </div>
          </div>
        </UCard>

        <!-- Net Profit -->
        <UCard class="shadow-sm">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs text-gray-400 mb-1">Laba Bersih</p>
              <p
                class="text-xl font-bold"
                :class="(summary?.net_profit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'"
              >
                Rp {{ (summary?.net_profit ?? 0).toLocaleString('id-ID') }}
              </p>
              <p class="text-xs text-gray-400 mt-1">{{ periodLabel }}</p>
            </div>
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              :class="(summary?.net_profit ?? 0) >= 0 ? 'bg-emerald-50' : 'bg-red-50'"
            >
              <UIcon
                name="mdi:chart-line"
                class="text-xl"
                :class="(summary?.net_profit ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'"
              />
            </div>
          </div>
        </UCard>
      </div>

      <!-- P&L Breakdown -->
      <UCard class="shadow-sm">
        <template #header>
          <p class="font-semibold text-gray-800">Laporan Laba Rugi — {{ periodLabel }}</p>
        </template>

        <AppLoadingSkeleton v-if="pendingSummary" />

        <UAlert
          v-else-if="errorSummary"
          title="Gagal memuat data"
          :description="(errorSummary as any).statusMessage || 'Terjadi kesalahan'"
          color="error"
          icon="mdi:alert-circle"
        />

        <div v-else class="space-y-4">
          <!-- Pemasukan bar -->
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-500">Pemasukan (Credit)</span>
              <span class="font-semibold text-green-600">Rp {{ (summary?.total_credit ?? 0).toLocaleString('id-ID') }}</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-3">
              <div
                class="bg-green-400 h-3 rounded-full transition-all"
                :style="{ width: creditBarWidth }"
              />
            </div>
          </div>

          <!-- Pengeluaran bar -->
          <div>
            <div class="flex justify-between text-sm mb-1">
              <span class="text-gray-500">Pengeluaran (Debit)</span>
              <span class="font-semibold text-red-500">Rp {{ (summary?.total_debit ?? 0).toLocaleString('id-ID') }}</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-3">
              <div
                class="bg-red-400 h-3 rounded-full transition-all"
                :style="{ width: debitBarWidth }"
              />
            </div>
          </div>

          <USeparator />

          <div class="flex justify-between items-center">
            <span class="font-semibold text-gray-700">Laba Bersih</span>
            <span
              class="text-lg font-bold"
              :class="(summary?.net_profit ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'"
            >
              Rp {{ (summary?.net_profit ?? 0).toLocaleString('id-ID') }}
            </span>
          </div>
        </div>
      </UCard>

      <!-- Quick Links -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UCard class="shadow-sm hover:shadow-md transition-shadow cursor-pointer" @click="navigateTo('/admin/finance/journal')">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <UIcon name="mdi:notebook-outline" class="text-2xl text-blue-500" />
            </div>
            <div>
              <p class="font-semibold text-gray-800">Jurnal Keuangan</p>
              <p class="text-xs text-gray-400">Catat dan lihat semua transaksi keuangan</p>
            </div>
            <UIcon name="mdi:chevron-right" class="size-5 text-gray-400 ml-auto" />
          </div>
        </UCard>

        <UCard class="shadow-sm hover:shadow-md transition-shadow cursor-pointer" @click="navigateTo('/admin/finance/category')">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
              <UIcon name="mdi:tag-multiple-outline" class="text-2xl text-purple-500" />
            </div>
            <div>
              <p class="font-semibold text-gray-800">Kategori Keuangan</p>
              <p class="text-xs text-gray-400">Kelola kategori pemasukan dan pengeluaran</p>
            </div>
            <UIcon name="mdi:chevron-right" class="size-5 text-gray-400 ml-auto" />
          </div>
        </UCard>
      </div>

    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import { useFinanceApi } from '~/composables/api/finance'
import type { FinanceSummaryResponse } from '~/types/finance/FinanceSummaryResponse'

definePageMeta({ layout: 'admin', label: 'Dashboard Keuangan' })

const { fetchSummary, fetchBalance } = useFinanceApi()

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)
const monthOptions = [
  { label: 'Semua Bulan', value: 0 },
  { label: 'Januari', value: 1 },
  { label: 'Februari', value: 2 },
  { label: 'Maret', value: 3 },
  { label: 'April', value: 4 },
  { label: 'Mei', value: 5 },
  { label: 'Juni', value: 6 },
  { label: 'Juli', value: 7 },
  { label: 'Agustus', value: 8 },
  { label: 'September', value: 9 },
  { label: 'Oktober', value: 10 },
  { label: 'November', value: 11 },
  { label: 'Desember', value: 12 },
]

const selectedYear = ref<number>(currentYear)
const selectedMonth = ref<number>(currentMonth)

// ===== FETCH SUMMARY =====
const {
  data: summary,
  pending: pendingSummary,
  error: errorSummary,
  refresh: refreshSummary,
} = useAsyncData<FinanceSummaryResponse>(
  'admin-finance-summary',
  () => fetchSummary(
    selectedYear.value,
    selectedMonth.value > 0 ? selectedMonth.value : null,
  ),
  { watch: [selectedYear, selectedMonth], server: false }
)

// ===== FETCH BALANCE =====
const {
  data: balanceData,
  pending: pendingBalance,
} = useAsyncData<number>(
  'admin-finance-balance',
  () => fetchBalance(),
  { server: false }
)

const balance = computed(() => balanceData.value ?? 0)

// ===== COMPUTED =====
const periodLabel = computed(() => {
  if (!selectedMonth.value) return `Tahun ${selectedYear.value}`
  const m = monthOptions.find(o => o.value === selectedMonth.value)
  return `${m?.label ?? ''} ${selectedYear.value}`
})

const creditBarWidth = computed(() => {
  const total = (summary.value?.total_credit ?? 0) + (summary.value?.total_debit ?? 0)
  if (!total) return '0%'
  return `${Math.round(((summary.value?.total_credit ?? 0) / total) * 100)}%`
})

const debitBarWidth = computed(() => {
  const total = (summary.value?.total_credit ?? 0) + (summary.value?.total_debit ?? 0)
  if (!total) return '0%'
  return `${Math.round(((summary.value?.total_debit ?? 0) / total) * 100)}%`
})
</script>
