<template>
  <UCard class="col-span-2">
    <div class="text-2xl">Filters</div>
    <div class="flex gap-4 mt-2">
      <div>
        <div class="text-sm text-gray-500">Per Page</div>
        <UInputMenu v-model="perPageValue" :items="perPageItems" @change="handleSearchEnter" />
      </div>
      <div>
        <div class="text-sm text-gray-500">Search</div>
        <UInput
          v-model="search"
          icon="mdi:magnify"
          placeholder="Cari produk..."
          @keyup.enter="handleSearchEnter"
        />
      </div>
    </div>
  </UCard>

  <!-- Chart example -->
  <ClientOnly>
    <template #fallback>
      <div class="mt-6">
        <UCard>
          <template #header><USkeleton class="h-5 w-32 rounded" /></template>
          <div v-for="i in 5" :key="i" class="flex items-center gap-4 py-4 px-2 border-b border-gray-100">
            <USkeleton class="w-40 h-40 rounded-lg flex-none" />
            <div class="flex-1 space-y-2">
              <USkeleton class="h-4 w-32 rounded" />
              <USkeleton class="h-4 w-48 rounded" />
            </div>
          </div>
        </UCard>
      </div>
    </template>
  <div class="mt-6">
    <UCard>
      <template #header>
        <div class="text-lg font-semibold">List Pesanan</div>
      </template>
      <div class="grid grid-cols-1 gap-4">
        
        <div v-if="pending">
            <AppLoadingSkeleton/>
        </div>
        <div v-else-if="error">
          <UAlert
              title="Terjadi Kesalahan"
              :description="error.message  || 'Gagal memuat data pesanan'"
              icon="mdi:alert-circle:error"
              color="error"
            />
        </div>
        <div v-else-if="transactionPagination?.content?.length == 0">
          <UAlert
              title="Anda belum mempunyai pesanan"
              description=""
              icon="imdi:tag-off-outline"
              color="neutral"
            />
        </div>
        <div v-else>
          <div v-for="tx in transactionPagination?.content" :key="tx.id" class="border-b border-gray-200 p-2 m-2">
            <div class="flex flex-row gap-4 w-full">
              <div class="flex-none">
                <div class=" sm:order-first">
                  <img :src="getImageUrl(tx.product?.banner_url)" :alt="tx.product?.name" class=" size-40 rounded-lg object-cover " />
                </div>
              </div>
                <div class="flex-grow flex flex-col">
                  <!-- Konten atas yang akan memenuhi ruang -->
                  <div class="flex flex-col gap-1">
                    <div class="flex flex-row gap-2">
                      <NuxtLink :to="`/seller/order/${tx.id}`" class="font-medium text-gray-900">ID : #{{ tx.id }}</NuxtLink>
                    </div>
                  <div>
                    <h3 class="text-lg font-medium text-gray-900">{{ tx.product.name }}</h3>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ tx.qty }} pcs x {{ tx.price.toLocaleString('id-ID') }}</p>
                  </div>
                </div>

                  <!-- Konten bawah yang akan didorong ke bawah -->
                  <div class="mt-auto flex flex-col sm:flex-row gap-1 sm:gap-4 pt-4 sm:pt-0"> <!-- Gunakan 'mt-auto' untuk mendorong ke bawah -->
                    <div class="flex flex-row gap-1">
                      <UIcon name="fa6-solid:rupiah-sign" class="size-5 text-gray-400" />
                      <div class="font-medium">
                        {{ tx.total_price.toLocaleString('id-ID') }}
                      </div>
                    </div>

                    <div class="col-span-3 flex flex-row gap-1">
                      <UIcon name="mdi:calendar" class="size-5 text-gray-400" />
                      <div class="font-medium">
                        {{ dayjs(tx.created_at).format("YYYY-MM-DD HH:mm:ss")}}
                      </div>
                    </div>

                    <!-- TERJUAL -->
                    <div class="col-span-3 flex flex-row gap-1">
                      <UIcon name="mdi:cart" class="size-5 text-gray-400" />
                      <div class="font-medium">
                        {{ tx.product.sold }} Terjual
                      </div>
                    </div>
                  </div>
              </div>
              <div class="ml-auto flex-none">   
                <div class="flex flex-col gap-2 items-end">
                  
                  <TransactionStatusBadge :status="tx.status" />
                  <UButton v-if="tx.status === 'PAID'" icon="mdi:check-circle" size="xs" color="info" variant="solid" @click="handleConfirmOrder(tx.id)" :loading="acceptingId === tx.id" >Terima Pesanan</UButton>

                  <UButton
                    v-if="tx.status === 'PAID'"
                    icon="mdi:close-circle"
                    size="xs"
                    color="error"
                    variant="solid"
                    :loading="rejectingId === tx.id"
                    @click="openRejectModal(tx.id)"
                  >
                    Tolak Pesanan
                  </UButton>

                  <UButton v-if="tx.status === 'INACTIVE'" icon="mdi:check-circle" size="xs" color="info" variant="solid" >Aktifkan Product</UButton>
                  <UButton v-if="tx.status === 'ACTIVE'" icon="mdi:delete" size="xs" color="error" variant="solid" >Tangguhkan Product</UButton>
                </div> 
                
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="transactionPagination && transactionPagination.total_pages > 1 && !pending" class="flex justify-center items-center pt-4">
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
    </UCard>
  </div>
  </ClientOnly>

  <RejectTxModal
    v-model="isRejectingTxModal"
    :loading="rejectingTxId === selectedTxId"
    :error="rejectTxError"
    @submit="handeRejectTxSubmit"
  />



