
<template>
  <div class="space-y-3">
    <div v-for="method in filteredMethods" :key="method.id">
      <div
        @click="select(method.id)"
        class="border rounded-lg p-4 cursor-pointer transition-all duration-200"
        :class="modelValue === method.id
          ? 'border-primary bg-primary/5 ring-2 ring-primary'
          : 'border-gray-200 hover:border-gray-400'"
      >
        <div class="flex items-start gap-3">

          <!-- Radio -->
          <input
            type="radio"
            :value="method.id"
            :checked="modelValue === method.id"
            class="mt-1 accent-primary"
            @change="select(method.id)"
          />

          <!-- Content -->
          <div>
            <div class="font-semibold text-gray-900">
              {{ method.name ?? method.id }}
            </div>
            <div class="text-sm text-gray-500">
              {{ method.description }}
            </div>
            <div class="text-sm text-red-500" v-if="method.id === 'SALDO'">
              <div v-if="balanceStore.loading">
                <USkeleton class="w-50 h-5 bg-gray-300" />
              </div>
              <div v-else>
                Saldo: Rp{{ balanceStore.balance.toLocaleString() }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Channel Selection (grouped by channel.group) -->
      <div
        v-if="modelValue === method.id && activeChannels(method).length"
        class="ml-8 mt-2 space-y-3"
      >
        <div v-for="group in groupedChannels(method)" :key="group.name">
          <p class="text-xs font-medium text-gray-400 mb-1.5">{{ group.name }}</p>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div
              v-for="channel in group.channels"
              :key="channel.code"
              @click="selectChannel(channel.code)"
              class="border rounded-lg p-2 cursor-pointer text-xs flex items-center gap-2 transition-all duration-200"
              :class="channelValue === channel.code
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-gray-200 hover:border-gray-400'"
            >
              <img v-if="channel.icon_url" :src="channel.icon_url" class="w-5 h-5 object-contain shrink-0" />
              <div class="min-w-0">
                <p class="truncate">{{ channel.name }}</p>
                <p class="text-[10px] text-gray-400 truncate">Fee: {{ formatFee(channel) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import type { PaymentMethodResponse } from '~/types/payment-method/PaymentMethodResponse'
import type { PaymentChannelResponse } from '~/types/payment-channel/PaymentChannelResponse'

const props = defineProps<{
  methods: PaymentMethodResponse[]
  modelValue: string | null
  channelValue?: string | null
  type?: 'deposit' | 'withdrawal' | 'payment' | null
}>()

const balanceStore = useBalanceStore()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'update:channelValue', value: string | null): void
}>()

function activeChannels(method?: PaymentMethodResponse): PaymentChannelResponse[] {
  return (method?.channels ?? []).filter(c => c.status === 'ACTIVE')
}

function formatFee(channel: PaymentChannelResponse): string {
  const parts: string[] = []
  if (channel.fee_flat) parts.push(`Rp${channel.fee_flat.toLocaleString('id-ID')}`)
  if (channel.fee_percent) parts.push(`${channel.fee_percent}%`)
  return parts.length ? parts.join(' + ') : 'Gratis'
}

function groupedChannels(method?: PaymentMethodResponse): { name: string; channels: PaymentChannelResponse[] }[] {
  const groups = new Map<string, PaymentChannelResponse[]>()
  for (const channel of activeChannels(method)) {
    const groupName = channel.group || 'Lainnya'
    if (!groups.has(groupName)) groups.set(groupName, [])
    groups.get(groupName)!.push(channel)
  }
  return Array.from(groups.entries()).map(([name, channels]) => ({ name, channels }))
}

const select = (id: string) => {
  emit('update:modelValue', id)
  const method = props.methods.find(m => m.id === id)
  const channels = activeChannels(method)
  emit('update:channelValue', channels.length ? channels[0]!.code : null)
}

const selectChannel = (code: string) => {
  emit('update:channelValue', code)
}

// Auto-pilih channel pertama begitu daftar method dimuat (methods datang async setelah modelValue di-set default)
watch(() => props.methods, (methods) => {
  const current = methods.find(m => m.id === props.modelValue)
  const channels = activeChannels(current)
  if (channels.length && !props.channelValue) {
    emit('update:channelValue', channels[0]!.code)
  }
}, { immediate: true })

/**
 * Filter:
 * - Jika type === 'deposit' → hilangkan SALDO
 * - Selain itu → tampilkan semua
 */
const filteredMethods = computed(() => {
  if (props.type === 'deposit') {
    return props.methods.filter(method => method.id !== 'SALDO')
  }
  return props.methods
})
</script>
