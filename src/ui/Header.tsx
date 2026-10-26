import { forget, useStore } from '../state/store';

function itDateTime(iso: string) {
  return new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function Header() {
  const { state, dispatch } = useStore();
  const label = state.storeErr
    ? 'Salvataggio non disponibile'
    : state.savedAt === null
      ? 'Salvataggio automatico'
      : `Salvato · ${itDateTime(state.savedAt)}`;
  return (
    <>
      <a className="skip" href="#contenuto">
        Vai al contenuto
      </a>
      <div className="topbar">Simulatore indipendente · non affiliato al fondo né all'azienda · non è consulenza · il calcolo avviene solo sul tuo dispositivo</div>
      <header className="wrap site-header">
        <a href="#/" className="logo" aria-label="pac/fondo IBM, torna al simulatore">
          pac<span className="slash">/</span>fondo IBM<span className="dot" />
        </a>
        <nav className="head-nav" aria-label="Principale">
          <span className="tip tip-right tip-below">
            <span className="badge save-status" tabIndex={0} aria-describedby="tip-save" data-testid="save-status">
              {label}
            </span>
            <span className="bubble" role="tooltip" id="tip-save">
              {state.storeErr
                ? 'Questo browser non permette di salvare (ad esempio in navigazione privata): i dati restano finché non chiudi la pagina.'
                : 'Ogni dato che inserisci si salva da solo nella memoria di questo browser (localStorage, non cookie). Resta solo su questo dispositivo, non viene inviato a nessuno, e al prossimo accesso ritrovi tutto com’era. Anche il file delle operazioni si salva qui. Per cancellare tutto usa «Cancella tutto».'}
            </span>
          </span>
          <span className="tip tip-right tip-below">
            <button
              type="button"
              className="btn ghost"
              aria-describedby="tip-reset"
              onClick={() => {
                forget();
                dispatch({ type: 'reset' });
                window.location.hash = '#/';
              }}
            >
              Cancella tutto
            </button>
            <span className="bubble" role="tooltip" id="tip-reset">
              Torna al profilo d’esempio e cancella dalla memoria di questo browser tutti i dati inseriti e il file delle operazioni.
            </span>
          </span>
          <span className="badge">100% locale</span>
          <a href="#/storico" className="btn ghost">
            Storico
          </a>
          <a href="#/parametri" className="btn ghost">
            Parametri e fonti
          </a>
        </nav>
      </header>
    </>
  );
}
