// Label badge ringkas: null (sembunyikan) untuk null/0, "99+" jika > 99.
export const formatBadgeCount = (count: number | null | undefined): string | null => {
  if (typeof count !== 'number' || !(count > 0)) return null
  return count > 99 ? '99+' : String(count)
}

// Jumlahkan angka yang diketahui saja; semuanya null → null (badge disembunyikan).
export const sumKnownCounts = (...counts: (number | null | undefined)[]): number | null => {
  const known = counts.filter((c): c is number => typeof c === 'number')
  return known.length ? known.reduce((a, b) => a + b, 0) : null
}

// Badge netral untuk NavigationMenuItem (notifikasi, chat).
export const countBadge = (count: number | null | undefined) => {
  const label = formatBadgeCount(count)
  return label ? { badge: label } : {}
}

// Sidebar collapsed menyembunyikan badge (linkTrailing) → tampilkan dot (chip) di pojok ikon.
export const withCollapsedChips = <T extends { badge?: unknown; chip?: unknown }>(items: T[], collapsed: boolean): T[] => {
  if (!collapsed) return items
  return items.map((item) => {
    if (!item.badge) return item
    const color = typeof item.badge === 'object' && (item.badge as { color?: string }).color === 'error' ? 'error' : 'primary'
    return { ...item, chip: { color } }
  })
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
