<template>
  <UCard class="col-span-2">
    <div class="text-2xl">Filters</div>
    <div class="flex gap-4 mt-2">
      <div>
        <div class="text-sm text-gray-500">Per Page</div>
        <UInputMenu v-model="perPageValue" :items="perPageItems" />
      </div>
      <div>
        <div class="text-sm text-gray-500">Search</div>
        <UInput
          v-model="search"
          icon="mdi:magnify"
          placeholder="Cari ID transaksi"
          clearable
          @keyup.enter="applySearchNow"
        />
      </div>
      <div>
        <div class="text-sm text-gray-500">Status</div>
        <USelect v-model="filterStatus" :items="statusOptions" value-key="value" class="w-56" />
      </div>
      <div class="self-end">
        <UButton icon="mdi:refresh" color="neutral" variant="outline" :loading="pending || orderSummaryPending" @click="refreshAll()">
          Refresh
        </UButton>
      </div>
    </div>
  </UCard>

  <!-- Tab ringkasan pesanan (GET /seller/orders/summary) -->
  <ClientOnly>
    <UCard class="mt-6">
      <UAlert
        v-if="orderSummaryError"
        title="Gagal memuat ringkasan pesanan"
        :description="apiErrorMessage(orderSummaryError)"
        icon="mdi:alert-circle"
        color="error"
        variant="subtle"
        class="mb-3"
        :actions="apiErrorStatus(orderSummaryError) === 403 ? [] : [{ label: 'Coba lagi', icon: 'mdi:refresh', color: 'error', variant: 'outline', onClick: () => refreshOrderSummary() }]"
      />
      <div class="flex flex-wrap gap-2">
        <UButton
          :color="filterStatus === 'ALL' ? 'primary' : 'neutral'"
          :variant="filterStatus === 'ALL' ? 'solid' : 'outline'"
          size="sm"
          @click="filterStatus = 'ALL'"
        >
          Semua
        </UButton>
        <UButton
          v-for="tab in sellerOrderSummaryItems"
          :key="tab.key"
          :color="isSummaryTabActive(tab) ? 'primary' : 'neutral'"
          :variant="isSummaryTabActive(tab) ? 'solid' : 'outline'"
          size="sm"
          :icon="tab.icon"
          :to="tab.status ? undefined : tab.to"
          @click="tab.status && selectSummaryTab(tab)"
        >
          {{ tab.label }}
          <USkeleton v-if="orderSummaryPending" class="h-4 w-5 rounded-full" />
          <UBadge
            v-else-if="orderSummary"
            :color="isSummaryTabActive(tab) ? 'neutral' : 'primary'"
            variant="soft"
            size="sm"
          >
            {{ orderSummary[tab.key] }}
          </UBadge>
        </UButton>
      </div>

      <!-- Pesanan Aktif = gabungan 3 status; BE hanya menerima satu status per request -->
      <div v-if="isActiveGroup" class="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
        <span class="text-xs text-gray-500">Pesanan Aktif:</span>
        <UButton
          v-for="opt in activeSubFilters"
          :key="opt.value"
          size="xs"
          :color="filterStatus === opt.value ? 'primary' : 'neutral'"
          :variant="filterStatus === opt.value ? 'soft' : 'ghost'"
          @click="filterStatus = opt.value"
        >
          {{ opt.label }}
        </UButton>
      </div>
    </UCard>
  </ClientOnly>

  <!-- Chart example -->
  <ClientOnly>
    <template #fallback>
      <div class="mt-6">
        <UCard>
          <template #header><USkeleton class="h-5 w-32 rounded" /></template>
          <div v-for="i in 5" :key="i" class="flex items-center gap-4 py-4 px-2 border-b border-gray-100">
            <USkeleton class="w-40 h-40 rounded-lg flex-none" />
            <div class="flex-1 space-y-2">
              <USkeleton class="h-4 w-32 rounded" />
              <USkeleton class="h-4 w-48 rounded" />
            </div>
          </div>
        </UCard>
      </div>
    </template>
  <div class="mt-6">
    <UCard>
      <template #header>
        <div class="text-lg font-semibold">List Pesanan</div>
      </template>
      <div class="grid grid-cols-1 gap-4">
        
        <div v-if="pending">
            <AppLoadingSkeleton/>
        </div>
        <div v-else-if="error">
          <UAlert
              title="Terjadi Kesalahan"
              :description="error.message  || 'Gagal memuat data pesanan'"
              icon="mdi:alert-circle:error"
              color="error"
            />
        </div>
        <div v-else-if="transactionPagination?.content?.length == 0">
          <UAlert
              :title="emptyTitle"
              description=""
              icon="lucide:history"
              color="neutral"
            />
            <UButton v-if="keyword" class="mt-3" size="xs" variant="outline" color="neutral" icon="i-lucide-x" @click="clearSearch">
              Hapus pencarian
            </UButton>
        </div>
        <div v-else>
          <div v-for="tx in transactionPagination?.content" :key="tx.id" class="border-b border-gray-200 p-2 m-2">
            <div class="flex flex-row gap-4 w-full">
              <div class="flex-none">
                <div class=" sm:order-first">
                  <img :src="getImageUrl(tx.product?.banner_url)" :alt="tx.product?.name" class=" size-40 rounded-lg object-cover " />
                </div>
              </div>
                <div class="flex-grow flex flex-col">
                  <!-- Konten atas yang akan memenuhi ruang -->
                  <div class="flex flex-col gap-1">
                    <div class="flex flex-row gap-2">
                      <NuxtLink :to="`/seller/order/${tx.id}`" class="font-medium text-gray-900">ID : #{{ tx.id }}</NuxtLink>
                    </div>
                  <div>
                    <h3 class="text-lg font-medium text-gray-900">{{ tx.product.name }}</h3>
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">{{ tx.qty }} pcs x {{ tx.price.toLocaleString('id-ID') }}</p>
                  </div>
                </div>

                  <!-- Konten bawah yang akan didorong ke bawah -->
                  <div class="mt-auto flex flex-col sm:flex-row gap-1 sm:gap-4 pt-4 sm:pt-0"> <!-- Gunakan 'mt-auto' untuk mendorong ke bawah -->
                    <div class="flex flex-row gap-1">
                      <UIcon name="fa6-solid:rupiah-sign" class="size-5 text-gray-400" />
                      <div class="font-medium">
                        {{ tx.total_price.toLocaleString('id-ID') }}
                      </div>
                    </div>

                    <div class="col-span-3 flex flex-row gap-1">
                      <UIcon name="mdi:calendar" class="size-5 text-gray-400" />
                      <div class="font-medium">
                        {{ dayjs(tx.created_at).format("YYYY-MM-DD HH:mm:ss")}}
                      </div>
                    </div>

                    <div v-if="getTxConfirmCountdown(tx, paymentNow)" class="col-span-3 flex flex-row gap-1">
                      <UIcon name="mdi:clock-alert-outline" class="size-5" :class="getTxConfirmCountdown(tx, paymentNow)!.expired ? 'text-red-500' : 'text-yellow-600'" />
                      <div class="font-medium tabular-nums" :class="getTxConfirmCountdown(tx, paymentNow)!.expired ? 'text-red-600' : 'text-yellow-700'">
                        {{ getTxConfirmCountdown(tx, paymentNow)!.text }}
                      </div>
                    </div>

                    <!-- TERJUAL -->
                    <div class="col-span-3 flex flex-row gap-1">
                      <UIcon name="mdi:cart" class="size-5 text-gray-400" />
                      <div class="font-medium">
                        {{ tx.product.sold }} Terjual
                      </div>
                    </div>
                  </div>
              </div>
              <div class="ml-auto flex-none">   
                <div class="flex flex-col gap-2 items-end">
                  
                  <TransactionStatusBadge :status="tx.status" />
                  <UButton v-if="tx.status === 'PAID'" icon="mdi:check-circle" size="xs" color="info" variant="solid" @click="handleConfirmOrder(tx.id)" :loading="acceptingId === tx.id" >Terima Pesanan</UButton>

                  <UButton
                    v-if="tx.status === 'PAID'"
                    icon="mdi:close-circle"
                    size="xs"
                    color="error"
                    variant="solid"
                    :loading="rejectingId === tx.id"
                    @click="openRejectModal(tx.id)"
                  >
                    Tolak Pesanan
                  </UButton>

                  <UButton v-if="tx.status === 'INACTIVE'" icon="mdi:check-circle" size="xs" color="info" variant="solid" >Aktifkan Product</UButton>
                  <UButton v-if="tx.status === 'ACTIVE'" icon="mdi:delete" size="xs" color="error" variant="solid" >Tangguhkan Product</UButton>
                </div> 
                
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div v-if="transactionPagination && transactionPagination.total_pages > 1 && !pending" class="flex justify-center items-center pt-4">
          <UPagination
            :page="page + 1"
            :total="transactionPagination.total_elements"
            :items-per-page="perPageValue"
            :sibling-count="1"
            show-edges
            @update:page="onPageChange"
          />
        </div>

      </div>
    </UCard>
  </div>
  </ClientOnly>

  <RejectTxModal
    v-model="isRejectingTxModal"
    :loading="rejectingTxId === selectedTxId"
    :error="rejectTxError"
    @submit="handeRejectTxSubmit"
  />



