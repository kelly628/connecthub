import { useState, useEffect, useRef } from 'react';
import { CheckCircle2, Clock, ArrowRight, TrendingUp, GraduationCap, BookOpen, Apple, Pencil, Heart, HandHeart, Users, Globe, Music, Palette, Baby, Camera, Trophy, Award, Ribbon, Star, Sparkles, PartyPopper, Gift, Martini, Leaf, Sun, Handshake, Crown, Calendar, ChevronDown } from 'lucide-react';
import LogoMark from './LogoMark';

const ICON_MAP = { GraduationCap, BookOpen, Apple, Pencil, Heart, HandHeart, Users, Globe, Music, Palette, Baby, Camera, Trophy, Award, Ribbon, Star, Sparkles, PartyPopper, Gift, Martini, Leaf, Sun, Handshake, Crown };

function ProjectIcon({ project, size = 20 }) {
  if (project.logoUrl) return <img src={project.logoUrl} alt="" style={{ width: size, height: size, objectFit: 'contain', borderRadius: 4 }} />;
  if (project.iconName && ICON_MAP[project.iconName]) {
    const Icon = ICON_MAP[project.iconName];
    return <Icon size={size} />;
  }
  return <LogoMark size={size * 0.7} />;
}

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

const PINK = '#c2336b';

function StatCard({ label, value, sub, accent, highlight = false, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: highlight ? 'rgba(194,51,107,0.06)' : 'var(--surface)',
        border: highlight ? `1.5px solid rgba(194,51,107,0.35)` : '1px solid rgba(210,195,170,0.3)',
        borderRadius: 14, padding: '20px 24px', flex: 1, minWidth: 140,
        position: 'relative', overflow: 'hidden',
        transition: 'background 0.2s, box-shadow 0.15s',
        cursor: onClick ? 'pointer' : 'default',
      }}
      onMouseOver={e => { if (onClick) e.currentTarget.style.boxShadow = '0 4px 16px rgba(13,43,26,0.1)'; }}
      onMouseOut={e => { e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ fontSize: 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: highlight ? PINK : 'var(--muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}
        {highlight && (
          <span style={{ color: PINK, opacity: 0.8, display: 'flex', alignItems: 'center' }} className="bounce-arrow">
            <ChevronDown size={12} strokeWidth={2.5} style={{ transform: 'rotate(-90deg)' }} />
          </span>
        )}
      </div>
      <div style={{ fontFamily: 'var(--font-body)', fontSize: 36, fontWeight: 700, color: highlight ? PINK : (accent || 'var(--blue)'), lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: highlight ? 'rgba(194,51,107,0.7)' : 'var(--muted)', marginTop: 6, fontFamily: 'Montserrat, sans-serif' }}>{sub}</div>}
    </div>
  );
}

function EventRow({ project, onSelect }) {
  const days = daysUntil(project.date);

  let totalTasks = 0, doneTasks = 0;
  (project.dots || []).forEach(d => {
    const tasks = Array.isArray(d.responsibilities) ? d.responsibilities : [];
    totalTasks += tasks.length;
    doneTasks += tasks.filter(t => t.done).length;
  });
  const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
      transition: 'background 0.12s',
    }}
      onMouseOver={e => e.currentTarget.style.background = 'var(--cream)'}
      onMouseOut={e => e.currentTarget.style.background = 'var(--surface)'}
    >
      {/* Days badge */}
      <div style={{ width: 52, flexShrink: 0, textAlign: 'center' }}>
        {days === null ? (
          <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'Montserrat, sans-serif' }}>—</span>
        ) : days < 0 ? (
          <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase' }}>Past</span>
        ) : (
          <div style={{
            background: project.blessed ? 'rgba(69,125,88,0.13)' : project.submitted ? 'rgba(228,110,136,0.22)' : 'rgba(13,43,26,0.07)',
            borderRadius: 8, padding: '4px 6px',
          }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 20, fontWeight: 700, color: project.blessed ? 'var(--green)' : project.submitted ? '#FFFFFF' : 'var(--blue)', lineHeight: 1, paddingTop: 3 }}>{days}</div>
            <div style={{ fontSize: 8, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: project.blessed ? 'var(--green)' : project.submitted ? '#7a5500' : 'var(--blue)' }}>days</div>
          </div>
        )}
      </div>

      {/* Icon */}
      <div style={{ width: 32, height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
        <ProjectIcon project={project} size={20} />
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          onClick={() => onSelect(project.id)}
          style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: 'var(--blue)', cursor: 'pointer', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          onMouseOver={e => e.currentTarget.style.textDecoration = 'underline'}
          onMouseOut={e => e.currentTarget.style.textDecoration = 'none'}
        >
          {project.name}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'Montserrat, sans-serif' }}>{fmt(project.date)}</span>
        </div>
      </div>

      {/* Progress */}
      {pct !== null && (
        <div style={{ width: 80, flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)' }}>Tasks</span>
            <span style={{ fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: pct === 100 ? 'var(--green)' : 'var(--muted)' }}>{pct}%</span>
          </div>
          <div style={{ height: 5, background: 'var(--cream-dk)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--green)', borderRadius: 99, opacity: pct === 100 ? 1 : 0.75 }} />
          </div>
        </div>
      )}

      <ArrowRight size={13} color="var(--muted)" style={{ flexShrink: 0 }} onClick={() => onSelect(project.id)} cursor="pointer" />
    </div>
  );
}

