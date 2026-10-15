import { useApi } from './useApi'
import type { WebResponse } from '~/types/WebResponse'
import type {
  SellerFinanceSummaryResponse,
  SellerOrderSummaryResponse,
  SellerProductSummaryResponse,
} from '~/types/seller-summary/SellerSummaryResponse'

// Ringkasan angka seller (sekali muat, tanpa polling). 403 = merchant tidak aktif / belum ada → pesan BE apa adanya.
export const useSellerSummaryApi = () => {
  const api = useApi()

  const get = async <T>(url: string, fallback: string): Promise<T> => {
    const res = await api<WebResponse<T>>(url).catch(rethrowApiError(fallback))
    if (res.status !== 'success' || !res.data) {
      throw createError({ statusCode: 400, statusMessage: res.message || fallback })
    }
    return res.data
  }

  const fetchOrderSummary = () => get<SellerOrderSummaryResponse>('/seller/orders/summary', 'Gagal memuat ringkasan pesanan')
  const fetchProductSummary = () => get<SellerProductSummaryResponse>('/seller/products/summary', 'Gagal memuat ringkasan produk')
  const fetchFinanceSummary = () => get<SellerFinanceSummaryResponse>('/seller/finance/summary', 'Gagal memuat ringkasan keuangan')

  return { fetchOrderSummary, fetchProductSummary, fetchFinanceSummary }
}
