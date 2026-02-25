export interface OrderDiscussionRequest {
  transaction_id: string
  message: string
  is_file_order: boolean
  file: File | null
}