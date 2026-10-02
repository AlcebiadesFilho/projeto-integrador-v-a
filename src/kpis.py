"""
Definição única dos KPIs — usada pelo painel Streamlit e pelos scripts de relatório,
para que os números sejam sempre os mesmos em todos os entregáveis.
"""
from dataclasses import dataclass

import pandas as pd

# Janela de análise: só meses completos (jun/2020 e jun/2022 são parciais na extração)
WINDOW_START = pd.Timestamp("2020-07-01")
WINDOW_END = pd.Timestamp("2022-05-31 23:59")

URGENCY_ORDER = ["Urgente", "Alta", "Normal", "Baixa", "Planejada", "Não informada"]
DEMAND_ORDER = ["Reativa", "Planejada", "Atendimento/Outros"]
# Conta que concentra o serviço "Infomach (Interno)" (reuniões, relatórios, treinamentos).
# Identificação inferida dos dados — confirmar com a Infomach.
INTERNAL_CLIENT = "Cliente_4"
INTERNAL_SERVICE = "Infomach (Interno)"

TEAM_ORDER = ["Rede & Conectividade", "Backup", "Endpoint & Proteção de Dados", "Cloud",
              "Infraestrutura", "Monitoramento", "Outras"]


def in_window(t: pd.DataFrame) -> pd.DataFrame:
    return t[(t["created"] >= WINDOW_START) & (t["created"] <= WINDOW_END)]


@dataclass
class KPI:
    key: str
    label: str
    value: float
    fmt: str
    help: str


def compute(t: pd.DataFrame) -> dict[str, KPI]:
    """KPIs do painel. `t` = chamados já filtrados."""
    n = len(t)
    months = max(t["month"].nunique(), 1)
    hours = t["hours"].sum()
    agents_month = t[t["agent"] != "Não atribuído"].groupby("month")["agent"].nunique()
    hours_month = t.groupby("month")["hours"].sum()
    ext = t[t["client"] != INTERNAL_CLIENT]
    ext_hours = ext["hours"].sum()
    top10 = ext.groupby("client")["hours"].sum().nlargest(10).sum()
    internal = t.loc[t["service"] == INTERNAL_SERVICE, "hours"].sum()
    k = [
        KPI("vol_mes", "Chamados / mês", n / months, "{:,.0f}",
            "Média de chamados abertos por mês — dimensiona a demanda."),
        KPI("horas_mes", "Horas técnicas / mês", hours / months, "{:,.0f} h",
            "Média de horas apontadas por mês — o custo operacional real."),
        KPI("esforco", "Esforço médio / chamado", (hours / n * 60) if n else 0, "{:,.0f} min",
            "Horas apontadas ÷ chamados — quanto 'custa' cada chamado."),
        KPI("reativo", "Demanda reativa", (t["demand_type"].eq("Reativa").mean() * 100) if n else 0,
            "{:.1f}%", "% de chamados de Incidente ou Alerta — trabalho não planejado."),
        KPI("critico", "Urgente + Alta", (t["urgency"].isin(["Urgente", "Alta"]).mean() * 100) if n else 0,
            "{:.1f}%", "% de chamados com prioridade Urgente ou Alta."),
        KPI("ciclo", "Ciclo mediano", t["cycle_h"].median() if n else 0, "{:,.1f} h",
            "Mediana entre a abertura e o último apontamento (proxy de resolução)."),
        KPI("interno", "Horas em atividade interna", (internal / hours * 100) if hours else 0, "{:.1f}%",
            "% das horas no serviço 'Infomach (Interno)' — esforço que não é entregue a clientes."),
        KPI("top10", "Horas nos 10 maiores clientes", (top10 / ext_hours * 100) if ext_hours else 0,
            "{:.1f}%", "Concentração do esforço entre clientes externos (exclui a conta interna)."),
        KPI("carga", "Horas / técnico / mês",
            (hours_month / agents_month).mean() if len(agents_month) else 0, "{:,.0f} h",
            "Horas apontadas ÷ técnicos ativos no mês — indicador de capacidade."),
    ]
    return {x.key: x for x in k}


def fmt(k: KPI) -> str:
    return k.fmt.format(k.value).replace(",", "X").replace(".", ",").replace("X", ".")


def br(x: float, dec: int = 0) -> str:
    s = f"{x:,.{dec}f}"
    return s.replace(",", "X").replace(".", ",").replace("X", ".")


def monthly(t: pd.DataFrame) -> pd.DataFrame:
    m = t.groupby("month").agg(chamados=("ticket_id", "size"), horas=("hours", "sum"),
                               reativos=("demand_type", lambda s: (s == "Reativa").sum()),
                               ciclo_mediano=("cycle_h", "median")).reset_index()
    m["pct_reativo"] = m["reativos"] / m["chamados"] * 100
    return m


def by_team(t: pd.DataFrame) -> pd.DataFrame:
    g = t.groupby("team").agg(chamados=("ticket_id", "size"), horas=("hours", "sum"),
                              ciclo_mediano=("cycle_h", "median"),
                              reativo=("demand_type", lambda s: (s == "Reativa").mean() * 100))
    g["esforco_min"] = g["horas"] / g["chamados"] * 60
    g["pct_horas"] = g["horas"] / g["horas"].sum() * 100
    return g.reindex([x for x in TEAM_ORDER if x in g.index]).reset_index()


def pareto_clients(t: pd.DataFrame, external_only: bool = True) -> pd.DataFrame:
    if external_only:
        t = t[t["client"] != INTERNAL_CLIENT]
    c = t.groupby("client").agg(horas=("hours", "sum"), chamados=("ticket_id", "size"))
    c = c.sort_values("horas", ascending=False).reset_index()
    c["rank"] = range(1, len(c) + 1)
    c["pct_clientes"] = c["rank"] / len(c) * 100
    c["pct_horas_acum"] = c["horas"].cumsum() / c["horas"].sum() * 100
    c["esforco_min"] = c["horas"] / c["chamados"] * 60
    return c
