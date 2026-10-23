// Tooltip accessibili da tastiera (hover e focus) e tooltip delle fonti (SPEC par. 3.6).
import { useId, type ReactNode } from 'react';

export type SourceKind = 'Tuo dato' | 'Ipotesi' | 'Calcolo storico' | 'Doc. FPDDI' | 'Norma' | 'Emittente' | 'Calcolo';

interface TipProps {
  /** testo accessibile del pulsante */
  label: string;
  children: ReactNode;
  /** posizione della nuvoletta */
  align?: 'center' | 'right' | 'left';
  below?: boolean;
}

/** Pulsante tondo "i" con nuvoletta. */
export function Tip({ label, children, align = 'center', below = false }: TipProps) {
  const id = useId();
  return (
    <span className={`tip tip-${align}${below ? ' tip-below' : ''}`}>
      <button type="button" className="ib" aria-label={label} aria-describedby={id}>
        i
      </button>
      <span className="bubble" role="tooltip" id={id}>
        {children}
      </span>
    </span>
  );
}

interface SrcProps {
  kind: SourceKind;
  /** riferimento completo: documento e pagina, norma, emittente e data, o la ragione dell'ipotesi */
  source: string;
  /** cosa è il numero, per il lettore di schermo */
  what?: string;
  align?: TipProps['align'];
  below?: boolean;
}

/** Icona della fonte di un numero: tipo di fonte e riferimento completo. */
export function Src({ kind, source, what, align, below }: SrcProps) {
  return (
    <Tip label={`Fonte${what ? ` di ${what}` : ''}`} align={align} below={below}>
      <span className="bubble-kind" data-kind={kind}>
        {kind}
      </span>
      <span data-testid="source-text">{source}</span>
    </Tip>
  );
}

/** Un numero con la sua fonte accanto. */
export function Sourced({ children, ...src }: SrcProps & { children: ReactNode }) {
  return (
    <span className="sourced" data-sourced="">
      {children}
      <Src {...src} />
    </span>
  );
}
