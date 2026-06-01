import React from 'react';
import { Card } from '../lib/ui';
import { today } from '../lib/helpers';
import { getDayType, getRingTargets } from '../lib/deficit';

// ----------------------------------------------------------------------------
// Week Progress — Mon→Sun rollup of execution against the protocol
// ----------------------------------------------------------------------------
// Metrics:
//   1. Lifts done vs target (settings.lifts_per_week_target, default 4)
//   2. Days "on target" macros: |cal - target| <= 100 AND protein >= target
//   3. Days hitting step floor (target depends on lift vs standard via settings)
//   4. Refeed planned this week (any saturday-or-refeed_schedule day exists)
// ----------------------------------------------------------------------------

// Returns ['YYYY-MM-DD', 'YYYY-MM-DD'] for [monday, sunday] of the week
// containing `date`. Treats Monday as the first day of the week.
const weekRange = (date) => {
  const d = new Date(date + 'T00:00:00');
  const daysFromMon = (d.getDay() + 6) % 7;
  const mon = new Date(d);
  mon.setDate(d.getDate() - daysFromMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const fmt = (x) => x.toISOString().split('T')[0];
  return [fmt(mon), fmt(sun)];
};

// All YYYY-MM-DD strings between start and end inclusive.
const datesBetween = (startKey, endKey) => {
  const out = [];
  const cur = new Date(startKey + 'T00:00:00');
  const end = new Date(endKey + 'T00:00:00');
  while (cur <= end) {
    out.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return out;
};

const Indicator = ({ status }) => {
  const color = status === 'good' ? '#10b981' : status === 'warn' ? '#f59e0b' : '#9ca3af';
  return <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: color }} />;
};

const Metric = ({ label, value, status, sublabel }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
    <div className="flex items-center gap-2">
      <Indicator status={status} />
      <div>
        <div className="text-sm text-gray-700">{label}</div>
        {sublabel && <div className="text-[10px] text-gray-400 mt-0.5">{sublabel}</div>}
      </div>
    </div>
    <div className="text-base font-semibold tabular-nums text-gray-900">{value}</div>
  </div>
);

export const WeekProgressCard = ({ logs, lifts, settings }) => {
  const t = today();
  const [monKey, sunKey] = weekRange(t);
  const days = datesBetween(monKey, sunKey);
  const targetLifts = Number(settings.lifts_per_week_target) || 4;
  const stepsNoLift = Number(settings.steps_no_lift) || 10000;
  const stepsLiftDay = Number(settings.steps_lift_day) || 7000;
  const refeedDay = settings.refeed_schedule || settings.refeed_day || 'Saturday';

  // Lifts completed this week (use Lifts tab, not DailyLogs.liftDone — Lifts
  // tab is the source of truth; DailyLogs.liftDone is just a self-report flag)
  const liftDatesThisWeek = new Set(
    lifts
      .filter(l => l.date >= monKey && l.date <= sunKey && l.volume)
      .map(l => l.date)
  );
  const liftsCompleted = liftDatesThisWeek.size;

  // Days on macro target — only count days that have logged calories (skip blanks)
  let daysOnTarget = 0;
  let stepsDaysComplete = 0;
  let daysWithData = 0;

  days.forEach(d => {
    const log = logs[d];
    if (!log) return;
    const hasIntake = log.calories;
    if (hasIntake) {
      daysWithData++;
      const dayType = getDayType(d, lifts, settings, logs);
      const targets = getRingTargets(d, dayType, settings);
      const calOk = Math.abs(log.calories - targets.calories) <= 100;
      const protOk = (log.protein || 0) >= targets.protein - 10; // 10g grace
      if (calOk && protOk) daysOnTarget++;
    }
    if (log.steps != null && log.steps !== '') {
      const dayType = getDayType(d, lifts, settings, logs);
      const floor = dayType === 'LIFT' ? stepsLiftDay : stepsNoLift;
      if (log.steps >= floor) stepsDaysComplete++;
    }
  });

  // Refeed planned — does this week contain the refeed weekday?
  const refeedPlanned = days.some(d => {
    const dow = new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
    return dow === refeedDay;
  });

  // Status colors
  const liftsStatus  = liftsCompleted >= targetLifts ? 'good' : liftsCompleted >= targetLifts - 1 ? 'warn' : 'neutral';
  const macrosStatus = daysOnTarget >= 5 ? 'good' : daysOnTarget >= 3 ? 'warn' : 'neutral';
  const stepsStatus  = stepsDaysComplete >= 6 ? 'good' : stepsDaysComplete >= 4 ? 'warn' : 'neutral';

  const monLabel = new Date(monKey + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const sunLabel = new Date(sunKey + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  return (
    <Card>
      <div className="text-[10px] uppercase tracking-wider text-gray-400">Esta semana</div>
      <div className="text-sm text-gray-700 font-medium mt-0.5 mb-3">Lun {monLabel} – Dom {sunLabel}</div>

      <Metric
        label="Lifts"
        value={`${liftsCompleted}/${targetLifts}`}
        status={liftsStatus}
        sublabel={liftsCompleted >= targetLifts ? '✓ target alcanzado' : `${targetLifts - liftsCompleted} pendiente${(targetLifts - liftsCompleted) === 1 ? '' : 's'}`}
      />
      <Metric
        label="Días en target macros"
        value={`${daysOnTarget}/${daysWithData || 7}`}
        status={macrosStatus}
        sublabel="±100 cal y prot ≥ target-10g"
      />
      <Metric
        label="Pasos cumplidos"
        value={`${stepsDaysComplete}/7`}
        status={stepsStatus}
        sublabel={`${stepsNoLift.toLocaleString()} no-lift · ${stepsLiftDay.toLocaleString()} lift`}
      />
      <Metric
        label="Refeed planificado"
        value={refeedPlanned ? '✓' : '○'}
        status={refeedPlanned ? 'good' : 'neutral'}
        sublabel={`Día: ${refeedDay}`}
      />
    </Card>
  );
};
