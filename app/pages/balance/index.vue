<template>
  <div class="bg-white">
    <div class="mx-auto max-w-2xl px-2 pt-4 pb-4 lg:max-w-7xl lg:px-4">
      <UBreadcrumb :items="breadcrumb" class="mb-3" />
      <h1 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Saldo Saya</h1>
      <div class="mt-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-16">
        <section aria-labelledby="cart-heading" class="lg:col-span-4">

          <UCard class="overflow-hidden rounded-2xl shadow-lg">
            <!-- HEADER (Warna 1 - Gradient) -->
            <div class="bg-gradient-to-r from-primary-500 to-primary-700 p-6 text-white border rounded-2xl">
              <div class="flex justify-between">
                <p class="text-center">                         
                <UIcon name="mdi:dollar" class="size-5" />
                Saldo Efektif
              </p> 
              <UButton size="xs" label="Refresh" icon="mdi:refresh" color="neutral" variant="outline" @click="handleRefresh()" />
              </div>
              <div>
                <h2 v-if="balanceLoading" class="text-3xl font-bold mt-1">
                  <USkeleton class="h-10 w-50 mb-2 rounded-lg bg-gray-300" />
                </h2>
                <h2 v-else="balanceLoading" class="text-3xl font-bold mt-1">
                  {{ formatRupiah(balanceStore.balance) }}
                </h2>
              </div>
              <div class="flex justify-center mt-4">
                <UButton size="xl" label="Deposit" icon="mdi:cash-plus" color="neutral" variant="outline" @click="isDepositOpen = true" />
                <UModal v-model:open="isDepositOpen" title="Deposit">
                  <template #body>
                    <FormDeposit
                      :loading="submittingDeposit"
                      @submit="handleDepositSubmit"
                      @cancel="isDepositOpen = false"
                    />
                  </template>
                </UModal>
              </div>
            </div>
  
          </UCard>

        </section>

        <!-- Order summary -->
        <section aria-labelledby="summary-heading" class="mt-16 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:col-span-8 lg:mt-0 lg:p-8">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold tracking-tight text-gray-900">Riwayat Deposit</h2>
            <div>
              <USelect v-model="perPageValue" :items="perPageItems" />
            </div>
          </div>
          <USeparator class="mt-2"/>

          <ClientOnly>
            <template #fallback>
              <AppLoadingSkeleton class="p-6" />
            </template>
          <!-- LOADING -->
          <div v-if="loadingDepositHistory" class="p-6">
            <AppLoadingSkeleton/>
          </div>

          <!-- ERROR -->
          <div v-else-if="error" class="p-6">
            <UAlert
              title="Terjadi Kesalahan"
              :description="error"
              icon="mdi:alert-circle:error"
              color="error"
            />
          </div>

          <!-- EMPTY -->
          <div v-else-if="!depositHistoryPagination?.content?.length && !authStore.isInitializing" class="p-6">
            <UAlert
              title="Belum ada riwayat deposit"
              description="Riwayat deposit Anda akan muncul di sini"
              icon="imdi:tag-off-outline"
              color="neutral"
            />
          </div>

          <!-- DATA -->
          <div v-else>
            <div v-for="deposit in depositHistoryPagination?.content" :key="deposit.id" class="flex border-b border-gray-200 px-4 py-6 sm:px-6 lg:px-8">
              <div class="flex flex-row gap-4 w-full">
                <div class="flex-grow flex flex-col">
                  <!-- Konten atas -->
                  <div class="flex flex-col gap-1">
                    <div class="flex gap-2 flex-wrap">
                      <UBadge color="success" label="TOP UP" icon="mdi:cash-plus" />
                      <UBadge color="info" :label="deposit.payment_method" icon="mdi:credit-card" />
                    </div>
                    <p class="font-medium text-gray-900 text-sm">#{{ deposit.payment_id }}</p>
                  </div>

                  <!-- Konten bawah -->
                  <div class="mt-auto flex flex-col sm:flex-row gap-1 sm:gap-4 pt-4 sm:pt-0">
                    <div class="flex flex-row gap-1 items-center">
                      <UIcon name="fa6-solid:rupiah-sign" class="size-4 text-gray-400" />
                      <div class="font-semibold text-green-700">
                        + {{ deposit.amount.toLocaleString('id-ID') }}
                      </div>
                    </div>

                    <div class="flex flex-row gap-1 items-center">
                      <UIcon name="mdi:calendar" class="size-4 text-gray-400" />
                      <div class="text-sm text-gray-600">
                        {{ dayjs(deposit.created_at).format("YYYY-MM-DD HH:mm:ss") }}
                      </div>
                    </div>
                  </div>
                </div>

                <div class="ml-auto flex-none">
                  <div class="flex flex-col gap-2 items-end">
                    <PaymentStatusBadge :status="deposit?.status" class="mb-2" />
                    <UButton v-if="deposit.status === 'UNPAID'" icon="mdi:open-in-new" color="primary" variant="soft" size="xs" @click="addToCart">Lanjut Bayar</UButton>
                    <UButton v-if="deposit.status === 'UNPAID'" icon="material-symbols:cancel" color="error" variant="soft" size="xs" @click="() => cancelHandle(deposit)">Batalkan</UButton>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pagination -->
            <div v-if="depositHistoryPagination &&  !loadingDepositHistory" class="flex justify-center items-center pt-4">
              <UPagination
                :page="page + 1"
                :total="depositHistoryPagination.total_elements"
                :items-per-page="perPageValue"
                :sibling-count="1"
                show-edges
                @update:page="onPageChange"
              />
            </div>
          </div>
          </ClientOnly>


        </section>
      </div>

      <!-- Balance Log -->
      <section class="mt-8 rounded-lg bg-gray-50 px-4 py-6 sm:p-6 lg:p-8">
        <div class="flex justify-between items-center">
          <h2 class="text-2xl font-bold tracking-tight text-gray-900">Mutasi Saldo</h2>
          <USelect v-model="logPerPageValue" :items="perPageItems" />
        </div>
        <USeparator class="mt-2" />

        <ClientOnly>
          <template #fallback>
            <AppLoadingSkeleton class="p-6" />
          </template>
        <!-- LOADING -->
        <div v-if="loadingBalanceLog" class="p-6">
          <AppLoadingSkeleton />
        </div>

        <!-- EMPTY -->
        <div v-else-if="!balanceLogPagination?.content?.length" class="p-6">
          <UAlert
            title="Belum ada mutasi saldo"
            description="Riwayat mutasi saldo Anda akan muncul di sini"
            icon="imdi:tag-off-outline"
            color="neutral"
          />
        </div>

        <!-- DATA -->
        <div v-else>
          <div
            v-for="log in balanceLogPagination?.content"
            :key="log.id"
            class="flex items-center border-b border-gray-200 px-4 py-4 gap-4"
          >
            <!-- Icon CREDIT / DEBIT -->
            <div
              class="flex-none rounded-full p-2"
              :class="log.type === 'CREDIT' ? 'bg-green-100' : 'bg-red-100'"
            >
              <UIcon
                :name="log.type === 'CREDIT' ? 'mdi:arrow-down-circle' : 'mdi:arrow-up-circle'"
                class="size-6"
                :class="log.type === 'CREDIT' ? 'text-green-600' : 'text-red-500'"
              />
            </div>

            <!-- Info -->
            <div class="flex-grow flex flex-col gap-0.5">
              <p class="font-medium text-gray-800 text-sm">{{ log.description || '-' }}</p>
              <div class="flex gap-3 text-xs text-gray-500 flex-wrap">
                <span class="flex items-center gap-1">
                  <UIcon name="mdi:calendar" class="size-3.5" />
                  {{ dayjs(log.created_at).format('YYYY-MM-DD HH:mm:ss') }}
                </span>
                <span class="flex items-center gap-1">
                  <UIcon name="mdi:history" class="size-3.5" />
                  {{ formatRupiah(log.old_balance) }} → {{ formatRupiah(log.new_balance) }}
                </span>
              </div>
            </div>

            <!-- Jumlah -->
            <div class="flex-none text-right">
              <span
                class="font-semibold text-base"
                :class="log.type === 'CREDIT' ? 'text-green-600' : 'text-red-500'"
              >
                {{ log.type === 'CREDIT' ? '+' : '-' }}{{ log.amount.toLocaleString('id-ID') }}
              </span>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="balanceLogPagination && balanceLogPagination.total_pages > 1" class="flex justify-center items-center pt-4">
            <UPagination
              :page="logPage + 1"
              :total="balanceLogPagination.total_elements"
              :items-per-page="logPerPageValue"
              :sibling-count="1"
              show-edges
              @update:page="onLogPageChange"
            />
          </div>
        </div>
        </ClientOnly>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
  import dayjs from 'dayjs'
  import PaymentStatusBadge from '~/components/app/PaymentStatusBadge.vue'
  import { useBalanceApi } from '~/composables/api/balance'

