<template>
  <div class="space-y-6">

    <!-- Modal: Tambah / Edit Tipe Akun (v-if agar tidak dirender saat SSR) -->
    <UModal v-if="showModal" v-model:open="showModal" :title="isEdit ? 'Edit Tipe Akun' : 'Tambah Tipe Akun'" :ui="{ footer: 'justify-end' }">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Nama Tipe Akun" required>
            <UInput v-model="form.name" placeholder="Contoh: Mobile Legends" class="w-full" maxlength="100" @keyup.enter="handleSave" />
          </UFormField>
          <UFormField label="Status" required help="Tipe nonaktif tidak muncul di pilihan seller. Stok lama yang memakai tipe ini tetap aman.">
            <USelect
              v-model="form.status"
              :items="statusItems"
              value-key="value"
              class="w-full"
            />
          </UFormField>
          <p v-if="formError" class="text-sm text-red-500">{{ formError }}</p>
        </div>
      </template>
      <template #footer>
        <UButton color="neutral" variant="outline" @click="closeModal">Batal</UButton>
        <UButton color="primary" :loading="saving" icon="mdi:content-save-outline" @click="handleSave">
          Simpan
        </UButton>
      </template>
    </UModal>

    <!-- Filter + Actions -->
    <UCard class="shadow-sm">
      <div class="flex flex-col sm:flex-row gap-3 items-center">
        <UInput
          v-model="search"
          placeholder="Cari tipe akun..."
          icon="mdi:magnify"
          class="w-full sm:w-64"
        />
        <USelect v-model="perPageValue" :items="perPageItems" class="w-24" @update:model-value="page = 0" />
        <UButton icon="mdi:refresh" color="neutral" variant="outline" :loading="pending" @click="refresh()">
          Refresh
        </UButton>
        <UButton icon="mdi:plus" color="primary" class="sm:ml-auto" @click="openAddModal">
          Tambah Tipe Akun
        </UButton>
      </div>
    </UCard>

    <ClientOnly>
      <template #fallback>
        <UCard class="shadow-sm">
          <div class="divide-y divide-gray-100">
            <div v-for="i in 6" :key="i" class="flex items-center gap-4 py-4 px-2">
              <USkeleton class="h-9 w-9 rounded-xl shrink-0" />
              <div class="flex-1 space-y-2">
                <USkeleton class="h-4 w-32 rounded" />
                <USkeleton class="h-3 w-48 rounded" />
              </div>
              <USkeleton class="h-6 w-16 rounded-full" />
              <USkeleton class="h-8 w-16 rounded" />
            </div>
          </div>
        </UCard>
      </template>

      <!-- List -->
      <UCard class="shadow-sm">
        <template #header>
          <p class="font-semibold text-gray-800">
            Tipe Akun
            <span v-if="filtered.length" class="text-xs text-gray-400 font-normal ml-2">({{ filtered.length }} tipe)</span>
          </p>
        </template>

        <AppLoadingSkeleton v-if="pending" />

        <UAlert
          v-else-if="error"
          title="Terjadi Kesalahan"
          :description="(error as any).statusMessage || 'Gagal memuat tipe akun'"
          color="error"
          icon="mdi:alert-circle"
        />

        <div v-else-if="!paged.length" class="py-10 text-center text-gray-400 text-sm">
          <UIcon name="i-lucide-user-round-cog" class="text-4xl text-gray-300 mb-3" />
          <p>Belum ada tipe akun.</p>
        </div>

        <div v-else class="divide-y divide-gray-100">
          <div
            v-for="type in paged"
            :key="type.id"
            class="flex flex-col sm:flex-row sm:items-center gap-3 py-4 px-2"
            :class="type.status !== 'ACTIVE' ? 'opacity-50' : ''"
          >
            <div class="w-9 h-9 rounded-xl bg-gray-100 shrink-0 flex items-center justify-center">
              <UIcon name="i-lucide-user-round" class="text-lg text-gray-400" />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-sm font-semibold text-gray-800">{{ type.name }}</p>
                <span class="text-xs text-gray-400 font-mono">({{ type.slug }})</span>
                <UBadge v-if="type.is_default" color="primary" variant="soft" size="sm">Default</UBadge>
              </div>
              <p class="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <UIcon name="mdi:calendar" class="size-3" />
                Dibuat {{ type.created_at ? dayjs(type.created_at).format('DD MMM YYYY, HH:mm') : '-' }}
              </p>
            </div>

            <!-- Status + Actions -->
            <div class="flex items-center gap-3 shrink-0">
              <UBadge :color="type.status === 'ACTIVE' ? 'success' : 'neutral'" variant="soft" size="sm">
                {{ type.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif' }}
              </UBadge>
              <!-- "Lainnya" (is_default) dibuat otomatis BE & tidak bisa diubah -->
              <template v-if="!type.is_default">
                <UButton
                  size="xs"
                  color="neutral"
                  variant="outline"
                  icon="mdi:pencil-outline"
                  title="Edit tipe akun"
                  @click="openEditModal(type)"
                />
                <UButton
                  size="xs"
                  :color="type.status === 'ACTIVE' ? 'error' : 'success'"
                  variant="outline"
                  :icon="type.status === 'ACTIVE' ? 'mdi:cancel' : 'mdi:check-circle-outline'"
                  :loading="togglingId === type.id"
                  :title="type.status === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'"
                  @click="handleToggleStatus(type)"
                />
              </template>
            </div>
          </div>
        </div>

        <!-- Pagination (client-side, BE tidak mendukung pagination) -->
        <div v-if="totalPages > 1 && !pending" class="flex justify-center items-center pt-4">
          <UPagination
            :page="page + 1"
            :total="filtered.length"
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
import { useAccountTypeApi } from '~/composables/api/account-type'
import type { AccountTypeResponse, AccountTypeStatus } from '~/types/account-type/AccountTypeResponse'

definePageMeta({ layout: 'admin', label: 'Tipe Akun' })

const toast = useToast()
const { fetchAccountTypesAdmin, createAccountType, updateAccountType } = useAccountTypeApi()

const statusItems = [
  { label: 'Aktif', value: 'ACTIVE' },
  { label: 'Nonaktif', value: 'INACTIVE' },
]

// ===== FETCH =====
const {
  data,
  pending,
  error,
  refresh,
} = useAsyncData<AccountTypeResponse[]>(
  'admin-account-types',
  () => fetchAccountTypesAdmin(),
  { server: false, default: () => [] }
)

// Data tipe aktif untuk dropdown seller/filter di-cache dengan key ini; refresh setelah perubahan.
const refreshAll = () => Promise.all([refresh(), refreshNuxtData(ACCOUNT_TYPES_KEY)])

// ===== SEARCH & PAGINATION (client-side) =====
const page = ref(0)
const perPageValue = ref(20)
const perPageItems = [10, 20, 50, 100]
const search = ref('')

const filtered = computed(() => {
  const list = data.value ?? []
  const q = search.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(t => t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPageValue.value)))

const paged = computed(() => {
  const start = page.value * perPageValue.value
  return filtered.value.slice(start, start + perPageValue.value)
})

watch(search, () => { page.value = 0 })

// ===== AKTIF / NONAKTIF =====
const togglingId = ref<number | null>(null)

async function handleToggleStatus(type: AccountTypeResponse) {
  if (type.is_default) return
  const nextStatus: AccountTypeStatus = type.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  togglingId.value = type.id
  try {
    await updateAccountType(type.id, { name: type.name, status: nextStatus })
    toast.add({
      title: nextStatus === 'ACTIVE' ? 'Tipe akun diaktifkan' : 'Tipe akun dinonaktifkan',
      color: 'success',
      icon: 'mdi:check-circle',
    })
    await refreshAll()
  } catch (err: any) {
    toast.add({ title: 'Gagal mengubah status', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    togglingId.value = null
  }
}

// ===== ADD / EDIT =====
const showModal = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)
const formError = ref('')

const form = reactive({
  name: '',
  status: 'ACTIVE' as AccountTypeStatus,
})

function closeModal() {
  showModal.value = false
  isEdit.value = false
}

function openAddModal() {
  form.name = ''
  form.status = 'ACTIVE'
  formError.value = ''
  editingId.value = null
  isEdit.value = false
  showModal.value = true
}

function openEditModal(type: AccountTypeResponse) {
  if (type.is_default) return
  form.name = type.name
  form.status = type.status
  formError.value = ''
  editingId.value = type.id
  isEdit.value = true
  showModal.value = true
}

async function handleSave() {
  formError.value = ''
  const name = form.name.trim()
  if (!name) {
    formError.value = 'Nama tipe akun wajib diisi'
    return
  }

  saving.value = true
  try {
    const payload = { name, status: form.status }
    if (isEdit.value && editingId.value != null) {
      await updateAccountType(editingId.value, payload)
      toast.add({ title: 'Tipe akun berhasil diupdate', color: 'success', icon: 'mdi:check-circle' })
    } else {
      await createAccountType(payload)
      toast.add({ title: 'Tipe akun berhasil ditambahkan', color: 'success', icon: 'mdi:check-circle' })
    }
    showModal.value = false
    isEdit.value = false
    await refreshAll()
  } catch (err: any) {
    // Pesan BE (mis. 409 'Tipe akun "X" sudah ada') ditampilkan apa adanya
    formError.value = err.statusMessage || err.message
    toast.add({ title: 'Gagal menyimpan', description: formError.value, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>
