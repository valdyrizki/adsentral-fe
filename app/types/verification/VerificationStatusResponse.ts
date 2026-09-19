import type { UserVerificationRequest } from '~/types/verification/UserVerificationRequest'
import type { UserVerificationData } from '~/types/verification/UserVerificationData'

export type VerificationOverallStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'

export interface VerificationStatusResponse {
  status: VerificationOverallStatus
  total_attempts: number
  total_rejected: number
  latest_request: UserVerificationRequest | null
  verified_data: UserVerificationData | null
}
