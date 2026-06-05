import type { ProductAutoConfigResponse } from './ProductAutoConfigResponse'

export interface ProductResponse {
  id: number;
  merchant_id: number;
  merchant_name: string;
  merchant_logo: string;
  name: string;
  slug: string;
  description: string;
  base_price: number;   // BigDecimal → number
  sell_price: number;   // BigDecimal → number
  stock: number;
  delivery_days: number | null;
  sold: number;
  average_rating: number;   // ✅ TAMBAHAN — BigDecimal serialized as number
  review_count: number;     // ✅ TAMBAHAN
  distributor: string;
  category_id: number;
  category_name: string;
  banner_url: string;
  image_urls: string[];
  status: string;      // Status enum dari BE, di TS biasanya string
  created_at: string;   // LocalDateTime → string (ISO date format)
  updated_at: string | null; // bisa null kalau belum di-update
  product_image_url: string[]
  guarantee_days: number | null
  delivery_type: string
  auto_config: ProductAutoConfigResponse | null
}
