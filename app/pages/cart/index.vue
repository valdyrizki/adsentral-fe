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

          <dl class="mt-6 space-y-4">
            <div class="flex items-center justify-between">
              <dt class="text-sm text-gray-600">Subtotal</dt>
              <dd class="text-sm font-medium text-gray-900">Rp {{ cartStore.subTotal.toLocaleString() ?? 0 }}</dd>
            </div>
            <div class="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt class="flex items-center text-sm text-gray-600">
                <span>Biaya lain</span>
                <a href="#" class="ml-2 shrink-0 text-gray-400 hover:text-gray-500">
                  <span class="sr-only">Learn more about how shipping is calculated</span>
                  <UIcon name="mdi:help-circle" class="size-5" aria-hidden="true" />
                </a>
              </dt>
              <dd class="text-sm font-medium text-gray-900">Rp 0</dd>
            </div>
            <div class="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt class="flex text-sm text-gray-600">
                <span>Fee</span>
                <a href="#" class="ml-2 shrink-0 text-gray-400 hover:text-gray-500">
                  <span class="sr-only">Learn more about how tax is calculated</span>
                  <UIcon name="mdi:help-circle" class="size-5" aria-hidden="true" />
                </a>
              </dt>
              <dd class="text-sm font-medium text-gray-900">Rp 0</dd>
            </div>
            <div class="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt class="text-base font-medium text-gray-900">Order total</dt>
              <dd class="text-base font-medium text-gray-900">{{ cartStore.subTotal.toLocaleString() ?? 0 }}</dd>
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
                :methods="paymentMethodData ?? []"
                type="payment"
              />
            </div>

            <!-- Info Rekening MANUAL_BANK -->
            <div v-if="cartStore.payment_method === 'MANUAL_BANK'" class="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div class="flex items-center gap-2 mb-2">
                <UIcon name="mdi:bank-outline" class="size-5 text-yellow-600" />
                <h3 class="font-semibold text-yellow-800">Informasi Rekening Pembayaran</h3>
              </div>
              <p class="text-xs text-yellow-700 mb-3">
                Transfer sejumlah total pesanan ke rekening berikut, lalu tunggu admin memverifikasi pembayaran Anda.
              </p>
              <div v-if="rekeningLoading" class="py-2">
                <AppLoadingSkeleton />
              </div>
              <div v-else-if="rekeningSettings && rekeningSettings.length > 0" class="flex flex-col gap-1.5">
                <div
                  v-for="setting in rekeningSettings"
                  :key="setting.id"
                  class="flex justify-between items-center text-sm bg-white rounded px-3 py-2 border border-yellow-100"
                >
                  <span class="text-gray-500">{{ setting.description || setting.key }}</span>
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-gray-900">{{ setting.value }}</span>
                    <UButton
                      :icon="copiedKey === setting.key ? 'i-heroicons-check' : 'i-heroicons-clipboard'"
                      size="xs"
                      :color="copiedKey === setting.key ? 'success' : 'neutral'"
                      variant="ghost"
                      @click="copyToClipboard(setting.key, setting.value)"
                    />
                  </div>
                </div>
              </div>
              <div v-else class="text-sm text-yellow-700 italic">
                Informasi rekening belum tersedia. Silakan hubungi admin.
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
import type { CartItem } from '~/types/CartItem';
import type { PaymentMethodResponse } from '~/types/payment-method/PaymentMethodResponse';
import type { SystemSettingResponse } from '~/types/system-setting/SystemSettingResponse';

const breadcrumb = [
  { label: 'Home', icon: 'i-lucide-home', to: '/' },
  { label: 'Keranjang Belanja', icon: 'i-heroicons-shopping-cart' },
]

// reactive state
const loading = ref<boolean>(false)
const copiedKey = ref<string | null>(null)

function copyToClipboard(key: string, value: string) {
  navigator.clipboard.writeText(value).then(() => {
    copiedKey.value = key
    toast.add({ title: 'Disalin!', description: value, color: 'success', icon: 'i-heroicons-check-circle' })
    setTimeout(() => { copiedKey.value = null }, 2000)
  })
}
const syncing = ref<boolean>(false)

// composables api
const { fetchPaymentMethod,paymentMethodLoading } = usePaymentMethodApi()
const { fetchPublicSystemSettingByGroup } = useSystemSettingApi()
const { balance } = useBalanceStore()

//store
const cartStore = useCartStore()
const balanceStore = useBalanceStore()

//Ambil config
const config = useRuntimeConfig()
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
    await cartStore.checkout()
    toast.add({
      title: "Berhasil",
      description: "Checkout berhasil",
      color: "success",
      icon: "material-symbols:check-circle-outline"
    })

    balanceStore.loadBalance({force:true})
    navigateTo("/transaction")

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

  const {
    data: paymentMethodData,
    pending:paymenMethodLoading,
    error:errorPaymentMethod,
    refresh:refreshPaymentMethod }
  = await useAsyncData<PaymentMethodResponse[]>(
    `payment-method-cart-page`, async () =>  await fetchPaymentMethod(),
    { server: false }
  )

  const {
    data: rekeningSettings,
    pending: rekeningLoading,
  } = await useAsyncData<SystemSettingResponse[]>(
    'rekening-settings-cart',
    () => fetchPublicSystemSettingByGroup('REKENING'),
    { server: false }
  )

  const isSaldoInsufficient = computed(() => {
  if (cartStore.payment_method !== 'SALDO') return false
  return balance < cartStore.subTotal
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