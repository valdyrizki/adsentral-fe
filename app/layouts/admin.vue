<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
const authStore = useAuthStore()
const alertsStore = useAlertsStore()
// Satu request GET /admin/alerts per interval untuk semua badge admin
useAlertsPolling('admin')
const alerts = computed(() => alertsStore.admin)

const paymentConfirmationBadge = computed(() =>
  pendingCountBadge(alerts.value?.pending_payment_confirmation, `${alerts.value?.pending_payment_confirmation} pembayaran transfer menunggu konfirmasi`),
)
const productsInReviewBadge = computed(() =>
  pendingCountBadge(alerts.value?.products_in_review, `${alerts.value?.products_in_review} produk menunggu review`),
)


const items = computed<NavigationMenuItem[][]>(() => [[
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/admin/dashboard',
  },
  {
    label: 'Chat',
    icon: 'mdi:chat',
    to: '/admin/chat'
  },
  {
    label: 'Products',
    icon: 'i-lucide-package',
    ...productsInReviewBadge.value,
    children: [
      { label: 'Semua Produk', to: '/admin/product' },
      { label: 'Review Produk', to: '/admin/product/review', ...productsInReviewBadge.value },
      { label: 'Kategori Produk', to: '/admin/category' },
      { label: 'Tipe Akun', to: '/admin/account-type' },
    ]
  },
  {
    label: 'Stok Akun',
    icon: 'i-lucide-file-check',
    to: '/admin/stock',
  },
  {
    label: 'Orders',
    icon: 'i-lucide-shopping-cart',
    to: '/admin/order'
  },
  {
    label: 'Pembayaran',
    icon: 'i-heroicons-credit-card',
    ...paymentConfirmationBadge.value,
    children: [
      { label: 'Riwayat Pembayaran', to: '/admin/payment', ...paymentConfirmationBadge.value },
      { label: 'Metode Pembayaran', to: '/admin/payment-method' },
      { label: 'Payment Channel', to: '/admin/payment-channel' },
      {
        label: 'Pembayaran Tidak Terproses',
        to: '/admin/payments/unprocessed',
        ...pendingCountBadge(alerts.value?.unprocessed_payments, `${alerts.value?.unprocessed_payments} pembayaran tidak terproses`),
      },
    ]
  },
  {
    label: 'Voucher',
    icon: 'mdi:ticket-percent-outline',
    to: '/admin/voucher',
  },
  {
    label: 'Penarikan Dana',
    icon: 'mdi:cash-minus',
    to: '/admin/withdrawal'
  },
  {
    label: 'Verifikasi Akun',
    icon: 'mdi:card-account-details-outline',
    to: '/admin/verification'
  },
  {
    label: 'Keuangan',
    icon: 'mdi:chart-finance',
    children: [
      { label: 'Dashboard Finance', to: '/admin/finance' },
      { label: 'Jurnal', to: '/admin/finance/journal' },
      {
        label: 'Jurnal Gagal',
        to: '/admin/finance/failed-journals',
        ...pendingCountBadge(alerts.value?.failed_journals, `${alerts.value?.failed_journals} jurnal gagal`),
      },
      { label: 'Kategori', to: '/admin/finance/category' },
    ]
  },
  {
    label: 'Penalty',
    icon: 'i-heroicons-shield-exclamation',
    children: [
      { label: 'Penalty Rule', to: '/admin/penalty-rule' },
      { label: 'Manage Penalty', to: '/admin/penalty' },
    ]
  },
  {
    label: 'Notifikasi',
    icon: 'i-heroicons-bell',
    to: '/admin/notification',
    ...countBadge(alerts.value?.unread_notifications),
  },
  // {
  //   label: 'Customers',
  //   icon: 'i-lucide-users',
  //   to: '/admin/customers'
  // },
  {
    label: 'Settings',
    icon: 'i-lucide-settings',
    children: [
      { label: 'System Parameter', to: '/admin/settings/system' },
      { label: 'Members', to: '/admin/settings/members' },
      { label: 'Notifications', to: '/admin/settings/notifications' }
    ]
  }
], [
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
          <span class="text-lg font-semibold">Admin Panel</span>
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
          :label="collapsed ? undefined : (authStore.user?.full_name ?? authStore.user?.username ?? 'Admin')"
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
          <UButton icon="i-lucide-bell" variant="ghost" color="neutral" to="/admin/notification" />
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
