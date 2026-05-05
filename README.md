# Bisbi

App de escritorio para dictado por voz, local-first. Apretás un atajo, hablás, soltás el atajo y el texto transcripto aparece pegado en la app activa.

- **Captura de audio:** mic predeterminado, vía `getUserMedia` en el renderer.
- **Transcripción:** [whisper.cpp](https://github.com/ggerganov/whisper.cpp) corriendo localmente con el modelo `ggml-base-q5_1` (multilenguaje, ~57 MB).
- **Inserción:** simulación de Cmd/Ctrl+V tras copiar al clipboard.
- **Plataformas:** macOS (arm64 + x64), Windows x64, Linux x64.

## Estructura del proyecto

```
.
├── package.json              # config de electron-builder + scripts
├── vite.config.ts            # build del frontend
├── tsconfig.json             # tsconfig del frontend
├── index.html                # entrypoint del frontend
├── src/                      # frontend React
│   ├── main.tsx
│   ├── App.tsx               # ventana de ajustes (tabs Ajustes / Historial)
│   ├── RecordingApp.tsx      # contenido de la mini ventana flotante
│   ├── audio.ts              # captura mic → PCM 16k mono
│   ├── pages/
│   │   ├── Settings.tsx
│   │   └── History.tsx
│   ├── styles.css
│   └── types.ts
├── electron/
│   ├── package.json
│   ├── tsconfig.json
│   ├── entitlements.mac.plist
│   └── src/
│       ├── main.ts           # arranque de Electron + ventana de ajustes
│       ├── preload.ts        # bridge IPC seguro
│       ├── buildConfig.ts    # constantes (nombre, protocolo, hotkey default)
│       ├── afterPack.ts      # post-build hook (icono Windows, chmod whisper)
│       ├── logRetention.ts   # rotación de logs
│       └── backend/
│           ├── index.ts      # registra IPC handlers
│           ├── db.ts         # SQLite (solo tabla transcriptions)
│           ├── settings.ts   # config en userData/settings.json
│           ├── hotkey.ts     # globalShortcut
│           ├── transcriber.ts# spawn whisper-cli
│           ├── paster.ts     # clipboard + paste OS-nativo
│           ├── tray.ts       # tray icon + menú
│           ├── recordingWindow.ts # mini ventana flotante "grabando"
│           ├── updater.ts    # electron-updater
│           └── types.ts
├── build/installer.nsh       # macros NSIS para Windows
├── build-resources/          # íconos (icon.icns, icon.ico, icon.png)
└── resources/whisper/        # ⚠️ NO en git — ver más abajo
    ├── ggml-base-q5_1.bin
    ├── darwin-arm64/whisper-cli
    ├── darwin-x64/whisper-cli
    ├── win32-x64/whisper-cli.exe
    └── linux-x64/whisper-cli
```

## Setup inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Descargar el modelo de Whisper

```bash
mkdir -p resources/whisper
curl -L \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q5_1.bin \
  -o resources/whisper/ggml-base-q5_1.bin
```

(`ggml-base-q5_1.bin` ≈ 57 MB)

### 3. Compilar (o descargar) los binarios de whisper.cpp

Necesitás un `whisper-cli` por plataforma. Las opciones son:

#### Opción A — compilar desde el repo oficial

```bash
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp
cmake -B build -DGGML_METAL=ON   # macOS Apple Silicon
cmake --build build --config Release
# binario en: build/bin/whisper-cli
```

Repetí en cada máquina target (mac arm/x64, Windows, Linux) y copiá los binarios a las carpetas correspondientes:

```
resources/whisper/darwin-arm64/whisper-cli
resources/whisper/darwin-x64/whisper-cli
resources/whisper/win32-x64/whisper-cli.exe
resources/whisper/linux-x64/whisper-cli
```

#### Opción B — usar releases pre-compilados

whisper.cpp publica binarios en sus [releases](https://github.com/ggerganov/whisper.cpp/releases). Bajá los que correspondan y renombralos a `whisper-cli` / `whisper-cli.exe`.

### 4. Permisos de ejecución (macOS / Linux)

```bash
chmod +x resources/whisper/darwin-arm64/whisper-cli
chmod +x resources/whisper/darwin-x64/whisper-cli
chmod +x resources/whisper/linux-x64/whisper-cli
```

`afterPack.ts` repite el chmod cuando se empaqueta, pero hace falta tenerlo correcto en dev también.

### 5. Íconos

Poné en `build-resources/`:

- `icon.icns` — macOS (1024×1024)
- `icon.ico` — Windows (multi-resolución)
- `icon.png` — Linux + ventana (512×512)
- `trayTemplate.png` — opcional, monocromo 32×32 para el tray en mac/win/linux

## Desarrollo

```bash
npm run dev
```

Levanta Vite en `http://localhost:7775` y luego compila el código de Electron y arranca la app. El backend re-compila si tocás `electron/src/**` y reinicias.

## Build de producción

```bash
npm run package          # plataforma actual
npm run package:mac
npm run package:win
npm run package:linux
```

El instalador queda en `release/`.

## Auto-update

Configurado vía `electron-updater` con provider `generic` apuntando a `https://bisbi.app/updates/`. Ver el patrón de archivos esperados en [docs/auto-update-api.md](docs/auto-update-api.md) (heredado del proyecto base, ajustar URL/nombre cuando haya backend propio).

## Permisos de sistema

### macOS

- **Micrófono**: pedido la primera vez que se graba. Si lo bloqueaste, mirá *System Settings → Privacy & Security → Microphone → Bisbi*.
- **Accesibilidad** (para simular Cmd+V): *System Settings → Privacy & Security → Accessibility → Bisbi*. Sin esto, el modo "pegar automáticamente" no funciona; el modo "solo clipboard" sí.

### Windows / Linux

- **Mic**: igual, pedido en runtime.
- **Linux**: necesita `xdotool` (X11) o `wtype` (Wayland) para simular el paste. Sin ellos, dejá `pasteMode = clipboard`.

## Decisiones de arquitectura

- **Sin native paste deps.** Usamos `osascript` (mac), `powershell SendKeys` (win), `xdotool/wtype` (linux). Cero compilación nativa, cero problemas de signing.
- **PCM 16 kHz mono** en el renderer. Whisper.cpp espera exactamente eso, así que downsampleamos antes de mandar al main por IPC. Buffers chicos, transferencia rápida.
- **WAV temporal**. Escribimos un WAV en `os.tmpdir()` y lo limpiamos al finalizar. Más simple que pipe a stdin del binario y compatible con todas las versiones de whisper.cpp.
- **SQLite solo para historial.** Settings van a `settings.json` en `userData`. Nada más se persiste localmente.
- **Tray icon como UI principal.** La ventana de ajustes vive cerrada por default. Solo se abre desde el tray, primer arranque, o `app.activate`.

## Pendientes / mejoras futuras

- Soporte para descargar modelos más grandes (`small`, `medium`) on-demand desde un mirror.
- Streaming transcription (transcribir mientras se habla) — requiere reescribir el motor para hacer pipe a stdin.
- Diccionario de reemplazos automáticos (ej. "punto" → ".").
- Atajos diferentes para "modo dictado largo" vs "comando rápido".
