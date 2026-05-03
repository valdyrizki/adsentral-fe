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
            <div
              v-for="info in contactInfos"
              :key="info.label"
              class="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm flex items-start gap-4"
            >
              <div class="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <UIcon :name="info.icon" class="text-primary text-xl" />
              </div>
              <div>
                <p class="text-xs text-gray-400 mb-0.5">{{ info.label }}</p>
                <p class="font-semibold text-gray-800 text-sm">{{ info.value }}</p>
                <p v-if="info.note" class="text-xs text-gray-400 mt-0.5">{{ info.note }}</p>
              </div>
            </div>

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
                  <span class="font-medium text-gray-800">08.00 – 20.00 WIB</span>
                </div>
                <div class="flex justify-between">
                  <span>Sabtu – Minggu</span>
                  <span class="font-medium text-gray-800">09.00 – 17.00 WIB</span>
                </div>
              </div>
            </div>

            <!-- Sosial Media -->
            <div class="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm">
              <h3 class="font-semibold text-gray-800 mb-3">Ikuti Kami</h3>
              <div class="flex gap-3">
                <UButton
                  v-for="social in socials"
                  :key="social.label"
                  :icon="social.icon"
                  :aria-label="social.label"
                  color="neutral"
                  variant="outline"
                  size="sm"
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

async function handleSend() {
  if (!form.name || !form.email || !form.message) {
    toast.add({ title: 'Isi semua field wajib', color: 'error' })
    return
  }
  sending.value = true
  await new Promise(r => setTimeout(r, 1000))
  sending.value = false
  toast.add({ title: 'Pesan terkirim!', description: 'Kami akan membalas dalam 1×24 jam.', color: 'success' })
  form.name = ''
  form.email = ''
  form.subject = ''
  form.message = ''
}

const contactInfos = [
  {
    icon: 'i-heroicons-phone',
    label: 'Telepon / WhatsApp',
    value: '085855558813',
    note: 'Tersedia di jam operasional',
  },
  {
    icon: 'i-heroicons-envelope',
    label: 'Email',
    value: 'support@adsentral.id',
    note: 'Balas dalam 1×24 jam',
  },
  {
    icon: 'i-heroicons-map-pin',
    label: 'Alamat',
    value: 'Jakarta, Indonesia',
    note: null,
  },
]

const socials = [
  { icon: 'i-simple-icons-instagram', label: 'Instagram' },
  { icon: 'i-simple-icons-tiktok', label: 'TikTok' },
  { icon: 'i-simple-icons-facebook', label: 'Facebook' },
  { icon: 'i-simple-icons-x', label: 'X / Twitter' },
]
</script>
