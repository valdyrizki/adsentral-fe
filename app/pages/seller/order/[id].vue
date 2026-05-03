<template>
  <!-- Back Button and Title Section  -->
  <div class="max-w-xl flex gap-2 ">
    <NuxtLink class="text-base font-medium flex items-center gap-1" to="/seller/order">
      <UIcon name="mdi:arrow-left" class="size-5 text-gray-400" />
      Kembali
    </NuxtLink>
    <h1 class="text-base font-medium ">|</h1>
    <h1 class="text-base font-medium ">Order Detail</h1>
  </div>

  <!-- Loading -->
  <div v-if="pending">
    <AppLoadingSkeleton/>
  </div>

  <section v-else aria-labelledby="order-heading" class="mt-4 ">
    <div class="flex flex-col sm:flex-row gap-4 w-full bg-gray-100 p-2 rounded-lg overflow-hidden">
      
      <!-- Product Image   -->
      <div class="flex-none mx-auto">
        <NuxtLink :to="`/product/${transaction?.product.id}`" class=" sm:order-first text-center">
          <img :src="config.public.backendUrl +'/'+ transaction?.product?.banner_url" :alt="transaction?.product.name" class=" size-40 rounded-lg object-cover " />
        </NuxtLink>
      </div>

      <!-- Detail Order   -->
      <div class="flex-grow flex flex-col ">
        <!-- Konten atas yang akan memenuhi ruang -->
        <div class="flex flex-col gap-1">
          <div>
            <TransactionStatusBadge :status="transaction?.status" />
          </div>
          
          <div class="flex flex-row gap-2">
            <div class="basis-auto">
              <UAvatar
              src="https://picsum.photos/500/500?random=1"
              :chip="{
                inset: true,
                color: 'success'
              }"
              size="xs"
            />
            </div>
            <NuxtLink :to="`/profile/${transaction?.buyer_id}`">{{ transaction?.buyer_username }}</NuxtLink>
          </div>
          <div>
            <NuxtLink :to="`/product/${transaction?.product.id}`" class="text-lg font-medium text-gray-900">{{ transaction?.product.name }}</NuxtLink>
          </div>
          <div>
            <p class="text-sm">Jumlah Pembelian : {{ transaction?.qty }} Pcs</p>
          </div>
        </div>

          <!-- Konten bawah yang akan didorong ke bawah -->
          <div class="mt-auto flex gap-1 sm:gap-4 pt-4 sm:pt-0"> <!-- Gunakan 'mt-auto' untuk mendorong ke bawah -->
            <div class="flex flex-row gap-1 items-center">
              <UIcon name="fa6-solid:rupiah-sign" class="size-3 text-gray-400" />
              <div class="text-xs">
                {{ transaction?.price.toLocaleString('id-ID') }} x {{ transaction?.qty }} = {{ transaction?.total_price.toLocaleString('id-ID')  }}
              </div>
            </div>

            <div class="col-span-3 flex flex-row gap-1 items-center">
              <UIcon name="mdi:calendar" class="size-3 text-gray-400" />
              <div class="text-xs">
                {{ dayjs(transaction?.created_at).format("YYYY-MM-DD HH:mm:ss")}}
              </div>
            </div>

            <div class="col-span-3 flex flex-row gap-1 items-center">
              <UIcon name="mdi:credit-card" class="size-3 text-gray-400" />
              <div class="text-xs">
                #{{ transaction?.payment_id }}
              </div>
            </div>
          </div>
      </div>

      <div class="ml-auto flex-none">   
        <div class="flex sm:flex-col gap-2 items-end">
          <UBadge icon="mdi:receipt-text" size="lg" class="font-medium text-white">#{{ transaction?.id }}</UBadge>
          <UButton icon="uiw:message" size="lg" color="primary" variant="outline" @click="isChatOpen = true">Chat Pembeli</UButton>
          <UButton v-if="transaction?.status === 'UNPAID'" icon="material-symbols:cancel" color="error" variant="soft" size="xs" @click="addToCart">Batalkan</UButton>
          <UButton icon="material-symbols:refresh" variant="outline" size="xs" @click="refreshHandler">Refresh</UButton>
        </div> 
      </div>
    </div>

    <!-- Catatan Pembeli -->
    <div class="mt-4  w-full bg-gray-100 p-2 rounded-lg overflow-hidden">
      <div class="flex flex-col gap-4 text-center">
        <div>
          <h1>Catatan Pembeli</h1>
        </div>
        <div>
          <p class="text-gray-600">{{ transaction?.order_request ?? "Tidak ada catatan"}} </p>
        </div>
      </div>
    </div>

    <!-- Terima/Tolak Pesanan (Khusus Seller) -->
    <div class="mt-4  w-full bg-yellow-100 p-2 rounded-lg overflow-hidden" v-if="transaction?.status === 'PAID'">
      <div class="flex flex-col gap-2 text-center">
        <div>
          <h1>Respon Pesanan!</h1>
        </div>
        <div class="flex gap-4 justify-center">
          <UButton icon="mdi:check-circle-outline" color="primary" variant="solid" size="md" @click="handleConfirmOrder">Terima Pesanan</UButton>
          <UButton
            v-if="transaction?.status === 'PAID'"
            icon="mdi:close-circle"
            size="xs"
            color="error"
            variant="solid"
            :loading="rejectingTxId === transaction.id"
            @click="openRejectModal(transaction.id)"
          >
            Tolak Pesanan
          </UButton>        
        </div>
      </div>
    </div>

    <!-- Ajukan Pembatalan Pesanan -->
    <div class="mt-4  w-full bg-yellow-100 p-2 rounded-lg overflow-hidden" v-if="transaction?.status === 'CANCEL_REQUEST'">
      <div class="flex flex-col gap-2 text-center">
        <div>
          <h1 class="text-lg">Pembeli Mengajukan Pembatalan!</h1>
        </div>
        <div>
          <p class="text-sm">{{ transaction?.tx_description ?? "Tidak ada alasan pembatalan" }}</p>
        </div>
        <div class="flex gap-4 justify-center">
          <UButton
            icon="mdi:close-circle"
            size="lg"
            color="error"
            variant="solid"
            @click="handleRejectCancelRequest"
            :loading="isSubmitting"
          >
            Batalkan Permintaan Pembatalan
          </UButton>   
          <UButton
            icon="mdi:close-circle"
            size="lg"
            color="success"
            variant="solid"
            @click="handleAcceptCancelRequest"
            :loading="isSubmitting"
          >
            Terima Permintaan Pembatalan
          </UButton>        
        </div>
      </div>
    </div>

    <!-- Penangguhan Pesanan -->
    <div class="mt-4  w-full bg-red-200 p-2 rounded-lg overflow-hidden" v-if="transaction?.status === 'ARBITRAGE'">
      <div class="flex flex-col gap-2 text-center">
        <div>
          <h1 class="text-lg">Pembeli Mengajukan Penangguhan!</h1>
        </div>
        <div>
          <p class="text-sm">{{ transaction?.tx_description ?? "Tidak ada alasan pembatalan" }}</p>
        </div>
        <div>
          <UBadge class="text-sm" color="error">Admin segera melakukan review !</UBadge>
        </div>
      </div>
    </div>

    <div class="mt-4  w-full bg-red-100 p-2 rounded-lg overflow-hidden" v-if="transaction?.status === 'REJECT'">
      <div class="flex flex-col gap-4 text-center">
        <div>
          <h1>Pembeli menolak pesanan!</h1>
        </div>
        <div>
          <p class="text-gray-600">{{ transaction?.tx_description ?? "Tidak ada alasan penolakan"  }} </p>
        </div>
      </div>
    </div>

    <div class="mt-4 w-full bg-red-100 p-2 rounded-lg overflow-hidden" v-if="transaction?.status === 'REJECTED'">
      <div class="flex flex-col gap-4 text-center">
        <div>
          <h1>Pesanan Dibatalkan!</h1>
        </div>
        <div>
          <p class="text-gray-600">{{ transaction?.tx_description ?? "Tidak ada catatan"}} </p>
        </div>
      </div>
    </div>

    <!-- Pengiriman Pesanan -->
    <div class="mt-4  w-full bg-green-100 p-2 rounded-lg overflow-hidden" v-if="latestFileOrder">
      <div class="flex flex-col gap-4 text-center">
        <div>
          <h1>Order sudah dikirim penjual!</h1>
        </div>
        <div>
          <p class="text-gray-600">{{ latestFileOrder?.message ?? "Download filenya dibawah ini ya"}} </p>
        </div>
        <div v-if="latestFileOrder.file">
          <UButton icon="mdi:download" color="primary" variant="solid" size="md" @click="downloadFile(latestFileOrder.file.url)">{{ latestFileOrder.file.ori_name }}</UButton>
        </div>
      </div>
    </div>

    <!-- Refund Pesanan -->
    <div class="mt-4  w-full bg-red-200 p-2 rounded-lg overflow-hidden" v-if="transaction?.status === 'REFUNDED'">
      <div class="flex flex-col gap-2 text-center">
        <div>
          <h1 class="text-lg">Pesanan Direfund!</h1>
        </div>
        <div>
          <p class="text-sm">{{ transaction?.tx_description ?? "Tidak ada alasan pembatalan" }}</p>
        </div>
        <div>
          <UBadge class="text-sm" color="error">Dana dikembalikan kepada pembeli !</UBadge>
        </div>
      </div>
    </div>

    <!-- REVIEW + RATING -->
    <div class="mt-4  w-full bg-gray-100 p-2 rounded-lg overflow-hidden" v-if="transaction?.status === 'DONE' || transaction?.status === 'COMPLETE'">
      <div class="flex flex-col gap-4 text-center">
        <div>
          <h1>Berikan Penilaian Anda Mengenai Transaksi Ini!</h1>
        </div>
        <USeparator />
        <div class="flex flex-col gap-4 justify-center">
          <div v-for="review in reviews" :key="review.id">
            <UBadge
              size="lg"
              color="primary"
              :label="review.user_type === 'SELLER' ? 'Penilaian Penjual' : 'Penilaian Pembeli'"
              />
            <div class="flex gap-2 justify-center my-2">
              <div>
                <span v-for="n in review.rating" :key="n">⭐</span>
              </div>
              <p class="text-gray-600">{{ review.comment ?? "Pembeli belum memberikan penilaian."}} </p>
            </div>
            <USeparator />
          </div>
        </div>

        <!-- Form review baru, hanya muncul jika belum ada review sama sekali -->
        <div v-if="reviews[0]?.user_type !== 'SELLER' && reviews[1]?.user_type !== 'SELLER'">
          <div class="flex flex-col gap-1 justify-center items-center">
            Pilih Rating Kamu:
            <USelect v-model="reviewRequest.rating" :items="selectRating" class="w-1/2"/>
          </div>
          
          <div class="flex flex-col gap-1 justify-center items-center">
            Penilaian Kamu:
            <UTextarea v-model="reviewRequest.comment" class="w-4/5"/>
          </div>
          <div class="flex flex-col gap-1 justify-center items-center">
            <UButton class="mt-2" icon="mdi:star" color="primary" variant="soft" size="lg" @click="handleReviewSubmit" :loading="isSubmitting">Kirim Penilaian</UButton>
          </div>
        </div>

        <!-- Form review edit, hanya muncul jika belum ada review sama sekali -->
        <div v-if="reviews[0]?.user_type === 'SELLER' || reviews[1]?.user_type === 'SELLER'">
          <div class="flex flex-col gap-1 justify-center items-center">
            Ubah Rating Kamu:
            <USelect v-model="reviewRequest.rating" :items="selectRating" class="w-1/2"/>
          </div>
          
          <div class="flex flex-col gap-1 justify-center items-center">
            Penilaian Kamu:
            <UTextarea v-model="reviewRequest.comment" class="w-4/5"/>
          </div>
          <div class="flex flex-col gap-1 justify-center items-center">
            <UButton class="mt-2" icon="mdi:star" color="primary" variant="soft" size="lg" @click="handleReviewUpdate" :loading="isSubmitting">Edit Penilaian</UButton>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-4  w-full bg-gray-100 p-2 rounded-lg overflow-hidden">
      <div class="flex flex-col gap-4">
        <div class="text-center font-medium">
          <h1>Diskusi Penjual dan Pembeli</h1>
        </div>
        <div>

          <div v-if="!orderDiscussions?.content?.length" class="text-center text-gray-600">
            <UCard>
              <div class="flex flex-col gap-2 items-center justify-center p-4">
                <UIcon name="mdi:message-text-outline" class="size-6 text-gray-400" />
                <p>Belum ada diskusi antara pembeli dan penjual</p>
              </div>
            </UCard>
          </div>

          <div v-for="orderDiscussion in orderDiscussions?.content" :key="orderDiscussion.id">
            <!-- BUYER -->
            <div v-if="orderDiscussion.sender_role === 'BUYER'" class="flex flex-col gap-2 w-full bg-gray-200 p-2 border-t border-gray-300">  <!-- for looping discussion items -->
              <div class="flex flex-row gap-2 ">
                <div>
                  <UAvatar
                  src="https://github.com/benjamincanac.png"
                  :chip="{
                    inset: true,
                    color: 'success'
                  }"
                  size="xs"
                />
                </div>
                <div class="flex flex-col gap-1 flex-grow">
                  <div class="font-medium">{{ orderDiscussion.username }}</div>
                  <!-- <div><UBadge>Badge</UBadge></div> -->
                  <div class="text-gray-600">{{ orderDiscussion.message }}</div>
                  <div v-if="orderDiscussion.file" class="flex flex-row items-center gap-1"> <!-- File yang sudah diupload, klik untuk download -->
                    <NuxtLink v-if="isImage(orderDiscussion.file.format)" :to="config.public.backendUrl +'/'+ orderDiscussion.file.url">
                      <NuxtImg :src="config.public.backendUrl +'/'+ orderDiscussion.file.url" width="100" height="100" />
                    </NuxtLink>
                    <div v-else>
                      <UButton icon="mdi:download" color="primary" variant="soft" size="xs" @click="downloadFile(orderDiscussion.file?.url)">{{ orderDiscussion.file?.ori_name }}</UButton>
                    </div>
                  </div>
                </div>
                <div>
                  <div class="ml-auto flex-none">   
                    <div class="font-medium text-sm text-gray-500 px-2">{{ orderDiscussion.created_at }}</div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="orderDiscussion.sender_role === 'SELLER'" class="flex flex-col gap-2 w-full bg-blue-100 p-2 border-t border-gray-300">  <!-- for looping discussion items -->
              <div class="flex flex-row gap-2 ">
                <div>
                  <UAvatar
                  src="https://github.com/benjamincanac.png"
                  :chip="{
                    inset: true,
                    color: 'success'
                  }"
                  size="xs"
                />
                </div>
                <div class="flex flex-col gap-1 flex-grow">
                  <div class="font-medium">{{ transaction?.product.merchant_name }} <UBadge>PENJUAL</UBadge></div>
                  <div v-if="orderDiscussion.is_file_order"><UBadge>Penjual Mengirim Pesanan</UBadge></div>
                  <div class="text-gray-600">{{ orderDiscussion.message }}</div>
                  <div v-if="orderDiscussion.file" class="flex flex-row items-center gap-1"> <!-- File yang sudah diupload, klik untuk download -->
                    <div v-if="isImage(orderDiscussion.file.format)">
                      <NuxtImg :src="config.public.backendUrl +'/'+ orderDiscussion.file.url" width="100" height="100" />
                    </div>
                    <div v-else>
                      <UButton icon="mdi:download" color="primary" variant="soft" size="xs" @click="downloadFile(orderDiscussion.file?.url)">{{ orderDiscussion.file?.ori_name }}</UButton>
                    </div>
                  </div>
                </div>
                <div>
                  <div class="ml-auto flex-none">   
                    <div class="font-medium text-sm text-gray-500 px-2">{{ orderDiscussion.created_at }}</div>
                  </div>
                </div>
              </div>
              <USeparator />
            </div>

            <div v-if="orderDiscussion.sender_role === 'ADMIN' || orderDiscussion.sender_role === 'SUPER_ADMIN'" class="flex flex-col gap-2 w-full bg-yellow-100 p-2 border-t border-gray-300">  <!-- for looping discussion items -->
              <div class="flex flex-row gap-2 ">
                <div>
                  <UAvatar
                  src="https://github.com/benjamincanac.png"
                  :chip="{
                    inset: true,
                    color: 'success'
                  }"
                  size="xs"
                />
                </div>
                <div class="flex flex-col gap-1 flex-grow">
                  <div class="font-medium">{{ orderDiscussion.username }} <UBadge>ADMIN</UBadge></div>
                  <div v-if="orderDiscussion.is_file_order"><UBadge>Penjual Mengirim Pesanan</UBadge></div>
                  <div class="text-gray-600">{{ orderDiscussion.message }}</div>
                  <div v-if="orderDiscussion.file" class="flex flex-row items-center gap-1"> <!-- File yang sudah diupload, klik untuk download -->
                    <div v-if="isImage(orderDiscussion.file.format)">
                      <NuxtImg :src="config.public.backendUrl +'/'+ orderDiscussion.file.url" width="100" height="100" />
                    </div>
                    <div v-else>
                      <UButton icon="mdi:download" color="primary" variant="soft" size="xs" @click="downloadFile(orderDiscussion.file?.url)">{{ orderDiscussion.file?.ori_name }}</UButton>
                    </div>
                  </div>
                </div>
                <div>
                  <div class="ml-auto flex-none">   
                    <div class="font-medium text-sm text-gray-500 px-2">{{ orderDiscussion.created_at }}</div>
                  </div>
                </div>
              </div>
              <USeparator />
            </div>

          </div>
        <div v-if="orderDiscussions && orderDiscussions.total_pages > 1" class="flex justify-center pt-3">
          <UPagination
            :page="discussionPage + 1"
            :total="orderDiscussions.total_elements"
            :items-per-page="discussionSize"
            :sibling-count="1"
            show-edges
            @update:page="(p:any) => { discussionPage = p - 1 }"
          />
        </div>
        </div>
      </div>
    </div>

    <div class="mt-4 w-full bg-gray-100 p-2 rounded-lg overflow-hidden " v-if="transaction?.status !== 'COMPLETE' && transaction?.status !== 'REJECTED' && transaction?.status !== 'EXPIRED' && transaction?.status !== 'CANCELLED' && transaction?.status !== 'REFUNDED'">
      <div class="flex flex-col gap-4 text-center">
        <div>
          <h1 class="font-medium">Kirim Pesan / Orderan</h1>
        </div>
        <div class="flex flex-col gap-2"> 
          <UTextarea v-model="discussionMessage" class="w-full" placeholder="Tulis pesan disini..." />
          <UFileUpload v-model="fileDiscussion" label="Drop your file here" class="w-48 min-h-24" />
        </div>
        <div class="flex flex-row gap-2 justify-center items-center">
          <UButton icon="mdi:send" color="primary" variant="solid" size="md" @click="submitDiscussion(false)" :loading="isSubmitting">Kirim Pesan</UButton>
          <UButton icon="mdi:send" color="success" variant="solid" size="md" @click="submitDiscussion(true)" :loading="isSubmitting">Kirim Orderan</UButton>
        </div>
      </div>
    </div>
  </section>

  <RejectTxModal
    v-model="isRejectingTxModal"
    :loading="rejectingTxId === selectedTxId"
    :error="rejectTxError"
    @submit="handeRejectTxSubmit"
  />

  <ChatModalSeller
    v-model="isChatOpen"
    :transaction="transaction"
    :buyer-id="transaction?.buyer_id ? Number(transaction.buyer_id) : null"
    :merchant-id="transaction?.product.merchant_id"
  />

