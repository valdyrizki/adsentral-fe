import type { Gender } from '~/types/verification/UserVerificationRequest'

export interface UserVerificationData {
  user_id: number
  nik_masked: string
  full_name_ktp: string
  place_of_birth: string
  date_of_birth: string
  gender: Gender
  religion: string | null
  marital_status: string | null
  occupation: string | null
  nationality: string
  ktp_address: string
  rt: string | null
  rw: string | null
  village: string | null
  district: string | null
  city: string
  province: string
  postal_code: string | null
  ktp_photo_url: string
  selfie_ktp_photo_url: string
  selfie_note_photo_url: string
  verified_by: string | null
  verified_at: string | null
  updated_at: string | null
}
