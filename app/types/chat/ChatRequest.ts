export interface ChatRequest {
  receiverId?: number | null
  merchantId?: number | null
  productId?: number | null
  transactionId?: string | null
  conversationId?: number | null
  senderType: 'BUYER' | 'SELLER'
  message: string
  file?: File | null
}
