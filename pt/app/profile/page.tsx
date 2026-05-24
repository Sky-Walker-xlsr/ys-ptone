'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageShell } from '@/components/PageShell';
import { useTranslation } from '@/locales';
import { dashboard } from '@/locales/dashboard.strings';
import { createClient } from '@/lib/supabase/client';

// ── Shared field components ───────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%', padding: '10px 14px', boxSizing: 'border-box',
  background: 'var(--bg-card)', border: '1px solid var(--border-strong)',
  borderRadius: 8, color: 'var(--text-primary)', fontSize: 14,
  fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.15s',
};

function Inp({ value, onChange, type = 'text', placeholder, disabled, style }: {
  value: string; onChange?: (v: string) => void; type?: string;
  placeholder?: string; disabled?: boolean; style?: React.CSSProperties;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      type={type}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={e => onChange?.(e.target.value)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{ ...inputBase, borderColor: focus ? 'var(--accent)' : 'var(--border-strong)', opacity: disabled ? 0.55 : 1, ...style }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 4 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{ ...inputBase, resize: 'vertical', lineHeight: 1.6, borderColor: focus ? 'var(--accent)' : 'var(--border-strong)' }}
    />
  );
}

function Label({ text, hint }: { text: string; hint?: string }) {
  return (
    <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
      {text}
      {hint && <span style={{ fontWeight: 400, color: 'var(--text-subtle)', marginLeft: 6 }}>{hint}</span>}
    </label>
  );
}

function F({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label text={label} hint={hint} />
      {children}
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', flexShrink: 0,
        background: on ? 'var(--accent)' : 'var(--bg-tertiary)',
        position: 'relative', transition: 'background 0.2s',
      }}
    >
      <span style={{
        display: 'block', width: 18, height: 18, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3, left: on ? 23 : 3, transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
      }} />
    </button>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0 28px' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-subtle)' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

