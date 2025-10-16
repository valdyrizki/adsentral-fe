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

      <section aria-labelledby="order-heading" class="mt-4 ">
        <div class="flex flex-col sm:flex-row gap-4 w-full bg-gray-100 p-2 rounded-lg overflow-hidden">
          <div class="flex-none mx-auto">
            <NuxtLink :to="`/product/${transaction?.product.id}`" class=" sm:order-first text-center">
              <img :src="transaction?.product.banner_url" :alt="transaction?.product.name" class=" size-40 rounded-lg object-cover " />
            </NuxtLink>
          </div>
          <div class="flex-grow flex flex-col ">
            <!-- Konten atas yang akan memenuhi ruang -->
            <div class="flex flex-col gap-1">
              
              <h4 class="font-medium text-gray-900">#{{ transaction?.id }}</h4>
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
                  <NuxtLink :to="`/merchant/${transaction?.product.merchant_id}`">{{ transaction?.product.merchant_name }}</NuxtLink>
              </div>
              <div>
                <NuxtLink :to="`/product/${transaction?.product.id}`" class="text-lg font-medium text-gray-900">{{ transaction?.product.name }}</NuxtLink>
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

              <UBadge icon="material-symbols:check" size="lg" color="primary" variant="solid" :label="transaction?.status" />
              <UButton icon="uiw:message" size="xs" color="primary" variant="outline">Chat Penjual</UButton>
              <UButton icon="mdi:cart-outline" color="primary" variant="soft" size="xs" @click="addToCart">Beli Lagi</UButton>
              <UButton icon="material-symbols:cancel" color="error" variant="soft" size="xs" @click="addToCart">Batalkan</UButton>
              <UButton icon="material-symbols:help-outline-rounded" color="error" variant="solid" size="xs" @click="addToCart">Tangguhkan</UButton>

            </div> 
            
          </div>
        </div>

        <div class="mt-4  w-full bg-gray-100 p-2 rounded-lg overflow-hidden">
          <div class="flex flex-col gap-4 text-center">
            <div>
              <h1>Catatan Pembeli</h1>
            </div>
            <div>
              <p class="text-gray-600">{{ transaction?.tx_description ?? "Tidak ada catatan"}} </p>
            </div>
          </div>
        </div>

        <div class="mt-4  w-full bg-green-100 p-2 rounded-lg overflow-hidden">
          <div class="flex flex-col gap-4 text-center">
            <div>
              <h1>Order sudah dikirim penjual!</h1>
            </div>
            <div>
              <p class="text-gray-600">{{ transaction?.tx_description ?? "Download filenya dibawah ini ya"}} </p>
            </div>
            <div>
              <UButton icon="mdi:download" color="primary" variant="solid" size="md" @click="addToCart">Download File</UButton>
            </div>
          </div>
        </div>

        

        <div class="mt-4  w-full bg-gray-100 p-2 rounded-lg overflow-hidden">
          <div class="flex flex-col gap-4 text-center">
            <div>
              <h1>Beri Rating!</h1>
            </div>
            <div>
              <p class="text-gray-600">{{ transaction?.tx_description ?? "Kamu belum memberikan rating."}} </p>
            </div>
            <div class="flex flex-col gap-1 justify-center items-center">
              Pilih Rating Kamu:
              <USelect  :items="selectRating" class="w-1/2"/>
            </div>
            
            <div class="flex flex-col gap-1 justify-center items-center">
              Komentar Kamu:
              <UTextarea class="w-4/5"/>
            </div>
          </div>
        </div>

        <div class="mt-4  w-full bg-gray-100 p-2 rounded-lg overflow-hidden">
          <div class="flex flex-col gap-4">
            <div class="text-center font-medium">
              <h1>Diskusi Penjual dan Pembeli</h1>
            </div>
            <div>
              
              <div class="flex flex-col gap-2 w-full bg-gray-200 p-2 border-t border-gray-300">  <!-- for looping discussion items -->
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
                    <div class="font-medium">Pembeli 1</div>
                    <!-- <div><UBadge>Badge</UBadge></div> -->
                    <div class="text-gray-600">Mana min ? kok belum di kirim" ?.</div>
                  </div>
                  <div>
                    <div class="ml-auto flex-none">   
                      <div class="font-medium text-sm text-gray-500 px-2">2024-10-01 12:00</div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-2 w-full bg-blue-100 p-2 border-t border-gray-300">  <!-- for looping discussion items -->
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
                    <div class="font-medium">User 1 <UBadge>Penjual</UBadge></div>
                    <!-- <div><UBadge>Badge</UBadge></div> -->
                    <div class="text-gray-600">Mohon Bersabar ya.</div>
                  </div>
                  <div>
                    <div class="ml-auto flex-none">   
                      <div class="font-medium text-sm text-gray-500 px-2">2024-10-01 12:00</div>
                    </div>
                  </div>
                </div>
                <USeparator />
              </div>
              
              <div class="flex flex-col gap-2 w-full bg-blue-100 p-2 border-t border-gray-300">  <!-- for looping discussion items -->
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
                    <div class="font-medium">User 1 <UBadge>Penjual</UBadge></div>
                    <div><UBadge>Penjual Mengirim Pesanan</UBadge></div>
                    <div class="text-gray-600">Ini orderannya ya, terimakasih.</div>
                    <div class="flex flex-row items-center gap-1"> <!-- File yang sudah diupload, klik untuk download -->
                      <UButton icon="mdi:download" color="primary" variant="soft" size="xs" @click="addToCart">1_file_design.zip</UButton>
                    </div>
                    
                  </div>
                  <div>
                    <div class="ml-auto flex-none">   
                      <div class="font-medium text-sm text-gray-500 px-2">2024-10-01 12:00</div>
                    </div>
                  </div>
                </div>
                <USeparator />
              </div>

              <div class="flex flex-col gap-2 w-full bg-gray-200 p-2 border-t border-gray-300">  <!-- for looping discussion items -->
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
                    <div class="font-medium">Pembeli 1</div>
                    <!-- <div><UBadge>Badge</UBadge></div> -->
                    <div class="text-gray-600">Kalo ini kenapa ya ?.</div>
                    <!-- <div class="flex flex-row items-center gap-1"> File yang sudah diupload, klik untuk download 
                      <UButton icon="mdi:download" color="primary" variant="soft" size="xs" @click="addToCart">1_file_design.zip</UButton>
                    </div> -->
                    <div class="flex flex-row items-center gap-1"> <!-- File yang sudah diupload, klik untuk download -->
                      <NuxtImg src="https://github.com/benjamincanac.png" width="100" height="100" />
                    </div>
                  </div>
                  <div>
                    <div class="ml-auto flex-none">   
                      <div class="font-medium text-sm text-gray-500 px-2">2024-10-01 12:00</div>
                    </div>
                    
                  </div>
                </div>
              </div>
              
            </div>

          </div>
        </div>

        <div class="mt-4  w-full bg-gray-100 p-2 rounded-lg overflow-hidden">
          <div class="flex flex-col gap-4 text-center">
            <div>
              <h1 class="font-medium">Kirim Pesan</h1>
            </div>
            <div>
              <UTextarea class="w-full" placeholder="Tulis pesan disini..." />
            </div>
            <div class="flex flex-row gap-2 justify-center items-center">
              <UButton icon="mdi:send" color="primary" variant="solid" size="md" @click="addToCart">Kirim Pesan</UButton>
              <UButton icon="mdi:attach-file" color="primary" variant="soft" size="md" @click="addToCart">Lampirkan File</UButton>
            </div>
          </div>
        </div>

        





      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
import { NuxtImg, UTextarea } from '#components'
import dayjs from 'dayjs'
import { useTransactionApi } from '~/composables/api/transaction'
import type { TransactionResponse } from '~/types/TransactionResponse'



// Ambil API function
const { getTransactionById } = useTransactionApi()

// Ambil parameter route
const route = useRoute()

const selectRating = ref(['Very Bad', 'Bad', 'Neutral', 'Good', 'Very Good'])


// Reactive state
const loading = ref<boolean>(true)
const error = ref<string | null | any >(null)
const transaction = ref<TransactionResponse>()

  // fungsi Fetch data di server-side (Nuxt auto-handle hydration)
  try { 
    loading.value = true
    transaction.value = await getTransactionById(route.params.id as string) // page=0, size=10
    console.log(transaction.value);
    
  } catch (err: any) {
    console.log(err);
    
    error.value = err.statusMessage || 'Failed to load transactions'
  } finally {
    loading.value = false
  }


  const addToCart = () => {
    alert('Add to cart clicked!')
  }
</script>