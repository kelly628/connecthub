// The data layer. Replaces the old src/data/store.js, which kept everything in
// one browser's localStorage — so a project submitted on a classroom PC could
// never reach the approver on any other machine.
//
// Two rules keep the rest of the app almost untouched:
//
//   1. loadAll() returns projects in EXACTLY the shape the components already
//      read, just with server ids attached. Nothing downstream has to change.
//   2. Writes are as narrow as the schema allows — one task toggle is one row,
//      one column. That's what makes two staff checking their own boxes at the
//      same moment safe rather than a silent overwrite.

import { supabase } from './supabase';
import { adminFetch } from './auth';

// ── shape conversion ───────────────────────────────────────────────────────

const nowIso = () => new Date().toISOString();

function toClientTask(row) {
  return { id: row.id, text: row.text || '', done: !!row.done };
}

function toClientProject(row) {
  const dotRows = [...(row.ctd_dots || [])].sort((a, b) => a.slot - b.slot);
  const dotCount = row.dot_count || 8;

  // The grid indexes dots positionally, so the array has to be dense. Slots
  // nobody has filled in yet simply have no row in the database.
  const size = Math.max(dotCount, ...dotRows.map(d => d.slot + 1), 0);
  const dots = Array.from({ length: size }, () => ({ member: '', responsibilities: [] }));

  for (const d of dotRows) {
    dots[d.slot] = {
      id: d.id,
      member: d.member_name || '',
      responsibilities: [...(d.ctd_tasks || [])]
        .sort((a, b) => (a.sort_order - b.sort_order) || a.created_at.localeCompare(b.created_at))
        .map(toClientTask),
    };
  }

  return {
    id: row.id,
    name: row.name || '',
    date: row.date || '',
    leads: row.leads || [],
    dots,
    dotCount,
    notes: Array.isArray(row.notes) ? row.notes : [],
    submitted: !!row.submitted,
    blessed: !!row.blessed,
    completed: !!row.completed,
    iconName: row.icon_name || undefined,
    logoUrl: row.logo_url || undefined,
  };
}

function toClientMember(row) {
  return {
    id: row.id,
    name: row.name,
    title: row.title || '',
    photoUrl: row.photo_url || null,
    iconName: row.icon_name || null,
    color: row.color || null,
    // Readable by everyone on purpose: "who do I send this to?" is a question
    // the interface should answer without anyone having to ask the office.
    isAdmin: !!row.is_admin,
  };
}

// Client field -> database column, for the diff-and-patch path.
// `blessed` is deliberately absent: staff are revoked from writing it in the
// database, so it can only move through admin-action.js.
const COLUMN = {
  name:      v => ({ name: v || '' }),
  date:      v => ({ date: v || null }),
  leads:     v => ({ leads: Array.isArray(v) ? v : v ? [v] : [] }),
  dotCount:  v => ({ dot_count: Math.max(1, Math.min(12, v || 8)) }),
  iconName:  v => ({ icon_name: v || null }),
  logoUrl:   v => ({ logo_url: v || null }),
  notes:     v => ({ notes: Array.isArray(v) ? v : [] }),
  submitted: v => (v ? { submitted: true, submitted_at: nowIso() } : { submitted: false, submitted_at: null }),
  completed: v => (v ? { completed: true, completed_at: nowIso() } : { completed: false, completed_at: null }),
};

const SELECT = '*, ctd_dots(*, ctd_tasks(*))';

// ── reads ──────────────────────────────────────────────────────────────────

export async function loadAll() {
  const [projRes, teamRes] = await Promise.all([
    supabase.from('ctd_projects').select(SELECT).order('date', { ascending: true, nullsFirst: false }),
    supabase.from('ctd_members').select('*').eq('archived', false).order('name'),
  ]);

  if (projRes.error) return { error: projRes.error.message };
  if (teamRes.error) return { error: teamRes.error.message };

  return {
    projects: (projRes.data || []).map(toClientProject),
    team: (teamRes.data || []).map(toClientMember),
  };
}

async function reloadProject(id) {
  const { data, error } = await supabase.from('ctd_projects').select(SELECT).eq('id', id).single();
  if (error) return { error: error.message };
  return { project: toClientProject(data) };
}

