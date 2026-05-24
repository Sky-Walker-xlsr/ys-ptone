'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageShell } from '@/components/PageShell';
import { useTranslation } from '@/locales';
import { dashboard } from '@/locales/dashboard.strings';
import { createClient } from '@/lib/supabase/client';

interface ContactRequest {
  id: string;
  name: string;
  email: string;
  message: string | null;
  read: boolean;
  created_at: string;
}

function formatDate(iso: string, lang: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(lang === 'de' ? 'de-DE' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function MailIcon({ open }: { open?: boolean }) {
  return open
    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
}

export default function InboxPage() {
  const { t, lang } = useTranslation();
  const s = t(dashboard);
  const [tab, setTab]         = useState<'all' | 'unread'>('all');
  const [requests, setReqs]   = useState<ContactRequest[]>([]);
  const [expanded, setExp]    = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('contact_requests')
      .select('id, name, email, message, read, created_at')
      .order('created_at', { ascending: false });
    setReqs(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = useCallback(async (id: string) => {
    setReqs(prev => prev.map(r => r.id === id ? { ...r, read: true } : r));
    const supabase = createClient();
    await supabase.from('contact_requests').update({ read: true }).eq('id', id);
  }, []);

  const handleExpand = (id: string, alreadyRead: boolean) => {
    setExp(prev => prev === id ? null : id);
    if (!alreadyRead) markRead(id);
  };

  const handleDelete = async (id: string) => {
    setReqs(prev => prev.filter(r => r.id !== id));
    if (expanded === id) setExp(null);
    const supabase = createClient();
    await supabase.from('contact_requests').delete().eq('id', id);
  };

  const tabs = [
    { key: 'all',    label: lang === 'de' ? 'Alle'      : 'All'    },
    { key: 'unread', label: lang === 'de' ? 'Ungelesen' : 'Unread' },
  ];

  const visible = tab === 'unread' ? requests.filter(r => !r.read) : requests;
  const unreadCount = requests.filter(r => !r.read).length;

  return (
    <PageShell
      title={s.inbox}
      subtitle={lang === 'de' ? 'Anfragen von Interessenten.' : 'Requests from prospective clients.'}
    >
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
        {tabs.map(tb => (
          <button key={tb.key} onClick={() => setTab(tb.key as typeof tab)} style={{
            padding: '8px 16px', fontSize: 14, fontWeight: tab === tb.key ? 600 : 400,
            color: tab === tb.key ? 'var(--accent)' : 'var(--text-muted)',
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: `2px solid ${tab === tb.key ? 'var(--accent)' : 'transparent'}`,
            marginBottom: -1, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {tb.label}
            {tb.key === 'unread' && unreadCount > 0 && (
              <span style={{
                minWidth: 18, height: 18, borderRadius: 9, background: 'var(--accent)',
                color: '#fff', fontSize: 11, fontWeight: 700, display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center', padding: '0 5px',
              }}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          {lang === 'de' ? 'Laden…' : 'Loading…'}
        </div>
      ) : visible.length === 0 ? (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <div style={{ marginBottom: 16, opacity: 0.3 }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
            </svg>
          </div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
            {lang === 'de' ? 'Keine Nachrichten' : 'No messages'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {tab === 'unread'
              ? (lang === 'de' ? 'Alle Nachrichten wurden gelesen.' : 'All messages have been read.')
              : (lang === 'de' ? 'Noch keine Anfragen eingegangen.' : 'No requests received yet.')}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {visible.map(req => {
            const isOpen = expanded === req.id;
            return (
              <div key={req.id} style={{
                borderRadius: 10,
                border: `1px solid ${isOpen ? 'var(--border-strong)' : 'var(--border)'}`,
                background: req.read ? 'var(--bg-card)' : 'rgba(124,106,255,0.04)',
                overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}>
                {/* Header row */}
                <button
                  onClick={() => handleExpand(req.id, req.read)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                  }}
                >
                  {/* Unread dot */}
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: req.read ? 'transparent' : 'var(--accent)',
                  }} />

                  <span style={{ color: 'var(--text-muted)', flexShrink: 0, opacity: 0.7 }}>
                    <MailIcon open={isOpen} />
                  </span>

                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: req.read ? 400 : 600, fontSize: 14, color: 'var(--text-primary)' }}>
                      {req.name}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 8 }}>
                      {req.email}
                    </span>
                    {!isOpen && req.message && (
                      <span style={{ display: 'block', fontSize: 13, color: 'var(--text-subtle)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {req.message}
                      </span>
                    )}
                  </span>

                  <span style={{ fontSize: 12, color: 'var(--text-subtle)', flexShrink: 0 }}>
                    {formatDate(req.created_at, lang)}
                  </span>

                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    style={{ flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none', opacity: 0.5 }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {/* Expanded body */}
                {isOpen && (
                  <div style={{ padding: '0 16px 16px 44px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ paddingTop: 14 }}>
                      <div style={{ fontSize: 13, color: 'var(--text-subtle)', marginBottom: 8, fontWeight: 500 }}>
                        {lang === 'de' ? 'Nachricht' : 'Message'}
                      </div>
                      <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7, margin: 0 }}>
                        {req.message || <span style={{ color: 'var(--text-subtle)', fontStyle: 'italic' }}>{lang === 'de' ? 'Keine Nachricht' : 'No message'}</span>}
                      </p>

                      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                        <a
                          href={`mailto:${req.email}`}
                          className="btn btn-primary"
                          style={{ fontSize: 13, padding: '7px 14px' }}
                        >
                          {lang === 'de' ? 'Antworten' : 'Reply'}
                        </a>
                        {!req.read && (
                          <button
                            onClick={() => markRead(req.id)}
                            style={{
                              fontSize: 13, padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)',
                              background: 'var(--bg-tertiary)', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit',
                            }}
                          >
                            {lang === 'de' ? 'Als gelesen markieren' : 'Mark as read'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(req.id)}
                          style={{
                            fontSize: 13, padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.3)',
                            background: 'rgba(239,68,68,0.06)', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit', marginLeft: 'auto',
                          }}
                        >
                          {lang === 'de' ? 'Löschen' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