const breadcrumb = [
  { label: 'Home', icon: 'i-lucide-home', to: '/' },
  { label: 'Saldo Saya', icon: 'i-heroicons-wallet' },
]
  import type { StringIdRequest } from '~/types/StringIdRequest'
  import { useToast } from "#imports" // Nuxt UI toast
  import type { DepositRequest } from '~/types/balance/DepositRequest'
import type { DepositResponse } from '~/types/balance/DepositResponse'
import type { BalanceLogResponse } from '~/types/balance/BalanceLogResponse'
import type { PageResponse } from '~/types/PageResponse'

  // Reactive state
  const error = ref<string | null | any >(null)
  const isDepositOpen = ref(false)
  const submittingDeposit = ref(false)
  const toast = useToast()
  const { confirm, close } = useConfirm()

  //paging ref
  const page = ref(0)
  const perPageValue = ref<number>(10)
  const perPageItems = ref<number[]>([5, 10, 25, 50, 100])

  //paging log ref
  const logPage = ref(0)
  const logPerPageValue = ref<number>(10)

  //fetch
  const { fetchDepositHistory, fetchBalance, fetchDepositCancel, fetchDepositBalance, fetchBalanceLog } = useBalanceApi()

  //store
  const balanceStore = useBalanceStore()
  const authStore  = useAuthStore()

  const { 
    data: balanceData, 
    pending:balanceLoading, 
    error:errorBalance, 
    refresh:refreshBalance } 
  = await useAsyncData(
    `balance-page`,
    async () => {
      const res = await fetchBalance()
      balanceStore.setBalance(res.balance)
      balanceStore.setBalanceHeld(res.balance_held)
    },
    { server: false }
  )

  // ✅ SSR SAFE FETCH NEW
  const { 
    data: depositHistoryPagination, 
    pending:loadingDepositHistory, 
    error:errorDepositHistory, 
    refresh:refreshDepositHistory } 
    = await useAsyncData<PageResponse<DepositResponse>>(
    () => `deposit-history-page-${perPageValue.value}-${page.value}`,
    () => fetchDepositHistory(page.value, perPageValue.value),
    {
      watch: [page, perPageValue], // Refetch saat page atau perPageValue berubah
      server: false, // Hanya fetch di client
    }
  )

