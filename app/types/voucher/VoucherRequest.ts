import type { DiscountType } from './VoucherResponse'

export interface VoucherRequest {
  code: string
  name?: string | null
  discount_type: DiscountType
  discount_value: number
  max_discount_amount?: number | null
  min_transaction_amount?: number | null
  quota?: number | null
  is_public?: boolean
  start_date?: string | null
  end_date?: string | null
}

export interface VoucherUpdateRequest {
  name?: string | null
  discount_type: DiscountType
  discount_value: number
  max_discount_amount?: number | null
  min_transaction_amount?: number | null
  is_public?: boolean
  quota?: number | null
  start_date?: string | null
  end_date?: string | null
}
