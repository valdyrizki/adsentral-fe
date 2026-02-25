<template>
  <div class="bg-white">
    <div class="mx-auto max-w-2xl px-2 pt-4 pb-4 lg:max-w-7xl lg:px-4">
      <h1 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Saldo User</h1>
      <div class="mt-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
        <section aria-labelledby="cart-heading" class="lg:col-span-4">

          <UCard class="overflow-hidden rounded-2xl shadow-lg">
            <!-- HEADER (Warna 1 - Gradient) -->
            <div class="bg-gradient-to-r from-primary-500 to-primary-700 p-6 text-white border rounded-2xl">
              <div class="flex justify-between">
                <p class="text-center">                         
                <UIcon name="mdi:dollar" class="size-5" />
                Saldo Efektif
              </p> 
              <UButton size="xs" label="Refresh" icon="mdi:refresh" color="neutral" variant="outline" @click="refreshBalance()" />
              </div>
              <div>
                <h2 v-if="balanceLoading" class="text-3xl font-bold mt-1">
                  <USkeleton class="h-10 w-50 mb-2 rounded-lg bg-gray-300" />
                </h2>
                <h2 v-else="balanceLoading" class="text-3xl font-bold mt-1">
                  {{ formatRupiah(balance) }}
                </h2>
              </div>
              <div class="flex flex-row gap-4 justify-items-center mt-4">
                <div>
                  <UButton size="xl" label="Tarik" icon="mdi:cash-minus" color="neutral" variant="outline" @click="isWithdrawalModalOpen = true" />
                  <UModal v-model:open="isWithdrawalModalOpen" title="Tarik">
                    <template #body>
                      <FormWithdrawal @withdrawal-success="handleWithdrawalSuccess" />
                    </template>
                  </UModal>
                </div>
                <div>
                  <UButton size="xl" label="Deposit" icon="mdi:cash-plus" color="neutral" variant="outline" @click="isDepositModalOpen = true" />
                  <UModal v-model:open="isDepositModalOpen" title="Deposit">
                    <template #body>
                      <FormDeposit @deposit-success="handleDepositSuccess" />
                    </template>
                  </UModal>
                </div>    
              </div> 
            </div>
  
          </UCard>

        </section>

        <!-- Order summary -->
        <section aria-labelledby="summary-heading" class="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-8 lg:mt-0 lg:p-8">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold tracking-tight text-gray-900">Riwayat Saldo</h2>
            <div>
              <USelect v-model="perPageValue" :items="perPageItems" />

            </div>
          </div>
          <USeparator class="mt-2"/>

          <!-- LOADING -->
          <div v-if="balanceLoading" class="p-6">
            <AppLoadingSkeleton/>
          </div>

          <!-- ERROR -->
          <div v-else-if="error" class="p-6">
            <UAlert
              title="Terjadi Kesalahan"
              :description="error"
              icon="icon-park-solid:error"
              color="error"
            />
          </div>

          <!-- EMPTY -->
          <div v-else-if="!depositHistory?.content?.length" class="p-6">
            <UAlert
              title="Belum ada transaksi"
              description="Transaksi anda akan muncul di sini"
              icon="ix:anomaly-found"
              color="neutral"
            />
          </div>

          <!-- DATA -->
          <div v-else>
            <div v-for="deposit in depositHistory?.content" :key="deposit.id" class="flex border-b border-gray-200 px-4 py-6 sm:px-6 lg:px-8">
              <div class="flex flex-row gap-4 w-full">
                <div class="flex-grow flex flex-col">
                  <!-- Konten atas yang akan memenuhi ruang -->
                  <div class="flex flex-col gap-1">
                    <div>
                      <UBadge class="bg-success" label="DEPOSIT" />
                    </div>
                    <div class="flex flex-row gap-2">
                      <!-- <NuxtLink :to="`/transaction/${deposit.id}`" class="font-medium text-gray-900">#{{ deposit.payment_id }}</NuxtLink> -->
                      <p :to="`/transaction/${deposit.id}`" class="font-medium text-gray-900">#{{ deposit.payment_id }}</p>

                    </div>
                  </div>

                  <!-- Konten bawah yang akan didorong ke bawah -->
                  <div class="mt-auto flex flex-col sm:flex-row gap-1 sm:gap-4 pt-4 sm:pt-0"> <!-- Gunakan 'mt-auto' untuk mendorong ke bawah -->
                    <div class="flex flex-row gap-1">
                      <UIcon name="fa6-solid:rupiah-sign" class="size-5 text-gray-400" />
                      <div class="font-medium">
                        {{ deposit.amount.toLocaleString('id-ID') }}
                      </div>
                    </div>

                    <div class="col-span-3 flex flex-row gap-1">
                      <UIcon name="mdi:calendar" class="size-5 text-gray-400" />
                      <div class="font-medium">
                        {{ dayjs(deposit.created_at).format("YYYY-MM-DD HH:mm:ss")}}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="ml-auto flex-none">   
                  <div class="flex flex-col gap-2 items-end">
                    <PaymentStatusBadge :status="deposit?.status" class="mb-2" />                
                    <UButton v-if="deposit.status === 'DONE' || deposit.status === 'COMPLETE'" icon="mdi:cart-outline" color="primary" variant="soft" size="xs" @click="addToCart">Beli Lagi</UButton>
                    <UButton v-if="deposit.status === 'UNPAID'" icon="mdi:payment" color="primary" variant="soft" size="xs" @click="addToCart">Bayar</UButton>
                    <UButton v-if="deposit.status === 'UNPAID'" icon="material-symbols:cancel" color="error" variant="soft" size="xs" @click="cancelHandle">Batalkan</UButton>

                  </div> 
                </div>
              </div>
            </div>
          </div>


        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import dayjs from 'dayjs'
  import PaymentStatusBadge from '~/components/app/PaymentStatusBadge.vue'
  import { useBalanceApi } from '~/composables/api/balance'


  // Ambil API function

  // Reactive state
  const error = ref<string | null | any >(null)
  const perPageValue = ref<number>(10)
  const perPageItems = ref<number[]>([10, 25, 50, 100])
  const isWithdrawalModalOpen = ref(false)
  const isDepositModalOpen = ref(false)

  //fetch
  const { fetchDepositHistory,fetchBalance,balance,balanceHeld,depositHistory, balanceLoading  } = useBalanceApi()

  // onMounted(() => {
  //   fetchBalance()
  //   fetchDepositHistory()
  // })

await useAsyncData('balance-data', async () => {
  await Promise.all([
    fetchBalance(),
    fetchDepositHistory()
  ])
})

  const refreshBalance = async () => {
    try {
      await fetchBalance()
      await fetchDepositHistory()
    } catch (err) {
      console.error('Failed to refresh balance', err)
    }
  }

  //Ambil config
  const config = useRuntimeConfig()

  const handleWithdrawalSuccess = () => {
    isWithdrawalModalOpen.value = false
  }

  const handleDepositSuccess = () => {
    isDepositModalOpen.value = false
  }

  const addToCart = () => {
    alert('Add to cart clicked!')
  }

const formatRupiah = (val:any) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(val)
}

const cancelHandle = () => {
  alert('Cancel clicked!')
}

</script>