import { useState, useRef, useEffect } from 'react';
import type { AppSettings } from '../types';

interface Props {
  settings: AppSettings;
  onChange: (patch: Partial<AppSettings>) => Promise<void>;
  onReset: () => Promise<void>;
}

const LANGUAGES: { value: string; label: string }[] = [
  { value: 'auto', label: 'Auto-detectar' },
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'Inglés' },
  { value: 'pt', label: 'Portugués' },
  { value: 'fr', label: 'Francés' },
  { value: 'it', label: 'Italiano' },
  { value: 'de', label: 'Alemán' },
];

export function Settings({ settings, onChange, onReset }: Props) {
  return (
    <div className="settings">
      <Section
        title="Atajo de teclado"
        description="Apretalo desde cualquier app para empezar y detener la grabación."
      >
        <HotkeyInput
          value={settings.hotkey}
          onChange={(hotkey) => onChange({ hotkey })}
        />
      </Section>

      <Section
        title="Idioma"
        description="Whisper detecta el idioma automáticamente. Fijalo si querés más velocidad."
      >
        <select
          value={settings.language}
          onChange={(e) => onChange({ language: e.target.value })}
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </Section>

      <Section
        title="Inserción del texto"
        description="Cómo entregamos el texto transcripto."
      >
        <label className="radio">
          <input
            type="radio"
            checked={settings.pasteMode === 'paste'}
            onChange={() => onChange({ pasteMode: 'paste' })}
          />
          <span>Pegar automáticamente (Cmd/Ctrl+V) en la app activa</span>
        </label>
        <label className="radio">
          <input
            type="radio"
            checked={settings.pasteMode === 'clipboard'}
            onChange={() => onChange({ pasteMode: 'clipboard' })}
          />
          <span>Solo copiar al portapapeles (yo pego cuando quiera)</span>
        </label>
      </Section>

      <Section title="Historial" description="Guarda las transcripciones en una base local.">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={settings.saveHistory}
            onChange={(e) => onChange({ saveHistory: e.target.checked })}
          />
          <span>Guardar transcripciones en el historial</span>
        </label>
      </Section>

      <div className="actions">
        <button className="btn-secondary" onClick={onReset}>
          Restablecer ajustes
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="section">
      <header>
        <h3>{title}</h3>
        <p>{description}</p>
      </header>
      <div className="section-body">{children}</div>
    </section>
  );
}

function HotkeyInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [capturing, setCapturing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    if (!capturing) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      const accel = keyEventToAccelerator(e);
      if (accel) {
        setDraft(accel);
        if (isFinalAccelerator(accel)) {
          setCapturing(false);
          onChange(accel);
        }
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [capturing, onChange]);

  return (
    <div className="hotkey-input" ref={ref}>
      <code className={capturing ? 'capturing' : ''}>{draft}</code>
      <button
        className="btn-secondary"
        onClick={() => {
          setCapturing((c) => !c);
        }}
      >
        {capturing ? 'Cancelar' : 'Cambiar'}
      </button>
    </div>
  );
}

function keyEventToAccelerator(e: KeyboardEvent): string | null {
  const parts: string[] = [];
  if (e.metaKey) parts.push('Cmd');
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  const key = normalizeKey(e.key, e.code);
  if (!key) return parts.join('+');
  parts.push(key);
  return parts.join('+');
}

function isFinalAccelerator(accel: string): boolean {
  // Require at least one non-modifier key.
  const lastPart = accel.split('+').pop() ?? '';
  return !['Cmd', 'Ctrl', 'Alt', 'Shift'].includes(lastPart);
}

function normalizeKey(key: string, code: string): string | null {
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) return null;
  if (key === ' ' || code === 'Space') return 'Space';
  if (/^[a-z]$/i.test(key)) return key.toUpperCase();
  if (/^F\d+$/.test(key)) return key;
  if (/^Arrow/.test(key)) return key.replace('Arrow', '');
  if (key.length === 1) return key;
  return key;
}
