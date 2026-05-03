import type { FileManagementResponse } from "../file-management/FileManagementResponse";
import type { ProductResponse } from "../product/ProductResponse";
import type { TransactionResponse } from "../TransactionResponse";

export interface ChatResponse {
  id: number
  conversation_id: number
  senderId: number
  sender_type: string
  message: string
  product?: ProductResponse | null
  transaction?: TransactionResponse | null
  file:FileManagementResponse | null
  status: string
  created_at: string // ISO date
  updated_at: string // ISO date
}