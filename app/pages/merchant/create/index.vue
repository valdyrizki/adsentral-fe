<template>
  <div class="w-full">
    <div class="mx-auto  px-4 py-4 sm:px-6 sm:py-6 max-w-7xl lg:px-8">
      <div class="mx-auto w-full border rounded-2xl border-blue-200 bg-gray-100">
        <AppHeaderSection
          title="Merchant"
          description="Create your store"
          icon="material-symbols:store"
        />
      </div>  

      <div class="mx-auto w-full border rounded-2xl border-blue-200 bg-gray-100 p-4 mt-4">
        <form>
          <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
            
             <div class="col-span-2 mx-auto">
              <div class="mt-2 flex sm:flex-row flex-col gap-4">
                <div>
                  <UFileUpload 
                  v-model="merchantRequest.logo" 
                  label="Upload Foto Profil Toko"
                  description="SVG, PNG, JPG or GIF (max. 2MB)"
                  class="w-96 min-h-48" />
                </div>

                <div>
                  <UFileUpload 
                  v-model="merchantRequest.banner" 
                  label="Upload Banner Toko"
                  description="SVG, PNG, JPG or GIF (max. 2MB)"
                  class="w-96 min-h-48" />
                </div>
                
              </div>
            </div>
            
            <div class="">
              <label for="name" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Name</label>
              <div class="mt-2">
                  <UInput name="name" id="name" v-model="merchantRequest.name" class="block  text-base text-gray-900" placeholder="name"/>
              </div>
            </div>

            <div class="">
              <label for="description" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Description</label>
              <div class="mt-2">
                  <UTextarea name="description" id="description" v-model="merchantRequest.description" class="block  text-base text-gray-900" placeholder="Description"/>
              </div>
            </div>

          </div>

          <div class="mt-6 flex justify-end">
            <UButton type="submit" size="lg" @click.prevent="onSubmit">Save</UButton>
          </div>
        </form>
      </div>
      


      
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useAuthStore } from '~/stores/auth';
import { ref } from 'vue';
import type { UserRequest } from '~/types/UserRequest';
import { useUserApi } from '~/composables/api/user';
import type { MerchantRequest } from '~/types/MerchantRequest';
import { useMerchantApi } from '~/composables/api/merchant';
import { useMerchantStore } from '#imports';

  const toast = useToast()
  const authStore  = useAuthStore()
  const merchantRequest = reactive<MerchantRequest>({
    name: '',
    description: '',
    logo: undefined,
    banner: undefined,
    is_holiday: false
  })
  const { registerMerchant } = useMerchantApi()
  const merchantStore = useMerchantStore()
  const config = useRuntimeConfig()

  const errors = ref<string[]>([])
  
  const onSubmit = async() => {
  errors.value = []
  // Reactive state
  const loading = ref<boolean>(true)

  // ✅ Validasi logo
  if (merchantRequest.logo) {
    const logoFile = merchantRequest.logo as File
    const maxSize = 2 * 1024 * 1024 // 2 MB
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]

    if (logoFile.size > maxSize) {
      errors.value.push("Logo size must be less than 2MB")
    }

    if (!allowedTypes.includes(logoFile.type)) {
      errors.value.push("Logo must be JPG, PNG, WEBP, or GIF")
    }
  }

    // ✅ Validasi banner
  if (merchantRequest.banner) {
    const bannerFile = merchantRequest.banner as File
    const maxSize = 2 * 1024 * 1024 // 2 MB
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]

    if (bannerFile.size > maxSize) {
      errors.value.push("Banner size must be less than 2MB")
    }

    if (!allowedTypes.includes(bannerFile.type)) {
      errors.value.push("Banner must be JPG, PNG, WEBP, or GIF")
    }
  }

  // ✅ Validasi username & lainnya
  if (merchantRequest.name && merchantRequest.name.length < 5) {
    errors.value.push("Name must be at least 5 characters")
  }

  if (errors.value.length > 0) {
    toast.add({
      title: "Gagal Simpan User ❌",
      description: errors.value.join(", "),
      color: "error"
    })
    loading.value = false
    return
  }

  // ✅ Submit ke backend (nanti pakai FormData)
  try { 
    loading.value = true
    await registerMerchant(merchantRequest as MerchantRequest)
    
    toast.add({
      title: "Berhasil membuat merchant ✅",
      description: "Anda akan diarahkan ke dashboard.",
      color: "success"
    })

    navigateTo("/seller/dashboard")

    await merchantStore.setMyMerchant()
    
  } catch (err: any) {
    errors.value.push(err.statusMessage || 'Failed to update profile')
    toast.add({
      title: "Gagal Simpan User ❌",
      description: errors.value.join(", "),
      color: "error"
    })
  } finally {
    loading.value = false
    
  }
}
</script>