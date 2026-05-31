import React, { useState } from 'react';
import { useStorageSync } from './lib/useStorageSync';
import { SyncIndicator } from './lib/ui';
import { Home } from './components/Home';
import { MealsView } from './components/MealsView';
import { WeekView } from './components/WeekView';
import { LiftsView } from './components/LiftsView';
import { BodyView } from './components/BodyView';
import { PhaseView } from './components/PhaseView';
import { FAB } from './components/FAB';
import { QuickAddModal } from './components/QuickAddModal';

export default function App() {
  const [tab, setTab] = useState('home');
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const sync = useStorageSync();

  const tabs = [
    { id: 'home',  label: 'Home',  icon: '◉' },
    { id: 'meals', label: 'Meals', icon: '🍽' },
    { id: 'week',  label: 'Week',  icon: '▦' },
    { id: 'lifts', label: 'Lifts', icon: '◇' },
    { id: 'body',  label: 'Body',  icon: '◈' },
    { id: 'phase', label: 'Phase', icon: '◐' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto pb-24">
        <div className="px-4 pt-8 pb-2 flex justify-end">
          <SyncIndicator
            status={sync.syncStatus}
            lastSync={sync.lastSync}
            queueLen={sync.queueLen}
            onForce={sync.forceSync}
          />
        </div>

        <div className="px-4 pb-4">
          {tab === 'home' && (
            <Home
              logs={sync.logs}
              saveLog={sync.saveLog}
              settings={sync.settings}
              updateSetting={sync.updateSetting}
              lifts={sync.lifts}
            />
          )}
          {tab === 'meals' && <MealsView logs={sync.logs} saveLog={sync.saveLog} />}
          {tab === 'week'  && <WeekView  logs={sync.logs} />}
          {tab === 'lifts' && (
            <LiftsView
              lifts={sync.lifts}
              saveLift={sync.saveLift}
              injuryActive={sync.settings.injuryActive}
            />
          )}
          {tab === 'body'  && (
            <BodyView
              scans={sync.scans}
              saveScan={sync.saveScan}
              dexas={sync.dexas}
            />
          )}
          {tab === 'phase' && <PhaseView />}
        </div>
      </div>

      <FAB onClick={() => setQuickAddOpen(true)} label="Agregar comida" />

      <QuickAddModal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        logs={sync.logs}
        saveLog={sync.saveLog}
      />

      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200 safe-bottom z-30">
        <div className="max-w-md mx-auto px-2 py-2 grid grid-cols-6 gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex flex-col items-center py-2 px-1 rounded-lg transition ${tab === t.id ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className="text-lg leading-none">{t.icon}</div>
              <div className="text-[10px] mt-0.5 font-medium">{t.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
