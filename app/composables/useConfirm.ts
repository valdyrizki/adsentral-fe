// app/composables/useConfirm.ts

interface ConfirmOptions {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  confirmColor?: 'error' | 'primary' | 'warning' | 'success'
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean
  loading: boolean
  resolver?: (value: boolean) => void
}

// State global — share antar komponen
const state = reactive<ConfirmState>({
  isOpen: false,
  loading: false,
  title: 'Konfirmasi',
  message: 'Apakah Anda yakin?',
  confirmText: 'Ya',
  cancelText: 'Batal',
  confirmColor: 'primary',
})

export const useConfirm = () => {
  /**
   * Tampilkan dialog konfirmasi.
   * @returns Promise<boolean> — true kalau user konfirmasi, false kalau batal
   * 
   * @example
   * const confirmed = await confirm({
   *   title: 'Batalkan Deposit?',
   *   message: 'Aksi ini tidak bisa dibatalkan',
   *   confirmText: 'Ya, Batalkan',
   *   confirmColor: 'error',
   * })
   * 
   * if (!confirmed) return
   * await cancelDeposit(id)
   */
  function confirm(options: ConfirmOptions = {}): Promise<boolean> {
    return new Promise((resolve) => {
      state.title = options.title ?? 'Konfirmasi'
      state.message = options.message ?? 'Apakah Anda yakin?'
      state.confirmText = options.confirmText ?? 'Ya'
      state.cancelText = options.cancelText ?? 'Batal'
      state.confirmColor = options.confirmColor ?? 'primary'
      state.isOpen = true
      state.loading = false
      state.resolver = resolve
    })
  }

  function handleConfirm() {
    state.loading = true
    state.resolver?.(true)
    // Note: state.isOpen tidak otomatis di-close di sini.
    // Caller yang harus handle (lihat helper di bawah)
  }

  function handleCancel() {
    state.resolver?.(false)
    state.isOpen = false
    state.loading = false
  }

  function close() {
    state.isOpen = false
    state.loading = false
  }

  return {
    state,
    confirm,
    handleConfirm,
    handleCancel,
    close,
  }
}