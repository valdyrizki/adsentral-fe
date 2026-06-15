<template>
  <div class="max-w-3xl mx-auto px-4 py-8 space-y-6">

    <UBreadcrumb :items="breadcrumb" />

    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Riwayat Penalty</h1>
      <p class="text-sm text-gray-500 mt-1">Daftar pelanggaran yang tercatat pada akun Anda.</p>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div
        v-for="stat in statsCards"
        :key="stat.label"
        class="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
      >
        <p class="text-xs text-gray-400 mb-1">{{ stat.label }}</p>
        <p class="text-xl font-bold" :class="stat.valueColor">{{ stat.value }}</p>
      </div>
    </div>

    <!-- Info Banding -->
    <UAlert
      icon="i-heroicons-information-circle"
      color="info"
      variant="subtle"
      title="Pengajuan Banding Penalty"
      description="Anda dapat mengajukan banding kepada admin untuk penghapusan penalty yang dianggap tidak sesuai."
    >
      <template #actions>
        <UButton
          v-if="waLink"
          :to="waLink"
          target="_blank"
          icon="i-heroicons-chat-bubble-left-ellipsis"
          color="success"
          size="sm"
        >
          Hubungi Admin via WA
        </UButton>
      </template>
    </UAlert>

    <!-- List -->
    <div class="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <p class="font-semibold text-gray-800 text-sm">
          Semua Penalty
          <span v-if="data?.total_elements" class="text-xs text-gray-400 font-normal ml-1">
            ({{ data.total_elements }})
          </span>
        </p>
        <UButton icon="mdi:refresh" size="xs" color="neutral" variant="outline" :loading="pending" @click="refresh()">
          Refresh
        </UButton>
      </div>

      <ClientOnly>
        <template #fallback>
          <AppLoadingSkeleton class="p-4" />
        </template>

        <AppLoadingSkeleton v-if="pending" class="p-4" />

        <UAlert
          v-else-if="error"
          title="Terjadi Kesalahan"
          :description="error.message || 'Gagal memuat data'"
          icon="icon-park-solid:error"
          color="error"
          class="m-4"
        />

        <div v-else-if="!data?.content?.length" class="py-12 text-center text-gray-400 text-sm">
          <UIcon name="i-heroicons-shield-check" class="text-4xl text-gray-300 mb-3" />
          <p class="font-medium">Tidak ada riwayat penalty</p>
          <p class="text-xs mt-1">Akun Anda dalam kondisi baik.</p>
        </div>

        <div v-else class="divide-y divide-gray-100">
          <div
            v-for="log in data.content"
            :key="log.id"
            class="flex items-start gap-4 px-4 py-4"
          >
            <!-- Icon -->
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              :class="log.is_expired ? 'bg-gray-100' : 'bg-red-50'"
            >
              <UIcon
                name="i-heroicons-shield-exclamation"
                :class="log.is_expired ? 'text-gray-400' : 'text-red-400'"
                class="text-lg"
              />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-gray-800">{{ log.rule_name }}</p>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <UBadge :color="log.is_expired ? 'neutral' : 'error'" variant="subtle" size="xs">
                      {{ log.is_expired ? 'Kedaluwarsa' : 'Aktif' }}
                    </UBadge>
                    <UBadge color="neutral" variant="soft" size="xs">
                      {{ log.points }} poin
                    </UBadge>
                  </div>
                </div>
                <p class="text-xs text-gray-400 flex-shrink-0">
                  {{ dayjs(log.created_at).format('DD MMM YYYY') }}
                </p>
              </div>
              <p v-if="log.notes" class="text-xs text-gray-500 italic mt-1.5">{{ log.notes }}</p>
              <div class="flex flex-wrap gap-x-3 text-xs text-gray-400 mt-1.5">
                <span>Berlaku hingga {{ dayjs(log.expired_at).format('DD MMM YYYY') }}</span>
                <span v-if="log.transaction_id">Transaksi: {{ log.transaction_id }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="data && data.total_pages > 1 && !pending" class="flex justify-center py-4 border-t border-gray-100">
          <UPagination
            :page="page + 1"
            :total="data.total_elements"
            :items-per-page="perPageValue"
            :sibling-count="1"
            show-edges
            @update:page="(p) => { page = p - 1 }"
          />
        </div>
      </ClientOnly>
    </div>

  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { usePenaltyApi } from '~/composables/api/penalty'
import type { PageResponse } from '~/types/PageResponse'
import type { PenaltyResponse } from '~/types/penalty/PenaltyResponse'

definePageMeta({ layout: 'default', label: 'Riwayat Penalty' })

const breadcrumb = [
  { label: 'Home', icon: 'i-lucide-home', to: '/' },
  { label: 'Riwayat Penalty', icon: 'i-heroicons-shield-exclamation' },
]

const systemSettingStore = useSystemSettingStore()
const { fetchMyPenalties } = usePenaltyApi()

const waLink = computed(() => {
  const number = systemSettingStore.systemSettings.find(s => s.key === 'WA_NUMBER')?.value
  if (!number) return null
  return `https://wa.me/${number.replace(/\D/g, '')}`
})

const page = ref(0)
const perPageValue = ref(20)

const {
  data,
  pending,
  error,
  refresh,
} = await useAsyncData<PageResponse<PenaltyResponse>>(
  () => `my-penalties-${page.value}-${perPageValue.value}`,
  () => fetchMyPenalties(page.value, perPageValue.value),
  { watch: [page, perPageValue], server: false }
)

const statsCards = computed(() => {
  const list = data.value?.content ?? []
  const total = data.value?.total_elements ?? 0
  const active = list.filter(l => !l.is_expired).length
  const expired = list.filter(l => l.is_expired).length
  const totalPoints = list.filter(l => !l.is_expired).reduce((s, l) => s + l.points, 0)

  return [
    { label: 'Total Penalty', value: total.toString(), valueColor: 'text-gray-800' },
    { label: 'Masih Aktif', value: active.toString(), valueColor: active > 0 ? 'text-red-500' : 'text-gray-800' },
    { label: 'Kedaluwarsa', value: expired.toString(), valueColor: 'text-gray-400' },
    { label: 'Poin Aktif', value: totalPoints.toString(), valueColor: totalPoints > 0 ? 'text-orange-500' : 'text-gray-800' },
  ]
})
</script>
