import { useApi } from './useApi'
import type { WebResponse } from '~/types/WebResponse'
import type { AccountTypeResponse } from '~/types/account-type/AccountTypeResponse'
import type { AccountTypeRequest } from '~/types/account-type/AccountTypeRequest'

// Pesan error BE (400/409) diteruskan apa adanya ke UI.
const errorMessage = (err: any, fallback: string): string => {
  const errors = err?.data?.errors
  if (typeof errors === 'string' && errors) return errors
  return err?.data?.message || err?.statusMessage || err?.message || fallback
}

export const useAccountTypeApi = () => {
  const api = useApi()

  // GET tipe akun ACTIVE (urut nama). Dipakai untuk dropdown seller & filter list stok.
  const fetchAccountTypes = async (): Promise<AccountTypeResponse[]> => {
    try {
      const res = await api<WebResponse<AccountTypeResponse[]>>('/account-types')
      if (res.status !== 'success' || !res.data) throw new Error(res.message)
      return res.data
    } catch (err: any) {
      throw createError({ statusCode: err.statusCode || 500, statusMessage: errorMessage(err, 'Gagal memuat tipe akun') })
    }
  }

  // ===== ADMIN =====

  // GET semua tipe akun (ACTIVE + INACTIVE)
  const fetchAccountTypesAdmin = async (): Promise<AccountTypeResponse[]> => {
    try {
      const res = await api<WebResponse<AccountTypeResponse[]>>('/admin/account-types')
      if (res.status !== 'success' || !res.data) throw new Error(res.message)
      return res.data
    } catch (err: any) {
      throw createError({ statusCode: err.statusCode || 500, statusMessage: errorMessage(err, 'Gagal memuat tipe akun') })
    }
  }

  const createAccountType = async (payload: AccountTypeRequest): Promise<AccountTypeResponse | undefined> => {
    try {
      const res = await api<WebResponse<AccountTypeResponse>>('/admin/account-types', {
        method: 'POST',
        body: payload,
      })
      if (res.status !== 'success') throw new Error(res.message)
      return res.data
    } catch (err: any) {
      throw createError({ statusCode: err.statusCode || 500, statusMessage: errorMessage(err, 'Gagal membuat tipe akun') })
    }
  }

  const updateAccountType = async (id: number, payload: AccountTypeRequest): Promise<AccountTypeResponse | undefined> => {
    try {
      const res = await api<WebResponse<AccountTypeResponse>>(`/admin/account-types/${id}`, {
        method: 'PATCH',
        body: payload,
      })
      if (res.status !== 'success') throw new Error(res.message)
      return res.data
    } catch (err: any) {
      throw createError({ statusCode: err.statusCode || 500, statusMessage: errorMessage(err, 'Gagal mengupdate tipe akun') })
    }
  }

  return {
    fetchAccountTypes,
    fetchAccountTypesAdmin,
    createAccountType,
    updateAccountType,
  }
}
