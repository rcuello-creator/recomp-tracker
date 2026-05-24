import React, { useState } from 'react';
import { Card } from '../lib/ui';

export const InjuryBanner = ({ injuryActive, physioBooked, onUpdatePhysio, onCloseInjury }) => {
  const [expanded, setExpanded] = useState(false);
  if (!injuryActive) return null;
  
  return (
    <Card className="bg-amber-50 border border-amber-200">
      <div className="flex items-start gap-3">
        <div className="text-2xl">⚠️</div>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-wider font-semibold text-amber-800">Lesión activa</div>
          <div className="text-sm font-semibold text-amber-900 mt-0.5">Espalda baja — strain RDL 13 May</div>
          <div className="text-xs text-amber-800 mt-1">{physioBooked ? 'Fisio agendado ✓' : 'Fisio sin agendar'}</div>
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-amber-700 font-medium mt-2 underline">
            {expanded ? 'Ocultar protocolo' : 'Ver protocolo'}
          </button>
          {expanded && (
            <div className="mt-3 space-y-2 text-xs text-amber-900">
              <div><strong>Permitidos:</strong> Leg press, leg ext, leg curl, upper sin overhead pesado</div>
              <div><strong>Prohibidos:</strong> RDL, deadlift, squat libre, hip thrust pesado</div>
              <div><strong>Hasta:</strong> 0 dolor 48h + clearance fisio</div>
              <div><strong>Daily:</strong> McGill Big 3 · hip mobility</div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-amber-200">
                <button onClick={() => onUpdatePhysio(!physioBooked)}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium ${physioBooked ? 'bg-emerald-500 text-white' : 'bg-amber-200 text-amber-900'}`}>
                  {physioBooked ? '✓ Fisio agendado' : 'Marcar fisio agendado'}
                </button>
                <button onClick={onCloseInjury}
                  className="px-3 py-2 rounded-lg text-xs font-medium bg-white border border-amber-300 text-amber-800">
                  Cerrar lesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
