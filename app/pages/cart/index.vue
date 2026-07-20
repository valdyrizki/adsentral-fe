<template>
  <div class="bg-white">
    <div class="mx-auto max-w-2xl px-2 pt-4 pb-4  lg:max-w-7xl lg:px-4">
      <UBreadcrumb :items="breadcrumb" class="mb-3" />
      <h1 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Keranjang Belanja</h1>
      <form class="mt-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
        <section aria-labelledby="cart-heading" class="lg:col-span-7">
          <h2 id="cart-heading" class="sr-only">Items in your shopping cart</h2>

          <!-- Sinkronisasi data keranjang -->
          <UAlert
            v-if="syncing"
            icon="i-heroicons-arrow-path"
            color="info"
            variant="subtle"
            title="Menyinkronkan keranjang..."
            description="Memperbarui data produk terbaru dari server."
            class="mb-4"
          />

          <!-- Peringatan jika ada item tidak tersedia -->
          <UAlert
            v-if="hasUnavailableItems"
            icon="i-heroicons-exclamation-triangle"
            color="warning"
            variant="subtle"
            title="Beberapa produk tidak tersedia"
            description="Hapus produk yang tidak tersedia untuk melanjutkan checkout."
            class="mb-4"
          />

          <ul role="list" class="divide-y divide-gray-200 border-t border-b border-gray-200">
            <li
              v-for="cartItem in cartStore.items"
              :key="cartItem.product_id"
              class="flex py-6 sm:py-10"
              :class="{ 'opacity-60': cartItem.product?.status !== 'ACTIVE' }"
            >
              <div class="shrink-0 relative">
                <img :src="getImageUrl(cartItem.product?.banner_url)" :alt="cartItem.product?.name" class="size-24 rounded-md object-cover sm:size-48" />
                <UBadge
                  v-if="cartItem.product?.status !== 'ACTIVE'"
                  color="error"
                  variant="solid"
                  size="xs"
                  class="absolute top-1 left-1"
                >
                  {{ statusLabel(cartItem.product?.status) }}
                </UBadge>
              </div>

              <div class="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                <div class="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                  <div>
                    <div class="flex justify-between">
                      <h3 class="text-sm">
                        <NuxtLink :to="`/product/${cartItem.product_id}`" class="font-medium text-gray-700 hover:text-gray-800">{{ cartItem.product?.name }}</NuxtLink>
                      </h3>
                    </div>
                    <div class="mt-1 text-sm">
                      <div class="text-gray-500 flex gap-2">
                        <UAvatar :src="getImageUrl(cartItem.product?.merchant_logo)" size="xs" />
                        {{ cartItem.product?.merchant_name }}
                      </div>
                    </div>
                    <p class="mt-1 text-sm text-red-500">Rp {{ cartItem.product?.sell_price.toLocaleString('id-ID') }}</p>
                    <p class="mt-1 text-sm font-medium text-red-500">Total : Rp {{ ((cartItem.product?.sell_price ?? 0) * cartItem.quantity).toLocaleString('id-ID') }}</p>

                    <!-- Keterangan jika tidak ACTIVE -->
                    <p v-if="cartItem.product?.status !== 'ACTIVE'" class="mt-2 text-xs text-red-500">
                      Produk ini tidak tersedia dan tidak dapat di-checkout.
                    </p>
                  </div>

                  <div class="mt-4 sm:mt-0 sm:pr-9">
                    <div class="grid w-full grid-cols-1">
                      <div class="">
                        <UInputNumber
                          :key="cartItem.product_id"
                          v-model="cartItem.quantity"
                          size="md"
                          :disabled="cartItem.product?.status !== 'ACTIVE'"
                          @update:model-value="checkStock(cartItem)"
                        />
                      </div>
                    </div>

                    <div class="absolute top-0 right-0">
                      <button type="button" class="-m-2 inline-flex p-2 text-gray-400 hover:text-gray-500">
                        <span class="sr-only">Remove</span>
                        <UIcon name="lucide:trash-2" class="size-5" aria-hidden="true" @click="deleteCartItem(cartItem)"/>
                      </button>
                    </div>
                  </div>
                </div>

                <UTextarea
                  v-if="cartItem.product?.status === 'ACTIVE'"
                  v-model="cartItem.note"
                  class="pt-2 w-auto"
                />
              </div>
            </li>
          </ul>
        </section>

        <!-- Order summary -->
        <section aria-labelledby="summary-heading" class="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8">
          <h2 id="summary-heading" class="text-lg font-medium text-gray-900">Rincian Order</h2>

          <!-- Voucher -->
          <div class="mt-4 mb-2 space-y-3">
            <p class="text-sm font-medium text-gray-700">Voucher</p>

            <!-- Daftar voucher publik -->
            <div v-if="publicVouchers && publicVouchers.length" class="space-y-1.5">
              <p class="text-xs text-gray-400">Pilih voucher yang tersedia:</p>
              <div class="flex flex-col gap-1.5">
                <button
                  v-for="v in publicVouchers"
                  :key="v.code"
                  type="button"
                  class="flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-all duration-150"
                  :class="appliedVoucherCode === v.code
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-gray-200 bg-white hover:border-primary/50 hover:bg-primary/5'"
                  @click="selectPublicVoucher(v.code)"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <UIcon name="mdi:ticket-percent-outline" class="text-primary shrink-0" />
                    <div class="min-w-0">
                      <span class="font-mono font-bold text-gray-800">{{ v.code }}</span>
                      <span v-if="v.name" class="text-gray-500 ml-1">— {{ v.name }}</span>
                      <p class="text-gray-400 mt-0.5">
                        {{ formatVoucherDiscount(v) }}
                        <span v-if="v.min_transaction_amount"> · Min. Rp{{ v.min_transaction_amount.toLocaleString('id-ID') }}</span>
                      </p>
                    </div>
                  </div>
                  <UIcon
                    v-if="appliedVoucherCode === v.code"
                    name="mdi:check-circle"
                    class="text-primary shrink-0 ml-2"
                  />
                </button>
              </div>
            </div>

            <!-- Input manual kode privat -->
            <div>
              <p class="text-xs text-gray-400 mb-1.5">Atau masukkan kode voucher:</p>
              <div class="flex gap-2">
                <UInput
                  v-model="voucherCode"
                  placeholder="Kode voucher..."
                  class="flex-1 uppercase"
                  :disabled="checkingVoucher"
                  @keydown.enter="applyVoucher"
                />
                <UButton
                  color="primary"
                  variant="outline"
                  :loading="checkingVoucher"
                  :disabled="!voucherCode.trim()"
                  @click="applyVoucher"
                >
                  Pakai
                </UButton>
              </div>
            </div>

            <p v-if="voucherError" class="text-xs text-red-500">{{ voucherError }}</p>
            <div v-if="voucherDiscount > 0" class="flex items-center gap-2 text-xs text-green-600 font-medium">
              <UIcon name="mdi:check-circle" class="size-4" />
              Hemat Rp{{ voucherDiscount.toLocaleString('id-ID') }} dengan voucher
              <span class="font-mono font-bold">{{ appliedVoucherCode }}</span>
            </div>
          </div>

          <dl class="mt-4 space-y-4">
            <div class="flex items-center justify-between">
              <dt class="text-sm text-gray-600">Subtotal</dt>
              <dd class="text-sm font-medium text-gray-900">Rp {{ cartStore.subTotal.toLocaleString() ?? 0 }}</dd>
            </div>
            <div class="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt class="flex items-center text-sm text-gray-600">
                <span>Biaya Pembayaran</span>
                <UTooltip :text="feeTooltip">
                  <UIcon name="mdi:help-circle" class="size-5 ml-2 shrink-0 text-gray-400 hover:text-gray-500" />
                </UTooltip>
              </dt>
              <dd class="text-sm font-medium text-gray-900">Rp {{ feeAmount.toLocaleString('id-ID') }}</dd>
            </div>
            <div class="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt class="flex items-center text-sm text-gray-600">
                <span>Biaya Aplikasi</span>
                <UTooltip text="Biaya layanan platform yang dikenakan untuk setiap transaksi.">
                  <UIcon name="mdi:help-circle" class="size-5 ml-2 shrink-0 text-gray-400 hover:text-gray-500" />
                </UTooltip>
              </dt>
              <dd class="text-sm font-medium text-gray-900">Rp {{ appFee.toLocaleString('id-ID') }}</dd>
            </div>
            <div v-if="voucherDiscount > 0" class="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt class="text-sm text-green-600 font-medium">Diskon Voucher</dt>
              <dd class="text-sm font-medium text-green-600">- Rp {{ voucherDiscount.toLocaleString('id-ID') }}</dd>
            </div>
            <div class="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt class="text-base font-medium text-gray-900">Order total</dt>
              <dd class="text-base font-medium text-gray-900">Rp {{ orderTotal.toLocaleString('id-ID') }}</dd>
            </div>
          </dl>

          <div class="mt-6">
            <ClientOnly>
              <template #fallback>
                <AppLoadingSkeleton />
              </template>
            <div v-if="paymentMethodLoading ">
              <AppLoadingSkeleton />
            </div>
            <div v-else>
              <PaymentMethodSelector
                v-model="cartStore.payment_method"
                v-model:channel-value="cartStore.payment_channel_code"
                :methods="paymentMethodData ?? []"
                type="payment"
              />
            </div>

            <!-- Info MANUAL_BANK -->
            <div v-if="cartStore.payment_method === 'MANUAL_BANK'" class="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <div class="flex items-center gap-2">
                <UIcon name="mdi:bank-outline" class="size-4 text-yellow-600 shrink-0" />
                <p class="text-xs text-yellow-700">
                  Setelah checkout, Anda akan diarahkan ke halaman pembayaran dengan informasi rekening transfer.
                </p>
              </div>
            </div>

            <UButton
              size="xl"
              class="w-full justify-center mt-4"
              :label="
                loading ? 'Please Wait'
                : hasUnavailableItems ? 'Ada Produk Tidak Tersedia'
                : isSaldoInsufficient ? 'Saldo Tidak Cukup'
                : 'Checkout'
              "
              trailing-icon="i-lucide-arrow-right"
              variant="solid"
              @click="checkout"
              :loading="loading"
              :disabled="isSaldoInsufficient || loading || hasUnavailableItems || syncing"
            />
            </ClientOnly>
          </div>
        </section>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import PaymentMethodSelector from '~/components/u/PaymentMethodSelector.vue';
