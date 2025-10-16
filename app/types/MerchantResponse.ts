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
}