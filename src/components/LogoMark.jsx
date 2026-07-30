// Chippy — Chapelle's chipmunk, the school's mascot since 1964.
//
// She replaced a paper-airplane mark drawn in SVG. Chapelle's brand rules
// reserve the chipmunk for admissions, camps, internal events and gifts, and
// keep the crest for institutional use — an internal staff hub is squarely
// chipmunk territory. The same rules say the crest and the chipmunk must never
// appear together, so nothing here should ever gain a crest alongside her.
//
// She is a sprite strip, not a still: 17 frames pulled from the mascot video,
// keyed off its black background. Frame 0 is what you see at rest, so hovering
// starts from exactly the pose already on screen and there is nothing to jump.
// The animation is real footage rather than a CSS approximation of a blink.

// The strip is 17 frames wide and the animation steps 16 times to land on the
// last one. Those two numbers live in index.css (.ctd-mark / @keyframes
// ctd-wink) because CSS cannot read a JS constant and steps() will not take a
// custom property — if the sprite is ever rebuilt with a different frame count,
// both numbers there have to move together.

// Below roughly 40px the wink is a few pixels of movement nobody can read, and
// it costs a repaint every time a cursor crosses a list. She holds still there.
const WINK_MIN_HEIGHT = 40;

export default function LogoMark({ size = 36, onClick, style, onGreen = false, wink = true }) {
  const frame = Math.round(size * 1.3);
  const canWink = wink && frame >= WINK_MIN_HEIGHT;

  const mark = (
    <span
      className={`ctd-mark${canWink ? ' is-live' : ''}`}
      role="img"
      aria-label="Chapelle Chipmunk"
      style={{ '--ctd-frame': `${frame}px` }}
    />
  );

  // On green she needs a white disc — brown fur and dark outlines muddy against
  // the deep green. Sized off her frame so it stays a true circle with an even
  // margin all the way round.
  if (onGreen) {
    const pad = Math.max(3, Math.round(frame * 0.11));
    return (
      <span
        onClick={onClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: frame + pad * 2,
          height: frame + pad * 2,
          borderRadius: '50%',
          background: '#fff',
          flexShrink: 0,
          cursor: onClick ? 'pointer' : 'default',
          ...style,
        }}
      >
        {mark}
      </span>
    );
  }

  return (
    <span
      className={`ctd-mark${canWink ? ' is-live' : ''}`}
      role="img"
      aria-label="Chapelle Chipmunk"
      onClick={onClick}
      style={{
        '--ctd-frame': `${frame}px`,
        cursor: onClick ? 'pointer' : 'default',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
