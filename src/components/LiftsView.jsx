import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, NumInput } from '../lib/ui';
import { today, formatDate, daysBetween } from '../lib/helpers';

export const LiftsView = ({ lifts, saveLift, injuryActive }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newLift, setNewLift] = useState({
    date: today(), coach: 'Dylon', session: '', type: 'Legs',
    volume: '', duration: '', avgBpm: '', calories: '', notes: '', flag: null,
  });

  const sortedLifts = [...lifts].sort((a, b) => b.date.localeCompare(a.date));
  const chartData = [...lifts].sort((a, b) => a.date.localeCompare(b.date)).map(l => ({
    date: formatDate(l.date), volume: l.volume, flag: l.flag,
  }));
  
  const legsLifts = lifts.filter(l => l.type === 'Legs');
  const legsPR = legsLifts.length > 0 ? Math.max(...legsLifts.map(l => l.volume)) : 0;
  const lastLegLift = legsLifts.sort((a, b) => b.date.localeCompare(a.date))[0];
  const lastWeek = lifts.filter(l => daysBetween(l.date, today()) <= 7 && daysBetween(l.date, today()) >= 0);
  const last30 = lifts.filter(l => daysBetween(l.date, today()) <= 30 && daysBetween(l.date, today()) >= 0);

  const handleAdd = () => {
    if (!newLift.session || !newLift.volume) return;
    const lift = {
      ...newLift, volume: parseInt(newLift.volume),
      duration: newLift.duration ? parseInt(newLift.duration) : null,
      avgBpm: newLift.avgBpm ? parseInt(newLift.avgBpm) : null,
      calories: newLift.calories ? parseInt(newLift.calories) : null,
    };
    saveLift(lift);
    setShowAdd(false);
    setNewLift({ date: today(), coach: 'Dylon', session: '', type: 'Legs', volume: '', duration: '', avgBpm: '', calories: '', notes: '', flag: null });
  };

  return (
    <div className="space-y-4">
      <div className="px-1">
        <div className="text-xs text-gray-400 uppercase tracking-wider">Training history</div>
        <h1 className="text-3xl font-bold text-gray-900 mt-1">Lifts</h1>
      </div>

      {injuryActive && (
        <Card className="bg-amber-50 border border-amber-100">
          <div className="text-xs uppercase tracking-wider font-semibold text-amber-800 mb-1">⚠️ Restricciones activas</div>
          <div className="text-xs text-amber-900">No RDL, deadlift, squat libre, hip thrust pesado hasta clearance fisio + 48h sin dolor.</div>
        </Card>
      )}

      <Card>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Stats</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-400 uppercase">PR Piernas</div>
            <div className="text-2xl font-bold text-gray-900 tabular-nums">{legsPR.toLocaleString()}</div>
            <div className="text-xs text-gray-500">lbs all-time</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase">Último piernas</div>
            <div className="text-2xl font-bold text-emerald-600 tabular-nums">{lastLegLift?.volume.toLocaleString() || '–'}</div>
            <div className="text-xs text-gray-500">{lastLegLift && legsPR ? `${Math.round(lastLegLift.volume / legsPR * 100)}% del PR` : '–'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase">Última semana</div>
            <div className="text-2xl font-bold text-gray-900 tabular-nums">{lastWeek.length}</div>
            <div className="text-xs text-gray-500">lifts</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase">Últimos 30d</div>
            <div className="text-2xl font-bold text-gray-900 tabular-nums">{last30.length}</div>
            <div className="text-xs text-gray-500">lifts</div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Volume trend</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
            <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.flag === 'pr' ? '#10b981' : entry.flag === 'injury' ? '#ef4444' : '#3b82f6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-blue-500 rounded" /><span className="text-gray-600">Normal</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-emerald-500 rounded" /><span className="text-gray-600">PR</span></div>
          <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 bg-rose-500 rounded" /><span className="text-gray-600">Injury</span></div>
        </div>
      </Card>

      <Card>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Recent lifts</div>
        <div className="space-y-3">
          {sortedLifts.map((l, i) => (
            <div key={`${l.date}-${i}`} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
              <div className={`w-1 rounded-full flex-shrink-0 ${l.flag === 'pr' ? 'bg-emerald-500' : l.flag === 'injury' ? 'bg-rose-500' : 'bg-blue-500'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">
                      {l.coach} · {l.session}
                      {l.flag === 'pr' && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold">PR</span>}
                      {l.flag === 'injury' && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded font-bold">!</span>}
                    </div>
                    <div className="text-xs text-gray-500">{formatDate(l.date)} · {l.type}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-base font-bold text-gray-900 tabular-nums">{l.volume.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-500">lbs</div>
                  </div>
                </div>
                <div className="flex gap-3 text-[10px] text-gray-500 mt-1">
                  {l.duration && <span>{l.duration} min</span>}
                  {l.avgBpm && <span>{l.avgBpm} BPM</span>}
                  {l.calories && <span>{l.calories} cal</span>}
                </div>
                {l.notes && <div className="text-xs text-gray-600 mt-1 italic">{l.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {showAdd ? (
        <Card>
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Add lift</div>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Sesión</div>
              <input type="text" value={newLift.session} onChange={(e) => setNewLift({ ...newLift, session: e.target.value })}
                placeholder="ej: #35, Flex Friday"
                className="w-full text-sm bg-gray-50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 border-0" />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Tipo</div>
              <div className="grid grid-cols-4 gap-2">
                {['Legs', 'Upper', 'Mixed', 'Functional'].map(t => (
                  <button key={t} onClick={() => setNewLift({ ...newLift, type: t })}
                    className={`py-2 px-3 rounded-lg text-xs font-medium ${newLift.type === t ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>{t}</button>
                ))}
              </div>
            </div>
            <NumInput label="Volumen" value={newLift.volume} onChange={(v) => setNewLift({ ...newLift, volume: v })} unit="lbs" step={100} />
            <NumInput label="Duración" value={newLift.duration} onChange={(v) => setNewLift({ ...newLift, duration: v })} unit="min" step={1} />
            <NumInput label="BPM avg" value={newLift.avgBpm} onChange={(v) => setNewLift({ ...newLift, avgBpm: v })} unit="bpm" step={1} />
            <NumInput label="Calorías" value={newLift.calories} onChange={(v) => setNewLift({ ...newLift, calories: v })} unit="cal" step={10} />
            <div>
              <div className="text-xs text-gray-500 mb-1">Flag</div>
              <div className="grid grid-cols-3 gap-2">
                {[{v:null,l:'Normal'},{v:'pr',l:'PR'},{v:'injury',l:'Injury'}].map(f => (
                  <button key={f.l} onClick={() => setNewLift({ ...newLift, flag: f.v })}
                    className={`py-2 px-3 rounded-lg text-xs font-medium ${newLift.flag === f.v ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'}`}>{f.l}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Notas</div>
              <input type="text" value={newLift.notes} onChange={(e) => setNewLift({ ...newLift, notes: e.target.value })}
                className="w-full text-sm bg-gray-50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 border-0" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdd} className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold text-sm">Save lift</button>
            <button onClick={() => setShowAdd(false)} className="px-4 bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold text-sm">Cancel</button>
          </div>
        </Card>
      ) : (
        <button onClick={() => setShowAdd(true)} className="w-full bg-blue-500 text-white py-4 rounded-2xl font-semibold text-sm">+ Add lift</button>
      )}
    </div>
  );
};
