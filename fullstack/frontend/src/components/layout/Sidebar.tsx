import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard, Users, Database, ChevronDown, ShieldCheck,
  Scan, BookOpen, MessageSquare, Brain, X, Activity, Settings, Mail, Bell,
  Quote,
} from 'lucide-react';
import { BRAND } from '../../constants/brand';
import { LogoMark } from '../ui/Logo';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
}

interface SubMenuItem {
  path: string;
  label: string;
  icon: any;
}

interface MenuItem {
  path?: string;
  label: string;
  icon: any;
  submenu?: SubMenuItem[];
}

const ADMIN_ROLES = ['admin', 'super_admin'];

const Sidebar = ({ isOpen = true, onClose, onToggle }: SidebarProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  const userRole = user?.role || 'user';
  const isAdmin = ADMIN_ROLES.includes(userRole);
  const prefix = isAdmin ? '/admin' : '/user';

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) onClose?.();
  };

  const toggleSubmenu = (label: string) => {
    // If sidebar is collapsed on desktop, expand it first
    if (!isOpen && window.innerWidth >= 1024) {
      onToggle?.();
      // Wait for animation then open submenu
      setTimeout(() => {
        setOpenSubmenu(label);
      }, 100);
    } else {
      setOpenSubmenu(openSubmenu === label ? null : label);
    }
  };

  const isActive = (path: string) => {
    if (path === `${prefix}/conversations` && location.pathname.startsWith(`${prefix}/conversations`)) {
      return true;
    }
    const pathWithoutHash = path.split('#')[0];
    return location.pathname === pathWithoutHash;
  };
  const isSubmenuActive = (items: SubMenuItem[]) => items.some(item => isActive(item.path));

  // All routes use prefix -- admin gets /admin/*, user gets /*
  const menuItems: MenuItem[] = [
    { path: `${prefix}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { path: `${prefix}/scans`, label: 'Scan Buah', icon: Scan },
    { path: `${prefix}/conversations`, label: 'Asisten AI', icon: MessageSquare },
    { path: isAdmin ? '/admin/testimonials' : '/user/profile#testimoni-saya', label: 'Testimoni', icon: Quote },
    // Admin-only sections
    ...(isAdmin ? [
      {
        label: 'Master Data',
        icon: Database,
        submenu: [
          { path: '/admin/roles', label: 'Roles', icon: ShieldCheck },
          { path: '/admin/users', label: 'Users', icon: Users },
        ],
      },
      {
        label: 'Konten',
        icon: BookOpen,
        submenu: [
          { path: '/admin/articles', label: 'Artikel', icon: BookOpen },
          { path: '/admin/knowledge', label: 'Knowledge Base', icon: Brain },
        ],
      },
      { path: '/admin/newsletter', label: 'Newsletter', icon: Mail },
      { path: '/admin/notifications', label: 'Notifikasi', icon: Bell },
      { path: '/admin/audit-logs', label: 'Audit Logs', icon: Activity },
    ] : []),
    { path: `${prefix}/settings`, label: 'Pengaturan', icon: Settings },
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 lg:hidden z-30 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      )}

      <aside
        className={`
          fixed lg:relative top-0 left-0 h-screen z-40
          border-r border-app-border bg-app-surface
          transition-all duration-300 ease-in-out
          ${isOpen ? 'w-64 translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full lg:translate-x-0 lg:w-[4.5rem] w-64'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-app-border">
            <Link to={`${prefix}/dashboard`} className="flex items-center gap-2.5 overflow-hidden">
              <LogoMark size={36} />
              {isOpen && (
                <span className="font-extrabold text-app-text-primary tracking-tight text-lg">
                  {BRAND.nameUpper}<span className="text-primary-500">.</span>
                </span>
              )}
            </Link>
            {isOpen && (
              <button type="button" onClick={onClose} className="ml-auto lg:hidden rounded-lg p-1.5 text-app-text-secondary hover:bg-app-bg hover:text-app-text-primary transition-all">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Nav */}
          <div className="flex-1 overflow-y-auto hide-scrollbar py-3">
            {isAdmin && isOpen && (
              <div className="px-5 mb-2">
                <span className="text-[9px] font-black text-app-text-secondary/40 uppercase tracking-[0.2em]">Admin Panel</span>
              </div>
            )}
            <nav className="px-2.5 space-y-0.5">
              {menuItems.map((item) => {
                if (item.submenu) {
                  const hasActiveChild = isSubmenuActive(item.submenu);
                  const isExpanded = openSubmenu === item.label || hasActiveChild;

                  return (
                    <div key={item.label} className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => toggleSubmenu(item.label)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-[13px] transition-all group ${
                          hasActiveChild ? 'bg-primary-500/10 text-primary-600' : 'text-app-text-secondary hover:bg-app-bg hover:text-app-text-primary'
                        } ${!isOpen ? 'justify-center px-2' : ''}`}
                      >
                        <item.icon className={`w-5 h-5 flex-shrink-0 ${hasActiveChild ? 'text-primary-600' : ''}`} />
                        {isOpen && (
                          <>
                            <span className="flex-1 text-left">{item.label}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </>
                        )}
                      </button>
                      {isOpen && isExpanded && (
                        <div className="ml-5 pl-3 border-l-2 border-primary-500/10 space-y-0.5">
                          {item.submenu.map((sub) => (
                            <Link key={sub.path} to={sub.path} onClick={handleLinkClick}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all ${
                                isActive(sub.path) ? 'bg-primary-500 text-white shadow-sm' : 'text-app-text-secondary hover:bg-app-bg hover:text-app-text-primary'
                              }`}
                            >
                              <sub.icon className="w-3.5 h-3.5" />
                              <span>{sub.label}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                const active = isActive(item.path!);
                return (
                  <Link key={item.path} to={item.path!} onClick={handleLinkClick}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-[13px] transition-all group ${
                      active ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20' : 'text-app-text-secondary hover:bg-app-bg hover:text-app-text-primary'
                    } ${!isOpen ? 'justify-center px-2' : ''}`}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : ''}`} />
                    {isOpen && <span className="flex-1">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>

        </div>
      </aside>
    </>
  );
};

export default Sidebar;
