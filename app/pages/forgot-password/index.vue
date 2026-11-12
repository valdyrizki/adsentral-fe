<template>
  <div class="w-full">
    <div class="mx-auto px-4 py-4 sm:px-6 sm:py-6 max-w-7xl lg:px-8">
      <div class="mx-auto w-full border rounded-2xl border-primary-200 bg-gray-100">
        <AppHeaderSection
          title="Lupa Kata Sandi"
          description="Minta kode reset, lalu masukkan kode untuk mendapatkan password baru."
          icon="mdi:lock-reset"
        />
      </div>

      <div class="mx-auto w-full border rounded-2xl border-primary-200 bg-gray-100 p-4 mt-4 flex justify-center">
        <div class="w-full sm:max-w-md space-y-4">
          <!-- Langkah 3: password baru (hanya ditampilkan sekali oleh BE) -->
          <template v-if="newPassword">
            <UAlert
              color="success"
              variant="soft"
              icon="mdi:check-circle"
              title="Password berhasil direset"
              description="Simpan password baru ini sekarang; password ini tidak ditampilkan lagi. Segera ganti di halaman profil setelah login."
            />
            <div class="flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-3">
              <code class="flex-1 font-mono text-lg break-all" data-testid="reset-new-password">{{ newPassword }}</code>
              <AppCopyButton :value="newPassword" label="Salin password" show-label />
            </div>
            <UButton to="/login" size="lg" class="w-full flex justify-center">Masuk</UButton>
          </template>

          <form v-else class="space-y-4" method="post" novalidate @submit.prevent="step === 'request' ? handleRequest() : handleConfirm()">
            <div>
              <label for="reset-email" class="block mb-2 text-sm font-medium text-gray-900">Email</label>
              <UInput id="reset-email" v-model="email" type="email" placeholder="nama@contoh.com" size="lg" class="w-full" />
            </div>

            <!-- Pesan netral: BE menjawab sama untuk email terdaftar maupun tidak; kode disampaikan admin (belum lewat email) -->
            <UAlert
              v-if="step === 'confirm' && requested"
              color="info"
              variant="soft"
              icon="mdi:information-outline"
              data-testid="reset-requested-alert"
              title="Bila email terdaftar, kode reset akan dikirim."
            >
              <template #description>
                Belum menerima kode?
                <a v-if="adminWaUrl" :href="adminWaUrl" target="_blank" rel="noopener noreferrer" class="font-semibold underline">Hubungi admin lewat WhatsApp</a>
                <span v-else>Hubungi admin lewat WhatsApp.</span>
              </template>
            </UAlert>

            <div v-if="step === 'confirm'">
              <label for="reset-code" class="block mb-2 text-sm font-medium text-gray-900">Kode Reset</label>
              <UInput id="reset-code" v-model="code" placeholder="Kode dari admin" size="lg" class="w-full" autocomplete="one-time-code" />
              <p v-if="codeError" class="mt-1 text-sm text-red-500" data-testid="reset-code-error">{{ codeError }}</p>
            </div>

            <p v-if="formError" class="text-sm text-red-500">{{ formError }}</p>

            <!-- 429 RATE_LIMITED: hitung mundur dari BE. 429 tanpa kode (5 kali kode salah): hubungi admin -->
            <UAlert
              v-if="blockMessage"
              color="error"
              variant="soft"
              icon="mdi:lock-clock"
              :title="blockMessage"
              data-testid="reset-block-alert"
            >
              <template v-if="tooManyWrong" #description>
                Terlalu banyak kode salah.
                <a v-if="adminWaUrl" :href="adminWaUrl" target="_blank" rel="noopener noreferrer" class="font-semibold underline">Hubungi admin lewat WhatsApp</a>
                <span v-else>Hubungi admin lewat WhatsApp</span>
                untuk mereset password.
              </template>
            </UAlert>

            <UButton type="submit" size="lg" class="w-full flex justify-center" :loading="loading" :disabled="cooldownActive || tooManyWrong">
              {{ cooldownActive ? `Coba lagi dalam ${cooldownLabel}` : step === 'request' ? 'Minta Kode Reset' : 'Reset Password' }}
            </UButton>

            <div class="flex justify-between text-sm">
              <button v-if="step === 'request'" type="button" class="font-medium text-primary-600 hover:underline" @click="goTo('confirm')">Sudah punya kode?</button>
              <button v-else type="button" class="font-medium text-primary-600 hover:underline" @click="goTo('request')">Minta kode baru</button>
              <NuxtLink to="/login" class="font-medium text-primary-600 hover:underline">Kembali ke login</NuxtLink>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useUserApi } from '~/composables/api/user'

