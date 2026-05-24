import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, StatRow, NumInput } from '../lib/ui';
import { today, formatDate, formatDateLong } from '../lib/helpers';
import { DEXA_BASELINE, TARGET_FINAL } from '../data/constants';

export const BodyView = ({ scans, saveScan, dexas }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [newScan, setNewScan] = useState({ date: today(), weight: '', bodyFat: '', leanMass: '', fatMass: '', context: '' });
  
  const latest = scans[scans.length - 1] || DEXA_BASELINE;
  const chartData = scans.map(s => ({ date: formatDate(s.date), weight: s.weight, lean: s.leanMass, fat: s.fatMass }));
  
  const targetGap = {
    weight: latest.weight - TARGET_FINAL.weight,
    lean: TARGET_FINAL.leanMass - latest.leanMass,
    fat: latest.fatMass - TARGET_FINAL.fatMass,
    bf: latest.bodyFat - TARGET_FINAL.bodyFat,
  };

  const handleAdd = () => {
    if (!newScan.weight || !newScan.bodyFat) return;
    const w = parseFloat(newScan.weight);
    const bf = parseFloat(newScan.bodyFat);
    const scan = {
      date: newScan.date, weight: w, bodyFat: bf,
      leanMass: newScan.leanMass ? parseFloat(newScan.leanMass) : parseFloat((w * (1 - bf/100)).toFixed(1)),
      fatMass: newScan.fatMass ? parseFloat(newScan.fatMass) : parseFloat((w * bf/100).toFixed(1)),
      context: newScan.context || '',
    };
    saveScan(scan);
    setShowAdd(false);
    setNewScan({ date: today(), weight: '', bodyFat: '', leanMass: '', fatMass: '', context: '' });
  };

  return (
    <div className="space-y-4">
      <div className="px-1">
        <div className="text-xs text-gray-400 uppercase tracking-wider">Body composition</div>
        <h1 className="text-3xl font-bold text-gray-900 mt-1">Body</h1>
      </div>

      <Card>
        <div className="text-xs text-gray-400 uppercase tracking-wider">Latest scan</div>
        <div className="text-sm text-gray-500">{formatDateLong(latest.date)}</div>
        {latest.context && <div className="text-xs text-amber-600 mt-1">⚠️ {latest.context}</div>}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <div className="text-xs text-gray-400 uppercase">Weight</div>
            <div className="text-3xl font-bold text-gray-900 tabular-nums">{latest.weight}</div>
            <div className="text-xs text-gray-500">lbs · −{targetGap.weight.toFixed(1)} to target</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase">Body fat</div>
            <div className="text-3xl font-bold text-rose-600 tabular-nums">{latest.bodyFat}%</div>
            <div className="text-xs text-gray-500">−{targetGap.bf.toFixed(1)}pts to 12%</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase">Lean</div>
            <div className="text-3xl font-bold text-emerald-600 tabular-nums">{latest.leanMass}</div>
            <div className="text-xs text-gray-500">lbs · +{targetGap.lean.toFixed(1)} to target</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 uppercase">Fat mass</div>
            <div className="text-3xl font-bold text-gray-900 tabular-nums">{latest.fatMass}</div>
            <div className="text-xs text-gray-500">lbs · −{targetGap.fat.toFixed(1)} to target</div>
          </div>
        </div>
      </Card>

      <Card className="bg-blue-50 border border-blue-100">
        <div className="text-xs uppercase tracking-wider font-semibold text-blue-800 mb-1">⚡ Disclaimer BIA</div>
        <div className="text-xs text-blue-900 leading-relaxed">
          Starfit (BIA) mide impedancia eléctrica. Lecturas afectadas por: hidratación, saturación de creatina, sodio, glicógeno, hora del día. Variabilidad ±1-2 lbs lean/fat scan-to-scan es normal. La verdad de composición es DEXA cada 90 días. Próximo DEXA: ~10 Julio 2026.
        </div>
      </Card>

      <Card>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Weight trend</div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
            <Tooltip contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
            <ReferenceLine y={TARGET_FINAL.weight} stroke="#10b981" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Lean vs Fat</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '12px' }} />
            <Line type="monotone" dataKey="lean" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="fat" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-emerald-500" /><span className="text-gray-600">Lean</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-rose-500" /><span className="text-gray-600">Fat</span></div>
        </div>
      </Card>

      <Card>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Scan history</div>
        <div className="space-y-2">
          {[...scans].reverse().map((s) => (
            <div key={s.date} className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900">{formatDate(s.date)}</div>
                {s.context && <div className="text-[10px] text-amber-600 mt-0.5">{s.context}</div>}
              </div>
              <div className="text-right text-xs">
                <div className="font-semibold text-gray-900 tabular-nums">{s.weight} lbs</div>
                <div className="text-gray-500 tabular-nums">{s.bodyFat}% · {s.leanMass} lean</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">DEXA baseline</div>
        <div className="text-sm text-gray-500 mb-3">10 Abr 2026 · Verdad fisiológica</div>
        <StatRow label="Lean Mass" value={`${DEXA_BASELINE.leanMass} lbs`} />
        <StatRow label="Fat Mass" value={`${DEXA_BASELINE.fatMass} lbs`} />
        <StatRow label="Body Fat" value={`${DEXA_BASELINE.bodyFat}%`} />
        <StatRow label="Visceral Fat" value={`${DEXA_BASELINE.visceralFat} lbs`} sublabel="DEXA · top 20%" status="good" />
        <StatRow label="ALMI" value={DEXA_BASELINE.ALMI} sublabel="Target 9.5" status="warn" />
        <StatRow label="FFMI" value={DEXA_BASELINE.FFMI} sublabel="Above average" status="good" />
        <StatRow label="T-Score" value={DEXA_BASELINE.tScore} sublabel="Bone density" status="good" />
      </Card>

      {showAdd ? (
        <Card>
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">New Starfit scan</div>
          <NumInput label="Peso" value={newScan.weight} onChange={(v) => setNewScan({ ...newScan, weight: v })} unit="lbs" step={0.1} />
          <NumInput label="Body Fat" value={newScan.bodyFat} onChange={(v) => setNewScan({ ...newScan, bodyFat: v })} unit="%" step={0.1} />
          <NumInput label="Lean" value={newScan.leanMass} onChange={(v) => setNewScan({ ...newScan, leanMass: v })} unit="lbs" step={0.1} />
          <NumInput label="Fat mass" value={newScan.fatMass} onChange={(v) => setNewScan({ ...newScan, fatMass: v })} unit="lbs" step={0.1} />
          <div className="py-3">
            <div className="text-sm font-medium text-gray-700 mb-2">Context</div>
            <input type="text" value={newScan.context} onChange={(e) => setNewScan({ ...newScan, context: e.target.value })}
              placeholder="ej: post-viaje, sin creatina"
              className="w-full text-sm bg-gray-50 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 border-0" />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleAdd} className="flex-1 bg-blue-500 text-white py-3 rounded-xl font-semibold text-sm">Save scan</button>
            <button onClick={() => setShowAdd(false)} className="px-4 bg-gray-100 text-gray-600 py-3 rounded-xl font-semibold text-sm">Cancel</button>
          </div>
        </Card>
      ) : (
        <button onClick={() => setShowAdd(true)} className="w-full bg-blue-500 text-white py-4 rounded-2xl font-semibold text-sm">+ Add Starfit scan</button>
      )}
    </div>
  );
};
