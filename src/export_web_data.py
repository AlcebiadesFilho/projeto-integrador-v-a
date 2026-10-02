"""
Exporta a base analítica (1 linha = 1 chamado) para o painel web, em formato colunar compacto.

Entrada : data/processed/tickets.parquet  (gerado por prepare_data.py)
Saída   : web/public/data/tickets.json

Só vão para o JSON campos já anonimizados e sem texto livre. Dimensões viram dicionários
(lista de valores + índice inteiro por chamado), o que reduz o arquivo a ~1/5 do tamanho.

Uso: python src/export_web_data.py
"""
import json
from pathlib import Path

import pandas as pd

import kpis as K

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "data" / "processed" / "tickets.parquet"
OUT = ROOT / "web" / "public" / "data" / "tickets.json"

DIMS = {
    "team": K.TEAM_ORDER,
    "urgency": K.URGENCY_ORDER,
    "demand": K.DEMAND_ORDER,
}


def encode(s: pd.Series, order: list[str] | None = None) -> tuple[list[str], list[int]]:
    values = order or s.value_counts().index.tolist()
    values = [v for v in values if v in set(s)]
    idx = {v: i for i, v in enumerate(values)}
    return values, s.map(idx).astype(int).tolist()


def main() -> None:
    t = K.in_window(pd.read_parquet(SRC)).rename(columns={"demand_type": "demand"})
    t = t.sort_values("created")
    months = sorted(t["month"].unique())
    month_idx = {m: i for i, m in enumerate(months)}

    dims, cols = {}, {}
    for name in ["team", "urgency", "demand", "category", "service", "client", "agent"]:
        dims[name], cols[name] = encode(t[name], DIMS.get(name))

    payload = {
        "meta": {
            "source": "Movidesk / Infomach — base anonimizada",
            "window": [str(months[0])[:7], str(months[-1])[:7]],
            "internalClient": K.INTERNAL_CLIENT,
            "internalService": K.INTERNAL_SERVICE,
            "rows": len(t),
        },
        "months": [str(m)[:7] for m in months],
        "dims": dims,
        "cols": {
            "month": t["month"].map(month_idx).tolist(),
            **cols,
            # horas e ciclo com 2 casas: precisão suficiente e arquivo menor
            "hours": t["hours"].round(4).tolist(),
            "cycle": t["cycle_h"].round(2).tolist(),
            "touches": t["n_appointments"].astype(int).tolist(),
        },
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"[ok] {len(t):,} chamados -> {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
