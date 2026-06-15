<template>
  <div class="space-y-6">

    <!-- Slideover Detail Penalty User -->
    <USlideover
      v-model:open="showDetail"
      :title="selectedUser?.user.full_name ?? selectedUser?.user.username ?? selectedUser?.user.email ?? ''"
    >
      <template #body>
        <div v-if="selectedUser" class="space-y-4 p-4">

          <!-- User Info -->
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div class="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden bg-gray-100">
              <NuxtImg
                v-if="selectedUser.user.avatar_url"
                :src="getImageUrl(selectedUser.user.avatar_url)"
                class="w-full h-full object-cover"
                alt="avatar"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <UIcon name="i-heroicons-user" class="text-lg text-gray-400" />
              </div>
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-semibold text-gray-800">{{ selectedUser.user.full_name ?? selectedUser.user.username }}</p>
              <p class="text-xs text-gray-400">{{ selectedUser.user.email }}</p>
              <div class="flex gap-1 mt-1">
                <UBadge :color="suspendColor(selectedUser.suspend_status)" variant="subtle" size="xs">
                  {{ suspendLabel(selectedUser.suspend_status) }}
                </UBadge>
                <span v-if="selectedUser.suspend_until && selectedUser.suspend_status === 'TEMPORARY'" class="text-xs text-gray-400 self-center">
                  s/d {{ dayjs(selectedUser.suspend_until).format('DD MMM YYYY') }}
                </span>
              </div>
            </div>
            <div class="text-right flex-shrink-0 space-y-1">
              <div>
                <p class="text-xs text-gray-400">Poin Buyer</p>
                <p class="text-lg font-bold text-red-500">{{ selectedUser.active_points }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400">Poin Seller</p>
                <p class="text-lg font-bold text-orange-500">{{ selectedUser.active_point_merchant }}</p>
              </div>
            </div>
          </div>

          <!-- Penalty List -->
          <AppLoadingSkeleton v-if="detailPending" />

          <div v-else-if="!detailData?.content?.length" class="py-8 text-center text-sm text-gray-400">
            <UIcon name="i-heroicons-shield-check" class="text-3xl text-gray-300 mb-2" />
            <p>Tidak ada riwayat penalty.</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="log in detailData.content"
              :key="log.id"
              class="border border-gray-100 rounded-xl p-3 space-y-1"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-800">{{ log.rule_name }}</p>
                  <p class="text-xs text-gray-400 font-mono">{{ log.rule_id }}</p>
                </div>
                <div class="flex-shrink-0 text-right">
                  <p class="text-sm font-bold text-red-500">{{ log.points }} poin</p>
                  <UBadge :color="log.is_expired ? 'neutral' : 'success'" variant="subtle" size="xs">
                    {{ log.is_expired ? 'Kedaluwarsa' : 'Aktif' }}
                  </UBadge>
                </div>
              </div>
              <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
                <span>Exp: {{ dayjs(log.expired_at).format('DD MMM YYYY') }}</span>
                <span>{{ dayjs(log.created_at).format('DD MMM YYYY, HH:mm') }}</span>
                <span v-if="log.given_by_email">Oleh: {{ log.given_by_email }}</span>
              </div>
              <p v-if="log.notes" class="text-xs text-gray-400 italic">{{ log.notes }}</p>
            </div>
          </div>

          <!-- Pagination detail -->
          <div v-if="detailData && detailData.total_pages > 1" class="flex justify-center pt-2">
            <UPagination
              :page="detailPage + 1"
              :total="detailData.total_elements"
              :items-per-page="10"
              :sibling-count="1"
              show-edges
              @update:page="(p) => { detailPage = p - 1; loadDetail() }"
            />
          </div>

        </div>
      </template>
    </USlideover>

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

    <!-- Filter -->
    <UCard class="shadow-sm">
      <div class="flex flex-col sm:flex-row gap-3 flex-wrap">
        <UInput
          v-model="search"
          placeholder="Cari email user..."
          icon="i-heroicons-magnifying-glass"
          class="flex-1 min-w-48"
          clearable
        />
        <USelect
          v-model="filterStatus"
          :items="statusOptions"
          value-key="value"
          placeholder="Semua Status"
          class="w-full sm:w-44"
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
          Daftar User dengan Penalty
          <span v-if="users?.total_elements" class="text-xs text-gray-400 font-normal ml-2">
            ({{ users.total_elements }} total)
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

      <div v-else-if="!users?.content?.length" class="py-10 text-center text-gray-400 text-sm">
        <UIcon name="i-heroicons-shield-check" class="text-4xl text-gray-300 mb-3" />
        <p>Tidak ada user dengan riwayat penalty.</p>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <button
          v-for="user in users.content"
          :key="user.user.id"
          type="button"
          class="w-full flex flex-col sm:flex-row items-center gap-4 py-4 px-2 hover:bg-gray-50 rounded-xl transition-colors text-left"
          @click="openDetail(user)"
        >
          <!-- Info -->
          <div class="flex gap-3 flex-1 min-w-0">
            <div class="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden bg-gray-100">
              <NuxtImg
                v-if="user.user.avatar_url"
                :src="getImageUrl(user.user.avatar_url)"
                class="w-full h-full object-cover"
                alt="avatar"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <UIcon name="i-heroicons-user" class="text-lg text-gray-400" />
              </div>
            </div>
            <div class="flex flex-col gap-1 min-w-0">
              <p class="text-sm font-semibold text-gray-800">{{ user.user.full_name ?? user.user.username }}</p>
              <p class="text-xs text-gray-400">{{ user.user.email }}</p>
              <div class="flex flex-wrap gap-1 mt-0.5">
                <UBadge :color="suspendColor(user.suspend_status)" variant="subtle" size="xs">
                  {{ suspendLabel(user.suspend_status) }}
                </UBadge>
                <span v-if="user.suspend_until && user.suspend_status === 'TEMPORARY'" class="text-xs text-gray-400 self-center">
                  s/d {{ dayjs(user.suspend_until).format('DD MMM YYYY') }}
                </span>
              </div>
            </div>
          </div>

          <!-- Points + chevron -->
          <div class="flex items-center gap-4 sm:ml-auto flex-shrink-0">
            <div class="text-right space-y-0.5">
              <div class="flex items-center justify-end gap-1">
                <UIcon name="i-heroicons-user" class="text-gray-400 text-xs" />
                <p class="text-sm font-bold text-red-500">{{ user.active_points }}</p>
                <p class="text-xs text-gray-400">poin</p>
              </div>
              <div class="flex items-center justify-end gap-1">
                <UIcon name="material-symbols:store" class="text-gray-400 text-xs" />
                <p class="text-sm font-bold text-orange-500">{{ user.active_point_merchant }}</p>
                <p class="text-xs text-gray-400">poin</p>
              </div>
            </div>
            <UIcon name="i-heroicons-chevron-right" class="text-gray-300 text-lg flex-shrink-0" />
          </div>
        </button>
      </div>

      <!-- Pagination -->
      <div
        v-if="users && users.total_pages > 1 && !pending"
        class="flex justify-center items-center pt-4"
      >
        <UPagination
          :page="page + 1"
          :total="users.total_elements"
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
import { usePenaltyApi } from '~/composables/api/penalty'
import type { PageResponse } from '~/types/PageResponse'
import type { PenaltyResponse } from '~/types/penalty/PenaltyResponse'
import type { PenaltyUserResponse, UserSuspendStatus } from '~/types/penalty/PenaltyUserResponse'

definePageMeta({ layout: 'admin', label: 'Penalty User' })

const { fetchPenaltyUsers, fetchUserPenaltyDetail } = usePenaltyApi()

// ===== LIST STATE =====
const page = ref(0)
const perPageValue = ref(20)
const perPageItems = [10, 20, 50, 100]
const search = ref('')
const keyword = ref('')
const filterStatus = ref('NONE')

const statusOptions = [
  { label: 'Normal', value: 'NONE' },
  { label: 'Peringatan', value: 'WARNING' },
  { label: 'Suspended Sementara', value: 'TEMPORARY' },
  { label: 'Suspended Permanen', value: 'PERMANENT' },
]

let searchTimeout: ReturnType<typeof setTimeout> | null = null

watch(search, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    keyword.value = val
    page.value = 0
    refresh()
  }, 500)
})

