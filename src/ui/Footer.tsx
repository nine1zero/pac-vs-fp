import { useStore } from '../state/store';
import { useRoute } from './router';

export const REPO_URL = 'https://github.com/nine1zero/pac-vs-fp';

export function Footer() {
  const { state, dispatch } = useStore();
  const route = useRoute();
  return (
    <footer className="wrap site-footer-wrap">
      {route.page === 'home' && (
        <div className="foot-giscus-bar" data-testid="foot-giscus-bar">
          <div className="foot-giscus-info">
            <span className="foot-giscus-pill">Feedback</span>
            <span className="foot-giscus-text">
              Domande sul modello, idee o commenti? Partecipa alla bacheca con reazioni e discussioni.
            </span>
          </div>
          <a href="#/feedback" className="btn lime btn-sm foot-giscus-cta">
            Tutti i commenti e discussioni <span aria-hidden="true">→</span>
          </a>
        </div>
      )}
      <div className="site-footer">
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
          <a href="#/feedback">Discussioni e feedback</a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            Codice sorgente
          </a>
        </nav>
        <span>Dati storici: bilanci e pagine pubbliche di fondopensioneibm.it; prezzi ETF di fine mese</span>
      </div>
    </footer>
  );
}
