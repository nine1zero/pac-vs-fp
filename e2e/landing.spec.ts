import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const json = (p: string) => JSON.parse(readFileSync(resolve(p), 'utf8'));
const golden = json('spec/tests/golden_model_example.json') as {
  pensione_delta_default: number[];
  pensione_delta_default_real: number[];
  breakeven_pensione_full: Record<'2vs1' | '2vs3' | '1vs3', number>;
};
/** −3,7% come nell'interfaccia */
const pct1 = (v: number) => `${v < 0 ? '−' : '+'}${Math.abs(v * 100).toFixed(1).replace('.', ',')}%`;
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

test('senza dati: risposta in testa al Risultato con i valori golden del profilo d’esempio (SPEC par. 8 punti 6 e 8a)', async ({ page }) => {
  // vincitore e totale sono sempre visibili nella testata della sezione 5
  await expect(page.locator('#sezione-5 .sec-head')).toContainText('Vince la 1');
  // salta tutte le sezioni e guarda il risultato
  await page.getByRole('button', { name: 'Mostrami subito l\'esempio' }).click();
  const answer = page.getByTestId('answer');
  await expect(answer).toContainText(`conviene 1 · Minimo per contributo + PAC: ${euro(golden.pensione_delta_default[0]!)} netti`);
  const be = golden.breakeven_pensione_full;
  await expect(answer).toContainText(`2 contro 1: pareggio a ${pct1(be['2vs1'])}`);
  await expect(answer).toContainText(`2 contro 3: pareggio a ${pct1(be['2vs3'])}`);
  await expect(answer).toContainText(`1 contro 3: pareggio a ${pct1(be['1vs3'])}`);
  await expect(answer).toContainText('se esci entro');
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

test('ogni dato inserito si salva da solo; "Cancella tutto" svuota la memoria', async ({ page }) => {
  const stored = () => page.evaluate(() => ({ ...window.localStorage }));
  // solo aprendo la pagina non si salva nulla
  expect(await stored()).toEqual({});
  await openSection(page, 3);
  await page.getByRole('button', { name: '60k' }).click();
  await expect(page.getByTestId('save-status')).toContainText('Salvato');
  expect(Object.keys(await stored())).toEqual(['pacfondo.v1']);
  expect(await page.evaluate(() => document.cookie)).toBe('');

  // campo numerico: il valore digitato si ritrova dopo il ricaricamento
  await openSection(page, 2);
  await page.getByLabel('TFR al fondo €/mese').fill('245');
  await expect.poll(async () => JSON.parse((await stored())['pacfondo.v1'] ?? '{}').data?.inputs?.tfr_month).toBe(245);

  await page.reload();
  await expect(page.locator('.sec.open')).toHaveCount(0);
  await expect(page.locator('#sezione-3 .sumrow')).toContainText('RAL 60k €');
  await expect(page.locator('#sezione-2 .sumrow')).toContainText('75/70/245 €/mese');

  await page.getByRole('button', { name: 'Cancella tutto' }).click();
  await expect(page.locator('#sezione-3 .sumrow')).toContainText('RAL 45k €');
  await page.waitForTimeout(600);
  expect(await stored()).toEqual({});
});

test('anche il file delle operazioni si salva: dopo il ricaricamento i versamenti ci sono ancora', async ({ page }) => {
  await openSection(page, 2);
  await page.getByLabel('Scegli il file DettaglioOperazioni').setInputFiles(fixture('sample_dettaglio_ok.xls'));
  await expect(page.getByTestId('save-status')).toContainText('Salvato');
  const keys = await page.evaluate(() => Object.keys(window.localStorage).sort());
  expect(keys).toEqual(['pacfondo.v1', 'pacfondo.v1.file']);
  await page.reload();
  await page.goto('./#/versamenti');
  await expect(page.locator('.tile').nth(3)).toContainText('18.751,61 €');
  await expect(page.locator('.mov-tbl tbody tr')).toHaveCount(43);
  await page.getByRole('button', { name: 'Cancella tutto' }).click();
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => window.localStorage.length)).toBe(0);
  await page.reload();
  await page.goto('./#/versamenti');
  await expect(page.getByLabel('Scegli il file DettaglioOperazioni')).toBeAttached();
  await expect(page.locator('.mov-tbl')).toHaveCount(0);
});

