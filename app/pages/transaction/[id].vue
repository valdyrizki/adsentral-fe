<template>
  <main class="px-4 sm:px-6 lg:px-8 py-8">
    <div class="mx-auto">
      <div class="max-w-xl flex gap-2 ">
        <NuxtLink class="text-base font-medium flex items-center gap-1" to="/transaction">
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
          <div class="flex-none mx-auto">
            <NuxtLink :to="`/product/${transaction?.product.id}`" class=" sm:order-first text-center">
              <img :src="config.public.backendUrl +'/'+ transaction?.product?.banner_url" :alt="transaction?.product.name" class=" size-40 rounded-lg object-cover " />
            </NuxtLink>
          </div>
          <div class="flex-grow flex flex-col ">
            <!-- Konten atas yang akan memenuhi ruang -->
            <div class="flex flex-col gap-1">
              <div>
                <TransactionStatusBadge :status="transaction?.status" />
              </div>
              
              <div class="flex flex-row gap-2">
                <div class="basis-auto">
                  <UAvatar
                  :src="config.public.backendUrl +'/'+ transaction?.product?.merchant_logo"
                  :chip="{
                    inset: true,
                    color: 'success'
                  }"
                  size="xs"
                />
                </div>
                <NuxtLink :to="`/merchant/${transaction?.product.merchant_id}`">{{ transaction?.product.merchant_name }}</NuxtLink>
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
                  <UIcon name="fa6-solid:rupiah-sign" class="size-5 text-gray-400" />
                  <div class="font-medium">
                    {{ transaction?.price.toLocaleString('id-ID') }}
                  </div>
                </div>

                <div class="col-span-3 flex flex-row gap-1 items-center">
                  <UIcon name="mdi:calendar" class="size-5 text-gray-400" />
                  <div class="font-medium">
                    {{ dayjs(transaction?.created_at).format("YYYY-MM-DD HH:mm:ss")}}
                  </div>
                </div>

                <div class="col-span-3 flex flex-row gap-1 items-center">
                  <UIcon name="mdi:credit-card" class="size-5 text-gray-400" />
                  <div class="font-medium">
                   #{{ transaction?.payment_id }}
                  </div>
                </div>
              </div>
          </div>
          <div class="ml-auto flex-none">   
            <div class="flex sm:flex-col gap-2 items-end">
              <UBadge icon="mdi:receipt-text" size="lg" class="font-medium text-white">#{{ transaction?.id }}</UBadge>
              <UButton icon="uiw:message" size="lg" color="primary" variant="outline">Chat Penjual</UButton>
              <UButton v-if="transaction?.status === 'DONE' || transaction?.status === 'COMPLETE'" icon="mdi:cart-outline" color="primary" variant="soft" size="xs" @click="addToCart">Beli Lagi</UButton>
              <UButton v-if="transaction?.status === 'UNPAID'" icon="material-symbols:cancel" color="error" variant="soft" size="xs" @click="addToCart">Batalkan</UButton>
              <UButton v-if="transaction?.status === 'DELIVERED' || transaction?.status === 'DONE' " icon="material-symbols:help-outline-rounded" color="error" variant="solid" size="xs" @click="isArbitrageRequestModal = true">Tangguhkan</UButton>
              <UButton v-if="transaction?.status === 'IN_PROGRESS' || transaction?.status === 'DELIVERED' " icon="material-symbols:help-outline-rounded" color="error" variant="outline" size="xs" @click="isCancelRequestModal = true">Ajukan Pembatalan</UButton>
            </div> 
          </div>
        </div>

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

        <!-- Terima/Tolak Pesanan (Khusus Buyer) -->
        <div class="mt-4  w-full bg-yellow-100 p-2 rounded-lg overflow-hidden" v-if="transaction?.status === 'DELIVERED'">
          <div class="flex flex-col gap-2 text-center">
            <div>
              <h1>Respon Pesanan!</h1>
            </div>
            <div class="flex gap-4 justify-center">
              <UButton 
              icon="mdi:check-circle-outline" 
              color="primary" 
              variant="solid" 
              size="md" 
              @click="isConfirmDoneModal = true">
                Selesaikan Pesanan
              </UButton>
              <UButton
                icon="mdi:close-circle"
                size="xs"
                color="error"
                variant="solid"
                @click="isRejectingOrderModal = true"
              >
                Tolak Pesanan
              </UButton>        
            </div>
          </div>
        </div>

        <!-- Ajukan Pembatalan Pesanan  (Khusus Buyer) -->
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
              <UBadge class="text-sm" color="error">Admin sedang melakukan review !</UBadge>
            </div>
          </div>
        </div>

        <!-- REVIEW + RATING -->
        <div class="mt-4  w-full bg-gray-100 p-2 rounded-lg overflow-hidden" v-if="transaction?.status === 'DONE'">
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
                  :label="review.review_type === 'SELLER' ? 'Penilaian Penjual' : 'Penilaian Pembeli'"
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
            <div v-if="reviews[0]?.review_type !== 'BUYER' && reviews[1]?.review_type !== 'BUYER'">
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
            <div v-if="reviews[0]?.review_type === 'BUYER' || reviews[1]?.review_type === 'BUYER'">
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

              <div v-if="orderDiscussions && orderDiscussions.length === 0" class="text-center text-gray-600">
                <UCard>
                  <div class="flex flex-col gap-2 items-center justify-center p-4">
                    <UIcon name="mdi:message-text-outline" class="size-6 text-gray-400" />
                    <p>Belum ada diskusi antara pembeli dan penjual</p>
                  </div>
                </UCard> 
              </div>
              
              <div v-for="orderDiscussion in orderDiscussions" :key="orderDiscussion.id">

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
                  <USeparator />
                </div>
              </div>
              
            </div>

          </div>
        </div>

        <div class="mt-4 w-full bg-gray-100 p-2 rounded-lg overflow-hidden " v-if="transaction?.status !== 'COMPLETE' && transaction?.status !== 'REJECTED' && transaction?.status !== 'EXPIRED' && transaction?.status !== 'CANCELLED'">
          <div class="flex flex-col gap-4 text-center">
            <div>
              <h1 class="font-medium">Kirim Pesan</h1>
            </div>
            <div class="flex flex-col gap-2"> 
              <UTextarea v-model="discussionMessage"  class="w-full" placeholder="Tulis pesan disini..." />
              <UFileUpload v-model="fileDiscussion" label="Drop your file here" class="w-48 min-h-24" />
            </div>
            <div class="flex flex-row gap-2 justify-center items-center">
              <UButton icon="mdi:send" color="primary" variant="solid" size="lg" @click="submitDiscussion" :loading="isSubmitting">Kirim Pesan</UButton>
            </div>

          </div>
        </div>

      </section>
    </div>
  </main>

  <RejectOrderModal
    v-model="isRejectingOrderModal"
    :error="rejectOrderError"
    @submit="handleRejectOrderSubmit"
    :loading="isSubmitting"
  />

  <RequestCancelModal
    v-model="isCancelRequestModal"
    :error="cancelTxRequestError"
    @submit="handleCancelTxRequest"
    :loading="isSubmitting"
  />

  <RequestArbitrageModal
    v-model="isArbitrageRequestModal"
    :error="arbitrageRequestError"
    @submit="handleArbitrageRequest"
    :loading="isSubmitting"
  />

  <ConfirmDialog
    v-model="isConfirmDoneModal"
    :error="rejectOrderError"
     title="Selesaikan Pesanan"
    description="Apakah Anda yakin ingin menyelesaikan pesanan ini?"
    confirm-label="Ya, Selesaikan"
    cancel-label="Kembali"
    :loading="isSubmitting"
    @submit="handleDoneOrder"
  />




