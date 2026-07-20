<template>
  <div class="space-y-6">

    <!-- Back + Header -->
    <div class="flex items-center gap-3">
      <UButton icon="i-heroicons-arrow-left" variant="ghost" color="neutral" to="/admin/payment" />
      <div>
        <h1 class="text-lg font-bold text-gray-800">Detail Pembayaran</h1>
        <p class="text-xs text-gray-400 font-mono">#{{ paymentId }}</p>
      </div>
    </div>

    <!-- Loading -->
    <AppLoadingSkeleton v-if="pendingPayment" />

    <!-- Error -->
    <UAlert
      v-else-if="paymentError"
      title="Gagal memuat data"
      :description="paymentError.message"
      icon="mdi:alert-circle:error"
      color="error"
    />

    <template v-else-if="payment">

      <!-- Payment Info Card -->
      <UCard class="shadow-sm">
        <template #header>
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-3">
              <div
                :class="`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${payment.payment_type === 'DEPOSIT' ? 'bg-green-100' : 'bg-primary/10'}`"
              >
                <UIcon
                  :name="payment.payment_type === 'DEPOSIT' ? 'i-heroicons-arrow-down-circle' : 'i-heroicons-shopping-bag'"
                  :class="`text-lg ${payment.payment_type === 'DEPOSIT' ? 'text-green-600' : 'text-primary'}`"
                />
              </div>
              <div>
                <p class="font-semibold text-gray-800">Informasi Pembayaran</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <UBadge
                    :color="payment.payment_type === 'DEPOSIT' ? 'success' : 'primary'"
                    variant="subtle"
                    size="xs"
                  >
                    {{ payment.payment_type === 'DEPOSIT' ? 'Deposit' : 'Transaksi' }}
                  </UBadge>
                  <UBadge v-if="payment.payment_method" color="info" variant="soft" size="xs">
                    {{ payment.payment_method.name }}
                  </UBadge>
                </div>
              </div>
            </div>
            <PaymentStatusBadge :status="payment.status" />
          </div>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- ID -->
          <div>
            <p class="text-xs text-gray-400 mb-1">Payment ID</p>
            <p class="text-sm font-mono font-semibold text-gray-800 break-all">{{ payment.id }}</p>
          </div>

          <!-- Amount -->
          <div>
            <p class="text-xs text-gray-400 mb-1">Rincian Nominal</p>
            <div class="space-y-1">
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Nominal</span>
                <span class="font-medium text-gray-800">Rp {{ payment.amount.toLocaleString('id-ID') }}</span>
              </div>
              <div v-if="payment.unique_code" class="flex justify-between text-sm">
                <span class="text-gray-500">Kode Unik</span>
                <span class="font-mono font-semibold text-amber-600">+{{ payment.unique_code }}</span>
              </div>
              <div v-if="payment.app_fee" class="flex justify-between text-sm">
                <span class="text-gray-500">Biaya Aplikasi</span>
                <span class="text-gray-700">Rp {{ payment.app_fee.toLocaleString('id-ID') }}</span>
              </div>
              <div v-if="payment.gateway_fee" class="flex justify-between text-sm">
                <span class="text-gray-500">Biaya Gateway</span>
                <span class="text-gray-700">Rp {{ payment.gateway_fee.toLocaleString('id-ID') }}</span>
              </div>
              <div v-if="payment.discount_amount && payment.discount_amount > 0" class="flex justify-between text-sm">
                <span class="text-gray-500">Diskon</span>
                <span class="text-green-600">- Rp {{ payment.discount_amount.toLocaleString('id-ID') }}</span>
              </div>
              <div class="flex justify-between text-sm pt-1 border-t border-gray-200 mt-1">
                <span class="font-semibold text-gray-800">Total</span>
                <span class="font-bold text-gray-900">Rp {{ (payment.total_amount ?? payment.amount).toLocaleString('id-ID') }}</span>
              </div>
            </div>
          </div>

          <!-- Status -->
          <div>
            <p class="text-xs text-gray-400 mb-1">Status</p>
            <PaymentStatusBadge :status="payment.status" />
          </div>

          <!-- Payment Method -->
          <div>
            <p class="text-xs text-gray-400 mb-1">Metode Pembayaran</p>
            <p class="text-sm text-gray-700">
              {{ payment.payment_method?.name ?? '-' }}
              <span v-if="payment.payment_method?.description" class="text-gray-400">
                · {{ payment.payment_method.description }}
              </span>
            </p>
          </div>

          <!-- User -->
          <div>
            <p class="text-xs text-gray-400 mb-1">Pengguna</p>
            <p class="text-sm font-semibold text-gray-700">{{ payment.user?.full_name ?? payment.user?.username ?? '-' }}</p>
            <p class="text-xs text-gray-400">{{ payment.user?.email ?? '' }}</p>
          </div>

          <!-- Dates -->
          <div>
            <p class="text-xs text-gray-400 mb-1">Tanggal</p>
            <p class="text-sm text-gray-700">{{ dayjs(payment.created_at).format('DD MMM YYYY, HH:mm') }}</p>
            <p v-if="payment.updated_at" class="text-xs text-gray-400">
              Diperbarui: {{ dayjs(payment.updated_at).format('DD MMM YYYY, HH:mm') }}
            </p>
          </div>
        </div>

        <!-- Bukti Pembayaran -->
        <div v-if="payment.payment_proof_url" class="mt-6 pt-4 border-t border-gray-100">
          <p class="text-xs text-gray-400 mb-3">Bukti Pembayaran</p>
          <a
            :href="getImageUrl(payment.payment_proof_url)"
            target="_blank"
            class="inline-block"
          >
            <img
              :src="getImageUrl(payment.payment_proof_url)"
              alt="Bukti Pembayaran"
              class="max-h-64 rounded-xl border border-gray-200 shadow-sm object-contain hover:opacity-90 transition-opacity"
            />
          </a>
        </div>

        <!-- Actions -->
        <div v-if="canConfirm(payment)" class="mt-6 pt-4 border-t border-gray-100 flex gap-3">
          <UButton
            color="success"
            icon="i-heroicons-check-circle"
            @click="handleConfirm(payment.id)"
          >
            Konfirmasi Pembayaran
          </UButton>
          <UButton
            color="error"
            variant="outline"
            icon="i-heroicons-x-circle"
            @click="handleReject(payment.id)"
          >
            Tolak Pembayaran
          </UButton>
        </div>
      </UCard>

      <!-- Transactions Section (only for TRANSACTION type) -->
      <template v-if="payment.payment_type === 'TRANSACTION'">
        <UCard class="shadow-sm">
          <template #header>
            <div class="flex items-center justify-between flex-wrap gap-2">
              <p class="font-semibold text-gray-800">
                Detail Transaksi
                <span v-if="txData?.total_elements" class="text-xs text-gray-400 font-normal ml-2">
                  ({{ txData.total_elements }} item)
                </span>
              </p>
              <div class="flex gap-2">
                <UInput
                  v-model="txSearch"
                  placeholder="Cari transaksi..."
                  icon="i-heroicons-magnifying-glass"
                  size="xs"
                  class="w-48"
                  clearable
                  @keyup.enter="applyTxSearch"
                />
                <UButton icon="mdi:refresh" size="xs" color="neutral" variant="outline" :loading="pendingTx" @click="refreshTx()" />
              </div>
            </div>
          </template>

          <AppLoadingSkeleton v-if="pendingTx" />

          <UAlert
            v-else-if="txError"
            title="Gagal memuat transaksi"
            :description="txError.message"
            icon="mdi:alert-circle:error"
            color="error"
          />

          <div v-else-if="!txData?.content?.length" class="py-8 text-center text-gray-400 text-sm">
            <UIcon name="i-heroicons-inbox" class="text-4xl text-gray-300 mb-2" />
            <p>Tidak ada transaksi terkait.</p>
          </div>

          <div v-else class="divide-y divide-gray-100">
            <div
              v-for="tx in txData.content"
              :key="tx.id"
              class="flex flex-col sm:flex-row sm:items-center gap-4 py-4 px-2 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <NuxtLink :to="`/admin/order/${tx.id}`" class="flex items-center gap-4 flex-1 min-w-0">
                <!-- Product Image -->
                <NuxtImg 
                  :src="getImageUrl(tx.product?.banner_url)"
                  :alt="tx.product?.name"
                  width="50" 
                  height="50" 
                  class="w-14 h-14 rounded-xl object-cover border border-gray-100 flex-shrink-0"
                />

                <!-- Product Info -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold text-gray-800 truncate">{{ tx.product?.name ?? '-' }}</p>
                  <p class="text-xs text-gray-400 mt-0.5">
                    {{ tx.buyer_username }} · {{ tx.qty }} item
                  </p>
                  <p v-if="tx.tx_description" class="text-xs text-gray-500 mt-1 truncate">{{ tx.tx_description }}</p>
                </div>
                <!-- Price -->
                <div class="">
                  <p class="text-xs text-gray-400">{{ tx.qty }} × Rp {{ tx.price.toLocaleString('id-ID') }}</p>
                  <p class="text-sm font-bold text-gray-800">Rp {{ tx.total_price.toLocaleString('id-ID') }}</p>
                </div>
              </NuxtLink>

              <div class="flex flex-col ml-auto">
                <!-- Status -->
                <div class="">
                  <AppTransactionStatusBadge :status="tx.status" />
                </div>

                <!-- Date -->
                <div class="text-xs text-gray-400  text-right">
                  {{ dayjs(tx.created_at).format('DD MMM YYYY') }}
                </div>
              </div>
              

              
            </div>
          </div>

          <!-- Tx Pagination -->
          <div
            v-if="txData && txData.total_pages > 1 && !pendingTx"
            class="flex justify-center items-center pt-4"
          >
            <UPagination
              :page="txPage + 1"
              :total="txData.total_elements"
              :items-per-page="txSize"
              :sibling-count="1"
              show-edges
              @update:page="(p) => { txPage = p - 1; refreshTx() }"
            />
          </div>
        </UCard>
      </template>

    </template>

  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import PaymentStatusBadge from '~/components/app/PaymentStatusBadge.vue'
