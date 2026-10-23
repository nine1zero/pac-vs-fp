// Lettura e validazione del file DettaglioOperazioni (SPEC par. 6.1-6.2; reference/history.py).
// Il file .xls è una tabella HTML: si legge con DOMParser, solo in memoria.
import { parseItDate } from '../model/dates';

export const REQUIRED_COLUMNS = [
  'Tipo Operazione',
  'Data Competenza',
  'Importo Lordo Aderente',
  'Importo Lordo Azienda',
  'Tfr',
  'Altro',
  'Importo Netto',
] as const;

/** Colonne delle quote: mancano tutte nei fondi solo assicurativi (modalità ridotta). */
export const QUOTE_COLUMNS = ['Comparto', 'Numero Quote', 'Valore Quota', 'Data Valore Quota'] as const;

export type MovementKind = 'versamento' | 'volontario' | 'anticipazione' | 'concambio' | 'non_investito' | 'sconosciuto';

const KINDS: Record<string, MovementKind> = {
  Contributo: 'versamento',
  'Ctrb. una tantum': 'volontario',
  Anticipazione: 'anticipazione',
  'Concambio in': 'concambio',
  'Concambio out': 'concambio',
  'Contr. non investito': 'non_investito',
};

export interface Movement {
  /** posizione nel file (0 = prima riga del tbody) */
  index: number;
  tipo: string;
  kind: MovementKind;
  dataOperazione: string | null;
  /** "In attesa del val. quota" in Data Operazione */
  inAttesa: boolean;
  competenza: string | null;
  aderente: number;
  azienda: number;
  tfr: number;
  altro: number;
  quotaAssociativa: number;
  netto: number;
  comparto: string;
  quote: number | null;
  valoreQuota: number | null;
  dataValore: string | null;
}

export type Severity = 'error' | 'warning';

export interface Issue {
  severity: Severity;
  code: string;
  message: string;
  /** indici delle righe coinvolte */
  rows?: number[];
}

export interface Totals {
  aderente: number;
  azienda: number;
  tfr: number;
  altro: number;
  quotaAssociativa: number;
  netto: number;
}

export interface ParseResult {
  status: 'ok' | 'warning' | 'error';
  issues: Issue[];
  columns: string[];
  /** mancano tutte le colonne delle quote: niente confronto con l'ETF basato sulle quote */
  reduced: boolean;
  movements: Movement[];
  /** riga TOTALE del file, se c'è */
  fileTotals: Partial<Totals> | null;
  /** prima e ultima Data Competenza (ISO) */
  period: [string, string] | null;
}

const clean = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

/** Numero all'italiana ("1.002,32", "-2.195,508"); null se la cella è vuota, NaN se illeggibile. */
export function parseItNumber(s: string): number | null {
  const t = clean(s);
  if (t === '') return null;
  if (!/^[-+]?[\d.]*\d(,\d+)?$/.test(t)) return Number.NaN;
  return Number(t.replace(/\./g, '').replace(',', '.'));
}

const TOTAL_FIELDS: [keyof Totals, string][] = [
  ['aderente', 'Importo Lordo Aderente'],
  ['azienda', 'Importo Lordo Azienda'],
  ['tfr', 'Tfr'],
  ['altro', 'Altro'],
  ['quotaAssociativa', 'Quota Associativa'],
  ['netto', 'Importo Netto'],
];

const EUR_TOL = 0.01 + 1e-9;
const QUOTE_TOL = 0.05 + 1e-9;

