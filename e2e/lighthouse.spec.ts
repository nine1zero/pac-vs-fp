// SPEC par. 8 punto 4: Lighthouse Best Practices ≥ 95 e Accessibility ≥ 95, sulla build con la CSP.
import { chromium, expect, test } from '@playwright/test';
import lighthouse from 'lighthouse';

const PORT = 9333;

for (const [name, hash] of [
  ['simulatore', ''],
  ['Storico', '#/storico'],
  ['Parametri e fonti', '#/parametri'],
  ['I miei versamenti', '#/versamenti'],
] as const) {
  test(`Lighthouse: ${name}`, async ({ baseURL }) => {
    test.setTimeout(120_000);
    const browser = await chromium.launch({ args: [`--remote-debugging-port=${PORT}`] });
    try {
      const r = await lighthouse(`${baseURL}${hash}`, {
        port: PORT,
        output: 'json',
        logLevel: 'error',
        onlyCategories: ['accessibility', 'best-practices'],
        formFactor: 'desktop',
        screenEmulation: { mobile: false, width: 1280, height: 900, deviceScaleFactor: 1, disabled: false },
      });
      const cats = r!.lhr.categories;
      console.log(`Lighthouse ${name}: accessibility ${cats.accessibility!.score}, best practices ${cats['best-practices']!.score}`);
      const failed = Object.values(r!.lhr.audits)
        .filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode === 'binary')
        .map((a) => a.id);
      expect(cats.accessibility!.score!, `accessibility; audit non superati: ${failed.join(', ')}`).toBeGreaterThanOrEqual(0.95);
      expect(cats['best-practices']!.score!, `best-practices; audit non superati: ${failed.join(', ')}`).toBeGreaterThanOrEqual(0.95);
    } finally {
      await browser.close();
    }
  });
}
