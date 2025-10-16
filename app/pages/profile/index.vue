<template>
  <div class="w-full">
    <div class="mx-auto  px-4 py-4 sm:px-6 sm:py-6 max-w-7xl lg:px-8">
      <div class="mx-auto w-full border rounded-2xl border-blue-200 bg-gray-100">
        <AppHeaderSection
          title="Profile"
          description="Manage your profile information"
          icon="material-symbols:person"
        />
      </div>  

      <div class="mx-auto w-full border rounded-2xl border-blue-200 bg-gray-100 p-4 mt-4">
        <form>
          <div class="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
            
             <div class="col-span-2 mx-auto">
              <div class="mt-2 flex sm:flex-row flex-col gap-4">

                <div  class="mb-4 text-center">
                  <label for="avatar_url" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Avatar</label>
                  <NuxtImg :src="`${config.public.backendUrl + authStore.auth?.user?.avatar_url}`" alt="Avatar" class="w-32 h-32 rounded-full object-cover mx-auto"/>
                </div>
                <div>
                  <UFileUpload 
                  v-model="userRequest.avatar" 
                  label="Drop your image here"
                  description="SVG, PNG, JPG or GIF (max. 2MB)"
                  class="w-96 min-h-48" />
                </div>

                
              </div>
            </div>
            
            <div class="">
              <label for="username" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Username</label>
              <div class="mt-2">
                  <UInput name="username" id="username" v-model="userRequest.username" class="block  text-base text-gray-900" placeholder="username"/>
              </div>
            </div>

            <div class="">
              <label for="email" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Email</label>
              <div class="mt-2">
                  <UInput name="email" v-model="userRequest.email" id="email" class="block text-base text-gray-900" placeholder="email" :disabled="true"/>
              </div>
            </div>

            <div class="">
              <label for="full_name" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Full Name</label>
              <div class="mt-2">
                  <UInput name="full_name" id="full_name" v-model="userRequest.full_name" class="block  text-base text-gray-900" placeholder="Full Name"/>
              </div>
            </div>

            <div class="">
              <label for="phone_number" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Phone Number</label>
              <div class="mt-2">
                  <UInput name="phone_number" id="phone_number" v-model="userRequest.phone_number" class="block  text-base text-gray-900" placeholder="Phone Number"/>
              </div>
            </div>

            <div class="">
              <label for="address" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Address</label>
              <div class="mt-2">
                  <UTextarea name="address" id="address" v-model="userRequest.address" class="block  text-base text-gray-900" placeholder="Address"/>
              </div>
            </div>

            <div class="">
              <label for="birth_date" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Birth Date</label>
              <div class="mt-2">
                  <UInput name="birth_date" id="birth_date" v-model="userRequest.birth_date" type="date" class="block  text-base text-gray-900" placeholder="Birth Date"/>
              </div>
            </div>

            <div class="">
              <label for="new_password" class="block text-sm/6 font-medium text-gray-900 dark:text-white">New Password</label>
              <div class="mt-2">
                <UInput
                    v-model="userRequest.new_password"
                    placeholder="Password"
                    type="password"
                    class="block  text-base text-gray-900"
                  >
                  </UInput>              
                </div>
            </div>

            <div v-if="userRequest.new_password" class="">
              <label for="confirm_password" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Confirm Password</label>
              <div class="mt-2">
                <UInput
                    v-model="confirm_password"
                    placeholder="Password"
                    type="password"
                    class="block  text-base text-gray-900"
                  >
                  </UInput>              
                </div>
            </div>

            <div v-if="userRequest.new_password" class="">
              <label for="old_password" class="block text-sm/6 font-medium text-gray-900 dark:text-white">Confirm Password</label>
              <div class="mt-2">
                <UInput
                    v-model="userRequest.old_password"
                    placeholder="Password"
                    type="password"
                    class="block  text-base text-gray-900"
                  >
                  </UInput>              
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

  const toast = useToast()
  const authStore  = useAuthStore()
  const userRequest = reactive<Partial<UserRequest>>({
    ...authStore.auth?.user
  })
  const { updateProfile } = useUserApi()
  const config = useRuntimeConfig()

  const confirm_password = ref<string>("");
  const errors = ref<string[]>([])

  console.log(userRequest);

  console.log(authStore.auth?.user?.avatar_url);
  
  
  

  const onSubmit = async() => {
  errors.value = []
  // Reactive state
  const loading = ref<boolean>(true)

  // ✅ Validasi avatar
  if (userRequest.avatar) {
    const file = userRequest.avatar as File
    const maxSize = 2 * 1024 * 1024 // 2 MB
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]

    if (file.size > maxSize) {
      errors.value.push("Avatar size must be less than 2MB")
    }

    if (!allowedTypes.includes(file.type)) {
      errors.value.push("Avatar must be JPG, PNG, WEBP, or GIF")
    }
  }

  // ✅ Validasi password
  if (userRequest.new_password) {
    if (userRequest.new_password.length < 8) {
      errors.value.push("Password must be at least 8 characters")
    }
    if (userRequest.new_password !== confirm_password.value) {
      errors.value.push("Password and Confirm Password do not match")
    }
    if (!userRequest.old_password) {
      errors.value.push("Old Password is required to change password")
    }
  }

  // ✅ Validasi username & lainnya
  if (userRequest.username && userRequest.username.length > 20) {
    errors.value.push("Username must be less than 20 characters")
  }
  if (userRequest.full_name && userRequest.full_name.length > 50) {
    errors.value.push("Full name must be less than 50 characters")
  }
  if (userRequest.phone_number && userRequest.phone_number.length > 20) {
    errors.value.push("Phone number must be less than 20 characters")
  }

  if (errors.value.length > 0) {

    toast.add({
      title: "Gagal Simpan User ❌",
      description: errors.value.join(", "),
      color: "error"
    })
    return
  }

  // ✅ Submit ke backend (nanti pakai FormData)
  try { 
    loading.value = true
    const data = await updateProfile(userRequest as UserRequest)
    authStore.updateUserAuth(data)
    toast.add({
      title: "Berhasil Simpan User ✅",
      description: "Profil Anda telah diperbarui.",
      color: "success"
    })
    
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