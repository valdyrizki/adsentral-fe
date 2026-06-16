<template>
  <div class="w-full">
    <div class="m-1 sm:m-3 border rounded-2xl border-blue-200 bg-gray-100">
      <div class="p-4 md:p-6 space-y-6">

        <!-- Back + Breadcrumb -->
        <div class="flex items-center gap-2">
          <UButton icon="i-heroicons-arrow-left" variant="ghost" color="neutral" to="/payment" size="sm" />
          <UBreadcrumb :items="breadcrumb" />
        </div>

        <!-- Loading -->
        <AppLoadingSkeleton v-if="pending" />

        <!-- Error -->
        <UAlert
          v-else-if="error"
          title="Gagal memuat data"
          :description="error.message || 'Terjadi kesalahan'"
          icon="mdi:alert-circle:error"
          color="error"
        />

        <template v-else-if="payment">

          <!-- Payment Card -->
          <div class="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">

            <!-- Card Header -->
            <div
              :class="`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${payment.payment_type === 'DEPOSIT' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100' : 'bg-gradient-to-r from-blue-50 to-primary/5 border-b border-blue-100'}`"
            >
              <div class="flex items-center gap-3">
                <div
                  :class="`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${payment.payment_type === 'DEPOSIT' ? 'bg-green-100' : 'bg-primary/10'}`"
                >
                  <UIcon
                    :name="payment.payment_type === 'DEPOSIT' ? 'i-heroicons-arrow-down-circle' : 'i-heroicons-shopping-bag'"
                    :class="`text-2xl ${payment.payment_type === 'DEPOSIT' ? 'text-green-600' : 'text-primary'}`"
                  />
                </div>
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <UBadge
                      :color="payment.payment_type === 'DEPOSIT' ? 'success' : 'primary'"
                      variant="subtle"
                      size="sm"
                    >
                      {{ payment.payment_type === 'DEPOSIT' ? 'Deposit Saldo' : 'Pembayaran Transaksi' }}
                    </UBadge>
                    <UBadge v-if="payment.payment_method" color="info" variant="soft" size="xs">
                      {{ payment.payment_method.payment_gateway }}
                    </UBadge>
                  </div>
                  <p class="text-xs text-gray-400 font-mono mt-1">#{{ payment.id }}</p>
                </div>
              </div>
              <PaymentStatusBadge :status="payment.status" />
            </div>

            <!-- Card Body -->
            <div class="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p class="text-xs text-gray-400 mb-1">Nominal</p>
                <p class="text-2xl font-bold text-gray-800">Rp {{ payment.amount.toLocaleString('id-ID') }}</p>
              </div>

              <div>
                <p class="text-xs text-gray-400 mb-1">Metode Pembayaran</p>
                <p class="text-sm font-semibold text-gray-700">
                  {{ payment.payment_method?.payment_gateway ?? '-' }}
                </p>
                <p v-if="payment.payment_method?.description" class="text-xs text-gray-400">
                  {{ payment.payment_method.description }}
                </p>
              </div>

              <div>
                <p class="text-xs text-gray-400 mb-1">Tanggal Dibuat</p>
                <p class="text-sm text-gray-700">{{ dayjs(payment.created_at).format('DD MMM YYYY, HH:mm') }}</p>
                <p v-if="payment.updated_at" class="text-xs text-gray-400">
                  Diperbarui: {{ dayjs(payment.updated_at).format('DD MMM YYYY, HH:mm') }}
                </p>
              </div>
            </div>

            <!-- Bukti Pembayaran (existing) -->
            <div v-if="payment.payment_proof_url" class="px-5 pb-5">
              <p class="text-xs text-gray-400 mb-2">Bukti Pembayaran</p>
              <a :href="getImageUrl(payment.payment_proof_url)" target="_blank" class="inline-block">
                <img
                  :src="getImageUrl(payment.payment_proof_url)"
                  alt="Bukti Pembayaran"
                  class="max-h-52 rounded-xl border border-gray-200 shadow-sm object-contain hover:opacity-90 transition-opacity"
                />
              </a>
            </div>

            <!-- ===== INFO REKENING MANUAL_BANK ===== -->
            <div
              v-if="payment.status === 'UNPAID' && payment.payment_method?.id === 'MANUAL_BANK'"
              class="px-5 pb-4 border-t border-gray-100 mt-2"
            >
              <div class="rounded-lg border border-yellow-200 bg-yellow-50 p-4 mt-4">
                <div class="flex items-center gap-2 mb-2">
                  <UIcon name="mdi:bank-outline" class="size-5 text-yellow-600" />
                  <h3 class="font-semibold text-yellow-800">Informasi Rekening Pembayaran</h3>
                </div>
                <p class="text-xs text-yellow-700 mb-3">
                  Transfer sejumlah
                  <span class="font-semibold">Rp {{ payment.amount.toLocaleString('id-ID') }}</span>
                  ke rekening berikut, lalu kirimkan bukti transfer ke admin melalui WhatsApp.
                </p>
                <div v-if="rekeningLoading" class="py-2">
                  <AppLoadingSkeleton />
                </div>
                <div v-else-if="rekeningSettings && rekeningSettings.length > 0" class="flex flex-col gap-1.5">
                  <div
                    v-for="setting in rekeningSettings"
                    :key="setting.id"
                    class="flex justify-between items-center text-sm bg-white rounded px-3 py-2 border border-yellow-100"
                  >
                    <span class="text-gray-500">{{ setting.description || setting.key }}</span>
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-gray-900">{{ setting.value }}</span>
                      <UButton
                        :icon="copiedKey === setting.key ? 'i-heroicons-check' : 'i-heroicons-clipboard'"
                        size="xs"
                        :color="copiedKey === setting.key ? 'success' : 'neutral'"
                        variant="ghost"
                        @click="copyToClipboard(setting.key, setting.value)"
                      />
                    </div>
                  </div>
                </div>
                <div v-else class="text-sm text-yellow-700 italic">
                  Informasi rekening belum tersedia. Silakan hubungi admin.
                </div>
                <UButton
                  v-if="waLink"
                  :to="waLink"
                  target="_blank"
                  icon="i-heroicons-chat-bubble-left-ellipsis"
                  color="success"
                  variant="solid"
                  size="sm"
                  class="mt-3 w-full justify-center"
                >
                  Kirim Bukti Transfer via WhatsApp
                </UButton>
              </div>
            </div>

            <!-- ===== DEPOSIT ACTIONS (only for DEPOSIT type) ===== -->
            <template v-if="payment.payment_type === 'DEPOSIT'">

              <!-- UNPAID: cancel only (bukti via WA di panel rekening atas) -->
              <div v-if="payment.status === 'UNPAID'" class="px-5 pb-5 pt-0 border-t border-gray-100 mt-2">
                <p class="text-sm font-semibold text-gray-700 mb-3 pt-4">Langkah selanjutnya</p>
                <UAlert
                  title="Selesaikan pembayaran"
                  :description="payment.payment_method?.id === 'MANUAL_BANK'
                    ? 'Lakukan transfer sesuai rekening di atas, lalu kirimkan bukti transfer ke admin melalui WhatsApp.'
                    : 'Lakukan pembayaran sesuai metode yang dipilih.'"
                  icon="i-heroicons-information-circle"
                  color="info"
                  class="mb-4"
                />

                <!-- Cancel -->
                <UButton
                  icon="material-symbols:cancel"
                  color="error"
                  variant="outline"
                  size="sm"
                  :loading="cancelling"
                  @click="isCancelConfirmOpen = true"
                >
                  Batalkan Pembayaran
                </UButton>
              </div>

              <!-- PAID: waiting for admin -->
              <div v-else-if="payment.status === 'PAID'" class="px-5 pb-5 pt-0 border-t border-gray-100 mt-2">
                <UAlert
                  title="Menunggu konfirmasi admin"
                  description="Bukti pembayaran Anda sudah diterima. Admin akan segera mengkonfirmasi pembayaran ini."
                  icon="i-heroicons-clock"
                  color="warning"
                  class="mt-4"
                />
              </div>

              <!-- DONE / COMPLETE -->
              <div v-else-if="['DONE', 'COMPLETE'].includes(payment.status)" class="px-5 pb-5 pt-0 border-t border-gray-100 mt-2">
                <UAlert
                  title="Pembayaran berhasil dikonfirmasi"
                  description="Saldo Anda telah berhasil ditambahkan."
                  icon="i-heroicons-check-circle"
                  color="success"
                  class="mt-4"
                />
              </div>

              <!-- REJECTED -->
              <div v-else-if="payment.status === 'REJECTED'" class="px-5 pb-5 pt-0 border-t border-gray-100 mt-2">
                <UAlert
                  title="Pembayaran ditolak"
                  description="Pembayaran Anda ditolak oleh admin. Silakan hubungi support untuk informasi lebih lanjut."
                  icon="i-heroicons-x-circle"
                  color="error"
                  class="mt-4"
                />
              </div>

              <!-- CANCELLED -->
              <div v-else-if="payment.status === 'CANCELLED'" class="px-5 pb-5 pt-0 border-t border-gray-100 mt-2">
                <UAlert
                  title="Pembayaran dibatalkan"
                  description="Pembayaran ini telah dibatalkan."
                  icon="i-heroicons-information-circle"
                  color="neutral"
                  class="mt-4"
                />
              </div>

            </template>

            <!-- ===== TRANSACTION: placeholder (list di bawah) ===== -->
            <template v-else>
              <div class="px-5 pb-5 pt-0 border-t border-gray-100 mt-2">
                <UAlert
                  title="Pembayaran Transaksi"
                  description="Detail transaksi terkait ditampilkan di bawah."
                  icon="i-heroicons-shopping-bag"
                  color="info"
                  variant="subtle"
                  class="mt-4"
                />
              </div>
            </template>

          </div>

          <!-- ===== LIST TRANSAKSI (TRANSACTION type) ===== -->
          <template v-if="payment.payment_type === 'TRANSACTION'">
            <div class="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden mt-4">

              <div class="p-5 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                <p class="font-semibold text-gray-800">
                  Detail Transaksi
                  <span v-if="txData?.total_elements" class="text-xs text-gray-400 font-normal ml-2">
                    ({{ txData.total_elements }} item)
                  </span>
                </p>
                <UButton icon="mdi:refresh" size="xs" color="neutral" variant="outline" :loading="pendingTx" @click="refreshTx()" />
              </div>

              <div class="p-5">
                <AppLoadingSkeleton v-if="pendingTx" />

                <UAlert
                  v-else-if="txError"
                  title="Gagal memuat transaksi"
                  :description="txError.message"
                  icon="mdi:alert-circle:error"
                  color="error"
                />

                <div v-else-if="!txData?.content?.length" class="py-8 text-center text-gray-400 text-sm">
                  <UIcon name="i-heroicons-inbox" class="text-4xl text-gray-300 mb-2" />
                  <p>Tidak ada transaksi terkait.</p>
                </div>

                <div v-else class="divide-y divide-gray-100">
                  <div
                    v-for="tx in txData.content"
                    :key="tx.id"
                    class="flex flex-col sm:flex-row sm:items-center gap-4 py-4 hover:bg-gray-50 rounded-xl transition-colors"
                  >
                    <NuxtLink :to="`/transaction/${tx.id}`" class="flex items-center gap-4 flex-1 min-w-0">
                      <img
                        :src="getImageUrl(tx.product?.banner_url)"
                        :alt="tx.product?.name"
                        class="w-14 h-14 rounded-xl object-cover border border-gray-100 flex-shrink-0 bg-gray-50"
                      />
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-gray-800 truncate">{{ tx.product?.name ?? '-' }}</p>
                        <p class="text-xs text-gray-400 mt-0.5">{{ tx.qty }} item</p>
                        <p v-if="tx.tx_description" class="text-xs text-gray-500 mt-1 truncate">{{ tx.tx_description }}</p>
                      </div>
                      <div class="text-right flex-shrink-0">
                        <p class="text-xs text-gray-400">{{ tx.qty }} × Rp {{ tx.price.toLocaleString('id-ID') }}</p>
                        <p class="text-sm font-bold text-gray-800">Rp {{ tx.total_price.toLocaleString('id-ID') }}</p>
                      </div>
                    </NuxtLink>

                    <div class="flex flex-col items-end gap-1 flex-shrink-0">
                      <TransactionStatusBadge :status="tx.status" />
                      <p class="text-xs text-gray-400">{{ dayjs(tx.created_at).format('DD MMM YYYY') }}</p>
                    </div>
                  </div>
                </div>

                <!-- Pagination -->
                <div
                  v-if="txData && txData.total_pages > 1 && !pendingTx"
                  class="flex justify-center pt-4"
                >
                  <UPagination
                    :page="txPage + 1"
                    :total="txData.total_elements"
                    :items-per-page="txSize"
                    :sibling-count="1"
                    show-edges
                    @update:page="(p) => { txPage = p - 1 }"
                  />
                </div>
              </div>

            </div>
          </template>

        </template>

      </div>
    </div>
  </div>

  <!-- Cancel Confirm Modal -->
  <UModal v-model:open="isCancelConfirmOpen" title="Batalkan Pembayaran">
    <template #body>
      <div class="space-y-4">
        <UAlert
          title="Yakin ingin membatalkan?"
          description="Pembayaran deposit ini akan dibatalkan dan tidak dapat diurungkan."
          icon="i-heroicons-exclamation-triangle"
          color="warning"
        />
        <div class="flex justify-end gap-2">
          <UButton variant="outline" color="neutral" @click="isCancelConfirmOpen = false">Kembali</UButton>
          <UButton color="error" :loading="cancelling" @click="handleCancel">Ya, Batalkan</UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import PaymentStatusBadge from '~/components/app/PaymentStatusBadge.vue'
