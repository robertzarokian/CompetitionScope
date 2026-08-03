export function CornerFrame({
  className = "",
  size = 10,
}: {
  className?: string;
  size?: number;
}) {
  const corner = "absolute border-brass-400/60";
  const s = `${size}px`;
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden="true">
      <span className={`${corner} left-0 top-0 border-l border-t`} style={{ width: s, height: s }} />
      <span className={`${corner} right-0 top-0 border-r border-t`} style={{ width: s, height: s }} />
      <span className={`${corner} bottom-0 left-0 border-b border-l`} style={{ width: s, height: s }} />
      <span className={`${corner} bottom-0 right-0 border-b border-r`} style={{ width: s, height: s }} />
    </div>
  );
}