export default function DashboardView({ projects, team, onSelectProject, onSelectPerson, onOpenStickyNote, isAdmin = false, onNavigate, currentUser = '' }) {
  const now = new Date();

  // Sort projects by date
  const sortedByDate = [...projects].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const upcoming = sortedByDate.filter(p => !p.date || daysUntil(p.date) >= 0);
  const past = sortedByDate.filter(p => p.date && daysUntil(p.date) < 0);

  // Stats
  const pendingApprovals = projects.filter(p => p.submitted && !p.blessed).length;
  let totalTasks = 0, doneTasks = 0;
  projects.forEach(p => {
    (p.dots || []).forEach(d => {
      const tasks = Array.isArray(d.responsibilities) ? d.responsibilities : [];
      totalTasks += tasks.length;
      doneTasks += tasks.filter(t => t.done).length;
    });
  });
  const taskPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Slideshow state
  const [slideIdx, setSlideIdx] = useState(0);
  useEffect(() => {
    if (upcoming.length <= 1) return;
    const t = setInterval(() => setSlideIdx(i => (i + 1) % upcoming.length), 4500);
    return () => clearInterval(t);
  }, [upcoming.length]);
  const safeIdx = Math.min(slideIdx, upcoming.length - 1);

  // Paper airplane idle animation
  const [isFlying, setIsFlying] = useState(false);
  const idleRef = useRef(null);
  const flyingRef = useRef(false);

  useEffect(() => {
    function resetIdle() {
      clearTimeout(idleRef.current);
      if (flyingRef.current) { flyingRef.current = false; setIsFlying(false); }
      idleRef.current = setTimeout(() => { flyingRef.current = true; setIsFlying(true); }, 30000);
    }
    const evts = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
    evts.forEach(e => window.addEventListener(e, resetIdle, { passive: true }));
    resetIdle();
    return () => { evts.forEach(e => window.removeEventListener(e, resetIdle)); clearTimeout(idleRef.current); };
  }, []);

  // Greeting
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Completed projects (lead has confirmed via Mark Complete)
  const featuredWins = projects.filter(p => p.completed);

  // Team member task completion
  const memberStats = team.map(m => {
    let mt = 0, md = 0;
    projects.forEach(p => {
      (p.dots || []).forEach(d => {
        if (d.member?.trim().toLowerCase() !== m.name.trim().toLowerCase()) return;
        const tasks = Array.isArray(d.responsibilities) ? d.responsibilities : [];
        mt += tasks.length;
        md += tasks.filter(t => t.done).length;
      });
    });
    return { ...m, total: mt, done: md, pct: mt > 0 ? Math.round((md / mt) * 100) : null };
  }).filter(m => m.total > 0).sort((a, b) => (a.pct ?? 101) - (b.pct ?? 101));

  // First run: no team, no projects. Four zeroed stat cards and an empty list
  // tell a new staffer nothing about what to do, so show the setup path
  // instead — one obvious next action.
  if (projects.length === 0 && team.length === 0) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Welcome to ConnectHub</h1>
          <LogoMark size={36} onClick={onOpenStickyNote} />
        </div>

        <div style={{ maxWidth: 620 }}>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--muted)', fontFamily: 'Montserrat, sans-serif', marginBottom: 28 }}>
            Every project here is a board of dots — one dot per person, each holding that
            person’s checklist. Fill them in, then press <strong style={{ color: 'var(--blue)' }}>Connect
            the Dots</strong> to send the plan to the office for approval.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px' }}>
              <div style={{ fontSize: 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--yellow)', marginBottom: 8 }}>
                Step 1
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 21, fontWeight: 700, color: 'var(--blue)', marginBottom: 8 }}>
                Add your team
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--muted)', fontFamily: 'Montserrat, sans-serif', marginBottom: isAdmin ? 18 : 0 }}>
                {isAdmin
                  ? 'Everyone who helps run projects. You can add photos and roles later.'
                  : 'An admin sets up the team. Ask the office to add everyone, then come back here.'}
              </div>
              {isAdmin && (
                <button
                  onClick={() => onNavigate?.('people')}
                  style={{ padding: '14px 28px', background: 'var(--yellow)', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontFamily: 'Montserrat, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff' }}
                >
                  Add Team Members
                </button>
              )}
            </div>

            <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px', opacity: 0.75 }}>
              <div style={{ fontSize: 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: 8 }}>
                Step 2
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 21, fontWeight: 700, color: 'var(--blue)', marginBottom: 8 }}>
                Create your first project
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--muted)', fontFamily: 'Montserrat, sans-serif' }}>
                Unlocks once there’s at least one person on the team.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {currentUser ? `${greeting}, ${currentUser.split(' ')[0]}!` : 'Welcome to ConnectHub'}
          </h1>
        </div>
        {isFlying && (
          <style>{`
            @keyframes airplane-drift {
              0%   { transform: translate(0px,   0px)  rotate(0deg);  }
              10%  { transform: translate(5px,  -13px) rotate(14deg); }
              22%  { transform: translate(18px, -20px) rotate(24deg); }
              34%  { transform: translate(30px, -10px) rotate(18deg); }
              45%  { transform: translate(26px,  8px)  rotate(4deg);  }
              57%  { transform: translate(8px,   18px) rotate(-11deg);}
              68%  { transform: translate(-10px, 15px) rotate(-22deg);}
              80%  { transform: translate(-16px,  1px) rotate(-16deg);}
              91%  { transform: translate(-6px, -11px) rotate(-4deg); }
              100% { transform: translate(0px,   0px)  rotate(0deg);  }
            }
          `}</style>
        )}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            animation: isFlying ? 'airplane-drift 6.5s cubic-bezier(0.45,0,0.55,1) infinite' : 'none',
            transformOrigin: 'center',
          }}>
            <LogoMark
              size={isFlying ? 34 : 56}
              onClick={() => { onOpenStickyNote(); flyingRef.current = false; setIsFlying(false); }}
              style={{ transition: 'width 0.4s, height 0.4s' }}
            />
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 32, flexWrap: 'wrap' }}>
        <StatCard label="Upcoming Projects" value={upcoming.length} sub={`${past.length} past`} onClick={() => onNavigate?.('projects')} />
        <StatCard
          label="Pending Approvals"
          value={pendingApprovals}
          sub={pendingApprovals === 0 ? 'All clear!' : `${projects.filter(p => p.blessed).length} approved`}
          accent={pendingApprovals > 0 ? 'var(--blue)' : 'var(--green)'}
          highlight={isAdmin && pendingApprovals > 0}
          onClick={() => onNavigate?.('approvals')}
        />
        <StatCard
          label="Tasks Complete"
          value={`${taskPct}%`}
          sub={`${doneTasks} of ${totalTasks} done`}
          accent={taskPct === 100 ? 'var(--green)' : 'var(--blue)'}
          onClick={() => onNavigate?.('tasks')}
        />
        <StatCard label="Team Members" value={team.length} sub={`${memberStats.length} with tasks`} onClick={() => onNavigate?.('people')} />
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start' }}>

        {/* Left: Events list */}
        <div>
          {/* Slideshow hero */}
          {upcoming.length > 0 && (() => {
            const event = upcoming[safeIdx];
            const days = daysUntil(event.date);
            const labels = ['Next Project', 'Coming Up', 'On the Horizon', 'Also Ahead'];
            return (
              <div style={{ marginBottom: 6 }}>
                <div
                  key={event.id}
                  onClick={() => onSelectProject(event.id)}
                  style={{
                    background: 'var(--blue)', borderRadius: 16, padding: '24px 28px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20,
                    cursor: 'pointer', position: 'relative', overflow: 'hidden',
                    transition: 'opacity 0.4s ease',
                  }}
                >
                  {event.iconName && ICON_MAP[event.iconName] && (() => {
                    const Icon = ICON_MAP[event.iconName];
                    return <div style={{ position: 'absolute', right: 90, top: '50%', transform: 'translateY(-50%)', opacity: 0.07, pointerEvents: 'none' }}><Icon size={180} color="#fff" strokeWidth={0.8} /></div>;
                  })()}
                  <div>
                    <div style={{ fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>
                      {labels[Math.min(safeIdx, labels.length - 1)]}
                    </div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1.1, marginBottom: 6 }}>{event.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'Montserrat, sans-serif' }}>{fmt(event.date)}</div>
                  </div>
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 52, fontWeight: 700, color: 'var(--yellow)', lineHeight: 1, paddingTop: 3 }}>{days}</div>
                    <div style={{ fontSize: 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.6)' }}>days away</div>
                  </div>
                </div>
                {/* Dot nav */}
                {upcoming.length > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10 }}>
                    {upcoming.map((_, i) => (
                      <div
                        key={i}
                        onClick={() => setSlideIdx(i)}
                        style={{
                          width: i === safeIdx ? 22 : 6, height: 6, borderRadius: 99,
                          background: i === safeIdx ? 'var(--blue)' : 'var(--cream-dk)',
                          cursor: 'pointer', transition: 'all 0.35s ease', flexShrink: 0,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Upcoming list */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={12} color="var(--blue)" />
              <span style={{ fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--blue)' }}>All Projects</span>
              {(upcoming.length + past.length) > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--cream-dk)', borderRadius: 99, padding: '1px 8px', fontSize: 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: 'var(--muted)' }}>
                  {upcoming.length + past.length}
                </span>
              )}
            </div>
            {upcoming.length === 0 && past.length === 0 ? (
              <div style={{ padding: '32px 18px', textAlign: 'center', color: 'var(--muted)', fontSize: 13, fontStyle: 'italic' }}>No projects yet. Create one to get started.</div>
            ) : (
              [...upcoming, ...past].map(p => (
                <EventRow key={p.id} project={p} onSelect={onSelectProject} />
              ))
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Featured wins */}
          {featuredWins.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid rgba(201,168,0,0.3)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(201,168,0,0.2)', background: 'rgba(228,110,136,0.07)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trophy size={12} color="#C9A800" strokeWidth={2} />
                <span style={{ fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#C9A800' }}>Completed</span>
                <span style={{ marginLeft: 'auto', background: '#C9A800', color: '#fff', borderRadius: 99, padding: '1px 8px', fontSize: 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>{featuredWins.length}</span>
              </div>
              {featuredWins.map(p => (
                <div key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  style={{ padding: '12px 18px', borderBottom: '1px solid rgba(201,168,0,0.12)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.12s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(228,110,136,0.06)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(201,168,0,0.12)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ProjectIcon project={p} size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: 'var(--blue)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'Montserrat, sans-serif', marginTop: 1 }}>{fmt(p.date)}</div>
                  </div>
                  <CheckCircle2 size={14} color="#C9A800" strokeWidth={1.8} style={{ flexShrink: 0 }} />
                </div>
              ))}
            </div>
          )}

          {/* Pending approvals */}
          {pendingApprovals > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={12} color="#b45309" />
                <span style={{ fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#b45309' }}>Needs Approval</span>
                <span style={{ marginLeft: 'auto', background: 'var(--yellow)', color: '#FFFFFF', borderRadius: 99, padding: '1px 8px', fontSize: 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>{pendingApprovals}</span>
              </div>
              {projects.filter(p => p.submitted && !p.blessed).map(p => (
                <div key={p.id}
                  onClick={() => onSelectProject(p.id)}
                  style={{ padding: '11px 18px', borderBottom: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.12s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--cream)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'Montserrat, sans-serif' }}>{fmt(p.date)}</div>
                  </div>
                  <ArrowRight size={12} color="var(--muted)" />
                </div>
              ))}
            </div>
          )}

          {/* Team progress */}
          {memberStats.length > 0 && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={12} color="var(--green)" />
                <span style={{ fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--green)' }}>Team Progress</span>
              </div>
              {memberStats.map(m => {
                const initials = m.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={m.id}
                    onClick={() => onSelectPerson?.(m.name)}
                    style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.12s' }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--cream)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--green)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {m.photoUrl
                          ? <img src={m.photoUrl} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', fontFamily: 'Montserrat, sans-serif' }}>{initials}</span>}
                      </div>
                      <span style={{ flex: 1, fontWeight: 700, fontSize: 13, color: 'var(--text)', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</span>
                      <span style={{ fontSize: 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: m.pct === 100 ? 'var(--green)' : 'var(--muted)', flexShrink: 0 }}>{m.pct}%</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--cream-dk)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${m.pct}%`, background: 'var(--green)', borderRadius: 99, opacity: m.pct === 100 ? 1 : 0.7 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
