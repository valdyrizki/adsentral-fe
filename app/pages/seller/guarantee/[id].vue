<template>
  <div class="flex flex-col gap-4 max-w-2xl">
    <!-- Back -->
    <NuxtLink class="text-sm font-medium flex items-center gap-1 text-gray-500 hover:text-gray-800" to="/seller/guarantee">
      <UIcon name="mdi:arrow-left" class="size-4" />
      Kembali ke Daftar Garansi
    </NuxtLink>

    <ClientOnly>
      <template #fallback>
        <div class="mt-4"><AppLoadingSkeleton /></div>
      </template>

    <!-- Loading -->
    <div v-if="pending">
      <AppLoadingSkeleton />
    </div>

    <UAlert
      v-else-if="error"
      title="Terjadi Kesalahan"
      :description="error.message || 'Gagal memuat detail garansi'"
      icon="mdi:alert-circle:error"
      color="error"
    />

    <template v-else-if="guarantee">

      <!-- Header Card -->
      <UCard>
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2 flex-wrap">
            <UIcon name="material-symbols:shield" class="size-5 text-yellow-600" />
            <span class="font-semibold text-lg">Klaim Garansi</span>
            <UBadge :color="statusColor(guarantee.status)" size="md">{{ statusLabel(guarantee.status) }}</UBadge>
            <span class="text-xs text-gray-400 ml-auto">#{{ guarantee.id }}</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div class="flex flex-col gap-0.5">
              <p class="text-gray-400 text-xs">Produk</p>
              <p class="font-medium">{{ guarantee.product.name }}</p>
            </div>
            <div class="flex flex-col gap-0.5">
              <p class="text-gray-400 text-xs">Pembeli</p>
              <p class="font-medium">{{ guarantee.buyer_name }}</p>
            </div>
            <div class="flex flex-col gap-0.5">
              <p class="text-gray-400 text-xs">ID Transaksi</p>
              <NuxtLink :to="`/seller/order/${guarantee.transaction.id}`" class="text-primary-500 hover:underline text-sm flex items-center gap-1">
                #{{ guarantee.transaction.id }}
                <UIcon name="mdi:open-in-new" class="size-3" />
              </NuxtLink>
            </div>
            <div class="flex flex-col gap-0.5">
              <p class="text-gray-400 text-xs">Diajukan</p>
              <p class="text-sm">{{ dayjs(guarantee.created_at).format('D MMM YYYY, HH:mm') }}</p>
            </div>
          </div>
        </div>
      </UCard>

      <!-- COUNTDOWN: IN_REVIEW -->
      <div
        v-if="guarantee.status === 'IN_REVIEW'"
        class="rounded-lg border overflow-hidden"
        :class="isReviewExpired ? 'border-red-300' : 'border-orange-200'"
      >
        <div
          class="p-4 flex flex-col items-center gap-2 text-center"
          :class="isReviewExpired ? 'bg-red-50' : 'bg-orange-50'"
        >
          <div class="flex items-center gap-2">
            <UIcon name="mdi:clock-alert-outline" class="size-5" :class="isReviewExpired ? 'text-red-500' : 'text-orange-500'" />
            <span class="font-semibold" :class="isReviewExpired ? 'text-red-700' : 'text-orange-700'">
              {{ isReviewExpired ? 'Batas Waktu Review Habis!' : 'Harap Respon Klaim Ini' }}
            </span>
          </div>
          <div v-if="!isReviewExpired" class="text-4xl font-mono font-bold tracking-widest text-orange-600">
            {{ reviewCountdownDisplay }}
          </div>
          <p class="text-sm" :class="isReviewExpired ? 'text-red-600' : 'text-orange-600'">
            {{ isReviewExpired
              ? 'Anda melewati batas waktu review. Sistem akan memproses penalty secara otomatis.'
              : `Terima atau tolak klaim sebelum ${dayjs(guarantee.review_deadline).format('D MMM YYYY, HH:mm')} untuk menghindari penalty.`
            }}
          </p>
        </div>

        <!-- Action buttons -->
        <div class="p-3 bg-white border-t flex gap-3 justify-center">
          <UButton icon="mdi:check-circle-outline" color="success" variant="solid" :loading="isSubmitting" @click="handleAccept">
            Terima Klaim
          </UButton>
          <UButton icon="mdi:close-circle" color="error" variant="outline" :loading="isSubmitting" @click="isRejectModal = true">
            Tolak Klaim
          </UButton>
        </div>
      </div>

      <!-- COUNTDOWN: IN_PROGRESS -->
      <div
        v-if="guarantee.status === 'IN_PROGRESS'"
        class="rounded-lg border overflow-hidden"
        :class="isProgressExpired ? 'border-red-300' : 'border-blue-200'"
      >
        <div
          class="p-4 flex flex-col items-center gap-2 text-center"
          :class="isProgressExpired ? 'bg-red-50' : 'bg-blue-50'"
        >
          <div class="flex items-center gap-2">
            <UIcon name="mdi:clock-fast" class="size-5" :class="isProgressExpired ? 'text-red-500' : 'text-blue-500'" />
            <span class="font-semibold" :class="isProgressExpired ? 'text-red-700' : 'text-blue-700'">
              {{ isProgressExpired ? 'Batas Waktu Pengiriman Habis!' : 'Segera Kirim Garansi' }}
            </span>
          </div>
          <div v-if="!isProgressExpired" class="text-4xl font-mono font-bold tracking-widest text-blue-600">
            {{ progressCountdownDisplay }}
          </div>
          <p class="text-sm" :class="isProgressExpired ? 'text-red-600' : 'text-blue-600'">
            {{ isProgressExpired
              ? 'Anda melewati batas waktu pengiriman. Sistem akan memproses penalty secara otomatis.'
              : `Kirim garansi garansi sebelum ${dayjs(guarantee.progress_deadline).format('D MMM YYYY, HH:mm')} untuk menghindari penalty.`
            }}
          </p>
        </div>
      </div>

      <!-- DONE -->
      <div v-if="guarantee.status === 'DONE'" class="p-4 rounded-lg border border-green-200 bg-green-50 flex items-center gap-3">
        <UIcon name="mdi:check-circle" class="size-6 text-green-600 flex-none" />
        <div>
          <p class="font-semibold text-green-800">Klaim Garansi Selesai</p>
          <p class="text-sm text-green-700">
            Akun garansi telah dikirimkan kepada pembeli
            <span v-if="guarantee.done_at"> pada {{ dayjs(guarantee.done_at).format('D MMM YYYY, HH:mm') }}</span>.
          </p>
        </div>
      </div>

      <!-- REJECTED -->
      <div v-if="guarantee.status === 'REJECTED'" class="p-4 rounded-lg border border-red-200 bg-red-50 flex items-center gap-3">
        <UIcon name="mdi:close-circle" class="size-6 text-red-500 flex-none" />
        <div>
          <p class="font-semibold text-red-800">Klaim Garansi Ditolak</p>
          <p class="text-sm text-red-700">
            Klaim ini ditolak
            <span v-if="guarantee.rejected_at"> pada {{ dayjs(guarantee.rejected_at).format('D MMM YYYY, HH:mm') }}</span>.
          </p>
        </div>
      </div>

      <!-- Keluhan Pembeli -->
      <UCard>
        <div class="flex flex-col gap-2">
          <p class="font-medium text-sm text-gray-700">Keluhan Pembeli</p>
          <p class="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{{ guarantee.complain_description }}</p>
        </div>
      </UCard>

      <!-- Catatan / Balasan Seller -->
      <UCard v-if="guarantee.seller_description">
        <div class="flex flex-col gap-2">
          <p class="font-medium text-sm text-gray-700">Catatan / Balasan Anda</p>
          <p class="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{{ guarantee.seller_description }}</p>
        </div>
      </UCard>

      <!-- File Garansi Terkirim -->
      <UCard v-if="guarantee.status === 'DONE' && guarantee.file_url">
        <div class="flex flex-col gap-2">
          <p class="font-medium text-sm text-gray-700">File Akun Garansi</p>
          <UButton icon="mdi:download" color="primary" variant="soft" size="sm" class="w-fit" @click="downloadFile(getImageUrl(guarantee.file_url))">
            {{ guarantee.file_ori_name }}
          </UButton>
        </div>
      </UCard>

      <!-- ACTION: IN_PROGRESS → Kirim Garansi -->
      <UCard v-if="guarantee.status === 'IN_PROGRESS'">
        <div class="flex flex-col gap-4">
          <p class="font-medium text-gray-700">Kirim Garansi ke Pembeli</p>

          <!-- Pilih metode jika produk STOCKING -->
          <div v-if="guarantee.product.delivery_type === 'STOCKING'" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              class="flex gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all"
              :class="sendMethod === 'file' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'"
              @click="sendMethod = 'file'"
            >
              <UIcon name="i-lucide-upload" class="size-5 mt-0.5 flex-none" :class="sendMethod === 'file' ? 'text-blue-500' : 'text-gray-400'" />
              <div>
                <p class="font-semibold text-sm" :class="sendMethod === 'file' ? 'text-blue-700' : 'text-gray-700'">Upload File</p>
                <p class="text-xs text-gray-500 mt-0.5">Kirim file garansi secara manual.</p>
              </div>
            </div>
            <div
              class="flex gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all"
              :class="sendMethod === 'stock' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'"
              @click="sendMethod = 'stock'"
            >
              <UIcon name="i-lucide-file-check" class="size-5 mt-0.5 flex-none" :class="sendMethod === 'stock' ? 'text-blue-500' : 'text-gray-400'" />
              <div>
                <p class="font-semibold text-sm" :class="sendMethod === 'stock' ? 'text-blue-700' : 'text-gray-700'">Via Stok</p>
                <p class="text-xs text-gray-500 mt-0.5">Kirim otomatis dari stok file yang tersedia.</p>
              </div>
            </div>
          </div>

          <!-- Metode: Upload File -->
          <template v-if="sendMethod === 'file'">
            <p class="text-sm text-gray-500">Kirim pengganti atau file garansi. Klaim otomatis selesai setelah dikirim.</p>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium">Catatan / Deskripsi <span class="text-red-500">*</span></label>
              <UTextarea v-model="doneDescription" placeholder="Contoh: Username: abc123, Password: xxxxxx. Segera ganti password setelah login." :rows="4" />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium">File Akun (opsional)</label>
              <UFileUpload v-model="doneFile" label="Upload file akun garansi" class="w-48 min-h-16" />
            </div>
            <p v-if="doneError" class="text-sm text-red-500">{{ doneError }}</p>
            <UButton icon="mdi:send" color="primary" variant="solid" size="md" :loading="isSubmitting" :disabled="!doneDescription.trim()" class="w-fit" @click="handleDone">
              Kirim & Selesaikan Garansi
            </UButton>
          </template>

          <!-- Metode: Via Stok -->
          <template v-if="sendMethod === 'stock'">
            <UAlert
              icon="i-lucide-info"
              color="info"
              variant="subtle"
              title="Kirim via Stok File"
              :description="`Stok tersedia: ${guarantee.product.stock} file. Sistem akan mengambil file dari stok dan mengirimkannya otomatis ke pembeli.`"
            />
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium">
                Jumlah Stok yang Dikirim <span class="text-red-500">*</span>
              </label>
              <UInputNumber
                v-model="stockQty"
                orientation="vertical"
                :min="1"
                :max="maxStockQty"
                class="w-40"
                :disabled="isSubmitting"
              />
              <p class="text-xs text-gray-500">
                Maks. <span class="font-semibold">{{ maxStockQty }}</span>
                (qty pembelian: {{ guarantee.transaction.qty }}, stok tersedia: {{ guarantee.product.stock }})
              </p>
              <p v-if="stockQtyError" class="text-sm text-red-500">{{ stockQtyError }}</p>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium">Catatan / Deskripsi <span class="text-gray-400 text-xs font-normal">(opsional)</span></label>
              <UTextarea v-model="stockDescription" placeholder="Contoh: Akun sudah dikirim dari stok tersedia. Segera ganti password setelah login." :rows="3" :disabled="isSubmitting" />
            </div>
            <p v-if="doneError" class="text-sm text-red-500">{{ doneError }}</p>
            <UButton icon="i-lucide-zap" color="primary" variant="solid" size="md" :loading="isSubmitting" :disabled="stockQty < 1 || stockQty > maxStockQty" class="w-fit" @click="handleDoneViaStock">
              Kirim via Stok & Selesaikan
            </UButton>
          </template>

        </div>
      </UCard>

      <!-- Timeline -->
      <UCard>
        <p class="font-medium text-sm text-gray-700 mb-3">Riwayat Status</p>
        <div class="flex flex-col gap-2 text-sm">
          <div class="flex items-start gap-2">
            <UIcon name="mdi:circle" class="size-3 text-yellow-500 mt-0.5 flex-none" />
            <div>
              <span class="font-medium">Klaim Diajukan</span>
              <span class="text-gray-400 ml-2">{{ dayjs(guarantee.created_at).format('D MMM YYYY, HH:mm') }}</span>
            </div>
          </div>
          <div v-if="guarantee.reviewed_at" class="flex items-start gap-2">
            <UIcon name="mdi:circle" class="size-3 text-blue-500 mt-0.5 flex-none" />
            <div>
              <span class="font-medium">{{ guarantee.status === 'REJECTED' ? 'Ditolak' : 'Diterima' }}</span>
              <span class="text-gray-400 ml-2">{{ dayjs(guarantee.reviewed_at).format('D MMM YYYY, HH:mm') }}</span>
            </div>
          </div>
          <div v-if="guarantee.progress_at" class="flex items-start gap-2">
            <UIcon name="mdi:circle" class="size-3 text-blue-400 mt-0.5 flex-none" />
            <div>
              <span class="font-medium">Sedang Diproses</span>
              <span class="text-gray-400 ml-2">{{ dayjs(guarantee.progress_at).format('D MMM YYYY, HH:mm') }}</span>
            </div>
          </div>
          <div v-if="guarantee.done_at" class="flex items-start gap-2">
            <UIcon name="mdi:circle-check" class="size-3 text-green-500 mt-0.5 flex-none" />
            <div>
              <span class="font-medium text-green-700">Selesai</span>
              <span class="text-gray-400 ml-2">{{ dayjs(guarantee.done_at).format('D MMM YYYY, HH:mm') }}</span>
            </div>
          </div>
          <div v-if="guarantee.rejected_at" class="flex items-start gap-2">
            <UIcon name="mdi:circle-outline" class="size-3 text-red-400 mt-0.5 flex-none" />
            <div>
              <span class="font-medium text-red-600">Ditolak</span>
              <span class="text-gray-400 ml-2">{{ dayjs(guarantee.rejected_at).format('D MMM YYYY, HH:mm') }}</span>
            </div>
          </div>
        </div>
      </UCard>

    </template>
    </ClientOnly>
  </div>

  <!-- Reject Modal -->
  <UModal v-model:open="isRejectModal" title="Tolak Klaim Garansi">
    <template #body>
      <div class="p-2 space-y-3">
        <p class="text-sm text-gray-500">Jelaskan alasan penolakan agar pembeli memahami keputusan Anda.</p>
        <label class="text-sm font-medium">Alasan Penolakan <span class="text-red-500">*</span></label>
        <UTextarea v-model="rejectReason" placeholder="Contoh: Produk tidak memiliki garansi untuk kerusakan ini..." :rows="4" />
        <p v-if="rejectError" class="text-sm text-red-500">{{ rejectError }}</p>
        <div class="flex justify-end gap-2 pt-1">
          <UButton size="sm" variant="ghost" @click="isRejectModal = false">Batal</UButton>
          <UButton size="sm" color="error" :loading="isSubmitting" :disabled="rejectReason.trim().length < 10" @click="handleReject">
            Tolak Klaim
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { UTextarea } from '#components'
import { useGuaranteeApi } from '~/composables/api/guarantee'
import type { GuaranteeResponse, GuaranteeStatus } from '~/types/guarantee/GuaranteeResponse'

