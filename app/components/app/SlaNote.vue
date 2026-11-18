<template>
  <!-- SLA antrean CS (PRD §3, EP01-19 / EP08-05) -->
  <div class="flex items-start gap-1.5 text-xs text-gray-500" data-testid="sla-note">
    <UIcon name="mdi:clock-outline" class="size-3.5 mt-0.5 shrink-0" />
    <span>{{ prefix ? `${prefix} ` : '' }}{{ CS_SLA_TEXT }}.</span>
  </div>
</template>

<script lang="ts" setup>
import { CS_SLA_TEXT } from '~/legal/config'

defineProps<{ prefix?: string }>()
</script>