import AppTransactionStatusBadge from '~/components/app/TransactionStatusBadge.vue'
import { useBalanceApi } from '~/composables/api/balance'
import { usePaymentApi } from '~/composables/api/payment'
import type { PageResponse } from '~/types/PageResponse'
import type { PaymentResponse } from '~/types/payment/PaymentResponse'
import type { TransactionResponse } from '~/types/TransactionResponse'

definePageMeta({ layout: 'admin', label: 'Detail Pembayaran' })

const route = useRoute()
const toast = useToast()
const { fetchPaymentById, fetchTxByPaymentId, fetchConfirmPayment, fetchRejectPayment } = usePaymentApi()
  const { fetchDepositCancel } = useBalanceApi()

const paymentId = computed(() => route.params.id as string)

// ===== PAYMENT =====
const {
  data: payment,
  pending: pendingPayment,
  error: paymentError,
  refresh: refreshPayment,
} = useAsyncData<PaymentResponse>(
  () => `admin-payment-${paymentId.value}`,
  () => fetchPaymentById(paymentId.value),
  { server: false }
)

// ===== TRANSACTIONS (only fetched when TRANSACTION type) =====
const txPage = ref(0)
const txSize = ref(20)
const txSearch = ref('')
const txKeyword = ref('')

let txSearchTimeout: ReturnType<typeof setTimeout> | null = null

