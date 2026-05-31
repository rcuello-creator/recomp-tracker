import React from 'react';

// ============================================================
// DailyRings — Apple-Health-style concentric progress rings
// ============================================================
// Accepts an ordered list of rings. Renders outer→inner in array order.
// 4 rings (default day) or 5 (lift day, with extra inner Volume ring).
// Ring overflow >100% is capped visually at 100% — full closure pulses.
// ============================================================

const SIZE = 280;
const CENTER = SIZE / 2;

export const DailyRings = ({ rings }) => {
  const n = rings.length;
  const strokeWidth = n >= 5 ? 14 : 18;
  const gap = n >= 5 ? 22 : 26;
  const outerR = (SIZE - strokeWidth) / 2 - 4;

  return (
    <div className="flex flex-col items-center">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ transform: 'rotate(-90deg)' }} aria-hidden>
        {rings.map((ring, i) => {
          const r = outerR - i * gap;
          const c = 2 * Math.PI * r;
          const raw = (ring.value || 0) / (ring.target || 1);
          const pct = Math.min(Math.max(raw, 0), 1);
          const closed = raw >= 1;
          const offset = c - pct * c;
          // Track is a low-opacity wash of the same hue — Apple Health style.
          return (
            <g key={ring.key}>
              <circle cx={CENTER} cy={CENTER} r={r}
                stroke={ring.color} strokeOpacity={0.15}
                strokeWidth={strokeWidth} fill="none" />
              <circle cx={CENTER} cy={CENTER} r={r}
                stroke={ring.color} strokeWidth={strokeWidth} fill="none"
                strokeLinecap="round"
                strokeDasharray={c} strokeDashoffset={offset}
                style={{
                  transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                  color: ring.color,
                  animation: closed ? 'ringPulse 1.6s ease-in-out infinite' : undefined,
                }} />
            </g>
          );
        })}
      </svg>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 w-full max-w-xs">
        {rings.map(ring => {
          const value = Math.round(ring.value || 0);
          const target = Math.round(ring.target || 0);
          const raw = (ring.value || 0) / (ring.target || 1);
          const closed = raw >= 1;
          return (
            <div key={ring.key} className="flex items-baseline justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ring.color }} />
                <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-700">{ring.label}</span>
              </span>
              <span className={`text-sm tabular-nums ${closed ? 'font-bold' : 'font-semibold'}`}
                style={{ color: closed ? ring.color : '#111827' }}>
                {value}
                <span className="text-gray-400 font-normal">/{target}{ring.unit ? ` ${ring.unit}` : ''}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
