<template>
  <div class="space-y-6">

    <!-- Modal buka kunci login -->
    <UModal
      v-if="showUnlock"
      v-model:open="showUnlock"
      title="Buka Kunci Login"
      :description="unlockTarget ? `${unlockTarget.email} terkunci s/d ${formatDate(unlockTarget.locked_until)}` : ''"
    >
      <template #body>
        <div class="space-y-3">
          <p class="text-sm text-gray-600">
            Pastikan pemilik akun sudah diverifikasi (email/nomor terdaftar cocok). Alasan dicatat di audit.
          </p>
          <UFormField label="Alasan" required :error="formError || undefined">
            <UTextarea
              v-model="notes"
              :rows="3"
              :maxlength="500"
              placeholder="Mis. pemilik terverifikasi via WA, salah ketik password"
              class="w-full"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="outline" :disabled="saving" @click="showUnlock = false">Batal</UButton>
          <UButton color="primary" icon="mdi:lock-open-variant" :loading="saving" @click="handleUnlock">
            Buka Kunci
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Modal kode reset password (super admin, EP03-07) -->
    <UModal
      v-if="showResetCode"
      v-model:open="showResetCode"
      title="Kode Reset Password"
      :description="resetTarget?.email ?? ''"
    >
      <template #body>
        <div v-if="resetCode" class="space-y-3">
          <p class="text-sm text-gray-600">Sampaikan kode ini hanya ke pemilik akun yang sudah diverifikasi.</p>
          <div class="flex items-center justify-center gap-3 py-2">
            <span data-testid="reset-code" class="font-mono text-3xl font-bold tracking-widest">{{ resetCode.code }}</span>
            <UButton icon="mdi:content-copy" color="neutral" variant="ghost" aria-label="Salin kode" @click="copyResetCode" />
          </div>
          <p class="text-xs text-gray-500">
            Berlaku s/d {{ formatDate(resetCode.expires_at) }} · sisa {{ resetCode.remaining_attempts }} percobaan
          </p>
        </div>
        <div v-else class="space-y-3">
          <p class="text-sm text-gray-600">
            Pastikan pemilik akun sudah diverifikasi (email terdaftar + transaksi terakhir) dan sudah mengisi form lupa password.
            Alasan dicatat di audit.
          </p>
          <UAlert v-if="noActiveCode" color="warning" icon="mdi:information" :description="noActiveCode" />
          <UFormField label="Alasan" required :error="resetFormError || undefined">
            <UTextarea
              v-model="resetNotes"
              :rows="3"
              :maxlength="500"
              placeholder="Mis. pemilik terverifikasi via WA, transaksi terakhir cocok"
              class="w-full"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="outline" :disabled="loadingCode" @click="showResetCode = false">Tutup</UButton>
          <UButton v-if="!resetCode" color="primary" icon="mdi:key" :loading="loadingCode" @click="handleViewResetCode">
            Lihat Kode
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Modal pencairan refund tunai (super admin, EP04-16, SOP S2b) -->
    <UModal
      v-if="showPayout"
      v-model:open="showPayout"
      title="Cairkan Refund ke Rekening"
      :description="payoutTarget?.email ?? ''"
    >
      <template #body>
        <div v-if="payoutResult" class="space-y-2">
          <UAlert color="success" icon="mdi:check-circle" :description="`Saldo belanja dipotong ${formatRupiah(payoutDone)}. Lanjutkan transfer manual.`" />
          <p class="text-sm text-gray-600">Sisa saldo belanja: <span class="font-semibold">{{ formatRupiah(payoutResult.deposit_balance) }}</span></p>
        </div>
        <div v-else class="space-y-3">
          <p class="text-sm text-gray-600">
            Hanya untuk dana <b>refund</b> yang belum dibelanjakan (cek riwayat saldo pembeli), rekening atas nama pembeli.
            Saldo belanja dipotong sekarang; transfer dilakukan manual setelahnya. Catatan dicatat di riwayat saldo dan audit.
          </p>
          <UFormField label="Nominal" required>
            <UInputCurrency v-model="payoutAmount" placeholder="Rp 0" />
          </UFormField>
          <UFormField label="Catatan" required :error="payoutFormError || undefined">
            <UTextarea
              v-model="payoutNotes"
              :rows="3"
              :maxlength="500"
              placeholder="Mis. refund TX... ke BCA 123... a.n. ..."
              class="w-full"
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 w-full">
          <UButton color="neutral" variant="outline" :disabled="payingOut" @click="showPayout = false">Tutup</UButton>
          <UButton v-if="!payoutResult" color="primary" icon="mdi:bank-transfer-out" :loading="payingOut" @click="handlePayout">
            Potong Saldo
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Filter -->
    <UCard class="shadow-sm">
      <div class="flex flex-col sm:flex-row gap-3 flex-wrap">
        <UInput
          v-model="search"
          placeholder="Cari email, username, atau nama..."
          icon="mdi:magnify"
          class="flex-1 min-w-48"
          clearable
        />
        <USelect v-model="perPageValue" :items="perPageItems" class="w-full sm:w-24" @update:model-value="page = 0" />
        <UButton icon="mdi:refresh" color="neutral" variant="outline" :loading="pending" @click="refresh()">
          Refresh
        </UButton>
      </div>
    </UCard>

    <ClientOnly>
      <template #fallback>
        <USkeleton class="h-64 w-full" />
      </template>
      <UCard class="shadow-sm">
        <AppLoadingSkeleton v-if="pending" />

        <UAlert
          v-else-if="error"
          color="error"
          icon="mdi:alert-circle"
          title="Terjadi Kesalahan"
          :description="error.message || 'Gagal memuat data'"
        />

        <div v-else-if="!users.length" class="py-10 text-center text-gray-400 text-sm">
          <UIcon name="i-lucide-users" class="text-4xl text-gray-300 mb-3" />
          <p>Tidak ada user.</p>
        </div>

        <div v-else class="divide-y divide-gray-100">
          <div
            v-for="user in users"
            :key="user.id"
            class="flex flex-col sm:flex-row sm:items-center gap-3 py-4 px-2"
          >
            <div class="flex flex-col gap-1 min-w-0 flex-1">
              <p class="text-sm font-semibold text-gray-800 truncate">{{ user.full_name ?? user.username }}</p>
              <p class="text-xs text-gray-400 truncate">{{ user.email }} · @{{ user.username }}</p>
              <div class="flex flex-wrap gap-1 mt-0.5">
                <UBadge color="neutral" variant="subtle" size="xs">{{ user.role }}</UBadge>
                <UBadge :color="statusColor(user.status)" variant="subtle" size="xs">{{ user.status }}</UBadge>
                <UBadge v-if="isLocked(user)" color="error" variant="subtle" size="xs" icon="mdi:lock">
                  Login terkunci s/d {{ formatDate(user.locked_until) }}
                </UBadge>
              </div>
            </div>
            <div class="sm:ml-auto flex-shrink-0 flex gap-2">
              <UButton
                v-if="authStore.isSuperAdmin"
                size="sm"
                color="neutral"
                variant="outline"
                icon="mdi:key"
                @click="openResetCode(user)"
              >
                Kode Reset
              </UButton>
              <UButton
                v-if="authStore.isSuperAdmin"
                size="sm"
                color="neutral"
                variant="outline"
                icon="mdi:bank-transfer-out"
                @click="openPayout(user)"
              >
                Cairkan Refund
              </UButton>
              <UButton
                v-if="isLocked(user)"
                size="sm"
                color="primary"
                variant="outline"
                icon="mdi:lock-open-variant"
                @click="openUnlock(user)"
              >
                Buka Kunci
              </UButton>
            </div>
          </div>
        </div>

        <div v-if="data && data.total_pages > 1" class="flex justify-center pt-4">
          <UPagination
            :page="page + 1"
            :total="data.total_elements"
            :items-per-page="perPageValue"
            :sibling-count="1"
            show-edges
            @update:page="(p) => { page = p - 1 }"
          />
        </div>
      </UCard>
    </ClientOnly>
  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { useAdminUserApi } from '~/composables/api/admin-user'
