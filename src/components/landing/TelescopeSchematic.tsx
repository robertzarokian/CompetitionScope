import { CornerFrame } from "@/components/decor/CornerFrame";

const TARGETS = [
  { cx: 432, cy: 58, label: "MATCH 96%" },
  { cx: 452, cy: 138, label: "MATCH 87%" },
  { cx: 402, cy: 168, label: "MATCH 78%" },
];

const TICKS = Array.from({ length: 24 }).map((_, i) => i);

export function TelescopeSchematic() {
  return (
    <div className="relative overflow-hidden rounded-sm instrument-panel">
      <div className="blueprint-grid absolute inset-0 opacity-70" aria-hidden="true" />
      <CornerFrame size={14} />

      <div className="relative flex items-center justify-between border-b border-navy-600 px-5 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream-300">
          Fig. 01 — Field Instrument
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-brass-400">
          Scale 1:4
        </span>
      </div>

      <svg viewBox="0 0 480 420" className="relative w-full" role="img" aria-label="Schematic diagram of a brass telescope on a tripod, scanning for competitors">
        {/* faint protractor arc, instrument-panel feel */}
        <g opacity="0.18" stroke="#3d4c66" fill="none">
          <circle cx="20" cy="400" r="220" strokeWidth="1" />
          <circle cx="20" cy="400" r="180" strokeWidth="1" />
        </g>

        {/* ground */}
        <line x1="40" y1="400" x2="300" y2="400" stroke="#3d4c66" strokeWidth="1" strokeDasharray="3 4" />
        <rect x="150" y="400" width="60" height="6" fill="#5a4220" opacity="0.5" />

        {/* tripod */}
        <g stroke="#7d5b2a" strokeWidth="3.5" strokeLinecap="round">
          <line x1="175" y1="252" x2="92" y2="400" />
          <line x1="175" y1="252" x2="258" y2="400" />
          <line x1="175" y1="252" x2="198" y2="396" strokeWidth="2.5" opacity="0.7" />
        </g>
        {/* tripod cross braces */}
        <line x1="118" y1="360" x2="150" y2="345" stroke="#7d5b2a" strokeWidth="2" opacity="0.6" />
        <line x1="232" y1="360" x2="200" y2="345" stroke="#7d5b2a" strokeWidth="2" opacity="0.6" />

        {/* mount head */}
        <circle cx="175" cy="252" r="11" fill="#151c2a" stroke="#cc9f52" strokeWidth="2" />
        <circle cx="175" cy="252" r="3" fill="#cc9f52" />

        {/* finder scope (small, parallel) */}
        <line x1="196" y1="225" x2="288" y2="150" stroke="#ab7f3c" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
        <circle cx="290" cy="148" r="5" fill="none" stroke="#ab7f3c" strokeWidth="1.5" opacity="0.7" />

        {/* main tube (tapered) */}
        <path
          d="M 190.5 240.9 L 351.6 102.4 L 328.4 77.6 L 179.5 229.2 Z"
          fill="#1e2738"
          stroke="#cc9f52"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* focuser knob */}
        <circle cx="255" cy="185" r="7" fill="#151c2a" stroke="#e2c17e" strokeWidth="1.75" />

        {/* eyepiece */}
        <circle cx="184" cy="234" r="8" fill="#151c2a" stroke="#e2c17e" strokeWidth="2" />

        {/* objective lens */}
        <circle cx="340" cy="90" r="20" fill="#151c2a" stroke="#e2c17e" strokeWidth="2.5" />
        <circle cx="340" cy="90" r="12" fill="none" stroke="#cc9f52" strokeWidth="1.25" opacity="0.8" />
        <circle cx="336" cy="86" r="3.5" fill="#f2ddab" opacity="0.7" />

        {/* sight lines to detected competitors */}
        {TARGETS.map((t, i) => (
          <line
            key={i}
            x1="340"
            y1="90"
            x2={t.cx}
            y2={t.cy}
            stroke="#cc9f52"
            strokeWidth="1"
            strokeDasharray="2 5"
            opacity="0.5"
          />
        ))}

        {/* target reticles */}
        {TARGETS.map((t, i) => (
          <g key={i}>
            <circle cx={t.cx} cy={t.cy} r="13" fill="none" stroke="#e2c17e" strokeWidth="1.25" opacity="0.9" />
            <circle cx={t.cx} cy={t.cy} r="2" fill="#e2c17e" />
            {[0, 90, 180, 270].map((deg) => {
              const rad = (deg * Math.PI) / 180;
              // Rounded so this stays hydration-safe if ever rendered from a
              // Client Component — see the matching note in components/Logo.tsx.
              const round = (n: number) => Math.round(n * 1000) / 1000;
              const x1 = round(t.cx + 15 * Math.sin(rad));
              const y1 = round(t.cy - 15 * Math.cos(rad));
              const x2 = round(t.cx + 19 * Math.sin(rad));
              const y2 = round(t.cy - 19 * Math.cos(rad));
              return (
                <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#e2c17e" strokeWidth="1.25" opacity="0.85" />
              );
            })}
            <text
              x={t.cx}
              y={t.cy - 24}
              textAnchor="middle"
              className="font-mono"
              fontSize="9"
              fill="#e2c17e"
              opacity="0.9"
            >
              {t.label}
            </text>
          </g>
        ))}

        {/* callout: objective — routed up-left, clear of the target cluster */}
        <g stroke="#8f7c58" strokeWidth="0.75" opacity="0.8">
          <line x1="329" y1="76" x2="270" y2="44" />
          <circle cx="329" cy="76" r="1.75" fill="#8f7c58" stroke="none" />
        </g>
        <text x="265" y="42" textAnchor="end" className="font-mono" fontSize="9" fill="#d8c69a">90MM OBJECTIVE</text>
        <text x="265" y="54" textAnchor="end" className="font-mono" fontSize="9" fill="#8f7c58">F/8.2 REFRACTOR</text>

        {/* callout: mount */}
        <g stroke="#8f7c58" strokeWidth="0.75" opacity="0.8">
          <line x1="164" y1="258" x2="120" y2="298" />
          <circle cx="164" cy="258" r="1.75" fill="#8f7c58" stroke="none" />
        </g>
        <text x="46" y="313" className="font-mono" fontSize="9" fill="#d8c69a">ALT-AZIMUTH MOUNT</text>

        {/* ruler ticks along bottom */}
        <g stroke="#3d4c66" strokeWidth="1">
          {TICKS.map((i) => (
            <line
              key={i}
              x1={40 + i * 11}
              y1="405"
              x2={40 + i * 11}
              y2={i % 4 === 0 ? 413 : 409}
              opacity="0.6"
            />
          ))}
        </g>
      </svg>

      <div className="relative flex items-center justify-between border-t border-navy-600 px-5 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-cream-300">
          Bearing locked
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-brass-400">
          <span className="h-1.5 w-1.5 scope-pulse rounded-full bg-brass-400" />
          3 signals found
        </span>
      </div>
    </div>
  );
}
