<template>
  <component :is="isEdit ? 'div' : UCard" :class="isEdit ? '' : 'mb-6 shadow-sm'">
    <template v-if="!isEdit" #header>
      <p class="font-semibold text-gray-800">Tambah Stok</p>
      <p class="text-xs text-gray-400 mt-0.5">Isi minimal salah satu: file, data akun, atau catatan. Semua bisa digabung dalam satu item.</p>
    </template>

    <div class="space-y-6">
      <div>
        <label class="block text-sm font-medium text-gray-900 mb-1">
          File
          <span class="text-gray-400 font-normal">(opsional)</span>
        </label>

        <!-- Edit: file saat ini + aksi ganti / hapus -->
        <div v-if="isEdit && item?.file_name && !form.file && !replacingFile" class="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-gray-100 bg-gray-50">
          <UIcon name="i-lucide-file" class="size-4 flex-none" :class="removeFile ? 'text-gray-300' : 'text-blue-500'" />
          <div class="flex-1 min-w-0">
            <p class="text-sm truncate" :class="removeFile ? 'line-through text-gray-400' : 'text-gray-800'">{{ item.file_name }}</p>
            <p class="text-xs text-gray-400 flex flex-wrap gap-x-3">
              <span>File saat ini</span>
              <span>{{ formatFileSize(item.file_size) }}</span>
              <span>{{ fileTypeLabel(item.file_type, item.file_name) }}</span>
            </p>
          </div>
          <template v-if="removeFile">
            <UBadge color="error" variant="soft" size="sm">Akan dihapus</UBadge>
            <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-undo-2" :disabled="saving" @click="removeFile = false">Batal hapus</UButton>
          </template>
          <template v-else>
            <UButton size="xs" color="primary" variant="soft" icon="i-lucide-replace" :disabled="saving" @click="replacingFile = true">Ganti file</UButton>
            <UButton size="xs" color="error" variant="soft" icon="mdi:delete-outline" :disabled="saving" @click="removeFile = true">Hapus file</UButton>
          </template>
        </div>
        <!-- File lama ditandai hapus: tetap bisa pilih file baru sebagai gantinya -->
        <UFileUpload
          v-if="isEdit && item?.file_name && removeFile && !form.file && !replacingFile"
          v-model="form.file"
          label="Pilih File Baru (opsional)"
          description="Kosongkan jika item tidak perlu file"
          class="w-full mt-2"
          :disabled="saving"
        />
        <template v-else>
          <UFileUpload
            v-model="form.file"
            :label="isEdit && item?.file_name ? 'Pilih File Pengganti' : 'Pilih File'"
            description="Semua tipe file didukung"
            class="w-full"
            :disabled="saving"
          />

          <!-- Detail file yang dipilih -->
          <div v-if="form.file" class="mt-2 p-3 rounded-xl border border-blue-100 bg-blue-50/60 text-xs">
            <p class="font-medium text-blue-800 mb-1.5 flex items-center gap-1">
              <UIcon name="i-lucide-file-check" class="size-3.5" />
              {{ isEdit && item?.file_name ? 'File pengganti' : 'File dipilih' }}
            </p>
            <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-gray-600">
              <dt class="text-gray-400">Nama</dt>
              <dd class="break-all text-gray-800">{{ form.file.name }}</dd>
              <dt class="text-gray-400">Ukuran</dt>
              <dd>{{ formatFileSize(form.file.size) }}</dd>
              <dt class="text-gray-400">Tipe</dt>
              <dd>{{ fileTypeLabel(form.file.type, form.file.name) }}</dd>
              <dt class="text-gray-400">Terakhir diubah</dt>
              <dd>{{ dayjs(form.file.lastModified).format('DD MMM YYYY, HH:mm') }}</dd>
              <template v-if="isEdit && item?.file_name">
                <dt class="text-gray-400">{{ removeFile ? 'File lama (dihapus)' : 'Menggantikan' }}</dt>
                <dd class="break-all">{{ item.file_name }} ({{ formatFileSize(item.file_size) }})</dd>
              </template>
            </dl>
          </div>

          <UButton
            v-if="isEdit && item?.file_name"
            size="xs"
            color="neutral"
            variant="link"
            class="px-0 mt-1"
            :disabled="saving"
            @click="cancelReplace"
          >
            {{ removeFile ? 'Batal pilih file baru' : `Batal ganti, pakai file lama (${item.file_name})` }}
          </UButton>
        </template>
      </div>

      <div class="space-y-3">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-user-round" class="size-4 text-blue-500" />
          <p class="text-sm font-semibold text-gray-800">Data Akun</p>
          <span class="text-xs text-gray-400">(opsional)</span>
        </div>
        <StockAccountFieldsForm v-model="account" :current-type="currentType" :disabled="saving" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-900 mb-1">
          Notes / Catatan
          <span class="text-gray-400 font-normal">(opsional)</span>
        </label>
        <UTextarea
          v-model="form.description"
          placeholder="Contoh: Rank Mythic, Serial key batch 001, dll."
          :rows="2"
          autoresize
          class="w-full"
          :disabled="saving"
        />
      </div>

      <p v-if="formError" class="text-sm text-red-500">{{ formError }}</p>

      <div class="flex justify-end gap-2">
        <UButton v-if="isEdit" color="neutral" variant="outline" :disabled="saving" @click="emit('cancel')">Batal</UButton>
        <UButton
          :icon="isEdit ? 'mdi:content-save-outline' : 'i-lucide-plus'"
          color="primary"
          :loading="saving"
          :disabled="!hasContent"
          @click="isEdit ? handleSave() : handleAdd()"
        >
          {{ isEdit ? 'Simpan Perubahan' : 'Tambah Stok' }}
        </UButton>
      </div>
    </div>
  </component>
