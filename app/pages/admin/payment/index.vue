<template>
  <div class="space-y-6">

    <!-- Header Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <UCard v-for="stat in statsCards" :key="stat.label" class="shadow-sm">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs text-gray-400 mb-1">{{ stat.label }}</p>
            <p class="text-xl font-bold text-gray-800">{{ stat.value }}</p>
          </div>
          <div :class="`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.bgColor}`">
            <UIcon :name="stat.icon" :class="`text-xl ${stat.iconColor}`" />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Filters -->
    <UCard class="shadow-sm">
      <div class="flex flex-col sm:flex-row gap-3">
        <UInput
          v-model="search"
          placeholder="Cari ID pembayaran..."
          icon="i-heroicons-magnifying-glass"
          class="flex-1"
          clearable
          @keyup.enter="handleSearch"
        />
        <USelect
          v-model="filterStatus"
          :items="statusOptions"
          placeholder="Semua Status"
          value-key="value"
          class="w-full sm:w-52"
          @update:model-value="handleFilter"
        />
        <USelect v-model="perPageValue" :items="perPageItems" class="w-full sm:w-24" />
        <UButton icon="mdi:refresh" color="neutral" variant="outline" :loading="pending" @click="refresh()">
          Refresh
        </UButton>
      </div>
    </UCard>

    <!-- Table -->
    <UCard class="shadow-sm">
      <template #header>
        <div class="flex items-center justify-between">
          <p class="font-semibold text-gray-800">
            Semua Pembayaran
            <span v-if="payments?.total_elements" class="text-xs text-gray-400 font-normal ml-2">
              ({{ payments.total_elements }} total)
            </span>
          </p>
        </div>
      </template>

      <AppLoadingSkeleton v-if="pending" />

      <UAlert
        v-else-if="error"
        title="Terjadi Kesalahan"
        :description="error.message || 'Gagal memuat data'"
        icon="icon-park-solid:error"
        color="error"
      />

      <div v-else-if="!payments?.content?.length" class="py-10 text-center text-gray-400 text-sm">
        <UIcon name="i-heroicons-inbox" class="text-4xl text-gray-300 mb-3" />
        <p>Tidak ada data pembayaran.</p>
      </div>

      <div v-else class="divide-y divide-gray-100">
        <div
          v-for="payment in payments.content"
          :key="payment.id"
          class="flex flex-col sm:flex-row gap-4 py-4 px-2 hover:bg-gray-50 rounded-xl transition-colors w-full"
        >
          <!-- Group Icon + ID + Method + Time -->
          <NuxtLink :to="`/admin/payment/${payment.id}`" class="flex gap-4">
            <!-- Icon -->
            <div
              :class="`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${payment.payment_type === 'DEPOSIT' ? 'bg-green-100' : 'bg-primary/10'}`"
            >
              <UIcon
                :name="payment.payment_type === 'DEPOSIT' ? 'i-heroicons-arrow-down-circle' : 'i-heroicons-shopping-bag'"
                :class="`text-lg ${payment.payment_type === 'DEPOSIT' ? 'text-green-600' : 'text-primary'}`"
              />
            </div>

            <!-- Payment ID & Method -->
            <div class="flex flex-col gap-1">
              <p class="text-sm font-semibold text-gray-800 font-mono">#{{ payment.id }}</p>
              <div class="flex gap-1">
                <UBadge
                  :color="payment.payment_type === 'DEPOSIT' ? 'success' : 'primary'"
                  variant="subtle"
                  size="xs"
                >
                  {{ payment.payment_type === 'DEPOSIT' ? 'Deposit' : 'Transaksi' }}
                </UBadge>
                <UBadge v-if="payment.payment_method" color="info" variant="soft" size="xs">
                  {{ payment.payment_method.payment_gateway }}
                </UBadge>
              </div>
              
                <p class="text-xs text-gray-400">
                  {{ dayjs(payment.created_at).format('DD MMM YYYY, HH:mm') }}
                </p>
            </div>

            <!-- User -->
            <div class="flex flex-col">
              <p class="text-xs text-gray-500">
                <UIcon name="i-heroicons-user" class="text-xs" /> {{ payment.user?.full_name ?? payment.user?.username ?? '-' }}
              </p>
              <p class="text-xs text-gray-400 truncate">{{ payment.user?.email ?? '' }}</p>
              <p class="text-sm font-bold text-gray-800 mt-2">Rp {{ payment.amount.toLocaleString('id-ID') }}</p>
            </div>
          </NuxtLink>

          <!-- Status -->
          <div class="flex flex-col gap-2 sm:ml-auto">
            <PaymentStatusBadge :status="payment.status" class="w-auto text-xs" />
                <!-- Actions -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <!-- Bukti bayar -->
              <!-- <UTooltip text="Lihat Bukti Pembayaran">
                <UButton
                  v-if="payment.payment_proof_url"
                  :to="config.public.backendUrl + '/' + payment.payment_proof_url"
                  target="_blank"
                  size="xs"
                  variant="soft"
                  color="info"
                  icon="i-heroicons-photo"
                />
                <UButton
                  v-else
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  icon="i-heroicons-photo"
                  disabled
                />
              </UTooltip> -->

              <!-- Konfirmasi -->
              <UTooltip text="Konfirmasi Pembayaran">
                <UButton
                  v-if="canConfirm(payment)"
                  size="xs"
                  color="success"
                  variant="soft"
                  icon="i-heroicons-check-circle"
                  label="Konfirmasi"
                  @click="handleConfirm(payment.id)"
                  />
              </UTooltip>

              <!-- Tolak -->
              <UTooltip text="Tolak Pembayaran">
                <UButton
                  v-if="canConfirm(payment)"
                  size="xs"
                  color="error"
                  variant="soft"
                  icon="i-heroicons-x-circle"
                  label="Tolak"
                  @click="handleReject(payment.id)"
                />
              </UTooltip>

              <!-- Detail -->
              <UTooltip v-if="payment.payment_type === 'TRANSACTION'" text="Detail Transaksi">
                <UButton
                  :to="`/admin/payment/${payment.id}`"
                  size="xs"
                  variant="ghost"
                  color="neutral"
                  label="Detail Pembayaran"
                  icon="i-heroicons-eye"
                />
              </UTooltip>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div
        v-if="payments && payments.total_pages > 1 && !pending"
        class="flex justify-center items-center pt-4"
      >
        <UPagination
          :page="page + 1"
          :total="payments.total_elements"
          :items-per-page="perPageValue"
          :sibling-count="1"
          show-edges
          @update:page="onPageChange"
        />
      </div>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
  import dayjs from 'dayjs'
  import PaymentStatusBadge from '~/components/app/PaymentStatusBadge.vue'
