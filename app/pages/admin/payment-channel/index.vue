<template>
  <div class="space-y-6">

    <!-- Modal: Edit Nama Channel (v-if agar tidak dirender saat SSR) -->
    <UModal v-if="showEditModal" v-model:open="showEditModal" title="Edit Nama Channel" :ui="{ footer: 'justify-end' }">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Code Channel">
            <UInput :model-value="editingChannel?.code" disabled class="w-full font-mono" />
          </UFormField>
          <UFormField label="Nama" required>
            <UInput v-model="editForm.name" placeholder="Nama channel..." class="w-full" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <UButton color="neutral" variant="outline" @click="closeEditModal">Batal</UButton>
        <UButton color="primary" :loading="saving" icon="mdi:content-save-outline" @click="handleSaveName">
          Simpan
        </UButton>
      </template>
    </UModal>

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

    <!-- Header Stats -->
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
      <div class="flex flex-col sm:flex-row gap-3 items-center flex-wrap">
        <UInput
          v-model="search"
          placeholder="Cari code / nama channel..."
          icon="mdi:magnify"
          class="w-full sm:w-56"
          clearable
        />
        <USelect
          v-model="filterPaymentMethodId"
          :items="paymentMethodFilterOptions"
          value-key="value"
          class="w-full sm:w-48"
          @update:model-value="handleFilter"
        />
        <USelect
          v-model="filterStatus"
          :items="statusFilterOptions"
          value-key="value"
          class="w-full sm:w-40"
          @update:model-value="handleFilter"
        />
        <USelect v-model="perPageValue" :items="perPageItems" class="w-24" @update:model-value="handleFilter" />
        <UButton icon="mdi:refresh" color="neutral" variant="outline" :loading="pending" @click="refresh()">
          Refresh
        </UButton>
        <UButton
          icon="mdi:cloud-sync-outline"
          color="primary"
          class="sm:ml-auto"
          :loading="syncing"
          @click="handleSync"
        >
          Sync dari Tripay
        </UButton>
      </div>
    </UCard>

    <!-- Channel List -->
    <UCard class="shadow-sm">
      <template #header>
        <p class="font-semibold text-gray-800">
          Payment Channel
          <span v-if="data?.total_elements" class="text-xs text-gray-400 font-normal ml-2">({{ data.total_elements }} channel)</span>
        </p>
      </template>

      <AppLoadingSkeleton v-if="pending" />

      <UAlert
        v-else-if="error"
        title="Terjadi Kesalahan"
        :description="(error as any).statusMessage || 'Gagal memuat payment channel'"
        color="error"
        icon="mdi:alert-circle"
      />

      <div v-else-if="!data?.content?.length" class="py-10 text-center text-gray-400 text-sm">
        <UIcon name="mdi:bank-transfer" class="text-4xl text-gray-300 mb-3" />
        <p>Belum ada payment channel.</p>
        <p class="text-xs mt-1">Klik "Sync dari Tripay" untuk menarik daftar channel.</p>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="channel in data?.content ?? []"
          :key="channel.code"
          class="flex flex-col sm:flex-row sm:items-center gap-3 py-4 px-2"
          :class="channel.status !== 'ACTIVE' ? 'opacity-50' : ''"
        >
          <!-- Icon -->
          <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-sky-50 overflow-hidden">
            <img v-if="channel.icon_url" :src="channel.icon_url" class="w-full h-full object-cover" />
            <UIcon v-else name="mdi:bank-transfer" class="text-lg text-sky-500" />
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-sm font-semibold text-gray-800">{{ channel.name }}</p>
              <span class="text-xs text-gray-400 font-mono">({{ channel.code }})</span>
              <UBadge color="neutral" variant="subtle" size="xs">
                {{ paymentMethodName(channel.payment_method_id) }}
              </UBadge>
              <UBadge v-if="channel.type" color="info" variant="soft" size="xs">
                {{ channel.type }}
              </UBadge>
            </div>
            <p class="text-xs text-gray-500 mt-0.5">
              {{ channel.group }}
              <span v-if="channel.minimum_amount || channel.maximum_amount" class="text-gray-400">
                · Rp{{ channel.minimum_amount.toLocaleString('id-ID') }} - Rp{{ channel.maximum_amount.toLocaleString('id-ID') }}
              </span>
              <span class="text-gray-400">
                · Fee: {{ formatFee(channel) }}
              </span>
            </p>
          </div>

          <!-- Status + Edit -->
          <div class="flex items-center gap-3 shrink-0">
            <UBadge :color="channel.status === 'ACTIVE' ? 'success' : 'neutral'" variant="soft" size="sm">
              {{ channel.status === 'ACTIVE' ? 'Aktif' : channel.status }}
            </UBadge>
            <UButton
              size="xs"
              color="neutral"
              variant="outline"
              icon="mdi:pencil-outline"
              @click="openEditModal(channel)"
            />
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
import { usePaymentChannelApi } from '~/composables/api/payment-channel'
import { usePaymentMethodApi } from '~/composables/api/payment-method'
import type { PaymentChannelResponse } from '~/types/payment-channel/PaymentChannelResponse'
import type { PaymentMethodResponse } from '~/types/payment-method/PaymentMethodResponse'
import type { PageResponse } from '~/types/PageResponse'

