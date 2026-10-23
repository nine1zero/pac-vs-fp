import { forget, isDirty, persist, useStore } from '../state/store';

function itDateTime(iso: string) {
  return new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function Header() {
  const { state, dispatch } = useStore();
  const dirty = isDirty(state);
  const saved = state.savedAt !== null && !dirty;
  const label = state.storeErr
    ? 'Salvataggio non disponibile'
    : state.savedAt === null
      ? 'Salva i miei dati'
      : saved
        ? `Salvato · ${itDateTime(state.savedAt)}`
        : 'Salva le modifiche';
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
            <button
              type="button"
              className={`btn save${saved ? '' : ' lime-outline'}`}
              aria-describedby="tip-save"
              onClick={() => {
                const at = new Date().toISOString();
                if (persist(state, at)) dispatch({ type: 'save', at });
                else dispatch({ type: 'saveFailed' });
              }}
            >
              {label}
            </button>
            <span className="bubble" role="tooltip" id="tip-save">
              Salva i dati inseriti nella memoria di questo browser (localStorage, non cookie). Restano solo su questo dispositivo, non vengono inviati a nessuno, e
              al prossimo accesso ritrovi tutto com’era. Il file importato non viene salvato.
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
              Torna al profilo d’esempio e cancella anche i dati salvati in questo browser e il file letto.
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
