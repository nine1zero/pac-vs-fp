// Capitale netto nei tre scenari: nel tempo (X = anno di uscita) o al variare del differenziale, con i pareggi.
import { euroK } from '../format';
import { SCENARIO_COLORS } from './Bars';

export interface Marker {
  /** posizione in unità dell'asse X */
  x: number;
  y: number;
  label: string;
}

interface Props {
  xs: number[];
  /** series[s][i] */
  series: number[][];
  markers: Marker[];
  xTicks: { x: number; label: string }[];
  xLabel: string;
  ariaLabel: string;
  /** linea verticale tratteggiata (valore scelto) */
  cursor?: { x: number; label: string };
}

const W = 1000;
const H = 320;
const LINE_WIDTHS = [7, 4.5, 2.5];

export function LineChart({ xs, series, markers, xTicks, xLabel, ariaLabel, cursor }: Props) {
  const all = series.flat();
  const lo = Math.min(0, ...all);
  const hi = Math.max(...all);
  const raw = (hi - lo) / 4 || 1;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((x) => x * mag).find((x) => x >= raw)!;
  const y0 = Math.floor(lo / step) * step;
  const y1 = Math.ceil(hi / step) * step;
  const x0 = xs[0]!;
  const x1 = xs[xs.length - 1]!;
  const X = (x: number) => (x1 === x0 ? W / 2 : ((x - x0) / (x1 - x0)) * W);
  const Y = (v: number) => H - ((v - y0) / (y1 - y0)) * H;
  const path = (a: number[]) => a.map((v, i) => `${i ? 'L' : 'M'}${X(xs[i]!).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ');
  const yTicks: number[] = [];
  for (let v = y0; v <= y1 + 1e-6; v += step) yTicks.push(v);
  return (
    <div className="lc">
      <div className="lc-y" aria-hidden="true">
        {yTicks.map((v) => (
          <span key={v} style={{ top: `${(Y(v) / H) * 100}%` }}>
            {Math.abs(v) < 1 ? '0 €' : euroK(v)}
          </span>
        ))}
      </div>
      <div className="lc-main">
        <div className="lc-plot">
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height={H} role="img" aria-label={ariaLabel}>
            <path d={yTicks.map((v) => `M0 ${Y(v).toFixed(1)} H${W}`).join(' ')} fill="none" stroke="#e2e2df" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            {/* spessori decrescenti: se due scenari coincidono, la linea sotto resta visibile come bordo */}
            {series.map((s, i) => (
              <path key={i} d={path(s)} fill="none" stroke={SCENARIO_COLORS[i]} strokeWidth={LINE_WIDTHS[i]} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            ))}
          </svg>
          {cursor && (
            <>
              <span className="lc-cursor" style={{ left: `${(X(cursor.x) / W) * 100}%` }} aria-hidden="true" />
              <span className="lc-cursor-lab" style={{ left: `${(X(cursor.x) / W) * 100}%` }} aria-hidden="true">
                {cursor.label}
              </span>
            </>
          )}
          {markers.map((m, i) => {
            const xp = (X(m.x) / W) * 100;
            const yp = (Y(m.y) / H) * 100;
            return (
              <span key={i} aria-hidden="true">
                <span className="lc-dot" style={{ left: `${xp}%`, top: `${yp}%` }} title={m.label} />
                <span
                  className="lc-lab"
                  style={{
                    left: `${xp}%`,
                    top: `${yp}%`,
                    transform: `translate(${xp > 50 ? 'calc(-100% - 12px)' : '12px'}, ${i % 2 ? '8px' : 'calc(-100% - 8px)'})`,
                  }}
                >
                  {m.label}
                </span>
              </span>
            );
          })}
        </div>
        <span className="ticks" aria-hidden="true">
          {xTicks.map((t) => (
            <span key={t.label}>{t.label}</span>
          ))}
        </span>
        <span className="axis-label">{xLabel}</span>
      </div>
    </div>
  );
}
