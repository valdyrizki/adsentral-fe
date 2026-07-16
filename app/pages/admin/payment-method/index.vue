<template>
  <div class="space-y-6">

    <!-- Modal: Tambah / Edit Metode Pembayaran (v-if agar tidak dirender saat SSR) -->
    <UModal v-if="showAddModal" v-model:open="showAddModal" :title="isEdit ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'" :ui="{ footer: 'justify-end' }">
      <template #body>
        <div class="space-y-4">
          <UFormField label="ID Metode" required>
            <UInput
              v-model="form.id"
              placeholder="Contoh: BCA_VA"
              class="w-full font-mono uppercase"
              maxlength="15"
              :disabled="isEdit"
              @input="!isEdit && (form.id = (form.id as string).toUpperCase().replace(/\s/g, '_'))"
            />
            <template v-if="!isEdit" #hint>
              <span class="text-xs text-gray-400">Maks 15 karakter, huruf kapital tanpa spasi</span>
            </template>
          </UFormField>
          <UFormField label="Nama" required>
            <UInput v-model="form.name" placeholder="Contoh: BCA Virtual Account" class="w-full" maxlength="100" />
          </UFormField>
          <UFormField label="Deskripsi">
            <UTextarea v-model="form.description" placeholder="Deskripsi metode pembayaran..." :rows="2" class="w-full" />
          </UFormField>
          <UFormField label="Icon URL">
            <UInput v-model="form.icon_url" placeholder="https://..." class="w-full" />
          </UFormField>
          <UFormField v-if="isEdit" label="Status" required>
            <USelect
              v-model="form.status"
              :items="statusOptions"
              value-key="value"
              class="w-full"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <UButton color="neutral" variant="outline" @click="closeModal">Batal</UButton>
        <UButton color="primary" :loading="saving" icon="mdi:content-save-outline" @click="handleSave">
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
      <div class="flex flex-col sm:flex-row gap-3 items-center">
        <UInput
          v-model="search"
          placeholder="Cari ID / nama..."
          icon="mdi:magnify"
          class="w-full sm:w-64"
          clearable
        />
        <USelect
          v-model="filterStatus"
          :items="[{ label: 'Semua Status', value: 'ALL' }, ...statusOptions]"
          value-key="value"
          class="w-full sm:w-48"
        />
        <UButton icon="mdi:refresh" color="neutral" variant="outline" :loading="pending" @click="refresh()">
          Refresh
        </UButton>
        <UButton icon="mdi:plus" color="primary" class="sm:ml-auto" @click="openAddModal">
          Tambah Metode
        </UButton>
      </div>
    </UCard>

    <!-- Payment Method List -->
    <UCard class="shadow-sm">
      <template #header>
        <p class="font-semibold text-gray-800">
          Metode Pembayaran
          <span v-if="filteredMethods.length" class="text-xs text-gray-400 font-normal ml-2">({{ filteredMethods.length }} metode)</span>
        </p>
      </template>

      <AppLoadingSkeleton v-if="pending" />

      <UAlert
        v-else-if="error"
        title="Terjadi Kesalahan"
        :description="(error as any).statusMessage || 'Gagal memuat metode pembayaran'"
        color="error"
        icon="mdi:alert-circle"
      />

      <div v-else-if="!filteredMethods.length" class="py-10 text-center text-gray-400 text-sm">
        <UIcon name="mdi:credit-card-outline" class="text-4xl text-gray-300 mb-3" />
        <p>Belum ada metode pembayaran.</p>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="method in filteredMethods"
          :key="method.id"
          class="flex flex-col sm:flex-row sm:items-center gap-3 py-4 px-2"
          :class="method.status !== 'ACTIVE' ? 'opacity-50' : ''"
        >
          <!-- Icon -->
          <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-sky-50 overflow-hidden">
            <img v-if="method.icon_url" :src="method.icon_url" class="w-full h-full object-cover" />
            <UIcon v-else name="mdi:credit-card-outline" class="text-lg text-sky-500" />
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-sm font-semibold text-gray-800">{{ method.name }}</p>
              <span class="text-xs text-gray-400 font-mono">({{ method.id }})</span>
            </div>
            <p v-if="method.description" class="text-xs text-gray-500 mt-0.5">{{ method.description }}</p>
          </div>

          <!-- Status + Toggle + Edit -->
          <div class="flex items-center gap-3 shrink-0">
            <UBadge :color="method.status === 'ACTIVE' ? 'success' : 'neutral'" variant="soft" size="sm">
              {{ method.status === 'ACTIVE' ? 'Aktif' : 'Suspended' }}
            </UBadge>
            <UButton
              size="xs"
              color="neutral"
              variant="outline"
              icon="mdi:pencil-outline"
              @click="openEditModal(method)"
            />
            <USwitch
              :model-value="method.status === 'ACTIVE'"
              :disabled="toggling === method.id"
              @update:model-value="handleToggle(method)"
            />
          </div>
        </div>
      </div>
    </UCard>
    </ClientOnly>

  </div>