import TransactionStatusBadge from '~/components/app/TransactionStatusBadge.vue'
import { useSystemSettingApi } from '~/composables/api/system-setting'
import { useSystemSettingStore } from '~/stores/system-setting'
import { usePaymentApi } from '~/composables/api/payment'
import type { PaymentResponse } from '~/types/payment/PaymentResponse'
import type { SystemSettingResponse } from '~/types/system-setting/SystemSettingResponse'
import type { TransactionResponse } from '~/types/TransactionResponse'
import type { PageResponse } from '~/types/PageResponse'

definePageMeta({ layout: 'default' })

const route = useRoute()
const toast = useToast()
const { fetchPaymentById, cancelPayment, fetchTxByPaymentId } = usePaymentApi()
const { fetchPublicSystemSettingByGroup } = useSystemSettingApi()
const systemSettingStore = useSystemSettingStore()

const waLink = computed(() => {
  const number = systemSettingStore.systemSettings.find(s => s.key === 'WA_NUMBER')?.value
  if (!number || !payment.value) return null
  const msg = encodeURIComponent(
    `Halo Admin, saya ingin mengirimkan bukti transfer untuk:\n` +
    `ID Pembayaran: #${payment.value.id}\n` +
    `Nominal: Rp ${payment.value.amount.toLocaleString('id-ID')}\n\n` +
    `[Lampirkan foto bukti transfer di sini]`
  )
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${msg}`
})

const paymentId = computed(() => route.params.id as string)

useHead({ title: 'Detail Pembayaran — Adsentral' })

const breadcrumb = [
  { label: 'Home', icon: 'i-lucide-home', to: '/' },
  { label: 'Riwayat Pembayaran', icon: 'i-heroicons-credit-card', to: '/payment' },
  { label: 'Detail', icon: 'i-heroicons-eye' },
]

// ===== FETCH PAYMENT =====
const {
  data: payment,
  pending,
  error,
  refresh,
} = await useAsyncData<PaymentResponse>(
  () => `my-payment-${paymentId.value}`,
  () => fetchPaymentById(paymentId.value),
  { server: false }
)

// ===== FETCH TRANSACTIONS =====
const txPage = ref(0)
const txSize = ref(20)

const {
  data: txData,
  pending: pendingTx,
  error: txError,
  refresh: refreshTx,
} = useAsyncData<PageResponse<TransactionResponse>>(
  () => `my-payment-tx-${paymentId.value}-${txPage.value}`,
  () => fetchTxByPaymentId(paymentId.value, txPage.value, txSize.value),
  { watch: [txPage], server: false, immediate: false }
)

watch(payment, (val) => {
  if (val?.payment_type === 'TRANSACTION') refreshTx()
}, { immediate: true })

// ===== FETCH REKENING (MANUAL_BANK) =====
const {
  data: rekeningSettings,
  pending: rekeningLoading,
} = await useAsyncData<SystemSettingResponse[]>(
  `rekening-settings-payment`,
  () => fetchPublicSystemSettingByGroup('REKENING'),
  { server: false }
)

// ===== COPY TO CLIPBOARD =====
const copiedKey = ref<string | null>(null)

function copyToClipboard(key: string, value: string) {
  navigator.clipboard.writeText(value).then(() => {
    copiedKey.value = key
    toast.add({ title: 'Disalin!', description: value, color: 'success', icon: 'i-heroicons-check-circle' })
    setTimeout(() => { copiedKey.value = null }, 2000)
  })
}

// ===== CANCEL =====
const cancelling = ref(false)
const isCancelConfirmOpen = ref(false)

async function handleCancel() {
  cancelling.value = true
  try {
    await cancelPayment(paymentId.value)
    toast.add({ title: 'Pembayaran berhasil dibatalkan', color: 'success' })
    isCancelConfirmOpen.value = false
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Gagal membatalkan', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    cancelling.value = false
  }
}
</script>
