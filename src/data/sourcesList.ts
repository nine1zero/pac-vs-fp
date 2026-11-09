// Elenco delle fonti per la pagina "Parametri e fonti" (SPEC par. 9; dettaglio con pagine e citazioni in docs/FONTI.md).

export const FUND_SITE = 'https://www.fondopensioneibm.it';
export const FUND_DOCS_BASE = 'https://www.fondopensioneibm.it/docs';

export interface FundDocFile {
  label: string;
  url: string;
}

export interface FundDocEntry {
  doc: string;
  pageUrl: string;
  file: string;
  files: FundDocFile[];
  data: string;
}

export const FUND_DOCS: FundDocEntry[] = [
  {
    doc: 'Rendimenti dei Comparti – "Comparto Azionario"',
    pageUrl: `${FUND_SITE}/comp_azionario.htm`,
    file: 'comp_azionario.pdf',
    files: [{ label: 'comp_azionario.pdf', url: `${FUND_DOCS_BASE}/comp_azionario.pdf` }],
    data: 'Rendimento netto, benchmark netto, valore quota, cumulato dal 2009, 2018-2026',
  },
  {
    doc: 'Rendimenti dei Comparti – "Comparti assicurativi GESAV, Euroforte RE, RISPAV e Genris"',
    pageUrl: `${FUND_SITE}/comp_assicurativo.htm`,
    file: 'comp_assicurativo.pdf',
    files: [{ label: 'comp_assicurativo.pdf', url: `${FUND_DOCS_BASE}/comp_assicurativo.pdf` }],
    data: 'Rendimenti netti, ISTAT, rivalutazione TFR, costi delle gestioni, 2018-2026',
  },
  {
    doc: 'Bilanci di esercizio 2012-2017',
    pageUrl: `${FUND_SITE}/bilanci.htm`,
    file: 'bilancio12.pdf … bilancio17.pdf',
    files: [
      { label: 'bilancio12.pdf', url: `${FUND_DOCS_BASE}/bilancio12.pdf` },
      { label: 'bilancio13.pdf', url: `${FUND_DOCS_BASE}/bilancio13.pdf` },
      { label: 'bilancio14.pdf', url: `${FUND_DOCS_BASE}/bilancio14.pdf` },
      { label: 'bilancio15.pdf', url: `${FUND_DOCS_BASE}/bilancio15.pdf` },
      { label: 'bilancio16.pdf', url: `${FUND_DOCS_BASE}/bilancio16.pdf` },
      { label: 'bilancio17.pdf', url: `${FUND_DOCS_BASE}/bilancio17.pdf` },
    ],
    data: 'Rendimento netto del fondo e del benchmark, cumulati e valori quota (Sez. 4.2.3)',
  },
  {
    doc: 'Bilanci di esercizio 2010-2011',
    pageUrl: `${FUND_SITE}/bilanci.htm`,
    file: 'bilancio10.pdf, bilancio11.pdf',
    files: [
      { label: 'bilancio10.pdf', url: `${FUND_DOCS_BASE}/bilancio10.pdf` },
      { label: 'bilancio11.pdf', url: `${FUND_DOCS_BASE}/bilancio11.pdf` },
    ],
    data: 'Rendimenti lordi e netti 2009-2011 (quota iniziale 10,000 €); nuovo benchmark dal 2012',
  },
  {
    doc: 'Bilanci 1999-2025',
    pageUrl: `${FUND_SITE}/bilanci.htm`,
    file: 'bilancio99.pdf … bilancio25.pdf',
    files: [
      { label: 'bilancio99.pdf', url: `${FUND_DOCS_BASE}/bilancio99.pdf` },
      { label: 'bilancio24.pdf', url: `${FUND_DOCS_BASE}/bilancio24.pdf` },
      { label: 'bilancio25.pdf', url: `${FUND_DOCS_BASE}/bilancio25.pdf` },
    ],
    data: 'Storico GESAV (1999-2008 scansioni lette con OCR), patrimonio, Conto Economico (imposta sostitutiva effettiva)',
  },
  {
    doc: 'Documento sulla politica di investimento',
    pageUrl: `${FUND_SITE}/politica_investimento.htm`,
    file: 'politica_investimento.pdf',
    files: [{ label: 'politica_investimento.pdf', url: `${FUND_DOCS_BASE}/politica_investimento.pdf` }],
    data: 'Benchmark 45/45/10 e codici Price Index MSWRLDE(PI)/MSEROPE(PI) (Bloomberg MSERWI/MSEREURP), commissioni 0,24% + 10%',
  },
  {
    doc: 'Scheda costi (dall’01/01/2026)',
    pageUrl: `${FUND_SITE}/scheda_costi.htm`,
    file: 'scheda_costi.pdf',
    files: [{ label: 'scheda_costi.pdf', url: `${FUND_DOCS_BASE}/scheda_costi.pdf` }],
    data: 'ISC del comparto Azionario (0,29% a 10 anni)',
  },
  {
    doc: 'Nota informativa (e "Destinatari e contributi" / "Opzioni di investimento")',
    pageUrl: `${FUND_SITE}/nota.htm`,
    file: 'nota_informativa.pdf, nota_informativa_destinatari_e_contributi.pdf, nota_informativa_opzioni_di_investimento.pdf',
    files: [
      { label: 'nota_informativa.pdf', url: `${FUND_DOCS_BASE}/nota_informativa.pdf` },
      { label: 'nota_informativa_destinatari_e_contributi.pdf', url: `${FUND_DOCS_BASE}/nota_informativa_destinatari_e_contributi.pdf` },
      { label: 'nota_informativa_opzioni_di_investimento.pdf', url: `${FUND_DOCS_BASE}/nota_informativa_opzioni_di_investimento.pdf` },
    ],
    data: 'TER, aliquote contributive, rendimenti medi composti (Tav. 4-5 e Tav. 7)',
  },
  {
    doc: 'Schemi contributivi 2026',
    pageUrl: `${FUND_SITE}/schemi.htm`,
    file: 'schemi_contributivi.pdf',
    files: [{ label: 'schemi_contributivi.pdf', url: `${FUND_DOCS_BASE}/schemi_contributivi.pdf` }],
    data: 'Percentuali aderente/azienda, fascia INPS 56.224 €',
  },
  {
    doc: 'Regime fiscale',
    pageUrl: `${FUND_SITE}/fiscale.htm`,
    file: 'regime_fiscale.pdf',
    files: [{ label: 'regime_fiscale.pdf', url: `${FUND_DOCS_BASE}/regime_fiscale.pdf` }],
    data: 'Deducibilità 5.300 €, recupero 2.650 €, tassazione delle prestazioni',
  },
  {
    doc: 'Comunicazione contributi non dedotti',
    pageUrl: `${FUND_SITE}/non_dedotto.htm`,
    file: 'com_contributi_non_dedotti.pdf',
    files: [{ label: 'com_contributi_non_dedotti.pdf', url: `${FUND_DOCS_BASE}/com_contributi_non_dedotti.pdf` }],
    data: 'Obbligo di comunicazione entro il 31/12 dell’anno successivo',
  },
  {
    doc: 'Accordo aziendale 04/07/2023',
    pageUrl: `${FUND_SITE}/accordi.htm`,
    file: '04072023.pdf',
    files: [{ label: '04072023.pdf', url: `${FUND_DOCS_BASE}/04072023.pdf` }],
    data: 'Contributo dell’azienda uguale per tutti dal 2024 (schema confermato dalla Nota informativa 2026 p. 9)',
  },
  {
    doc: 'Statuto, Sistema di governo e Organi del Fondo',
    pageUrl: `${FUND_SITE}/statuto.htm`,
    file: 'statuto.pdf, sistema_di_governo.pdf, organi.pdf',
    files: [
      { label: 'statuto.pdf', url: `${FUND_DOCS_BASE}/statuto.pdf` },
      { label: 'sistema_di_governo.pdf', url: `${FUND_DOCS_BASE}/sistema_di_governo.pdf` },
      { label: 'organi.pdf', url: `${FUND_DOCS_BASE}/organi.pdf` },
    ],
    data: 'Regole statutarie, organizzazione, CdA, Collegio dei Sindaci, Assemblea dei Delegati e reclami',
  },
];

