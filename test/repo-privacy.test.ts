import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

// CLAUDE.md, "Privacy": mai committare dati personali.
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);

const forbidden: [string, (f: string) => boolean][] = [
  ['cartelle private', (f) => /(^|\/)tests\/private\//.test(f)],
  ['PDF', (f) => /\.pdf$/i.test(f)],
  ['profili JSON', (f) => /(^|\/)profilo[^/]*\.json$/i.test(f)],
  ['file .xls/.xlsx fuori dai fixture', (f) => /\.xlsx?$/i.test(f) && !/^(spec\/)?tests\/fixtures\/[^/]+\.xls$/.test(f)],
];

describe('nessun dato personale nel repository', () => {
  it.each(forbidden)('nessun file: %s', (_name, test) => {
    expect(files.filter(test)).toEqual([]);
  });
});
