<template>
  <div class="space-y-6">

    <!-- Create Modal -->
    <FormPenaltyRuleModal
      v-model="showCreateModal"
      :submitting="creating"
      @submit="handleCreate"
    />

    <!-- Edit Modal -->
    <FormPenaltyRuleEditModal
      v-model="showEditModal"
      :rule="editingRule"
      :submitting="updating"
      @submit="handleUpdate"
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

    <!-- Filters -->
    <UCard class="shadow-sm">
      <div class="flex flex-col sm:flex-row gap-3 flex-wrap">
        <UInput
          v-model="search"
          placeholder="Cari nama / ID rule..."
          icon="i-heroicons-magnifying-glass"
          class="flex-1 min-w-48"
          clearable
          @keyup.enter="handleSearch"
        />
        <USelect v-model="perPageValue" :items="perPageItems" class="w-full sm:w-24" />
        <UButton icon="mdi:refresh" color="neutral" variant="outline" :loading="pending" @click="refresh()">
          Refresh
        </UButton>
      </div>
    </UCard>

    <!-- Table -->
    <UCard class="shadow-sm">
      <template #header>
        <div class="flex items-center justify-between">
          <p class="font-semibold text-gray-800">
            Daftar Penalty Rule
            <span v-if="rules?.total_elements" class="text-xs text-gray-400 font-normal ml-2">
              ({{ rules.total_elements }} total)
            </span>
          </p>
          <UButton
            icon="i-heroicons-plus"
            color="primary"
            size="sm"
            @click="showCreateModal = true"
          >
            Tambah Rule
          </UButton>
        </div>
      </template>

      <AppLoadingSkeleton v-if="pending" />

      <UAlert
        v-else-if="error"
        title="Terjadi Kesalahan"
        :description="error.message || 'Gagal memuat data'"
        icon="icon-park-solid:error"
        color="error"
      />

      <div v-else-if="!rules?.content?.length" class="py-10 text-center text-gray-400 text-sm">
        <UIcon name="i-heroicons-inbox" class="text-4xl text-gray-300 mb-3" />
        <p>Tidak ada penalty rule.</p>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="rule in rules.content"
          :key="rule.id"
          class="flex flex-col sm:flex-row gap-4 py-4 px-2 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <!-- Icon + Info -->
          <div class="flex gap-4 flex-1 min-w-0">
            <!-- Icon -->
            <div
              :class="`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${rule.target_role === 'SELLER' ? 'bg-orange-100' : 'bg-sky-100'}`"
            >
              <UIcon
                :name="rule.target_role === 'SELLER' ? 'i-heroicons-building-storefront' : 'i-heroicons-user'"
                :class="`text-lg ${rule.target_role === 'SELLER' ? 'text-orange-500' : 'text-sky-500'}`"
              />
            </div>

            <!-- Name & ID -->
            <div class="flex flex-col gap-1 min-w-0">
              <p class="text-sm font-semibold text-gray-800">{{ rule.name }}</p>
              <p class="text-xs text-gray-400 font-mono">{{ rule.id }}</p>
              <p v-if="rule.description" class="text-xs text-gray-500 line-clamp-2">{{ rule.description }}</p>
              <div class="flex flex-wrap gap-1 mt-1">
                <!-- Target Role -->
                <UBadge
                  :color="rule.target_role === 'SELLER' ? 'warning' : 'info'"
                  variant="subtle"
                  size="xs"
                >
                  {{ rule.target_role === 'SELLER' ? 'Seller' : 'Buyer' }}
                </UBadge>
                <!-- Trigger Type -->
                <UBadge
                  :color="rule.trigger_type === 'AUTO' ? 'primary' : 'neutral'"
                  variant="soft"
                  size="xs"
                >
                  <UIcon
                    :name="rule.trigger_type === 'AUTO' ? 'i-heroicons-bolt' : 'i-heroicons-hand-raised'"
                    class="mr-1 text-xs"
                  />
                  {{ rule.trigger_type === 'AUTO' ? 'Otomatis' : 'Manual' }}
                </UBadge>
                <!-- Active Status -->
                <UBadge
                  :color="rule.is_active ? 'success' : 'neutral'"
                  variant="subtle"
                  size="xs"
                >
                  {{ rule.is_active ? 'Aktif' : 'Nonaktif' }}
                </UBadge>
              </div>
            </div>
          </div>

          <!-- Points + Date + Actions -->
          <div class="flex flex-col gap-2 sm:items-end sm:ml-auto flex-shrink-0">
            <!-- Points -->
            <div class="flex items-center gap-1">
              <UIcon name="i-heroicons-exclamation-triangle" class="text-red-400 text-sm" />
              <span class="text-base font-bold text-red-500">{{ rule.points }} poin</span>
            </div>
            <!-- Expired Days -->
            <div class="flex items-center gap-1">
              <UIcon name="i-heroicons-clock" class="text-gray-400 text-sm" />
              <span class="text-xs text-gray-500">Berlaku {{ rule.expired_days }} hari</span>
            </div>
            <!-- Created At -->
            <p class="text-xs text-gray-400">
              {{ dayjs(rule.created_at).format('DD MMM YYYY') }}
            </p>
            <!-- Edit Action -->
            <UButton
              color="neutral"
              variant="soft"
              size="xs"
              icon="i-heroicons-pencil-square"
              label="Edit"
              @click="openEdit(rule)"
            />
            <!-- Toggle Action -->
            <UButton
              :color="rule.is_active ? 'error' : 'success'"
              variant="soft"
              size="xs"
              :icon="rule.is_active ? 'i-heroicons-pause-circle' : 'i-heroicons-play-circle'"
              :label="rule.is_active ? 'Nonaktifkan' : 'Aktifkan'"
              :loading="togglingId === rule.id"
              @click="handleToggle(rule)"
            />
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="rules && rules.total_pages > 1 && !pending"
        class="flex justify-center items-center pt-4"
      >
        <UPagination
          :page="page + 1"
          :total="rules.total_elements"
          :items-per-page="perPageValue"
          :sibling-count="1"
          show-edges
          @update:page="onPageChange"
        />
      </div>
    </UCard>
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { usePenaltyRuleApi } from '~/composables/api/penalty-rule'
import type { PageResponse } from '~/types/PageResponse'
import type { PenaltyRuleRequest } from '~/types/penalty/PenaltyRuleRequest'
import type { PenaltyRuleResponse } from '~/types/penalty/PenaltyRuleResponse'
import type { PenaltyRuleUpdateRequest } from '~/types/penalty/PenaltyRuleUpdateRequest'