</template>

<script lang="ts" setup>
  definePageMeta({
    layout: "seller",
    label: "Orders",
    // middleware: ["auth", "seller-only"] // opsional kalau mau validasi role
  })

  import dayjs from 'dayjs';
  import TransactionStatusBadge from '~/components/app/TransactionStatusBadge.vue';
  import RejectTxModal from '~/components/form/RejectTxModal.vue';
  import { useTransactionApi } from '~/composables/api/transaction'
  import type { PageResponse } from '~/types/PageResponse';
  import type { TransactionResponse } from '~/types/TransactionResponse';

  // State 
  const selectedTxId = ref<string | null>(null)
  const rejectingId  = ref<string | null>(null) //untuk fungsi loading button
  const isRejectingModal = ref<boolean>(false)

  //rejecting modal
  const rejectingTxId  = ref<string | null>(null)
  const isRejectingTxModal = ref<boolean>(false)
  const rejectTxError = ref<string | null>(null)

  // Ambil API function
  const { fetchTxSeller, fetchConfirmTx, fetchRejectTx } = useTransactionApi()

  // FILTER STATE
  const page = ref(0)
  const perPageItems = [5, 10, 25, 50]
  const perPageValue = ref(5)
  const keyword = ref('')

  const search = ref('')

  // 🔥 SEARCH DEBOUNCE
  let searchTimeout: NodeJS.Timeout | null = null

  // ✅ SSR SAFE FETCH NEW
  const { 
    data: transactionPagination, 
    pending:pending, 
    error, 
    refresh } 
    = await useAsyncData<PageResponse<TransactionResponse>>(
    'my-tx-seller', () => fetchTxSeller(page.value, perPageValue.value, search.value),
    {
      watch: [page, perPageValue, keyword],
      server: false, // Hanya fetch di client
    }
  )

  watch(search, () => {
    if (searchTimeout) clearTimeout(searchTimeout)
    
    searchTimeout = setTimeout(() => {
      page.value = 0
      refresh()
    }, 800)
  })

  const handleSearchEnter = () => {
    if (searchTimeout) clearTimeout(searchTimeout)
    page.value = 0
    refresh()
  }

  const acceptingId = ref<string | null>(null) //untuk fungsi loading button
  const handleConfirmOrder = async (txId: string) => {
    try {
      acceptingId.value = txId //untuk fungsi loading button
      await fetchConfirmTx(txId)
      useToast().add({
        title: 'Berhasil',
        description: 'Pesanan berhasil diterima',
        color: 'success'
      })
      refresh()
    } catch (err) {
      console.error('Failed to confirm order:', err)
    }finally {
      acceptingId.value = null //untuk fungsi loading button
    }
  }
  

  const handleReject = async (reason: string) => {
    if (!selectedTxId.value) return

    try {
      rejectingId.value = selectedTxId.value

      await fetchRejectTx(selectedTxId.value as string, reason)

      useToast().add({
        title: 'Berhasil',
        description: 'Pesanan berhasil ditolak',
        color: 'success'
      })

      isRejectingModal.value = false
      selectedTxId.value = null

      await refresh()

    } catch (err: any) {
      useToast().add({
        title: 'Gagal',
        description: err.message || 'Gagal menolak pesanan',
        color: 'error'
      })
    } finally {
      rejectingId.value = null
    }
  }

  const onPageChange = (newPage: number) => {
    page.value = newPage - 1
  }

  const openRejectModal = (txId: string) => {
    console.log('OPEN MODAL', txId)
    selectedTxId.value = txId
    isRejectingTxModal.value = true
  }

  const handeRejectTxSubmit = async (reason: string) => {
    if (!selectedTxId.value) return

    try {
      rejectingTxId.value = selectedTxId.value

      await fetchRejectTx(selectedTxId.value as string, reason)

      useToast().add({
        title: 'Berhasil',
        description: 'Pesanan berhasil ditolak',
        color: 'success'
      })

      isRejectingTxModal.value = false
      selectedTxId.value = null

      await refresh()

    } catch (err: any) {
      useToast().add({
        title: 'Gagal',
        description: err.message || 'Gagal menolak pesanan',
        color: 'error'
      })
    } finally {
      rejectingTxId.value = null
    }
  }



</script>

<style>

</style>