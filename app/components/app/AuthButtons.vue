<template>
  <div class="flex gap-4 justify-center md:justify-end">
      <div class="hidden md:flex gap-2">
        <UChip :text="5" color="error" size="3xl">
          <UButton color="primary" variant="solid" icon="material-symbols:notifications-rounded" />
        </UChip>
        <UChip :text="5" color="error" size="3xl">
          <UButton color="primary" variant="solid" icon="mynaui:envelope" />
        </UChip>
      </div>
      <div class="flex gap-2">
          <UButton color="primary">Daftar</UButton>
          <UButton color="neutral">Masuk</UButton>
      </div>
    </div>
</template>

<style>

</style>