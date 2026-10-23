"""Implementazione di riferimento del simulatore (identica al Google Sheet).
Uso: python3 model.py  -> stampa i valori di controllo (golden) usati nei test."""
import json, math, os

DEFAULTS = dict(
    birth_year=1990, exit_age=67, first_join_year=2015, start_year=2027,
    ral=45000.0, min_member_month=75.0, employer_month=70.0, tfr_month=230.0, months=13,
    current_position=20000.0, current_taxable_base=16000.0, recoverable_non_deducted=0.0,   # profilo d'esempio pubblico
    annual_saving=None,            # None = quanto serve per la deduzione massima
    growth=0.02, inflation=0.02, base_year_real=2026,
    # Fisco 2026 (fonti in docs/FONTI.md). Imponibile = RAL - contributi INPS del dipendente.
    inps_rate=0.0919, inps_extra_rate=0.01, inps_first_band=56224.0,
    irpef=[(28000,0.23),(50000,0.33),(None,0.43)],
    regional=[(15000,0.0123),(28000,0.0158),(50000,0.0172),(None,0.0173)],   # Lombardia 2026
    add_municipal=0.008,                                                    # massimo di legge (D.Lgs. 360/1998), es. Milano
    payroll_deduction=True,   # contributi trattenuti in busta paga: riducono il reddito complessivo (art. 51 c.2 lett. h TUIR)
    deduction_limit=5300.0, recovery_cap=2650.0, recovery_from_year_offset=5, recovery_last_year_offset=24,
    fund_return_tax=0.20, exit_tax_max=0.15, exit_tax_reduction=0.003, exit_tax_min=0.09, exit_tax_threshold_years=15,
    redemption_tax=0.23, exit_mode="Pensione",
    etf_gross_return=0.07, etf_ter=0.0014, stamp_duty=0.002, capital_gain_tax=0.26,   # TER: Vanguard FTSE All-World Acc
    delta=-0.05808330715699661, contribution_year_fraction=0.5,   # storico fondo 2014-2025
)

def progressive(x, brackets):
    """Imposta a scaglioni: brackets = [(limite_superiore|None, aliquota), ...]."""
    tax, low = 0.0, 0.0
    for limit, r in brackets:
        top = x if limit is None else min(x, limit)
        if top > low:
            tax += (top - low) * r
        if limit is None or x <= limit:
            break
        low = limit
    return tax

def taxable_income(p, ral):
    """Reddito di lavoro dipendente = RAL - contributi INPS del dipendente (9,19% + 1% oltre la prima fascia)."""
    return ral - p["inps_rate"] * ral - p["inps_extra_rate"] * max(0.0, ral - p["inps_first_band"])

def detrazione_lavoro(r):
    """Art. 13 c.1 TUIR (testo dal 2024, confermato per il 2026). r = reddito complessivo."""
    if r <= 15000: return 1955.0
    if r <= 28000: return 1910.0 + 1190.0 * (28000 - r) / 13000
    if r <= 50000: return 1910.0 * (50000 - r) / 22000
    return 0.0

def cuneo(r):
    """L. 207/2024 art. 1 c. 4-6: (somma esente sul reddito, ulteriore detrazione)."""
    if r <= 20000:
        pct = 0.071 if r <= 8500 else 0.053 if r <= 15000 else 0.048
        return pct * r, 0.0
    if r <= 32000: return 0.0, 1000.0
    if r <= 40000: return 0.0, 1000.0 * (40000 - r) / 8000
    return 0.0, 0.0

def tax_total(p, r):
    """IRPEF netta + addizionali per un dipendente con solo reddito di lavoro r.
    Non modellati: trattamento integrativo (redditi bassi), altre detrazioni personali, esenzioni comunali."""
    esente, ulteriore = cuneo(r)
    base = max(0.0, r - esente)
    irpef = max(0.0, progressive(base, p["irpef"]) - detrazione_lavoro(r) - ulteriore)
    return irpef + progressive(base, p["regional"]) + p["add_municipal"] * base

