'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export interface AuthUser {
  id?: string;
  displayName?: string;
  email?: string;
  role?: string;
}

export interface NavbarProps {
  currentUser?: AuthUser | null;
  activePath?: string;
}

// Module-level persistent cache across client navigation in SPA
let cachedUser: AuthUser | null = null;
let cachedAuth: boolean | null = null;

export default function Navbar({ currentUser: initialUser }: NavbarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Synchronously compute initial auth state to prevent any hydration flicker
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (initialUser) {
      cachedAuth = true;
      cachedUser = initialUser;
      return true;
    }
    if (cachedAuth !== null) return cachedAuth;
    if (typeof document !== 'undefined') {
      const hasCookie = document.cookie.includes('sale_logged_in=1');
      if (hasCookie) cachedAuth = true;
      return hasCookie;
    }
    return false;
  });

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    if (initialUser) return initialUser;
    if (cachedUser) return cachedUser;
    return null;
  });

  // Synchronize authentication state across all pages
  async function checkAuthSession() {
    try {
      // First check client cookie for instant response
      const hasCookie = typeof document !== 'undefined' && document.cookie.includes('sale_logged_in=1');
      if (hasCookie) {
        cachedAuth = true;
        setIsAuthenticated(true);
      }

      // Verify with session endpoint
      const res = await fetch('/api/auth/session', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.authenticated) {
          cachedAuth = true;
          cachedUser = json.user;
          setIsAuthenticated(true);
          setCurrentUser(json.user);
          return;
        }
      }

      // If session endpoint reports unauthenticated
      if (!hasCookie && !initialUser) {
        cachedAuth = false;
        cachedUser = null;
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    } catch {
      const hasCookie = typeof document !== 'undefined' && document.cookie.includes('sale_logged_in=1');
      cachedAuth = hasCookie || !!initialUser;
      setIsAuthenticated(cachedAuth);
    }
  }

  useEffect(() => {
    if (!initialUser) {
      checkAuthSession();
    } else {
      setIsAuthenticated(true);
      setCurrentUser(initialUser);
    }

    // Listen to custom auth events from login/logout actions
    const handleAuthChange = (e: Event) => {
      const customEvent = e as CustomEvent<AuthUser>;
      if (customEvent.detail) {
        setIsAuthenticated(true);
        setCurrentUser(customEvent.detail);
      } else {
        checkAuthSession();
      }
    };

    window.addEventListener('sale-auth-changed', handleAuthChange);
    return () => {
      window.removeEventListener('sale-auth-changed', handleAuthChange);
    };
  }, [pathname, initialUser]);

  async function handleLogout() {
    setLoggingOut(true);
    cachedAuth = false;
    cachedUser = null;
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setCurrentUser(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('sale-auth-changed'));
      }
      router.replace('/login');
      router.refresh();
    } catch {
      setIsAuthenticated(false);
      setCurrentUser(null);
      router.replace('/login');
    } finally {
      setLoggingOut(false);
    }
  }

  const navLinks = [
    { href: '/', label: 'Tổng quan' },
    { href: '/sales', label: 'Sales Workspace' },
    { href: '/dashboard', label: 'Analytics BI' },
    { href: '/contact', label: 'Gửi Lead Mẫu' },
  ];

  const isAuthPage = pathname === '/login';

  return (
    <header className="sticky top-0 z-50 w-full px-4 pt-3 pb-2 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl h-14 items-center justify-between px-4 sm:px-5 rounded-2xl glass-panel shadow-xs border border-slate-200/90 transition-all">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-2.5 focus:outline-none">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-950 via-indigo-950 to-indigo-600 text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <svg className="h-4.5 w-4.5 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                AI Sales Agent
              </span>
              <span className="rounded-full bg-indigo-50 px-2 py-0.2 text-[9px] font-bold uppercase tracking-wider text-indigo-700 border border-indigo-200/60 hidden sm:inline-block">
                Autonomous
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Multi-Agent Live Engine</span>
            </div>
          </div>
        </Link>

        {/* Center Navigation: Exactly 1 Route to Sales Workspace */}
        <nav className="hidden md:flex items-center gap-1 rounded-xl bg-slate-100/70 p-1 border border-slate-200/60">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Buttons: Authenticated vs Guest */}
        <div className="hidden sm:flex items-center gap-2.5">
          {isAuthPage ? (
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <span>&larr;</span>
              <span>Trang chủ</span>
            </Link>
          ) : isAuthenticated ? (
            /* Logged in state: Show Profile Badge + Logout (Never shows "Đăng nhập") */
            <div className="flex items-center gap-2 animate-fade-in">
              <Link
                href="/sales"
                className="flex items-center gap-2 rounded-xl bg-slate-100/90 px-3 py-1.5 border border-slate-200/80 hover:bg-slate-200/70 transition-colors shadow-2xs"
                title="Mở Sales Workspace"
              >
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-800">
                  {currentUser?.displayName || 'Bảo (System Manager)'}
                </span>
                <span className="rounded bg-indigo-100 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700 uppercase">
                  {currentUser?.role || 'admin'}
                </span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/80 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>{loggingOut ? 'Đang thoát...' : 'Đăng xuất'}</span>
              </button>
            </div>
          ) : (
            /* Guest state: Clean single "Đăng nhập" button (No duplicate "Vào Workspace" button) */
            <div className="flex items-center gap-2 animate-fade-in">
              <Link
                href="/login"
                className="btn-shimmer inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md shadow-slate-950/20 hover:bg-indigo-600 transition-all card-hover"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Đăng nhập</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Mở menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="mt-2 rounded-2xl glass-panel p-4 shadow-xl border border-slate-200/90 md:hidden animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/80 flex flex-col gap-2">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 border border-slate-200/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="font-bold text-slate-800">{currentUser?.displayName || 'Bảo'}</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {currentUser?.role || 'admin'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 border border-rose-200"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-600"
              >
                Đăng nhập &rarr;
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