/** Restituisce i link diretti ai PDF sul sito FPDDI citati in una stringa di fonte. */
export function fundDocLinksForSource(source: string): FundDocFile[] {
  const s = source.toLowerCase();
  const out: FundDocFile[] = [];
  const add = (label: string, file: string) => {
    const url = `${FUND_DOCS_BASE}/${file}`;
    if (!out.some((x) => x.url === url)) out.push({ label, url });
  };
  if (s.includes('destinatari e i contributi') || s.includes('nota_informativa_destinatari_e_contributi')) {
    add('nota_informativa_destinatari_e_contributi.pdf', 'nota_informativa_destinatari_e_contributi.pdf');
    add('nota_informativa.pdf', 'nota_informativa.pdf');
  } else if (s.includes('nota informativa')) {
    add('nota_informativa.pdf', 'nota_informativa.pdf');
    if (s.includes('tav. 7') || s.includes('tav. 4') || s.includes('tav. 5')) {
      add('nota_informativa_opzioni_di_investimento.pdf', 'nota_informativa_opzioni_di_investimento.pdf');
    }
  }
  if (s.includes('regime fiscale') || s.includes('regime_fiscale')) {
    add('regime_fiscale.pdf', 'regime_fiscale.pdf');
  }
  if (s.includes('politica di investimento') || s.includes('politica_investimento')) {
    add('politica_investimento.pdf', 'politica_investimento.pdf');
  }
  if (s.includes('scheda dei costi') || s.includes('scheda_costi')) {
    add('scheda_costi.pdf', 'scheda_costi.pdf');
  }
  if (s.includes('comparto azionario') || s.includes('comp_azionario')) {
    add('comp_azionario.pdf', 'comp_azionario.pdf');
  }
  if (s.includes('comparti assicurativi') || s.includes('comp_assicurativo')) {
    add('comp_assicurativo.pdf', 'comp_assicurativo.pdf');
  }
  if (s.includes('bilanci 2012-2017')) {
    add('bilancio12.pdf', 'bilancio12.pdf');
    add('bilancio17.pdf', 'bilancio17.pdf');
  }
  if (s.includes('bilanci 2010–2025') || s.includes('bilancio 2025')) {
    add('bilancio25.pdf', 'bilancio25.pdf');
  }
  return out;
}

