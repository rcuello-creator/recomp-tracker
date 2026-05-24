import React from 'react';
import { Card, StatRow } from '../lib/ui';
import { today, formatDate, getTodayTargets, calculateScore, scoreColor } from '../lib/helpers';

export const WeekView = ({ logs }) => {
  const date = today();
  const dt = new Date(date + 'T00:00:00');
  const dow = dt.getDay();
  const monday = new Date(dt);
  monday.setDate(dt.getDate() - (dow === 0 ? 6 : dow - 1));
  
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
  
  const weekData = days.map(d => {
    const log = logs[d];
    const targets = getTodayTargets(false, d);
    const isFuture = d > date;
    const score = log ? calculateScore(log, targets) : null;
    return {
      date: d,
      day: ['L','M','M','J','V','S','D'][new Date(d + 'T00:00:00').getDay() === 0 ? 6 : new Date(d + 'T00:00:00').getDay() - 1],
      score, isToday: d === date, isFuture, log, targets,
    };
  });
  
  const completed = weekData.filter(d => !d.isFuture && d.score !== null);
  const avgScore = completed.length > 0 ? Math.round(completed.reduce((s, d) => s + d.score, 0) / completed.length) : 0;
  const avgProtein = completed.length > 0 ? Math.round(completed.reduce((s, d) => s + (d.log?.protein || 0), 0) / completed.length) : 0;
  const avgCal = completed.length > 0 ? Math.round(completed.reduce((s, d) => s + (d.log?.calories || 0), 0) / completed.length) : 0;
  const fatBreaks = completed.filter(d => d.log?.fat > d.targets.fat).length;
  const liftsCompleted = completed.filter(d => d.log?.liftDone).length;
  const totalAlcohol = completed.reduce((s, d) => s + (d.log?.alcohol || 0), 0);
  const creatineDays = completed.filter(d => d.log?.creatine).length;

  return (
    <div className="space-y-4">
      <div className="px-1">
        <div className="text-xs text-gray-400 uppercase tracking-wider">Week of {formatDate(days[0])}</div>
        <h1 className="text-3xl font-bold text-gray-900 mt-1">Week</h1>
      </div>
      
      <Card>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Daily scores</div>
        <div className="grid grid-cols-7 gap-2">
          {weekData.map(d => (
            <div key={d.date} className="flex flex-col items-center">
              <div className={`text-[10px] mb-1 ${d.isToday ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>{d.day}</div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold ${
                d.isFuture ? 'bg-gray-50 text-gray-300' :
                d.score === null ? 'bg-gray-100 text-gray-400' :
                d.score >= 85 ? 'bg-emerald-100 text-emerald-700' :
                d.score >= 70 ? 'bg-amber-100 text-amber-700' :
                'bg-rose-100 text-rose-700'
              } ${d.isToday ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}>
                {d.isFuture ? '·' : d.score === null ? '–' : d.score}
              </div>
              <div className="text-[9px] text-gray-400 mt-1">{formatDate(d.date)}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex justify-between items-baseline">
            <div className="text-sm text-gray-600">Week average</div>
            <div className="text-2xl font-bold tabular-nums" style={{ color: scoreColor(avgScore) }}>{avgScore}</div>
          </div>
        </div>
      </Card>
      
      <Card>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">This week</div>
        <StatRow label="Promedio proteína" value={`${avgProtein}g`} status={avgProtein >= 195 ? 'good' : avgProtein >= 175 ? 'warn' : 'bad'} />
        <StatRow label="Promedio calorías" value={avgCal} sublabel={`Target: ${weekData[0]?.targets.calories || 2400}`} />
        <StatRow label="Días grasa sobre techo" value={`${fatBreaks}/${completed.length || 7}`} status={fatBreaks === 0 ? 'good' : fatBreaks <= 1 ? 'warn' : 'bad'} />
        <StatRow label="Lifts completados" value={`${liftsCompleted}/4`} status={liftsCompleted >= 4 ? 'good' : liftsCompleted >= 3 ? 'warn' : 'bad'} />
        <StatRow label="Creatina días" value={`${creatineDays}/${completed.length || 7}`} status={creatineDays === completed.length ? 'good' : creatineDays >= 5 ? 'warn' : 'bad'} sublabel="Re-saturación post-CKO2" />
        <StatRow label="Alcohol total" value={`${totalAlcohol} drinks`} status={totalAlcohol <= 4 ? 'good' : totalAlcohol <= 6 ? 'warn' : 'bad'} />
      </Card>
    </div>
  );
};
