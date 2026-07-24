// Small blocky pixel-art brand mark, used sparingly (nav logo, floating badge).
export default function PixelMark({ className = '' }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" className={className} aria-hidden="true">
      <rect x="0" y="0" width="10" height="10" fill="#F5511E" />
      <rect x="10" y="0" width="10" height="10" fill="#141414" />
      <rect x="0" y="10" width="10" height="10" fill="#F0A93E" />
      <rect x="10" y="10" width="10" height="10" fill="#D6E14A" />
    </svg>
  );
}