export const LAWS = [
  'D.Lgs. 252/2005: art. 8 (deducibilità e recupero), art. 11 (tassazione delle prestazioni e delle anticipazioni), art. 14 (riscatti), art. 17 (imposta sui rendimenti).',
  'L. 190/2014, art. 1, c. 621 (imposta al 20%).',
  'L. 199/2025 (Legge di bilancio 2026: scaglioni IRPEF, limite di deducibilità).',
  'Art. 13 TUIR (detrazione per lavoro dipendente); art. 51 c. 2 lett. h TUIR (contributi in busta paga); L. 207/2024 art. 1 cc. 4-6 (cuneo fiscale).',
  'Circolare INPS n. 6/2026 (prima fascia pensionabile 56.224 €); L. 438/1992 art. 3-ter (1% oltre la fascia).',
  'Regione Lombardia, addizionale regionale (l.r. 10/2003 art. 72); D.Lgs. 360/1998 (addizionale comunale, massimo 0,8%).',
  'D.L. 201/2011, art. 19 (bollo 0,20%).',
  'D.L. 66/2014 (26% sui redditi finanziari).',
];

export const MARKETS = [
  'Yahoo Finance, serie giornaliere ISAC.L, EURUSD=X, EUNL.DE, EUNK.DE, XEON.DE, scaricate il 21/10/2026 (etf_monthly.sources.json).',
  'Schede prodotto iShares (IE00B6R52259, IE00B4L5Y983, IE00B4K48X80), Xtrackers (LU0290358497), Vanguard (IE00BK5BQT80, IE00B3RBWM25), SPDR (IE00B3YLTY66). Yahoo Finance VGWL.DE e SPYI.DE (etf_annual_extra.json). Finanzfluss ed extraETF per TER, titoli, patrimonio e medie storiche (20-23/10/2026).',
  'J.P. Morgan Asset Management, Long-Term Capital Market Assumptions 2026 (azionario globale 7% annuo in USD).',
  'FTSE Russell e MSCI, schede degli indici (quota del mercato coperta).',
];

