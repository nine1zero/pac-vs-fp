// Lettura del DettaglioOperazioni in memoria (SPEC par. 6): parser, confronto con l'ETF e precompilazione.
import { useState } from 'react';
import sampleXls from '../../spec/tests/fixtures/sample_dettaglio_ok.xls?raw';
import { loadDettaglio } from '../import/load';
import { persistFile, useStore, type ImportedFile, type Inputs } from '../state/store';

export function useImport() {
  const { dispatch } = useStore();
  const [busy, setBusy] = useState(false);
  const readText = (name: string, text: string) => {
    const f = loadDettaglio(name, text);
    const file: ImportedFile = { name, text, result: f.result, comparison: f.comparison };
    if (f.result.status === 'error') {
      dispatch({ type: 'importFile', file, prefill: null });
      return;
    }
    const pf = f.prefill!;
    const prefill: Partial<Inputs> = {};
    if (pf.first_join_year !== null) prefill.first_join_year = pf.first_join_year;
    if (pf.min_member_month !== null) prefill.min_member_month = pf.min_member_month;
    if (pf.employer_month !== null) prefill.employer_month = pf.employer_month;
    if (pf.tfr_month !== null) prefill.tfr_month = pf.tfr_month;
    if (pf.current_position !== null) prefill.current_position = Math.round(pf.current_position * 100) / 100;
    // anche il file si salva da solo su questo dispositivo ("Cancella tutto" lo elimina)
    dispatch({ type: 'importFile', file, prefill, stored: persistFile(file) });
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
