'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sidebar } from '@/components/Sidebar';
import { useTranslation } from '@/locales/index';
import { dashboard } from '@/locales/dashboard.strings';

type Profile = { id: string; first_name: string; last_name: string; color_theme?: string };

type ClientResult = {
  id: string;
  client_id: string;
  profiles: { first_name: string; last_name: string; email?: string } | null;
};

function getGreeting(s: Record<string, string>) {
  const h = new Date().getHours();
  if (h < 12) return s.greeting;
  if (h < 18) return s.greetingAfternoon;
  return s.greetingEvening;
}

function StatCard({ label, value, icon, color = 'var(--accent)' }: {
  label: string; value: string | number; icon: React.ReactNode; color?: string;
}) {
  return (
    <div className="stat-card" style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '20px 24px',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const s = t(dashboard);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeClients, setActiveClients] = useState(0);
  const [allClients, setAllClients] = useState<ClientResult[]>([]);
  const [clientSearch, setClientSearch] = useState('');

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }

      const { data: prof } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, color_theme')
        .eq('id', session.user.id)
        .single();

      setProfile(prof ?? { id: session.user.id, first_name: session.user.email?.split('@')[0] ?? 'PT', last_name: '' });

      const { data: clients, count } = await supabase
        .from('trainer_clients')
        .select('id, client_id, profiles!client_id(first_name, last_name)', { count: 'exact' })
        .eq('trainer_id', session.user.id)
        .eq('status', 'active');
      setActiveClients(count ?? 0);
      setAllClients((clients as any) ?? []);

      setLoading(false);
    }
    init();
  }, [router]);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const name = profile ? `${profile.first_name}` : 'PT';

  const statItems = [
    {
      label: s.activeClients, value: activeClients,
      color: 'var(--accent)',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    },
    {
      label: s.openInvoices, value: 0,
      color: 'var(--warning)',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    },
    {
      label: s.upcomingAppointments, value: 0,
      color: 'var(--info)',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    },
    {
      label: s.monthlyRevenue, value: `${s.chf} 0.00`,
      color: 'var(--success)',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Sidebar />

      <main style={{ flex: 1, marginLeft: 'var(--sidebar-width)', padding: '32px 40px', minHeight: '100vh', transition: 'margin-left 0.2s ease' }}>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
            {getGreeting(s)}, {name} 👋
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {new Date().toLocaleDateString('de-CH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 40 }}>
          {statItems.map(item => (
            <StatCard key={item.label} label={item.label} value={item.value} icon={item.icon} color={item.color} />
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{s.journalSubmissions}</h2>
              <a href="/journal" style={{ fontSize: 13, color: 'var(--accent)' }}>{s.viewAll}</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: 8 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
              <p style={{ fontSize: 13, color: 'var(--text-subtle)' }}>{s.noActivity}</p>
            </div>
          </div>

          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{s.upcomingAppointments}</h2>
              <a href="/calendar" style={{ fontSize: 13, color: 'var(--accent)' }}>{s.viewAll}</a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: 8 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <p style={{ fontSize: 13, color: 'var(--text-subtle)' }}>{s.noAppointments}</p>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{s.clients}</h2>
            <a href="/clients" style={{ fontSize: 13, color: 'var(--accent)' }}>{s.viewAll}</a>
          </div>

          {/* Search input */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search clients..."
              value={clientSearch}
              onChange={e => setClientSearch(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8,
                background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', fontSize: 14, outline: 'none', fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Search results */}
          {(() => {
            const trimmed = clientSearch.trim().toLowerCase();
            const filtered = trimmed
              ? allClients.filter(c => {
                  const p = c.profiles;
                  const full = `${p?.first_name ?? ''} ${p?.last_name ?? ''}`.toLowerCase();
                  return full.includes(trimmed);
                })
              : [];
            return clientSearch.trim() ? (
              filtered.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-subtle)', textAlign: 'center', padding: '20px 0' }}>No clients found</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {filtered.map(c => {
                  const p = c.profiles;
                  const fullName = p ? `${p.first_name} ${p.last_name}`.trim() : 'Unknown';
                  const initials = p ? `${p.first_name?.[0] ?? ''}${p.last_name?.[0] ?? ''}`.toUpperCase() : '?';
                  return (
                    <a key={c.id} href={`/clients/${c.client_id}`} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                      borderRadius: 8, textDecoration: 'none', color: 'var(--text-primary)',
                      background: 'var(--bg-tertiary)', transition: 'background 0.15s',
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', background: 'rgba(124,106,255,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
                      }}>
                        {initials}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{fullName}</span>
                    </a>
                  );
                })}
              </div>
            )
          ) : activeClients === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', gap: 8 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--border-strong)" strokeWidth="1.5" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <p style={{ fontSize: 13, color: 'var(--text-subtle)' }}>{s.noClients}</p>
              <a href="/clients" style={{
                marginTop: 4, padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: 'var(--accent)', color: '#fff', display: 'inline-block',
              }}>
                + Client hinzufügen
              </a>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
              {activeClients} active {activeClients === 1 ? 'client' : 'clients'} — search by name above
            </p>
          );
          })()}
        </div>
      </main>
    </div>
  );
}
