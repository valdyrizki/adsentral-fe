<template>
  <component
    :is="to ? NuxtLink : 'div'"
    :to="to"
    class="flex items-center gap-3 rounded-xl border border-gray-100 p-3"
    :class="to ? 'hover:border-primary hover:shadow-sm transition-all group' : ''"
  >
    <div :class="`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bgColor}`">
      <UIcon :name="icon" :class="`text-xl ${color}`" />
    </div>
    <div class="min-w-0">
      <p class="text-xs text-gray-500 truncate" :class="to ? 'group-hover:text-primary' : ''">{{ label }}</p>
      <p class="text-lg font-bold text-gray-800 tabular-nums break-all">{{ value }}</p>
    </div>
  </component>
</template>

<script lang="ts" setup>
const NuxtLink = resolveComponent('NuxtLink')

defineProps<{
  label: string
  value: string | number
  icon: string
  color: string
  bgColor: string
  to?: string
}>()
</script>