test('ETF di default iShares MSCI ACWI; cambiarlo aggiorna il TER e il risultato', async ({ page }) => {
  await expect(page.locator('.etf-box')).toContainText('iShares MSCI ACWI UCITS ETF Acc');
  await expect(page.locator('.etf-box')).toContainText('IE00B6R52259 · TER 0,20%');
  await openSection(page, 5);
  const before = await page.getByTestId('best-total').innerText();
  await page.getByRole('button', { name: 'PAC ETF globale' }).click();
  await page.getByRole('option', { name: /Vanguard FTSE All-World/ }).click();
  await expect(page.locator('.etf-box')).toContainText('IE00BK5BQT80 · TER 0,14%');
  await expect(page.getByTestId('best-total')).not.toHaveText(before);
});

test('slider da tastiera: il differenziale aggiorna la risposta', async ({ page }) => {
  await openSection(page, 4);
  const slider = page.getByRole('slider', { name: /Differenziale annuo/ });
  await slider.focus();
  for (let i = 0; i < 58; i++) await page.keyboard.press('ArrowRight');
  await expect(page.locator('#sezione-4 .val').first()).toHaveText('+0,0%'.replace('+', ''));
  await openSection(page, 5);
  await expect(page.getByTestId('answer')).toContainText('conviene 2 · Deduzione massima (no PAC)');
});

test('ogni fonte nei tooltip ha un testo', async ({ page }) => {
  await page.getByRole('button', { name: 'Mostrami subito l\'esempio' }).click();
  for (const k of [1, 2, 3, 4, 6]) await openSection(page, k);
  const texts = await page.getByTestId('source-text').allTextContents();
  expect(texts.length).toBeGreaterThan(5);
  for (const t of texts) expect(t.trim().length).toBeGreaterThan(10);
});

test('la mappa "Per quanti anni conviene" è di sola lettura', async ({ page }) => {
  await page.getByRole('button', { name: 'Mostrami subito l\'esempio' }).click();
  const answer = (await page.getByTestId('answer').textContent())!;
  const map = page.locator('.heat-plot svg');
  await map.click({ position: { x: 20, y: 20 } });
  await map.focus();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Enter');
  await expect(page.locator('.heat-live')).toContainText('Uscita nel');
  await expect(page.getByTestId('answer')).toHaveText(answer);
  await expect(page.locator('#sezione-5 .band-field').first()).toContainText('−5,8%');
});

test('il mini slider della domanda va dalla quota minima per il contributo alla deduzione massima', async ({ page }) => {
  const box = page.locator('.budget-box');
  await expect(box).toContainText('min 975 €');
  const slider = box.getByRole('slider', { name: 'Risparmio aggiuntivo annuo' });
  await slider.focus();
  await page.keyboard.press('Home');
  await expect(page.getByTestId('budget-year')).toHaveText('975 €/anno');
  await expect(box).toContainText('Ora: importo fisso.');
  await box.getByRole('button', { name: 'Torna al massimo' }).click();
  await expect(box).toContainText('Ora: deduzione massima.');
});

test('se la quota minima arriva alla deduzione massima lo slider si ferma e una nota spiega perché', async ({ page }) => {
  await openSection(page, 2);
  await page.getByLabel('Tuo contributo minimo €/mese').fill('400');
  const box = page.locator('.budget-box');
  await expect(box.getByRole('slider', { name: 'Risparmio aggiuntivo annuo' })).toBeDisabled();
  await expect(box.locator('.lock-note')).toContainText('Lo slider è fermo');
  await expect(box.locator('.lock-note')).toContainText('Tuo contributo minimo');
});

test('striscia "Se esci nel…": etichetta dove cambia lo scenario e frase di sintesi', async ({ page }) => {
  await page.getByRole('button', { name: 'Mostrami subito l\'esempio' }).click();
  const s5 = page.locator('#sezione-5');
  await expect(s5.locator('.strip-pill')).toHaveText(['17 anni']);
  await expect(s5).toContainText('Se esci entro 16 anni conviene la 2; da 17 anni in poi conviene la 1.');
});

test('fumetto "Migliora il repo": stella, issues precompilata e feedbacks (Discussions)', async ({ page }) => {
  const g = page.getByRole('group', { name: 'Migliora il progetto su GitHub' });
  await expect(g).toBeVisible();
  await expect(g.locator('.ghb-it')).toHaveText(['stella', 'issues', 'feedbacks']);
  await expect(g.getByRole('link', { name: 'stella' })).toHaveAttribute('href', 'https://github.com/nine1zero/pac-vs-fp');
  const issue = await g.getByRole('link', { name: 'issues' }).getAttribute('href');
  const u = new URL(issue!);
  expect(u.pathname).toBe('/nine1zero/pac-vs-fp/issues/new');
  expect(u.searchParams.get('labels')).toBe('enhancement');
  expect(u.searchParams.get('body')).toContain('Cosa proporresti');
  await expect(g.getByRole('link', { name: 'feedbacks' })).toHaveAttribute('href', 'https://github.com/nine1zero/pac-vs-fp/discussions');
  // i link del fumetto si aprono sempre in una nuova scheda
  for (const name of ['stella', 'issues', 'feedbacks']) await expect(g.getByRole('link', { name })).toHaveAttribute('target', '_blank');
});

