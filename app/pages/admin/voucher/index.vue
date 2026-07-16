<template>
  <div class="space-y-6">

    <!-- Modal: Tambah / Edit Voucher -->
    <UModal
      v-if="showModal"
      v-model:open="showModal"
      :title="editingCode ? 'Edit Voucher' : 'Tambah Voucher'"
      :ui="{ footer: 'justify-end' }"
    >
      <template #body>
        <div class="space-y-4">

          <!-- Kode (hanya pada create) -->
          <UFormField v-if="!editingCode" label="Kode Voucher" required>
            <UInput
              v-model="form.code"
              placeholder="cth: PROMO10"
              class="w-full font-mono uppercase"
              :maxlength="20"
              @input="form.code = (form.code as string).toUpperCase()"
            />
          </UFormField>
          <UFormField v-else label="Kode Voucher">
            <UInput :model-value="editingCode" disabled class="w-full font-mono" />
          </UFormField>

          <!-- Nama -->
          <UFormField label="Nama Voucher">
            <UInput v-model="form.name" placeholder="Nama tampilan voucher (opsional)" class="w-full" :maxlength="100" />
          </UFormField>

          <!-- Tipe & Nilai Diskon -->
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Tipe Diskon" required>
              <USelect
                v-model="form.discount_type"
                :items="discountTypeOptions"
                value-key="value"
                class="w-full"
              />
            </UFormField>
            <UFormField :label="form.discount_type === 'PERCENT' ? 'Nilai Diskon (%)' : 'Nilai Diskon (Rp)'" required>
              <UInput v-model.number="form.discount_value" type="number" min="0" step="any" class="w-full" />
            </UFormField>
          </div>

          <!-- Min transaksi & Maks diskon -->
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Min. Transaksi (Rp)">
              <UInput v-model.number="form.min_transaction_amount" type="number" min="0" placeholder="Opsional" class="w-full" />
            </UFormField>
            <UFormField label="Maks. Diskon (Rp)">
              <UInput
                v-model.number="form.max_discount_amount"
                type="number"
                min="0"
                placeholder="Opsional"
                class="w-full"
                :disabled="form.discount_type === 'NOMINAL'"
              />
            </UFormField>
          </div>

          <!-- Kuota -->
          <UFormField label="Kuota Pemakaian">
            <UInput v-model.number="form.quota" type="number" min="1" step="1" placeholder="Kosongkan = tidak terbatas" class="w-full" />
          </UFormField>

          <!-- Visibilitas -->
          <UFormField label="Visibilitas Voucher">
            <div class="flex items-center gap-3">
              <USwitch v-model="form.is_public" />
              <span class="text-sm text-gray-600">
                {{ form.is_public ? 'Publik — voucher tampil untuk semua pengguna' : 'Privat — hanya bisa dipakai dengan kode' }}
              </span>
            </div>
          </UFormField>

          <!-- Periode -->
          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Berlaku Mulai">
              <UInput v-model="form.start_date" type="datetime-local" class="w-full" />
            </UFormField>
            <UFormField label="Berlaku Sampai">
              <UInput v-model="form.end_date" type="datetime-local" class="w-full" />
            </UFormField>
          </div>

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
        <div class="flex flex-col sm:flex-row gap-3 items-center flex-wrap">
          <UInput
            v-model="search"
            placeholder="Cari kode / nama voucher..."
            icon="mdi:magnify"
            class="w-full sm:w-60"
            clearable
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
            icon="mdi:plus"
            color="primary"
            class="sm:ml-auto"
            @click="openCreateModal"
          >
            Tambah Voucher
          </UButton>
        </div>
      </UCard>

      <!-- List -->
      <UCard class="shadow-sm">
        <template #header>
          <p class="font-semibold text-gray-800">
            Daftar Voucher
            <span v-if="data?.total_elements" class="text-xs text-gray-400 font-normal ml-2">({{ data.total_elements }} voucher)</span>
          </p>
        </template>

        <AppLoadingSkeleton v-if="pending" />

        <UAlert
          v-else-if="error"
          title="Terjadi Kesalahan"
          :description="(error as any).statusMessage || 'Gagal memuat data voucher'"
          color="error"
          icon="mdi:alert-circle"
        />

        <div v-else-if="!data?.content?.length" class="py-10 text-center text-gray-400 text-sm">
          <UIcon name="mdi:ticket-percent-outline" class="text-4xl text-gray-300 mb-3" />
          <p>Belum ada voucher.</p>
          <p class="text-xs mt-1">Klik "Tambah Voucher" untuk membuat voucher baru.</p>
        </div>

        <div v-else class="divide-y divide-gray-100">
          <div
            v-for="voucher in data?.content ?? []"
            :key="voucher.code"
            class="flex flex-col sm:flex-row sm:items-start gap-3 py-4 px-2"
            :class="voucher.status !== 'ACTIVE' ? 'opacity-50' : ''"
          >
            <!-- Icon -->
            <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
              <UIcon name="mdi:ticket-percent-outline" class="text-lg text-primary" />
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0 space-y-1">
              <div class="flex items-center gap-2 flex-wrap">
                <p class="font-mono font-bold text-gray-800 text-sm">{{ voucher.code }}</p>
                <span v-if="voucher.name" class="text-sm text-gray-500">— {{ voucher.name }}</span>
              </div>
              <div class="flex items-center gap-2 flex-wrap text-xs">
                <UBadge color="info" variant="soft" size="xs">
                  {{ formatDiscount(voucher) }}
                </UBadge>
                <UBadge :color="voucher.is_public ? 'success' : 'neutral'" variant="subtle" size="xs">
                  {{ voucher.is_public ? 'Publik' : 'Privat' }}
                </UBadge>
                <span v-if="voucher.min_transaction_amount" class="text-gray-400">
                  Min. Rp{{ voucher.min_transaction_amount.toLocaleString('id-ID') }}
                </span>
                <span v-if="voucher.discount_type === 'PERCENT' && voucher.max_discount_amount" class="text-gray-400">
                  Maks. diskon Rp{{ voucher.max_discount_amount.toLocaleString('id-ID') }}
                </span>
              </div>
              <div class="text-xs text-gray-400 flex items-center gap-3 flex-wrap">
                <span>
                  <UIcon name="mdi:account-multiple-outline" class="inline mr-1" />
                  {{ voucher.used_count }}{{ voucher.quota ? `/${voucher.quota}` : '' }} dipakai
                </span>
                <span v-if="voucher.start_date || voucher.end_date">
                  <UIcon name="mdi:calendar-range" class="inline mr-1" />
                  {{ formatPeriod(voucher) }}
                </span>
              </div>
            </div>

            <!-- Status + Actions -->
            <div class="flex items-center gap-2 shrink-0 flex-wrap">
              <UBadge :color="voucher.status === 'ACTIVE' ? 'success' : 'neutral'" variant="soft" size="sm">
                {{ voucher.status === 'ACTIVE' ? 'Aktif' : 'Suspend' }}
              </UBadge>
              <UButton
                size="xs"
                color="neutral"
                variant="outline"
                icon="mdi:pencil-outline"
                @click="openEditModal(voucher)"
              />
              <UButton
                v-if="voucher.status === 'ACTIVE'"
                size="xs"
                color="warning"
                variant="soft"
                icon="mdi:pause-circle-outline"
                :loading="togglingCode === voucher.code"
                @click="handleToggle(voucher)"
              >
                Suspend
              </UButton>
              <UButton
                v-else
                size="xs"
                color="success"
                variant="soft"
                icon="mdi:play-circle-outline"
                :loading="togglingCode === voucher.code"
                @click="handleToggle(voucher)"
              >
                Aktifkan
              </UButton>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="data && data.total_pages > 1 && !pending" class="flex justify-center pt-4">
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
import { useVoucherApi } from '~/composables/api/voucher'
import type { VoucherResponse, DiscountType } from '~/types/voucher/VoucherResponse'
import type { PageResponse } from '~/types/PageResponse'

