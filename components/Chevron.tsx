export default function Chevron({ className = '' }: { className?: string }) {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 9 9"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path d="M2 1l3.5 3.5L2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
