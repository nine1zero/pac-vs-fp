// Pagina I "Discussioni e feedback" — una discussione fissa per categoria con Giscus, senza chiamate API dirette a GitHub (SPEC par. 3.0 Pagina I, Feedback.dc.html).
import { useEffect, useRef, useState } from 'react';
import { BackLink } from '../BackLink';

export const GISCUS_REPO = 'nine1zero/pac-vs-fp';
export const GISCUS_REPO_ID = 'R_kgDOVSyBOA';

export type CategoryName = 'Announcements' | 'General' | 'Ideas' | 'Q&A';

export interface DiscussionCategory {
  id: string;
  name: CategoryName;
  label: string;
  slug: string;
  number: number;
  title: string;
  locked: boolean;
}

/** Le 4 discussioni fisse per categoria (SPEC par. 3.0 Pagina I). */
export const DISCUSSION_CATEGORIES: readonly DiscussionCategory[] = [
  {
    id: 'DIC_kwDOVSyBOM4DK29E',
    name: 'Announcements',
    label: 'Annunci',
    slug: 'announcements',
    number: 29,
    title: 'Annunci — Novità e aggiornamenti',
    locked: true,
  },
  {
    id: 'DIC_kwDOVSyBOM4DK29F',
    name: 'General',
    label: 'General',
    slug: 'general',
    number: 27,
    title: 'General — Feedback e commenti sul simulatore',
    locked: false,
  },
  {
    id: 'DIC_kwDOVSyBOM4DK29H',
    name: 'Ideas',
    label: 'Ideas',
    slug: 'ideas',
    number: 20,
    title: 'Ideas — Proposte e nuove funzioni',
    locked: false,
  },
  {
    id: 'DIC_kwDOVSyBOM4DK29G',
    name: 'Q&A',
    label: 'Q&A',
    slug: 'q-a',
    number: 16,
    title: 'Domande e risposte (Q&A) pac/fondo IBM',
    locked: false,
  },
] as const;

/** Accesso con GitHub tramite Giscus: al ritorno l'URL ha `?giscus=<sessione>`, letta da consumeGiscusSession. */
export function giscusLoginUrl(): string {
  return `https://giscus.app/api/oauth/authorize?redirect_uri=${encodeURIComponent(window.location.href)}`;
}

export function getGiscusThemeUrl(file = 'giscus-theme.css'): string {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    const base = import.meta.env.BASE_URL || '/';
    return `${window.location.origin}${base.endsWith('/') ? base : `${base}/`}${file}`;
  }
  return `https://nine1zero.github.io/pac-vs-fp/${file}`;
}

function consumeGiscusSession(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const url = new URL(window.location.href);
    const param = url.searchParams.get('giscus');
    if (param) {
      window.localStorage.setItem('giscus-session', JSON.stringify(param));
      url.searchParams.delete('giscus');
      window.history.replaceState(undefined, document.title, url.toString());
      return param;
    }
    const raw = window.localStorage.getItem('giscus-session');
    if (!raw || raw === '""' || raw === 'null') return null;
    try {
      const parsed = JSON.parse(raw) as unknown;
      return typeof parsed === 'string' && parsed.length > 0 ? parsed : null;
    } catch {
      return raw;
    }
  } catch {
    return null;
  }
}

