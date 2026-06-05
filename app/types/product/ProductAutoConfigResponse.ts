export interface ProductAutoConfigResponse {
  id: number
  product_id: number
  product_name: string
  title: string
  description: string
  file_id: string | null
  file_name: string | null
  file_url: string | null
  file_size: number | null
  file_type: string | null
  sent_count: number
  status: string
  created_at: string
  updated_at: string | null
}
