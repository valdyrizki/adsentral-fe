export type DiscountType = 'PERCENT' | 'NOMINAL'
export type VoucherStatus = 'ACTIVE' | 'SUSPENDED'

export interface VoucherResponse {
  code: string
  name: string
  discount_type: DiscountType
  discount_value: number
  max_discount_amount: number | null
  min_transaction_amount: number | null
  quota: number | null
  used_count: number
  start_date: string | null
  end_date: string | null
  is_public: boolean
  status: VoucherStatus
  created_at: string
  updated_at: string
}
