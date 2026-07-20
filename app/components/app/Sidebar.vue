<template>
  <UNavigationMenu orientation="vertical" :items="items" class="data-[orientation=vertical]:w-48" />
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const authStore = useAuthStore()
const balanceStore = useBalanceStore()
const toast = useToast()

const items = computed<NavigationMenuItem[][]>(() => {
  const role = authStore.role

  const merchantItem: NavigationMenuItem =
    role === 'SELLER' ? { label: 'Kelola Toko', icon: 'material-symbols:store', to: '/seller/dashboard' }
    : role === 'ADMIN' ? { label: 'Dashboard Admin', icon: 'material-symbols:dashboard', to: '/admin/dashboard' }
    : { label: 'Buat Merchant', icon: 'material-symbols:store-outline', to: '/merchant/create' }

  return [
    [
      { label: 'Account Info', icon: 'mdi:user', to: '/profile' },
      {
        label: 'Saldo Belanja : ' + `Rp ${balanceStore.depositBalance.toLocaleString('id-ID')}`,
        icon: 'i-lucide-credit-card',
        to: '/balance',
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
</script>