import { useBalanceApi } from '~/composables/api/balance'
  import { usePaymentApi } from '~/composables/api/payment'
  import type { PageResponse } from '~/types/PageResponse'
  import type { PaymentResponse } from '~/types/payment/PaymentResponse'
import type { StringIdRequest } from '~/types/StringIdRequest'

  definePageMeta({ layout: 'admin', label: 'Manajemen Pembayaran' })

  const config = useRuntimeConfig()
  const toast = useToast()
  const { fetchAllPayments, fetchConfirmPayment } = usePaymentApi()
  const { fetchDepositCancel } = useBalanceApi()

  // ===== FILTER STATE =====
  const page = ref(0)
  const perPageValue = ref(20)
  const perPageItems = [10, 20, 50, 100]
  const search = ref('')
  const keyword = ref('')
  const filterStatus = ref('ALL')

  const statusOptions = [
    { label: 'Semua Status', value: 'ALL' },
    { label: 'Menunggu Bayar', value: 'UNPAID' },
    { label: 'Dibayar', value: 'PAID' },
    { label: 'Dibatalkan', value: 'CANCELLED' },
    { label: 'Ditolak', value: 'REJECTED' },
  ]

  let searchTimeout: ReturnType<typeof setTimeout> | null = null

  // ===== FETCH =====
  const {
    data: payments,
    pending,
    error,
    refresh,
  } = await useAsyncData<PageResponse<PaymentResponse>>(
    () => `admin-payments-${page.value}-${perPageValue.value}-${keyword.value}-${filterStatus.value}`,
    () => fetchAllPayments(page.value, perPageValue.value, keyword.value, filterStatus.value),
    { watch: [page, perPageValue], server: false }
  )

  // ===== STATS =====
  const statsCards = computed(() => {
    const list = payments.value?.content ?? []
    const total = payments.value?.total_elements ?? 0
    const paid = list.filter(p => p.status === 'PAID').length
    const done = list.filter(p => ['DONE', 'COMPLETE'].includes(p.status)).length
    const totalAmount = list
      .filter(p => ['DONE', 'COMPLETE', 'IN_PROGRESS', 'PAID'].includes(p.status))
      .reduce((s, p) => s + p.amount, 0)

    return [
      { label: 'Total Payment', value: total.toString(), icon: 'i-heroicons-credit-card', bgColor: 'bg-blue-50', iconColor: 'text-blue-500' },
      { label: 'Lunas', value: paid.toString(), icon: 'i-heroicons-clock', bgColor: 'bg-yellow-50', iconColor: 'text-yellow-500' },
      { label: 'Selesai', value: done.toString(), icon: 'i-heroicons-check-circle', bgColor: 'bg-green-50', iconColor: 'text-green-500' },
      { label: 'Total Nominal', value: 'Rp ' + totalAmount.toLocaleString('id-ID'), icon: 'i-heroicons-banknotes', bgColor: 'bg-purple-50', iconColor: 'text-purple-500' },
    ]
  })

  // ===== HELPERS =====
  function canConfirm(payment: PaymentResponse) {
    return payment.status === 'UNPAID' && (payment.payment_type === 'DEPOSIT' || payment.payment_method?.id === 'MANUAL_BANK')
  }

  function onPageChange(newPage: number) {
    page.value = newPage - 1
  }

  function handleFilter() {
    page.value = 0
    refresh()
  }

  watch(search, (val) => {
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      keyword.value = val
      page.value = 0
      refresh()
    }, 500)
  })

  function handleSearch() {
    if (searchTimeout) clearTimeout(searchTimeout)
    keyword.value = search.value
    page.value = 0
    refresh()
  }

  // ===== CONFIRM =====
  const { confirm, close } = useConfirm()

  async function handleConfirm(paymentId: string) {
    
    const yes = await confirm({
      title: 'Konfirmasi Pembayaran?',
      message: 'Pembayaran yang dikonfirmasi tidak bisa dibatalkan. Yakin?',
      confirmText: 'Ya, Konfirmasi',
      cancelText: 'Tidak',
      confirmColor: 'success',
    })
    
    if (!yes) return

    try {
      await fetchConfirmPayment(paymentId)
      toast.add({ title: 'Pembayaran dikonfirmasi', color: 'success', icon: 'i-heroicons-check-circle' })
      await refresh()
    } catch (err: any) {
      toast.add({ title: 'Gagal konfirmasi', description: err.statusMessage || err.message, color: 'error' })
    } finally {
      close()
    }
  }

  // ===== REJECT =====

  async function handleReject(paymentId: string) {
    
    const yes = await confirm({
      title: 'Batalkan Deposit?',
      message: 'Deposit yang dibatalkan tidak bisa dikembalikan. Yakin?',
      confirmText: 'Ya, Batalkan',
      cancelText: 'Tidak',
      confirmColor: 'error',
    })
    
    if (!yes) return

    try {
      await fetchDepositCancel(paymentId)
      toast.add({ title: 'Pembayaran dibatalkan', color: 'success', icon: 'i-heroicons-check-circle' })
      await refresh()
    } catch (err: any) {
      toast.add({ title: 'Gagal membatalkan', description: err.statusMessage || err.message, color: 'error' })
    } finally {
      close()
    }
  }
</script>
