<script setup>
const props = defineProps({
  status: {
    type: String
  }
})

const statusMap = {
  UNPAID: {
    color: 'warning',
    label: 'Menunggu Pembayaran'
  },
  PAID: {
    color: 'success',
    label: 'Berhasil'
  },
  EXPIRED: {
    color: 'error',
    label: 'Transaksi Expired'
  },
  CANCELLED: {
    color: 'error',
    label: 'Deposit Dibatalkan'
  },
  REJECTED: {
    color: 'error',
    label: 'Admin menolak deposit'
  },
  IN_PROGRESS: {
    color: 'secondary',
    label: 'Deposit Diproses Admin'
  },
  COMPLETE: {
    color: 'success',
    label: 'Deposit Selesai'
  }
}

const current = computed(() => {
  return statusMap[props.status] || {
    color: 'primary',
    label: 'Tidak Valid'
  }
})
</script>

<template>
  <UBadge
    icon="mdi:tag"
    size="lg"
    :color="current.color"
    variant="solid"
    :label="current.label"
  />
</template>
