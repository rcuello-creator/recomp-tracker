# PWA Icons

Crear estos 2 archivos en `public/` antes del primer build:

- `icon-192.png` (192×192 px)
- `icon-512.png` (512×512 px)

## Generación rápida

**Opción 1: favicon.io**
1. Ir a https://favicon.io/favicon-generator/
2. Text: `R`
3. Background: Rounded, color `#3b82f6`
4. Font Family: Inter Bold
5. Font Color: `#ffffff`
6. Download
7. Renombrar y mover los `android-chrome-*` a `public/`:
   - `android-chrome-192x192.png` → `icon-192.png`
   - `android-chrome-512x512.png` → `icon-512.png`

**Opción 2: AI image gen**
Prompt para Midjourney/DALL-E:
> Minimalist app icon, blue (#3b82f6) rounded square background, white dumbbell silhouette in center, iOS-style, flat design, no text

**Opción 3: Diseño manual**
- Usar Figma/Sketch/Affinity
- 1024×1024 master, exportar a 192 y 512
- Considerar también `apple-touch-icon.png` (180×180)
