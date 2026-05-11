import type { RoleNames, PenaltyTriggerType } from './PenaltyRuleResponse'

export interface PenaltyRuleRequest {
  id: string
  name: string
  description: string
  target_role: RoleNames | ''
  points: number | null
  expired_days: number | null
  trigger_type: PenaltyTriggerType | ''
  is_active: boolean
}
