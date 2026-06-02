'use client';

import { useTranslation } from '@/locales';
import { home } from '@/locales/home.strings';

function PTOneLogo() {
  return (
    <svg width="100" height="28" viewBox="0 0 110 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="5" width="16" height="16" rx="3" fill="var(--accent)" opacity="0.9"/>
      <rect x="7" y="11" width="16" height="16" rx="3" fill="var(--accent)" opacity="0.4"/>
      <text x="30" y="22" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" fontSize="17" fontWeight="700" fill="var(--text-primary)">PT</text>
      <text x="53" y="22" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" fontSize="17" fontWeight="400" fill="var(--text-muted)">One</text>
    </svg>
  );
}

export function Footer() {
  const { t, lang } = useTranslation();
  const s = t(home);
  const year = new Date().getFullYear();

  const links = [
    { label: s.navFindPT,     href: '/pt' },
    { label: s.navFeatures,   href: '/features' },
    { label: s.navHowItWorks, href: '/client-features' },
    { label: s.navContact,    href: '/contact' },
    { label: s.navLogin,      href: '/login' },
  ];

  const legal = [
    { label: lang === 'de' ? 'Impressum'         : 'Legal Notice', href: '/impressum' },
    { label: lang === 'de' ? 'AGB'               : 'Terms',        href: '/terms' },
    { label: lang === 'de' ? 'Datenschutz'       : 'Privacy',      href: 'https://datenschutz.yannicksalm.ch/#ptone', external: true },
  ];

  return (
    <footer style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
      <div className="container" style={{ padding: '48px 24px 32px' }}>
        {/* Top */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, marginBottom: 40, alignItems: 'start' }}>
          <div>
            <PTOneLogo />
            <p style={{ marginTop: 12, fontSize: 14, color: 'var(--text-muted)', maxWidth: 300, lineHeight: 1.6 }}>
              {s.footerTagline}
            </p>
          </div>
          <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {links.map(l => (
              <a key={l.href} href={l.href} style={{ fontSize: 14, color: 'var(--text-muted)', padding: '4px 10px', borderRadius: 6, transition: 'color 0.15s' }}
                onMouseOver={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseOut={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border)', marginBottom: 24 }} />

        {/* Bottom */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text-subtle)' }}>
            © {year} Yannick Salm · PTOne · {s.footerRights}
          </span>
          <div style={{ display: 'flex', gap: 16 }}>
            {legal.map(l => (
              <a key={l.href} href={l.href}
                {...('external' in l && l.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                style={{ fontSize: 13, color: 'var(--text-subtle)', transition: 'color 0.15s' }}
                onMouseOver={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                onMouseOut={e => (e.currentTarget.style.color = 'var(--text-subtle)')}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
