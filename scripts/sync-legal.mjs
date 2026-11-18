// Salin draf legal dari repo BE (docs/legal) ke app/legal untuk halaman legal FE (EP08-05).
// Sumber kebenaran tetap di BE; jalankan ulang setiap draf berubah:
//   node scripts/sync-legal.mjs "C:/Users/USER/IdeaProjects/adsentral-be/docs/legal"
// Yang dibuang: baris "> **DRAF ..." (catatan internal) dan catatan editorial "*(...)*".
// Tautan antar-dokumen `xxx.md` → route `/xxx`. Isian [NAMA BADAN USAHA] dst. dibiarkan; diganti saat render (app/legal/config.ts).
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DOCS = ['syarat-ketentuan', 'kebijakan-privasi', 'kebijakan-refund-garansi', 'produk-terlarang']
const src = process.argv[2]
if (!src) {
  console.error('Pakai: node scripts/sync-legal.mjs <folder docs/legal repo BE>')
  process.exit(1)
}

for (const name of DOCS) {
  let md = readFileSync(join(src, `${name}.md`), 'utf8').replace(/\r\n/g, '\n')
  md = md
    .split('\n')
    .filter((line) => !line.startsWith('> **DRAF'))
    .filter((line) => !/^\*\(.*\)\*\s*$/.test(line.trim()))
    .join('\n')
    .replace(/ ?\*\([^)]*(\([^)]*\)[^)]*)*\)\*/g, '') // catatan inline *( ... )*
    .replace(/\]\(([a-z-]+)\.md(#[^)]*)?\)/g, (_, doc, hash) => `](/${doc}${hash ?? ''})`)
    .replace(/\n{3,}/g, '\n\n')
  if (/\]\([^)]*\.md/.test(md) || /\*\(/.test(md)) {
    console.error(`${name}: masih ada tautan .md atau catatan *(...)*; periksa draf`)
    process.exit(1)
  }
  writeFileSync(join('app', 'legal', `${name}.md`), md.trimStart())
  console.log(`app/legal/${name}.md`)
}
