export interface UserRequest {
  new_password?: string | null
  old_password?: string | null
  username: string
  full_name: string | null
  phone_number: string | null
  birth_date: string | null
  address: string | null
  avatar: File | null

  email: string | null
}
