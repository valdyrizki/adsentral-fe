<template>
  <div class="space-y-6">

    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-gray-900">Rekening Bank</h1>
        <p class="text-sm text-gray-500 mt-0.5">Rekening tujuan pencairan dana hasil penjualan.</p>
      </div>
    </div>

    <ClientOnly>
      <template #fallback><AppLoadingSkeleton /></template>

    <!-- Loading -->
    <AppLoadingSkeleton v-if="pending" />

    <template v-else>

      <!-- Info card jika sudah ada rekening -->
      <UCard v-if="bankAccount" class="shadow-sm">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                <UIcon name="mdi:bank" class="text-primary-500 text-lg" />
              </div>
              <p class="font-semibold text-gray-800">Rekening Tersimpan</p>
            </div>
            <UBadge color="success" variant="soft" icon="mdi:check-circle">Aktif</UBadge>
          </div>
        </template>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-gray-50 rounded-xl p-4">
            <p class="text-xs text-gray-400 mb-1">Nama Bank</p>
            <p class="font-semibold text-gray-800">{{ bankAccount.bank_name }}</p>
          </div>
          <div class="bg-gray-50 rounded-xl p-4">
            <p class="text-xs text-gray-400 mb-1">Nomor Rekening</p>
            <p class="font-semibold text-gray-800 tracking-widest">{{ bankAccount.account_number }}</p>
          </div>
          <div class="bg-gray-50 rounded-xl p-4">
            <p class="text-xs text-gray-400 mb-1">Atas Nama</p>
            <p class="font-semibold text-gray-800">{{ bankAccount.account_holder_name }}</p>
          </div>
        </div>

        <div class="flex items-center gap-3 mt-4 text-xs text-gray-400">
          <span class="flex items-center gap-1">
            <UIcon name="mdi:clock-outline" class="size-3.5" />
            Ditambahkan: {{ dayjs(bankAccount.created_at).format('DD MMM YYYY, HH:mm') }}
          </span>
          <span v-if="bankAccount.updated_at" class="flex items-center gap-1">
            <UIcon name="mdi:pencil-outline" class="size-3.5" />
            Diperbarui: {{ dayjs(bankAccount.updated_at).format('DD MMM YYYY, HH:mm') }}
          </span>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton icon="mdi:pencil" color="primary" variant="soft" @click="openForm">
              Ubah Rekening
            </UButton>
          </div>
        </template>
      </UCard>

      <!-- Empty state jika belum ada -->
      <UCard v-else class="shadow-sm">
        <div class="py-12 flex flex-col items-center gap-4 text-center">
          <div class="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
            <UIcon name="mdi:bank-off-outline" class="text-3xl text-gray-400" />
          </div>
          <div>
            <p class="font-semibold text-gray-700">Belum ada rekening bank</p>
            <p class="text-sm text-gray-400 mt-1">Tambahkan rekening bank untuk menerima pencairan dana.</p>
          </div>
          <UButton icon="mdi:plus" color="primary" @click="openForm">
            Tambah Rekening Bank
          </UButton>
        </div>
      </UCard>

    </template>

    </ClientOnly>

    <!-- Modal Form -->
    <UModal v-model:open="isFormOpen" :title="bankAccount ? 'Ubah Rekening Bank' : 'Tambah Rekening Bank'">
      <template #body>
        <div class="space-y-4 p-1">
          <UAlert
            v-if="formError"
            :description="formError"
            color="error"
            icon="material-symbols:error-outline"
          />

          <UFormField label="Nama Bank" required>
            <UInput
              v-model="form.bank_name"
              placeholder="Contoh: BCA, Mandiri, BNI"
              :maxlength="50"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Nomor Rekening" required>
            <UInput
              v-model="form.account_number"
              placeholder="Contoh: 1234567890"
              :maxlength="30"
              class="w-full"
              inputmode="numeric"
            />
          </UFormField>

          <UFormField label="Nama Pemilik Rekening" required>
            <UInput
              v-model="form.account_holder_name"
              placeholder="Sesuai nama di buku tabungan"
              :maxlength="100"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-2 pt-2">
            <UButton color="neutral" variant="outline" @click="isFormOpen = false">Batal</UButton>
            <UButton color="primary" icon="mdi:content-save" :loading="submitting" @click="handleSubmit">
              Simpan
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

  </div>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { useBankAccountApi } from '~/composables/api/bank-account'
import type { BankAccountRequest } from '~/types/bank-account/BankAccountRequest'
import type { BankAccountResponse } from '~/types/bank-account/BankAccountResponse'

definePageMeta({ layout: 'seller', label: 'Rekening Bank' })

const toast = useToast()
const { fetchBankAccount, saveBankAccount } = useBankAccountApi()

const isFormOpen = ref(false)
const submitting = ref(false)
const formError = ref<string | null>(null)

const form = ref<BankAccountRequest>({
  bank_name: '',
  account_number: '',
  account_holder_name: '',
})

const { data: bankAccount, pending, refresh } = await useAsyncData<BankAccountResponse | null>(
  'seller-bank-account',
  () => fetchBankAccount(),
  { server: false }
)

function openForm() {
  formError.value = null
  if (bankAccount.value) {
    form.value = {
      bank_name: bankAccount.value.bank_name,
      account_number: bankAccount.value.account_number,
      account_holder_name: bankAccount.value.account_holder_name,
    }
  } else {
    form.value = { bank_name: '', account_number: '', account_holder_name: '' }
  }
  isFormOpen.value = true
}

async function handleSubmit() {
  formError.value = null

  if (!form.value.bank_name.trim()) {
    formError.value = 'Nama bank tidak boleh kosong.'
    return
  }
  if (form.value.account_number.length < 6) {
    formError.value = 'Nomor rekening minimal 6 karakter.'
    return
  }
  if (!form.value.account_holder_name.trim()) {
    formError.value = 'Nama pemilik rekening tidak boleh kosong.'
    return
  }

  try {
    submitting.value = true
    await saveBankAccount(form.value)
    toast.add({
      title: 'Berhasil',
      description: 'Rekening bank berhasil disimpan.',
      color: 'success',
      icon: 'mdi:check-circle',
    })
    isFormOpen.value = false
    await refresh()
  } catch (err: any) {
    formError.value = err.statusMessage || 'Gagal menyimpan rekening bank.'
  } finally {
    submitting.value = false
  }
}
</script>
