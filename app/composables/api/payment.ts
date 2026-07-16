import type { PageResponse } from '~/types/PageResponse'
import type { PaymentResponse } from '~/types/payment/PaymentResponse'
import type { TransactionResponse } from '~/types/TransactionResponse'
import type { WebResponse } from '~/types/WebResponse'
import { useApi } from './useApi'

export const usePaymentApi = () => {
  const api = useApi()

  // User: get own payments
  const fetchMyPayments = async (
    page = 0,
    size = 20,
    keyword = ''
  ): Promise<PageResponse<PaymentResponse>> => {
    const res = await api<WebResponse<PageResponse<PaymentResponse>>>('/payment', {
      query: { page, size, keyword },
    })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat payment' })
    }
    return res.data
  }

  // Admin: get all payments with optional keyword + status filter
  const fetchAllPayments = async (
    page = 0,
    size = 20,
    keyword = '',
    status = ''
  ): Promise<PageResponse<PaymentResponse>> => {
    const res = await api<WebResponse<PageResponse<PaymentResponse>>>('/payment/all', {
       params: { page, size, keyword, status: status || undefined } 
    })
    
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat payment' })
    }
    return res.data
  }

  // Admin: confirm payment
  const fetchConfirmPayment = async (paymentId: string): Promise<void> => {
    const res = await api<WebResponse<void>>(`/payment/confirm/${paymentId}`, {
      method: 'POST',
    })
    if (res.status !== 'success') {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal konfirmasi payment' })
    }
  }

  // Admin: reject payment
  const fetchRejectPayment = async (paymentId: string, reason: string): Promise<void> => {
    const res = await api<WebResponse<void>>(`/payment/reject/${paymentId}`, {
      method: 'POST',
      body: { reason },
    })
    if (res.status !== 'success') {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal menolak payment' })
    }
  }

  // Admin: get single payment by id
  const fetchPaymentById = async (paymentId: string): Promise<PaymentResponse> => {
    const res = await api<WebResponse<PaymentResponse>>(`/payment/${paymentId}`)
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat payment' })
    }
    return res.data
  }

  // Admin: get transactions linked to a payment
  const fetchTxByPaymentId = async (
    paymentId: string,
    page = 0,
    size = 20,
    keyword = '',
    status = ''
  ): Promise<PageResponse<TransactionResponse>> => {
    const res = await api<WebResponse<PageResponse<TransactionResponse>>>(`/tx/payment/${paymentId}`, {
      query: { page, size, keyword, status: status || undefined },
    })
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal memuat transaksi' })
    }
    return res.data
  }

  // User: cancel own DEPOSIT payment
  const cancelPayment = async (paymentId: string): Promise<void> => {
    const res = await api<WebResponse<void>>(`/balance/deposit/cancel/${paymentId}`, {
      method: 'POST',
    })
    if (res.status !== 'success') {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal membatalkan payment' })
    }
  }

  // User: upload proof for DEPOSIT payment
  const uploadPaymentProof = async (paymentId: string, file: File): Promise<void> => {
    const form = new FormData()
    form.append('file', file)
    const res = await api<WebResponse<void>>(`/payment/proof/${paymentId}`, {
      method: 'POST',
      body: form,
    })
    if (res.status !== 'success') {
      throw createError({ statusCode: 400, statusMessage: res.message || 'Gagal upload bukti pembayaran' })
    }
  }

  return { fetchMyPayments, fetchAllPayments, fetchConfirmPayment, fetchRejectPayment, fetchPaymentById, fetchTxByPaymentId, cancelPayment, uploadPaymentProof }
}
