<template>
  <div class="w-full">
    <div class="m-1 sm:m-3 border rounded-2xl border-blue-200 bg-gray-100">
      <div class="p-6 md:p-10">

        <UBreadcrumb :items="breadcrumb" class="mb-4" />
        <h1 class="text-3xl font-bold text-gray-800 mb-2">Hubungi Kami</h1>
        <p class="text-gray-500 mb-8">
          Ada pertanyaan atau kendala? Tim kami siap membantu Anda.
        </p>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">

          <!-- Form Pesan -->
          <div class="bg-white rounded-2xl p-6 border border-blue-100 shadow-sm">
            <h2 class="text-xl font-bold text-gray-800 mb-5">Kirim Pesan</h2>
            <div class="space-y-4">
              <UFormField label="Nama Lengkap" required>
                <UInput v-model="form.name" placeholder="Masukkan nama Anda" class="w-full" />
              </UFormField>
              <UFormField label="Email" required>
                <UInput v-model="form.email" type="email" placeholder="email@contoh.com" class="w-full" />
              </UFormField>
              <UFormField label="Subjek">
                <USelect
                  v-model="form.subject"
                  :items="subjectOptions"
                  placeholder="Pilih subjek"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Pesan" required>
                <UTextarea
                  v-model="form.message"
                  placeholder="Tulis pesan Anda di sini..."
                  :rows="5"
                  class="w-full"
                />
              </UFormField>
              <UButton
                color="primary"
                size="lg"
                icon="i-heroicons-paper-airplane"
                class="w-full justify-center"
                :loading="sending"
                @click="handleSend"
              >
                Kirim Pesan
              </UButton>
            </div>
          </div>

          <!-- Info Kontak -->
          <div class="space-y-4">
            <component
              :is="info.href ? 'a' : 'div'"
              v-for="info in contactInfos"
              :key="info.label"
              :href="info.href ?? undefined"
              :target="info.href ? '_blank' : undefined"
              :rel="info.href ? 'noopener noreferrer' : undefined"
              class="bg-white rounded-2xl p-5 border shadow-sm flex items-start gap-4 transition-colors"
              :class="info.href ? 'border-green-200 hover:bg-green-50 cursor-pointer' : 'border-blue-100'"
            >
              <div
                class="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                :class="info.href ? 'bg-green-100' : 'bg-primary/10'"
              >
                <UIcon :name="info.icon" class="text-xl" :class="info.href ? 'text-green-600' : 'text-primary'" />
              </div>
              <div>
                <p class="text-xs text-gray-400 mb-0.5">{{ info.label }}</p>
                <p class="font-semibold text-sm" :class="info.href ? 'text-green-700' : 'text-gray-800'">{{ info.value }}</p>
                <p v-if="info.note" class="text-xs text-gray-400 mt-0.5">{{ info.note }}</p>
              </div>
            </component>

            <!-- Jam Operasional -->
            <div class="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm">
              <div class="flex items-center gap-3 mb-3">
                <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <UIcon name="i-heroicons-clock" class="text-primary text-xl" />
                </div>
                <h3 class="font-semibold text-gray-800">Jam Operasional</h3>
              </div>
              <div class="space-y-1 text-sm text-gray-600 pl-14">
                <div class="flex justify-between">
                  <span>Senin – Jumat</span>
                  <span class="font-medium text-gray-800">{{ operationalWeekday || '-' }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Sabtu – Minggu</span>
                  <span class="font-medium text-gray-800">{{ operationalWeekend || '-' }}</span>
                </div>
              </div>
            </div>

            <!-- Sosial Media -->
            <div class="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm">
              <h3 class="font-semibold text-gray-800 mb-3">Ikuti Kami</h3>
              <div class="flex gap-3">
                <UButton
                  v-for="social in socials.filter(s => s.href)"
                  :key="social.label"
                  :icon="social.icon"
                  :aria-label="social.label"
                  color="neutral"
                  variant="outline"
                  size="sm"
                  :to="social.href ?? undefined"
                  target="_blank"
                  rel="noopener noreferrer"
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useSystemSettingApi } from '~/composables/api/system-setting'

definePageMeta({ layout: 'default' })

useHead({
  title: 'Hubungi Kami — Adsentral',
  meta: [{ name: 'description', content: 'Hubungi tim Adsentral untuk pertanyaan, saran, atau kendala yang Anda hadapi.' }],
})

