import React from 'react';

// ============================================================
// Card
// ============================================================
export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl p-5 ${className}`} style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
    {children}
  </div>
);

// ============================================================
// Ring (animated SVG progress)
// ============================================================
export const Ring = ({ value, max, color, size = 76, strokeWidth = 8, label, sublabel }) => {
  const pct = Math.min(100, ((value || 0) / max) * 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} stroke="#f0f0f3" strokeWidth={strokeWidth} fill="none" />
          <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-sm font-semibold tabular-nums" style={{ color }}>{Math.round(value || 0)}</div>
          <div className="text-[9px] text-gray-400 tabular-nums">/{max}</div>
        </div>
      </div>
      <div className="mt-2 text-[10px] font-medium text-gray-600 uppercase tracking-wide">{label}</div>
      {sublabel && <div className="text-[9px] text-gray-400">{sublabel}</div>}
    </div>
  );
};

// ============================================================
// StatRow
// ============================================================
export const StatRow = ({ label, value, sublabel, status }) => {
  const colors = { good: 'text-emerald-600', warn: 'text-amber-600', bad: 'text-rose-600', neutral: 'text-gray-900' };
  return (
    <div className="flex justify-between items-baseline py-2 border-b border-gray-100 last:border-0">
      <div>
        <div className="text-sm text-gray-600">{label}</div>
        {sublabel && <div className="text-xs text-gray-400 mt-0.5">{sublabel}</div>}
      </div>
      <div className={`text-base font-semibold tabular-nums ${colors[status] || colors.neutral}`}>{value}</div>
    </div>
  );
};

// ============================================================
// NumInput
// ============================================================
export const NumInput = ({ label, value, onChange, unit, target, step = 1 }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
    <div className="flex-1">
      <div className="text-sm font-medium text-gray-700">{label}</div>
      {target && <div className="text-xs text-gray-400">Target: {target} {unit}</div>}
    </div>
    <div className="flex items-center gap-2">
      <input type="number" inputMode="decimal" step={step} value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
        className="w-20 text-right text-base font-semibold tabular-nums bg-gray-50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 border-0"
        placeholder="0" />
      <span className="text-xs text-gray-400 w-8">{unit}</span>
    </div>
  </div>
);

// ============================================================
// Toggle
// ============================================================
export const Toggle = ({ checked, onChange, label, sublabel }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
    <div>
      <div className="text-sm font-medium text-gray-700">{label}</div>
      {sublabel && <div className="text-xs text-gray-400 mt-0.5">{sublabel}</div>}
    </div>
    <button onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-gray-200'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  </div>
);

// ============================================================
// SyncIndicator (header pill)
// ============================================================
export const SyncIndicator = ({ status, lastSync, queueLen, onForce }) => {
  const config = {
    idle: { color: 'bg-emerald-500', label: 'Synced', text: 'text-emerald-700', bg: 'bg-emerald-50' },
    syncing: { color: 'bg-blue-500 animate-pulse', label: 'Syncing...', text: 'text-blue-700', bg: 'bg-blue-50' },
    error: { color: 'bg-rose-500', label: 'Sync error', text: 'text-rose-700', bg: 'bg-rose-50' },
    offline: { color: 'bg-gray-400', label: 'Offline', text: 'text-gray-600', bg: 'bg-gray-100' },
  }[status] || { color: 'bg-gray-300', label: '...', text: 'text-gray-600', bg: 'bg-gray-100' };
  
  return (
    <button onClick={onForce} className={`flex items-center gap-2 px-2.5 py-1 rounded-full ${config.bg}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${config.color}`} />
      <span className={`text-[10px] font-medium ${config.text}`}>{config.label}</span>
      {queueLen > 0 && <span className="text-[10px] text-gray-500">· {queueLen}</span>}
    </button>
  );
};