</template>

<script lang="ts" setup>
  definePageMeta({
    layout: "seller",
    label: "Orders",
    // middleware: ["auth", "seller-only"] // opsional kalau mau validasi role
  })

  import dayjs from 'dayjs';
  import TransactionStatusBadge from '~/components/app/TransactionStatusBadge.vue';
  import RejectTxModal from '~/components/form/RejectTxModal.vue';
  import { useTransactionApi } from '~/composables/api/transaction'
  import { useSellerSummaryApi } from '~/composables/api/seller-summary'
  import type { SellerOrderSummaryItem } from '~/utils/sellerOrderSummary'
  import type { PageResponse } from '~/types/PageResponse';
  import type { TransactionResponse } from '~/types/TransactionResponse';

  // State 
  const selectedTxId = ref<string | null>(null)
  const rejectingId  = ref<string | null>(null) //untuk fungsi loading button
  const isRejectingModal = ref<boolean>(false)

  //rejecting modal
  const rejectingTxId  = ref<string | null>(null)
  const isRejectingTxModal = ref<boolean>(false)
  const rejectTxError = ref<string | null>(null)

  // Ambil API function
  const { fetchTxSeller, fetchConfirmTx, fetchRejectTx } = useTransactionApi()

  // FILTER STATE
  const page = ref(0)
  const perPageItems = [5, 10, 25, 50]
  const perPageValue = ref(5)

  // Filter status + pencarian ID (disimpan di query string ?status=&keyword=)
  const paymentNow = usePaymentNow()
  const statusOptions = sellerTxStatusFilters
  const { filterStatus, search, keyword, activeStatusLabel, applySearchNow, clearSearch } = useTxListFilters(statusOptions, page)

  // ===== RINGKASAN (angka tab; sekali muat + muat ulang setelah aksi, tanpa polling) =====
  const { fetchOrderSummary } = useSellerSummaryApi()
  const {
    data: orderSummary,
    pending: orderSummaryPending,
    error: orderSummaryError,
    refresh: refreshOrderSummary,
  } = useAsyncData('seller-order-summary', fetchOrderSummary, { server: false })

  const isActiveGroup = computed(() => (ACTIVE_ORDER_STATUSES as readonly string[]).includes(filterStatus.value))
  const activeSubFilters = ACTIVE_ORDER_STATUSES.map(v => ({
    value: v,
    label: statusOptions.find(o => o.value === v)?.label ?? v,
  }))
  const isSummaryTabActive = (tab: SellerOrderSummaryItem) =>
    tab.key === 'active' ? isActiveGroup.value : !!tab.status && tab.status === filterStatus.value
  const selectSummaryTab = (tab: SellerOrderSummaryItem) => {
    // Pesanan Aktif: tetap di sub-filter yang sedang dipilih
    if (tab.key === 'active' && isActiveGroup.value) return
    if (tab.status) filterStatus.value = tab.status
  }

  // Muat ulang daftar + angka tab
  const refreshAll = () => Promise.all([refresh(), refreshOrderSummary()])

  const emptyTitle = computed(() => {
    const parts: string[] = []
    if (filterStatus.value !== 'ALL') parts.push(`status ${activeStatusLabel.value}`)
    if (keyword.value) parts.push(`ID '${keyword.value}'`)
    return parts.length ? `Tidak ada transaksi dengan ${parts.join(' dan ')}` : 'Anda belum mempunyai pesanan'
  })

  // ✅ SSR SAFE FETCH NEW
  const { 
    data: transactionPagination, 
    pending:pending, 
    error, 
    refresh } 
    = await useAsyncData<PageResponse<TransactionResponse>>(
    'my-tx-seller', () => fetchTxSeller(page.value, perPageValue.value, keyword.value, filterStatus.value),
    {
      watch: [page, perPageValue, keyword, filterStatus],
      server: false, // Hanya fetch di client
    }
  )

  // Status ditolak BE (400) -> kembali ke "Semua"
  watch(error, (err) => {
    if ((err as any)?.statusCode === 400 && filterStatus.value !== 'ALL') {
      useToast().add({ title: 'Filter status tidak valid', description: (err as any).statusMessage || err.message, color: 'error' })
      filterStatus.value = 'ALL'
    }
  })

  const acceptingId = ref<string | null>(null) //untuk fungsi loading button
  const handleConfirmOrder = async (txId: string) => {
    try {
      acceptingId.value = txId //untuk fungsi loading button
      await fetchConfirmTx(txId)
      useToast().add({
        title: 'Berhasil',
        description: 'Pesanan berhasil diterima',
        color: 'success'
      })
      refreshAll()
    } catch (err: any) {
      useToast().add({ title: 'Gagal', description: err.message || 'Gagal menerima pesanan', color: 'error' })
      if (isStaleActionError(err)) await refreshAll()
    }finally {
      acceptingId.value = null //untuk fungsi loading button
    }
  }
  

  const handleReject = async (reason: string) => {
    if (!selectedTxId.value) return

    try {
      rejectingId.value = selectedTxId.value

      await fetchRejectTx(selectedTxId.value as string, reason)

      useToast().add({
        title: 'Berhasil',
        description: 'Pesanan berhasil ditolak',
        color: 'success'
      })

      isRejectingModal.value = false
      selectedTxId.value = null

      await refreshAll()

    } catch (err: any) {
      useToast().add({
        title: 'Gagal',
        description: err.message || 'Gagal menolak pesanan',
        color: 'error'
      })
      if (isStaleActionError(err)) {
        isRejectingModal.value = false
        isRejectingTxModal.value = false
        selectedTxId.value = null
        await refreshAll()
      }
    } finally {
      rejectingId.value = null
    }
  }

  const onPageChange = (newPage: number) => {
    page.value = newPage - 1
  }

  const openRejectModal = (txId: string) => {
    console.log('OPEN MODAL', txId)
    selectedTxId.value = txId
    isRejectingTxModal.value = true
  }

  const handeRejectTxSubmit = async (reason: string) => {
    if (!selectedTxId.value) return

    try {
      rejectingTxId.value = selectedTxId.value

      await fetchRejectTx(selectedTxId.value as string, reason)

      useToast().add({
        title: 'Berhasil',
        description: 'Pesanan berhasil ditolak',
        color: 'success'
      })

      isRejectingTxModal.value = false
      selectedTxId.value = null

      await refreshAll()

    } catch (err: any) {
      useToast().add({
        title: 'Gagal',
        description: err.message || 'Gagal menolak pesanan',
        color: 'error'
      })
      if (isStaleActionError(err)) {
        isRejectingModal.value = false
        isRejectingTxModal.value = false
        selectedTxId.value = null
        await refreshAll()
      }
    } finally {
      rejectingTxId.value = null
    }
  }



</script>

<style>

</style>