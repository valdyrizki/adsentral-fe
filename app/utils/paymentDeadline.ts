import dayjs from 'dayjs'
import type { PaymentResponse } from '~/types/payment/PaymentResponse'

const DEFAULT_PAYMENT_WINDOW_HOURS = 24

export interface PaymentDeadline {
  /** Batas bayar terformat, atau null jika bukan payment UNPAID. */
  label: string | null
  /** Sisa waktu singkat untuk MANUAL_BANK UNPAID ("sisa 3 jam" / "Segera expired"), selain itu null. */
  remaining: string | null
  overdue: boolean
}

// expired_at null (payment lama) -> created_at + 24 jam
export const getPaymentExpiry = (p: Pick<PaymentResponse, 'expired_at' | 'created_at'>) =>
  p.expired_at ? dayjs(p.expired_at) : dayjs(p.created_at).add(DEFAULT_PAYMENT_WINDOW_HOURS, 'hour')

const pad = (n: number) => String(n).padStart(2, '0')

// Countdown "HH:mm:ss" (diawali "N hari" jika > 24 jam)
const formatCountdown = (totalSec: number) => {
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${d > 0 ? `${d} hari ` : ''}${pad(h)}:${pad(m)}:${pad(s)}`
}

// `now` (epoch ms) opsional: berikan ref yang di-tick agar countdown live.
export const getPaymentDeadline = (p: PaymentResponse, now: number = Date.now()): PaymentDeadline => {
  if (p.status !== 'UNPAID') return { label: null, remaining: null, overdue: false }

  const expiry = getPaymentExpiry(p)
  const diffSec = Math.floor((expiry.valueOf() - now) / 1000)
  const overdue = diffSec <= 0

  let remaining: string | null = null
  if (p.payment_method?.id === 'MANUAL_BANK') {
    remaining = overdue ? 'Segera expired' : `sisa ${formatCountdown(diffSec)}`
  }

  return { label: expiry.format('DD MMM YYYY, HH:mm'), remaining, overdue }
}
