<template>
    <div class="w-full brounded-lg md:mt-0 sm:max-w-md xl:p-0">
        <form class="space-y-4 md:space-y-6" action="#">
            <div>
                <label for="amount" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Jumlah Saldo</label>
                <UInputCurrency
                  v-model="amount"
                  label="Harga Jual"
                  id="sell_price"
                  name="sell_price"
                  class="block w-full text-base text-gray-900"
                />       
            </div>
            <div>
                <!-- Payment Method  -->
                <label for="payment_method" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Payment Method</label>
                <USelect v-model="cartStore.payment_method" :items="items" arrow class="w-full justify-center" size="xl" open-on-focus  />
            </div>
            <!-- <button type="submit" @click.prevent="doLogin" class="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">Sign in</button> -->
            <UButton type="submit" size="lg" class="w-full flex justify-center items-center" :loading="loading" @click.prevent="doLogin">
                Tarik Dana
            </UButton>
        </form>

    </div>
</template>

<script setup lang="ts">
import { useToast } from "#imports" // Nuxt UI toast

    const cartStore = useCartStore()


    const email = ref<string>('');
    const password = ref<string>('');
    const loading = ref<boolean>(false)
    const amount = ref<number>(200000)
    const items = ref(['QRIS', 'MANUAL_BANK'])

    const toast = useToast()

    const emit = defineEmits(["withdrawal-success"])

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
        emit('withdrawal-success')
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