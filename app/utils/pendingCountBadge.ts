// Label badge ringkas: null (sembunyikan) untuk null/0, "99+" jika > 99.
export const formatBadgeCount = (count: number | null | undefined): string | null => {
  if (typeof count !== 'number' || !(count > 0)) return null
  return count > 99 ? '99+' : String(count)
}

// Badge netral untuk NavigationMenuItem (notifikasi, chat).
export const countBadge = (count: number | null | undefined) => {
  const label = formatBadgeCount(count)
  return label ? { badge: label } : {}
}

// Badge merah + tooltip untuk NavigationMenuItem (item yang perlu ditindaklanjuti).
export const pendingCountBadge = (count: number | null | undefined, tooltip: string) => {
  const label = formatBadgeCount(count)
  if (!label) return {}
  return {
    badge: {
      label,
      color: 'error' as const,
      title: tooltip,
      'aria-label': tooltip,
    },
  }
}
