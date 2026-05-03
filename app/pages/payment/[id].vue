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
          icon="icon-park-solid:error"
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
              <a :href="config.public.backendUrl + '/' + payment.payment_proof_url" target="_blank" class="inline-block">
                <img
                  :src="config.public.backendUrl + '/' + payment.payment_proof_url"
                  alt="Bukti Pembayaran"
                  class="max-h-52 rounded-xl border border-gray-200 shadow-sm object-contain hover:opacity-90 transition-opacity"
                />
              </a>
            </div>

            <!-- ===== DEPOSIT ACTIONS (only for DEPOSIT type) ===== -->
            <template v-if="payment.payment_type === 'DEPOSIT'">

              <!-- UNPAID: upload proof + cancel -->
              <div v-if="payment.status === 'UNPAID'" class="px-5 pb-5 pt-0 border-t border-gray-100 mt-2">
                <p class="text-sm font-semibold text-gray-700 mb-3 pt-4">Langkah selanjutnya</p>
                <UAlert
                  title="Selesaikan pembayaran"
                  description="Lakukan transfer sesuai metode yang dipilih, lalu upload bukti pembayaran di bawah."
                  icon="i-heroicons-information-circle"
                  color="info"
                  class="mb-4"
                />

                <!-- Upload Proof -->
                <div class="space-y-2 mb-4">
                  <p class="text-xs text-gray-500">Upload Bukti Pembayaran</p>
                  <div class="flex items-center gap-3">
                    <input
                      ref="fileInput"
                      type="file"
                      accept="image/jpeg,image/png"
                      class="hidden"
                      @change="onFileChange"
                    />
                    <UButton
                      icon="i-heroicons-photo"
                      color="info"
                      variant="soft"
                      size="sm"
                      @click="fileInput?.click()"
                    >
                      {{ proofFile ? proofFile.name : 'Pilih Gambar' }}
                    </UButton>
                    <UButton
                      v-if="proofFile"
                      icon="i-heroicons-arrow-up-tray"
                      color="success"
                      size="sm"
                      :loading="uploading"
                      @click="handleUploadProof"
                    >
                      Upload Bukti
                    </UButton>
                  </div>
                  <p v-if="proofFile" class="text-xs text-gray-400">{{ proofFile.name }} ({{ (proofFile.size / 1024).toFixed(0) }} KB)</p>
                </div>

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

            <!-- ===== TRANSACTION: read-only info ===== -->
            <template v-else>
              <div class="px-5 pb-5 pt-0 border-t border-gray-100 mt-2">
                <UAlert
                  title="Pembayaran Transaksi"
                  description="Pembayaran ini terkait dengan transaksi pembelian. Gunakan menu Riwayat Transaksi untuk melihat detail pesanan."
                  icon="i-heroicons-shopping-bag"
                  color="info"
                  class="mt-4"
                />
                <UButton
                  to="/transaction"
                  icon="i-heroicons-arrow-right"
                  trailing
                  variant="outline"
                  color="primary"
                  size="sm"
                  class="mt-3"
                >
                  Lihat Riwayat Transaksi
                </UButton>
              </div>
            </template>

          </div>

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
import { usePaymentApi } from '~/composables/api/payment'
import type { PaymentResponse } from '~/types/payment/PaymentResponse'

definePageMeta({ layout: 'default' })

const route = useRoute()
const config = useRuntimeConfig()
const toast = useToast()
const { fetchPaymentById, cancelPayment, uploadPaymentProof } = usePaymentApi()

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

// ===== UPLOAD PROOF =====
const fileInput = ref<HTMLInputElement | null>(null)
const proofFile = ref<File | null>(null)
const uploading = ref(false)

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  proofFile.value = target.files?.[0] ?? null
}

async function handleUploadProof() {
  if (!proofFile.value) return
  uploading.value = true
  try {
    await uploadPaymentProof(paymentId.value, proofFile.value)
    toast.add({ title: 'Bukti pembayaran berhasil diupload', color: 'success', icon: 'i-heroicons-check-circle' })
    proofFile.value = null
    if (fileInput.value) fileInput.value.value = ''
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Gagal upload bukti', description: err.statusMessage || err.message, color: 'error' })
  } finally {
    uploading.value = false
  }
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
