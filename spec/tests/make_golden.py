"""Rigenera tests/golden_model_example.json dal modello di riferimento.
Uso: python3 tests/make_golden.py   (da eseguire solo quando cambia volutamente il modello; documentare il motivo in docs/CHANGELOG.md)"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "reference"))
import model as m

def r2(x): return round(x, 2)
p = dict(m.DEFAULTS)
DATA = next(p for p in (os.path.join(HERE, "../../public/data"), os.path.join(HERE, "../data")) if os.path.isdir(p))
prof = json.load(open(os.path.join(DATA, "profile_example.json")))
for k, v in prof.items():
    p[k] = [tuple(x) for x in v] if k in ("irpef", "regional") else v
assert all(p[k] == m.DEFAULTS[k] or k in ("irpef", "regional") for k in prof), "profile_example.json diverso da DEFAULTS"
res = m.simulate(p)
rows = m.yearly_flows(p)
g = {
    "profile": "data/profile_example.json (uguale a reference/model.py DEFAULTS)",
    "delta": p["delta"],
    "effective_rate_first_year_max_deduction": round(m.marginal_rate(p, rows[0]["J"]), 6),
    "pensione_delta_default": [r2(r["total_net"]) for r in res],
    "pensione_delta_default_real": [r2(r["total_real"]) for r in res],
    "pensione_delta_0": [r2(r["total_net"]) for r in m.simulate(p, 0.0)],
    "riscatto_10y_delta_default": [r2(r["total_net"]) for r in m.simulate(p, None, 10, "Riscatto")],
    "breakeven_pensione_full": {"2vs3": m.breakeven(p, 1, 2), "1vs3": m.breakeven(p, 0, 2), "2vs1": m.breakeven(p, 1, 0)},
    "breakeven_riscatto_by_horizon": {str(h): {"2vs3": m.breakeven(p, 1, 2, h, "Riscatto"), "1vs3": m.breakeven(p, 0, 2, h, "Riscatto"), "2vs1": m.breakeven(p, 1, 0, h, "Riscatto")} for h in (1, 5, 10, 20, 30)},
    "yearly_row_1": {k: (v if k != "s" else [{kk: r2(vv) for kk, vv in s.items()} for s in v]) for k, v in rows[0].items()},
    "tax_checks": {str(ral): {"reddito": r2(m.taxable_income(p, ral)), "imposte": r2(m.tax_total(p, m.taxable_income(p, ral))),
                              "risparmio_su_1000": r2(m.tax_saving(p, ral, 1000.0))} for ral in (15000, 25000, 35000, 45000, 60000, 90000)},
}
json.dump(g, open(os.path.join(HERE, "golden_model_example.json"), "w"), indent=1, ensure_ascii=False)
print(json.dumps({k: g[k] for k in ("effective_rate_first_year_max_deduction", "pensione_delta_default", "breakeven_pensione_full")}, indent=1))