import { useBalanceStore } from '~/stores/balance';
import { usePaymentMethodApi } from '~/composables/api/payment-method';
import { useSystemSettingApi } from '~/composables/api/system-setting';
import { useVoucherApi } from '~/composables/api/voucher';
import type { CartItem } from '~/types/CartItem';
import type { PaymentMethodResponse } from '~/types/payment-method/PaymentMethodResponse';
import type { SystemSettingResponse } from '~/types/system-setting/SystemSettingResponse';
import type { VoucherResponse } from '~/types/voucher/VoucherResponse';

const breadcrumb = [
  { label: 'Home', icon: 'i-lucide-home', to: '/' },
  { label: 'Keranjang Belanja', icon: 'i-heroicons-shopping-cart' },
]

// reactive state
const loading = ref<boolean>(false)

// voucher state
const voucherCode = ref('')
const appliedVoucherCode = ref<string | null>(null)
const voucherDiscount = ref(0)
const voucherError = ref('')
const checkingVoucher = ref(false)

const { checkVoucher, fetchPublicVouchers } = useVoucherApi()

const { data: publicVouchers } = await useAsyncData<VoucherResponse[]>(
  'public-vouchers-cart',
  () => fetchPublicVouchers(),
  { server: false }
)

function formatVoucherDiscount(v: VoucherResponse): string {
  if (v.discount_type === 'NOMINAL') return `Diskon Rp${v.discount_value.toLocaleString('id-ID')}`
  const pct = `Diskon ${v.discount_value}%`
  return v.max_discount_amount ? `${pct} (maks. Rp${v.max_discount_amount.toLocaleString('id-ID')})` : pct
}