def tax_saving(p, ral, deducted):
    """Risparmio fiscale effettivo di una deduzione: T(r) - T(r - D). Con contributi in busta paga la deduzione
    riduce anche il reddito complessivo su cui si calcolano detrazioni e cuneo (art. 51 c. 2 lett. h TUIR)."""
    if deducted <= 0: return 0.0
    r = taxable_income(p, ral)
    if p.get("payroll_deduction", True):
        return tax_total(p, r) - tax_total(p, r - deducted)
    # versamento diretto dedotto in dichiarazione: riduce solo l'imponibile (detrazioni invariate)
    esente, ulteriore = cuneo(r); base = max(0.0, r - esente)
    full = lambda b: max(0.0, progressive(b, p["irpef"]) - detrazione_lavoro(r) - ulteriore) + progressive(b, p["regional"]) + p["add_municipal"] * b
    return full(base) - full(base - deducted)

def marginal_rate(p, deducted=1000.0):
    """Aliquota effettiva media su una deduzione di `deducted` euro nel primo anno (solo per mostrarla)."""
    return tax_saving(p, p["ral"], deducted) / deducted

def min_member_from_ral(ral, band=56224.0):
    """Minimo a carico del lavoratore per avere il contributo dell'azienda, schema generale IBM Italia
    (Nota informativa FPDDI, scheda 'I destinatari e i contributi', in vigore dal 01/01/2026): 2% fino alla
    prima fascia pensionabile INPS, 7% oltre. Annuo."""
    return 0.02 * min(ral, band) + 0.07 * max(0.0, ral - band)

def exit_tax(p, exit_year, mode):
    if mode == "Riscatto":
        return p["redemption_tax"]
    years = exit_year - p["first_join_year"]
    return max(p["exit_tax_min"], p["exit_tax_max"] - p["exit_tax_reduction"] * max(0, years - p["exit_tax_threshold_years"]))

def yearly_flows(p):
    """Restituisce la lista dei flussi anno per anno (non dipendono dal differenziale)."""
    n = p["birth_year"] + p["exit_age"] - p["start_year"] + 1
    resid = p["recoverable_non_deducted"]
    rows = []
    for k in range(1, n + 1):
        year = p["start_year"] + k - 1
        g = (1 + p["growth"]) ** (k - 1)
        E = p["min_member_month"] * p["months"] * g      # contributo minimo aderente
        F = p["employer_month"] * p["months"] * g        # contributo azienda
        G = p["tfr_month"] * p["months"] * g             # TFR
        H = resid                                         # residuo recuperabile a inizio anno
        ok = (p["first_join_year"] + p["recovery_from_year_offset"]) <= year <= (p["first_join_year"] + p["recovery_last_year_offset"])
        I = min(p["recovery_cap"], H) if ok else 0.0      # recupero usabile
        J = max(E, p["deduction_limit"] + I - F)          # versamento per deduzione massima
        ral_y = p["ral"] * g                              # retribuzione dell'anno (cresce come i contributi)
        floor = max(E, min_member_from_ral(ral_y, p["inps_first_band"]))
        K = J if p["annual_saving"] is None else min(J, max(floor, p["annual_saving"] * g))   # risparmio annuo: tra quota minima e deduzione massima
        # Scenario 1: minimo per contributo azienda
        L = E; M = F if L >= E else 0.0
        N = max(0.0, min(L, p["deduction_limit"] - M)); O = tax_saving(p, ral_y, N)
        P1 = max(0.0, K - L + O); Q1 = L + M + G; R1 = N + M + G
        # Scenario 2: deduzione massima, rimborso IRPEF nel PAC
        S = max(E, min(J, K)); T = F if S >= E else 0.0
        U = max(0.0, min(S, p["deduction_limit"] + I - T)); V = max(0.0, U + T - p["deduction_limit"])
        W = tax_saving(p, ral_y, U); P2 = max(0.0, K - S + W); Q2 = S + T + G; R2 = U + T + G
        # Scenario 3: solo TFR nel fondo, tutto il risparmio nel PAC
        P3 = K; Q3 = G; R3 = G
        resid = max(0.0, H - V)
        rows.append(dict(k=k, year=year, E=E, F=F, G=G, H=H, I=I, J=J, K=K,
                         s=[dict(member=L, employer=M, deductible=N, irpef_saving=O, pac=P1, fund=Q1, taxable=R1),
                            dict(member=S, employer=T, deductible=U, irpef_saving=W, pac=P2, fund=Q2, taxable=R2, recovery_used=V),
                            dict(member=0.0, employer=0.0, deductible=0.0, irpef_saving=0.0, pac=P3, fund=Q3, taxable=R3)]))
    return rows

