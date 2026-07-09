<template>
  <div class="space-y-6">

    <!-- Modal: Void Reason (v-if agar tidak dirender saat SSR) -->
    <UModal v-if="showVoidModal" v-model:open="showVoidModal" title="Void Jurnal" :ui="{ footer: 'justify-end' }">
      <template #body>
        <p class="text-sm text-gray-600 mb-3">
          Jurnal <span class="font-semibold">{{ voidTarget?.description }}</span> akan dibatalkan.
        </p>
        <UFormField label="Alasan Void" required>
          <UInput v-model="voidReason" placeholder="Masukkan alasan void..." class="w-full" />
        </UFormField>
      </template>
      <template #footer>
        <UButton color="neutral" variant="outline" @click="closeVoidModal">Batal</UButton>
        <UButton color="error" :loading="voiding" icon="mdi:cancel" @click="submitVoid">
          Void Jurnal
        </UButton>
      </template>
    </UModal>

    <!-- Form Modal: Tambah Jurnal (v-if agar tidak dirender saat SSR) -->
    <UModal v-if="showAddModal" v-model:open="showAddModal" title="Catat Transaksi Manual" :ui="{ footer: 'justify-end' }">
      <template #body>
        <div class="space-y-4">
          <UFormField label="Tipe" required>
            <USelect
              v-model="form.db_cr"
              :items="[{ label: 'Pemasukan (Credit)', value: 'CREDIT' }, { label: 'Pengeluaran (Debit)', value: 'DEBIT' }]"
              value-key="value"
              class="w-full"
              @update:model-value="form.category_id = ''"
            />
          </UFormField>
          <UFormField label="Kategori" required>
            <USelect
              v-model="form.category_id"
              :items="categoryOptions"
              value-key="value"
              class="w-full"
              :disabled="!form.db_cr"
            />
          </UFormField>
          <UFormField label="Deskripsi" required>
            <UInput v-model="form.description" placeholder="Deskripsi transaksi..." class="w-full" />
          </UFormField>
          <UFormField label="Nominal (Rp)" required>
            <UInput v-model="form.amount" type="number" min="1" placeholder="0" class="w-full" />
          </UFormField>
          <UFormField label="Tanggal Transaksi" required>
            <UInput v-model="form.tx_date" type="date" class="w-full" />
          </UFormField>
          <UFormField label="Catatan">
            <UTextarea v-model="form.notes" placeholder="Opsional..." :rows="2" class="w-full" />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <UButton color="neutral" variant="outline" @click="closeAddModal">Batal</UButton>
        <UButton color="primary" :loading="saving" icon="mdi:content-save-outline" @click="handleSaveJournal">
          Simpan
        </UButton>
      </template>
    </UModal>

    <!-- Filters (outside ClientOnly, sama seperti /admin/finance) -->
    <UCard class="shadow-sm">
      <div class="flex flex-col sm:flex-row gap-3 flex-wrap">
        <USelect
          v-model="filterDbCr"
          :items="[
            { label: 'Semua Tipe', value: 'ALL' },
            { label: 'Pemasukan (Credit)', value: 'CREDIT' },
            { label: 'Pengeluaran (Debit)', value: 'DEBIT' },
          ]"
          value-key="value"
          class="w-full sm:w-48"
          @update:model-value="handleFilter"
        />
        <USelect
          v-model="filterCategoryId"
          :items="allCategoryOptions"
          value-key="value"
          class="w-full sm:w-52"
          @update:model-value="handleFilter"
        />
        <USelect v-model="filterYear" :items="yearOptions" class="w-28" @update:model-value="handleFilter" />
        <USelect
          v-model="filterMonth"
          :items="monthOptions"
          value-key="value"
          class="w-40"
          @update:model-value="handleFilter"
        />
        <USelect v-model="perPageValue" :items="perPageItems" class="w-24" />
        <UButton icon="mdi:refresh" color="neutral" variant="outline" :loading="pending" @click="refresh()">
          Refresh
        </UButton>
        <UButton icon="mdi:plus" color="primary" class="sm:ml-auto" @click="openAddModal">
          Catat Manual
        </UButton>
      </div>
    </UCard>

    <ClientOnly>
      <template #fallback>
        <UCard class="shadow-sm">
          <div class="divide-y divide-gray-100">
            <div v-for="i in 8" :key="i" class="flex items-center gap-4 py-4 px-2">
              <USkeleton class="h-9 w-9 rounded-xl flex-shrink-0" />
              <div class="flex-1 space-y-2">
                <USkeleton class="h-4 w-48 rounded" />
                <USkeleton class="h-3 w-64 rounded" />
              </div>
              <USkeleton class="h-6 w-28 rounded" />
            </div>
          </div>
        </UCard>
      </template>

      <!-- Journal List -->
      <UCard class="shadow-sm">
        <template #header>
          <p class="font-semibold text-gray-800">
            Jurnal Keuangan
            <span v-if="data?.total_elements" class="text-xs text-gray-400 font-normal ml-2">
              ({{ data.total_elements }} total)
            </span>
          </p>
        </template>

        <AppLoadingSkeleton v-if="pending" />

        <UAlert
          v-else-if="error"
          title="Terjadi Kesalahan"
          :description="(error as any).statusMessage || 'Gagal memuat jurnal'"
          color="error"
          icon="mdi:alert-circle"
        />

        <div v-else-if="!data?.content?.length" class="py-10 text-center text-gray-400 text-sm">
          <UIcon name="mdi:notebook-outline" class="text-4xl text-gray-300 mb-3" />
          <p>Belum ada jurnal.</p>
        </div>

        <div v-else class="divide-y divide-gray-100">
          <div
            v-for="item in data.content"
            :key="item.id"
            class="flex flex-col sm:flex-row sm:items-center gap-3 py-4 px-2"
            :class="item.is_void ? 'opacity-50' : ''"
          >
            <!-- Icon -->
            <div
              class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              :class="item.db_cr === 'CREDIT' ? 'bg-green-50' : 'bg-red-50'"
            >
              <UIcon
                :name="item.db_cr === 'CREDIT' ? 'mdi:arrow-down-circle-outline' : 'mdi:arrow-up-circle-outline'"
                class="text-lg"
                :class="item.db_cr === 'CREDIT' ? 'text-green-500' : 'text-red-400'"
              />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <UBadge
                  :color="item.db_cr === 'CREDIT' ? 'success' : 'error'"
                  variant="subtle"
                  size="xs"
                >
                  {{ item.db_cr === 'CREDIT' ? 'Pemasukan' : 'Pengeluaran' }}
                </UBadge>
                <UBadge color="neutral" variant="outline" size="xs">{{ item.category_name }}</UBadge>
                <UBadge v-if="item.is_void" color="neutral" variant="soft" size="xs">
                  <span class="line-through">VOID</span>
                </UBadge>
              </div>
              <p class="text-sm font-medium text-gray-800 mt-1" :class="item.is_void ? 'line-through' : ''">
                {{ item.description }}
              </p>
              <div class="flex flex-wrap gap-3 text-xs text-gray-400 mt-0.5">
                <span>{{ dayjs(item.tx_date).format('D MMM YYYY') }}</span>
                <span v-if="item.ref_id" class="font-mono">Ref: {{ item.ref_id }}</span>
                <span>Oleh: {{ item.created_by_username }}</span>
                <span v-if="item.is_void && item.void_reason" class="text-red-400">Void: {{ item.void_reason }}</span>
              </div>
            </div>

            <!-- Amount -->
            <div class="flex items-center gap-3 sm:ml-auto flex-shrink-0">
              <p
                class="text-base font-bold"
                :class="[
                  item.db_cr === 'CREDIT' ? 'text-green-600' : 'text-red-500',
                  item.is_void ? 'line-through' : ''
                ]"
              >
                {{ item.db_cr === 'CREDIT' ? '+' : '-' }}Rp {{ item.amount.toLocaleString('id-ID') }}
              </p>
              <UButton
                v-if="!item.is_void && item.created_by_username !== 'SYSTEM'"
                size="xs"
                color="error"
                variant="soft"
                icon="mdi:cancel"
                label="Void"
                @click="handleVoid(item)"
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
import dayjs from 'dayjs'
import { useFinanceApi } from '~/composables/api/finance'
import type { FinanceCategoryResponse } from '~/types/finance/FinanceCategoryResponse'
import type { FinanceJournalResponse } from '~/types/finance/FinanceJournalResponse'
import type { PageResponse } from '~/types/PageResponse'

