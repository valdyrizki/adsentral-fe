<template>
  <div class="space-y-6">

    <!-- Modal: Tambah / Edit Kategori (v-if agar tidak dirender saat SSR) -->
    <UModal v-if="showAddModal" v-model:open="showAddModal" :title="isEdit ? 'Edit Kategori Produk' : 'Tambah Kategori Produk'" :ui="{ footer: 'justify-end' }">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Nama Kategori" required>
            <UInput v-model="form.name" placeholder="Contoh: Top Up Game" class="w-full" maxlength="50" />
          </UFormField>
          <UFormField label="Deskripsi">
            <UTextarea v-model="form.description" placeholder="Opsional..." :rows="2" class="w-full" maxlength="1000" />
          </UFormField>
          <UFormField label="Gambar Kategori">
            <div class="flex gap-4 items-start flex-wrap">
              <img
                v-if="isEdit && editingImageUrl"
                :src="editingImageUrl"
                class="w-32 h-32 rounded-lg object-cover border border-gray-200 shrink-0"
              />
              <UFileUpload
                v-model="form.image"
                :label="isEdit ? 'Ubah Gambar' : 'Gambar Kategori'"
                description="JPG / PNG (maks. 5MB)"
                class="flex-1 min-w-48 min-h-32"
                @change="handleImageValidation"
              />
            </div>
            <p v-if="imageError" class="mt-1 text-sm text-red-500">{{ imageError }}</p>
          </UFormField>
          <UFormField label="Status" required>
            <USelect
              v-model="form.status"
              :items="statusItems"
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

    <!-- Filter + Actions -->
    <UCard class="shadow-sm">
      <div class="flex flex-col sm:flex-row gap-3 items-center">
        <UInput
          v-model="search"
          placeholder="Cari kategori..."
          icon="mdi:magnify"
          class="w-full sm:w-64"
        />
        <USelect v-model="perPageValue" :items="perPageItems" class="w-24" @update:model-value="page = 0" />
        <UButton icon="mdi:refresh" color="neutral" variant="outline" :loading="pending" @click="refresh()">
          Refresh
        </UButton>
        <UButton icon="mdi:plus" color="primary" class="sm:ml-auto" @click="openAddModal">
          Tambah Kategori
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

      <!-- Category List -->
      <UCard class="shadow-sm">
        <template #header>
          <p class="font-semibold text-gray-800">
            Kategori Produk
            <span v-if="filtered.length" class="text-xs text-gray-400 font-normal ml-2">({{ filtered.length }} kategori)</span>
          </p>
        </template>

        <AppLoadingSkeleton v-if="pending" />

        <UAlert
          v-else-if="error"
          title="Terjadi Kesalahan"
          :description="(error as any).statusMessage || 'Gagal memuat kategori'"
          color="error"
          icon="mdi:alert-circle"
        />

        <div v-else-if="!paged.length" class="py-10 text-center text-gray-400 text-sm">
          <UIcon name="mdi:shape-outline" class="text-4xl text-gray-300 mb-3" />
          <p>Belum ada kategori.</p>
        </div>

        <div v-else class="divide-y divide-gray-100">
          <div
            v-for="cat in paged"
            :key="cat.id"
            class="flex flex-col sm:flex-row sm:items-center gap-3 py-4 px-2"
            :class="cat.status !== 'ACTIVE' ? 'opacity-50' : ''"
          >
            <!-- Image -->
            <div class="w-9 h-9 rounded-xl overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
              <img v-if="cat.image_url" :src="cat.image_url" class="w-full h-full object-cover" />
              <UIcon v-else name="mdi:shape-outline" class="text-lg text-gray-400" />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-sm font-semibold text-gray-800">{{ cat.name }}</p>
                <span class="text-xs text-gray-400 font-mono">({{ cat.slug }})</span>
              </div>
              <p v-if="cat.description" class="text-xs text-gray-500 mt-0.5">{{ cat.description }}</p>
            </div>

            <!-- Status + Actions -->
            <div class="flex items-center gap-3 shrink-0">
              <UBadge :color="cat.status === 'ACTIVE' ? 'success' : 'neutral'" variant="soft" size="sm">
                {{ cat.status === 'ACTIVE' ? 'Aktif' : cat.status }}
              </UBadge>
              <UButton
                size="xs"
                color="neutral"
                variant="outline"
                icon="mdi:pencil-outline"
                @click="openEditModal(cat)"
              />
              <UButton
                v-if="cat.status !== 'SUSPEND'"
                size="xs"
                color="error"
                variant="outline"
                icon="mdi:cancel"
                :loading="suspendingId === cat.id"
                :disabled="!authStore.isSuperAdmin"
                :title="authStore.isSuperAdmin ? 'Nonaktifkan kategori' : 'Hanya SUPER_ADMIN yang dapat menonaktifkan'"
                @click="handleSuspend(cat)"
              />
            </div>
          </div>
        </div>

        <!-- Pagination (client-side, BE belum mendukung pagination) -->
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
import { useCategoryApi } from '~/composables/api/category'
import { validateImage } from '~/helper/imageHelper'
import type { CategoryResponse } from '~/types/CategoryResponse'
import type { CategoryStatus } from '~/types/CategoryRequest'

