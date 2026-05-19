import { useState } from 'react';
import LogoMark from './LogoMark';

function normalizeTasks(responsibilities) {
  if (Array.isArray(responsibilities)) return responsibilities;
  if (!responsibilities) return [];
  return String(responsibilities).split(/,\s*|\n/).filter(t => t.trim()).map(text => ({ text: text.trim(), done: false }));
}

function fmt(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TasksView({ projects, team, onToggleTask, onOpenStickyNote }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('');
  const [memberFilter, setMemberFilter] = useState('');

  // Build flat task list
  const allTasks = [];
  projects.forEach(project => {
    (project.dots || []).forEach((dot, dotIdx) => {
      if (!dot.member?.trim()) return;
      const tasks = normalizeTasks(dot.responsibilities);
      const member = team.find(m => m.name.trim().toLowerCase() === dot.member.trim().toLowerCase());
      tasks.forEach((task, taskIdx) => {
        if (!task.text?.trim()) return;
        allTasks.push({
          projectId: project.id,
          projectName: project.name,
          projectDate: project.date,
          dotIndex: dotIdx,
          taskIndex: taskIdx,
          memberName: dot.member,
          memberPhoto: member?.photoUrl || null,
          taskText: task.text,
          done: task.done,
        });
      });
    });
  });

  const totalAll = allTasks.length;
  const doneAll = allTasks.filter(t => t.done).length;
  const pct = totalAll > 0 ? Math.round((doneAll / totalAll) * 100) : 0;

  // Unique member names across all tasks
  const members = [...new Set(allTasks.map(t => t.memberName))].sort();

  // Apply filters
  const filtered = allTasks.filter(t => {
    if (statusFilter === 'pending' && t.done) return false;
    if (statusFilter === 'done' && !t.done) return false;
    if (projectFilter && t.projectId !== projectFilter) return false;
    if (memberFilter && t.memberName !== memberFilter) return false;
    return true;
  });

  // Group by project
  const grouped = {};
  filtered.forEach(t => {
    if (!grouped[t.projectId]) {
      grouped[t.projectId] = { name: t.projectName, date: t.projectDate, tasks: [] };
    }
    grouped[t.projectId].tasks.push(t);
  });

  const selectStyle = {
    border: '1px solid var(--border)', borderRadius: 20, padding: '5px 14px',
    fontSize: 11, cursor: 'pointer', fontFamily: 'Barlow Condensed, sans-serif',
    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
    background: 'var(--surface)', color: 'var(--muted)', outline: 'none',
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tasks</h1>
          <p className="page-subtitle">{doneAll} of {totalAll} completed across all events</p>
        </div>
        <LogoMark size={36} onClick={onOpenStickyNote} />
      </div>

      {/* Overall progress bar */}
      {totalAll > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 10, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>
              Overall Team Progress
            </span>
            <span style={{ fontSize: 10, fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, color: pct === 100 ? 'var(--green)' : 'var(--muted)' }}>
              {pct}%
            </span>
          </div>
          <div style={{ height: 8, background: 'var(--cream-dk)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--green)', borderRadius: 99, transition: 'width 0.4s', opacity: pct === 100 ? 1 : 0.8 }} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {['all', 'pending', 'done'].map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} style={{
            border: '1px solid',
            borderColor: statusFilter === f ? 'var(--green)' : 'var(--border)',
            borderRadius: 20, padding: '5px 14px', fontSize: 11, cursor: 'pointer',
            fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            background: statusFilter === f ? 'var(--green)' : 'var(--surface)',
            color: statusFilter === f ? '#fff' : 'var(--muted)',
            transition: 'all 0.15s',
          }}>
            {f === 'all' ? 'All' : f === 'pending' ? 'Pending' : 'Done'}
          </button>
        ))}
        {projects.length > 1 && (
          <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)} style={selectStyle}>
            <option value="">All Events</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
        {members.length > 1 && (
          <select value={memberFilter} onChange={e => setMemberFilter(e.target.value)} style={selectStyle}>
            <option value="">All Members</option>
            {members.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        )}
        {(statusFilter !== 'all' || projectFilter || memberFilter) && (
          <button onClick={() => { setStatusFilter('all'); setProjectFilter(''); setMemberFilter(''); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--muted)', fontFamily: 'Barlow Condensed, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Clear
          </button>
        )}
      </div>

      {/* Task list grouped by project */}
      {Object.keys(grouped).length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)', fontSize: 14 }}>
          {totalAll === 0 ? 'No tasks assigned yet.' : 'No tasks match the current filter.'}
        </div>
      ) : (
        Object.entries(grouped).map(([projectId, group]) => (
          <div key={projectId} style={{ marginBottom: 28 }}>
            {/* Project header */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
              <div style={{ fontFamily: 'Commune, serif', fontSize: 18, fontWeight: 700, color: 'var(--blue)' }}>
                {group.name}
              </div>
              {group.date && (
                <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'Barlow Condensed, sans-serif' }}>
                  {fmt(group.date)}
                </div>
              )}
            </div>

            {/* Task rows */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: 'var(--surface)' }}>
              {group.tasks.map((task, i) => {
                const initials = task.memberName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px',
                    borderBottom: i < group.tasks.length - 1 ? '1px solid var(--border)' : 'none',
                    background: task.done ? 'var(--cream)' : 'var(--surface)',
                    transition: 'background 0.12s',
                  }}>
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => onToggleTask(task.projectId, task.dotIndex, task.taskIndex)}
                      style={{ width: 16, height: 16, accentColor: 'var(--green)', cursor: 'pointer', flexShrink: 0 }}
                    />
                    <span style={{ flex: 1, fontSize: 14, color: task.done ? 'var(--muted)' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none', lineHeight: 1.4 }}>
                      {task.taskText}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {task.memberName}
                      </span>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--green)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {task.memberPhoto
                          ? <img src={task.memberPhoto} alt={task.memberName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', fontFamily: 'Barlow Condensed, sans-serif' }}>{initials}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