import type { AdminUserResponse } from '~/types/user/AdminUserResponse'
import type { ResetCodeResponse } from '~/types/user/ResetCodeResponse'
import type { BalanceResponse } from '~/types/balance/BalanceResponse'
import type { PageResponse } from '~/types/PageResponse'

definePageMeta({ layout: 'admin', label: 'Pengguna' })

const toast = useToast()
const authStore = useAuthStore()
const { fetchUsers, unlockLogin, viewResetCode, payoutRefund } = useAdminUserApi()

// ===== FILTER & PAGINATION =====
const page = ref(0)
const perPageValue = ref(20)
const perPageItems = [10, 20, 50, 100]
const search = ref('')
const debouncedSearch = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

watch(search, (val) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedSearch.value = val
    page.value = 0
  }, 400)
})

// ===== FETCH =====
const { data, pending, error, refresh } = useAsyncData<PageResponse<AdminUserResponse>>(
  'admin-users',
  () => fetchUsers({ page: page.value, size: perPageValue.value, keyword: debouncedSearch.value || undefined }),
  { watch: [page, perPageValue, debouncedSearch], server: false },
)

const users = computed(() => data.value?.content ?? [])

// ===== HELPERS =====
const isLocked = (u: AdminUserResponse) => !!u.locked_until && dayjs(u.locked_until).isAfter(dayjs())
const formatDate = (v: string | null | undefined) => (v ? dayjs(v).format('DD MMM YYYY, HH:mm') : '-')
const statusColor = (s: AdminUserResponse['status']) =>
  s === 'ACTIVE' ? 'success' : s === 'SUSPEND' ? 'error' : 'warning'

// ===== BUKA KUNCI LOGIN =====
const showUnlock = ref(false)
const unlockTarget = ref<AdminUserResponse | null>(null)
const notes = ref('')
const formError = ref('')
const saving = ref(false)

