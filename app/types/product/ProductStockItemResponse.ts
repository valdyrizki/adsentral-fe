export interface ProductStockItemResponse {
  id: number
  product_id: number
  product_name: string | null
  product_banner_url: string | null
  description: string | null
  file_name: string | null
  file_url: string | null
  file_size: number | null
  file_type: string | null
  status: string
  created_at: string
}
