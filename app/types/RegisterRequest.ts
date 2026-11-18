export interface RegisterRequest {
  username: string
  email: string
  password: string
  full_name?: string | null
  phone_number?: string | null
  /** EP08-05: wajib true; BE menyimpan waktu + versi dokumen sebagai bukti persetujuan */
  accepted_terms: boolean
}