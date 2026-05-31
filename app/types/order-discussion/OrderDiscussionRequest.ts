import type { DiscussionType } from "./DiscussionType";

export interface OrderDiscussionRequest {
  transaction_id: string
  message: string
  discussion_type: DiscussionType
  file: File | null
}
