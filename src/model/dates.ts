// Date come stringhe ISO aaaa-mm-gg (niente fusi orari).

/** Ultimo giorno del mese della data ISO. */
export function monthEnd(iso: string): string {
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7));
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${iso.slice(0, 7)}-${String(last).padStart(2, '0')}`;
}

export function yearOf(iso: string): number {
  return Number(iso.slice(0, 4));
}

/** Fine dei mesi da `fromIso` a `toIso` compresi. */
export function monthEndsBetween(fromIso: string, toIso: string): string[] {
  const out: string[] = [];
  let y = yearOf(fromIso);
  let m = Number(fromIso.slice(5, 7));
  const end = toIso.slice(0, 7);
  for (;;) {
    const key = `${y}-${String(m).padStart(2, '0')}`;
    if (key > end) break;
    out.push(monthEnd(`${key}-01`));
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

/** "gg/mm/aaaa" → "aaaa-mm-gg"; null se non è una data valida. */
export function parseItDate(s: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const [, d, mo, y] = m;
  const iso = `${y}-${mo}-${d}`;
  const dt = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(dt.getTime()) || dt.toISOString().slice(0, 10) !== iso) return null;
  return iso;
}
