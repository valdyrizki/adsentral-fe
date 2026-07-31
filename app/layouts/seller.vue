<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
const merchantStore = useMerchantStore()
const authStore = useAuthStore()
const config = useRuntimeConfig()
const notificationStore = useNotificationStore()
const chatStore = useChatStore()

const route = useRoute()
watch(() => route.path, () => {
  if (authStore.accessToken) {
    notificationStore.loadUnreadCount()
    chatStore.loadUnreadCount()
  }
})

const systemSettingStore = useSystemSettingStore()

const waLink = computed(() => {
  const number = systemSettingStore.systemSettings.find(s => s.key === 'WA_NUMBER')?.value
  if (!number) return null
  return `https://wa.me/${number.replace(/\D/g, '')}`
})


const items = computed<NavigationMenuItem[][]>(() => [[
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/seller/dashboard',
  },
  {
    label: 'Chat',
    icon: 'mdi:chat',
    to: '/seller/chat',
    ...(chatStore.unreadCount > 0 && { badge: String(chatStore.unreadCount) }),
  },
  {
    label: 'Products',
    icon: 'i-lucide-package',
    to: '/seller/product'
  },
  {
    label: 'Stok Produk',
    icon: 'i-lucide-file-check',
    to: '/seller/stock'
  },
  {
    label: 'Orders',
    icon: 'i-lucide-shopping-cart',
    to: '/seller/order'
  },
  {
    label: 'Saldo',
    icon: 'i-heroicons-banknotes',
    to: '/seller/balance'
  },
  // {
  //   label: 'Customers',
  //   icon: 'i-lucide-users',
  //   to: '/seller/customers'
  // },
  {
    label: 'Rekening Bank',
    icon: 'mdi:bank-outline',
    to: '/seller/bank-account'
  },
  {
    label: 'Garansi',
    icon: 'material-symbols:shield',
    to: '/seller/guarantee'
  },
  {
    label: 'Penalty',
    icon: 'i-heroicons-shield-exclamation',
    to: '/seller/penalty'
  },
  {
    label: 'Profil Toko',
    icon: 'material-symbols:store-outline',
    to: '/seller/profile'
  },
  {
    label: 'Notifikasi',
    icon: 'i-heroicons-bell',
    to: '/seller/notification',
    ...(notificationStore.unreadCount > 0 && { badge: String(notificationStore.unreadCount) }),
  },
  // {
  //   label: 'Settings',
  //   icon: 'i-lucide-settings',
  //   children: [
  //     { label: 'General', to: '/seller/settings/general' },
  //     { label: 'Members', to: '/seller/settings/members' },
  //     { label: 'Notifications', to: '/seller/settings/notifications' }
  //   ]
  // }
], [
  {
    label: 'Bantuan Admin',
    icon: 'i-simple-icons-whatsapp',
    to: waLink.value ?? undefined,
    target: '_blank',
    class: 'text-[#25D366] hover:text-[#1EBE5B]',
    ui: {
      linkLeadingIcon: 'text-[#25D366]',
      linkLabel: 'text-[#25D366]',
    },
  },
  {
    label: 'Menu Utama',
    icon: 'i-lucide-home',
    to: '/',
  },
  {
    label: 'Logout',
    icon: 'i-lucide-log-out',
    onSelect() {
      authStore.logout()
    },
  }
]])

</script>



<template>
  <div class="flex min-h-screen">
    <UDashboardGroup orientation="vertical" class="flex-1">
      
    <!-- Sidebar -->
    <UDashboardSidebar collapsible resizable :ui="{ footer: 'border-t border-default' }">
      <template #header="{ collapsed }">
        <div v-if="collapsed" class="py-4">
          <UIcon name="i-simple-icons-nuxtdotjs" class="size-6 text-primary mx-auto" />
        </div>
        <div v-else class="flex items-center gap-2 py-4 border-b border-default mb-4">
          <UIcon name="i-simple-icons-nuxtdotjs" class="size-6 text-primary" />
          <span class="text-lg font-semibold">Seller Panel</span>
        </div>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="items[0]"
          orientation="vertical"
          class="mt-4"
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="items[1]"
          orientation="vertical"
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UButton
          :avatar="{ src: authStore.user?.avatar_url ?? undefined }"
          :label="collapsed ? undefined : (merchantStore.merchant?.name ?? authStore.user?.username ?? 'Seller')"
          color="neutral"
          variant="ghost"
          class="w-full"
          :block="collapsed"
          to="/seller/profile"
        />
      </template>
    </UDashboardSidebar>

    <!-- Main content -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Navbar -->
      <UDashboardNavbar class="border-b border-default">
        <template #title>
          <h1 class="text-xl font-bold">{{ $route.meta.label }}</h1>
        </template>
        <template #actions>
          <UButton icon="i-lucide-bell" variant="ghost" color="neutral" to="/seller/notification" />
          <UButton icon="i-lucide-log-out" variant="ghost" color="error" @click="authStore.logout()" />
        </template>
      </UDashboardNavbar>

      <!-- Page content -->
      <main class="p-6 space-y-6 overflow-y-auto">
        <div>
          <slot/>
        </div>

      </main>
    </div>
    
    </UDashboardGroup>
  </div>
</template>
