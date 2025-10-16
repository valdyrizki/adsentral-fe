export interface RegisterRequest {
  username: string
  email: string
  password: string
  full_name?: string | null
  phone_number?: string | null
}