import type { Gender } from '~/types/verification/UserVerificationRequest'

// Semua field opsional (null / undefined = tidak diubah)
export interface VerificationEditRequest {
  nik?: string
  full_name_ktp?: string
  place_of_birth?: string
  date_of_birth?: string
  gender?: Gender
  religion?: string
  marital_status?: string
  occupation?: string
  nationality?: string
  ktp_address?: string
  rt?: string
  rw?: string
  village?: string
  district?: string
  city?: string
  province?: string
  postal_code?: string
}
