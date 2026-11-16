<template>
  <UModal v-model:open="open" :title="user ? `Detail ${user.email}` : 'Detail Pengguna'" :ui="{ content: 'sm:max-w-2xl' }">
    <template #body>
      <div v-if="user" class="space-y-4">
        <UTabs v-model="tab" :items="tabItems" :content="false" />

        <!-- Mutasi saldo (semua peran) -->
        <div v-if="tab === 'mutasi'">
          <AppLoadingSkeleton v-if="logPending" />
          <UAlert v-else-if="logError" color="error" icon="mdi:alert-circle" :description="apiErrorMessage(logError, 'Gagal memuat mutasi')" />
          <p v-else-if="!logs?.content.length" class="py-6 text-center text-sm text-gray-400">Belum ada mutasi saldo.</p>
          <div v-else class="divide-y divide-gray-100">
            <div v-for="log in logs.content" :key="log.id" class="py-2 flex gap-3 text-sm">
              <div class="min-w-0 flex-1">
                <p class="text-gray-800 truncate">{{ log.description }}</p>
                <p class="text-xs text-gray-400">{{ walletSourceLabels[log.source] ?? log.source }} · {{ formatDate(log.created_at) }}</p>
              </div>
              <span :class="log.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'" class="font-medium flex-shrink-0">
                {{ log.type === 'CREDIT' ? '+' : '-' }}{{ formatRupiah(log.amount) }}
              </span>
            </div>
          </div>
          <div v-if="logs && logs.total_pages > 1" class="flex justify-center pt-3">
            <UPagination :page="logPage + 1" :total="logs.total_elements" :items-per-page="10" size="xs" @update:page="(p) => { logPage = p - 1 }" />
          </div>
        </div>

        <!-- Ringkasan seller + tautan data toko -->
        <div v-else-if="tab === 'ringkasan'">
          <AppLoadingSkeleton v-if="summaryPending" />
          <UAlert v-else-if="summaryError" color="error" icon="mdi:alert-circle" :description="apiErrorMessage(summaryError, 'Gagal memuat ringkasan')" />
          <div v-else-if="summary" class="space-y-3 text-sm">
            <p class="font-semibold text-gray-800">{{ summary.merchant_name }} <span class="text-xs text-gray-400">#{{ summary.merchant_id }}</span></p>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div class="rounded-lg bg-gray-50 p-2"><p class="text-xs text-gray-400">Pesanan aktif</p><p class="font-semibold">{{ summary.orders.active }}</p></div>
              <div class="rounded-lg bg-gray-50 p-2"><p class="text-xs text-gray-400">Perlu konfirmasi</p><p class="font-semibold">{{ summary.orders.waiting_confirmation }}</p></div>
              <div class="rounded-lg bg-gray-50 p-2"><p class="text-xs text-gray-400">Garansi berjalan</p><p class="font-semibold">{{ summary.orders.guarantee_request }}</p></div>
              <div class="rounded-lg bg-gray-50 p-2"><p class="text-xs text-gray-400">Arbitrase</p><p class="font-semibold">{{ summary.orders.arbitrage }}</p></div>
              <div class="rounded-lg bg-gray-50 p-2"><p class="text-xs text-gray-400">Produk aktif / review / diblokir</p><p class="font-semibold">{{ summary.products.active }} / {{ summary.products.in_review }} / {{ summary.products.blocked }}</p></div>
              <div class="rounded-lg bg-gray-50 p-2"><p class="text-xs text-gray-400">Pendapatan / ditarik</p><p class="font-semibold">{{ formatRupiah(summary.finance.total_income) }} / {{ formatRupiah(summary.finance.withdrawn) }}</p></div>
            </div>
            <div class="flex flex-wrap gap-2">
              <UButton size="xs" variant="soft" :to="`/admin/product?merchant_id=${summary.merchant_id}`">Produk</UButton>
              <UButton size="xs" variant="soft" :to="`/admin/stock?merchant_id=${summary.merchant_id}`">Stok</UButton>
              <UButton size="xs" variant="soft" :to="`/admin/guarantee?merchant_id=${summary.merchant_id}`">Garansi</UButton>
              <UButton size="xs" variant="soft" :to="`/admin/withdrawal?user_id=${user.id}`">Withdrawal</UButton>
            </div>
          </div>
        </div>

        <!-- Rekening (nomor penuh, akses tercatat di audit BE) -->
        <div v-else-if="tab === 'rekening'">
          <AppLoadingSkeleton v-if="bankPending" />
          <UAlert v-else-if="bankError" color="neutral" icon="mdi:bank-off-outline" :description="apiErrorMessage(bankError, 'Rekening belum disimpan')" />
          <div v-else-if="bank" class="space-y-1 text-sm">
            <p class="text-xs text-gray-400">Akses ini tercatat di audit log.</p>
            <p><span class="text-gray-400">Bank:</span> {{ bank.bank_name }}</p>
            <p><span class="text-gray-400">Nomor:</span> <span class="font-mono">{{ bank.account_number }}</span></p>
            <p><span class="text-gray-400">Atas nama:</span> {{ bank.account_holder_name }}</p>
            <p v-if="bank.name_check_status"><span class="text-gray-400">Cocok nama KTP:</span> {{ bank.name_check_status }}</p>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { useAdminSellerApi } from '~/composables/api/admin-seller'
