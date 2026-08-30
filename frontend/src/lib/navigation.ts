export const navigationItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Datasets', href: '/datasets' },
  { label: 'Analysis', href: '/analysis' },
  { label: 'Models', href: '/models' },
  { label: 'Insights', href: '/insights' },
  { label: 'Decisions', href: '/decisions' },
  { label: 'Settings', href: '/settings' },
] as const;

export type NavigationItem = (typeof navigationItems)[number];
