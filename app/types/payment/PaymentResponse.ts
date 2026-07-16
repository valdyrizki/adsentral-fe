import type { PaymentMethodResponse } from "../payment-method/PaymentMethodResponse"
import type { PaymentChannelResponse } from "../payment-channel/PaymentChannelResponse"
import type { UserResponse } from "../UserResponse"

export interface PaymentResponse {
  id: string
  ref_id: string | null
  status: string
  payment_type: 'TRANSACTION' | 'DEPOSIT' | string
  amount: number
  app_fee: number | null
  discount_amount: number | null
  coupon: string | null
  unique_code: number | null
  pay_code: string | null
  pay_url: string | null
  checkout_url: string | null
  qr_url: string | null
  payment_method: PaymentMethodResponse | null
  payment_channel: PaymentChannelResponse | null
  payment_proof_url: string | null
  user: UserResponse | null
  paid_at: string | null
  created_at: string
  updated_at: string | null
}
