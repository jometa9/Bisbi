# Bisbi

**Local-first voice dictation for your desktop. Press a hotkey, speak, and the text gets pasted right where your cursor was.**

Bisbi is a desktop app (macOS, Windows and Linux) that turns your voice into text and inserts it automatically into the active application — be it a code editor, an email, a chat or a document. It works with a global hotkey, supports two transcription engines (OpenAI cloud or local `whisper.cpp`) and keeps an encrypted local history of your transcriptions.

---

## What it does

- **Global hotkey dictation.** Hold the configured key (default `Right ⌘` on macOS, `Right Ctrl` on Windows/Linux). While you hold it, Bisbi records; when you release, it transcribes and pastes.
- **Hands-free mode.** Tap once to start recording, tap again to stop. Useful for long dictations.
- **Auto-paste into the active app.** After transcribing, Bisbi simulates `Cmd/Ctrl+V` in whichever window was in the foreground.
- **Two swappable transcription engines:**
  - **Cloud (OpenAI):** best quality, requires your own API key. Supports `gpt-4o-mini-transcribe`, `gpt-4o-transcribe` and `whisper-1`.
  - **Offline (whisper.cpp):** runs 100% locally with a `ggml-base-q5_1` model (<100 MB) bundled in the installer. Nothing leaves your machine.
- **Multilingual UI.** English, Spanish, Chinese, Hindi and Arabic (with automatic detection from the system language).
- **Local history.** Every transcription is stored in a local SQLite database (`better-sqlite3`), with the OpenAI API key encrypted via Electron's `safeStorage`.
- **System tray indicator.** An owl icon that toggles between *idle* and *recording* states, with a context menu.
- **Mute system audio while recording** (optional), so the mic doesn't pick up what you're listening to.
- **Auto-update via GitHub Releases.** A banner appears in the app whenever a new version is available.

## How it works (technical flow)

