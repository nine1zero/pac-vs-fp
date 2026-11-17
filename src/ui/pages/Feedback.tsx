// Pagina "Discussioni e feedback" con Giscus e categorie originali di GitHub Discussions.
import { useEffect, useMemo, useRef, useState } from 'react';
import { BackLink } from '../BackLink';
import { REPO_URL } from '../Footer';

export const GISCUS_REPO = 'nine1zero/pac-vs-fp';
export const GISCUS_REPO_ID = 'R_kgDOVSyBOA';

export interface DiscussionCategory {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  desc: string;
  defaultTerm: string;
}

/** Categorie originali di GitHub Discussions configurate su nine1zero/pac-vs-fp. */
export const DISCUSSION_CATEGORIES: readonly DiscussionCategory[] = [
  {
    id: 'DIC_kwDOVSyBOM4DK29F',
    name: 'General',
    slug: 'general',
    emoji: '💬',
    desc: 'Commenti generali, pareri e reazioni rapide sul simulatore',
    defaultTerm: 'Bacheca generale pac/fondo IBM',
  },
  {
    id: 'DIC_kwDOVSyBOM4DK29H',
    name: 'Ideas',
    slug: 'ideas',
    emoji: '💡',
    desc: 'Proposte di nuove funzioni, grafici o miglioramenti',
    defaultTerm: 'Idee e nuove funzioni pac/fondo IBM',
  },
  {
    id: 'DIC_kwDOVSyBOM4DK29G',
    name: 'Q&A',
    slug: 'q-a',
    emoji: '🙏',
    desc: 'Domande su regole fiscali, TFR, comparto o calcoli',
    defaultTerm: 'Domande e risposte (Q&A) pac/fondo IBM',
  },
  {
    id: 'DIC_kwDOVSyBOM4DK29I',
    name: 'Show and tell',
    slug: 'show-and-tell',
    emoji: '🙌',
    desc: 'Condividi il tuo caso d’uso, analisi o confronto',
    defaultTerm: 'Show and tell pac/fondo IBM',
  },
  {
    id: 'DIC_kwDOVSyBOM4DK29J',
    name: 'Polls',
    slug: 'polls',
    emoji: '🗳️',
    desc: 'Sondaggi della community',
    defaultTerm: 'Sondaggi pac/fondo IBM',
  },
  {
    id: 'DIC_kwDOVSyBOM4DK29E',
    name: 'Announcements',
    slug: 'announcements',
    emoji: '📣',
    desc: 'Novità e aggiornamenti sulle versioni del simulatore',
    defaultTerm: 'Annunci e aggiornamenti pac/fondo IBM',
  },
] as const;

export const GITHUB_REACTIONS = [
  { key: 'THUMBS_UP', emoji: '👍', label: 'Utile' },
  { key: 'LAUGH', emoji: '😄', label: 'Divertente' },
  { key: 'HOORAY', emoji: '🎉', label: 'Grande' },
  { key: 'HEART', emoji: '❤️', label: 'Top' },
  { key: 'ROCKET', emoji: '🚀', label: 'Super' },
  { key: 'EYES', emoji: '👀', label: 'Interessante' },
  { key: 'CONFUSED', emoji: '😕', label: 'Dubbio' },
  { key: 'THUMBS_DOWN', emoji: '👎', label: 'Non convince' },
] as const;

interface GhDiscussionItem {
  number: number;
  title: string;
  html_url: string;
  comments: number;
  upvote_count?: number;
  created_at: string;
  updated_at: string;
  answer_html_url?: string | null;
  user?: { login: string; avatar_url?: string };
  category?: { name: string; slug: string; emoji?: string };
}

interface GiscusMetadata {
  id?: string;
  url?: string;
  locked?: boolean;
  repository?: { nameWithOwner: string };
  reactionCount?: number;
  totalCommentCount?: number;
  totalReplyCount?: number;
  reactions?: Partial<Record<string, { count: number; viewerHasReacted: boolean }>>;
}

