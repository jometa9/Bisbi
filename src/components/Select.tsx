import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
  searchTerms?: string;
}

interface Props<T extends string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (next: T) => void;
  ariaLabel?: string;
  searchPlaceholder?: string;
  variant?: 'default' | 'inline';
}

export function Select<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  searchPlaceholder,
  variant = 'default',
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value) ?? options[0];

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => {
      const haystack = `${opt.label} ${opt.searchTerms ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    const idx = filteredOptions.findIndex((o) => o.value === value);
    setActiveIndex(Math.max(0, idx));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeIndex >= filteredOptions.length) {
      setActiveIndex(filteredOptions.length === 0 ? 0 : filteredOptions.length - 1);
    }
  }, [filteredOptions, activeIndex]);

  useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const el = list?.children[activeIndex] as HTMLElement | undefined;
    if (!list || !el) return;
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    if (top < list.scrollTop) {
      list.scrollTo({ top, behavior: 'smooth' });
    } else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTo({ top: bottom - list.clientHeight, behavior: 'smooth' });
    }
  }, [activeIndex, open]);

  useEffect(() => {
    if (!open) return;
    if (searchPlaceholder) {
      searchRef.current?.focus({ preventScroll: true });
    } else {
      listRef.current?.focus({ preventScroll: true });
    }
  }, [open, searchPlaceholder]);

  // Compute fixed position so the menu never overflows the Electron window.
  useLayoutEffect(() => {
    if (!open || !rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    const MARGIN = 12;
    const availableBelow = window.innerHeight - rect.bottom - MARGIN;
    const left = Math.max(MARGIN, Math.min(rect.left, window.innerWidth - rect.width - MARGIN));
    setMenuStyle({
      top: rect.bottom + 4,
      left,
      width: rect.width,
      maxHeight: Math.min(300, Math.max(80, availableBelow)),
    });
  }, [open]);

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  };

  const commitActive = () => {
    const opt = filteredOptions[activeIndex];
    if (opt) {
      onChange(opt.value);
      setOpen(false);
    }
  };

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(filteredOptions.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(filteredOptions.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      commitActive();
    } else if (e.key === ' ' && !searchPlaceholder) {
      e.preventDefault();
      commitActive();
    }
  };

  return (
    <div
      className={`select${open ? ' open' : ''}${variant === 'inline' ? ' select--inline' : ''}`}
      ref={rootRef}
    >
      <button
        type="button"
        className="select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="select-trigger-label">{selected?.label}</span>
        {variant === 'inline' ? <PencilIcon /> : <ChevronIcon />}
      </button>
      {open && (
        <div className="select-menu" style={menuStyle}>
          {searchPlaceholder && (
            <div className="select-search">
              <SearchIcon />
              <input
                ref={searchRef}
                type="text"
                className="select-search-input"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onMenuKeyDown}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                spellCheck={false}
                autoComplete="off"
              />
            </div>
          )}
          <ul
            className="select-list"
            role="listbox"
            tabIndex={-1}
            ref={listRef}
            onKeyDown={onMenuKeyDown}
            aria-label={ariaLabel}
          >
            {filteredOptions.length === 0 ? (
              <li className="select-empty" role="presentation">
                —
              </li>
            ) : (
              filteredOptions.map((opt, i) => {
                const isSelected = opt.value === value;
                const isActive = i === activeIndex;
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    className={`select-option${isSelected ? ' selected' : ''}${isActive ? ' active' : ''}`}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                  >
                    <span className="select-option-label">{opt.label}</span>
                    {isSelected && <CheckIcon />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="select-chevron"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 4.5L6 7.5L9 4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      className="select-pencil"
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8.2 1.8L10.2 3.8L4 10H2V8L8.2 1.8Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="select-check"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 7.5L5.5 10L11 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className="select-search-icon"
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M9 9L12 12"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
