// Righe della pagina "Parametri e fonti" (SPEC par. 3.4 H e 7): valore attuale, default, tipo di campo, modifica.
import { etfById, etfCatalog } from '../data/catalog';
import { params, type Parameter } from '../data';
import { EXAMPLE_PARAMS, type Brackets, type ModelParams } from '../model';
import { DEFAULT_INPUTS, toModelParams, type Action, type Inputs, type State } from './store';

export type ParamValue = number | string | boolean | null | Brackets;
export type FieldKind = 'number' | 'mode' | 'etf' | 'bool' | 'saving' | 'text';

/** Parametri modificati attraverso Inputs (gli altri vanno in overrides). */
const INPUT_IDS = new Set<string>([
  'birth_year',
  'exit_age',
  'first_join_year',
  'ral',
  'min_member_month',
  'employer_month',
  'tfr_month',
  'current_position',
  'current_taxable_base',
  'recoverable_non_deducted',
  'delta',
  'etf_gross_return',
  'exit_mode',
]);
const MODEL_KEY: Record<string, keyof ModelParams> = { irpef_brackets: 'irpef', add_regional: 'regional' };
const modelKey = (id: string) => (MODEL_KEY[id] ?? id) as keyof ModelParams;
const inModel = (id: string) => modelKey(id) in EXAMPLE_PARAMS;

export function fieldKind(p: Parameter): FieldKind {
  if (p.id === 'exit_mode') return 'mode';
  if (p.id === 'etf_name') return 'etf';
  if (p.id === 'payroll_deduction') return 'bool';
  if (p.id === 'annual_saving') return 'saving';
  if (inModel(p.id) && (typeof p.default === 'number' || p.id === 'delta') && p.min !== null && p.max !== null) return 'number';
  return 'text';
}

/** Valore attuale di un parametro. */
export function currentValue(s: State, id: string): ParamValue {
  if (id === 'etf_name') return s.inputs.etf_id;
  if (id === 'annual_saving') return s.inputs.saving_mode === 'max' ? null : (s.inputs.saving ?? null);
  if (INPUT_IDS.has(id)) return s.inputs[id as keyof Inputs] as ParamValue;
  const p = toModelParams(s.inputs, s.overrides);
  if (inModel(id)) return p[modelKey(id)] as ParamValue;
  return params.parameters.find((x) => x.id === id)!.default as ParamValue;
}

/** Valore predefinito (profilo d'esempio; il differenziale è quello storico). */
export function defaultValue(id: string): ParamValue {
  if (id === 'etf_name') return DEFAULT_INPUTS.etf_id;
  if (id === 'annual_saving') return null;
  if (id === 'etf_ter') return etfById(DEFAULT_INPUTS.etf_id).ter;
  if (INPUT_IDS.has(id)) return DEFAULT_INPUTS[id as keyof Inputs] as ParamValue;
  if (inModel(id)) return EXAMPLE_PARAMS[modelKey(id)] as ParamValue;
  return params.parameters.find((x) => x.id === id)!.default as ParamValue;
}

export function isChanged(s: State, id: string): boolean {
  return JSON.stringify(currentValue(s, id)) !== JSON.stringify(defaultValue(id));
}

/** Azione che imposta il parametro; null se non è modificabile. */
export function setAction(id: string, v: ParamValue): Action | null {
  if (id === 'etf_name' && typeof v === 'string') return { type: 'set', inputs: { etf_id: v } };
  if (id === 'annual_saving') return v === null ? { type: 'set', inputs: { saving_mode: 'max' } } : { type: 'set', inputs: { saving_mode: 'fix', saving: v as number } };
  if (INPUT_IDS.has(id)) return { type: 'set', inputs: { [id]: v } as Partial<Inputs> };
  if (inModel(id)) {
    const key = modelKey(id);
    const def = defaultValue(id);
    return { type: 'override', key, value: JSON.stringify(v) === JSON.stringify(def) ? undefined : (v as ModelParams[typeof key]) };
  }
  return null;
}

export function resetAction(id: string): Action | null {
  if (id === 'etf_ter') return { type: 'override', key: 'etf_ter', value: undefined };
  return setAction(id, defaultValue(id));
}

