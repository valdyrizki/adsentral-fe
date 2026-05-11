export interface PenaltyRuleUpdateRequest {
  description: string
  points: number | null
  expired_days: number | null
  is_active: boolean
}
