import type { SellerOrderSummaryResponse } from '~/types/seller-summary/SellerSummaryResponse'

export interface SellerOrderSummaryItem {
  key: keyof SellerOrderSummaryResponse
  label: string
  icon: string
  color: string     // kelas warna ikon
  bgColor: string   // kelas latar ikon
  // Filter status di List Order (null = bukan daftar transaksi)
  status: string | null
  to: string
}

// Status transaksi yang tergabung di "Pesanan Aktif" (filter BE hanya menerima satu status)
export const ACTIVE_ORDER_STATUSES = ['IN_PROGRESS', 'DELIVERED', 'REJECT', 'DONE'] as const

export const sellerOrderSummaryItems: SellerOrderSummaryItem[] = [
  { key: 'active', label: 'Pesanan Aktif', icon: 'i-heroicons-arrow-path', color: 'text-purple-500', bgColor: 'bg-purple-50', status: 'IN_PROGRESS', to: '/seller/order?status=IN_PROGRESS' },
  { key: 'waiting_confirmation', label: 'Menunggu Persetujuan', icon: 'i-heroicons-clock', color: 'text-yellow-500', bgColor: 'bg-yellow-50', status: 'PAID', to: '/seller/order?status=PAID' },
  { key: 'cancel_request', label: 'Permintaan Pembatalan', icon: 'mdi:cancel', color: 'text-orange-500', bgColor: 'bg-orange-50', status: 'CANCEL_REQUEST', to: '/seller/order?status=CANCEL_REQUEST' },
  { key: 'guarantee_request', label: 'Permintaan Garansi', icon: 'material-symbols:shield', color: 'text-amber-500', bgColor: 'bg-amber-50', status: null, to: '/seller/guarantee' },
  { key: 'arbitrage', label: 'Arbitrage', icon: 'mdi:scale-balance', color: 'text-red-500', bgColor: 'bg-red-50', status: 'ARBITRAGE', to: '/seller/order?status=ARBITRAGE' },
  { key: 'completed', label: 'Tuntas', icon: 'i-heroicons-check-badge', color: 'text-green-500', bgColor: 'bg-green-50', status: 'COMPLETE', to: '/seller/order?status=COMPLETE' },
]

// Rupiah dengan pemisah ribuan (nilai BE bisa desimal, mis. 270000.00)
export const formatRupiah = (val: number | string | null | undefined) =>
  'Rp ' + Number(val ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 2 })
