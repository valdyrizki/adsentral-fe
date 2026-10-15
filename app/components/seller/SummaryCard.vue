<template>
  <UCard class="shadow-sm">
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <UIcon :name="icon" class="text-primary text-lg" />
          <p class="font-semibold text-gray-800">{{ title }}</p>
        </div>
        <slot name="actions" />
      </div>
    </template>

    <div v-if="pending" class="grid gap-3" :class="gridClass">
      <USkeleton v-for="i in skeletonCount" :key="i" class="h-20 rounded-xl" />
    </div>

    <!-- Gagal: kartu ini saja; 403 (toko tidak aktif / belum ada) tanpa tombol coba lagi -->
    <UAlert
      v-else-if="error"
      :title="`Gagal memuat ${title.toLowerCase()}`"
      :description="apiErrorMessage(error)"
      icon="mdi:alert-circle"
      color="error"
      variant="subtle"
      :actions="apiErrorStatus(error) === 403 ? [] : [{ label: 'Coba lagi', icon: 'mdi:refresh', color: 'error', variant: 'outline', onClick: () => emit('retry') }]"
    />

    <div v-else class="grid gap-3" :class="gridClass">
      <slot />
    </div>
  </UCard>
</template>

<script lang="ts" setup>
// Kartu ringkasan seller dengan state loading / error masing-masing
withDefaults(defineProps<{
  title: string
  icon: string
  pending: boolean
  error: any
  gridClass?: string
  skeletonCount?: number
}>(), { gridClass: 'grid-cols-2 sm:grid-cols-3', skeletonCount: 3 })

const emit = defineEmits<{ retry: [] }>()
</script>
