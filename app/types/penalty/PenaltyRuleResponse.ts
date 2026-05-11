export type RoleNames = 'SELLER' | 'BUYER'
export type PenaltyTriggerType = 'AUTO' | 'MANUAL'

export interface PenaltyRuleResponse {
  id: string
  name: string
  description: string
  target_role: RoleNames
  points: number
  expired_days: number
  trigger_type: PenaltyTriggerType
  is_active: boolean
  created_at: string
}
