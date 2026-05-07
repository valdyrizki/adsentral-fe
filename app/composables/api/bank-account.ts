import { useApi } from './useApi'
import type { WebResponse } from '~/types/WebResponse'
import type { BankAccountRequest } from '~/types/bank-account/BankAccountRequest'
import type { BankAccountResponse } from '~/types/bank-account/BankAccountResponse'

export const useBankAccountApi = () => {
  const api = useApi()

  const fetchBankAccount = async (): Promise<BankAccountResponse | null> => {
    const res = await api<WebResponse<BankAccountResponse>>('seller/bank-account')
    if (res.status !== 'success') return null
    return res.data ?? null
  }

  const saveBankAccount = async (request: BankAccountRequest): Promise<BankAccountResponse> => {
    const res = await api<WebResponse<BankAccountResponse>>('/seller/bank-account', {
      method: 'POST',
      body: request,
    })

    if (res.status !== 'success' || !res.data) {
      throw createError({
        statusCode: 400,
        statusMessage: res.message || 'Gagal menyimpan rekening bank',
      })
    }

    return res.data
  }

  return { fetchBankAccount, saveBankAccount }
}
