export interface MerchantResponse {
  id: number
  slug: string
  name: string
  description?: string
  logo_url?: File
  banner_url?: File
  status: string
  created_at: string
  updated_at: string
  is_holiday : boolean
  average_rating: number;
  review_count: number;
  penalty_points: number
  product_count?: number
  total_sold?: number
  country?: string
  open_time?: string
  close_time?: string
}