// Dati statici dal bundle (public/data): nessuna richiesta di rete dopo il caricamento (SPEC par. 1.1).
import azionarioJson from '../../public/data/fpddi_azionario.json';
import assicurativoJson from '../../public/data/fpddi_assicurativo.json';
import etfExtraJson from '../../public/data/etf_annual_extra.json';
import etfSourcesJson from '../../public/data/etf_monthly.sources.json';
import paramsJson from '../../public/data/params.json';
import etfMonthlyCsv from '../../public/data/etf_monthly.csv?raw';
import { parsePriceCsv, type PriceTable } from './prices';

export type { PriceTable, PriceColumn } from './prices';
export { priceAt } from './prices';

export interface Evidence {
  file: string;
  page: number | null;
  quote: string | null;
  note?: string;
}

export interface FundYear {
  year: number;
  period_end: string;
  partial: boolean;
  fund_net: number;
  benchmark_net: number;
  fund_tax_rate: number;
  nav_end: number | null;
  source: string;
  evidence: Evidence;
}

export interface Azionario {
  description: string;
  benchmark_composition: { 'MSCI World': number; 'MSCI Europe': number; 'JPM Cash Euro 3M': number; source: string };
  tax_rate_source: string;
  years: FundYear[];
}

export interface Parameter {
  id: string;
  label: string;
  group: string;
  unit: string;
  default: unknown;
  min: number | null;
  max: number | null;
  step: number | null;
  advanced: boolean;
  source: string;
  description: string;
  tags: string[];
  source_kind: string;
}

export const azionario = azionarioJson as unknown as Azionario;
export const assicurativo = assicurativoJson;
export const etfAnnualExtra = etfExtraJson;
export const etfMonthlySources = etfSourcesJson;
export const params = paramsJson as unknown as {
  version: number;
  note: string;
  parameters: Parameter[];
  source_kinds: Record<string, string>;
};
export const etfMonthly: PriceTable = parsePriceCsv(etfMonthlyCsv);
