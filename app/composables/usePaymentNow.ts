// Ref waktu sekarang (epoch ms) yang di-tick tiap detik untuk countdown batas bayar.
// null sampai komponen mounted, sehingga render SSR dan hydration identik.
export const usePaymentNow = () => {
  const now = ref<number | null>(null)
  let timer: ReturnType<typeof setInterval> | null = null

  onMounted(() => {
    now.value = Date.now()
    timer = setInterval(() => { now.value = Date.now() }, 1000)
  })
  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
  })

  return now
}
