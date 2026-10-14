import dayjs from 'dayjs'

const CONFIRM_WINDOW_HOURS = 24

/**
 * Countdown batas konfirmasi seller untuk transaksi PAID (paid_at + 24 jam).
 * Null jika bukan PAID / belum ada paid_at / belum mounted (now === null, supaya SSR tidak mismatch).
 */
export const getTxConfirmCountdown = (
  tx: { status: string, paid_at: string | null },
  now: number | null,
): { text: string, expired: boolean } | null => {
  if (tx.status !== 'PAID' || !tx.paid_at || now === null) return null
  const sec = Math.floor((dayjs(tx.paid_at).add(CONFIRM_WINDOW_HOURS, 'hour').valueOf() - now) / 1000)
  if (sec <= 0) return { text: 'Batas konfirmasi habis', expired: true }
  return { text: `Konfirmasi sebelum ${formatCountdown(sec)}`, expired: false }
}
