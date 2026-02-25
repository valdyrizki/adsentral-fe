<template>
  <div class="flex gap-4 justify-center md:justify-end">
      <div class="hidden md:flex gap-2">
        
      </div>
      <div flex class="flex gap-2">
        <UChip :text="5" color="error" size="3xl">
          <UButton color="neutral" variant="subtle" icon="material-symbols:notifications-rounded" />
        </UChip>
        <UChip :text="5" color="error" size="3xl">
          <UButton to="/chat" color="neutral" variant="subtle" icon="mynaui:envelope" />
        </UChip>
        <UChip :text="totalItems" color="error" size="3xl">
          <UButton to="/cart" color="neutral" variant="soft" icon="mynaui:cart" />
        </UChip>
      </div>
        

      <div v-if="authStore.auth?.token">
        <UDropdownMenu
        size="xl"
        :items="itemsProfile"
        :content="{
          align: 'start'
        }"
      >

    <UButton size="xl" label="Profile" icon="i-lucide-user" color="neutral" variant="outline" />
  </UDropdownMenu>
      </div>
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
</template>

<style>

</style>

<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

const authStore  = useAuthStore()
const toast = useToast()

const isLoginOpen = ref(false)
const isRegisterOpen = ref(false)

const handleLoginSuccess = () => {
  isLoginOpen.value = false
}

const handleRegisterSuccess = () => {
  isRegisterOpen.value = false
}

const itemsProfile = ref<DropdownMenuItem[]>([
  {
    label: 'Account Info',
    icon: 'mdi:user',
    to: '/profile'
  },
  {
    label: 'Saldo',
    icon: 'i-lucide-credit-card',
    to: '/balance'
  },
  {
    label: 'Order History',
    icon: 'i-lucide-package',
    to: '/transaction'
  },
  {
    label: 'Settings',
    icon: 'i-lucide-cog',
  },
  {
    label: 'Create Merchant',
    icon: 'material-symbols:store',
    to: '/merchant/create'
  },
  {
    label: 'Merchant Center',
    icon: 'material-symbols:store',
    to: '/seller/dashboard'
  },
  {
    label: 'Logout',
    icon: 'material-symbols:logout',
    onSelect(e) {
        authStore.logout()
        toast.add({
          title: "Logout Berhasil 🎉",
          description: "anda sudah keluar dari profil anda...",
          color: "success"
        })
    },
  }
])



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