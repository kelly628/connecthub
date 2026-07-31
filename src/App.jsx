import { useState, useEffect, useRef, useCallback } from 'react';
import { Network, Plus, Users, ListChecks, BadgeCheck, X, LayoutDashboard, Lock, Unlock, UserCircle, LoaderCircle, TriangleAlert } from 'lucide-react';
import * as api from './lib/api';
import { staffLogin, staffLogout, hasStaffSession, adminLogin, adminLogout, adminToken } from './lib/auth';
import LogoMark from './components/LogoMark';
import ProjectsView from './components/ProjectsView';
import ProjectDetail from './components/ProjectDetail';
import PeopleView from './components/PeopleView';
import PersonView from './components/PersonView';
import TasksView from './components/TasksView';
import ApprovalsView from './components/ApprovalsView';
import DashboardView from './components/DashboardView';

// How often to pick up other people's changes. Short enough that an approval
// lands while you're still looking at the screen, long enough to be invisible.
const POLL_MS = 30_000;

// The "Who are you?" picker that used to live here is gone. Your code names
// you now, so asking again would be asking a question we already have a better
// answer to — and the old answer was whatever the person happened to click.

// Admin sign-in. The password is checked by the admin-login function, so
// nothing about it is present in this bundle — unlike the PIN this replaced.
function PasswordModal({ onUnlock, onClose }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!password || busy) return;
    setBusy(true);
    const { error: err } = await adminLogin(password);
    setBusy(false);
    if (err) {
      setError(err);
      setPassword('');
      return;
    }
    onUnlock();
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(13,43,26,0.28)', zIndex: 400, backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: '#fff', borderRadius: 14, zIndex: 401, width: 320, boxShadow: '0 24px 64px rgba(13,43,26,0.18), 0 2px 8px rgba(13,43,26,0.07)', overflow: 'hidden' }}>
        <div style={{ height: 3, background: 'var(--blue)' }} />
        <div style={{ padding: '24px 24px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Lock size={16} color="var(--blue)" strokeWidth={1.8} />
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: 'var(--blue)' }}>Admin Access</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'Montserrat, sans-serif', marginBottom: 20, lineHeight: 1.5 }}>
            Enter the admin password to approve projects and manage the team.
          </div>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
            placeholder="Password"
            style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: `1.5px solid ${error ? '#E46E88' : 'var(--border)'}`, borderRadius: 8, fontSize: 15, fontFamily: 'Montserrat, sans-serif', outline: 'none', marginBottom: error ? 8 : 16 }}
          />
          {error && (
            <div style={{ fontSize: 11, color: '#b45309', fontFamily: 'Montserrat, sans-serif', marginBottom: 16, textAlign: 'center', lineHeight: 1.5 }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '11px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={busy || !password} style={{ flex: 2, padding: '11px 20px', background: busy || !password ? 'var(--cream-dk)' : 'var(--blue)', border: 'none', borderRadius: 8, cursor: busy || !password ? 'not-allowed' : 'pointer', fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: busy || !password ? 'var(--muted)' : '#fff' }}>
              {busy ? 'Checking…' : 'Unlock'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// The front door. One code per person, checked server-side — and the answer
// tells us who just walked in, so nobody has to pick their own name afterwards.
function StaffCodeGate({ onSignedIn }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!code.trim() || busy) return;
    setBusy(true);
    const { error: err, member } = await staffLogin(code.trim());
    setBusy(false);
    if (err) { setError(err); return; }
    onSignedIn(member);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--blue)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 380, overflow: 'hidden', boxShadow: '0 24px 64px rgba(13,43,26,0.35)' }}>
        <div style={{ height: 4, background: 'var(--yellow)' }} />
        <div style={{ padding: '32px 28px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <LogoMark size={52} />
          </div>
          <div style={{ fontFamily: 'var(--font-logo)', fontSize: 27, fontWeight: 700, color: 'var(--blue)', textAlign: 'center', letterSpacing: '-0.01em' }}>
            Connect<span style={{ color: 'var(--yellow)' }}>Hub</span>
          </div>
          <div style={{ fontSize: 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--muted)', textAlign: 'center', marginTop: 6, marginBottom: 24 }}>
            Archbishop Chapelle
          </div>
          <label htmlFor="staff-code" style={{ display: 'block', fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 7 }}>
            Your Code
          </label>
          {/* Shown, not masked. It's a personal code rather than a password,
              and a hidden field on a phone means a typo you can't see — which
              costs more here than shoulder-surfing does. Autocorrect off so
              iOS doesn't quietly rewrite it on the way in. */}
          <input
            id="staff-code"
            type="text"
            value={code}
            onChange={e => { setCode(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="e.g. Connie-88"
            style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', border: `1.5px solid ${error ? '#E46E88' : 'var(--border)'}`, borderRadius: 10, fontSize: 16, fontFamily: 'Montserrat, sans-serif', outline: 'none', marginBottom: error ? 10 : 18, background: 'var(--bg)' }}
          />
          {error && (
            <div style={{ fontSize: 12, color: '#b45309', fontFamily: 'Montserrat, sans-serif', marginBottom: 18, lineHeight: 1.5, display: 'flex', gap: 7, alignItems: 'flex-start' }}>
              <TriangleAlert size={14} strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={busy || !code.trim()}
            style={{ width: '100%', padding: '15px', background: busy || !code.trim() ? 'var(--cream-dk)' : 'var(--yellow)', border: 'none', borderRadius: 10, cursor: busy || !code.trim() ? 'not-allowed' : 'pointer', fontSize: 12, fontFamily: 'Montserrat, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.09em', color: busy || !code.trim() ? 'var(--muted)' : '#fff' }}
          >
            {busy ? 'Signing in…' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Boot states. Deliberately no localStorage fallback: two staff each quietly
// working on their own diverging copy is the exact bug this app now exists to
// prevent, so a failed load has to stop and say so.
function BootScreen({ error, onRetry }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 600, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24, textAlign: 'center' }}>
      {error ? (
        <>
          <TriangleAlert size={30} color="var(--blue)" strokeWidth={1.6} />
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 21, fontWeight: 700, color: 'var(--blue)' }}>Couldn’t load your projects</div>
          <div style={{ fontSize: 13, fontFamily: 'Montserrat, sans-serif', color: 'var(--muted)', maxWidth: 340, lineHeight: 1.6 }}>{error}</div>
          <button onClick={onRetry} style={{ marginTop: 4, padding: '13px 30px', background: 'var(--blue)', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff' }}>
            Try Again
          </button>
        </>
      ) : (
        <>
          <LoaderCircle size={26} color="var(--blue)" strokeWidth={1.8} style={{ animation: 'ctd-spin 0.9s linear infinite' }} />
          <div style={{ fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>Loading</div>
        </>
      )}
    </div>
  );
}

function StickyNoteModal({ projects, onSave, onClose }) {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const [text, setText] = useState('');
  const canSave = text.trim() && selectedProjectId;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(13,43,26,0.28)', zIndex: 300, backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: '#fff', borderRadius: 14, zIndex: 301,
        width: 360, boxShadow: '0 24px 64px rgba(13,43,26,0.18), 0 2px 8px rgba(13,43,26,0.07)',
        overflow: 'hidden',
      }}>
        {/* Yellow accent bar */}
        <div style={{ height: 3, background: 'var(--yellow)', width: '100%' }} />

        <div style={{ padding: '22px 24px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: 'var(--blue)' }}>New Sticky Note</div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--blue)'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--muted)'}
            ><X size={15} /></button>
          </div>

          <div style={{ fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 6 }}>Project</div>
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            style={{ width: '100%', marginBottom: 16, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: 'var(--blue)', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
          >
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <div style={{ fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 6 }}>Note</div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write your note here..."
            rows={5}
            autoFocus
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontFamily: 'Montserrat, sans-serif', resize: 'vertical', boxSizing: 'border-box', background: '#FAFAF8', outline: 'none', lineHeight: 1.6, color: 'var(--text)' }}
          />

          <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', transition: 'all 0.15s' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = 'var(--blue)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
            >
              Cancel
            </button>
            <button
              onClick={() => { if (canSave) { onSave(selectedProjectId, text.trim()); onClose(); } }}
              disabled={!canSave}
              style={{ padding: '9px 20px', background: canSave ? 'var(--yellow)' : 'var(--cream-dk)', border: 'none', borderRadius: 8, cursor: canSave ? 'pointer' : 'not-allowed', fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: canSave ? 'var(--blue)' : 'var(--muted)', transition: 'all 0.15s' }}
            >
              Save Note
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [projects, setProjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [navView, setNavView] = useState('dashboard');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [team, setTeam] = useState([]);
  const [showStickyModal, setShowStickyModal] = useState(false);
  const [draftProject, setDraftProject] = useState(null);
  const [toast, setToast] = useState(null);
  // isAdmin is now derived from a server-signed token, not a localStorage flag
  // anyone could set. Even if someone forces it true, the database refuses the
  // writes it unlocks — see ctd-provision.sql §3.
  const [isAdmin, setIsAdmin] = useState(() => !!adminToken());
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('ctd_current_user') || '');
  // 'idle' | 'saving' | 'saved' | 'error' — drives the line in the project
  // header that tells someone their work is written down somewhere.
  const [saveState, setSaveState] = useState('idle');
  const [signedIn, setSignedIn] = useState(null);   // null = still checking
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState('');

  // A background refresh must never yank the screen out from under someone
  // mid-edit, so it skips while a write is in flight or a modal is open.
  const writesInFlight = useRef(0);
  // Holds the pending auto-save so a burst of typing collapses into one write.
  const draftSaveTimer = useRef(null);
  useEffect(() => () => clearTimeout(draftSaveTimer.current), []);
  const uiBusy = useRef(false);
  const uiIsBusy = showStickyModal || showAdminModal || !!draftProject;
  useEffect(() => { uiBusy.current = uiIsBusy; }, [uiIsBusy]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  const refresh = useCallback(async () => {
    const res = await api.loadAll();
    if (res.error) return res.error;
    setProjects(res.projects);
    setTeam(res.team);
    return null;
  }, []);

  // ── boot ────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await hasStaffSession();
      if (cancelled) return;
      setSignedIn(ok);
      if (!ok) { setBooting(false); return; }
      const err = await refresh();
      if (cancelled) return;
      setBootError(err || '');
      setBooting(false);
    })();
    return () => { cancelled = true; };
  }, [refresh]);

  // ── stay current with what other people are doing ───────────────────────
  useEffect(() => {
    if (!signedIn || booting || bootError) return;

    const tick = () => {
      if (writesInFlight.current > 0 || uiBusy.current || document.hidden) return;
      refresh();
    };
    const id = setInterval(tick, POLL_MS);
    // The one that actually matters day to day: you switch back to the tab and
    // want to be looking at current data, not a snapshot from lunchtime.
    const onVisible = () => { if (!document.hidden) tick(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [signedIn, booting, bootError, refresh]);

  // Every mutation goes through here: update the screen immediately so the app
  // still feels instant, then reconcile. A failed write reloads the truth and
  // says what happened, rather than leaving a lie on screen.
  const runWrite = useCallback(async (fn, optimistic) => {
    writesInFlight.current += 1;
    setSaveState('saving');
    if (optimistic) optimistic();
    let res;
    try {
      res = await fn();
    } catch {
      res = { error: 'Couldn’t save — check your connection.' };
    }
    writesInFlight.current -= 1;
    if (res?.error) {
      if (writesInFlight.current === 0) setSaveState('error');
      showToast(res.error);
      await refresh();
      return null;
    }
    // Only the last write in a burst settles the indicator, or a quick edit
    // during a slow save would flip it to "saved" while one is still going.
    if (writesInFlight.current === 0) setSaveState('saved');
    return res;
  }, [refresh]);

  function handleUnlock() {
    setIsAdmin(true);
    setShowAdminModal(false);
  }
  function handleLock() {
    adminLogout();
    setIsAdmin(false);
  }
  // Who you are now comes from your code, so "switch user" means sign out and
  // sign back in as yourself. Clearing the name on its own would leave the
  // session open with nobody attached to it.
  async function handleSwitchUser() {
    setCurrentUser('');
    localStorage.removeItem('ctd_current_user');
    await staffLogout();
    setIsAdmin(false);
    setSignedIn(false);
  }

  // Leaving a draft used to throw it away, name, dots, tasks and all, with a
  // toast explaining what it had needed. Now anything with a name is saved on
  // the way out instead of being lost.
  function maybeDiscardDraft() {
    if (!draftProject) return;
    clearTimeout(draftSaveTimer.current);
    if (draftProject.name?.trim()) { saveDraftNow(draftProject); return; }
    setDraftProject(null);
    showToast('That project had no name yet, so there was nothing to save.');
  }

  // Replace one project in local state, keeping the rest untouched.
  function applyProject(project) {
    setProjects(ps => ps.some(p => p.id === project.id)
      ? ps.map(p => (p.id === project.id ? project : p))
      : [...ps, project]);
  }

  // A draft lives only in local state until it has enough to be a real event.
  // Once it does, this is the insert.
  // Write the draft out for real. A name is the whole requirement — it used to
  // also demand a date and a lead, which meant someone could fill in eight
  // boxes of tasks and still have nothing saved anywhere.
  async function saveDraftNow(project) {
    clearTimeout(draftSaveTimer.current);
    if (!project?.name?.trim()) {
      showToast('Give the project a name and it saves itself from there.');
      return null;
    }
    const res = await runWrite(() => api.createProject(project));
    if (!res?.project) return null;
    applyProject(res.project);
    setSelectedId(res.project.id);
    setDraftProject(null);
    return res.project;
  }

  // Every keystroke lands here, so the write waits for a pause rather than
  // creating a project called "S" the moment someone starts typing "Spring".
  // Once it exists, edits go through handleUpdateProject and patch as they go.
  function handleUpdateDraft(project) {
    setDraftProject(project);
    clearTimeout(draftSaveTimer.current);
    if (!project.name?.trim()) return;
    draftSaveTimer.current = setTimeout(() => saveDraftNow(project), 1200);
  }

  function handleDiscardDraft() {
    setDraftProject(null);
  }

  async function handleAddNote(projectId, text) {
    const res = await runWrite(() => api.addNote(projectId, text, currentUser || null));
    if (!res) return;
    setProjects(ps => ps.map(p => (p.id === projectId ? { ...p, notes: res.notes } : p)));
  }

  async function handleToggleBlessed(id) {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    const res = await runWrite(
      () => (project.blessed ? api.revokeProject(id) : api.approveProject(id, currentUser || null)),
      () => applyProject({ ...project, blessed: !project.blessed })
    );
    if (res) await refresh();
  }

  // Roster changes are admin-only and go through the Netlify function, because
  // the database revokes them from staff outright.
  // The sign-in code rides along with the member form but lives in its own
  // table, so it's a second call. `code` is only present when the form actually
  // had the field — never send it otherwise, or an edit made before the codes
  // loaded would wipe someone's access.
  // Anyone on staff can add someone. Admins go the long way round because only
  // they can attach a sign-in code or mark a new person as an approver; for
  // everyone else it is a single insert the database allows outright.
  async function handleAddMember({ code, isAdmin: makeAdmin, ...member }) {
    if (!isAdmin) {
      const res = await runWrite(() => api.addMember(member));
      if (res) await refresh();
      return;
    }
    const res = await runWrite(() => api.saveMember({ ...member, isAdmin: makeAdmin }));
    if (!res) return;
    const newId = res?.data?.member?.id;
    if (newId && code !== undefined) await runWrite(() => api.setMemberCode(newId, code));
    await refresh();
  }
  // A non-admin opening this form can only have changed how someone looks, so
  // that is all that gets sent. Routing it through saveMember would hit the
  // admin function and 401 — and the database would refuse the write anyway.
  async function handleUpdateMember(id, { code, ...member }) {
    if (!isAdmin) {
      const res = await runWrite(() => api.updateMemberLook(id, member));
      if (res) await refresh();
      return;
    }
    const res = await runWrite(() => api.saveMember({ id, ...member }));
    if (!res) return;
    if (code !== undefined) await runWrite(() => api.setMemberCode(id, code));
    await refresh();
  }
  async function handleDeleteMember(id) {
    const res = await runWrite(
      () => api.deleteMember(id),
      () => setTeam(t => t.filter(m => m.id !== id))
    );
    if (res) await refresh();
  }

  // One dot at a time. Two staff editing different dots of the same project
  // touch different rows, so neither can overwrite the other.
  async function handleSaveDot(projectId, slot, dot) {
    const prev = projects.find(p => p.id === projectId);
    const res = await runWrite(
      () => api.saveDot(projectId, slot, dot),
      () => {
        if (!prev) return;
        const dots = [...(prev.dots || [])];
        dots[slot] = dot;
        applyProject({ ...prev, dots });
      }
    );
    if (res?.project) applyProject(res.project);
  }

  async function handleUpdateProject(project) {
    const prev = projects.find(p => p.id === project.id);
    if (!prev) return;

    // Approving is admin-only and lives behind the function, so a change to
    // `blessed` has to be split out from the ordinary field patch.
    if (!!prev.blessed !== !!project.blessed) {
      await handleToggleBlessed(project.id);
      return;
    }
    const res = await runWrite(
      () => api.updateProjectFields(project.id, prev, project),
      () => applyProject(project)
    );

    // Connect the Dots just happened. Fired after the write, so the office is
    // never told about a submission that did not land — and not awaited, since
    // the staffer's screen should not sit on a mail server's timing.
    if (res && !prev.submitted && project.submitted) {
      api.notifySubmitted(project.id).then(r => {
        if (r?.sent) showToast('Sent to the office for approval. They’ve been emailed.');
        else showToast('Sent to the office for approval.');
      });
    }
  }

  // A new board starts with empty boxes on purpose. It used to open with every
  // staff member already dealt a dot, which quietly decided two things for the
  // person creating the event: that everyone is involved, and that the team is
  // exactly as big as the roster. "A team of 8" is the starting point to adjust
  // — the names go in when whoever is planning it is ready to put them there.
  const NEW_PROJECT_DOTS = 8;

  function handleNewProject() {
    const draft = {
      id: crypto.randomUUID(),
      name: '',
      date: '',
      leads: [],
      dots: Array.from({ length: NEW_PROJECT_DOTS }, () => ({ member: '', responsibilities: [] })),
      dotCount: NEW_PROJECT_DOTS,
      notes: [],
      submitted: false,
      blessed: false,
    };
    setDraftProject(draft);
    setSelectedId(null);
    setNavView('projects');
    setSelectedPerson(null);
  }

  async function handleDelete(id) {
    const res = await runWrite(
      () => api.deleteProject(id),
      () => setProjects(ps => ps.filter(p => p.id !== id))
    );
    if (res) setSelectedId(null);
  }

  async function handleDuplicate(project) {
    const res = await runWrite(() => api.duplicateProject(project.id));
    if (!res?.project) return;
    applyProject(res.project);
    setSelectedId(res.project.id);
  }

  const selected = projects.find(p => p.id === selectedId) || null;

  // One row, one boolean. This is the interaction the whole schema was shaped
  // around: two people ticking their own boxes at the same moment both stick.
  async function handleToggleTask(projectId, dotIndex, taskIndex) {
    const project = projects.find(p => p.id === projectId);
    const task = project?.dots?.[dotIndex]?.responsibilities?.[taskIndex];
    if (!task?.id) return;
    const done = !task.done;

    await runWrite(
      () => api.toggleTask(task.id, done, currentUser || null),
      () => setProjects(ps => ps.map(p => {
        if (p.id !== projectId) return p;
        const dots = (p.dots || []).map((d, di) => {
          if (di !== dotIndex) return d;
          const tasks = Array.isArray(d.responsibilities) ? d.responsibilities : [];
          return { ...d, responsibilities: tasks.map((t, ti) => (ti === taskIndex ? { ...t, done } : t)) };
        });
        return { ...p, dots };
      }))
    );
  }

  function goToProjects() {
    maybeDiscardDraft();
    setNavView('projects'); setSelectedId(null); setSelectedPerson(null);
  }
  function goToPeople() {
    maybeDiscardDraft();
    setNavView('people'); setSelectedId(null); setSelectedPerson(null);
  }
  function goToTasks() {
    maybeDiscardDraft();
    setNavView('tasks'); setSelectedId(null); setSelectedPerson(null);
  }
  function goToApprovals() {
    maybeDiscardDraft();
    setNavView('approvals'); setSelectedId(null); setSelectedPerson(null);
  }

  const showDashboard = navView === 'dashboard';
  const showProjects = navView === 'projects';
  const showPeople = navView === 'people';
  const showTasks = navView === 'tasks';
  const showApprovals = navView === 'approvals';
  const pendingCount = projects.filter(p => p.submitted && !p.blessed).length;

  if (signedIn === false) {
    return <StaffCodeGate onSignedIn={async (member) => {
      // staffLogin has already stashed an admin token if the roster says this
      // person approves, so this reads back what the server decided rather
      // than trusting anything the sign-in screen passed along.
      setIsAdmin(!!adminToken());
      if (member?.name) {
        setCurrentUser(member.name);
        // Cached so a reload doesn't have to ask again — the Supabase session
        // survives, but it's the shared staff identity and can't say which
        // person it is. The value here came from the server's answer to the
        // code, not from anything the browser picked.
        localStorage.setItem('ctd_current_user', member.name);
      }
      setSignedIn(true);
      setBooting(true);
      const err = await refresh();
      setBootError(err || '');
      setBooting(false);
    }} />;
  }

  if (booting || bootError) {
    return <BootScreen error={bootError} onRetry={async () => {
      setBooting(true);
      setBootError('');
      const err = await refresh();
      setBootError(err || '');
      setBooting(false);
    }} />;
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          Connect<span>Hub</span>
          <div className="sidebar-logo-school">Archbishop Chapelle</div>
        </div>

        <button
          className={`nav-btn ${showDashboard && !selected ? 'active' : ''}`}
          onClick={() => { maybeDiscardDraft(); setNavView('dashboard'); setSelectedId(null); setSelectedPerson(null); }}
        >
          <LayoutDashboard size={16} />
          Home
        </button>

        <button
          className={`nav-btn ${showProjects ? 'active' : ''}`}
          onClick={goToProjects}
        >
          <Network size={16} />
          Projects
        </button>

        <button
          className={`nav-btn ${showPeople ? 'active' : ''}`}
          onClick={goToPeople}
        >
          <Users size={16} />
          Team
        </button>

        <button
          className={`nav-btn ${showTasks ? 'active' : ''}`}
          onClick={goToTasks}
        >
          <ListChecks size={16} />
          Tasks
        </button>

        <button
          className={`nav-btn ${showApprovals ? 'active' : ''}`}
          onClick={goToApprovals}
          style={{ position: 'relative' }}
        >
          <BadgeCheck size={16} style={{ color: isAdmin ? 'var(--yellow)' : 'currentColor' }} />
          Approvals
          {isAdmin && pendingCount > 0 && (
            <span style={{
              marginLeft: 'auto',
              background: '#E46E88', color: '#FFFFFF',
              borderRadius: 99, padding: '1px 7px',
              fontSize: 10, fontWeight: 700,
              fontFamily: 'Montserrat, sans-serif',
              lineHeight: 1.6,
            }}>
              {pendingCount}
            </span>
          )}
        </button>

        {/* The floating pink + is gone. Every screen that can start a project
            already has its own add button, so this was a second door to the
            same room, sitting in the middle of the nav where it broke the run
            of items. */}

        {/* Who you are, down at the foot with the other account controls rather
            than wedged into the navigation. Name on its own line above the
            sign-out so neither has to be truncated to "KELLY CLA…". */}
        <div className="sidebar-foot" style={{ marginTop: 'auto', paddingTop: 14 }}>
          {currentUser && (
            <div style={{ padding: '0 12px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.92)', marginBottom: 7 }}>
                <UserCircle size={15} strokeWidth={2} style={{ flexShrink: 0, opacity: 0.65 }} />
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentUser}
                </span>
              </div>
              <button
                onClick={handleSwitchUser}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 23, color: 'rgba(255,255,255,0.45)', fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', transition: 'color 0.15s' }}
                onMouseOver={e => e.currentTarget.style.color = 'rgba(255,255,255,0.85)'}
                onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
              >
                Sign out
              </button>
            </div>
          )}
          {isAdmin ? (
            <button
              onClick={handleLock}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(69,125,88,0.2)', border: '1px solid rgba(69,125,88,0.4)', borderRadius: 8, cursor: 'pointer', color: '#6ee0a0', fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}
            >
              <Unlock size={13} strokeWidth={2} />
              Admin Mode
              <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: 10 }}>Lock</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAdminModal(true)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer', color: 'rgba(255,255,255,0.35)', fontFamily: 'Montserrat, sans-serif', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}
            >
              <Lock size={13} strokeWidth={2} />
              Admin Login
            </button>
          )}
        </div>
      </aside>

      <main className="main">
        {/* Mobile only — the bottom nav has no room for these, and knowing who
            you're signed in as decides which tasks you can check off. */}
        <div className="mobile-utility">
          {currentUser && (
            <button onClick={handleSwitchUser} title="Sign out">
              <UserCircle size={14} strokeWidth={2} />
              {currentUser} · Sign Out
            </button>
          )}
          {isAdmin ? (
            <button className="is-admin" onClick={handleLock}>
              <Unlock size={13} strokeWidth={2} /> Admin · Lock
            </button>
          ) : (
            <button onClick={() => setShowAdminModal(true)}>
              <Lock size={13} strokeWidth={2} /> Admin
            </button>
          )}
        </div>

        {draftProject ? (
          <ProjectDetail
            project={draftProject}
            isNew={true}
            saveState={saveState}
            onSaveNow={() => saveDraftNow(draftProject)}
            projects={projects}
            team={team}
            isAdmin={isAdmin}
            currentUser={currentUser}
            onSaveDot={(slot, dot) => setDraftProject(p => {
              const dots = [...(p.dots || [])];
              dots[slot] = dot;
              return { ...p, dots };
            })}
            onUpdateProject={handleUpdateDraft}
            onDelete={handleDiscardDraft}
            onBack={handleDiscardDraft}
            onSelectPerson={name => { setDraftProject(null); setNavView('people'); setSelectedId(null); setSelectedPerson(name); }}
          />
        ) : selected ? (
          <ProjectDetail
            project={selected}
            saveState={saveState}
            projects={projects}
            team={team}
            isAdmin={isAdmin}
            currentUser={currentUser}
            onSaveDot={(slot, dot) => handleSaveDot(selected.id, slot, dot)}
            onUpdateProject={handleUpdateProject}
            onDelete={() => handleDelete(selected.id)}
            onDuplicate={() => handleDuplicate(selected)}
            onBack={() => setSelectedId(null)}
            onSelectPerson={name => { setNavView('people'); setSelectedId(null); setSelectedPerson(name); }}
          />
        ) : showPeople && selectedPerson ? (
          <PersonView
            name={selectedPerson}
            projects={projects}
            team={team}
            isAdmin={isAdmin}
            currentUser={currentUser}
            onBack={() => setSelectedPerson(null)}
            onOpenStickyNote={() => setShowStickyModal(true)}
            onToggleTask={handleToggleTask}
          />
        ) : showPeople ? (
          <PeopleView
            team={team}
            projects={projects}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            isAdmin={isAdmin}
            currentUser={currentUser}
            onToggleTask={handleToggleTask}
            onSelectPerson={name => setSelectedPerson(name)}
            onOpenStickyNote={() => setShowStickyModal(true)}
          />
        ) : showTasks ? (
          <TasksView
            projects={projects}
            team={team}
            isAdmin={isAdmin}
            currentUser={currentUser}
            onToggleTask={handleToggleTask}
            onOpenStickyNote={() => setShowStickyModal(true)}
          />
        ) : showApprovals ? (
          <ApprovalsView
            projects={projects}
            isAdmin={isAdmin}
            onToggleBlessed={handleToggleBlessed}
            onSelect={id => { setSelectedId(id); setNavView('projects'); }}
            onOpenStickyNote={() => setShowStickyModal(true)}
          />
        ) : showDashboard ? (
          <DashboardView
            projects={projects}
            team={team}
            isAdmin={isAdmin}
            onSelectProject={id => { setSelectedId(id); setNavView('projects'); }}
            onSelectPerson={name => { setNavView('people'); setSelectedId(null); setSelectedPerson(name); }}
            onOpenStickyNote={() => setShowStickyModal(true)}
            onNavigate={view => { maybeDiscardDraft(); setNavView(view); setSelectedId(null); setSelectedPerson(null); }}
            currentUser={currentUser}
            onToggleTask={handleToggleTask}
          />
        ) : (
          <ProjectsView
            projects={projects}
            team={team}
            onSelect={id => setSelectedId(id)}
            onNew={handleNewProject}
            onAddNote={handleAddNote}
            onOpenStickyNote={() => setShowStickyModal(true)}
          />
        )}
      </main>

      <button
        className="mobile-fab"
        onClick={handleNewProject}
        aria-label="New Project"
      >
        <Plus size={22} />
      </button>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: 'var(--blue)', color: '#fff',
          padding: '12px 24px', borderRadius: 99,
          fontSize: 13, fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
          letterSpacing: '0.05em', whiteSpace: 'nowrap',
          boxShadow: '0 6px 24px rgba(13,43,26,0.25)',
          zIndex: 500, pointerEvents: 'none',
        }}>
          {toast}
        </div>
      )}

      {showStickyModal && (
        <StickyNoteModal
          projects={projects}
          onSave={handleAddNote}
          onClose={() => setShowStickyModal(false)}
        />
      )}

      {showAdminModal && (
        <PasswordModal
          onUnlock={handleUnlock}
          onClose={() => setShowAdminModal(false)}
        />
      )}

    </div>
  );
}