// const { data, pending:balanceLoading, error:errorBalance, refresh } = await useAsyncData(
//   'balance-page',
//   async () => {
//     const [balance, history] = await Promise.all([
//       fetchBalance(),
//       fetchDepositHistory(0, perPageValue.value),
//     ])
    
//     // Store update DI SINI, bukan di composable
//     balanceStore.setBalance(balance.balance)
//     balanceStore.setDepositHistory(history)
    
//     return { balance, history }
//   },
//   { server: false }
// )

  const {
    data: balanceLogPagination,
    pending: loadingBalanceLog,
    refresh: refreshBalanceLog,
  } = await useAsyncData<PageResponse<BalanceLogResponse>>(
    () => `balance-log-${logPage.value}-${logPerPageValue.value}`,
    () => fetchBalanceLog(logPage.value, logPerPageValue.value),
    { watch: [logPage, logPerPageValue], server: false }
  )

async function handleRefresh() {
  await refreshBalance()
  await refreshDepositHistory()
  await refreshBalanceLog()
}

  const onLogPageChange = (newPage: number) => {
    logPage.value = newPage - 1
  }

  const handleDepositSuccess = () => {
    isDepositOpen.value = false
  }

  const addToCart = () => {
    alert('Add to cart clicked!')
  }

const formatRupiah = (val:any) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR'
  }).format(val)
}

  const cancelHandle = async (deposit: DepositResponse) => {
    const yes = await confirm({
      title: 'Batalkan Deposit?',
      message: 'Deposit yang dibatalkan tidak bisa dikembalikan. Yakin?',
      confirmText: 'Ya, Batalkan',
      cancelText: 'Tidak',
      confirmColor: 'error',
    })

    if (!yes) return


    // loadingDepositHistory.value = true;
    try {

      await fetchDepositCancel(deposit.payment_id)

      toast.add({
      title: "Deposit Berhasil Dibatalkan 🎉",
      description: "Deposit Anda telah berhasil dibatalkan.",
      color: "success"
    })
      await refreshDepositHistory()
    } catch (err) {
      console.error('Cancel Deposit gagal:', err)
      toast.add({
        title: "Deposit Gagal dibatalkan ❌",
        description: "Lakukan refresh, lalu coba lagi",
        color: "error"
      })
    } finally {
      // loadingDepositHistory.value = false
      close()  // tutup dialog setelah action selesai
    }

  }

  // Deposit action
async function handleDepositSubmit(payload: DepositRequest) {
  submittingDeposit.value = true
  try {
    const deposit = await fetchDepositBalance(payload)
    
    toast.add({
      title: 'Deposit Dibuat',
      description: 'Silakan lanjutkan pembayaran',
      color: 'success',
      icon: 'material-symbols:check-circle-outline',
    })
    
    isDepositOpen.value = false
    await refreshBalance()
    
    // Optional: redirect ke halaman payment
    if (deposit.checkout_url) {
      window.open(deposit.checkout_url, '_blank')
    }
  } catch (err: any) {
    toast.add({
      title: 'Deposit Gagal',
      description: err.statusMessage || 'Terjadi kesalahan',
      color: 'error',
      icon: 'material-symbols:error-outline',
    })
  } finally {
    submittingDeposit.value = false
    refreshDepositHistory() // Refresh riwayat setelah deposit dibuat
  }
}

  //PAGINATION HANDLER
  const onPageChange = (newPage: number) => {
    page.value = newPage - 1
  }



</script>