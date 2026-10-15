<script setup lang="ts">
// Satu request GET /alerts per interval untuk badge sisi pembeli (header)
useAlertsPolling('buyer')
</script>

<template>
  <div class="min-h-screen bg-white flex flex-col">
    <AppHeader/>
    <AppBuyerPenaltyBanner />

    <main class="flex-1">
      <slot/>
    </main>
    
    <AppFooter class="mt-10"/>


  </div>
</template>