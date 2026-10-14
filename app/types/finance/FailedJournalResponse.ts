export type FailedJournalStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED'

export interface FailedJournalResponse {
  id: number
  category_id: string
  amount: number
  ref_id: string | null
  description: string | null
  error_message: string | null
  status: FailedJournalStatus
  retry_count: number
  created_at: string
  resolved_at: string | null
  resolved_by_username: string | null
  resolution_note: string | null
}
