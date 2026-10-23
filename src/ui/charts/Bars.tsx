// Barra "Chi vince a ogni differenziale" e striscia "Se esci nel… conviene" (prototipo v2).
import { pct } from '../format';
import { SCENARIO_NAMES } from '../results';

export const SCENARIO_COLORS = ['var(--s1)', 'var(--s2)', 'var(--s3)'];

export function DeltaZones({ deltas, winners, current }: { deltas: number[]; winners: number[]; current: number }) {
  const lo = deltas[0]!;
  const hi = deltas[deltas.length - 1]!;
  const cur = Math.max(0, Math.min(100, ((current - lo) / (hi - lo)) * 100));
  const label = describeRuns(deltas, winners);
  return (
    <div className="zones-wrap">
      <span className="zones-cursor" style={{ left: `${cur}%` }}>
        {pct(current, 1, true)}
      </span>
      <div className="zones" role="img" aria-label={`Scenario migliore al variare del differenziale: ${label}`}>
        {winners.map((w, i) => (
          <div key={i} className="zone" style={{ background: SCENARIO_COLORS[w] }} title={`${pct(deltas[i]!, 2, true)}: vince ${SCENARIO_NAMES[w]}`} />
        ))}
      </div>
    </div>
  );
}

/** "da −12% a −9,3%: 3; da −9,3% a …": tratti consecutivi con lo stesso vincitore. */
function describeRuns(deltas: number[], winners: number[]): string {
  const parts: string[] = [];
  let start = 0;
  for (let i = 1; i <= winners.length; i++) {
    if (i === winners.length || winners[i] !== winners[start]) {
      parts.push(`da ${pct(deltas[start]!, 2, true)} a ${pct(deltas[i - 1]!, 2, true)} vince lo scenario ${winners[start]! + 1}`);
      start = i;
    }
  }
  return parts.join('; ');
}

export function ExitStrip({ firstYear, winners }: { firstYear: number; winners: number[] }) {
  const parts: string[] = [];
  let start = 0;
  for (let i = 1; i <= winners.length; i++) {
    if (i === winners.length || winners[i] !== winners[start]) {
      parts.push(`${firstYear + start}${i - 1 > start ? `-${firstYear + i - 1}` : ''}: scenario ${winners[start]! + 1}`);
      start = i;
    }
  }
  return (
    <div className="strip" role="img" aria-label={`Scenario migliore per anno di uscita: ${parts.join('; ')}`}>
      {winners.map((w, i) => (
        <div key={i} style={{ background: SCENARIO_COLORS[w] }} title={`${firstYear + i}: conviene ${SCENARIO_NAMES[w]}`} />
      ))}
    </div>
  );
}
