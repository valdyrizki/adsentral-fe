<template>
  <div class="w-full">
    <div class="m-1 sm:m-3 border rounded-2xl border-blue-200 bg-gray-100">
      <div class="p-6 md:p-10">

        <UBreadcrumb :items="breadcrumb" class="mb-4" />

        <!-- Hero -->
        <div class="bg-gradient-to-br from-blue-600 to-teal-700 rounded-2xl p-8 md:p-12 text-white text-center mb-10">
          <h1 class="text-4xl font-bold mb-3">Bergabung dengan Tim Adsentral</h1>
          <p class="text-blue-100 text-lg max-w-2xl mx-auto">
            Kami mencari talenta terbaik yang bersemangat membangun platform e-commerce yang berdampak bagi jutaan orang.
          </p>
        </div>

        <!-- Mengapa Bergabung -->
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Mengapa Bergabung?</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          <div
            v-for="perk in perks"
            :key="perk.title"
            class="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm"
          >
            <UIcon :name="perk.icon" class="text-primary text-2xl mb-2" />
            <h3 class="font-semibold text-gray-800 mb-1">{{ perk.title }}</h3>
            <p class="text-sm text-gray-500">{{ perk.description }}</p>
          </div>
        </div>

        <!-- Lowongan -->
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Posisi Terbuka</h2>

        <div v-if="openings.length > 0" class="space-y-4 mb-10">
          <div
            v-for="job in openings"
            :key="job.id"
            class="bg-white rounded-2xl p-5 border border-blue-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">{{ job.department }}</span>
                <span class="text-xs text-gray-400">{{ job.type }}</span>
              </div>
              <h3 class="text-base font-semibold text-gray-800">{{ job.title }}</h3>
              <p class="text-sm text-gray-500 mt-0.5">{{ job.location }}</p>
            </div>
            <UButton variant="outline" size="sm" icon="i-heroicons-paper-airplane">
              Lamar Sekarang
            </UButton>
          </div>
        </div>

        <UAlert
          v-else
          title="Belum ada lowongan tersedia"
          description="Pantau terus halaman ini untuk informasi lowongan terbaru."
          icon="i-heroicons-briefcase"
          color="neutral"
          class="mb-10"
        />

        <!-- Kirim CV -->
        <div class="bg-primary/10 border border-primary/30 rounded-2xl p-6 text-center">
          <p class="text-gray-700 font-semibold text-lg mb-1">Tidak menemukan posisi yang cocok?</p>
          <p class="text-gray-500 text-sm mb-4">Kirimkan CV Anda dan kami akan menghubungi jika ada posisi yang sesuai.</p>
          <UButton color="primary" size="lg" icon="i-heroicons-envelope">
            Kirim CV ke careers@adsentral.id
          </UButton>
        </div>

      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({ layout: 'default' })

useHead({
  title: 'Karir — Adsentral',
  meta: [{ name: 'description', content: 'Bergabunglah dengan tim Adsentral dan bangun platform e-commerce yang berdampak.' }],
})

const breadcrumb = [
  { label: 'Home', icon: 'i-lucide-home', to: '/' },
  { label: 'Karir', icon: 'i-heroicons-briefcase' },
]

const perks = [
  { icon: 'i-heroicons-computer-desktop', title: 'Remote Friendly', description: 'Bekerja dari mana saja dengan fleksibilitas penuh.' },
  { icon: 'i-heroicons-academic-cap', title: 'Belajar & Berkembang', description: 'Budget pelatihan dan akses ke kursus online terbaik.' },
  { icon: 'i-heroicons-users', title: 'Tim yang Solid', description: 'Bersama orang-orang berpengalaman yang saling mendukung.' },
  { icon: 'i-heroicons-currency-dollar', title: 'Kompensasi Kompetitif', description: 'Gaji dan tunjangan yang bersaing di industri.' },
  { icon: 'i-heroicons-heart', title: 'Work-Life Balance', description: 'Jam kerja fleksibel dan cuti yang menghargai waktu pribadi.' },
  { icon: 'i-heroicons-rocket-launch', title: 'Dampak Nyata', description: 'Pekerjaan Anda langsung dirasakan jutaan pengguna.' },
]

const openings = [
  { id: 1, title: 'Frontend Engineer (Vue/Nuxt)', department: 'Engineering', type: 'Full-time', location: 'Remote — Indonesia' },
  { id: 2, title: 'Backend Engineer (Spring Boot)', department: 'Engineering', type: 'Full-time', location: 'Remote — Indonesia' },
  { id: 3, title: 'Product Designer (UI/UX)', department: 'Design', type: 'Full-time', location: 'Jakarta / Remote' },
  { id: 4, title: 'Digital Marketing Specialist', department: 'Marketing', type: 'Full-time', location: 'Jakarta' },
]
</script>