definePageMeta({ layout: 'admin', label: 'Payment Channel' })

const toast = useToast()
const { fetchAllPaymentChannels, syncTripayChannels, updatePaymentChannelName } = usePaymentChannelApi()
const { fetchAllPaymentMethods } = usePaymentMethodApi()

const statusFilterOptions = [
  { label: 'Semua Status', value: 'ALL' },
  { label: 'Aktif', value: 'ACTIVE' },
  { label: 'Suspend', value: 'SUSPEND' },
]

// ===== PAYMENT METHODS (buat dropdown filter gateway) =====
const { data: paymentMethods } = await useAsyncData<PaymentMethodResponse[]>(
  'admin-payment-methods-for-channel-filter',
  () => fetchAllPaymentMethods(),
  { server: false }
)

const paymentMethodFilterOptions = computed(() => [
  { label: 'Semua Gateway', value: 'ALL' },
  ...(paymentMethods.value ?? []).map(m => ({ label: m.name, value: m.id })),
])

function paymentMethodName(id: string): string {
  return paymentMethods.value?.find(m => m.id === id)?.name ?? id
}

function formatFee(channel: PaymentChannelResponse): string {
  const parts: string[] = []
  if (channel.fee_flat) parts.push(`Rp${channel.fee_flat.toLocaleString('id-ID')}`)
  if (channel.fee_percent) parts.push(`${channel.fee_percent}%`)
  return parts.length ? parts.join(' + ') : 'Gratis'
}

// ===== FILTER & PAGINATION =====
const page = ref(0)
const perPageValue = ref(20)
const perPageItems = [10, 20, 50, 100]
const filterPaymentMethodId = ref('ALL')
const filterStatus = ref('ALL')
const search = ref('')
const debouncedSearch = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, (val) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedSearch.value = val
    page.value = 0
  }, 400)
})

function handleFilter() {
  page.value = 0
}

// ===== FETCH =====
const {
  data,
  pending,
  error,
  refresh,
} = useAsyncData<PageResponse<PaymentChannelResponse>>(
  'admin-payment-channels',
  () => fetchAllPaymentChannels({
    page: page.value,
    size: perPageValue.value,
    keyword: debouncedSearch.value || undefined,
    paymentMethodId: filterPaymentMethodId.value === 'ALL' ? undefined : filterPaymentMethodId.value,
    status: filterStatus.value,
  }),
  { watch: [page, perPageValue, filterPaymentMethodId, filterStatus, debouncedSearch], server: false }
)

// ===== STATS =====
const statsCards = computed(() => {
  const list = data.value?.content ?? []
  const total = data.value?.total_elements ?? 0
  const active = list.filter(c => c.status === 'ACTIVE').length
  const suspended = list.filter(c => c.status !== 'ACTIVE').length
  const gatewayCount = new Set((paymentMethods.value ?? []).map(m => m.id)).size

  return [
    { label: 'Total Channel', value: total.toString(), icon: 'mdi:bank-transfer', bgColor: 'bg-sky-50', iconColor: 'text-sky-500' },
    { label: 'Aktif (halaman ini)', value: active.toString(), icon: 'mdi:check-circle-outline', bgColor: 'bg-green-50', iconColor: 'text-green-500' },
    { label: 'Nonaktif (halaman ini)', value: suspended.toString(), icon: 'mdi:close-circle-outline', bgColor: 'bg-red-50', iconColor: 'text-red-400' },
    { label: 'Gateway', value: gatewayCount.toString(), icon: 'mdi:credit-card-multiple-outline', bgColor: 'bg-purple-50', iconColor: 'text-purple-500' },
  ]
})

// ===== EDIT NAME =====
const showEditModal = ref(false)
const editingChannel = ref<PaymentChannelResponse | null>(null)
const saving = ref(false)
const editForm = reactive({ name: '' })

function openEditModal(channel: PaymentChannelResponse) {
  editingChannel.value = channel
  editForm.name = channel.name
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editingChannel.value = null
}

async function handleSaveName() {
  if (!editingChannel.value) return
  if (!editForm.name.trim()) {
    toast.add({ title: 'Nama channel wajib diisi', color: 'warning' })
    return
  }
  saving.value = true
  try {
    await updatePaymentChannelName(editingChannel.value.code, editForm.name.trim())
    toast.add({ title: 'Nama channel berhasil diupdate', color: 'success', icon: 'mdi:check-circle' })
    closeEditModal()
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Gagal menyimpan', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

// ===== SYNC FROM TRIPAY =====
const syncing = ref(false)

async function handleSync() {
  syncing.value = true
  try {
    const synced = await syncTripayChannels()
    toast.add({
      title: 'Sync berhasil',
      description: `${synced.length} channel berhasil disinkronkan dari Tripay`,
      color: 'success',
      icon: 'mdi:check-circle',
    })
    page.value = 0
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Gagal sync dari Tripay', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    syncing.value = false
  }
}
</script>
