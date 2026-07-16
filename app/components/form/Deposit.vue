<!-- components/form/FormDeposit.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <UFormField label="Jumlah Deposit" :error="errors.amount" action="#">
        <UInputCurrency
          v-model="amount"
          placeholder="Minimal Rp 10.000"
          label="Jumlah Deposit"
          id="amount"
          name="amount"
          class="block w-full text-base text-gray-900"
          :disabled="loading"
          inputmode="numeric"
        />       
    </UFormField>

    <UFormField label="Metode Pembayaran" :error="errors.payment_method">
      <PaymentMethodSelector
        v-model="selectedPayment"
        v-model:channel-value="selectedChannel"
        :methods="paymentMethod"
        type="deposit"
        :disabled="loading"
      />
    </UFormField>

    <!-- Rincian Biaya -->
    <div v-if="amount > 0" class="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-2.5 text-sm">
      <div class="flex items-center justify-between">
        <span class="text-gray-600">Jumlah Deposit</span>
        <span class="font-medium text-gray-900">Rp{{ amount.toLocaleString('id-ID') }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="flex items-center gap-1 text-gray-600">
          Biaya Pembayaran
          <UTooltip :text="feeTooltip">
            <UIcon name="mdi:help-circle" class="size-4 text-gray-400 hover:text-gray-500 cursor-help" />
          </UTooltip>
        </span>
        <span class="font-medium text-gray-900">
          {{ feeAmount > 0 ? `Rp${feeAmount.toLocaleString('id-ID')}` : 'Gratis' }}
        </span>
      </div>
      <div class="flex items-center justify-between border-t border-gray-200 pt-2.5 font-semibold">
        <span class="text-gray-900">Total Dibayar</span>
        <span class="text-primary text-base">Rp{{ totalAmount.toLocaleString('id-ID') }}</span>
      </div>
    </div>

    <div class="flex justify-end gap-2 pt-2">
      <UButton
        variant="ghost"
        color="neutral"
        :disabled="loading"
        @click="emit('cancel')"
      >
        Batal
      </UButton>
      <UButton
        type="submit"
        color="primary"
        :loading="loading"
      >
        Deposit
      </UButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { usePaymentMethodApi } from '~/composables/api/payment-method';
import type { DepositRequest } from '~/types/balance/DepositRequest'
import type { PaymentChannelResponse } from '~/types/payment-channel/PaymentChannelResponse'
import PaymentMethodSelector from '../u/PaymentMethodSelector.vue';

interface Props {
  loading?: boolean
  paymentMethods?: Array<{ label: string; value: string }>
}

withDefaults(defineProps<Props>(), {
  loading: false,
  paymentMethods: () => [],
})

const emit = defineEmits<{
  submit: [payload: DepositRequest]
  cancel: []
}>()

//API
const { fetchPaymentMethod, paymentMethod } = usePaymentMethodApi()

// Form state
const amount = ref<number>(200000)
const selectedPayment = ref<string>('QRIS')
const selectedChannel = ref<string | null>(null)

// Validation errors (local, untuk field error display)
const errors = ref<Record<string, string>>({})

const selectedChannelData = computed<PaymentChannelResponse | null>(() => {
  const method = paymentMethod.value?.find(m => m.id === selectedPayment.value)
  return method?.channels?.find(c => c.code === selectedChannel.value) ?? null
})

const feeAmount = computed(() => {
  const channel = selectedChannelData.value
  if (!channel) return 0
  const percentFee = ((channel.fee_percent ?? 0) / 100) * amount.value
  return Math.round((channel.fee_flat ?? 0) + percentFee)
})

const totalAmount = computed(() => amount.value + feeAmount.value)

const feeTooltip = computed(() => {
  const channel = selectedChannelData.value
  if (!channel) return 'Biaya yang dikenakan oleh payment gateway untuk metode yang dipilih.'
  const parts: string[] = []
  if (channel.fee_flat) parts.push(`Rp${channel.fee_flat.toLocaleString('id-ID')}`)
  if (channel.fee_percent) parts.push(`${channel.fee_percent}% dari jumlah deposit`)
  const breakdown = parts.length ? parts.join(' + ') : 'Gratis'
  return `Biaya admin dari ${channel.name}: ${breakdown}.`
})

function validate(): boolean {
  errors.value = {}
  
  if (!amount || amount.value < 10000) {
    errors.value.amount = 'Minimal Rp 10.000'
  }
  
  if (!selectedPayment.value) {
    errors.value.payment_method = 'Pilih metode pembayaran'
  }
  
  return Object.keys(errors.value).length === 0
}

function handleSubmit() {
  if (!validate()) return

  const form: DepositRequest = {
    amount: amount.value,
    payment_method: selectedPayment.value,
    payment_channel_code: selectedChannel.value,
  }

  emit('submit', form)
}

onMounted(async () => {
  await fetchPaymentMethod()
})
</script>