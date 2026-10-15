import { useApi } from './useApi'
import type { WebResponse } from '~/types/WebResponse'
import type { AdminAlertsResponse, BuyerAlertsResponse, SellerAlertsResponse } from '~/types/AlertsResponse'

export const useAlertsApi = () => {
  const api = useApi()

  const get = async <T>(url: string): Promise<T> => {
    const res = await api<WebResponse<T>>(url)
    if (res.status !== 'success' || !res.data) throw new Error(res.message || 'Gagal memuat alerts')
    return res.data
  }

  // ADMIN / SUPER_ADMIN
  const fetchAdminAlerts = () => get<AdminAlertsResponse>('/admin/alerts')
  // SELLER (menu seller)
  const fetchSellerAlerts = () => get<SellerAlertsResponse>('/seller/alerts')
  // Semua user login (sisi pembeli)
  const fetchBuyerAlerts = () => get<BuyerAlertsResponse>('/alerts')

  return { fetchAdminAlerts, fetchSellerAlerts, fetchBuyerAlerts }
}
