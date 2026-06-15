<template>
  <div class="space-y-6">

    <ClientOnly>
      <template #fallback>
        <div class="space-y-4">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div v-for="i in 4" :key="i" class="bg-white border border-gray-200 rounded-xl p-4">
              <USkeleton class="h-3 w-24 rounded mb-2" />
              <USkeleton class="h-7 w-16 rounded" />
            </div>
          </div>
          <UCard class="shadow-sm"><AppLoadingSkeleton /></UCard>
        </div>
      </template>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard v-for="stat in statsCards" :key="stat.label" class="shadow-sm">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs text-gray-400 mb-1">{{ stat.label }}</p>
            <p class="text-xl font-bold text-gray-800">{{ stat.value }}</p>
          </div>
          <div :class="`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.bgColor}`">
            <UIcon :name="stat.icon" :class="`text-xl ${stat.iconColor}`" />
          </div>
        </div>
      </UCard>
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
          Riwayat Penalty
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
        <UIcon name="i-heroicons-shield-check" class="text-4xl text-gray-300 mb-3" />
        <p>Tidak ada riwayat penalty.</p>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="log in data.content"
          :key="log.id"
          class="flex flex-col sm:flex-row gap-4 py-4 px-2"
        >
          <!-- Icon + Info -->
          <div class="flex gap-3 flex-1 min-w-0">
            <div
              class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              :class="log.is_expired ? 'bg-gray-100' : 'bg-red-50'"
            >
              <UIcon
                name="i-heroicons-shield-exclamation"
                :class="log.is_expired ? 'text-gray-400' : 'text-red-400'"
                class="text-lg"
              />
            </div>
            <div class="flex flex-col gap-1 min-w-0">
              <p class="text-sm font-semibold text-gray-800">{{ log.rule_name }}</p>
              <p class="text-xs text-gray-400 font-mono">{{ log.rule_id }}</p>
              <div class="flex flex-wrap gap-1 mt-0.5">
                <UBadge :color="log.is_expired ? 'neutral' : 'error'" variant="subtle" size="xs">
                  {{ log.is_expired ? 'Kedaluwarsa' : 'Aktif' }}
                </UBadge>
              </div>
              <p v-if="log.notes" class="text-xs text-gray-400 italic mt-0.5">{{ log.notes }}</p>
              <p v-if="log.transaction_id" class="text-xs text-gray-400 font-mono">
                Transaksi: {{ log.transaction_id }}
              </p>
            </div>
          </div>

          <!-- Points + dates -->
          <div class="flex flex-col gap-1 sm:items-end flex-shrink-0">
            <div class="flex items-center gap-1">
              <UIcon name="i-heroicons-exclamation-triangle" class="text-red-400 text-sm" />
              <span class="text-base font-bold text-red-500">{{ log.points }} poin</span>
            </div>
            <div class="flex items-center gap-1 text-xs text-gray-400">
              <UIcon name="i-heroicons-clock" class="text-sm" />
              <span>Exp: {{ dayjs(log.expired_at).format('DD MMM YYYY') }}</span>
            </div>
            <p class="text-xs text-gray-400">{{ dayjs(log.created_at).format('DD MMM YYYY, HH:mm') }}</p>
            <p v-if="log.given_by_email" class="text-xs text-gray-400">Oleh: {{ log.given_by_email }}</p>
          </div>
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

    </ClientOnly>

  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { usePenaltyApi } from '~/composables/api/penalty'
import type { PageResponse } from '~/types/PageResponse'
import type { PenaltyResponse } from '~/types/penalty/PenaltyResponse'

definePageMeta({ layout: 'seller', label: 'Penalty Saya' })

const systemSettingStore = useSystemSettingStore()
const { fetchMyPenalties } = usePenaltyApi()

const waLink = computed(() => {
  const number = systemSettingStore.systemSettings.find(s => s.key === 'WA_NUMBER')?.value
  if (!number) return null
  return `https://wa.me/${number.replace(/\D/g, '')}`
})

const page = ref(0)
const perPageValue = ref(20)
const perPageItems = [10, 20, 50]

const data = ref<PageResponse<PenaltyResponse> | null>(null)
const pending = ref(false)
const error = ref<Error | null>(null)

async function refresh() {
  pending.value = true
  error.value = null
  try {
    data.value = await fetchMyPenalties(page.value, perPageValue.value)
  } catch (err: any) {
    error.value = err
  } finally {
    pending.value = false
  }
}

watch([page, perPageValue], refresh)
onMounted(refresh)

const statsCards = computed(() => {
  const list = data.value?.content ?? []
  const total = data.value?.total_elements ?? 0
  const active = list.filter(l => !l.is_expired).length
  const expired = list.filter(l => l.is_expired).length
  const totalPoints = list.filter(l => !l.is_expired).reduce((s, l) => s + l.points, 0)

  return [
    { label: 'Total Penalty', value: total.toString(), icon: 'i-heroicons-shield-exclamation', bgColor: 'bg-red-50', iconColor: 'text-red-500' },
    { label: 'Masih Aktif', value: active.toString(), icon: 'i-heroicons-exclamation-triangle', bgColor: 'bg-orange-50', iconColor: 'text-orange-500' },
    { label: 'Kedaluwarsa', value: expired.toString(), icon: 'i-heroicons-clock', bgColor: 'bg-gray-100', iconColor: 'text-gray-400' },
    { label: 'Poin Aktif', value: totalPoints.toString(), icon: 'i-heroicons-arrow-trending-up', bgColor: 'bg-purple-50', iconColor: 'text-purple-500' },
  ]
})
</script>
