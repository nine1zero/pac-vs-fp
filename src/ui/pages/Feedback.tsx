// Pagina "Discussioni e feedback" minimale con Giscus (General, Ideas, Q&A) — SPEC par. 3.0 Pagina I.
import { useEffect, useMemo, useRef, useState } from 'react';

export const GISCUS_REPO = 'nine1zero/pac-vs-fp';
export const GISCUS_REPO_ID = 'R_kgDOVSyBOA';

export interface DiscussionCategory {
  id: string;
  name: string;
  slug: string;
  defaultTerm: string;
}

/** Le 3 categorie di GitHub Discussions su nine1zero/pac-vs-fp. */
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

const ALLOWED_SLUGS = new Set(DISCUSSION_CATEGORIES.map((c) => c.slug));
const ALLOWED_NAMES = new Set(DISCUSSION_CATEGORIES.map((c) => c.name));

interface GhDiscussionItem {
  number: number;
  title: string;
  comments: number;
  updated_at: string;
  category?: { name: string; slug: string };
}

export function getGiscusThemeUrl(file = 'giscus-theme.css'): string {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    const base = import.meta.env.BASE_URL || '/';
    return `${window.location.origin}${base.endsWith('/') ? base : `${base}/`}${file}`;
  }
  return `https://nine1zero.github.io/pac-vs-fp/${file}`;
}

function hasGiscusOAuthReturn(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.location.search.includes('giscus=')) return true;
    if (window.localStorage.getItem('giscus-session')) return true;
  } catch {
    // localStorage non disponibile
  }
  return false;
}

