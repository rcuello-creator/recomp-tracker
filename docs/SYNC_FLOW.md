# Sync Flow

Documentación técnica de cómo funciona el sync offline-first.

## Principios

1. **localStorage es la fuente primaria** para reads en el dispositivo. Render instantáneo.
2. **Sheet es la fuente de verdad** para writes que necesitan sobrevivir reinstalación o cambio de dispositivo.
3. **Sync queue** garantiza que ningún write se pierde por falta de conexión.
4. **Last-write-wins** por timestamp del cliente (no hay locking).

## Lifecycle de un write

```
Usuario marca Creatina toggle
         ↓
setState (UI updates instantly)
         ↓
storage.set('logs', newLogs)
         ↓
storage.enqueue('saveLog', data)
         ↓
processSyncQueue() (immediate try)
         ├─ online + API OK → api.syncBatch([op])
         │                    ↓
         │                    Apps Script writes Sheet
         │                    ↓
         │                    storage.clearQueue()
         │                    syncStatus = 'idle'
         │
         └─ offline / API error → queue persists
                                  syncStatus = 'offline' | 'error'
                                  ↓
                                  Next interval (30s) retries
                                  Or visibilitychange = 'visible' retries
                                  Or online event retries
```

## Lifecycle de un read

```
App mount
   ↓
useState(() => storage.get('logs', {}))  ← instant from cache
   ↓
useEffect → fetchFromServer()
   ↓
   ├─ Success → merge into state → storage.set(...)
   │            syncStatus = 'idle'
   │
   └─ Fail → keep cached state
            syncStatus = 'error' | 'offline'
```

## Retry strategy

- **Interval**: cada 30s mientras la app está abierta
- **Visibility change**: cuando volvés a la app desde otra
- **Online event**: cuando recuperás red
- **Manual**: tap en el SyncIndicator del header

Cada operación en queue tiene un contador `attempts`. Actualmente no hay backoff exponencial ni límite de retries (en uso personal con bajo volumen, no es necesario).

## Conflict resolution

Para `DailyLogs` el sheet hace **upsert por date**. Si el dispositivo A graba `protein: 200` y el dispositivo B graba `protein: 220` antes de que A syncee, el último que llega gana.

Para `StarfitScans`, `Lifts`, `DexaScans` es **append-only**, no hay conflictos.

Para `Settings` es **upsert por key**. Last-write-wins.

Esto es aceptable para uso personal de un solo usuario en 1-2 dispositivos. Si después agregás multi-usuario (ej. Tatiana también usándola), habría que agregar timestamps server-side y resolución más sofisticada.

## Estados del SyncIndicator

| Estado | Color | Cuándo |
|--------|-------|--------|
| `idle` | 🟢 verde | Última sync OK, queue vacía |
| `syncing` | 🔵 azul pulsante | Activamente sincronizando |
| `error` | 🔴 rojo | Último intento falló, hay queue pendiente |
| `offline` | ⚪ gris | `navigator.onLine === false` o API no configurada |

Si querés forzar sync, tap en el indicator.

## Limitaciones conocidas

1. **localStorage tiene ~5-10MB** dependiendo del browser. Con uso normal (1 log/día * 365 días = 365 entries) estás muy lejos del límite.

2. **El secret está embebido en el bundle JavaScript**. Cualquiera que inspeccione el código puede ver el secret. Para uso personal no sensible está OK; si después manejás data médica/financiera, migrar a OAuth + Google Sign-In.

3. **No hay encryption at rest**. La data en localStorage está en plain text. iOS lo protege con el passcode del dispositivo, pero si rooteás/jailbreakeás un device es accesible.

4. **Apps Script tiene cuotas**: 20K URL fetches/día, 6 min/execution. Para uso personal estás muy lejos.

5. **Service worker caching** del API responses está configurado a 24h. Si cambiás data en el Sheet directamente, puede tomar hasta 24h en reflejarse en la app (o forzar sync con tap en indicator).
