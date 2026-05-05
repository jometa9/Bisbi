#!/usr/bin/env bash
# Compila whisper-cli para la plataforma actual y lo copia a
# resources/whisper/<platform>-<arch>/whisper-cli
#
# Hay que correrlo en cada máquina target:
#   - Mac arm64 (M1/M2/M3): GGML_METAL=ON (default)
#   - Mac x64 (Intel):       GGML_METAL=OFF (Metal anda mal en x64)
#   - Linux x64:             GGML_METAL=OFF
#   - Windows x64:           usar scripts/build-whisper.ps1 desde PowerShell
#
# El binario resultante es un solo archivo, sin dylibs externas.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="${REPO_DIR}/.cache/whisper-build"
WHISPER_REF="${WHISPER_REF:-master}"

uname_s="$(uname -s)"
uname_m="$(uname -m)"

case "$uname_s" in
  Darwin)
    case "$uname_m" in
      arm64)  PLATFORM_DIR="darwin-arm64"; METAL_FLAG="-DGGML_METAL=ON" ;;
      x86_64) PLATFORM_DIR="darwin-x64";   METAL_FLAG="-DGGML_METAL=OFF" ;;
      *) echo "Arquitectura no soportada: $uname_m"; exit 1 ;;
    esac
    ;;
  Linux)
    PLATFORM_DIR="linux-x64"; METAL_FLAG="-DGGML_METAL=OFF"
    ;;
  *)
    echo "Plataforma no soportada: $uname_s"; exit 1
    ;;
esac

DEST="${REPO_DIR}/resources/whisper/${PLATFORM_DIR}/whisper-cli"

echo "→ build target: ${PLATFORM_DIR}"
echo "→ dest: ${DEST}"

mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

if [ ! -d whisper.cpp ]; then
  git clone --depth=1 --branch "${WHISPER_REF}" \
    https://github.com/ggerganov/whisper.cpp.git
else
  (cd whisper.cpp && git fetch origin "${WHISPER_REF}" && git reset --hard FETCH_HEAD)
fi

cd whisper.cpp
rm -rf build
cmake -B build "${METAL_FLAG}" \
  -DBUILD_SHARED_LIBS=OFF \
  -DWHISPER_BUILD_EXAMPLES=ON \
  -DWHISPER_BUILD_TESTS=OFF \
  -DCMAKE_BUILD_TYPE=Release

cmake --build build --config Release --target whisper-cli -j

mkdir -p "$(dirname "$DEST")"
cp build/bin/whisper-cli "$DEST"
chmod +x "$DEST"

echo "✓ binario copiado en: $DEST"
"$DEST" --help 2>/dev/null | head -3 || true
