<template>
  <UBadge :color="current.color" :variant="variant" :size="size">{{ current.label }}</UBadge>
</template>

<script setup lang="ts">
import type { GuaranteeStatus } from '~/types/guarantee/GuaranteeResponse'

// Satu sumber label & warna status garansi (F-21). Label seller menyebut tindakan yang ditunggu darinya.
const props = withDefaults(defineProps<{
  status: GuaranteeStatus
  viewer?: 'buyer' | 'seller'
  variant?: 'solid' | 'subtle'
  size?: 'sm' | 'md'
}>(), { viewer: 'buyer', variant: 'solid', size: 'sm' })

const COLORS: Record<GuaranteeStatus, 'warning' | 'error' | 'info' | 'success'> = {
  IN_REVIEW: 'warning', REJECTED: 'error', IN_PROGRESS: 'info', DONE: 'success',
}

const LABELS: Record<'buyer' | 'seller', Record<GuaranteeStatus, string>> = {
  buyer: { IN_REVIEW: 'Menunggu Review Seller', REJECTED: 'Ditolak', IN_PROGRESS: 'Sedang Diproses', DONE: 'Selesai' },
  seller: { IN_REVIEW: 'Perlu Review', REJECTED: 'Ditolak', IN_PROGRESS: 'Perlu Kirim Garansi', DONE: 'Selesai' },
}

const current = computed(() => ({
  color: COLORS[props.status] ?? 'warning',
  label: LABELS[props.viewer][props.status] ?? props.status,
}))
</script>
