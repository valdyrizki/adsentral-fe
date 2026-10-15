<template>
  <div class="space-y-6">

    <!-- Modal: Detail -->
    <UModal v-if="showDetail" v-model:open="showDetail" title="Detail Pembayaran Tidak Terproses" :ui="{ footer: 'justify-end' }">
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
              <p class="text-xs text-gray-400">Payment</p>
              <div class="flex items-center gap-1">
                <NuxtLink :to="`/admin/payment/${selected.payment_id}`" class="font-mono text-primary hover:underline">
                  {{ selected.payment_id }}
                </NuxtLink>
                <AppCopyButton :value="selected.payment_id" />
              </div>
            </div>
            <div>
              <p class="text-xs text-gray-400">Referensi Tripay</p>
              <div class="flex items-center gap-1">
                <span class="font-mono">{{ selected.gateway_reference || '-' }}</span>
                <AppCopyButton v-if="selected.gateway_reference" :value="selected.gateway_reference" />
              </div>
            </div>
            <div>
              <p class="text-xs text-gray-400">Jumlah</p>
              <p class="font-semibold">{{ formatRupiah(selected.amount) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-400">Alasan</p>
              <p>{{ reasonLabel(selected.reason) }}</p>
              <p class="text-xs font-mono text-gray-400">{{ selected.reason }}</p>
            </div>
          </div>

          <div v-if="selected.status === 'RESOLVED'" class="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
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
        <UButton v-if="selected?.status === 'PENDING'" color="primary" icon="mdi:check" @click="openResolve(selected!)">
          Tandai selesai
        </UButton>
      </template>
    </UModal>

    <!-- Modal: Tandai selesai -->
    <UModal v-if="showResolve" v-model:open="showResolve" title="Tandai Selesai" :ui="{ footer: 'justify-end' }">
      <template #body>
        <p v-if="actionTarget" class="text-sm text-gray-600 mb-3">
          Pembayaran <span class="font-mono font-semibold">{{ actionTarget.payment_id }}</span>
          sebesar <span class="font-semibold">{{ formatRupiah(actionTarget.amount) }}</span>.
          Tombol ini hanya mencatat bahwa Anda sudah menanganinya; tidak ada uang yang bergerak.
        </p>
        <UFormField label="Catatan" required>
          <UTextarea
            v-model="resolveNote"
            :rows="3"
            placeholder="Mis. sudah di-refund lewat dashboard Tripay / Mis. saldo buyer dikreditkan manual"
            class="w-full"
          />
        </UFormField>
      </template>
      <template #footer>
        <UButton color="neutral" variant="outline" :disabled="submitting" @click="showResolve = false">Batal</UButton>
        <UButton
          color="primary"
          :loading="submitting"
          :disabled="submitting || !resolveNote.trim()"
          icon="mdi:content-save-outline"
          @click="submitResolve"
        >
          Simpan
        </UButton>
      </template>
    </UModal>

    <UAlert color="warning" variant="subtle" icon="mdi:alert-outline" title="Tentang Pembayaran Tidak Terproses">
      <template #description>
        Pembayaran di bawah ini <strong>sudah diterima gateway</strong>, tetapi pesanannya tidak bisa diproses lagi
        (sudah kedaluwarsa, dibatalkan, atau stoknya sudah dikembalikan). Uangnya ada di akun gateway, bukan di saldo aplikasi.
        Lakukan <strong>refund lewat dashboard Tripay</strong> atau kredit saldo buyer secara manual, lalu tandai selesai dengan catatan.
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
            Pembayaran Tidak Terproses
            <span v-if="data?.total_elements" class="text-xs text-gray-400 font-normal ml-2">
              ({{ data.total_elements }} total)
            </span>
          </p>
        </template>

        <AppLoadingSkeleton v-if="pending && !data" />

        <UAlert
          v-else-if="error"
          title="Terjadi Kesalahan"
          :description="(error as any).message || 'Gagal memuat data'"
          color="error"
          icon="mdi:alert-circle"
        />

        <div v-else-if="!data?.content?.length" class="py-10 text-center text-gray-400 text-sm">
          <UIcon name="mdi:check-circle-outline" class="text-4xl text-gray-300 mb-3" />
          <p v-if="tab === 'PENDING'">Tidak ada pembayaran yang tertahan.</p>
          <p v-else>Tidak ada data.</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-gray-400 border-b border-gray-100">
                <th class="py-2 px-2 font-medium">Waktu</th>
                <th class="py-2 px-2 font-medium">Payment</th>
                <th class="py-2 px-2 font-medium">Referensi Tripay</th>
                <th class="py-2 px-2 font-medium text-right">Jumlah</th>
                <th class="py-2 px-2 font-medium">Alasan</th>
                <th class="py-2 px-2 font-medium">Status</th>
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
                <td class="py-3 px-2" @click.stop>
                  <div class="flex items-center gap-1">
                    <NuxtLink :to="`/admin/payment/${item.payment_id}`" class="font-mono text-xs text-primary hover:underline">
                      {{ item.payment_id }}
                    </NuxtLink>
                    <AppCopyButton :value="item.payment_id" />
                  </div>
                </td>
                <td class="py-3 px-2" @click.stop>
                  <div class="flex items-center gap-1">
                    <span class="font-mono text-xs">{{ item.gateway_reference || '-' }}</span>
                    <AppCopyButton v-if="item.gateway_reference" :value="item.gateway_reference" />
                  </div>
                </td>
                <td class="py-3 px-2 text-right font-semibold whitespace-nowrap">{{ formatRupiah(item.amount) }}</td>
                <td class="py-3 px-2">{{ reasonLabel(item.reason) }}</td>
                <td class="py-3 px-2">
                  <UBadge :color="statusMeta(item.status).color" variant="subtle" size="sm">
                    {{ statusMeta(item.status).label }}
                  </UBadge>
                </td>
                <td class="py-3 px-2 text-right" @click.stop>
                  <UButton
                    v-if="item.status === 'PENDING'"
                    size="xs"
                    color="primary"
                    variant="soft"
                    icon="mdi:check"
                    label="Tandai selesai"
                    @click="openResolve(item)"
                  />
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
import { useUnprocessedPaymentApi, type UnprocessedApiError } from '~/composables/api/unprocessed-payment'
import type { UnprocessedPaymentResponse, UnprocessedPaymentStatus } from '~/types/payment/UnprocessedPaymentResponse'
import type { PageResponse } from '~/types/PageResponse'

definePageMeta({ layout: 'admin', label: 'Pembayaran Tidak Terproses' })

const toast = useToast()
const alertsStore = useAlertsStore()
const { fetchUnprocessedPayments, resolveUnprocessedPayment } = useUnprocessedPaymentApi()

// ===== HELPERS =====
const reasonLabels: Record<string, string> = {
  PAYMENT_EXPIRED: 'Dibayar setelah kedaluwarsa',
  PAYMENT_CANCELLED: 'Dibayar setelah dibatalkan',
  TX_LAPSED: 'Dibayar setelah pesanan di-expired-kan',
}
const reasonLabel = (r: string) => reasonLabels[r] ?? r

const statusMeta = (s: UnprocessedPaymentStatus) => ({
  PENDING: { label: 'Perlu ditangani', color: 'error' as const },
  RESOLVED: { label: 'Selesai', color: 'success' as const },
}[s] ?? { label: s, color: 'neutral' as const })

const formatRupiah = (n: number) => `Rp ${Number(n ?? 0).toLocaleString('id-ID')}`
const formatDate = (d: string | null) => (d ? dayjs(d).format('D MMM YYYY HH:mm') : '-')

// ===== FILTER & LIST =====
type Tab = UnprocessedPaymentStatus | 'ALL'
const tabItems = [
  { label: 'Belum ditangani', value: 'PENDING' },
  { label: 'Selesai', value: 'RESOLVED' },
  { label: 'Semua', value: 'ALL' },
]
const tab = ref<Tab>('PENDING')
const page = ref(0)
const pageSize = 20

watch(tab, () => { page.value = 0 })

const { data, pending, error, refresh } = useAsyncData<PageResponse<UnprocessedPaymentResponse>>(
  'admin-unprocessed-payments',
  () => fetchUnprocessedPayments({
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
const selected = ref<UnprocessedPaymentResponse | null>(null)

function openDetail(item: UnprocessedPaymentResponse) {
  selected.value = item
  showDetail.value = true
}

// ===== RESOLVE =====
const submitting = ref(false)
const actionTarget = ref<UnprocessedPaymentResponse | null>(null)
const showResolve = ref(false)
const resolveNote = ref('')

function openResolve(item: UnprocessedPaymentResponse) {
  actionTarget.value = item
  resolveNote.value = ''
  showResolve.value = true
}

async function submitResolve() {
  const note = resolveNote.value.trim()
  if (!actionTarget.value || !note || submitting.value) return
  submitting.value = true
  try {
    await resolveUnprocessedPayment(actionTarget.value.id, note)
    toast.add({ title: 'Ditandai selesai', color: 'success', icon: 'mdi:check-circle' })
    showResolve.value = false
    showDetail.value = false
    await reload()
  } catch (err) {
    const e = err as UnprocessedApiError
    toast.add({ title: 'Gagal menandai selesai', description: e.message, color: 'error' })
    if (e.status === 409 || e.status === 404) {
      showResolve.value = false
      showDetail.value = false
      await reload()
    }
  } finally {
    submitting.value = false
  }
}
</script>
