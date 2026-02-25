import type { MerchantResponse } from "../MerchantResponse";

export interface ConversationResponse {
  id: number
  buyer_id: number
  buyer_username: string
  merchant: MerchantResponse
  created_at: string
  last_message?: string | null
  last_message_at?: string | null
  last_sender_id?: number | null
  last_sender_type?: string
  buyer_unread_count: number
  seller_unread_count: number
}

