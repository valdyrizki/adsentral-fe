import type { AlertsScope } from '~/stores/alerts'

const ALERTS_POLL_MS = 45_000

/**
 * Satu timer polling alerts per role (dipasang sekali di layout).
 * Fetch saat mount, ulangi tiap 45 detik, berhenti saat tab tidak terlihat
 * dan fetch ulang saat tab kembali aktif.
 */
export const useAlertsPolling = (scope: AlertsScope) => {
  const alertsStore = useAlertsStore()
  const authStore = useAuthStore()
  let timer: ReturnType<typeof setInterval> | null = null

  const load = () => alertsStore.load(scope)
  const stop = () => {
    if (timer) clearInterval(timer)
    timer = null
  }
  const start = () => {
    stop()
    load()
    timer = setInterval(load, ALERTS_POLL_MS)
  }
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') start()
    else stop()
  }

  // Login/logout atau profil selesai dimuat -> muat ulang (load() mengosongkan slice bila sesi berakhir)
  watch(() => [authStore.accessToken, authStore.user?.role], () => load())

  onMounted(() => {
    alertsStore.activate(scope)
    if (document.visibilityState === 'visible') start()
    document.addEventListener('visibilitychange', onVisibilityChange)
  })
  onBeforeUnmount(() => {
    stop()
    alertsStore.deactivate(scope)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })
}
