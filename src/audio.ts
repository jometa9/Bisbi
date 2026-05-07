const TARGET_SAMPLE_RATE = 16000;
const CHANNELS = 1;

export interface RecordingHandle {
  stop: () => Promise<{ pcm: ArrayBuffer; sampleRate: number; channels: number }>;
  cancel: () => void;
}

export interface StartRecordingOptions {
  onLevel?: (level: number) => void;
  deviceId?: string | null;
}

export async function startRecording(
  opts: StartRecordingOptions = {}
): Promise<RecordingHandle> {
  const deviceId = await resolveDeviceId(opts.deviceId ?? null);
  const audio: MediaTrackConstraints = {
    channelCount: 1,
    sampleRate: 48000,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };
  if (deviceId) audio.deviceId = { exact: deviceId };
  const stream = await navigator.mediaDevices.getUserMedia({
    audio,
    video: false,
  });

  const ctx = new AudioContext();
  const source = ctx.createMediaStreamSource(stream);
  const processor = ctx.createScriptProcessor(4096, 1, 1);

  const sourceSampleRate = ctx.sampleRate;
  const chunks: Float32Array[] = [];
  let stopped = false;

  processor.onaudioprocess = (event) => {
    if (stopped) return;
    const input = event.inputBuffer.getChannelData(0);
    chunks.push(new Float32Array(input));
    if (opts.onLevel) {
      let sum = 0;
      for (let i = 0; i < input.length; i++) sum += input[i]! * input[i]!;
      const rms = Math.sqrt(sum / input.length);
      opts.onLevel(Math.min(1, rms * 4));
    }
  };

  source.connect(processor);
  processor.connect(ctx.destination);

  const cleanup = () => {
    stopped = true;
    try { processor.disconnect(); } catch {}
    try { source.disconnect(); } catch {}
    for (const t of stream.getTracks()) t.stop();
    void ctx.close().catch(() => {});
  };

  return {
    stop: async () => {
      stopped = true;
      const merged = mergeFloat32(chunks);
      cleanup();
      const downsampled = downsampleBuffer(merged, sourceSampleRate, TARGET_SAMPLE_RATE);
      const pcm16 = floatTo16BitPcm(downsampled);
      return {
        pcm: pcm16.buffer as ArrayBuffer,
        sampleRate: TARGET_SAMPLE_RATE,
        channels: CHANNELS,
      };
    },
    cancel: () => cleanup(),
  };
}

function mergeFloat32(chunks: Float32Array[]): Float32Array {
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Float32Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

function downsampleBuffer(buffer: Float32Array, srcRate: number, dstRate: number): Float32Array {
  if (dstRate === srcRate) return buffer;
  if (dstRate > srcRate) throw new Error('Downsample-only supported');
  const ratio = srcRate / dstRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < newLength) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i]!;
      count++;
    }
    result[offsetResult] = count > 0 ? accum / count : 0;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

export interface MicrophoneDevice {
  deviceId: string;
  label: string;
}

export async function listMicrophones(): Promise<MicrophoneDevice[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((d) => d.kind === 'audioinput')
      .map((d) => ({ deviceId: d.deviceId, label: d.label }));
  } catch {
    return [];
  }
}

async function resolveDeviceId(preferred: string | null): Promise<string | null> {
  if (!preferred) return null;
  const mics = await listMicrophones();
  return mics.some((m) => m.deviceId === preferred) ? preferred : null;
}

function floatTo16BitPcm(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]!));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}
