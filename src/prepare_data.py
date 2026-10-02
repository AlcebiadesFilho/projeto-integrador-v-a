"""
Preparação da base Movidesk (Infomach) para o painel de BI.

Entrada : data/raw/tickets-ml-mask.csv  (1 linha = 1 apontamento de tempo)
Saída   : data/processed/tickets.parquet (1 linha = 1 chamado)

O foco do projeto é visualização/BI, então o tratamento é enxuto:
- datas e tempo de trabalho convertidos para tipos numéricos;
- nomes de equipe unificados (grafias duplicadas e renomeação "Cloud & Desenvolvimento" -> "Cloud");
- erros de digitação em categorias corrigidos;
- colunas com dado pessoal (subject, created_by_name, e-mails, justification) DESCARTADAS;
- agregação por chamado com esforço (horas), nº de apontamentos e tempo de ciclo.

Uso: python src/prepare_data.py [caminho_csv]
"""
import sys
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw" / "tickets-ml-mask.csv"
OUT = ROOT / "data" / "processed" / "tickets.parquet"

DATE_FMT = "%d/%m/%Y %H:%M"

TEAM_MAP = {
    "Segurança de Rede & Conectividade": "Rede & Conectividade",
    "Segurança Endpoint & Proteção de Dados": "Endpoint & Proteção de Dados",
    "Seguranca Endpoint e Protecao Dados": "Endpoint & Proteção de Dados",
    "Cloud & Desenvolvimento": "Cloud",
    "Cloud": "Cloud",
    "Backup": "Backup",
    "Infraestrutura": "Infraestrutura",
    "Monitoramento": "Monitoramento",
}  # demais equipes (< 2% do volume) -> "Outras"

CATEGORY_FIX = {
    "Relátorio": "Relatório",
    "Apredizagem": "Aprendizagem",
    "": "Não informada",
}

# Natureza da demanda: o que "chega" (reativo) x o que a equipe planeja (proativo)
REACTIVE = {"Incidente", "Alerta"}
PLANNED = {"Configuração", "Instalação", "Relatório", "Reunião", "Compliance",
           "Dimensionamento", "POC", "Melhoria", "Processos", "Aprendizagem",
           "Desenvolvimento"}

URGENCY_MAP = {
    "(1) Urgente": "Urgente",
    "(2) Alta": "Alta",
    "(3) Normal": "Normal",
    "(4) Baixa": "Baixa",
    "(5) Planejada": "Planejada",
    "": "Não informada",
}

# Colunas mantidas: nada de texto livre nem nome/e-mail de pessoas
KEEP = ["ticket_id", "urgency", "status", "owner_team", "category", "created_date",
        "service_first_level", "business_name", "periodStart", "periodEnd",
        "workTime", "workTypeName", "owner_name"]


def demand_type(cat: str) -> str:
    if cat in REACTIVE:
        return "Reativa"
    if cat in PLANNED:
        return "Planejada"
    return "Atendimento/Outros"


def load_appointments(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path, dtype=str, keep_default_na=False, usecols=KEEP)
    for c in ("created_date", "periodStart", "periodEnd"):
        df[c] = pd.to_datetime(df[c], format=DATE_FMT, errors="coerce")
    df["work_min"] = pd.to_timedelta(df["workTime"], errors="coerce").dt.total_seconds() / 60
    df["extra_min"] = df["work_min"].where(df["workTypeName"] == "Extra", 0)
    return df


def to_tickets(df: pd.DataFrame) -> pd.DataFrame:
    t = df.groupby("ticket_id", sort=False).agg(
        created=("created_date", "first"),
        urgency=("urgency", "first"),
        status=("status", "first"),
        team_raw=("owner_team", "first"),
        category=("category", "first"),
        service=("service_first_level", "first"),
        client=("business_name", "first"),
        agent=("owner_name", "first"),
        first_start=("periodStart", "min"),
        last_end=("periodEnd", "max"),
        hours=("work_min", "sum"),
        extra_hours=("extra_min", "sum"),
        n_appointments=("work_min", "size"),
    ).reset_index()

    t["hours"] /= 60
    t["extra_hours"] /= 60
    t["team"] = t["team_raw"].map(TEAM_MAP).fillna("Outras")
    t["category"] = t["category"].replace(CATEGORY_FIX)
    t["urgency"] = t["urgency"].map(URGENCY_MAP).fillna("Não informada")
    t["demand_type"] = t["category"].map(demand_type)
    t["service"] = t["service"].replace("", "Não informado")
    t["agent"] = t["agent"].replace("", "Não atribuído")
    t["client"] = t["client"].replace("", "Não informado")

    # Tempo de ciclo (proxy): abertura -> último apontamento. Apontamentos retroativos
    # geram valores negativos, que são truncados em zero.
    t["cycle_h"] = ((t["last_end"] - t["created"]).dt.total_seconds() / 3600).clip(lower=0)
    t["month"] = t["created"].dt.to_period("M").dt.to_timestamp()
    t["closed"] = t["status"].isin(["Fechado", "Resolvido", "Cancelado"])
    t["single_touch"] = t["n_appointments"] == 1

    cols = ["ticket_id", "created", "month", "team", "category", "demand_type", "urgency",
            "status", "closed", "service", "client", "agent", "hours", "extra_hours",
            "n_appointments", "single_touch", "cycle_h"]
    return t[cols]


def main(path: Path = RAW) -> pd.DataFrame:
    tickets = to_tickets(load_appointments(path))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    tickets.to_parquet(OUT, index=False)
    print(f"[ok] {len(tickets):,} chamados -> {OUT.relative_to(ROOT)}")
    return tickets


if __name__ == "__main__":
    main(Path(sys.argv[1]) if len(sys.argv) > 1 else RAW)
