<script setup lang="ts">

</script>

<template>
  <div>
    <!-- HEADER -->
    <div>
      <AppHeader/>
    </div>
    
    <!-- MAIN/ -->
    <div>
      <slot/>
    </div>

    <div>
      <AppFooter/>
    </div>
  </div>
</template>;
