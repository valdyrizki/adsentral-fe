import type { ProductResponse } from "./product/ProductResponse";

export interface TransactionResponse {
  id: string;
  tx_description: string;
  order_request: string;
  payment_id: string;
  product_id: number;      // long → number
  qty: number;
  price: number;          // BigDecimal → number
  total_price: number;     // BigDecimal → number
  status: string;         // TransactionStatus enum → string
  paid_at: string | null;  // LocalDateTime → string, bisa null kalau belum dibayar
  created_at: string;      // LocalDateTime → string
  updated_at: string | null; // LocalDateTime → string | null
  buyer_id: string;
  buyer_username: string;
  buyer_fullname: string;
  buyer_avatar_url: string;
  seller_email: string;
  product: ProductResponse
}
