# Deployment Guide

Paso a paso para tener la app corriendo de cero.

---

## Pre-requisitos

- Node.js 18+ instalado
- Cuenta Google (preferiblemente Gmail personal para mantener separado del Salesforce work)
- GitHub account en org `raisingtogether`
- Editor de código (Cursor / VS Code / Claude Code)

---

## Paso 1 — Google Sheet (5 min)

1. Ir a [sheets.google.com](https://sheets.google.com) → New spreadsheet
2. Nombre: **Recomp Tracker — Rodrigo**
3. Mover a la carpeta del nonprofit
4. Copiar el **Sheet ID** de la URL:
   ```
   https://docs.google.com/spreadsheets/d/AQUI_VA_EL_ID/edit
   ```
5. Guardar el ID en notas

---

## Paso 2 — Apps Script Backend (15 min)

1. En el Sheet recién creado: **Extensions → Apps Script**
2. Borrar todo el contenido del editor default
3. Pegar el contenido completo de `apps-script/Code.gs`
4. **Cambiar las 2 constantes al principio del archivo:**
   ```javascript
   const SECRET = 'XXX'; // generá uno corriendo generateSecret()
   const SHEET_ID = 'XXX'; // el ID del paso 1
   ```
5. **Generar el SECRET:**
   - Ejecutar la función `generateSecret` desde el dropdown del editor
   - View → Logs → copiar el string de 32 caracteres
   - Pegarlo en la constante `SECRET`
6. **Guardar** (Ctrl+S / Cmd+S)
7. **Inicializar el Sheet:**
   - Ejecutar `initializeSheet` (crea los 6 tabs con headers)
   - Permitir acceso cuando pida
8. **Cargar data seed:**
   - Ejecutar `seedInitialData` (DEXA, Starfit, Lifts, Phases, Settings)
9. **Deploy:**
   - Click **Deploy → New deployment**
   - Tipo: **Web app**
   - Description: `Recomp Tracker v1.0`
   - Execute as: **Me**
   - Who has access: **Anyone** (la seguridad la da el SECRET)
   - Click **Deploy**
   - Autorizar permisos
   - **Copiar la Web App URL** (termina en `/exec`)

---

## Paso 3 — Clonar repo (5 min)

```bash
cd ~/code
git clone https://github.com/rcuello-creator/recomp-tracker.git
cd recomp-tracker
npm install
```

Si todavía no creaste el repo:
1. GitHub → New repository → org `raisingtogether`
2. Nombre: `recomp-tracker`
3. Visibility: **Private** (recomendado, aunque sea solo tuyo)
4. README: skip (ya tenemos uno)
5. Después del primer push: Settings → Pages → Source: `gh-pages` branch

---

## Paso 4 — Variables de entorno (2 min)

```bash
cp .env.example .env.local
```

Editar `.env.local`:
```env
VITE_API_URL=https://script.google.com/macros/s/TU_DEPLOYMENT_ID/exec
VITE_API_SECRET=TU_SECRET_DE_32_CHARS
```

Verificar que `.env.local` está en `.gitignore` (debería estar).

---

## Paso 5 — Test local (5 min)

```bash
npm run dev
```

Abrir [localhost:5173](http://localhost:5173). Deberías ver:
- Sync indicator verde "Synced" en top right
- Today tab con la fecha de hoy y Fase 1
- Body tab con los 4 scans Starfit + DEXA baseline
- Lifts tab con los 7 lifts seed
- Phase tab con timeline de 5 fases

**Test de write:**
1. Tab Today → marcar Creatina y completar Proteína: 200
2. Open Sheet en otra ventana → DailyLogs
3. Debería aparecer la fila con la fecha de hoy y los valores

Si no aparece, revisar:
- Console del navegador (F12) por errores
- Apps Script editor → Executions (ver logs)
- Network tab → check que el POST llega al script.google.com

---

## Paso 6 — Iconos PWA (15 min)

Necesitás 2 iconos en `public/`:

**Opción A — Generador online (rápido):**
1. Ir a [favicon.io/favicon-generator](https://favicon.io/favicon-generator/)
2. Text: "R", Background: `#3b82f6`, Font: Bold
3. Descargar y extraer `icon-192.png` y `icon-512.png` a `public/`

**Opción B — Diseño custom (mejor):**
- SVG simple con un haltere o "R" estilizada
- Exportar a PNG en ambos tamaños

Verificar que existen:
```bash
ls public/icon-*.png
# Debería mostrar icon-192.png y icon-512.png
```

---

## Paso 7 — Build y deploy (10 min)

```bash
# Test build localmente primero
npm run build
npm run preview
# Abrir el localhost que te dé y verificar que todo funciona

# Si todo OK, deploy a GitHub Pages
npm install -g gh-pages  # solo primera vez
npm run deploy
```

`npm run deploy` hace:
1. `npm run build` → genera `dist/`
2. `gh-pages -d dist` → pushea `dist/` al branch `gh-pages`
3. GitHub Pages sirve automáticamente desde ese branch

URL final: `https://rcuello-creator.github.io/recomp-tracker/`

⏱ Toma 1-2 min en propagarse después del primer deploy.

---

## Paso 8 — Add to iPhone Home Screen (2 min)

1. Abrir la URL en **Safari** (no Chrome, no funciona igual)
2. Tap el botón Share (cuadrado con flecha hacia arriba)
3. Scroll → **Add to Home Screen**
4. Nombre: "Recomp"
5. Add

Resultado: ícono en home screen, abre full-screen sin barra de Safari, se siente como app nativa.

---

## Paso 9 — Test offline (3 min)

1. Abrir la app desde home screen
2. Activar Modo Avión
3. Marcar Creatina, completar proteína
4. Sync indicator debe decir "Offline" con el badge `· 1` (queue length)
5. Desactivar Modo Avión
6. Sync indicator vuelve a "Syncing..." → "Synced"
7. Verificar en el Sheet que la data llegó

---

## Troubleshooting

### Sync error
- Verificar que `VITE_API_SECRET` en `.env.local` coincide con `SECRET` en `Code.gs`
- Apps Script → Deploy → Manage deployments → check que la URL del .env coincide
- Si redeployás Apps Script con cambios: **es importante seleccionar la deployment existente y "Edit"**, no crear nueva (la URL cambiaría)

### CORS errors
- Apps Script Web Apps no requieren preflight CORS si usás `Content-Type: text/plain`
- El `api.js` ya envía con ese content type
- Si ves errores CORS, verificar que no estás enviando `application/json`

### Sheet rows como Date objects mal formateados
- Apps Script puede devolver dates como objetos
- El helper `sheetToObjects` ya normaliza a `YYYY-MM-DD`
- Si ves dates raros, verificar que el helper está aplicándose

### GitHub Pages 404
- Verificar que `vite.config.js` tiene `base: '/recomp-tracker/'`
- Verificar que en GitHub Settings → Pages: source = `gh-pages` branch, `/ (root)`
- Esperar 2-5 min después del primer deploy

### PWA no se instala en iPhone
- Solo funciona en Safari, no Chrome iOS
- Verificar HTTPS (GitHub Pages siempre es HTTPS)
- Verificar `manifest.json` válido en DevTools → Application

---

## Próximos pasos post-launch

Cuando la app esté estable y la uses 2-3 semanas:

1. **Apple Shortcut para Health auto-sync**
   - Crear shortcut que corra a las 11pm
   - Lee pasos, sueño, peso de Health
   - POST al Apps Script con la data del día

2. **Notificaciones push**
   - Web Push API requiere VAPID keys
   - Alternativa simple: usar Apple Shortcuts para alerts locales

3. **Weekly digest email**
   - Apps Script trigger los lunes 7am
   - Envía resumen semana pasada a `rodrigo.cuello@gmail.com`

4. **Custom domain**
   - Comprar `recomp.raisingtogetherautism.org` (DNS CNAME a `rcuello-creator.github.io`)
   - Settings → Pages → Custom domain
