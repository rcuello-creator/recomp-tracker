import React from 'react';
import { Card } from '../lib/ui';
import { today } from '../lib/helpers';
import { calcActualDeficit, getPhaseProgress, getProgramProgress } from '../lib/deficit';

// ----------------------------------------------------------------------------
// Inline progress bar
// ----------------------------------------------------------------------------
const ProgressBar = ({ value, color = '#10b981', label }) => {
  const pct = Math.min(Math.max(value * 100, 0), 100);
  return (
    <div>
      <div className="flex justify-between text-[11px] text-gray-500 mb-1">
        <span>{label}</span>
        <span className="tabular-nums">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

const fmtDelta = (n) => {
  const r = Math.round(n);
  if (r === 0) return '0';
  return r > 0 ? `−${r}` : `+${Math.abs(r)}`; // positive deficit shown as negative cal balance
};

// ----------------------------------------------------------------------------
// Yesterday vs Today Target
//
// Bug 1 fix: previously hard-coded `yesterday = today - 1`; when yesterday had
// no log (common — agent OCR doesn't run every day), the card said "Sin data".
// Now walks back up to 7 days to find the most recent day with intake/active.
// ----------------------------------------------------------------------------
const findLastDayWithData = (logs, todayKey, lookbackDays = 7) => {
  const t = new Date(todayKey + 'T00:00:00');
  for (let i = 1; i <= lookbackDays; i++) {
    const d = new Date(t);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const log = logs[key];
    if (log && (log.calories || log.activeCal)) {
      return { key, log, daysAgo: i };
    }
  }
  return null;
};

const YesterdayTodayCard = ({ logs, todayTargetDeficit, bmr }) => {
  const t = today();
  const recent = findLastDayWithData(logs, t);
  const yDeficit = recent ? calcActualDeficit(recent.log, bmr) : 0;
  const hitTarget = recent && yDeficit >= todayTargetDeficit;
  const label = recent
    ? (recent.daysAgo === 1 ? 'Ayer' : `Hace ${recent.daysAgo}d (${recent.key.slice(5)})`)
    : 'Ayer';

  return (
    <Card>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-400">{label}</div>
          {recent ? (
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold tabular-nums">{fmtDelta(yDeficit)}</span>
              <span className="text-xs text-gray-400">cal</span>
              <span className={`ml-auto text-lg ${hitTarget ? 'text-emerald-500' : 'text-gray-300'}`}>
                {hitTarget ? '✓' : '○'}
              </span>
            </div>
          ) : (
            <div className="text-sm text-gray-400 mt-2">Sin data 7d</div>
          )}
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-400">Hoy target</div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold tabular-nums text-emerald-600">−{Math.round(todayTargetDeficit)}</span>
            <span className="text-xs text-gray-400">cal</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

// ----------------------------------------------------------------------------
// Phase progress
// ----------------------------------------------------------------------------
const PhaseCard = ({ phase, prog }) => (
  <Card>
    <div className="flex justify-between items-start mb-3">
      <div>
        <div className="text-[10px] uppercase tracking-wider text-gray-400">
          Fase {phase.id} — {phase.name}
        </div>
        <div className="text-sm text-gray-700 font-medium mt-0.5">
          Día {prog.daysElapsed} de {prog.totalDays}
        </div>
      </div>
      <div className="text-right">
        <div className="text-[10px] text-gray-400">Necesitas/día</div>
        <div className="text-base font-bold tabular-nums text-emerald-700">
          −{Math.abs(prog.requiredDailyDeficit)} cal
        </div>
      </div>
    </div>
    <div className="space-y-2.5">
      <ProgressBar value={prog.timePct} color="#9ca3af" label="Tiempo" />
      <ProgressBar value={prog.deficitPct} color="#10b981" label="Déficit acumulado" />
    </div>
  </Card>
);

// ----------------------------------------------------------------------------
// 15-month program progress
// ----------------------------------------------------------------------------
const ProgramCard = ({ logs, settings, bmr }) => {
  const prog = getProgramProgress(today(), logs, settings, bmr);
  return (
    <Card>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-400">Programa 15 meses</div>
          <div className="text-sm text-gray-700 font-medium mt-0.5">
            Día {prog.daysElapsed} de {prog.totalDays}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-gray-400">Restantes</div>
          <div className="text-base font-bold tabular-nums text-gray-900">
            {Math.max(prog.lbsRemaining, 0).toFixed(1)} lbs
          </div>
          <div className="text-[10px] text-gray-400">{prog.daysRemaining} días</div>
        </div>
      </div>
      <div className="space-y-2.5">
        <ProgressBar value={prog.timePct} color="#9ca3af" label="Tiempo" />
        <ProgressBar value={prog.deficitPct} color="#8b5cf6" label="Déficit acumulado" />
      </div>
    </Card>
  );
};

// ----------------------------------------------------------------------------
// Public composite
//
// `todayTargetDeficit` prop is kept for backward compat but is OVERRIDDEN by
// the phase's dynamic `requiredDailyDeficit` (Bug 3 fix). The static window
// midpoint doesn't reflect what the user actually needs to hit per day given
// what's already been accumulated vs the phase's lbs-to-lose target.
// ----------------------------------------------------------------------------
export const DayProgressCards = ({ logs, settings, phase, bmr }) => {
  const phaseProg = getPhaseProgress(phase, today(), logs, bmr, settings);
  // Use the dynamic required deficit as today's target; clamp ≥ 0 so we don't
  // suggest a "surplus target" if the user is already ahead of schedule.
  const todayTarget = Math.max(0, phaseProg.requiredDailyDeficit);
  return (
    <>
      <YesterdayTodayCard logs={logs} todayTargetDeficit={todayTarget} bmr={bmr} />
      <PhaseCard phase={phase} prog={phaseProg} />
      <ProgramCard logs={logs} settings={settings} bmr={bmr} />
    </>
  );
};
