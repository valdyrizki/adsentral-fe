<template>
  <div class="mx-auto max-w-2xl py-6 px-4 xl:px-0 flex flex-col gap-4">

    <!-- Back -->
    <NuxtLink class="text-sm font-medium flex items-center gap-1 text-gray-500 hover:text-gray-800" to="/guarantee">
      <UIcon name="mdi:arrow-left" class="size-4" />
      Kembali ke Daftar Garansi
    </NuxtLink>

    <!-- Loading -->
    <div v-if="pending">
      <AppLoadingSkeleton />
    </div>

    <UAlert
      v-else-if="error"
      title="Terjadi Kesalahan"
      :description="error.message || 'Gagal memuat detail garansi'"
      icon="icon-park-solid:error"
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
              <p class="text-gray-400 text-xs">Toko</p>
              <p class="font-medium">{{ guarantee.merchant_name }}</p>
            </div>
            <div class="flex flex-col gap-0.5">
              <p class="text-gray-400 text-xs">ID Transaksi</p>
              <NuxtLink :to="`/transaction/${guarantee.transaction.id}`" class="text-primary-500 hover:underline text-sm flex items-center gap-1">
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

      <!-- Status: IN_REVIEW -->
      <div v-if="guarantee.status === 'IN_REVIEW'" class="p-4 rounded-lg border border-orange-200 bg-orange-50 flex items-center gap-3">
        <UIcon name="mdi:clock-outline" class="size-6 text-orange-500 flex-none" />
        <div>
          <p class="font-semibold text-orange-800">Menunggu Review Seller</p>
          <p class="text-sm text-orange-700">Klaim Anda sedang ditinjau oleh seller. Harap tunggu respons dari seller.</p>
          <p v-if="guarantee.review_deadline" class="text-xs text-orange-500 mt-1">
            Batas waktu review: {{ dayjs(guarantee.review_deadline).format('D MMM YYYY, HH:mm') }}
          </p>
        </div>
      </div>

      <!-- Status: IN_PROGRESS -->
      <div v-if="guarantee.status === 'IN_PROGRESS'" class="p-4 rounded-lg border border-blue-200 bg-blue-50 flex items-center gap-3">
        <UIcon name="mdi:clock-fast" class="size-6 text-blue-500 flex-none" />
        <div>
          <p class="font-semibold text-blue-800">Garansi Sedang Diproses</p>
          <p class="text-sm text-blue-700">Seller sedang memproses pengiriman garansi untuk Anda.</p>
          <p v-if="guarantee.progress_deadline" class="text-xs text-blue-500 mt-1">
            Batas waktu pengiriman: {{ dayjs(guarantee.progress_deadline).format('D MMM YYYY, HH:mm') }}
          </p>
        </div>
      </div>

      <!-- Status: DONE -->
      <div v-if="guarantee.status === 'DONE'" class="p-4 rounded-lg border border-green-200 bg-green-50 flex items-center gap-3">
        <UIcon name="mdi:check-circle" class="size-6 text-green-600 flex-none" />
        <div>
          <p class="font-semibold text-green-800">Klaim Garansi Selesai</p>
          <p class="text-sm text-green-700">
            Seller telah mengirimkan akun garansi
            <span v-if="guarantee.done_at"> pada {{ dayjs(guarantee.done_at).format('D MMM YYYY, HH:mm') }}</span>.
          </p>
        </div>
      </div>

      <!-- Status: REJECTED -->
      <div v-if="guarantee.status === 'REJECTED'" class="p-4 rounded-lg border border-red-200 bg-red-50 flex items-center gap-3">
        <UIcon name="mdi:close-circle" class="size-6 text-red-500 flex-none" />
        <div>
          <p class="font-semibold text-red-800">Klaim Garansi Ditolak</p>
          <p class="text-sm text-red-700">
            Seller menolak klaim ini
            <span v-if="guarantee.rejected_at"> pada {{ dayjs(guarantee.rejected_at).format('D MMM YYYY, HH:mm') }}</span>.
          </p>
        </div>
      </div>

      <!-- Keluhan Pembeli -->
      <UCard>
        <div class="flex flex-col gap-2">
          <p class="font-medium text-sm text-gray-700">Keluhan Anda</p>
          <p class="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{{ guarantee.complain_description }}</p>
        </div>
      </UCard>

      <!-- Catatan / Balasan Seller -->
      <UCard v-if="guarantee.seller_description">
        <div class="flex flex-col gap-2">
          <p class="font-medium text-sm text-gray-700">Balasan Seller</p>
          <p class="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{{ guarantee.seller_description }}</p>
        </div>
      </UCard>

      <!-- File Garansi -->
      <UCard v-if="guarantee.status === 'DONE' && guarantee.file_url">
        <div class="flex flex-col gap-2">
          <p class="font-medium text-sm text-gray-700">File Akun Garansi</p>
          <p class="text-xs text-gray-400">Simpan file ini dengan aman. Ini adalah akun garansi yang dikirimkan seller.</p>
          <UButton icon="mdi:download" color="primary" variant="soft" size="sm" class="w-fit" @click="downloadFile(config.public.backendUrl + '/' + guarantee.file_url)">
            {{ guarantee.file_ori_name || 'Unduh File Garansi' }}
          </UButton>
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
              <span class="font-medium">{{ guarantee.status === 'REJECTED' ? 'Ditolak Seller' : 'Diterima Seller' }}</span>
              <span class="text-gray-400 ml-2">{{ dayjs(guarantee.reviewed_at).format('D MMM YYYY, HH:mm') }}</span>
            </div>
          </div>
          <div v-if="guarantee.progress_at" class="flex items-start gap-2">
            <UIcon name="mdi:circle" class="size-3 text-blue-400 mt-0.5 flex-none" />
            <div>
              <span class="font-medium">Sedang Diproses Seller</span>
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
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { useGuaranteeApi } from '~/composables/api/guarantee'
import type { GuaranteeResponse, GuaranteeStatus } from '~/types/guarantee/GuaranteeResponse'

const route = useRoute()
const config = useRuntimeConfig()
const { fetchGuaranteeById } = useGuaranteeApi()

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

const statusLabel = (status: GuaranteeStatus): string => ({
  IN_REVIEW: 'Menunggu Review Seller',
  REJECTED: 'Ditolak',
  IN_PROGRESS: 'Sedang Diproses',
  DONE: 'Selesai',
})[status] ?? status

const statusColor = (status: GuaranteeStatus) => ({
  IN_REVIEW: 'warning' as const,
  REJECTED: 'error' as const,
  IN_PROGRESS: 'info' as const,
  DONE: 'success' as const,
})[status] ?? 'warning' as const

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
