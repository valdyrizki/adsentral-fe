import type { UserResponse } from '~/types/UserResponse'

export type UserSuspendStatus = 'NONE' | 'WARNING' | 'TEMPORARY' | 'PERMANENT'

export interface PenaltyUserResponse {
  id: string
  active_points: number
  active_point_merchant: number
  suspend_status: UserSuspendStatus
  suspend_until: string | null
  created_at: string
  updated_at: string
  user: UserResponse
}
