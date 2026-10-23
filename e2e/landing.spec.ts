import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const json = (p: string) => JSON.parse(readFileSync(resolve(p), 'utf8'));
const golden = json('spec/tests/golden_model_example.json') as { pensione_delta_default: number[]; pensione_delta_default_real: number[] };
const goldenFixture = json('spec/tests/golden_fixture_ok.json') as { n_rows: number; real_position: number };

const fixture = (name: string) => resolve('spec/tests/fixtures', name);
const euro = (v: number) =>
  `${new Intl.NumberFormat('it-IT', { maximumFractionDigits: 0, useGrouping: 'always' as unknown as boolean }).format(Math.round(v))} €`;

async function openSection(page: Page, k: number) {
  const btn = page.locator(`#sezione-${k} .sec-head > button`);
  if ((await btn.getAttribute('aria-expanded')) !== 'true') await btn.click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('./');
});

test('senza dati: risposta sempre visibile con i valori golden del profilo d’esempio (SPEC par. 8 punti 6 e 8a)', async ({ page }) => {
  const answer = page.getByTestId('answer');
  await expect(answer).toContainText(`Oggi conviene 1 · Minimo per l’azienda + PAC: ${euro(golden.pensione_delta_default[0]!)} netti`);
  await expect(answer).toContainText('2 contro 1: pareggio a −3,6%');
  await expect(answer).toContainText('2 contro 3: pareggio a −5,5%');
  await expect(answer).toContainText('1 contro 3: pareggio a −9,3%');
  await expect(answer).toContainText('se esci entro');

  // salta tutte le sezioni e guarda il risultato
  await page.getByRole('button', { name: 'Mostrami subito l\'esempio' }).click();
  const s5 = page.locator('#sezione-5');
  for (const v of golden.pensione_delta_default) await expect(s5).toContainText(euro(v));
  for (const v of golden.pensione_delta_default_real) await expect(s5).toContainText(`${euro(v)} in euro di oggi`);
});

test('file d’esempio al passo 2: posizione e contributi del golden (SPEC par. 8 punto 8b)', async ({ page }) => {
  await openSection(page, 2);
  await page.getByLabel('Scegli il file DettaglioOperazioni').setInputFiles(fixture('sample_dettaglio_ok.xls'));
  const s2 = page.locator('#sezione-2');
  await expect(s2).toContainText(`${goldenFixture.n_rows} movimenti importati`);
  await expect(s2).toContainText('43 movimenti letti, dal 01/2023 al 07/2026, totali coerenti con il file');
  await expect(s2.getByLabel('Posizione attuale (€)')).toHaveValue(String(Math.round(goldenFixture.real_position * 100) / 100));
  await expect(s2.getByLabel('Tuo contributo minimo €/mese')).toHaveValue('75');
  await expect(s2.getByLabel('Contributo azienda €/mese')).toHaveValue('70');
  await expect(s2.getByLabel('TFR al fondo €/mese')).toHaveValue('230');
  await expect(s2.getByLabel('Anno di prima adesione')).toHaveValue('2023');
  await expect(s2).toContainText('Dal tuo file');
});

test('file con una colonna mancante: errore rosso', async ({ page }) => {
  await openSection(page, 2);
  await page.getByLabel('Scegli il file DettaglioOperazioni').setInputFiles(fixture('sample_dettaglio_bad_columns.xls'));
  await expect(page.getByRole('alert')).toContainText('Manca la colonna Numero Quote.');
});

test('file con totali diversi: avviso giallo sul totale Aderente', async ({ page }) => {
  await openSection(page, 2);
  await page.getByLabel('Scegli il file DettaglioOperazioni').setInputFiles(fixture('sample_dettaglio_bad_totals.xls'));
  await expect(page.locator('#sezione-2 .check.warn')).toContainText('Totale Importo Lordo Aderente');
});

test('"Dati tuoi" solo sulle sezioni confermate (SPEC par. 8 punto 8c)', async ({ page }) => {
  await page.getByRole('button', { name: /Ho capito, iniziamo/ }).click();
  await page.getByRole('button', { name: /Conferma e passa al tuo fondo/ }).click();
  await expect(page.locator('#sezione-1 .sec-head .badge-pill')).toHaveText('Dati tuoi');
  for (const k of [2, 3, 4]) await expect(page.locator(`#sezione-${k} .sec-head .badge-pill`)).toHaveText('Esempio');
});

test('localStorage solo con "Salva i miei dati"; "Cancella tutto" lo svuota', async ({ page }) => {
  const stored = () => page.evaluate(() => ({ ...window.localStorage }));
  await openSection(page, 3);
  await page.getByRole('button', { name: '60k' }).click();
  expect(await stored()).toEqual({});
  await page.getByRole('button', { name: 'Salva i miei dati' }).click();
  await expect(page.getByRole('button', { name: /^Salvato/ })).toBeVisible();
  expect(Object.keys(await stored())).toEqual(['pacfondo.v1']);
  expect(await page.evaluate(() => document.cookie)).toBe('');

  await page.reload();
  // dati salvati: sezioni chiuse, valori ritrovati
  await expect(page.locator('.sec.open')).toHaveCount(0);
  await expect(page.locator('#sezione-3 .sumrow')).toContainText('RAL 60k €');

  await page.getByRole('button', { name: 'Cancella tutto' }).click();
  expect(await stored()).toEqual({});
  await expect(page.locator('#sezione-3 .sumrow')).toContainText('RAL 45k €');
});

test('cambiare l’ETF aggiorna il TER e il risultato', async ({ page }) => {
  const before = await page.getByTestId('best-total').innerText();
  await page.getByRole('button', { name: 'PAC ETF globale' }).click();
  await page.getByRole('option', { name: /iShares MSCI ACWI/ }).click();
  await expect(page.locator('.etf-box')).toContainText('IE00B6R52259 · TER 0,20%');
  await expect(page.getByTestId('best-total')).not.toHaveText(before);
});

test('slider da tastiera: il differenziale aggiorna la risposta', async ({ page }) => {
  await openSection(page, 4);
  const slider = page.getByRole('slider', { name: /Differenziale annuo/ });
  await slider.focus();
  for (let i = 0; i < 58; i++) await page.keyboard.press('ArrowRight');
  await expect(page.locator('#sezione-4 .val').first()).toHaveText('+0,0%'.replace('+', ''));
  await expect(page.getByTestId('answer')).toContainText('Oggi conviene 2 · Deduzione massima + PAC');
});

test('ogni fonte nei tooltip ha un testo', async ({ page }) => {
  await page.getByRole('button', { name: 'Mostrami subito l\'esempio' }).click();
  for (const k of [1, 2, 3, 4, 6]) await openSection(page, k);
  const texts = await page.getByTestId('source-text').allTextContents();
  expect(texts.length).toBeGreaterThan(5);
  for (const t of texts) expect(t.trim().length).toBeGreaterThan(10);
});