const fmtEur = (v: number) => new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) + ' €';
const mmYYYY = (iso: string) => `${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

export interface ParseOptions {
  /** data di oggi (ISO) per il controllo delle date; default: oggi */
  today?: string;
}

export function parseDettaglio(html: string, opts: ParseOptions = {}): ParseResult {
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  const issues: Issue[] = [];
  const fail = (code: string, message: string): ParseResult => ({
    status: 'error',
    issues: [...issues, { severity: 'error', code, message }],
    columns: [],
    reduced: false,
    movements: [],
    fileTotals: null,
    period: null,
  });

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  if (!table) return fail('no_table', 'Nessuna tabella trovata: il file non sembra un DettaglioOperazioni del fondo.');

  const headRow = table.querySelector('thead tr') ?? table.querySelector('tr');
  const columns = headRow ? [...headRow.querySelectorAll('th, td')].map((c) => clean(c.textContent)) : [];
  const col = (name: string) => columns.indexOf(name);

  for (const name of REQUIRED_COLUMNS) {
    if (col(name) < 0) issues.push({ severity: 'error', code: 'missing_column', message: `Manca la colonna ${name}.` });
  }
  const missingQuote = QUOTE_COLUMNS.filter((c) => col(c) < 0);
  const reduced = missingQuote.length === QUOTE_COLUMNS.length;
  if (reduced) {
    issues.push({
      severity: 'warning',
      code: 'reduced_mode',
      message: 'Il file non ha le colonne delle quote (fondo solo assicurativo): import in modalità ridotta, senza il confronto con l’ETF.',
    });
  } else {
    for (const name of missingQuote) issues.push({ severity: 'error', code: 'missing_column', message: `Manca la colonna ${name}.` });
  }
  if (issues.some((i) => i.severity === 'error')) {
    return { status: 'error', issues, columns, reduced, movements: [], fileTotals: null, period: null };
  }

  const bodyRows = [...table.querySelectorAll('tbody tr')];
  const rows = bodyRows.length ? bodyRows : [...table.querySelectorAll('tr')].filter((tr) => tr !== headRow && !tr.closest('tfoot'));
  const footRows = [...table.querySelectorAll('tfoot tr')];

  const cellsOf = (tr: Element) => [...tr.querySelectorAll('td, th')].map((c) => clean(c.textContent));
  const at = (cells: string[], name: string) => {
    const i = col(name);
    return i < 0 ? '' : (cells[i] ?? '');
  };

  let totalRow: string[] | null = null;
  for (const tr of footRows) {
    const c = cellsOf(tr);
    if (c[0]?.toUpperCase() === 'TOTALE') totalRow = c;
  }

  const movements: Movement[] = [];
  const unreadable: number[] = [];
  for (const tr of rows) {
    const cells = cellsOf(tr);
    if (cells.length === 0 || cells.every((c) => c === '')) continue;
    if (cells[0]?.toUpperCase() === 'TOTALE') {
      totalRow = cells; // la riga dei totali di solito sta nel tfoot: non è un movimento
      continue;
    }
    const index = movements.length;
    let bad = false;
    const num = (name: string, required: boolean): number | null => {
      const v = parseItNumber(at(cells, name));
      if (v !== null && Number.isNaN(v)) bad = true;
      if (v === null && required) return 0;
      return v;
    };
    const date = (name: string): string | null => {
      const raw = at(cells, name);
      if (raw === '' || /in attesa/i.test(raw)) return null;
      const d = parseItDate(raw);
      if (d === null) bad = true;
      return d;
    };
    const tipo = at(cells, 'Tipo Operazione');
    const dataOpRaw = at(cells, 'Data Operazione');
    const m: Movement = {
      index,
      tipo,
      kind: KINDS[tipo] ?? 'sconosciuto',
      dataOperazione: date('Data Operazione'),
      inAttesa: /in attesa/i.test(dataOpRaw),
      competenza: date('Data Competenza'),
      aderente: num('Importo Lordo Aderente', true)!,
      azienda: num('Importo Lordo Azienda', true)!,
      tfr: num('Tfr', true)!,
      altro: num('Altro', true)!,
      quotaAssociativa: num('Quota Associativa', true)!,
      netto: num('Importo Netto', true)!,
      comparto: at(cells, 'Comparto'),
      quote: num('Numero Quote', false),
      valoreQuota: num('Valore Quota', false),
      dataValore: date('Data Valore Quota'),
    };
    if (m.competenza === null) bad = true;
    if (bad) unreadable.push(index);
    movements.push(m);
  }

  if (movements.length === 0) return fail('no_rows', 'La tabella non contiene movimenti.');
  if (unreadable.length > 0.05 * movements.length) {
    issues.push({
      severity: 'error',
      code: 'unreadable',
      message: `${unreadable.length} righe su ${movements.length} hanno numeri o date non leggibili (oltre il 5%).`,
      rows: unreadable,
    });
    return { status: 'error', issues, columns, reduced, movements: [], fileTotals: null, period: null };
  }
  if (unreadable.length) {
    issues.push({ severity: 'warning', code: 'unreadable', message: `${unreadable.length} righe hanno numeri o date non leggibili.`, rows: unreadable });
  }

  // Controllo totali: la somma delle righe deve coincidere con la riga TOTALE entro 0,01 €.
  let fileTotals: Partial<Totals> | null = null;
  if (totalRow) {
    fileTotals = {};
    for (const [key, name] of TOTAL_FIELDS) {
      const v = parseItNumber(at(totalRow, name));
      if (v === null || Number.isNaN(v)) continue;
      fileTotals[key] = v;
      const sum = movements.reduce((a, m) => a + m[key], 0);
      if (Math.abs(sum - v) > EUR_TOL) {
        issues.push({
          severity: 'warning',
          code: 'total_mismatch',
          message: `Totale ${name}: la somma delle righe è ${fmtEur(sum)}, la riga TOTALE del file dice ${fmtEur(v)}.`,
        });
      }
    }
  } else {
    issues.push({ severity: 'warning', code: 'no_total', message: 'Il file non ha la riga TOTALE: impossibile controllare i totali.' });
  }

  // Controllo per riga: Aderente + Azienda + Tfr + Altro − Quota associativa = Importo netto.
  const rowMismatch = movements.filter((m) => Math.abs(m.aderente + m.azienda + m.tfr + m.altro - m.quotaAssociativa - m.netto) > EUR_TOL);
  if (rowMismatch.length) {
    issues.push({
      severity: 'warning',
      code: 'row_mismatch',
      message: `${rowMismatch.length} righe: Aderente + Azienda + Tfr + Altro − Quota associativa non coincide con l’Importo netto.`,
      rows: rowMismatch.map((m) => m.index),
    });
  }

  // Controllo quote: |Numero Quote × Valore Quota − Importo Netto| ≤ 0,05 €.
  const quoteMismatch = movements.filter(
    (m) => m.quote !== null && m.valoreQuota !== null && Math.abs(m.quote * m.valoreQuota - m.netto) > QUOTE_TOL,
  );
  if (quoteMismatch.length) {
    issues.push({
      severity: 'warning',
      code: 'quote_mismatch',
      message: `${quoteMismatch.length} righe: Numero Quote × Valore Quota differisce dall’Importo netto di oltre 0,05 €.`,
      rows: quoteMismatch.map((m) => m.index),
    });
  }

  const unknown = movements.filter((m) => m.kind === 'sconosciuto');
  if (unknown.length) {
    const tipi = [...new Set(unknown.map((m) => m.tipo || '(vuoto)'))].join(', ');
    issues.push({
      severity: 'warning',
      code: 'unknown_type',
      message: `Tipi di operazione sconosciuti (righe mostrate ma escluse dai calcoli): ${tipi}.`,
      rows: unknown.map((m) => m.index),
    });
  }

  const outOfRange = movements.filter((m) =>
    [m.dataOperazione, m.competenza, m.dataValore].some((d) => d !== null && (d < '1987-01-01' || d > today)),
  );
  if (outOfRange.length) {
    issues.push({
      severity: 'warning',
      code: 'date_out_of_range',
      message: `${outOfRange.length} righe hanno date fuori dal periodo dal 1987 a oggi.`,
      rows: outOfRange.map((m) => m.index),
    });
  }

  const comp = movements.map((m) => m.competenza).filter((d): d is string => d !== null).sort();
  const period: [string, string] | null = comp.length ? [comp[0]!, comp[comp.length - 1]!] : null;
  const status = issues.some((i) => i.severity === 'error') ? 'error' : issues.length ? 'warning' : 'ok';
  return { status, issues, columns, reduced, movements, fileTotals, period };
}

/** Frase di esito positivo (SPEC par. 6.2). */
export function successMessage(r: ParseResult): string {
  const p = r.period ? `, dal ${mmYYYY(r.period[0])} al ${mmYYYY(r.period[1])}` : '';
  return `${r.movements.length} movimenti letti${p}, totali coerenti con il file`;
}
