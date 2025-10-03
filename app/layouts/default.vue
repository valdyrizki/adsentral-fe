<script setup lang="ts">

</script>

<template>
  <div>
    <!-- HEADER -->
    <div>
      <!-- <AppHeader/> -->
      <AppHeader/>
    </div>
    
    <!-- MAIN/ -->
    <div>
      <slot/> 
    </div>

    <div class="mt-10">
      <AppFooter/>
    </div>
  </div>
</template>;




