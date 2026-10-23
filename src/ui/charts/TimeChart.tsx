// Grafico a linee e aree su un asse temporale (pagine Storico e Versamenti), con valori al passaggio del mouse
// o con le frecce da tastiera.
import { useState, type ReactNode } from 'react';

export interface Line {
  name: string;
  color: string;
  values: (number | null)[];
  dash?: boolean;
  width?: number;
}

export interface Area {
  lo: number[];
  hi: number[];
  color: string;
  opacity?: number;
}

interface Props {
  labels: string[];
  lines: Line[];
  areas?: Area[];
  height?: number;
  /** etichette dell'asse X: indice → testo */
  xTicks: { i: number; label: string }[];
  yFormat: (v: number) => string;
  ariaLabel: string;
  /** riga del riquadro: nome e valore formattato per l'indice i */
  rows: (i: number) => { name: string; value: string; color?: string }[];
  title: (i: number) => ReactNode;
  /** forza lo zero nell'asse Y */
  fromZero?: boolean;
}

const W = 1000;

export function TimeChart({ labels, lines, areas = [], height = 340, xTicks, yFormat, ariaLabel, rows, title, fromZero = true }: Props) {
  const n = labels.length;
  const [hover, setHover] = useState<number | null>(null);
  const all = lines.flatMap((l) => l.values.filter((v): v is number => v !== null)).concat(areas.flatMap((a) => [...a.lo, ...a.hi]));
  const lo = fromZero ? Math.min(0, ...all) : Math.min(...all);
  const hi = Math.max(...all);
  const raw = (hi - lo) / 5 || 1;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((x) => x * mag).find((x) => x >= raw)!;
  const y0 = Math.floor(lo / step) * step;
  const y1 = Math.ceil(hi / step) * step;
  const H = height;
  const X = (i: number) => (n > 1 ? (i / (n - 1)) * W : W / 2);
  const Y = (v: number) => H - ((v - y0) / (y1 - y0)) * H;
  const path = (vals: (number | null)[]) => {
    let d = '';
    let pen = false;
    vals.forEach((v, i) => {
      if (v === null) {
        pen = false;
        return;
      }
      d += `${pen ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)} `;
      pen = true;
    });
    return d;
  };
  const area = (a: Area) => {
    let d = a.hi.map((v, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
    for (let i = n - 1; i >= 0; i--) d += ` L${X(i).toFixed(1)} ${Y(a.lo[i]!).toFixed(1)}`;
    return `${d} Z`;
  };
  const yTicks: number[] = [];
  for (let v = y0; v <= y1 + 1e-9; v += step) yTicks.push(v);
  const h = hover;
  const pc = h === null ? 0 : (X(h) / W) * 100;
  return (
    <div className="tc">
      <div className="tc-y" style={{ height: H }} aria-hidden="true">
        {yTicks.map((v) => (
          <span key={v} style={{ top: `${(Y(v) / H) * 100}%` }}>
            {yFormat(v)}
          </span>
        ))}
      </div>
      <div className="tc-main">
        <div
          className="tc-plot"
          tabIndex={0}
          role="group"
          aria-label={`${ariaLabel}. Usa le frecce sinistra e destra per leggere i valori.`}
          onMouseLeave={() => setHover(null)}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setHover(Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1)))));
          }}
          onKeyDown={(e) => {
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End') return;
            e.preventDefault();
            const cur = h ?? n - 1;
            setHover(e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : Math.max(0, Math.min(n - 1, cur + (e.key === 'ArrowLeft' ? -1 : 1))));
          }}
          onBlur={() => setHover(null)}
        >
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height={H} aria-hidden="true">
            <path d={yTicks.map((v) => `M0 ${Y(v).toFixed(1)} H${W}`).join(' ')} fill="none" stroke="#e6e6e3" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            {areas.map((a, i) => (
              <path key={i} d={area(a)} fill={a.color} fillOpacity={a.opacity ?? 1} />
            ))}
            {lines.map((l) => (
              <path
                key={l.name}
                d={path(l.values)}
                fill="none"
                stroke={l.color}
                strokeWidth={l.width ?? 3}
                strokeLinejoin="round"
                strokeDasharray={l.dash ? '6 5' : undefined}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>
          {h !== null && (
            <>
              <span className="tc-line" style={{ left: `${pc}%` }} />
              <span className="tc-box" style={{ left: `${pc}%`, transform: `translateX(${pc > 55 ? 'calc(-100% - 14px)' : '14px'})` }} aria-live="polite">
                <strong>{title(h)}</strong>
                {rows(h).map((r) => (
                  <span key={r.name} className="tc-row" style={r.color ? { borderLeftColor: r.color } : undefined}>
                    <span>{r.name}</span>
                    <strong>{r.value}</strong>
                  </span>
                ))}
              </span>
            </>
          )}
        </div>
        <div className="tc-x" aria-hidden="true">
          {xTicks.map((t, k) => (
            <span
              key={t.i}
              style={{ left: `${(X(t.i) / W) * 100}%`, transform: `translateX(${k === 0 && t.i === 0 ? '0' : t.i === n - 1 ? '-100%' : '-50%'})` }}
            >
              {t.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LegendItem({ color, label, dash, swatch }: { color: string; label: string; dash?: boolean; swatch?: boolean }) {
  return (
    <span className="leg">
      {swatch ? (
        <span className="leg-sw" style={{ background: color }} />
      ) : (
        <span className="leg-line" style={{ borderTopColor: color, borderTopStyle: dash ? 'dashed' : 'solid' }} />
      )}
      {label}
    </span>
  );
}
