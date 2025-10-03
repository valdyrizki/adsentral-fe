import type { UserResponse } from "./UserResponse"

export interface LoginResponse {
  token: string
  expired_at : string | number
  user: UserResponse
}