</template>

<script lang="ts" setup>
import dayjs from 'dayjs'
import { UCard } from '#components'
import { useProductsApi } from '~/composables/api/product'
import {
  buildStockItemPatch,
  emptyStockAccountForm,
  fileTypeLabel,
  formatFileSize,
  hasAccountData,
  SENSITIVE_ACCOUNT_FIELDS,
  stockItemToAccountForm,
  uidFromFileName,
} from '~/helper/stockAccountHelper'
import type { ProductStockItemResponse } from '~/types/product/ProductStockItemResponse'
import type { StockAccountForm } from '~/types/product/ProductStockItemRequest'
import type { StockErrorData } from '~/types/product/StockBulkCheck'

// Tanpa `item` = mode tambah (butuh productId). Dengan `item` = mode edit (PATCH /stock/{id}).
// `prefill` (mode tambah): isi awal dari item lain, mis. tambah ulang item RETURNED; field rahasia dikosongkan.
const props = defineProps<{
  productId?: number
  item?: ProductStockItemResponse | null
  prefill?: ProductStockItemResponse | null
}>()

const emit = defineEmits<{
  added: []
  saved: [item: ProductStockItemResponse]
  // 409: item sudah tidak ACTIVE (terkirim / dihapus)
  stale: [message: string]
  cancel: []
}>()

const toast = useToast()
const { confirm, close: closeConfirm } = useConfirm()
const { addProductStockItem, updateProductStockItem } = useProductsApi()

const isEdit = computed(() => !!props.item)

const form = reactive<{ description: string; file: File | null }>({ description: '', file: null })
const account = ref<StockAccountForm>(emptyStockAccountForm())
const formError = ref('')
const saving = ref(false)

// ===== EDIT STATE =====
const removeFile = ref(false)
const replacingFile = ref(false)
let initial = { description: '', account: emptyStockAccountForm() }

const currentType = computed(() => {
  const source = props.item ?? props.prefill
  return source?.account_type_id
    ? { id: source.account_type_id, name: source.account_type_name ?? `#${source.account_type_id}` }
    : null
})

// Tipe default ("Lainnya") dipakai saat seller mengosongkan tipe pada mode edit
const { data: accountTypes } = useAccountTypes()

function loadItem(item: ProductStockItemResponse | null | undefined) {
  formError.value = ''
  form.file = null
  removeFile.value = false
  replacingFile.value = false
  if (!item) {
    const source = props.prefill
    form.description = source?.description ?? ''
    account.value = source ? stockItemToAccountForm(source) : emptyStockAccountForm()
    // Data rahasia lama sudah dilihat buyer → seller wajib mengisi yang baru
    for (const k of SENSITIVE_ACCOUNT_FIELDS) account.value[k] = ''
    return
  }
  form.description = item.description ?? ''
  account.value = stockItemToAccountForm(item)
  initial = { description: form.description, account: stockItemToAccountForm(item) }
}

watch([() => props.item, () => props.prefill], () => loadItem(props.item), { immediate: true })

// Mode tambah: file dipilih & UID masih kosong → isi UID dari nama file (tanpa ekstensi). Seller tetap bisa mengubahnya.
watch(() => form.file, (file) => {
  if (isEdit.value || !file || account.value.account_uid.trim()) return
  account.value.account_uid = uidFromFileName(file.name)
})

function cancelReplace() {
  form.file = null
  replacingFile.value = false
}

// Hasil akhir item tidak boleh kosong semua (file, data akun, notes)
const hasContent = computed(() => {
  const hasFile = !!form.file || (isEdit.value && !!props.item?.file_name && !removeFile.value)
  return hasFile || form.description.trim().length > 0 || hasAccountData(account.value)
})

const EMPTY_MESSAGE = 'Isi minimal salah satu: file, data akun, atau catatan'

const productSuffix = (data?: StockErrorData) =>
  data?.existing_product_name ? ` (produk: ${data.existing_product_name})` : ''

