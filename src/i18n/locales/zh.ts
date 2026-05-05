import type { Translations } from './en';

export const zh: Translations = {
  app: {
    brand: 'Bisbi',
    tabs: {
      home: '首页',
      history: '历史记录',
      settings: '设置',
    },
    status: {
      idle: '就绪',
      recording: '录音中',
      transcribing: '转写中',
    },
    loading: '加载中…',
    notElectron: {
      body: '此窗口必须从 Electron 中打开,全局快捷键、麦克风和转写功能才能正常工作。',
      devHint:
        '如果你在开发模式下,请在仓库根目录运行 {cmd},让 Electron 打开它自己的窗口。不要直接在浏览器中打开 {url}。',
    },
    resourcesMissing:
      '缺少 Whisper 资源。请查看 README 以了解如何将二进制文件和模型下载到 {path}。',
    micError:
      '无法访问麦克风。请确保 Bisbi 在系统设置中拥有权限。',
  },
  home: {
    greeting: {
      lateNight: '晚安',
      morning: '早上好',
      afternoon: '下午好',
      evening: '晚上好',
    },
    statusTitle: {
      idle: '准备聆听',
      recording: '正在录音',
      transcribing: '正在转写',
    },
    titleHint: '按下快捷键开始说话。',
    hotkeyLabel: '快捷键',
    hotkeyHintPaste: '文本会自动粘贴到你正在输入的位置。',
    hotkeyHintClipboard: '文本会复制到剪贴板。',
    todaySection: '今天',
    transcriptionsOne: '条转写',
    transcriptionsOther: '条转写',
    dictated: '已口述',
    lastLanguage: '上次语言',
    lastTranscriptionSection: '最近一次转写',
    empty: '还没有转写记录。试试你的快捷键。',
    relative: {
      justNow: '刚刚',
      minutes: '{n} 分钟前',
      hours: '{n} 小时前',
      days: '{n} 天前',
    },
  },
  history: {
    title: '最近的转写',
    clearAll: '全部清除',
    confirmClear: '确认清除所有历史记录吗?',
    empty: '还没有转写记录。试试你的快捷键。',
    copy: '复制',
    delete: '删除',
  },
  settings: {
    hotkey: {
      title: '键盘快捷键',
      description: '在任何应用中按下它即可开始和停止录音。',
      change: '更改',
      cancel: '取消',
    },
    handsFree: {
      title: '免提模式',
      description: '关闭时,按住快捷键进行录音(按住说话)。快速双击会锁定录音,直到你再次点击。',
      label: '点击开始,再次点击结束',
      hintOn: '已开启:点击快捷键一次开始,再次点击结束。',
      hintOff: '已关闭:按住快捷键即可录音。快速双击会锁定录音,这样你就可以松开按键。',
    },
    transcriptionLanguage: {
      title: '转写语言',
      description: 'Whisper 会自动检测语言。固定它可以提速。',
    },
    uiLanguage: {
      title: '应用语言',
      description: '界面使用的语言。默认情况下跟随操作系统。',
      system: '系统({detected})',
    },
    pasteMode: {
      title: '文本插入',
      description: '如何投放转写后的文本。',
      paste: '自动粘贴(Cmd/Ctrl+V)到当前应用',
      clipboard: '仅复制到剪贴板(由我自己粘贴)',
    },
    saveHistory: {
      title: '历史记录',
      description: '将转写保存到本地数据库中。',
      label: '在历史记录中保存转写',
    },
    precision: {
      title: '转写精度',
      description: '精度越高,结果越好,但耗时和消耗也更多。如果发现错误,请调整。',
      fast: {
        label: '快速',
        hint: '更少处理,几乎即时转写。适合发音清晰且单一语言的场景。',
      },
      balanced: {
        label: '均衡(推荐)',
        hint: '在速度与质量之间取得良好平衡,适合日常使用。',
      },
      high: {
        label: '高',
        hint: '处理更多、速度更慢,但对多语言混合、专业术语或嘈杂音频效果更好。',
      },
    },
    reset: '重置设置',
  },
  recording: {
    recording: '录音中',
    transcribing: '转写中…',
    idle: '就绪',
  },
  languages: {
    auto: '自动检测',
    en: '英语',
    es: '西班牙语',
    pt: '葡萄牙语',
    fr: '法语',
    it: '意大利语',
    de: '德语',
    zh: '中文',
    hi: '印地语',
    ar: '阿拉伯语',
  },
  uiLanguageOption: {
    en: 'English',
    es: 'Español',
    zh: '中文',
    hi: 'हिन्दी',
    ar: 'العربية',
  },
  tray: {
    tooltipIdle: 'Bisbi — 准备口述',
    tooltipRecording: 'Bisbi — 录音中…',
    tooltipTranscribing: 'Bisbi — 转写中…',
    openSettings: '打开设置',
    history: '历史记录',
    checkUpdates: '检查更新',
    version: '版本 {v}',
    quit: '退出',
  },
  errors: {
    hotkeyRegister: '无法注册快捷键 “{accel}”。请尝试其他组合。',
  },
};
