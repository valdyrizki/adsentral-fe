<template>
  <div class="mx-auto max-w-4xl py-6 px-4 xl:px-0 space-y-6">

    <!-- Header -->
    <div>
      <UBreadcrumb :items="breadcrumb" class="mb-3" />
      <h1 class="text-2xl font-bold tracking-tight text-gray-900">Klaim Garansi Saya</h1>
      <p class="mt-1 text-sm text-gray-500">Pantau status klaim garansi yang telah Anda ajukan.</p>
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
            'border-l-4 border-l-green-400': item.status === 'DONE',
            'border-l-4 border-l-red-400': item.status === 'REJECTED',
          }"
          @click="$router.push(`/guarantee/${item.id}`)"
        >
          <div class="flex-grow flex flex-col gap-1.5">
            <div class="flex items-center gap-2 flex-wrap">
              <UBadge :color="statusColor(item.status)" variant="subtle" size="sm">{{ statusLabel(item.status) }}</UBadge>
              <span class="text-xs text-gray-400 font-mono">#{{ item.id }}</span>
            </div>
            <p class="text-sm font-medium text-gray-800">{{ item.product_name }}</p>
            <p class="text-sm text-gray-500 line-clamp-2">{{ item.complain_description }}</p>
            <div class="flex flex-wrap gap-3 text-xs text-gray-400 items-center">
              <span>Toko: {{ item.merchant_name }}</span>
              <span>{{ dayjs(item.created_at).format('D MMM YYYY, HH:mm') }}</span>
            </div>
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

const breadcrumb = [
  { label: 'Home', icon: 'i-lucide-home', to: '/' },
  { label: 'Klaim Garansi', icon: 'material-symbols:shield' },
]

const { fetchMyGuarantees } = useGuaranteeApi()

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
    data.value = await fetchMyGuarantees(page.value, perPageValue.value)
  } catch (err: any) {
    error.value = err
  } finally {
    pending.value = false
  }
}

watch([page, perPageValue], refresh)
onMounted(refresh)

const statusLabel = (status: GuaranteeStatus): string => ({
  IN_REVIEW: 'Menunggu Review Seller',
  REJECTED: 'Ditolak',
  IN_PROGRESS: 'Sedang Diproses',
  DONE: 'Selesai',
})[status] ?? status

const statusColor = (status: GuaranteeStatus) => ({
  IN_REVIEW: 'warning' as const,
  REJECTED: 'error' as const,
  IN_PROGRESS: 'info' as const,
  DONE: 'success' as const,
})[status] ?? 'warning' as const
</script>
