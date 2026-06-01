'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageShell } from '@/components/PageShell';
import { useTranslation } from '@/locales';
import { dashboard } from '@/locales/dashboard.strings';

type Section   = 'my_files' | 'videos' | 'clients';
type ClientSub = 'documents' | 'invoices';

interface PtFile {
  id: string; trainer_id: string; client_id: string | null;
  name: string; storage_path: string; size_bytes: number | null;
  mime_type: string | null; section: string; subfolder: string | null;
  created_at: string;
}
interface ClientRecord { id: string; name: string }
interface PtFolder { id: string; trainer_id: string; client_id: string; name: string; created_at: string }
interface AccInvoice {
  id: string; invoice_number: string; title: string; status: string;
  issue_date: string; due_date: string | null; total: number; pdf_url: string | null; created_at: string;
}

function fmtBytes(b: number | null): string {
  if (!b) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: 'numeric' });
}
function safeName(n: string) { return n.replace(/[^a-zA-Z0-9._-]/g, '_'); }

const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: '12px 18px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
  fontSize: 14, fontWeight: active ? 600 : 400,
  color: active ? 'var(--accent)' : 'var(--text-muted)',
  borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
  marginBottom: -1, transition: 'color 0.15s', whiteSpace: 'nowrap' as const,
});

// ─── FileRow ──────────────────────────────────────────────────────────────────
function FileRow({ file, onDownload, onDelete, dlId, delId, indent = false }: {
  file: PtFile;
  onDownload: (f: PtFile) => void; onDelete: (f: PtFile) => void;
  dlId: string | null; delId: string | null; indent?: boolean;
}) {
  const ext  = file.name.split('.').pop()?.toLowerCase() ?? '';
  const icon = file.section === 'videos' ? '🎬'
    : ['pdf'].includes(ext) ? '📄'
    : ['jpg','jpeg','png','gif','webp'].includes(ext) ? '🖼️'
    : ['xls','xlsx','csv'].includes(ext) ? '📊' : '📄';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: `11px ${indent ? 28 : 14}px`, borderTop: '1px solid var(--border)', background: indent ? 'rgba(124,106,255,0.04)' : 'transparent' }}>
      <span style={{ fontSize: 17, flexShrink: 0 }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
        <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 1 }}>{fmtBytes(file.size_bytes)} · {fmtDate(file.created_at)}</div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button onClick={() => onDownload(file)} disabled={dlId === file.id} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-page)', color: 'var(--text-primary)', fontSize: 12, cursor: dlId === file.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: dlId === file.id ? 0.5 : 1 }}>
          {dlId === file.id ? '…' : '↓'}
        </button>
        <button onClick={() => onDelete(file)} disabled={delId === file.id} style={{ padding: '5px 9px', borderRadius: 7, border: '1px solid rgba(240,68,68,0.25)', background: 'rgba(240,68,68,0.06)', color: 'var(--danger)', fontSize: 12, cursor: delId === file.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: delId === file.id ? 0.5 : 1 }}>
          {delId === file.id ? '…' : '✕'}
        </button>
      </div>
    </div>
  );
}

