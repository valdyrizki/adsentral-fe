import type { AccountTypeResponse } from '~/types/account-type/AccountTypeResponse'
import type { ProductStockItemResponse } from '~/types/product/ProductStockItemResponse'
import type { ProductStockItemPatch, StockAccountBulkItem, StockAccountFields, StockAccountForm } from '~/types/product/ProductStockItemRequest'

export const MAX_BULK_ACCOUNTS = 1000

// Urutan kolom input paste (dipisah "|") dan kolom akun pada CSV.
export const ACCOUNT_COLUMNS = [
  'uid',
  'username',
  'password',
  'email',
  'password_email',
  '2fa_secret',
  'cookie',
  'notes',
] as const

export const CSV_HEADER = ['type', ...ACCOUNT_COLUMNS].join(',')

// Field akun yang dianggap sensitif: di-mask di preview, disembunyikan default di detail seller.
export const SENSITIVE_ACCOUNT_FIELDS = new Set<keyof StockAccountFields>([
  'account_password',
  'account_email_password',
  'account_two_fa_secret',
  'account_cookie',
])

export const ACCOUNT_FIELD_LABELS: Record<keyof StockAccountFields, string> = {
  account_uid: 'UID',
  account_username: 'Username',
  account_password: 'Password',
  account_email: 'Email',
  account_email_password: 'Password Email',
  account_two_fa_secret: '2FA Secret Key',
  account_cookie: 'Cookie',
}

export const ACCOUNT_FIELD_KEYS = Object.keys(ACCOUNT_FIELD_LABELS) as (keyof StockAccountFields)[]

const COLUMN_TO_FIELD: Record<Exclude<typeof ACCOUNT_COLUMNS[number], 'notes'>, keyof StockAccountFields> = {
  uid: 'account_uid',
  username: 'account_username',
  password: 'account_password',
  email: 'account_email',
  password_email: 'account_email_password',
  '2fa_secret': 'account_two_fa_secret',
  cookie: 'account_cookie',
}

export interface BulkAccountRow extends StockAccountFields {
  // Nomor baris di sumber input (textarea / CSV), untuk referensi seller
  sourceLine: number
  typeName?: string
  account_type_id?: number
  description?: string
  errors: string[]
}

export const emptyStockAccountForm = (): StockAccountForm => ({
  account_type_id: null,
  account_uid: '',
  account_username: '',
  account_password: '',
  account_email: '',
  account_email_password: '',
  account_two_fa_secret: '',
  account_cookie: '',
})

// Nilai form dari item stok yang ada (untuk mode edit)
export const stockItemToAccountForm = (item: ProductStockItemResponse): StockAccountForm => {
  const form = emptyStockAccountForm()
  form.account_type_id = item.account_type_id ?? null
  for (const k of ACCOUNT_FIELD_KEYS) form[k] = item[k] ?? ''
  return form
}

/**
 * Susun body PATCH: hanya field yang berubah (dibanding nilai awal, setelah trim).
 * - berubah jadi kosong → "" (BE mengosongkan field)
 * - tipe akun hanya dikirim bila diganti ke tipe lain; bila dikosongkan sementara data akun
 *   masih ada, kirim id tipe default ("Lainnya") karena BE tidak menerima tipe kosong.
 * Mengembalikan null bila tidak ada perubahan.
 */
export const buildStockItemPatch = (
  initial: { description: string; account: StockAccountForm },
  current: { description: string; account: StockAccountForm; newFile: File | null; removeFile: boolean },
  defaultTypeId?: number,
): ProductStockItemPatch | null => {
  const patch: ProductStockItemPatch = {}

  const description = current.description.trim()
  if (description !== initial.description.trim()) patch.description = description

  for (const k of ACCOUNT_FIELD_KEYS) {
    const value = (current.account[k] ?? '').trim()
    if (value !== (initial.account[k] ?? '').trim()) patch[k] = value
  }

  const typeId = current.account.account_type_id
  if (typeId !== initial.account.account_type_id) {
    if (typeId) patch.account_type_id = typeId
    else if (hasAccountData(current.account) && defaultTypeId && defaultTypeId !== initial.account.account_type_id) {
      patch.account_type_id = defaultTypeId
    }
  }

  if (current.newFile) patch.file = current.newFile
  else if (current.removeFile) patch.remove_file = true

  return Object.keys(patch).length ? patch : null
}

