// Every action a staffer is NOT allowed to do. One endpoint, service-role key,
// admin token verified first.
//
// The database backs this up independently: ctd-provision.sql §3 revokes these
// exact writes from `authenticated`, so even a staffer who bypasses the UI and
// hits PostgREST directly with a valid staff session gets refused. This
// function is the only path that can perform them.

import { json, readPost, sb, sbRpc, requireAdmin } from './_ctd.js';

const REPRESENT = { Prefer: 'return=representation' };

const nowIso = () => new Date().toISOString();

export default async (request) => {
  const { res, body } = await readPost(request);
  if (res) return res;

  const gate = requireAdmin(request);
  if (!gate.ok) return gate.res;

  const action = String(body?.action || '');
  const by     = String(body?.by || '').slice(0, 120) || null;

  try {
    switch (action) {
      case 'approve': {
        if (!body?.id) return json(400, { error: 'Missing project id.' });
        const r = await sb(`ctd_projects?id=eq.${encodeURIComponent(body.id)}`, {
          method: 'PATCH',
          headers: REPRESENT,
          body: JSON.stringify({ blessed: true, blessed_at: nowIso(), blessed_by: by }),
        });
        if (!r.ok) return json(502, { error: 'Couldn’t approve that project.' });
        return json(200, { ok: true, project: (await r.json())?.[0] || null });
      }

      case 'revoke': {
        if (!body?.id) return json(400, { error: 'Missing project id.' });
        const r = await sb(`ctd_projects?id=eq.${encodeURIComponent(body.id)}`, {
          method: 'PATCH',
          headers: REPRESENT,
          body: JSON.stringify({ blessed: false, blessed_at: null, blessed_by: null }),
        });
        if (!r.ok) return json(502, { error: 'Couldn’t change that project.' });
        return json(200, { ok: true, project: (await r.json())?.[0] || null });
      }

      case 'unsubmit': {
        // "Back to Draft" — pull a project out of the approval queue.
        if (!body?.id) return json(400, { error: 'Missing project id.' });
        const r = await sb(`ctd_projects?id=eq.${encodeURIComponent(body.id)}`, {
          method: 'PATCH',
          headers: REPRESENT,
          body: JSON.stringify({ submitted: false, submitted_at: null, blessed: false, blessed_at: null, blessed_by: null }),
        });
        if (!r.ok) return json(502, { error: 'Couldn’t change that project.' });
        return json(200, { ok: true, project: (await r.json())?.[0] || null });
      }

      case 'delete_project': {
        if (!body?.id) return json(400, { error: 'Missing project id.' });
        // Dots and tasks go with it via on delete cascade.
        const r = await sb(`ctd_projects?id=eq.${encodeURIComponent(body.id)}`, { method: 'DELETE' });
        if (!r.ok) return json(502, { error: 'Couldn’t delete that project.' });
        return json(200, { ok: true });
      }

      case 'save_member': {
        const m = body?.member || {};
        const name = String(m.name || '').trim();
        if (!name) return json(400, { error: 'A team member needs a name.' });
        const row = {
          name,
          title:      String(m.title || '').trim(),
          photo_url:  m.photoUrl || null,
          sort_order: Number.isFinite(m.sortOrder) ? m.sortOrder : 0,
        };

        // A rename has to cascade to dots and project leads, or the person's
        // work silently detaches from them. The RPC does all three together.
        if (m.id) {
          const prevRes = await sb(`ctd_members?id=eq.${encodeURIComponent(m.id)}&select=name`);
          const prev = (await prevRes.json().catch(() => []))?.[0];
          if (prev && prev.name.trim().toLowerCase() !== name.toLowerCase()) {
            const rn = await sbRpc('ctd_rename_member', { p_old: prev.name, p_new: name });
            if (!rn.ok) return json(409, { error: 'That name is already taken by someone else on the team.' });
          }
          const r = await sb(`ctd_members?id=eq.${encodeURIComponent(m.id)}`, {
            method: 'PATCH', headers: REPRESENT, body: JSON.stringify(row),
          });
          if (!r.ok) return json(502, { error: 'Couldn’t save that team member.' });
          return json(200, { ok: true, member: (await r.json())?.[0] || null });
        }

        const r = await sb('ctd_members', {
          method: 'POST', headers: REPRESENT, body: JSON.stringify(row),
        });
        if (r.status === 409) return json(409, { error: 'Someone with that name is already on the team.' });
        if (!r.ok) return json(502, { error: 'Couldn’t add that team member.' });
        return json(200, { ok: true, member: (await r.json())?.[0] || null });
      }

      case 'delete_member': {
        if (!body?.id) return json(400, { error: 'Missing member id.' });
        // Dots keep member_name, so a deleted person's assignments stay
        // readable ("who was doing this?") instead of silently emptying.
        const r = await sb(`ctd_members?id=eq.${encodeURIComponent(body.id)}`, { method: 'DELETE' });
        if (!r.ok) return json(502, { error: 'Couldn’t remove that team member.' });
        return json(200, { ok: true });
      }

      default:
        return json(400, { error: 'Unknown action.' });
    }
  } catch {
    return json(502, { error: 'Something went wrong. Try again.' });
  }
};
