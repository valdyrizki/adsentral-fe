/**
 * Hitung mundur untuk form yang sedang ditolak BE (rate limit / akun terkunci).
 * `start(detik)` mengunci; `active` false lagi saat hitungan habis. Timer dibersihkan saat unmount.
 */
export const useCooldown = () => {
  const remaining = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null
  let endsAt = 0

  const stop = () => {
    if (timer) clearInterval(timer)
    timer = null
    remaining.value = 0
  }

  // Hitung dari jam (bukan decrement) supaya tetap akurat saat tab di-background
  const tick = () => {
    remaining.value = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))
    if (remaining.value === 0) stop()
  }

  const start = (seconds: number) => {
    stop()
    if (!(seconds > 0)) return
    endsAt = Date.now() + seconds * 1000
    tick()
    timer = setInterval(tick, 1000)
  }

  onBeforeUnmount(stop)

  return {
    remaining: readonly(remaining),
    active: computed(() => remaining.value > 0),
    label: computed(() => formatCountdown(remaining.value).replace(/^00:/, '')),
    start,
    stop,
  }
}
