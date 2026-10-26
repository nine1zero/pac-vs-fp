// Stato dell'app (SPEC par. 1.1 e 7). Ogni dato inserito si salva da solo in localStorage, solo su questo
// dispositivo, dalla prima modifica; anche il file delle operazioni, in una voce a parte. "Cancella tutto" svuota tutto.
import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import { etfById, etfCatalog } from '../data/catalog';
import type { ParseResult } from '../import/dettaglio';
import { loadDettaglio } from '../import/load';
import type { Comparison } from '../model/contributions';
import { EXAMPLE_PARAMS, yearlyFlows, type ExitMode, type ModelParams } from '../model';

export const STORAGE_KEY = 'pacfondo.v1';
/** il file delle operazioni, salvato a parte perché più grande e scritto solo quando si importa */
export const FILE_KEY = 'pacfondo.v1.file';

export interface Inputs {
  birth_year: number;
  exit_age: number;
  first_join_year: number;
  ral: number;
  min_member_month: number;
  employer_month: number;
  tfr_month: number;
  current_position: number;
  current_taxable_base: number;
  recoverable_non_deducted: number;
  saving_mode: 'max' | 'fix';
  /** importo fisso annuo; null finché non lo si sceglie */
  saving: number | null;
  delta: number;
  etf_gross_return: number;
  exit_mode: ExitMode;
  etf_id: string;
}

/** Sezioni della Landing dove l'utente ha confermato dati suoi. */
export type MineKey = 'eta' | 'fondo' | 'ral' | 'ipotesi';

export interface ImportedFile {
  name: string;
  result: ParseResult;
  comparison: Comparison | null;
  /** testo del file (per salvarlo); assente nei test */
  text?: string;
}

export interface State {
  inputs: Inputs;
  /** sezione aperta (−1 = tutte chiuse) */
  open: number;
  done: number[];
  mine: Partial<Record<MineKey, boolean>>;
  source: 'esempio' | 'file';
  lnMode: 'time' | 'delta';
  savedAt: string | null;
  /** istantanea dell'ultimo salvataggio, per sapere se ci sono modifiche */
  savedSnap: string | null;
  storeErr: boolean;
  /** parametri del modello modificati nella pagina "Parametri e fonti" (oltre a quelli di Inputs) */
  overrides: Partial<ModelParams>;
  /** file delle operazioni letto (salvato a parte, vedi FILE_KEY) */
  file: ImportedFile | null;
  /** il file non si è potuto salvare (memoria del browser piena o non disponibile) */
  fileStoreErr: boolean;
}

const P = EXAMPLE_PARAMS;

export const DEFAULT_INPUTS: Inputs = {
  birth_year: P.birth_year,
  exit_age: P.exit_age,
  first_join_year: P.first_join_year,
  ral: P.ral,
  min_member_month: P.min_member_month,
  employer_month: P.employer_month,
  tfr_month: P.tfr_month,
  current_position: P.current_position,
  current_taxable_base: P.current_taxable_base,
  recoverable_non_deducted: P.recoverable_non_deducted,
  saving_mode: P.annual_saving === null ? 'max' : 'fix',
  saving: P.annual_saving,
  delta: P.delta,
  etf_gross_return: P.etf_gross_return,
  exit_mode: P.exit_mode,
  etf_id: etfCatalog.default,
};

const PERSISTED = ['inputs', 'overrides', 'done', 'mine', 'source', 'lnMode'] as const;

function snapshot(s: Pick<State, (typeof PERSISTED)[number]>): string {
  return JSON.stringify({ inputs: s.inputs, overrides: s.overrides, done: s.done, mine: s.mine, source: s.source, lnMode: s.lnMode });
}

/** Uscita almeno nel primo anno simulato. */
function normalize(i: Inputs): Inputs {
  const minAge = P.start_year - i.birth_year;
  return i.exit_age < minAge ? { ...i, exit_age: minAge } : i;
}

