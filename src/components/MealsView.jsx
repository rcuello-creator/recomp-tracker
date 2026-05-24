import React, { useState } from 'react';
import { Card } from '../lib/ui';
import { today, getTodayTargets } from '../lib/helpers';
import { PRESET_MEALS } from '../data/seed';

export const MealsView = ({ logs, saveLog }) => {
  const date = today();
  const todayLog = logs[date] || { calories: 0, protein: 0, carbs: 0, fat: 0, mealsLog: [] };
  const targets = getTodayTargets(false, date);
  const [expandedMeal, setExpandedMeal] = useState(null);
  
  const remaining = {
    cal: targets.calories - (todayLog.calories || 0),
    prot: targets.protein - (todayLog.protein || 0),
    carbs: targets.carbs - (todayLog.carbs || 0),
    fat: targets.fat - (todayLog.fat || 0),
  };
  
  const addMeal = (meal) => {
    const current = logs[date] || { mealsLog: [] };
    const next = {
      ...current,
      calories: (current.calories || 0) + meal.cal,
      protein: (current.protein || 0) + meal.prot,
      carbs: (current.carbs || 0) + meal.carbs,
      fat: (current.fat || 0) + meal.fat,
      mealsLog: [...(current.mealsLog || []), { id: meal.id, name: meal.name, emoji: meal.emoji, time: new Date().toISOString() }],
    };
    saveLog(date, next);
  };
  
  const removeMeal = (idx) => {
    const current = logs[date];
    if (!current || !current.mealsLog || !current.mealsLog[idx]) return;
    const mealToRemove = current.mealsLog[idx];
    const preset = PRESET_MEALS.find(m => m.id === mealToRemove.id);
    if (!preset) return;
    const next = {
      ...current,
      calories: Math.max(0, (current.calories || 0) - preset.cal),
      protein: Math.max(0, (current.protein || 0) - preset.prot),
      carbs: Math.max(0, (current.carbs || 0) - preset.carbs),
      fat: Math.max(0, (current.fat || 0) - preset.fat),
      mealsLog: current.mealsLog.filter((_, i) => i !== idx),
    };
    saveLog(date, next);
  };

  const categories = ['Desayuno', 'Almuerzo', 'Cena', 'Pre-bed', 'Snack'];
  
  return (
    <div className="space-y-4">
      <div className="px-1">
        <div className="text-xs text-gray-400 uppercase tracking-wider">Quick add</div>
        <h1 className="text-3xl font-bold text-gray-900 mt-1">Meals</h1>
        <div className="text-xs text-gray-500 mt-1">Tap para sumar al log del día</div>
      </div>

      <Card>
        <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Faltan hoy</div>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className={`text-2xl font-bold tabular-nums ${remaining.cal < 0 ? 'text-rose-600' : 'text-gray-900'}`}>
              {Math.round(remaining.cal)}
            </div>
            <div className="text-[10px] text-gray-400 uppercase">cal</div>
          </div>
          <div>
            <div className={`text-2xl font-bold tabular-nums ${remaining.prot <= 0 ? 'text-emerald-600' : 'text-gray-900'}`}>
              {Math.round(remaining.prot)}
            </div>
            <div className="text-[10px] text-gray-400 uppercase">prot g</div>
          </div>
          <div>
            <div className={`text-2xl font-bold tabular-nums ${remaining.carbs < 0 ? 'text-amber-600' : 'text-gray-900'}`}>
              {Math.round(remaining.carbs)}
            </div>
            <div className="text-[10px] text-gray-400 uppercase">carbs g</div>
          </div>
          <div>
            <div className={`text-2xl font-bold tabular-nums ${remaining.fat < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {Math.round(remaining.fat)}
            </div>
            <div className="text-[10px] text-gray-400 uppercase">fat g</div>
          </div>
        </div>
        {remaining.prot > 50 && remaining.cal < 800 && (
          <div className="text-xs text-amber-700 mt-3 pt-3 border-t border-gray-100">
            ⚠️ Te faltan {Math.round(remaining.prot)}g proteína con poco margen. Premier shake + jerky.
          </div>
        )}
      </Card>

      {categories.map(cat => {
        const meals = PRESET_MEALS.filter(m => m.category === cat);
        return (
          <Card key={cat}>
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">{cat}</div>
            <div className="space-y-2">
              {meals.map(meal => (
                <div key={meal.id}>
                  <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition">
                    <button
                      onClick={() => setExpandedMeal(expandedMeal === meal.id ? null : meal.id)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div className="text-2xl flex-shrink-0">{meal.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900">{meal.name}</div>
                        <div className="text-[10px] text-gray-500 tabular-nums">
                          {meal.cal} cal · {meal.prot}g prot · {meal.carbs}c · {meal.fat}f
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => addMeal(meal)}
                      className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-bold ml-2 flex-shrink-0 active:scale-95"
                    >
                      +
                    </button>
                  </div>
                  {expandedMeal === meal.id && (
                    <div className="mt-1 px-3 py-2 bg-blue-50 rounded-lg text-xs text-blue-900 leading-relaxed">
                      {meal.detail}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        );
      })}

      {todayLog.mealsLog && todayLog.mealsLog.length > 0 && (
        <Card>
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Comidas de hoy</div>
          <div className="space-y-2">
            {todayLog.mealsLog.map((entry, idx) => {
              const time = new Date(entry.time);
              const timeStr = time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{entry.emoji}</span>
                    <div>
                      <div className="text-sm text-gray-900">{entry.name}</div>
                      <div className="text-[10px] text-gray-400">{timeStr}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeMeal(idx)}
                    className="text-xs text-rose-600 px-3 py-1 rounded-lg hover:bg-rose-50"
                  >
                    Quitar
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card className="bg-blue-50 border border-blue-100">
        <div className="text-xs uppercase tracking-wider font-semibold text-blue-800 mb-2">💡 Cómo usar</div>
        <div className="text-xs text-blue-900 leading-relaxed space-y-1">
          <div>· Tap "+" para sumar los macros al día</div>
          <div>· Tap nombre para ver la receta detallada</div>
          <div>· Si cocinás algo distinto, igual loggeá manual en Today</div>
        </div>
      </Card>
    </div>
  );
};
