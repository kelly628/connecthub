import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { ArrowLeft, Pencil, Trash2, CheckCircle2, Clock, Plus, X, Copy, Download, GraduationCap, BookOpen, Heart, Users, Globe, HandHeart, Music, Palette, Baby, Camera, Trophy, Award, Star, Sparkles, Martini, Sun, PartyPopper, Gift, Leaf, Ribbon, Handshake, Crown, ChevronLeft, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import LogoMark from './LogoMark';

const LatinCross = ({ size = 22, strokeWidth = 2, color = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="2" x2="12" y2="22" />
    <line x1="5" y1="8" x2="19" y2="8" />
  </svg>
);

const ICON_OPTIONS = [
  { name: 'GraduationCap', label: 'Graduation', Component: GraduationCap },
  { name: 'BookOpen',      label: 'Learning',   Component: BookOpen },
  { name: 'Cross',         label: 'Faith',      Component: LatinCross },
  { name: 'Pencil',        label: 'Pencil',     Component: Pencil },
  { name: 'Heart',         label: 'Heart',      Component: Heart },
  { name: 'HandHeart',     label: 'Care',       Component: HandHeart },
  { name: 'Users',         label: 'Community',  Component: Users },
  { name: 'Globe',         label: 'Globe',      Component: Globe },
  { name: 'Music',         label: 'Music',      Component: Music },
  { name: 'Palette',       label: 'Arts',       Component: Palette },
  { name: 'Baby',          label: 'Family',     Component: Baby },
  { name: 'Camera',        label: 'Media',      Component: Camera },
  { name: 'Trophy',        label: 'Trophy',     Component: Trophy },
  { name: 'Award',         label: 'Award',      Component: Award },
  { name: 'Ribbon',        label: 'Ribbon',     Component: Ribbon },
  { name: 'Star',          label: 'Star',       Component: Star },
  { name: 'Sparkles',      label: 'Gala',       Component: Sparkles },
  { name: 'PartyPopper',   label: 'Celebrate',  Component: PartyPopper },
  { name: 'Gift',          label: 'Gift',       Component: Gift },
  { name: 'Martini',       label: 'Cocktail',   Component: Martini },
  { name: 'Leaf',          label: 'Leaf',       Component: Leaf },
  { name: 'Sun',           label: 'Sunshine',   Component: Sun },
  { name: 'Handshake',     label: 'Partnership',Component: Handshake },
  { name: 'Crown',         label: 'Excellence', Component: Crown },
];
const ICON_MAP = Object.fromEntries(ICON_OPTIONS.map(o => [o.name, o.Component]));

function IconPicker({ currentIcon, hasLogo, onSelectIcon, onUpload, onClear, onClose }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 300 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        background: 'var(--surface)', borderRadius: 16, padding: 24, zIndex: 301,
        width: 380, boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: 'var(--blue)' }}>Event Icon</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16, fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.03em' }}>
          Choose a built-in icon or upload your own logo.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 16 }}>
          {ICON_OPTIONS.map(({ name, label, Component }) => {
            const active = currentIcon === name && !hasLogo;
            return (
              <button
                key={name}
                onClick={() => { onSelectIcon(name); onClose(); }}
                title={label}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                  padding: '10px 6px', borderRadius: 10,
                  border: `1.5px solid ${active ? 'var(--green)' : 'var(--border)'}`,
                  background: active ? '#f0f9f4' : 'var(--cream)',
                  cursor: 'pointer', transition: 'all 0.12s',
                  color: active ? 'var(--green)' : 'var(--blue)',
                }}
                onMouseOver={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.background = 'var(--surface)'; }}}
                onMouseOut={e => { if (!active) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--cream)'; }}}
              >
                <Component size={22} />
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => { onUpload(); onClose(); }}
            style={{ flex: 1, background: 'var(--yellow)', border: 'none', borderRadius: 8, padding: '9px 0', fontSize: 12, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#175933', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Camera size={13} /> Upload Logo
          </button>
          {(currentIcon || hasLogo) && (
            <button
              onClick={() => { onClear(); onClose(); }}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)' }}
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function fireConfetti() {
  const colors = ['#457D58', '#6EC8F5', '#E46E88', '#C0392B', '#E46E88'];
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors });
  setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { y: 0.55 }, colors }), 250);
}

function fmtLeads(leads) {
  if (!leads) return '';
  return Array.isArray(leads) ? leads.join(', ') : leads;
}

