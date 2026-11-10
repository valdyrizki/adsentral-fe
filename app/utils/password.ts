// Batas password baru dari BE (BCrypt): 8 karakter minimal, maks 72 byte UTF-8.
// Huruf beraksen 2 byte, banyak emoji 4 byte, jadi hitung byte, bukan karakter.
// Jangan dipakai di form login: password lama sengaja tidak dibatasi.
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_BYTES = 72

export const passwordByteLength = (value: string): number => new TextEncoder().encode(value).length

// Pesan error validasi password baru, atau null bila valid.
export const newPasswordError = (value: string): string | null => {
  if (value.length < PASSWORD_MIN_LENGTH) return `Password minimal ${PASSWORD_MIN_LENGTH} karakter`
  if (passwordByteLength(value) > PASSWORD_MAX_BYTES) {
    return `Password maksimal ${PASSWORD_MAX_BYTES} karakter (huruf non-Latin dan emoji dihitung lebih dari satu)`
  }
  return null
}
