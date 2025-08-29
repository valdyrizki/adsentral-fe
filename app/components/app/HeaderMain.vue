<script setup lang="ts">
import { UIcon } from '#components';

</script>

<!-- components/HeaderMain.vue -->
<template>
<!-- Header Main -->
    <div class="bg-blue-800 text-white">
      <div class="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        
        <!-- Logo -->
        <a href="/" class="flex items-center">
          <!-- <img src="/logo-itemku.png" alt="Itemku" class="h-10" /> -->
           <h1><UIcon name="material-symbols:laptop-mac-outline" /> ADSENTRAL</h1>
        </a>

        <!-- Search Bar -->
        <div class="flex flex-1 mx-6">
          <div class="flex w-full">
            <!-- Dropdown kategori -->

            

            <!-- Input -->
            <input
              type="text"
              placeholder="Cari produk..."
              class="flex-1 px-4 py-2 border border-gray-300 focus:outline-none "
            />

            <!-- Search button -->
            <button class="bg-blue-500 px-4 rounded-r-lg hover:bg-blue-600">
              <UIcon name="mdi:magnify" />
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center space-x-4">
          <!-- Cart -->
          <button class="relative hover:opacity-80">
            <UIcon name="material-symbols:shopping-cart" />
            <span
              class="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1 rounded-full">3</span>
          </button>

          <!-- Login -->
          <UModal :dismissible="false" :transition="true" :overlay="true" title="Sign in to your account">
            <UButton label="Daftar" color="neutral" variant="subtle" class="bg-blue-500 px-4 py-2 rounded text-white hover:bg-blue-600" />

            <template #body>
              <LazyFormLogin/>
            </template>
          </UModal>

          <!-- Login -->
          <UModal :dismissible="false" :transition="true" :overlay="true" title="Sign in to your account">
            <UButton label="Masuk" color="neutral" variant="subtle" class="bg-blue-500 px-4 py-2 rounded text-white hover:bg-blue-600" />

            <template #body>
              <LazyFormLogin/>
            </template>
          </UModal>
        </div>
        
      </div>
    </div>
</template>
