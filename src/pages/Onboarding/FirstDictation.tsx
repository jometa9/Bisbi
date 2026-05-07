import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '../../i18n';
import { HotkeyKeys } from '../../components/HotkeyKeys';
import { startRecording, type RecordingHandle } from '../../audio';
import { formatHotkeyAccelerator, useHotkeyLabels, type KeyPlatform } from '../../lib/hotkey';

interface Props {
  hotkey: string;
  platform: NodeJS.Platform | null;
  microphoneId: string | null;
  onContinue: () => void;
  onBack: () => void;
}

type DictationState =
  | 'waiting'
  | 'listening'
  | 'transcribing'
  | 'success'
  | 'silence'
  | 'failed';

const NO_VOICE_TIMEOUT_MS = 5000;

// Screen 4 — combined mic test + first real transcription. We tap into the
// global hotkey events the backend already broadcasts; on stop we ship the
// PCM through `transcribePreview` so the result lands in our box instead of
// being pasted into whatever app the user has in the background.
export function FirstDictation({
  hotkey,
  platform,
  microphoneId,
  onContinue,
  onBack,
}: Props) {
  const { t } = useTranslation();
  const keyPlatform: KeyPlatform = platform === 'darwin' ? 'mac' : 'win';
  const hotkeyLabels = useHotkeyLabels();

  const [state, setState] = useState<DictationState>('waiting');
  const [transcript, setTranscript] = useState('');

  const handleRef = useRef<RecordingHandle | null>(null);
  const chainRef = useRef<Promise<void>>(Promise.resolve());
  const sawAudioRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!window.bisbi) return;

    const offStart = window.bisbi.onRecordingStart(() => {
      chainRef.current = chainRef.current.then(async () => {
        sawAudioRef.current = false;
        setTranscript('');
        setState('listening');
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (!sawAudioRef.current) {
            setState('silence');
          }
        }, NO_VOICE_TIMEOUT_MS);
        try {
          handleRef.current = await startRecording({
            deviceId: microphoneId,
            onLevel: (lv) => {
              if (lv > 0.06) sawAudioRef.current = true;
              window.bisbi.sendRecordingLevel(lv);
            },
          });
        } catch (err) {
          console.error('[onboarding] mic start failed:', err);
          await window.bisbi.cancelRecording();
          setState('failed');
        }
      });
    });

    const offStop = window.bisbi.onRecordingStop(() => {
      chainRef.current = chainRef.current.then(async () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        const cur = handleRef.current;
        handleRef.current = null;
        if (!cur) {
          await window.bisbi.cancelRecording();
          return;
        }
        try {
          const { pcm, sampleRate, channels } = await cur.stop();
          // Tell the main process we are no longer holding a mic so its
          // recording-state machine settles back to idle. We deliberately
          // do NOT call submitAudio — that would route through the paste
          // pipeline and history.
          await window.bisbi.cancelRecording();
          if (!sawAudioRef.current) {
            setState('silence');
            return;
          }
          setState('transcribing');
          const text = await window.bisbi.onboarding.transcribePreview(
            pcm,
            sampleRate,
            channels
          );
          const cleaned = text.trim();
          if (!cleaned) {
            setState('failed');
            return;
          }
          setTranscript(cleaned);
          setState('success');
        } catch (err) {
          console.error('[onboarding] preview transcription failed:', err);
          setState('failed');
        }
      });
    });

    const offCancel = window.bisbi.onRecordingCancel(() => {
      chainRef.current = chainRef.current.then(async () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        const cur = handleRef.current;
        handleRef.current = null;
        cur?.cancel();
        setState('waiting');
      });
    });

    return () => {
      offStart();
      offStop();
      offCancel();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      handleRef.current?.cancel();
      handleRef.current = null;
    };
  }, [microphoneId]);

  const retry = () => {
    setTranscript('');
    setState('waiting');
  };

  const watermarkText =
    state === 'listening'
      ? t('home.watermark.listening')
      : state === 'transcribing'
      ? t('home.watermark.transcribing')
      : state === 'success'
      ? transcript
      : t('onboarding.dictation.samplePhrase');
  const showWatermark = watermarkText.length > 0;

  return (
    <div className="onb-screen">
      <h1 className="onb-title">{t('onboarding.dictation.title')}</h1>
      <p className="onb-subtitle">
        {t('onboarding.dictation.subtitle', {
          hotkey: formatHotkeyAccelerator(hotkey, keyPlatform, hotkeyLabels),
        })}
      </p>

      <div className="onb-phrase">{t('onboarding.dictation.samplePhrase')}</div>

      <div className="home-hotkey">
        {showWatermark && (
          <div className="home-hotkey-watermark" aria-hidden="true">
            {watermarkText}
          </div>
        )}
        <div className="home-hotkey-content">
          <span className="home-hotkey-label">{t('home.hotkeyLabel')}</span>
          <div className="home-hotkey-keys">
            <HotkeyKeys
              accel={hotkey}
              platform={keyPlatform}
              visual={state === 'listening' ? 'pressed' : 'idle'}
            />
          </div>
        </div>
      </div>

      {(state === 'silence' || state === 'failed') && (
        <p className="onb-error">
          {state === 'silence'
            ? t('onboarding.dictation.silenceError')
            : t('onboarding.dictation.failedError')}
        </p>
      )}

      {(state === 'silence' || state === 'failed') && (
        <button type="button" className="btn-secondary onb-retry" onClick={retry}>
          {t('onboarding.dictation.retry')}
        </button>
      )}

      <div className="onb-nav">
        <button type="button" className="btn-secondary onb-back" onClick={onBack}>
          {t('onboarding.back')}
        </button>
        <button
          type="button"
          className={`btn-primary onb-cta${state === 'success' ? ' onb-cta--success' : ''}`}
          onClick={onContinue}
        >
          {t('onboarding.dictation.continue')}
        </button>
      </div>
    </div>
  );
}