export const hasAccountData = (item: Partial<StockAccountFields> | null | undefined): boolean =>
  !!item && ACCOUNT_FIELD_KEYS.some(k => !!item[k]?.toString().trim())

// ===== Tampilan list stok =====

export type StockContentKind = 'FILE' | 'ACCOUNT' | 'FILE_ACCOUNT' | 'NOTES'

export const stockContentKind = (item: ProductStockItemResponse): StockContentKind => {
  const file = !!item.file_name
  const account = hasAccountData(item)
  if (file && account) return 'FILE_ACCOUNT'
  if (file) return 'FILE'
  if (account) return 'ACCOUNT'
  return 'NOTES'
}

export const STOCK_CONTENT_LABEL: Record<StockContentKind, string> = {
  FILE: 'File',
  ACCOUNT: 'Akun',
  FILE_ACCOUNT: 'File + Akun',
  NOTES: 'Catatan',
}

export const STOCK_CONTENT_ICON: Record<StockContentKind, string> = {
  FILE: 'i-lucide-file',
  ACCOUNT: 'i-lucide-user-round',
  FILE_ACCOUNT: 'i-lucide-files',
  NOTES: 'i-lucide-sticky-note',
}

// Kolom "Akun": UID, atau username kalau UID kosong
export const stockAccountLabel = (item: ProductStockItemResponse): string | null =>
  item.account_uid || item.account_username || null

// ===== Parsing input =====

const clean = (v: string | undefined): string | undefined => {
  const t = v?.trim()
  return t ? t : undefined
}

const buildRow = (sourceLine: number, cols: Partial<Record<typeof ACCOUNT_COLUMNS[number], string>>): BulkAccountRow => {
  const row: BulkAccountRow = { sourceLine, errors: [] }
  for (const [col, field] of Object.entries(COLUMN_TO_FIELD)) {
    const v = clean(cols[col as keyof typeof COLUMN_TO_FIELD])
    if (v) row[field] = v
  }
  const notes = clean(cols.notes)
  if (notes) row.description = notes
  return row
}

/**
 * Format paste: satu akun per baris, dipisah "|":
 *   uid|username|password|email|password_email|2fa_secret|cookie|notes
 * Lebih dari 8 bagian → sisanya digabung ke notes. Baris kosong dilewati.
 */
export const parsePipeInput = (text: string): BulkAccountRow[] => {
  const rows: BulkAccountRow[] = []
  text.split(/\r?\n/).forEach((line, idx) => {
    if (!line.trim()) return
    const parts = line.split('|')
    const cols: Record<string, string> = {}
    ACCOUNT_COLUMNS.forEach((col, i) => {
      cols[col] = col === 'notes' ? parts.slice(i).join('|') : (parts[i] ?? '')
    })
    // Sisa yang hanya berisi pemisah (mis. "|||||||||") bukan catatan
    if (!cols.notes!.replace(/\|/g, '').trim()) cols.notes = ''
    rows.push(buildRow(idx + 1, cols))
  })
  return rows
}

// Parser CSV RFC 4180 sederhana: mendukung quote, "" sebagai escape, koma & newline di dalam quote.
const parseCsvRecords = (text: string): { cells: string[]; line: number }[] => {
  const records: { cells: string[]; line: number }[] = []
  let cells: string[] = []
  let cell = ''
  let inQuotes = false
  let line = 1
  let recordLine = 1
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++ } else inQuotes = false
      } else {
        if (ch === '\n') line++
        cell += ch
      }
      continue
    }
    if (ch === '"') inQuotes = true
    else if (ch === ',') { cells.push(cell); cell = '' }
    else if (ch === '\r') continue
    else if (ch === '\n') {
      cells.push(cell)
      records.push({ cells, line: recordLine })
      cells = []; cell = ''
      line++
      recordLine = line
    } else cell += ch
  }
  if (cell !== '' || cells.length) {
    cells.push(cell)
    records.push({ cells, line: recordLine })
  }
  return records.filter(r => r.cells.some(c => c.trim() !== ''))
}

/**
 * CSV dengan header: type,uid,username,password,email,password_email,2fa_secret,cookie,notes
 * Kolom dicocokkan berdasarkan nama header (urutan bebas, "type" opsional).
 */
