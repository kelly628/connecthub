import { CheckCircle2, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import LogoMark from './LogoMark';

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

function ApprovalCard({ project, onToggle, onSelect, approved, isAdmin = false }) {
  const days = daysUntil(project.date);
  let totalTasks = 0, doneTasks = 0;
  (project.dots || []).forEach(d => {
    const tasks = Array.isArray(d.responsibilities) ? d.responsibilities : [];
    totalTasks += tasks.length;
    doneTasks += tasks.filter(t => t.done).length;
  });
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1.5px solid ${approved ? 'var(--green)' : 'var(--cream-dk)'}`,
      borderRadius: 12,
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      transition: 'box-shadow 0.15s',
    }}>
      {/* Name + date row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div
            onClick={onSelect}
            style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: 'var(--blue)', cursor: 'pointer', lineHeight: 1.1, marginBottom: 4 }}
            onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}
          >
            {project.name}
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{fmt(project.date)}</span>
            {days !== null && (
              <span className={`deadline-badge ${days <= 7 ? 'urgent' : days <= 30 ? 'soon' : ''}`} style={{ fontSize: 10, padding: '2px 10px' }}>
                {days === 0 ? 'Today' : days < 0 ? 'Past' : `${days} days`}
              </span>
            )}
            {project.leads?.length > 0 && <span style={{ fontSize: 12, color: 'var(--muted)' }}>Lead: <strong style={{ color: 'var(--text)' }}>{Array.isArray(project.leads) ? project.leads.join(', ') : project.leads}</strong></span>}
          </div>
        </div>
        {isAdmin ? (
          <button
            onClick={() => {
              if (!approved) {
                confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors: ['#457D58', '#E46E88', '#0D2B1A'] });
              }
              onToggle();
            }}
            style={{
              flexShrink: 0, padding: '7px 14px', borderRadius: 8,
              border: `1.5px solid ${approved ? 'var(--border)' : 'var(--green)'}`,
              background: approved ? 'transparent' : 'var(--green)',
              color: approved ? 'var(--muted)' : '#fff',
              fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
            }}
          >
            {approved ? 'Revoke' : <><CheckCircle2 size={12} /> Approve</>}
          </button>
        ) : (
          <span style={{
            flexShrink: 0, padding: '6px 12px', borderRadius: 8,
            border: `1.5px solid ${approved ? 'rgba(69,125,88,0.3)' : 'var(--border)'}`,
            background: approved ? 'rgba(69,125,88,0.07)' : 'transparent',
            color: approved ? 'var(--green)' : 'var(--muted)',
            fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {approved ? <><CheckCircle2 size={12} /> Approved</> : <><Clock size={12} /> Pending</>}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>
              Team Progress
            </span>
            <span style={{ fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: pct === 100 ? 'var(--green)' : 'var(--muted)' }}>
              {pct}%
            </span>
          </div>
          <div style={{ height: 5, background: 'var(--cream-dk)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--green)', borderRadius: 99, opacity: pct === 100 ? 1 : 0.7, transition: 'width 0.4s' }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApprovalsView({ projects, isAdmin = false, onToggleBlessed, onSelect, onOpenStickyNote }) {
  const pending = projects.filter(p => p.submitted && !p.blessed);
  const approved = projects.filter(p => p.blessed);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Approvals</h1>
        </div>
        <LogoMark size={36} onClick={onOpenStickyNote} />
      </div>

      <div className="approvals-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, alignItems: 'start' }}>

        {/* Pending queue */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Clock size={13} color="var(--muted)" />
            <span style={{ fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>
              Awaiting Approval
            </span>
            {pending.length > 0 && (
              <span style={{ background: '#E46E88', color: '#FFFFFF', borderRadius: 99, padding: '1px 8px', fontSize: 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
                {pending.length}
              </span>
            )}
          </div>
          {pending.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13, fontStyle: 'italic' }}>
              Nothing pending — all clear!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pending.map(p => (
                <ApprovalCard
                  key={p.id}
                  project={p}
                  approved={false}
                  isAdmin={isAdmin}
                  onToggle={() => onToggleBlessed(p.id)}
                  onSelect={() => onSelect(p.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Approved */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <CheckCircle2 size={13} color="var(--green)" />
            <span style={{ fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--green)' }}>
              Approved
            </span>
            {approved.length > 0 && (
              <span style={{ background: 'var(--green)', color: '#fff', borderRadius: 99, padding: '1px 8px', fontSize: 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
                {approved.length}
              </span>
            )}
          </div>
          {approved.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 13, fontStyle: 'italic' }}>
              No events approved yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {approved.map(p => (
                <ApprovalCard
                  key={p.id}
                  project={p}
                  approved={true}
                  isAdmin={isAdmin}
                  onToggle={() => onToggleBlessed(p.id)}
                  onSelect={() => onSelect(p.id)}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
