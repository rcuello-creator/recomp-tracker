import React from 'react';
import { Card, NumInput, Toggle } from '../lib/ui';
import { InjuryBanner } from './InjuryBanner';
import { DailyRings } from './DailyRings';
import { DayProgressCards } from './DayProgressCards';
import { WeekProgressCard } from './WeekProgressCard';
import { today, formatDateLong, formatTime } from '../lib/helpers';
import { getDayType, getRingTargets, calcActualDeficit, getActiveCalTarget, getStepsTarget, deficitRingColor } from '../lib/deficit';
import { BMR_KATCH_MCARDLE } from '../data/constants';

// ----------------------------------------------------------------------------
// Home — default landing view. Apple-Health-style rings + Phase/Program cards.
// Replaces the legacy TodayView. Macro entry happens via FAB → QuickAddModal.
// ----------------------------------------------------------------------------

const DAY_TYPE = {
  LIFT:     { label: 'DÍA LIFT',     color: '#10b981' },
  REFEED:   { label: 'DÍA REFEED',   color: '#AF52DE' },
  STANDARD: { label: 'DÍA ESTÁNDAR', color: '#6b7280' },
};

const RING_COLOR = {
  deficit: '#FF3B30',
  protein: '#34C759',
  carbs:   '#007AFF',
  fat:     '#FF9500',
  volume:  '#AF52DE',
};

export const Home = ({ logs, saveLog, settings, updateSetting, lifts }) => {
  const date = today();
  const log = logs[date] || {};
  const dayType = getDayType(date, lifts, settings, logs);
  const targets = getRingTargets(date, dayType, settings);
  const bmr = Number(settings?.bmr_katch) || BMR_KATCH_MCARDLE;

  const actualDeficit = calcActualDeficit(log, bmr);
  const liftToday = lifts.find(l => l.date === date);

  const rings = [
    { key: 'deficit', value: Math.max(actualDeficit, 0), target: targets.deficit, color: deficitRingColor(actualDeficit, targets.deficit, settings), label: 'Déficit', unit: 'cal' },
    { key: 'protein', value: log.protein || 0,           target: targets.protein, color: RING_COLOR.protein, label: 'Proteína', unit: 'g' },
    { key: 'carbs',   value: log.carbs   || 0,           target: targets.carbs,   color: RING_COLOR.carbs,   label: 'Carbos',   unit: 'g' },
    { key: 'fat',     value: log.fat     || 0,           target: targets.fat,     color: RING_COLOR.fat,     label: 'Grasa',    unit: 'g' },
  ];
  if (dayType === 'LIFT') {
    rings.push({
      key: 'volume',
      value: liftToday?.volume || log.liftVolume || 0,
      target: 5000,
      color: RING_COLOR.volume,
      label: 'Volumen',
      unit: 'lbs',
    });
  }

  const update = (field, val) => saveLog(date, { ...log, [field]: val });
  const meta = DAY_TYPE[dayType];

  return (
    <div className="space-y-4">
      <div className="px-1 text-center">
        <div className="text-xs text-gray-400 uppercase tracking-wider">{formatDateLong(date)}</div>
        <div className="inline-flex items-center gap-2 mt-2">
          <span className="text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full"
            style={{ color: meta.color, backgroundColor: `${meta.color}1a` }}>
            {meta.label}
          </span>
          <span className="text-[10px] font-medium text-gray-500">FASE {targets.phase.id} · {targets.phase.name}</span>
        </div>
      </div>

      <InjuryBanner
        injuryActive={settings.injuryActive}
        physioBooked={settings.physioBooked}
        onUpdatePhysio={(v) => updateSetting('physioBooked', v)}
        onCloseInjury={() => updateSetting('injuryActive', false)}
      />

      <Card>
        <DailyRings rings={rings} />
        {formatTime(log.updatedAt) && (
          <div className="text-[10px] text-gray-400 text-center mt-3">
            Última actualización: {formatTime(log.updatedAt)}
          </div>
        )}
      </Card>

      <DayProgressCards logs={logs} settings={settings} phase={targets.phase} bmr={bmr} />

      <WeekProgressCard logs={logs} lifts={lifts} settings={settings} />

      <Card>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Training & recovery</div>

        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <div className="text-sm font-medium text-gray-700">Lift hecho</div>
            <div className="text-xs text-gray-400">{settings.injuryActive ? '⚠️ Auto-regulado' : 'Target: 4/sem'}</div>
          </div>
          <button onClick={() => update('liftDone', !log.liftDone)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${log.liftDone ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
            {log.liftDone ? '✓ Done' : 'Mark'}
          </button>
        </div>

        {log.liftDone && (
          <NumInput label="Volumen lift" value={log.liftVolume} onChange={(v) => update('liftVolume', v)} unit="lbs" step={100} />
        )}
        <NumInput
          label="Active cal"
          value={log.activeCal}
          onChange={(v) => update('activeCal', v)}
          unit="cal"
          target={`${getActiveCalTarget(dayType, settings)}+`}
        />
        <Toggle label="Creatina 5g" sublabel="Re-saturación" checked={!!log.creatine} onChange={(v) => update('creatine', v)} />
        <NumInput label="Sueño" value={log.sleep} onChange={(v) => update('sleep', v)} unit="hrs" target="7+" step={0.5} />
        <NumInput
          label="Pasos"
          value={log.steps}
          onChange={(v) => update('steps', v)}
          unit=""
          target={`${(getStepsTarget(dayType, settings) / 1000).toFixed(0)}K+`}
          step={500}
        />

        <div className="flex items-center justify-between py-3 last:border-0">
          <div>
            <div className="text-sm font-medium text-gray-700">Alcohol</div>
            <div className="text-xs text-gray-400">Max 6/sem</div>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map(n => (
              <button key={n} onClick={() => update('alcohol', n)}
                className={`w-9 h-9 rounded-full text-sm font-medium transition ${log.alcohol === n ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {n === 4 ? '4+' : n}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Notas</div>
        <textarea value={log.notes || ''} onChange={(e) => update('notes', e.target.value)}
          placeholder="¿Algo relevante hoy? Energy, cravings, dolor…"
          className="w-full text-sm bg-gray-50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 border-0 resize-none" rows="2" />
      </Card>

      <div className="text-center text-[10px] text-gray-400 pt-2 pb-1">
        Macros se loguean con el botón <span className="font-mono text-base">+</span> abajo a la derecha
      </div>
    </div>
  );
};
