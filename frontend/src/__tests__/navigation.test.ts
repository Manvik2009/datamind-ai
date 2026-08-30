import { describe, it, expect } from 'vitest';
import { navigationItems } from '@/lib/navigation';

describe('Navigation', () => {
  it('should have 6 navigation items', () => {
    expect(navigationItems).toHaveLength(6);
  });

  it('should include dashboard as first item', () => {
    expect(navigationItems[0].label).toBe('Dashboard');
    expect(navigationItems[0].href).toBe('/');
  });

  it('should have unique hrefs', () => {
    const hrefs = navigationItems.map((item) => item.href);
    const uniqueHrefs = new Set(hrefs);
    expect(uniqueHrefs.size).toBe(hrefs.length);
  });
});
