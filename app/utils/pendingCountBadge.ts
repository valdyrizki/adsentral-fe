// Badge merah untuk NavigationMenuItem: kosong jika count <= 0, "99+" jika > 99.
export const pendingCountBadge = (count: number, tooltip: string) => {
  if (!(count > 0)) return {}
  return {
    badge: {
      label: count > 99 ? '99+' : String(count),
      color: 'error' as const,
      title: tooltip,
      'aria-label': tooltip,
    },
  }
}
