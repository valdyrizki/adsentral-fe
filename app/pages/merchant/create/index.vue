<template>
  <div class="w-full">
    <div class="mx-auto  px-4 py-4 sm:px-6 sm:py-6 max-w-7xl lg:px-8">
      <UBreadcrumb :items="breadcrumb" class="mb-4" />
      <div class="mx-auto w-full border rounded-2xl border-primary-200 bg-gray-100">
        <AppHeaderSection
          title="Buat Toko"
          description="Isi data toko untuk mulai berjualan"
          icon="material-symbols:store"
        />
      </div>  

      <div class="mx-auto w-full border rounded-2xl border-primary-200 bg-gray-100 p-4 mt-4">
        <form>
          <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
            
             <div class="col-span-2 mx-auto">
              <div class="mt-2 flex sm:flex-row flex-col gap-4">
                <div>
                  <UFileUpload 
                  v-model="merchantRequest.logo" 
                  label="Upload Logo Toko (wajib)"
                  description="JPG, PNG, atau WEBP (maks. 2 MB)"
                  class="w-96 min-h-48" />
                </div>

                <div>
                  <UFileUpload 
                  v-model="merchantRequest.banner" 
                  label="Upload Banner Toko (opsional)"
                  description="JPG, PNG, atau WEBP (maks. 2 MB)"
                  class="w-96 min-h-48" />
                </div>
                
              </div>
            </div>
            
            <div class="">
              <label for="name" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Nama Toko</label>
              <div class="mt-2">
                  <UInput name="name" id="name" v-model="merchantRequest.name" class="block  text-base text-gray-900" placeholder="5–50 karakter" :maxlength="50"/>
              </div>
            </div>

            <div class="">
              <label for="description" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Deskripsi</label>
              <div class="mt-2">
                  <UTextarea name="description" id="description" v-model="merchantRequest.description" class="block  text-base text-gray-900" placeholder="Deskripsi toko (opsional)" :maxlength="1000"/>
              </div>
            </div>

          </div>

          <div class="mt-6 flex justify-end">
            <UButton type="submit" size="lg" :loading="loading" :disabled="loading" @click.prevent="onSubmit">Simpan</UButton>
          </div>
        </form>
      </div>
      


      
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useAuthStore } from '~/stores/auth';
import { ref } from 'vue';

const breadcrumb = [
  { label: 'Home', icon: 'i-lucide-home', to: '/' },
  { label: 'Buat Toko', icon: 'i-heroicons-store' },
]
import type { MerchantRequest } from '~/types/MerchantRequest';
import { useMerchantApi } from '~/composables/api/merchant';
import { useMerchantStore } from '#imports';

  const toast = useToast()
  const authStore  = useAuthStore()

  // Guard: seller sudah punya toko, arahkan ke dashboard
  if (authStore.isSeller) {
    toast.add({
      title: 'Anda sudah memiliki toko',
      description: 'Kelola toko Anda melalui Seller Dashboard.',
      color: 'info',
      icon: 'material-symbols:store',
    })
    await navigateTo('/seller/dashboard')
  }

  const merchantRequest = reactive<MerchantRequest>({
    name: '',
    description: '',
    logo: undefined,
    banner: undefined,
    is_holiday: false
  })
  const { registerMerchant } = useMerchantApi()
  const merchantStore = useMerchantStore()

  const errors = ref<string[]>([])
  const loading = ref<boolean>(false)

  // Samakan dengan BE (CreateMerchantRequest + FileUtil): logo wajib, nama maks. 50, deskripsi maks. 1000, JPG/PNG/WEBP.
  // Batas 2 MB dan nama minimal 5 karakter adalah aturan FE (lebih ketat dari BE).
  const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
  const MAX_IMAGE_SIZE = 2 * 1024 * 1024

  const validateImage = (file: File | undefined, label: string) => {
    if (!file) return
    if (!IMAGE_TYPES.includes(file.type)) errors.value.push(`${label} harus berformat JPG, PNG, atau WEBP`)
    if (file.size > MAX_IMAGE_SIZE) errors.value.push(`Ukuran ${label.toLowerCase()} maksimal 2 MB`)
  }

  const onSubmit = async() => {
  errors.value = []

  if (!merchantRequest.logo) errors.value.push('Logo toko wajib diunggah')
  validateImage(merchantRequest.logo as File | undefined, 'Logo')
  validateImage(merchantRequest.banner as File | undefined, 'Banner')

  const name = merchantRequest.name.trim()
  if (name.length < 5 || name.length > 50) {
    errors.value.push('Nama toko harus 5–50 karakter')
  }
  if ((merchantRequest.description ?? '').length > 1000) {
    errors.value.push('Deskripsi maksimal 1000 karakter')
  }

  if (errors.value.length > 0) {
    toast.add({
      title: 'Data toko belum valid',
      description: errors.value.join(', '),
      color: 'error'
    })
    return
  }

  try {
    loading.value = true
    await registerMerchant({ ...merchantRequest, name } as MerchantRequest)

    toast.add({
      title: 'Toko berhasil dibuat',
      description: 'Anda akan diarahkan ke dashboard.',
      color: 'success'
    })

    await merchantStore.setMyMerchant()
    await authStore.loadUserProfile()

    navigateTo('/seller/dashboard')

  } catch (err: any) {
    toast.add({
      title: 'Gagal membuat toko',
      description: apiErrorMessage(err, 'Gagal membuat toko'),
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>