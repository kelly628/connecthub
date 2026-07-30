import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react';

function normalizeTasks(responsibilities) {
  if (Array.isArray(responsibilities)) return responsibilities;
  if (!responsibilities) return [];
  return String(responsibilities).split(/,\s*|\n/).filter(t => t.trim()).map(text => ({ text: text.trim(), done: false }));
}

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

export default function PersonView({ name, projects, team = [], onBack, onToggleTask, isAdmin = false, currentUser = '' }) {
  // All assignments for this person, sorted by date
  const assignments = [];
  projects.forEach(project => {
    (project.dots || []).forEach((dot, dotIdx) => {
      if (dot.member?.trim().toLowerCase() !== name.trim().toLowerCase()) return;
      assignments.push({
        projectId: project.id,
        projectName: project.name,
        date: project.date,
        leads: project.leads,
        blessed: project.blessed,
        dotIdx,
        responsibilities: dot.responsibilities,
      });
    });
  });
  assignments.sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const upcoming = assignments.filter(a => !a.date || daysUntil(a.date) >= 0);
  const past = assignments.filter(a => a.date && daysUntil(a.date) < 0);

  function AssignmentCard({ a }) {
    const days = daysUntil(a.date);
    const isPast = days !== null && days < 0;
    return (
      <div style={{
        border: '1px solid var(--border)', borderRadius: 12,
        padding: '18px 22px', background: isPast ? 'var(--cream)' : 'var(--surface)',
        opacity: isPast ? 0.7 : 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: 'var(--blue)', marginBottom: 4 }}>
              {a.projectName}
            </div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{fmt(a.date)}</span>
              {a.leads?.length > 0 && (
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Lead: <strong style={{ color: 'var(--text)' }}>{Array.isArray(a.leads) ? a.leads.join(', ') : a.leads}</strong></span>
              )}
              <span style={{
                fontSize: 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                color: a.blessed ? 'var(--green)' : 'var(--muted)',
                display: 'flex', alignItems: 'center', gap: 3,
              }}>
                {a.blessed ? <><CheckCircle2 size={10} /> Approved</> : <><Clock size={10} /> Pending Approval</>}
              </span>
            </div>
          </div>
          {days !== null && (
            <span className={`deadline-badge ${days <= 7 ? 'urgent' : days <= 30 ? 'soon' : ''}`}
              style={{ fontSize: 10, padding: '3px 10px', flexShrink: 0, marginTop: 2 }}>
              {days < 0 ? 'Past' : days === 0 ? 'Today' : `${days} days`}
            </span>
          )}
        </div>

        <div style={{
          background: '#f4faf7', border: '1px solid rgba(69,125,88,0.15)',
          borderRadius: 8, padding: '12px 14px',
        }}>
          <div style={{ fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--green)', marginBottom: 8 }}>
            Your Responsibilities
          </div>
          {(() => {
            const tasks = normalizeTasks(a.responsibilities);
            if (tasks.length === 0) return <em style={{ fontSize: 12, color: 'var(--muted)' }}>No tasks listed yet.</em>;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(() => {
                    const canToggle = a.blessed && (isAdmin || currentUser.trim().toLowerCase() === name.trim().toLowerCase());
                    return tasks.map((task, i) => (
                  <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: canToggle ? 'pointer' : 'default', opacity: a.blessed ? 1 : 0.5 }}>
                    <input
                      type="checkbox"
                      checked={task.done}
                      disabled={!canToggle}
                      onChange={() => canToggle && onToggleTask?.(a.projectId, a.dotIdx, i)}
                      style={{ marginTop: 2, accentColor: 'var(--green)', flexShrink: 0, cursor: canToggle ? 'pointer' : 'default' }}
                    />
                    <span style={{ fontSize: 13, color: task.done ? 'var(--muted)' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none', lineHeight: 1.5, transition: 'all 0.15s' }}>
                      {task.text}
                    </span>
                  </label>
                ));
                  })()}
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 12, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 4, padding: 0, marginBottom: 16 }}
      >
        <ArrowLeft size={13} /> Team
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
        {(() => {
          const member = team.find(m => m.name.trim().toLowerCase() === name.trim().toLowerCase());
          return (
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--green)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {member?.photoUrl
                ? <img src={member.photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: 'Montserrat, sans-serif' }}>{initials}</span>}
            </div>
          );
        })()}
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>{name}</h1>
          <p className="page-subtitle">
            {upcoming.length} upcoming {upcoming.length === 1 ? 'project' : 'projects'}
            {past.length > 0 ? ` · ${past.length} past` : ''}
          </p>
        </div>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div className="section-title">Upcoming Projects</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {upcoming.map((a, i) => <AssignmentCard key={i} a={a} />)}
          </div>
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div>
          <div className="section-title">Past Projects</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {past.map((a, i) => <AssignmentCard key={i} a={a} />)}
          </div>
        </div>
      )}

      {assignments.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)', fontSize: 14 }}>
          No assignments found for {name}.
        </div>
      )}
    </div>
  );
}