definePageMeta({ layout: 'admin', label: 'Jurnal Keuangan' })

const toast = useToast()
const { fetchJournals, voidJournal, createJournal, fetchCategories } = useFinanceApi()

// ===== FILTER STATE =====
const page = ref(0)
const perPageValue = ref(20)
const perPageItems = [10, 20, 50, 100]

const currentYear = new Date().getFullYear()
const currentMonth = new Date().getMonth() + 1

const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)
const monthOptions = [
  { label: 'Semua Bulan', value: 0 },
  { label: 'Januari', value: 1 },
  { label: 'Februari', value: 2 },
  { label: 'Maret', value: 3 },
  { label: 'April', value: 4 },
  { label: 'Mei', value: 5 },
  { label: 'Juni', value: 6 },
  { label: 'Juli', value: 7 },
  { label: 'Agustus', value: 8 },
  { label: 'September', value: 9 },
  { label: 'Oktober', value: 10 },
  { label: 'November', value: 11 },
  { label: 'Desember', value: 12 },
]

const filterDbCr = ref<'CREDIT' | 'DEBIT' | 'ALL'>('ALL')
const filterCategoryId = ref('ALL')
const filterYear = ref<number>(currentYear)
const filterMonth = ref<number>(currentMonth)

// ===== CATEGORIES (for dropdown) =====
const categories = ref<FinanceCategoryResponse[]>([])

