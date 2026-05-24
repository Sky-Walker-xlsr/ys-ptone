'use client';

import { useTranslation } from '@/locales';
import { home } from '@/locales/home.strings';

export function StatsBar() {
  const { t } = useTranslation();
  const s = t(home);

  const stats = [
    { value: s.stat1Value, label: s.stat1Label },
    { value: s.stat2Value, label: s.stat2Label },
    { value: s.stat3Value, label: s.stat3Label },
    { value: s.stat4Value, label: s.stat4Label },
  ];

  return (
    <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
          {stats.map((stat, i) => (
            <div
              key={i}
              style={{
                padding:     '28px 20px',
                textAlign:   'center',
                borderRight: i < stats.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
