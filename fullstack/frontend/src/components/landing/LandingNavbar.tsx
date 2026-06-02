import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import ThemeToggle from '../theme/ThemeToggle';
import { Menu, X } from 'lucide-react';
import Logo from '../ui/Logo';
import type { NavItem } from './types';

interface LandingNavbarProps {
  navItems: NavItem[];
  isAuthenticated: boolean;
  onLogout: () => void;
}

const LandingNavbar = ({ navItems, isAuthenticated, onLogout }: LandingNavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Convert hash links to route links when not on landing page
  const getNavHref = (href: string) => {
    if (href === '#ensiklopedia' && !isLandingPage) {
      return '/ensiklopedia';
    }
    if (href.startsWith('#') && !isLandingPage) {
      return '/' + href; // Go back to landing with hash
    }
    return href;
  };

  const handleNavClick = (href: string) => {
    if (href.startsWith('#') && !isLandingPage) {
      // Navigate to landing page with hash
      window.location.href = '/' + href;
    }
    setIsMenuOpen(false);
  };

  return (
    <>
    <header className="sticky top-0 z-[80] border-b border-app-border bg-app-surface/90 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        {/* Logo */}
        <Link to="/" className="shrink-0" aria-label="Freshly home">
          <Logo size={28} noDot />
        </Link>

        {/* Desktop Navigation */}
        <ul className="hidden items-center gap-8 text-sm font-medium text-app-text-secondary md:flex">
          {navItems.map((item) => {
            const href = getNavHref(item.href);
            const isHash = item.href.startsWith('#');
            
            return (
              <li key={item.href}>
                {isHash && isLandingPage ? (
                  <a href={item.href} className="transition hover:text-app-accent">
                    {item.label}
                  </a>
                ) : (
                  <Link to={href} className="transition hover:text-app-accent">
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        {/* Action Buttons (Desktop) */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="rounded-full px-4 py-2 text-sm font-semibold text-app-text-primary transition hover:bg-app-bg">
                Dashboard
              </Link>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-full bg-app-accent px-5 py-2 text-sm font-semibold text-app-accent-contrast transition hover:brightness-95"
              >
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-app-text-primary transition hover:bg-app-bg">
                Masuk
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-app-accent px-5 py-2 text-sm font-semibold text-app-accent-contrast transition hover:brightness-95"
              >
                Daftar
              </Link>
            </>
          )}
        </div>

        {/* Mobile Header Controls */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="p-2 text-app-text-primary focus:outline-none"
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Tutup menu" : "Buka menu"}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

    </header>

    {/* Mobile Navigation Menu — portaled to body to escape backdrop-blur containing block */}
    {createPortal(
      <div className="md:hidden">
        {/* Backdrop */}
        <div
          className={`fixed inset-0 top-[65px] z-[60] bg-black/40 transition-opacity duration-300 ${
            isMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          onClick={() => setIsMenuOpen(false)}
        />
        {/* Slide-in panel */}
        <div
          className={`fixed inset-x-0 top-[65px] bottom-0 z-[70] overflow-y-auto bg-app-surface transition-transform duration-300 ease-in-out ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col space-y-4 p-6">
            <div className="flex flex-col space-y-4 pb-6 border-b border-app-border">
              {navItems.map((item) => {
                const href = getNavHref(item.href);
                const isHash = item.href.startsWith('#');
                
                return isHash && isLandingPage ? (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-lg font-medium text-app-text-primary transition hover:text-app-accent"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    to={href}
                    onClick={() => handleNavClick(item.href)}
                    className="text-lg font-medium text-app-text-primary transition hover:text-app-accent"
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 pt-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full rounded-xl border border-app-border px-5 py-3 text-center font-semibold text-app-text-primary"
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      onLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full rounded-xl bg-app-accent px-5 py-3 text-center font-bold text-app-accent-contrast shadow-sm"
                  >
                    Keluar
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full rounded-xl border border-app-border px-5 py-3 text-center font-semibold text-app-text-primary"
                  >
                    Masuk ke Akun
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full rounded-xl bg-app-accent px-5 py-3 text-center font-bold text-app-accent-contrast shadow-sm"
                  >
                    Daftar Sekarang
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
};

export default LandingNavbar;
