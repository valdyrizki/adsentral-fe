import { useAccountTypeApi } from './api/account-type'
import type { AccountTypeResponse } from '~/types/account-type/AccountTypeResponse'

export const ACCOUNT_TYPES_KEY = 'account-types-active'

/**
 * Daftar tipe akun ACTIVE (GET /account-types), dipakai bersama oleh semua komponen stok.
 * Di-fetch sekali; komponen lain yang dipasang kemudian memakai data yang sudah ada.
 * refreshNuxtData(ACCOUNT_TYPES_KEY) tetap memaksa ambil ulang dari BE.
 */
export const useAccountTypes = () => {
  const { fetchAccountTypes } = useAccountTypeApi()
  return useAsyncData<AccountTypeResponse[]>(
    ACCOUNT_TYPES_KEY,
    () => fetchAccountTypes(),
    {
      server: false,
      default: () => [],
      // Request yang sedang berjalan dipakai bersama, bukan dibatalkan lalu diulang
      dedupe: 'defer',
      getCachedData: (key, nuxtApp, { cause }) =>
        cause === 'refresh:hook' || cause === 'refresh:manual' ? undefined : nuxtApp.payload.data[key],
    }
  )
}