</template>

<script setup lang="ts">

  definePageMeta({
    layout: "seller",
    label: "Orders",
    // middleware: ["auth", "seller-only"] // opsional kalau mau validasi role
  })

  import { NuxtImg, UTextarea } from '#components'
  import type { SelectItem } from '@nuxt/ui'
  import dayjs from 'dayjs'
  import TransactionStatusBadge from '~/components/app/TransactionStatusBadge.vue'
  import ChatModalSeller from '~/components/form/ChatModalSeller.vue'
  import RejectTxModal from '~/components/form/RejectTxModal.vue'
  import { useOrderDiscussionApi } from '~/composables/api/order-discussion'
  import { useReviewApi } from '~/composables/api/review'
  import { useTransactionApi } from '~/composables/api/transaction'
  import type { OrderDiscussionResponse } from '~/types/order-discussion/OrderDiscussionResponse'
  import type { PageResponse } from '~/types/PageResponse'
  import type { ReviewRequest } from '~/types/review/ReviewRequest'
  import type { ReviewResponse } from '~/types/review/ReviewResponse'
  import type { TransactionResponse } from '~/types/TransactionResponse'
  
  // Ambil API function
  const { fetchTransactionById, fetchTxSeller, fetchConfirmTx, fetchRejectTx, fetchRejectCancelRequest, fetchAcceptCancelRequest } = useTransactionApi()
  const { fetchCreateOrderDiscussion, fetchOrderDiscussionByTxId } = useOrderDiscussionApi()
  const { fetchCreateReview,fetchReviewByTransaction,fetchUpdateReview } = useReviewApi()

  // Ambil parameter route
  const route = useRoute()

  //Ambil config
  const config = useRuntimeConfig()
  const toast = useToast()

  const selectRating = ref<SelectItem[]>(
  [
    {
      'value': 1,
      'label': '⭐ Sangat Buruk'
    },
    {
      'value': 2,
      'label': '⭐⭐Buruk'
    },
    {
      'value': 3,
      'label': '⭐⭐⭐ Biasa'
    },
    {
      'value': 4,
      'label': '⭐⭐⭐⭐ Bagus'
    },
    {
      'value': 5,
      'label': '⭐⭐⭐⭐⭐ Sangat Bagus'
    }
  ])

  // Reactive state
  const selectedTxId = ref<string | null>(null)
  const rejectingTxId  = ref<string | null>(null) //untuk fungsi loading button
  const isRejectingTxModal = ref<boolean>(false)
  const rejectTxError = ref<string | null>(null)
  const acceptingId = ref<string | null>(null) //untuk fungsi loading button
  const discussionMessage = ref<string>('')
  const isSubmitting = ref<boolean>(false)
  const fileDiscussion = ref<File | null>(null)
  const isChatOpen = ref(false)
  const reviewRequest = ref<ReviewRequest>({
    transaction_id: route.params.id as string,
    rating: 5,
    comment: ''
  })

  // ✅ SSR SAFE FETCH NEW
  const { 
    data: transaction, 
    pending, 
    error:errorTransaction, 
    refresh:refreshTransaction } 
    = await useAsyncData<TransactionResponse>(
    `transaction-${route.params.id}`,
    () => fetchTransactionById(route.params.id as string),
    {
      server: false, // Hanya fetch di client
    }
  )

  const discussionPage = ref(0)
  const discussionSize = ref(20)

  const {
    data: orderDiscussions,
    pending:pendingOrderDiscussion,
    error:errorOrderDiscussion,
    refresh:refreshOrderDiscussion }
    = useAsyncData<PageResponse<OrderDiscussionResponse>>(
    () => `order-discussion-${route.params.id}-${discussionPage.value}`,
    () => fetchOrderDiscussionByTxId(route.params.id as string, discussionPage.value, discussionSize.value),
    { watch: [discussionPage], server: false }
  )

  // ✅ SSR SAFE FETCH NEW
  const { 
    data: reviews, 
    pending:pendingReviews, 
    error:errorReviews, 
    refresh:refreshReviews } 
    = await useAsyncData<ReviewResponse[]>(
    `review-${route.params.id}`,
    () => fetchReviewByTransaction(route.params.id as string),
    {
      default: () => [],
      server: false, // Hanya fetch di client
    }
  )

  const latestFileOrder = computed(() => {
    if (!orderDiscussions.value?.content) return null

    return orderDiscussions.value.content
      .filter(d => d.is_file_order)
      .sort((a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      )[0] || null
  })

  const handleConfirmOrder = async () => {
    try {
      await fetchConfirmTx(route.params.id as string)
      useToast().add({
        title: 'Berhasil',
        description: 'Pesanan berhasil diterima',
        color: 'success'
      })
      refreshTransaction()
    } catch (err) {
      console.error('Failed to confirm order:', err)
    }finally {
      acceptingId.value = null //untuk fungsi loading button
    }
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

      await refreshTransaction()

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

  const openRejectModal = (txId: string) => {
    console.log('OPEN MODAL', txId)
    selectedTxId.value = txId
    isRejectingTxModal.value = true
  }

  const handleRejectCancelRequest = async () => {
    try {
      isSubmitting.value = true
      await fetchRejectCancelRequest(route.params.id as string)
      toast.add({
        title: 'Berhasil',
        description: 'Permintaan pembatalan berhasil dibatalkan, transaksi akan dilanjutkan seperti semula',
        color: 'success'
      })
      await refreshTransaction()
    } catch (err: any) {
      toast.add({
        title: 'Gagal',
        description: err.message || 'Gagal batalkan permintaan pembatalan',
        color: 'error'
      })
    }finally {
      isSubmitting.value = false
    }
  }

  const handleAcceptCancelRequest = async () => {
    try {
      isSubmitting.value = true
      await fetchAcceptCancelRequest(route.params.id as string)
      toast.add({
        title: 'Berhasil',
        description: 'Permintaan pembatalan berhasil diterima, transaksi akan dibatalkan',
        color: 'success'
      })
      await refreshTransaction()
    } catch (err: any) {
      toast.add({
        title: 'Gagal',
        description: err.message || 'Gagal menerima permintaan pembatalan',
        color: 'error'
      })
    }finally {
      isSubmitting.value = false
    }
  }

  const addToCart = () => {
    // Add to cart logic here
    useToast().add({
      title: 'Berhasil',
      description: 'Produk berhasil ditambahkan ke keranjang',
      color: 'success'
    })
  }

  const submitDiscussion = async (isFileOrder: boolean = false) => {
    if (!discussionMessage.value.trim()) {
      alert('Pesan tidak boleh kosong')
      return
    }

    try {
      isSubmitting.value = true

      const formData = new FormData()
      formData.append("transactionId", route.params.id as string)
      formData.append("message", discussionMessage.value)
      formData.append("isFileOrder", isFileOrder.toString())
      if(fileDiscussion.value) formData.append("file", fileDiscussion.value)

      await fetchCreateOrderDiscussion(formData)
      
      toast.add({
        title: "Berhasil",
        description: isFileOrder ? "Pesanan terkirim ke pembeli" : "Pesan terkirim",
        color: "success",
        icon: "material-symbols:check-circle-outline"
      })

      if(isFileOrder) {
        await refreshTransaction() // refresh transaction untuk update status ke DELIVERED jika kirim orderan (file)
      }

      discussionMessage.value = '' // reset textarea
      fileDiscussion.value = null // reset file input
      await refreshOrderDiscussion() // refreshTransaction transaction / discussion list

    } catch (err:any) {
      console.error(err.message || err)
      toast.add({
        title: "Gagal mengirim pesan",
        description: err.message || "Kesalahan tidak terduga terjadi",
        color: "error",
        icon: "material-symbols:error-outline"
      })
    } finally {
      isSubmitting.value = false

    }
  }

const downloadFile = (fileUrl: string | undefined) => {
  if (!fileUrl) {
    toast.add({
      title: "Gagal",
      description: "File tidak tersedia untuk diunduh",
      color: "error",
      icon: "material-symbols:error-outline"
    })
    return
  }

  // Buat link sementara untuk mengunduh file
  const link = document.createElement('a')
  link.href = fileUrl
  link.download = '' // Nama file bisa diatur jika diperlukan
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const isImage = (format?: string) => {
  if (!format) return false
  return ['jpg', 'jpeg', 'png', 'webp'].includes(format.toLowerCase())
}

  const handleReviewSubmit = async() => {
    try {
      isSubmitting.value = true
      await fetchCreateReview(reviewRequest.value)
      
      toast.add({
        title: "Berhasil",
        description: "Penilaian terkirim",
        color: "success",
        icon: "material-symbols:check-circle-outline"
      })

      discussionMessage.value = '' // reset textarea
      await refreshReviews() // refresh transaction / discussion list

    } catch (err:any) {
      console.error(err)
      toast.add({
        title: "Gagal mengirim penilaian",
        description: err.message ||"Penilaian gagal terkirim",
        color: "error",
        icon: "material-symbols:check-circle-outline"
      })
    } finally {
      isSubmitting.value = false
    }
  }

  const handleReviewUpdate = async() => {
    try {
      isSubmitting.value = true
      await fetchUpdateReview(reviewRequest.value)
      
      toast.add({
        title: "Berhasil",
        description: "Penilaian terkirim",
        color: "success",
        icon: "material-symbols:check-circle-outline"
      })

      discussionMessage.value = '' // reset textarea
      await refreshReviews() // refresh transaction / discussion list

    } catch (err:any) {
      console.error(err)
      toast.add({
        title: "Gagal mengirim penilaian",
        description: err.message ||"Penilaian gagal terkirim",
        color: "error",
        icon: "material-symbols:check-circle-outline"
      })
    } finally {
      isSubmitting.value = false
    }
  }

  const refreshHandler = () => {
    refreshTransaction()
    refreshOrderDiscussion()
    refreshReviews()
  }


</script>