<template>
  <div>
    <div class="mx-auto max-w-7xl py-4 px-4 xl:px-0">
      <div class="px-4 sm:px-0">
        <UBreadcrumb :items="breadcrumb" class="mb-3" />
        <h1 class="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">Riwayat Transaksi</h1>
        <p class="mt-2 text-sm text-gray-500">Pantau status pesanan, ajukan pembatalan, dan lihat detail transaksi Anda.</p>
      </div>

      <ClientOnly>
        <template #fallback>
          <div class="mt-16 p-6"><AppLoadingSkeleton /></div>
        </template>
        <div class="mt-16">
        <h2 class="sr-only">Recent orders</h2>

        <div class="space-y-16 sm:space-y-24">
          <div class="bg-gray-100">
            
            <!-- LOADING -->
            <div v-if="loading" class="p-6">
              <AppLoadingSkeleton/>
            </div>

            <!-- ERROR -->
            <div v-else-if="error" class="p-6">
              <UAlert
                title="Terjadi Kesalahan"
                :description="error"
                icon="mdi:alert-circle:error"
                color="error"
              />
            </div>

            <!-- EMPTY -->
            <div v-else-if="transactionPagination?.content.length === 0" class="p-6">
              <UAlert
                title="Belum ada transaksi"
                description="Transaksi anda akan muncul di sini"
                icon="lucide:history"
                color="neutral"
              />
            </div>

             <!-- DATA -->
            <div v-else>
              <div class="flex justify-between items-center p-4 sm:px-6 lg:px-8">
                <h2 class="text-2xl font-bold tracking-tight text-gray-900">Riwayat Saldo</h2>
                <div>
                  <USelect v-model="perPageValue" :items="perPageItems" />
                </div>
              </div>
              <USeparator />
              <div v-for="transaction in transactionPagination?.content" :key="transaction.id" class="flex border-b border-gray-200 px-4 py-6 sm:px-6 lg:px-8">
                <div class="flex flex-row gap-4 w-full">
                  <div class="flex-none">
                    <div class=" sm:order-first">
                      <img :src="getImageUrl(transaction.product?.banner_url)" :alt="transaction.product.name" class=" size-40 rounded-lg object-cover " />
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
                          <p class="text-gray-900">{{ transaction.product.name }}</p>
                        </div>
                    </div>

                      <!-- Konten bawah yang akan didorong ke bawah -->
                      <div class="mt-auto flex flex-col sm:flex-row gap-1 sm:gap-4 pt-4 sm:pt-0"> <!-- Gunakan 'mt-auto' untuk mendorong ke bawah -->
                        <div class="flex flex-row gap-1">
                          <UIcon name="fa6-solid:rupiah-sign" class="size-5 text-gray-400" />
                          <div class="font-medium">
                            {{ transaction.price.toLocaleString('id-ID') }} x {{ transaction.qty }} = Rp. {{ transaction.total_price.toLocaleString('id-ID') }}
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

                      <TransactionStatusBadge :status="transaction?.status" />                
                      <UButton icon="uiw:message" size="xs" color="primary" variant="outline" @click="openChatHandler(transaction)">Chat Penjual</UButton>
                      <UButton v-if="transaction.status === 'DONE' || transaction.status === 'COMPLETE'" icon="mdi:cart-outline" color="primary" variant="soft" size="xs" @click="addToCart">Beli Lagi</UButton>
                      <UButton v-if="transaction.status === 'UNPAID' && transaction.payment_id" :to="`/payment/${transaction.payment_id}`" icon="mdi:credit-card-outline" color="warning" variant="solid" size="xs">Lakukan Pembayaran</UButton>
                      <UButton v-if="transaction.status === 'UNPAID'" icon="material-symbols:cancel" color="error" variant="soft" size="xs" @click="addToCart">Batalkan</UButton>
                      <UButton v-if="transaction.status === 'DELIVERED' || transaction.status === 'DONE' " icon="material-symbols:help-outline-rounded" color="error" variant="solid" size="xs" @click="addToCart">Tangguhkan</UButton>

                    </div> 
                  
                  </div>
                </div>
              </div>

              <!-- Pagination -->
              <div v-if="transactionPagination &&  !loading" class="flex justify-center items-center p-4">
                <UPagination
                  :page="page + 1"
                  :total="transactionPagination.total_elements"
                  :items-per-page="perPageValue"
                  :sibling-count="1"
                  show-edges
                  @update:page="onPageChange"
                />
              </div>

            </div>


          </div>
        </div>
      </div>
      </ClientOnly>
    </div>
  </div>

  <ChatModalBuyer
    v-model="isChatOpen"
    :transaction="selectedTransaction"
    :merchant-id="selectedTransaction?.product.merchant_id"
  />
</template>

<script setup lang="ts">
  import dayjs from 'dayjs'
  import TransactionStatusBadge from '~/components/app/TransactionStatusBadge.vue'
  import ChatModalBuyer from '~/components/form/ChatModalBuyer.vue'
  import { useTransactionApi } from '~/composables/api/transaction'
  import type { PageResponse } from '~/types/PageResponse'
  import type { TransactionResponse } from '~/types/TransactionResponse'


// Ambil API function
  const { fetchBuyerTransactions } = useTransactionApi()

const breadcrumb = [
  { label: 'Home', icon: 'i-lucide-home', to: '/' },
  { label: 'Riwayat Transaksi', icon: 'i-heroicons-shopping-bag' },
]

// Reactive state
  const error = ref<string | null | any >(null)
  const isChatOpen = ref(false)
  const selectedTransaction = ref()
  
  //paging ref
  const page = ref(0)
  const perPageValue = ref<number>(10)
  const perPageItems = ref<number[]>([5, 10, 25, 50, 100])

  // ✅ SSR SAFE FETCH NEW
  const { 
    data: transactionPagination, 
    pending:loading, 
    error:errorTransactionPagination, 
    refresh:refreshTransactionPagination } 
    = await useAsyncData<PageResponse<TransactionResponse>>(
    `transaction-page-${perPageValue.value}-${page.value}`,
    () => fetchBuyerTransactions(page.value, perPageValue.value),
    {
      watch: [page, perPageValue], // Refetch saat page atau perPageValue berubah
      server: false, // Hanya fetch di client
    }
  )


  const addToCart = () => {
    alert('Add to cart clicked!')
  }

  const openChatHandler = (transaction: TransactionResponse) => {
    isChatOpen.value = true
    selectedTransaction.value = transaction
    console.log("openChatHandler called with transaction:", transaction);
    
  }

  //PAGINATION HANDLER
  const onPageChange = (newPage: number) => {
    page.value = newPage - 1
  }
</script>