function clearVoucher() {
  voucherDiscount.value = 0
  appliedVoucherCode.value = null
  voucherError.value = ''
}

watch(voucherCode, clearVoucher)

async function selectPublicVoucher(code: string) {
  if (appliedVoucherCode.value === code) {
    voucherCode.value = ''
    clearVoucher()
    return
  }
  voucherCode.value = code
  await applyVoucher()
}

async function applyVoucher() {
  const code = voucherCode.value.trim().toUpperCase()
  if (!code) return
  checkingVoucher.value = true
  voucherError.value = ''
  voucherDiscount.value = 0
  appliedVoucherCode.value = null
  try {
    const result = await checkVoucher(code, cartStore.subTotal)
    voucherDiscount.value = result.discount_amount
    appliedVoucherCode.value = code
    toast.add({ title: 'Voucher berhasil dipakai', description: `Hemat Rp${result.discount_amount.toLocaleString('id-ID')}`, color: 'success', icon: 'mdi:check-circle' })
  } catch (err: any) {
    voucherError.value = err.message || 'Voucher tidak valid'
  } finally {
    checkingVoucher.value = false
  }
}

const syncing = ref<boolean>(false)

// composables api
const { fetchPaymentMethod,paymentMethodLoading } = usePaymentMethodApi()
const { fetchPublicSystemSetting } = useSystemSettingApi()
const { depositBalance } = useBalanceStore()

//store
const cartStore = useCartStore()
const balanceStore = useBalanceStore()

const toast = useToast()


const deleteCartItem = (cartItem:CartItem) =>{
  cartStore.items = cartStore.items.filter(item => item !== cartItem)
}

const checkStock = async (cartItem:CartItem) =>{
  try{
    await cartStore.checkValidQty(cartItem)
  }catch(e:any){
    loading.value = false
    toast.add({
      title: "Invalid data",
      description: e.message,
      color: "error",
      icon: "material-symbols:error-outline"
    })
  }finally{
    loading.value = false
  }
  
}


  // ===== CONFIRM =====
  const { confirm, close } = useConfirm()

