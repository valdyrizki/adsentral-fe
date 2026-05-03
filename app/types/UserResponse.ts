export interface UserResponse {
  id: number
  email: string
  username: string
  full_name: string | null
  phone_number: string | null
  birth_date: string | null
  avatar_url: string | null
  address: string | null
  role: 'BUYER' | 'SELLER' | 'ADMIN' | 'SUPER_ADMIN'  // ✅ TAMBAHAN
}
