import React, { useState } from 'react';
import { Card, NumInput } from '../lib/ui';
import { calculateTDEE, calculateDeficit, deficitColor, deficitLabel } from '../lib/helpers';
import { BMR_KATCH_MCARDLE, TEF_PERCENT } from '../data/constants';

export const EnergyBalanceCard = ({ calories, activeCal, onUpdateActive }) => {
  const [expanded, setExpanded] = useState(false);
  const tdee = calculateTDEE(activeCal, calories);
  const deficit = calculateDeficit(calories, activeCal);
  const hasData = (calories && activeCal);
  const tef = Math.round((calories || 0) * TEF_PERCENT);
  const dColor = deficitColor(deficit);
  
  return (
    <Card>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wider">Energy Balance</div>
          <div className="text-lg font-semibold text-gray-900 mt-1">Déficit calórico</div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-blue-600 font-medium">
          {expanded ? 'Ocultar' : 'Ver cálculo'}
        </button>
      </div>
      
      <NumInput label="Active cal (Apple Watch)" value={activeCal} onChange={onUpdateActive} unit="cal" target="500+" step={10} />
      
      {hasData && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-sm text-gray-600">Déficit hoy</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums" style={{ color: dColor }}>
                {deficit > 0 ? '+' : ''}{deficit}
              </span>
              <span className="text-xs text-gray-400">cal</span>
            </div>
          </div>
          <div className="text-xs font-medium" style={{ color: dColor }}>{deficitLabel(deficit)}</div>
          
          {deficit < -1000 && (
            <div className="text-xs text-rose-700 mt-2 leading-relaxed">
              ⚠️ Déficit extremo. Sostenido = riesgo de pérdida de lean. Considerá refeed mañana.
            </div>
          )}
        </div>
      )}
      
      {expanded && hasData && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">Cálculo</div>
          <div className="text-xs space-y-1.5">
            <div className="flex justify-between"><span className="text-gray-600">BMR (DEXA)</span><span className="font-medium tabular-nums">+{BMR_KATCH_MCARDLE}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Active cal (Watch)</span><span className="font-medium tabular-nums">+{activeCal}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">TEF (10% × {calories})</span><span className="font-medium tabular-nums">+{tef}</span></div>
            <div className="flex justify-between pt-1.5 border-t border-gray-100"><span className="text-gray-700 font-medium">TDEE total</span><span className="font-semibold tabular-nums">{tdee}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Calorías consumidas</span><span className="font-medium tabular-nums">−{calories}</span></div>
            <div className="flex justify-between pt-1.5 border-t border-gray-100"><span className="text-gray-700 font-medium">Balance</span><span className="font-semibold tabular-nums" style={{ color: dColor }}>{deficit > 0 ? '+' : ''}{deficit} cal</span></div>
          </div>
          <div className="text-[10px] text-gray-400 mt-2 leading-relaxed">
            Nota: Apple Watch "Total Energy" sobreestima ~15-25%. Este cálculo usa tu BMR real DEXA (lean 147.8 lbs).
          </div>
        </div>
      )}
    </Card>
  );
};
