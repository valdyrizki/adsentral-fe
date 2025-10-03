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
  sold: number;
  distributor: string;
  category_id: number;
  category_name: string;
  banner_url: string;
  image_urls: string[];
  status: string;      // Status enum dari BE, di TS biasanya string
  created_at: string;   // LocalDateTime → string (ISO date format)
  updated_at: string | null; // bisa null kalau belum di-update
}
