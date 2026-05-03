<template>
  <div class="bg-white">
    <div class="mx-auto max-w-2xl px-2 pb-4 lg:max-w-7xl lg:px-4">
      <div class="mt-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
        
        <!-- Sidebar percakapan -->
        <section aria-labelledby="cart-heading" class="lg:col-span-4 pb-4">
          <UCard class=" rounded-2xl shadow-lg">
            <div>
              <div class="bg-gradient-to-r from-primary-500 to-primary-700 p-6 text-white border-b">
                <h2 class="text-lg font-medium">Percakapan Anda</h2>
              </div>
              <div>
                <!-- fitur search -->
                <UInput
                  v-model="conversationKeyword"
                  placeholder="Cari percakapan..."
                  class="w-full rounded-t-lg border-b-0 focus:ring-0 focus:border-gray-300 my-2"
                  prefix="i-heroicons-magnifying-glass-solid"
                  icon="mdi:magnify"
                  @onEnter="async () => {
                    await refreshConversations()
                  }"
                />
              </div>
            </div>

            <!-- List Percakapan -->
            <div 
              ref="conversationContainer" 
              class="rounded-t-lg max-h-[600px]  overflow-y-auto"
              @scroll="handleScrollConversation"
            >

              <!-- Jika Loading -->
              <div v-if="pendingConversation" class="flex justify-center items-center h-full">
                  <LoadingSkeleton class="w-full mt-4"/>
              </div>

              <div @click="loadChatByConversation(conversation)" v-else v-for="conversation in conversations?.content ?? []" :key="conversation?.id" class="border-b border-gray-200 p-4 hover:bg-gray-50 cursor-pointer">
                <div class="flex justify-between">
                  <div class="flex items-center gap-4">
                    <div class="flex-shrink-0">
                      <UAvatar
                        src="https://i.pravatar.cc/100?img=3"
                        :chip="{
                          inset: true,
                          color: 'success'
                        }"
                        size="xs"
                      />                  
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-medium text-gray-900">{{ conversation?.buyer_username }}</p>
                      <p class="truncate text-sm text-gray-500">{{ conversation?.last_message }}</p>
                    </div>
                  </div>
                  <div class="flex flex-col items-end gap-2">
                    <UBadge v-if="conversation?.seller_unread_count > 0" color="success" size="sm">{{conversation.seller_unread_count}}</UBadge>
                    <p class="text-sm text-gray-500">
                      {{
                        dayjs(conversation.last_message_at).isSame(dayjs(), 'day')
                          ? dayjs(conversation.last_message_at).format('HH:mm')
                          : dayjs(conversation.last_message_at).format('DD MMM')
                      }}
                    </p>
                  </div>
                </div>
              </div>
              
            </div>
          </UCard>
        </section>

        <!-- Order summary -->
        <section aria-labelledby="summary-heading" class="lg:col-span-8">
          <UCard class="rounded-2xl shadow-lg ">
            <div v-if="loadingChat">
              <LoadingSkeleton  />
            </div>
            <div v-else>
              <div v-if="chatPages?.content">
                <div>
                  <!-- Header Chat -->
                  <div class="bg-gradient-to-r from-primary-500 to-primary-700 p-6 text-white border-b">
                    <div class="flex justify-between">
                      <div class="flex items-center gap-4">
                      <div class="flex-shrink-0">
                        <UAvatar
                          src="https://i.pravatar.cc/100?img=3"
                          :chip="{
                            inset: true,
                            color: 'success'
                          }"
                          size="2xl"
                        />                  
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="truncate text-lg font-medium text-white">{{ selectedConversation?.buyer_username }}</p>
                        <p class="truncate text-xs text-white">Aktif</p>
                      </div>
                    </div>
                    <div class="flex items-center justify-between rounded-t-lg gap-2 ">
                      <UButton icon="mdi:menu" color="neutral" variant="soft" size="lg" />
                      <UButton icon="mdi:refresh" color="neutral" variant="soft" size="lg" @click="refreshChat" />
                      <UButton icon="mdi:close" color="neutral" variant="soft" size="lg" @click="closeChatHandler" />
                    </div>
                    </div>
                  </div>

                  <div 
                    ref="chatContainer" 
                    class=" px-4 py-4  rounded-t-lg max-h-[600px]  overflow-y-auto"
                    @scroll="handleScrollChat"
                  >
                    <!-- Chat Lawan -->
                    <div v-for="chat in chatPages?.content" :key="chat.id">
                      <div
                        class=" flex"
                        :class="chat.sender_type === 'SELLER' ? 'justify-end' : 'justify-start'"
                      >
                        <div>
                          <div v-if="chat.product">
                            <NuxtLink :to="'/product/'+chat.product.id" class="flex items-center gap-4 mb-2 p-2 border rounded-lg border-blue-500 bg-gray-100">
                              <NuxtImg :src="config.public.backendUrl +'/'+ chat.product.banner_url" width="50" height="50" />
                              <div>
                                <p class="text-sm">{{ chat.product.name }}</p>
                                <p class="text-sm text-error">{{ chat.product.sell_price.toLocaleString('id-ID') }}</p>
                              </div>
                            </NuxtLink>
                          </div>
                          <div
                            class="px-4 py-2 rounded-lg max-w-xs"
                            :class="chat.sender_type === 'SELLER'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-500 text-white'"
                          >
                            <p class="text-sm">{{ chat.message }}</p>
                            
                          </div>
                          
                          <div v-if="chat.file" class="flex m-4"> <!-- File yang sudah diupload, klik untuk download -->
                            <NuxtLink v-if="isImage(chat.file.format)" :to="config.public.backendUrl +'/'+ chat.file.url">
                              <NuxtImg :src="config.public.backendUrl +'/'+ chat.file.url" width="100" height="100" />
                            </NuxtLink>
                            <div v-else>
                              <UButton icon="mdi:download" color="primary" variant="soft" size="xs" @click="downloadFile(chat.file?.url)">{{ chat.file?.ori_name }}</UButton>
                            </div>
                          </div>
                          <p
                            class="text-xs mt-1"
                            :class="chat.sender_type === 'BUYER'
                              ? 'text-right text-gray-400'
                              : 'text-left text-gray-400'"
                          >
                            {{
                              dayjs(chat.created_at).isSame(dayjs(), 'day')
                                ? dayjs(chat.created_at).format('HH:mm')
                                : dayjs(chat.created_at).format('DD MMM')
                            }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <!-- Input Pesan -->
                  <div>
                    <div class="flex items-center justify-between rounded-lg mt-4 gap-4">
                      <UTextarea
                        type="text"
                        placeholder="Ketik pesan..."
                        class="flex-1 rounded-lg  "
                        v-model="chatRequest.message"
                      />
                      <UFileUpload
                        color="primary"
                        variant="button"
                        size="xl"
                        icon="mdi:paperclip"
                        class="ml-2"
                        v-model="chatRequest.file"
                        />
                      <UButton
                        color="primary"
                        class=" "
                        variant="solid"
                        size="xl"
                        icon="mdi:send"
                        @click="sendChatHandler"
                        :loading="isSubmitting"
                        :disabled="!chatRequest.message.trim()"
                      >
                        Kirim
                      </UButton>
                      
                    </div>
                    <div>
                      <div v-if="attachedProduct" class="flex flex-row gap-2 mt-2">
                        <NuxtLink :to="'/product/'+attachedProduct.id" class="flex items-center gap-4 mb-2 p-2 border rounded-lg border-blue-500 bg-gray-100">
                          <NuxtImg :src="config.public.backendUrl +'/'+ attachedProduct.banner_url" width="50" height="50" />
                          <div>
                            <p class="text-sm">{{ attachedProduct.name }}</p>
                            <p class="text-sm text-error">{{ attachedProduct.sell_price.toLocaleString('id-ID') }}</p>
                          </div>
                        </NuxtLink>
                        <UButton size="xs" variant="ghost" color="error" icon="mdi:close" 
                          @click="attachedProduct = undefined; chatRequest.productId = null" 
                        />
                      </div>
                    </div>
                    <div class="flex gap-2 mt-2">
                      <UButton
                        variant="outline"
                        color="neutral"
                        size="xs"
                        icon="mdi:message-text-outline"
                        label="Tanyakan Produk"
                        v-model="chatRequest.productId"
                        @click="openChatProductModalHandler"
                        />

                        <div>
                          <USeparator orientation="vertical" />
                        </div>
                      <UButton
                        size="xs"
                        variant="outline"
                        @click="chatRequest.message = 'Siap kirim?'"
                      >
                        Siap kirim? 
                      </UButton>
                      <UButton
                        size="xs"
                        variant="outline"
                        @click="chatRequest.message = 'Masih ada?'"
                      >
                        Masih ada? 
                      </UButton>
                      <UButton
                        size="xs"
                        variant="outline"
                        @click="chatRequest.message = 'Berapa lama prosesnya?'"
                      >
                        Berapa lama prosesnya? 
                      </UButton>
                    </div>
                      
                  </div>
                </div>
              </div>
              <div v-else class="rounded-2xl shadow-lg ">
                <div class="">
                  <NuxtImg :src="config.public.backendUrl +'/files/public/chat-info.png'" class="mx-auto" />
                </div>
              </div>
            </div>
          </UCard>
        </section>
      </div>
    </div>
  </div>

  <ChatProductModal
    v-model="isChatProductModalOpen"
    :products="products"
    :loading="loadingProduct"
    @submit="handleChatProductModalSubmit"
  />

</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import LoadingSkeleton from '~/components/app/LoadingSkeleton.vue'
import ChatProductModal from '~/components/form/ChatProductModal.vue'
import { useChatApi } from '~/composables/api/chat'
import { useProductsApi } from '~/composables/api/product'
import type { ChatRequest } from '~/types/chat/ChatRequest'
import type { ChatResponse } from '~/types/chat/ChatResponse'
import type { ConversationResponse } from '~/types/chat/ConversationResponse'
import type { PageResponse } from '~/types/PageResponse'
import type { ProductResponse } from '~/types/product/ProductResponse'
import { useDebounceFn } from '@vueuse/core'

definePageMeta({
  layout: "admin",
  label: "Chat",
  // middleware: ["auth", "seller-only"] // opsional kalau mau validasi role
})

  // Reactive state
  const loadingChat = ref<boolean>(false)
  const selectedConversation = ref<ConversationResponse>()
  const isChatProductModalOpen = ref<boolean>(false)
  const loadingProduct = ref<boolean>(false)
  const products = ref<PageResponse<ProductResponse>>()
  const attachedProduct = ref<ProductResponse>()

  //Conversation paging
  const conversationPerPageValue = ref<number>(10)
  const conversationPageValue = ref<number>(0)
  const hasMoreConversation = ref<boolean>(false)
  const loadingMoreConversation = ref<boolean>(false)
  const activeConversation = ref<number | null>(null) 
  const conversationKeyword = ref<string>('')
  const conversationContainer = ref<HTMLElement | null>(null)
  
  //Chat Paging
  const chatPages = ref<PageResponse<ChatResponse>>()
  const chatPageValue = ref<number>(0)
  const chatPerPageValue = ref<number>(12)
  const hasMore = ref<boolean>(false)
  const loadingMore = ref<boolean>(false)
  const activeConversationId = ref<number | null>(null) 
  const chatKeyword = ref<string>('')
  const isSubmitting = ref(false)
  const chatContainer = ref<HTMLElement | null>(null)


  //Chat Request
  const chatRequest = ref<ChatRequest>({
    receiverId: 0,
    message: '',
    file: null,
    productId: null,
    conversationId: null
   })
  
  //Ambil config
  const config = useRuntimeConfig()
  const toast = useToast()

  //composables api
  const {fetchSellerConversation,fetchSendChat,fetchChatByConversation} = useChatApi()
  const {fetchProductsByMerchantId} = useProductsApi()

   //debounce untuk search
  const debouncedSearch = useDebounceFn(() => {
    conversationPageValue.value = 0 // reset ke page pertama
    refreshConversations()
  }, 500) // delay 500ms

  //watcher search keyword conversation 
  watch(conversationKeyword, () => {
    debouncedSearch()
  })

    // ✅ SSR SAFE FETCH NEW
  const { 
    data: conversations, 
    pending:pendingConversation, 
    error, 
    refresh: refreshConversations } 
    = await useAsyncData<PageResponse<ConversationResponse>>(
    'conversation-seller', () => fetchSellerConversation(conversationPageValue.value, conversationPerPageValue.value,conversationKeyword.value),
    {
      // watch: [page, perPageValue, keyword],
      server: false, // Hanya fetch di client
    }
  )

  //load chat by conversation id
  const loadChatByConversation = async (conversation: ConversationResponse) => {

    if(conversation.id === selectedConversation.value?.id) {
      return // Jika conversation yang dipilih sama dengan yang sudah terbuka, tidak perlu reload
    }

    try {
      selectedConversation.value = conversation
      activeConversationId.value = conversation.id
      chatRequest.value.receiverId = conversation.buyer_id //Khusus menu seller
      chatPageValue.value = 0
      hasMore.value = true
      loadingChat.value = true
      
      const data = await fetchChatByConversation(
        conversation.id,
        chatPageValue.value,
        chatPerPageValue.value,
        chatKeyword.value
      )      

      data.content.reverse() // supaya newest di bawah
      chatPages.value = data
      hasMore.value = !chatPages.value.last
      
      await refreshConversations() // Refresh conversations untuk update last_message dan last_message_at
      await nextTick()
      scrollToBottom()
    } catch (err) {
      console.error(err)
      toast.add({
        title: 'Error',
        description: 'Gagal memuat chat',
        color: 'error',
        duration: 3000

      })
    }finally {
      loadingChat.value = false
    }
  }


  //submit handler
  const sendChatHandler = async() => {
    if (chatRequest.value.message.trim() === '') {
      chatRequest.value.message = 'Pesan wajib diisi'
      return
    }
    try {
      isSubmitting.value = true

      //form data
      const formData = new FormData()
      formData.append("receiverId", chatRequest.value.receiverId.toString() || '')
      if(chatRequest.value.productId) formData.append("productId", chatRequest.value.productId.toString() || '')
      formData.append("conversationId", selectedConversation.value?.id.toString() || '')
      formData.append("message", chatRequest.value.message)
      if(chatRequest.value.file) formData.append("file", chatRequest.value.file)
      
      await fetchSendChat(formData)

      toast.add({
        title: "Berhasil",
        description: "Pesan terkirim",
        color: "success",
        icon: "material-symbols:check-circle-outline"
      })

      chatRequest.value.message = '' // reset textarea
      await nextTick()
      scrollToBottom()
      
    } catch (err) {
      console.error(err)
      toast.add({
        title: 'Error',
        description: 'Gagal mengirim pesan',
        color: 'error',
        duration: 3000
      })
    } finally {
      chatRequest.value.message = '' // reset textarea
      chatRequest.value.file = null // reset file
      chatRequest.value.productId = null // reset file
      isSubmitting.value = false
      attachedProduct.value = undefined

      await refreshConversations()
      await refreshChat()

    }
  }

  const closeChatHandler = () => {
    selectedConversation.value = undefined
    chatPages.value = undefined
  }
  
  const isImage = (format?: string) => {
    if (!format) return false
    return ['jpg', 'jpeg', 'png', 'webp'].includes(format.toLowerCase())
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


const scrollToBottom = () => {
if (!chatContainer.value) return
  chatContainer.value.scrollTop = chatContainer.value.scrollHeight
}
 
const handleScrollChat = async () => {
  if (!chatContainer.value) return
  if (loadingMore.value || !hasMore.value) return
  if (!activeConversationId.value) return

  // kalau sudah sampai atas
  if (chatContainer.value.scrollTop <= 5) {

    loadingMore.value = true
    chatPageValue.value++

    const container = chatContainer.value
    const previousHeight = container.scrollHeight

    const data = await fetchChatByConversation(
      activeConversationId.value,
      chatPageValue.value,
      chatPerPageValue.value,
      chatKeyword.value
    )

    const oldMessages = chatPages.value?.content ?? []
    const newMessages = data.content.reverse()

    // ✅ prepend pesan lama ke atas
    chatPages.value = {
      ...data,
      content: [...newMessages, ...oldMessages]
    }

    hasMore.value = !data.last

    await nextTick()

    // ✅ jaga supaya scroll tidak loncat
    const newHeight = container.scrollHeight
    container.scrollTop = newHeight - previousHeight

    loadingMore.value = false
  }
}

const handleScrollConversation = async () => {
  if (!conversationContainer.value) return
  if (loadingMoreConversation.value || !hasMoreConversation.value) return

  const container = conversationContainer.value

  // kalau sudah sampai bawah
  if (container.scrollTop + container.clientHeight >= container.scrollHeight - 5) {

    loadingMoreConversation.value = true
    conversationPageValue.value++

    const data = await fetchSellerConversation(
      conversationPageValue.value,
      conversationPerPageValue.value,
      conversationKeyword.value
    )

    const oldData = conversations.value?.content ?? []
    const newData = data.content

    // ✅ append ke bawah (TIDAK reverse)
    conversations.value = {
      ...data,
      content: [...oldData, ...newData]
    }

    hasMoreConversation.value = !data.last
    loadingMoreConversation.value = false
  }
}

watch(conversations, (val) => {
  if (val) {
    hasMoreConversation.value = !val.last
  }
})



const refreshChat = async () => {
  if (selectedConversation.value) {
    const data = await fetchChatByConversation(
      selectedConversation.value.id,
      0,
      chatPerPageValue.value,
      chatKeyword.value
    )

    data.content.reverse()
    chatPages.value = data
    chatPageValue.value = 0
    hasMore.value = !data.last

    await nextTick()
    scrollToBottom()
  }
}

const openChatProductModalHandler = async() =>{
  
  isChatProductModalOpen.value = true
  try {
    loadingProduct.value = true

    console.log(selectedConversation.value);
    console.log(activeConversationId.value);
    
    
    products.value = await fetchProductsByMerchantId(
      selectedConversation.value?.merchant.id || 0
    ) 
  } catch (err) {
    console.error(err)
    toast.add({
      title: 'Error',
      description: 'Gagal memuat produk',
      color: 'error',
      duration: 3000

    })
  }finally {
    loadingProduct.value = false
  }

}

const handleChatProductModalSubmit = (product:ProductResponse) =>{
  if(product) {
    attachedProduct.value = product
    chatRequest.value.productId = product.id
  }
}


</script>