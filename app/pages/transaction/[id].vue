<template>
  <main class="px-4 sm:px-6 lg:px-8 py-8">
    <div class="mx-auto">
      <UBreadcrumb :items="breadcrumb" class="mb-4" />

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
              <UButton icon="uiw:message" size="lg" color="primary" variant="outline" @click="isChatOpen = true">Chat Penjual</UButton>
              <UButton v-if="transaction?.status === 'DONE' || transaction?.status === 'COMPLETE'" icon="mdi:cart-outline" color="primary" variant="soft" size="xs" @click="addToCart">Beli Lagi</UButton>
              <UButton v-if="transaction?.status === 'UNPAID'" icon="material-symbols:cancel" color="error" variant="soft" size="xs" @click="addToCart">Batalkan</UButton>
              <UButton v-if="transaction?.status === 'DELIVERED' || transaction?.status === 'DONE' " icon="material-symbols:help-outline-rounded" color="error" variant="solid" size="xs" @click="isArbitrageRequestModal = true">Tangguhkan</UButton>
              <UButton v-if="transaction?.status === 'IN_PROGRESS' " icon="material-symbols:help-outline-rounded" color="error" variant="outline" size="xs" @click="isCancelRequestModal = true">Ajukan Pembatalan</UButton>
              <UButton icon="material-symbols:refresh" variant="outline" size="xs" @click="refreshHandler">Refresh</UButton>

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

        <!-- COUNTDOWN Auto Cancel Jika buyer tidak melakukan pembayaran > 24 jam -->
        <div
          v-if="transaction?.status === 'UNPAID'"
          class="mt-4 w-full p-3 rounded-lg overflow-hidden border"
          :class="isCountdownExpired ? 'bg-red-50 border-red-300' : 'bg-orange-50 border-orange-200'"
        >
          <div class="flex flex-col items-center gap-2 text-center py-1">
            <div class="flex items-center gap-2">
              <UIcon
                name="mdi:clock-alert-outline"
                class="size-5"
                :class="isCountdownExpired ? 'text-red-500' : 'text-orange-500'"
              />
              <span class="font-semibold" :class="isCountdownExpired ? 'text-red-600' : 'text-orange-600'">
                {{ isCountdownExpired ? 'Waktu Pembayaran Habis!' : 'Batas Waktu Pembayaran' }}
              </span>
            </div>

            <div v-if="!isCountdownExpired" class="text-4xl font-mono font-bold tracking-widest text-orange-600">
              {{ countdownDisplay }}
            </div>

            <p class="text-sm" :class="isCountdownExpired ? 'text-red-500' : 'text-orange-500'">
              {{ isCountdownExpired
                ? 'Transaksi akan dibatalkan otomatis oleh sistem.'
                : 'Segera lakukan pembayaran sebelum transaksi dibatalkan otomatis.'
              }}
            </p>
          </div>
        </div>

        <!-- Menunggu Konfirmasi Seller -->
        <div class="mt-4 w-full bg-blue-50 border border-blue-200 p-3 rounded-lg overflow-hidden" v-if="transaction?.status === 'PAID'">
          <div class="flex flex-col items-center gap-2 text-center py-1">
            <div class="flex items-center gap-2">
              <UIcon name="mdi:clock-outline" class="size-5 text-blue-500" />
              <span class="font-semibold text-blue-700">Menunggu Konfirmasi Penjual</span>
            </div>
            <p class="text-sm text-blue-600">Penjual sedang memproses pesanan Anda. Pesanan akan otomatis dibatalkan jika penjual tidak merespons dalam waktu:</p>
            <div v-if="!isConfirmExpired" class="text-4xl font-mono font-bold tracking-widest text-blue-600">
              {{ confirmCountdownDisplay }}
            </div>
            <div v-else class="text-sm font-medium text-red-500">
              Batas waktu habis — sistem akan memproses pembatalan otomatis.
            </div>
          </div>
        </div>

        <!-- Estimasi Pengiriman (IN_PROGRESS) -->
        <div
          v-if="transaction?.status === 'IN_PROGRESS'"
          class="mt-4 w-full p-3 rounded-lg overflow-hidden border"
          :class="isDeliveryExpired ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-200'"
        >
          <div class="flex flex-col items-center gap-2 text-center py-1">
            <div class="flex items-center gap-2">
              <UIcon
                name="mdi:truck-delivery-outline"
                class="size-5"
                :class="isDeliveryExpired ? 'text-red-500' : 'text-blue-500'"
              />
              <span class="font-semibold" :class="isDeliveryExpired ? 'text-red-600' : 'text-blue-600'">
                {{ isDeliveryExpired ? 'Estimasi Pengiriman Terlewat!' : 'Menunggu Pengiriman Pesanan' }}
              </span>
            </div>
            <p class="text-sm" :class="isDeliveryExpired ? 'text-red-500' : 'text-blue-500'">
              {{ isDeliveryExpired
                ? 'Estimasi pengiriman telah terlewat. Silakan hubungi penjual.'
                : `Penjual sedang memproses pesananmu, estimasi dikirim sebelum ${deliveryDeadlineDisplay}`
              }}
            </p>
          </div>
        </div>

        <!-- REJECT: Pembeli menolak + countdown 24 jam pemrosesan -->
        <div v-if="transaction?.status === 'REJECT'" class="mt-4 flex flex-col gap-3">
          <div class="w-full bg-red-100 p-2 rounded-lg overflow-hidden">
            <div class="flex flex-col gap-4 text-center">
              <div>
                <h1>Anda telah menolak pesanan ini!</h1>
              </div>
              <div>
                <p class="text-gray-600">{{ transaction?.tx_description ?? "Tidak ada alasan penolakan" }}</p>
              </div>
            </div>
          </div>

          <div
            class="w-full p-3 rounded-lg overflow-hidden border"
            :class="isRejectExpired ? 'bg-red-50 border-red-300' : 'bg-orange-50 border-orange-200'"
          >
            <div class="flex flex-col items-center gap-2 text-center py-1">
              <div class="flex items-center gap-2">
                <UIcon
                  name="mdi:clock-alert-outline"
                  class="size-5"
                  :class="isRejectExpired ? 'text-red-500' : 'text-orange-500'"
                />
                <span class="font-semibold" :class="isRejectExpired ? 'text-red-600' : 'text-orange-600'">
                  {{ isRejectExpired ? 'Batas Waktu Habis!' : 'Menunggu Pemrosesan Penolakan' }}
                </span>
              </div>
              <div v-if="!isRejectExpired" class="text-4xl font-mono font-bold tracking-widest text-orange-600">
                {{ rejectCountdownDisplay }}
              </div>
              <p class="text-sm" :class="isRejectExpired ? 'text-red-500' : 'text-orange-500'">
                {{ isRejectExpired
                  ? 'Transaksi akan diproses pembatalan otomatis oleh sistem.'
                  : 'Penolakan Anda sedang diproses. Sistem akan memproses pembatalan otomatis.'
                }}
              </p>
            </div>
          </div>
        </div>

        <div class="mt-4 w-full bg-green-100 p-2 rounded-lg overflow-hidden" v-if="fileOrders && fileOrders.total_elements > 0">
          <div class="flex flex-col gap-3">
            <div class="text-center font-medium">
              <h1>Order sudah dikirim penjual!</h1>
            </div>

            <div v-if="pendingFileOrders" class="text-center py-2">
              <AppLoadingSkeleton />
            </div>

            <div v-else class="flex flex-col gap-2">
              <div
                v-for="fileOrder in fileOrders.content"
                :key="fileOrder.id"
                class="flex flex-col sm:flex-row items-center justify-between gap-2 bg-white rounded-lg p-3"
              >
                <div class="flex flex-col gap-1 text-sm text-gray-600 text-center sm:text-left">
                  <span>{{ fileOrder.message || "Download filenya dibawah ini ya" }}</span>
                  <span class="text-xs text-gray-400">{{ dayjs(fileOrder.created_at).format('D MMM YYYY HH:mm') }}</span>
                </div>
                <UButton
                  v-if="fileOrder.file"
                  icon="mdi:download"
                  color="primary"
                  variant="solid"
                  size="sm"
                  class="flex-none"
                  @click="downloadFile(config.public.backendUrl + '/' + fileOrder.file.url)"
                >
                  {{ fileOrder.file.ori_name }}
                </UButton>
              </div>
            </div>

            <div v-if="fileOrders.total_pages > 1" class="flex justify-center pt-1">
              <UPagination
                :page="fileOrderPage + 1"
                :total="fileOrders.total_elements"
                :items-per-page="fileOrderSize"
                :sibling-count="1"
                @update:page="(p: number) => { fileOrderPage = p - 1 }"
              />
            </div>
          </div>
        </div>

        <!-- Pengiriman Garansi -->
        <div class="mt-4 w-full bg-yellow-50 border border-yellow-300 p-2 rounded-lg overflow-hidden" v-if="guarantee?.order_discussion">
          <div class="flex flex-col gap-3">
            <div class="text-center font-medium flex items-center justify-center gap-2">
              <UIcon name="material-symbols:shield" class="size-5 text-yellow-600" />
              <span>Akun garansi sudah dikirim penjual!</span>
            </div>
            <div class="flex flex-col sm:flex-row items-center justify-between gap-2 bg-white rounded-lg p-3">
              <div class="flex flex-col gap-1 text-sm text-gray-600 text-center sm:text-left">
                <span>{{ guarantee.order_discussion.message || "Download file akun garansi dibawah ini" }}</span>
                <span class="text-xs text-gray-400">{{ dayjs(guarantee.order_discussion.created_at).format('D MMM YYYY HH:mm') }}</span>
              </div>
              <UButton
                v-if="guarantee.order_discussion.file"
                icon="mdi:download"
                color="warning"
                variant="solid"
                size="sm"
                class="flex-none"
                @click="downloadFile(config.public.backendUrl + '/' + guarantee.order_discussion.file.url)"
              >
                {{ guarantee.order_discussion.file.ori_name }}
              </UButton>
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

        <!-- COUNTDOWN Auto Complete Jika buyer tidak merespon dalam 24 jam setelah DELIVERED -->
        <div
          v-if="transaction?.status === 'DELIVERED'"
          class="mt-4 w-full p-3 rounded-lg overflow-hidden border"
          :class="isDeliveredExpired ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-200'"
        >
          <div class="flex flex-col items-center gap-2 text-center py-1">
            <div class="flex items-center gap-2">
              <UIcon
                name="mdi:package-check"
                class="size-5"
                :class="isDeliveredExpired ? 'text-red-500' : 'text-green-500'"
              />
              <span class="font-semibold" :class="isDeliveredExpired ? 'text-red-600' : 'text-green-700'">
                {{ isDeliveredExpired ? 'Batas Waktu Habis!' : 'Batas Waktu Konfirmasi Pesanan' }}
              </span>
            </div>

            <div v-if="!isDeliveredExpired" class="text-4xl font-mono font-bold tracking-widest text-green-700">
              {{ deliveredCountdownDisplay }}
            </div>

            <p class="text-sm" :class="isDeliveredExpired ? 'text-red-500' : 'text-green-600'">
              {{ isDeliveredExpired
                ? 'Pesanan akan diselesaikan otomatis oleh sistem.'
                : 'Segera konfirmasi penerimaan pesanan sebelum pesanan diselesaikan otomatis.'
              }}
            </p>
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

        <!-- COUNTDOWN Auto Cancel Request (updated_at + 24 jam) -->
        <div
          v-if="transaction?.status === 'CANCEL_REQUEST'"
          class="mt-4 w-full p-3 rounded-lg overflow-hidden border"
          :class="isCancelRequestExpired ? 'bg-red-50 border-red-300' : 'bg-orange-50 border-orange-200'"
        >
          <div class="flex flex-col items-center gap-2 text-center py-1">
            <div class="flex items-center gap-2">
              <UIcon
                name="mdi:clock-alert-outline"
                class="size-5"
                :class="isCancelRequestExpired ? 'text-red-500' : 'text-orange-500'"
              />
              <span class="font-semibold" :class="isCancelRequestExpired ? 'text-red-600' : 'text-orange-600'">
                {{ isCancelRequestExpired ? 'Batas Waktu Habis!' : 'Batas Waktu Pembatalan Otomatis' }}
              </span>
            </div>
            <div v-if="!isCancelRequestExpired" class="text-4xl font-mono font-bold tracking-widest text-orange-600">
              {{ cancelRequestCountdownDisplay }}
            </div>
            <p class="text-sm" :class="isCancelRequestExpired ? 'text-red-500' : 'text-orange-500'">
              {{ isCancelRequestExpired
                ? 'Transaksi akan dibatalkan otomatis oleh sistem.'
                : 'Jika penjual tidak merespons, sistem akan memproses pembatalan otomatis.'
              }}
            </p>
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

        <!-- COUNTDOWN Kliring Dana (done_at + 24 jam) -->
        <div
          v-if="transaction?.status === 'DONE'"
          class="mt-4 w-full p-3 rounded-lg overflow-hidden border"
          :class="isKliringExpired ? 'bg-green-50 border-green-300' : 'bg-blue-50 border-blue-200'"
        >
          <div class="flex flex-col items-center gap-2 text-center py-1">
            <div class="flex items-center gap-2">
              <UIcon
                name="mdi:bank-transfer"
                class="size-5"
                :class="isKliringExpired ? 'text-green-600' : 'text-blue-500'"
              />
              <span class="font-semibold" :class="isKliringExpired ? 'text-green-700' : 'text-blue-700'">
                {{ isKliringExpired ? 'Transaksi Selesai Diproses!' : 'Transaksi Sedang Diproses' }}
              </span>
            </div>
            <div v-if="!isKliringExpired" class="text-4xl font-mono font-bold tracking-widest text-blue-600">
              {{ kliringCountdownDisplay }}
            </div>
            <p class="text-sm" :class="isKliringExpired ? 'text-green-600' : 'text-blue-500'">
              {{ isKliringExpired
                ? 'Proses penyelesaian transaksi telah selesai.'
                : 'Transaksi Anda sedang dalam proses penyelesaian oleh sistem.'
              }}
            </p>
          </div>
        </div>

        <!-- STATUS KLAIM GARANSI -->
        <div v-if="guarantee" class="mt-4 w-full rounded-lg overflow-hidden border border-yellow-300">
          <!-- Header -->
          <div class="flex items-center gap-2 flex-wrap p-3 bg-yellow-50">
            <UIcon name="material-symbols:shield" class="size-5 text-yellow-600" />
            <span class="font-semibold text-yellow-800">Klaim Garansi</span>
            <UBadge :color="guaranteeStatusColor(guarantee.status)" size="sm">{{ guaranteeStatusLabel(guarantee.status) }}</UBadge>
            <span class="text-xs text-gray-400 ml-auto">Diajukan: {{ dayjs(guarantee.created_at).format('D MMM YYYY HH:mm') }}</span>
          </div>

          <!-- Countdown: IN_REVIEW -->
          <div
            v-if="guarantee.status === 'IN_REVIEW'"
            class="p-3 border-t"
            :class="isGuaranteeDeadlineExpired ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'"
          >
            <div class="flex flex-col items-center gap-1 text-center py-1">
              <div class="flex items-center gap-2">
                <UIcon name="mdi:clock-alert-outline" class="size-4" :class="isGuaranteeDeadlineExpired ? 'text-red-500' : 'text-orange-500'" />
                <span class="text-sm font-semibold" :class="isGuaranteeDeadlineExpired ? 'text-red-600' : 'text-orange-700'">
                  {{ isGuaranteeDeadlineExpired ? 'Batas Waktu Habis!' : 'Menunggu Respon Penjual' }}
                </span>
              </div>
              <div v-if="!isGuaranteeDeadlineExpired" class="text-3xl font-mono font-bold tracking-widest text-orange-600">
                {{ guaranteeCountdownDisplay }}
              </div>
              <p class="text-xs" :class="isGuaranteeDeadlineExpired ? 'text-red-500' : 'text-orange-500'">
                {{ isGuaranteeDeadlineExpired
                  ? 'Penjual tidak merespons — sistem akan memberikan penalty secara otomatis.'
                  : `Penjual memiliki waktu hingga ${dayjs(guarantee.review_deadline).format('D MMM YYYY HH:mm')} untuk merespons klaim ini.` }}
              </p>
            </div>
          </div>

          <!-- Countdown: IN_PROGRESS -->
          <div
            v-if="guarantee.status === 'IN_PROGRESS'"
            class="p-3 border-t"
            :class="isGuaranteeDeadlineExpired ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'"
          >
            <div class="flex flex-col items-center gap-1 text-center py-1">
              <div class="flex items-center gap-2">
                <UIcon name="mdi:clock-outline" class="size-4" :class="isGuaranteeDeadlineExpired ? 'text-red-500' : 'text-blue-500'" />
                <span class="text-sm font-semibold" :class="isGuaranteeDeadlineExpired ? 'text-red-600' : 'text-blue-700'">
                  {{ isGuaranteeDeadlineExpired ? 'Batas Waktu Habis!' : 'Penjual Sedang Menyiapkan Akun Garansi' }}
                </span>
              </div>
              <div v-if="!isGuaranteeDeadlineExpired" class="text-3xl font-mono font-bold tracking-widest text-blue-600">
                {{ guaranteeCountdownDisplay }}
              </div>
              <p class="text-xs" :class="isGuaranteeDeadlineExpired ? 'text-red-500' : 'text-blue-500'">
                {{ isGuaranteeDeadlineExpired
                  ? 'Penjual tidak mengirimkan akun garansi — sistem akan memberikan penalty secara otomatis.'
                  : `Penjual memiliki waktu hingga ${dayjs(guarantee.progress_deadline).format('D MMM YYYY HH:mm')} untuk mengirimkan akun garansi.` }}
              </p>
            </div>
          </div>

          <!-- REJECTED -->
          <div v-if="guarantee.status === 'REJECTED'" class="p-3 border-t bg-red-50">
            <div class="flex items-center gap-2">
              <UIcon name="mdi:close-circle" class="size-4 text-red-500" />
              <span class="text-sm font-medium text-red-700">Klaim ditolak oleh penjual</span>
            </div>
            <p v-if="guarantee.seller_description" class="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{{ guarantee.seller_description }}</p>
          </div>

          <!-- DONE -->
          <div v-if="guarantee.status === 'DONE'" class="p-3 border-t bg-green-50">
            <div class="flex items-center gap-2">
              <UIcon name="mdi:check-circle" class="size-4 text-green-600" />
              <span class="text-sm font-medium text-green-700">Penjual telah mengirimkan akun garansi</span>
            </div>
            <p v-if="guarantee.seller_description" class="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{{ guarantee.seller_description }}</p>
            <div v-if="guarantee.file_url" class="mt-2">
              <UButton icon="mdi:download" color="primary" variant="soft" size="sm" @click="downloadFile(config.public.backendUrl + '/' + guarantee.file_url)">
                {{ guarantee.file_ori_name }}
              </UButton>
            </div>
          </div>

          <!-- Keluhan -->
          <div class="p-3 border-t bg-white">
            <p class="text-sm font-medium text-gray-700">Keluhan:</p>
            <p class="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{{ guarantee.complain_description }}</p>
          </div>
        </div>

        <!-- GARANSI PRODUK: Countdown masa garansi + tombol klaim -->
        <div
          v-if="(transaction?.status === 'DONE' || transaction?.status === 'COMPLETE') && hasGuaranteePeriod"
          class="mt-4 w-full rounded-lg overflow-hidden border"
          :class="isGuaranteePeriodExpired ? 'border-gray-300' : 'border-yellow-300'"
        >
          <div class="flex items-center gap-2 p-3" :class="isGuaranteePeriodExpired ? 'bg-gray-50' : 'bg-yellow-50'">
            <UIcon
              name="material-symbols:shield"
              class="size-5"
              :class="isGuaranteePeriodExpired ? 'text-gray-400' : 'text-yellow-600'"
            />
            <span class="font-semibold" :class="isGuaranteePeriodExpired ? 'text-gray-500' : 'text-yellow-800'">
              Garansi Produk
            </span>
            <span class="text-xs text-gray-400 ml-1">({{ transaction?.product?.guarantee_days }} hari)</span>
          </div>

          <!-- Aktif: Countdown -->
          <div v-if="!isGuaranteePeriodExpired" class="p-3 border-t bg-white flex flex-col items-center gap-2 text-center">
            <p class="text-xs text-gray-500">Sisa masa garansi</p>
            <div class="text-3xl font-mono font-bold tracking-widest text-yellow-600">
              {{ guaranteePeriodDisplay }}
            </div>
            <p class="text-xs text-gray-400">
              Berlaku hingga {{ dayjs(transaction?.done_at).add(transaction?.product?.guarantee_days ?? 0, 'day').format('D MMM YYYY HH:mm') }}
            </p>
            <div v-if="!guarantee" class="pt-1">
              <p class="text-sm text-gray-500 mb-2">Produk tidak sesuai? Ajukan klaim garansi untuk mendapatkan akun pengganti.</p>
              <UButton icon="material-symbols:shield" color="warning" variant="solid" size="sm" @click="isGuaranteeClaimModal = true">
                Klaim Garansi
              </UButton>
            </div>
          </div>

          <!-- Kadaluarsa -->
          <div v-else class="p-3 border-t bg-gray-50 flex items-center justify-center gap-2 text-gray-400 text-sm">
            <UIcon name="material-symbols:shield-outline" class="size-4" />
            <span>Masa garansi telah berakhir</span>
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
            <div v-if="reviews[0]?.user_type !== 'BUYER' && reviews[1]?.user_type !== 'BUYER'">
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
            <div v-if="reviews[0]?.user_type === 'BUYER' || reviews[1]?.user_type === 'BUYER'">
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
                          <UButton icon="mdi:download" color="primary" variant="soft" size="xs" @click="downloadFile(config.public.backendUrl + '/' + orderDiscussion.file?.url)">{{ orderDiscussion.file?.ori_name }}</UButton>
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
                      <template v-if="orderDiscussion.discussion_type !== DiscussionType.MESSAGE">
                        <UBadge v-if="orderDiscussion.discussion_type === DiscussionType.ORDER_DELIVERY" class="max-w-44">Penjual Mengirim Pesanan</UBadge>
                        <UBadge v-else-if="orderDiscussion.discussion_type === DiscussionType.GUARANTEE" color="warning" class="max-w-44">Penjual Mengirim Garansi</UBadge>
                        <UBadge v-else-if="orderDiscussion.discussion_type === DiscussionType.AUTO_DELIVERY" class="max-w-44">Otomatis Kirim Akun</UBadge>
                        <UBadge v-else-if="orderDiscussion.discussion_type === DiscussionType.STOCK_DELIVERY" class="max-w-44">Otomatis Kirim Akun (Stocking)</UBadge>
                      </template>
                      <div class="text-gray-600">{{ orderDiscussion.message }}</div>
                      <div v-if="orderDiscussion.file" class="flex flex-row items-center gap-1"> <!-- File yang sudah diupload, klik untuk download -->
                        <NuxtLink v-if="isImage(orderDiscussion.file.format)" :to="config.public.backendUrl +'/'+ orderDiscussion.file.url">
                          <NuxtImg :src="config.public.backendUrl +'/'+ orderDiscussion.file.url" width="100" height="100" />
                        </NuxtLink>
                        <div v-else>
                          <UButton icon="mdi:download" color="primary" variant="soft" size="xs" @click="downloadFile(config.public.backendUrl + '/' + orderDiscussion.file?.url)">{{ orderDiscussion.file?.ori_name }}</UButton>
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
                      <template v-if="orderDiscussion.discussion_type !== DiscussionType.MESSAGE">
                        <UBadge v-if="orderDiscussion.discussion_type === DiscussionType.ORDER_DELIVERY" class="max-w-44">Penjual Mengirim Pesanan</UBadge>
                        <UBadge v-else-if="orderDiscussion.discussion_type === DiscussionType.GUARANTEE" color="warning" class="max-w-44">Penjual Mengirim Garansi</UBadge>
                        <UBadge v-else-if="orderDiscussion.discussion_type === DiscussionType.AUTO_DELIVERY">Otomatis Kirim Akun</UBadge>
                        <UBadge v-else-if="orderDiscussion.discussion_type === DiscussionType.STOCK_DELIVERY">Otomatis Kirim Akun (Stocking)</UBadge>
                      </template>
                      <div class="text-gray-600">{{ orderDiscussion.message }}</div>
                      <div v-if="orderDiscussion.file" class="flex flex-row items-center gap-1"> <!-- File yang sudah diupload, klik untuk download -->
                        <div v-if="isImage(orderDiscussion.file.format)">
                          <NuxtImg :src="config.public.backendUrl +'/'+ orderDiscussion.file.url" width="100" height="100" />
                        </div>
                        <div v-else>
                          <UButton icon="mdi:download" color="primary" variant="soft" size="xs" @click="downloadFile(config.public.backendUrl + '/' + orderDiscussion.file?.url)">{{ orderDiscussion.file?.ori_name }}</UButton>
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

            <div v-if="orderDiscussions && orderDiscussions.total_pages > 1" class="flex justify-center pt-3">
              <UPagination
                :page="discussionPage + 1"
                :total="orderDiscussions.total_elements"
                :items-per-page="discussionSize"
                :sibling-count="1"
                show-edges
                @update:page="(p : any) => { discussionPage = p - 1 }"
              />
            </div>
          </div>
        </div>

        <div class="mt-4 w-full bg-gray-100 p-2 rounded-lg overflow-hidden " v-if="transaction?.status !== 'COMPLETE' && transaction?.status !== 'REJECTED' && transaction?.status !== 'EXPIRED' && transaction?.status !== 'CANCELLED' && transaction?.status !== 'REFUNDED'">
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

  <ChatModalBuyer
    v-model="isChatOpen"
    :transaction="transaction"
    :merchant-id="transaction?.product.merchant_id"
  />

  <GuaranteeClaimModal
    v-model="isGuaranteeClaimModal"
    :error="guaranteeClaimError"
    :loading="isSubmitting"
    @submit="handleGuaranteeClaim"
  />

