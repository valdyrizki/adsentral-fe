export interface PenaltyResponse {
  id: string
  user_id: number
  user_email: string
  rule_id: string
  rule_name: string
  points: number
  transaction_id: string | null
  given_by_email: string | null
  notes: string | null
  is_expired: boolean
  expired_at: string
  created_at: string
}
