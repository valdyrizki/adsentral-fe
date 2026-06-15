<template>
  <div class="space-y-6">

    <!-- Apply Penalty Modal -->
    <FormApplyPenaltyModal
      v-model="showApplyModal"
      :penalty-rules="penaltyRules"
      :initial-user="applyForUser"
      @submitted="refresh()"
    />

    <!-- User Detail Slideover -->
    <FormPenaltyUserDetailSlideover
      v-model="showDetail"
      :user="selectedUser"
      @apply-penalty="openApplyForUser"
      @penalty-cancelled="refresh()"
    />

    <ClientOnly>
      <template #fallback>
        <div class="space-y-4">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div v-for="i in 4" :key="i" class="bg-white border border-gray-200 rounded-xl p-4">
              <USkeleton class="h-3 w-24 rounded mb-2" />
              <USkeleton class="h-7 w-20 rounded" />
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

    <!-- Filter + Actions -->
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
        <UButton icon="i-heroicons-shield-exclamation" color="error" @click="openApplyModal">
          Kenakan Penalty
        </UButton>
      </div>
    </UCard>

    <!-- List User -->
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
          <!-- Avatar + Info -->
          <div class="flex gap-3 flex-1 min-w-0">
            <div
              class="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden"
              :class="user.user.role === 'SELLER' ? 'bg-orange-100' : 'bg-sky-100'"
            >
              <NuxtImg
                v-if="user.user.avatar_url"
                :src="getImageUrl(user.user.avatar_url)"
                class="w-full h-full object-cover"
                alt="avatar"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <UIcon
                  :name="user.user.role === 'SELLER' ? 'i-heroicons-building-storefront' : 'i-heroicons-user'"
                  :class="user.user.role === 'SELLER' ? 'text-orange-500' : 'text-sky-500'"
                  class="text-lg"
                />
              </div>
            </div>
            <div class="flex flex-col gap-1 min-w-0">
              <p class="text-sm font-semibold text-gray-800">{{ user.user.full_name ?? user.user.username }}</p>
              <p class="text-xs text-gray-400">{{ user.user.email }}</p>
              <div class="flex flex-wrap gap-1 mt-0.5">
                <UBadge :color="user.user.role === 'SELLER' ? 'warning' : 'info'" variant="subtle" size="xs">
                  {{ user.user.role === 'SELLER' ? 'Seller' : 'Buyer' }}
                </UBadge>
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
            <div class="text-right">
              <p class="text-lg font-bold text-red-500">{{ user.active_points }}</p>
              <p class="text-xs text-gray-400">poin aktif</p>
            </div>
            <UIcon name="i-heroicons-chevron-right" class="text-gray-300 text-lg flex-shrink-0" />
          </div>
        </button>
      </div>

      <!-- Pagination -->
      <div v-if="users && users.total_pages > 1 && !pending" class="flex justify-center items-center pt-4">
        <UPagination
          :page="page + 1"
          :total="users.total_elements"
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
import { usePenaltyRuleApi } from '~/composables/api/penalty-rule'
import type { PageResponse } from '~/types/PageResponse'
import type { PenaltyRuleResponse } from '~/types/penalty/PenaltyRuleResponse'
import type { PenaltyUserResponse, UserSuspendStatus } from '~/types/penalty/PenaltyUserResponse'
import type { UserResponse } from '~/types/UserResponse'

definePageMeta({ layout: 'admin', label: 'Manage Penalty' })

const { fetchPenaltyUsers } = usePenaltyApi()
const { fetchAllPenaltyRules } = usePenaltyRuleApi()

// ===== LIST STATE =====
const page = ref(0)
const perPageValue = ref(20)
const perPageItems = [10, 20, 50, 100]
const search = ref('')
const keyword = ref('')
const filterStatus = ref('ALL')

const statusOptions = [
  { label: 'Semua', value: 'ALL' },
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

// ===== FETCH USERS =====
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

// ===== FETCH RULES =====
const { data: rulesData } = useAsyncData<PageResponse<PenaltyRuleResponse>>(
  'admin-penalty-rules-for-apply',
  () => fetchAllPenaltyRules(0, 100),
  { server: false }
)

const penaltyRules = computed(() =>
  (rulesData.value?.content ?? []).filter(r => r.is_active)
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

function openDetail(user: PenaltyUserResponse) {
  selectedUser.value = user
  showDetail.value = true
}

// ===== APPLY MODAL =====
const showApplyModal = ref(false)
const applyForUser = ref<UserResponse | null>(null)

function openApplyModal() {
  applyForUser.value = null
  showApplyModal.value = true
}

function openApplyForUser(penaltyUser: PenaltyUserResponse) {
  applyForUser.value = penaltyUser.user
  showDetail.value = false
  setTimeout(() => { showApplyModal.value = true }, 300)
}
</script>
