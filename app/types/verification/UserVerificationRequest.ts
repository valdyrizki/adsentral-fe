import type { BankAccountResponse } from '~/types/bank-account/BankAccountResponse'
import type { NameCheckStatus } from '~/types/bank-account/NameCheckStatus'

export type VerificationRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type Gender = 'MALE' | 'FEMALE'

export interface UserVerificationRequest {
  id: string
  user_id?: number | null
  user_email: string
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
  status: VerificationRequestStatus
  rejection_reason: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  bank_account: BankAccountResponse | null
  // Dihitung live dari nama yang sedang diajukan vs rekening bank yang sudah ada, walaupun pengajuannya masih PENDING.
  bank_account_name_check_status?: NameCheckStatus | null
}
