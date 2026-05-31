import type { OrderDiscussionResponse } from '../order-discussion/OrderDiscussionResponse'

export type GuaranteeStatus = 'IN_REVIEW' | 'REJECTED' | 'IN_PROGRESS' | 'DONE'

export interface GuaranteeResponse {
  id: string
  transaction_id: string

  product_id: number
  product_name: string

  merchant_id: number
  merchant_name: string

  buyer_id: number
  buyer_name: string

  status: GuaranteeStatus

  complain_description: string
  seller_description: string | null

  file_id: string | null
  file_url: string | null
  file_ori_name: string | null

  order_discussion: OrderDiscussionResponse | null

  created_at: string
  updated_at: string | null
  reviewed_at: string | null
  rejected_at: string | null
  progress_at: string | null
  done_at: string | null

  review_deadline: string | null
  progress_deadline: string | null
}
