import profile from '../../public/data/profile_example.json';
import type { Brackets, ExitMode, ModelParams } from './types';

/** Converte un profilo JSON (stesse chiavi di model.py DEFAULTS) nei parametri del modello. */
export function paramsFromProfile(raw: Record<string, unknown>): ModelParams {
  const p = { ...raw } as Record<string, unknown>;
  for (const k of ['irpef', 'regional'] as const) {
    p[k] = (p[k] as [number | null, number][]).map(([lim, rate]) => [lim, rate] as const) as Brackets;
  }
  p.exit_mode = p.exit_mode as ExitMode;
  return p as unknown as ModelParams;
}

/** Profilo d'esempio pubblico (public/data/profile_example.json), uguale a model.py DEFAULTS. */
export const EXAMPLE_PARAMS: ModelParams = paramsFromProfile(profile as Record<string, unknown>);
