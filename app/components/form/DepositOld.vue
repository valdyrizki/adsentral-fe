<template>
    <div class="w-full brounded-lg md:mt-0 sm:max-w-md xl:p-0">
        <form class="space-y-4 md:space-y-6" action="#">
            <div>
                <label for="amount" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Jumlah Topup</label>
                <UInputCurrency
                  type="text"
                  v-model="amount"
                  label="Harga Jual"
                  id="sell_price"
                  name="sell_price"
                  class="block w-full text-base text-gray-900"
                />       
            </div>

            <PaymentMethodSelector
              v-model="selectedPayment"
              :methods="paymentMethod"
              type="deposit"
              
            />

            <UButton type="submit" size="lg" class="w-full flex justify-center items-center" :loading="loading" @click.prevent="doDeposit">
              Deposit
            </UButton>
        </form>

    </div>
</template>

<script setup lang="ts">
import { useToast } from "#imports" // Nuxt UI toast
import { useBalanceApi } from "~/composables/api/balance"
import { usePaymentMethodApi } from "~/composables/api/payment-method"
import PaymentMethodSelector from "../u/PaymentMethodSelector.vue"
import type { DepositRequest } from "~/types/balance/DepositRequest"

  // store  
  const authStore  = useAuthStore()

  // Reactive state
  const loading = ref<boolean>(false)
  const amount = ref<number>(200000)
  const selectedPayment = ref<string>('QRIS')
  const toast = useToast()
  const emit = defineEmits(["deposit-success"])
  const error = ref<string[] | null >(null)

  //fetch
  const { fetchDepositBalance  } = useBalanceApi()
  const { fetchPaymentMethod, paymentMethod } = usePaymentMethodApi()

    const doDeposit = async() =>{
      loading.value = true;
      try {

        const request : DepositRequest = {
          amount: amount.value,
          payment_method: selectedPayment.value
        }

        await fetchDepositBalance(request)
        toast.add({
        title: "Deposit Berhasil 🎉",
        description: "Silahkan lakukan pembayaran.",
        color: "success"
      })
      // authStore.restoreAuth()
      emit('deposit-success')
      navigateTo("/balance")
      
        // simpan token di cookie / localStorage / useState
      } catch (err : any) {
        console.error('Deposit gagal:', err.response._data.errors.amount || err.response._data.message || err.message || err)
        
        toast.add({
          title: "Deposit Gagal ❌",
          description: err.response._data.errors.amount || err.response._data.message || "Periksa kembali jumlah dan metode pembayaran",
          color: "error"
        })
      } finally {
        loading.value = false
      }
    }


onMounted(async () => {
  await fetchPaymentMethod()
})

</script>