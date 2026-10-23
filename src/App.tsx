const REPO_URL = 'https://github.com/nine1zero/pac-vs-fp';

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function App() {
  return (
    <>
      <div className="topbar">
        Simulatore indipendente · non affiliato al fondo né all'azienda · non è consulenza · il calcolo avviene solo sul tuo dispositivo
      </div>
      <header className="wrap site-header">
        <span className="logo" aria-label="pac/fondo IBM">
          pac<span className="slash">/</span>fondo IBM<span className="dot" />
        </span>
        <span className="badge">
          <LockIcon />
          100% locale
        </span>
      </header>
      <main className="wrap">
        <h1>
          Simulatore strategie <span className="mark">PAC ETF globale</span> vs Fondo Pensione IBM
        </h1>
        <p className="card">
          Il simulatore è in costruzione. Specifica, formule e fonti dei dati sono pubblici nel{' '}
          <a href={REPO_URL} rel="noopener noreferrer">
            codice sorgente
          </a>
          .
        </p>
      </main>
      <footer className="wrap site-footer">
        <span>pac/fondo · strumento indipendente · calcolo 100% locale, nessun dato inviato</span>
        <a href={REPO_URL} rel="noopener noreferrer">
          Codice sorgente
        </a>
      </footer>
    </>
  );
}
