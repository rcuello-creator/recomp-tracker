# Recomp Tracker

PWA personal para tracking de recomposición corporal con backend en Google Sheets.

**Target:** 180 lbs / 12% BF / 158 lean para Aug 2027 (desde 222.8 lbs / 30.8% BF DEXA Apr 2026).

## Setup rápido

### 1. Google Sheet (5 min)
1. Crear sheet nuevo "Recomp Tracker — Rodrigo" en Gmail personal
2. Crear 6 tabs con los headers exactos en `docs/SHEET_SCHEMA.md`
3. Copiar el Sheet ID de la URL (`/spreadsheets/d/{ID}/edit`)

### 2. Apps Script (10 min)
1. Tools → Apps Script desde el Sheet
2. Pegar contenido de `apps-script/Code.gs`
3. Cambiar `SHEET_ID` y `SECRET` en las constantes
4. Deploy → New deployment → Web app
   - Execute as: Me
   - Who has access: Anyone
5. Copiar la URL del deployment

### 3. Local dev (5 min)
```bash
git clone https://github.com/rcuello-creator/recomp-tracker.git
cd recomp-tracker
npm install
cp .env.example .env.local
# Editar .env.local con la API_URL y SECRET
npm run dev
```

### 4. Deploy GitHub Pages (5 min)
```bash
npm run build
npm run deploy
```

URL final: `https://rcuello-creator.github.io/recomp-tracker`

### 5. Add to iPhone Home Screen
1. Abrir URL en Safari (no Chrome)
2. Share → Add to Home Screen
3. Confirmar nombre "Recomp"

## Arquitectura

```
iPhone PWA → Apps Script Web App → Google Sheets
     ↓ (offline)
  localStorage (sync queue)
```

Offline-first: writes van primero a localStorage, después se sincronizan cuando hay red.

## Estructura del repo

```
recomp-tracker/
├── apps-script/
│   └── Code.gs              # Backend en Google Apps Script
├── docs/
│   ├── SHEET_SCHEMA.md      # Estructura de los 6 tabs del Sheet
│   ├── SYNC_FLOW.md         # Cómo funciona el sync offline
│   └── DEPLOYMENT.md        # Paso a paso del deploy
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── icon-192.png         # App icon
│   ├── icon-512.png         # App icon retina
│   └── sw.js                # Service worker
├── src/
│   ├── components/          # Componentes UI por tab
│   │   ├── TodayView.jsx
│   │   ├── WeekView.jsx
│   │   ├── LiftsView.jsx
│   │   ├── BodyView.jsx
│   │   ├── PhaseView.jsx
│   │   └── PathView.jsx
│   ├── lib/
│   │   ├── api.js           # Cliente Apps Script
│   │   ├── storage.js       # localStorage + sync queue
│   │   ├── useStorageSync.js # Hook React principal
│   │   ├── helpers.js       # Date, score, phase helpers
│   │   └── ui.jsx           # Card, Ring, NumInput, etc
│   ├── data/
│   │   ├── constants.js     # DEXA baseline, target final
│   │   ├── phases.js        # 5 fases del plan
│   │   └── seed.js          # Data inicial Starfit + Lifts
│   ├── App.jsx              # Root component
│   └── main.jsx             # Entry point
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
├── vite.config.js
└── README.md
```

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS
- **Charts:** Recharts
- **PWA:** vite-plugin-pwa (Workbox)
- **Backend:** Google Apps Script Web App
- **Database:** Google Sheets
- **Hosting:** GitHub Pages (raisingtogether org)
- **Auth:** Shared secret (uso personal)

## Variables de entorno

```env
VITE_API_URL=https://script.google.com/macros/s/XXXXX/exec
VITE_API_SECRET=tu-secret-de-32-chars
```

Nunca commitear `.env.local`. Está en `.gitignore`.

## Comandos

```bash
npm run dev      # Dev server localhost:5173
npm run build    # Build producción → dist/
npm run preview  # Preview build localmente
npm run deploy   # Deploy a GitHub Pages
```

## Datos seed

La app viene pre-cargada con:
- DEXA baseline 10 Abr 2026 (222.8 lbs, 30.8% BF)
- 4 scans Starfit hasta 16 May 2026
- 7 lifts desde 29 Abr (incluye PR all-time y lesión RDL)
- 5 fases del plan + 6 milestones
- Score algorithm con 7 componentes (proteína, calorías, grasa, lift, sueño, creatina, alcohol)

## Roadmap

**v1.0** (sábado launch) - PWA básica con sync Sheets ✓
**v1.1** - Notificaciones push (creatina, refeed, fisio)
**v1.2** - Apple Shortcut para pasos/sueño auto desde Health
**v1.3** - Weekly email digest los lunes via Apps Script trigger
**v2.0** - DEXA tab separado con comparaciones longitudinales
