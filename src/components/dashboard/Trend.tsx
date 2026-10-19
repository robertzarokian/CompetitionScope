// A small line chart of how often AI recommended the company at each check.
export function Trend({ points }: { points: { label: string; value: number }[] }) {
  if (points.length === 0) return <p className="text-sm text-navy-400">The chart appears after your first check.</p>;
  const w = 560;
  const h = 140;
  const pad = 24;
  const x = (i: number) => (points.length === 1 ? w / 2 : pad + (i * (w - pad * 2)) / (points.length - 1));
  const y = (v: number) => h - pad - v * (h - pad * 2);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.value)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="How often AI recommended you over time">
      {[0, 0.5, 1].map((g) => (
        <g key={g}>
          <line x1={pad} x2={w - pad} y1={y(g)} y2={y(g)} stroke="#b7c0d1" strokeDasharray="3 4" />
          <text x={4} y={y(g) + 4} fontSize="10" fill="#5c6d8c">{Math.round(g * 100)}%</text>
        </g>
      ))}
      <path d={path} fill="none" stroke="#ab7f3c" strokeWidth="2" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(p.value)} r="4" fill="#cc9f52" />
          <text x={x(i)} y={h - 6} fontSize="10" fill="#5c6d8c" textAnchor="middle">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}
