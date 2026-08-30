import { Link, useLocation } from 'react-router-dom';

const routeLabels: Record<string, string> = {
  '/': 'Dashboard',
  '/datasets': 'Datasets',
  '/analysis': 'Analysis',
  '/models': 'ML Models',
  '/insights': 'AI Analyst',
  '/decisions': 'Decisions',
  '/settings': 'Settings',
};

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const crumbs = [{ label: 'Dashboard', href: '/' }];

  let currentPath = '';
  for (const segment of pathnames) {
    currentPath += `/${segment}`;
    const label = routeLabels[currentPath] || decodeURIComponent(segment);
    crumbs.push({ label, href: currentPath });
  }

  if (crumbs.length <= 1) return null;

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-2">
            {index > 0 && <span className="text-muted-foreground/50">/</span>}
            {isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link to={crumb.href} className="hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
};
