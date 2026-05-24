'use client';

import { useState } from 'react';
import { PageShell, EmptyState, ActionBtn } from '@/components/PageShell';
import { useTranslation } from '@/locales';
import { dashboard } from '@/locales/dashboard.strings';

export default function AccountingPage() {
  const { t, lang } = useTranslation();
  const s = t(dashboard);
  const [tab, setTab] = useState<'invoices' | 'expenses' | 'reports'>('invoices');

  const tabs = [
    { key: 'invoices',  label: lang === 'de' ? 'Rechnungen' : 'Invoices'  },
    { key: 'expenses',  label: lang === 'de' ? 'Ausgaben'   : 'Expenses'  },
    { key: 'reports',   label: lang === 'de' ? 'Berichte'   : 'Reports'   },
  ];

  const stats = [
    { label: lang === 'de' ? 'Offen'       : 'Open',      value: 'CHF 0.00', color: 'var(--warning)' },
    { label: lang === 'de' ? 'Überfällig'  : 'Overdue',   value: 'CHF 0.00', color: 'var(--danger)'  },
    { label: lang === 'de' ? 'Bezahlt (M)' : 'Paid (M)',  value: 'CHF 0.00', color: 'var(--success)' },
    { label: lang === 'de' ? 'Gesamt (J)'  : 'Total (Y)', value: 'CHF 0.00', color: 'var(--accent)'  },
  ];

  return (
    <PageShell
      title={s.accounting}
      subtitle={lang === 'de' ? 'Rechnungen, Ausgaben und Berichte.' : 'Invoices, expenses and reports.'}
      action={<ActionBtn label={lang === 'de' ? 'Rechnung erstellen' : 'New invoice'} />}
    >
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {stats.map(card => (
          <div key={card.label} style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
            padding: '18px 20px',
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: card.color, marginBottom: 3 }}>{card.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)} style={{
            padding: '8px 16px', fontSize: 14, fontWeight: tab === t.key ? 600 : 400,
            color: tab === t.key ? 'var(--accent)' : 'var(--text-muted)',
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: `2px solid ${tab === t.key ? 'var(--accent)' : 'transparent'}`,
            marginBottom: -1, fontFamily: 'inherit',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <EmptyState
        icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        title={lang === 'de' ? 'Noch keine Rechnungen' : 'No invoices yet'}
        message={lang === 'de'
          ? 'Erstelle deine erste Rechnung und versende sie direkt an deinen Client.'
          : 'Create your first invoice and send it directly to your client.'}
        action={<ActionBtn label={lang === 'de' ? 'Rechnung erstellen' : 'New invoice'} />}
      />
    </PageShell>
  );
}