definePageMeta({ layout: 'admin', label: 'Voucher' })

const toast = useToast()
const { fetchAllVouchers, createVoucher, updateVoucher, suspendVoucher, activateVoucher } = useVoucherApi()

// ===== OPTIONS =====
const discountTypeOptions = [
  { label: 'Nominal Tetap (Rp)', value: 'NOMINAL' },
  { label: 'Persentase (%)', value: 'PERCENT' },
]

const statusFilterOptions = [
  { label: 'Semua Status', value: 'ALL' },
  { label: 'Aktif', value: 'ACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
]

// ===== FILTER & PAGINATION =====
const page = ref(0)
const perPageValue = ref(20)
const perPageItems = [10, 20, 50, 100]
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
const { data, pending, error, refresh } = useAsyncData<PageResponse<VoucherResponse>>(
  'admin-vouchers',
  () => fetchAllVouchers({
    page: page.value,
    size: perPageValue.value,
    keyword: debouncedSearch.value || undefined,
    status: filterStatus.value,
  }),
  { watch: [page, perPageValue, filterStatus, debouncedSearch], server: false }
)

// ===== STATS =====
const statsCards = computed(() => {
  const list = data.value?.content ?? []
  const total = data.value?.total_elements ?? 0
  const active = list.filter(v => v.status === 'ACTIVE').length
  const suspended = list.filter(v => v.status !== 'ACTIVE').length
  const totalUsed = list.reduce((sum, v) => sum + (v.used_count ?? 0), 0)

  return [
    { label: 'Total Voucher', value: total.toString(), icon: 'mdi:ticket-percent-outline', bgColor: 'bg-primary/10', iconColor: 'text-primary' },
    { label: 'Aktif (halaman ini)', value: active.toString(), icon: 'mdi:check-circle-outline', bgColor: 'bg-green-50', iconColor: 'text-green-500' },
    { label: 'Suspended (halaman ini)', value: suspended.toString(), icon: 'mdi:close-circle-outline', bgColor: 'bg-red-50', iconColor: 'text-red-400' },
    { label: 'Total Pemakaian', value: totalUsed.toString(), icon: 'mdi:account-multiple-outline', bgColor: 'bg-purple-50', iconColor: 'text-purple-500' },
  ]
})

// ===== HELPERS =====
function formatDiscount(voucher: VoucherResponse): string {
  if (voucher.discount_type === 'NOMINAL') {
    return `Diskon Rp${voucher.discount_value.toLocaleString('id-ID')}`
  }
  return `Diskon ${voucher.discount_value}%`
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatPeriod(voucher: VoucherResponse): string {
  const start = formatDate(voucher.start_date)
  const end = formatDate(voucher.end_date)
  if (voucher.start_date && voucher.end_date) return `${start} – ${end}`
  if (voucher.start_date) return `Mulai ${start}`
  if (voucher.end_date) return `Sampai ${end}`
  return '-'
}

// ===== MODAL STATE =====
const showModal = ref(false)
const editingCode = ref<string | null>(null)
const saving = ref(false)

const form = reactive({
  code: '' as string,
  name: '' as string,
  discount_type: 'NOMINAL' as DiscountType,
  discount_value: 0 as number | '',
  max_discount_amount: '' as number | '',
  min_transaction_amount: '' as number | '',
  quota: '' as number | '',
  is_public: false,
  start_date: '',
  end_date: '',
})

function resetForm() {
  form.code = ''
  form.name = ''
  form.discount_type = 'NOMINAL'
  form.discount_value = 0
  form.max_discount_amount = ''
  form.min_transaction_amount = ''
  form.quota = ''
  form.is_public = false
  form.start_date = ''
  form.end_date = ''
}

function openCreateModal() {
  editingCode.value = null
  resetForm()
  showModal.value = true
}

function openEditModal(voucher: VoucherResponse) {
  editingCode.value = voucher.code
  form.code = voucher.code
  form.name = voucher.name ?? ''
  form.discount_type = voucher.discount_type
  form.discount_value = voucher.discount_value
  form.max_discount_amount = voucher.max_discount_amount ?? ''
  form.min_transaction_amount = voucher.min_transaction_amount ?? ''
  form.quota = voucher.quota ?? ''
  form.is_public = voucher.is_public ?? false
  form.start_date = voucher.start_date ? voucher.start_date.slice(0, 16) : ''
  form.end_date = voucher.end_date ? voucher.end_date.slice(0, 16) : ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingCode.value = null
}

async function handleSave() {
  if (!form.discount_type) {
    toast.add({ title: 'Tipe diskon wajib dipilih', color: 'warning' })
    return
  }
  if (!form.discount_value || Number(form.discount_value) <= 0) {
    toast.add({ title: 'Nilai diskon harus lebih dari 0', color: 'warning' })
    return
  }
  if (!editingCode.value && !form.code.trim()) {
    toast.add({ title: 'Kode voucher wajib diisi', color: 'warning' })
    return
  }

  saving.value = true
  try {
    const toNum = (v: number | ''): number | null => (v === '' || v === 0 ? null : Number(v))
    const toDate = (d: string): string | null => (d ? d + ':00' : null)

    if (editingCode.value) {
      await updateVoucher(editingCode.value, {
        name: form.name.trim() || null,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        max_discount_amount: toNum(form.max_discount_amount),
        min_transaction_amount: toNum(form.min_transaction_amount),
        quota: form.quota === '' ? null : Number(form.quota),
        is_public: form.is_public,
        start_date: toDate(form.start_date),
        end_date: toDate(form.end_date),
      })
      toast.add({ title: 'Voucher berhasil diperbarui', color: 'success', icon: 'mdi:check-circle' })
    } else {
      await createVoucher({
        code: form.code.trim().toUpperCase(),
        name: form.name.trim() || null,
        discount_type: form.discount_type,
        discount_value: Number(form.discount_value),
        max_discount_amount: toNum(form.max_discount_amount),
        min_transaction_amount: toNum(form.min_transaction_amount),
        quota: form.quota === '' ? null : Number(form.quota),
        is_public: form.is_public,
        start_date: toDate(form.start_date),
        end_date: toDate(form.end_date),
      })
      toast.add({ title: 'Voucher berhasil dibuat', color: 'success', icon: 'mdi:check-circle' })
    }
    closeModal()
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Gagal menyimpan', description: err.message, color: 'error' })
  } finally {
    saving.value = false
  }
}

// ===== TOGGLE STATUS =====
const togglingCode = ref<string | null>(null)

async function handleToggle(voucher: VoucherResponse) {
  togglingCode.value = voucher.code
  try {
    if (voucher.status === 'ACTIVE') {
      await suspendVoucher(voucher.code)
      toast.add({ title: 'Voucher disuspend', color: 'warning', icon: 'mdi:pause-circle-outline' })
    } else {
      await activateVoucher(voucher.code)
      toast.add({ title: 'Voucher diaktifkan', color: 'success', icon: 'mdi:check-circle' })
    }
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Gagal mengubah status', description: err.message, color: 'error' })
  } finally {
    togglingCode.value = null
  }
}
</script>
