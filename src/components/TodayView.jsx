import React, { useState, useEffect } from 'react';
import { Card, Ring, NumInput, Toggle } from '../lib/ui';
import { InjuryBanner } from './InjuryBanner';
import { EnergyBalanceCard } from './EnergyBalanceCard';
import { today, formatDateLong, getCurrentPhase, getTodayTargets, calculateScore, scoreColor } from '../lib/helpers';

export const TodayView = ({ logs, saveLog, settings, updateSetting }) => {
  const date = today();
  const todayLog = logs[date] || {};
  const travelMode = settings.travelMode;
  const targets = getTodayTargets(travelMode, date);
  const phase = getCurrentPhase(date);
  
  const [local, setLocal] = useState({
    calories: todayLog.calories, protein: todayLog.protein, carbs: todayLog.carbs, fat: todayLog.fat,
    activeCal: todayLog.activeCal,
    liftDone: todayLog.liftDone || false, liftVolume: todayLog.liftVolume,
    sleep: todayLog.sleep, alcohol: todayLog.alcohol || 0, steps: todayLog.steps,
    creatine: todayLog.creatine || false, notes: todayLog.notes || '',
    mealsLog: todayLog.mealsLog || [],
  });

  useEffect(() => {
    setLocal({
      calories: todayLog.calories, protein: todayLog.protein, carbs: todayLog.carbs, fat: todayLog.fat,
      activeCal: todayLog.activeCal,
      liftDone: todayLog.liftDone || false, liftVolume: todayLog.liftVolume,
      sleep: todayLog.sleep, alcohol: todayLog.alcohol || 0, steps: todayLog.steps,
      creatine: todayLog.creatine || false, notes: todayLog.notes || '',
      mealsLog: todayLog.mealsLog || [],
    });
  }, [date, todayLog.calories, todayLog.protein, todayLog.carbs, todayLog.fat]);

  const update = (field, val) => {
    const next = { ...local, [field]: val };
    setLocal(next);
    const score = calculateScore(next, targets);
    saveLog(date, { ...next, adherenceScore: score });
  };

  const score = calculateScore(local, targets);
  const proteinStatus = !local.protein ? 'neutral' : local.protein >= targets.protein ? 'good' : local.protein >= targets.protein - 30 ? 'warn' : 'bad';
  const fatStatus = !local.fat ? 'neutral' : local.fat <= targets.fat ? 'good' : local.fat <= targets.fat + 15 ? 'warn' : 'bad';

  return (
    <div className="space-y-4">
      <div className="px-1">
        <div className="text-xs text-gray-400 uppercase tracking-wider">{formatDateLong(date)}</div>
        <h1 className="text-3xl font-bold text-gray-900 mt-1">Today</h1>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">Fase {phase.id} · {phase.name}</span>
          {targets.mode === 'refeed' && <span className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-700 font-medium">Refeed</span>}
          {targets.mode === 'travel' && <span className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">Travel</span>}
        </div>
      </div>

      <InjuryBanner
        injuryActive={settings.injuryActive}
        physioBooked={settings.physioBooked}
        onUpdatePhysio={(v) => updateSetting('physioBooked', v)}
        onCloseInjury={() => updateSetting('injuryActive', false)}
      />

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Adherence Score</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-5xl font-bold tabular-nums" style={{ color: scoreColor(score) }}>{score}</span>
              <span className="text-lg text-gray-400">/100</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {score >= 85 ? 'Day on point' : score >= 70 ? 'Workable' : score >= 50 ? 'Recoverable' : 'Reset mindset'}
            </div>
          </div>
          <div className="relative" style={{ width: 90, height: 90 }}>
            <svg width="90" height="90" className="transform -rotate-90">
              <circle cx="45" cy="45" r="38" stroke="#f0f0f3" strokeWidth="6" fill="none" />
              <circle cx="45" cy="45" r="38" stroke={scoreColor(score)} strokeWidth="6" fill="none"
                strokeDasharray={239} strokeDashoffset={239 - (score / 100) * 239} strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">Macros</div>
            <div className="text-lg font-semibold text-gray-900 mt-1">Today's targets</div>
          </div>
          <button onClick={() => updateSetting('travelMode', !travelMode)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium ${travelMode ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
            {travelMode ? '✈ Travel ON' : 'Travel'}
          </button>
        </div>
        <div className="flex justify-around items-end">
          <Ring value={local.calories} max={targets.calories} color="#3b82f6" label="Cal" />
          <Ring value={local.protein} max={targets.protein} color="#10b981" label="Prot" sublabel="g" />
          <Ring value={local.fat} max={targets.fat} color="#ef4444" label="Fat" sublabel="g techo" />
          <Ring value={local.carbs} max={targets.carbs} color="#f59e0b" label="Carb" sublabel="g" />
        </div>
      </Card>

      <Card>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Food log</div>
        <NumInput label="Calorías" value={local.calories} onChange={(v) => update('calories', v)} unit="cal" target={targets.calories} />
        <NumInput label="Proteína" value={local.protein} onChange={(v) => update('protein', v)} unit="g" target={targets.protein} />
        <NumInput label="Grasa" value={local.fat} onChange={(v) => update('fat', v)} unit="g" target={`<${targets.fat}`} />
        <NumInput label="Carbs" value={local.carbs} onChange={(v) => update('carbs', v)} unit="g" target={targets.carbs} />
        <div className="text-[10px] text-gray-400 mt-2 italic">Tip: usa el tab Meals para sumar con un tap</div>
      </Card>

      <EnergyBalanceCard 
        calories={local.calories}
        activeCal={local.activeCal}
        onUpdateActive={(v) => update('activeCal', v)}
      />

      <Card>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Training & Recovery</div>
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div>
            <div className="text-sm font-medium text-gray-700">Lift hecho</div>
            <div className="text-xs text-gray-400">{settings.injuryActive ? '⚠️ Solo modificados' : 'Target: 4/semana'}</div>
          </div>
          <button onClick={() => update('liftDone', !local.liftDone)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${local.liftDone ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
            {local.liftDone ? '✓ Done' : 'Mark'}
          </button>
        </div>
        {local.liftDone && (
          <NumInput label="Volumen" value={local.liftVolume} onChange={(v) => update('liftVolume', v)} unit="lbs" step={100} />
        )}
        <Toggle label="Creatina 5g" sublabel="Re-saturando post-CKO2" checked={local.creatine} onChange={(v) => update('creatine', v)} />
        <NumInput label="Sueño" value={local.sleep} onChange={(v) => update('sleep', v)} unit="hrs" target="7+" step={0.5} />
        <NumInput label="Pasos" value={local.steps} onChange={(v) => update('steps', v)} unit="" target="10K" step={500} />
        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
          <div>
            <div className="text-sm font-medium text-gray-700">Alcohol</div>
            <div className="text-xs text-gray-400">Max 6/semana</div>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map(n => (
              <button key={n} onClick={() => update('alcohol', n)}
                className={`w-9 h-9 rounded-full text-sm font-medium transition ${local.alcohol === n ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {n === 4 ? '4+' : n}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {(proteinStatus === 'bad' || fatStatus === 'bad') && (
        <Card className="bg-rose-50 border border-rose-100">
          <div className="text-xs text-rose-700 uppercase tracking-wider font-semibold mb-2">Action needed</div>
          {proteinStatus === 'bad' && (
            <div className="text-sm text-rose-900 mb-1">
              Te faltan {Math.max(0, targets.protein - (local.protein || 0))}g proteína. Tab Meals → Premier shake.
            </div>
          )}
          {fatStatus === 'bad' && (
            <div className="text-sm text-rose-900">
              Grasa {Math.round((local.fat || 0) - targets.fat)}g sobre techo. Lean protein + veg only.
            </div>
          )}
        </Card>
      )}

      <Card>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Notes</div>
        <textarea value={local.notes} onChange={(e) => update('notes', e.target.value)}
          placeholder="¿Algo relevante hoy? Energy, cravings, dolor..."
          className="w-full text-sm bg-gray-50 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 border-0 resize-none" rows="2" />
      </Card>
    </div>
  );
};
