import { useState, useEffect } from 'react';

// Each shape: array of { pts, fill } polygon descriptors
// viewBox: 0 0 36 48
const SHAPES = [
  {
    label: 'Gem',
    polys: [
      { pts: '18,0 0,40 18,30',   fill: '#112275' },
      { pts: '18,0 36,40 18,30',  fill: '#3558C6' },
      { pts: '0,40 18,30 9,48',   fill: '#F5C800' },
      { pts: '36,40 18,30 27,48', fill: '#F5C800' },
    ],
  },
  {
    label: 'Crane',
    polys: [
      { pts: '18,14 0,8  0,30',   fill: '#7EC4E8' }, // left wing
      { pts: '18,14 36,8 36,30',  fill: '#112275' }, // right wing
      { pts: '18,14 10,30 26,30', fill: '#3558C6' }, // body
      { pts: '14,30 22,30 18,48', fill: '#F5C800' }, // tail
    ],
  },
  {
    label: 'Star',
    polys: [
      { pts: '18,2 12,20 24,20',  fill: '#E03A2A' }, // top spike
      { pts: '34,26 16,20 16,32', fill: '#F5C800' }, // right spike
      { pts: '18,46 12,28 24,28', fill: '#D4186C' }, // bottom spike
      { pts: '2,26 20,20 20,32',  fill: '#112275' }, // left spike
    ],
  },
  {
    label: 'Butterfly',
    polys: [
      { pts: '0,4  18,22 5,20',   fill: '#D4186C' }, // left top wing
      { pts: '36,4 18,22 31,20',  fill: '#7EC4E8' }, // right top wing
      { pts: '0,34 18,26 6,44',   fill: '#F5C800' }, // left bottom wing
      { pts: '36,34 18,26 30,44', fill: '#E03A2A' }, // right bottom wing
    ],
  },
  {
    label: 'Fox',
    polys: [
      { pts: '2,2  14,18 2,18',   fill: '#E03A2A' }, // left ear
      { pts: '34,2 22,18 34,18',  fill: '#E03A2A' }, // right ear
      { pts: '6,16 30,16 18,40',  fill: '#F5A623' }, // face (using a warm orange hack)
      { pts: '12,32 24,32 18,44', fill: '#FFFDF5' }, // muzzle
    ],
  },
  {
    label: 'Rocket',
    polys: [
      { pts: '18,2 8,20 28,20',   fill: '#112275' }, // nose cone
      { pts: '8,20 14,36 18,26',  fill: '#3558C6' }, // body left
      { pts: '28,20 22,36 18,26', fill: '#7EC4E8' }, // body right
      { pts: '14,36 22,36 18,48', fill: '#E03A2A' }, // flame
    ],
  },
  {
    label: 'Boat',
    polys: [
      { pts: '18,4 12,26 24,26',  fill: '#F5C800' }, // sail
      { pts: '4,28 18,24 4,40',   fill: '#112275' }, // hull left
      { pts: '32,28 18,24 32,40', fill: '#3558C6' }, // hull right
      { pts: '4,40 32,40 18,46',  fill: '#7EC4E8' }, // keel
    ],
  },
];

// Inject CSS once
let stylesInjected = false;
function ensureStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  stylesInjected = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes lm-spin-out {
      0%   { transform: scale(1)    rotate(0deg);    opacity: 1; }
      25%  { transform: scale(1.18) rotate(-18deg);  opacity: 1; }
      55%  { transform: scale(0.05) rotate(210deg);  opacity: 0; }
      100% { transform: scale(0.05) rotate(210deg);  opacity: 0; }
    }
    @keyframes lm-bounce-in {
      0%   { transform: scale(0)    rotate(-30deg);  opacity: 0; }
      55%  { transform: scale(1.28) rotate(6deg);    opacity: 1; }
      72%  { transform: scale(0.9)  rotate(-4deg);   opacity: 1; }
      86%  { transform: scale(1.06) rotate(2deg);    opacity: 1; }
      100% { transform: scale(1)    rotate(0deg);    opacity: 1; }
    }
    .lm-wrap {
      cursor: pointer;
      display: inline-block;
      position: relative;
      user-select: none;
    }
    .lm-wrap:hover svg {
      filter: drop-shadow(0 3px 8px rgba(17,34,117,0.3));
    }
    .lm-phase-out { animation: lm-spin-out  0.32s ease-in  forwards; }
    .lm-phase-in  { animation: lm-bounce-in 0.48s cubic-bezier(.22,1.5,.36,1) forwards; }
    .lm-label {
      position: absolute;
      bottom: calc(100% + 5px);
      left: 50%;
      transform: translateX(-50%);
      background: #112275;
      color: #fff;
      font-size: 8px;
      font-family: 'Barlow Condensed', sans-serif;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 3px 7px;
      border-radius: 4px;
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;
    }
    .lm-wrap:hover .lm-label { opacity: 1; }
  `;
  document.head.appendChild(s);
}

export default function LogoMark({ size = 36, onClick }) {
  const [displayIdx, setDisplayIdx] = useState(0);
  const [phase, setPhase] = useState('idle'); // 'idle' | 'out' | 'in'

  useEffect(() => { ensureStyles(); }, []);

  function handleClick() {
    if (onClick) { onClick(); return; }
    if (phase !== 'idle') return;
    const next = (displayIdx + 1) % SHAPES.length;
    setPhase('out');
    setTimeout(() => {
      setDisplayIdx(next);
      setPhase('in');
    }, 300);
    setTimeout(() => setPhase('idle'), 800);
  }

  const shape = SHAPES[displayIdx];
  const nextShape = SHAPES[(displayIdx + 1) % SHAPES.length];

  return (
    <div
      className={`lm-wrap${phase === 'out' ? ' lm-phase-out' : phase === 'in' ? ' lm-phase-in' : ''}`}
      onClick={handleClick}
    >
      <svg
        width={size}
        height={size * 1.3}
        viewBox="0 0 36 48"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        {shape.polys.map((p, i) => (
          <polygon key={i} points={p.pts} fill={p.fill} />
        ))}
      </svg>
    </div>
  );
}
