// SPEC par. 3 e 8 punto 4: accessibilità AA (contrasto, focus visibile, tastiera, aria-live) su tutte le pagine.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { resolve } from 'node:path';

async function axe(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  return r.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
}

async function openAll(page: Page) {
  for (let k = 0; k <= 6; k++) {
    const btn = page.locator(`#sezione-${k} .sec-head > button`);
    if ((await btn.getAttribute('aria-expanded')) !== 'true') await btn.click();
    await expect(page.locator(`#sezione-${k} .sec-body`)).toBeVisible();
    // controlla ogni sezione aperta (si apre una alla volta)
    expect(await axe(page), `sezione ${k}`).toEqual([]);
  }
}

test('simulatore: nessuna violazione WCAG AA in ogni sezione', async ({ page }) => {
  await page.goto('./');
  expect(await axe(page)).toEqual([]);
  await openAll(page);
});

test('simulatore con il file importato e il grafico al variare del differenziale', async ({ page }) => {
  await page.goto('./');
  await page.locator('#sezione-2 .sec-head > button').click();
  await page.getByLabel('Scegli il file DettaglioOperazioni').setInputFiles(resolve('spec/tests/fixtures/sample_dettaglio_bad_totals.xls'));
  expect(await axe(page)).toEqual([]);
  await page.locator('#sezione-5 .sec-head > button').click();
  await page.getByRole('radio', { name: 'Al variare del differenziale' }).click();
  expect(await axe(page)).toEqual([]);
});

for (const [name, hash] of [
  ['Storico', '#/storico'],
  ['Parametri e fonti', '#/parametri'],
] as const) {
  test(`${name}: nessuna violazione WCAG AA`, async ({ page }) => {
    await page.goto(`./${hash}`);
    expect(await axe(page)).toEqual([]);
  });
}

test('I miei versamenti: nessuna violazione WCAG AA, con e senza file', async ({ page }) => {
  await page.goto('./#/versamenti');
  expect(await axe(page)).toEqual([]);
  await page.getByRole('button', { name: "Usa un file d'esempio" }).click();
  expect(await axe(page)).toEqual([]);
});

test('tastiera: link per saltare al contenuto, focus visibile, tooltip delle fonti', async ({ page }) => {
  await page.goto('./');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Vai al contenuto' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  // il focus è sempre visibile: outline o ombra sull'elemento attivo
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const visible = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return true;
      const s = getComputedStyle(el);
      return (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== 'none';
    });
    expect(visible, `elemento ${i}`).toBe(true);
  }
  // tooltip della fonte aperto con il focus
  const info = page.locator('.etf-box .ib');
  await info.focus();
  await expect(page.locator('.etf-box .bubble')).toBeVisible();
});

test('la risposta principale è annunciata (aria-live) e si aggiorna in meno di 100 ms', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('answer').locator('[aria-live="polite"]')).toHaveCount(1);
  await page.locator('#sezione-4 .sec-head > button').click();
  const slider = page.getByRole('slider', { name: /Differenziale annuo/ });
  await slider.focus();
  // tempo dall'input al cambio del testo della risposta, mediana di 7 prove (SPEC par. 8 punto 5)
  const times: number[] = [];
  for (let i = 0; i < 7; i++) {
    const t = await page.evaluate(
      () =>
        new Promise<number>((done) => {
          const target = document.querySelector('[data-testid="answer"]')!;
          const obs = new MutationObserver(() => {
            obs.disconnect();
            done(performance.now() - t0);
          });
          obs.observe(target, { subtree: true, characterData: true, childList: true });
          const t0 = performance.now();
          const el = document.activeElement as HTMLInputElement;
          el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
          const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
          setter.call(el, String(Number(el.value) + 0.1));
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }),
    );
    times.push(t);
  }
  times.sort((a, b) => a - b);
  expect(times[3]!).toBeLessThan(100);
});

test.describe('mobile 390 px', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test('nessuno scorrimento orizzontale e nessuna violazione WCAG AA', async ({ page }) => {
    for (const hash of ['#/', '#/storico', '#/parametri', '#/versamenti']) {
      await page.goto(`./${hash}`);
      if (hash === '#/versamenti') await page.getByRole('button', { name: "Usa un file d'esempio" }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth), hash).toBeLessThanOrEqual(390);
      expect(await axe(page), hash).toEqual([]);
    }
  });
});
