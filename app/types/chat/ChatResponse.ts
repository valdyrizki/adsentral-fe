import type { FileManagementResponse } from "../file-management/FileManagementResponse";
import type { ProductResponse } from "../product/ProductResponse";

export interface ChatResponse {
  id: number
  conversation_id: number
  senderId: number
  sender_type: string
  message: string
  product?: ProductResponse | null
  file:FileManagementResponse | null
  status: string
  created_at: string // ISO date
  updated_at: string // ISO date
}