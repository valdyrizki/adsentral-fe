import type { UserResponse } from '~/types/UserResponse'

export interface AdminWithdrawalResponse {
  id: string
  user: UserResponse
  amount: number
  admin_fee: number
  amount_received: number
  bank_name: string
  account_number: string
  account_holder_name: string
  status: 'PENDING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED'
  notes: string | null
  admin_notes: string | null
  processed_by: string | null
  processed_at: string | null
  created_at: string
}
