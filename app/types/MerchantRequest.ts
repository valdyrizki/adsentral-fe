export interface MerchantRequest {
  name: string
  description?: string
  logo?: File
  banner?: File
  is_holiday: boolean
  country?: string
  open_time?: string
  close_time?: string
}