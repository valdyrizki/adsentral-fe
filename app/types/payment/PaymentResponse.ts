import type { PaymentMethodResponse } from "../payment-method/PaymentMethodResponse"
import type { UserResponse } from "../UserResponse"

export interface PaymentResponse {
  id: string
  status: string
  payment_type: 'TRANSACTION' | 'DEPOSIT' | string
  amount: number
  payment_method: PaymentMethodResponse | null
  payment_proof_url: string | null
  user: UserResponse | null
  created_at: string
  updated_at: string | null
}
