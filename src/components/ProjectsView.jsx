import { useState } from 'react';
import { Plus, CheckCircle2, Clock, LayoutGrid, CalendarDays, ChevronLeft, ChevronRight, List } from 'lucide-react';
import LogoMark from './LogoMark';

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

const selectStyle = {
  border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px',
  fontSize: 12, fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text)',
  background: 'var(--surface)', cursor: 'pointer', outline: 'none',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function CalendarView({ projects, onSelect }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // Index projects by date string
  const byDate = {};
  projects.forEach(p => {
    if (!p.date) return;
    if (!byDate[p.date]) byDate[p.date] = [];
    byDate[p.date].push(p);
  });

  const todayStr = today.toISOString().slice(0, 10);

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={prevMonth} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--muted)' }}>
          <ChevronLeft size={15} />
        </button>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: 'var(--blue)', minWidth: 180, textAlign: 'center' }}>
          {monthLabel}
        </div>
        <button onClick={nextMonth} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--muted)' }}>
          <ChevronRight size={15} />
        </button>
        <button onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()); }}
          style={{ marginLeft: 4, background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}>
          Today
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, marginBottom: 1 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', padding: '6px 0', fontSize: 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        {cells.map((day, i) => {
          const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null;
          const isToday = dateStr === todayStr;
          const events = dateStr ? (byDate[dateStr] || []) : [];

          return (
            <div key={i} style={{
              background: day ? 'var(--surface)' : 'var(--cream)',
              minHeight: 80, padding: '8px 6px', position: 'relative',
            }}>
              {day && (
                <>
                  <div style={{
                    fontSize: 12, fontWeight: isToday ? 700 : 400,
                    color: isToday ? '#fff' : 'var(--muted)',
                    width: 22, height: 22, borderRadius: '50%',
                    background: isToday ? 'var(--blue)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 4,
                  }}>
                    {day}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {events.map(p => {
                      const days = daysUntil(p.date);
                      const color = days !== null && days <= 7 ? 'var(--red)' : days !== null && days <= 30 ? '#b45309' : 'var(--blue)';
                      return (
                        <div
                          key={p.id}
                          onClick={() => onSelect(p.id)}
                          title={p.name}
                          style={{
                            fontSize: 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
                            background: color, color: '#fff', borderRadius: 4,
                            padding: '2px 5px', cursor: 'pointer', overflow: 'hidden',
                            whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                            transition: 'opacity 0.12s',
                          }}
                          onMouseOver={e => e.currentTarget.style.opacity = '0.8'}
                          onMouseOut={e => e.currentTarget.style.opacity = '1'}
                        >
                          {p.name}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeadAvatars({ leads, team }) {
  const names = Array.isArray(leads) ? leads : leads ? leads.split(',').map(s => s.trim()).filter(Boolean) : [];
  if (!names.length) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
      <div style={{ display: 'flex' }}>
        {names.map((name, i) => {
          const member = team.find(m => m.name === name);
          const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
          return (
            <div key={name} style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'var(--blue)', border: '2px solid var(--surface)',
              marginLeft: i === 0 ? 0 : -8,
              overflow: 'hidden', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: names.length - i,
            }}>
              {member?.photoUrl
                ? <img src={member.photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.04em' }}>{initials}</span>}
            </div>
          );
        })}
      </div>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>
        {names.join(', ')}
      </span>
    </div>
  );
}

function ListRow({ p, i, last }) {
  let totalTasks = 0, doneTasks = 0;
  (p.dots || []).forEach(d => {
    const tasks = Array.isArray(d.responsibilities) ? d.responsibilities : [];
    totalTasks += tasks.length; doneTasks += tasks.filter(t => t.done).length;
  });
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : null;
  const leads = Array.isArray(p.leads) ? p.leads : p.leads ? [p.leads] : [];
  return (
    <div
      style={{
        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr 100px', gap: 0,
        padding: '13px 18px', cursor: 'pointer',
        background: i % 2 === 0 ? 'var(--surface)' : 'var(--cream)',
        borderBottom: !last ? '1px solid var(--border)' : 'none',
        transition: 'background 0.12s', alignItems: 'center',
      }}
      onClick={e => { e.currentTarget._onSelect && e.currentTarget._onSelect(p.id); }}
      onMouseOver={e => e.currentTarget.style.background = 'rgba(53,88,198,0.06)'}
      onMouseOut={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--surface)' : 'var(--cream)'}
      ref={el => { if (el) el._onSelect = null; }}
    >
      <span style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 700, color: 'var(--blue)', lineHeight: 1.1 }}>{p.name}</span>
      <div>
        <div style={{ fontSize: 12, color: 'var(--text)' }}>{p.date ? fmt(p.date) : '—'}</div>
      </div>
      <span style={{ fontSize: 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: p.blessed ? 'var(--green)' : p.submitted ? 'var(--yellow)' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
        {p.blessed ? <><CheckCircle2 size={10} /> Approved</> : p.submitted ? <><Clock size={10} /> Awaiting</> : <><Clock size={10} /> Draft</>}
      </span>
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{leads.length > 0 ? leads.join(', ') : '—'}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ flex: 1, height: 5, background: 'var(--cream-dk)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct ?? 0}%`, background: 'var(--green)', borderRadius: 99, opacity: pct === 100 ? 1 : 0.7 }} />
        </div>
        <span style={{ fontSize: 10, fontFamily: 'Montserrat, sans-serif', color: 'var(--muted)', minWidth: 26, textAlign: 'right' }}>{pct !== null ? `${pct}%` : '—'}</span>
      </div>
    </div>
  );
}

const COL = '2fr 1fr 1fr 1.2fr 100px';
const HEADER_STYLE = { display: 'grid', gridTemplateColumns: COL, background: 'var(--cream)', padding: '8px 18px', borderBottom: '1px solid var(--border)' };

function ListTable({ rows, onSelect }) {
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <div style={HEADER_STYLE}>
        {['Project', 'Date', 'Status', 'Lead', 'Progress'].map(h => (
          <span key={h} style={{ fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>{h}</span>
        ))}
      </div>
      {rows.map((p, i) => (
        <div key={p.id} onClick={() => onSelect(p.id)}>
          <ListRow p={p} i={i} last={i === rows.length - 1} />
        </div>
      ))}
    </div>
  );
}

function ListView({ projects, onSelect, anyProjects = true, onNew }) {
  if (projects.length === 0) {
    // "No matches" is misleading when there's simply nothing here yet and no
    // filter is set — it reads as though something is being hidden.
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', fontSize: 14 }}>
        {anyProjects ? (
          'No projects match the current filters.'
        ) : (
          <>
            <p style={{ marginBottom: 20, fontSize: 15 }}>No projects yet.</p>
            <button
              onClick={onNew}
              style={{ padding: '14px 28px', background: 'var(--yellow)', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontFamily: 'Montserrat, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff' }}
            >
              Create Your First Project
            </button>
          </>
        )}
      </div>
    );
  }
  const dated = projects.filter(p => p.date).sort((a, b) => a.date.localeCompare(b.date));
  const undated = projects.filter(p => !p.date);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {dated.length > 0 && <ListTable rows={dated} onSelect={onSelect} />}
      {undated.length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ flex: 1, height: 1, background: 'var(--border)', display: 'inline-block' }} />
            No Date
            <span style={{ flex: 1, height: 1, background: 'var(--border)', display: 'inline-block' }} />
          </div>
          <ListTable rows={undated} onSelect={onSelect} />
        </div>
      )}
    </div>
  );
}

export default function ProjectsView({ projects, team = [], onSelect, onNew, onOpenStickyNote }) {
  const [leadFilter, setLeadFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [view, setView] = useState('grid'); // 'grid' | 'calendar' | 'list'

  function normalizeLeads(l) { return Array.isArray(l) ? l : l ? l.split(',').map(s => s.trim()).filter(Boolean) : []; }
  const leads = [...new Set(projects.flatMap(p => normalizeLeads(p.leads)))].sort();
  const today = new Date().toISOString().slice(0, 10);

  const filtered = projects.filter(p => {
    if (leadFilter && !normalizeLeads(p.leads).includes(leadFilter)) return false;
    if (dateFilter === 'upcoming' && p.date && p.date < today) return false;
    if (dateFilter === 'past' && (!p.date || p.date >= today)) return false;
    return true;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 className="page-title">Projects</h1>
          <button
            onClick={onNew}
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--yellow)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}
          >
            <Plus size={16} color="var(--blue)" strokeWidth={2.5} />
          </button>
        </div>
        <LogoMark size={36} onClick={onOpenStickyNote} />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>

        {/* View toggle */}
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <button
            onClick={() => setView('grid')}
            style={{ padding: '7px 12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: view === 'grid' ? 'var(--blue)' : 'var(--surface)', color: view === 'grid' ? '#fff' : 'var(--muted)', transition: 'all 0.15s' }}
          >
            <LayoutGrid size={13} /> Grid
          </button>
          <button
            onClick={() => setView('calendar')}
            style={{ padding: '7px 12px', border: 'none', borderLeft: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: view === 'calendar' ? 'var(--blue)' : 'var(--surface)', color: view === 'calendar' ? '#fff' : 'var(--muted)', transition: 'all 0.15s' }}
          >
            <CalendarDays size={13} /> Calendar
          </button>
          <button
            onClick={() => setView('list')}
            style={{ padding: '7px 12px', border: 'none', borderLeft: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: view === 'list' ? 'var(--blue)' : 'var(--surface)', color: view === 'list' ? '#fff' : 'var(--muted)', transition: 'all 0.15s' }}
          >
            <List size={13} /> List
          </button>
        </div>

        {(view === 'grid' || view === 'list') && <>
          <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Dates</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>

          {leads.length > 0 && (
            <select value={leadFilter} onChange={e => setLeadFilter(e.target.value)} style={selectStyle}>
              <option value="">All Leads</option>
              {leads.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          )}

          {(leadFilter || dateFilter !== 'all') && (
            <button onClick={() => { setLeadFilter(''); setDateFilter('all'); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--muted)', fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Clear filters
            </button>
          )}
        </>}
      </div>

      {/* Calendar view */}
      {view === 'calendar' && <CalendarView projects={projects} onSelect={onSelect} />}

      {/* List view */}
      {view === 'list' && <ListView projects={[...filtered].sort((a, b) => (a.date || '9999') < (b.date || '9999') ? -1 : 1)} onSelect={onSelect} anyProjects={projects.length > 0} onNew={onNew} />}

      {/* Grid view */}
      {view === 'grid' && (
        filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', fontSize: 14 }}>
            {projects.length === 0 ? (
              <>
                <p style={{ marginBottom: 20, fontSize: 15 }}>No projects yet.</p>
                <button
                  onClick={onNew}
                  style={{ padding: '14px 28px', background: 'var(--yellow)', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontFamily: 'Montserrat, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff' }}
                >
                  Create Your First Project
                </button>
              </>
            ) : (
              <p>No projects match the current filters.</p>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {filtered.map(p => {
              const days = daysUntil(p.date);
              let totalTasks = 0, doneTasks = 0;
              (p.dots || []).forEach(d => {
                const tasks = Array.isArray(d.responsibilities) ? d.responsibilities : [];
                totalTasks += tasks.length;
                doneTasks += tasks.filter(t => t.done).length;
              });
              const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
              const allDone = totalTasks > 0 && doneTasks === totalTasks;

              return (
                <div key={p.id} onClick={() => onSelect(p.id)}
                  style={{ background: 'var(--surface)', border: `1.5px solid ${p.blessed ? 'var(--green)' : 'var(--border)'}`, borderRadius: 14, padding: '20px 22px', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--green)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = p.blessed ? 'var(--green)' : 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  {/* Top row: status + date/countdown */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: p.blessed ? 'var(--green)' : p.submitted ? '#b45309' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {p.blessed ? <><CheckCircle2 size={11} /> Approved</> : p.submitted ? <><Clock size={11} /> Awaiting Approval</> : <><Clock size={11} /> Draft</>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                      {p.date && <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{fmt(p.date)}</div>}
                      {days !== null && (
                        <span className={`deadline-badge ${days <= 7 ? 'urgent' : days <= 30 ? 'soon' : ''}`} style={{ fontSize: 10, padding: '2px 8px' }}>
                          {days === 0 ? 'Today' : days < 0 ? 'Past' : `${days} days`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color: 'var(--blue)', marginBottom: 4, lineHeight: 1.1 }}>
                    {p.name}
                  </div>
                  <LeadAvatars leads={p.leads} team={team} />
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <span style={{ fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)' }}>Team Progress</span>
                      <span style={{ fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: allDone ? 'var(--green)' : 'var(--muted)' }}>{totalTasks > 0 ? `${pct}%` : '—'}</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--cream-dk)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--green)', borderRadius: 99, transition: 'width 0.4s', opacity: allDone ? 1 : 0.7 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

    </div>
  );
}