</template>

<script setup lang="ts">
import { NuxtImg, UTextarea } from '#components'
import type { SelectItem } from '@nuxt/ui'
import dayjs from 'dayjs'
import TransactionStatusBadge from '~/components/app/TransactionStatusBadge.vue'
import ChatModalBuyer from '~/components/form/ChatModalBuyer.vue'
import ConfirmDialog from '~/components/form/ConfirmDialog.vue'
import GuaranteeClaimModal from '~/components/form/GuaranteeClaimModal.vue'
import RejectOrderModal from '~/components/form/RejectOrderModal.vue'
import RequestArbitrageModal from '~/components/form/RequestArbitrageModal.vue'
import RequestCancelModal from '~/components/form/RequestCancelModal.vue'
import { useGuaranteeApi } from '~/composables/api/guarantee'
import { useOrderDiscussionApi } from '~/composables/api/order-discussion'
import { useReviewApi } from '~/composables/api/review'
import { useTransactionApi } from '~/composables/api/transaction'
import type { GuaranteeResponse, GuaranteeStatus } from '~/types/guarantee/GuaranteeResponse'
import { DiscussionType } from '~/types/order-discussion/DiscussionType'
import type { OrderDiscussionResponse } from '~/types/order-discussion/OrderDiscussionResponse'
import type { PageResponse } from '~/types/PageResponse'
import type { ReviewRequest } from '~/types/review/ReviewRequest'
import type { ReviewResponse } from '~/types/review/ReviewResponse'
import type { TransactionResponse } from '~/types/TransactionResponse'