function SaveRow({ saving, saved, error, onSave, viewHref, lang }: {
  saving: boolean; saved: boolean; error: boolean;
  onSave?: () => void; viewHref?: string; lang: string;
}) {
  const de = lang === 'de';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <button
        type={onSave ? 'button' : 'submit'}
        onClick={onSave}
        disabled={saving}
        style={{
          padding: '10px 22px', borderRadius: 8, fontSize: 14, fontWeight: 600,
          background: saved ? 'var(--success)' : 'var(--accent)',
          color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', transition: 'background 0.2s', opacity: saving ? 0.7 : 1,
        }}
      >
        {saved   ? `✓ ${de ? 'Gespeichert' : 'Saved'}`
         : saving ? (de ? 'Speichern…' : 'Saving…')
         :          (de ? 'Speichern'  : 'Save')}
      </button>
      {error && <span style={{ fontSize: 13, color: 'var(--danger)' }}>{de ? 'Fehler beim Speichern' : 'Error saving'}</span>}
      {viewHref && (
        <a href={viewHref} target="_blank" rel="noopener noreferrer" style={{
          marginLeft: 'auto', fontSize: 12, color: 'var(--accent)', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          {de ? 'Profil ansehen' : 'View profile'}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      )}
    </div>
  );
}

// ── Public profile form ───────────────────────────────────────────────────────

interface PtForm {
  slug:            string;
  isPublic:        boolean;
  shortBio:        string;
  longBio:         string;
  location:        string;
  contactEmail:    string;
  languages:       string;
  specializations: string;
  certifications:  string;
  yearsExp:        string;
  availability:    string;
  priceFrom:       string;
  color:           string;
  focusAreas:      { title: string; desc: string }[];
}

const PT_EMPTY: PtForm = {
  slug: '', isPublic: false, shortBio: '', longBio: '', location: '',
  contactEmail: '', languages: '', specializations: '', certifications: '',
  yearsExp: '', availability: '', priceFrom: '', color: '#7c6aff', focusAreas: [],
};

function PublicProfileForm({ userId, lang }: { userId: string; lang: string }) {
  const [form,    setForm]   = useState<PtForm>(PT_EMPTY);
  const [loaded,  setLoaded] = useState(false);
  const [saving,  setSaving] = useState(false);
  const [saved,   setSaved]  = useState(false);
  const [error,   setError]  = useState(false);
  const de = lang === 'de';

  useEffect(() => {
    const supabase = createClient();
    supabase.from('pt_profiles').select('*').eq('id', userId).maybeSingle().then(({ data }) => {
      if (data) {
        setForm({
          slug:            data.slug ?? '',
          isPublic:        data.is_public ?? false,
          shortBio:        data.short_bio ?? '',
          longBio:         data.long_bio ?? '',
          location:        data.location ?? '',
          contactEmail:    data.contact_email ?? '',
          languages:       (data.languages ?? []).join(', '),
          specializations: (data.specializations ?? []).join(', '),
          certifications:  (data.certifications ?? []).join('\n'),
          yearsExp:        data.years_experience != null ? String(data.years_experience) : '',
          availability:    data.availability ?? '',
          priceFrom:       data.price_from ?? '',
          color:           data.color ?? '#7c6aff',
          focusAreas:      data.focus_areas ?? [],
        });
      }
      setLoaded(true);
    });
  }, [userId]);

  const set = useCallback(<K extends keyof PtForm>(key: K, val: PtForm[K]) => {
    setForm(f => ({ ...f, [key]: val }));
  }, []);

  const setFA = (i: number, field: 'title' | 'desc', val: string) =>
    setForm(f => { const a = [...f.focusAreas]; a[i] = { ...a[i], [field]: val }; return { ...f, focusAreas: a }; });

  const removeFA = (i: number) =>
    setForm(f => ({ ...f, focusAreas: f.focusAreas.filter((_, idx) => idx !== i) }));

  const save = async () => {
    setSaving(true); setError(false);
    const toArr = (s: string) => s.split(/[,\n]/).map(x => x.trim()).filter(Boolean);
    const supabase = createClient();
    const { error: err } = await supabase.from('pt_profiles').upsert({
      id:              userId,
      slug:            form.slug.trim() || null,
      is_public:       form.isPublic,
      short_bio:       form.shortBio.trim() || null,
      long_bio:        form.longBio.trim() || null,
      location:        form.location.trim() || null,
      contact_email:   form.contactEmail.trim() || null,
      languages:       toArr(form.languages),
      specializations: toArr(form.specializations),
      certifications:  toArr(form.certifications),
      years_experience: form.yearsExp !== '' ? Number(form.yearsExp) : null,
      availability:    form.availability.trim() || null,
      price_from:      form.priceFrom.trim() || null,
      color:           form.color || '#7c6aff',
      focus_areas:     form.focusAreas.filter(fa => fa.title.trim()),
      updated_at:      new Date().toISOString(),
    }, { onConflict: 'id' });
    setSaving(false);
    if (err) { setError(true); } else { setSaved(true); setTimeout(() => setSaved(false), 2500); }
  };

  if (!loaded) return <div style={{ fontSize: 13, color: 'var(--text-subtle)', padding: '8px 0' }}>{de ? 'Laden…' : 'Loading…'}</div>;

  const gap = 18;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>

      {/* Public toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
            {de ? 'Profil öffentlich' : 'Public profile'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 2 }}>
            {de ? 'Auf der Trainer-Seite anzeigen' : 'Show on the trainer directory'}
          </div>
        </div>
        <Toggle on={form.isPublic} onToggle={() => set('isPublic', !form.isPublic)} />
      </div>

      {/* Slug */}
      <F label="Slug (URL)" hint={form.slug ? `ptone.app/pt/${form.slug}` : undefined}>
        <Inp value={form.slug} placeholder="yannick-salm"
          onChange={v => set('slug', v.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} />
      </F>

      {/* Short bio */}
      <F label={de ? 'Kurzbeschreibung' : 'Short bio'} hint={`${form.shortBio.length}/160`}>
        <Textarea rows={3} value={form.shortBio}
          placeholder={de ? 'Kurze Beschreibung (max. 160 Zeichen)…' : 'Short description (max 160 chars)…'}
          onChange={v => set('shortBio', v.slice(0, 160))} />
      </F>

      {/* Long bio */}
      <F label={de ? 'Über mich' : 'About me'}>
        <Textarea rows={7} value={form.longBio}
          placeholder={de ? 'Ausführliche Beschreibung…' : 'Full bio…'}
          onChange={v => set('longBio', v)} />
      </F>

      {/* Location + Email */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <F label={de ? 'Standort' : 'Location'}>
          <Inp value={form.location} placeholder="Zürich, CH" onChange={v => set('location', v)} />
        </F>
        <F label={de ? 'Kontakt-E-Mail' : 'Contact email'}>
          <Inp type="email" value={form.contactEmail} placeholder="trainer@example.com" onChange={v => set('contactEmail', v)} />
        </F>
      </div>

      {/* Years + Availability + Price */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <F label={de ? 'Jahre Erfahrung' : 'Years experience'}>
          <Inp type="number" value={form.yearsExp} placeholder="6" onChange={v => set('yearsExp', v)} />
        </F>
        <F label={de ? 'Verfügbarkeit' : 'Availability'}>
          <Inp value={form.availability} placeholder="Mo–Fr, 6–20 Uhr" onChange={v => set('availability', v)} />
        </F>
        <F label={de ? 'Preis ab' : 'Price from'}>
          <Inp value={form.priceFrom} placeholder="ab CHF 85/h" onChange={v => set('priceFrom', v)} />
        </F>
      </div>

      {/* Color */}
      <F label={de ? 'Profilfarbe' : 'Profile color'}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="color" value={form.color} onChange={e => set('color', e.target.value)}
            style={{ width: 42, height: 40, borderRadius: 8, border: '1px solid var(--border-strong)', cursor: 'pointer', padding: 3, background: 'var(--bg-card)', flexShrink: 0 }} />
          <Inp value={form.color} placeholder="#7c6aff" style={{ fontFamily: 'monospace', maxWidth: 120 }} onChange={v => set('color', v)} />
          <div style={{ width: 40, height: 40, borderRadius: 8, background: form.color, border: '1px solid var(--border-strong)', flexShrink: 0 }} />
        </div>
      </F>

      {/* Languages + Specializations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <F label={de ? 'Sprachen (kommagetrennt)' : 'Languages (comma-separated)'}>
          <Inp value={form.languages} placeholder="DE, EN" onChange={v => set('languages', v)} />
        </F>
        <F label={de ? 'Spezialisierungen (kommagetrennt)' : 'Specialisations (comma-separated)'}>
          <Inp value={form.specializations} placeholder="Muskelaufbau, Gewichtsabnahme" onChange={v => set('specializations', v)} />
        </F>
      </div>

      {/* Certifications */}
      <F label={de ? 'Zertifikate (eine pro Zeile)' : 'Certifications (one per line)'}>
        <Textarea rows={5} value={form.certifications}
          placeholder={de ? 'Swiss PT Zertifizierung\nErnährungsberatung IHK\nKettlebell Coach SFG' : 'Swiss PT Certification\nNutrition Coach IHK'}
          onChange={v => set('certifications', v)} />
      </F>

      {/* Focus areas */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Label text={de ? 'Schwerpunkte' : 'Focus areas'} />
          <button type="button"
            onClick={() => set('focusAreas', [...form.focusAreas, { title: '', desc: '' }])}
            style={{ fontSize: 12, padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
          >
            + {de ? 'Hinzufügen' : 'Add'}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {form.focusAreas.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-subtle)', padding: '16px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 8 }}>
              {de ? 'Noch keine Schwerpunkte – füge welche hinzu.' : 'No focus areas yet — add some above.'}
            </div>
          ) : form.focusAreas.map((fa, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: 14, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Inp value={fa.title} placeholder={de ? 'Titel z.B. Muskelaufbau' : 'Title e.g. Muscle building'} style={{ fontWeight: 500 }} onChange={v => setFA(i, 'title', v)} />
                <Textarea rows={3} value={fa.desc} placeholder={de ? 'Kurze Beschreibung…' : 'Short description…'} onChange={v => setFA(i, 'desc', v)} />
              </div>
              <button type="button" onClick={() => removeFA(i)} style={{
                padding: '7px 9px', borderRadius: 7, border: '1px solid rgba(239,68,68,0.25)',
                background: 'rgba(239,68,68,0.06)', color: 'var(--danger)', cursor: 'pointer', flexShrink: 0,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      <SaveRow saving={saving} saved={saved} error={error} onSave={save}
        viewHref={form.slug ? `/pt/${form.slug}` : undefined} lang={lang} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { t, lang } = useTranslation();
  const s = t(dashboard);
  const de = lang === 'de';

  const [profile, setProfile] = useState<{ first_name: string; last_name: string; display_name: string; email: string } | null>(null);
  const [userId,  setUserId]  = useState<string | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setUserId(session.user.id);
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name, display_name, email')
        .eq('id', session.user.id)
        .single();
      if (data) setProfile(data);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !userId) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('profiles').update({
      first_name:   profile.first_name,
      last_name:    profile.last_name,
      display_name: profile.display_name || `${profile.first_name} ${profile.last_name}`.trim(),
    }).eq('id', userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const labelStyle: React.CSSProperties = { fontSize: 13, fontWeight: 500, color: 'var(--text-muted)', display: 'block', marginBottom: 6 };

  const initials = profile
    ? ((profile.first_name?.[0] ?? '') + (profile.last_name?.[0] ?? '')).toUpperCase() || '?'
    : '?';

  return (
    <PageShell title={s.profile} subtitle={de ? 'Deine persönlichen Informationen.' : 'Your personal information.'}>
      <div style={{ maxWidth: 580 }}>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
              {profile?.display_name || `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() || '—'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{profile?.email ?? '—'}</div>
          </div>
        </div>

        {/* Basic profile form */}
        {profile && (
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>{de ? 'Vorname' : 'First name'}</label>
                <Inp value={profile.first_name ?? ''} onChange={v => setProfile(p => p ? { ...p, first_name: v } : p)} />
              </div>
              <div>
                <label style={labelStyle}>{de ? 'Nachname' : 'Last name'}</label>
                <Inp value={profile.last_name ?? ''} onChange={v => setProfile(p => p ? { ...p, last_name: v } : p)} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>{de ? 'Anzeigename' : 'Display name'}</label>
              <Inp value={profile.display_name ?? ''} onChange={v => setProfile(p => p ? { ...p, display_name: v } : p)} />
            </div>
            <div>
              <label style={labelStyle}>{de ? 'E-Mail' : 'Email'}</label>
              <Inp value={profile.email} disabled />
              <p style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 4 }}>
                {de ? 'E-Mail kann nicht geändert werden.' : 'Email cannot be changed.'}
              </p>
            </div>
            <SaveRow saving={saving} saved={saved} error={false} lang={lang} />
          </form>
        )}

        {/* Public profile section */}
        {userId && (
          <>
            <Divider label={de ? 'Öffentliches Profil' : 'Public profile'} />
            <PublicProfileForm userId={userId} lang={lang} />
          </>
        )}
      </div>
    </PageShell>
  );
}
