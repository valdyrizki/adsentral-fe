<template>
  <div class="space-y-6">

    <!-- Header -->
    <div class="mx-auto w-full border rounded-2xl border-blue-200 bg-gray-100">
      <AppHeaderSection
        title="Profil Toko"
        description="Kelola informasi dan tampilan toko Anda"
        icon="material-symbols:store-outline"
      />
    </div>

    <ClientOnly>
      <template #fallback><AppLoadingSkeleton /></template>

    <div v-if="loadingMerchant">
      <AppLoadingSkeleton />
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Preview Card -->
      <div class="lg:col-span-1">
        <UCard class="shadow-sm sticky top-6">
          <template #header>
            <p class="font-semibold text-gray-800">Preview Toko</p>
          </template>

          <!-- Banner preview -->
          <div class="w-full h-28 rounded-xl overflow-hidden bg-gray-200 relative">
            <img
              v-if="bannerPreview || merchantStore.merchant?.banner_url"
              :src="bannerPreview ?? getImageUrl(merchantStore.merchant?.banner_url)"
              class="w-full h-full object-cover"
              alt="banner"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-gray-400 text-xs">
              Belum ada banner
            </div>
          </div>

          <!-- Logo & name -->
          <div class="flex items-center gap-3 mt-3">
            <div class="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow bg-gray-100 flex-shrink-0">
              <img
                v-if="logoPreview || merchantStore.merchant?.logo_url"
                :src="logoPreview ?? getImageUrl(merchantStore.merchant?.logo_url)"
                class="w-full h-full object-cover"
                alt="logo"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <UIcon name="material-symbols:store" class="text-gray-400 text-2xl" />
              </div>
            </div>
            <div>
              <p class="font-bold text-gray-800">{{ form.name || merchantStore.merchant?.name || 'Nama Toko' }}</p>
              <p class="text-xs text-gray-400">{{ form.country || merchantStore.merchant?.country || 'Negara' }}</p>
            </div>
          </div>

          <USeparator class="my-3" />

          <div class="space-y-1.5 text-sm">
            <div class="flex items-center gap-2 text-gray-600">
              <UIcon name="lucide:clock" class="size-4 shrink-0" />
              <span>
                {{ operationalHoursPreview }}
              </span>
            </div>
            <div class="flex items-center gap-2 text-gray-600">
              <UIcon name="material-symbols:holiday-village-outline" class="size-4 shrink-0" />
              <UBadge :color="form.is_holiday ? 'warning' : 'success'" variant="subtle" size="xs">
                {{ form.is_holiday ? 'Sedang Libur' : 'Buka' }}
              </UBadge>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Form -->
      <div class="lg:col-span-2 space-y-4">

        <!-- Foto -->
        <UCard class="shadow-sm">
          <template #header>
            <p class="font-semibold text-gray-800">Foto & Banner</p>
          </template>
          <div class="flex flex-col sm:flex-row gap-6">
            <div class="flex-1">
              <p class="text-sm text-gray-600 mb-2">Logo Toko</p>
              <UFileUpload
                v-model="form.logo"
                label="Upload Logo"
                description="JPG, PNG, GIF (maks. 2MB)"
                class="w-full min-h-36"
                @update:model-value="onLogoChange"
              />
            </div>
            <div class="flex-1">
              <p class="text-sm text-gray-600 mb-2">Banner Toko</p>
              <UFileUpload
                v-model="form.banner"
                label="Upload Banner"
                description="JPG, PNG, GIF (maks. 2MB)"
                class="w-full min-h-36"
                @update:model-value="onBannerChange"
              />
            </div>
          </div>
        </UCard>

        <!-- Informasi Dasar -->
        <UCard class="shadow-sm">
          <template #header>
            <p class="font-semibold text-gray-800">Informasi Dasar</p>
          </template>
          <div class="space-y-4">
            <UFormField label="Nama Toko" required>
              <UInput v-model="form.name" placeholder="Masukkan nama toko" class="w-full" />
            </UFormField>

            <UFormField label="Deskripsi Toko">
              <UTextarea v-model="form.description" placeholder="Deskripsikan toko Anda..." :rows="4" class="w-full" />
            </UFormField>

            <UFormField label="Negara">
              <UInput v-model="form.country" placeholder="Contoh: Indonesia" class="w-full" />
            </UFormField>
          </div>
        </UCard>

        <!-- Jam Operasional -->
        <UCard class="shadow-sm">
          <template #header>
            <div class="flex items-center justify-between">
              <p class="font-semibold text-gray-800">Jam Operasional</p>
              <UBadge v-if="!form.open_time && !form.close_time" color="success" variant="subtle" size="sm">24 Jam</UBadge>
            </div>
          </template>
          <div class="space-y-4">
            <p class="text-sm text-gray-500">Kosongkan keduanya jika toko buka 24 jam.</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Jam Buka">
                <UInput
                  v-model="form.open_time"
                  type="time"
                  class="w-full"
                />
              </UFormField>
              <UFormField label="Jam Tutup">
                <UInput
                  v-model="form.close_time"
                  type="time"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
        </UCard>

        <!-- Status Toko -->
        <UCard class="shadow-sm">
          <template #header>
            <p class="font-semibold text-gray-800">Status Toko</p>
          </template>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-700">Mode Libur</p>
              <p class="text-xs text-gray-400 mt-0.5">Saat aktif, toko tidak menerima pesanan baru</p>
            </div>
            <USwitch v-model="form.is_holiday" color="warning" />
          </div>
        </UCard>

        <!-- Error list -->
        <UAlert
          v-if="errors.length"
          title="Gagal menyimpan"
          :description="errors.join(', ')"
          color="error"
          icon="material-symbols:error-outline"
        />

        <!-- Actions -->
        <div class="flex justify-end gap-3">
          <UButton variant="outline" color="neutral" @click="resetForm">Reset</UButton>
          <UButton color="primary" :loading="loading" icon="i-lucide-save" @click="onSubmit">
            Simpan Perubahan
          </UButton>
        </div>

      </div>
    </div>

    </ClientOnly>

  </div>
