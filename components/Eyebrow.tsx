export default function Eyebrow({
  children,
  className = 'text-accent-orange',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={`font-mono text-xs uppercase tracking-widest ${className}`}>{children}</p>;
}
