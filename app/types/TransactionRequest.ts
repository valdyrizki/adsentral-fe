import type { TransactionDetailRequest } from "./TransactionDetailRequest"

export interface TransactionRequest {
  payment_method: string
  transaction_details: TransactionDetailRequest[]
}