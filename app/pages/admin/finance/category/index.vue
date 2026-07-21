<template>
  <div class="space-y-6">

    <!-- Modal: Tambah / Edit Kategori (v-if agar tidak dirender saat SSR) -->
    <UModal v-if="showAddModal" v-model:open="showAddModal" :title="isEdit ? 'Edit Kategori Keuangan' : 'Tambah Kategori Keuangan'" :ui="{ footer: 'justify-end' }">
      <template #body>
        <div class="space-y-4">
          <UFormField label="ID Kategori" required>
            <UInput
              v-model="form.id"
              placeholder="Contoh: SERVER_COST"
              class="w-full font-mono uppercase"
              :disabled="isEdit"
              @input="!isEdit && (form.id = (form.id as string).toUpperCase().replace(/\s/g, '_'))"
            />
            <template v-if="!isEdit" #hint>
              <span class="text-xs text-gray-400">Huruf kapital, tanpa spasi, gunakan underscore</span>
            </template>
          </UFormField>
          <UFormField label="Tipe" required>
            <USelect
              v-model="form.db_cr"
              :items="[
                { label: 'Pemasukan (Credit)', value: 'CREDIT' },
                { label: 'Pengeluaran (Debit)', value: 'DEBIT' },
              ]"
              value-key="value"
              class="w-full"
              :disabled="isEdit"
            />
          </UFormField>
          <UFormField label="Nama Kategori" required>
            <UInput v-model="form.name" placeholder="Nama kategori..." class="w-full" />
          </UFormField>
          <UFormField label="Deskripsi">
            <UTextarea v-model="form.description" placeholder="Opsional..." :rows="2" class="w-full" />
          </UFormField>
          <UFormField label="Catatan">
            <UInput v-model="form.notes" placeholder="Opsional..." class="w-full" />
          </UFormField>
          <UFormField label="Auto By Sistem">
            <div class="flex items-center gap-3">
              <USwitch v-model="form.is_auto" />
              <span class="text-sm text-gray-500">{{ form.is_auto ? 'Ya' : 'Tidak' }}</span>
            </div>
          </UFormField>
          <UFormField v-if="isEdit" label="Status Aktif">
            <div class="flex items-center gap-3">
              <USwitch v-model="form.is_active" />
              <span class="text-sm text-gray-500">{{ form.is_active ? 'Aktif' : 'Nonaktif' }}</span>
            </div>
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

    <!-- Filter + Actions (outside ClientOnly, sama seperti /admin/finance) -->
    <UCard class="shadow-sm">
      <div class="flex flex-col sm:flex-row gap-3 items-center">
        <UInput
          v-model="search"
          placeholder="Cari kategori..."
          icon="mdi:magnify"
          class="w-full sm:w-56"
        />
        <USelect
          v-model="filterDbCr"
          :items="[
            { label: 'Semua Tipe', value: 'ALL' },
            { label: 'Pemasukan (Credit)', value: 'CREDIT' },
            { label: 'Pengeluaran (Debit)', value: 'DEBIT' },
          ]"
          value-key="value"
          class="w-full sm:w-52"
          @update:model-value="handleFilter"
        />
        <USelect v-model="perPageValue" :items="perPageItems" class="w-24" @update:model-value="handleFilter" />
        <UButton icon="mdi:refresh" color="neutral" variant="outline" :loading="pending || loadingTotals" @click="refresh(); loadCategoryTotals()">
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
            Kategori Keuangan
            <span v-if="data?.total_elements" class="text-xs text-gray-400 font-normal ml-2">({{ data.total_elements }} kategori)</span>
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

        <div v-else-if="!data?.content?.length" class="py-10 text-center text-gray-400 text-sm">
          <UIcon name="mdi:tag-multiple-outline" class="text-4xl text-gray-300 mb-3" />
          <p>Belum ada kategori.</p>
        </div>

        <div v-else class="divide-y divide-gray-100">
          <div
            v-for="cat in data?.content ?? []"
            :key="cat.id"
            class="flex flex-col sm:flex-row sm:items-center gap-3 py-4 px-2"
            :class="!cat.is_active ? 'opacity-50' : ''"
          >
            <!-- Icon -->
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              :class="cat.db_cr === 'CREDIT' ? 'bg-green-50' : 'bg-red-50'"
            >
              <UIcon
                :name="cat.db_cr === 'CREDIT' ? 'mdi:arrow-down-circle-outline' : 'mdi:arrow-up-circle-outline'"
                class="text-lg"
                :class="cat.db_cr === 'CREDIT' ? 'text-green-500' : 'text-red-400'"
              />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="text-sm font-semibold text-gray-800">{{ cat.name }}</p>
                <span class="text-xs text-gray-400 font-mono">({{ cat.id }})</span>
                <UBadge
                  :color="cat.db_cr === 'CREDIT' ? 'success' : 'error'"
                  variant="subtle"
                  size="xs"
                >
                  {{ cat.db_cr === 'CREDIT' ? 'Pemasukan' : 'Pengeluaran' }}
                </UBadge>
                <UBadge v-if="cat.is_auto" color="info" variant="soft" size="xs">
                  Auto By Sistem
                </UBadge>
              </div>
              <p v-if="cat.description" class="text-xs text-gray-500 mt-0.5">{{ cat.description }}</p>
              <p v-if="cat.notes" class="text-xs text-gray-400 mt-0.5">Catatan: {{ cat.notes }}</p>
            </div>

            <!-- Nominal Saldo -->
            <div class="text-right shrink-0 sm:min-w-35">
              <p class="text-[11px] text-gray-400">Nominal Saldo</p>
              <USkeleton v-if="loadingTotals" class="h-5 w-24 rounded ml-auto" />
              <p
                v-else
                class="text-sm font-bold"
                :class="cat.db_cr === 'CREDIT' ? 'text-green-600' : 'text-red-500'"
              >
                Rp {{ (categoryTotals[cat.id] ?? 0).toLocaleString('id-ID') }}
              </p>
            </div>

            <!-- Status + Toggle + Edit -->
            <div class="flex items-center gap-3 shrink-0">
              <UBadge :color="cat.is_active ? 'success' : 'neutral'" variant="soft" size="sm">
                {{ cat.is_active ? 'Aktif' : 'Nonaktif' }}
              </UBadge>
              <UButton
                size="xs"
                color="neutral"
                variant="outline"
                icon="mdi:pencil-outline"
                @click="openEditModal(cat)"
              />
              <USwitch
                :model-value="cat.is_active"
                :disabled="toggling === cat.id"
                @update:model-value="handleToggle(cat)"
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
import { useFinanceApi } from '~/composables/api/finance'
import type { FinanceCategoryResponse } from '~/types/finance/FinanceCategoryResponse'
import type { PageResponse } from '~/types/PageResponse'

