import { useEffect, useId, useState, type ReactNode } from 'react';

interface RangeProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  /** testo letto dal lettore di schermo */
  valueText: string;
  className?: string;
}

/** Slider con traccia piena fino al valore (stile del prototipo v2). */
export function Range({ label, value, min, max, step, onChange, valueText, className }: RangeProps) {
  const pc = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  return (
    <input
      className={`r${className ? ` ${className}` : ''}`}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={label}
      aria-valuetext={valueText}
      style={{ background: `linear-gradient(90deg, var(--ink) 0 ${pc}%, #e2e2df ${pc}% 100%)` }}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

export interface ChipOption<T> {
  label: ReactNode;
  value: T;
  title?: string;
  disabled?: boolean;
}

export function Chips<T>({
  options,
  isOn,
  onPick,
  label,
}: {
  options: ChipOption<T>[];
  isOn: (v: T) => boolean;
  onPick: (v: T) => void;
  label: string;
}) {
  return (
    <span className="chips" role="group" aria-label={label}>
      {options.map((o, i) => (
        <button
          key={i}
          type="button"
          className="chip"
          aria-pressed={isOn(o.value)}
          title={o.title}
          disabled={o.disabled}
          onClick={() => onPick(o.value)}
        >
          {o.label}
        </button>
      ))}
    </span>
  );
}

/** Scelta a segmenti (radiogroup), navigabile con le frecce. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  small,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  small?: boolean;
}) {
  const idx = options.findIndex((o) => o.value === value);
  return (
    <div className={`seg${small ? ' seg-small' : ''}`} role="radiogroup" aria-label={label}>
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          tabIndex={o.value === value ? 0 : -1}
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => {
            const d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
            if (!d) return;
            e.preventDefault();
            const next = options[(idx + d + options.length) % options.length]!;
            onChange(next.value);
            const group = e.currentTarget.parentElement;
            requestAnimationFrame(() => (group?.querySelector('[aria-checked="true"]') as HTMLElement | null)?.focus());
            void i;
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Campo numerico: si può svuotare mentre si scrive; il valore passa allo stato solo quando è valido. */
export function NumField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  hint,
}: {
  label: ReactNode;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: ReactNode;
}) {
  const id = useId();
  const [text, setText] = useState(String(value));
  useEffect(() => {
    setText((t) => (Number(t) === value ? t : String(value)));
  }, [value]);
  const commit = (t: string) => {
    const v = Number(t.replace(',', '.'));
    if (t.trim() === '' || !Number.isFinite(v)) return;
    if (min !== undefined && v < min) return;
    if (max !== undefined && v > max) return;
    onChange(v);
  };
  return (
    <span className="field">
      <label htmlFor={id}>
        {label}
        {hint}
      </label>
      <input
        id={id}
        className="num"
        type="number"
        inputMode="decimal"
        value={text}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          setText(e.target.value);
          commit(e.target.value);
        }}
        onBlur={() => setText(String(value))}
      />
    </span>
  );
}