const pctFmt = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 4, useGrouping: 'always' as unknown as boolean });
const numFmt = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2, useGrouping: 'always' as unknown as boolean });

/** Testo di un valore non numerico (scaglioni, ETF, sì/no). */
export function displayValue(p: Parameter, v: ParamValue): string {
  if (v === null) return p.id === 'annual_saving' ? 'deduzione massima' : '–';
  if (typeof v === 'object')
    return v.map(([lim, r]) => `${pctFmt.format(r * 100)}%${lim === null ? ' oltre' : ` fino a ${numFmt.format(lim)} €`}`).join(' · ');
  if (typeof v === 'boolean') return v ? 'Sì, in busta paga' : 'No, versamento diretto';
  if (p.id === 'etf_name') return etfById(v as string).name;
  if (typeof v === 'string') return v;
  if (isPct(p)) return pctFmt.format(v * 100);
  if (p.unit === 'anno') return String(v);
  return numFmt.format(v);
}

/** Unità percentuale ("%" o "punti %"): il valore è una frazione. */
export const isPct = (p: Parameter) => p.unit === '%' || p.unit === 'punti %';
/** Per i campi numerici: percentuali mostrate come 20 e non 0,2. */
export const toField = (p: Parameter, v: number) => (isPct(p) ? Math.round(v * 1e8) / 1e6 : v);
export const fromField = (p: Parameter, v: number) => (isPct(p) ? Math.round(v * 1e6) / 1e8 : v);

export const ETF_OPTIONS = etfCatalog.etfs.map((e) => ({ value: e.id, label: e.short }));

export interface ProfileImport {
  actions: Action[];
  applied: string[];
  rejected: string[];
}

/** Profilo JSON: { version, name, values: { id: valore } } (SPEC par. 7) oppure le chiavi di reference/model.py,
 * anche annidate sotto "defaults" o sotto un'unica chiave. Valori fuori dai limiti o sconosciuti vengono scartati. */
export function importProfile(raw: unknown): ProfileImport {
  let o = raw as Record<string, unknown>;
  if (o && typeof o === 'object' && 'values' in o && typeof o.values === 'object') o = o.values as Record<string, unknown>;
  else {
    const vals = Object.values(o ?? {});
    if (vals.length === 1 && vals[0] && typeof vals[0] === 'object' && !Array.isArray(vals[0])) o = vals[0] as Record<string, unknown>;
    if (o && typeof o.defaults === 'object' && o.defaults !== null) o = o.defaults as Record<string, unknown>;
  }
  const byId = new Map(params.parameters.map((p) => [p.id, p]));
  const fromModel: Record<string, string> = { irpef: 'irpef_brackets', regional: 'add_regional' };
  const actions: Action[] = [];
  const applied: string[] = [];
  const rejected: string[] = [];
  for (const [k, v] of Object.entries(o ?? {})) {
    const id = fromModel[k] ?? k;
    const p = byId.get(id);
    if (!p) {
      rejected.push(k);
      continue;
    }
    const ok =
      (typeof v === 'number' && (p.min === null || v >= p.min) && (p.max === null || v <= p.max)) ||
      (id === 'annual_saving' && (v === null || typeof v === 'number')) ||
      (id === 'exit_mode' && (v === 'Pensione' || v === 'Riscatto')) ||
      (id === 'payroll_deduction' && typeof v === 'boolean') ||
      ((id === 'irpef_brackets' || id === 'add_regional') && Array.isArray(v));
    const a = ok ? setAction(id, v as ParamValue) : null;
    if (a) {
      actions.push(a);
      applied.push(id);
    } else rejected.push(k);
  }
  return { actions, applied, rejected };
}

/** Esporta i valori modificabili come profilo JSON (SPEC par. 7). */
export function exportProfile(s: State, name = 'I miei parametri'): string {
  const values: Record<string, ParamValue> = {};
  for (const p of params.parameters) {
    if (fieldKind(p) === 'text') continue;
    values[p.id] = currentValue(s, p.id);
  }
  return JSON.stringify({ version: 1, name, values }, null, 2);
}
