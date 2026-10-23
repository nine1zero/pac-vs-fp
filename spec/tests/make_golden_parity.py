"""Rigenera tests/golden_parity_cases.json: i casi di tests/parity_prototype.js calcolati con reference/model.py.
Uso: python3 tests/make_golden_parity.py   (solo quando cambia volutamente il modello; vedi docs/CHANGELOG.md)"""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "reference"))
import model as m

def r2(x): return round(x, 2)
def totals(over, delta=None, horizon=None, mode=None):
    p = dict(m.DEFAULTS); p.update(over)
    return [r2(r["total_net"]) for r in m.simulate(p, delta, horizon, mode)]

# stessi casi e stesso ordine di tests/parity_prototype.js
cases = {
    "pens": dict(over={}),
    "d0": dict(over={}, delta=0.0),
    "r10": dict(over={}, horizon=10, mode="Riscatto"),
    "fix": dict(over={"annual_saving": 3000.0}),
    "fixLow": dict(over={"annual_saving": 200.0}),
    "ral90": dict(over={"ral": 90000.0}),
    "ral20": dict(over={"ral": 20000.0}),
}
g = {"note": "Casi di tests/parity_prototype.js calcolati con reference/model.py (capitale netto [S1, S2, S3])",
     "delta": m.DEFAULTS["delta"], "cases": {}}
for name, c in cases.items():
    g["cases"][name] = dict(params=c["over"], delta=c.get("delta"), horizon=c.get("horizon"), mode=c.get("mode"),
                            total_net=totals(c["over"], c.get("delta"), c.get("horizon"), c.get("mode")))
p = dict(m.DEFAULTS)
g["tau"] = m.marginal_rate(p, m.yearly_flows(p)[0]["J"])
json.dump(g, open(os.path.join(HERE, "golden_parity_cases.json"), "w"), indent=1, ensure_ascii=False)
print(json.dumps({k: v["total_net"] for k, v in g["cases"].items()}))
