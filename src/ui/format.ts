// Formati it-IT (SPEC: 1.234,56 €; 5,8%). Il segno meno è il carattere tipografico "−".

const MINUS = '−';
// useGrouping 'always': in it-IT Intl non separa le migliaia sotto 10.000 ("4390"), la SPEC vuole "4.390"
const nf = (min: number, max: number) =>
  new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
    useGrouping: 'always' as unknown as boolean,
  });
const cache = new Map<string, Intl.NumberFormat>();
function fmt(v: number, min: number, max: number): string {
  const key = `${min}-${max}`;
  let f = cache.get(key);
  if (!f) cache.set(key, (f = nf(min, max)));
  return f.format(v).replace('-', MINUS);
}

/** 1.234 € */
export const euro = (v: number) => `${fmt(Math.round(v), 0, 0)} €`;
/** 1.234,56 € */
export const euro2 = (v: number) => `${fmt(v, 2, 2)} €`;
/** 522k € · 1,25 mln € */
export const euroK = (v: number) =>
  Math.abs(v) >= 1e6 ? `${fmt(v / 1e6, 0, 2)} mln €` : `${fmt(Math.round(v / 1000), 0, 0)}k €`;
/** 5,8% (frazione → percentuale); con `sign` aggiunge il + ai positivi */
export const pct = (v: number, digits = 1, sign = false) =>
  `${sign && v > 0 ? '+' : ''}${fmt(v * 100, digits, digits)}%`;
/** come pct ma senza zeri finali inutili: 7% · 0,14% */
export const pctShort = (v: number, maxDigits = 2) => `${fmt(v * 100, 0, maxDigits)}%`;
/** numero intero con separatore delle migliaia */
export const int = (v: number) => fmt(Math.round(v), 0, 0);
/** "aaaa-mm-gg" → "gg/mm/aaaa" */
export const itDate = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
/** numero con `digits` decimali al massimo */
export const num = (v: number, digits = 2) => fmt(v, 0, digits);