definePageMeta({ layout: 'admin', label: 'Kategori Produk' })

const toast = useToast()
const authStore = useAuthStore()
const { fetchCategoriesAdmin, createCategory, updateCategory, suspendCategory } = useCategoryApi()

const statusItems = [
  { label: 'Aktif', value: 'ACTIVE' },
  { label: 'Nonaktif', value: 'INACTIVE' },
  { label: 'Suspend', value: 'SUSPEND' },
]

// ===== FETCH =====
// BE (/categories/all) mengembalikan seluruh kategori (termasuk INACTIVE/SUSPEND) tanpa
// pagination/search di server, jadi filter & pagination dilakukan di FE.
const {
  data,
  pending,
  error,
  refresh,
} = useAsyncData<CategoryResponse[]>(
  'admin-product-categories',
  () => fetchCategoriesAdmin(),
  { server: false, default: () => [] }
)

// ===== SEARCH & PAGINATION (client-side) =====
const page = ref(0)
const perPageValue = ref(20)
const perPageItems = [10, 20, 50, 100]
const search = ref('')

const filtered = computed(() => {
  const list = data.value ?? []
  const q = search.value.trim().toLowerCase()
  if (!q) return list
  return list.filter(c => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPageValue.value)))

const paged = computed(() => {
  const start = page.value * perPageValue.value
  return filtered.value.slice(start, start + perPageValue.value)
})

watch(search, () => { page.value = 0 })

// ===== SUSPEND (soft delete, hanya SUPER_ADMIN, tidak ada endpoint untuk activate kembali) =====
const suspendingId = ref<number | null>(null)

async function handleSuspend(cat: CategoryResponse) {
  if (!authStore.isSuperAdmin) return
  const ok = confirm(`Nonaktifkan kategori "${cat.name}"? Tindakan ini tidak bisa dibatalkan dari sini.`)
  if (!ok) return

  suspendingId.value = cat.id
  try {
    await suspendCategory(cat.id)
    toast.add({ title: 'Kategori dinonaktifkan', color: 'success', icon: 'mdi:check-circle' })
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Gagal menonaktifkan kategori', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    suspendingId.value = null
  }
}

// ===== ADD / EDIT =====
const showAddModal = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)
const editingImageUrl = ref('')
const imageError = ref('')

const form = reactive({
  name: '',
  description: '',
  image: null as File | null,
  status: 'ACTIVE' as CategoryStatus,
})

async function handleImageValidation() {
  if (!form.image) return
  try {
    await validateImage(form.image)
    imageError.value = ''
  } catch (err: any) {
    form.image = null
    imageError.value = err
  }
}

function closeModal() {
  showAddModal.value = false
  isEdit.value = false
}

function openAddModal() {
  form.name = ''
  form.description = ''
  form.image = null
  form.status = 'ACTIVE'
  imageError.value = ''
  editingId.value = null
  editingImageUrl.value = ''
  isEdit.value = false
  showAddModal.value = true
}

function openEditModal(cat: CategoryResponse) {
  form.name = cat.name
  form.description = cat.description ?? ''
  form.image = null
  form.status = (cat.status as CategoryStatus) ?? 'ACTIVE'
  imageError.value = ''
  editingId.value = cat.id
  editingImageUrl.value = cat.image_url ?? ''
  isEdit.value = true
  showAddModal.value = true
}

async function handleSave() {
  if (!form.name.trim()) {
    toast.add({ title: 'Nama kategori wajib diisi', color: 'warning' })
    return
  }
  if (form.name.trim().length > 50) {
    toast.add({ title: 'Nama kategori maksimal 50 karakter', color: 'warning' })
    return
  }

  saving.value = true
  try {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      image: form.image,
      status: form.status,
    }
    if (isEdit.value && editingId.value != null) {
      await updateCategory(editingId.value, payload)
      toast.add({ title: 'Kategori berhasil diupdate', color: 'success', icon: 'mdi:check-circle' })
    } else {
      await createCategory(payload)
      toast.add({ title: 'Kategori berhasil ditambahkan', color: 'success', icon: 'mdi:check-circle' })
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
