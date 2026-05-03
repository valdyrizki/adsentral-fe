<template>
  <div class="min-h-screen bg-white text-black">
    <UApp>
      <NuxtLoadingIndicator />
      <NuxtLayout :name="layoutName" :key="layoutName">
        <NuxtPage />
      </NuxtLayout>
    </UApp>
  </div>

  <ConfirmDialog
    v-model="confirmState.isOpen"
    :title="confirmState.title"
    :message="confirmState.message"
    :confirm-text="confirmState.confirmText"
    :cancel-text="confirmState.cancelText"
    :confirm-color="confirmState.confirmColor"
    :loading="confirmState.loading"
    @confirm="onConfirm"
    @cancel="onCancel"
  />
  
</template>

<script setup lang="ts">
  import type { LayoutKey } from '#build/types/layouts'

  const route = useRoute()
  const layoutName = computed<LayoutKey>(() => {
    return (route.meta.layout as LayoutKey) ?? 'default'
  })

  import ConfirmDialog from '~/components/app/ConfirmDialog.vue'

  const { state: confirmState, handleConfirm: onConfirm, handleCancel: onCancel } = useConfirm()
</script>