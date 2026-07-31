// "Connect the Dots" was pressed — tell the office there is something waiting.
//
// The client sends nothing but a project id and its staff session. Everything
// in the email is then read back out of the database with the service-role key.
// That matters: if this function took the subject and body from the caller it
// would be an open mail relay wearing our domain, and the address it sends to
// belongs to the Head of School. What arrives is what the database says, or
// nothing arrives at all.

import nodemailer from 'nodemailer';
import { json, readPost, haveService, sb, supabaseUrl, anonKey } from './_ctd.js';

const GMAIL_USER = process.env.NOTIFY_GMAIL_USER || '';
const GMAIL_PASS = process.env.NOTIFY_GMAIL_APP_PASSWORD || '';
const NOTIFY_TO  = process.env.NOTIFY_TO || '';
const APP_URL    = process.env.APP_URL || '';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const prettyDate = d => (d
  ? new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  : 'No date set');

// The caller has to hold a real staff session. Without this anyone who found
// the URL could make Connie's inbox ring.
async function callerIsStaff(request) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return false;
  const res = await fetch(`${supabaseUrl()}/auth/v1/user`, {
    headers: { apikey: anonKey(), Authorization: `Bearer ${token}` },
  }).catch(() => null);
  return !!res && res.ok;
}

export default async (request) => {
  const { res, body } = await readPost(request);
  if (res) return res;

  if (!haveService() || !GMAIL_USER || !GMAIL_PASS || !NOTIFY_TO) {
    // Not configured is not a failure the staffer should see: the project did
    // submit, the email simply is not switched on. The client treats this as
    // a quiet no-op rather than an error over the top of a successful action.
    return json(200, { ok: true, sent: false, reason: 'not_configured' });
  }

  if (!(await callerIsStaff(request))) {
    return json(401, { error: 'Not signed in.' });
  }

  const id = String(body?.projectId || '').trim();
  if (!id) return json(400, { error: 'Missing project id.' });

  const r = await sb(`ctd_projects?id=eq.${encodeURIComponent(id)}&select=name,date,leads,submitted,submitted_by,ctd_dots(member_name,ctd_tasks(text))`);
  if (!r.ok) return json(502, { error: 'Couldn’t read that project.' });
  const project = (await r.json().catch(() => []))?.[0];
  if (!project) return json(404, { error: 'No such project.' });

  // Only announce something that is genuinely waiting. Otherwise this endpoint
  // would send an "approval needed" note for any project id at all.
  if (!project.submitted) return json(409, { error: 'That project has not been submitted.' });

  const dots = (project.ctd_dots || []).filter(d => (d.member_name || '').trim());
  const taskCount = dots.reduce((n, d) => n + (d.ctd_tasks || []).length, 0);
  const leads = Array.isArray(project.leads) ? project.leads : [];

  const rows = dots.map(d => `
    <tr>
      <td style="padding:8px 14px 8px 0;vertical-align:top;font-weight:600;color:#175933;white-space:nowrap">${esc(d.member_name)}</td>
      <td style="padding:8px 0;vertical-align:top;color:#0D2B1A">${(d.ctd_tasks || []).length
        ? (d.ctd_tasks || []).map(t => esc(t.text)).join('<br>')
        : '<span style="color:#5E7A68">No tasks listed</span>'}</td>
    </tr>`).join('');

  const html = `
  <div style="font-family:Helvetica,Arial,sans-serif;background:#F4FAF6;padding:28px">
    <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid rgba(23,89,51,0.12)">
      <div style="height:4px;background:#E46E88"></div>
      <div style="padding:26px 28px">
        <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#5E7A68;font-weight:700">Ready for your approval</div>
        <div style="font-size:26px;font-weight:700;color:#175933;margin:8px 0 4px">${esc(project.name || 'Untitled project')}</div>
        <div style="font-size:14px;color:#5E7A68;margin-bottom:18px">${esc(prettyDate(project.date))}</div>

        <div style="font-size:14px;color:#0D2B1A;line-height:1.6;margin-bottom:20px">
          ${esc(project.submitted_by || 'A staff member')} connected the dots on this one.
          ${leads.length ? `Led by <strong>${esc(leads.join(', '))}</strong>.` : ''}
          It has <strong>${dots.length}</strong> ${dots.length === 1 ? 'person' : 'people'} assigned
          and <strong>${taskCount}</strong> ${taskCount === 1 ? 'task' : 'tasks'} between them.
        </div>

        ${rows ? `<table style="width:100%;border-collapse:collapse;font-size:13px;border-top:1px solid rgba(23,89,51,0.12)">${rows}</table>` : ''}

        ${APP_URL ? `<div style="margin-top:24px">
          <a href="${esc(APP_URL)}" style="display:inline-block;background:#175933;color:#fff;text-decoration:none;padding:13px 26px;border-radius:9px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Open ConnectHub</a>
        </div>` : ''}
      </div>
    </div>
    <div style="max-width:620px;margin:14px auto 0;font-size:11px;color:#5E7A68;text-align:center">
      Sent by ConnectHub because a project was submitted for approval.
    </div>
  </div>`;

  try {
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    });
    await transport.sendMail({
      from: `ConnectHub <${GMAIL_USER}>`,
      to: NOTIFY_TO,
      subject: `Ready for approval: ${project.name || 'Untitled project'}`,
      html,
      text: `${project.submitted_by || 'A staff member'} submitted "${project.name || 'Untitled project'}" (${prettyDate(project.date)}) for approval. `
          + `${dots.length} assigned, ${taskCount} tasks. ${APP_URL}`,
    });
    return json(200, { ok: true, sent: true });
  } catch {
    // The submission already succeeded. A mail failure must not read to the
    // staffer as though their project did not go through.
    return json(200, { ok: true, sent: false, reason: 'send_failed' });
  }
};
