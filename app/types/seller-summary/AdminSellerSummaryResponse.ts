import type { SellerFinanceSummaryResponse, SellerOrderSummaryResponse, SellerProductSummaryResponse } from './SellerSummaryResponse'

// GET /admin/seller/{sellerId}/summary (BE EP06-08): angka dashboard seller untuk admin
export interface AdminSellerSummaryResponse {
  seller_id: number
  merchant_id: number
  merchant_name: string
  orders: SellerOrderSummaryResponse
  products: SellerProductSummaryResponse
  finance: SellerFinanceSummaryResponse
}
