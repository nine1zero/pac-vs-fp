import { forget, useStore } from '../state/store';
import { REPO_URL } from './Footer';

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
          <span className="badge plain">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
            100% locale
          </span>
          <span className="tip tip-right tip-below">
            <span className="badge plain save-status" tabIndex={0} aria-describedby="tip-save" data-testid="save-status">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
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
              className="btn ghost btn-sm"
              aria-describedby="tip-reset"
              onClick={() => {
                forget();
                dispatch({ type: 'reset' });
                window.location.hash = '#/';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg>
              Cancella tutto
            </button>
            <span className="bubble" role="tooltip" id="tip-reset">
              Torna al profilo d’esempio e cancella dalla memoria di questo browser tutti i dati inseriti e il file delle operazioni.
            </span>
          </span>
          <a href="#/storico" className="btn ghost">
            Storico
          </a>
          <a href="#/parametri" className="btn ghost">
            Parametri e fonti
          </a>
          <a
            href={REPO_URL}
            rel="noopener noreferrer"
            className="btn ghost btn-icon"
            aria-label="Codice sorgente su GitHub"
            title="Codice sorgente su GitHub"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
        </nav>
      </header>
    </>
  );
}