export function initialState(storage: Pick<Storage, 'getItem'> | null = safeStorage()): State {
  const base: State = {
    inputs: DEFAULT_INPUTS,
    open: 0,
    done: [],
    mine: {},
    source: 'esempio',
    lnMode: 'time',
    savedAt: null,
    savedSnap: null,
    storeErr: false,
    overrides: {},
    file: null,
    fileStoreErr: false,
  };
  try {
    base.file = restoreFile(storage);
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return base;
    const o = JSON.parse(raw) as { at?: string; data?: Partial<State> };
    const d = o.data ?? {};
    const s: State = {
      ...base,
      inputs: normalize({ ...DEFAULT_INPUTS, ...(d.inputs ?? {}) }),
      overrides: d.overrides && typeof d.overrides === 'object' ? d.overrides : {},
      done: Array.isArray(d.done) ? d.done : [],
      mine: d.mine ?? {},
      source: d.source === 'file' ? 'file' : 'esempio',
      lnMode: d.lnMode === 'delta' ? 'delta' : 'time',
      savedAt: o.at ?? null,
      open: -1, // dati salvati: si riapre con tutte le sezioni chiuse
    };
    return { ...s, savedSnap: snapshot(s) };
  } catch {
    return base;
  }
}

/** Rilegge il file salvato; null se non c'è o se non si può leggere (anche fuori dal browser). */
function restoreFile(storage: Pick<Storage, 'getItem'> | null): ImportedFile | null {
  try {
    const raw = storage?.getItem(FILE_KEY);
    if (!raw || typeof DOMParser === 'undefined') return null;
    const o = JSON.parse(raw) as { name?: string; text?: string };
    if (typeof o.text !== 'string') return null;
    const f = loadDettaglio(o.name ?? 'DettaglioOperazioni.xls', o.text);
    return { name: f.name, text: f.text, result: f.result, comparison: f.comparison };
  } catch {
    return null;
  }
}

/** Salva il file delle operazioni su questo dispositivo; false se non c'è spazio o la memoria non è disponibile. */
export function persistFile(f: ImportedFile, storage: Pick<Storage, 'setItem'> | null = safeStorage()): boolean {
  try {
    if (!storage || f.text === undefined) return false;
    storage.setItem(FILE_KEY, JSON.stringify({ name: f.name, text: f.text, at: new Date().toISOString() }));
    return true;
  } catch {
    return false;
  }
}

export function safeStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export type Action =
  | { type: 'set'; inputs: Partial<Inputs> }
  | { type: 'override'; key: keyof ModelParams; value: ModelParams[keyof ModelParams] | undefined }
  | { type: 'resetParams' }
  | { type: 'loadProfile'; inputs: Partial<Inputs>; overrides: Partial<ModelParams> }
  | { type: 'open'; section: number }
  | { type: 'confirm'; section: number; mine?: MineKey }
  | { type: 'skipToResult' }
  | { type: 'lnMode'; mode: State['lnMode'] }
  | { type: 'importFile'; file: ImportedFile; prefill: Partial<Inputs> | null; stored?: boolean }
  | { type: 'save'; at: string }
  | { type: 'saveFailed' }
  | { type: 'reset' };

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'set': {
      // cambiando ETF il TER torna quello dell'ETF scelto
      const overrides = a.inputs.etf_id && a.inputs.etf_id !== s.inputs.etf_id ? without(s.overrides, 'etf_ter') : s.overrides;
      return { ...s, overrides, inputs: normalize({ ...s.inputs, ...a.inputs }) };
    }
    case 'override':
      return { ...s, overrides: a.value === undefined ? without(s.overrides, a.key) : { ...s.overrides, [a.key]: a.value } };
    case 'resetParams':
      return { ...s, inputs: DEFAULT_INPUTS, overrides: {} };
    case 'loadProfile':
      return { ...s, inputs: normalize({ ...s.inputs, ...a.inputs }), overrides: { ...s.overrides, ...a.overrides } };
    case 'open':
      return { ...s, open: s.open === a.section ? -1 : a.section };
    case 'confirm':
      return {
        ...s,
        open: a.section + 1,
        done: s.done.includes(a.section) ? s.done : [...s.done, a.section],
        mine: a.mine ? { ...s.mine, [a.mine]: true } : s.mine,
      };
    case 'skipToResult':
      return { ...s, open: 5, done: s.done.includes(0) ? s.done : [...s.done, 0] };
    case 'lnMode':
      return { ...s, lnMode: a.mode };
    case 'importFile':
      return {
        ...s,
        file: a.file,
        fileStoreErr: a.stored === false,
        source: a.prefill ? 'file' : s.source,
        inputs: a.prefill ? normalize({ ...s.inputs, ...a.prefill }) : s.inputs,
      };
    case 'save':
      return { ...s, savedAt: a.at, savedSnap: snapshot(s), storeErr: false };
    case 'saveFailed':
      return { ...s, storeErr: true };
    case 'reset':
      return { ...initialState(null), open: 0 };
  }
}

