// Navigazione con l'hash dell'URL (GitHub Pages): #/, #/versamenti, #/storico, #/parametri[/id].
import { useEffect, useState } from 'react';

export type Route = { page: 'home' | 'versamenti' | 'storico' | 'parametri'; anchor?: string };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const page = parts[0];
  if (page === 'versamenti' || page === 'storico' || page === 'parametri') return { page, anchor: parts[1] };
  return { page: 'home' };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const on = () => {
      const r = parseHash(window.location.hash);
      setRoute(r);
      if (r.page !== 'home') window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}
