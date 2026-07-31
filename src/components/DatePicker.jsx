import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

// A calendar in the app's own clothes.
//
// This replaced <input type="date">, whose popup is drawn by the browser and
// cannot be styled at all — so it arrived in Chrome's grey, in the operating
// system's font, looking like it had been pasted in from somewhere else. Every
// other surface here is Fraunces and Montserrat on cream; the one place people
// pick a date was the exception.

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

// 'YYYY-MM-DD' without going through UTC. `new Date('2026-03-01')` is parsed as
// midnight UTC and then rendered in local time, which lands on February 28th
// for anyone west of Greenwich — a whole day wrong, and only for some users.
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseIso = s => (s ? new Date(`${s}T00:00:00`) : null);
const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function DatePicker({ value, onChange, onClose }) {
  const selected = parseIso(value);
  const today = new Date();
  const [view, setView] = useState(() => {
    const base = selected || today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const ref = useRef(null);

  // Escape closes, and so does a click anywhere else. Both are what people
  // already expect of a popover; neither is worth making someone hunt for.
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); onClose(); } }
    function onDown(e) { if (ref.current && !ref.current.contains(e.target)) onClose(); }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onDown); };
  }, [onClose]);

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Leading blanks so the 1st lands under its weekday.
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const step = n => setView(new Date(year, month + n, 1));

  const navBtn = {
    width: 30, height: 30, borderRadius: 9, border: '1px solid var(--border)',
    background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.14s, color 0.14s, border-color 0.14s',
  };
  const hoverOn  = e => { e.currentTarget.style.background = 'var(--cream)'; e.currentTarget.style.color = 'var(--blue)'; };
  const hoverOff = e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--muted)'; };

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Choose a date"
      style={{
        position: 'absolute', top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
        zIndex: 60, width: 268, padding: 14,
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14,
        boxShadow: '0 18px 44px rgba(13,43,26,0.16), 0 2px 8px rgba(13,43,26,0.06)',
        textAlign: 'center',
      }}
    >
      {/* Month */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button type="button" onClick={() => step(-1)} aria-label="Previous month" style={navBtn} onMouseOver={hoverOn} onMouseOut={hoverOff}>
          <ChevronLeft size={15} />
        </button>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 700, color: 'var(--blue)', letterSpacing: '-0.01em' }}>
          {MONTHS[month]} <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15 }}>{year}</span>
        </div>
        <button type="button" onClick={() => step(1)} aria-label="Next month" style={navBtn} onMouseOver={hoverOn} onMouseOut={hoverOff}>
          <ChevronRight size={15} />
        </button>
      </div>

      {/* Weekdays */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {WEEKDAYS.map((d, i) => (
          <div key={i} style={{ fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--muted)', paddingBottom: 4 }}>
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const isSel = sameDay(d, selected);
          const isToday = sameDay(d, today);
          return (
            <button
              key={i}
              type="button"
              onClick={() => { onChange(iso(d)); onClose(); }}
              aria-label={`${MONTHS[month]} ${d.getDate()}, ${year}`}
              aria-current={isToday ? 'date' : undefined}
              style={{
                height: 32, borderRadius: 9, cursor: 'pointer',
                fontFamily: 'var(--font-body)', fontSize: 13,
                fontWeight: isSel || isToday ? 700 : 500,
                background: isSel ? 'var(--blue)' : 'transparent',
                color: isSel ? '#fff' : 'var(--text)',
                border: isToday && !isSel ? '1.5px solid var(--yellow)' : '1.5px solid transparent',
                transition: 'background 0.13s, color 0.13s',
              }}
              onMouseOver={e => { if (!isSel) e.currentTarget.style.background = 'var(--cream)'; }}
              onMouseOut={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      {/* Today, and a way back out. Clearing only appears once there is
          something to clear, so the row is not half-dead on a new project. */}
      <div style={{ display: 'flex', gap: 6, marginTop: 12, paddingTop: 11, borderTop: '1px solid var(--border)' }}>
        <button
          type="button"
          onClick={() => { onChange(iso(today)); onClose(); }}
          style={{
            flex: 1, padding: '8px 0', borderRadius: 9, border: '1px solid var(--border)',
            background: 'var(--surface)', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 800,
            letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--blue)',
            transition: 'background 0.14s',
          }}
          onMouseOver={e => e.currentTarget.style.background = 'var(--cream)'}
          onMouseOut={e => e.currentTarget.style.background = 'var(--surface)'}
        >
          Today
        </button>
        {value && (
          <button
            type="button"
            onClick={() => { onChange(''); onClose(); }}
            aria-label="Clear the date"
            style={{
              padding: '8px 12px', borderRadius: 9, border: '1px solid var(--border)',
              background: 'var(--surface)', cursor: 'pointer', color: 'var(--muted)',
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 800,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              transition: 'background 0.14s, color 0.14s',
            }}
            onMouseOver={e => { e.currentTarget.style.background = 'var(--cream)'; e.currentTarget.style.color = 'var(--blue)'; }}
            onMouseOut={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--muted)'; }}
          >
            <X size={11} /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
