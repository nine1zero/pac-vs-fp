import { useEffect, useRef } from 'react';
import { useStore } from '../state/store';
import {
  DISCUSSION_CATEGORIES,
  GISCUS_REPO,
  GISCUS_REPO_ID,
  getGiscusThemeUrl,
} from './pages/Feedback';
import { useRoute } from './router';

export const REPO_URL = 'https://github.com/nine1zero/pac-vs-fp';

export function Footer() {
  const { state, dispatch } = useStore();
  const route = useRoute();
  const reactionsRef = useRef<HTMLDivElement>(null);

  const showReactions =
    route.page === 'home' || route.page === 'storico' || route.page === 'parametri';

  useEffect(() => {
    if (!showReactions) return;
    const host = reactionsRef.current;
    if (!host) return;
    if (host.querySelector('iframe.giscus-frame, script[src="https://giscus.app/client.js"]')) return;

    const general =
      DISCUSSION_CATEGORIES.find((c) => c.name === 'General') ?? DISCUSSION_CATEGORIES[1]!;
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-repo', GISCUS_REPO);
    script.setAttribute('data-repo-id', GISCUS_REPO_ID);
    script.setAttribute('data-category', general.name);
    script.setAttribute('data-category-id', general.id);
    script.setAttribute('data-mapping', 'specific');
    script.setAttribute('data-term', general.title);
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', getGiscusThemeUrl('giscus-reactions-only.css?v=4'));
    script.setAttribute('data-lang', 'it');
    script.setAttribute('data-loading', 'lazy');
    host.appendChild(script);
  }, [showReactions]);

  return (
    <footer className="wrap site-footer-wrap">
      {showReactions && (
        <div className="foot-giscus-bar" data-testid="foot-giscus-bar">
          <span className="foot-giscus-pill">Feedback</span>
          <div
            ref={reactionsRef}
            className="foot-giscus-reactions"
            data-testid="foot-giscus-reactions"
          />
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
          <a href="#/parametri" aria-current={route.page === 'parametri' ? 'page' : undefined}>
            Metodo e fonti
          </a>
          <a href="#/feedback" aria-current={route.page === 'feedback' ? 'page' : undefined}>
            Discussioni e feedback
          </a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            Codice sorgente
          </a>
        </nav>
        <span>Dati storici: bilanci e pagine pubbliche di fondopensioneibm.it; prezzi ETF di fine mese</span>
      </div>
    </footer>
  );
}