</template>

<script lang="ts" setup>
import { usePaymentMethodApi } from '~/composables/api/payment-method'
import type { PaymentMethodResponse } from '~/types/payment-method/PaymentMethodResponse'

definePageMeta({ layout: 'admin', label: 'Metode Pembayaran' })

const toast = useToast()
const {
  fetchAllPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  suspendPaymentMethod,
  activatePaymentMethod,
} = usePaymentMethodApi()

const statusOptions = [
  { label: 'Aktif', value: 'ACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
]

// ===== FILTER =====
const search = ref('')
const filterStatus = ref<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL')

const debouncedSearch = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, (val) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedSearch.value = val
  }, 400)
})

// ===== FETCH =====
const {
  data,
  pending,
  error,
  refresh,
} = useAsyncData<PaymentMethodResponse[]>(
  'admin-payment-methods',
  () => fetchAllPaymentMethods(),
  { server: false }
)

const filteredMethods = computed(() => {
  let list = data.value ?? []
  if (filterStatus.value !== 'ALL') {
    list = list.filter(m => m.status === filterStatus.value)
  }
  const keyword = debouncedSearch.value.trim().toLowerCase()
  if (keyword) {
    list = list.filter(m =>
      m.id.toLowerCase().includes(keyword) ||
      m.name.toLowerCase().includes(keyword)
    )
  }
  return list
})

// ===== STATS =====
const statsCards = computed(() => {
  const list = data.value ?? []
  const total = list.length
  const active = list.filter(m => m.status === 'ACTIVE').length
  const suspended = list.filter(m => m.status === 'SUSPENDED').length

  return [
    { label: 'Total Metode', value: total.toString(), icon: 'mdi:credit-card-multiple-outline', bgColor: 'bg-sky-50', iconColor: 'text-sky-500' },
    { label: 'Aktif', value: active.toString(), icon: 'mdi:check-circle-outline', bgColor: 'bg-green-50', iconColor: 'text-green-500' },
    { label: 'Suspended', value: suspended.toString(), icon: 'mdi:close-circle-outline', bgColor: 'bg-red-50', iconColor: 'text-red-400' },
  ]
})

// ===== TOGGLE (suspend / activate) =====
const toggling = ref<string | null>(null)

async function handleToggle(method: PaymentMethodResponse) {
  toggling.value = method.id
  try {
    if (method.status === 'ACTIVE') {
      await suspendPaymentMethod(method.id)
      toast.add({ title: 'Metode disuspend', color: 'success', icon: 'mdi:check-circle' })
    } else {
      await activatePaymentMethod(method.id)
      toast.add({ title: 'Metode diaktifkan', color: 'success', icon: 'mdi:check-circle' })
    }
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Gagal mengubah status', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    toggling.value = null
  }
}

// ===== ADD / EDIT =====
const showAddModal = ref(false)
const isEdit = ref(false)
const saving = ref(false)

const form = reactive({
  id: '',
  name: '',
  description: '',
  icon_url: '',
  status: 'ACTIVE' as PaymentMethodResponse['status'],
})

function closeModal() {
  showAddModal.value = false
  isEdit.value = false
}

function openAddModal() {
  form.id = ''
  form.name = ''
  form.description = ''
  form.icon_url = ''
  form.status = 'ACTIVE'
  isEdit.value = false
  showAddModal.value = true
}

function openEditModal(method: PaymentMethodResponse) {
  form.id = method.id
  form.name = method.name
  form.description = method.description ?? ''
  form.icon_url = method.icon_url ?? ''
  form.status = method.status
  isEdit.value = true
  showAddModal.value = true
}

async function handleSave() {
  if (!isEdit.value && !form.id.trim()) {
    toast.add({ title: 'ID metode wajib diisi', color: 'warning' })
    return
  }
  if (!form.name.trim()) {
    toast.add({ title: 'Nama metode wajib diisi', color: 'warning' })
    return
  }
  saving.value = true
  try {
    const payload = {
      id: form.id.trim(),
      name: form.name.trim(),
      description: form.description.trim(),
      icon_url: form.icon_url.trim() || null,
      status: form.status,
    }
    if (isEdit.value) {
      await updatePaymentMethod(form.id, payload)
      toast.add({ title: 'Metode pembayaran berhasil diupdate', color: 'success', icon: 'mdi:check-circle' })
    } else {
      await createPaymentMethod(payload)
      toast.add({ title: 'Metode pembayaran berhasil ditambahkan', color: 'success', icon: 'mdi:check-circle' })
    }
    showAddModal.value = false
    isEdit.value = false
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Gagal menyimpan', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>
