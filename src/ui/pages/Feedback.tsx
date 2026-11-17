// Pagina I "Discussioni e feedback" — elenco a pagine e discussione aperta con Giscus (SPEC par. 3.0 Pagina I, Feedback.dc.html, FeedbackAperta.dc.html).
import { useEffect, useMemo, useRef, useState } from 'react';
import { BackLink } from '../BackLink';

export const GISCUS_REPO = 'nine1zero/pac-vs-fp';
export const GISCUS_REPO_ID = 'R_kgDOVSyBOA';
const [REPO_OWNER, REPO_NAME] = GISCUS_REPO.split('/') as [string, string];

export const DISCUSSIONS_PER_PAGE = 10;

export type CategoryName = 'General' | 'Ideas' | 'Q&A';
export type CategoryFilter = 'all' | CategoryName;

export interface DiscussionCategory {
  id: string;
  name: CategoryName;
  slug: string;
  defaultTerm: string;
}

/** Le 3 categorie di GitHub Discussions usate dall'app ("Announcements" esclusa). */
export const DISCUSSION_CATEGORIES: readonly DiscussionCategory[] = [
  {
    id: 'DIC_kwDOVSyBOM4DK29F',
    name: 'General',
    slug: 'general',
    defaultTerm: 'General — Feedback e commenti sul simulatore',
  },
  {
    id: 'DIC_kwDOVSyBOM4DK29H',
    name: 'Ideas',
    slug: 'ideas',
    defaultTerm: 'Ideas — Proposte e nuove funzioni',
  },
  {
    id: 'DIC_kwDOVSyBOM4DK29G',
    name: 'Q&A',
    slug: 'q-a',
    defaultTerm: 'Q&A — Domande sul modello e sul fondo',
  },
] as const;

const CATEGORY_TABS: readonly [CategoryFilter, string][] = [
  ['all', 'Tutte'],
  ['General', 'General'],
  ['Ideas', 'Ideas'],
  ['Q&A', 'Q&A'],
];

const ALLOWED_SLUGS = new Set<string>(DISCUSSION_CATEGORIES.map((c) => c.slug));
const ALLOWED_NAMES = new Set<string>(DISCUSSION_CATEGORIES.map((c) => c.name));

interface GhDiscussionApiItem {
  number: number;
  title: string;
  comments?: number;
  created_at?: string;
  updated_at?: string;
  answer_chosen_at?: string | null;
  locked?: boolean;
  user?: { login?: string } | null;
  category?: { name?: string; slug?: string } | null;
}

export interface DiscussionRow {
  n: number;
  title: string;
  author: string | null;
  date: string;
  cat: CategoryName;
  comments: number;
  answered: boolean;
  locked: boolean;
  isCustom?: boolean;
}

const FIRST_COMMENT_AUTHORS_QUERY = `
  query($owner: String!, $name: String!) {
    repository(owner: $owner, name: $name) {
      discussions(first: 100) {
        nodes {
          number
          comments(first: 1) {
            nodes {
              author { login }
            }
          }
        }
      }
    }
  }
`;

const MONTHS_IT = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

