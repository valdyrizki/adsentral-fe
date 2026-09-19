<template>
  <UBadge
    v-if="status === 'MISMATCH'"
    color="warning"
    variant="soft"
    :size="size"
    icon="mdi:alert-outline"
  >
    Nama rekening berbeda dengan KTP
  </UBadge>
  <UBadge
    v-else-if="status === 'MATCHED'"
    color="success"
    variant="soft"
    :size="size"
    icon="mdi:check-decagram-outline"
  >
    Sesuai KTP
  </UBadge>
</template>

<script lang="ts" setup>
import type { NameCheckStatus } from '~/types/bank-account/NameCheckStatus'

withDefaults(
  defineProps<{
    status?: NameCheckStatus | null
    size?: 'xs' | 'sm' | 'md' | 'lg'
  }>(),
  { size: 'sm' },
)
</script>
