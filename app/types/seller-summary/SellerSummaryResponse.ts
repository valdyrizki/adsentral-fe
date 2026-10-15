// GET /seller/orders/summary
export interface SellerOrderSummaryResponse {
  active: number                // IN_PROGRESS + DELIVERED + REJECT + DONE
  waiting_confirmation: number  // PAID
  cancel_request: number        // CANCEL_REQUEST
  guarantee_request: number     // klaim garansi IN_REVIEW + IN_PROGRESS
  arbitrage: number             // ARBITRAGE
  completed: number             // COMPLETE saja
}

// GET /seller/products/summary
export interface SellerProductSummaryResponse {
  active: number     // ACTIVE
  in_review: number  // REVIEW
  blocked: number    // SUSPEND
}

// GET /seller/finance/summary — rupiah bersih (bisa desimal)
export interface SellerFinanceSummaryResponse {
  today_transaction_amount: number  // total harga KOTOR transaksi dibuat hari ini (WIB), status sudah bayar & tidak batal
  total_income: number  // seluruh COMPLETE
  withdrawn: number     // penarikan COMPLETED
}