// ── projects ───────────────────────────────────────────────────────────────

export async function createProject(project) {
  const row = {
    name:      project.name || '',
    date:      project.date || null,
    leads:     Array.isArray(project.leads) ? project.leads : project.leads ? [project.leads] : [],
    dot_count: Math.max(1, Math.min(12, project.dotCount || 8)),
    icon_name: project.iconName || null,
    logo_url:  project.logoUrl || null,
    notes:     Array.isArray(project.notes) ? project.notes : [],
  };

  const { data, error } = await supabase.from('ctd_projects').insert(row).select('id').single();
  if (error) return { error: error.message };
  const projectId = data.id;

  // Only slots someone has actually filled in need a row; empty ones are
  // created the first time a person is assigned to them.
  const filled = (project.dots || [])
    .map((d, slot) => ({ d, slot }))
    .filter(({ d }) => d && (d.member?.trim() || (d.responsibilities || []).length));

  if (filled.length) {
    const { data: dotRows, error: dotErr } = await supabase
      .from('ctd_dots')
      .insert(filled.map(({ d, slot }) => ({ project_id: projectId, slot, member_name: d.member || '' })))
      .select('id, slot');
    if (dotErr) return { error: dotErr.message };

    const bySlot = new Map(dotRows.map(r => [r.slot, r.id]));
    const tasks = filled.flatMap(({ d, slot }) =>
      (d.responsibilities || []).map((t, i) => ({
        dot_id: bySlot.get(slot),
        text: typeof t === 'string' ? t : t.text || '',
        done: typeof t === 'string' ? false : !!t.done,
        sort_order: i,
      }))
    );
    if (tasks.length) {
      const { error: taskErr } = await supabase.from('ctd_tasks').insert(tasks);
      if (taskErr) return { error: taskErr.message };
    }
  }

  return reloadProject(projectId);
}

// Patch only the fields that actually changed. This is what lets ProjectDetail
// keep calling onUpdateProject({...project, X}) in nine different places
// without any of them needing to know about the database — and it means two
// people editing different fields of the same project both succeed.
export async function updateProjectFields(id, prev, next) {
  const patch = {};
  for (const [field, toColumns] of Object.entries(COLUMN)) {
    const a = prev?.[field];
    const b = next?.[field];
    const changed = (typeof a === 'object' || typeof b === 'object')
      ? JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)
      : a !== b;
    if (changed) Object.assign(patch, toColumns(b));
  }
  if (!Object.keys(patch).length) return { ok: true };

  const { error } = await supabase.from('ctd_projects').update(patch).eq('id', id);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function addNote(projectId, text, by) {
  // Via the RPC so two people adding notes at once can't clobber each other —
  // notes are the one column still stored as a JSON blob.
  const { data, error } = await supabase.rpc('ctd_add_note', {
    p_project: projectId, p_text: text, p_by: by || null,
  });
  if (error) return { error: error.message };
  return { notes: Array.isArray(data) ? data : [] };
}

export async function duplicateProject(id) {
  const { data, error } = await supabase.rpc('ctd_duplicate_project', { p_id: id });
  if (error) return { error: error.message };
  return reloadProject(data);
}

// ── dots and tasks ─────────────────────────────────────────────────────────

// Save one dot: its assigned person and its checklist. Reconciles the task
// rows so ids survive, which is what keeps toggleTask able to address a single
// row later.
export async function saveDot(projectId, slot, dot) {
  const { data: dotRow, error: dotErr } = await supabase
    .from('ctd_dots')
    .upsert({ project_id: projectId, slot, member_name: dot.member || '' }, { onConflict: 'project_id,slot' })
    .select('id')
    .single();
  if (dotErr) return { error: dotErr.message };
  const dotId = dotRow.id;

  const next = (dot.responsibilities || []).map((t, i) =>
    typeof t === 'string' ? { text: t, done: false, sort_order: i } : { id: t.id, text: t.text || '', done: !!t.done, sort_order: i }
  );

  const { data: existing, error: exErr } = await supabase.from('ctd_tasks').select('id').eq('dot_id', dotId);
  if (exErr) return { error: exErr.message };

  const keep = new Set(next.filter(t => t.id).map(t => t.id));
  const removed = (existing || []).filter(r => !keep.has(r.id)).map(r => r.id);

  const ops = [];
  if (removed.length) ops.push(supabase.from('ctd_tasks').delete().in('id', removed));

  const inserts = next.filter(t => !t.id).map(t => ({ dot_id: dotId, text: t.text, done: t.done, sort_order: t.sort_order }));
  if (inserts.length) ops.push(supabase.from('ctd_tasks').insert(inserts));

  for (const t of next.filter(t => t.id)) {
    ops.push(supabase.from('ctd_tasks').update({ text: t.text, done: t.done, sort_order: t.sort_order }).eq('id', t.id));
  }

  const results = await Promise.all(ops);
  const failed = results.find(r => r.error);
  if (failed) return { error: failed.error.message };

  return reloadProject(projectId);
}