const {
  data: txData,
  pending: pendingTx,
  error: txError,
  refresh: refreshTx,
} = useAsyncData<PageResponse<TransactionResponse>>(
  () => `admin-payment-tx-${paymentId.value}-${txPage.value}-${txKeyword.value}`,
  () => fetchTxByPaymentId(paymentId.value, txPage.value, txSize.value, txKeyword.value),
  {
    watch: [txPage],
    server: false,
    immediate: false,
  }
)

// Fetch transactions once payment data is available and is TRANSACTION type
watch(payment, (val) => {
  if (val?.payment_type === 'TRANSACTION') refreshTx()
}, { immediate: true })

watch(txSearch, (val) => {
  if (txSearchTimeout) clearTimeout(txSearchTimeout)
  txSearchTimeout = setTimeout(() => {
    txKeyword.value = val
    txPage.value = 0
    refreshTx()
  }, 500)
})

function applyTxSearch() {
  if (txSearchTimeout) clearTimeout(txSearchTimeout)
  txKeyword.value = txSearch.value
  txPage.value = 0
  refreshTx()
}

  // ===== HELPERS =====
  function canConfirm(payment: PaymentResponse) {
    return payment.status === 'UNPAID' && (payment.payment_type === 'DEPOSIT' || payment.payment_method?.id === 'MANUAL_BANK')
  }



  // ===== CONFIRM =====
  const { confirm, close } = useConfirm()

  async function handleConfirm(paymentId: string) {
    
    const yes = await confirm({
      title: 'Konfirmasi Pembayaran?',
      message: 'Pembayaran yang dikonfirmasi tidak bisa dibatalkan. Yakin?',
      confirmText: 'Ya, Konfirmasi',
      cancelText: 'Tidak',
      confirmColor: 'success',
    })
    
    if (!yes) return

    try {
      await fetchConfirmPayment(paymentId)
      toast.add({ title: 'Pembayaran dikonfirmasi', color: 'success', icon: 'i-heroicons-check-circle' })
      await refreshPayment()
    } catch (err: any) {
      toast.add({ title: 'Gagal konfirmasi', description: err.statusMessage || err.message, color: 'error' })
    } finally {
      close()
    }
  }

  // ===== REJECT =====

  async function handleReject(paymentId: string) {
    
    const yes = await confirm({
      title: 'Batalkan Deposit?',
      message: 'Deposit yang dibatalkan tidak bisa dikembalikan. Yakin?',
      confirmText: 'Ya, Batalkan',
      cancelText: 'Tidak',
      confirmColor: 'error',
    })
    
    if (!yes) return

    try {
      await fetchDepositCancel(paymentId)
      toast.add({ title: 'Pembayaran dibatalkan', color: 'success', icon: 'i-heroicons-check-circle' })
      await refreshPayment()
    } catch (err: any) {
      toast.add({ title: 'Gagal membatalkan', description: err.statusMessage || err.message, color: 'error' })
    } finally {
      close()
    }
  }
</script>
