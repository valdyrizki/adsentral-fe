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
        :methods="paymentMethod"
        type="deposit"
        :disabled="loading"
      />
    </UFormField>

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

// Validation errors (local, untuk field error display)
const errors = ref<Record<string, string>>({})

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
  }

  emit('submit', form)
}

onMounted(async () => {
  await fetchPaymentMethod()
})
</script>