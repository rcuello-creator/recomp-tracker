import React, { useEffect, useMemo, useRef, useState } from 'react';
import { today } from '../lib/helpers';

// ----------------------------------------------------------------------------
// Quick Add — slide-up modal for sub-30s manual meal entry
// ----------------------------------------------------------------------------
// Reuses sync.saveLog (upsert by date); accumulates onto today's log the same
// way MealsView.addMeal does. No new Apps Script action needed.
// ----------------------------------------------------------------------------

const NumField = ({ label, value, onChange, unit, autoFocus, refEl }) => (
  <label className="block">
    <div className="text-[11px] text-gray-500 mb-1 uppercase tracking-wide">{label}</div>
    <div className="flex items-center bg-gray-50 rounded-xl px-3 py-2.5">
      <input ref={refEl} type="number" inputMode="decimal"
        value={value} onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus} placeholder="0"
        className="flex-1 bg-transparent text-lg font-semibold tabular-nums focus:outline-none w-full"
      />
      <span className="text-xs text-gray-400 ml-2">{unit}</span>
    </div>
  </label>
);

export const QuickAddModal = ({ open, onClose, logs, saveLog }) => {
  const [name, setName] = useState('');
  const [cal, setCal] = useState('');
  const [prot, setProt] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const calRef = useRef(null);

  useEffect(() => {
    if (open) {
      setName(''); setCal(''); setProt(''); setCarbs(''); setFat('');
      // tiny delay so the field exists when we focus
      setTimeout(() => calRef.current?.focus(), 50);
    }
  }, [open]);

  const calN = parseFloat(cal) || 0;
  const protN = parseFloat(prot) || 0;
  const carbN = parseFloat(carbs) || 0;
  const fatN = parseFloat(fat) || 0;

  const macroCheck = useMemo(() => {
    if (!calN) return null;
    if (!protN && !carbN && !fatN) return null;
    const computed = protN * 4 + carbN * 4 + fatN * 9;
    const diff = Math.abs(calN - computed) / calN;
    if (diff > 0.10) {
      return { msg: `Macros suman ${Math.round(computed)} cal (declaraste ${calN}). Diferencia ${Math.round(diff * 100)}%.`, severity: 'warn' };
    }
    return { msg: `Macros consistentes (${Math.round(computed)} cal calculado).`, severity: 'ok' };
  }, [calN, protN, carbN, fatN]);

  const canSave = calN > 0;

  const handleSave = () => {
    if (!canSave) return;
    const date = today();
    const current = logs[date] || {};
    const entry = {
      id: `quick-${Date.now()}`,
      name: name.trim() || 'Comida',
      emoji: '🍽',
      time: new Date().toISOString(),
      cal: calN, prot: protN, carbs: carbN, fat: fatN,
    };
    saveLog(date, {
      ...current,
      calories: (current.calories || 0) + calN,
      protein: (current.protein || 0) + protN,
      carbs: (current.carbs || 0) + carbN,
      fat: (current.fat || 0) + fatN,
      mealsLog: [...(current.mealsLog || []), entry],
    });
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-md bg-white rounded-t-3xl p-6 pb-8 safe-bottom animate-slide-up">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
        <div className="flex items-baseline justify-between mb-4">
          <div className="text-lg font-semibold">Agregar comida</div>
          <button onClick={onClose} className="text-sm text-gray-500">Cancelar</button>
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre (opcional, ej. Almuerzo)"
          className="w-full text-sm bg-gray-50 rounded-xl px-3 py-2.5 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <div className="grid grid-cols-2 gap-2 mb-3">
          <NumField label="Calorías" value={cal} onChange={setCal} unit="cal" refEl={calRef} />
          <NumField label="Proteína" value={prot} onChange={setProt} unit="g" />
          <NumField label="Carbos" value={carbs} onChange={setCarbs} unit="g" />
          <NumField label="Grasa" value={fat} onChange={setFat} unit="g" />
        </div>

        {macroCheck && (
          <div className={`text-xs rounded-lg px-3 py-2 mb-3 ${macroCheck.severity === 'warn' ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'}`}>
            {macroCheck.severity === 'warn' ? '⚠️ ' : '✓ '}{macroCheck.msg}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`w-full py-3.5 rounded-2xl font-semibold transition ${canSave ? 'bg-blue-500 text-white active:scale-[0.99]' : 'bg-gray-200 text-gray-400'}`}
        >
          Guardar
        </button>
      </div>
    </div>
  );
};
