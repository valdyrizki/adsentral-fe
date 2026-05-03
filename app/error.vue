<template>
  <NuxtLayout name="default">
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 px-4">
      <div class="max-w-md w-full text-center">
        <!-- Icon besar sesuai error code -->
        <div class="mb-6 flex justify-center">
          <div class="relative">
            <div class="absolute inset-0 bg-red-100 rounded-full blur-2xl opacity-60"></div>
            <UIcon 
              :name="errorIcon" 
              class="size-32 text-red-500 relative"
            />
          </div>
        </div>
        
        <!-- Status code -->
        <div class="text-6xl font-bold text-gray-800 mb-2">
          {{ error.statusCode }}
        </div>
        
        <!-- Title -->
        <h1 class="text-2xl font-semibold mb-3 text-gray-900">
          {{ errorTitle }}
        </h1>
        
        <!-- Description -->
        <p class="text-gray-600 mb-8 leading-relaxed">
          {{ errorDescription }}
        </p>
        
        <!-- Actions -->
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <UButton 
            @click="handleGoBack" 
            color="neutral" 
            variant="outline"
            icon="material-symbols:arrow-back-rounded"
            size="lg"
          >
            Kembali
          </UButton>
          <UButton 
            @click="handleGoHome" 
            color="primary"
            icon="material-symbols:home-outline-rounded"
            size="lg"
          >
            Ke Beranda
          </UButton>
        </div>
        
        <!-- Optional: hint untuk login kalau 403 -->
        <p v-if="error.statusCode === 403" class="text-sm text-gray-500 mt-6">
          Login dengan akun yang sesuai untuk mengakses halaman ini.
        </p>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
const props = defineProps<{
  error: {
    statusCode: number
    statusMessage?: string
    message?: string
  }
}>()

// Map status code ke ikon
const errorIcon = computed(() => {
  switch (props.error.statusCode) {
    case 403: return 'material-symbols:lock-outline'
    case 404: return 'material-symbols:search-off-rounded'
    case 500: return 'material-symbols:error-outline-rounded'
    default: return 'material-symbols:warning-outline-rounded'
  }
})

// Title — pakai statusMessage dari middleware kalau ada
const errorTitle = computed(() => {
  if (props.error.statusMessage) return props.error.statusMessage
  
  switch (props.error.statusCode) {
    case 403: return 'Akses Ditolak'
    case 404: return 'Halaman Tidak Ditemukan'
    case 500: return 'Server Error'
    default: return 'Terjadi Kesalahan'
  }
})

// Description detail
const errorDescription = computed(() => {
  switch (props.error.statusCode) {
    case 403: 
      return 'Kamu tidak memiliki izin untuk membuka halaman ini. Silakan login dengan akun yang sesuai.'
    case 404: 
      return 'Halaman yang kamu cari tidak ada atau sudah dipindahkan.'
    case 500: 
      return 'Terjadi kesalahan di server kami. Silakan coba beberapa saat lagi.'
    default: 
      return 'Sesuatu tidak berjalan sebagaimana mestinya. Silakan coba lagi.'
  }
})

function handleGoHome() {
  clearError({ redirect: '/' })
}

function handleGoBack() {
  clearError()
  // window.history.back() lebih natural daripada redirect ke '/'
  if (window.history.length > 1) {
    window.history.back()
  } else {
    navigateTo('/')
  }
}

// SEO — error page tetap punya title proper
useHead({
  title: `Error ${props.error.statusCode} — Adsentral`
})
</script>