// Ambil API function
const { fetchTransactionById, fetchAcceptOrder, fetchRejectOrder, fetchCancelTxRequest, fetchRejectCancelRequest, fetchArbitrageRequest } = useTransactionApi()
const { fetchCreateOrderDiscussion, fetchOrderDiscussionByTxId, fetchFileOrderByTxId } = useOrderDiscussionApi()
const { fetchCreateReview,fetchReviewByTransaction,fetchUpdateReview } = useReviewApi()
const { fetchCreateGuarantee, fetchGuaranteeByTransaction } = useGuaranteeApi()


// Ambil parameter route
const route = useRoute()

const breadcrumb = computed(() => [
  { label: 'Home', icon: 'i-lucide-home', to: '/' },
  { label: 'Riwayat Transaksi', icon: 'i-heroicons-shopping-bag', to: '/transaction' },
  { label: `#${route.params.id}`, icon: 'i-heroicons-eye' },
])

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
  const fileDiscussion = ref<File | null>(null)

  // Modal state
  const isConfirmDoneModal = ref<boolean>(false)
  const isCancelRequestModal = ref<boolean>(false)
  const cancelTxRequestError = ref<string | null>(null)
  const isArbitrageRequestModal = ref<boolean>(false)
  const arbitrageRequestError = ref<string | null>(null)
  const isRejectingOrderModal = ref<boolean>(false)
  const rejectOrderError = ref<string | null>(null)
  const isGuaranteeClaimModal = ref<boolean>(false)
  const guaranteeClaimError = ref<string | null>(null)
  const isSubmitting = ref<boolean>(false)
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

  const fileOrderPage = ref(0)
  const fileOrderSize = ref(1)

  const {
    data: fileOrders,
    pending: pendingFileOrders,
    refresh: refreshFileOrders,
  } = useAsyncData<PageResponse<OrderDiscussionResponse>>(
    () => `file-orders-${route.params.id}-${fileOrderPage.value}`,
    () => fetchFileOrderByTxId(route.params.id as string, fileOrderPage.value, fileOrderSize.value),
    { watch: [fileOrderPage], server: false }
  )

  // ===== GARANSI =====
  const {
    data: guarantee,
    refresh: refreshGuarantee,
  } = useAsyncData<GuaranteeResponse | null>(
    `guarantee-${route.params.id}`,
    () => fetchGuaranteeByTransaction(route.params.id as string),
    { default: () => null, server: false }
  )



  const guaranteeStatusLabel = (status: GuaranteeStatus): string => {
    const map: Record<GuaranteeStatus, string> = {
      IN_REVIEW: 'Sedang Ditinjau', REJECTED: 'Ditolak', IN_PROGRESS: 'Diproses', DONE: 'Selesai',
    }
    return map[status] ?? status
  }

  const guaranteeStatusColor = (status: GuaranteeStatus) => {
    const map: Record<GuaranteeStatus, 'warning' | 'error' | 'info' | 'success'> = {
      IN_REVIEW: 'warning', REJECTED: 'error', IN_PROGRESS: 'info', DONE: 'success',
    }
    return map[status] ?? 'warning'
  }

  // ===== COUNTDOWN GARANSI =====
  const guaranteeNow = ref(dayjs())
  let guaranteeTimer: ReturnType<typeof setInterval> | null = null

  watch(guarantee, (g) => {
    if (g?.status === 'IN_REVIEW' || g?.status === 'IN_PROGRESS') {
      guaranteeNow.value = dayjs()
      if (!guaranteeTimer) guaranteeTimer = setInterval(() => { guaranteeNow.value = dayjs() }, 1000)
    } else {
      if (guaranteeTimer) { clearInterval(guaranteeTimer); guaranteeTimer = null }
    }
  }, { immediate: true })

  const guaranteeCountdownSeconds = computed(() => {
    const g = guarantee.value
    if (!g) return 0
    const deadline = g.status === 'IN_REVIEW' ? g.review_deadline : g.status === 'IN_PROGRESS' ? g.progress_deadline : null
    if (!deadline) return 0
    return Math.max(0, dayjs(deadline).diff(guaranteeNow.value, 'second'))
  })

  const guaranteeCountdownDisplay = computed(() => {
    const s = guaranteeCountdownSeconds.value
    const d = Math.floor(s / 86400)
    const h = Math.floor((s % 86400) / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (d > 0) return `${d}h ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  })

  const isGuaranteeDeadlineExpired = computed(() => guaranteeCountdownSeconds.value <= 0)

  const handleGuaranteeClaim = async (description: string) => {
    try {
      isSubmitting.value = true
      guaranteeClaimError.value = null
      await fetchCreateGuarantee({
        transaction_id: route.params.id as string,
        complain_description: description,
      })
      toast.add({
        title: 'Berhasil',
        description: 'Klaim garansi berhasil diajukan, silahkan tunggu respon penjual',
        color: 'success',
      })
      isGuaranteeClaimModal.value = false
      await refreshGuarantee()
    } catch (err: any) {
      guaranteeClaimError.value = err.message || 'Gagal mengajukan klaim garansi'
      toast.add({
        title: 'Gagal',
        description: err.message || 'Gagal mengajukan klaim garansi',
        color: 'error',
      })
    } finally {
      isSubmitting.value = false
    }
  }

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
      formData.append("discussionType", DiscussionType.MESSAGE)
      if(fileDiscussion.value) formData.append("file", fileDiscussion.value)
      await fetchCreateOrderDiscussion(formData)
      toast.add({
        title: "Berhasil",
        description: "Pesan terkirim",
        color: "success",
        icon: "material-symbols:check-circle-outline"
      })
      discussionMessage.value = '' // reset textarea
      fileDiscussion.value = null // reset file input
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

  // ===== COUNTDOWN AUTO CANCEL =====
  const countdownSeconds = ref(0)
  let countdownTimer: ReturnType<typeof setInterval> | null = null

  const updateCountdown = () => {
    if (!transaction.value?.expired_at) return
    countdownSeconds.value = Math.max(0, dayjs(transaction.value.expired_at).diff(dayjs(), 'second'))
  }

  const countdownDisplay = computed(() => {
    const s = countdownSeconds.value
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  })

  const isCountdownExpired = computed(() => countdownSeconds.value <= 0)

  watch(
    () => transaction.value?.status,
    (status) => {
      if (status === 'UNPAID') {
        updateCountdown()
        if (!countdownTimer) {
          countdownTimer = setInterval(updateCountdown, 1000)
        }
      } else {
        if (countdownTimer) {
          clearInterval(countdownTimer)
          countdownTimer = null
        }
      }
    },
    { immediate: true }
  )

  // ===== COUNTDOWN MASA GARANSI (done_at + guarantee_days) =====
  const guaranteePeriodSeconds = ref(0)
  let guaranteePeriodTimer: ReturnType<typeof setInterval> | null = null

  const updateGuaranteePeriodCountdown = () => {
    const doneAt = transaction.value?.done_at
    const guaranteeDays = transaction.value?.product?.guarantee_days
    if (!doneAt || !guaranteeDays) return
    guaranteePeriodSeconds.value = Math.max(0, dayjs(doneAt).add(guaranteeDays, 'day').diff(dayjs(), 'second'))
  }

  const hasGuaranteePeriod = computed(() =>
    !!transaction.value?.done_at
    && !!transaction.value?.product?.guarantee_days
    && transaction.value.product.guarantee_days > 0
  )

  const guaranteePeriodDisplay = computed(() => {
    const s = guaranteePeriodSeconds.value
    const d = Math.floor(s / 86400)
    const h = Math.floor((s % 86400) / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    if (d > 0) return `${d}h ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  })

  const isGuaranteePeriodExpired = computed(() => guaranteePeriodSeconds.value <= 0 && hasGuaranteePeriod.value)

  watch(
    () => transaction.value?.status,
    (status) => {
      if (status === 'DONE' || status === 'COMPLETE') {
        updateGuaranteePeriodCountdown()
        if (!guaranteePeriodTimer) {
          guaranteePeriodTimer = setInterval(updateGuaranteePeriodCountdown, 1000)
        }
      } else {
        if (guaranteePeriodTimer) { clearInterval(guaranteePeriodTimer); guaranteePeriodTimer = null }
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    if (countdownTimer) clearInterval(countdownTimer)
    if (confirmTimer) clearInterval(confirmTimer)
    if (deliveredTimer) clearInterval(deliveredTimer)
    if (rejectTimer) clearInterval(rejectTimer)
    if (kliringTimer) clearInterval(kliringTimer)
    if (cancelRequestTimer) clearInterval(cancelRequestTimer)
    if (guaranteeTimer) clearInterval(guaranteeTimer)
    if (guaranteePeriodTimer) clearInterval(guaranteePeriodTimer)
  })

  // ===== COUNTDOWN KONFIRMASI SELLER (paid_at + 24 jam) =====
  const confirmSeconds = ref(0)
  let confirmTimer: ReturnType<typeof setInterval> | null = null

  const updateConfirmCountdown = () => {
    if (!transaction.value?.paid_at) return
    confirmSeconds.value = Math.max(0, dayjs(transaction.value.paid_at).add(24, 'hour').diff(dayjs(), 'second'))
  }

  const confirmCountdownDisplay = computed(() => {
    const s = confirmSeconds.value
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  })

  const isConfirmExpired = computed(() => confirmSeconds.value <= 0)

  watch(
    () => transaction.value?.status,
    (status) => {
      if (status === 'PAID') {
        updateConfirmCountdown()
        if (!confirmTimer) {
          confirmTimer = setInterval(updateConfirmCountdown, 1000)
        }
      } else {
        if (confirmTimer) {
          clearInterval(confirmTimer)
          confirmTimer = null
        }
      }
    },
    { immediate: true }
  )

  // ===== COUNTDOWN AUTO COMPLETE (delivered_at + 24 jam) =====
  const deliveredSeconds = ref(0)
  let deliveredTimer: ReturnType<typeof setInterval> | null = null

  const updateDeliveredCountdown = () => {
    if (!transaction.value?.delivered_at) return
    deliveredSeconds.value = Math.max(0, dayjs(transaction.value.delivered_at).add(24, 'hour').diff(dayjs(), 'second'))
  }

  const deliveredCountdownDisplay = computed(() => {
    const s = deliveredSeconds.value
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  })

  const isDeliveredExpired = computed(() => deliveredSeconds.value <= 0)

  watch(
    () => transaction.value?.status,
    (status) => {
      if (status === 'DELIVERED') {
        updateDeliveredCountdown()
        if (!deliveredTimer) {
          deliveredTimer = setInterval(updateDeliveredCountdown, 1000)
        }
      } else {
        if (deliveredTimer) {
          clearInterval(deliveredTimer)
          deliveredTimer = null
        }
      }
    },
    { immediate: true }
  )

  // ===== ESTIMASI PENGIRIMAN (confirmed_at + delivery_days) =====
  const deliveryDeadline = computed(() => {
    const confirmedAt = transaction.value?.confirmed_at
    const deliveryDays = transaction.value?.product?.delivery_days
    if (!confirmedAt || !deliveryDays) return null
    return dayjs(confirmedAt).add(deliveryDays, 'day')
  })

  const deliveryDeadlineDisplay = computed(() =>
    deliveryDeadline.value ? deliveryDeadline.value.format('D MMM YYYY HH:mm') : '-'
  )

  const isDeliveryExpired = computed(() =>
    !!deliveryDeadline.value && dayjs().isAfter(deliveryDeadline.value)
  )

  // ===== COUNTDOWN PEMROSESAN PENOLAKAN (rejected_at + 24 jam) =====
  const rejectSeconds = ref(0)
  let rejectTimer: ReturnType<typeof setInterval> | null = null

  const updateRejectCountdown = () => {
    if (!transaction.value?.rejected_at) return
    rejectSeconds.value = Math.max(0, dayjs(transaction.value.rejected_at).add(24, 'hour').diff(dayjs(), 'second'))
  }

  const rejectCountdownDisplay = computed(() => {
    const s = rejectSeconds.value
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  })

  const isRejectExpired = computed(() => rejectSeconds.value <= 0)

  watch(
    () => transaction.value?.status,
    (status) => {
      if (status === 'REJECT') {
        updateRejectCountdown()
        if (!rejectTimer) {
          rejectTimer = setInterval(updateRejectCountdown, 1000)
        }
      } else {
        if (rejectTimer) {
          clearInterval(rejectTimer)
          rejectTimer = null
        }
      }
    },
    { immediate: true }
  )

  // ===== COUNTDOWN KLIRING DANA (done_at + 24 jam) =====
  const kliringSeconds = ref(0)
  let kliringTimer: ReturnType<typeof setInterval> | null = null

  const updateKliringCountdown = () => {
    if (!transaction.value?.done_at) return
    kliringSeconds.value = Math.max(0, dayjs(transaction.value.done_at).add(24, 'hour').diff(dayjs(), 'second'))
  }

  const kliringCountdownDisplay = computed(() => {
    const s = kliringSeconds.value
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  })

  const isKliringExpired = computed(() => kliringSeconds.value <= 0)

  watch(
    () => transaction.value?.status,
    (status) => {
      if (status === 'DONE') {
        updateKliringCountdown()
        if (!kliringTimer) {
          kliringTimer = setInterval(updateKliringCountdown, 1000)
        }
      } else {
        if (kliringTimer) {
          clearInterval(kliringTimer)
          kliringTimer = null
        }
      }
    },
    { immediate: true }
  )

  // ===== COUNTDOWN CANCEL REQUEST (updated_at + 24 jam) =====
  const cancelRequestSeconds = ref(0)
  let cancelRequestTimer: ReturnType<typeof setInterval> | null = null

  const updateCancelRequestCountdown = () => {
    if (!transaction.value?.updated_at) return
    cancelRequestSeconds.value = Math.max(0, dayjs(transaction.value.updated_at).add(24, 'hour').diff(dayjs(), 'second'))
  }

  const cancelRequestCountdownDisplay = computed(() => {
    const s = cancelRequestSeconds.value
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  })

  const isCancelRequestExpired = computed(() => cancelRequestSeconds.value <= 0)

  watch(
    () => transaction.value?.status,
    (status) => {
      if (status === 'CANCEL_REQUEST') {
        updateCancelRequestCountdown()
        if (!cancelRequestTimer) {
          cancelRequestTimer = setInterval(updateCancelRequestCountdown, 1000)
        }
      } else {
        if (cancelRequestTimer) {
          clearInterval(cancelRequestTimer)
          cancelRequestTimer = null
        }
      }
    },
    { immediate: true }
  )

  const refreshHandler = () => {
    refreshTransaction()
    refreshOrderDiscussion()
    refreshReviews()
    refreshFileOrders()
    refreshGuarantee()
  }



</script>