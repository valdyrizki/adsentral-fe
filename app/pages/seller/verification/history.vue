<template>
  <div class="space-y-6">

    <UButton to="/seller/verification" icon="mdi:arrow-left" color="neutral" variant="ghost" size="sm">
      Kembali ke Verifikasi Akun
    </UButton>

    <div>
      <h1 class="text-xl font-semibold text-gray-900">Riwayat Pengajuan Verifikasi</h1>
      <p class="text-sm text-gray-500 mt-0.5">Daftar semua percobaan pengajuan verifikasi akun Anda.</p>
    </div>

    <ClientOnly>
      <template #fallback><AppLoadingSkeleton /></template>

      <AppLoadingSkeleton v-if="pending" />

      <UAlert
        v-else-if="error"
        title="Terjadi Kesalahan"
        :description="error.message || 'Gagal memuat riwayat verifikasi'"
        icon="mdi:alert-circle:error"
        color="error"
      />

      <div v-else-if="!history?.length" class="py-10 text-center text-gray-400 text-sm">
        <UIcon name="mdi:file-search-outline" class="text-4xl text-gray-300 mb-3" />
        <p>Belum ada riwayat pengajuan.</p>
      </div>

      <div v-else class="space-y-3">
        <UCard v-for="item in history" :key="item.id" class="shadow-sm">
          <template #header>
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-gray-800">{{ dayjs(item.created_at).format('DD MMM YYYY, HH:mm') }}</p>
              <UBadge :color="statusColor(item.status)" variant="soft">{{ statusLabel(item.status) }}</UBadge>
            </div>
          </template>

          <VerificationDataView :data="item" />
          <VerificationPhotoGrid :data="item" @stale="refresh" />

          <div v-if="item.status === 'REJECTED' && item.rejection_reason" class="mt-4 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <p class="text-xs text-gray-400 mb-1">Alasan Penolakan</p>
            <p class="text-sm text-red-700">{{ item.rejection_reason }}</p>
          </div>
        </UCard>
      </div>

    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import VerificationDataView from '~/components/verification/VerificationDataView.vue'
import VerificationPhotoGrid from '~/components/verification/VerificationPhotoGrid.vue'
import { useVerificationApi } from '~/composables/api/verification'
import type { UserVerificationRequest } from '~/types/verification/UserVerificationRequest'

definePageMeta({ layout: 'seller', label: 'Riwayat Verifikasi' })

const { fetchVerificationHistory } = useVerificationApi()

const {
  data: history,
  pending,
  error,
  refresh,
} = await useAsyncData<UserVerificationRequest[]>(
  'seller-verification-history',
  () => fetchVerificationHistory(),
  { server: false },
)

function statusLabel(status: string) {
  const map: Record<string, string> = { PENDING: 'Menunggu Review', APPROVED: 'Disetujui', REJECTED: 'Ditolak' }
  return map[status] ?? status
}

function statusColor(status: string) {
  const map: Record<string, 'warning' | 'success' | 'error'> = { PENDING: 'warning', APPROVED: 'success', REJECTED: 'error' }
  return map[status] ?? 'neutral'
}
</script>
