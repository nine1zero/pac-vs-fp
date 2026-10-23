import { expect, test } from '@playwright/test';
import { CSP } from '../src/csp';

// SPEC par. 1.1 e par. 8 punto 4: nessuna richiesta verso altri domini.
test('nessuna richiesta esterna e CSP attiva', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
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

  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('PAC ETF globale');
  await page.waitForLoadState('networkidle');

  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute('content', CSP);
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
