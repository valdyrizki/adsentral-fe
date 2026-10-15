<template>
  <div class="space-y-6">

    <!-- Modal: Detail -->
    <UModal v-if="showDetail" v-model:open="showDetail" title="Detail Jurnal Gagal" :ui="{ footer: 'justify-end' }">
      <template #body>
        <div v-if="selected" class="space-y-4 text-sm">
          <div class="grid grid-cols-2 gap-3">
            <div>
              <p class="text-xs text-gray-400">Waktu</p>
              <p>{{ formatDate(selected.created_at) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Status</p>
              <UBadge :color="statusMeta(selected.status).color" variant="subtle" size="sm">
                {{ statusMeta(selected.status).label }}
              </UBadge>
            </div>
            <div>
              <p class="text-xs text-gray-400">Kategori</p>
              <p>{{ categoryLabel(selected.category_id) }}</p>
              <p class="text-xs font-mono text-gray-400">{{ selected.category_id }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Jumlah</p>
              <p class="font-semibold">{{ formatRupiah(selected.amount) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Referensi</p>
              <div class="flex items-center gap-1">
                <NuxtLink v-if="refLink(selected.ref_id)" :to="refLink(selected.ref_id)!" class="font-mono text-primary hover:underline">
                  {{ selected.ref_id }}
                </NuxtLink>
                <span v-else class="font-mono">{{ selected.ref_id || '-' }}</span>
                <AppCopyButton v-if="selected.ref_id" :value="selected.ref_id" />
              </div>
            </div>
            <div>
              <p class="text-xs text-gray-400">Percobaan</p>
              <p>{{ selected.retry_count }}</p>
            </div>
          </div>

          <div>
            <p class="text-xs text-gray-400 mb-1">Deskripsi</p>
            <pre class="bg-gray-50 rounded-lg p-3 text-xs whitespace-pre-wrap break-words max-h-32 overflow-auto">{{ selected.description || '-' }}</pre>
          </div>
          <div>
            <p class="text-xs text-gray-400 mb-1">Pesan Error</p>
            <pre class="bg-red-50 text-red-700 rounded-lg p-3 text-xs whitespace-pre-wrap break-words max-h-48 overflow-auto">{{ selected.error_message || '-' }}</pre>
          </div>

          <div v-if="selected.status !== 'PENDING'" class="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
            <div>
              <p class="text-xs text-gray-400">Ditangani oleh</p>
              <p>{{ selected.resolved_by_username || '-' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Waktu</p>
              <p>{{ formatDate(selected.resolved_at) }}</p>
            </div>
            <div class="col-span-2">
              <p class="text-xs text-gray-400">Catatan</p>
              <p class="whitespace-pre-wrap break-words">{{ selected.resolution_note || '-' }}</p>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <UButton color="neutral" variant="outline" @click="showDetail = false">Tutup</UButton>
        <template v-if="selected?.status === 'PENDING'">
          <UButton color="neutral" variant="soft" icon="mdi:eye-off-outline" @click="openDismiss(selected!)">Abaikan</UButton>
          <UButton color="primary" icon="mdi:refresh" @click="openRetry(selected!)">Catat ulang</UButton>
        </template>
      </template>
    </UModal>

    <!-- Modal: Konfirmasi Catat Ulang -->
    <UModal v-if="showRetry" v-model:open="showRetry" title="Catat Ulang Jurnal" :ui="{ footer: 'justify-end' }">
      <template #body>
        <p v-if="actionTarget" class="text-sm text-gray-700">
          Catat ulang jurnal <span class="font-semibold">{{ categoryLabel(actionTarget.category_id) }}</span>
          sebesar <span class="font-semibold">{{ formatRupiah(actionTarget.amount) }}</span>
          untuk <span class="font-mono font-semibold">{{ actionTarget.ref_id }}</span>?
        </p>
        <p class="text-xs text-gray-400 mt-2">Disarankan memeriksa referensi terlebih dahulu sebelum mencatat ulang.</p>
      </template>
      <template #footer>
        <UButton color="neutral" variant="outline" :disabled="submitting" @click="showRetry = false">Batal</UButton>
        <UButton color="primary" :loading="submitting" :disabled="submitting" icon="mdi:refresh" @click="submitRetry">
          Catat ulang
        </UButton>
      </template>
    </UModal>

    <!-- Modal: Abaikan -->
    <UModal v-if="showDismiss" v-model:open="showDismiss" title="Abaikan Jurnal Gagal" :ui="{ footer: 'justify-end' }">
      <template #body>
        <p v-if="actionTarget" class="text-sm text-gray-600 mb-3">
          Jurnal <span class="font-semibold">{{ categoryLabel(actionTarget.category_id) }}</span>
          ({{ formatRupiah(actionTarget.amount) }}) untuk <span class="font-mono">{{ actionTarget.ref_id }}</span>
          akan ditandai diabaikan.
        </p>
        <UFormField label="Catatan" required>
          <UTextarea v-model="dismissNote" :rows="3" placeholder="Mis. sudah dicatat manual lewat jurnal manual" class="w-full" />
        </UFormField>
      </template>
      <template #footer>
        <UButton color="neutral" variant="outline" :disabled="submitting" @click="showDismiss = false">Batal</UButton>
        <UButton
          color="primary"
          :loading="submitting"
          :disabled="submitting || !dismissNote.trim()"
          icon="mdi:content-save-outline"
          @click="submitDismiss"
        >
          Simpan
        </UButton>
      </template>
    </UModal>

    <UAlert
      color="info"
      variant="subtle"
      icon="mdi:information-outline"
      title="Tentang Jurnal Gagal"
    >
      <template #description>
        Transaksi/penarikan/pembayaran di bawah ini sudah selesai dan saldo pengguna sudah benar. Hanya pencatatan jurnal keuangan bisnis yang gagal.
        Gunakan <strong>Catat ulang</strong> setelah penyebabnya diperbaiki, atau <strong>Abaikan</strong> bila sudah dicatat manual.
      </template>
    </UAlert>

    <UCard class="shadow-sm">
      <div class="flex flex-col sm:flex-row gap-3 sm:items-center">
        <UTabs v-model="tab" :items="tabItems" :content="false" class="flex-1" />
        <UButton icon="mdi:refresh" color="neutral" variant="outline" :loading="pending" @click="reload()">
          Refresh
        </UButton>
      </div>
    </UCard>

    <ClientOnly>
      <template #fallback>
        <UCard class="shadow-sm"><AppLoadingSkeleton /></UCard>
      </template>

      <UCard class="shadow-sm">
        <template #header>
          <p class="font-semibold text-gray-800">
            Jurnal Gagal
            <span v-if="data?.total_elements" class="text-xs text-gray-400 font-normal ml-2">
              ({{ data.total_elements }} total)
            </span>
          </p>
        </template>

        <AppLoadingSkeleton v-if="pending && !data" />

        <UAlert
          v-else-if="error"
          title="Terjadi Kesalahan"
          :description="(error as any).message || 'Gagal memuat jurnal gagal'"
          color="error"
          icon="mdi:alert-circle"
        />

        <div v-else-if="!data?.content?.length" class="py-10 text-center text-gray-400 text-sm">
          <UIcon name="mdi:check-circle-outline" class="text-4xl text-gray-300 mb-3" />
          <p v-if="tab === 'PENDING'">Tidak ada jurnal yang gagal. Semua pembukuan otomatis tercatat.</p>
          <p v-else>Tidak ada data.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-gray-400 border-b border-gray-100">
                <th class="py-2 px-2 font-medium">Waktu</th>
                <th class="py-2 px-2 font-medium">Kategori</th>
                <th class="py-2 px-2 font-medium text-right">Jumlah</th>
                <th class="py-2 px-2 font-medium">Referensi</th>
                <th class="py-2 px-2 font-medium">Status</th>
                <th class="py-2 px-2 font-medium text-center">Percobaan</th>
                <th class="py-2 px-2 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr
                v-for="item in data.content"
                :key="item.id"
                class="hover:bg-gray-50 cursor-pointer"
                @click="openDetail(item)"
              >
                <td class="py-3 px-2 whitespace-nowrap text-gray-600">{{ formatDate(item.created_at) }}</td>
                <td class="py-3 px-2">
                  <p class="font-medium text-gray-800">{{ categoryLabel(item.category_id) }}</p>
                  <p class="text-xs font-mono text-gray-400">{{ item.category_id }}</p>
                </td>
                <td class="py-3 px-2 text-right font-semibold whitespace-nowrap">{{ formatRupiah(item.amount) }}</td>
                <td class="py-3 px-2" @click.stop>
                  <div class="flex items-center gap-1">
                    <NuxtLink v-if="refLink(item.ref_id)" :to="refLink(item.ref_id)!" class="font-mono text-xs text-primary hover:underline">
                      {{ item.ref_id }}
                    </NuxtLink>
                    <span v-else class="font-mono text-xs">{{ item.ref_id || '-' }}</span>
                    <AppCopyButton v-if="item.ref_id" :value="item.ref_id" />
                  </div>
                </td>
                <td class="py-3 px-2">
                  <UBadge :color="statusMeta(item.status).color" variant="subtle" size="sm">
                    {{ statusMeta(item.status).label }}
                  </UBadge>
                </td>
                <td class="py-3 px-2 text-center">{{ item.retry_count }}</td>
                <td class="py-3 px-2 text-right" @click.stop>
                  <div v-if="item.status === 'PENDING'" class="flex justify-end gap-2">
                    <UButton size="xs" color="primary" variant="soft" icon="mdi:refresh" label="Catat ulang" @click="openRetry(item)" />
                    <UButton size="xs" color="neutral" variant="soft" icon="mdi:eye-off-outline" label="Abaikan" @click="openDismiss(item)" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="data && data.total_pages > 1" class="flex justify-center items-center pt-4">
          <UPagination
            :page="page + 1"
            :total="data.total_elements"
            :items-per-page="pageSize"
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
import { useFailedJournalApi, type ApiError } from '~/composables/api/failed-journal'
import type { FailedJournalResponse, FailedJournalStatus } from '~/types/finance/FailedJournalResponse'
import type { PageResponse } from '~/types/PageResponse'

definePageMeta({ layout: 'admin', label: 'Jurnal Gagal' })

const toast = useToast()
const alertsStore = useAlertsStore()
const { fetchFailedJournals, retryFailedJournal, dismissFailedJournal } = useFailedJournalApi()

// ===== HELPERS =====
const categoryLabels: Record<string, string> = {
  WITHDRAWAL_FEE: 'Fee penarikan',
  PAYMENT_GATEWAY_FEE_INCOME: 'Fee gateway',
  APPLICATION_FEE: 'Fee aplikasi',
  TRANSACTION_FEE: 'Fee transaksi',
}
const categoryLabel = (id: string) => categoryLabels[id] ?? id

const statusMeta = (s: FailedJournalStatus) => ({
  PENDING: { label: 'Belum ditangani', color: 'warning' as const },
  RESOLVED: { label: 'Sudah dicatat', color: 'success' as const },
  DISMISSED: { label: 'Diabaikan', color: 'neutral' as const },
}[s] ?? { label: s, color: 'neutral' as const })

const formatRupiah = (n: number) => `Rp ${Number(n ?? 0).toLocaleString('id-ID')}`
const formatDate = (d: string | null) => (d ? dayjs(d).format('D MMM YYYY HH:mm') : '-')

// Hanya prefix WD yang polanya jelas (detail withdrawal admin); lainnya teks biasa + tombol salin.
const refLink = (ref: string | null) => (ref && ref.startsWith('WD') ? `/admin/withdrawal/${ref}` : null)

// ===== FILTER & LIST =====
type Tab = FailedJournalStatus | 'ALL'
const tabItems = [
  { label: 'Belum ditangani', value: 'PENDING' },
  { label: 'Selesai', value: 'RESOLVED' },
  { label: 'Diabaikan', value: 'DISMISSED' },
  { label: 'Semua', value: 'ALL' },
]
const tab = ref<Tab>('PENDING')
const page = ref(0)
const pageSize = 20

watch(tab, () => { page.value = 0 })

const { data, pending, error, refresh } = useAsyncData<PageResponse<FailedJournalResponse>>(
  'admin-finance-failed-journals',
  () => fetchFailedJournals({
    page: page.value,
    size: pageSize,
    status: tab.value === 'ALL' ? null : tab.value,
  }),
  { watch: [page, tab], server: false },
)

async function reload() {
  await Promise.all([refresh(), alertsStore.refresh()])
}

// ===== DETAIL =====
const showDetail = ref(false)
const selected = ref<FailedJournalResponse | null>(null)

function openDetail(item: FailedJournalResponse) {
  selected.value = item
  showDetail.value = true
}

// ===== ACTIONS =====
const submitting = ref(false)
const actionTarget = ref<FailedJournalResponse | null>(null)

const showRetry = ref(false)
function openRetry(item: FailedJournalResponse) {
  actionTarget.value = item
  showRetry.value = true
}

async function submitRetry() {
  if (!actionTarget.value || submitting.value) return
  submitting.value = true
  try {
    await retryFailedJournal(actionTarget.value.id)
    toast.add({ title: 'Jurnal berhasil dicatat ulang', color: 'success', icon: 'mdi:check-circle' })
    showRetry.value = false
    showDetail.value = false
    await reload()
  } catch (err) {
    const e = err as ApiError
    toast.add({
      title: e.status === 422 ? 'Pencatatan ulang masih gagal' : 'Gagal mencatat ulang',
      description: e.message,
      color: 'error',
    })
    // 409/422/404: status atau retryCount/errorMessage berubah di BE; muat ulang.
    showRetry.value = false
    await reload()
    if (selected.value) {
      const fresh = data.value?.content.find(i => i.id === selected.value!.id)
      if (fresh) selected.value = fresh
      else showDetail.value = false
    }
  } finally {
    submitting.value = false
  }
}

const showDismiss = ref(false)
const dismissNote = ref('')
function openDismiss(item: FailedJournalResponse) {
  actionTarget.value = item
  dismissNote.value = ''
  showDismiss.value = true
}

async function submitDismiss() {
  const note = dismissNote.value.trim()
  if (!actionTarget.value || !note || submitting.value) return
  submitting.value = true
  try {
    await dismissFailedJournal(actionTarget.value.id, note)
    toast.add({ title: 'Ditandai diabaikan', color: 'success', icon: 'mdi:check-circle' })
    showDismiss.value = false
    showDetail.value = false
    await reload()
  } catch (err) {
    const e = err as ApiError
    toast.add({ title: 'Gagal mengabaikan', description: e.message, color: 'error' })
    if (e.status === 409 || e.status === 404) {
      showDismiss.value = false
      showDetail.value = false
      await reload()
    }
  } finally {
    submitting.value = false
  }
}
</script>
