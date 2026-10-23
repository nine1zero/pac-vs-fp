import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const params = JSON.parse(readFileSync(resolve('public/data/params.json'), 'utf8')) as { parameters: { id: string; label: string }[] };

test.describe('Parametri e fonti', () => {
  test('ogni parametro ha la riga, la spiegazione e la fonte (SPEC par. 8 punto 7)', async ({ page }) => {
    await page.goto('./#/parametri');
    await expect(page.locator('.prow:not(.phead)')).toHaveCount(params.parameters.length);
    const sources = await page.locator('.psrc [data-testid="source-text"]').allTextContents();
    expect(sources).toHaveLength(params.parameters.length);
    for (const s of sources) expect(s.trim().length).toBeGreaterThan(5);
    // tooltip della fonte raggiungibile da tastiera
    const kind = page.locator('#param-deduction_limit .psrc .kind');
    await kind.focus();
    await expect(page.locator('#param-deduction_limit .psrc .bubble')).toBeVisible();
  });

  test('ricerca e filtro', async ({ page }) => {
    await page.goto('./#/parametri');
    await page.getByPlaceholder(/Cerca/).fill('riscatto');
    await expect(page.locator('#param-redemption_tax')).toBeVisible();
    await expect(page.locator('#param-birth_year')).toHaveCount(0);
    await page.getByPlaceholder(/Cerca/).fill('zzzzzz');
    await expect(page.getByText('Nessun parametro trovato')).toBeVisible();
  });

  test('una modifica cambia il simulatore; "Ripristina tutti" la annulla', async ({ page }) => {
    await page.goto('./');
    const before = await page.getByTestId('best-total').innerText();
    await page.goto('./#/parametri/capital_gain_tax');
    const field = page.locator('#param-capital_gain_tax input');
    await expect(field).toBeFocused();
    await field.fill('20');
    await expect(page.getByRole('button', { name: /Ripristina tutti \(1\)/ })).toBeEnabled();
    await page.goto('./#/');
    await expect(page.getByTestId('best-total')).not.toHaveText(before);
    await page.goto('./#/parametri');
    await page.getByRole('button', { name: /Ripristina tutti/ }).click();
    await page.goto('./#/');
    await expect(page.getByTestId('best-total')).toHaveText(before);
  });

  test('importa un profilo JSON', async ({ page }) => {
    await page.goto('./#/parametri');
    await page.getByLabel('Scegli il profilo JSON').setInputFiles({
      name: 'profilo-esempio.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ version: 1, name: 'prova', values: { ral: 60000 } })),
    });
    await expect(page.getByRole('status')).toContainText('Importati 1 valori');
    await expect(page.locator('#param-ral input')).toHaveValue('60000');
  });
});

test.describe('Storico', () => {
  test('medie, differenziale e scomposizione dai dati', async ({ page }) => {
    await page.goto('./#/storico');
    await expect(page.locator('.tile.dark')).toContainText('−5,8');
    await expect(page.locator('.tile').first()).toContainText('+5,45%');
    await expect(page.locator('.wf')).toContainText('−2,1 punti');
    await expect(page.locator('.wf')).toContainText('−2,7 punti');
    await expect(page.locator('.wf')).toContainText('−1,0 punti');
    await page.getByRole('radio', { name: '2012–2025' }).click();
    await expect(page.getByText('3 su 14')).toBeVisible();
    await page.getByRole('radio', { name: /Vanguard FTSE All-World/ }).click();
    await expect(page.getByText(/L’ETF scelto ha dati dal 2018/)).toBeVisible();
  });

  test('tabella ordinabile', async ({ page }) => {
    await page.goto('./#/storico');
    await page.getByRole('button', { name: 'Fondo − ETF' }).last().click();
    await expect(page.locator('.tbl tbody tr').first().locator('th')).toHaveText('2015');
  });
});

test.describe('I miei versamenti', () => {
  test('senza file mostra l’area di caricamento; con il fixture i valori del golden', async ({ page }) => {
    await page.goto('./#/versamenti');
    await page.getByLabel('Scegli il file DettaglioOperazioni').setInputFiles(resolve('spec/tests/fixtures/sample_dettaglio_ok.xls'));
    await expect(page.locator('.tile').nth(3)).toContainText('18.751,61 €');
    await expect(page.locator('.tile').nth(4)).toContainText('20.691 €');
    await page.getByRole('radio', { name: 'Fuori, prima del 26%' }).click();
    await expect(page.locator('.tile').nth(4)).toContainText('21.984 €');
    await expect(page.locator('.mov-tbl tbody tr')).toHaveCount(43);
    await page.getByLabel('Anno').selectOption('2026');
    await expect(page.locator('.mov-tbl tbody tr')).toHaveCount(8);
    await page.getByRole('button', { name: 'Azzera filtri' }).click();
    await expect(page.locator('.mov-tbl tbody tr')).toHaveCount(43);
  });

  test('grafico leggibile da tastiera', async ({ page }) => {
    await page.goto('./#/versamenti');
    await page.getByRole('button', { name: "Usa un file d'esempio" }).click();
    const plot = page.locator('.tc-plot');
    await plot.focus();
    await page.keyboard.press('End');
    await expect(page.locator('.tc-box')).toContainText('ago 2026');
  });
});