import type { AdminUserResponse } from '~/types/user/AdminUserResponse'
import type { PageResponse } from '~/types/PageResponse'
import type { BalanceLogResponse } from '~/types/balance/BalanceLogResponse'
import type { AdminSellerSummaryResponse } from '~/types/seller-summary/AdminSellerSummaryResponse'
import type { BankAccountResponse } from '~/types/bank-account/BankAccountResponse'

/** Detail pengguna untuk CS (EP06-08): mutasi saldo; untuk seller juga ringkasan toko dan rekening. */
const props = defineProps<{ user: AdminUserResponse | null }>()
const open = defineModel<boolean>('open', { default: false })

const { fetchUserBalanceLog, fetchSellerSummary, fetchSellerBankAccount } = useAdminSellerApi()

const isSeller = computed(() => props.user?.role === 'SELLER')
const tab = ref('mutasi')
const tabItems = computed(() => [
  { label: 'Mutasi Saldo', value: 'mutasi' },
  ...(isSeller.value ? [{ label: 'Ringkasan Seller', value: 'ringkasan' }, { label: 'Rekening', value: 'rekening' }] : []),
])

// Mutasi saldo dimuat saat modal dibuka; ringkasan & rekening hanya saat tab-nya dipilih (rekening tercatat di audit)
const logPage = ref(0)
const logs = ref<PageResponse<BalanceLogResponse> | null>(null)
const logPending = ref(false)
const logError = ref<unknown>(null)
const summary = ref<AdminSellerSummaryResponse | null>(null)
const summaryPending = ref(false)
const summaryError = ref<unknown>(null)
const bank = ref<BankAccountResponse | null>(null)
const bankPending = ref(false)
const bankError = ref<unknown>(null)

async function loadLogs() {
  if (!props.user) return
  logPending.value = true
  logError.value = null
  try {
    logs.value = await fetchUserBalanceLog(props.user.id, logPage.value, 10)
  } catch (err) {
    logError.value = err
  } finally {
    logPending.value = false
  }
}

watch(() => [open.value, props.user?.id], ([isOpen]) => {
  if (!isOpen) return
  tab.value = 'mutasi'
  logPage.value = 0
  logs.value = null
  summary.value = null
  bank.value = null
  summaryError.value = null
  bankError.value = null
  loadLogs()
}, { immediate: true })
watch(logPage, loadLogs)

watch(tab, async (t) => {
  if (!props.user) return
  if (t === 'ringkasan' && !summary.value) {
    summaryPending.value = true
    try { summary.value = await fetchSellerSummary(props.user.id) } catch (err) { summaryError.value = err } finally { summaryPending.value = false }
  }
  if (t === 'rekening' && !bank.value && !bankError.value) {
    bankPending.value = true
    try { bank.value = await fetchSellerBankAccount(props.user.id) } catch (err) { bankError.value = err } finally { bankPending.value = false }
  }
})

const formatDate = (v: string) => dayjs(v).format('DD MMM YYYY, HH:mm')
</script>
