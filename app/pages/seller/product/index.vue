<template>
  <UCard class="col-span-2">
    <div class="text-2xl">Filters</div>
    <div class="flex gap-4 mt-2">
      <div>
        <div class="text-sm text-gray-500">Per Page</div>
        <UInputMenu v-model="perPageValue" :items="perPageitems" />
      </div>
      <div>
        <div class="text-sm text-gray-500">Search</div>
        <UInput v-model="search"  />
      </div>
      
      <UButton to="/seller/product/create" icon="uiw:plus">Buat Produk</UButton>
    </div>
  </UCard>

  <!-- Chart example -->
  <div class="mt-6">
    <UCard>
      <template #header>
        <div class="text-lg font-semibold">List Produk</div>
      </template>
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
        
        <!-- <div v-for="transaction in transactionPagination?.content" :key="transaction.id" class="border rounded-2xl border-blue-500 p-2">
          <AppTransactionItem :transaction="transaction" class="" />
        </div>
        <div v-for="transaction in transactionPagination?.content" :key="transaction.id" class="border rounded-2xl border-blue-500 p-2">
          <AppTransactionItem :transaction="transaction" />
        </div> -->

      </div>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
definePageMeta({
  layout: "dashboard",
  label: "Products",
  // middleware: ["auth", "seller-only"] // opsional kalau mau validasi role
})

const perPageitems = ref([5, 10, 25, 50])
const perPageValue = ref(5)
const search = ref('')
</script>

<style>

</style>