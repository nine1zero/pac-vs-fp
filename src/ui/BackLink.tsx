/** Pulsante «Torna al simulatore» delle pagine di dettaglio (in cima, a destra del titolo, e in fondo). */
export function BackLink({ top }: { top?: boolean }) {
  return (
    <a href="#/" className={`btn ghost${top ? ' back-top' : ''}`}>
      <span aria-hidden="true">←</span> Torna al simulatore
    </a>
  );
}
