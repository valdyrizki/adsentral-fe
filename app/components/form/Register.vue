<template>
  <div class="w-full brounded-lg md:mt-0 sm:max-w-md xl:p-0">
    <div class="space-y-4 md:space-y-6">
      <div>
        <label for="fullname" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nama Lengkap</label>
        <UInput v-model="registerRequest.full_name" id="fullname" placeholder="Nama lengkap Anda" class="block" size="lg"/>
      </div>

      <div>
        <label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Email</label>
        <UInput v-model="registerRequest.email" id="email" placeholder="Email Anda" class="block" size="lg"/>
      </div>

      <div>
        <label for="username" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Username</label>
        <UInput v-model="registerRequest.username" id="username" placeholder="Username Anda" class="block" size="lg"/>
      </div>

      <div>
        <label for="phone_number" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Nomor Telepon</label>
        <UInput v-model="registerRequest.phone_number" id="phone_number" placeholder="Nomor telepon Anda" class="block" size="lg"/>
      </div>

      <div>
        <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Kata Sandi</label>
        <UInput type="password" v-model="registerRequest.password" id="password" placeholder="Kata sandi Anda" class="block" size="lg"/>
      </div>

      <div>
        <label for="confirmPassword" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Konfirmasi Kata Sandi</label>
        <UInput type="password" v-model="confirmPassword" id="confirmPassword" placeholder="Ulangi kata sandi Anda" class="block" size="lg"/>
      </div>

      <UButton :loading="loading" type="submit" size="lg" class="w-full flex justify-center items-center" @click="handleRegister">
        Daftar
      </UButton>

      <p class="text-sm font-light text-gray-500 dark:text-gray-400">
        Sudah punya akun?
        <NuxtLink to="/login" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Masuk</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRuntimeConfig } from '#imports'
import { NuxtLink, UButton, UInput } from '#components'
import type { RegisterRequest } from '~/types/RegisterRequest'
import { useUserApi } from '~/composables/api/user'

const confirmPassword = ref('')

const registerRequest = reactive({
  username: '',
  email: '',
  password: '',
  full_name: null,
  phone_number: null
} as Partial<RegisterRequest>)
  

const router = useRouter()
const config = useRuntimeConfig()
const api = config.public.apiBase
const toast = useToast()
const errors = ref<string[]>([])
const {registerUser} = useUserApi()
const loading = ref<boolean>(false)

const emit = defineEmits(["register-success"])

const handleRegister = async () => {

  console.log(registerRequest);
  
  errors.value = []
  loading.value = true;

  if(registerRequest.full_name === '' || registerRequest.email === '' || registerRequest.password === ''){
    errors.value.push("All fields are required")
  }
  if (registerRequest.email && !/\S+@\S+\.\S+/.test(registerRequest.email)) {
    errors.value.push("Email is not valid")
  }
  if (registerRequest.password !== confirmPassword.value) {
    errors.value.push("Password and Confirm Password do not match")
  }

    if (errors.value.length > 0) {

    loading.value = false;
    toast.add({
      title: "Gagal Simpan User ❌",
      description: errors.value.join(", "),
      color: "error"
    })

    
    return
  }

  try {
    const response = await registerUser(registerRequest as RegisterRequest)

    console.log(response)
    toast.add({
      title: "Register Berhasil✅",
      description: "Anda telah berhasil mendaftar, silahkan login.",
      color: "success"
    })
    // router.push('/login') // arahkan ke login setelah daftar
    emit('register-success')
    navigateTo("/login")

  } catch (e:any) {
    console.log(e)
    toast.add({
      title: "Gagal Register ❌",
      description: e.message || 'Failed to register',
      color: "error"
    })
  } finally {
    loading.value = false
  }
}
</script>