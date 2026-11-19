// Jumlah seluruh stok seller per status (GET /stock/my/summary); DELETED tidak dihitung
export interface StockSummaryResponse {
  active: number
  sent: number
  returned: number
  restocked: number
}
