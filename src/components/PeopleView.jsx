import { useState, useRef, useEffect } from 'react';
import { Plus, Pencil, Trash2, Camera, X, Check, LayoutList, BookOpen, ClipboardList, Trophy, LoaderCircle,
         Star, Heart, Sparkles, Crown, Music, Palette, Sun, Leaf, Coffee, Gift, Globe, Award } from 'lucide-react';
import LogoMark from './LogoMark';
import { downscale } from '../lib/downscale';
import { uploadImage, listCodes } from '../lib/api';

// A person's own mark. Stored by name so the choice survives an icon-set swap
// and means something when read straight out of the database.
const MEMBER_ICONS = { Star, Heart, Sparkles, Crown, Music, Palette, Sun, Leaf, Coffee, Gift, Globe, Award };

// Five jewel tones, and they run green → teal → blue → violet → wine so the
// roster reads as one set rather than a bag of colours. Each is deep and a
// little greyed rather than fully saturated: at full chroma they would shout
// past Chapelle's green and blush instead of sitting with them. Garnet is the
// jewel-tone cousin of Deep Blush, which is what ties the far end back to the
// brand. Anything beyond these five is a keystroke away in the picker.
const MEMBER_COLORS = [
  { hex: '#0E6B4A', name: 'Emerald' },
  { hex: '#12586B', name: 'Peacock' },
  { hex: '#2A4A85', name: 'Sapphire' },
  { hex: '#5E3A82', name: 'Amethyst' },
  { hex: '#8E2A4C', name: 'Garnet' },
];

const BINDER_COLORS = [
  '#175933', // navy (theme blue)
  '#457D58', // forest (theme green)
  '#C04A18', // rust / burnt orange
  '#B83468', // rose pink
  '#3A7355', // cornflower blue
  '#B89400', // deep gold
  '#1A7A50', // teal green
  '#C2305A', // deeper pink
  '#2E6E45', // medium navy
];

// Photo first, then a chosen icon, then initials. Each is a stronger signal of
// "this is me" than the one after it, so the most personal thing available wins.
function Avatar({ member, size = 48 }) {
  const initials = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const Icon = member.iconName ? MEMBER_ICONS[member.iconName] : null;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: member.color || 'var(--green)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {member.photoUrl
        ? <img src={member.photoUrl} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : Icon
        ? <Icon size={size * 0.46} color="#fff" strokeWidth={1.9} />
        : <span style={{ fontSize: size * 0.35, fontWeight: 700, color: '#fff', fontFamily: 'Montserrat, sans-serif' }}>{initials}</span>
      }
    </div>
  );
}

function memberStats(member, projects) {
  const lname = member.name.trim().toLowerCase();
  let total = 0, done = 0;
  projects.forEach(p => {
    (p.dots || []).forEach(d => {
      if (d.member?.trim().toLowerCase() !== lname) return;
      const tasks = Array.isArray(d.responsibilities) ? d.responsibilities : [];
      total += tasks.length;
      done += tasks.filter(t => t.done).length;
    });
  });
  return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : null };
}