function getGiscusThemeUrl(): string {
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    const base = import.meta.env.BASE_URL || '/';
    return `${window.location.origin}${base.endsWith('/') ? base : `${base}/`}giscus-theme.css`;
  }
  return 'light';
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

export function Feedback({ anchor }: { anchor?: string }) {
  const [catSlug, setCatSlug] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [inputPos, setInputPos] = useState<'top' | 'bottom'>('top');
  const [discussions, setDiscussions] = useState<GhDiscussionItem[]>([]);
  const [loadingDisc, setLoadingDisc] = useState(true);
  // Discussione selezionata: null = bacheca principale della categoria attiva (o General se 'all'), oppure numero di una discussione specifica
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [meta, setMeta] = useState<GiscusMetadata | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  const activeCategory = useMemo(
    () => DISCUSSION_CATEGORIES.find((c) => c.slug === catSlug) ?? DISCUSSION_CATEGORIES[0]!,
    [catSlug],
  );

  const selectedDisc = useMemo(
    () => (selectedNumber !== null ? discussions.find((d) => d.number === selectedNumber) ?? null : null),
    [discussions, selectedNumber],
  );

  // Carica l'elenco pubblico delle discussioni dal repository GitHub
  useEffect(() => {
    let cancelled = false;
    setLoadingDisc(true);
    fetch(`https://api.github.com/repos/${GISCUS_REPO}/discussions?per_page=30`, {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data)) setDiscussions(data as GhDiscussionItem[]);
        setLoadingDisc(false);
      })
      .catch(() => {
        if (!cancelled) setLoadingDisc(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Ascolta i metadati inviati in tempo reale da Giscus (data-emit-metadata="1")
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://giscus.app') return;
      if (typeof event.data !== 'object' || !event.data || !('giscus' in event.data)) return;
      const giscusData = (event.data as { giscus: { discussion?: GiscusMetadata } }).giscus;
      if (giscusData?.discussion) {
        setMeta(giscusData.discussion);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Se l'utente arriva con un'ancora (es. #/feedback/reazioni dal footer), scorre al pannello Giscus
  useEffect(() => {
    if (!anchor) return;
    const el = document.getElementById('giscus-bacheca');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [anchor]);

  // Monta e aggiorna lo script ufficiale Giscus con tutte le opzioni ottimizzate
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const theme = getGiscusThemeUrl();
    const mapping = selectedNumber !== null ? 'number' : 'specific';
    const term = selectedNumber !== null ? String(selectedNumber) : activeCategory.defaultTerm;

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
              reactionsEnabled: true,
              emitMetadata: true,
              inputPosition: inputPos,
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
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '1');
    script.setAttribute('data-input-position', inputPos);
    script.setAttribute('data-theme', theme);
    script.setAttribute('data-lang', 'it');
    host.appendChild(script);
  }, [activeCategory, selectedNumber, inputPos]);

  const filteredDiscussions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return discussions.filter((d) => {
      const matchCat = catSlug === 'all' || d.category?.slug === catSlug || d.category?.name === activeCategory.name;
      const matchQ = !q || d.title.toLowerCase().includes(q) || (d.user?.login ?? '').toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [discussions, catSlug, activeCategory.name, query]);

  const countByCat = (slug: string) =>
    discussions.filter((d) => d.category?.slug === slug || d.category?.name.toLowerCase() === slug).length;

  const newDiscussionUrl =
    catSlug === 'all'
      ? `${REPO_URL}/discussions/new/choose`
      : `${REPO_URL}/discussions/new?category=${encodeURIComponent(activeCategory.slug)}`;

  const currentThreadUrl = selectedDisc?.html_url ?? meta?.url ?? `${REPO_URL}/discussions`;

  return (
    <main className="wrap main" id="contenuto">
      <section className="page-head">
        <div className="hero-text">
          <h1 className="h1">
            Discussioni e <span className="mark">feedback</span>
          </h1>
          <p className="lead">
            Bacheca compatta basata su <strong>GitHub Discussions</strong> e <strong>Giscus</strong>. Puoi lasciare una reazione con emoticon (con contatori
            condivisi tra tutti gli utenti), commentare qui sotto o aprire una nuova discussione scegliendo una delle categorie originali del repository.
          </p>
        </div>
        <BackLink top />
      </section>

      {/* Barra compatta: ricerca, categorie originali di GitHub Discussions e pulsante Nuova discussione */}
      <div className="toolbar gsc-toolbar">
        <div className="toolbar-row">
          <label className="search">
            <span className="sr-only">Cerca nelle discussioni</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca una discussione per titolo o autore…"
            />
          </label>
          <div className="row-gap wrap">
            <button
              type="button"
              className="btn ghost btn-sm"
              onClick={() => setInputPos((p) => (p === 'top' ? 'bottom' : 'top'))}
              title="Sposta la casella di inserimento commento in alto o in fondo"
            >
              Casella commento: <strong>{inputPos === 'top' ? 'In alto ↑' : 'In fondo ↓'}</strong>
            </button>
            <a
              href={newDiscussionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn lime btn-sm gsc-new-disc-btn"
            >
              + Nuova discussione {catSlug !== 'all' ? `in ${activeCategory.name}` : 'su GitHub'} <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        <div className="toolbar-row">
          <span className="chips" role="group" aria-label="Categorie di GitHub Discussions">
            <button
              type="button"
              className="chip"
              aria-pressed={catSlug === 'all'}
              onClick={() => {
                setCatSlug('all');
                setSelectedNumber(null);
              }}
            >
              Tutte <span className="chip-n">{discussions.length}</span>
            </button>
            {DISCUSSION_CATEGORIES.map((c) => {
              const cnt = countByCat(c.slug);
              return (
                <button
                  key={c.id}
                  type="button"
                  className="chip"
                  aria-pressed={catSlug === c.slug}
                  title={c.desc}
                  onClick={() => {
                    setCatSlug(c.slug);
                    setSelectedNumber(null);
                  }}
                >
                  <span aria-hidden="true">{c.emoji}</span> {c.name} {cnt > 0 && <span className="chip-n">{cnt}</span>}
                </button>
              );
            })}
          </span>
          <span className="muted text-sm">{activeCategory.desc}</span>
        </div>
      </div>

      {/* Elenco ultra-compatto delle discussioni: ogni discussione può essere aperta nel widget Giscus sottostante */}
      <section className="gsc-list-card" aria-label="Elenco discussioni">
        <div className="gsc-list-head">
          <span className="cap">Discussioni aperte ({filteredDiscussions.length + 1})</span>
          <span className="muted text-sm">Seleziona una riga per leggerne e scriverne i commenti qui sotto</span>
        </div>
        <div className="gsc-disc-rows" role="listbox" aria-label="Seleziona la discussione da visualizzare in Giscus">
          <button
            type="button"
            role="option"
            aria-selected={selectedNumber === null}
            className={`gsc-disc-row${selectedNumber === null ? ' active' : ''}`}
            onClick={() => setSelectedNumber(null)}
          >
            <span className="gsc-disc-cat">
              <span aria-hidden="true">{activeCategory.emoji}</span> {activeCategory.name}
            </span>
            <span className="gsc-disc-title">
              <strong>📌 {activeCategory.defaultTerm}</strong>
              <span className="gsc-disc-sub">Filo diretto per reazioni veloci e commenti nella categoria {activeCategory.name}</span>
            </span>
            <span className="gsc-disc-stats">
              {meta && selectedNumber === null ? (
                <>
                  <span className="gsc-stat-pill">👍 {meta.reactionCount ?? 0}</span>
                  <span className="gsc-stat-pill">💬 {(meta.totalCommentCount ?? 0) + (meta.totalReplyCount ?? 0)}</span>
                </>
              ) : (
                <span className="gsc-stat-pill lime">Bacheca attiva</span>
              )}
            </span>
          </button>

          {filteredDiscussions.map((d) => {
            const catObj =
              DISCUSSION_CATEGORIES.find((c) => c.slug === d.category?.slug || c.name === d.category?.name) ??
              DISCUSSION_CATEGORIES[0]!;
            const isSel = selectedNumber === d.number;
            return (
              <button
                key={d.number}
                type="button"
                role="option"
                aria-selected={isSel}
                className={`gsc-disc-row${isSel ? ' active' : ''}`}
                onClick={() => setSelectedNumber(d.number)}
              >
                <span className="gsc-disc-cat">
                  <span aria-hidden="true">{catObj.emoji}</span> {catObj.name}
                </span>
                <span className="gsc-disc-title">
                  <strong>{d.title}</strong>
                  <span className="gsc-disc-sub">
                    #{d.number} · {d.user?.login ?? 'utente'} · {formatShortDate(d.updated_at || d.created_at)}
                    {d.answer_html_url ? ' · ✓ Risposta risolutiva' : ''}
                  </span>
                </span>
                <span className="gsc-disc-stats">
                  {typeof d.upvote_count === 'number' && <span className="gsc-stat-pill">▲ {d.upvote_count}</span>}
                  <span className="gsc-stat-pill">💬 {d.comments}</span>
                </span>
              </button>
            );
          })}

          {!loadingDisc && filteredDiscussions.length === 0 && (
            <div className="gsc-disc-empty">
              <span>
                Nessuna discussione separata trovata per questo filtro. Puoi commentare subito nella bacheca qui sotto oppure{' '}
                <a href={newDiscussionUrl} target="_blank" rel="noopener noreferrer">
                  aprire una nuova discussione dedicata su GitHub ↗
                </a>
                .
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Pannello Giscus compatto con reazioni di tutti gli utenti in cima ai commenti */}
      <section className="gsc-panel" id="giscus-bacheca" aria-label="Commenti e reazioni Giscus">
        <div className="gsc-panel-head">
          <div className="gsc-panel-title">
            <span className="gsc-active-badge">
              <span aria-hidden="true">{activeCategory.emoji}</span> {selectedDisc?.category?.name ?? activeCategory.name}
            </span>
            <h2 className="gsc-h2">{selectedDisc ? `${selectedDisc.title} (#${selectedDisc.number})` : activeCategory.defaultTerm}</h2>
          </div>
          <div className="gsc-panel-meta">
            {meta && (
              <div className="gsc-live-reactions" aria-label="Riepilogo reazioni di tutti gli utenti">
                {GITHUB_REACTIONS.map((r) => {
                  const count = meta.reactions?.[r.key]?.count ?? 0;
                  if (count === 0) return null;
                  return (
                    <span key={r.key} className="gsc-rx-badge" title={`${r.label}: ${count}`}>
                      <span aria-hidden="true">{r.emoji}</span> {count}
                    </span>
                  );
                })}
                <span className="gsc-rx-total">
                  {meta.reactionCount ?? 0} reazioni · {(meta.totalCommentCount ?? 0) + (meta.totalReplyCount ?? 0)} commenti
                </span>
              </div>
            )}
            <a href={currentThreadUrl} target="_blank" rel="noopener noreferrer" className="btn ghost btn-sm">
              Apri su GitHub Discussions <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>

        <p className="gsc-panel-hint">
          <strong>Reazioni e commenti condivisi:</strong> le emoticon e i commenti qui sotto mostrano i contatori reali di tutti gli utenti tramite GitHub
          Discussions. Per aggiungere una reazione o pubblicare un commento, Giscus richiede l&rsquo;accesso rapido con il tuo account GitHub.
        </p>

        <div ref={hostRef} className="giscus-host" data-testid="giscus-host" />
      </section>

      <div className="page-foot">
        <BackLink />
      </div>
    </main>
  );
}