// Pesan error untuk ditampilkan; akun yang masih di stok aktif tidak punya opsi lanjut
function errorMessage(err: any): string {
  const data = err.data as StockErrorData | undefined
  if (data?.code === 'ACCOUNT_DUPLICATE_ACTIVE') return `Akun ini masih ada di stok aktif${productSuffix(data)}.`
  return err.statusMessage || err.message
}

/**
 * Kirim request; bila akun sudah pernah terjual (409 ACCOUNT_DUPLICATE_SENT), minta konfirmasi seller
 * lalu kirim ulang request yang sama dengan allowDuplicate=true.
 * Mengembalikan null bila seller memilih "Tidak" (form tetap terbuka).
 */
async function sendWithDuplicateConfirm<T>(
  send: (allowDuplicate: boolean) => Promise<T>,
  action: string,
): Promise<{ result: T } | null> {
  try {
    return { result: await send(false) }
  } catch (err: any) {
    const data = err.data as StockErrorData | undefined
    if (err.statusCode !== 409 || data?.code !== 'ACCOUNT_DUPLICATE_SENT') throw err
    const ok = await confirm({
      title: 'Akun pernah terjual',
      message: `Akun ini sudah pernah terjual${productSuffix(data)}. Tetap ${action}?`,
      confirmText: `Ya, tetap ${action}`,
      cancelText: 'Tidak',
      confirmColor: 'warning',
    })
    if (!ok) return null
    try {
      return { result: await send(true) }
    } finally {
      closeConfirm()
    }
  }
}

async function handleAdd() {
  formError.value = ''
  if (!hasContent.value) {
    formError.value = EMPTY_MESSAGE
    return
  }
  if (!props.productId) return
  saving.value = true
  try {
    // Trim & field kosong dibuang di API layer; tipe hanya dikirim kalau ada data akun
    const withAccount = hasAccountData(account.value)
    const productId = props.productId
    const sent = await sendWithDuplicateConfirm(allowDuplicate => addProductStockItem(productId, {
      file: form.file,
      description: form.description,
      ...(withAccount ? account.value : {}),
      account_type_id: withAccount ? account.value.account_type_id : null,
      allow_duplicate: allowDuplicate,
    }), 'tambahkan')
    if (!sent) return
    toast.add({ title: 'Stok Ditambahkan ✅', description: 'Berhasil ditambahkan ke stok produk.', color: 'success' })
    // Kosongkan form untuk input berikutnya, tapi tipe akun tetap (biasanya seller menambah tipe yang sama berulang)
    const keepTypeId = account.value.account_type_id
    loadItem(null)
    account.value.account_type_id = keepTypeId
    emit('added')
  } catch (err: any) {
    // Pesan 400/409 dari BE ditampilkan apa adanya
    formError.value = errorMessage(err)
    toast.add({ title: 'Gagal ❌', description: formError.value, color: 'error' })
  } finally {
    saving.value = false
  }
}

// 409 nama file duplikat (belum punya kode) bukan berarti item tidak aktif
const isDuplicateMessage = (msg: string) => /duplikat|sudah pernah|sudah ada/i.test(msg)

async function handleSave() {
  const item = props.item
  if (!item) return
  formError.value = ''
  if (!hasContent.value) {
    formError.value = EMPTY_MESSAGE
    return
  }

  // Hanya field yang berubah; field kosong yang ikut terkirim akan menghapus data di BE
  const patch = buildStockItemPatch(
    initial,
    { description: form.description, account: account.value, newFile: form.file, removeFile: removeFile.value },
    accountTypes.value?.find(t => t.is_default)?.id,
  )
  if (!patch) {
    toast.add({ title: 'Tidak ada perubahan', color: 'neutral' })
    emit('cancel')
    return
  }

  saving.value = true
  try {
    // Kirim ulang tetap hanya field yang berubah, ditambah allowDuplicate
    const sent = await sendWithDuplicateConfirm(
      allowDuplicate => updateProductStockItem(item.id, allowDuplicate ? { ...patch, allow_duplicate: true } : patch),
      'simpan',
    )
    if (!sent) return
    const updated = sent.result
    toast.add({ title: 'Stok Diperbarui ✅', description: 'Perubahan item stok berhasil disimpan.', color: 'success' })
    emit('saved', updated)
  } catch (err: any) {
    const message = errorMessage(err)
    const code = (err.data as StockErrorData | undefined)?.code
    // 409 tanpa kode duplikat akun = item sudah tidak ACTIVE (terkirim / dihapus)
    if (err.statusCode === 409 && !code?.startsWith('ACCOUNT_DUPLICATE') && !isDuplicateMessage(message)) {
      toast.add({ title: 'Item tidak bisa diedit', description: message, color: 'warning' })
      emit('stale', message)
      return
    }
    formError.value = message
    toast.add({ title: 'Gagal ❌', description: message, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>