test('"FPDDI IBM" porta al sito del fondo in una nuova scheda', async ({ page }) => {
  const link = page.locator('.lead').getByRole('link', { name: 'FPDDI IBM' });
  await expect(link).toHaveAttribute('href', 'https://www.fondopensioneibm.it/');
  await expect(link).toHaveAttribute('target', '_blank');
});

test('area di caricamento: "scaricato da Area Riservata" con il link al fondo, cliccabile', async ({ page }) => {
  await openSection(page, 2);
  const link = page.locator('#sezione-2 .drop').getByRole('link', { name: 'Area Riservata' });
  await expect(link).toHaveAttribute('href', 'https://funds.previnet.it/w-horizon-ibmdip/login.html#/');
  await expect(link).toHaveAttribute('target', '_blank');
  await expect(page.locator('#sezione-2 .drop-sub')).toHaveText('scaricato da Area Riservata');
  // il link sta sopra il campo file invisibile: un clic apre il link, non la scelta del file
  const onTop = await link.evaluate((a) => {
    const r = a.getBoundingClientRect();
    return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === a;
  });
  expect(onTop).toBe(true);
});

test('pill "BETA" nell\'header senza tooltip', async ({ page }) => {
  const pill = page.locator('.site-header .beta-pill');
  await expect(pill).toBeVisible();
  await expect(pill).toHaveText('Beta');
  await expect(page.locator('#beta-tip')).toHaveCount(0);
});