export const parseCsvInput = (text: string): { rows: BulkAccountRow[]; error?: string } => {
  const records = parseCsvRecords(text)
  if (!records.length) return { rows: [], error: 'File CSV kosong' }

  const header = records[0]!.cells.map(h => h.trim().toLowerCase())
  const known = ['type', ...ACCOUNT_COLUMNS] as string[]
  if (!header.some(h => (ACCOUNT_COLUMNS as readonly string[]).includes(h))) {
    return { rows: [], error: `Header CSV tidak dikenali. Gunakan header: ${CSV_HEADER}` }
  }
  const unknown = header.filter(h => h && !known.includes(h))
  if (unknown.length) {
    return { rows: [], error: `Kolom tidak dikenal: ${unknown.join(', ')}. Gunakan header: ${CSV_HEADER}` }
  }

  const rows = records.slice(1).map(({ cells, line }) => {
    const cols: Record<string, string> = {}
    header.forEach((h, i) => { if (h) cols[h] = cells[i] ?? '' })
    const row = buildRow(line, cols)
    const typeName = clean(cols.type)
    if (typeName) row.typeName = typeName
    return row
  })
  return { rows }
}

/**
 * Validasi di client sebelum cek ke BE (mutasi `errors` & `account_type_id` per baris):
 * hanya nama tipe (CSV) yang tidak ada di daftar tipe akun aktif, karena baris itu tidak boleh dikirim.
 * Baris kosong dan duplikat (terhadap stok maupun sesama input) dicek oleh BE lewat dryRun.
 */
export const validateBulkRows = (
  rows: BulkAccountRow[],
  accountTypes: AccountTypeResponse[],
): BulkAccountRow[] => {
  const byName = new Map(accountTypes.map(t => [t.name.trim().toLowerCase(), t]))
  for (const row of rows) {
    row.errors = []
    row.account_type_id = undefined
    if (!row.typeName) continue
    const type = byName.get(row.typeName.toLowerCase())
    if (type) row.account_type_id = type.id
    else row.errors.push(`Tipe akun "${row.typeName}" tidak dikenal`)
  }
  return rows
}

export const toBulkItem = (row: BulkAccountRow): StockAccountBulkItem => {
  const item: StockAccountBulkItem = {}
  for (const k of ACCOUNT_FIELD_KEYS) if (row[k]) item[k] = row[k]
  if (row.description) item.description = row.description
  if (row.account_type_id) item.account_type_id = row.account_type_id
  return item
}

// Ambil nomor baris (1-based, sesuai urutan item request) dari pesan error BE "Baris N: ..."
export const extractErrorLine = (message: string | undefined | null): number | null => {
  const m = message?.match(/Baris\s+(\d+)\s*:/i)
  return m ? Number(m[1]) : null
}

export const formatFileSize = (bytes: number | null | undefined): string => {
  if (bytes == null) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Tipe file untuk ditampilkan: MIME dari browser/BE, fallback ke ekstensi nama file
export const fileTypeLabel = (mime: string | null | undefined, name: string | null | undefined): string => {
  if (mime) return mime
  const ext = name?.includes('.') ? name.split('.').pop() : ''
  return ext ? ext.toUpperCase() : '-'
}

// Pratinjau UID dari nama file: tanpa ekstensi terakhir, di-trim (mis. "abc.def.zip" → "abc.def").
// Hanya untuk tampilan / isi otomatis; nilai final mode bulk ditentukan BE.
export const uidFromFileName = (name: string): string => {
  const dot = name.lastIndexOf('.')
  return (dot > 0 ? name.slice(0, dot) : name).trim()
}

// ===== Status item stok =====
type StockStatusColor = 'success' | 'info' | 'warning' | 'error' | 'neutral'

export const STOCK_STATUS_META: Record<string, { label: string; color: StockStatusColor; hint?: string }> = {
  ACTIVE: { label: 'Aktif', color: 'success' },
  SENT: { label: 'Terkirim', color: 'info' },
  RETURNED: {
    label: 'Dikembalikan',
    color: 'warning',
    hint: 'Transaksi dibatalkan/direfund setelah akun terkirim. Item tidak kembali ke stok. Tambahkan ulang secara manual jika akun sudah aman.',
  },
  DELETED: { label: 'Dihapus', color: 'error' },
}

export const STOCK_STATUS_FILTER_OPTIONS = [
  { label: 'Semua Status', value: 'ALL' },
  ...Object.entries(STOCK_STATUS_META).map(([value, meta]) => ({ label: meta.label, value })),
]
