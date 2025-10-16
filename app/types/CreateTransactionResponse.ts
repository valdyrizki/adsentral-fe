export interface CreateTransactionResponse {
  paymentId: string
  referenceId: string
  checkoutUrl: string
  qrUrl: string
}