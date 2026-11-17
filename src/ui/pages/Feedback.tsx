// Pagina "Discussioni e feedback" contestuale con Giscus (General, Ideas, Q&A).
import { useEffect, useMemo, useRef, useState } from 'react';
import { BackLink } from '../BackLink';

export const GISCUS_REPO = 'nine1zero/pac-vs-fp';
export const GISCUS_REPO_ID = 'R_kgDOVSyBOA';

export interface DiscussionCategory {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  label: string;
  defaultTerm: string;
}

/** Le 3 categorie attive di GitHub Discussions su nine1zero/pac-vs-fp. */
export const DISCUSSION_CATEGORIES: readonly DiscussionCategory[] = [
  {
    id: 'DIC_kwDOVSyBOM4DK29F',
    name: 'General',
    slug: 'general',
    emoji: '💬',
    label: 'General · Commenti e feedback',
    defaultTerm: 'General — Feedback e commenti sul simulatore',
  },
  {
    id: 'DIC_kwDOVSyBOM4DK29H',
    name: 'Ideas',
    slug: 'ideas',
    emoji: '💡',
    label: 'Ideas · Proposte e nuove funzioni',
    defaultTerm: 'Ideas — Proposte e nuove funzioni',
  },
  {
    id: 'DIC_kwDOVSyBOM4DK29G',
    name: 'Q&A',
    slug: 'q-a',
    emoji: '🙏',
    label: 'Q&A · Domande e dubbi',
    defaultTerm: 'Q&A — Domande sul modello e sul fondo',
  },
] as const;

const ALLOWED_SLUGS = new Set(DISCUSSION_CATEGORIES.map((c) => c.slug));
const ALLOWED_NAMES = new Set(DISCUSSION_CATEGORIES.map((c) => c.name));

interface GhDiscussionItem {
  number: number;
  title: string;
  comments: number;
  upvote_count?: number;
  updated_at: string;
  user?: { login: string };
  category?: { name: string; slug: string };
}

export function getGiscusThemeUrl(file = 'giscus-theme.css'): string {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    const base = import.meta.env.BASE_URL || '/';
    return `${window.location.origin}${base.endsWith('/') ? base : `${base}/`}${file}`;
  }
  return `https://nine1zero.github.io/pac-vs-fp/${file}`;
}

