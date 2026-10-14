export type UnprocessedPaymentStatus = 'PENDING' | 'RESOLVED'
export type UnprocessedPaymentReason = 'PAYMENT_EXPIRED' | 'PAYMENT_CANCELLED' | 'TX_LAPSED' | string

export interface UnprocessedPaymentResponse {
  id: number
  payment_id: string
  gateway_reference: string | null
  amount: number
  reason: UnprocessedPaymentReason
  status: UnprocessedPaymentStatus
  created_at: string
  resolved_at: string | null
  resolved_by_username: string | null
  resolution_note: string | null
}
