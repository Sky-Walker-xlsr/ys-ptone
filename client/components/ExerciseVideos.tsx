'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Video {
  id: string;
  title: string;
  description: string | null;
  storage_path: string;
  file_name: string;
  created_at: string;
}

interface Props {
  exerciseId: string; // UUID from exercises table
}

export default function ExerciseVideos({ exerciseId }: Props) {
  const supabase = createClient();
  const [videos,     setVideos]     = useState<Video[]>([]);
  const [loaded,     setLoaded]     = useState(false);
  const [open,       setOpen]       = useState(false);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const [playingId,  setPlayingId]  = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!exerciseId) return;
    supabase
      .from('pt_exercise_videos')
      .select('id, title, description, storage_path, file_name, created_at')
      .eq('exercise_id', exerciseId)
      .then(({ data }) => {
        setVideos((data ?? []) as Video[]);
        setLoaded(true);
      });
  }, [exerciseId]);

  if (!loaded || videos.length === 0) return null;

  async function play(v: Video) {
    if (playingId === v.id) { setPlayingId(null); setPlayingUrl(null); return; }
    setLoadingUrl(v.id);
    const { data } = await supabase.storage.from('pt_videos').createSignedUrl(v.storage_path, 3600);
    if (data?.signedUrl) { setPlayingUrl(data.signedUrl); setPlayingId(v.id); }
    setLoadingUrl(null);
  }

  return (
    <div style={{ marginTop: 8, borderTop: '1px solid rgba(124,106,255,0.15)', paddingTop: 8 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', width: '100%', textAlign: 'left', fontFamily: 'inherit' }}
      >
        <span style={{ fontSize: 14 }}>📹</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(124,106,255,0.9)' }}>
          {videos.length} {videos.length === 1 ? 'Video' : 'Videos'} von deinem PT
        </span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.3)', transition: 'transform 0.15s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </button>

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {videos.map(v => (
            <div key={v.id} style={{ background: 'rgba(124,106,255,0.08)', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(124,106,255,0.15)' }}>
              {/* Video player */}
              {playingId === v.id && playingUrl && (
                <video
                  src={playingUrl}
                  controls
                  autoPlay
                  playsInline
                  style={{ width: '100%', maxHeight: 280, background: '#000', display: 'block' }}
                />
              )}

              {/* Info row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.title || v.file_name}
                  </div>
                  {v.description && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{v.description}</div>
                  )}
                </div>
                <button
                  onClick={() => play(v)}
                  disabled={loadingUrl === v.id}
                  style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, flexShrink: 0,
                    background: playingId === v.id ? 'rgba(124,106,255,0.3)' : 'rgba(124,106,255,0.15)',
                    color: 'rgba(124,106,255,0.9)',
                    border: '1px solid rgba(124,106,255,0.25)',
                    cursor: loadingUrl === v.id ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {loadingUrl === v.id ? '…' : playingId === v.id ? '⏸ Stop' : '▶ Play'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
