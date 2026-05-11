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