function openUnlock(user: AdminUserResponse) {
  unlockTarget.value = user
  notes.value = ''
  formError.value = ''
  showUnlock.value = true
}

async function handleUnlock() {
  if (!unlockTarget.value || saving.value) return
  const reason = notes.value.trim()
  if (reason.length < 5) {
    formError.value = 'Alasan minimal 5 karakter'
    return
  }
  saving.value = true
  formError.value = ''
  try {
    await unlockLogin(unlockTarget.value.id, reason)
    toast.add({ title: 'Kunci login dibuka', color: 'success', icon: 'mdi:check-circle' })
    showUnlock.value = false
    await refresh()
  } catch (err: any) {
    if (apiErrorDetail(err)?.code === 'LOGIN_NOT_LOCKED') {
      // kunci sudah habis atau dibuka admin lain
      toast.add({ title: 'Akun sudah tidak terkunci', description: apiErrorMessage(err), color: 'warning' })
      showUnlock.value = false
      await refresh()
      return
    }
    formError.value = apiErrorMessage(err, 'Gagal membuka kunci login')
    toast.add({ title: 'Gagal membuka kunci', description: formError.value, color: 'error' })
  } finally {
    saving.value = false
  }
}

// ===== KODE RESET PASSWORD (super admin) =====
const showResetCode = ref(false)
const resetTarget = ref<AdminUserResponse | null>(null)
const resetNotes = ref('')
const resetFormError = ref('')
const noActiveCode = ref('')
const resetCode = ref<ResetCodeResponse | null>(null)
const loadingCode = ref(false)

function openResetCode(user: AdminUserResponse) {
  clearResetCode()
  resetTarget.value = user
  showResetCode.value = true
}

// kode tidak disimpan lebih lama dari modal terbuka
watch(showResetCode, (open) => { if (!open) clearResetCode() })

function clearResetCode() {
  resetCode.value = null
  resetNotes.value = ''
  resetFormError.value = ''
  noActiveCode.value = ''
}

async function handleViewResetCode() {
  if (!resetTarget.value || loadingCode.value) return
  const reason = resetNotes.value.trim()
  if (reason.length < 5) {
    resetFormError.value = 'Alasan minimal 5 karakter'
    return
  }
  loadingCode.value = true
  resetFormError.value = ''
  noActiveCode.value = ''
  try {
    resetCode.value = await viewResetCode(resetTarget.value.id, reason)
  } catch (err: any) {
    if (apiErrorDetail(err)?.code === 'NO_ACTIVE_RESET_CODE') {
      noActiveCode.value = 'Tidak ada kode reset aktif. Minta pelanggan mengisi form lupa password dulu, lalu coba lagi.'
      return
    }
    resetFormError.value = apiErrorMessage(err, 'Gagal mengambil kode reset')
  } finally {
    loadingCode.value = false
  }
}

async function copyResetCode() {
  if (!resetCode.value) return
  try {
    await navigator.clipboard.writeText(resetCode.value.code)
    toast.add({ title: 'Kode disalin', color: 'success', icon: 'mdi:check-circle' })
  } catch {
    toast.add({ title: 'Gagal menyalin kode', color: 'error' })
  }
}

// ===== PENCAIRAN REFUND TUNAI (super admin, EP04-16) =====
const showPayout = ref(false)
const payoutTarget = ref<AdminUserResponse | null>(null)
const payoutAmount = ref(0)
const payoutNotes = ref('')
const payoutFormError = ref('')
const payoutResult = ref<BalanceResponse | null>(null)
const payoutDone = ref(0)
const payingOut = ref(false)

function openPayout(user: AdminUserResponse) {
  payoutTarget.value = user
  payoutAmount.value = 0
  payoutNotes.value = ''
  payoutFormError.value = ''
  payoutResult.value = null
  showPayout.value = true
}

async function handlePayout() {
  if (!payoutTarget.value || payingOut.value) return
  const notes = payoutNotes.value.trim()
  if (!payoutAmount.value || payoutAmount.value <= 0) {
    payoutFormError.value = 'Nominal wajib diisi'
    return
  }
  if (notes.length < 5) {
    payoutFormError.value = 'Catatan minimal 5 karakter'
    return
  }
  const confirmDialog = useConfirm()
  const confirmed = await confirmDialog.confirm({
    title: 'Potong saldo belanja?',
    message: `Saldo belanja ${payoutTarget.value.email} dipotong ${formatRupiah(payoutAmount.value)}. Tindakan ini tidak bisa dibatalkan dari sistem.`,
    confirmText: 'Ya, Potong',
    confirmColor: 'error',
  })
  if (!confirmed) return
  payingOut.value = true
  payoutFormError.value = ''
  try {
    payoutResult.value = await payoutRefund(payoutTarget.value.id, payoutAmount.value, notes)
    payoutDone.value = payoutAmount.value
  } catch (err: any) {
    payoutFormError.value = apiErrorMessage(err, 'Gagal memotong saldo')
  } finally {
    payingOut.value = false
    confirmDialog.close()
  }
}
</script>
