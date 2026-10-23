/** Scaglioni: [limite superiore (null = oltre), aliquota]. */
export type Brackets = ReadonlyArray<readonly [number | null, number]>;

export type ExitMode = 'Pensione' | 'Riscatto';

/** Parametri del modello: stessi nomi di spec/reference/model.py (DEFAULTS). Percentuali come frazioni. */
export interface ModelParams {
  birth_year: number;
  exit_age: number;
  first_join_year: number;
  start_year: number;
  ral: number;
  min_member_month: number;
  employer_month: number;
  tfr_month: number;
  months: number;
  current_position: number;
  current_taxable_base: number;
  recoverable_non_deducted: number;
  /** null = quanto serve per la deduzione massima */
  annual_saving: number | null;
  growth: number;
  inflation: number;
  base_year_real: number;
  inps_rate: number;
  inps_extra_rate: number;
  inps_first_band: number;
  irpef: Brackets;
  regional: Brackets;
  add_municipal: number;
  payroll_deduction: boolean;
  deduction_limit: number;
  recovery_cap: number;
  recovery_from_year_offset: number;
  recovery_last_year_offset: number;
  fund_return_tax: number;
  exit_tax_max: number;
  exit_tax_reduction: number;
  exit_tax_min: number;
  exit_tax_threshold_years: number;
  redemption_tax: number;
  exit_mode: ExitMode;
  etf_gross_return: number;
  etf_ter: number;
  stamp_duty: number;
  capital_gain_tax: number;
  delta: number;
  contribution_year_fraction: number;
}

/** Flussi di uno scenario in un anno (SPEC par. 4.2). */
export interface ScenarioFlow {
  member: number;
  employer: number;
  deductible: number;
  irpef_saving: number;
  pac: number;
  fund: number;
  taxable: number;
  /** solo scenario 2 */
  recovery_used?: number;
}

/** Riga dei flussi anno per anno: colonne comuni E..K e i tre scenari. */
export interface FlowRow {
  k: number;
  year: number;
  E: number;
  F: number;
  G: number;
  H: number;
  I: number;
  J: number;
  K: number;
  s: [ScenarioFlow, ScenarioFlow, ScenarioFlow];
}

/** Valori all'uscita di uno scenario (SPEC par. 4.3). */
export interface ScenarioResult {
  fund_value: number;
  taxable_base: number;
  exit_tax: number;
  fund_net: number;
  pac_value: number;
  pac_cost: number;
  pac_net: number;
  total_net: number;
  total_real: number;
  /** fondo + PAC lordi a fine di ogni anno simulato */
  series: number[];
}

export type ScenarioIndex = 0 | 1 | 2;

/** Pareggio: differenziale, oppure A migliore in tutto l'intervallo ("sempre") o mai. */
export type Breakeven = number | 'sempre' | 'mai';