definePageMeta({ layout: 'admin', label: 'Penalty Rule' })

const toast = useToast()
const { fetchAllPenaltyRules, fetchTogglePenaltyRule, createPenaltyRule, updatePenaltyRule } = usePenaltyRuleApi()

// ===== FILTER STATE =====
const page = ref(0)
const perPageValue = ref(5)
const perPageItems = [5, 10, 20, 50, 100]
const search = ref('')
const keyword = ref('')

let searchTimeout: ReturnType<typeof setTimeout> | null = null

// ===== FETCH =====
const {
  data: rules,
  pending,
  error,
  refresh,
} = useAsyncData<PageResponse<PenaltyRuleResponse>>(
  'admin-penalty-rules',
  () =>
    fetchAllPenaltyRules(page.value, perPageValue.value, keyword.value),
  { watch: [page, perPageValue], server: false }
)

// ===== STATS =====
const statsCards = computed(() => {
  const list = rules.value?.content ?? []
  const total = rules.value?.total_elements ?? 0
  const active = list.filter(r => r.is_active).length
  const sellers = list.filter(r => r.target_role === 'SELLER').length
  const auto = list.filter(r => r.trigger_type === 'AUTO').length

  return [
    { label: 'Total Rule', value: total.toString(), icon: 'i-heroicons-shield-exclamation', bgColor: 'bg-red-50', iconColor: 'text-red-500' },
    { label: 'Aktif', value: active.toString(), icon: 'i-heroicons-check-circle', bgColor: 'bg-green-50', iconColor: 'text-green-500' },
    { label: 'Berlaku ke Seller', value: sellers.toString(), icon: 'i-heroicons-building-storefront', bgColor: 'bg-orange-50', iconColor: 'text-orange-500' },
    { label: 'Trigger Otomatis', value: auto.toString(), icon: 'i-heroicons-bolt', bgColor: 'bg-purple-50', iconColor: 'text-purple-500' },
  ]
})

// ===== HELPERS =====
function onPageChange(newPage: number) {
  page.value = newPage - 1
}

watch(search, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    keyword.value = val
    page.value = 0
    refresh()
  }, 500)
})

function handleSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  keyword.value = search.value
  page.value = 0
  refresh()
}

// ===== CREATE =====
const showCreateModal = ref(false)
const creating = ref(false)

async function handleCreate(payload: PenaltyRuleRequest) {
  creating.value = true
  try {
    await createPenaltyRule(payload)
    toast.add({ title: 'Penalty rule berhasil dibuat', color: 'success', icon: 'i-heroicons-check-circle' })
    showCreateModal.value = false
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Gagal membuat rule', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    creating.value = false
  }
}

// ===== EDIT =====
const showEditModal = ref(false)
const editingRule = ref<PenaltyRuleResponse | null>(null)
const updating = ref(false)

function openEdit(rule: PenaltyRuleResponse) {
  editingRule.value = rule
  showEditModal.value = true
}

async function handleUpdate(payload: PenaltyRuleUpdateRequest) {
  if (!editingRule.value) return
  updating.value = true
  try {
    await updatePenaltyRule(editingRule.value.id, payload)
    toast.add({ title: 'Penalty rule berhasil diupdate', color: 'success', icon: 'i-heroicons-check-circle' })
    showEditModal.value = false
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Gagal mengupdate rule', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    updating.value = false
  }
}

// ===== TOGGLE ACTIVE =====
const togglingId = ref<string | null>(null)
const { confirm, close } = useConfirm()

async function handleToggle(rule: PenaltyRuleResponse) {
  const yes = await confirm({
    title: rule.is_active ? 'Nonaktifkan Rule?' : 'Aktifkan Rule?',
    message: rule.is_active
      ? `Rule "${rule.name}" akan dinonaktifkan dan tidak akan diterapkan.`
      : `Rule "${rule.name}" akan diaktifkan kembali.`,
    confirmText: rule.is_active ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan',
    cancelText: 'Batal',
    confirmColor: rule.is_active ? 'error' : 'success',
  })

  if (!yes) return

  togglingId.value = rule.id
  try {
    await fetchTogglePenaltyRule(rule.id)
    toast.add({
      title: rule.is_active ? 'Rule dinonaktifkan' : 'Rule diaktifkan',
      color: rule.is_active ? 'warning' : 'success',
      icon: 'i-heroicons-check-circle',
    })
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Gagal mengubah status', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    togglingId.value = null
    close()
  }
}
</script>