const breadcrumb = [
  { label: 'Home', icon: 'i-lucide-home', to: '/' },
  { label: 'Hubungi Kami', icon: 'i-heroicons-phone' },
]

const form = reactive({
  name: '',
  email: '',
  subject: '',
  message: '',
})

const subjectOptions = [
  'Pertanyaan Umum',
  'Masalah Transaksi',
  'Masalah Akun',
  'Laporan Seller',
  'Kerja Sama',
  'Lainnya',
]

const sending = ref(false)
const toast = useToast()

function handleSend() {
  if (!form.name || !form.email || !form.message) {
    toast.add({ title: 'Isi semua field wajib', color: 'error' })
    return
  }
  if (!waNumber.value) {
    toast.add({ title: 'Nomor WhatsApp belum tersedia', color: 'error' })
    return
  }
  const lines = [
    `Halo Adsentral, saya ingin menghubungi tim Anda.`,
    ``,
    `*Nama:* ${form.name}`,
    `*Email:* ${form.email}`,
    form.subject ? `*Subjek:* ${form.subject}` : null,
    ``,
    `*Pesan:*`,
    form.message,
  ].filter(l => l !== null).join('\n')

  const url = `https://wa.me/${waNumber.value.replace(/\D/g, '')}?text=${encodeURIComponent(lines)}`
  window.open(url, '_blank', 'noopener,noreferrer')

  form.name = ''
  form.email = ''
  form.subject = ''
  form.message = ''
}

const { fetchPublicSystemSettingByGroup } = useSystemSettingApi()

const contactSettings = ref<{ key: string; value: string }[]>([])

const getSetting = (key: string) => contactSettings.value.find(s => s.key === key)?.value ?? ''

const waNumber = computed(() => getSetting('WA_NUMBER'))
const email = computed(() => getSetting('EMAIL'))
const address = computed(() => getSetting('ADDRESS'))
const operationalWeekday = computed(() => getSetting('OPERATIONAL_HOURS_WEEKDAY'))
const operationalWeekend = computed(() => getSetting('OPERATIONAL_HOURS_WEEKEND'))

const waLink = computed(() => {
  if (!waNumber.value) return null
  const msg = encodeURIComponent('Halo Adsentral, saya ingin bertanya...')
  return `https://wa.me/${waNumber.value.replace(/\D/g, '')}?text=${msg}`
})

const contactInfos = computed(() => [
  {
    icon: 'i-simple-icons-whatsapp',
    label: 'Telepon / WhatsApp',
    value: waNumber.value || '-',
    note: waLink.value ? 'Klik untuk langsung chat via WhatsApp' : 'Tersedia di jam operasional',
    href: waLink.value,
  },
  {
    icon: 'i-heroicons-envelope',
    label: 'Email',
    value: email.value || '-',
    note: 'Balas dalam 1×24 jam',
    href: null,
  },
  {
    icon: 'i-heroicons-map-pin',
    label: 'Alamat',
    value: address.value || '-',
    note: null,
    href: null,
  },
])

const socialSettings = ref<{ key: string; value: string }[]>([])

const getSocialSetting = (key: string) => socialSettings.value.find(s => s.key === key)?.value ?? ''

const socials = computed(() => [
  { icon: 'i-simple-icons-instagram', label: 'Instagram', href: getSocialSetting('INSTAGRAM') ? `https://instagram.com/${getSocialSetting('INSTAGRAM')}` : null },
  { icon: 'i-simple-icons-tiktok', label: 'TikTok', href: getSocialSetting('TIKTOK') ? `https://tiktok.com/@${getSocialSetting('TIKTOK')}` : null },
  { icon: 'i-simple-icons-facebook', label: 'Facebook', href: getSocialSetting('FACEBOOK') ? `https://facebook.com/${getSocialSetting('FACEBOOK')}` : null },
  { icon: 'i-simple-icons-x', label: 'X / Twitter', href: getSocialSetting('TWITTERX') ? `https://x.com/${getSocialSetting('TWITTERX')}` : null },
])

onMounted(async () => {
  [contactSettings.value, socialSettings.value] = await Promise.all([
    fetchPublicSystemSettingByGroup('CONTACT'),
    fetchPublicSystemSettingByGroup('SOCIAL_MEDIA'),
  ])
})
</script>
