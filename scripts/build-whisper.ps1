# Compila whisper-cli para Windows x64 y lo copia a
# resources/whisper/win32-x64/whisper-cli.exe
#
# Requisitos en la máquina:
#   - Visual Studio 2022 con C++ workload (o Build Tools standalone)
#   - CMake (en PATH)
#   - Git
#
# Uso (desde PowerShell, en la raíz del repo):
#   .\scripts\build-whisper.ps1

$ErrorActionPreference = 'Stop'

$RepoDir = Resolve-Path "$PSScriptRoot\..\"
$WorkDir = Join-Path $RepoDir ".cache\whisper-build"
$Dest = Join-Path $RepoDir "resources\whisper\win32-x64\whisper-cli.exe"
$WhisperRef = if ($env:WHISPER_REF) { $env:WHISPER_REF } else { 'master' }

Write-Host "→ build target: win32-x64"
Write-Host "→ dest: $Dest"

New-Item -ItemType Directory -Force -Path $WorkDir | Out-Null
Set-Location $WorkDir

if (-not (Test-Path whisper.cpp)) {
    git clone --depth=1 --branch $WhisperRef https://github.com/ggerganov/whisper.cpp.git
}
else {
    Set-Location whisper.cpp
    git fetch origin $WhisperRef
    git reset --hard FETCH_HEAD
    Set-Location ..
}

Set-Location whisper.cpp
if (Test-Path build) { Remove-Item -Recurse -Force build }

cmake -B build `
    -DGGML_METAL=OFF `
    -DBUILD_SHARED_LIBS=OFF `
    -DWHISPER_BUILD_EXAMPLES=ON `
    -DWHISPER_BUILD_TESTS=OFF `
    -DCMAKE_BUILD_TYPE=Release

cmake --build build --config Release --target whisper-cli -j

$Built = Join-Path (Get-Location) "build\bin\Release\whisper-cli.exe"
if (-not (Test-Path $Built)) {
    $Built = Join-Path (Get-Location) "build\bin\whisper-cli.exe"
}
if (-not (Test-Path $Built)) {
    Write-Error "No encontré whisper-cli.exe después del build"
    exit 1
}

New-Item -ItemType Directory -Force -Path (Split-Path $Dest) | Out-Null
Copy-Item -Force $Built $Dest

Write-Host "✓ binario copiado en: $Dest"
