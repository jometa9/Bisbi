export type KeyPlatform = 'mac' | 'win';

const MAC_SHORT: Record<string, string> = {
  Cmd: '⌘',
  CommandOrControl: '⌘',
  Meta: '⌘',
  MetaLeft: 'L ⌘',
  MetaRight: 'R ⌘',
  Ctrl: '⌃',
  Control: '⌃',
  CtrlLeft: 'L ⌃',
  CtrlRight: 'R ⌃',
  Alt: '⌥',
  Option: '⌥',
  AltLeft: 'L ⌥',
  AltRight: 'R ⌥',
  Shift: '⇧',
  ShiftLeft: 'L ⇧',
  ShiftRight: 'R ⇧',
  Space: 'Space',
};

const WIN_SHORT: Record<string, string> = {
  Cmd: 'Win',
  CommandOrControl: 'Ctrl',
  Meta: 'Win',
  MetaLeft: 'L Win',
  MetaRight: 'R Win',
  Ctrl: 'Ctrl',
  Control: 'Ctrl',
  CtrlLeft: 'L Ctrl',
  CtrlRight: 'R Ctrl',
  Alt: 'Alt',
  Option: 'Alt',
  AltLeft: 'L Alt',
  AltRight: 'R Alt',
  Shift: 'Shift',
  ShiftLeft: 'L Shift',
  ShiftRight: 'R Shift',
  Space: 'Space',
};

const MAC_LONG: Record<string, string> = {
  Cmd: 'Command',
  CommandOrControl: 'Command',
  Meta: 'Command',
  MetaLeft: 'Left Command',
  MetaRight: 'Right Command',
  Ctrl: 'Control',
  Control: 'Control',
  CtrlLeft: 'Left Control',
  CtrlRight: 'Right Control',
  Alt: 'Option',
  Option: 'Option',
  AltLeft: 'Left Option',
  AltRight: 'Right Option',
  Shift: 'Shift',
  ShiftLeft: 'Left Shift',
  ShiftRight: 'Right Shift',
  Space: 'Space',
};

const WIN_LONG: Record<string, string> = {
  Cmd: 'Win',
  CommandOrControl: 'Ctrl',
  Meta: 'Win',
  MetaLeft: 'Left Win',
  MetaRight: 'Right Win',
  Ctrl: 'Ctrl',
  Control: 'Ctrl',
  CtrlLeft: 'Left Ctrl',
  CtrlRight: 'Right Ctrl',
  Alt: 'Alt',
  Option: 'Alt',
  AltLeft: 'Left Alt',
  AltRight: 'Right Alt',
  Shift: 'Shift',
  ShiftLeft: 'Left Shift',
  ShiftRight: 'Right Shift',
  Space: 'Space',
};

export function formatHotkeyPart(part: string, platform: KeyPlatform): string {
  const map = platform === 'mac' ? MAC_SHORT : WIN_SHORT;
  return map[part] ?? part;
}

export function formatHotkeyAccelerator(accel: string, platform: KeyPlatform): string {
  const map = platform === 'mac' ? MAC_LONG : WIN_LONG;
  return accel
    .split('+')
    .filter(Boolean)
    .map((p) => map[p] ?? p)
    .join(' + ');
}