definePageMeta({
  layout: 'default'
})

const { requestPasswordReset, confirmPasswordReset } = useUserApi()
const systemSettingStore = useSystemSettingStore()

const step = ref<'request' | 'confirm'>('request')
const email = ref('')
const code = ref('')
const requested = ref(false)
const newPassword = ref<string | null>(null)
const loading = ref(false)
const formError = ref<string | null>(null)
const codeError = ref<string | null>(null)

const blockMessage = ref<string | null>(null)
const tooManyWrong = ref(false)
const { active: cooldownActive, label: cooldownLabel, start: startCooldown, stop: stopCooldown } = useCooldown()
watch(cooldownActive, (active) => {
  if (!active && !tooManyWrong.value) blockMessage.value = null
})

const adminWaUrl = computed(() => {
  const number = systemSettingStore.systemSettings.find(s => s.key === 'WA_NUMBER')?.value
  if (!number) return null
  const msg = email.value.trim()
    ? `Halo Adsentral, saya meminta kode reset password untuk akun dengan email: ${email.value.trim()}`
    : 'Halo Adsentral, saya meminta kode reset password untuk akun saya.'
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
})

const resetMessages = () => {
  formError.value = codeError.value = null
}

// Reset dan confirm punya kuota rate limit sendiri di BE, jadi hitung mundur tidak dibawa antar langkah
const goTo = (next: 'request' | 'confirm') => {
  resetMessages()
  stopCooldown()
  blockMessage.value = null
  tooManyWrong.value = false
  requested.value = false
  step.value = next
}

const validEmail = () => {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) return true
  formError.value = 'Masukkan email yang valid'
  return false
}

// 429 RATE_LIMITED → kunci tombol selama retryAfterSeconds. Kembalikan true bila sudah ditangani.
const handleRateLimited = (err: unknown) => {
  if (apiErrorDetail(err)?.code !== 'RATE_LIMITED') return false
  blockMessage.value = apiErrorMessage(err)
  startCooldown(apiErrorRetryAfter(err))
  return true
}

const handleRequest = async () => {
  if (cooldownActive.value || loading.value) return
  resetMessages()
  if (!validEmail()) return

  loading.value = true
  try {
    await requestPasswordReset(email.value.trim())
    requested.value = true
    step.value = 'confirm'
  } catch (err) {
    if (!handleRateLimited(err)) formError.value = apiErrorMessage(err, 'Gagal meminta kode reset')
  } finally {
    loading.value = false
  }
}

const handleConfirm = async () => {
  if (cooldownActive.value || tooManyWrong.value || loading.value) return
  resetMessages()
  if (!validEmail()) return
  if (!code.value.trim()) {
    codeError.value = 'Kode reset wajib diisi'
    return
  }

  loading.value = true
  try {
    newPassword.value = await confirmPasswordReset(email.value.trim(), code.value.trim())
    stopCooldown()
  } catch (err) {
    if (handleRateLimited(err)) return
    const status = apiErrorStatus(err)
    if (status === 429) {
      // 429 tanpa data.code = 5 kali kode salah; percobaan berikutnya tetap ditolak, arahkan ke admin
      tooManyWrong.value = true
      blockMessage.value = apiErrorMessage(err, 'Terlalu banyak kode salah')
    } else if (status === 400) {
      codeError.value = apiErrorMessage(err, 'Kode reset salah atau sudah tidak berlaku')
    } else {
      formError.value = apiErrorMessage(err, 'Gagal reset password')
    }
  } finally {
    loading.value = false
  }
}
</script>
