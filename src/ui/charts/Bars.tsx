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

/** Tratti consecutivi con lo stesso vincitore: da h anni (1 = primo anno di uscita) vince s. */
export function stripRuns(winners: number[]): { from: number; to: number; s: number }[] {
  const runs: { from: number; to: number; s: number }[] = [];
  winners.forEach((w, i) => {
    const last = runs[runs.length - 1];
    if (last && last.s === w) last.to = i + 1;
    else runs.push({ from: i + 1, to: i + 1, s: w });
  });
  return runs;
}

/** Frase sotto la striscia: "Se esci entro 16 anni conviene la 2; da 17 anni in poi conviene la 1." */
export function stripSentence(winners: number[]): string {
  const runs = stripRuns(winners);
  if (runs.length === 1) return `Con questo differenziale conviene sempre la ${runs[0]!.s + 1}, qualunque sia l’anno di uscita.`;
  const yrs = (v: number) => `${v} ${v === 1 ? 'anno' : 'anni'}`;
  return `${runs
    .map((g, j) =>
      j === 0
        ? `Se esci entro ${yrs(g.to)} conviene la ${g.s + 1}`
        : j < runs.length - 1
          ? `tra ${g.from} e ${g.to} anni conviene la ${g.s + 1}`
          : `da ${g.from} anni in poi conviene la ${g.s + 1}`,
    )
    .join('; ')}.`;
}

export function ExitStrip({ firstYear, winners }: { firstYear: number; winners: number[] }) {
  const n = winners.length;
  const runs = stripRuns(winners);
  const parts = runs.map((g) => `${firstYear + g.from - 1}${g.to > g.from ? `-${firstYear + g.to - 1}` : ''}: scenario ${g.s + 1}`);
  return (
    <div className="strip-wrap">
      {runs.slice(1).map((g) => (
        <span
          key={g.from}
          className="strip-pill"
          style={{ left: `${(((g.from - 1) / n) * 100).toFixed(2)}%` }}
          title={`Da ${g.from} anni (uscita nel ${firstYear + g.from - 1}) conviene la ${g.s + 1} · ${SCENARIO_NAMES[g.s]}`}
        >
          {g.from} anni
        </span>
      ))}
      <div className="strip" role="img" aria-label={`Scenario migliore per anno di uscita: ${parts.join('; ')}`}>
        {winners.map((w, i) => (
          <div
            key={i}
            style={{ background: SCENARIO_COLORS[w] }}
            title={`Se esci nel ${firstYear + i} (dopo ${i + 1} ${i === 0 ? 'anno' : 'anni'} da oggi): conviene aver seguito sempre la ${w + 1} · ${SCENARIO_NAMES[w]}`}
          />
        ))}
      </div>
    </div>
  );
}