1. **Hotkey capture:** [`uiohook-napi`](https://github.com/SnosMe/uiohook-napi) listens for OS-level keyboard events, even when Bisbi is minimized.
2. **Audio capture:** done in Electron's renderer process via the Web Audio API (`navigator.mediaDevices.getUserMedia`), capturing 16 kHz mono PCM.
3. **Transfer to the main process:** the PCM buffer is sent over IPC through the bridge exposed in [`electron/src/preload.ts`](electron/src/preload.ts).
4. **Transcription:**
   - **Cloud:** uploads the WAV to OpenAI's `/v1/audio/transcriptions` endpoint using the user's key.
   - **Offline:** the main process spawns the `whisper-cli` binary with the `bsb-001.dat` model and reads back the result.
5. **Paste:** [`electron/src/backend/paster.ts`](electron/src/backend/paster.ts) copies the text to the clipboard and simulates `Cmd/Ctrl+V` in the app that had focus before recording started.
6. **Persistence:** the transcription (text, duration, detected language, timestamp) is saved to SQLite under Electron's `userData` directory.

## Stack

### Runtime
- **Electron 33** — cross-platform desktop shell.
- **Node.js + TypeScript** in the main process.
- **React 18 + TypeScript** in the renderer (UI).
- **Vite 5** as the frontend dev server / bundler.
- **esbuild** + obfuscator (`javascript-obfuscator`) to bundle the main process.

### Native modules
- **[`better-sqlite3`](https://github.com/WiseLibs/better-sqlite3)** — transcription history and settings (synchronous, serverless).
- **[`uiohook-napi`](https://github.com/SnosMe/uiohook-napi)** — global OS-level keyboard / mouse hook.
- **[`whisper.cpp`](https://github.com/ggerganov/whisper.cpp)** by Georgi Gerganov — offline transcription engine in C++ with GGML models.

### Packaging and distribution
- **electron-builder** — generates DMG (macOS arm64), NSIS (Windows x64), AppImage / tar.gz (Linux x64).
- **Apple notarization** via `scripts/notarize-dmg.mjs` (hardened runtime + entitlements).
- **GitHub Releases** as the publishing and auto-update channel.

### Other
- Custom i18n (no external libraries) with locales under [`src/i18n/locales/`](src/i18n/locales/).
- Strict end-to-end typing with two separate `tsconfig` files (renderer + main).

## Project structure

```
.
├── electron/                  # Main-process code (Node/Electron)
│   ├── src/
│   │   ├── main.ts            # Bootstrap, window, lifecycle
│   │   ├── preload.ts         # Context bridge (secure IPC)
│   │   └── backend/
│   │       ├── transcriber.ts # whisper.cpp + OpenAI
│   │       ├── hotkey.ts      # uiohook-napi
│   │       ├── paster.ts      # Auto-paste into active app
│   │       ├── recordingWindow.ts
│   │       ├── tray.ts        # System tray icon
│   │       ├── db.ts          # SQLite (history)
│   │       └── settings.ts    # Preferences + API-key encryption
│   └── entitlements.mac.plist
├── src/                       # React frontend
│   ├── App.tsx
│   ├── pages/                 # Home, Settings, History, Onboarding
│   ├── components/
│   └── i18n/                  # en, es, zh, hi, ar
├── resources/whisper/         # Binaries + offline model
│   ├── bsb-001.dat            # ggml-base-q5_1 model
│   ├── darwin-arm64/whisper-cli
│   ├── darwin-x64/whisper-cli
│   ├── linux-x64/whisper-cli
│   └── win32-x64/whisper-cli.exe
├── scripts/                   # Build whisper, notarization, models, etc.
└── build-resources/           # Icons, installer sidebars, DMG bg
```

## Development

### Requirements

- Node.js 20+
- npm
- Linux: `libxrandr-dev`, `libxkbcommon-dev` (dependencies of `uiohook-napi`).
- To compile `whisper-cli` from source: a C++ toolchain (Xcode CLT on macOS, MSVC on Windows, gcc on Linux).

### Setup

```bash
npm install            # also runs electron-rebuild for native modules
npm run dev            # Vite + Electron in parallel, with renderer hot reload
```

The renderer is served at `http://localhost:7775`, and Electron loads it as soon as the port responds.

### Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev mode (Vite + Electron) with hot reload |
| `npm run build` | Production bundle (frontend + main) |
| `npm run typecheck` | Strict TypeScript across renderer and main |
| `npm run package` | Package for your current platform |
| `npm run package:mac` | Build + sign + notarize for macOS |
| `npm run package:win` | NSIS installer for Windows |
| `npm run package:linux` | AppImage + tar.gz for Linux |
| `npm run models:fetch` | Download the offline whisper model |

## Whisper binaries and models

Bisbi ships a bundled `whisper-cli` executable plus a single offline model file. Both come from the [`whisper.cpp`](https://github.com/ggerganov/whisper.cpp) project by Georgi Gerganov (`ggerganov` / `ggml-org`). We do not modify the source — we build the upstream binary, rename the model file, and drop them into `resources/whisper/`. The online (cloud) mode does not require any local model.

### `whisper-cli` executable

- Upstream repo: <https://github.com/ggerganov/whisper.cpp>
- Releases (used to track updates): <https://github.com/ggerganov/whisper.cpp/releases>
- License: MIT (see `THIRD_PARTY_NOTICES.md`)

We compile from source per platform with `scripts/build-whisper.sh` (macOS / Linux) and `scripts/build-whisper.ps1` (Windows). The git ref is controlled by the `WHISPER_REF` env var and defaults to `master`. To pin a specific upstream version, set `WHISPER_REF` to a tag (e.g. `v1.7.4`) before running the build script.

Binaries land in:

```
resources/whisper/darwin-arm64/whisper-cli
resources/whisper/darwin-x64/whisper-cli
resources/whisper/linux-x64/whisper-cli
resources/whisper/win32-x64/whisper-cli.exe
```

### GGML model file

The `.dat` file in `resources/whisper/` is a renamed `ggml-*.bin` weight distributed by the same upstream maintainer on Hugging Face:

- Model index: <https://huggingface.co/ggerganov/whisper.cpp>
- Direct file listing: <https://huggingface.co/ggerganov/whisper.cpp/tree/main>

| App setting | File in repo | Upstream model | Download URL |
| --- | --- | --- | --- |
| **Offline** | `bsb-001.dat` | `ggml-base-q5_1.bin` | <https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q5_1.bin> |

The offline model is intentionally kept small (under 100 MB) so it can ship inside the installer on every platform. It is the fallback when the user is offline or chooses the private mode; users who want the best quality should use the online (cloud) mode, which is handled server-side and needs no local model.

### Updating whisper

1. Pick a new upstream tag from <https://github.com/ggerganov/whisper.cpp/releases>.
2. Rebuild the binary on each target platform with `WHISPER_REF=<tag> scripts/build-whisper.sh` (or the `.ps1` equivalent).
3. If the model format changes, re-download the matching `ggml-*.bin` file from <https://huggingface.co/ggerganov/whisper.cpp> and rename it to `bsb-001.dat`.
4. Bump the version recorded in this README so we can tell at a glance which upstream release is shipping.

Currently shipping: **whisper.cpp `master` (unpinned)** — pin a tag here once the build script is set to a fixed `WHISPER_REF`.

## Distribution

Bisbi is distributed only as a **signed and notarized DMG** for macOS, an **NSIS installer** for Windows, and **AppImage / tar.gz** for Linux. Releases are published via GitHub Releases (owner: `jometa9`, repo: `Bisbi`), and the app includes auto-update.

## License and attributions

- App: see `LICENSE`.
- Third-party dependencies: see `THIRD_PARTY_NOTICES.md` (includes whisper.cpp under MIT).
