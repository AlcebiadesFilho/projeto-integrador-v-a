"""
Captura as figuras do painel web (claro e escuro) para o relatório e os slides.

Pré-requisito: painel rodando em http://localhost:5173 (cd web && npm run dev)
Uso: python scripts/capture_figures.py [url]
"""
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "figuras"
URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5173/"

# nome do arquivo -> ordem da <figure> na página
FIGS = ["indice_demanda_horas", "horas_por_tecnico", "horas_por_equipe", "mix_demanda",
        "reativo_por_equipe", "ciclo_reativo_por_equipe", "ciclo_backup_trimestral",
        "ciclo_por_prioridade", "pareto_clientes", "atividade_interna"]
SECTIONS = ["visao", "reativo", "prioridade", "esforco", "acoes"]


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome")
        for theme in ("light", "dark"):
            sfx = "" if theme == "light" else "_dark"
            pg = browser.new_page(viewport={"width": 1440, "height": 900}, color_scheme=theme,
                                  device_scale_factor=2)
            pg.goto(URL)
            pg.wait_for_selector("#visao")
            pg.add_style_tag(content="figure button{visibility:hidden}")
            # viewport do tamanho da página: evita reiniciar as animações na captura
            height = pg.evaluate("document.body.scrollHeight")
            pg.set_viewport_size({"width": 1440, "height": height})
            for y in range(0, height, 600):
                pg.evaluate(f"window.scrollTo(0,{y})")
                pg.wait_for_timeout(80)
            pg.wait_for_timeout(2500)
            pg.locator("header").first.screenshot(path=OUT / f"painel_hero{sfx}.png")
            for s in SECTIONS:
                pg.locator(f"#{s}").screenshot(path=OUT / f"secao_{s}{sfx}.png")
            figs = pg.locator("figure")
            for i, name in enumerate(FIGS):
                figs.nth(i).screenshot(path=OUT / f"{name}{sfx}.png")
            pg.close()
            print(f"[ok] figuras ({theme})")
        browser.close()


if __name__ == "__main__":
    main()
