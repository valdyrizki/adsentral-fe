import type { Gender } from '~/types/verification/UserVerificationRequest'

// Field form multipart pakai camelCase (bukan snake_case), lihat catatan BE di composables/api/verification.ts
export interface VerificationSubmitForm {
  nik: string
  fullNameKtp: string
  placeOfBirth: string
  dateOfBirth: string // yyyy-MM-dd
  gender: Gender | ''
  religion: string
  maritalStatus: string
  occupation: string
  nationality: string
  ktpAddress: string
  rt: string
  rw: string
  village: string
  district: string
  city: string
  province: string
  postalCode: string
  ktpPhoto: File | null
  selfieKtpPhoto: File | null
  selfieNotePhoto: File | null
}

export function createEmptyVerificationForm(): VerificationSubmitForm {
  return {
    nik: '',
    fullNameKtp: '',
    placeOfBirth: '',
    dateOfBirth: '',
    gender: '',
    religion: '',
    maritalStatus: '',
    occupation: '',
    nationality: 'WNI',
    ktpAddress: '',
    rt: '',
    rw: '',
    village: '',
    district: '',
    city: '',
    province: '',
    postalCode: '',
    ktpPhoto: null,
    selfieKtpPhoto: null,
    selfieNotePhoto: null,
  }
}
