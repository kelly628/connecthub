import { useState, useEffect } from 'react';
import { Network, Plus, Users, ListChecks, BadgeCheck, X, LayoutDashboard } from 'lucide-react';
import { load, save, loadTeam, saveTeam } from './data/store';
import ProjectsView from './components/ProjectsView';
import ProjectDetail from './components/ProjectDetail';
import ProjectForm from './components/ProjectForm';
import PeopleView from './components/PeopleView';
import PersonView from './components/PersonView';
import TasksView from './components/TasksView';
import ApprovalsView from './components/ApprovalsView';
import DashboardView from './components/DashboardView';

function StickyNoteModal({ projects, onSave, onClose }) {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || '');
  const [text, setText] = useState('');
  const canSave = text.trim() && selectedProjectId;
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(13,23,48,0.28)', zIndex: 300, backdropFilter: 'blur(4px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: '#fff', borderRadius: 14, zIndex: 301,
        width: 360, boxShadow: '0 24px 64px rgba(13,23,48,0.18), 0 2px 8px rgba(13,23,48,0.07)',
        overflow: 'hidden',
      }}>
        {/* Yellow accent bar */}
        <div style={{ height: 3, background: 'var(--yellow)', width: '100%' }} />

        <div style={{ padding: '22px 24px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontFamily: 'Commune, serif', fontSize: 20, fontWeight: 700, color: 'var(--blue)' }}>New Sticky Note</div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', padding: 4, borderRadius: 6, transition: 'color 0.15s' }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--blue)'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--muted)'}
            ><X size={15} /></button>
          </div>

          <div style={{ fontSize: 9, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 6 }}>Project</div>
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            style={{ width: '100%', marginBottom: 16, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 600, color: 'var(--blue)', background: '#fff', outline: 'none', boxSizing: 'border-box' }}
          >
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>

          <div style={{ fontSize: 9, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 6 }}>Note</div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write your note here..."
            rows={5}
            autoFocus
            style={{ width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontFamily: 'Barlow Condensed, sans-serif', resize: 'vertical', boxSizing: 'border-box', background: '#FAFAF8', outline: 'none', lineHeight: 1.6, color: 'var(--text)' }}
          />

          <div style={{ display: 'flex', gap: 8, marginTop: 16, alignItems: 'center', justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ padding: '8px 16px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', transition: 'all 0.15s' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = 'var(--blue)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
            >
              Cancel
            </button>
            <button
              onClick={() => { if (canSave) { onSave(selectedProjectId, text.trim()); onClose(); } }}
              disabled={!canSave}
              style={{ padding: '9px 20px', background: canSave ? 'var(--yellow)' : 'var(--cream-dk)', border: 'none', borderRadius: 8, cursor: canSave ? 'pointer' : 'not-allowed', fontSize: 11, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: canSave ? 'var(--blue)' : 'var(--muted)', transition: 'all 0.15s' }}
            >
              Save Note
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function CountdownWidget({ events = [] }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const todayStr = now.toISOString().slice(0, 10);
  const next = [...events]
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  if (!next) return null;

  const diff = Math.max(0, new Date(next.date + 'T00:00:00') - now);
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000) / 60000);
  const secs  = Math.floor((diff % 60000) / 1000);

  return (
    <div className="sidebar-countdown">
      <div className="sidebar-countdown-label">Next Event</div>
      <div className="sidebar-countdown-name">{next.name}</div>
      <div className="sidebar-countdown-grid">
        {[['d', days], ['h', hours], ['m', mins], ['s', secs]].map(([label, val]) => (
          <div key={label} className="sidebar-countdown-cell">
            <div className="sidebar-countdown-num">{String(val).padStart(2, '0')}</div>
            <div className="sidebar-countdown-unit">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [projects, setProjects] = useState(load);
  const [selectedId, setSelectedId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [navView, setNavView] = useState('dashboard');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [team, setTeam] = useState(loadTeam);
  const [showStickyModal, setShowStickyModal] = useState(false);
  const [draftProject, setDraftProject] = useState(null);
  const [toast, setToast] = useState(null);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  function maybeDiscardDraft() {
    if (draftProject) {
      setDraftProject(null);
      showToast("Almost! A project needs a name + lead before it saves ✨");
    }
  }

  function handleUpdateDraft(project) {
    const leadsArr = Array.isArray(project.leads) ? project.leads : project.leads ? [project.leads] : [];
    if (project.name?.trim() && project.date && leadsArr.length > 0) {
      persist([...projects, project]);
      setSelectedId(project.id);
      setDraftProject(null);
    } else {
      setDraftProject(project);
    }
  }

  function handleDiscardDraft() {
    setDraftProject(null);
  }

  function handleAddNote(projectId, text) {
    persist(projects.map(p => p.id === projectId ? {
      ...p,
      notes: [...(p.notes || []), { id: crypto.randomUUID(), text, createdAt: new Date().toISOString() }],
    } : p));
  }

  function handleToggleBlessed(id) {
    persist(projects.map(p => p.id === id ? { ...p, blessed: !p.blessed } : p));
  }

  function persistTeam(updated) { setTeam(updated); saveTeam(updated); }

  function persist(updated) {
    setProjects(updated);
    save(updated);
  }

  function handleSaveProject(project) {
    const isNew = !projects.find(p => p.id === project.id);
    const updated = isNew
      ? [...projects, project]
      : projects.map(p => p.id === project.id ? project : p);
    persist(updated);
    setShowForm(false);
    setEditingProject(null);
    setSelectedId(project.id);
  }

  function handleUpdateDots(id, dots) {
    persist(projects.map(p => p.id === id ? { ...p, dots } : p));
  }

  function handleUpdateProject(project) {
    persist(projects.map(p => p.id === project.id ? project : p));
  }

  function handleNewProject() {
    const memberDots = [...team].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 12).map(m => ({ member: m.name, responsibilities: [] }));
    const draft = {
      id: crypto.randomUUID(),
      name: '',
      date: '',
      leads: [],
      dots: memberDots,
      dotCount: memberDots.length > 0 ? Math.min(memberDots.length, 12) : 8,
      notes: [],
      submitted: false,
      blessed: false,
    };
    setDraftProject(draft);
    setSelectedId(null);
    setNavView('projects');
    setShowForm(false);
    setEditingProject(null);
    setSelectedPerson(null);
  }

  function handleDelete(id) {
    persist(projects.filter(p => p.id !== id));
    setSelectedId(null);
  }

  function handleDuplicate(project) {
    const copy = {
      ...project,
      id: crypto.randomUUID(),
      name: `${project.name} (Copy)`,
      dots: (project.dots || []).map(d => ({
        ...d,
        responsibilities: Array.isArray(d.responsibilities)
          ? d.responsibilities.map(t => ({ ...t, done: false }))
          : [],
      })),
    };
    persist([...projects, copy]);
    setSelectedId(copy.id);
  }

  const selected = projects.find(p => p.id === selectedId) || null;
  const upcomingEvents = projects.map(p => ({ name: p.name, date: p.date }));

  function handleToggleTask(projectId, dotIndex, taskIndex) {
    const updated = projects.map(p => {
      if (p.id !== projectId) return p;
      const dots = (p.dots || []).map((d, di) => {
        if (di !== dotIndex) return d;
        const tasks = Array.isArray(d.responsibilities) ? d.responsibilities : [];
        return { ...d, responsibilities: tasks.map((t, ti) => ti === taskIndex ? { ...t, done: !t.done } : t) };
      });
      return { ...p, dots };
    });
    persist(updated);
  }

  function goToProjects() {
    maybeDiscardDraft();
    setNavView('projects'); setSelectedId(null); setShowForm(false);
    setEditingProject(null); setSelectedPerson(null);
  }
  function goToPeople() {
    maybeDiscardDraft();
    setNavView('people'); setSelectedId(null); setShowForm(false);
    setEditingProject(null); setSelectedPerson(null);
  }
  function goToTasks() {
    maybeDiscardDraft();
    setNavView('tasks'); setSelectedId(null); setShowForm(false);
    setEditingProject(null); setSelectedPerson(null);
  }
  function goToApprovals() {
    maybeDiscardDraft();
    setNavView('approvals'); setSelectedId(null); setShowForm(false);
    setEditingProject(null); setSelectedPerson(null);
  }

  const showDashboard = navView === 'dashboard';
  const showProjects = navView === 'projects';
  const showPeople = navView === 'people';
  const showTasks = navView === 'tasks';
  const showApprovals = navView === 'approvals';
  const pendingCount = projects.filter(p => p.submitted && !p.blessed).length;

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          Connect<span>Hub</span>
        </div>

        <button
          className={`nav-btn ${showDashboard && !selected && !showForm ? 'active' : ''}`}
          onClick={() => { maybeDiscardDraft(); setNavView('dashboard'); setSelectedId(null); setShowForm(false); setEditingProject(null); setSelectedPerson(null); }}
        >
          <LayoutDashboard size={16} />
          Home
        </button>

        <button
          className={`nav-btn ${showProjects && !showForm ? 'active' : ''}`}
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
          <BadgeCheck size={16} />
          Approvals
          {pendingCount > 0 && (
            <span style={{
              marginLeft: 'auto',
              background: '#F5C800', color: '#5a3e00',
              borderRadius: 99, padding: '1px 7px',
              fontSize: 10, fontWeight: 700,
              fontFamily: 'Barlow Condensed, sans-serif',
              lineHeight: 1.6,
            }}>
              {pendingCount}
            </span>
          )}
        </button>

        <button
          className="sidebar-new-btn"
          title="New Project"
          style={{
            marginTop: 12,
            width: 42, height: 42,
            borderRadius: '50%',
            background: 'var(--yellow)', color: '#112275',
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', alignSelf: 'center',
            boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
            transition: 'filter 0.15s, transform 0.15s',
            flexShrink: 0,
          }}
          onMouseOver={e => { e.currentTarget.style.filter = 'brightness(0.92)'; e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseOut={e => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.transform = 'none'; }}
          onClick={handleNewProject}
        >
          <Plus size={20} />
        </button>

        <CountdownWidget events={upcomingEvents} />
      </aside>

      <main className="main">
        {showForm ? (
          <ProjectForm
            initial={editingProject}
            team={team}
            onSave={handleSaveProject}
            onCancel={() => { setShowForm(false); setEditingProject(null); }}
          />
        ) : draftProject ? (
          <ProjectDetail
            project={draftProject}
            isNew={true}
            projects={projects}
            team={team}
            onUpdateDots={dots => setDraftProject(p => ({ ...p, dots }))}
            onUpdateProject={handleUpdateDraft}
            onEdit={() => {}}
            onDelete={handleDiscardDraft}
            onDuplicate={() => {}}
            onBack={handleDiscardDraft}
            onSelectPerson={name => { setDraftProject(null); setNavView('people'); setSelectedId(null); setSelectedPerson(name); }}
          />
        ) : selected ? (
          <ProjectDetail
            project={selected}
            projects={projects}
            team={team}
            onUpdateDots={dots => handleUpdateDots(selected.id, dots)}
            onUpdateProject={handleUpdateProject}
            onEdit={() => { setEditingProject(selected); setShowForm(true); }}
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
            onBack={() => setSelectedPerson(null)}
            onOpenStickyNote={() => setShowStickyModal(true)}
            onToggleTask={handleToggleTask}
          />
        ) : showPeople ? (
          <PeopleView
            team={team}
            projects={projects}
            onSaveTeam={persistTeam}
            onToggleTask={handleToggleTask}
            onSelectPerson={name => setSelectedPerson(name)}
            onOpenStickyNote={() => setShowStickyModal(true)}
          />
        ) : showTasks ? (
          <TasksView
            projects={projects}
            team={team}
            onToggleTask={handleToggleTask}
            onOpenStickyNote={() => setShowStickyModal(true)}
          />
        ) : showApprovals ? (
          <ApprovalsView
            projects={projects}
            onToggleBlessed={handleToggleBlessed}
            onSelect={id => { setSelectedId(id); setNavView('projects'); }}
            onOpenStickyNote={() => setShowStickyModal(true)}
          />
        ) : showDashboard ? (
          <DashboardView
            projects={projects}
            team={team}
            onSelectProject={id => { setSelectedId(id); setNavView('projects'); }}
            onSelectPerson={name => { setNavView('people'); setSelectedId(null); setSelectedPerson(name); }}
            onOpenStickyNote={() => setShowStickyModal(true)}
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
          fontSize: 13, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
          letterSpacing: '0.05em', whiteSpace: 'nowrap',
          boxShadow: '0 6px 24px rgba(13,23,48,0.25)',
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
    </div>
  );
}
