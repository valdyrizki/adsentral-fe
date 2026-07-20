import type { BalanceLogResponse, WalletSource } from '~/types/balance/BalanceLogResponse'

export const walletSourceLabels: Record<WalletSource, string> = {
  DEPOSIT: 'Top Up',
  PURCHASE_DEBIT: 'Pembelian',
  REFUND: 'Refund',
  SALES_ESCROW_CREDIT: 'Dana Masuk Escrow',
  SALES_ESCROW_RELEASE: 'Escrow Cair',
  SALES_ESCROW_REVERSE: 'Escrow Dibatalkan',
  WITHDRAWAL_HOLD: 'Penarikan Diproses',
  WITHDRAWAL_COMPLETE: 'Penarikan Selesai',
  WITHDRAWAL_CANCELLED_REJECTED: 'Penarikan Dibatalkan',
  ADMIN_ADJUSTMENT: 'Penyesuaian Admin',
  SALES_TO_DEPOSIT_TRANSFER: 'Transfer ke Saldo Belanja',
}

export function walletSourceLabel(source: WalletSource | string): string {
  return walletSourceLabels[source as WalletSource] ?? source
}

// Tiap log cuma menyentuh satu bucket (deposit ATAU sales, balance ATAU held).
// Cari bucket yang berubah supaya tampilan "old -> new" relevan dengan kejadiannya.
export function getBalanceLogBucket(log: BalanceLogResponse): { label: string; old: number; new: number } {
  if (log.deposit_balance_old !== log.deposit_balance_new) {
    return { label: 'Saldo Belanja', old: log.deposit_balance_old, new: log.deposit_balance_new }
  }
  if (log.sales_balance_old !== log.sales_balance_new) {
    return { label: 'Saldo Jualan', old: log.sales_balance_old, new: log.sales_balance_new }
  }
  if (log.sales_held_old !== log.sales_held_new) {
    return { label: 'Dana Tertahan (Jualan)', old: log.sales_held_old, new: log.sales_held_new }
  }
  if (log.deposit_held_old !== log.deposit_held_new) {
    return { label: 'Dana Tertahan (Belanja)', old: log.deposit_held_old, new: log.deposit_held_new }
  }
  return { label: 'Saldo Belanja', old: log.deposit_balance_old, new: log.deposit_balance_new }
}
