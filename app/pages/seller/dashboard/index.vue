<template>
<!-- Stats cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <UCard>
      <div class="text-sm text-gray-500">Total Sales</div>
      <div class="text-2xl font-bold mt-2">Rp 12.500.000</div>
    </UCard>
    <UCard>
      <div class="text-sm text-gray-500">Orders</div>
      <div class="text-2xl font-bold mt-2">156</div>
    </UCard>
    <UCard>
      <div class="text-sm text-gray-500">Customers</div>
      <div class="text-2xl font-bold mt-2">89</div>
    </UCard>
  </div>

  <!-- Chart example -->
   <div class="mt-6">
    <UCard>
      <template #header>
        <div class="text-lg font-semibold">Sales Overview</div>
      </template>
      <div class="h-72">
        <UChart
          type="line"
          :data="{
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
              {
                label: 'Sales',
                data: [500, 1000, 1500, 2000, 1800, 2200],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                fill: true,
              }
            ]
          }"
          :options="{ responsive: true, maintainAspectRatio: false }"
        />
      </div>
    </UCard>
   </div>
  

  <!-- Chart example -->
  <div class="mt-6">
    <UCard>
      <template #header>
        <div class="text-lg font-semibold">Trasaksi Terakhir</div>
      </template>
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        
        <div v-for="transaction in transactionPagination?.content" :key="transaction.id" class="border rounded-2xl border-blue-500 p-2">
          <AppTransactionItem :transaction="transaction" class="" />
        </div>
        <div v-for="transaction in transactionPagination?.content" :key="transaction.id" class="border rounded-2xl border-blue-500 p-2">
          <AppTransactionItem :transaction="transaction" />
        </div>

      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { useTransactionApi } from '~/composables/api/transaction'
import type { PageResponse } from '~/types/PageResponse'
import type { TransactionResponse } from '~/types/TransactionResponse'

definePageMeta({
  layout: "seller",
  label: "Dashboard",
  // middleware: ["auth", "seller-only"] // opsional kalau mau validasi role
})

// Ambil API function
const { getBuyerTransactions } = useTransactionApi()

// Reactive state
const loading = ref<boolean>(true)
const error = ref<string | null | any >(null)
const transactionPagination = ref<PageResponse<TransactionResponse>>()


  // fungsi Fetch data di server-side (Nuxt auto-handle hydration)
  try { 
    loading.value = true
    transactionPagination.value = await getBuyerTransactions() // page=0, size=10
  } catch (err: any) {
    error.value = err.statusMessage || 'Failed to load transactions'
  } finally {
    loading.value = false
  }


  const addToCart = () => {
    alert('Add to cart clicked!')
  }
</script>

<style>

</style>