// Opsi filter status daftar transaksi. BE hanya menerima SATU nilai enum per request,
// jadi tiap opsi memetakan ke satu status ('ALL' = tanpa parameter status).
export interface TxStatusFilterOption {
  label: string
  value: string
}

export const buyerTxStatusFilters: TxStatusFilterOption[] = [
  { label: 'Semua', value: 'ALL' },
  { label: 'Menunggu Pembayaran', value: 'UNPAID' },
  { label: 'Dibayar', value: 'PAID' },
  { label: 'Diproses', value: 'IN_PROGRESS' },
  { label: 'Dikirim', value: 'DELIVERED' },
  { label: 'Kiriman Ditolak', value: 'REJECT' },
  { label: 'Selesai', value: 'DONE' },
  { label: 'Selesai & Cair', value: 'COMPLETE' },
  { label: 'Pengajuan Batal', value: 'CANCEL_REQUEST' },
  { label: 'Dibatalkan', value: 'CANCELLED' },
  { label: 'Ditolak Penjual', value: 'REJECTED' },
  { label: 'Kedaluwarsa', value: 'EXPIRED' },
  { label: 'Refund', value: 'REFUNDED' },
  { label: 'Banding', value: 'ARBITRAGE' },
]

// Admin: semua nilai TransactionStatus di BE (F-28)
export const adminTxStatusFilters: TxStatusFilterOption[] = [
  { label: 'Semua Status', value: 'ALL' },
  { label: 'Belum Bayar', value: 'UNPAID' },
  { label: 'Sudah Bayar', value: 'PAID' },
  { label: 'Diproses', value: 'IN_PROGRESS' },
  { label: 'Dikirim', value: 'DELIVERED' },
  { label: 'Kiriman Ditolak Pembeli', value: 'REJECT' },
  { label: 'Arbitrase', value: 'ARBITRAGE' },
  { label: 'Pengajuan Batal', value: 'CANCEL_REQUEST' },
  { label: 'Selesai (kliring)', value: 'DONE' },
  { label: 'Selesai & Cair', value: 'COMPLETE' },
  { label: 'Dibatalkan', value: 'CANCELLED' },
  { label: 'Ditolak Penjual', value: 'REJECTED' },
  { label: 'Refund', value: 'REFUNDED' },
  { label: 'Kedaluwarsa', value: 'EXPIRED' },
]

export const sellerTxStatusFilters: TxStatusFilterOption[] = [
  { label: 'Semua', value: 'ALL' },
  { label: 'Perlu Diterima', value: 'PAID' },
  { label: 'Diproses', value: 'IN_PROGRESS' },
  { label: 'Dikirim', value: 'DELIVERED' },
  { label: 'Perlu Diperbaiki', value: 'REJECT' },
  { label: 'Selesai', value: 'DONE' },
  { label: 'Selesai & Cair', value: 'COMPLETE' },
  { label: 'Dibatalkan', value: 'CANCELLED' },
  { label: 'Ditolak', value: 'REJECTED' },
  { label: 'Pengajuan Batal', value: 'CANCEL_REQUEST' },
  { label: 'Dalam Review Admin', value: 'ARBITRAGE' },
]

// Ambil status valid dari query string; selain itu 'ALL'.
export const parseTxStatusQuery = (raw: unknown, options: TxStatusFilterOption[]): string => {
  const v = Array.isArray(raw) ? raw[0] : raw
  return typeof v === 'string' && options.some(o => o.value === v) ? v : 'ALL'
}