export function fmtDiscussionDate(iso: string): string {
  const clean = (iso || '').slice(0, 10);
  const parts = clean.split('-');
  if (parts.length !== 3) return clean;
  const y = parts[0]!;
  const m = parseInt(parts[1]!, 10);
  const d = parseInt(parts[2]!, 10);
  if (!Number.isFinite(m) || !Number.isFinite(d)) return clean;
  return `${d} ${MONTHS_IT[m - 1] ?? ''} ${y}`;
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
  const [loaded, setLoaded] = useState<boolean>(() => Boolean(initialSession));
  const [logged, setLogged] = useState<boolean>(() => Boolean(initialSession));
  const [cat, setCat] = useState<CategoryFilter>('all');
  const [sort, setSort] = useState<'recent' | 'comments'>('recent');
  const [page, setPage] = useState<number>(0);
  const [openId, setOpenId] = useState<number | null>(null);
  const [editing, setEditing] = useState<boolean>(false);
  const [newTopicText, setNewTopicText] = useState<string>('');
  const [mine, setMine] = useState<DiscussionRow[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionRow[]>([]);
  const [discussionsLoaded, setDiscussionsLoaded] = useState<boolean>(false);
  const [rateLimited, setRateLimited] = useState<{ limited: boolean; resetMinutes: number | null }>({
    limited: false,
    resetMinutes: null,
  });
  const [firstAuthors, setFirstAuthors] = useState<Record<number, string | null>>({});
  const hostRef = useRef<HTMLDivElement>(null);

  // Una sola richiesta REST all'apertura dell'elenco (SPEC par. 3.0 Pagina I): fino a 100 discussioni, calcoli nel browser.
  useEffect(() => {
    if (!loaded) return;
    let cancelled = false;
    fetch(`https://api.github.com/repos/${GISCUS_REPO}/discussions?per_page=100`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then(async (r) => {
        if (cancelled) return;
        const remaining = r.headers.get('x-ratelimit-remaining');
        if (r.status === 429 || (r.status === 403 && (remaining === '0' || remaining === null))) {
          const resetHeader = r.headers.get('x-ratelimit-reset');
          const resetSec = resetHeader ? Number(resetHeader) : NaN;
          const resetMinutes = Number.isFinite(resetSec)
            ? Math.max(1, Math.ceil((resetSec * 1000 - Date.now()) / 60000))
            : 60;
          setRateLimited({ limited: true, resetMinutes });
          setDiscussionsLoaded(true);
          return;
        }
        if (!r.ok) {
          setDiscussionsLoaded(true);
          return;
        }
        const data = (await r.json()) as unknown;
        if (cancelled || !Array.isArray(data)) return;
        const todayIso = new Date().toISOString().slice(0, 10);
        const rows: DiscussionRow[] = (data as GhDiscussionApiItem[])
          .filter(
            (d) =>
              ALLOWED_SLUGS.has(d.category?.slug ?? '') || ALLOWED_NAMES.has(d.category?.name ?? ''),
          )
          .map((d) => {
            const catObj =
              DISCUSSION_CATEGORIES.find(
                (c) => c.slug === d.category?.slug || c.name === d.category?.name,
              ) ?? DISCUSSION_CATEGORIES[0]!;
            const userLogin =
              d.user?.login && d.user.login !== 'giscus[bot]' ? d.user.login : null;
            return {
              n: d.number,
              title: d.title,
              author: userLogin,
              date: (d.created_at || d.updated_at || todayIso).slice(0, 10),
              cat: catObj.name,
              comments: d.comments ?? 0,
              answered: Boolean(d.answer_chosen_at),
              locked: Boolean(d.locked),
            };
          });
        setRateLimited({ limited: false, resetMinutes: null });
        setDiscussions(rows);
        setDiscussionsLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setDiscussionsLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [loaded]);

  // Con l'accesso, una sola richiesta GraphQL recupera l'autore del primo commento per le discussioni create da giscus[bot].
  useEffect(() => {
    if (!loaded || !logged) return;
    const session = consumeGiscusSession();
    if (!session) {
      setLogged(false);
      return;
    }
    let cancelled = false;
    fetch('https://giscus.app/api/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ session }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((tokData: { token?: string } | null) => {
        if (cancelled || !tokData?.token) return null;
        return fetch('https://api.github.com/graphql', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokData.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: FIRST_COMMENT_AUTHORS_QUERY,
            variables: { owner: REPO_OWNER, name: REPO_NAME },
          }),
        });
      })
      .then((r) => (r && r.ok ? r.json() : null))
      .then((res) => {
        if (cancelled || !res?.data?.repository?.discussions?.nodes) return;
        const map: Record<number, string | null> = {};
        for (const node of res.data.repository.discussions.nodes as {
          number: number;
          comments?: { nodes?: { author?: { login?: string } | null }[] };
        }[]) {
          map[node.number] = node.comments?.nodes?.[0]?.author?.login ?? null;
        }
        setFirstAuthors(map);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [loaded, logged]);

  const all = useMemo(() => [...mine, ...discussions], [mine, discussions]);

  const list = useMemo(() => {
    const filtered = all.filter((d) => cat === 'all' || d.cat === cat);
    return [...filtered].sort((a, b) =>
      sort === 'comments' ? b.comments - a.comments || b.n - a.n : b.n - a.n,
    );
  }, [all, cat, sort]);

  const np = Math.max(1, Math.ceil(list.length / DISCUSSIONS_PER_PAGE));
  const pg = Math.min(page, np - 1);
  const shown = list.slice(pg * DISCUSSIONS_PER_PAGE, (pg + 1) * DISCUSSIONS_PER_PAGE);

  const th = useMemo(
    () => (openId === null ? null : all.find((d) => d.n === openId) ?? null),
    [all, openId],
  );

  const newCat: CategoryName = cat === 'all' ? 'General' : cat;

  // Monta Giscus quando una discussione è aperta (`data-mapping="number"` per discussioni esistenti, `"specific"` per argomenti appena creati).
  useEffect(() => {
    if (!loaded || rateLimited.limited || !th) return;
    const host = hostRef.current;
    if (!host) return;
    const catObj =
      DISCUSSION_CATEGORIES.find((c) => c.name === th.cat) ?? DISCUSSION_CATEGORIES[0]!;
    const mapping = th.isCustom ? 'specific' : 'number';
    const term = th.isCustom ? th.title : String(th.n);
    const theme = getGiscusThemeUrl('giscus-theme.css?v=7');

    const iframe = host.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          giscus: {
            setConfig: {
              theme,
              repo: GISCUS_REPO,
              repoId: GISCUS_REPO_ID,
              category: catObj.name,
              categoryId: catObj.id,
              mapping,
              term,
              strict: false,
              reactionsEnabled: false,
              emitMetadata: false,
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
    script.setAttribute('data-category', catObj.name);
    script.setAttribute('data-category-id', catObj.id);
    script.setAttribute('data-mapping', mapping);
    script.setAttribute('data-term', term);
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '0');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', theme);
    script.setAttribute('data-lang', 'it');
    host.appendChild(script);
  }, [loaded, rateLimited.limited, th]);

  const who = (d: DiscussionRow): { lead: string; author: string } => {
    if (d.isCustom) return { lead: 'aperta da', author: d.author || 'tu' };
    if (!logged) return { lead: 'aperta', author: '' };
    const author = d.author ?? firstAuthors[d.n] ?? null;
    if (author) return { lead: 'aperta da', author };
    if (d.comments === 0) return { lead: 'creata da', author: 'giscus' };
    return { lead: 'aperta', author: '' };
  };

  const commitNewTopic = () => {
    const clean = newTopicText.trim();
    if (!clean) return;
    const n = 1000 + mine.length;
    const todayIso = new Date().toISOString().slice(0, 10);
    const created: DiscussionRow = {
      n,
      title: clean,
      author: 'tu',
      date: todayIso,
      cat: newCat,
      comments: 0,
      answered: false,
      locked: false,
      isCustom: true,
    };
    setMine((prev) => [created, ...prev]);
    setNewTopicText('');
    setEditing(false);
    setOpenId(n);
  };

  const showList = loaded && !rateLimited.limited && !th;
  const inThread = loaded && !rateLimited.limited && Boolean(th);
  const hasPages = showList && list.length > 0;
  const thWho = th ? who(th) : { lead: 'aperta', author: '' };

  return (
    <main className="wrap main fb-page" id="contenuto">
      <section className="page-head">
        <div className="hero-text fb-hero-text">
          <h1 className="h1">
            Discussioni e <span className="mark">feedback</span>
          </h1>
          <p className="lead">
            Domande, errori trovati o idee: ogni argomento è una discussione pubblica su GitHub. Scegli una categoria, apri un argomento o creane uno nuovo.
          </p>
        </div>
        <BackLink top />
      </section>

      <div className="fb-controls">
        <div role="radiogroup" aria-label="Categoria" className="fb-segs">
          {CATEGORY_TABS.map(([key, label]) => {
            const on = cat === key;
            const cnt = key === 'all' ? all.length : all.filter((d) => d.cat === key).length;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                className="fb-seg"
                aria-checked={on}
                onClick={() => {
                  setCat(key);
                  setPage(0);
                  setOpenId(null);
                  setEditing(false);
                }}
              >
                {label}
                {(discussionsLoaded || mine.length > 0) && (
                  <>
                    {' '}
                    <span className="fb-seg-n">{cnt}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        <span className="fb-controls-right">
          <span role="radiogroup" aria-label="Ordine" className="fb-sorts">
            {(
              [
                ['recent', 'Più recenti'],
                ['comments', 'Più commentate'],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="radio"
                className="fx-txt"
                aria-checked={sort === k}
                onClick={() => {
                  setSort(k);
                  setPage(0);
                }}
              >
                {label}
              </button>
            ))}
          </span>
          <button
            type="button"
            className="btn ghost fb-new-btn"
            onClick={() => {
              setEditing(true);
              setOpenId(null);
              setLoaded(true);
            }}
          >
            + Nuovo argomento
          </button>
        </span>
      </div>

      <div className="fb-card">
        {!loaded && (
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
              <button type="button" className="fb-load" onClick={() => setLoaded(true)}>
                Mostra le discussioni
              </button>
              <span className="fb-gate-note">
                Si collega a GitHub solo dopo il clic · se hai già fatto l’accesso si aprono da sole
              </span>
            </div>
          </div>
        )}

        {loaded && rateLimited.limited && (
          <div role="alert" className="fb-limit" data-testid="fb-limit">
            <strong className="fb-limit-title">
              GitHub ha messo in pausa le richieste da questa rete
            </strong>
            <span className="fb-limit-text">
              Senza accesso a GitHub ne permette 60 l’ora. Riprova tra{' '}
              {rateLimited.resetMinutes ?? 1}{' '}
              {rateLimited.resetMinutes === 1 ? 'minuto' : 'minuti'}, oppure leggi le discussioni
              direttamente su GitHub.
            </span>
            <a
              href={`https://github.com/${GISCUS_REPO}/discussions`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn ghost fb-new-btn"
            >
              Apri le discussioni su GitHub ↗
            </a>
          </div>
        )}

        {showList && (
          <div role="list" aria-label="Discussioni" className="fb-list">
            {editing && (
              <div role="listitem" className="fb-edit-row">
                <span className="fb-edit-cat">in {newCat}</span>
                <input
                  type="text"
                  className="fx-line fb-edit-input"
                  value={newTopicText}
                  onChange={(e) => setNewTopicText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitNewTopic();
                    } else if (e.key === 'Escape') {
                      setEditing(false);
                      setNewTopicText('');
                    }
                  }}
                  aria-label="Titolo del nuovo argomento"
                  placeholder="Titolo del nuovo argomento, Invio per crearlo"
                  autoFocus
                />
                <button type="button" className="fb-create-btn" onClick={commitNewTopic}>
                  Crea ↵
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setNewTopicText('');
                  }}
                  aria-label="Annulla"
                  className="fx-txt fb-cancel"
                >
                  ×
                </button>
              </div>
            )}

            {shown.map((d) => {
              const w = who(d);
              const cLabel = `${d.comments} ${d.comments === 1 ? 'commento' : 'commenti'}`;
              return (
                <div key={d.n} role="listitem" className="fd-row">
                  <span className="fd-row-main">
                    <button type="button" onClick={() => setOpenId(d.n)} className="fd-title">
                      {d.title}
                    </button>
                    <span className="fd-meta">
                      <span>
                        {w.lead}{' '}
                        {w.author && (
                          <>
                            <span className="fd-u">{w.author}</span>{' '}
                          </>
                        )}
                        il {fmtDiscussionDate(d.date)} in <span className="fd-u">{d.cat}</span>
                      </span>
                      {d.answered && <span className="fd-pill-ans">✓ Risposta scelta</span>}
                      {d.locked && <span className="fd-pill-lock">Bloccata</span>}
                    </span>
                  </span>
                  <span aria-label={cLabel} className="fd-comments">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
                    </svg>
                    {d.comments}
                  </span>
                </div>
              );
            })}

            {discussionsLoaded && list.length === 0 && (
              <span className="fb-empty">
                Ancora niente in questa categoria. Inizia tu con «+ Nuovo argomento».
              </span>
            )}
          </div>
        )}

        {inThread && th && (
          <div className="fb-thread" data-testid="fb-thread">
            <span className="fb-thread-top">
              <button type="button" className="fx-txt" onClick={() => setOpenId(null)}>
                <span aria-hidden="true">←</span> Tutte le discussioni
              </button>
              <a
                href={
                  th.isCustom
                    ? `https://github.com/${GISCUS_REPO}/discussions`
                    : `https://github.com/${GISCUS_REPO}/discussions/${th.n}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="fx-txt fb-gh-link"
              >
                Apri su GitHub ↗
              </a>
            </span>

            <div className="fb-thread-head">
              <h2 className="fb-thread-title">{th.title}</h2>
              <span className="fb-thread-meta">
                <span>
                  {thWho.lead}
                  {thWho.author ? ` ${thWho.author}` : ''} il {fmtDiscussionDate(th.date)} in{' '}
                  {th.cat} · {th.comments} {th.comments === 1 ? 'commento' : 'commenti'}
                </span>
              </span>
            </div>

            {th.locked && (
              <span className="fb-locked-note">
                Discussione bloccata: non si possono aggiungere commenti.
              </span>
            )}

            <div ref={hostRef} className="giscus-host" data-testid="giscus-host" />
          </div>
        )}
      </div>

      {hasPages && (
        <nav aria-label="Pagine" className="fb-pages">
          <span className="fb-pages-range">
            {pg * DISCUSSIONS_PER_PAGE + 1}–
            {Math.min(list.length, (pg + 1) * DISCUSSIONS_PER_PAGE)} di {list.length}
          </span>
          <button
            type="button"
            className="fx-txt fb-page-arrow"
            onClick={() => {
              if (pg > 0) setPage(pg - 1);
            }}
            aria-disabled={pg === 0}
          >
            ‹ Precedente
          </button>
          {Array.from({ length: np }, (_, i) => {
            const active = i === pg;
            return (
              <button
                key={i}
                type="button"
                className={`fb-page-num${active ? ' on' : ''}`}
                aria-current={active ? 'page' : 'false'}
                aria-label={`Pagina ${i + 1}`}
                onClick={() => setPage(i)}
              >
                {i + 1}
              </button>
            );
          })}
          <button
            type="button"
            className="fx-txt fb-page-arrow"
            onClick={() => {
              if (pg < np - 1) setPage(pg + 1);
            }}
            aria-disabled={pg >= np - 1}
          >
            Successiva ›
          </button>
        </nav>
      )}

      <div className="sec-foot fb-foot">
        <span className="fb-foot-note">
          Una sola richiesta alle API di GitHub all’apertura (fino a 100 discussioni): categorie, conteggi, ordine e pagine si calcolano nel browser. La discussione aperta e i commenti sono Giscus; la data di un commento lo apre su GitHub, dove chi l’ha scritto lo modifica o cancella; «MD» apre la guida alla formattazione. Con l’accesso, chi ha aperto la discussione è l’autore del primo commento (Giscus le crea a nome di giscus[bot]).
        </span>
        <BackLink />
      </div>
    </main>
  );
}
