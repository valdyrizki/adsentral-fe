<template>
  <div class="space-y-6">

    <!-- Filters -->
    <UCard class="shadow-sm">
      <div class="flex flex-col sm:flex-row gap-3">
        <UInput
          v-model="search"
          icon="i-heroicons-magnifying-glass"
          placeholder="Cari email seller..."
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
    <UCard class="shadow-sm">
      <template #header>
        <p class="font-semibold text-gray-800">
          Antrian Verifikasi Akun
          <span v-if="list?.total_elements" class="text-xs text-gray-400 font-normal ml-2">
            ({{ list.total_elements }} total)
          </span>
        </p>
      </template>

      <AppLoadingSkeleton v-if="pending" />

      <UAlert
        v-else-if="error"
        title="Terjadi Kesalahan"
        :description="error.message || 'Gagal memuat data'"
        icon="mdi:alert-circle:error"
        color="error"
      />

      <div v-else-if="!list?.content?.length" class="py-10 text-center text-gray-400 text-sm">
        <UIcon name="mdi:card-account-details-outline" class="text-4xl text-gray-300 mb-3" />
        <p>Tidak ada pengajuan verifikasi.</p>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="item in list.content"
          :key="item.id"
          class="py-4 px-2 hover:bg-gray-50 rounded-xl transition-colors flex flex-col sm:flex-row gap-4 sm:items-center"
        >
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            :class="{
              'bg-amber-50': item.status === 'PENDING',
              'bg-green-50': item.status === 'APPROVED',
              'bg-red-50': item.status === 'REJECTED',
            }"
          >
            <UIcon
              :name="item.status === 'APPROVED' ? 'mdi:check-circle' : item.status === 'REJECTED' ? 'mdi:close-circle' : 'mdi:clock-outline'"
              class="text-xl"
              :class="{
                'text-amber-500': item.status === 'PENDING',
                'text-green-500': item.status === 'APPROVED',
                'text-red-500': item.status === 'REJECTED',
              }"
            />
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-800">{{ item.full_name_ktp }}</p>
            <p class="text-xs text-gray-400">{{ item.user_email }}</p>
            <p class="text-xs text-gray-500 mt-0.5 font-mono">{{ item.nik_masked }}</p>
            <p class="text-xs text-gray-400 mt-0.5">{{ dayjs(item.created_at).format('DD MMM YYYY, HH:mm') }}</p>
          </div>

          <div class="flex items-center gap-3 sm:flex-shrink-0">
            <UBadge
              :color="item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'error' : 'warning'"
              variant="soft"
            >
              {{ statusLabel(item.status) }}
            </UBadge>
            <UButton size="xs" color="neutral" variant="outline" icon="mdi:eye" :to="`/admin/verification/${item.id}`">
              Review
            </UButton>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="list && list.total_pages > 1 && !pending" class="flex justify-center items-center pt-4">
        <UPagination
          :page="page + 1"
          :total="list.total_elements"
          :items-per-page="perPageValue"
          :sibling-count="1"
          show-edges
          @update:page="onPageChange"
        />
      </div>
    </UCard>

  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { useVerificationApi } from '~/composables/api/verification'
import type { PageResponse } from '~/types/PageResponse'
import type { UserVerificationRequest } from '~/types/verification/UserVerificationRequest'

definePageMeta({ layout: 'admin', label: 'Verifikasi Akun (KTP)' })

const { fetchAdminVerificationList } = useVerificationApi()

const page = ref(0)
const perPageValue = ref(20)
const perPageItems = [10, 20, 50, 100]
const filterStatus = ref('PENDING')
const search = ref('')
const debouncedSearch = ref('')

const statusOptions = [
  { label: 'Semua Status', value: 'ALL' },
  { label: 'Menunggu Review', value: 'PENDING' },
  { label: 'Disetujui', value: 'APPROVED' },
  { label: 'Ditolak', value: 'REJECTED' },
]

const {
  data: list,
  pending,
  error,
  refresh,
} = await useAsyncData<PageResponse<UserVerificationRequest>>(
  'admin-verification-list',
  () => fetchAdminVerificationList(page.value, perPageValue.value, filterStatus.value, debouncedSearch.value),
  { watch: [page, perPageValue, filterStatus, debouncedSearch], server: false },
)

let searchTimeout: ReturnType<typeof setTimeout> | null = null

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

function statusLabel(status: string) {
  const map: Record<string, string> = { PENDING: 'Menunggu Review', APPROVED: 'Disetujui', REJECTED: 'Ditolak' }
  return map[status] ?? status
}

function onPageChange(newPage: number) {
  page.value = newPage - 1
}

function handleFilter() {
  page.value = 0
  refresh()
}
</script>