definePageMeta({ layout: 'seller', label: 'Detail Garansi' })

const route = useRoute()
const toast = useToast()
const { fetchGuaranteeById, fetchReviewGuarantee, fetchSendGuarantee, sendGuaranteeViaStock } = useGuaranteeApi()

// ===== Data =====
const guarantee = ref<GuaranteeResponse | null>(null)
const pending = ref(false)
const error = ref<Error | null>(null)

async function refresh() {
  pending.value = true
  error.value = null
  try {
    guarantee.value = await fetchGuaranteeById(route.params.id as string)
  } catch (err: any) {
    error.value = err
  } finally {
    pending.value = false
  }
}

onMounted(refresh)

// ===== Form state =====
const isSubmitting = ref(false)
const isRejectModal = ref(false)
const rejectReason = ref('')
const rejectError = ref<string | null>(null)
const doneDescription = ref('')
const doneFile = ref<File | null>(null)
const doneError = ref<string | null>(null)

// Via stok
const sendMethod = ref<'file' | 'stock'>('file')
const stockQty = ref(1)
const stockDescription = ref('')
const stockQtyError = ref<string | null>(null)
const maxStockQty = computed(() => {
  if (!guarantee.value) return 1
  return Math.min(guarantee.value.transaction.qty, guarantee.value.product.stock)
})

