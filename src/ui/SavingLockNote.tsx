import { euro } from './format';
import type { Results } from './results';

/** Spiega perché lo slider del risparmio è fermo: la quota minima per il contributo dell'azienda arriva già alla deduzione massima. */
export function SavingLockNote({ r }: { r: Results }) {
  if (!r.savingLocked) return null;
  return (
    <span className="lock-note" role="note">
      Lo slider è fermo: la quota minima per avere il contributo IBM ({euro(Math.ceil(r.savingFloor))} l'anno) arriva già alla deduzione massima (
      {euro(r.savingMax)}), quindi non c'è un importo da scegliere e gli scenari 1 e 2 coincidono.{' '}
      {r.savingFloorFrom === 'contributo'
        ? "La quota viene da «Tuo contributo minimo» nella sezione 2 (× 13 mensilità). Se l'hai preso dal file delle operazioni è il tuo ultimo versamento mensile: se versi più del minimo, scrivi lì solo il minimo."
        : `La quota viene dalla regola sulla RAL (2% fino a ${euro(r.p.inps_first_band)}, 7% oltre): con questa RAL il minimo supera lo spazio deducibile che resta dopo il contributo dell’azienda.`}
    </span>
  );
}
