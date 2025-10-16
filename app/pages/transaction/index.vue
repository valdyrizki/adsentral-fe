<template>
  <div>
    <div class="mx-auto max-w-7xl py-4 px-4 xl:px-0">
      <div class="px-4 sm:px-0">
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Order history</h1>
        <p class="mt-2 text-sm text-gray-500">Check the status of recent orders, manage returns, and download invoices.</p>
      </div>

      <div class="mt-16">
        <h2 class="sr-only">Recent orders</h2>

        <div class="space-y-16 sm:space-y-24">
          <div class="bg-gray-100">
            <div v-for="transaction in transactionPagination?.content" :key="transaction.id" class="flex border-b border-gray-200 px-4 py-6 sm:px-6 lg:px-8">
              <div class="flex flex-row gap-4 w-full">
                <div class="flex-none">
                  <div class=" sm:order-first">
                    <img :src="transaction.product.banner_url" :alt="transaction.product.name" class=" size-40 rounded-lg object-cover " />
                  </div>
                </div>
                  <div class="flex-grow flex flex-col">
                    <!-- Konten atas yang akan memenuhi ruang -->
                    <div class="flex flex-col gap-1">

                      <NuxtLink :to="`/transaction/${transaction.id}`" class="font-medium text-gray-900">#{{ transaction.id }}</NuxtLink>

                      <div class="flex flex-row gap-2">
                        <div class="basis-auto">
                          <UAvatar
                          src="https://github.com/benjamincanac.png"
                          :chip="{
                            inset: true,
                            color: 'success'
                          }"
                          size="xs"
                        />
                      </div>
                      <NuxtLink :to="`/merchant/${transaction.product.merchant_id}`">{{ transaction.product.merchant_name }}</NuxtLink>
                    </div>
                    <div>
                      <h3 class="text-lg font-medium text-gray-900">{{ transaction.product.name }}</h3>
                    </div>
                  </div>

                    <!-- Konten bawah yang akan didorong ke bawah -->
                    <div class="mt-auto flex flex-col sm:flex-row gap-1 sm:gap-4 pt-4 sm:pt-0"> <!-- Gunakan 'mt-auto' untuk mendorong ke bawah -->
                      <div class="flex flex-row gap-1">
                        <UIcon name="fa6-solid:rupiah-sign" class="size-5 text-gray-400" />
                        <div class="font-medium">
                          {{ transaction.price.toLocaleString('id-ID') }}
                        </div>
                      </div>

                      <div class="col-span-3 flex flex-row gap-1">
                        <UIcon name="mdi:calendar" class="size-5 text-gray-400" />
                        <div class="font-medium">
                          {{ dayjs(transaction.created_at).format("YYYY-MM-DD HH:mm:ss")}}
                        </div>
                      </div>
                    </div>
                </div>
                <div class="ml-auto flex-none">   
                  <div class="flex flex-col gap-2 items-end">

                    <UBadge icon="material-symbols:check" size="lg" color="primary" variant="solid" :label="transaction.status" />
                    <UButton icon="uiw:message" size="xs" color="primary" variant="outline">Chat Penjual</UButton>
                    <UButton icon="mdi:cart-outline" color="primary" variant="soft" size="xs" @click="addToCart">Beli Lagi</UButton>
                    <UButton icon="material-symbols:cancel" color="error" variant="soft" size="xs" @click="addToCart">Batalkan</UButton>
                    <UButton icon="material-symbols:help-outline-rounded" color="error" variant="solid" size="xs" @click="addToCart">Tangguhkan</UButton>

                  </div> 
                 
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { useTransactionApi } from '~/composables/api/transaction'
import type { PageResponse } from '~/types/PageResponse'
import type { TransactionResponse } from '~/types/TransactionResponse'



// Ambil API function
const { getBuyerTransactions } = useTransactionApi()

// Reactive state
const loading = ref<boolean>(true)
const error = ref<string | null | any >(null)
const transactionPagination = ref<PageResponse<TransactionResponse[]>>()


  // fungsi Fetch data di server-side (Nuxt auto-handle hydration)
  try { 
    loading.value = true
    transactionPagination.value = await getBuyerTransactions() // page=0, size=10
  } catch (err: any) {
    error.value = err.statusMessage || 'Failed to load transactions'
  } finally {
    loading.value = false
  }


  const addToCart = () => {
    alert('Add to cart clicked!')
  }
</script>