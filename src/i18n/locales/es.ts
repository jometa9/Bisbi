import type { Translations } from './en';

export const es: Translations = {
  app: {
    brand: 'Bisbi',
    tabs: {
      home: 'Inicio',
      history: 'Historial',
      settings: 'Ajustes',
      account: 'Cuenta',
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
    limitReached: 'Llegaste al límite del plan gratis de este mes.',
  },
  auth: {
    welcome: 'Bienvenido a Bisbi',
    tagline: 'La forma más rápida de dictar en cualquier app.',
    signIn: 'Iniciar sesión con Google',
    authenticating: 'Autenticando en el navegador…',
    redirecting: 'Volviendo a la aplicación…',
    validating: 'Validando sesión…',
    tryAgain: 'Reintentar',
    invalidToken: 'No pudimos validar la sesión. Iniciá sesión de nuevo.',
    connectionError: 'Error de conexión. Revisá tu internet e intentá de nuevo.',
    noAccount: '¿No tenés cuenta?',
    signUp: 'Registrate',
  },
  account: {
    title: 'Cuenta',
    plan: 'Plan',
    billing: 'Facturación',
    planFree: 'Free',
    planPro: 'Pro',
    planTrial: 'Prueba',
    planCanceling: 'Cancelando',
    trialEnds: 'Prueba finaliza {date}',
    renewsOn: 'Renueva {date}',
    cancelsOn: 'Cancela {date}',
    refresh: 'Actualizar plan',
    refreshing: 'Actualizando…',
    email: 'Email',
    name: 'Nombre',
    userId: 'ID de usuario',
    manageSubscription: 'Gestionar suscripción',
    upgradeToPro: 'Pasar a Pro',
    logout: 'Cerrar sesión',
    confirmLogout: '¿Cerrar sesión en Bisbi?',
    monthly: 'Mensual',
    annual: 'Anual',
    month: 'mes',
    forever: 'siempre',
    currentPlan: 'Plan actual',
    billingPeriod: 'Período de facturación',
    opening: 'Abriendo…',
    features: {
      dictation2k: '2.000 palabras / mes en escritorio',
      unlimited: 'Palabras ilimitadas en todos los dispositivos',
      allDevices: 'Mac y Windows',
      languages: 'Más de 100 idiomas',
      zeroRetention: 'Sin retención de datos',
      priority: 'Soporte prioritario',
    },
    profileSection: {
      title: 'Perfil',
      description: 'Cómo Bisbi te identifica en todos los dispositivos.',
    },
    subscriptionSection: {
      title: 'Suscripción',
      description: 'Gestiona tu plan y la facturación.',
    },
    sessionSection: {
      title: 'Sesión',
      description: 'Cerrar sesión en este dispositivo.',
    },
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
    activitySection: 'Tu actividad',
    transcriptionsOne: 'transcripción',
    transcriptionsOther: 'transcripciones',
    dictated: 'dictado',
    wordsOne: 'palabra transcrita',
    wordsOther: 'palabras transcritas',
    wpmLabel: 'palabras por minuto',
    recentSection: 'Transcripciones recientes',
    empty: 'Todavía no hay transcripciones. Probá tu atajo.',
    seeMore: 'Ver todas en Historial',
  },
  dateGroups: {
    today: 'Hoy',
    yesterday: 'Ayer',
  },
  history: {
    title: 'Historial',
    clearAll: 'Borrar todo',
    confirmClear: '¿Borrar todo el historial?',
    empty: 'Todavía no hay transcripciones. Probá tu atajo.',
    copy: 'Copiar',
    copied: 'Copiado',
    delete: 'Eliminar',
    savingDisabledTitle: 'El guardado del historial está apagado',
    savingDisabledHint:
      'Tus transcripciones no se están guardando, así que no aparecen acá. Volvelo a activar desde Ajustes para verlas de nuevo.',
    savingDisabledCta: 'Ir a ajustes',
  },
  settings: {
    hotkey: {
      title: 'Atajo de teclado',
      description: 'Apretalo desde cualquier app para empezar y detener la grabación.',
      change: 'Cambiar',
      cancel: 'Cancelar',
      waiting: 'Apretá las teclas que querés usar…',
    },
    handsFree: {
      title: 'Modo de grabación',
      description:
        'Elegí cómo querés que el atajo arranque y detenga la grabación.',
      pushToTalk: {
        label: 'Mantener apretado para hablar',
        hint: 'Dejás apretado el atajo mientras hablás y lo soltás para que se detenga. Tip: si hacés un doble toque rápido, la grabación queda fija y podés soltar la tecla.',
      },
      tapToToggle: {
        label: 'Manos libres',
        hint: 'Tocás el atajo una vez para empezar a grabar y lo tocás de nuevo para detener. Ideal para dictados largos en los que no querés tener una tecla apretada.',
      },
    },
    microphone: {
      title: 'Micrófono',
      description:
        'Elegí qué entrada usamos para grabar. Si el dispositivo no está conectado, usamos el del sistema.',
      systemDefault: 'Predeterminado del sistema',
      unnamed: 'Micrófono {index}',
    },
    transcriptionLanguage: {
      title: 'Idioma de transcripción',
      description: 'Whisper detecta el idioma automáticamente. Fijalo si querés más velocidad.',
      searchPlaceholder: 'Buscar un idioma…',
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
      description: 'Decidí si guardamos tus transcripciones para que puedas revisarlas más tarde.',
      enabled: {
        label: 'Guardar transcripciones',
        hint: 'Quedan en una base local en tu computadora. Las podés ver después desde la pestaña Historial.',
      },
      disabled: {
        label: 'No guardar',
        hint: 'Cada transcripción se descarta apenas se inserta el texto. No queda registro en ningún lado.',
      },
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
    suppressNonSpeech: {
      title: 'Sonidos no verbales',
      description:
        'Whisper puede transcribir anotaciones como "[Música]", "[Risas]" o "(suspiro)". Elegí si querés que aparezcan en el texto.',
      enabled: {
        label: 'Ocultarlos (recomendado)',
        hint: 'Solo se inserta lo que se habla. Los sonidos y ruidos de fondo se ignoran.',
      },
      disabled: {
        label: 'Mantenerlos',
        hint: 'Las anotaciones como [Música] o (suspiro) se incluyen en la transcripción.',
      },
    },
    vocabulary: {
      title: 'Vocabulario personalizado',
      description:
        'Nombres propios, marcas o jerga que Bisbi tiene que reconocer mejor. Se usa como contexto en cada transcripción.',
      placeholder: 'ej. María, ChatGPT, Buenos Aires, Excel, sprint, factura',
      hint: 'Mantenelo corto. Escribí los términos en el idioma que más dictás.',
    },
    dangerZone: {
      title: 'Restablecer y datos',
      description: 'Estas acciones son permanentes y no se pueden deshacer.',
    },
    reset: 'Restablecer ajustes',
    clearHistory: 'Borrar historial',
    confirmReset: '¿Restablecer todos los ajustes a sus valores por defecto?',
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
  update: {
    downloading: 'Descargando actualización… {percent}%',
    ready: 'Actualización lista: v{version}',
    restart: 'Reiniciar',
  },
  errors: {
    hotkeyRegister: 'No se pudo registrar el atajo "{accel}". Probá otro.',
  },
  common: {
    yes: 'Sí',
    no: 'No',
  },
};