export const STUDIES = [
  'SPIVA Europe Mid-Year 2026, S&P Dow Jones Indices: 97,7% dei fondi attivi azionari globali in euro sotto il benchmark a 10 anni.',
  'W. Sharpe, The Arithmetic of Active Management, Financial Analysts Journal, 1991.',
  'E. Fama e K. French, Luck versus Skill in the Cross-Section of Mutual Fund Returns, Journal of Finance, 2010.',
  'K. French e J. Poterba, Investor Diversification and International Equity Markets, American Economic Review, 1991 (home bias).',
  'COVIP, Relazione annuale e dati sui rendimenti; ISC medi a 10 anni: negoziali 0,49%, aperti 1,35%, PIP 2,17%.',
];

/** Assunzioni del modello (SPEC par. 3.4 H, testi del prototipo). */
export const ASSUMPTIONS: [string, string][] = [
  ['Stesso budget netto', 'I tre scenari usano ogni anno gli stessi soldi del tuo stipendio netto. Cambia solo dove li metti.'],
  ['Rimborso IRPEF nel PAC', 'Il risparmio fiscale della deduzione è investito nel PAC nello stesso anno.'],
  ['Differenziale costante', 'Il fondo rende ogni anno come l’ETF di riferimento più il differenziale scelto.'],
  ['Costi già nel differenziale', 'Il differenziale storico è calcolato sui valori quota, già al netto dei costi del fondo.'],
  ['Versamenti a metà anno', 'I contributi mensili rendono in media mezzo anno nell’anno in cui arrivano.'],
  ['Contributi +2% l’anno', 'Contributi e TFR crescono con lo stipendio; il limite di 5.300 € resta fisso.'],
  ['Uscita in capitale', 'Confrontiamo il capitale netto all’uscita; la rendita non è simulata.'],
  ['Riscatto anticipato 23%', 'Nella striscia e nella mappa, ogni uscita prima dell’ultimo anno è trattata come riscatto per dimissioni.'],
  ['PAC tassato alla fine', 'Il PAC paga il bollo 0,2% ogni anno e il 26% sulle plusvalenze solo alla vendita.'],
  ['Norme 2026', 'Scaglioni, limiti e aliquote restano quelli del 2026 per tutto l’orizzonte.'],
];

/** Limiti da dichiarare (SPEC par. 10). */
export const LIMITS = [
  'Differenziale e rendimenti costanti nel tempo.',
  'Norme fiscali 2026 per tutto l’orizzonte (scaglioni non indicizzati); non modellati trattamento integrativo, detrazioni per familiari, esenzioni comunali.',
  'TFR sempre nel fondo; nessun cambio di datore di lavoro.',
  'Uscita in un’unica soluzione: non sono simulate la rendita vitalizia, la RITA o le nuove prestazioni introdotte dal 2026 (rendita frazionata, rendita temporanea fino a 5 anni, erogazione frazionata in 5–20 anni, limite del 60% in capitale).',
  'La parte tassabile della posizione attuale è una stima dell’utente.',
  'Il benchmark 45/45/10 è ricostruito in versione Total Return con ETF; il benchmark pubblicato dal fondo usa invece indici azionari Price Index senza dividendi (MSWRLDE(PI) e MSEROPE(PI), Politica di investimento par. 4.2.4 p. 18).',
  'I dati del 2026 sono parziali (gennaio-agosto).',
];
