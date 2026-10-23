"""Riferimento per: (1) statistiche storiche fondo/benchmark/ETF; (2) parser del file DettaglioOperazioni
(.xls che in realtà è una tabella HTML) e confronto 'stessi versamenti nell'ETF'.
Uso: python3 history.py [percorso_file_DettaglioOperazioni.xls]"""
import csv, json, re, sys, datetime as dt, math, os
HERE = os.path.dirname(__file__)
# dati: public/data nel repository (o data/ accanto, nel pacchetto di specifica)
DATA = next(p for p in (os.path.join(HERE, "../../public/data"), os.path.join(HERE, "../data")) if os.path.isdir(p))
az = json.load(open(os.path.join(DATA, "fpddi_azionario.json")))
etf = list(csv.DictReader(open(os.path.join(DATA, "etf_monthly.csv"))))
px = {r["month_end"]: r for r in etf}
def price(date_iso, col="acwi_eur"): return float(px[date_iso][col])
def month_end(d):
    nxt = (d.replace(day=28) + dt.timedelta(days=4)); return (nxt - dt.timedelta(days=nxt.day)).isoformat()

def annual_table():
    rows = []
    for y in az["years"]:
        end = y["period_end"]; prev = f"{y['year']-1}-12-31"
        r = dict(year=y["year"], fund_net=y["fund_net"], bench_net=y["benchmark_net"], tax=y["fund_tax_rate"])
        r["fund_pre_tax"] = r["fund_net"] / (1 - r["tax"]); r["bench_pre_tax"] = r["bench_net"] / (1 - r["tax"])
        for c in ["acwi_eur", "msci_world_eur", "msci_europe_eur", "estr_eur"]:
            r[c] = price(end, c) / price(prev, c) - 1
        w = az["benchmark_composition"]
        r["bench_rebuilt"] = w["MSCI World"] * r["msci_world_eur"] + w["MSCI Europe"] * r["msci_europe_eur"] + w["JPM Cash Euro 3M"] * r["estr_eur"]
        rows.append(r)
    return rows

def cagr(rows, key, y0, y1):
    sel = [r[key] for r in rows if y0 <= r["year"] <= y1]
    return math.prod(1 + v for v in sel) ** (1 / len(sel)) - 1

def parse_dettaglio(path):
    html = open(path, encoding="utf-8", errors="replace").read()
    trs = re.findall(r"<tr[^>]*>(.*?)</tr>", html, re.S)
    head = [re.sub(r"<[^>]+>", "", c).strip() for c in re.findall(r"<th[^>]*>(.*?)</th>", trs[0], re.S)]
    num = lambda s: float(s.replace(".", "").replace(",", ".")) if s not in ("", None) else None
    date = lambda s: dt.datetime.strptime(s, "%d/%m/%Y").date() if re.match(r"\d\d/\d\d/\d{4}$", s or "") else None
    out = []
    for tr in trs[1:]:
        cells = [re.sub(r"<[^>]+>", "", c).strip() for c in re.findall(r"<td[^>]*>(.*?)</td>", tr, re.S)]
        if not cells or cells[0] == "TOTALE": continue   # la riga dei totali sta nel tfoot
        r = dict(zip(head, cells))
        out.append(dict(tipo=r["Tipo Operazione"], competenza=date(r["Data Competenza"]), data_valore=date(r.get("Data Valore Quota", "")),
                        aderente=num(r["Importo Lordo Aderente"]), azienda=num(r["Importo Lordo Azienda"]), tfr=num(r["Tfr"]),
                        altro=num(r["Altro"]), netto=num(r["Importo Netto"]), comparto=r.get("Comparto", ""),
                        quote=num(r.get("Numero Quote", "")), valore_quota=num(r.get("Valore Quota", ""))))
    return head, out

def counterfactual(ops, valuation=None, nav_end=None):
    """Valutazione alla data e al valore quota dell'ultimo movimento del file (SPEC par. 6.3), salvo override."""
    last = max((o for o in ops if o["data_valore"] and o["valore_quota"]), key=lambda o: o["data_valore"])
    valuation = valuation or dt.date.fromisoformat(month_end(last["data_valore"]))   # fine del mese dell'ultimo movimento
    nav_end = nav_end if nav_end is not None else last["valore_quota"]
    rows = annual_table(); tax = {r["year"]: r["tax"] for r in rows}
    # indice ETF "tassato come il fondo": prodotto di (1 + r_y*(1-t_y))
    idx, acc = {}, 1.0
    for r in rows: acc *= 1 + r["acwi_eur"] * (1 - r["tax"]); idx[r["year"]] = acc
    end_idx = idx[valuation.year]; p_val = price(month_end(valuation))
    real = sum(o["quote"] or 0 for o in ops if o["comparto"] == "AZIONARIO") * nav_end
    pending = sum(o["netto"] for o in ops if o["tipo"] == "Contr. non investito")
    inside = outside = 0.0
    for o in ops:
        if o["tipo"] not in ("Contributo", "Ctrb. una tantum", "Anticipazione"): continue
        d = o["data_valore"]; y = d.year
        p0 = price(month_end(d)); p_ye = price(month_end(min(dt.date(y, 12, 31), valuation)))
        inside += o["netto"] * (1 + (p_ye / p0 - 1) * (1 - tax[y])) * end_idx / idx[y]
        outside += o["netto"] * p_val / p0
    return dict(real_position=real + pending, etf_inside_fund=inside + pending, etf_outside_fund_pre_tax=outside + pending,
                nav_end_used=nav_end, valuation_date=valuation.isoformat())

if __name__ == "__main__":
    rows = annual_table()
    g = {k: {"2012-2025": cagr(rows, k, 2012, 2025), "2014-2025": cagr(rows, k, 2014, 2025)} for k in
         ["fund_net", "bench_net", "fund_pre_tax", "bench_pre_tax", "acwi_eur", "msci_world_eur", "msci_europe_eur", "estr_eur", "bench_rebuilt"]}
    g["delta_fund_minus_etf_2014_2025"] = g["fund_pre_tax"]["2014-2025"] - g["acwi_eur"]["2014-2025"]
    g["delta_bench_minus_etf_2014_2025"] = g["bench_pre_tax"]["2014-2025"] - g["acwi_eur"]["2014-2025"]
    if len(sys.argv) > 1:
        head, ops = parse_dettaglio(sys.argv[1]); g["dettaglio"] = dict(n_rows=len(ops), **counterfactual(ops))
    print(json.dumps(g, indent=1))