export function Feedback() {
  const [catSlug, setCatSlug] = useState<string>('general');
  const [discussions, setDiscussions] = useState<GhDiscussionItem[]>([]);
  const [discussionsLoaded, setDiscussionsLoaded] = useState(false);
  const [customTopics, setCustomTopics] = useState<string[]>([]);
  const [activeTarget, setActiveTarget] = useState<
    { kind: 'default' } | { kind: 'number'; number: number; title: string } | { kind: 'custom'; term: string }
  >({ kind: 'default' });
  const [editing, setEditing] = useState(false);
  const [newTopicText, setNewTopicText] = useState('');
  const [loaded, setLoaded] = useState<boolean>(() => hasGiscusOAuthReturn());
  const hostRef = useRef<HTMLDivElement>(null);

  const activeCategory = useMemo(
    () => DISCUSSION_CATEGORIES.find((c) => c.slug === catSlug) ?? DISCUSSION_CATEGORIES[0]!,
    [catSlug],
  );

  // Carica i conteggi e le discussioni delle 3 categorie da GitHub (mai stimati)
  useEffect(() => {
    let cancelled = false;
    fetch(`https://api.github.com/repos/${GISCUS_REPO}/discussions?per_page=30`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return;
        const valid = (data as GhDiscussionItem[]).filter(
          (d) => ALLOWED_SLUGS.has(d.category?.slug ?? '') || ALLOWED_NAMES.has(d.category?.name ?? ''),
        );
        setDiscussions(valid);
        setDiscussionsLoaded(true);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const catDiscussions = useMemo(
    () =>
      discussions.filter(
        (d) => d.category?.slug === activeCategory.slug || d.category?.name === activeCategory.name,
      ),
    [discussions, activeCategory],
  );

  const mapping = activeTarget.kind === 'number' ? 'number' : 'specific';
  const term =
    activeTarget.kind === 'number'
      ? String(activeTarget.number)
      : activeTarget.kind === 'custom'
        ? activeTarget.term
        : activeCategory.defaultTerm;

  // Giscus si carica solo dopo il clic su "Mostra i commenti" o "Accedi con GitHub" (SPEC par. 3.0 Pagina I)
  useEffect(() => {
    if (!loaded) return;
    const host = hostRef.current;
    if (!host) return;
    const theme = getGiscusThemeUrl('giscus-theme.css?v=6');

    const iframe = host.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          giscus: {
            setConfig: {
              theme,
              repo: GISCUS_REPO,
              repoId: GISCUS_REPO_ID,
              category: activeCategory.name,
              categoryId: activeCategory.id,
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
    script.setAttribute('data-category', activeCategory.name);
    script.setAttribute('data-category-id', activeCategory.id);
    script.setAttribute('data-mapping', mapping);
    script.setAttribute('data-term', term);
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '0');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', theme);
    script.setAttribute('data-lang', 'it');
    host.appendChild(script);
  }, [loaded, activeCategory, mapping, term]);

  const countByCat = (slug: string, name: string) =>
    discussions.filter((d) => d.category?.slug === slug || d.category?.name === name).length;

  const selectValue =
    activeTarget.kind === 'number'
      ? `num:${activeTarget.number}`
      : activeTarget.kind === 'custom'
        ? `custom:${activeTarget.term}`
        : 'default';

  const commitNewTopic = () => {
    const clean = newTopicText.trim();
    if (!clean) return;
    setCustomTopics((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
    setActiveTarget({ kind: 'custom', term: clean });
    setNewTopicText('');
    setEditing(false);
  };

  return (
    <main className="fb-main" id="contenuto">
      <div className="fb-head">
        <h1 className="h1 fb-h1">
          Discussioni e <span className="mark">feedback</span>
        </h1>
        <a href="#/" className="fb-back">
          <span aria-hidden="true">←</span> Torna al simulatore
        </a>
      </div>

      <div className="fb-controls">
        <div role="radiogroup" aria-label="Categoria" className="fb-segs">
          {DISCUSSION_CATEGORIES.map((c) => {
            const on = catSlug === c.slug;
            const cnt = countByCat(c.slug, c.name);
            return (
              <button
                key={c.id}
                type="button"
                role="radio"
                className="fb-seg"
                aria-checked={on}
                onClick={() => {
                  setCatSlug(c.slug);
                  setActiveTarget({ kind: 'default' });
                  setCustomTopics([]);
                  setEditing(false);
                  setNewTopicText('');
                }}
              >
                {c.name}
                {discussionsLoaded && (
                  <>
                    {' '}
                    <span className="fb-seg-n">{cnt}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {!editing ? (
          <label className="fb-topic-label">
            <span className="sr-only">Argomento</span>
            <select
              className="fx-sel fb-topic-sel"
              value={selectValue}
              onChange={(e) => {
                const v = e.target.value;
                if (v === 'new') {
                  setEditing(true);
                } else if (v === 'default') {
                  setActiveTarget({ kind: 'default' });
                } else if (v.startsWith('num:')) {
                  const num = Number(v.slice(4));
                  const d = catDiscussions.find((x) => x.number === num);
                  if (d) setActiveTarget({ kind: 'number', number: d.number, title: d.title });
                } else if (v.startsWith('custom:')) {
                  const customTerm = v.slice(7);
                  setActiveTarget({ kind: 'custom', term: customTerm });
                }
              }}
            >
              <option value="default">Argomento: {activeCategory.defaultTerm}</option>
              {catDiscussions
                .filter((d) => d.title !== activeCategory.defaultTerm)
                .map((d) => (
                  <option key={`num:${d.number}`} value={`num:${d.number}`}>
                    {d.title}
                  </option>
                ))}
              {customTopics.map((t) => (
                <option key={`custom:${t}`} value={`custom:${t}`}>
                  {t}
                </option>
              ))}
              <option value="new">+ Nuovo argomento…</option>
            </select>
          </label>
        ) : (
          <span className="fb-edit">
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
              aria-label={`Titolo del nuovo argomento in ${activeCategory.name}`}
              placeholder="Titolo del nuovo argomento, Invio per crearlo"
              autoFocus
            />
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
          </span>
        )}
      </div>

      <div className="fb-hr" />

      {!loaded ? (
        <div className="fb-gate" data-testid="fb-gate">
          <span className="fb-gate-note">Commenti pubblici su GitHub · si collega solo se li apri</span>
          <span className="fb-gate-actions">
            <button type="button" className="fx-txt fb-show" onClick={() => setLoaded(true)}>
              Mostra i commenti
            </button>
            <button type="button" className="fb-login" onClick={() => setLoaded(true)}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Accedi con GitHub
            </button>
          </span>
        </div>
      ) : (
        <div ref={hostRef} className="giscus-host" data-testid="giscus-host" />
      )}
    </main>
  );
}
