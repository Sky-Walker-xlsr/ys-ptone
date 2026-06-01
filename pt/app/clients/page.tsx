'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { PageShell } from '@/components/PageShell';
import { useTranslation } from '@/locales';
import { dashboard } from '@/locales/dashboard.strings';
import { createClient } from '@/lib/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'active' | 'pending' | 'paused' | 'ended';

interface ClientProfile {
  id:           string;
  first_name:   string | null;
  last_name:    string | null;
  display_name: string | null;
  email:        string;
  has_coach?:   boolean;
}

interface TrainerClient {
  id:         string;
  client_id:  string;
  status:     Status;
  created_at: string;
  client:     ClientProfile | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(p: ClientProfile | null) {
  if (!p) return '?';
  const a = (p.first_name?.[0] ?? '') + (p.last_name?.[0] ?? '');
  return a.toUpperCase() || p.email[0].toUpperCase();
}

function getDisplayName(p: ClientProfile | null) {
  if (!p) return '—';
  return p.display_name || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.email;
}

const STATUS_COLOR: Record<Status, string> = {
  active:  'var(--success)',
  pending: 'var(--warning)',
  paused:  'var(--text-subtle)',
  ended:   'var(--danger)',
};

// ─── MenuItem ─────────────────────────────────────────────────────────────────

function MenuItem({
  label, icon, color, danger, onClick, needsConfirm, confirmLabel,
}: {
  label: string; icon: React.ReactNode; color?: string; danger?: boolean;
  onClick: () => void; needsConfirm?: boolean; confirmLabel?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const c = color ?? (danger ? 'var(--danger)' : 'var(--text-primary)');

  if (confirming) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px' }}>
        <span style={{ flex: 1, fontSize: 13, color: 'var(--text-muted)' }}>{confirmLabel}</span>
        <button onClick={() => { onClick(); setConfirming(false); }} style={{
          padding: '3px 10px', borderRadius: 5, fontSize: 12, fontWeight: 700,
          background: `${c}20`, color: c, border: `1px solid ${c}40`,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>✓</button>
        <button onClick={() => setConfirming(false)} style={{
          padding: '3px 8px', borderRadius: 5, fontSize: 12,
          background: 'none', border: '1px solid var(--border)', color: 'var(--text-subtle)',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>✕</button>
      </div>
    );
  }

  return (
    <button onClick={needsConfirm ? () => setConfirming(true) : onClick} style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      width: '100%', background: 'none', border: 'none', cursor: 'pointer',
      fontFamily: 'inherit', fontSize: 14, color: c, textAlign: 'left',
    }}>
      {icon}
      {label}
    </button>
  );
}

// ─── Add Client Modal ─────────────────────────────────────────────────────────

type AddStep = 'email' | 'confirm' | 'notfound' | 'already' | 'has_coach_blocked';

function AddClientModal({
  lang, onClose, onAdded,
}: {
  lang: string;
  onClose: () => void;
  onAdded: (tc: TrainerClient) => void;
}) {
  const supabase = createClient();
  const [step,    setStep]    = useState<AddStep>('email');
  const [email,   setEmail]   = useState('');
  const [found,   setFound]   = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    const { data, error: rpcError } = await supabase.rpc('find_client_by_email', {
      p_email: email.trim().toLowerCase(),
    });

    setLoading(false);
    if (rpcError) { setError(rpcError.message); return; }
    if (!data || (data as ClientProfile[]).length === 0) { setStep('notfound'); return; }

    const profile = (data as ClientProfile[])[0];

    // Check if THIS trainer already has a non-ended connection to this client.
    // RLS restricts trainer_clients to rows where trainer_id = auth.uid(), so
    // a non-null result here means we're already connected.
    const { data: existing } = await supabase
      .from('trainer_clients')
      .select('id')
      .eq('client_id', profile.id)
      .neq('status', 'ended')
      .maybeSingle();

    if (existing) { setFound(profile); setStep('already'); return; }

    // has_coach = true but no row for this trainer → another PT is coaching them
    if (profile.has_coach) { setFound(profile); setStep('has_coach_blocked'); return; }

    setFound(profile);
    setStep('confirm');
  }

  async function handleConfirm() {
    if (!found) return;
    setLoading(true);
    setError('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError('Not authenticated'); setLoading(false); return; }

    // Upsert handles re-inviting a client whose previous row is 'ended'
    const { data, error: upsertError } = await supabase
      .from('trainer_clients')
      .upsert(
        { trainer_id: session.user.id, client_id: found.id, status: 'pending' },
        { onConflict: 'trainer_id,client_id' }
      )
      .select('id, client_id, status, created_at')
      .single();

    setLoading(false);
    if (upsertError || !data) { setError(upsertError?.message ?? 'Error'); return; }
    onAdded({ ...(data as Omit<TrainerClient, 'client'>), client: found });
    onClose();
  }

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 200,
    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
  };
  const card: React.CSSProperties = {
    width: '100%', maxWidth: 440,
    background: 'var(--bg-surface)', border: '1px solid var(--border-strong)',
    borderRadius: 20, padding: '32px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 8,
    background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
    color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit',
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={card}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            {lang === 'de' ? 'Client hinzufügen' : 'Add client'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-subtle)', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Step: email */}
        {(step === 'email' || step === 'notfound') && (
          <form onSubmit={handleLookup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>
                {lang === 'de' ? 'E-Mail des Clients' : 'Client email address'}
              </label>
              <input
                ref={inputRef}
                type="email" required value={email}
                onChange={e => { setEmail(e.target.value); if (step === 'notfound') setStep('email'); }}
                placeholder="client@example.com"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border-strong)')}
              />
            </div>

            {step === 'notfound' && (
              <div style={{
                padding: '12px 14px', borderRadius: 8, fontSize: 13,
                background: 'rgba(240,68,68,0.08)', border: '1px solid rgba(240,68,68,0.2)',
                color: 'var(--danger)',
              }}>
                {lang === 'de'
                  ? 'Kein Account mit dieser E-Mail gefunden. Die Person muss sich zuerst unter ptone.yannicksalm.ch/register registrieren.'
                  : 'No account found for this email. The person must register first at ptone.yannicksalm.ch/register.'}
              </div>
            )}

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, background: 'rgba(240,68,68,0.08)', border: '1px solid rgba(240,68,68,0.2)', color: 'var(--danger)' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={onClose} style={{
                flex: 1, padding: '11px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
                color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {lang === 'de' ? 'Abbrechen' : 'Cancel'}
              </button>
              <button type="submit" disabled={loading} style={{
                flex: 2, padding: '11px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                background: loading ? 'rgba(124,106,255,0.5)' : 'var(--accent)',
                color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}>
                {loading ? '…' : (lang === 'de' ? 'Suchen' : 'Search')}
              </button>
            </div>
          </form>
        )}

        {/* Step: confirm */}
        {step === 'confirm' && found && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
              padding: '16px', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', background: 'var(--accent)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700, flexShrink: 0,
              }}>
                {getInitials(found)}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{getDisplayName(found)}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{found.email}</div>
              </div>
            </div>

            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {lang === 'de'
                ? 'Eine Coaching-Anfrage wird an diese Person gesendet. Sie erscheint in deiner Liste, sobald sie annimmt.'
                : 'A coaching request will be sent to this person. They will appear in your list once they accept.'}
            </p>

            {error && (
              <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13, background: 'rgba(240,68,68,0.08)', border: '1px solid rgba(240,68,68,0.2)', color: 'var(--danger)' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep('email')} style={{
                flex: 1, padding: '11px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
                color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {lang === 'de' ? 'Zurück' : 'Back'}
              </button>
              <button onClick={handleConfirm} disabled={loading} style={{
                flex: 2, padding: '11px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                background: loading ? 'rgba(124,106,255,0.5)' : 'var(--accent)',
                color: '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}>
                {loading ? '…' : (lang === 'de' ? 'Hinzufügen' : 'Add client')}
              </button>
            </div>
          </div>
        )}

        {/* Step: blocked — another PT is coaching this client */}
        {step === 'has_coach_blocked' && found && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
              padding: '16px', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-tertiary)',
                color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700, flexShrink: 0,
              }}>
                {getInitials(found)}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{getDisplayName(found)}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{found.email}</div>
              </div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: 8, fontSize: 13, background: 'rgba(240,68,68,0.08)', border: '1px solid rgba(240,68,68,0.2)', color: 'var(--danger)' }}>
              {lang === 'de'
                ? 'Dieser Client wird bereits von einem anderen Personal Trainer betreut.'
                : 'Another personal trainer is already coaching this client.'}
            </div>

            <button onClick={onClose} style={{
              padding: '11px', borderRadius: 8, fontSize: 14, fontWeight: 500,
              background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
              color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', width: '100%',
            }}>
              {lang === 'de' ? 'Schließen' : 'Close'}
            </button>
          </div>
        )}

        {/* Step: already connected */}
        {step === 'already' && found && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
              padding: '16px', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', background: 'var(--accent)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700, flexShrink: 0,
              }}>
                {getInitials(found)}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{getDisplayName(found)}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{found.email}</div>
              </div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: 8, fontSize: 13, background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.25)', color: 'var(--warning)' }}>
              {lang === 'de'
                ? 'Dieser Client ist bereits mit deinem Konto verbunden.'
                : 'This client is already connected to your account.'}
            </div>

            <button onClick={onClose} style={{
              padding: '11px', borderRadius: 8, fontSize: 14, fontWeight: 500,
              background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
              color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', width: '100%',
            }}>
              {lang === 'de' ? 'Schließen' : 'Close'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const { t, lang } = useTranslation();
  const s = t(dashboard);
  // Stable client — createClient() must not be called on every render
  const supabase = useMemo(() => createClient(), []);

  const [clients,       setClients]       = useState<TrainerClient[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [filter,        setFilter]        = useState<'all' | Status>('all');
  const [showAdd,       setShowAdd]       = useState(false);
  const [activeMenu,    setActiveMenu]    = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [archiveOpen,   setArchiveOpen]   = useState(false);
  const [actionError,   setActionError]   = useState<string | null>(null);

  // Auto-open add modal when navigated with ?new=1
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('new=1')) {
      setShowAdd(true);
      window.history.replaceState({}, '', '/clients');
    }
  }, []);

  // ─── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: tcRows, error } = await supabase
        .from('trainer_clients')
        .select('id, client_id, status, created_at')
        .eq('trainer_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error || !tcRows) { setLoading(false); return; }

      const clientIds = tcRows.map(r => r.client_id);
      if (clientIds.length === 0) { setLoading(false); return; }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, display_name, email')
        .in('id', clientIds);

      const profileMap = new Map((profiles ?? []).map(p => [p.id, p as ClientProfile]));

      setClients(tcRows.map(r => ({
        ...r,
        status: r.status as Status,
        client: profileMap.get(r.client_id) ?? null,
      })));
      setLoading(false);
    }
    load();
  }, []);

  // ─── Actions ───────────────────────────────────────────────────────────────

  async function updateStatus(tcId: string, status: Status) {
    setActionLoading(tcId);
    setActionError(null);

    const { error } = await supabase
      .from('trainer_clients')
      .update({ status })
      .eq('id', tcId);

    if (error) {
      console.error('trainer_clients update failed:', error);
      setActionError(error.message);
    } else {
      setClients(prev => prev.map(c => c.id === tcId ? { ...c, status } : c));
    }
    setActionLoading(null);
    setActiveMenu(null);
  }

  // ─── Derived ───────────────────────────────────────────────────────────────

  const activeClients   = clients.filter(c => c.status !== 'ended');
  const archivedClients = clients.filter(c => c.status === 'ended');

  const counts = {
    all:     activeClients.length,
    active:  activeClients.filter(c => c.status === 'active').length,
    pending: activeClients.filter(c => c.status === 'pending').length,
    paused:  activeClients.filter(c => c.status === 'paused').length,
  };

  const filtered = activeClients.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return getDisplayName(c.client).toLowerCase().includes(q)
          || (c.client?.email.toLowerCase().includes(q) ?? false);
    }
    return true;
  });

  const STATUS_LABEL: Record<Status, string> = {
    active:  lang === 'de' ? 'Aktiv'      : 'Active',
    pending: lang === 'de' ? 'Ausstehend' : 'Pending',
    paused:  lang === 'de' ? 'Pause'      : 'Paused',
    ended:   lang === 'de' ? 'Beendet'    : 'Ended',
  };

  const FILTERS = [
    { key: 'all',     label: lang === 'de' ? `Alle (${counts.all})`           : `All (${counts.all})`         },
    { key: 'active',  label: lang === 'de' ? `Aktiv (${counts.active})`       : `Active (${counts.active})`   },
    { key: 'pending', label: lang === 'de' ? `Ausstehend (${counts.pending})` : `Pending (${counts.pending})` },
    { key: 'paused',  label: lang === 'de' ? `Pause (${counts.paused})`       : `Paused (${counts.paused})`   },
  ];

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <PageShell
        title={s.clients}
        subtitle={lang === 'de' ? 'Verwalte alle deine Klienten.' : 'Manage all your clients.'}
        action={
          <button onClick={() => setShowAdd(true)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600,
            background: 'var(--accent)', color: '#fff', border: 'none',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            {lang === 'de' ? 'Client hinzufügen' : 'Add client'}
          </button>
        }
      >
        {/* Search + filter */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder={lang === 'de' ? 'Name oder E-Mail suchen…' : 'Search name or email…'}
              style={{
                width: '100%', padding: '9px 12px 9px 36px',
                background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
                borderRadius: 8, color: 'var(--text-primary)', fontSize: 14,
                fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key as typeof filter)} style={{
                padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
                border: '1px solid var(--border-strong)', cursor: 'pointer', fontFamily: 'inherit',
                background: filter === f.key ? 'var(--accent)' : 'var(--bg-card)',
                color:      filter === f.key ? '#fff' : 'var(--text-muted)',
              }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Action error */}
        {actionError && (
          <div style={{
            marginBottom: 16, padding: '10px 14px', borderRadius: 8, fontSize: 13,
            background: 'rgba(240,68,68,0.08)', border: '1px solid rgba(240,68,68,0.25)',
            color: 'var(--danger)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0 4px', fontSize: 16 }}>✕</button>
          </div>
        )}

        {/* Spinner */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 56 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '56px 40px', textAlign: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--border-strong)" strokeWidth="1.2" strokeLinecap="round" style={{ display: 'block', margin: '0 auto 14px' }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              {activeClients.length === 0 ? (lang === 'de' ? 'Noch keine Clients' : 'No clients yet') : (lang === 'de' ? 'Keine Treffer' : 'No results')}
            </p>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: activeClients.length === 0 ? 20 : 0 }}>
              {activeClients.length === 0
                ? (lang === 'de' ? 'Füge deinen ersten Client über die Schaltfläche oben hinzu.' : 'Add your first client using the button above.')
                : (lang === 'de' ? 'Andere Suche oder Filter versuchen.' : 'Try a different search or filter.')}
            </p>
            {activeClients.length === 0 && (
              <button onClick={() => setShowAdd(true)} style={{
                padding: '9px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                + {lang === 'de' ? 'Client hinzufügen' : 'Add client'}
              </button>
            )}
          </div>
        )}

        {/* Client list */}
        {!loading && filtered.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(tc => {
              const p = tc.client;
              const isMenuOpen = activeMenu === tc.id;
              const isBusy = actionLoading === tc.id;

              return (
                <div
                  key={tc.id}
                  style={{
                    background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
                    padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16,
                    opacity: isBusy ? 0.5 : 1, transition: 'opacity 0.15s', cursor: 'pointer',
                  }}
                  onClick={() => { if (isMenuOpen) { setActiveMenu(null); return; } if (tc.status === 'active') window.location.href = `/clients/${tc.client_id}`; }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                    background: tc.status === 'paused' ? 'var(--bg-tertiary)' : 'var(--accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 15, fontWeight: 700,
                    color: tc.status === 'paused' ? 'var(--text-subtle)' : '#fff',
                  }}>
                    {getInitials(p)}
                  </div>

                  {/* Name + email */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {getDisplayName(p)}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p?.email}
                    </div>
                  </div>

                  {/* Status pill */}
                  <div style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    color: STATUS_COLOR[tc.status],
                    background: `${STATUS_COLOR[tc.status]}18`,
                    border: `1px solid ${STATUS_COLOR[tc.status]}35`,
                    flexShrink: 0,
                  }}>
                    {STATUS_LABEL[tc.status]}
                  </div>

                  {/* Joined date */}
                  <div style={{ fontSize: 12, color: 'var(--text-subtle)', flexShrink: 0, minWidth: 76, textAlign: 'right' }}>
                    {new Date(tc.created_at).toLocaleDateString(lang === 'de' ? 'de-CH' : 'en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </div>

                  {/* ⋮ menu */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <button
                      onClick={e => { e.stopPropagation(); setActiveMenu(isMenuOpen ? null : tc.id); }}
                      style={{
                        width: 32, height: 32, borderRadius: 6, border: '1px solid var(--border)',
                        background: isMenuOpen ? 'var(--bg-tertiary)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--text-muted)',
                      }}
                      disabled={isBusy}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/>
                      </svg>
                    </button>

                    {isMenuOpen && (
                      <div
                        onClick={e => e.stopPropagation()}
                        style={{
                          position: 'absolute', right: 0, top: 36, zIndex: 50, minWidth: 196,
                          background: 'var(--bg-surface)', border: '1px solid var(--border-strong)',
                          borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                          overflow: 'hidden',
                        }}
                      >
                        {tc.status === 'pending' ? (
                          <MenuItem
                            label={lang === 'de' ? 'Anfrage zurückziehen' : 'Cancel request'}
                            icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                            danger
                            needsConfirm
                            confirmLabel={lang === 'de' ? 'Anfrage wirklich zurückziehen?' : 'Really cancel this request?'}
                            onClick={() => updateStatus(tc.id, 'ended')}
                          />
                        ) : (
                          <>
                            {tc.status === 'paused' ? (
                              <MenuItem
                                label={lang === 'de' ? 'Reaktivieren' : 'Reactivate'}
                                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>}
                                color="var(--success)"
                                onClick={() => updateStatus(tc.id, 'active')}
                              />
                            ) : (
                              <MenuItem
                                label={lang === 'de' ? 'Pausieren' : 'Pause'}
                                icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>}
                                onClick={() => updateStatus(tc.id, 'paused')}
                              />
                            )}
                            <div style={{ height: 1, background: 'var(--border)' }} />
                            <MenuItem
                              label={lang === 'de' ? 'Verbindung trennen' : 'Disconnect'}
                              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>}
                              danger
                              needsConfirm
                              confirmLabel={lang === 'de' ? 'Wirklich trennen?' : 'Really disconnect?'}
                              onClick={() => updateStatus(tc.id, 'ended')}
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Archive ─────────────────────────────────────────────────────── */}
        {!loading && archivedClients.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <button
              onClick={() => setArchiveOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0',
                color: 'var(--text-subtle)', fontFamily: 'inherit',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transition: 'transform 0.2s', transform: archiveOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {lang === 'de' ? `Archiv (${archivedClients.length})` : `Archive (${archivedClients.length})`}
              </span>
            </button>

            {archiveOpen && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {archivedClients.map(tc => {
                  const p = tc.client;
                  const isBusy = actionLoading === tc.id;
                  return (
                    <div key={tc.id} style={{
                      background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12,
                      padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16,
                      opacity: isBusy ? 0.4 : 0.65, transition: 'opacity 0.15s',
                    }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                        background: 'var(--bg-tertiary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: 'var(--text-subtle)',
                      }}>
                        {getInitials(p)}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {getDisplayName(p)}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-subtle)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p?.email}
                        </div>
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--text-subtle)', flexShrink: 0 }}>
                        {new Date(tc.created_at).toLocaleDateString(lang === 'de' ? 'de-CH' : 'en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </div>

                      <button
                        disabled={isBusy}
                        onClick={() => updateStatus(tc.id, 'pending')}
                        title={lang === 'de' ? 'Erneut anfragen' : 'Re-invite'}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                          background: 'var(--bg-tertiary)', border: '1px solid var(--border-strong)',
                          color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                        </svg>
                        {lang === 'de' ? 'Anfragen' : 'Re-invite'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </PageShell>

      {showAdd && (
        <AddClientModal
          lang={lang}
          onClose={() => setShowAdd(false)}
          onAdded={tc => setClients(prev => [tc, ...prev])}
        />
      )}
    </>
  );
}
