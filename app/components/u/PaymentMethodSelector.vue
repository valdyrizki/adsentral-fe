
<template>
  <div class="space-y-3">
    <div
      v-for="method in filteredMethods"
      :key="method.id"
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
            {{ method.id }}
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PaymentMethodResponse } from '~/types/payment-method/PaymentMethodResponse'

const props = defineProps<{
  methods: PaymentMethodResponse[]
  modelValue: string | null
  type?: 'deposit' | 'withdrawal' | 'payment' | null
}>()

const balanceStore = useBalanceStore()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const select = (id: string) => {
  emit('update:modelValue', id)
}


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
