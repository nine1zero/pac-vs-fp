import { expect, test, type Page } from '@playwright/test';
import { resolve } from 'node:path';
import { CSP } from '../src/csp';

// SPEC par. 1.1 e par. 8 punto 4: nessuna richiesta verso altri domini, anche durante l'import e l'uso degli slider.
function watch(page: Page, origin: string) {
  const external: string[] = [];
  const problems: string[] = [];
  page.context().on('request', (req) => {
    const url = req.url();
    if (url.startsWith('data:') || url.startsWith('blob:')) return;
    if (new URL(url).origin !== origin) external.push(url);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') problems.push(msg.text());
  });
  page.on('pageerror', (err) => problems.push(err.message));
  return { external, problems };
}

test('nessuna richiesta esterna, CSP attiva, anche con import e slider', async ({ page, baseURL }) => {
  const { external, problems } = watch(page, new URL(baseURL!).origin);
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('PAC ETF globale');
  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute('content', CSP);

  await page.locator('#sezione-2 .sec-head > button').click();
  await page.getByLabel('Scegli il file DettaglioOperazioni').setInputFiles(resolve('spec/tests/fixtures/sample_dettaglio_ok.xls'));
  await expect(page.locator('#sezione-2')).toContainText('movimenti importati');
  await page.getByRole('button', { name: 'Usa un file d\'esempio' }).click();

  await page.locator('#sezione-4 .sec-head > button').click();
  const slider = page.getByRole('slider', { name: /Differenziale annuo/ });
  await slider.focus();
  for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowLeft');
  await page.locator('#sezione-5 .sec-head > button').click();
  await page.getByRole('radio', { name: 'Al variare del differenziale' }).click();
  await page.waitForLoadState('networkidle');

  expect(external).toEqual([]);
  expect(problems).toEqual([]);
});

test('font Onest servito dallo stesso dominio', async ({ page }) => {
  await page.goto('./');
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].some((f) => f.family.replace(/["']/g, '') === 'Onest' && f.status === 'loaded');
  });
  expect(loaded).toBe(true);
});

test('nessuna richiesta esterna, cookie o memoria su tutte le pagine senza "Salva"', async ({ page, baseURL }) => {
  const { external, problems } = watch(page, new URL(baseURL!).origin);
  for (const hash of ['#/', '#/storico', '#/parametri', '#/versamenti']) {
    await page.goto(`./${hash}`);
    await page.waitForLoadState('networkidle');
  }
  await page.getByRole('button', { name: "Usa un file d'esempio" }).click();
  await page.waitForLoadState('networkidle');
  expect(external).toEqual([]);
  expect(problems).toEqual([]);
  expect(await page.context().cookies()).toEqual([]);
  expect(await page.evaluate(() => ({ local: window.localStorage.length, session: window.sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  expect(await page.evaluate(async () => (await navigator.serviceWorker?.getRegistrations())?.length ?? 0)).toBe(0);
});