function without<T extends object>(o: T, k: keyof T): T {
  const c = { ...o };
  delete c[k];
  return c;
}

/** Istantanea del profilo d'esempio appena aperto: finché lo stato è questo non si salva nulla. */
const PRISTINE = snapshot({ inputs: DEFAULT_INPUTS, overrides: {}, done: [], mine: {}, source: 'esempio', lnMode: 'time' });

/** Va salvato? Sì se è cambiato dall'ultimo salvataggio e, la prima volta, se differisce dall'esempio appena aperto. */
export function needsAutosave(s: State): boolean {
  if (!isDirty(s)) return false;
  return s.savedAt !== null || snapshot(s) !== PRISTINE;
}

/** Ritardo del salvataggio automatico: uno slider trascinato scrive una volta sola. */
export const AUTOSAVE_DELAY_MS = 400;

/** Ci sono modifiche rispetto all'ultimo salvataggio? */
export function isDirty(s: State): boolean {
  return s.savedSnap !== snapshot(s);
}

/** Salva i valori inseriti (non il file) in localStorage; true se riuscito. */
export function persist(s: State, at: string, storage: Pick<Storage, 'setItem'> | null = safeStorage()): boolean {
  try {
    if (!storage) return false;
    storage.setItem(STORAGE_KEY, JSON.stringify({ at, data: JSON.parse(snapshot(s)) }));
    return true;
  } catch {
    return false;
  }
}

export function forget(storage: Pick<Storage, 'removeItem'> | null = safeStorage()): void {
  try {
    storage?.removeItem(STORAGE_KEY);
    storage?.removeItem(FILE_KEY);
  } catch {
    // niente da cancellare
  }
}

/** Versamento del primo anno per la deduzione massima (J del primo anno). */
export function firstYearMaxDeduction(p: ModelParams): number {
  return yearlyFlows({ ...p, birth_year: Math.max(p.birth_year, p.start_year - p.exit_age) })[0]!.J;
}

/** Parametri del modello dai dati inseriti e dalle modifiche della pagina "Parametri e fonti". */
export function toModelParams(i: Inputs, overrides: Partial<ModelParams> = {}): ModelParams {
  const p: ModelParams = {
    ...EXAMPLE_PARAMS,
    ...overrides,
    birth_year: i.birth_year,
    exit_age: i.exit_age,
    first_join_year: i.first_join_year,
    ral: i.ral,
    min_member_month: i.min_member_month,
    employer_month: i.employer_month,
    tfr_month: i.tfr_month,
    current_position: i.current_position,
    current_taxable_base: i.current_taxable_base,
    recoverable_non_deducted: i.recoverable_non_deducted,
    delta: i.delta,
    etf_gross_return: i.etf_gross_return,
    exit_mode: i.exit_mode,
    etf_ter: overrides.etf_ter ?? etfById(i.etf_id).ter,
    annual_saving: null,
  };
  if (i.saving_mode === 'fix') p.annual_saving = i.saving ?? firstYearMaxDeduction(p);
  return p;
}

const Ctx = createContext<{ state: State; dispatch: Dispatch<Action> } | null>(null);

export function StoreProvider({ children, init }: { children: ReactNode; init?: State }) {
  const [state, dispatch] = useReducer(reducer, init, (x) => x ?? initialState());
  const value = useMemo(() => ({ state, dispatch }), [state]);
  // salvataggio automatico dei dati inseriti
  useEffect(() => {
    if (state.storeErr || !needsAutosave(state)) return;
    const t = setTimeout(() => {
      const at = new Date().toISOString();
      if (persist(state, at)) dispatch({ type: 'save', at });
      else dispatch({ type: 'saveFailed' });
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(t);
  }, [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore fuori da StoreProvider');
  return v;
}
