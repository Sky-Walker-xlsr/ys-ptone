'use client';

// App dashboard mockup — all values are original × 1.25
export function AppMockup() {
  return (
    <div style={{
      width: '100%',
      maxWidth: 725,
      borderRadius: 20,
      overflow: 'hidden',
      border: '1px solid rgba(124,106,255,0.25)',
      boxShadow: '0 50px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,106,255,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
      background: '#0d0d1e',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      position: 'relative',
      userSelect: 'none',
    }} aria-hidden="true">

      {/* Browser chrome */}
      <div style={{
        background: '#111122',
        padding: '13px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ffbd2e' }} />
          <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
        </div>
        <div style={{
          flex: 1,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 6,
          padding: '5px 13px',
          marginLeft: 10,
        }}>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>pt.yannicksalm.ch</span>
        </div>
      </div>

      {/* App shell */}
      <div style={{ display: 'flex', height: 475 }}>

        {/* Sidebar */}
        <div style={{
          width: 65,
          background: '#09091a',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '18px 0',
          gap: 20,
        }}>
          {/* Logo */}
          <div style={{ width: 35, height: 35, borderRadius: 9, background: 'rgba(124,106,255,0.8)', marginBottom: 10 }} />

          {/* Nav icons */}
          {[
            'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',
            'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2',
            'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2',
            'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
            'M3 3h18v18H3z',
          ].map((path, i) => (
            <div key={i} style={{
              width: 40, height: 40, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: i === 0 ? 'rgba(124,106,255,0.2)' : 'transparent',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke={i === 0 ? '#7c6aff' : 'rgba(255,255,255,0.25)'}
                strokeWidth="2" strokeLinecap="round">
                <path d={path} />
              </svg>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: 20, overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>Guten Morgen</div>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Yannick Salm</div>
            </div>
            <div style={{ width: 35, height: 35, borderRadius: '50%', background: 'linear-gradient(135deg, #7c6aff, #a78bfa)' }} />
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Clients', value: '12',      color: '#7c6aff' },
              { label: 'Umsatz',  value: 'CHF 4.8k', color: '#3ecf8e' },
              { label: 'Offen',   value: '2 RE',     color: '#f5a623' },
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                padding: 13,
              }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 5 }}>{stat.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Mini chart */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 10,
            padding: '13px 15px',
            marginBottom: 18,
          }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>Umsatz · letzte 6 Monate</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 50 }}>
              {[55, 40, 70, 45, 85, 100].map((h, i) => (
                <div key={i} style={{
                  flex: 1,
                  height: `${h}%`,
                  background: i === 5
                    ? 'linear-gradient(to top, #7c6aff, rgba(124,106,255,0.4))'
                    : 'rgba(124,106,255,0.2)',
                  borderRadius: '3px 3px 0 0',
                }} />
              ))}
            </div>
          </div>

          {/* Client list */}
          <div style={{
            fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 10,
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>Clients</span>
            <span style={{ color: '#7c6aff' }}>Alle anzeigen →</span>
          </div>

          {[
            { name: 'Anna M.',  goal: 'Abnehmen',    status: '#3ecf8e', prog: 75 },
            { name: 'Lukas R.', goal: 'Muskelaufbau', status: '#7c6aff', prog: 50 },
            { name: 'Sara K.',  goal: 'Ausdauer',     status: '#f5a623', prog: 30 },
          ].map((c, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 0',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: `rgba(124,106,255,${0.3 + i * 0.15})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {c.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{c.goal}</div>
              </div>
              <div style={{ width: 60 }}>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                  <div style={{ width: `${c.prog}%`, height: '100%', background: c.status, borderRadius: 2 }} />
                </div>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.status, flexShrink: 0 }} />
            </div>
          ))}

        </div>
      </div>
    </div>
  );
}
