// Stato dell'app (SPEC par. 1.1 e 7). I dati restano in memoria; localStorage solo con "Salva i miei dati"
// e svuotato da "Cancella tutto". Il file importato non viene mai salvato.
import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import { etfById, etfCatalog } from '../data/catalog';
import type { ParseResult } from '../import/dettaglio';
import type { Comparison } from '../model/contributions';
import { EXAMPLE_PARAMS, yearlyFlows, type ExitMode, type ModelParams } from '../model';

export const STORAGE_KEY = 'pacfondo.v1';

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
  /** solo in memoria */
  file: ImportedFile | null;
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

const PERSISTED = ['inputs', 'done', 'mine', 'source', 'lnMode'] as const;

function snapshot(s: Pick<State, (typeof PERSISTED)[number]>): string {
  return JSON.stringify({ inputs: s.inputs, done: s.done, mine: s.mine, source: s.source, lnMode: s.lnMode });
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
    file: null,
  };
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return base;
    const o = JSON.parse(raw) as { at?: string; data?: Partial<State> };
    const d = o.data ?? {};
    const s: State = {
      ...base,
      inputs: normalize({ ...DEFAULT_INPUTS, ...(d.inputs ?? {}) }),
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

export function safeStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export type Action =
  | { type: 'set'; inputs: Partial<Inputs> }
  | { type: 'open'; section: number }
  | { type: 'confirm'; section: number; mine?: MineKey }
  | { type: 'skipToResult' }
  | { type: 'lnMode'; mode: State['lnMode'] }
  | { type: 'importFile'; file: ImportedFile; prefill: Partial<Inputs> | null }
  | { type: 'save'; at: string }
  | { type: 'saveFailed' }
  | { type: 'reset' };

export function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'set':
      return { ...s, inputs: normalize({ ...s.inputs, ...a.inputs }) };
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
  } catch {
    // niente da cancellare
  }
}

/** Versamento del primo anno per la deduzione massima (J del primo anno). */
export function firstYearMaxDeduction(p: ModelParams): number {
  return yearlyFlows({ ...p, birth_year: Math.max(p.birth_year, p.start_year - p.exit_age) })[0]!.J;
}

/** Parametri del modello dai dati inseriti. */
export function toModelParams(i: Inputs): ModelParams {
  const p: ModelParams = {
    ...EXAMPLE_PARAMS,
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
    etf_ter: etfById(i.etf_id).ter,
    annual_saving: null,
  };
  if (i.saving_mode === 'fix') p.annual_saving = i.saving ?? firstYearMaxDeduction(p);
  return p;
}

const Ctx = createContext<{ state: State; dispatch: Dispatch<Action> } | null>(null);

export function StoreProvider({ children, init }: { children: ReactNode; init?: State }) {
  const [state, dispatch] = useReducer(reducer, init, (x) => x ?? initialState());
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore fuori da StoreProvider');
  return v;
}
