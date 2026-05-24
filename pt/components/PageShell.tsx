'use client';

import { Sidebar } from '@/components/Sidebar';

interface PageShellProps {
  children:  React.ReactNode;
  title?:    string;
  subtitle?: string;
  action?:   React.ReactNode;
}

export function PageShell({ children, title, subtitle, action }: PageShellProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 'var(--sidebar-width)', minHeight: '100vh', overflowX: 'hidden', transition: 'margin-left 0.2s ease' }}>
        {(title || action) && (
          <div style={{
            padding: '32px 40px 0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            marginBottom: 28,
          }}>
            <div>
              {title && <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</h1>}
              {subtitle && <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{subtitle}</p>}
            </div>
            {action && <div style={{ flexShrink: 0 }}>{action}</div>}
          </div>
        )}
        <div style={{ padding: title ? '0 40px 40px' : '32px 40px 40px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}

interface EmptyStateProps {
  icon:     React.ReactNode;
  title:    string;
  message:  string;
  action?:  React.ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16,
      padding: '56px 40px', display: 'flex', flexDirection: 'column',
      alignItems: 'center', textAlign: 'center', gap: 10,
    }}>
      <div style={{ color: 'var(--border-strong)', marginBottom: 4 }}>{icon}</div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h3>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 340, lineHeight: 1.6 }}>{message}</p>
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

export function ActionBtn({ label, onClick, href }: { label: string; onClick?: () => void; href?: string }) {
  const style: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '9px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600,
    background: 'var(--accent)', color: '#fff', border: 'none',
    cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none',
  };
  if (href) return <a href={href} style={style}>+ {label}</a>;
  return <button onClick={onClick} style={style}>+ {label}</button>;
}
