<script setup>
import { ref } from 'vue'
import { useRouter, useRuntimeConfig } from '#imports'

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const router = useRouter()
const config = useRuntimeConfig()
const api = config.public.apiBase

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    alert("Password dan Konfirmasi Password tidak sama!")
    return
  }

  try {
    const response = await $fetch(api + '/user/register', {
      method: 'POST',
      body: {
        name: name.value,
        email: email.value,
        password: password.value
      }
    })

    console.log(response.data)

    // Simpan token (kalau API return token setelah register)
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token)
    }

    alert("Registrasi berhasil!")
    router.push('/login') // arahkan ke login setelah daftar

  } catch (e) {
    console.log(e)
    alert("Terjadi kesalahan saat registrasi")
  }
}
</script>

<template>
  <div class="w-full brounded-lg md:mt-0 sm:max-w-md xl:p-0">
    <form class="space-y-4 md:space-y-6" @submit.prevent="handleRegister">
      <div>
        <label for="name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Full Name</label>
        <input v-model="name" type="text" id="name" name="name" placeholder="Your Name"
          class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 
          focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 
          dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
      </div>

      <div>
        <label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your Email</label>
        <input v-model="email" type="email" id="email" name="email" placeholder="name@company.com"
          class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 
          focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 
          dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
      </div>

      <div>
        <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
        <input v-model="password" type="password" id="password" name="password" placeholder="••••••••"
          class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 
          focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 
          dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
      </div>

      <div>
        <label for="confirmPassword" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Confirm Password</label>
        <input v-model="confirmPassword" type="password" id="confirmPassword" name="confirmPassword" placeholder="••••••••"
          class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 
          focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 
          dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
      </div>

      <button type="submit"
        class="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none 
        focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center 
        dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">
        Sign up
      </button>

      <p class="text-sm font-light text-gray-500 dark:text-gray-400">
        Already have an account? 
        <a href="/login" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Sign in</a>
      </p>
    </form>
  </div>
</template>
