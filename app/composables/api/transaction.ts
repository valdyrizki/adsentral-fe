import type { TransactionRequest } from "~/types/TransactionRequest"
import type { WebResponse } from "~/types/WebResponse"
import type { PageResponse } from "~/types/PageResponse"
import type { CreateTransactionResponse } from "~/types/CreateTransactionResponse"
import type { TransactionResponse } from "~/types/TransactionResponse"
import { useApi } from './useApi'

export const useTransactionApi = () => {
  const api = useApi()

  const createTransaction = async (request: TransactionRequest) => {
    try {
      const res = await api<WebResponse<CreateTransactionResponse>>('/tx/create', {
        method: 'POST',
        body: request,
      })
      if (!res || res.status !== 'success' || !res.data) {
        throw createError({ statusCode: 400, statusMessage: res?.message || 'Transaction failed' })
      }
      return res.data
    } catch (err: any) {
      console.log(err.response._data.message)
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.response._data.message || 'Transaction failed, server error',
      })
    }
  }

  // status kosong / 'ALL' -> parameter status tidak dikirim
  const statusQuery = (status?: string | null) => (status && status !== 'ALL' ? status : undefined)
  // keyword kosong setelah trim -> parameter keyword tidak dikirim
  const keywordQuery = (keyword?: string | null) => keyword?.trim() || undefined

  const fetchBuyerTransactions = async (page = 0, size = 10, keyword = '', status = '') => {
    try {
      const res = await api<WebResponse<PageResponse<TransactionResponse>>>('/tx/buyer', {
        query: { page, size, keyword: keywordQuery(keyword), status: statusQuery(status) },
      })
      if (res.status !== 'success' || !res.data) {
        throw createError({ statusCode: 400, statusMessage: res.message || 'Failed to fetch transactions' })
      }
      return res.data
    } catch (err: any) {
      throw createError({ statusCode: err.statusCode || 500, statusMessage: err.message || 'Failed to fetch transactions' })
    }
  }

    const fetchTransactionById = async (txId: string): Promise<TransactionResponse> => {
    const res = await api<WebResponse<TransactionResponse>>(`/tx/get/${txId}`)

    if (res.status !== 'success' || !res.data) {
      throw createError({
        statusCode: 400,
        statusMessage: res.message || 'Gagal memuat transaksi',
      })
    }

    return res.data
  }

  const fetchTxSeller = async (page: number, size: number, keyword: string, status = ''): Promise<PageResponse<TransactionResponse>> => {
    try {
      const res = await api<WebResponse<PageResponse<TransactionResponse>>>('/tx/seller', {
        query: { page, size, keyword: keywordQuery(keyword), status: statusQuery(status) },
      })
      if (!res.data) {
        throw createError({ statusCode: 400, statusMessage: 'Failed to fetch transactions' })
      }
      return res.data
    } catch (err: any) {
      console.error('Failed fetch transactions', err)
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.message || 'Failed to fetch transactions',
      })
    }
  }

  const fetchAllTx = async (page: number, size: number, keyword: string, status = ''): Promise<PageResponse<TransactionResponse>> => {
    try {
      const res = await api<WebResponse<PageResponse<TransactionResponse>>>('/tx/all', {
        query: { page, size, keyword, ...(status ? { status } : {}) },
      })
      if (!res.data) {
        throw createError({ statusCode: 400, statusMessage: 'Failed to fetch transactions' })
      }
      return res.data
    } catch (err: any) {
      console.error('Failed fetch transactions', err)
      throw createError({
        statusCode: err.statusCode || 500,
        statusMessage: err.message || 'Failed to fetch transactions',
      })
    }
  }

  // Aksi yang mengubah status PAID -> badge alerts langsung diperbarui
  const refreshAlerts = () => {
    useAlertsStore().refresh()
  }

  const fetchConfirmTx = async (txId: string): Promise<void> => {
    const res = await api<WebResponse<TransactionResponse>>(`/tx/confirm/${txId}`, { method: 'PATCH' }).catch(rethrowApiError('Aksi gagal diproses'))
    if (res.status !== 'success') throw new Error(res.message)
    refreshAlerts()
  }

  const fetchRejectTx = async (txId: string, reason: string): Promise<void> => {
    const res = await api<WebResponse<TransactionResponse>>(`/tx/reject/${txId}`, {
      method: 'PATCH',
      body: { reason },
    }).catch(rethrowApiError('Aksi gagal diproses'))
    if (res.status !== 'success') throw new Error(res.message)
    refreshAlerts()
  }

  const fetchRefundTx = async (txId: string, reason: string): Promise<void> => {
    const res = await api<WebResponse<TransactionResponse>>(`/tx/refund/${txId}`, {
      method: 'PATCH',
      body: { reason },
    }).catch(rethrowApiError('Aksi gagal diproses'))
    if (res.status !== 'success') throw new Error(res.message)
  }

  const fetchAcceptOrder = async (txId: string): Promise<void> => {
    const res = await api<WebResponse<TransactionResponse>>(`/tx/order/accept/${txId}`, { method: 'PATCH' }).catch(rethrowApiError('Aksi gagal diproses'))
    if (res.status !== 'success') throw new Error(res.message)
  }

  const fetchRejectOrder = async (txId: string, reason: string): Promise<void> => {
    const res = await api<WebResponse<TransactionResponse>>(`/tx/order/reject/${txId}`, {
      method: 'PATCH',
      body: { reason },
    }).catch(rethrowApiError('Aksi gagal diproses'))
    if (res.status !== 'success') throw new Error(res.message)
  }

  const fetchCancelTxRequest = async (txId: string, reason: string): Promise<void> => {
    const res = await api<WebResponse<TransactionResponse>>(`/tx/cancel/request/${txId}`, {
      method: 'PATCH',
      body: { reason },
    }).catch(rethrowApiError('Aksi gagal diproses'))
    if (res.status !== 'success') throw new Error(res.message)
  }

  const fetchRejectCancelRequest = async (txId: string): Promise<void> => {
    const res = await api<WebResponse<TransactionResponse>>(`/tx/cancel/reject/${txId}`, { method: 'PATCH' }).catch(rethrowApiError('Aksi gagal diproses'))
    if (res.status !== 'success') throw new Error(res.message)
  }

  const fetchAcceptCancelRequest = async (txId: string): Promise<void> => {
    const res = await api<WebResponse<TransactionResponse>>(`/tx/cancel/accept/${txId}`, { method: 'PATCH' }).catch(rethrowApiError('Aksi gagal diproses'))
    if (res.status !== 'success') throw new Error(res.message)
    refreshAlerts()
  }

  const fetchArbitrageRequest = async (txId: string, reason: string): Promise<void> => {
    const res = await api<WebResponse<TransactionResponse>>(`/tx/arbitrage/${txId}`, {
      method: 'PATCH',
      body: { reason },
    }).catch(rethrowApiError('Aksi gagal diproses'))
    if (res.status !== 'success') throw new Error(res.message)
  }

  const fetchCancelArbitrage = async (txId: string): Promise<void> => {
    const res = await api<WebResponse<TransactionResponse>>(`/tx/cancel/arbitrage/${txId}`, { method: 'PATCH' }).catch(rethrowApiError('Aksi gagal diproses'))
    if (res.status !== 'success') throw new Error(res.message)
  }

  const fetchCompleteTx = async (txId: string, reason: string): Promise<void> => {
    const res = await api<WebResponse<TransactionResponse>>(`/tx/complete/${txId}`, {
      method: 'PATCH',
      body: { reason },
    }).catch(rethrowApiError('Aksi gagal diproses'))
    if (res.status !== 'success') throw new Error(res.message)
  }

  return {
    createTransaction,
    fetchBuyerTransactions,
    fetchTransactionById,
    fetchTxSeller,
    fetchConfirmTx,
    fetchRejectTx,
    fetchRefundTx,
    fetchAcceptOrder,
    fetchRejectOrder,
    fetchCancelTxRequest,
    fetchRejectCancelRequest,
    fetchAcceptCancelRequest,
    fetchArbitrageRequest,
    fetchAllTx,
    fetchCancelArbitrage,
    fetchCompleteTx,
  }
}
