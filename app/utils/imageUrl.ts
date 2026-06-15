export const getImageUrl = (url?: string | null): string => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const config = useRuntimeConfig()
  return `${config.public.backendUrl}/${url.replace(/^\//, '')}`
}