const allCategoryOptions = computed(() => [
  { label: 'Semua Kategori', value: 'ALL' },
  ...categories.value.map(c => ({ label: `${c.name} (${c.db_cr === 'CREDIT' ? 'Pemasukan' : 'Pengeluaran'})`, value: c.id })),
])

const categoryOptions = computed(() =>
  categories.value
    .filter(c => !form.db_cr || c.db_cr === form.db_cr)
    .filter(c => c.is_active)
    .map(c => ({ label: c.name, value: c.id }))
)

onMounted(async () => {
  const res = await fetchCategories({ size: 200 }).catch(() => null)
  categories.value = res?.content ?? []
})

// ===== FETCH JOURNALS =====
const {
  data,
  pending,
  error,
  refresh,
} = useAsyncData<PageResponse<FinanceJournalResponse>>(
  'admin-finance-journals',
  () => fetchJournals({
    page: page.value,
    size: perPageValue.value,
    db_cr: filterDbCr.value === 'ALL' ? undefined : filterDbCr.value,
    category_id: filterCategoryId.value === 'ALL' ? undefined : filterCategoryId.value,
    year: filterYear.value || null,
    month: filterMonth.value || null,
  }),
  { watch: [page, perPageValue, filterDbCr, filterCategoryId, filterYear, filterMonth], server: false }
)

function handleFilter() {
  page.value = 0
  refresh()
}

// ===== ADD JOURNAL =====
const showAddModal = ref(false)
const saving = ref(false)

const form = reactive({
  db_cr: 'DEBIT' as 'CREDIT' | 'DEBIT',
  category_id: '',
  description: '',
  amount: '' as number | string,
  tx_date: '',
  notes: '',
})

function closeAddModal() {
  showAddModal.value = false
}

function openAddModal() {
  form.db_cr = 'DEBIT'
  form.category_id = ''
  form.description = ''
  form.amount = ''
  form.tx_date = dayjs().format('YYYY-MM-DD')
  form.notes = ''
  showAddModal.value = true
}

async function handleSaveJournal() {
  if (!form.category_id || !form.description || !form.amount || !form.tx_date) {
    toast.add({ title: 'Lengkapi semua field yang wajib diisi', color: 'warning' })
    return
  }
  saving.value = true
  try {
    await createJournal({
      category_id: form.category_id,
      description: form.description,
      notes: form.notes || null,
      amount: Number(form.amount),
      tx_date: form.tx_date,
    })
    toast.add({ title: 'Jurnal berhasil dicatat', color: 'success', icon: 'mdi:check-circle' })
    showAddModal.value = false
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Gagal menyimpan', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

// ===== VOID =====
const showVoidModal = ref(false)
const voidTarget = ref<FinanceJournalResponse | null>(null)
const voidReason = ref('')
const voiding = ref(false)

function closeVoidModal() {
  showVoidModal.value = false
}

function handleVoid(item: FinanceJournalResponse) {
  voidTarget.value = item
  voidReason.value = ''
  showVoidModal.value = true
}

async function submitVoid() {
  if (!voidReason.value.trim() || !voidTarget.value) {
    toast.add({ title: 'Alasan void wajib diisi', color: 'warning' })
    return
  }
  voiding.value = true
  try {
    await voidJournal(voidTarget.value.id, voidReason.value.trim())
    toast.add({ title: 'Jurnal berhasil di-void', color: 'success', icon: 'mdi:check-circle' })
    showVoidModal.value = false
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Gagal void jurnal', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    voiding.value = false
  }
}
</script>
