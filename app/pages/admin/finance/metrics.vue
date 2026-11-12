<template>
  <div class="space-y-6">
    <!-- Filter rentang -->
    <UCard class="shadow-sm">
      <div class="flex flex-col sm:flex-row gap-3 sm:items-end">
        <UFormField label="Rentang">
          <USelect v-model="months" :items="rangeOptions" value-key="value" class="w-44" />
        </UFormField>
        <UButton icon="mdi:refresh" color="neutral" variant="outline" :loading="pending" @click="refresh()">
          Refresh
        </UButton>
        <p class="text-xs text-gray-400 sm:ml-auto">Bulan menurut kalender WIB. Bulan berjalan belum lengkap.</p>
      </div>
    </UCard>

    <ClientOnly>
      <template #fallback>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div v-for="i in 3" :key="i" class="bg-white border border-gray-200 rounded-xl p-4">
            <USkeleton class="h-3 w-24 rounded mb-2" />
            <USkeleton class="h-7 w-28 rounded" />
          </div>
        </div>
      </template>

      <UAlert
        v-if="error"
        color="error"
        icon="mdi:alert-circle"
        title="Terjadi Kesalahan"
        :description="apiErrorMessage(error, 'Gagal memuat metrik bulanan')"
      />

      <template v-else>
        <!-- Kartu bulan berjalan -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <UCard v-for="card in cards" :key="card.label" class="shadow-sm">
            <p class="text-xs text-gray-400 mb-1">{{ card.label }} · {{ latest ? monthLabel(latest) : '-' }}</p>
            <AppLoadingSkeleton v-if="pending" class="h-7 w-28" />
            <template v-else>
              <p class="text-xl font-bold text-gray-800">{{ card.value }}</p>
              <p v-if="card.delta" class="text-xs mt-1" :class="card.delta.up ? 'text-green-600' : 'text-red-500'">
                {{ card.delta.text }} dari {{ previous ? monthLabel(previous) : '' }}
              </p>
            </template>
          </UCard>
        </div>

        <!-- Rincian per bulan -->
        <UCard class="shadow-sm mt-6">
          <template #header>
            <p class="font-semibold text-gray-800">Rincian per Bulan</p>
            <p class="text-xs text-gray-400 mt-1">
              Selesai, GMV, dan seller aktif dihitung dari transaksi <b>COMPLETE</b> menurut tanggal diterima buyer.
              Refund dan arbitrase dihitung dari transaksi yang dibayar di bulan itu.
            </p>
          </template>
          <AppLoadingSkeleton v-if="pending" />
          <div v-else-if="!rows.length" class="py-10 text-center text-gray-400 text-sm">Belum ada data</div>
          <div v-else class="divide-y divide-gray-100">
            <div
              v-for="r in rowsNewestFirst"
              :key="`${r.year}-${r.month}`"
              class="py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
              data-testid="metric-row"
            >
              <p class="sm:w-36 font-medium text-gray-800">{{ monthLabel(r) }}</p>
              <div class="grid grid-cols-2 sm:grid-cols-6 gap-x-4 gap-y-1 flex-1 text-sm">
                <div><p class="text-xs text-gray-400">Selesai</p><p>{{ r.completed_transactions.toLocaleString('id-ID') }}</p></div>
                <div><p class="text-xs text-gray-400">GMV</p><p>Rp {{ Number(r.gmv).toLocaleString('id-ID') }}</p></div>
                <div><p class="text-xs text-gray-400">Seller aktif</p><p>{{ r.active_sellers.toLocaleString('id-ID') }}</p></div>
                <div>
                  <p class="text-xs text-gray-400">Refund</p>
                  <p>{{ r.refunded_transactions }} <span class="text-gray-400">({{ percent(r.refunded_transactions, r.paid_transactions) }} dari {{ r.paid_transactions }} dibayar)</span></p>
                </div>
                <div>
                  <p class="text-xs text-gray-400">Arbitrase</p>
                  <p>{{ r.arbitrage_transactions }} <span class="text-gray-400">({{ percent(r.arbitrage_transactions, r.paid_transactions) }})</span></p>
                </div>
                <div>
                  <p class="text-xs text-gray-400">Klaim garansi</p>
                  <p>{{ r.guarantee_claims }} <span class="text-gray-400">({{ percent(r.guarantee_claims, r.completed_transactions) }} per selesai)</span></p>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </template>
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import { useFinanceApi } from '~/composables/api/finance'
import type { AdminMonthlyMetricResponse } from '~/types/finance/AdminMonthlyMetricResponse'

definePageMeta({ layout: 'admin', label: 'Metrik Bulanan' })

const { fetchMonthlyMetrics } = useFinanceApi()

const rangeOptions = [
  { label: '6 bulan terakhir', value: 6 },
  { label: '12 bulan terakhir', value: 12 },
  { label: '24 bulan terakhir', value: 24 },
]
const months = ref<number>(6)

const { data, pending, error, refresh } = useAsyncData<AdminMonthlyMetricResponse[]>(
  'admin-monthly-metrics',
  () => fetchMonthlyMetrics(months.value),
  { watch: [months], server: false },
)

const rows = computed(() => data.value ?? [])
const rowsNewestFirst = computed(() => [...rows.value].reverse())
const latest = computed(() => rows.value[rows.value.length - 1] ?? null)
const previous = computed(() => rows.value[rows.value.length - 2] ?? null)

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const monthLabel = (r: AdminMonthlyMetricResponse) => `${MONTHS[r.month - 1]} ${r.year}`

const percent = (part: number, whole: number) => (whole > 0 ? `${((part / whole) * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%` : '-')

/** Perubahan dibanding bulan sebelumnya; null bila bulan sebelumnya 0 (persentase tidak bermakna). */
const delta = (now: number, before: number | undefined) => {
  if (before === undefined || before === 0) return null
  const pct = ((now - before) / before) * 100
  return { up: pct >= 0, text: `${pct >= 0 ? '+' : ''}${pct.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%` }
}

const cards = computed(() => {
  const l = latest.value
  const p = previous.value
  return [
    {
      label: 'Transaksi Selesai',
      value: (l?.completed_transactions ?? 0).toLocaleString('id-ID'),
      delta: l ? delta(l.completed_transactions, p?.completed_transactions) : null,
    },
    {
      label: 'GMV',
      value: `Rp ${Number(l?.gmv ?? 0).toLocaleString('id-ID')}`,
      delta: l ? delta(Number(l.gmv), p ? Number(p.gmv) : undefined) : null,
    },
    {
      label: 'Seller Aktif',
      value: (l?.active_sellers ?? 0).toLocaleString('id-ID'),
      delta: l ? delta(l.active_sellers, p?.active_sellers) : null,
    },
  ]
})
</script>
