// Dal testo del DettaglioOperazioni al file importato: lettura, confronto con l'ETF e precompilazione (SPEC par. 6).
import { azionario, etfMonthly } from '../data';
import { compareWithEtf, prefillFromFile, type Prefill } from '../model/contributions';
import { parseDettaglio, type ParseResult } from './dettaglio';
import type { Comparison } from '../model/contributions';

export interface LoadedFile {
  name: string;
  /** testo del file, per salvarlo su questo dispositivo */
  text: string;
  result: ParseResult;
  comparison: Comparison | null;
  prefill: Prefill | null;
}

export function loadDettaglio(name: string, text: string): LoadedFile {
  const result = parseDettaglio(text);
  if (result.status === 'error') return { name, text, result, comparison: null, prefill: null };
  const comparison = compareWithEtf(result.movements, azionario, etfMonthly);
  return { name, text, result, comparison, prefill: prefillFromFile(result.movements, comparison) };
}
