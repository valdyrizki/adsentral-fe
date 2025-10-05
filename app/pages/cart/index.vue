<template>
  <div class="bg-white">
    <div class="mx-auto max-w-2xl px-2 pt-4 pb-4  lg:max-w-7xl lg:px-4">
      <h1 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Shopping Cart</h1>
      <form class="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
        <section aria-labelledby="cart-heading" class="lg:col-span-7">
          <h2 id="cart-heading" class="sr-only">Items in your shopping cart</h2>

          <ul role="list" class="divide-y divide-gray-200 border-t border-b border-gray-200">
            <li v-for="cartItem in cartStore.items" :key="cartItem.product_id" class="flex py-6 sm:py-10">
              <div class="shrink-0">
                <img :src="cartItem.product?.banner_url" :alt="cartItem.product?.name" class="size-24 rounded-md object-cover sm:size-48" />
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
                        <UAvatar :src="cartItem.product?.merchant_logo" size="xs" /> 
                        {{ cartItem.product?.merchant_name }}
                      </div>
                    </div>
                    <p class="mt-1 text-sm text-red-500">Rp {{ cartItem.product?.sell_price.toLocaleString('id-ID') }}</p>
                    
                    <p class="mt-1 text-sm font-medium text-red-500"> Total :  Rp {{ ((cartItem.product?.sell_price ?? 0) * cartItem.quantity).toLocaleString('id-ID') }}</p>
                  </div>
                  
                  <div class="mt-4 sm:mt-0 sm:pr-9">
                    <div class="grid w-full grid-cols-1">
                      <div class="">       
                        <UInputNumber :key="cartItem.product_id" v-model="cartItem.quantity"  size="md" @update:model-value="checkStock(cartItem)"/> 
                      </div>
                    </div>

                    <div class="absolute top-0 right-0">
                      <button type="button" class="-m-2 inline-flex p-2 text-gray-400 hover:text-gray-500">
                        <span class="sr-only">Remove</span>
                        <UIcon name="system-uicons:cross" class="size-5" aria-hidden="true" @click="deleteCartItem(cartItem)"/>
                      </button>
                    </div>
                  </div>
                </div>

                <UTextarea v-model="cartItem.note" class="pt-2 w-auto"/>
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
                  <UIcon name="mingcute:question-fill" class="size-5" aria-hidden="true" />
                </a>
              </dt>
              <dd class="text-sm font-medium text-gray-900">Rp 0</dd>
            </div>
            <div class="flex items-center justify-between border-t border-gray-200 pt-4">
              <dt class="flex text-sm text-gray-600">
                <span>Fee</span>
                <a href="#" class="ml-2 shrink-0 text-gray-400 hover:text-gray-500">
                  <span class="sr-only">Learn more about how tax is calculated</span>
                  <UIcon name="mingcute:question-fill" class="size-5" aria-hidden="true" />
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
            <UInputMenu v-model="cartStore.payment_method" :items="items" arrow class="w-full justify-center" size="xl" open-on-focus  />
            <UButton size="xl" class="w-full justify-center mt-4" label="Checkout" trailing-icon="i-lucide-arrow-right" variant="solid" @click="checkout" />
          </div>
        </section>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CartItem } from '~/types/CartItem';

const items = ref(['QRIS', 'Transfer Bank (Manual)'])


//add to cart
const cartStore = useCartStore()
const toast = useToast()

const deleteCartItem = (cartItem:CartItem) =>{
  cartStore.items = cartStore.items.filter(item => item !== cartItem)
}

const checkStock = async (cartItem:CartItem) =>{
  try{
    await cartStore.checkValidQty(cartItem)
  }catch(e:any){
    toast.add({
      title: "Invalid data",
      description: e.message,
      color: "error",
      icon: "material-symbols:error-outline"
    })
  }
  
}

const checkout = async () =>{
  console.log(cartStore.items);

  //update data stock from backend
  try{
    await cartStore.checkout()
    toast.add({
      title: "Berhasil",
      description: "Checkout berhasil",
      color: "success",
      icon: "material-symbols:check-circle-outline"
    })

    navigateTo("/transaction")

  }catch(e:any){
    toast.add({
      title: "Terjadi kesalahan",
      description: e.message,
      color: "error",
      icon: "material-symbols:error-outline"
    })
    
    
  }
  
}

</script>