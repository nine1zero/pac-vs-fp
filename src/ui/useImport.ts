// Lettura del DettaglioOperazioni in memoria (SPEC par. 6): parser, confronto con l'ETF e precompilazione.
import { useState } from 'react';
import sampleXls from '../../spec/tests/fixtures/sample_dettaglio_ok.xls?raw';
import { azionario, etfMonthly } from '../data';
import { parseDettaglio } from '../import/dettaglio';
import { compareWithEtf, prefillFromFile } from '../model/contributions';
import { useStore, type Inputs } from '../state/store';

export function useImport() {
  const { dispatch } = useStore();
  const [busy, setBusy] = useState(false);
  const readText = (name: string, text: string) => {
    const result = parseDettaglio(text);
    if (result.status === 'error') {
      dispatch({ type: 'importFile', file: { name, result, comparison: null }, prefill: null });
      return;
    }
    const comparison = compareWithEtf(result.movements, azionario, etfMonthly);
    const pf = prefillFromFile(result.movements, comparison);
    const prefill: Partial<Inputs> = {};
    if (pf.first_join_year !== null) prefill.first_join_year = pf.first_join_year;
    if (pf.min_member_month !== null) prefill.min_member_month = pf.min_member_month;
    if (pf.employer_month !== null) prefill.employer_month = pf.employer_month;
    if (pf.tfr_month !== null) prefill.tfr_month = pf.tfr_month;
    if (pf.current_position !== null) prefill.current_position = Math.round(pf.current_position * 100) / 100;
    dispatch({ type: 'importFile', file: { name, result, comparison }, prefill });
  };
  const readFile = (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    f.text()
      .then((t) => readText(f.name, t))
      .finally(() => setBusy(false));
  };
  const useSample = () => readText('sample_dettaglio_ok.xls', sampleXls);
  return { readText, readFile, useSample, busy };
}