// ===== FETCH =====
const {
  data: users,
  pending,
  error,
  refresh,
} = useAsyncData<PageResponse<PenaltyUserResponse>>(
  'admin-penalty-users',
  () => fetchPenaltyUsers(page.value, perPageValue.value, keyword.value, filterStatus.value),
  { watch: [page, perPageValue], server: false }
)

// ===== STATS =====
const statsCards = computed(() => {
  const list = users.value?.content ?? []
  const total = users.value?.total_elements ?? 0
  const suspended = list.filter(u => u.suspend_status !== 'NONE').length
  const permanent = list.filter(u => u.suspend_status === 'PERMANENT').length
  const maxPoints = list.length ? Math.max(...list.map(u => u.active_points)) : 0

  return [
    { label: 'Total User', value: total.toString(), icon: 'i-heroicons-users', bgColor: 'bg-red-50', iconColor: 'text-red-500' },
    { label: 'Disuspend', value: suspended.toString(), icon: 'i-heroicons-no-symbol', bgColor: 'bg-orange-50', iconColor: 'text-orange-500' },
    { label: 'Suspend Permanen', value: permanent.toString(), icon: 'i-heroicons-x-circle', bgColor: 'bg-rose-50', iconColor: 'text-rose-500' },
    { label: 'Poin Tertinggi', value: maxPoints.toString(), icon: 'i-heroicons-arrow-trending-up', bgColor: 'bg-purple-50', iconColor: 'text-purple-500' },
  ]
})

// ===== HELPERS =====
function onPageChange(newPage: number) {
  page.value = newPage - 1
}

function handleFilter() {
  page.value = 0
  refresh()
}

function suspendColor(status: UserSuspendStatus) {
  if (status === 'PERMANENT') return 'error'
  if (status === 'TEMPORARY') return 'warning'
  return 'success'
}

function suspendLabel(status: UserSuspendStatus) {
  if (status === 'PERMANENT') return 'Suspend Permanen'
  if (status === 'TEMPORARY') return 'Suspend Sementara'
  return 'Normal'
}

// ===== DETAIL SLIDEOVER =====
const showDetail = ref(false)
const selectedUser = ref<PenaltyUserResponse | null>(null)
const detailPage = ref(0)
const detailData = ref<PageResponse<PenaltyResponse> | null>(null)
const detailPending = ref(false)

async function loadDetail() {
  if (!selectedUser.value) return
  detailPending.value = true
  try {
    detailData.value = await fetchUserPenaltyDetail(selectedUser.value.user.id, detailPage.value, 10)
  } finally {
    detailPending.value = false
  }
}

async function openDetail(user: PenaltyUserResponse) {
  selectedUser.value = user
  detailPage.value = 0
  detailData.value = null
  showDetail.value = true
  await loadDetail()
}
</script>
