/** Metrik satu bulan kalender WIB (GET /admin/metrics/monthly, EP05-04). Rasio dihitung di FE. */
export interface AdminMonthlyMetricResponse {
  year: number
  month: number
  /** Status COMPLETE dengan done_at di bulan ini */
  completed_transactions: number
  /** Jumlah total_price transaksi selesai (tanpa biaya aplikasi/gateway) */
  gmv: number
  /** Toko ACTIVE dengan >= 1 transaksi selesai */
  active_sellers: number
  /** Dibayar (paid_at) di bulan ini: penyebut rasio refund & arbitrase */
  paid_transactions: number
  /** Dari yang dibayar bulan ini, berakhir REFUNDED/REJECTED/CANCELLED */
  refunded_transactions: number
  /** Dari yang dibayar bulan ini, pernah masuk arbitrase */
  arbitrage_transactions: number
  /** Klaim garansi dibuat di bulan ini */
  guarantee_claims: number
}
