export default function LogoMark({ size = 36, onClick, style }) {
  return (
    <svg
      width={size}
      height={size * 1.3}
      viewBox="0 0 36 48"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', cursor: onClick ? 'pointer' : 'default', ...style }}
      onClick={onClick}
    >
      <polygon points="18,0 0,40 18,30"   fill="#175933" />
      <polygon points="18,0 36,40 18,30"  fill="#457D58" />
      <polygon points="0,40 18,30 9,48"   fill="#E46E88" />
      <polygon points="36,40 18,30 27,48" fill="#E46E88" />
    </svg>
  );
}
