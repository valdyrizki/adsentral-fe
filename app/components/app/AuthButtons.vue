<template>
  <div class="flex gap-4 justify-center md:justify-end">
      <div class="hidden md:flex gap-2">
        <UChip :text="5" color="error" size="3xl">
          <UButton color="neutral" variant="subtle" icon="material-symbols:notifications-rounded" />
        </UChip>
        <UChip :text="5" color="error" size="3xl">
          <UButton color="neutral" variant="subtle" icon="mynaui:envelope" />
        </UChip>
      </div>
      <div class="flex gap-2">
        
          <UModal title="Daftar Akun">
            <UButton color="primary">Daftar</UButton>

            <template #body>
              <FormRegister/>
            </template>
          </UModal>

          <UModal title="Login">
            <UButton color="primary">Masuk</UButton>

            <template #body>
              <FormLogin />
            </template>
          </UModal>

          
          
      </div>
    </div>
</template>

<style>

</style>