const checkout = async () =>{
  if(isSaldoInsufficient.value){
    toast.add({
      title: "Saldo tidak cukup",
      description: "Silakan pilih metode pembayaran lain atau top up saldo Anda.",
      color: "error",
      icon: "material-symbols:error-outline"
    })
    return
  }

  const yes = await confirm({
      title: 'Konfirmasi Pembelian?',
      message: 'Apakah anda yakin ingin melakukan pembelian ini?',
      confirmText: 'Ya, Lanjutkan',
      cancelText: 'Tidak',
      confirmColor: 'primary',
    })
    
  if (!yes) return

  //update data stock from backend
  try{
    loading.value = true
    const result = await cartStore.checkout(appliedVoucherCode.value)
    toast.add({
      title: "Berhasil",
      description: "Checkout berhasil",
      color: "success",
      icon: "material-symbols:check-circle-outline"
    })

    balanceStore.loadBalance({force:true})
    if (cartStore.payment_method === 'MANUAL_BANK' && result?.paymentId) {
      navigateTo(`/payment/${result.paymentId}`)
    } else {
      navigateTo("/transaction")
    }

  }catch(e:any){
    loading.value = false
    toast.add({
      title: "Terjadi kesalahan",
      description: e.message,
      color: "error",
      icon: "material-symbols:error-outline"
    }) 
  }finally{
    loading.value = false
    close()
  }
}

  const { data: paymentMethodData } = await useAsyncData<PaymentMethodResponse[]>(
    `payment-method-cart-page`, () => fetchPaymentMethod(),
    { server: false }
  )

  const {
    data: publicSystemSettings,
  } = await useAsyncData<SystemSettingResponse[]>(
    'public-system-settings-cart',
    async () => (await fetchPublicSystemSetting()) ?? [],
    { server: false }
  )

  const appFee = computed(() => {
    const setting = (publicSystemSettings.value ?? []).find(s => s.key === 'FEE_APP')
    const parsed = Number(setting?.value)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 1000
  })

  const isSaldoInsufficient = computed(() => {
  if (cartStore.payment_method !== 'SALDO') return false
  return depositBalance < cartStore.subTotal
})

const selectedChannel = computed(() => {
  const method = (paymentMethodData.value ?? []).find(m => m.id === cartStore.payment_method)
  return method?.channels?.find(c => c.code === cartStore.payment_channel_code) ?? null
})

const feeAmount = computed(() => {
  const channel = selectedChannel.value
  if (!channel) return 0
  // Base = subtotal + app_fee - diskon, sesuai perhitungan Tripay
  const base = cartStore.subTotal + appFee.value - voucherDiscount.value
  const percentFee = ((channel.fee_percent ?? 0) / 100) * base
  return Math.round((channel.fee_flat ?? 0) + percentFee)
})

const orderTotal = computed(() => Math.max(0, cartStore.subTotal + feeAmount.value + appFee.value - voucherDiscount.value))

const feeTooltip = computed(() => {
  const channel = selectedChannel.value
  if (!channel) return 'Biaya yang dikenakan oleh payment gateway untuk metode pembayaran yang dipilih.'
  const parts: string[] = []
  if (channel.fee_flat) parts.push(`Rp${channel.fee_flat.toLocaleString('id-ID')}`)
  if (channel.fee_percent) parts.push(`${channel.fee_percent}% dari (subtotal + biaya aplikasi - diskon)`)
  const breakdown = parts.length ? parts.join(' + ') : 'Gratis'
  return `Biaya admin dari ${channel.name}: ${breakdown}.`
})

const hasUnavailableItems = computed(() =>
  cartStore.items.some(item => item.product?.status !== 'ACTIVE')
)

const statusLabel = (status: string | undefined) => {
  const map: Record<string, string> = {
    REVIEW: 'Review',
    INACTIVE: 'Ditangguhkan',
    NONACTIVE: 'Nonaktif',
    SUSPEND: 'Suspend',
  }
  return map[status ?? ''] ?? 'Tidak Tersedia'
}

onMounted(async () => {
  if (cartStore.items.length === 0) return
  syncing.value = true
  try {
    const { removed, priceChanged } = await cartStore.syncCart()

    if (removed.length > 0) {
      toast.add({
        title: 'Produk dihapus dari keranjang',
        description: `${removed.join(', ')} tidak lagi tersedia.`,
        color: 'warning',
        icon: 'i-heroicons-exclamation-triangle',
        duration: 6000,
      })
    }

    if (priceChanged.length > 0) {
      toast.add({
        title: 'Harga produk berubah',
        description: priceChanged.join(' | '),
        color: 'info',
        icon: 'i-heroicons-information-circle',
        duration: 6000,
      })
    }
  } finally {
    syncing.value = false
  }
})

</script>