function fmt(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// "Spring 2026" — the playbill eyebrow, read off the event's own date.
function seasonOf(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return '';
  const m = d.getMonth();
  const season = m === 11 || m <= 1 ? 'Winter' : m <= 4 ? 'Spring' : m <= 7 ? 'Summer' : 'Fall';
  return `${season} ${d.getFullYear()}`;
}

// Normalize old string format to task array
function normalizeTasks(responsibilities) {
  if (Array.isArray(responsibilities)) return responsibilities;
  if (!responsibilities) return [];
  return String(responsibilities).split(/,\s*|\n/).filter(t => t.trim()).map(text => ({ text: text.trim(), done: false }));
}

// Priority fill order for 5x3 team grid — flex centering packs each row,
// so rows fill evenly as members are added
const DOT_PRIORITY = [
  [0, 4], // top-far-right  ← first (alphabetically first member goes here)
  [0, 0], // top-far-left
  [1, 4], // mid-far-right
  [1, 0], // mid-far-left
  [0, 3], // top-right-inner
  [0, 1], // top-left-inner
  [1, 3], // mid-right
  [1, 1], // mid-left
  [2, 3], // bot-right-inner
  [2, 1], // bot-left-inner
  [0, 2], // top-center
  [2, 2], // bot-center
];

function DotCell({ dot, onEdit, onToggleDone, blessed = false, isAdmin = false, currentUser = '', animClass = '', animDelay = '0ms', accentColor = null }) {
  const tasks = normalizeTasks(dot.responsibilities);
  const isEmpty = !dot.member?.trim();
  const noTasks = !isEmpty && tasks.length === 0;
  const canToggle = blessed && (isAdmin || dot.member?.trim().toLowerCase() === currentUser.trim().toLowerCase());

  return (
    <div
      className={`hub-dot ${isEmpty ? 'empty' : ''} ${animClass}`}
      style={{
        ...(animClass ? { animationDelay: animDelay } : {}),
        ...(noTasks ? { opacity: 0.45 } : {}),
        ...(accentColor ? { borderColor: accentColor, background: accentColor === 'var(--yellow)' ? 'rgba(228,110,136,0.04)' : undefined } : {}),
      }}
      onClick={isEmpty ? onEdit : undefined}
    >
      {isEmpty ? (
        <div className="hub-dot-placeholder"><span>+ Add team member</span></div>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div className="hub-dot-name">{dot.member}</div>
            <button onClick={e => { e.stopPropagation(); onEdit(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 2, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <Pencil size={10} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', flex: 1, minHeight: 0 }}>
            {tasks.length === 0 ? (
              <span style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>No tasks yet</span>
            ) : tasks.map((task, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, cursor: canToggle ? 'pointer' : 'default', opacity: blessed ? 1 : 0.5 }} onClick={e => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={task.done}
                  disabled={!canToggle}
                  onChange={() => canToggle && onToggleDone(i)}
                  style={{ marginTop: 2, accentColor: 'var(--green)', flexShrink: 0, cursor: canToggle ? 'pointer' : 'default' }}
                />
                <span style={{ fontSize: 11, color: task.done ? 'var(--muted)' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none', lineHeight: 1.4 }}>
                  {task.text}
                </span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DotEditPanel({ dot, team, projects = [], usedMembers = new Set(), onSave, onClose }) {
  const [draftName, setDraftName] = useState(dot.member || '');
  const [draftTasks, setDraftTasks] = useState(() => normalizeTasks(dot.responsibilities));
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function addTask() { setDraftTasks(t => [...t, { text: '', done: false }]); }
  function removeTask(i) { setDraftTasks(t => t.filter((_, idx) => idx !== i)); }
  function setTaskText(i, text) { setDraftTasks(t => t.map((task, idx) => idx === i ? { ...task, text } : task)); }
  function addSuggestion(text) { setDraftTasks(t => [...t, { text, done: false }]); }

  // Derive task suggestions from this person's history across all projects
  const suggestions = (() => {
    if (!draftName.trim()) return [];
    const lname = draftName.trim().toLowerCase();
    const seen = new Set();
    const pool = [];
    projects.forEach(p => {
      (p.dots || []).forEach(d => {
        if (d.member?.trim().toLowerCase() !== lname) return;
        const tasks = Array.isArray(d.responsibilities) ? d.responsibilities : [];
        tasks.forEach(t => {
          const text = t.text?.trim();
          if (text && !seen.has(text.toLowerCase())) { seen.add(text.toLowerCase()); pool.push(text); }
        });
      });
    });
    const current = new Set(draftTasks.map(t => t.text.trim().toLowerCase()));
    return pool.filter(s => !current.has(s.toLowerCase()));
  })();

  function commit() {
    onSave({ member: draftName, responsibilities: draftTasks.filter(t => t.text.trim()) });
    onClose();
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.18)', zIndex: 200 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, height: '100vh', width: 400,
        background: 'var(--surface)', boxShadow: '-6px 0 32px rgba(0,0,0,0.14)',
        zIndex: 201, display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {(() => {
              const member = team.find(m => m.name === (dot.member || ''));
              if (!member) return null;
              const initials = member.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
              return (
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--green)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {member.photoUrl
                    ? <img src={member.photoUrl} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'Montserrat, sans-serif' }}>{initials}</span>}
                </div>
              );
            })()}
            <div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: 'var(--text)', lineHeight: 1.1 }}>
                {dot.member || 'Add Team Member'}
              </div>
              {dot.member && <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>Edit Assignment</div>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Team member */}
          <div>
            <div style={{ fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 8 }}>
              Team Member
            </div>
            {team.length > 0 ? (
              <select className="form-input" value={draftName} onChange={e => setDraftName(e.target.value)} style={{ marginBottom: 0 }} autoFocus>
                <option value="">— Select team member —</option>
                {team
                  .filter(m => !usedMembers.has(m.name) || m.name === draftName)
                  .map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                {draftName && !team.find(m => m.name === draftName) && (
                  <option value={draftName}>{draftName}</option>
                )}
              </select>
            ) : (
              <input className="form-input" placeholder="Team member name" value={draftName} onChange={e => setDraftName(e.target.value)} style={{ marginBottom: 0 }} autoFocus />
            )}
          </div>

          {/* Tasks */}
          <div>
            <div style={{ fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 10 }}>
              Responsibilities
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {draftTasks.map((task, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    className="form-input"
                    placeholder="Task…"
                    value={task.text}
                    onChange={e => setTaskText(i, e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTask(); } }}
                    style={{ flex: 1, marginBottom: 0 }}
                  />
                  <button onClick={() => removeTask(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addTask}
              style={{ marginTop: 10, background: 'none', border: '1px dashed var(--border)', borderRadius: 8, padding: '10px 0', fontSize: 12, cursor: 'pointer', color: 'var(--muted)', fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5, width: '100%', justifyContent: 'center' }}
            >
              <Plus size={12} /> Add Task
            </button>

            {suggestions.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--green)', marginBottom: 8 }}>
                  Suggested from past events
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => addSuggestion(s)}
                      style={{ background: '#f4faf7', border: '1px solid rgba(69,125,88,0.25)', borderRadius: 20, padding: '5px 12px', fontSize: 12, cursor: 'pointer', color: 'var(--green)', fontFamily: 'Montserrat, sans-serif', display: 'flex', alignItems: 'center', gap: 4, transition: 'background 0.12s' }}
                      onMouseOver={e => e.currentTarget.style.background = '#e6f4ec'}
                      onMouseOut={e => e.currentTarget.style.background = '#f4faf7'}
                    >
                      <Plus size={10} /> {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-primary" onClick={commit} style={{ flex: 1, fontSize: 14 }}>
              Save Task
            </button>
            <button onClick={onClose} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 18px', fontSize: 12, cursor: 'pointer', color: 'var(--muted)', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Cancel
            </button>
          </div>

          {dot.member && !confirmingDelete && (
            <button
              onClick={() => setConfirmingDelete(true)}
              style={{ background: 'none', border: '1px solid var(--red)', borderRadius: 8, padding: '8px 0', fontSize: 12, cursor: 'pointer', color: 'var(--red)', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
            >
              <Trash2 size={13} /> Remove from this event
            </button>
          )}

          {confirmingDelete && (
            <div style={{ background: '#fff5f5', border: '1px solid var(--red)', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ fontSize: 13, color: 'var(--text)', marginBottom: 10, fontWeight: 600 }}>
                Remove {dot.member} from this event?
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>
                This clears their assignment and all tasks for this event only. Their profile and other events are not affected.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { onSave({ member: '', responsibilities: [] }); onClose(); }}
                  style={{ flex: 1, background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 0', fontSize: 12, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}
                >
                  Yes, Remove
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  style={{ flex: 1, background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 0', fontSize: 12, cursor: 'pointer', color: 'var(--muted)', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}
                >
                  Keep
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function DoneNotesStack({ notes }) {
  const [idx, setIdx] = useState(0);
  const [anim, setAnim] = useState(null); // 'left' | 'right' | null
  if (!notes.length) return null;
  const safeIdx = Math.min(idx, notes.length - 1);
  const note = notes[safeIdx];

  function go(dir) {
    setAnim(dir);
    setTimeout(() => {
      setIdx(i => dir === 'right' ? (i + 1) % notes.length : (i - 1 + notes.length) % notes.length);
      setAnim(null);
    }, 160);
  }

  return (
    <div style={{ position: 'relative', height: 78, userSelect: 'none' }}>
      {/* Shadow cards */}
      {notes.length >= 3 && <div style={{ position: 'absolute', top: 10, left: 10, right: 10, height: 62, background: '#FFF59D', borderRadius: 8, transform: 'rotate(-2.5deg)', opacity: 0.55 }} />}
      {notes.length >= 2 && <div style={{ position: 'absolute', top: 5, left: 5, right: 5, height: 65, background: '#FFFDE7', borderRadius: 8, transform: 'rotate(1.2deg)', opacity: 0.8 }} />}
      {/* Top card */}
      <div style={{
        position: 'absolute', inset: 0, background: '#FFFDE7', borderRadius: 8,
        borderTop: '4px solid #c8b400', padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 8,
        transition: anim ? 'opacity 0.14s, transform 0.14s' : 'none',
        opacity: anim ? 0 : 1,
        transform: anim === 'right' ? 'translateX(-12px)' : anim === 'left' ? 'translateX(12px)' : 'none',
      }}>
        {notes.length > 1 && (
          <button onClick={() => go('left')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c8b400', display: 'flex', padding: 2, flexShrink: 0 }}>
            <ChevronLeft size={14} />
          </button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#a89000', marginBottom: 3 }}>
            {safeIdx + 1} / {notes.length} · Done
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {note.text}
          </div>
        </div>
        {notes.length > 1 && (
          <button onClick={() => go('right')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c8b400', display: 'flex', padding: 2, flexShrink: 0 }}>
            <ChevronRight size={14} />
          </button>
        )}
        <CheckCircle2 size={15} color="#c8b400" style={{ flexShrink: 0 }} />
      </div>
    </div>
  );
}

export default function ProjectDetail({ project, projects = [], team = [], onUpdateDots, onUpdateProject, onEdit, onDelete, onDuplicate, onBack, onSelectPerson, isNew = false, isAdmin = false, currentUser = '' }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingDotIndex, setEditingDotIndex] = useState(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [countWarning, setCountWarning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const logoInputRef = useRef(null);
  const printRef = useRef(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showCompleteDownload, setShowCompleteDownload] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');
  const [nameDraft, setNameDraft] = useState(project.name || '');
  const [showLeadsPicker, setShowLeadsPicker] = useState(false);
  const [editingDate, setEditingDate] = useState(false);

  useEffect(() => {
    setNameDraft(project.name || '');
  }, [project.id]);

  // Playbill eyebrow — the season is read off the event's own date.
  const season = seasonOf(project.date);

  const leadsArr = Array.isArray(project.leads) ? project.leads : project.leads ? [project.leads] : [];

  let totalTasks = 0, doneTasks = 0;
  (project.dots || []).forEach(d => {
    const tasks = normalizeTasks(d.responsibilities);
    totalTasks += tasks.length;
    doneTasks += tasks.filter(t => t.done).length;
  });
  const allTasksDone = totalTasks > 0 && doneTasks === totalTasks;
  const readyToComplete = project.blessed && allTasksDone && !project.completed;

  function saveNameOnBlur() {
    const trimmed = nameDraft.trim();
    if (trimmed !== project.name) onUpdateProject({ ...project, name: trimmed });
  }

  function toggleLead(name) {
    const next = leadsArr.includes(name) ? leadsArr.filter(n => n !== name) : [...leadsArr, name];
    onUpdateProject({ ...project, leads: next });
  }

  async function captureCanvas() {
    const el = printRef.current;
    if (!el) return null;
    Object.assign(el.style, {
      display: 'block', position: 'fixed', top: '-9999px', left: '0',
      width: '816px', background: '#fff', padding: '62px 72px', boxSizing: 'border-box',
    });
    try {
      return await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    } finally {
      Object.assign(el.style, { display: '', position: '', top: '', left: '', width: '', background: '', padding: '', boxSizing: '' });
    }
  }

  async function handleDownload(format) {
    setShowDownloadMenu(false);
    const slug = project.name.replace(/[^a-z0-9]/gi, '_');
    const canvas = await captureCanvas();
    if (!canvas) return;
    if (format === 'pdf') {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });
      const margin = 0.65;
      const contentW = 8.5 - margin * 2;
      const imgH = (canvas.height / canvas.width) * contentW;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, margin, contentW, imgH);
      pdf.save(`${slug}_summary.pdf`);
    } else {
      const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
      const ext = format === 'jpg' ? 'jpg' : 'png';
      const quality = format === 'jpg' ? 0.92 : undefined;
      const url = quality ? canvas.toDataURL(mime, quality) : canvas.toDataURL(mime);
      const a = document.createElement('a');
      a.href = url; a.download = `${slug}_summary.${ext}`; a.click();
    }
  }

  function handleConnectTheDots() {
    setIsConnecting(true);
    setTimeout(() => {
      onUpdateProject({ ...project, submitted: true });
      setIsConnecting(false);
    }, 2000);
  }
  const dotCount = project.dotCount || 8;

  function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onUpdateProject({ ...project, logoUrl: ev.target.result });
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleDotSave(index, dot) {
    const updated = [...project.dots];
    updated[index] = dot;
    onUpdateDots(updated);
  }

  function handleToggleDone(index, taskIdx) {
    const dot = project.dots[index] || { member: '', responsibilities: [] };
    const tasks = normalizeTasks(dot.responsibilities);
    const updated = tasks.map((t, i) => i === taskIdx ? { ...t, done: !t.done } : t);
    handleDotSave(index, { ...dot, responsibilities: updated });
    if (updated.every(t => t.done) && updated.length > 0) fireConfetti();
  }

  function changeDotCount(n) {
    const clamped = Math.max(1, Math.min(12, n));
    if (clamped < dotCount) {
      const wouldRemove = (project.dots || []).slice(clamped).some(d => d?.member?.trim());
      if (wouldRemove) {
        setCountWarning(true);
        setTimeout(() => setCountWarning(false), 3000);
        return;
      }
    }
    onUpdateProject({ ...project, dotCount: clamped });
  }

  // Build rows of active cells only — flex centering handles layout automatically
  const rows = [[], [], []];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      const priorityIdx = DOT_PRIORITY.findIndex(([dr, dc]) => dr === r && dc === c);
      if (priorityIdx !== -1 && priorityIdx < dotCount) {
        rows[r].push({ type: 'dot', index: priorityIdx, key: `${r}-${c}` });
      }
    }
  }

  return (
    <div className="page" style={{ maxWidth: 'none' }}>
      {/* Header — back link and actions sit above the playbill */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 12, fontFamily: 'var(--font-body)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 0' }}
        >
          <ArrowLeft size={13} /> All Projects
        </button>

        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          {/* Connect the Dots — staff submits for review */}
          {!project.submitted && !project.blessed && (
            <button
              onClick={handleConnectTheDots}
              disabled={isConnecting}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--yellow)', color: '#175933',
                border: 'none', borderRadius: 8, padding: '7px 16px', fontSize: 12, cursor: 'pointer',
                fontFamily: 'Montserrat, sans-serif', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'filter 0.15s',
              }}
              onMouseOver={e => e.currentTarget.style.filter = 'brightness(0.92)'}
              onMouseOut={e => e.currentTarget.style.filter = 'none'}
            >
              Connect the Dots
            </button>
          )}
          {/* Back to Draft — withdraw from approval queue */}
          {isAdmin && project.submitted && !project.blessed && (
            <button
              onClick={() => onUpdateProject({ ...project, submitted: false })}
              style={{
                background: 'none', border: '1px solid var(--border)', borderRadius: 8,
                padding: '7px 14px', fontSize: 12, cursor: 'pointer', color: 'var(--muted)',
                fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}
            >
              Back to Draft
            </button>
          )}
          <button
            onClick={onDuplicate}
            title="Duplicate project"
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}
          >
            <Copy size={13} />
          </button>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDownloadMenu(v => !v)}
              title="Download"
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}
            >
              <Download size={13} />
            </button>
            {showDownloadMenu && (
              <>
                <div onClick={() => setShowDownloadMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 100 }} />
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                  zIndex: 101, minWidth: 130, overflow: 'hidden',
                }}>
                  {[['pdf', 'PDF'], ['png', 'PNG'], ['jpg', 'JPEG']].map(([fmt, label]) => (
                    <button
                      key={fmt}
                      onClick={() => handleDownload(fmt)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '9px 14px', border: 'none', background: 'none',
                        fontSize: 12, fontFamily: 'Montserrat, sans-serif',
                        fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                        color: 'var(--text)', cursor: 'pointer',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--cream)'}
                      onMouseOut={e => e.currentTarget.style.background = 'none'}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          {confirmDelete ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={onDelete} style={{ background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Delete</button>
              <button onClick={() => setConfirmDelete(false)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 10px', fontSize: 12, cursor: 'pointer', color: 'var(--muted)' }}>Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center' }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── The Playbill ──────────────────────────────────
          The event announced like a printed program cover:
          crest, season, title, rule, credits — symmetrical,
          with every line still the live control. */}
      <div className="playbill" style={{ marginBottom: 24 }}>
        <div className="pb-topbar">
          {/* Date — reads as printed type, becomes a picker on click */}
          {editingDate ? (
            <input
              type="date"
              className="pb-date-input"
              value={project.date || ''}
              autoFocus
              onChange={e => onUpdateProject({ ...project, date: e.target.value })}
              onBlur={() => setEditingDate(false)}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur(); }}
              aria-label="Event date"
            />
          ) : (
            <button
              className={`pb-date${project.date ? '' : ' empty'}`}
              onClick={() => setEditingDate(true)}
            >
              {project.date ? fmt(project.date) : 'Add a date'}
            </button>
          )}

          {(() => {
            const textC = project.completed ? '#8F7700' : project.blessed ? 'var(--green)' : project.submitted ? '#b45309' : 'var(--muted)';
            return (
              <span className="pb-status" style={{ color: textC }}>
                {project.completed
                  ? <><Trophy size={11} /> Complete</>
                  : project.blessed
                  ? <><CheckCircle2 size={11} /> Approved</>
                  : project.submitted
                    ? <><Clock size={11} /> Awaiting Approval</>
                    : <><Clock size={11} /> Draft</>}
              </span>
            );
          })()}
        </div>

        {/* Crest */}
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleLogoUpload}
        />
        <button
          className="pb-crest"
          onClick={() => setShowIconPicker(true)}
          title={project.logoUrl || project.iconName ? 'Change icon or logo' : 'Add an icon or logo'}
        >
          {project.logoUrl ? (
            <img src={project.logoUrl} alt="Event logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 6, boxSizing: 'border-box' }} />
          ) : project.iconName && ICON_MAP[project.iconName] ? (
            (() => { const Icon = ICON_MAP[project.iconName]; return <Icon size={25} color="var(--blue)" strokeWidth={1.5} />; })()
          ) : (
            <LogoMark size={21} />
          )}
        </button>

        {season && <div className="pb-eyebrow">{season}</div>}

        <input
          className="pb-title"
          value={nameDraft}
          onChange={e => setNameDraft(e.target.value)}
          onBlur={saveNameOnBlur}
          onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          placeholder="Event name..."
          autoFocus={!project.name}
          aria-label="Event name"
        />

        <div className="pb-rule" />

        {/* Credits */}
        <div className="pb-credit" style={{ position: 'relative' }}>
          <button
            className={`pb-leads${leadsArr.length ? '' : ' empty'}`}
            onClick={() => setShowLeadsPicker(v => !v)}
            aria-expanded={showLeadsPicker}
          >
            {leadsArr.length > 0 ? (
              <>
                <span style={{ display: 'inline-flex', flexShrink: 0 }}>
                  {leadsArr.map((leadName, i) => {
                    const m = team.find(t => t.name.trim().toLowerCase() === leadName.trim().toLowerCase());
                    const initials = leadName.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                    return (
                      <span key={leadName} style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--blue)', overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1.5px solid #fff', marginLeft: i ? -8 : 0 }}>
                        {m?.photoUrl
                          ? <img src={m.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: 8, fontWeight: 700, color: '#fff', fontFamily: 'var(--font-body)' }}>{initials}</span>}
                      </span>
                    );
                  })}
                </span>
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }} title={leadsArr.join(', ')}>
                  Led by <b>{leadsArr.length > 1 ? `${leadsArr.slice(0, -1).join(', ')} and ${leadsArr[leadsArr.length - 1]}` : leadsArr[0]}</b>
                </span>
              </>
            ) : 'Add leads'}
          </button>
          {showLeadsPicker && (
            <>
              <div onClick={() => setShowLeadsPicker(false)} style={{ position: 'fixed', inset: 0, zIndex: 50 }} />
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 51, minWidth: 200, padding: '6px 0', overflow: 'hidden', textAlign: 'left' }}>
                {team.length === 0 && <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--muted)', fontStyle: 'italic' }}>No team members yet.</div>}
                {team.map(m => (
                  <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', transition: 'background 0.1s' }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--cream)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <input type="checkbox" checked={leadsArr.includes(m.name)} onChange={() => toggleLead(m.name)} style={{ accentColor: 'var(--green)', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>{m.name}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="pb-credit">
          <span>with a company of <span className="num">{dotCount}</span></span>
          <span style={{ display: 'inline-flex', gap: 4 }}>
            <button className="pb-step" onClick={() => changeDotCount(dotCount - 1)} disabled={dotCount <= 1} aria-label="Fewer team members">−</button>
            <button className="pb-step" onClick={() => changeDotCount(dotCount + 1)} disabled={dotCount >= 12} aria-label="More team members">+</button>
          </span>
        </div>

        {countWarning && (
          <div style={{ fontSize: 11, fontFamily: 'var(--font-body)', color: 'var(--blue)', letterSpacing: '0.03em', marginTop: 10 }}>
            Remove assigned members first before reducing the count.
          </div>
        )}
      </div>

      {/* New project reminder */}
      {isNew && (!nameDraft.trim() || !project.date || leadsArr.length === 0) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(228,110,136,0.14)', border: '1px solid rgba(200,160,0,0.3)',
          borderRadius: 12, padding: '10px 16px', marginBottom: 20,
        }}>
          <Sparkles size={16} color="#a89000" strokeWidth={1.5} />
          <span style={{ fontSize: 12, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: '#7a5c00', letterSpacing: '0.04em' }}>
            {(() => {
              const missing = [];
              if (!nameDraft.trim()) missing.push('a name');
              if (!project.date) missing.push('a date');
              if (leadsArr.length === 0) missing.push('a lead');
              return `Add ${missing.join(', ')} to save this project.`;
            })()}
          </span>
        </div>
      )}

      {/* Mark Complete banner */}
      {readyToComplete && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'rgba(69,125,88,0.07)', border: '1px solid rgba(69,125,88,0.25)',
          borderRadius: 12, padding: '14px 20px', marginBottom: 20,
        }}>
          <CheckCircle2 size={20} color="var(--green)" strokeWidth={1.5} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Ready to wrap up</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'Montserrat, sans-serif' }}>This project is approved and all tasks are complete.</div>
          </div>
          <button
            onClick={() => { onUpdateProject({ ...project, completed: true }); fireConfetti(); setShowCompleteDownload(true); }}
            style={{ background: 'var(--green)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer', flexShrink: 0, transition: 'filter 0.15s' }}
            onMouseOver={e => e.currentTarget.style.filter = 'brightness(0.9)'}
            onMouseOut={e => e.currentTarget.style.filter = 'none'}
          >
            Mark Complete
          </button>
        </div>
      )}

      {/* Completed state banner */}
      {project.completed && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          background: 'rgba(201,168,0,0.07)', border: '1px solid rgba(201,168,0,0.28)',
          borderRadius: 12, padding: '14px 20px', marginBottom: 20,
        }}>
          <Trophy size={20} color="#C9A800" strokeWidth={1.5} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 12, color: '#C9A800', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Project Complete</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'Montserrat, sans-serif' }}>Wrapped up and featured in your completed projects.</div>
          </div>
          <button
            onClick={() => onUpdateProject({ ...project, completed: false })}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontSize: 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', color: 'var(--muted)', transition: 'all 0.15s', flexShrink: 0 }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = 'var(--blue)'; }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
          >
            Reopen
          </button>
        </div>
      )}

      {/* Hub diagram */}
      <div className="hub-wrap">
        <div className="hub-grid">
          {(() => {
            const accentColor = project.blessed ? 'var(--green)' : project.submitted ? 'var(--yellow)' : 'var(--blue)';
            return rows.filter(row => row.length > 0).map((row, r) => (
            <div key={r} className="hub-row">
              {row.map(cell => (
              <DotCell
                key={cell.key}
                dot={project.dots[cell.index] || { member: '', responsibilities: [] }}
                onEdit={() => setEditingDotIndex(cell.index)}
                onToggleDone={taskIdx => handleToggleDone(cell.index, taskIdx)}
                blessed={!!project.blessed}
                isAdmin={isAdmin}
                currentUser={currentUser}
                animClass={isConnecting ? 'ctd-dot-animate' : ''}
                animDelay={isConnecting ? `${150 + Math.floor(cell.index / 4) * 150}ms` : '0ms'}
                accentColor={accentColor}
              />
              ))}
            </div>
          ));
          })()}
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 14, fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Click any box to assign a team member
      </p>

      {editingDotIndex !== null && (
        <DotEditPanel
          dot={project.dots[editingDotIndex] || { member: '', responsibilities: [] }}
          team={team}
          projects={projects}
          usedMembers={new Set(
            (project.dots || [])
              .filter((d, i) => i !== editingDotIndex && d?.member?.trim())
              .map(d => d.member.trim())
          )}
          onSave={dot => handleDotSave(editingDotIndex, dot)}
          onClose={() => setEditingDotIndex(null)}
        />
      )}

      {/* ── Sticky Notes ──────────────────────────────── */}
      {(() => {
        const activeNotes = (project.notes || []).filter(n => !n.done);
        const doneNotes = (project.notes || []).filter(n => n.done);
        function markDone(id) {
          onUpdateProject({ ...project, notes: project.notes.map(n => n.id === id ? { ...n, done: true } : n) });
        }
        function saveNote() {
          if (!newNoteText.trim()) return;
          onUpdateProject({ ...project, notes: [...(project.notes || []), { id: crypto.randomUUID(), text: newNoteText.trim(), createdAt: new Date().toISOString() }] });
          setNewNoteText('');
          setShowAddNote(false);
        }
        return (
          <div style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className="section-title" style={{ marginBottom: 0 }}>Notes</div>
              <button
                onClick={() => { setShowAddNote(v => !v); setNewNoteText(''); }}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 10px', fontSize: 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <Plus size={10} /> Add
              </button>
            </div>

            {/* Inline add-note form */}
            {showAddNote && (
              <div style={{ background: '#FFFDE7', border: '1px solid var(--yellow)', borderTop: '4px solid #c8b400', borderRadius: 8, padding: '12px 14px', marginBottom: 12 }}>
                <textarea
                  autoFocus
                  value={newNoteText}
                  onChange={e => setNewNoteText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveNote(); if (e.key === 'Escape') { setShowAddNote(false); setNewNoteText(''); } }}
                  placeholder="Write a note..."
                  rows={3}
                  style={{ width: '100%', border: 'none', background: 'transparent', resize: 'none', outline: 'none', fontSize: 13, color: 'var(--text)', fontFamily: 'inherit', lineHeight: 1.6, boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => { setShowAddNote(false); setNewNoteText(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', padding: '4px 8px' }}>Cancel</button>
                  <button onClick={saveNote} disabled={!newNoteText.trim()} style={{ background: newNoteText.trim() ? '#c8b400' : 'var(--cream-dk)', border: 'none', borderRadius: 6, padding: '4px 12px', fontSize: 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: newNoteText.trim() ? '#fff' : 'var(--muted)', cursor: newNoteText.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}>Save</button>
                </div>
              </div>
            )}

            {/* Active notes */}
            {activeNotes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: doneNotes.length > 0 ? 20 : 0 }}>
                {activeNotes.map(note => (
                  <div key={note.id} style={{ background: '#FFFDE7', border: '1px solid var(--yellow)', borderRadius: 8, padding: '12px 14px', position: 'relative', borderTop: '4px solid var(--yellow)' }}>
                    <button
                      onClick={() => markDone(note.id)}
                      title="Mark as done"
                      style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', border: '1.5px solid #c8b400', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c8b400', padding: 0, transition: 'all 0.15s' }}
                      onMouseOver={e => { e.currentTarget.style.background = '#E46E88'; e.currentTarget.style.borderColor = '#E46E88'; e.currentTarget.style.color = '#fff'; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = '#c8b400'; e.currentTarget.style.color = '#c8b400'; }}
                    >
                      <CheckCircle2 size={11} />
                    </button>
                    <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6, paddingRight: 26, whiteSpace: 'pre-wrap' }}>{note.text}</div>
                    {note.createdAt && (
                      <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.04em', marginTop: 8 }}>
                        {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeNotes.length === 0 && !showAddNote && doneNotes.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>No notes yet.</div>
            )}

            {/* Done notes — stacked with flip navigation */}
            {doneNotes.length > 0 && <DoneNotesStack notes={doneNotes} />}
          </div>
        );
      })()}

      {/* ── Print-only layout ──────────────────────────── */}
      <div ref={printRef} className="print-only">
        {/* Masthead */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, marginBottom: 20, borderBottom: '2.5px solid #175933' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 24, letterSpacing: '-0.02em', color: '#175933', lineHeight: 1 }}>
            Connect<span style={{ color: '#6EC8F5' }}>Hub</span>
          </div>
          <div style={{ fontSize: 10, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: `1.5px solid ${project.blessed ? '#457D58' : project.submitted ? '#b45309' : '#ccc'}`, color: project.blessed ? '#457D58' : project.submitted ? '#b45309' : '#999', borderRadius: 4, padding: '3px 10px' }}>
            {project.blessed ? '✓ Approved' : project.submitted ? 'Awaiting Approval' : 'Draft'}
          </div>
        </div>

        {/* Project title */}
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 44, fontWeight: 'normal', color: '#175933', letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 6 }}>{project.name}</h1>
          <div style={{ display: 'flex', gap: 24, fontSize: 12, color: '#5E7A68', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.04em', alignItems: 'center', flexWrap: 'wrap' }}>
            {project.date && <span>{fmt(project.date)}</span>}
            {project.leads?.length > 0 && (() => {
              const leadsArr = Array.isArray(project.leads) ? project.leads : [project.leads];
              return (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span>{leadsArr.length > 1 ? 'Leads' : 'Lead'}:</span>
                  {leadsArr.map((leadName, i) => {
                    const member = team.find(m => m.name.trim().toLowerCase() === leadName.trim().toLowerCase());
                    const initials = leadName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                    return (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#457D58', flexShrink: 0, overflow: 'hidden', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          {member?.photoUrl
                            ? <img src={member.photoUrl} alt={leadName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: 8, fontWeight: 700, color: '#fff', fontFamily: 'Montserrat, sans-serif', lineHeight: 1 }}>{initials}</span>}
                        </span>
                        <strong style={{ color: '#0D2B1A' }}>{leadName}</strong>
                        {i < leadsArr.length - 1 && <span style={{ color: '#ccc' }}>·</span>}
                      </span>
                    );
                  })}
                </span>
              );
            })()}
          </div>
        </div>

        {/* Section label */}
        <div style={{ fontSize: 9, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#5E7A68', marginBottom: 10 }}>
          Team Assignments
        </div>

        {/* Team cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {(project.dots || []).filter(d => d?.member?.trim()).map((dot, i) => {
            const tasks = normalizeTasks(dot.responsibilities);
            const done = tasks.filter(t => t.done).length;
            return (
              <div key={i} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '11px 14px', breakInside: 'avoid' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 7, borderBottom: '1px solid #eee' }}>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#175933' }}>{dot.member}</span>
                  {tasks.length > 0 && <span style={{ fontSize: 10, fontFamily: 'Montserrat, sans-serif', color: done === tasks.length ? '#457D58' : '#999' }}>{done}/{tasks.length} done</span>}
                </div>
                {tasks.length === 0 ? (
                  <div style={{ fontSize: 11, color: '#bbb', fontStyle: 'italic' }}>No tasks assigned</div>
                ) : tasks.map((task, ti) => (
                  <div key={ti} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 5 }}>
                    <div style={{ width: 11, height: 11, border: `1.5px solid ${task.done ? '#457D58' : '#bbb'}`, borderRadius: 2, flexShrink: 0, marginTop: 1, background: task.done ? '#457D58' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {task.done && <span style={{ color: '#fff', fontSize: 8, lineHeight: 1 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 11, color: task.done ? '#bbb' : '#333', textDecoration: task.done ? 'line-through' : 'none', lineHeight: 1.4 }}>{task.text}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 20, paddingTop: 10, borderTop: '1px solid #eee', display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#bbb', fontFamily: 'Montserrat, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          <span>ConnectHub — Project Summary</span>
          <span>Generated {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </div>

      {showCompleteDownload && (
        <>
          <div onClick={() => setShowCompleteDownload(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(13,43,26,0.28)', zIndex: 300, backdropFilter: 'blur(4px)' }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: '#fff', borderRadius: 14, zIndex: 301, width: 340,
            boxShadow: '0 24px 64px rgba(13,43,26,0.18), 0 2px 8px rgba(13,43,26,0.07)',
            overflow: 'hidden',
          }}>
            <div style={{ height: 3, background: '#C9A800' }} />
            <div style={{ padding: '24px 24px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Trophy size={18} color="#C9A800" strokeWidth={1.8} />
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 19, fontWeight: 700, color: 'var(--blue)' }}>Nice work!</div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'Montserrat, sans-serif', marginBottom: 20, lineHeight: 1.5 }}>
                Want to download a copy of this project for your records?
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['pdf', 'Download PDF'], ['png', 'Download PNG']].map(([fmt, label]) => (
                  <button
                    key={fmt}
                    onClick={async () => { setShowCompleteDownload(false); await handleDownload(fmt); }}
                    style={{ width: '100%', padding: '10px 0', background: 'var(--blue)', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'Montserrat, sans-serif', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#fff', transition: 'filter 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.filter = 'brightness(1.15)'}
                    onMouseOut={e => e.currentTarget.style.filter = 'none'}
                  >
                    {label}
                  </button>
                ))}
                <button
                  onClick={() => setShowCompleteDownload(false)}
                  style={{ width: '100%', padding: '9px 0', background: 'none', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', transition: 'all 0.15s' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--blue)'; e.currentTarget.style.color = 'var(--blue)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)'; }}
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showIconPicker && (
        <IconPicker
          currentIcon={project.iconName}
          hasLogo={!!project.logoUrl}
          onSelectIcon={name => onUpdateProject({ ...project, iconName: name, logoUrl: null })}
          onUpload={() => logoInputRef.current?.click()}
          onClear={() => onUpdateProject({ ...project, iconName: null, logoUrl: null })}
          onClose={() => setShowIconPicker(false)}
        />
      )}
    </div>
  );
}
