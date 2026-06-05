<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
const merchantStore = useMerchantStore()
const authStore = useAuthStore()
const config = useRuntimeConfig()
const notificationStore = useNotificationStore()

const route = useRoute()
watch(() => route.path, (path) => {
  if (path === '/seller/notification') notificationStore.resetUnreadCount()
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
    to: '/seller/chat'
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
    label: 'Notifikasi',
    icon: 'i-heroicons-bell',
    to: '/seller/notification',
    ...(notificationStore.unreadCount > 0 && { badge: String(notificationStore.unreadCount) }),
  },
  {
    label: 'Settings',
    icon: 'i-lucide-settings',
    children: [
      { label: 'General', to: '/seller/settings/general' },
      { label: 'Members', to: '/seller/settings/members' },
      { label: 'Notifications', to: '/seller/settings/notifications' }
    ]
  }
], [
  {
    label: 'Help & Support',
    icon: 'i-lucide-life-buoy',
    to: 'https://ui.nuxt.com/docs',
    target: '_blank'
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
        <UButton
          :label="collapsed ? undefined : 'Search...'"
          icon="i-lucide-search"
          color="neutral"
          variant="outline"
          block
          :square="collapsed"
        >
          <template v-if="!collapsed" #trailing>
            <div class="flex items-center gap-0.5 ms-auto">
              <UKbd value="⌘" variant="subtle" />
              <UKbd value="K" variant="subtle" />
            </div>
          </template>
        </UButton>

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
          to="/profile"
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
          <UButton icon="i-lucide-log-out" variant="ghost" color="error" />
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
