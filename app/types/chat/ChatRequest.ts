export interface ChatRequest {
  receiverId: number
  productId?: number | null
  conversationId?: number | null
  message: string
  file?: File | null
}
