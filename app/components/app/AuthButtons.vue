<template>
  <ClientOnly>
    <template #fallback>
      <div class="flex gap-2 items-center">
        <USkeleton class="h-9 w-9 rounded-lg" />
        <USkeleton class="h-9 w-9 rounded-lg" />
        <USkeleton class="h-9 w-9 rounded-lg" />
        <USkeleton class="h-10 w-28 rounded-lg" />
      </div>
    </template>

  <div class="flex gap-2 items-center">
    <!-- Always visible -->
    <div flex class="flex gap-2">
        <template v-if="authStore.accessToken">
          <UChip :text="notificationStore.unreadCount || 0" color="error" size="3xl">
            <UButton to="/notification" color="neutral" variant="subtle" icon="mdi:bell-outline" />
          </UChip>
          <UChip :text="5" color="error" size="3xl">
            <UButton to="/chat" color="neutral" variant="subtle" icon="mdi:email-outline" />
          </UChip>
        </template>
        <UChip :text="totalItems" color="error" size="3xl">
          <UButton to="/cart" color="neutral" variant="soft" icon="mdi:cart-outline" />
        </UChip>
      </div>
    
    

  <!-- Auth conditional -->
    <div v-if="authStore.isInitializing">
      <USkeleton class="h-10 w-32" />
    </div>
    <UDropdownMenu v-else-if="authStore.accessToken" :items="itemsProfile">
      <UButton label="Profile" icon="i-lucide-user" size="xl" color="neutral" variant="outline"/>
    </UDropdownMenu>
    <div v-else>
      <div class="flex gap-2">
        <UButton @click="isRegisterOpen = true">Daftar</UButton>
        <UModal v-model:open="isRegisterOpen" title="Register">
          <template #body>
            <FormRegister @register-success="handleRegisterSuccess" />
          </template>
        </UModal>

        <UButton @click="isLoginOpen = true">Masuk</UButton>
        <UModal v-model:open="isLoginOpen" title="Login">
          <template #body>
            <FormLogin @login-success="handleLoginSuccess" />
          </template>
        </UModal>
      </div>
    </div>
      
  </div>
  
  </ClientOnly>
</template>

<style>

</style>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const route = useRoute()
watch(() => route.path, (path) => {
  if (path === '/notification') {
    notificationStore.resetUnreadCount()
  } else if (authStore.accessToken) {
    notificationStore.loadUnreadCount()
  }
})
const toast = useToast()

const isLoginOpen = ref(false)
const isRegisterOpen = ref(false)

const handleLoginSuccess = () => {
  isLoginOpen.value = false
}

const handleRegisterSuccess = () => {
  isRegisterOpen.value = false
}

const balanceStore = useBalanceStore()

const itemsProfile = computed<DropdownMenuItem[][]>(() => {
  const role = authStore.role

  const merchantItem: DropdownMenuItem = 
    role === 'SELLER' ? { label: 'Kelola Toko', icon: 'material-symbols:store', to: '/seller/dashboard' }
    : role === 'ADMIN' ? { label: 'Dashboard Admin', icon: 'material-symbols:dashboard', to: '/admin/dashboard' }
    : { label: 'Buat Merchant', icon: 'material-symbols:store-outline', to: '/merchant/create' }

  return [
    [
      { label: 'Account Info', icon: 'mdi:user', to: '/profile' },
      {
        label: 'Saldo : ' + `Rp ${balanceStore.balance.toLocaleString('id-ID')}`,
        icon: 'i-lucide-credit-card',
        to: '/balance'
      },
      { label: 'Order History', icon: 'i-lucide-package', to: '/transaction' },
      { label: 'Klaim Garansi', icon: 'material-symbols:shield', to: '/guarantee' },
      { label: 'Riwayat Pembayaran', icon: 'i-heroicons-credit-card', to: '/payment' },
      { label: 'Riwayat Penalty', icon: 'i-heroicons-shield-exclamation', to: '/penalty' },
    ],
    [merchantItem],
    [
      { label: 'Settings', icon: 'i-lucide-cog' },
      {
        label: 'Logout',
        icon: 'material-symbols:logout',
        onSelect() {
          authStore.logout()
          toast.add({
            title: 'Logout Berhasil 🎉',
            description: 'anda sudah keluar dari profil anda...',
            color: 'success',
          })
        },
      },
    ],
  ]
})



const cartStore = useCartStore()
const { items, totalItems } = storeToRefs(cartStore)

const cartOptions = computed(() =>
  items.value.map(item => ({
    label: item.product?.name || 'Loading...',
    avatar: {
      src: item.product?.banner_url || '/placeholder.png'
    },
    badge: String(item.quantity),
    slot: item.product?.sell_price 
      ? `Rp ${(item.product.sell_price * item.quantity).toLocaleString('id-ID')}` 
      : ''
  }))
)

</script>