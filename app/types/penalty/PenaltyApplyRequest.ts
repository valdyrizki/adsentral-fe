export interface PenaltyApplyRequest {
  user_id: number
  rule_id: string
  expired_days: number | null
  notes: string
}
