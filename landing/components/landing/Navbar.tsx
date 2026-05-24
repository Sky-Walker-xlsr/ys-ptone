'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/locales';
import { home } from '@/locales/home.strings';
import { useTheme } from '@/styles/theme';

const LOGIN_URL    = '/login';
const REGISTER_URL = '/register';

function PTOneLogo() {
  return (
    <svg width="165" height="48" viewBox="0 0 110 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="PTOne">
      <rect x="1" y="5" width="16" height="16" rx="3" fill="var(--accent)" opacity="0.9"/>
      <rect x="7" y="11" width="16" height="16" rx="3" fill="var(--accent)" opacity="0.5"/>
      <text x="30" y="22" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" fontSize="17" fontWeight="700" fill="var(--text-primary)">PT</text>
      <text x="53" y="22" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" fontSize="17" fontWeight="400" fill="var(--text-muted)">One</text>
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

export function Navbar() {
  const { t, lang, setLang } = useTranslation();
  const { themeId, toggle }  = useTheme();
  const s = t(home);
  const pathname    = usePathname();
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: lang === 'de' ? 'Home' : 'Home', href: '/' },
    { label: s.navFindPT,      href: '/pt' },
    { label: s.navFeatures,    href: '/features' },
    { label: s.navHowItWorks,  href: '/client-features' },
    { label: s.navContact,     href: '/contact' },
  ];

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const iconBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 36, height: 36, borderRadius: 8,
    background: 'transparent', border: '1px solid var(--border)',
    color: 'var(--text-muted)', transition: 'all 0.15s', cursor: 'pointer',
  };

  const langBtn = (l: 'de' | 'en'): React.CSSProperties => ({
    padding: '4px 8px', borderRadius: 6, fontSize: 13,
    fontWeight: lang === l ? 600 : 400,
    color:      lang === l ? 'var(--text-primary)' : 'var(--text-subtle)',
    background: lang === l ? 'var(--accent-muted)' : 'transparent',
    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
  });

  return (
    <>
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 64,
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '0 24px',
        transition: 'background 0.2s, border-color 0.2s, backdrop-filter 0.2s',
        background:     scrolled ? 'var(--bg-navbar)' : 'transparent',
        borderBottom:   scrolled ? '1px solid var(--navbar-border)' : '1px solid transparent',
        backdropFilter: scrolled ? 'blur(20px) saturate(1.5)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(1.5)' : 'none',
      }}>

        {/* Left: Logo */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center' }}>
            <PTOneLogo />
          </a>
        </div>

        {/* Center: Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="hide-mobile">
          {navLinks.map(l => (
            <a
              key={l.href}
              href={l.href}
              className="btn btn-ghost"
              style={{
                padding: '8px 14px',
                fontSize: 14,
                ...(isActive(l.href) && {
                  border:      '1px solid var(--border-strong)',
                  borderRadius: 8,
                  color:       'var(--text-primary)',
                }),
              }}
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Right: Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
          {/* Language toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '3px' }} className="hide-mobile">
            <button style={langBtn('de')} onClick={() => setLang('de')}>DE</button>
            <button style={langBtn('en')} onClick={() => setLang('en')}>EN</button>
          </div>

          {/* Theme toggle */}
          <button style={iconBtn} onClick={toggle} title={themeId === 'dark' ? 'Light mode' : 'Dark mode'}>
            {themeId === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Login */}
          <a href={LOGIN_URL} className="btn btn-ghost hide-mobile" style={{ fontSize: 14 }}>
            {s.navLogin}
          </a>

          {/* CTA */}
          <a href={REGISTER_URL} className="btn btn-primary hide-mobile" style={{ fontSize: 14, padding: '9px 18px' }}>
            {s.navGetStarted}
          </a>

          {/* Mobile menu toggle */}
          <button style={{ ...iconBtn, border: 'none', background: 'transparent' }}
            onClick={() => setMenuOpen(o => !o)} aria-label="Menu" className="show-mobile">
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, zIndex: 99,
          background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)',
          padding: '16px 24px 24px',
        }}>
          {navLinks.map(l => (
            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              style={{ display: 'block', padding: '12px 0', color: 'var(--text-muted)', fontSize: 16, borderBottom: '1px solid var(--border)' }}>
              {l.label}
            </a>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <a href={LOGIN_URL}    className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>{s.navLogin}</a>
            <a href={REGISTER_URL} className="btn btn-primary"   style={{ flex: 1, justifyContent: 'center' }}>{s.navGetStarted}</a>
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 16 }}>
            <button style={langBtn('de')} onClick={() => setLang('de')}>DE</button>
            <button style={langBtn('en')} onClick={() => setLang('en')}>EN</button>
          </div>
        </div>
      )}
    </>
  );
}
