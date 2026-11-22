import type { SystemSettingResponse } from '~/types/system-setting/SystemSettingResponse'

/**
 * Persen biaya transaksi seller, sama dengan BE `resolveTrxFeePercent`: seller terverifikasi KTP memakai
 * TRX_FEE_VERIFIED (default 5), lainnya TRX_FEE (default 10). Dipakai untuk estimasi pendapatan (F-75).
 */
export const trxFeePercentFor = (settings: Pick<SystemSettingResponse, 'key' | 'value'>[] | null | undefined, verified: boolean): number => {
  const key = verified ? 'TRX_FEE_VERIFIED' : 'TRX_FEE'
  const parsed = Number((settings ?? []).find(s => s.key === key)?.value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : (verified ? 5 : 10)
}
