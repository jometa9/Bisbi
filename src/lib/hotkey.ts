import { useMemo } from 'react';
import { useTranslation } from '../i18n';

export type KeyPlatform = 'mac' | 'win';

export interface HotkeyLabels {
  command: string;
  leftCommand: string;
  rightCommand: string;
  control: string;
  leftControl: string;
  rightControl: string;
  option: string;
  leftOption: string;
  rightOption: string;
  alt: string;
  leftAlt: string;
  rightAlt: string;
  shift: string;
  leftShift: string;
  rightShift: string;
  win: string;
  leftWin: string;
  rightWin: string;
  ctrl: string;
  leftCtrl: string;
  rightCtrl: string;
  space: string;
  capsLock: string;
  shortLeft: string;
  shortRight: string;
}

const SYMBOL_CMD = '⌘';
const SYMBOL_CTRL = '⌃';
const SYMBOL_OPT = '⌥';
const SYMBOL_SHIFT = '⇧';

function macShort(part: string, l: HotkeyLabels): string | null {
  switch (part) {
    case 'Cmd':
    case 'CommandOrControl':
    case 'Meta':
      return SYMBOL_CMD;
    case 'MetaLeft':
      return `${l.shortLeft} ${SYMBOL_CMD}`;
    case 'MetaRight':
      return `${l.shortRight} ${SYMBOL_CMD}`;
    case 'Ctrl':
    case 'Control':
      return SYMBOL_CTRL;
    case 'CtrlLeft':
      return `${l.shortLeft} ${SYMBOL_CTRL}`;
    case 'CtrlRight':
      return `${l.shortRight} ${SYMBOL_CTRL}`;
    case 'Alt':
    case 'Option':
      return SYMBOL_OPT;
    case 'AltLeft':
      return `${l.shortLeft} ${SYMBOL_OPT}`;
    case 'AltRight':
      return `${l.shortRight} ${SYMBOL_OPT}`;
    case 'Shift':
      return SYMBOL_SHIFT;
    case 'ShiftLeft':
      return `${l.shortLeft} ${SYMBOL_SHIFT}`;
    case 'ShiftRight':
      return `${l.shortRight} ${SYMBOL_SHIFT}`;
    case 'Space':
      return l.space;
    case 'CapsLock':
      return l.capsLock;
    default:
      return null;
  }
}

function winShort(part: string, l: HotkeyLabels): string | null {
  switch (part) {
    case 'Cmd':
    case 'Meta':
      return l.win;
    case 'MetaLeft':
      return `${l.shortLeft} ${l.win}`;
    case 'MetaRight':
      return `${l.shortRight} ${l.win}`;
    case 'CommandOrControl':
    case 'Ctrl':
    case 'Control':
      return l.ctrl;
    case 'CtrlLeft':
      return `${l.shortLeft} ${l.ctrl}`;
    case 'CtrlRight':
      return `${l.shortRight} ${l.ctrl}`;
    case 'Alt':
    case 'Option':
      return l.alt;
    case 'AltLeft':
      return `${l.shortLeft} ${l.alt}`;
    case 'AltRight':
      return `${l.shortRight} ${l.alt}`;
    case 'Shift':
      return l.shift;
    case 'ShiftLeft':
      return `${l.shortLeft} ${l.shift}`;
    case 'ShiftRight':
      return `${l.shortRight} ${l.shift}`;
    case 'Space':
      return l.space;
    case 'CapsLock':
      return l.capsLock;
    default:
      return null;
  }
}

function macLong(part: string, l: HotkeyLabels): string | null {
  switch (part) {
    case 'Cmd':
    case 'CommandOrControl':
    case 'Meta':
      return l.command;
    case 'MetaLeft':
      return l.leftCommand;
    case 'MetaRight':
      return l.rightCommand;
    case 'Ctrl':
    case 'Control':
      return l.control;
    case 'CtrlLeft':
      return l.leftControl;
    case 'CtrlRight':
      return l.rightControl;
    case 'Alt':
    case 'Option':
      return l.option;
    case 'AltLeft':
      return l.leftOption;
    case 'AltRight':
      return l.rightOption;
    case 'Shift':
      return l.shift;
    case 'ShiftLeft':
      return l.leftShift;
    case 'ShiftRight':
      return l.rightShift;
    case 'Space':
      return l.space;
    case 'CapsLock':
      return l.capsLock;
    default:
      return null;
  }
}

function winLong(part: string, l: HotkeyLabels): string | null {
  switch (part) {
    case 'Cmd':
    case 'Meta':
      return l.win;
    case 'MetaLeft':
      return l.leftWin;
    case 'MetaRight':
      return l.rightWin;
    case 'CommandOrControl':
    case 'Ctrl':
    case 'Control':
      return l.ctrl;
    case 'CtrlLeft':
      return l.leftCtrl;
    case 'CtrlRight':
      return l.rightCtrl;
    case 'Alt':
    case 'Option':
      return l.alt;
    case 'AltLeft':
      return l.leftAlt;
    case 'AltRight':
      return l.rightAlt;
    case 'Shift':
      return l.shift;
    case 'ShiftLeft':
      return l.leftShift;
    case 'ShiftRight':
      return l.rightShift;
    case 'Space':
      return l.space;
    case 'CapsLock':
      return l.capsLock;
    default:
      return null;
  }
}

export function formatHotkeyPart(
  part: string,
  platform: KeyPlatform,
  labels: HotkeyLabels
): string {
  const resolved = platform === 'mac' ? macShort(part, labels) : winShort(part, labels);
  return resolved ?? part;
}

export function formatHotkeyAccelerator(
  accel: string,
  platform: KeyPlatform,
  labels: HotkeyLabels
): string {
  const resolve = platform === 'mac' ? macLong : winLong;
  return accel
    .split('+')
    .filter(Boolean)
    .map((p) => resolve(p, labels) ?? p)
    .join(' + ');
}

export function useHotkeyLabels(): HotkeyLabels {
  const { t } = useTranslation();
  return useMemo<HotkeyLabels>(
    () => ({
      command: t('keys.command'),
      leftCommand: t('keys.leftCommand'),
      rightCommand: t('keys.rightCommand'),
      control: t('keys.control'),
      leftControl: t('keys.leftControl'),
      rightControl: t('keys.rightControl'),
      option: t('keys.option'),
      leftOption: t('keys.leftOption'),
      rightOption: t('keys.rightOption'),
      alt: t('keys.alt'),
      leftAlt: t('keys.leftAlt'),
      rightAlt: t('keys.rightAlt'),
      shift: t('keys.shift'),
      leftShift: t('keys.leftShift'),
      rightShift: t('keys.rightShift'),
      win: t('keys.win'),
      leftWin: t('keys.leftWin'),
      rightWin: t('keys.rightWin'),
      ctrl: t('keys.ctrl'),
      leftCtrl: t('keys.leftCtrl'),
      rightCtrl: t('keys.rightCtrl'),
      space: t('keys.space'),
      capsLock: t('keys.capsLock'),
      shortLeft: t('keys.shortLeft'),
      shortRight: t('keys.shortRight'),
    }),
    [t]
  );
}
