# Bisbi

## Whisper binaries and models

Bisbi ships a bundled `whisper-cli` executable plus two model files. Both come
from the [`whisper.cpp`](https://github.com/ggerganov/whisper.cpp) project by
Georgi Gerganov (`ggerganov` / `ggml-org`). We do not modify the source — we
build the upstream binary, rename the model files, and drop them into
`resources/whisper/`.

### `whisper-cli` executable

- Upstream repo: <https://github.com/ggerganov/whisper.cpp>
- Releases (used to track updates): <https://github.com/ggerganov/whisper.cpp/releases>
- License: MIT (see `THIRD_PARTY_NOTICES.md`)

We compile from source per platform with `scripts/build-whisper.sh`
(macOS / Linux) and `scripts/build-whisper.ps1` (Windows). The git ref is
controlled by the `WHISPER_REF` env var and defaults to `master`. To pin a
specific upstream version, set `WHISPER_REF` to a tag (e.g. `v1.7.4`) before
running the build script.

Binaries land in:

```
resources/whisper/darwin-arm64/whisper-cli
resources/whisper/darwin-x64/whisper-cli
resources/whisper/linux-x64/whisper-cli
resources/whisper/win32-x64/whisper-cli.exe
```

### GGML model files

The two `.dat` files in `resources/whisper/` are renamed `ggml-*.bin` weights
distributed by the same upstream maintainer on Hugging Face:

- Model index: <https://huggingface.co/ggerganov/whisper.cpp>
- Direct file listing: <https://huggingface.co/ggerganov/whisper.cpp/tree/main>

| App setting    | File in repo     | Upstream model                | Download URL |
| -------------- | ---------------- | ----------------------------- | ------------ |
| **Fast**       | `bsb-001.dat`    | `ggml-base-q5_1.bin`          | <https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base-q5_1.bin> |
| **Accurate**   | `bsb-002.dat`    | `ggml-large-v3-turbo-q5_0.bin`| <https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo-q5_0.bin> |

Per-platform default precision (see `electron/src/buildConfig.ts`):

- Windows → `fast` (CPU-bound; the accurate model is too heavy for real-time
  use without GPU acceleration).
- macOS / Linux → `accurate` (Metal / native acceleration handles it fine).

### Updating

1. Pick a new upstream tag from
   <https://github.com/ggerganov/whisper.cpp/releases>.
2. Rebuild the binary on each target platform with
   `WHISPER_REF=<tag> scripts/build-whisper.sh` (or the `.ps1` equivalent).
3. If the model format changes, re-download the matching `ggml-*.bin` files
   from <https://huggingface.co/ggerganov/whisper.cpp> and rename them to
   `bsb-001.dat` (fast) and `bsb-002.dat` (accurate).
4. Bump the version recorded in this README so we can tell at a glance which
   upstream release is shipping.

Currently shipping: **whisper.cpp `master` (unpinned)** — pin a tag here once
the build script is set to a fixed `WHISPER_REF`.