// ─── FolderTree ───────────────────────────────────────────────────────────────
function FolderTree({ folders, allFiles, onDownload, onDelete, onUpload, onDeleteFolder, lang, dlId, delId, uploading, showNewFolder, newFolderName, creatingFolder, setNewFolderName, setShowNewFolder, handleCreateFolder, onNewFolder }: {
  folders: PtFolder[]; allFiles: PtFile[];
  onDownload: (f: PtFile) => void; onDelete: (f: PtFile) => void;
  onUpload: (target: string | null) => void; onDeleteFolder: (f: PtFolder) => void;
  lang: string; dlId: string | null; delId: string | null; uploading: boolean;
  showNewFolder: boolean; newFolderName: string; creatingFolder: boolean;
  setNewFolderName: (v: string) => void; setShowNewFolder: (v: boolean) => void;
  handleCreateFolder: () => void; onNewFolder: () => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const de = lang === 'de';
  function toggle(name: string) {
    setExpanded(p => { const n = new Set(p); n.has(name) ? n.delete(name) : n.add(name); return n; });
  }
  const rootFiles = allFiles.filter(f => !f.subfolder);

  return (
    <div>
      {/* Root */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 6, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderBottom: rootFiles.length > 0 ? '1px solid var(--border)' : 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>📂</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>{de ? 'Stammdokumente' : 'Root'}</span>
            <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>({rootFiles.length})</span>
          </div>
          <button onClick={() => onUpload(null)} disabled={uploading} style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            + Upload
          </button>
        </div>
        {rootFiles.map(f => <FileRow key={f.id} file={f} onDownload={onDownload} onDelete={onDelete} dlId={dlId} delId={delId} />)}
      </div>

      {/* Folders */}
      {folders.map(folder => {
        const isExpanded = expanded.has(folder.name);
        const folderFiles = allFiles.filter(f => f.subfolder === folder.name);
        return (
          <div key={folder.id} style={{ marginBottom: 6 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: isExpanded ? '10px 10px 0 0' : 10, display: 'flex', alignItems: 'center' }}>
              <button onClick={() => toggle(folder.name)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}>
                <svg style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.18s', flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                <span style={{ fontSize: 17 }}>{isExpanded ? '📂' : '📁'}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{folder.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-subtle)' }}>({folderFiles.length})</span>
              </button>
              <button onClick={() => onUpload(folder.name)} disabled={uploading} style={{ padding: '10px 12px', background: 'none', border: 'none', borderLeft: '1px solid var(--border)', color: 'var(--accent)', fontSize: 12, cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                + Upload
              </button>
              <button onClick={() => onDeleteFolder(folder)} style={{ padding: '10px 12px', background: 'none', border: 'none', borderLeft: '1px solid var(--border)', color: 'var(--danger)', fontSize: 13, cursor: 'pointer' }}>
                ✕
              </button>
            </div>
            {isExpanded && (
              <div style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 10px 10px', background: 'var(--bg-card)', overflow: 'hidden' }}>
                {folderFiles.length === 0
                  ? <div style={{ padding: '18px', fontSize: 13, color: 'var(--text-subtle)', textAlign: 'center' }}>{de ? 'Noch keine Dateien in diesem Ordner.' : 'No files in this folder yet.'}</div>
                  : folderFiles.map(f => <FileRow key={f.id} file={f} onDownload={onDownload} onDelete={onDelete} dlId={dlId} delId={delId} indent />)
                }
              </div>
            )}
          </div>
        );
      })}

      {showNewFolder ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <input type="text" value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateFolder()} placeholder={de ? 'Ordnername…' : 'Folder name…'} autoFocus style={{ flex: 1, padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }} />
          <button onClick={handleCreateFolder} disabled={creatingFolder || !newFolderName.trim()} style={{ padding: '8px 14px', borderRadius: 9, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{creatingFolder ? '…' : de ? 'Erstellen' : 'Create'}</button>
          <button onClick={() => { setShowNewFolder(false); setNewFolderName(''); }} style={{ padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'none', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
        </div>
      ) : (
        <button onClick={onNewFolder} style={{ width: '100%', marginTop: 8, padding: '9px', borderRadius: 10, background: 'none', border: '1px dashed var(--border-strong)', color: 'var(--accent)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          + {de ? 'Neuer Ordner' : 'New folder'}
        </button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DrivePage() {
  const { t, lang } = useTranslation();
  const s  = t(dashboard);
  const sb = useMemo(() => createClient(), []);
  const de = lang === 'de';

  const [userId,         setUserId]         = useState<string | null>(null);
  const [section,        setSection]        = useState<Section>('my_files');
  const [clients,        setClients]        = useState<ClientRecord[]>([]);
  const [clientSearch,   setClientSearch]   = useState('');
  const [selClient,      setSelClient]      = useState<string>('');
  const [clientSub,      setClientSub]      = useState<ClientSub>('documents');
  const [files,          setFiles]          = useState<PtFile[]>([]);
  const [folders,        setFolders]        = useState<PtFolder[]>([]);
  const [accInvoices,    setAccInvoices]    = useState<AccInvoice[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [uploading,      setUploading]      = useState(false);
  const [uploadTarget,   setUploadTarget]   = useState<string | null>(null);
  const [dlId,           setDlId]           = useState<string | null>(null);
  const [delId,          setDelId]          = useState<string | null>(null);
  const [showNewFolder,  setShowNewFolder]  = useState(false);
  const [newFolderName,  setNewFolderName]  = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function init() {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return;
      const uid = session.user.id;
      setUserId(uid);
      const { data: tc } = await sb.from('trainer_clients').select('client_id').eq('trainer_id', uid).eq('status', 'active');
      if (tc?.length) {
        const { data: profs } = await sb.from('profiles').select('id, first_name, last_name, display_name, email').in('id', tc.map((r: any) => r.client_id));
        setClients((profs ?? []).map((p: any) => ({ id: p.id, name: p.display_name || `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim() || p.email })));
      }
    }
    init();
  }, []);

  const loadFiles = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setFiles([]);
    setFolders([]);
    setAccInvoices([]);

    if (section === 'my_files') {
      const { data } = await sb.from('pt_files').select('*').eq('trainer_id', userId).eq('section', 'my_files').order('created_at', { ascending: false });
      setFiles((data ?? []) as PtFile[]);
    } else if (section === 'videos') {
      const { data } = await sb.from('pt_files').select('*').eq('trainer_id', userId).eq('section', 'videos').order('created_at', { ascending: false });
      setFiles((data ?? []) as PtFile[]);
    } else if (section === 'clients' && selClient) {
      if (clientSub === 'documents') {
        const [filesRes, foldersRes] = await Promise.all([
          sb.from('pt_files').select('*').eq('trainer_id', userId).eq('client_id', selClient).eq('section', 'client_documents').order('created_at', { ascending: false }),
          sb.from('pt_client_folders').select('*').eq('trainer_id', userId).eq('client_id', selClient).order('name'),
        ]);
        setFiles((filesRes.data ?? []) as PtFile[]);
        setFolders((foldersRes.data ?? []) as PtFolder[]);
      } else {
        const [filesRes, invRes] = await Promise.all([
          sb.from('pt_files').select('*').eq('trainer_id', userId).eq('client_id', selClient).eq('section', 'client_invoices').order('created_at', { ascending: false }),
          sb.from('invoices').select('id, invoice_number, title, status, issue_date, due_date, total, pdf_url, created_at').eq('pt_id', userId).eq('client_id', selClient).order('created_at', { ascending: false }),
        ]);
        setFiles((filesRes.data ?? []) as PtFile[]);
        setAccInvoices((invRes.data ?? []) as AccInvoice[]);
      }
    }
    setLoading(false);
  }, [userId, section, selClient, clientSub]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  function triggerUpload(target: string | null) {
    setUploadTarget(target);
    setTimeout(() => fileRef.current?.click(), 0);
  }

  async function uploadOne(file: File, path: string, sec: string, clientId: string | null, sub: string | null) {
    const { error } = await sb.storage.from('ptone_drive').upload(path, file, { contentType: file.type || undefined });
    if (error) throw error;
    await sb.from('pt_files').insert({ trainer_id: userId, client_id: clientId, name: file.name, storage_path: path, size_bytes: file.size, mime_type: file.type || null, section: sec, subfolder: sub });
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    e.target.value = '';
    setUploading(true);
    const ts   = Date.now();
    const safe = safeName(file.name);
    try {
      if (section === 'my_files') {
        await uploadOne(file, `${userId}/my_files/${ts}_${safe}`, 'my_files', null, null);
      } else if (section === 'videos') {
        await uploadOne(file, `${userId}/videos/${ts}_${safe}`, 'videos', null, null);
      } else if (section === 'clients' && selClient) {
        if (clientSub === 'documents') {
          const sub = uploadTarget;
          const path = sub
            ? `${userId}/clients/${selClient}/documents/${sub}/${ts}_${safe}`
            : `${userId}/clients/${selClient}/documents/${ts}_${safe}`;
          await uploadOne(file, path, 'client_documents', selClient, sub);
        } else {
          await uploadOne(file, `${userId}/clients/${selClient}/invoices/${ts}_${safe}`, 'client_invoices', selClient, null);
          await uploadOne(file, `${userId}/invoices/${selClient}_${ts}_${safe}`, 'pt_invoices', selClient, null);
        }
      }
      await loadFiles();
    } catch (err) { console.error('Upload failed:', err); }
    setUploading(false);
  }

  async function handleDownload(file: PtFile) {
    setDlId(file.id);
    const { data } = await sb.storage.from('ptone_drive').createSignedUrl(file.storage_path, 3600);
    if (data?.signedUrl) { const a = document.createElement('a'); a.href = data.signedUrl; a.download = file.name; a.click(); }
    setDlId(null);
  }

  async function handleDelete(file: PtFile) {
    if (!confirm(de ? `"${file.name}" löschen?` : `Delete "${file.name}"?`)) return;
    setDelId(file.id);
    await sb.storage.from('ptone_drive').remove([file.storage_path]);
    await sb.from('pt_files').delete().eq('id', file.id);
    setFiles(p => p.filter(f => f.id !== file.id));
    setDelId(null);
  }

  async function handleCreateFolder() {
    if (!userId || !selClient || !newFolderName.trim()) return;
    setCreatingFolder(true);
    const { data } = await sb.from('pt_client_folders').insert({ trainer_id: userId, client_id: selClient, name: newFolderName.trim() }).select('*').single();
    if (data) setFolders(p => [...p, data as PtFolder].sort((a, b) => a.name.localeCompare(b.name)));
    setNewFolderName(''); setShowNewFolder(false); setCreatingFolder(false);
  }

  async function handleDeleteFolder(folder: PtFolder) {
    if (!confirm(de ? `Ordner "${folder.name}" und alle Dateien löschen?` : `Delete folder "${folder.name}" and all its files?`)) return;
    const { data: ff } = await sb.from('pt_files').select('storage_path').eq('trainer_id', userId!).eq('client_id', selClient).eq('section', 'client_documents').eq('subfolder', folder.name);
    if (ff?.length) {
      await sb.storage.from('ptone_drive').remove((ff as any[]).map(f => f.storage_path));
      await sb.from('pt_files').delete().eq('trainer_id', userId!).eq('client_id', selClient).eq('section', 'client_documents').eq('subfolder', folder.name);
    }
    await sb.from('pt_client_folders').delete().eq('id', folder.id);
    setFolders(p => p.filter(f => f.id !== folder.id));
  }

  function changeSection(sec: Section) { setSection(sec); setFiles([]); setFolders([]); setClientSub('documents'); setShowNewFolder(false); }
  function changeClientSub(sub: ClientSub) { setClientSub(sub); setFiles([]); }

  const filteredClients = clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));
  const selectedClientName = clients.find(c => c.id === selClient)?.name ?? '';

  const sectionLabels: Record<Section, string> = {
    my_files: de ? 'Meine Dateien' : 'My Files',
    videos:   'Videos',
    clients:  'Clients',
  };

  function Spinner() {
    return (
      <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
      </div>
    );
  }

  function SimpleList({ emptyMsg, emptyIcon = '📁' }: { emptyMsg: string; emptyIcon?: string }) {
    if (loading) return <Spinner />;
    if (files.length === 0) return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>{emptyIcon}</div>
        <p style={{ fontSize: 14, color: 'var(--text-subtle)' }}>{emptyMsg}</p>
      </div>
    );
    return (
      <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--bg-card)' }}>
        {files.map(f => <FileRow key={f.id} file={f} onDownload={handleDownload} onDelete={handleDelete} dlId={dlId} delId={delId} />)}
      </div>
    );
  }

  return (
    <PageShell
      title={s.drive}
      subtitle={de ? 'Dateien, Videos und Dokumente für deine Clients.' : 'Files, videos and documents for your clients.'}
      action={section !== 'clients' ? (
        <button
          onClick={() => { setUploadTarget(null); fileRef.current?.click(); }}
          disabled={uploading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600, background: 'var(--accent)', color: '#fff', border: 'none', cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: uploading ? 0.6 : 1 }}
        >
          {uploading ? '…' : `+ ${de ? 'Hochladen' : 'Upload'}`}
        </button>
      ) : undefined}
    >
      <input ref={fileRef} type="file" style={{ display: 'none' }} onChange={handleFile} />

      {/* Section tabs — underline style */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 28 }}>
        {(['my_files', 'videos', 'clients'] as Section[]).map(sec => (
          <button key={sec} onClick={() => changeSection(sec)} style={tabBtn(section === sec)}>
            {sectionLabels[sec]}
          </button>
        ))}
      </div>

      {section === 'my_files' && (
        <>
          <p style={{ fontSize: 13, color: 'var(--text-subtle)', marginBottom: 16 }}>
            {de ? 'Deine privaten Dateien — nicht für Clients sichtbar.' : 'Your private files — not visible to clients.'}
          </p>
          <SimpleList emptyMsg={de ? 'Noch keine Dateien hochgeladen.' : 'No files uploaded yet.'} />
        </>
      )}

      {section === 'videos' && (
        <>
          <p style={{ fontSize: 13, color: 'var(--text-subtle)', marginBottom: 16 }}>
            {de ? 'PT-Videos — Clients sehen sie in der Workout-Vorschau.' : 'PT exercise videos — clients can view them in the workout preview.'}
          </p>
          <SimpleList emptyMsg={de ? 'Noch keine Videos hochgeladen.' : 'No videos uploaded yet.'} emptyIcon="🎬" />
        </>
      )}

      {section === 'clients' && (
        <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 240px)', minHeight: 400 }}>
          {/* Left: client list */}
          <div style={{ width: 210, flexShrink: 0, borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', paddingRight: 0 }}>
            <div style={{ paddingBottom: 10 }}>
              <input
                type="text" value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                placeholder={de ? 'Suchen…' : 'Search…'}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }}
              />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {filteredClients.length === 0 ? (
                <p style={{ fontSize: 12, color: 'var(--text-subtle)', padding: '8px 0' }}>{de ? 'Keine Clients.' : 'No clients.'}</p>
              ) : filteredClients.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setSelClient(c.id); setClientSub('documents'); setFiles([]); setFolders([]); setShowNewFolder(false); }}
                  style={{
                    width: '100%', padding: '8px 10px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                    border: 'none', borderRight: selClient === c.id ? '2px solid var(--accent)' : '2px solid transparent',
                    background: selClient === c.id ? 'rgba(124,106,255,0.1)' : 'transparent',
                    borderRadius: '8px 0 0 8px',
                    color: selClient === c.id ? 'var(--accent)' : 'var(--text-primary)',
                    fontSize: 13, fontWeight: selClient === c.id ? 600 : 400,
                    transition: 'all 0.12s', marginBottom: 2,
                  }}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Right: content */}
          <div style={{ flex: 1, minWidth: 0, paddingLeft: 28, overflowY: 'auto' }}>
            {!selClient ? (
              <div style={{ paddingTop: 60, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                  {de ? 'Client aus der Liste auswählen.' : 'Select a client from the list.'}
                </p>
              </div>
            ) : (
              <>
                {/* Client sub-tabs + invoice upload button */}
                <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
                  {(['documents', 'invoices'] as ClientSub[]).map(sub => (
                    <button key={sub} onClick={() => changeClientSub(sub)} style={tabBtn(clientSub === sub)}>
                      {sub === 'documents' ? (de ? 'Dokumente' : 'Documents') : (de ? 'Rechnungen' : 'Invoices')}
                    </button>
                  ))}
                  {clientSub === 'invoices' && (
                    <div style={{ marginLeft: 'auto', paddingBottom: 1 }}>
                      <button
                        onClick={() => { setUploadTarget(null); fileRef.current?.click(); }}
                        disabled={uploading}
                        style={{ padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--accent)', color: '#fff', border: 'none', cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: uploading ? 0.6 : 1 }}
                      >
                        {uploading ? '…' : `+ ${de ? 'Rechnung' : 'Invoice'}`}
                      </button>
                    </div>
                  )}
                </div>

                {/* Documents */}
                {clientSub === 'documents' && (
                  loading ? <Spinner /> : (
                    <FolderTree
                      folders={folders} allFiles={files}
                      onDownload={handleDownload} onDelete={handleDelete}
                      onUpload={triggerUpload} onDeleteFolder={handleDeleteFolder}
                      onNewFolder={() => setShowNewFolder(true)}
                      lang={lang} dlId={dlId} delId={delId} uploading={uploading}
                      showNewFolder={showNewFolder} newFolderName={newFolderName}
                      creatingFolder={creatingFolder}
                      setNewFolderName={setNewFolderName} setShowNewFolder={setShowNewFolder}
                      handleCreateFolder={handleCreateFolder}
                    />
                  )
                )}

                {/* Invoices — accounting invoices + manually uploaded PDFs */}
                {clientSub === 'invoices' && (
                  <>
                    <p style={{ fontSize: 13, color: 'var(--text-subtle)', marginBottom: 16 }}>
                      {de ? `Rechnungen für ${selectedClientName}.` : `Invoices for ${selectedClientName}.`}
                    </p>
                    {loading ? <Spinner /> : (accInvoices.length === 0 && files.length === 0) ? (
                      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                        <div style={{ fontSize: 36, marginBottom: 12 }}>🧾</div>
                        <p style={{ fontSize: 14, color: 'var(--text-subtle)' }}>{de ? 'Noch keine Rechnungen für diesen Client.' : 'No invoices for this client yet.'}</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {/* Accounting invoices */}
                        {accInvoices.length > 0 && (
                          <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--bg-card)' }}>
                            {accInvoices.map((inv, i) => {
                              const statusColor: Record<string, string> = { draft: 'var(--text-subtle)', sent: '#3b82f6', overdue: 'var(--danger)', reminder1: '#9333ea', reminder2: '#92400e', paid: 'var(--success)', cancelled: 'var(--text-subtle)' };
                              const color = statusColor[inv.status] ?? 'var(--text-subtle)';
                              return (
                                <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                                  <span style={{ fontSize: 22, flexShrink: 0 }}>🧾</span>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.title || inv.invoice_number}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-subtle)', marginTop: 2 }}>{inv.invoice_number} · {new Date(inv.issue_date).toLocaleDateString(de ? 'de-CH' : 'en-GB')}</div>
                                  </div>
                                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `${color}22`, color, border: `1px solid ${color}44`, fontWeight: 600, flexShrink: 0 }}>{inv.status}</span>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>CHF {inv.total.toFixed(2)}</span>
                                  {inv.pdf_url ? (
                                    <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer" style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, background: 'var(--accent)', color: '#fff', textDecoration: 'none', flexShrink: 0 }}>⬇ PDF</a>
                                  ) : (
                                    <span style={{ fontSize: 11, color: 'var(--text-subtle)', flexShrink: 0 }}>{de ? 'Entwurf' : 'Draft'}</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {/* Manually uploaded PDFs */}
                        {files.length > 0 && (
                          <div style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--bg-card)' }}>
                            {files.map(f => <FileRow key={f.id} file={f} onDownload={handleDownload} onDelete={handleDelete} dlId={dlId} delId={delId} />)}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageShell>
  );
}
