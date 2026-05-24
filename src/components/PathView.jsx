import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, StatRow } from '../lib/ui';
import { today, daysBetween } from '../lib/helpers';
import { DEXA_BASELINE, TARGET_FINAL } from '../data/constants';

export const PathView = ({ scans }) => {
  const date = today();
  const latest = scans[scans.length - 1] || DEXA_BASELINE;
  const startDate = new Date('2026-05-18');
  const totalDays = daysBetween('2026-05-18', TARGET_FINAL.date);
  
  const projection = [];
  for (let i = 0; i <= 15; i++) {
    const d = new Date(startDate);
    d.setMonth(startDate.getMonth() + i);
    const dStr = d.toISOString().split('T')[0];
    const daysIn = daysBetween('2026-05-18', dStr);
    const pct = daysIn / totalDays;
    const projWeight = DEXA_BASELINE.weight - (DEXA_BASELINE.weight - TARGET_FINAL.weight) * pct;
    const projLean = DEXA_BASELINE.leanMass + (TARGET_FINAL.leanMass - DEXA_BASELINE.leanMass) * pct;
    const projBF = DEXA_BASELINE.bodyFat - (DEXA_BASELINE.bodyFat - TARGET_FINAL.bodyFat) * pct;
    projection.push({
      month: i,
      date: d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }),
      projected: parseFloat(projWeight.toFixed(1)),
      projectedBF: parseFloat(projBF.toFixed(1)),
      projectedLean: parseFloat(projLean.toFixed(1)),
      actual: null,
    });
  }
  
  scans.forEach(s => {
    const monthsIn = (new Date(s.date + 'T00:00:00') - startDate) / (1000 * 60 * 60 * 24 * 30.44);
    const idx = Math.round(monthsIn);
    if (idx >= 0 && idx < projection.length) projection[idx].actual = s.weight;
  });
  
  const daysIntoPlan = Math.max(0, daysBetween('2026-05-18', date));
  const pctIntoPlan = daysIntoPlan / totalDays;
  const expectedWeight = DEXA_BASELINE.weight - (DEXA_BASELINE.weight - TARGET_FINAL.weight) * pctIntoPlan;
  const weightDelta = latest.weight - expectedWeight;
  const onTrack = Math.abs(weightDelta) < 3;

  return (
    <div className="space-y-4">
      <div className="px-1">
        <div className="text-xs text-gray-400 uppercase tracking-wider">15-month forecast</div>
        <h1 className="text-3xl font-bold text-gray-900 mt-1">Path</h1>
      </div>
      
      <Card>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-2">Pace check</div>
        <div className="flex items-baseline gap-3">
          <div className="text-3xl font-bold tabular-nums" style={{ color: onTrack ? '#10b981' : weightDelta > 0 ? '#f59e0b' : '#3b82f6' }}>
            {weightDelta > 0 ? '+' : ''}{weightDelta.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500">lbs vs expected</div>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {onTrack ? 'On pace for Aug 2027' : weightDelta > 0 ? 'Behind pace' : 'Ahead of pace'}
        </div>
      </Card>
      
      <Card>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Weight trajectory</div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={projection} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={1} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={[175, 230]} />
            <Tooltip contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
            <ReferenceLine y={180} stroke="#10b981" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="projected" stroke="#cbd5e1" strokeWidth={2} dot={false} strokeDasharray="4 4" />
            <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      
      <Card>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Checkpoints</div>
        <div className="space-y-2">
          {projection.filter((_, i) => i % 3 === 0 || i === projection.length - 1).map((p) => {
            const dateProj = new Date(startDate);
            dateProj.setMonth(startDate.getMonth() + p.month);
            const isCurrent = Math.abs((dateProj - new Date(date + 'T00:00:00')) / (1000 * 60 * 60 * 24 * 30.44)) < 1.5;
            const isPast = dateProj < new Date(date + 'T00:00:00') && !isCurrent;
            return (
              <div key={p.month} className={`flex justify-between items-center py-2 ${isCurrent ? 'bg-blue-50 -mx-3 px-3 rounded-lg' : ''}`}>
                <div className={`text-sm ${isCurrent ? 'font-semibold text-blue-700' : isPast ? 'text-gray-400' : 'text-gray-700'}`}>
                  Mes {p.month} · {p.date}
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums">{p.projected} lbs</div>
                  <div className="text-xs text-gray-400">{p.projectedBF}% · {p.projectedLean} lean</div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      
      <Card>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Gap analysis</div>
        <StatRow label="Peso a perder" value={`${(DEXA_BASELINE.weight - TARGET_FINAL.weight).toFixed(1)} lbs`} sublabel="From DEXA" />
        <StatRow label="Grasa a perder" value={`${(DEXA_BASELINE.fatMass - TARGET_FINAL.fatMass).toFixed(1)} lbs`} sublabel="69 → 22" />
        <StatRow label="Lean a ganar" value={`+${(TARGET_FINAL.leanMass - DEXA_BASELINE.leanMass).toFixed(1)} lbs`} sublabel="147.8 → 158" />
        <StatRow label="BF% a reducir" value={`${(DEXA_BASELINE.bodyFat - TARGET_FINAL.bodyFat).toFixed(1)} pts`} sublabel="30.8% → 12%" />
      </Card>
    </div>
  );
};