definePageMeta({ layout: 'admin', label: 'Kategori Keuangan' })

const toast = useToast()
const { fetchCategories, createCategory, updateCategory, toggleCategory, fetchCategoryTotals } = useFinanceApi()

// ===== FILTER & PAGINATION =====
const page = ref(0)
const perPageValue = ref(20)
const perPageItems = [10, 20, 50, 100]
const filterDbCr = ref<'CREDIT' | 'DEBIT' | 'ALL'>('ALL')
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

// ===== FETCH =====
const {
  data,
  pending,
  error,
  refresh,
} = useAsyncData<PageResponse<FinanceCategoryResponse>>(
  'admin-finance-categories',
  () => fetchCategories({
    page: page.value,
    size: perPageValue.value,
    dbCr: filterDbCr.value === 'ALL' ? undefined : filterDbCr.value,
    search: debouncedSearch.value || undefined,
  }),
  { watch: [page, perPageValue, filterDbCr, debouncedSearch], server: false }
)

function handleFilter() {
  page.value = 0
}

// ===== NOMINAL SALDO (total jurnal per kategori) =====
const categoryTotals = ref<Record<string, number>>({})
const loadingTotals = ref(false)

async function loadCategoryTotals() {
  loadingTotals.value = true
  try {
    categoryTotals.value = await fetchCategoryTotals()
  } catch (err: any) {
    toast.add({ title: 'Gagal memuat nominal saldo kategori', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    loadingTotals.value = false
  }
}

onMounted(loadCategoryTotals)

// ===== TOGGLE =====
const toggling = ref<string | null>(null)

async function handleToggle(cat: FinanceCategoryResponse) {
  toggling.value = cat.id
  try {
    await toggleCategory(cat.id)
    toast.add({
      title: cat.is_active ? 'Kategori dinonaktifkan' : 'Kategori diaktifkan',
      color: 'success',
      icon: 'mdi:check-circle',
    })
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
  db_cr: 'DEBIT' as 'CREDIT' | 'DEBIT',
  name: '',
  description: '',
  notes: '',
  is_auto: false,
  is_active: true,
})

function closeModal() {
  showAddModal.value = false
  isEdit.value = false
}

function openAddModal() {
  form.id = ''
  form.db_cr = 'DEBIT'
  form.name = ''
  form.description = ''
  form.notes = ''
  form.is_auto = false
  isEdit.value = false
  showAddModal.value = true
}

function openEditModal(cat: FinanceCategoryResponse) {
  form.id = cat.id
  form.db_cr = cat.db_cr
  form.name = cat.name
  form.description = cat.description ?? ''
  form.notes = cat.notes ?? ''
  form.is_auto = cat.is_auto
  form.is_active = cat.is_active
  isEdit.value = true
  showAddModal.value = true
}

async function handleSave() {
  if (!isEdit.value && (!form.id.trim() || !form.name.trim())) {
    toast.add({ title: 'ID dan Nama kategori wajib diisi', color: 'warning' })
    return
  }
  if (isEdit.value && !form.name.trim()) {
    toast.add({ title: 'Nama kategori wajib diisi', color: 'warning' })
    return
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await updateCategory(form.id, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        notes: form.notes.trim() || null,
        is_auto: form.is_auto,
        is_active: form.is_active,
      })
      toast.add({ title: 'Kategori berhasil diupdate', color: 'success', icon: 'mdi:check-circle' })
    } else {
      await createCategory({
        id: form.id.trim(),
        db_cr: form.db_cr,
        name: form.name.trim(),
        description: form.description.trim() || null,
        notes: form.notes.trim() || null,
        is_auto: form.is_auto,
      })
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
