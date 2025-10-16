<template>
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
</template>

<script setup lang="js">
  import dayjs from 'dayjs'
  const props = defineProps({
    transaction: {
      type: Object,
      required: true
    }
  })
</script>