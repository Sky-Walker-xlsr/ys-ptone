'use client';

import { useState, useEffect, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/locales/index';
import { dashboard } from '@/locales/dashboard.strings';
import { createClient } from '@/lib/supabase/client';

const COLLAPSED_WIDTH = '60px';
const EXPANDED_WIDTH  = '240px';

function PTOneLogo() {
  return (
    <svg width="100" height="30" viewBox="0 0 110 32" fill="none" aria-label="PTOne">
      <rect x="1" y="5" width="16" height="16" rx="3" fill="var(--accent)" opacity="0.9"/>
      <rect x="7" y="11" width="16" height="16" rx="3" fill="var(--accent)" opacity="0.5"/>
      <text x="30" y="22" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" fontSize="17" fontWeight="700" fill="var(--text-primary)">PT</text>
      <text x="53" y="22" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" fontSize="17" fontWeight="400" fill="var(--text-muted)">One</text>
    </svg>
  );
}

function PTOneIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-label="PTOne">
      <rect x="1" y="1" width="14" height="14" rx="3" fill="var(--accent)" opacity="0.9"/>
      <rect x="11" y="11" width="14" height="14" rx="3" fill="var(--accent)" opacity="0.5"/>
    </svg>
  );
}

const NAV_ICONS: Record<string, React.ReactNode> = {
  overview:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  clients:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  plans:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  journal:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  accounting: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  calendar:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  drive:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  inbox:      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  profile:    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  settings:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
};

export function Sidebar() {
  const { t }    = useTranslation();
  const s        = t(dashboard);
  const pathname = usePathname();

  // Read collapsed state synchronously from localStorage on first render.
  // The anti-FOUC script in layout.tsx already set --sidebar-width before React,
  // so we just need to match that state here.
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  const [unreadCount, setUnreadCount] = useState(0);

  // useLayoutEffect fires synchronously before paint — no flash between the
  // script-set value and React's first render.
  useLayoutEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
    );
    localStorage.setItem('sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const supabase = createClient();
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('contact_requests')
        .select('id', { count: 'exact', head: true })
        .eq('read', false);
      setUnreadCount(count ?? 0);
    };
    fetchUnread();
    const channel = supabase
      .channel('inbox-unread')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_requests' }, fetchUnread)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const navItems = [
    { key: 'overview',   label: s.overview,   href: '/dashboard' },
    { key: 'clients',    label: s.clients,    href: '/clients' },
    { key: 'plans',      label: s.plans,      href: '/plans' },
    { key: 'journal',    label: s.journal,    href: '/journal' },
    { key: 'accounting', label: s.accounting, href: '/accounting' },
    { key: 'calendar',   label: s.calendar,   href: '/calendar' },
    { key: 'drive',      label: s.drive,      href: '/drive' },
    { key: 'inbox',      label: s.inbox,      href: '/inbox' },
  ];

  const bottomItems = [
    { key: 'profile',  label: s.profile,  href: '/profile' },
    { key: 'settings', label: s.settings, href: '/settings' },
  ];

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  const navItemStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    gap: collapsed ? 0 : 10,
    padding: collapsed ? '9px 0' : '9px 12px',
    borderRadius: 8, fontSize: 14, fontWeight: active ? 600 : 400,
    color: active ? 'var(--accent)' : 'var(--text-muted)',
    background: active ? 'var(--accent-muted)' : 'transparent',
    cursor: 'pointer', transition: 'all 0.12s', width: '100%', border: 'none',
    textDecoration: 'none', whiteSpace: 'nowrap', overflow: 'hidden',
  });

  return (
    <>
      <aside style={{
        width: 'var(--sidebar-width)', flexShrink: 0,
        background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 50,
        overflowY: 'auto', overflowX: 'hidden',
        transition: 'width 0.2s ease',
      }}>

        {/* Logo */}
        <div style={{
          padding: collapsed ? '20px 0 16px' : '20px 16px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          flexDirection: 'column',
          minHeight: 72,
        }}>
          {collapsed ? <PTOneIcon /> : (
            <>
              <PTOneLogo />
              <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                PT Dashboard
              </div>
            </>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: collapsed ? '12px 4px' : '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(item => {
            const active = isActive(item.href);
            const showBadge = item.key === 'inbox' && unreadCount > 0;
            return (
              <a
                key={item.key}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`nav-item${active ? ' active' : ''}`}
                style={navItemStyle(active)}
              >
                <span style={{ opacity: active ? 1 : 0.7, flexShrink: 0, position: 'relative' }}>
                  {NAV_ICONS[item.key]}
                  {showBadge && collapsed && (
                    <span style={{
                      position: 'absolute', top: -4, right: -4,
                      width: 8, height: 8, borderRadius: '50%',
                      background: 'var(--accent)', border: '1.5px solid var(--bg-sidebar)',
                    }} />
                  )}
                </span>
                {!collapsed && item.label}
                {showBadge && !collapsed && (
                  <span style={{
                    marginLeft: 'auto', minWidth: 18, height: 18, borderRadius: 9,
                    background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
                  }}>
                    {unreadCount}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Bottom — profile + settings only */}
        <div style={{ padding: collapsed ? '8px 4px 16px' : '8px 8px 16px', borderTop: '1px solid var(--border)' }}>
          {bottomItems.map(item => (
            <a
              key={item.key}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`nav-item${isActive(item.href) ? ' active' : ''}`}
              style={{ ...navItemStyle(isActive(item.href)), marginBottom: 2 }}
            >
              <span style={{ opacity: isActive(item.href) ? 1 : 0.7, flexShrink: 0 }}>
                {NAV_ICONS[item.key]}
              </span>
              {!collapsed && item.label}
            </a>
          ))}
        </div>
      </aside>

      {/* Collapse toggle — fixed at the right edge of the sidebar, always same height */}
      <button
        onClick={() => setCollapsed(c => !c)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        style={{
          position: 'fixed',
          left: 'var(--sidebar-width)',
          bottom: 28,
          transform: 'translateX(-50%)',
          zIndex: 60,
          width: 24, height: 24, borderRadius: '50%',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          color: 'var(--text-subtle)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 1px 6px rgba(0,0,0,0.18)',
          transition: 'left 0.2s ease',
          padding: 0,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {collapsed
            ? <polyline points="9 18 15 12 9 6"/>
            : <polyline points="15 18 9 12 15 6"/>
          }
        </svg>
      </button>
    </>
  );
}
