// Isian dokumen legal (EP08-05). Draf di app/legal/*.md menulisnya sebagai [NAMA BADAN USAHA] dst.;
// nilai kosong = tetap tampil apa adanya. Setelah ditinjau konsultan (EP08-02): isi semua nilai, set draft = false.
export const legalConfig = {
  draft: true,
  values: {
    'NAMA BADAN USAHA': '',
    ALAMAT: '',
    'EMAIL CS': '',
    'KONTAK CS': '',
    'EMAIL PRIVASI': '',
    'TANGGAL BERLAKU': '',
    'DOMISILI HUKUM': '',
    'PENYEDIA SERVER': '',
    'PENYEDIA EMAIL': '',
  } as Record<string, string>,
}

// SLA antrean CS (PRD §3, EP01-19): dipakai di setiap layar yang menunggu CS
export const CS_SLA_TEXT = 'Diproses maks. 1×24 jam kerja (setiap hari 11.00–21.00 WIB)'

/** Ganti isian [KEY] yang sudah diisi; tautan markdown [teks](url) tidak disentuh. */
export const fillLegalPlaceholders = (md: string, values: Record<string, string> = legalConfig.values) =>
  md.replace(/\[([A-Z][A-Z ]+)\](?!\()/g, (whole, key: string) => values[key] || whole)
