// Mappa "Per quanti anni conviene" (SPEC par. 3.4 A): anni di uscita × differenziale, colore = scenario migliore,
// intensità = margine sul secondo. Solo lettura: si ricalcola quando cambiano i parametri, ma non li modifica.
// Con le frecce si leggono i valori di ogni casella.
import { useRef, useState } from 'react';
import type { ConvenienceMap } from '../../model';
import { euroK, pct } from '../format';
import { SCENARIO_COLORS } from './Bars';

interface Props {
  map: ConvenienceMap;
  firstYear: number;
  /** differenziale scelto e anni di permanenza previsti, per il mirino */
  delta: number;
  histDelta: number;
}

const W = 1000;
const H = 330;

export function HeatMap({ map, firstYear, delta, histDelta }: Props) {
  const { deltas, n } = map;
  const R = deltas.length;
  const cw = W / n;
  const ch = H / R;
  const [cursor, setCursor] = useState<{ i: number; h: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const top = deltas[0]!;
  const step = deltas[0]! - deltas[1]!;
  const yOf = (d: number) => ((top - d) / step + 0.5) * ch;
  const cellTitle = (i: number, h: number) => {
    const cell = i * n + h - 1;
    const t = [0, 1, 2].map((s) => map.totals[cell * 3 + s]!);
    return `Uscita nel ${firstYear + h - 1}, differenziale ${pct(deltas[i]!, 2, true)}: vince lo scenario ${map.best[cell]! + 1} · 1 = ${euroK(t[0]!)}, 2 = ${euroK(t[1]!)}, 3 = ${euroK(t[2]!)}`;
  };
  const nearestRow = (d: number) => Math.max(0, Math.min(R - 1, Math.round((top - d) / step)));
  const active = cursor ?? { i: nearestRow(delta), h: n };
  const xTicks: number[] = [];
  const stepY = n > 30 ? 5 : n > 12 ? 3 : 1;
  for (let h = 1; h <= n; h++) {
    const y = firstYear + h - 1;
    if (h === 1 || h === n || (y % stepY === 0 && h > 2 && h < n - 1)) xTicks.push(h);
  }
  const yTicks = [0.03, 0, -0.03, -0.06, -0.09, -0.12];
  return (
    <div className="heat">
      <div className="heat-y" aria-hidden="true">
        {yTicks.map((d) => (
          <span key={d} style={{ top: `${(yOf(d) / H) * 100}%` }}>
            {pct(d, 0, true)}
          </span>
        ))}
      </div>
      <div className="heat-main">
        <div className="heat-plot">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            width="100%"
            height={H}
            role="group"
            aria-roledescription="mappa"
            tabIndex={0}
            aria-label={`Mappa: anni di uscita dal ${firstYear} al ${firstYear + n - 1} e differenziale da +3% a −12%, colorata con lo scenario migliore. Usa le frecce per leggere i valori di ogni casella.`}
            onKeyDown={(e) => {
              const d: Record<string, [number, number]> = {
                ArrowUp: [-1, 0],
                ArrowDown: [1, 0],
                ArrowLeft: [0, -1],
                ArrowRight: [0, 1],
              };
              const m = d[e.key];
              if (!m) return;
              e.preventDefault();
              setCursor({ i: Math.max(0, Math.min(R - 1, active.i + m[0])), h: Math.max(1, Math.min(n, active.h + m[1])) });
            }}
          >
            {deltas.map((_d, i) =>
              Array.from({ length: n }, (_, k) => {
                const h = k + 1;
                const cell = i * n + k;
                const op = 0.3 + 0.7 * Math.min(1, map.margin[cell]! / 0.08);
                const isActive = cursor !== null && active.i === i && active.h === h;
                return (
                  <rect
                    key={`${i}-${h}`}
                    x={k * cw}
                    y={i * ch}
                    width={cw}
                    height={ch}
                    shapeRendering="crispEdges"
                    fill={SCENARIO_COLORS[map.best[cell]!]}
                    fillOpacity={op}
                    stroke={isActive ? 'var(--ink)' : 'none'}
                    strokeWidth={isActive ? 3 : 0}
                    vectorEffect="non-scaling-stroke"
                  >
                    <title>{cellTitle(i, h)}</title>
                  </rect>
                );
              }),
            )}
          </svg>
          <span className="heat-hline dashed" style={{ top: `${(yOf(histDelta) / H) * 100}%` }} aria-hidden="true" />
          <span className="heat-hlab" style={{ top: `${(yOf(histDelta) / H) * 100}%` }} aria-hidden="true">
            storico fondo {pct(histDelta, 1, true)}
          </span>
          <span className="heat-hline" style={{ top: `${(yOf(Math.max(-0.12, Math.min(0.03, delta))) / H) * 100}%` }} aria-hidden="true" />
          <span className="heat-vline" style={{ left: `${((n - 0.5) / n) * 100}%` }} aria-hidden="true" />
          <span
            className="heat-you"
            style={{ left: `${((n - 0.5) / n) * 100}%`, top: `${(yOf(Math.max(-0.12, Math.min(0.03, delta))) / H) * 100}%` }}
            aria-hidden="true"
          >
            Tu sei qui
          </span>
        </div>
        <div className="heat-x" aria-hidden="true">
          {xTicks.map((h) => (
            <span key={h} className={h === 1 || h === n ? 'end' : 'mid'} style={{ left: `${((h - 0.5) / n) * 100}%` }}>
              {firstYear + h - 1}
            </span>
          ))}
        </div>
        <span className="axis-label">anno di uscita</span>
        <p className="heat-live" aria-live="polite">
          {cursor ? cellTitle(active.i, active.h) : ''}
        </p>
      </div>
    </div>
  );
}
