import type { Translations } from './en';

export const es: Translations = {
  app: {
    brand: 'Bisbi',
    tabs: {
      home: 'Inicio',
      history: 'Historial',
      settings: 'Ajustes',
    },
    status: {
      idle: 'Listo',
      recording: 'Grabando',
      transcribing: 'Transcribiendo',
    },
    loading: 'Cargando…',
    notElectron: {
      body: 'Esta ventana tiene que abrirse desde Electron para que funcionen el hotkey global, el micrófono y la transcripción.',
      devHint:
        'Si estás en desarrollo, corré {cmd} en la raíz del repo y dejá que Electron abra su propia ventana. No abras {url} directamente en el browser.',
    },
    resourcesMissing:
      'Faltan los recursos de Whisper. Mirá el README para descargar el binario y el modelo en {path}.',
    micError:
      'No se pudo acceder al micrófono. Asegurate de que Bisbi tenga permiso en los ajustes del sistema.',
  },
  home: {
    greeting: {
      lateNight: 'Buenas noches',
      morning: 'Buen día',
      afternoon: 'Buenas tardes',
      evening: 'Buenas noches',
    },
    statusTitle: {
      idle: 'Listo para escuchar',
      recording: 'Grabando ahora',
      transcribing: 'Transcribiendo',
    },
    titleHint: 'Apretá el atajo y hablá.',
    hotkeyLabel: 'Atajo',
    hotkeyHintPaste: 'El texto se pega automáticamente donde estés escribiendo.',
    hotkeyHintClipboard: 'El texto se copia al portapapeles.',
    todaySection: 'Hoy',
    transcriptionsOne: 'transcripción',
    transcriptionsOther: 'transcripciones',
    dictated: 'dictado',
    lastLanguage: 'último idioma',
    lastTranscriptionSection: 'Última transcripción',
    empty: 'Todavía no hay transcripciones. Probá tu atajo.',
    relative: {
      justNow: 'hace un momento',
      minutes: 'hace {n} min',
      hours: 'hace {n} h',
      days: 'hace {n} d',
    },
  },
  history: {
    title: 'Transcripciones recientes',
    clearAll: 'Borrar todo',
    confirmClear: '¿Borrar todo el historial?',
    empty: 'Todavía no hay transcripciones. Probá tu atajo.',
    copy: 'Copiar',
    delete: 'Eliminar',
  },
  settings: {
    hotkey: {
      title: 'Atajo de teclado',
      description: 'Apretalo desde cualquier app para empezar y detener la grabación.',
      change: 'Cambiar',
      cancel: 'Cancelar',
    },
    handsFree: {
      title: 'Modo manos libres',
      description:
        'Si está apagado, mantené apretado el atajo para grabar (push-to-talk). Un doble toque rápido fija la grabación hasta que vuelvas a tocar.',
      label: 'Tocar para empezar, tocar para detener',
      hintOn: 'Activado: tocá el atajo una vez para empezar, tocá de nuevo para detener.',
      hintOff:
        'Desactivado: mantené apretado el atajo para grabar. Un doble toque rápido fija la grabación para que puedas soltar la tecla.',
    },
    transcriptionLanguage: {
      title: 'Idioma de transcripción',
      description: 'Whisper detecta el idioma automáticamente. Fijalo si querés más velocidad.',
    },
    uiLanguage: {
      title: 'Idioma de la app',
      description:
        'Idioma usado en la interfaz. Por defecto sigue al sistema operativo.',
      system: 'Sistema ({detected})',
    },
    pasteMode: {
      title: 'Inserción del texto',
      description: 'Cómo entregamos el texto transcripto.',
      paste: 'Pegar automáticamente (Cmd/Ctrl+V) en la app activa',
      clipboard: 'Solo copiar al portapapeles (yo pego cuando quiera)',
    },
    saveHistory: {
      title: 'Historial',
      description: 'Guarda las transcripciones en una base local.',
      label: 'Guardar transcripciones en el historial',
    },
    precision: {
      title: 'Precisión de la transcripción',
      description:
        'A más precisión, mejor resultado pero más demora y consumo. Cambialo si notás errores.',
      fast: {
        label: 'Rápida',
        hint: 'Menos esfuerzo, transcripción casi instantánea. Ideal si hablás claro y en un solo idioma.',
      },
      balanced: {
        label: 'Equilibrada (recomendada)',
        hint: 'Buen balance entre velocidad y calidad para uso diario.',
      },
      high: {
        label: 'Alta',
        hint: 'Mayor esfuerzo y demora, pero mejor con mezcla de idiomas, términos técnicos o audios ruidosos.',
      },
    },
    reset: 'Restablecer ajustes',
  },
  recording: {
    recording: 'Grabando',
    transcribing: 'Transcribiendo…',
    idle: 'Listo',
  },
  languages: {
    auto: 'Auto-detectar',
    en: 'Inglés',
    es: 'Español',
    pt: 'Portugués',
    fr: 'Francés',
    it: 'Italiano',
    de: 'Alemán',
    zh: 'Chino',
    hi: 'Hindi',
    ar: 'Árabe',
  },
  uiLanguageOption: {
    en: 'English',
    es: 'Español',
    zh: '中文',
    hi: 'हिन्दी',
    ar: 'العربية',
  },
  tray: {
    tooltipIdle: 'Bisbi — listo para dictar',
    tooltipRecording: 'Bisbi — grabando…',
    tooltipTranscribing: 'Bisbi — transcribiendo…',
    openSettings: 'Abrir ajustes',
    history: 'Historial',
    checkUpdates: 'Buscar actualizaciones',
    version: 'Versión {v}',
    quit: 'Salir',
  },
  errors: {
    hotkeyRegister: 'No se pudo registrar el atajo "{accel}". Probá otro.',
  },
};
