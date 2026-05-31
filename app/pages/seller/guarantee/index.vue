<template>
  <div class="space-y-6">

    <!-- Page Header -->
    <div>
      <h1 class="text-xl font-semibold">Manajemen Klaim Garansi</h1>
      <p class="text-sm text-gray-500 mt-1">Kelola klaim garansi yang diajukan pembeli untuk produk Anda</p>
    </div>

    <!-- Filter -->
    <UCard class="shadow-sm">
      <div class="flex flex-col sm:flex-row gap-3">
        <USelect v-model="perPageValue" :items="perPageItems" class="w-full sm:w-24" />
        <UButton icon="mdi:refresh" color="neutral" variant="outline" :loading="pending" @click="refresh()">
          Refresh
        </UButton>
      </div>
    </UCard>

    <!-- List -->
    <UCard class="shadow-sm">
      <template #header>
        <p class="font-semibold text-gray-800">
          Daftar Klaim Garansi
          <span v-if="data?.total_elements" class="text-xs text-gray-400 font-normal ml-2">
            ({{ data.total_elements }} total)
          </span>
        </p>
      </template>

      <AppLoadingSkeleton v-if="pending" />

      <UAlert
        v-else-if="error"
        title="Terjadi Kesalahan"
        :description="error.message || 'Gagal memuat data'"
        icon="icon-park-solid:error"
        color="error"
      />

      <div v-else-if="!data?.content?.length" class="py-10 text-center text-gray-400 text-sm">
        <UIcon name="material-symbols:shield" class="text-4xl text-gray-300 mb-3" />
        <p>Belum ada klaim garansi.</p>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="item in data.content"
          :key="item.id"
          class="flex flex-col sm:flex-row sm:items-center gap-3 py-4 px-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
          :class="{
            'border-l-4 border-l-orange-400': item.status === 'IN_REVIEW',
            'border-l-4 border-l-blue-400': item.status === 'IN_PROGRESS',
          }"
          @click="$router.push(`/seller/guarantee/${item.id}`)"
        >
          <div class="flex-grow flex flex-col gap-1.5">
            <div class="flex items-center gap-2 flex-wrap">
              <UBadge :color="statusColor(item.status)" variant="subtle" size="sm">{{ statusLabel(item.status) }}</UBadge>
              <span class="text-xs text-gray-400 font-mono">#{{ item.id }}</span>
            </div>
            <p class="text-sm font-medium text-gray-800">{{ item.product_name }}</p>
            <p class="text-sm text-gray-500 line-clamp-2">{{ item.complain_description }}</p>
            <div class="flex flex-wrap gap-3 text-xs text-gray-400 items-center">
              <span>Pembeli: {{ item.buyer_name }}</span>
              <span>{{ dayjs(item.created_at).format('D MMM YYYY, HH:mm') }}</span>
            </div>
          </div>

          <!-- Countdown IN_REVIEW -->
          <div v-if="item.status === 'IN_REVIEW' && item.review_deadline" class="flex-none text-right sm:min-w-28">
            <p class="text-xs text-gray-400">Sisa waktu review</p>
            <div class="font-mono font-bold text-base" :class="isExpired(item.review_deadline) ? 'text-red-600' : 'text-orange-500'">
              {{ isExpired(item.review_deadline) ? 'TERLEWAT' : formatCountdown(secondsUntil(item.review_deadline)) }}
            </div>
            <p v-if="isExpired(item.review_deadline)" class="text-xs text-red-500">Berisiko penalty!</p>
          </div>

          <!-- Countdown IN_PROGRESS -->
          <div v-if="item.status === 'IN_PROGRESS' && item.progress_deadline" class="flex-none text-right sm:min-w-28">
            <p class="text-xs text-gray-400">Sisa waktu kirim</p>
            <div class="font-mono font-bold text-base" :class="isExpired(item.progress_deadline) ? 'text-red-600' : 'text-blue-500'">
              {{ isExpired(item.progress_deadline) ? 'TERLEWAT' : formatCountdown(secondsUntil(item.progress_deadline)) }}
            </div>
            <p v-if="isExpired(item.progress_deadline)" class="text-xs text-red-500">Berisiko penalty!</p>
          </div>

          <UIcon name="mdi:chevron-right" class="size-5 text-gray-400 flex-none hidden sm:block" />
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="data && data.total_pages > 1 && !pending" class="flex justify-center items-center pt-4">
        <UPagination
          :page="page + 1"
          :total="data.total_elements"
          :items-per-page="perPageValue"
          :sibling-count="1"
          show-edges
          @update:page="(p) => { page = p - 1 }"
        />
      </div>
    </UCard>

  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { useGuaranteeApi } from '~/composables/api/guarantee'
import type { GuaranteeResponse, GuaranteeStatus } from '~/types/guarantee/GuaranteeResponse'
import type { PageResponse } from '~/types/PageResponse'

definePageMeta({ layout: 'seller', label: 'Klaim Garansi' })

const { fetchSellerGuarantees } = useGuaranteeApi()

const page = ref(0)
const perPageValue = ref(20)
const perPageItems = [10, 20, 50]

const data = ref<PageResponse<GuaranteeResponse> | null>(null)
const pending = ref(false)
const error = ref<Error | null>(null)

async function refresh() {
  pending.value = true
  error.value = null
  try {
    data.value = await fetchSellerGuarantees(page.value, perPageValue.value)
  } catch (err: any) {
    error.value = err
  } finally {
    pending.value = false
  }
}

watch([page, perPageValue], refresh)
onMounted(refresh)

// ===== Countdown =====
const now = ref(dayjs())
let ticker: ReturnType<typeof setInterval> | null = null

onMounted(() => { ticker = setInterval(() => { now.value = dayjs() }, 1000) })
onUnmounted(() => { if (ticker) clearInterval(ticker) })

const secondsUntil = (deadline: string | null): number => {
  if (!deadline) return 0
  return Math.max(0, dayjs(deadline).diff(now.value, 'second'))
}

const isExpired = (deadline: string | null): boolean => {
  if (!deadline) return false
  return dayjs(deadline).isBefore(now.value)
}

const formatCountdown = (seconds: number): string => {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (d > 0) return `${d}h ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ===== Status helpers =====
const statusLabel = (status: GuaranteeStatus): string => ({
  IN_REVIEW: 'Perlu Review', REJECTED: 'Ditolak', IN_PROGRESS: 'Perlu Kirim Garansi', DONE: 'Selesai',
})[status] ?? status

const statusColor = (status: GuaranteeStatus) => ({
  IN_REVIEW: 'warning' as const, REJECTED: 'error' as const, IN_PROGRESS: 'info' as const, DONE: 'success' as const,
})[status] ?? 'warning' as const
</script>
