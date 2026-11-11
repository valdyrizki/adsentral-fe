/** POST /admin/users/{id}/reset-code (super admin, EP03-07). */
export interface ResetCodeResponse {
  code: string
  created_at: string
  expires_at: string
  remaining_attempts: number
}
