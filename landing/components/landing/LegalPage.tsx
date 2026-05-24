'use client';

import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

type Section = { id: string; title: string; content: React.ReactNode };

export function LegalPage({
  eyebrow,
  title,
  subtitle,
  lastUpdated,
  sections,
}: {
  eyebrow:     string;
  title:       string;
  subtitle?:   string;
  lastUpdated: string;
  sections:    Section[];
}) {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: 64, minHeight: '100vh', background: 'var(--bg-page)' }}>
        {/* Hero */}
        <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', padding: '56px 24px 48px' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <div className="section-eyebrow" style={{ marginBottom: 12 }}>{eyebrow}</div>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 10 }}>
              {title}
            </h1>
            {subtitle && <p style={{ fontSize: 16, color: 'var(--text-muted)' }}>{subtitle}</p>}
            <p style={{ fontSize: 13, color: 'var(--text-subtle)', marginTop: 12 }}>
              Stand: {lastUpdated}
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '56px 24px 96px' }}>
          {/* ToC */}
          <nav style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
              Inhalt
            </div>
            <ol style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 20 }}>
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} style={{ fontSize: 14, color: 'var(--accent)', textDecoration: 'none' }}>
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
            {sections.map((s, i) => (
              <section key={s.id} id={s.id}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--accent-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--accent)', flexShrink: 0 }}>
                    {i + 1}
                  </span>
                  {s.title}
                </h2>
                <div style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.8 }}>
                  {s.content}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

// Shared prose helpers
export const P  = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <p style={{ marginBottom: 12, ...style }}>{children}</p>
);
export const UL = ({ items }: { items: string[] }) => (
  <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
    {items.map((item, i) => <li key={i}>{item}</li>)}
  </ul>
);
export const Strong = ({ children }: { children: React.ReactNode }) => (
  <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{children}</strong>
);
