// Panggil `load` saat mount lalu tiap `intervalMs`; berhenti saat tab tidak terlihat
// dan fetch ulang saat tab kembali aktif.
export const usePendingCountPolling = (load: () => unknown, intervalMs = 45_000) => {
  let timer: ReturnType<typeof setInterval> | null = null

  const stop = () => {
    if (timer) clearInterval(timer)
    timer = null
  }
  const start = () => {
    stop()
    load()
    timer = setInterval(load, intervalMs)
  }
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') start()
    else stop()
  }

  onMounted(() => {
    if (document.visibilityState === 'visible') start()
    document.addEventListener('visibilitychange', onVisibilityChange)
  })
  onBeforeUnmount(() => {
    stop()
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })
}
