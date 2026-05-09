interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  value: T;
  onChange: (next: T) => void;
  options: Option<T>[];
  ariaLabel?: string;
  hint?: string;
}

export function SegmentedToggle<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  hint,
}: Props<T>) {
  return (
    <div className="segmented-toggle-wrap">
      <div
        className="segmented-toggle"
        role="radiogroup"
        aria-label={ariaLabel}
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={active}
              className={`segmented-toggle-btn${active ? ' active' : ''}`}
              onClick={() => onChange(opt.value)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {hint && <p className="segmented-toggle-hint">{hint}</p>}
    </div>
  );
}