</template>

<script setup lang="ts">
import { NuxtImg, UTextarea } from '#components'
import type { SelectItem } from '@nuxt/ui'
import dayjs from 'dayjs'
import TransactionStatusBadge from '~/components/app/TransactionStatusBadge.vue'
import ConfirmDialog from '~/components/form/ConfirmDialog.vue'
import RejectOrderModal from '~/components/form/RejectOrderModal.vue'
import RequestArbitrageModal from '~/components/form/RequestArbitrageModal.vue'
import RequestCancelModal from '~/components/form/RequestCancelModal.vue'
import { useOrderDiscussionApi } from '~/composables/api/order-discussion'
import { useReviewApi } from '~/composables/api/review'
import { useTransactionApi } from '~/composables/api/transaction'
import type { OrderDiscussionResponse } from '~/types/order-discussion/OrderDiscussionResponse'
import type { ReviewRequest } from '~/types/review/ReviewRequest'
import type { ReviewResponse } from '~/types/review/ReviewResponse'
import type { TransactionResponse } from '~/types/TransactionResponse'

// Ambil API function
const { fetchTransactionById, fetchAcceptOrder, fetchRejectOrder, fetchCancelTxRequest, fetchRejectCancelRequest, fetchArbitrageRequest } = useTransactionApi()
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
  const discussionMessage = ref<string>('')
  const isFileOrder = ref<boolean>(false)
  const isSubmitting = ref<boolean>(false)
  const fileDiscussion = ref<File | null>(null)
  const isRejectingOrderModal = ref<boolean>(false)
  const rejectOrderError = ref<string | null>(null)
  const isConfirmDoneModal = ref<boolean>(false)
  const isCancelRequestModal = ref<boolean>(false)
  const cancelTxRequestError = ref<string | null>(null)
  const isArbitrageRequestModal = ref<boolean>(false)
  const arbitrageRequestError = ref<string | null>(null)
  const reviewRequest = ref<ReviewRequest>({
    transaction_id: route.params.id as string,
    rating: 5,
    comment: ''
  })


  // ✅ SSR SAFE FETCH
  const {data: transaction,pending,refresh:refreshTransaction} = await useAsyncData<TransactionResponse>(
    `tx-${route.params.id}`, () => fetchTransactionById(route.params.id as string)
  )

  // ✅ SSR SAFE FETCH
  const {data: orderDiscussions,pending : pendingOrderDiscussion,refresh:refreshOrderDiscussion} = await useAsyncData<OrderDiscussionResponse[]>(
    `order-discussion-${route.params.id}`, () => fetchOrderDiscussionByTxId(route.params.id as string)
  )

    // ✅ SSR SAFE FETCH
  const {data: reviews,pending : pendingReviews,refresh:refreshReviews} = await useAsyncData<ReviewResponse[]>(
    `review-${route.params.id}`, () => fetchReviewByTransaction(route.params.id as string),
    {
      default: () => []
    }
  )

  //Ambil pengiriman penjualan terakhir untuk ditampilkan di buyer
  const latestFileOrder = computed(() => {
    if (!orderDiscussions.value) return null

    return orderDiscussions.value
      .filter(d => d.is_file_order)
      .sort((a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
      )[0] || null
  })

  const handleRejectOrderSubmit = async (reason: string) => {
    try {
      isSubmitting.value = true
      await fetchRejectOrder(route.params.id as string, reason)
      toast.add({
        title: 'Berhasil',
        description: 'Pesanan berhasil ditolak',
        color: 'success'
      })
      await refreshTransaction()
    } catch (err: any) {
      toast.add({
        title: 'Gagal',
        description: err.message || 'Gagal menolak orderan',
        color: 'error'
      })
    }finally {
      isSubmitting.value = false
      isRejectingOrderModal.value = false
    }
  }

  const handleCancelTxRequest = async (reason: string) => {
    try {
      isSubmitting.value = true
      await fetchCancelTxRequest(route.params.id as string, reason)
      toast.add({
        title: 'Berhasil',
        description: 'Pembatalan berhasil diajukan, silahkan tunggu respon penjual',
        color: 'success'
      })
      await refreshTransaction()
    } catch (err: any) {
      toast.add({
        title: 'Gagal',
        description: err.message || 'Gagal ajukan pembatalan',
        color: 'error'
      })
    }finally {
      isSubmitting.value = false
      isCancelRequestModal.value = false
    }
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
      isCancelRequestModal.value = false
    }
  }

  const handleDoneOrder = async () => {
    try {
      isSubmitting.value = true
      await fetchAcceptOrder(route.params.id as string)
      toast.add({
        title: 'Berhasil',
        description: 'Pesanan berhasil diselesaikan',
        color: 'success'
      })
      isConfirmDoneModal.value = false
      refreshTransaction()
    } catch (err) {
      toast.add({
        title: 'Gagal',
        description: 'Pesanan gagal diselesaikan',
        color: 'error'
      })
      console.error('Failed to confirm order:', err)
    }finally {
      isSubmitting.value = false
      isConfirmDoneModal.value = false
    }
  }

  const handleArbitrageRequest = async (reason: string) => {
    try {
      isSubmitting.value = true
      await fetchArbitrageRequest(route.params.id as string, reason)
      toast.add({
        title: 'Berhasil',
        description: 'Penangguhan berhasil diajukan, silahkan tunggu respon admin',
        color: 'success'
      })
      await refreshTransaction()
    } catch (err: any) {
      toast.add({
        title: 'Gagal',
        description: err.message || 'Gagal ajukan penangguhan',
        color: 'error'
      })
    }finally {
      isSubmitting.value = false
      isArbitrageRequestModal.value = false
    }
  }

  const submitDiscussion = async () => {
    if (!discussionMessage.value.trim()) {
      alert('Pesan tidak boleh kosong')
      return
    }
    try {
      isSubmitting.value = true
      const formData = new FormData()
      formData.append("transactionId", route.params.id as string)
      formData.append("message", discussionMessage.value)
      formData.append("isFileOrder", false.toString()) // default false untuk kirim pesan biasa
      if(fileDiscussion.value) formData.append("file", fileDiscussion.value)
      await fetchCreateOrderDiscussion(formData)
      toast.add({
        title: "Berhasil",
        description: "Pesan terkirim",
        color: "success",
        icon: "material-symbols:check-circle-outline"
      })
      discussionMessage.value = '' // reset textarea
      await refreshOrderDiscussion() // refresh transaction / discussion list
    } catch (err) {
      console.error(err)
      alert('Gagal mengirim pesan')
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

  const addToCart = () => {
    alert('Add to cart clicked!')
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

</script>