test('barra reazioni nel footer e pagina Discussioni e feedback: elenco solo dopo l\'accesso con GitHub (SPEC par. 3.0 Pagina I)', async ({ page }) => {
  const githubCalls: string[] = [];
  page.on('request', (r) => {
    if (r.url().startsWith('https://api.github.com/')) githubCalls.push(r.url());
  });
  await page.route('https://giscus.app/api/oauth/token', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'token-di-prova' }) }),
  );
  const node = (number: number, title: string, comments: number, createdAt: string, category: [string, string], extra: Record<string, unknown> = {}) => ({
    number,
    title,
    createdAt,
    locked: false,
    answerChosenAt: null,
    author: { login: 'giscus' },
    category: { name: category[0], slug: category[1] },
    comments: { totalCount: comments, nodes: comments ? [{ author: { login: 'nine1zero' } }] : [] },
    ...extra,
  });
  await page.route('https://api.github.com/graphql', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          repository: {
            discussions: {
              pageInfo: { hasNextPage: false, endCursor: null },
              nodes: [
                node(24, 'nuovo argomento prova', 2, '2026-11-17T02:49:39Z', ['General', 'general'], { locked: true }),
                node(22, 'Q&A — Domande sul modello e sul fondo', 4, '2026-11-17T01:37:22Z', ['Q&A', 'q-a'], { answerChosenAt: '2026-11-17T05:00:00Z' }),
                node(20, 'Ideas — Proposte e nuove funzioni', 1, '2026-11-17T01:11:33Z', ['Ideas', 'ideas']),
              ],
            },
          },
        },
      }),
    }),
  );

  const bar = page.getByTestId('foot-giscus-bar');
  await expect(bar).toBeVisible();
  const footReactions = bar.getByTestId('foot-giscus-reactions').locator('script[src="https://giscus.app/client.js"]');
  // reazioni sempre visibili, anche senza accesso (modificarle richiede l'accesso a GitHub)
  await expect(footReactions).toBeAttached();
  await expect(footReactions).toHaveAttribute('data-reactions-enabled', '1');
  await expect(footReactions).toHaveAttribute('data-theme', /giscus-reactions-only\.css/);

  const cta = bar.getByRole('link', { name: /Tutti i commenti e discussioni/ });
  await expect(cta).toHaveAttribute('href', '#/feedback');
  await cta.click();

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Discussioni e feedback');
  await expect(page.getByRole('link', { name: /Torna al simulatore/ })).toHaveCount(2);

  // Controlli: 4 segmenti di categoria (Tutte, General, Ideas, Q&A) e ordine Più recenti / Più commentate
  const cats = page.getByRole('radiogroup', { name: 'Categoria' });
  await expect(cats.getByRole('radio')).toHaveCount(4);
  for (const name of ['Tutte', 'General', 'Ideas', 'Q&A']) {
    await expect(cats.getByRole('radio', { name: new RegExp(`^${name}`) })).toBeVisible();
  }
  const sorts = page.getByRole('radiogroup', { name: 'Ordine' });
  await expect(sorts.getByRole('radio', { name: 'Più recenti' })).toHaveAttribute('aria-checked', 'true');

  // Senza accesso: solo il pulsante "Accedi con GitHub" e nessuna chiamata a GitHub
  const gate = page.getByTestId('fb-gate');
  const login = gate.getByRole('link', { name: 'Accedi con GitHub' });
  await expect(login).toHaveAttribute('href', /^https:\/\/giscus\.app\/api\/oauth\/authorize\?redirect_uri=/);
  await expect(gate.getByRole('button')).toHaveCount(0);
  await expect(page.getByTestId('giscus-host')).toHaveCount(0);
  expect(githubCalls).toEqual([]);

  // Ritorno dall'accesso: Giscus aggiunge ?giscus=<sessione> all'URL
  await page.goto('./?giscus=sessione-di-prova#/feedback');

  // Elenco caricato, conteggi categorie e barra delle pagine visibile
  await expect(cats.getByRole('radio', { name: /^Tutte 3$/ })).toBeVisible();
  await expect(cats.getByRole('radio', { name: /^General 1$/ })).toBeVisible();
  await expect(cats.getByRole('radio', { name: /^Ideas 1$/ })).toBeVisible();
  await expect(cats.getByRole('radio', { name: /^Q&A 1$/ })).toBeVisible();

  const pagesNav = page.getByRole('navigation', { name: 'Pagine' });
  await expect(pagesNav).toContainText('1–3 di 3');
  await expect(pagesNav.getByRole('button', { name: 'Pagina 1' })).toHaveAttribute('aria-current', 'page');

  // Ordine: di default Più recenti (24 in cima), con Più commentate 22 (4 commenti) va in cima
  const rows = page.getByRole('list', { name: 'Discussioni' }).getByRole('listitem');
  await expect(rows).toHaveCount(3);
  await expect(rows.first()).toContainText('nuovo argomento prova');
  await expect(rows.first()).toContainText('Bloccata');
  await sorts.getByRole('radio', { name: 'Più commentate' }).click();
  await expect(rows.first()).toContainText('Q&A — Domande sul modello e sul fondo');
  await expect(rows.first()).toContainText('✓ Risposta scelta');

  // Apertura di una discussione esistente: usa data-mapping="number"
  await rows.first().getByRole('button', { name: 'Q&A — Domande sul modello e sul fondo' }).click();
  const thread = page.getByTestId('fb-thread');
  await expect(thread.getByRole('heading', { level: 2 })).toHaveText('Q&A — Domande sul modello e sul fondo');
  await expect(thread.getByRole('link', { name: 'Apri su GitHub ↗' })).toHaveAttribute(
    'href',
    'https://github.com/nine1zero/pac-vs-fp/discussions/22',
  );
  const pageGiscus = page.getByTestId('giscus-host').locator('script[src="https://giscus.app/client.js"]');
  await expect(pageGiscus).toBeAttached();
  await expect(pageGiscus).toHaveAttribute('data-mapping', 'number');
  await expect(pageGiscus).toHaveAttribute('data-term', '22');
  await expect(pageGiscus).toHaveAttribute('data-reactions-enabled', '0');

  // Torna all'elenco e crea un "+ Nuovo argomento" in Ideas
  await thread.getByRole('button', { name: /Tutte le discussioni/ }).click();
  await cats.getByRole('radio', { name: /^Ideas/ }).click();
  await page.getByRole('button', { name: '+ Nuovo argomento' }).click();
  const input = page.getByLabel('Titolo del nuovo argomento');
  await expect(input).toBeVisible();
  await input.fill('Nuova proposta test');
  await input.press('Enter');
  await expect(page.getByTestId('fb-thread').getByRole('heading', { level: 2 })).toHaveText('Nuova proposta test');
  await expect(pageGiscus).toHaveAttribute('data-mapping', 'specific');
  await expect(pageGiscus).toHaveAttribute('data-term', 'Nuova proposta test');
});