def simulate(p, delta=None, horizon=None, mode=None):
    """Capitale netto all'uscita dei 3 scenari dopo `horizon` anni (default: fino alla pensione)."""
    delta = p["delta"] if delta is None else delta
    mode = p["exit_mode"] if mode is None else mode
    rows = yearly_flows(p)
    H = len(rows) if horizon is None else horizon
    re = p["etf_gross_return"] - p["etf_ter"]
    rn = (re + delta) * (1 - p["fund_return_tax"])
    fz = p["contribution_year_fraction"]
    exit_year = p["start_year"] + H - 1
    t_exit = exit_tax(p, exit_year, mode)
    out = []
    for s in range(3):
        F = p["current_position"]; B = p["current_taxable_base"]; V = 0.0; C = 0.0
        series = []
        for r in rows[:H]:
            x = r["s"][s]
            F = F * (1 + rn) + x["fund"] * (1 + rn) ** fz
            B = B + x["taxable"]
            V = (V * (1 + re) * (1 - p["stamp_duty"]) if r["k"] > 1 else 0.0) + x["pac"] * (1 + re) ** fz
            C = C + x["pac"]
            series.append(F + V)
        fund_net = F - t_exit * B
        pac_net = V - p["capital_gain_tax"] * max(0.0, V - C)
        total = fund_net + pac_net
        real = total / (1 + p["inflation"]) ** (exit_year - p["base_year_real"])
        out.append(dict(fund_value=F, taxable_base=B, exit_tax=t_exit * B, fund_net=fund_net,
                        pac_value=V, pac_cost=C, pac_net=pac_net, total_net=total, total_real=real, series=series))
    return out

def breakeven(p, a, b, horizon=None, mode=None, lo=-0.95, hi=0.5):
    """Differenziale per cui scenario a == scenario b (bisezione). None se non c'è pareggio in [lo, hi]."""
    f = lambda d: simulate(p, d, horizon, mode)[a]["total_net"] - simulate(p, d, horizon, mode)[b]["total_net"]
    fl, fh = f(lo), f(hi)
    if fl > 0: return "sempre"   # a migliore in tutto l'intervallo
    if fh < 0: return "mai"
    for _ in range(80):
        m = (lo + hi) / 2
        if f(m) > 0: hi = m
        else: lo = m
    return (lo + hi) / 2

if __name__ == "__main__":
    import sys
    p = dict(DEFAULTS)
    if len(sys.argv) > 1:   # es. tests/private/profilo_privato.json (solo in locale)
        prof = json.load(open(sys.argv[1]))
        if len(prof) == 1 and isinstance(next(iter(prof.values())), dict):   # file con un solo profilo annidato
            prof = next(iter(prof.values()))
        p.update({k: (v if k != "irpef" else [tuple(x) for x in v]) for k, v in prof.get("defaults", prof).items()})
    res = simulate(p)
    golden = {"defaults_pensione_delta_storico": [round(r["total_net"], 2) for r in res],
              "defaults_pensione_delta_storico_real": [round(r["total_real"], 2) for r in res],
              "delta_minus2_pensione": [round(r["total_net"], 2) for r in simulate(p, -0.02)],
              "breakeven_pensione_28y": {"2vs3": breakeven(p, 1, 2), "1vs3": breakeven(p, 0, 2), "2vs1": breakeven(p, 1, 0)},
              "breakeven_riscatto_by_horizon": {}}
    for h in [1, 2, 3, 5, 8, 10, 12, 13, 15, 20, 25, 28]:
        golden["breakeven_riscatto_by_horizon"][h] = {k: (round(v, 6) if isinstance(v, float) else v) for k, v in
            {"2vs3": breakeven(p, 1, 2, h, "Riscatto"), "1vs3": breakeven(p, 0, 2, h, "Riscatto"), "2vs1": breakeven(p, 1, 0, h, "Riscatto")}.items()}
    print(json.dumps(golden, indent=1))
