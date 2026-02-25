export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // hapus simbol
    .replace(/\s+/g, '-')       // spasi → -
    .replace(/-+/g, '-')        // multi dash
}
