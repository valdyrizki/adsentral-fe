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
    color: 'secondary',
    label: 'Menunggu konfirmasi dari seller'
  },
  EXPIRED: {
    color: 'error',
    label: 'Transaksi Expired'
  },
  CANCEL_REQUEST: {
    color: 'warning',
    label: 'Pembeli/Penjual mengajukan pembatalan'
  },
  CANCELLED: {
    color: 'error',
    label: 'Pesanan Dibatalkan'
  },
  REJECTED: {
    color: 'error',
    label: 'Penjual Menolak Pesanan'
  },
  IN_PROGRESS: {
    color: 'primary',
    label: 'Pesanan Diproses Penjual'
  },
  DELIVERED: {
    color: 'primary',
    label: 'Pesanan Telah Dikirim'
  },
  REJECT: {
    color: 'error',
    label: 'Pembeli Menolak Pesanan'
  },
  ARBITRAGE: {
    color: 'error',
    label: 'Pesanan Di-Review Admin'
  },
  REFUNDED: {
    color: 'error',
    label: 'Pesanan Direfund'
  },
  DONE: {
    color: 'success',
    label: 'Pesanan Diterima'
  },
  COMPLETE: {
    color: 'success',
    label: 'Pesanan Selesai'
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
