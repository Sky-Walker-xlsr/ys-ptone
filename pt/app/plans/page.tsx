'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Sidebar } from '@/components/Sidebar';

// ── Types ────────────────────────────────────────────────────────────────────

interface ClientProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string;
}

interface AssignedPlan {
  assignment_id: string;
  plan_id: string;
  title: string;
  description: string | null;
  exercise_count: number;
}

interface ClientFolder extends ClientProfile {
  plans: AssignedPlan[];
}

interface TemplatePlan {
  id: string;
  title: string;
  description: string | null;
  folder_id: string | null;
  exercise_count: number;
}

interface PlanFolder {
  id: string;
  name: string;
  plans: TemplatePlan[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function clientName(c: ClientProfile) {
  return c.display_name || `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.email;
}

function clientInitials(c: ClientProfile) {
  const n = clientName(c);
  const parts = n.split(' ');
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || c.email[0].toUpperCase();
}

// ── Chevron ───────────────────────────────────────────────────────────────────

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease', color: 'var(--text-muted)', flexShrink: 0 }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// ── New Plan Modal ────────────────────────────────────────────────────────────

function NewPlanModal({ title: heading, onSave, onClose }: {
  title: string;
  onSave: (title: string, desc: string) => Promise<void>;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [desc,  setDesc]  = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    await onSave(title.trim(), desc.trim());
    setSaving(false);
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, margin: '0 auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px 16px 0 0', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{heading}</h2>
        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
          <input
            autoFocus placeholder="Plan title" value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            style={{ fontSize: 15, width: '100%', background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'inherit' }}
          />
        </div>
        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
          <input
            placeholder="Description (optional)" value={desc}
            onChange={e => setDesc(e.target.value)}
            style={{ fontSize: 14, width: '100%', background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'inherit' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !title.trim()} style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: title.trim() ? 'var(--accent)' : 'var(--bg-tertiary)', color: title.trim() ? '#fff' : 'var(--text-muted)', fontSize: 14, fontWeight: 600, cursor: title.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
            {saving ? 'Creating…' : 'Create & Edit'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Folder Name Modal (new + rename) ─────────────────────────────────────────

function FolderNameModal({ heading, initial = '', onSave, onClose }: {
  heading: string;
  initial?: string;
  onSave: (name: string) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim());
    setSaving(false);
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, margin: '0 auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px 16px 0 0', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{heading}</h2>
        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
          <input
            autoFocus placeholder="Folder name" value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            style={{ fontSize: 15, width: '100%', background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'inherit' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !name.trim()} style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: name.trim() ? 'var(--accent)' : 'var(--bg-tertiary)', color: name.trim() ? '#fff' : 'var(--text-muted)', fontSize: 14, fontWeight: 600, cursor: name.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
            {saving ? 'Saving…' : initial ? 'Rename' : 'Create Folder'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Template Picker Modal ─────────────────────────────────────────────────────

function TemplatePickerModal({ folders, onSelect, onClose }: {
  folders: PlanFolder[];
  onSelect: (plan: TemplatePlan) => Promise<void>;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<TemplatePlan | null>(null);
  const [saving, setSaving] = useState(false);
  const allPlans = folders.flatMap(f => f.plans);

  async function handleInsert() {
    if (!selected) return;
    setSaving(true);
    await onSelect(selected);
    setSaving(false);
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', zIndex: 200 }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, margin: '0 auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '16px 16px 0 0', padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '80vh' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Insert from Template</h2>

        {allPlans.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No templates yet. Create some in the Templates section first.</p>
        ) : (
          <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
            {folders.filter(f => f.plans.length > 0).map(folder => (
              <div key={folder.id}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, marginTop: 0 }}>{folder.name}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {folder.plans.map(plan => (
                    <button
                      key={plan.id} onClick={() => setSelected(plan)}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, border: selected?.id === plan.id ? '1px solid rgba(124,106,255,0.6)' : '1px solid var(--border)', background: selected?.id === plan.id ? 'rgba(124,106,255,0.1)' : 'transparent', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{plan.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{plan.exercise_count} exercises</div>
                      </div>
                      {selected?.id === plan.id && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={handleInsert} disabled={!selected || saving} style={{ flex: 2, padding: '10px', borderRadius: 10, border: 'none', background: selected ? 'var(--accent)' : 'var(--bg-tertiary)', color: selected ? '#fff' : 'var(--text-muted)', fontSize: 14, fontWeight: 600, cursor: selected ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
            {saving ? 'Inserting…' : 'Insert Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Plan row ─────────────────────────────────────────────────────────────────

function PlanRow({ plan, menuItems, onNavigate }: {
  plan: { id: string; title: string; exercise_count: number };
  menuItems: { label: string; action: () => void; danger?: boolean }[];
  onNavigate: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', position: 'relative' }}>
      {menuOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 15 }} onClick={() => setMenuOpen(false)} />}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0 }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      </svg>
      <button onClick={onNavigate} style={{ flex: 1, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{plan.title}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{plan.exercise_count} exercise{plan.exercise_count !== 1 ? 's' : ''}</div>
      </button>
      <button onClick={() => setMenuOpen(o => !o)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 17, padding: '2px 6px', cursor: 'pointer', lineHeight: 1, zIndex: 16 }}>···</button>
      {menuOpen && (
        <div style={{ position: 'absolute', top: 28, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', zIndex: 20, minWidth: 170, boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              onClick={() => { setMenuOpen(false); item.action(); }}
              style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: item.danger ? 'var(--danger)' : 'var(--text-primary)', textAlign: 'left', fontSize: 13, cursor: 'pointer', borderBottom: i < menuItems.length - 1 ? '1px solid var(--border)' : 'none', fontFamily: 'inherit' }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PlansPage() {
  const router  = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [trainerId,       setTrainerId]       = useState<string | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [clients,         setClients]         = useState<ClientFolder[]>([]);
  const [folders,         setFolders]         = useState<PlanFolder[]>([]);
  const [clientsOpen,     setClientsOpen]     = useState(true);
  const [templatesOpen,   setTemplatesOpen]   = useState(true);
  const [openClientIds,   setOpenClientIds]   = useState<Set<string>>(new Set());
  const [openFolderIds,   setOpenFolderIds]   = useState<Set<string>>(new Set());
  const [folderMenuId,    setFolderMenuId]    = useState<string | null>(null);
  const [successMsg,      setSuccessMsg]      = useState<string | null>(null);

  // Modal states
  const [newClientPlan,   setNewClientPlan]   = useState<{ clientId: string } | null>(null);
  const [newTemplatePlan, setNewTemplatePlan] = useState<{ folderId: string } | null>(null);
  const [newFolder,       setNewFolder]       = useState(false);
  const [renameFolder,    setRenameFolder]    = useState<{ id: string; name: string } | null>(null);
  const [templatePicker,  setTemplatePicker]  = useState<{ clientId: string } | null>(null);

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }
      const tid = session.user.id;
      setTrainerId(tid);

      // Active client IDs
      const { data: tcData } = await supabase
        .from('trainer_clients')
        .select('client_id')
        .eq('trainer_id', tid)
        .eq('status', 'active');
      const clientIds = tcData?.map(r => r.client_id) ?? [];

      // Fetch client profiles + plan assignments in parallel
      const [profilesRes, assignmentsRes, foldersRes, templatesRes] = await Promise.all([
        clientIds.length > 0
          ? supabase.from('profiles').select('id, first_name, last_name, display_name, email').in('id', clientIds)
          : Promise.resolve({ data: [] }),
        supabase.from('plan_assignments').select('id, client_id, plan_id').eq('trainer_id', tid),
        supabase.from('plan_folders').select('id, name').eq('pt_id', tid).order('created_at', { ascending: true }),
        supabase.from('plans')
          .select('id, title, description, folder_id, plan_exercises(count)')
          .eq('user_id', tid).eq('is_template', true)
          .order('created_at', { ascending: false }),
      ]);

      const clientProfiles = (profilesRes.data as ClientProfile[]) ?? [];
      const assignments    = assignmentsRes.data ?? [];

      // Get exercise counts for assigned plans
      const assignedPlanIds = [...new Set(assignments.map(a => a.plan_id))];
      let planDetails: Record<string, { title: string; description: string | null; exercise_count: number }> = {};
      if (assignedPlanIds.length > 0) {
        const { data: planData } = await supabase
          .from('plans')
          .select('id, title, description, plan_exercises(count)')
          .in('id', assignedPlanIds);
        for (const p of planData ?? []) {
          planDetails[p.id] = {
            title: p.title,
            description: p.description,
            exercise_count: (p.plan_exercises as { count: number }[])?.[0]?.count ?? 0,
          };
        }
      }

      // Group assignments by client
      const assignmentsByClient: Record<string, AssignedPlan[]> = {};
      for (const a of assignments) {
        const pd = planDetails[a.plan_id];
        if (!pd) continue;
        if (!assignmentsByClient[a.client_id]) assignmentsByClient[a.client_id] = [];
        assignmentsByClient[a.client_id].push({
          assignment_id: a.id,
          plan_id: a.plan_id,
          title: pd.title,
          description: pd.description,
          exercise_count: pd.exercise_count,
        });
      }

      setClients(clientProfiles.map(c => ({ ...c, plans: assignmentsByClient[c.id] ?? [] })));

      // Template folders + plans
      const plansByFolder: Record<string, TemplatePlan[]> = {};
      for (const p of templatesRes.data ?? []) {
        const fid = p.folder_id ?? '__none';
        if (!plansByFolder[fid]) plansByFolder[fid] = [];
        plansByFolder[fid].push({
          id: p.id,
          title: p.title,
          description: p.description,
          folder_id: p.folder_id,
          exercise_count: (p.plan_exercises as { count: number }[])?.[0]?.count ?? 0,
        });
      }

      setFolders((foldersRes.data ?? []).map(f => ({
        id: f.id,
        name: f.name,
        plans: plansByFolder[f.id] ?? [],
      })));

      setLoading(false);
    }
    init();
  }, [router, supabase]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  function showSuccess(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  }

  function toggleClient(id: string) {
    setOpenClientIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  function toggleFolder(id: string) {
    setOpenFolderIds(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async function createClientPlan(clientId: string, title: string, desc: string) {
    if (!trainerId) return;
    const { data: plan } = await supabase
      .from('plans')
      .insert({ user_id: trainerId, title, description: desc || null, is_template: false })
      .select('id').single();
    if (!plan) return;
    await supabase.from('plan_assignments').insert({ plan_id: plan.id, trainer_id: trainerId, client_id: clientId });
    setNewClientPlan(null);
    router.push(`/plans/${plan.id}/edit`);
  }

  async function createTemplatePlan(folderId: string, title: string, desc: string) {
    if (!trainerId) return;
    const { data: plan } = await supabase
      .from('plans')
      .insert({ user_id: trainerId, title, description: desc || null, is_template: true, folder_id: folderId })
      .select('id').single();
    if (!plan) return;
    setFolders(prev => prev.map(f => f.id === folderId
      ? { ...f, plans: [{ id: plan.id, title, description: desc || null, folder_id: folderId, exercise_count: 0 }, ...f.plans] }
      : f));
    setNewTemplatePlan(null);
    router.push(`/plans/${plan.id}/edit`);
  }

  async function createNewFolder(name: string) {
    if (!trainerId) return;
    const { data } = await supabase
      .from('plan_folders')
      .insert({ pt_id: trainerId, name })
      .select('id, name').single();
    if (data) {
      setFolders(prev => [...prev, { id: data.id, name: data.name, plans: [] }]);
      setOpenFolderIds(prev => new Set([...prev, data.id]));
    }
    setNewFolder(false);
  }

  async function renameFolderAction(id: string, name: string) {
    await supabase.from('plan_folders').update({ name }).eq('id', id);
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f));
    setRenameFolder(null);
  }

  async function deleteFolder(id: string) {
    setFolderMenuId(null);
    await supabase.from('plan_folders').delete().eq('id', id);
    setFolders(prev => prev.filter(f => f.id !== id));
  }

  async function removeClientAssignment(planId: string, clientId: string) {
    await supabase.from('plan_assignments').delete()
      .eq('plan_id', planId).eq('trainer_id', trainerId!).eq('client_id', clientId);
    setClients(prev => prev.map(c => c.id === clientId
      ? { ...c, plans: c.plans.filter(p => p.plan_id !== planId) }
      : c));
  }

  async function deleteTemplatePlan(planId: string, folderId: string) {
    await supabase.from('plans').delete().eq('id', planId);
    setFolders(prev => prev.map(f => f.id === folderId
      ? { ...f, plans: f.plans.filter(p => p.id !== planId) }
      : f));
  }

  async function insertTemplateForClient(clientId: string, template: TemplatePlan) {
    if (!trainerId) return;

    // Copy plan
    const { data: newPlan } = await supabase
      .from('plans')
      .insert({ user_id: trainerId, title: template.title, description: template.description, is_template: false })
      .select('id').single();
    if (!newPlan) return;

    // Deep-copy exercises
    const { data: exercises } = await supabase
      .from('plan_exercises')
      .select('id, exercise_id, order_index, superset_group_id, notes')
      .eq('plan_id', template.id)
      .order('order_index', { ascending: true });

    if (exercises && exercises.length > 0) {
      const groupIdMap: Record<string, string> = {};
      const newExercises = exercises.map(ex => {
        let newGroupId: string | null = null;
        if (ex.superset_group_id) {
          if (!groupIdMap[ex.superset_group_id]) groupIdMap[ex.superset_group_id] = crypto.randomUUID();
          newGroupId = groupIdMap[ex.superset_group_id];
        }
        return { plan_id: newPlan.id, exercise_id: ex.exercise_id, order_index: ex.order_index, superset_group_id: newGroupId, notes: ex.notes };
      });

      const { data: insertedExercises } = await supabase.from('plan_exercises').insert(newExercises).select('id');

      if (insertedExercises) {
        const exIdMap: Record<string, string> = {};
        exercises.forEach((ex, i) => { exIdMap[ex.id] = insertedExercises[i].id; });

        const { data: oldSets } = await supabase
          .from('plan_sets')
          .select('plan_exercise_id, order_index, reps, weight_kg, duration_seconds, rest_seconds')
          .in('plan_exercise_id', exercises.map(e => e.id))
          .order('order_index', { ascending: true });

        if (oldSets && oldSets.length > 0) {
          await supabase.from('plan_sets').insert(
            oldSets.map(s => ({
              plan_exercise_id: exIdMap[s.plan_exercise_id],
              order_index: s.order_index,
              reps: s.reps,
              weight_kg: s.weight_kg,
              duration_seconds: s.duration_seconds,
              rest_seconds: s.rest_seconds,
            }))
          );
        }
      }
    }

    // Assign to client
    await supabase.from('plan_assignments').insert({ plan_id: newPlan.id, trainer_id: trainerId, client_id: clientId });

    setClients(prev => prev.map(c => c.id === clientId
      ? { ...c, plans: [...c.plans, { assignment_id: '', plan_id: newPlan.id, title: template.title, description: template.description, exercise_count: template.exercise_count }] }
      : c));
    setTemplatePicker(null);
    showSuccess(`"${template.title}" assigned to client.`);
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--border-strong)', borderTopColor: 'var(--accent)', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)' }}>
      <Sidebar />

      {folderMenuId && <div style={{ position: 'fixed', inset: 0, zIndex: 5 }} onClick={() => setFolderMenuId(null)} />}

      <main style={{ flex: 1, marginLeft: 'var(--sidebar-width)', padding: '32px 40px', minHeight: '100vh', transition: 'margin-left 0.2s ease' }}>

        {successMsg && (
          <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 300, background: '#22c55e', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 14, fontWeight: 500 }}>
            {successMsg}
          </div>
        )}

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Training Plans</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Manage client plans and reusable templates.</p>
        </div>

        {/* ── Clients ────────────────────────────────────────────────────── */}
        <section style={{ marginBottom: 36 }}>
          <button
            onClick={() => setClientsOpen(p => !p)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', marginBottom: clientsOpen ? 12 : 0 }}
          >
            <Chevron open={clientsOpen} />
            <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Clients</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', borderRadius: 6, padding: '2px 8px', marginLeft: 2 }}>{clients.length}</span>
          </button>

          {clientsOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {clients.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-subtle)', paddingLeft: 22 }}>No active clients yet.</p>
              ) : clients.map(client => (
                <div key={client.id} style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
                  <button
                    onClick={() => toggleClient(client.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--bg-card)', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <Chevron open={openClientIds.has(client.id)} />
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {clientInitials(client)}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{clientName(client)}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{client.plans.length} plan{client.plans.length !== 1 ? 's' : ''}</span>
                  </button>

                  {openClientIds.has(client.id) && (
                    <div style={{ background: 'var(--bg-page)', borderTop: '1px solid var(--border)', padding: '4px 16px 12px 48px' }}>
                      {client.plans.length === 0 ? (
                        <p style={{ fontSize: 12, color: 'var(--text-subtle)', padding: '8px 0' }}>No plans assigned yet.</p>
                      ) : client.plans.map(plan => (
                        <PlanRow
                          key={plan.plan_id}
                          plan={{ id: plan.plan_id, title: plan.title, exercise_count: plan.exercise_count }}
                          onNavigate={() => router.push(`/plans/${plan.plan_id}/edit`)}
                          menuItems={[
                            { label: 'Edit plan', action: () => router.push(`/plans/${plan.plan_id}/edit`) },
                            { label: 'Remove from client', action: () => removeClientAssignment(plan.plan_id, client.id), danger: true },
                          ]}
                        />
                      ))}
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button
                          onClick={() => setNewClientPlan({ clientId: client.id })}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          + New Plan
                        </button>
                        <button
                          onClick={() => setTemplatePicker({ clientId: client.id })}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(124,106,255,0.4)', background: 'rgba(124,106,255,0.06)', color: 'var(--accent)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          + From Template
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Templates ──────────────────────────────────────────────────── */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: templatesOpen ? 12 : 0 }}>
            <button
              onClick={() => setTemplatesOpen(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', flex: 1 }}
            >
              <Chevron open={templatesOpen} />
              <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>Templates</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-tertiary)', borderRadius: 6, padding: '2px 8px', marginLeft: 2 }}>
                {folders.reduce((s, f) => s + f.plans.length, 0)}
              </span>
            </button>
            <button
              onClick={() => setNewFolder(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
            >
              + New Folder
            </button>
          </div>

          {templatesOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {folders.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-subtle)', paddingLeft: 22 }}>No folders yet. Create one to organise your templates.</p>
              ) : folders.map(folder => (
                <div key={folder.id} style={{ borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)' }}>
                    <button
                      onClick={() => toggleFolder(folder.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                    >
                      <Chevron open={openFolderIds.has(folder.id)} />
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" style={{ flexShrink: 0 }}>
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                      </svg>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>{folder.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>{folder.plans.length} plan{folder.plans.length !== 1 ? 's' : ''}</span>
                    </button>
                    {/* Folder menu */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <button
                        onClick={() => setFolderMenuId(folderMenuId === folder.id ? null : folder.id)}
                        style={{ padding: '0 14px', height: '100%', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 17, lineHeight: 1, zIndex: 6 }}
                      >···</button>
                      {folderMenuId === folder.id && (
                        <div style={{ position: 'absolute', top: 28, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', zIndex: 20, minWidth: 150, boxShadow: '0 8px 24px rgba(0,0,0,0.25)' }}>
                          <button onClick={() => { setFolderMenuId(null); setRenameFolder({ id: folder.id, name: folder.name }); }} style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: 'var(--text-primary)', textAlign: 'left', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid var(--border)', fontFamily: 'inherit' }}>Rename</button>
                          <button onClick={() => deleteFolder(folder.id)} style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', color: 'var(--danger)', textAlign: 'left', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Delete folder</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {openFolderIds.has(folder.id) && (
                    <div style={{ background: 'var(--bg-page)', borderTop: '1px solid var(--border)', padding: '4px 16px 12px 48px' }}>
                      {folder.plans.length === 0 ? (
                        <p style={{ fontSize: 12, color: 'var(--text-subtle)', padding: '8px 0' }}>No templates in this folder yet.</p>
                      ) : folder.plans.map(plan => (
                        <PlanRow
                          key={plan.id}
                          plan={{ id: plan.id, title: plan.title, exercise_count: plan.exercise_count }}
                          onNavigate={() => router.push(`/plans/${plan.id}/edit`)}
                          menuItems={[
                            { label: 'Edit plan', action: () => router.push(`/plans/${plan.id}/edit`) },
                            { label: 'Delete', action: () => deleteTemplatePlan(plan.id, folder.id), danger: true },
                          ]}
                        />
                      ))}
                      <button
                        onClick={() => setNewTemplatePlan({ folderId: folder.id })}
                        style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        + New Template Plan
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modals */}
      {newClientPlan && (() => {
        const c = clients.find(x => x.id === newClientPlan.clientId);
        return c ? (
          <NewPlanModal
            title={`New plan for ${clientName(c)}`}
            onSave={(t, d) => createClientPlan(newClientPlan.clientId, t, d)}
            onClose={() => setNewClientPlan(null)}
          />
        ) : null;
      })()}

      {newTemplatePlan && (
        <NewPlanModal
          title="New Template Plan"
          onSave={(t, d) => createTemplatePlan(newTemplatePlan.folderId, t, d)}
          onClose={() => setNewTemplatePlan(null)}
        />
      )}

      {newFolder && (
        <FolderNameModal
          heading="New Folder"
          onSave={createNewFolder}
          onClose={() => setNewFolder(false)}
        />
      )}

      {renameFolder && (
        <FolderNameModal
          heading="Rename Folder"
          initial={renameFolder.name}
          onSave={name => renameFolderAction(renameFolder.id, name)}
          onClose={() => setRenameFolder(null)}
        />
      )}

      {templatePicker && (
        <TemplatePickerModal
          folders={folders}
          onSelect={plan => insertTemplateForClient(templatePicker.clientId, plan)}
          onClose={() => setTemplatePicker(null)}
        />
      )}
    </div>
  );
}
