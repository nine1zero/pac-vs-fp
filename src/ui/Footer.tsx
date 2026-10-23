import { useStore } from '../state/store';

export const REPO_URL = 'https://github.com/nine1zero/pac-vs-fp';

export function Footer() {
  const { state, dispatch } = useStore();
  return (
    <footer className="wrap site-footer">
      <span>pac/fondo · strumento indipendente · calcolo 100% locale, nessun dato inviato</span>
      <nav className="foot-nav" aria-label="Piè di pagina">
        <a
          href="#/"
          onClick={() => {
            if (state.open !== 0) dispatch({ type: 'open', section: 0 });
            requestAnimationFrame(() => document.getElementById('sezione-0')?.scrollIntoView({ block: 'start' }));
          }}
        >
          Privacy e avvertenze
        </a>
        <a href="#/parametri">Metodo e fonti</a>
        <a href={REPO_URL} rel="noopener noreferrer">
          Codice sorgente
        </a>
      </nav>
      <span>Dati storici: bilanci e pagine pubbliche di fondopensioneibm.it; prezzi ETF di fine mese</span>
    </footer>
  );
}