</template>

<script lang="ts" setup>
import { useMerchantApi } from '~/composables/api/merchant'
import type { MerchantRequest } from '~/types/MerchantRequest'

definePageMeta({ layout: 'seller', label: 'Profil Toko' })

const config = useRuntimeConfig()
const toast = useToast()
const merchantStore = useMerchantStore()
const { updateMerchant } = useMerchantApi()

const loading = ref(false)
const errors = ref<string[]>([])
const logoPreview = ref<string | null>(null)
const bannerPreview = ref<string | null>(null)

const buildForm = (): MerchantRequest => ({
  name: merchantStore.merchant?.name ?? '',
  description: merchantStore.merchant?.description ?? '',
  logo: undefined,
  banner: undefined,
  is_holiday: merchantStore.merchant?.is_holiday ?? false,
  country: merchantStore.merchant?.country ?? '',
  open_time: merchantStore.merchant?.open_time ?? '',
  close_time: merchantStore.merchant?.close_time ?? '',
})

const form = reactive<MerchantRequest>(buildForm())

const { pending: loadingMerchant } = useAsyncData(
  'seller-profile-merchant',
  async () => {
    await merchantStore.refreshMerchant()
    Object.assign(form, buildForm())
  },
  { server: false }
)

const operationalHoursPreview = computed(() => {
  if (form.open_time && form.close_time) return `${form.open_time} - ${form.close_time}`
  return '24 Jam'
})



const onLogoChange = (file: File | null | undefined) => {
  logoPreview.value = file ? URL.createObjectURL(file) : null
}

const onBannerChange = (file: File | null | undefined) => {
  bannerPreview.value = file ? URL.createObjectURL(file) : null
}

const resetForm = () => {
  Object.assign(form, buildForm())
  logoPreview.value = null
  bannerPreview.value = null
  errors.value = []
}

const validate = (): boolean => {
  errors.value = []

  if (!form.name || form.name.length < 3) {
    errors.value.push('Nama toko minimal 3 karakter')
  }

  const fileRules = (file: File | undefined, label: string) => {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) errors.value.push(`${label} maksimal 2MB`)
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type))
      errors.value.push(`${label} harus JPG, PNG, WEBP, atau GIF`)
  }

  fileRules(form.logo as File | undefined, 'Logo')
  fileRules(form.banner as File | undefined, 'Banner')

  if ((form.open_time && !form.close_time) || (!form.open_time && form.close_time)) {
    errors.value.push('Jam buka dan jam tutup harus diisi keduanya, atau dikosongkan keduanya')
  }

  return errors.value.length === 0
}

const onSubmit = async () => {
  if (!validate()) return

  loading.value = true
  try {
    await updateMerchant(form)
    await merchantStore.refreshMerchant()

    toast.add({
      title: 'Profil toko berhasil diperbarui',
      color: 'success',
      icon: 'i-lucide-check-circle',
    })

    logoPreview.value = null
    bannerPreview.value = null
    form.logo = undefined
    form.banner = undefined
  } catch (err: any) {
    toast.add({
      title: 'Gagal menyimpan',
      description: err.statusMessage || 'Terjadi kesalahan',
      color: 'error',
      icon: 'material-symbols:error-outline',
    })
  } finally {
    loading.value = false
  }
}
</script>
