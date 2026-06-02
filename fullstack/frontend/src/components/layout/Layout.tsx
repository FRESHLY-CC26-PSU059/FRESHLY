import { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Breadcrumb from './Breadcrumb';
import { useFCMToken } from '../../hooks/useFCMToken';

const MOBILE_BREAKPOINT = 1024;
const SIDEBAR_KEY = 'freshly_sidebar_open';

const getStoredSidebar = (): boolean | null => {
  const val = localStorage.getItem(SIDEBAR_KEY);
  if (val === 'true') return true;
  if (val === 'false') return false;
  return null;
};

const AdminLayout = () => {
  // Initialize FCM token sync for authenticated users
  useFCMToken();

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const stored = getStoredSidebar();
    if (stored !== null) return stored;
    return window.innerWidth >= MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < MOBILE_BREAKPOINT) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_KEY, String(next));
      return next;
    });
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    localStorage.setItem(SIDEBAR_KEY, 'false');
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-app-bg text-app-text-primary">
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} onToggle={toggleSidebar} />

      <div className="relative flex flex-1 flex-col overflow-hidden min-w-0">
        <Header onMenuToggle={toggleSidebar} sidebarOpen={sidebarOpen} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto max-w-screen-2xl p-4 md:p-6 h-full flex flex-col">
            <Breadcrumb />
            <div className="flex-1 min-h-0 relative">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
