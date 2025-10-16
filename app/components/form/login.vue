<template>
    <div class="w-full brounded-lg md:mt-0 sm:max-w-md xl:p-0">
        <form class="space-y-4 md:space-y-6" action="#">
            <div>
                <label for="email" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your email</label>
                <input v-model="email" type="email" name="email" id="email" class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="name@company.com">
            </div>
            <div>
                <label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Password</label>
                <input type="password"  v-model="password" name="password" id="password" placeholder="••••••••" class="bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
            </div>
            <div class="flex items-center justify-between">
                <div class="flex items-start">
                    <div class="flex items-center h-5">
                        <input id="remember" aria-describedby="remember" type="checkbox" class="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800">
                    </div>
                    <div class="ml-3 text-sm">
                        <label for="remember" class="text-gray-500 dark:text-gray-300">Remember me</label>
                    </div>
                </div>
                <a href="#" class="text-sm font-medium hover:underline dark:text-primary-500">Forgot password?</a>
            </div>
            <!-- <button type="submit" @click.prevent="doLogin" class="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">Sign in</button> -->
            <UButton type="submit" size="lg" class="w-full flex justify-center items-center" :loading="loading" @click.prevent="doLogin">
                Sign in
            </UButton>
            
            <p class="text-sm font-light text-gray-500 dark:text-gray-400">
                Don’t have an account yet? <NuxtLink to="/register" class="font-medium text-primary-600 hover:underline dark:text-primary-500">Sign up</NuxtLink>
            </p>
        </form>

    </div>
</template>

<script setup lang="ts">
import { useToast } from "#imports" // Nuxt UI toast

  const email = ref<string>('');
  const password = ref<string>('');
  const loading = ref<boolean>(false)

  const toast = useToast()

  const emit = defineEmits(["login-success"])

  const authStore  = useAuthStore()

  const doLogin = async() =>{
    loading.value = true;
    try {
      await authStore.authLogin(email.value,password.value)      
      toast.add({
        title: "Login Berhasil 🎉",
        description: "Anda akan diarahkan ke dashboard...",
        color: "success"
      })
      authStore.restoreAuth()
      emit('login-success')
      navigateTo("/")
      
      
    // simpan token di cookie / localStorage / useState
    } catch (err) {
      console.error('Login gagal:', err)
      toast.add({
        title: "Login Gagal ❌",
        description: "Periksa kembali email dan password",
        color: "error"
      })
    } finally {
      loading.value = false
    }
  }

    

</script>