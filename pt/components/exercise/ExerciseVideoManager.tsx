'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/locales';

interface Video {
  id: string;
  title: string;
  description: string | null;
  storage_path: string;
  file_name: string;
  file_size_bytes: number | null;
  created_at: string;
}

interface Props {
  exerciseId: string;           // UUID from exercises table
  exerciseName: string;
  ptId: string;
  onClose: () => void;
}

function fmtBytes(b: number | null) {
  if (!b) return '';
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function fmtDate(iso: string, de: boolean) {
  return new Date(iso).toLocaleDateString(de ? 'de-CH' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ExerciseVideoManager({ exerciseId, exerciseName, ptId, onClose }: Props) {
  const { lang } = useTranslation();
  const de = lang === 'de';
  const supabase = createClient();
  const fileRef  = useRef<HTMLInputElement>(null);

  const [videos,     setVideos]     = useState<Video[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [uploading,  setUploading]  = useState(false);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [playingId,  setPlayingId]  = useState<string | null>(null);
  const [deleting,   setDeleting]   = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [descDraft,  setDescDraft]  = useState('');
  const [error,      setError]      = useState('');

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('pt_exercise_videos')
      .select('id, title, description, storage_path, file_name, file_size_bytes, created_at')
      .eq('exercise_id', exerciseId)
      .eq('pt_id', ptId)
      .order('created_at', { ascending: false });
    setVideos((data ?? []) as Video[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, [exerciseId]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    if (!file.type.startsWith('video/')) {
      setError(de ? 'Bitte nur Videodateien hochladen.' : 'Please upload video files only.');
      return;
    }
    setUploading(true); setError('');
    const ts   = Date.now();
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${ptId}/${exerciseId}/${ts}_${safe}`;
    const { error: upErr } = await supabase.storage.from('pt_videos').upload(path, file, { contentType: file.type });
    if (upErr) { setError(upErr.message); setUploading(false); return; }
    await supabase.from('pt_exercise_videos').insert({
      pt_id:          ptId,
      exercise_id:    exerciseId,
      title:          titleDraft.trim() || file.name,
      description:    descDraft.trim() || null,
      storage_path:   path,
      file_name:      file.name,
      file_size_bytes:file.size,
      mime_type:      file.type,
    });
    setTitleDraft(''); setDescDraft('');
    await load();
    setUploading(false);
  }

  async function playVideo(video: Video) {
    if (playingId === video.id) { setPlayingId(null); setPlayingUrl(null); return; }
    const { data } = await supabase.storage.from('pt_videos').createSignedUrl(video.storage_path, 3600);
    if (data?.signedUrl) { setPlayingUrl(data.signedUrl); setPlayingId(video.id); }
  }

  async function deleteVideo(video: Video) {
    if (!confirm(de ? `Video "${video.title}" wirklich löschen?` : `Really delete "${video.title}"?`)) return;
    setDeleting(video.id);
    await supabase.storage.from('pt_videos').remove([video.storage_path]);
    await supabase.from('pt_exercise_videos').delete().eq('id', video.id);
    if (playingId === video.id) { setPlayingUrl(null); setPlayingId(null); }
    setVideos(p => p.filter(v => v.id !== video.id));
    setDeleting(null);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 11px', borderRadius: 7, fontSize: 13,
    background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
    color: 'var(--text-primary)', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none',
  };

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>📹 {de ? 'Videos' : 'Videos'}</h3>
            <p style={{ fontSize: 12, color: 'var(--text-subtle)', margin: '2px 0 0' }}>{exerciseName}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>×</button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Upload form */}
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {de ? 'Video hochladen' : 'Upload video'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <input
                value={titleDraft} onChange={e => setTitleDraft(e.target.value)}
                placeholder={de ? 'Titel (optional)' : 'Title (optional)'}
                style={{ ...inputStyle, gridColumn: '1 / -1' }}
              />
              <input
                value={descDraft} onChange={e => setDescDraft(e.target.value)}
                placeholder={de ? 'Beschreibung (optional)' : 'Description (optional)'}
                style={{ ...inputStyle, gridColumn: '1 / -1' }}
              />
            </div>
            {error && <div style={{ fontSize: 12, color: 'var(--danger)' }}>⚠ {error}</div>}
            <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleUpload} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{ padding: '9px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--accent)', color: '#fff', border: 'none', cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: uploading ? 0.6 : 1 }}
            >
              {uploading ? (de ? 'Hochladen…' : 'Uploading…') : `📤 ${de ? 'Video auswählen' : 'Select video'}`}
            </button>
          </div>

          {/* Video list */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-subtle)', fontSize: 13 }}>…</div>
          ) : videos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-subtle)', fontSize: 13 }}>
              {de ? 'Noch keine Videos für diese Übung.' : 'No videos for this exercise yet.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {videos.map(v => (
                <div key={v.id} style={{ background: 'var(--bg-tertiary)', borderRadius: 10, overflow: 'hidden', border: `1px solid ${playingId === v.id ? 'var(--accent)' : 'var(--border)'}` }}>
                  {/* Video player */}
                  {playingId === v.id && playingUrl && (
                    <video
                      src={playingUrl} controls autoPlay
                      style={{ width: '100%', maxHeight: 240, background: '#000', display: 'block' }}
                    />
                  )}
                  {/* Video info row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title || v.file_name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 1 }}>
                        {fmtDate(v.created_at, de)}{v.file_size_bytes ? ` · ${fmtBytes(v.file_size_bytes)}` : ''}
                      </div>
                      {v.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{v.description}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => playVideo(v)}
                        style={{ padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: playingId === v.id ? 'var(--accent-muted)' : 'var(--bg-card)', color: playingId === v.id ? 'var(--accent)' : 'var(--text-muted)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        {playingId === v.id ? '⏸ Stop' : '▶ Play'}
                      </button>
                      <button
                        onClick={() => deleteVideo(v)}
                        disabled={deleting === v.id}
                        style={{ padding: '6px 10px', borderRadius: 7, fontSize: 12, background: 'rgba(240,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(240,68,68,0.2)', cursor: 'pointer', fontFamily: 'inherit', opacity: deleting === v.id ? 0.5 : 1 }}
                      >
                        {deleting === v.id ? '…' : '✕'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
