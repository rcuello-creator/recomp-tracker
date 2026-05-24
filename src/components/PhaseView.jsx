import React from 'react';
import { Card } from '../lib/ui';
import { today, formatDate, daysBetween, getCurrentPhase } from '../lib/helpers';
import { PHASES } from '../data/phases';
import { MILESTONES, TARGET_FINAL } from '../data/constants';

export const PhaseView = () => {
  const date = today();
  const phase = getCurrentPhase(date);
  const phaseTotal = daysBetween(phase.startDate, phase.endDate);
  const phaseDone = Math.max(0, daysBetween(phase.startDate, date));
  const phasePct = Math.max(0, Math.min(100, (phaseDone / phaseTotal) * 100));
  const planTotal = daysBetween('2026-05-18', TARGET_FINAL.date);
  const planDone = Math.max(0, daysBetween('2026-05-18', date));
  const planPct = Math.max(0, Math.min(100, (planDone / planTotal) * 100));

  return (
    <div className="space-y-4">
      <div className="px-1">
        <div className="text-xs text-gray-400 uppercase tracking-wider">Plan progress</div>
        <h1 className="text-3xl font-bold text-gray-900 mt-1">Phase</h1>
      </div>
      
      <Card>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Current Phase</div>
        <div className="text-2xl font-bold text-gray-900">Fase {phase.id} · {phase.name}</div>
        <div className="text-sm text-gray-500 mt-1">{phase.description}</div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>{formatDate(phase.startDate)}</span>
            <span className="font-semibold text-gray-900">{Math.round(phasePct)}%</span>
            <span>{formatDate(phase.endDate)}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${phasePct}%` }} />
          </div>
          <div className="text-xs text-gray-400 mt-2 text-center">{phaseDone} de {phaseTotal} días</div>
        </div>
        <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-2 gap-y-2">
          <div className="text-sm text-gray-600">Calorías</div>
          <div className="text-sm font-semibold tabular-nums text-right">{phase.calories}</div>
          <div className="text-sm text-gray-600">Proteína</div>
          <div className="text-sm font-semibold tabular-nums text-right">{phase.protein}g</div>
          <div className="text-sm text-gray-600">Carbs</div>
          <div className="text-sm font-semibold tabular-nums text-right">{phase.carbs}g</div>
          <div className="text-sm text-gray-600">Grasa techo</div>
          <div className="text-sm font-semibold tabular-nums text-right">{phase.fat}g</div>
          <div className="text-sm text-gray-600">Refeed sábado</div>
          <div className="text-sm font-semibold tabular-nums text-right">{phase.refeedCal}</div>
        </div>
      </Card>
      
      <Card>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">15-month plan</div>
        <div className="text-2xl font-bold text-gray-900">Target: 180 lbs / 12% BF</div>
        <div className="text-sm text-gray-500 mt-1">{formatDate(TARGET_FINAL.date)} · {Math.max(0, daysBetween(date, TARGET_FINAL.date))} días restantes</div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>May 2026</span>
            <span className="font-semibold text-gray-900">{Math.round(planPct)}%</span>
            <span>Aug 2027</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${planPct}%` }} />
          </div>
        </div>
      </Card>
      
      <Card>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Phases</div>
        <div className="space-y-3">
          {PHASES.map(p => {
            const isCurrent = p.id === phase.id;
            const isPast = date > p.endDate;
            return (
              <div key={p.id} className={`flex gap-3 p-3 rounded-xl ${isCurrent ? 'bg-blue-50' : isPast ? 'bg-gray-50 opacity-60' : 'bg-white border border-gray-100'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isCurrent ? 'bg-blue-500 text-white' : isPast ? 'bg-gray-300 text-white' : 'bg-gray-100 text-gray-500'}`}>{p.id}</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-900">{p.name}</div>
                  <div className="text-xs text-gray-500">{formatDate(p.startDate)} – {formatDate(p.endDate)}</div>
                  <div className="text-xs text-gray-600 mt-1">{p.calories} cal · {p.protein}g prot · {p.fat}g fat</div>
                </div>
                {isCurrent && <div className="text-xs text-blue-600 font-semibold">Now</div>}
              </div>
            );
          })}
        </div>
      </Card>
      
      <Card>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Milestones</div>
        <div className="space-y-3">
          {MILESTONES.map((m, i) => {
            const isPast = date > m.date;
            const isNext = !isPast && (i === 0 || date > MILESTONES[i-1].date);
            return (
              <div key={m.date} className="flex items-start gap-3">
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${isPast ? 'bg-emerald-500' : isNext ? 'bg-blue-500 ring-4 ring-blue-100' : 'bg-gray-300'}`} />
                <div className="flex-1">
                  <div className="text-xs text-gray-400">{formatDate(m.date)}</div>
                  <div className="text-sm font-semibold text-gray-900">{m.label}</div>
                  <div className="text-xs text-gray-500">{m.weight} lbs · {m.bf}% BF · {m.lean} lean</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
