import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CSP } from '../src/csp';

describe('Content-Security-Policy', () => {
  it('coincide con la SPEC par. 1.1', () => {
    const spec = readFileSync(new URL('../docs/SPEC.md', import.meta.url), 'utf8');
    const m = spec.match(/Content-Security-Policy restrittivo: `([^`]+)`/);
    expect(m, 'CSP non trovata in docs/SPEC.md').not.toBeNull();
    expect(CSP).toBe(m![1]);
  });

  it('index.html ha il segnaposto della CSP', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    expect(html).toContain('<!--csp-->');
  });
});
