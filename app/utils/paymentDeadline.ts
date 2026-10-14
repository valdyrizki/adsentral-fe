import dayjs from 'dayjs'

const DEFAULT_PAYMENT_WINDOW_HOURS = 24

export interface PaymentDeadline {
  /** Batas bayar terformat, atau null jika bukan payment UNPAID. */
  label: string | null
  /** Countdown ("sisa 02:41:07" / "Segera expired"), atau null jika tidak ditampilkan. */
  remaining: string | null
  overdue: boolean
}

// Bentuk minimal yang dipakai PaymentResponse maupun DepositResponse.
interface DeadlineSource {
  status: string
  created_at: string | Date
  expired_at?: string | null
  payment_method?: { id?: string } | string | null
}

// expired_at null (payment lama) -> created_at + 24 jam
export const getPaymentExpiry = (p: Pick<DeadlineSource, 'expired_at' | 'created_at'>) =>
  p.expired_at ? dayjs(p.expired_at) : dayjs(p.created_at).add(DEFAULT_PAYMENT_WINDOW_HOURS, 'hour')

const pad = (n: number) => String(n).padStart(2, '0')

// Countdown "HH:mm:ss" (diawali "N hari" jika > 24 jam)
export const formatCountdown = (totalSec: number) => {
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${d > 0 ? `${d} hari ` : ''}${pad(h)}:${pad(m)}:${pad(s)}`
}

/**
 * @param now epoch ms; berikan nilai dari usePaymentNow() agar countdown live.
 *            `null` (belum mounted) berarti countdown disembunyikan, supaya SSR tidak mismatch.
 * @param opts.allMethods true -> countdown untuk semua metode (buyer); default hanya MANUAL_BANK (admin).
 */
export const getPaymentDeadline = (
  p: DeadlineSource,
  now: number | null = Date.now(),
  opts: { allMethods?: boolean } = {},
): PaymentDeadline => {
  if (p.status !== 'UNPAID') return { label: null, remaining: null, overdue: false }

  const expiry = getPaymentExpiry(p)
  const label = expiry.format('DD MMM YYYY, HH:mm')
  if (now === null) return { label, remaining: null, overdue: false }

  const diffSec = Math.floor((expiry.valueOf() - now) / 1000)
  const overdue = diffSec <= 0

  const methodId = typeof p.payment_method === 'string' ? p.payment_method : p.payment_method?.id
  const eligible = opts.allMethods || methodId === 'MANUAL_BANK'
  const remaining = eligible ? (overdue ? 'Segera expired' : `sisa ${formatCountdown(diffSec)}`) : null

  return { label, remaining, overdue }
}
