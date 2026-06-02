import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const ADMIN_ROLES = ['admin', 'super_admin'];

const LABEL_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  scans: 'Scan Buah',
  conversations: 'Asisten AI',
  ensiklopedia: 'Ensiklopedia',
  settings: 'Pengaturan',
  profile: 'Profil',
  users: 'Users',
  roles: 'Roles',
  articles: 'Artikel',
  knowledge: 'Knowledge Base',
  newsletter: 'Newsletter',
  'audit-logs': 'Audit Logs',
};

const Breadcrumb = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role || '');
  const homePath = isAdmin ? '/admin/dashboard' : '/user/dashboard';

  const segments = location.pathname.split('/').filter(Boolean);
  // Skip 'admin' and 'user' from display segments but keep them in path building
  // Also filter out numeric IDs and UUIDs (patterns with hyphens or all hex characters)
  const displaySegments = segments.filter(s => {
    if (s === 'admin' || s === 'user') return false;
    if (/^\d+$/.test(s)) return false; // numeric IDs
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) return false; // UUIDs
    return true;
  });

  if (displaySegments.length === 0 || (displaySegments.length === 1 && displaySegments[0] === 'dashboard')) {
    return null;
  }

  return (
    <nav className="flex mb-4" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1">
        <li>
          <Link
            to={homePath}
            className="inline-flex items-center text-[10px] font-black uppercase tracking-[0.15em] text-app-text-secondary hover:text-primary-500 transition-colors"
          >
            <Home className="w-3 h-3 mr-1.5 opacity-60" />
            Dashboard
          </Link>
        </li>
        {displaySegments.map((segment, index) => {
          if (segment === 'dashboard') return null;

          const isLast = index === displaySegments.length - 1;
          // Build the actual path including /admin or /user if needed
          const prefix = isAdmin ? 'admin' : 'user';
          const pathParts = [prefix, ...displaySegments.slice(0, index + 1)];
          const to = `/${pathParts.join('/')}`;
          const label = LABEL_MAP[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

          return (
            <li key={to}>
              <div className="flex items-center">
                <ChevronRight className="w-3 h-3 text-app-text-secondary mx-1 opacity-40" />
                {isLast ? (
                  <span className="ml-1 text-[10px] font-black uppercase tracking-[0.15em] text-primary-500 md:ml-2">
                    {label}
                  </span>
                ) : (
                  <Link
                    to={to}
                    className="ml-1 text-[10px] font-black uppercase tracking-[0.15em] text-app-text-secondary hover:text-primary-500 transition-colors md:ml-2"
                  >
                    {label}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
