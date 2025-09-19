<script setup>
  // in <script setup>
  defineProps({
    title: String,
    description: String,
    to: String,
    icon: String
  })
</script>

<template>
  <!-- Description section -->
  <div class="text-white my-4 justify-between items-center flex flex-row">
    <!-- Icon -->
    <div class="basis-2/12 md:basis-1/12  text-center">
      <UIcon :name="icon" class="text-primary size-10 "/>
    </div>

    <!-- Text & Description -->
    <div class="basis-10/12 flex flex-col">
      <h2 class="text-2xl font-bold text-primary "> 
        {{ title }}
      </h2>
      <p class="text-black">{{ description }}</p>

    </div>

    <!-- Button -->
    <div class="basis-1/12 p-4">
      <ULink to="/category">
        <UButton color="primary" label="Lihat Semua" trailing-icon="i-lucide-arrow-right"/>
      </ULink>
    </div>
  </div>
</template>

<style>

</style>