export function Feedback() {
  const [initialSession] = useState<string | null>(() => consumeGiscusSession());
  const [logged, setLogged] = useState<boolean>(() => Boolean(initialSession));
  const [cat, setCat] = useState<CategoryName>('Announcements');
  const [counts, setCounts] = useState<Partial<Record<CategoryName, number>>>({});
  const hostRef = useRef<HTMLDivElement>(null);

  const th =
    DISCUSSION_CATEGORIES.find((c) => c.name === cat) ?? DISCUSSION_CATEGORIES[0]!;

  // Riceve da Giscus i metadati della discussione aperta (conteggio commenti) senza fare chiamate API a GitHub.
  useEffect(() => {
    if (!logged) return;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://giscus.app') return;
      const data = event.data as {
        giscus?: {
          discussion?: {
            totalCommentCount?: number;
            totalReplyCount?: number;
          };
        };
      } | null;
      const disc = data?.giscus?.discussion;
      if (disc && typeof disc.totalCommentCount === 'number') {
        const total = disc.totalCommentCount + (disc.totalReplyCount ?? 0);
        setCounts((prev) => (prev[cat] === total ? prev : { ...prev, [cat]: total }));
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [logged, cat]);

  // Monta o aggiorna Giscus per la discussione fissa della categoria selezionata (`data-mapping="number"`).
  useEffect(() => {
    if (!logged) return;
    const host = hostRef.current;
    if (!host) return;
    const term = String(th.number);
    const theme = getGiscusThemeUrl(
      th.locked ? 'giscus-announcements.css?v=1' : 'giscus-theme.css?v=8',
    );

    const iframe = host.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          giscus: {
            setConfig: {
              theme,
              repo: GISCUS_REPO,
              repoId: GISCUS_REPO_ID,
              category: th.name,
              categoryId: th.id,
              mapping: 'number',
              term,
              strict: false,
              reactionsEnabled: false,
              emitMetadata: true,
              inputPosition: 'top',
              lang: 'it',
            },
          },
        },
        'https://giscus.app',
      );
      return;
    }

    host.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('data-repo', GISCUS_REPO);
    script.setAttribute('data-repo-id', GISCUS_REPO_ID);
    script.setAttribute('data-category', th.name);
    script.setAttribute('data-category-id', th.id);
    script.setAttribute('data-mapping', 'number');
    script.setAttribute('data-term', term);
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '0');
    script.setAttribute('data-emit-metadata', '1');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', theme);
    script.setAttribute('data-lang', 'it');
    host.appendChild(script);
  }, [logged, th]);

  const handleLogout = () => {
    try {
      window.localStorage.removeItem('giscus-session');
    } catch {
      // ignore storage errors
    }
    if (hostRef.current) {
      hostRef.current.innerHTML = '';
    }
    setLogged(false);
  };

  const count = counts[th.name];
  const metaText = th.locked
    ? 'solo lettura'
    : count !== undefined
      ? `${count} ${count === 1 ? 'commento' : 'commenti'}`
      : null;

  return (
    <main className="wrap main fb-page" id="contenuto">
      <section className="page-head">
        <div className="hero-text fb-hero-text">
          <h1 className="h1">
            Discussioni e <span className="mark">feedback</span>
          </h1>
          <p className="lead">
            Gli Annunci raccolgono le novità di ogni versione del simulatore (solo lettura). Poi tre discussioni pubbliche su GitHub dove scrivono tutti: General per i commenti, Ideas per le proposte, Q&amp;A per le domande.
          </p>
        </div>
        <BackLink top />
      </section>

      <div className="fb-controls">
        <div role="radiogroup" aria-label="Categoria" className="fb-segs">
          {DISCUSSION_CATEGORIES.map((c) => {
            const on = cat === c.name;
            const cnt = counts[c.name];
            return (
              <button
                key={c.name}
                type="button"
                role="radio"
                className="fb-seg"
                aria-checked={on}
                onClick={() => setCat(c.name)}
              >
                {c.locked && (
                  <span title="Solo lettura" className="fb-lock-icon">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <rect x="5" y="11" width="14" height="10" rx="2" />
                      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                    </svg>
                  </span>
                )}
                {c.label}
                {cnt !== undefined && (
                  <>
                    {' '}
                    <span className="fb-seg-n">{cnt}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className={`fb-card${logged && th.locked ? ' fb-card-plain' : ''}`}>
        {!logged && (
          <div className="fb-gate" data-testid="fb-gate">
            <div aria-hidden="true" className="fb-skel">
              {(
                [
                  ['62%', '34%'],
                  ['48%', '28%'],
                  ['70%', '40%'],
                ] as const
              ).map(([a, b], i) => (
                <span key={i} className="fb-skel-row">
                  <span className="fb-skel-pill" />
                  <span className="fb-skel-lines">
                    <span className="fb-skel-a" style={{ width: a }} />
                    <span className="fb-skel-b" style={{ width: b }} />
                  </span>
                </span>
              ))}
            </div>
            <div className="fb-gate-overlay">
              <a className="fb-load fb-login" href={giscusLoginUrl()} data-testid="fb-login">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                Accedi con GitHub
              </a>
            </div>
          </div>
        )}

        {logged && (
          <div
            className={`fb-thread${th.locked ? ' fb-thread-plain' : ''}`}
            data-testid="fb-thread"
          >
            <div className={`fb-thread-head${th.locked ? ' fb-thread-head-plain' : ''}`}>
              <span className="fb-thread-row">
                <h2 title={th.title} className="fb-thread-title">
                  {th.title}
                </h2>
                {metaText && <span className="fb-thread-count">{metaText}</span>}
                <span aria-hidden="true" className="fb-thread-dot">
                  ·
                </span>
                <a
                  href={`https://github.com/${GISCUS_REPO}/discussions/${th.number}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="fb-gh-link"
                >
                  Apri su GitHub ↗
                </a>
              </span>
            </div>

            <div ref={hostRef} className="giscus-host" data-testid="giscus-host" />
          </div>
        )}
      </div>

      <div className="sec-foot fb-foot">
        <span className="fb-foot-left">
          {logged && (
            <span className="fb-auth-status" data-testid="fb-auth-status">
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Collegato a GitHub ·{' '}
              <button type="button" className="fx-txt fb-logout" onClick={handleLogout}>
                Disconnetti
              </button>
            </span>
          )}
        </span>
        <BackLink />
      </div>
    </main>
  );
}
