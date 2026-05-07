"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelFileForPrecision = modelFileForPrecision;
exports.whisperBinaryPath = whisperBinaryPath;
exports.whisperModelPath = whisperModelPath;
exports.checkResources = checkResources;
exports.transcribePcm = transcribePcm;
const electron_1 = require("electron");
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const crypto_1 = require("crypto");
const buildConfig_1 = require("../buildConfig");
function modelFileForPrecision(precision) {
    return buildConfig_1.WHISPER_MODELS[precision] ?? buildConfig_1.WHISPER_MODELS[buildConfig_1.BUILD_CONFIG.DEFAULT_PRECISION];
}
function platformDir() {
    const platform = process.platform;
    const arch = process.arch;
    if (platform === 'darwin')
        return arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64';
    if (platform === 'win32')
        return 'win32-x64';
    if (platform === 'linux')
        return 'linux-x64';
    throw new Error(`Plataforma no soportada: ${platform}-${arch}`);
}
function whisperBinaryName() {
    return process.platform === 'win32' ? 'whisper-cli.exe' : 'whisper-cli';
}
function resourceRoot() {
    if (electron_1.app.isPackaged) {
        return path_1.default.join(process.resourcesPath, 'whisper');
    }
    return path_1.default.resolve(__dirname, '..', '..', '..', 'resources', 'whisper');
}
function whisperBinaryPath() {
    return path_1.default.join(resourceRoot(), platformDir(), whisperBinaryName());
}
function whisperModelPath(precision = buildConfig_1.BUILD_CONFIG.DEFAULT_PRECISION) {
    return path_1.default.join(resourceRoot(), modelFileForPrecision(precision));
}
function checkResources(precision = buildConfig_1.BUILD_CONFIG.DEFAULT_PRECISION) {
    const binaryPath = whisperBinaryPath();
    const modelPath = whisperModelPath(precision);
    const missing = [];
    if (!fs_1.default.existsSync(binaryPath))
        missing.push(binaryPath);
    if (!fs_1.default.existsSync(modelPath))
        missing.push(modelPath);
    return { ok: missing.length === 0, binaryPath, modelPath, missing };
}
function writeWavFile(pcm, sampleRate, channels) {
    const bitsPerSample = 16;
    const byteRate = (sampleRate * channels * bitsPerSample) / 8;
    const blockAlign = (channels * bitsPerSample) / 8;
    const dataSize = pcm.length;
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);
    const tmpDir = path_1.default.join(os_1.default.tmpdir(), 'bisbi');
    fs_1.default.mkdirSync(tmpDir, { recursive: true });
    const file = path_1.default.join(tmpDir, `${(0, crypto_1.randomUUID)()}.wav`);
    fs_1.default.writeFileSync(file, Buffer.concat([header, pcm]));
    return file;
}
async function transcribePcm(pcm, sampleRate, channels, opts) {
    const check = checkResources(opts.precision);
    if (!check.ok) {
        throw new Error(`Falta el binario o el modelo de whisper.cpp.\n` +
            `Esperados:\n  - ${check.binaryPath}\n  - ${check.modelPath}\n` +
            `Ver README para descargarlos.`);
    }
    const wavPath = writeWavFile(pcm, sampleRate, channels);
    const startedAt = Date.now();
    const bytesPerFrame = 2 * Math.max(1, channels);
    const audioDurationMs = Math.round((pcm.length / (sampleRate * bytesPerFrame)) * 1000);
    try {
        const args = [
            '-m', check.modelPath,
            '-f', wavPath,
            '-l', opts.language || 'auto',
            '-otxt',
            '-nt',
            '-t', String(opts.threads ?? Math.max(2, Math.floor(os_1.default.cpus().length / 2))),
        ];
        args.push('--temperature', '0.0');
        args.push('--no-speech-thold', '0.6');
        args.push('--suppress-nst');
        if (opts.precision === 'accurate') {
            args.push('-bs', '5');
            args.push('-fa');
        }
        const prompt = opts.vocabulary?.trim();
        if (prompt) {
            args.push('--prompt', prompt);
        }
        const text = await runWhisper(check.binaryPath, args, wavPath);
        const durationMs = Date.now() - startedAt;
        return {
            text: text.trim(),
            language: opts.language === 'auto' ? null : opts.language,
            durationMs,
            audioDurationMs,
            modelFile: modelFileForPrecision(opts.precision),
        };
    }
    finally {
        try {
            fs_1.default.unlinkSync(wavPath);
        }
        catch { }
        const txt = `${wavPath}.txt`;
        try {
            fs_1.default.unlinkSync(txt);
        }
        catch { }
    }
}
function runWhisper(bin, args, wavPath) {
    return new Promise((resolve, reject) => {
        const child = (0, child_process_1.spawn)(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
        let stderr = '';
        child.stdout.on('data', () => { });
        child.stderr.on('data', (d) => { stderr += d.toString(); });
        child.on('error', (err) => reject(err));
        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`whisper-cli exited ${code}: ${stderr.slice(-500)}`));
                return;
            }
            const txtPath = `${wavPath}.txt`;
            if (!fs_1.default.existsSync(txtPath)) {
                resolve('');
                return;
            }
            try {
                const text = fs_1.default.readFileSync(txtPath, 'utf8');
                resolve(text);
            }
            catch (err) {
                reject(err instanceof Error ? err : new Error(String(err)));
            }
        });
    });
}