// One row, one column, idempotent. Two staff ticking their own boxes at the
// same moment cannot overwrite each other — this is the payoff for normalizing
// the schema instead of storing each project as a single JSON blob.
export async function toggleTask(taskId, done, by) {
  const { error } = await supabase
    .from('ctd_tasks')
    .update({ done, done_at: done ? nowIso() : null, done_by: done ? (by || null) : null })
    .eq('id', taskId);
  if (error) return { error: error.message };
  return { ok: true };
}

// ── images ─────────────────────────────────────────────────────────────────

export async function uploadImage(bucket, blob) {
  const path = `${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl };
}

// ── admin-only (routed through the Netlify function, service-role) ──────────

export async function approveProject(id, by)  { return adminFetch('approve',  { id, by }); }
export async function revokeProject(id)       { return adminFetch('revoke',   { id }); }
export async function unsubmitProject(id)     { return adminFetch('unsubmit', { id }); }
export async function deleteProject(id)       { return adminFetch('delete_project', { id }); }
// Adding a person is open to all staff and goes straight to the table — the
// database grants insert on exactly four columns, so there is nothing here to
// gate in the interface. Editing and deleting still route through adminFetch
// below, because renaming has to cascade to dots and leads.
export async function addMember(member) {
  const row = {
    name:       String(member.name || '').trim(),
    title:      String(member.title || '').trim(),
    photo_url:  member.photoUrl || null,
    sort_order: Number.isFinite(member.sortOrder) ? member.sortOrder : 0,
  };
  if (!row.name) return { error: 'A team member needs a name.' };

  const { data, error } = await supabase.from('ctd_members').insert(row).select('*').single();
  if (error) {
    // The unique index is on lower(trim(name)), so this is the same person
    // typed slightly differently rather than a genuine failure.
    if (error.code === '23505') return { error: 'Someone with that name is already on the team.' };
    return { error: error.message };
  }
  return { data: { ok: true, member: toClientMember(data) } };
}

// Icon, colour and photo — the three things anyone may change about how a
// person appears. Deliberately not a general member update: the database only
// grants these columns, so a name slipped in here would be rejected outright.
export async function updateMemberLook(id, look) {
  const patch = {};
  if ('iconName' in look) patch.icon_name = look.iconName || null;
  if ('color' in look)    patch.color     = look.color || null;
  if ('photoUrl' in look) patch.photo_url = look.photoUrl || null;
  if (!Object.keys(patch).length) return { data: { ok: true } };

  const { error } = await supabase.from('ctd_members').update(patch).eq('id', id);
  if (error) return { error: error.message };
  return { data: { ok: true } };
}

export async function saveMember(member)      { return adminFetch('save_member',   { member }); }
export async function deleteMember(id)        { return adminFetch('delete_member', { id }); }
// Tell the office a project is waiting. Deliberately best-effort: the project
// is already submitted by the time this runs, so a mail problem must never be
// reported to the staffer as though their submission failed.
export async function notifySubmitted(projectId) {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) return { ok: false };
    const res = await fetch('/.netlify/functions/notify-submitted', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ projectId }),
    });
    return await res.json().catch(() => ({ ok: false }));
  } catch {
    return { ok: false };
  }
}

export async function listCodes()             { return adminFetch('list_codes',    {}); }
export async function setMemberCode(id, code) { return adminFetch('set_member_code', { id, code }); }
