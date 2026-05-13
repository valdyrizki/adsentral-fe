import type { ProductResponse } from "./product/ProductResponse";

export interface TransactionResponse {
  id: string;
  tx_description: string;
  order_request: string;
  payment_id: string;
  product_id: number;      // long → number
  qty: number;
  price: number;          // BigDecimal → number
  fee: number;          // BigDecimal → number
  total_price: number;     // BigDecimal → number
  status: string;         // TransactionStatus enum → string
  paid_at: string | null;  // LocalDateTime → string, bisa null kalau belum dibayar
  confirmed_at: string | null; // LocalDateTime → string, diisi saat seller konfirmasi
  created_at: string;      // LocalDateTime → string
  updated_at: string | null; // LocalDateTime → string | null
  expired_at: string | null; // LocalDateTime → string | null
  delivered_at: string | null; // LocalDateTime → string | null
  rejected_at: string | null; // LocalDateTime → string | null
  done_at: string | null; // LocalDateTime → string | null
  buyer_id: string;
  buyer_username: string;
  buyer_fullname: string;
  buyer_avatar_url: string;
  seller_email: string;
  payment_method: string | null;
  product: ProductResponse
}