// ===== Countdown =====
const now = ref(dayjs())
let ticker: ReturnType<typeof setInterval> | null = null

onMounted(() => { ticker = setInterval(() => { now.value = dayjs() }, 1000) })
onUnmounted(() => { if (ticker) clearInterval(ticker) })

const reviewSeconds = computed(() => {
  const d = guarantee.value?.review_deadline
  return d ? Math.max(0, dayjs(d).diff(now.value, 'second')) : 0
})
const progressSeconds = computed(() => {
  const d = guarantee.value?.progress_deadline
  return d ? Math.max(0, dayjs(d).diff(now.value, 'second')) : 0
})

const formatCountdown = (s: number): string => {
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (d > 0) return `${d}h ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

const reviewCountdownDisplay = computed(() => formatCountdown(reviewSeconds.value))
const progressCountdownDisplay = computed(() => formatCountdown(progressSeconds.value))
const isReviewExpired = computed(() => reviewSeconds.value <= 0 && !!guarantee.value?.review_deadline)
const isProgressExpired = computed(() => progressSeconds.value <= 0 && !!guarantee.value?.progress_deadline)

// ===== Status helpers =====
const statusLabel = (status: GuaranteeStatus): string => ({
  IN_REVIEW: 'Perlu Review', REJECTED: 'Ditolak', IN_PROGRESS: 'Perlu Kirim Garansi', DONE: 'Selesai',
})[status] ?? status

const statusColor = (status: GuaranteeStatus) => ({
  IN_REVIEW: 'warning' as const, REJECTED: 'error' as const, IN_PROGRESS: 'info' as const, DONE: 'success' as const,
})[status] ?? 'warning' as const

// ===== Actions =====
async function handleAccept() {
  try {
    isSubmitting.value = true
    await fetchReviewGuarantee(route.params.id as string, true)
    toast.add({ title: 'Berhasil', description: 'Klaim garansi diterima, silakan kirimkan akun garansi', color: 'success' })
    await refresh()
  } catch (err: any) {
    toast.add({ title: 'Gagal', description: err.message || 'Gagal menerima klaim', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

async function handleReject() {
  if (rejectReason.value.trim().length < 10) { rejectError.value = 'Alasan minimal 10 karakter'; return }
  try {
    isSubmitting.value = true
    rejectError.value = null
    await fetchReviewGuarantee(route.params.id as string, false, rejectReason.value.trim())
    toast.add({ title: 'Berhasil', description: 'Klaim garansi ditolak', color: 'success' })
    isRejectModal.value = false
    rejectReason.value = ''
    await refresh()
  } catch (err: any) {
    rejectError.value = err.message || 'Gagal menolak klaim'
    toast.add({ title: 'Gagal', description: err.message || 'Gagal menolak klaim', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

async function handleDone() {
  if (!doneDescription.value.trim()) { doneError.value = 'Deskripsi wajib diisi'; return }
  try {
    isSubmitting.value = true
    doneError.value = null
    const formData = new FormData()
    formData.append('sellerDescription', doneDescription.value.trim())
    if (doneFile.value) formData.append('file', doneFile.value)
    await fetchSendGuarantee(route.params.id as string, formData)
    toast.add({ title: 'Berhasil', description: 'Akun garansi berhasil dikirim ke pembeli', color: 'success' })
    doneDescription.value = ''
    doneFile.value = null
    await refresh()
  } catch (err: any) {
    doneError.value = err.message || 'Gagal mengirim akun garansi'
    toast.add({ title: 'Gagal', description: err.message || 'Gagal mengirim akun garansi', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

async function handleDoneViaStock() {
  stockQtyError.value = null
  doneError.value = null

  if (stockQty.value < 1) {
    stockQtyError.value = 'Jumlah minimal 1'
    return
  }
  if (!guarantee.value) return
  if (stockQty.value > guarantee.value.transaction.qty) {
    stockQtyError.value = `Tidak boleh melebihi jumlah pembelian (${guarantee.value.transaction.qty})`
    return
  }
  if (stockQty.value > guarantee.value.product.stock) {
    stockQtyError.value = `Stok tidak cukup. Tersedia: ${guarantee.value.product.stock}`
    return
  }

  try {
    isSubmitting.value = true
    await sendGuaranteeViaStock(route.params.id as string, stockQty.value, stockDescription.value.trim() || undefined)
    toast.add({ title: 'Berhasil', description: 'Garansi berhasil dikirim via stok ke pembeli', color: 'success' })
    stockQty.value = 1
    stockDescription.value = ''
    await refresh()
  } catch (err: any) {
    doneError.value = err.data?.message || err.statusMessage || err.message || 'Gagal mengirim garansi via stok'
    toast.add({ title: 'Gagal', description: doneError.value ?? '', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

function downloadFile(fileUrl: string | undefined) {
  if (!fileUrl) return
  const link = document.createElement('a')
  link.href = fileUrl
  link.download = ''
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>