export function Feedback() {
  const [catSlug, setCatSlug] = useState<string>('general');
  const [discussions, setDiscussions] = useState<GhDiscussionItem[]>([]);
  // null = bacheca principale della categoria; number = discussione esistente; string = nuovo argomento creato in-page
  const [activeTarget, setActiveTarget] = useState<
    { kind: 'default' } | { kind: 'number'; number: number; title: string } | { kind: 'custom'; term: string }
  >({ kind: 'default' });
  const [newTopicOpen, setNewTopicOpen] = useState(false);
  const [newTopicText, setNewTopicText] = useState('');
  const hostRef = useRef<HTMLDivElement>(null);

  const activeCategory = useMemo(
    () => DISCUSSION_CATEGORIES.find((c) => c.slug === catSlug) ?? DISCUSSION_CATEGORIES[0]!,
    [catSlug],
  );

  // Carica in background le discussioni esistenti delle 3 categorie (General, Ideas, Q&A)
  useEffect(() => {
    let cancelled = false;
    fetch(`https://api.github.com/repos/${GISCUS_REPO}/discussions?per_page=30`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return;
        const valid = (data as GhDiscussionItem[]).filter(
          (d) => ALLOWED_SLUGS.has(d.category?.slug ?? '') || ALLOWED_NAMES.has(d.category?.name ?? ''),
        );
        setDiscussions(valid);
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

  // Monta o aggiorna contestualmente Giscus (casella commento sempre in alto, senza barra reazioni ripetuta per categoria)
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const theme = getGiscusThemeUrl('giscus-theme.css?v=3');

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
  }, [activeCategory, mapping, term]);

  const countByCat = (slug: string, name: string) =>
    discussions.filter((d) => d.category?.slug === slug || d.category?.name === name).length;

  return (
    <main className="wrap main gsc-page" id="contenuto">
      <section className="page-head gsc-head">
        <div className="hero-text">
          <h1 className="h1">
            Discussioni e <span className="mark">feedback</span>
          </h1>
          <p className="lead">
            Rifai i conti dell’interesse composto alle 2 di notte o hai trovato un centesimo fuori posto? Scegli una categoria, apri un nuovo argomento o
            dì la tua qui sotto.
          </p>
        </div>
        <BackLink top />
      </section>

      <section className="gsc-shell" id="giscus-bacheca" aria-label="Bacheca commenti Giscus">
        {/* Barra minimale: le 3 categorie (General, Ideas, Q&A) + creazione contestuale di un nuovo argomento in-page */}
        <div className="gsc-bar">
          <span className="chips" role="group" aria-label="Categorie di GitHub Discussions">
            {DISCUSSION_CATEGORIES.map((c) => {
              const cnt = countByCat(c.slug, c.name);
              return (
                <button
                  key={c.id}
                  type="button"
                  className="chip"
                  aria-pressed={catSlug === c.slug}
                  onClick={() => {
                    setCatSlug(c.slug);
                    setActiveTarget({ kind: 'default' });
                    setNewTopicOpen(false);
                  }}
                >
                  <span aria-hidden="true">{c.emoji}</span> {c.name}
                  {cnt > 0 && <span className="chip-n">{cnt}</span>}
                </button>
              );
            })}
          </span>

          <button
            type="button"
            className="btn ghost btn-sm gsc-topic-btn"
            aria-expanded={newTopicOpen}
            onClick={() => setNewTopicOpen((v) => !v)}
          >
            {newTopicOpen ? 'Annulla' : '+ Nuovo argomento'}
          </button>
        </div>

        {/* Creazione contestuale di una nuova discussione senza uscire dalla pagina */}
        {newTopicOpen && (
          <form
            className="gsc-new-topic"
            onSubmit={(e) => {
              e.preventDefault();
              const clean = newTopicText.trim();
              if (!clean) return;
              setActiveTarget({ kind: 'custom', term: clean });
              setNewTopicText('');
              setNewTopicOpen(false);
            }}
          >
            <label className="gsc-topic-field">
              <span className="sr-only">Titolo del nuovo argomento in {activeCategory.name}</span>
              <input
                type="text"
                className="gsc-topic-input"
                placeholder={`Titolo del nuovo argomento in ${activeCategory.name} (verrà creato al primo commento)…`}
                value={newTopicText}
                onChange={(e) => setNewTopicText(e.target.value)}
              />
            </label>
            <button type="submit" className="btn lime btn-sm">
              Imposta argomento
            </button>
          </form>
        )}

        {/* Selettore compatto dei thread della categoria (visibile se ci sono più discussioni o un nuovo argomento attivo) */}
        {(catDiscussions.length > 0 || activeTarget.kind === 'custom') && (
          <div className="gsc-threads" role="listbox" aria-label="Discussioni nella categoria">
            <button
              type="button"
              role="option"
              aria-selected={activeTarget.kind === 'default'}
              className={`gsc-thread-pill${activeTarget.kind === 'default' ? ' active' : ''}`}
              onClick={() => setActiveTarget({ kind: 'default' })}
            >
              📌 {activeCategory.defaultTerm}
            </button>
            {activeTarget.kind === 'custom' && (
              <button
                type="button"
                role="option"
                aria-selected={true}
                className="gsc-thread-pill active"
              >
                ✨ {activeTarget.term}
              </button>
            )}
            {catDiscussions
              .filter((d) => d.title !== activeCategory.defaultTerm)
              .map((d) => {
                const isSel = activeTarget.kind === 'number' && activeTarget.number === d.number;
                return (
                  <button
                    key={d.number}
                    type="button"
                    role="option"
                    aria-selected={isSel}
                    className={`gsc-thread-pill${isSel ? ' active' : ''}`}
                    onClick={() => setActiveTarget({ kind: 'number', number: d.number, title: d.title })}
                  >
                    <span>{d.title}</span>
                    <span className="gsc-thread-cnt">💬 {d.comments}</span>
                  </button>
                );
              })}
          </div>
        )}

        {/* Widget Giscus contestuale con reazioni in cima e casella commento sempre in alto */}
        <div ref={hostRef} className="giscus-host" data-testid="giscus-host" />
      </section>

      <div className="page-foot">
        <BackLink />
      </div>
    </main>
  );
}
