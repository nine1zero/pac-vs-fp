// Flussi anno per anno, uguali per ogni differenziale (SPEC par. 4.2; docs/FORMULE.md par. 3-5).
import { minMemberFromRal, taxSaving } from './tax';
import type { FlowRow, ModelParams } from './types';

/** Numero di anni simulati fino all'uscita. */
export function yearsSimulated(p: ModelParams): number {
  return p.birth_year + p.exit_age - p.start_year + 1;
}

export function yearlyFlows(p: ModelParams): FlowRow[] {
  const n = yearsSimulated(p);
  const rows: FlowRow[] = [];
  let resid = p.recoverable_non_deducted;
  for (let k = 1; k <= n; k++) {
    const year = p.start_year + k - 1;
    const g = (1 + p.growth) ** (k - 1);
    const E = p.min_member_month * p.months * g; // contributo minimo aderente
    const F = p.employer_month * p.months * g; // contributo azienda
    const G = p.tfr_month * p.months * g; // TFR
    const H = resid; // residuo recuperabile a inizio anno
    const ok =
      p.first_join_year + p.recovery_from_year_offset <= year &&
      year <= p.first_join_year + p.recovery_last_year_offset;
    const I = ok ? Math.min(p.recovery_cap, H) : 0; // recupero usabile
    const J = Math.max(E, p.deduction_limit + I - F); // versamento per la deduzione massima
    const ralY = p.ral * g; // retribuzione dell'anno
    const floor = Math.max(E, minMemberFromRal(ralY, p.inps_first_band));
    // risparmio annuo: tra quota minima e deduzione massima
    const K = p.annual_saving === null ? J : Math.min(J, Math.max(floor, p.annual_saving * g));
    // Scenario 1: minimo per il contributo dell'azienda
    const L = E;
    const M = L >= E ? F : 0;
    const N = Math.max(0, Math.min(L, p.deduction_limit - M));
    const O = taxSaving(p, ralY, N);
    // Scenario 2: deduzione massima, rimborso IRPEF nel PAC
    const S = Math.max(E, Math.min(J, K));
    const T = S >= E ? F : 0;
    const U = Math.max(0, Math.min(S, p.deduction_limit + I - T));
    const V = Math.max(0, U + T - p.deduction_limit);
    const W = taxSaving(p, ralY, U);
    resid = Math.max(0, H - V);
    rows.push({
      k,
      year,
      E,
      F,
      G,
      H,
      I,
      J,
      K,
      s: [
        { member: L, employer: M, deductible: N, irpef_saving: O, pac: Math.max(0, K - L + O), fund: L + M + G, taxable: N + M + G },
        { member: S, employer: T, deductible: U, irpef_saving: W, pac: Math.max(0, K - S + W), fund: S + T + G, taxable: U + T + G, recovery_used: V },
        // Scenario 3: solo TFR nel fondo, tutto il risparmio nel PAC
        { member: 0, employer: 0, deductible: 0, irpef_saving: 0, pac: K, fund: G, taxable: G },
      ],
    });
  }
  return rows;
}