function BinderInterior({ member, projects, color, onClose, onToggleTask, isAdmin = false, currentUser = '' }) {
  const lname = member.name.trim().toLowerCase();
  const memberProjects = projects
    .filter(p => (p.dots || []).some(d =>
      d.member?.trim().toLowerCase() === lname &&
      Array.isArray(d.responsibilities) && d.responsibilities.length > 0
    ))
    .sort((a, b) => (a.date || '') < (b.date || '') ? -1 : 1);

  const [activeIdx, setActiveIdx] = useState(0);
  const [showProud, setShowProud] = useState(false);
  const safeIdx = Math.min(activeIdx, Math.max(0, memberProjects.length - 1));
  const activeProject = memberProjects[safeIdx];
  const tabColor = BINDER_COLORS[safeIdx % BINDER_COLORS.length];

  const activeTasks = activeProject
    ? (activeProject.dots || [])
        .map((d, dotIdx) => ({ d, dotIdx }))
        .filter(({ d }) => d.member?.trim().toLowerCase() === lname)
        .flatMap(({ d, dotIdx }) =>
          (Array.isArray(d.responsibilities) ? d.responsibilities : [])
            .map((task, taskIdx) => ({ task, dotIdx, taskIdx }))
        )
    : [];

  const proudProjects = memberProjects.filter(p => p.completed);

  const initials = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const done = activeTasks.filter(({ task }) => task.done).length;

  return (
    <>
      <style>{`
        @keyframes binder-open {
          0%   { opacity: 0; transform: scale(0.93) translateY(18px); }
          100% { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(8,15,55,0.52)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={onClose}
      >
        <div
          style={{ display: 'flex', width: 700, maxWidth: '96vw', height: 520, maxHeight: '88vh', borderRadius: '8px 20px 20px 8px', boxShadow: '0 32px 90px rgba(0,0,0,0.38)', animation: 'binder-open 0.28s cubic-bezier(0.34,1.3,0.64,1)', overflow: 'hidden' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Spine */}
          <div style={{ width: 48, flexShrink: 0, background: color, position: 'relative' }}>
            {[75, 160, 250, 340, 430].map(top => (
              <div key={top} style={{ position: 'absolute', top, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(0,0,0,0.22)' }} />
                <div style={{ position: 'absolute', right: -10, top: -2, width: 20, height: 18, border: '2.5px solid rgba(215,195,155,0.75)', borderRadius: '0 8px 8px 0', borderLeft: 'none' }} />
              </div>
            ))}
          </div>

          {/* Interior */}
          <div style={{ flex: 1, background: '#FEFDF9', display: 'flex', flexDirection: 'column' }}>
            {/* Member header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 22px', borderBottom: '1px solid rgba(0,0,0,0.07)', background: '#fff', flexShrink: 0 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: color, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #fff', boxShadow: `0 0 0 1.5px ${color}40` }}>
                {member.photoUrl
                  ? <img src={member.photoUrl} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: 19, fontWeight: 700, color: '#fff', fontFamily: 'Montserrat, sans-serif' }}>{initials}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{member.name}</div>
                {member.title && <div style={{ fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#bbb', marginTop: 4 }}>{member.title}</div>}
              </div>
              {activeProject && (
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ccc', marginBottom: 2 }}>Tasks</div>
                  <div style={{ fontSize: 13, fontFamily: 'var(--font-body)', fontWeight: 700, color: done === activeTasks.length && activeTasks.length > 0 ? tabColor : 'var(--text)' }}>{done} / {activeTasks.length}</div>
                </div>
              )}
              <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <X size={13} />
              </button>
            </div>

            {memberProjects.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <ClipboardList size={40} color="#ddd" strokeWidth={1.2} />
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#ccc' }}>No projects assigned yet</div>
              </div>
            ) : (
              <>
                {/* Folder tabs */}
                <div style={{ display: 'flex', alignItems: 'flex-end', padding: '10px 20px 0', gap: 3, background: '#FEFDF9', flexShrink: 0, overflowX: 'auto' }}>
                  {memberProjects.map((p, i) => {
                    const tc = BINDER_COLORS[i % BINDER_COLORS.length];
                    const isActive = !showProud && i === safeIdx;
                    return (
                      <button key={p.id} onClick={() => { setActiveIdx(i); setShowProud(false); }} style={{
                        padding: isActive ? '8px 16px 10px' : '7px 16px 6px',
                        border: 'none', borderRadius: '7px 7px 0 0',
                        cursor: 'pointer',
                        fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
                        fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em',
                        background: isActive ? tc : 'rgba(0,0,0,0.06)',
                        color: isActive ? '#fff' : '#aaa',
                        flexShrink: 0, maxWidth: 160,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        transition: 'all 0.15s',
                        position: 'relative', zIndex: isActive ? 1 : 0,
                      }}>
                        {p.name}
                      </button>
                    );
                  })}
                  {/* Spacer pushes Proud Wall tab to the right */}
                  <div style={{ flex: 1, minWidth: 12 }} />
                  {/* Proud Wall tab */}
                  <button
                    onClick={() => setShowProud(true)}
                    style={{
                      padding: showProud ? '8px 14px 10px' : '7px 14px 6px',
                      border: 'none', borderRadius: '7px 7px 0 0',
                      cursor: 'pointer',
                      fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
                      fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em',
                      background: showProud ? '#C9A800' : 'rgba(197,163,0,0.12)',
                      color: showProud ? '#fff' : '#C9A800',
                      flexShrink: 0,
                      display: 'flex', alignItems: 'center', gap: 5,
                      transition: 'all 0.15s',
                      position: 'relative', zIndex: showProud ? 1 : 0,
                    }}
                  >
                    <Trophy size={11} strokeWidth={2} />
                    Complete
                    {proudProjects.length > 0 && (
                      <span style={{ background: showProud ? 'rgba(255,255,255,0.3)' : '#C9A800', color: showProud ? '#fff' : '#fff', borderRadius: 99, padding: '0 5px', fontSize: 9, lineHeight: '14px', minWidth: 14, textAlign: 'center' }}>
                        {proudProjects.length}
                      </span>
                    )}
                  </button>
                </div>
                {/* Active tab accent line */}
                <div style={{ height: 3, background: showProud ? '#C9A800' : tabColor, flexShrink: 0, transition: 'background 0.2s' }} />

                {showProud ? (
                  /* Proud Wall view */
                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 28px' }}>
                    {proudProjects.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, paddingTop: 40 }}>
                        <Trophy size={38} color="#ddd" strokeWidth={1.2} />
                        <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#ccc' }}>No completed projects yet</div>
                      </div>
                    ) : (
                      <>
                        <div style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#C9A800', fontWeight: 700, marginBottom: 16 }}>
                          {proudProjects.length} {proudProjects.length === 1 ? 'Project' : 'Projects'} Completed
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                          {proudProjects.map(p => {
                            const tasks = (p.dots || [])
                              .filter(d => d.member?.trim().toLowerCase() === lname)
                              .flatMap(d => Array.isArray(d.responsibilities) ? d.responsibilities : []);
                            const pc = BINDER_COLORS[memberProjects.indexOf(p) % BINDER_COLORS.length];
                            return (
                              <div key={p.id} style={{ background: '#fff', border: '1.5px solid rgba(201,168,0,0.25)', borderRadius: 10, overflow: 'hidden' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid rgba(201,168,0,0.15)', background: 'rgba(201,168,0,0.05)' }}>
                                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: pc, flexShrink: 0 }} />
                                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: pc }}>{p.name}</span>
                                  <Trophy size={12} color="#C9A800" strokeWidth={1.8} style={{ marginLeft: 'auto' }} />
                                </div>
                                <div style={{ padding: '8px 14px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  {tasks.map((task, ti) => (
                                    <div key={ti} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                      <svg width="11" height="11" viewBox="0 0 11 11" style={{ flexShrink: 0 }}>
                                        <circle cx="5.5" cy="5.5" r="5" fill="#C9A800" />
                                        <polyline points="2.5,5.5 4.5,7.5 8.5,3.5" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                      </svg>
                                      <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 13, color: '#888', letterSpacing: '0.02em' }}>{task.text}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  /* Lined paper content */
                  <div style={{
                    flex: 1, overflowY: 'auto', padding: '6px 30px 24px',
                    backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, rgba(0,0,0,0.045) 28px)',
                    backgroundSize: '100% 28px',
                    backgroundPositionY: '6px',
                  }}>
                    {activeTasks.length === 0 ? (
                      <div style={{ paddingTop: 20, color: '#ccc', fontFamily: 'Montserrat, sans-serif', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>No tasks for this project</div>
                    ) : (
                      activeTasks.map(({ task, dotIdx, taskIdx }, i) => {
                        const canToggle = activeProject.blessed && (isAdmin || currentUser.trim().toLowerCase() === member.name.trim().toLowerCase());
                        return (
                        <div
                          key={i}
                          onClick={() => canToggle && onToggleTask?.(activeProject.id, dotIdx, taskIdx)}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, height: 28, cursor: canToggle ? 'pointer' : 'default', opacity: activeProject.blessed ? 1 : 0.5 }}
                        >
                          <div style={{ width: 15, height: 15, borderRadius: 4, flexShrink: 0, background: task.done ? tabColor : 'transparent', border: `2px solid ${task.done ? tabColor : '#ddd'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                            {task.done && <svg width="9" height="9" viewBox="0 0 9 9"><polyline points="1.5,4.5 3.5,6.5 7.5,2" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                          </div>
                          <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 14, letterSpacing: '0.02em', color: task.done ? '#bbb' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none', transition: 'all 0.15s' }}>
                            {task.text}
                          </span>
                        </div>
                        );
                      })
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function BinderCard({ member, projects, onOpenBinder, colorIndex }) {
  const color = BINDER_COLORS[colorIndex % BINDER_COLORS.length];
  const { pct } = memberStats(member, projects);
  const initials = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div
      onClick={() => onOpenBinder(member)}
      title={member.name}
      style={{
        display: 'flex',
        width: 148,
        height: 206,
        borderRadius: '5px 13px 13px 5px',
        boxShadow: '4px 8px 28px rgba(0,0,0,0.2), 1px 2px 5px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'transform 0.22s, box-shadow 0.22s',
      }}
      onMouseOver={e => {
        e.currentTarget.style.transform = 'translateY(-9px) rotate(-1deg)';
        e.currentTarget.style.boxShadow = '10px 22px 44px rgba(0,0,0,0.22), 2px 4px 8px rgba(0,0,0,0.1)';
      }}
      onMouseOut={e => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '4px 8px 28px rgba(0,0,0,0.2), 1px 2px 5px rgba(0,0,0,0.1)';
      }}
    >
      {/* Spine */}
      <div style={{
        width: 26, flexShrink: 0,
        background: color,
        borderRadius: '5px 0 0 5px',
        position: 'relative',
      }}>
        {[40, 92, 148].map(top => (
          <div key={top} style={{ position: 'absolute', top, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(0,0,0,0.22)' }} />
            <div style={{
              position: 'absolute', right: -8, top: -2,
              width: 15, height: 13,
              border: '2px solid rgba(215,195,155,0.75)',
              borderRadius: '0 6px 6px 0',
              borderLeft: 'none',
            }} />
          </div>
        ))}
      </div>

      {/* Cover */}
      <div style={{
        flex: 1,
        background: '#FDFCF9',
        borderRadius: '0 14px 14px 0',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        overflow: 'hidden',
        border: '1px solid rgba(0,0,0,0.07)',
        borderLeft: 'none',
        position: 'relative',
      }}>
        {/* Monogram watermark */}
        <div style={{
          position: 'absolute', top: '46%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 80, fontFamily: 'var(--font-heading)', fontWeight: 700,
          color: color, opacity: 0.045,
          pointerEvents: 'none', userSelect: 'none', lineHeight: 1,
        }}>
          {initials}
        </div>

        {/* Thin color bar */}
        <div style={{ width: '100%', height: 3, background: color, flexShrink: 0 }} />

        {/* Content */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 12px', gap: 10, position: 'relative', zIndex: 1,
        }}>
          {/* Photo */}
          <div style={{
            width: 66, height: 66, borderRadius: '50%',
            background: color, overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '3px solid #fff',
            boxShadow: `0 0 0 1.5px ${color}35, 0 4px 14px rgba(0,0,0,0.14)`,
            flexShrink: 0,
          }}>
            {member.photoUrl
              ? <img src={member.photoUrl} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: 'Montserrat, sans-serif' }}>{initials}</span>}
          </div>

          {/* Name + title */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: color, lineHeight: 1.2, marginBottom: 4 }}>
              {member.name}
            </div>
            {member.title && (
              <div style={{ fontSize: 7.5, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em', color: '#c0b8ae' }}>
                {member.title}
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%', padding: '0 14px 12px', flexShrink: 0, position: 'relative', zIndex: 1 }}>
          {pct !== null ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 7, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: '#c8c0b4' }}>Progress</span>
                <span style={{ fontSize: 7, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: pct === 100 ? color : '#c8c0b4' }}>{pct}%</span>
              </div>
              <div style={{ height: 2, background: 'rgba(0,0,0,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99 }} />
              </div>
            </>
          ) : (
            <div style={{ fontSize: 7, fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.09em', color: '#d4cdc6', textAlign: 'center' }}>No tasks yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

function MemberRow({ member, projects, onEdit, onDelete, onSelect, canManage = false }) {
  const { total, done, pct } = memberStats(member, projects);
  const allDone = total > 0 && done === total;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderBottom: '1px solid var(--border)', transition: 'background 0.12s' }}
      onMouseOver={e => e.currentTarget.style.background = 'var(--cream)'}
      onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ cursor: 'pointer' }} onClick={() => onSelect(member.name)}>
        <Avatar member={member} size={44} />
      </div>
      <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => onSelect(member.name)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{member.name}</span>
          {/* Shown to everyone, not just admins: the whole point of naming an
              approver is that the rest of the staff know who to send a plan to. */}
          {member.isAdmin && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'var(--cream)', color: 'var(--blue)',
              border: '1px solid var(--border)', borderRadius: 99,
              padding: '2px 9px', fontSize: 9, fontFamily: 'Montserrat, sans-serif',
              fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              <Check size={9} strokeWidth={3} /> Approves
            </span>
          )}
        </div>
        {member.title && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{member.title}</div>}
        <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
          {total} {total === 1 ? 'task' : 'tasks'} assigned
        </div>
        {total > 0 && (
          <div style={{ marginTop: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
              <span style={{ fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: allDone ? 'var(--green)' : 'var(--muted)' }}>
                Overall Progress
              </span>
              <span style={{ fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: allDone ? 'var(--green)' : 'var(--muted)' }}>
                {pct}%
              </span>
            </div>
            <div style={{ height: 5, background: 'var(--cream-dk)', borderRadius: 99, overflow: 'hidden', width: '100%' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--green)', borderRadius: 99, transition: 'width 0.4s', opacity: allDone ? 1 : 0.7 }} />
            </div>
          </div>
        )}
      </div>
      {/* The pencil is for everyone — it is how a person reaches their own icon
          and colour. What the form lets them change once it opens depends on
          whether they approve; the bin stays with approvers either way. */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button onClick={() => onEdit(member)} title={canManage ? 'Edit' : 'Change icon and colour'} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
          <Pencil size={12} />
        </button>
        {canManage && (
          <button onClick={() => onDelete(member.id)} title="Remove from the team" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

// `canSetCode` is false until the codes have actually loaded. Without it, the
// field would render empty for someone who has a perfectly good code, and
// saving the form would read that blank as "remove their code" and lock them
// out — a data-loss bug disguised as an ordinary edit.
function MemberForm({ initial, initialCode = '', canSetCode = false, canEditIdentity = true, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || '');
  const [title, setTitle] = useState(initial?.title || '');
  const [code, setCode] = useState(initialCode);
  const [isAdmin, setIsAdmin] = useState(!!initial?.isAdmin);
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl || null);
  const [iconName, setIconName] = useState(initial?.iconName || '');
  const [color, setColor] = useState(initial?.color || '');
  // A colour they picked themselves rather than one of the five.
  const isCustomColor = !!color && !MEMBER_COLORS.some(c => c.hex.toLowerCase() === color.toLowerCase());
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const fileRef = useRef();

  // Photos are downscaled to 512px and uploaded to storage. They used to be
  // read straight into the record as base64 with no size cap — three phone
  // photos would blow the browser's storage quota and silently lose the save.
  async function handlePhoto(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setPhotoError('');
    try {
      const blob = await downscale(file);
      const { url, error } = await uploadImage('ctd-avatars', blob);
      if (error) throw new Error(error);
      setPhotoUrl(url);
    } catch {
      setPhotoError('Couldn’t upload that photo. Try a different one.');
    } finally {
      setUploading(false);
    }
  }

  const initials = name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', marginBottom: 12 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: color || 'var(--green)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>
            {uploading
              ? <LoaderCircle size={20} color="#fff" strokeWidth={2} style={{ animation: 'ctd-spin 0.9s linear infinite' }} />
              : photoUrl
              ? <img src={photoUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : iconName && MEMBER_ICONS[iconName]
              ? (() => { const I = MEMBER_ICONS[iconName]; return <I size={27} color="#fff" strokeWidth={1.9} />; })()
              : <span style={{ fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: 'Montserrat, sans-serif' }}>{initials}</span>}
          </div>
          <button
            onClick={() => !uploading && fileRef.current.click()}
            disabled={uploading}
            title="Upload photo"
            style={{ position: 'absolute', bottom: -2, right: -2, width: 22, height: 22, borderRadius: '50%', background: 'var(--green)', border: '2px solid #fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={10} color="#fff" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhoto} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input className="form-input" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} autoFocus={canEditIdentity} disabled={!canEditIdentity} style={{ marginBottom: 0, ...(canEditIdentity ? {} : { background: 'var(--cream)', color: 'var(--muted)', cursor: 'not-allowed' }) }} />
          <input className="form-input" placeholder="Title or role (optional)" value={title} onChange={e => setTitle(e.target.value)} disabled={!canEditIdentity} style={{ marginBottom: 0, ...(canEditIdentity ? {} : { background: 'var(--cream)', color: 'var(--muted)', cursor: 'not-allowed' }) }} />
          {!canEditIdentity && (
            <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'Montserrat, sans-serif', lineHeight: 1.5 }}>
              Names and roles are changed by an approver — renaming has to follow the person through every project they're on. Your icon and colour are yours.
            </div>
          )}

          {/* Colour */}
          <div style={{ fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginTop: 4 }}>Colour</div>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', alignItems: 'center' }}>
            {MEMBER_COLORS.map(c => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setColor(color === c.hex ? '' : c.hex)}
                title={c.name}
                aria-label={c.name}
                aria-pressed={color === c.hex}
                style={{
                  width: 30, height: 30, borderRadius: '50%', background: c.hex, cursor: 'pointer',
                  border: color === c.hex ? '2.5px solid var(--text)' : '2px solid transparent',
                  boxShadow: color === c.hex ? '0 0 0 2px #fff inset' : 'none',
                  transition: 'transform 0.12s',
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.12)'}
                onMouseOut={e => e.currentTarget.style.transform = 'none'}
              />
            ))}

            {/* Anything else. The five above are the house set; this is the rest
                of the spectrum for anyone who wants it. The ring is a real
                colour wheel so it reads as "any colour" without a label. */}
            <label
              title="Any colour"
              style={{
                width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', position: 'relative',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: 'conic-gradient(#8E2A4C, #B07A16, #0E6B4A, #12586B, #2A4A85, #5E3A82, #8E2A4C)',
                border: isCustomColor ? '2.5px solid var(--text)' : '2px solid transparent',
                transition: 'transform 0.12s',
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.12)'}
              onMouseOut={e => e.currentTarget.style.transform = 'none'}
            >
              <span style={{
                width: 14, height: 14, borderRadius: '50%',
                background: isCustomColor ? color : 'var(--surface)',
                boxShadow: '0 0 0 1.5px rgba(255,255,255,0.9)',
              }} />
              <input
                type="color"
                value={color || '#0E6B4A'}
                onChange={e => setColor(e.target.value)}
                aria-label="Pick any colour"
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', border: 'none', padding: 0 }}
              />
            </label>

            {color && (
              <button
                type="button"
                onClick={() => setColor('')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px',
                  fontFamily: 'Montserrat, sans-serif', fontSize: 10, fontWeight: 800,
                  letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--muted)',
                }}
              >
                Reset
              </button>
            )}
          </div>

          {/* Icon */}
          <div style={{ fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)', marginTop: 4 }}>Icon</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(MEMBER_ICONS).map(([key, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setIconName(iconName === key ? '' : key)}
                title={key}
                aria-label={key}
                aria-pressed={iconName === key}
                style={{
                  width: 30, height: 30, borderRadius: 8, cursor: 'pointer',
                  background: iconName === key ? (color || 'var(--green)') : '#fff',
                  border: `1.5px solid ${iconName === key ? (color || 'var(--green)') : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.12s, border-color 0.12s',
                }}
              >
                <Icon size={15} color={iconName === key ? '#fff' : 'var(--muted)'} strokeWidth={1.9} />
              </button>
            ))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'Montserrat, sans-serif', lineHeight: 1.5 }}>
            A photo wins over an icon, and an icon over initials. Click a chosen one again to clear it.
          </div>
          {canSetCode && (
            <>
              <input
                className="form-input"
                placeholder="Sign-in code, e.g. Connie-88"
                value={code}
                onChange={e => setCode(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                style={{ marginBottom: 0 }}
              />
              <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'Montserrat, sans-serif', lineHeight: 1.5 }}>
                This is what they type to sign in. Leave it empty to take away their access without removing them from the team.
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 9, cursor: 'pointer', marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={e => setIsAdmin(e.target.checked)}
                  style={{ width: 17, height: 17, marginTop: 1, accentColor: 'var(--blue)', cursor: 'pointer', flexShrink: 0 }}
                />
                <span style={{ fontSize: 12.5, fontFamily: 'Montserrat, sans-serif', color: 'var(--text)', lineHeight: 1.5 }}>
                  <strong>Can approve projects</strong>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                    Approve and unapprove projects, delete them, and edit this team. Signing in with their own code is all they need.
                  </span>
                </span>
              </label>
            </>
          )}
          {photoError && (
            <div style={{ fontSize: 11, color: '#b45309', fontFamily: 'Montserrat, sans-serif', lineHeight: 1.5 }}>{photoError}</div>
          )}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button className="btn-primary" disabled={uploading || !name.trim()} style={{ fontSize: 11, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 4, opacity: uploading || !name.trim() ? 0.5 : 1, cursor: uploading || !name.trim() ? 'not-allowed' : 'pointer' }}
              onClick={() => {
                if (!name.trim() || uploading) return;
                // Look is always sent — everyone may change it. Identity only
                // when the form actually offered those fields, and the code and
                // approver flag only when it showed those too: a save must never
                // write back a value the person was never shown.
                const data = { photoUrl, iconName: iconName || null, color: color || null };
                if (canEditIdentity) { data.name = name.trim(); data.title = title.trim(); }
                if (canSetCode) { data.code = code.trim(); data.isAdmin = isAdmin; }
                onSave(data);
              }}>
              <Check size={12} /> Save
            </button>
            <button onClick={onCancel} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px', fontSize: 11, cursor: 'pointer', color: 'var(--muted)' }}>
              Cancel
            </button>
            {photoUrl && (
              <button onClick={() => setPhotoUrl(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                <X size={10} /> Remove photo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PeopleView({ team, projects, onAddMember, onUpdateMember, onDeleteMember, onSelectPerson, onOpenStickyNote, onToggleTask, isAdmin = false, currentUser = '' }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [binderOpen, setBinderOpen] = useState(null);
  // null until loaded, so the form can tell "no code set" apart from "haven't
  // asked yet" — see the note on MemberForm's canSetCode.
  const [codes, setCodes] = useState(null);

  // Codes are readable to an admin and to nobody else: the table is revoked
  // from the Data API entirely, so this has to go through the admin function.
  // Keyed on the form opening and closing rather than on `team`: the poll hands
  // back a fresh array every 30 seconds, so depending on it would re-fetch the
  // codes all afternoon. Opening or closing an editor is exactly when a code
  // could have gone stale, and nothing else changes them.
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    (async () => {
      const { data } = await listCodes();
      if (cancelled) return;
      const map = {};
      for (const row of data?.codes || []) map[row.member_id] = row.code || '';
      setCodes(map);
    })();
    return () => { cancelled = true; };
  }, [isAdmin, editingId, adding]);

  // Adding is open to everyone; editing and removing are not. That split is
  // enforced in Postgres, not just here — see ctd-open-roster.sql.
  function handleAdd(data) {
    onAddMember(data);
    setAdding(false);
  }

  function handleEdit(data) {
    onUpdateMember(editingId, data);
    setEditingId(null);
  }

  function handleDelete(id) {
    onDeleteMember(id);
  }

  const sortedTeam = [...team].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 className="page-title">Team</h1>
          <button
            onClick={() => { setAdding(true); setEditingId(null); }}
            title="Add a team member"
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--yellow)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}
          >
            <Plus size={16} color="#fff" strokeWidth={2.5} />
          </button>
        </div>
        <LogoMark size={36} onClick={onOpenStickyNote} />
      </div>

      {/* Toolbar — matches Projects page */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <button
            onClick={() => setViewMode('list')}
            style={{ padding: '7px 12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: viewMode === 'list' ? 'var(--blue)' : 'var(--surface)', color: viewMode === 'list' ? '#fff' : 'var(--muted)', transition: 'all 0.15s' }}
          >
            <LayoutList size={13} /> List
          </button>
          <button
            onClick={() => setViewMode('binder')}
            style={{ padding: '7px 12px', border: 'none', borderLeft: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', background: viewMode === 'binder' ? 'var(--blue)' : 'var(--surface)', color: viewMode === 'binder' ? '#fff' : 'var(--muted)', transition: 'all 0.15s' }}
          >
            <BookOpen size={13} /> Binder
          </button>
        </div>
      </div>

      {adding && <MemberForm canSetCode={isAdmin && codes !== null} onSave={handleAdd} onCancel={() => setAdding(false)} />}

      {viewMode === 'binder' ? (
        <>
          {binderOpen && (
            <BinderInterior
              member={binderOpen}
              projects={projects}
              color={BINDER_COLORS[sortedTeam.findIndex(m => m.id === binderOpen.id) % BINDER_COLORS.length]}
              onClose={() => setBinderOpen(null)}
              onToggleTask={onToggleTask}
              isAdmin={isAdmin}
              currentUser={currentUser}
            />
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, padding: '8px 4px 32px' }}>
            {sortedTeam.map((member, i) => (
              <BinderCard key={member.id} member={member} projects={projects} onOpenBinder={m => setBinderOpen(m)} colorIndex={i} />
            ))}
            {team.length === 0 && (
              <div style={{ color: 'var(--muted)', fontSize: 13, fontStyle: 'italic', padding: '32px 0' }}>
                No team members yet. Add someone to get started.
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', background: 'var(--surface)', marginBottom: 16 }}>
            {team.length === 0 && !adding ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                No team members yet. Add someone to get started.
              </div>
            ) : (
              sortedTeam.map(member => (
                editingId === member.id ? (
                  <div key={member.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <MemberForm
                      initial={member}
                      initialCode={codes?.[member.id] || ''}
                      canSetCode={isAdmin && codes !== null}
                      canEditIdentity={isAdmin}
                      onSave={handleEdit}
                      onCancel={() => setEditingId(null)}
                    />
                  </div>
                ) : (
                  <MemberRow key={member.id} member={member} projects={projects} onEdit={m => setEditingId(m.id)} onDelete={handleDelete} onSelect={onSelectPerson} canManage={isAdmin} />
                )
              ))
            )}
          </div>
        </>
      )}

    </div>
  );
}
