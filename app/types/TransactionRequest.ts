import type { TransactionDetailRequest } from "./TransactionDetailRequest"

export interface TransactionRequest {
  payment_method: string
  channel_code?: string | null
  voucher_code?: string | null
  transaction_details: TransactionDetailRequest[]
}