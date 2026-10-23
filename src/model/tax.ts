// Fisco del lavoratore e imposta d'uscita (docs/FORMULE.md par. 2-3 e 7; reference/model.py).
import type { Brackets, ExitMode, ModelParams } from './types';

/** Imposta a scaglioni. */
export function progressive(x: number, brackets: Brackets): number {
  let tax = 0;
  let low = 0;
  for (const [limit, rate] of brackets) {
    const top = limit === null ? x : Math.min(x, limit);
    if (top > low) tax += (top - low) * rate;
    if (limit === null || x <= limit) break;
    low = limit;
  }
  return tax;
}

/** Reddito di lavoro dipendente = RAL − contributi INPS del dipendente (9,19% + 1% oltre la prima fascia). */
export function taxableIncome(p: ModelParams, ral: number): number {
  return ral - p.inps_rate * ral - p.inps_extra_rate * Math.max(0, ral - p.inps_first_band);
}

/** Detrazione per lavoro dipendente, art. 13 c. 1 TUIR. r = reddito complessivo. */
export function detrazioneLavoro(r: number): number {
  if (r <= 15000) return 1955;
  if (r <= 28000) return 1910 + (1190 * (28000 - r)) / 13000;
  if (r <= 50000) return (1910 * (50000 - r)) / 22000;
  return 0;
}

/** Cuneo fiscale, L. 207/2024 art. 1 cc. 4-6: [somma esente, ulteriore detrazione]. */
export function cuneo(r: number): [number, number] {
  if (r <= 20000) {
    const pct = r <= 8500 ? 0.071 : r <= 15000 ? 0.053 : 0.048;
    return [pct * r, 0];
  }
  if (r <= 32000) return [0, 1000];
  if (r <= 40000) return [0, (1000 * (40000 - r)) / 8000];
  return [0, 0];
}

/** IRPEF netta + addizionali per un dipendente con solo reddito di lavoro r. */
export function taxTotal(p: ModelParams, r: number): number {
  const [esente, ulteriore] = cuneo(r);
  const base = Math.max(0, r - esente);
  const irpef = Math.max(0, progressive(base, p.irpef) - detrazioneLavoro(r) - ulteriore);
  return irpef + progressive(base, p.regional) + p.add_municipal * base;
}

/** Risparmio fiscale effettivo di una deduzione: T(r) − T(r − D). Con contributi in busta paga la deduzione
 * riduce anche il reddito complessivo su cui si calcolano detrazioni e cuneo (art. 51 c. 2 lett. h TUIR). */
export function taxSaving(p: ModelParams, ral: number, deducted: number): number {
  if (deducted <= 0) return 0;
  const r = taxableIncome(p, ral);
  if (p.payroll_deduction) return taxTotal(p, r) - taxTotal(p, r - deducted);
  // versamento diretto dedotto in dichiarazione: riduce solo l'imponibile (detrazioni invariate)
  const [esente, ulteriore] = cuneo(r);
  const base = Math.max(0, r - esente);
  const full = (b: number) =>
    Math.max(0, progressive(b, p.irpef) - detrazioneLavoro(r) - ulteriore) +
    progressive(b, p.regional) +
    p.add_municipal * b;
  return full(base) - full(base - deducted);
}

/** Aliquota effettiva media su una deduzione di `deducted` euro con la RAL del primo anno. */
export function marginalRate(p: ModelParams, deducted = 1000): number {
  return taxSaving(p, p.ral, deducted) / deducted;
}

/** Minimo annuo a carico del lavoratore per avere il contributo dell'azienda, schema generale IBM Italia
 * (Nota informativa FPDDI 2026, p. 9): 2% fino alla prima fascia pensionabile INPS, 7% oltre. */
export function minMemberFromRal(ral: number, band = 56224): number {
  return 0.02 * Math.min(ral, band) + 0.07 * Math.max(0, ral - band);
}

/** Aliquota dell'imposta d'uscita del fondo (D.Lgs. 252/2005 artt. 11 e 14). */
export function exitTax(p: ModelParams, exitYear: number, mode: ExitMode): number {
  if (mode === 'Riscatto') return p.redemption_tax;
  const years = exitYear - p.first_join_year;
  return Math.max(
    p.exit_tax_min,
    p.exit_tax_max - p.exit_tax_reduction * Math.max(0, years - p.exit_tax_threshold_years),
  );
}
