"""Gera o Relatório Técnico (.docx) a partir de docs/relatorio.md, com capa e formatação acadêmica.

Uso: python scripts/build_report.py
"""
import re
import subprocess
import tempfile
from pathlib import Path

from PIL import Image
from docx import Document
from docx.shared import Pt, Mm, RGBColor
from docx.enum.text import WD_COLOR_INDEX
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

NAVY = RGBColor(0x0B, 0x25, 0x45)
BLUE = RGBColor(0x13, 0x55, 0x8C)
GREY = RGBColor(0x55, 0x5F, 0x6B)
H1C = RGBColor(0x36, 0x60, 0x91)   # estilo do molde PI-4A (Heading 1)
H2C = RGBColor(0x4F, 0x81, 0xBD)   # estilo do molde PI-4A (Heading 2)
TITLEC = RGBColor(0x17, 0x36, 0x5D)
ROOT = Path(__file__).resolve().parents[1]
FIGS = ROOT / "docs" / "figuras"
PUC_LOGO = ROOT / "docs" / "assets" / "puc_logo.png"
OUT = ROOT / "entregaveis" / "Relatorio_Tecnico_PI5A_Infomach.docx"

# ----------------------------- helpers de estilo --------------------------- #
def set_cell_bg(cell, hexcolor):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd"); shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto"); shd.set(qn("w:fill"), hexcolor)
    tcPr.append(shd)

def add_page_number_footer(section):
    footer = section.footer
    p = footer.paragraphs[0]; p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(); fldb = OxmlElement("w:fldChar"); fldb.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText"); instr.set(qn("xml:space"), "preserve"); instr.text = "PAGE"
    flde = OxmlElement("w:fldChar"); flde.set(qn("w:fldCharType"), "end")
    run._r.append(fldb); run._r.append(instr); run._r.append(flde)
    run.font.size = Pt(9); run.font.color.rgb = GREY

def add_toc(doc):
    p = doc.add_paragraph(); r = p.add_run()
    fb = OxmlElement("w:fldChar"); fb.set(qn("w:fldCharType"), "begin")
    it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve")
    it.text = r'TOC \o "1-3" \h \z \u'
    sep = OxmlElement("w:fldChar"); sep.set(qn("w:fldCharType"), "separate")
    t = OxmlElement("w:t"); t.text = "Abra no Word e atualize o campo (F9) para gerar o sumário."
    rr = OxmlElement("w:r"); rr.append(t)
    fe = OxmlElement("w:fldChar"); fe.set(qn("w:fldCharType"), "end")
    r._r.append(fb); r._r.append(it); r._r.append(sep); r._r.append(rr); r._r.append(fe)

def add_static_toc(doc, entries):
    """entries = [(titulo, pagina, nivel)] -> sumário com líderes pontilhados."""
    from docx.enum.text import WD_TAB_ALIGNMENT, WD_TAB_LEADER
    for title, page, lvl in entries:
        p = doc.add_paragraph()
        pf = p.paragraph_format; pf.line_spacing = 1.25; pf.space_after = Pt(3)
        if lvl == 2: pf.left_indent = Mm(6)
        pf.tab_stops.add_tab_stop(Mm(160), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)
        r = p.add_run(title); r.font.size = Pt(11); r.bold = (lvl == 1)
        r.font.color.rgb = NAVY if lvl == 1 else RGBColor(0x22,0x33,0x44)
        r2 = p.add_run("\t" + str(page)); r2.font.size = Pt(11); r2.bold = (lvl == 1)
        r2.font.color.rgb = r.font.color.rgb

def add_runs(par, text):
    """Interpreta **negrito**, *itálico* e `código` em runs."""
    for tok in re.split(r"(\[PREENCHER[^\]]*\]|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)", text):
        if not tok: continue
        if tok.startswith("[PREENCHER"):
            r = par.add_run(tok); r.bold = True; r.font.highlight_color = WD_COLOR_INDEX.YELLOW
        elif tok.startswith("**") and tok.endswith("**"):
            r = par.add_run(tok[2:-2]); r.bold = True
        elif tok.startswith("*") and tok.endswith("*"):
            r = par.add_run(tok[1:-1]); r.italic = True
        elif tok.startswith("`") and tok.endswith("`"):
            r = par.add_run(tok[1:-1]); r.font.name = "Consolas"; r.font.size = Pt(10)
        else:
            par.add_run(tok)

# ----------------------------- parser de markdown -------------------------- #
def render_markdown(doc, md, fig_counter, table_counter, embed_figs=True):
    lines = md.split("\n"); i = 0
    while i < len(lines):
        ln = lines[i].rstrip()
        if not ln.strip() or ln.strip() == "---":
            i += 1; continue
        # figura
        mfig = re.match(r"\[FIGURA ([^\s|:]+)(?:\|(\d+))?: (.+)\]", ln.strip())
        if mfig:
            fig_counter[0] += 1
            pic_p = doc.add_paragraph(); pic_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            pic_p.paragraph_format.keep_with_next = True
            img = FIGS / f"{mfig.group(1)}.png"
            fixed_w = int(mfig.group(2)) if mfig.group(2) else None
            with Image.open(img) as im:
                ratio = im.height / im.width
            # figuras altas (capítulos inteiros) são limitadas pela altura para caber na página
            # e figuras quase quadradas ficam mais estreitas para não dominar a página
            w = 158 if ratio < 0.45 else 125
            size = dict(height=Mm(190)) if ratio * w > 190 else dict(width=Mm(w))
            if fixed_w:
                size = dict(width=Mm(fixed_w))
            pic_p.add_run().add_picture(str(img), **size)
            cp = doc.add_paragraph(); cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
            cp.paragraph_format.keep_with_next = True
            rc = cp.add_run(f"Figura {fig_counter[0]} — {mfig.group(3)}")
            rc.italic = True; rc.font.size = Pt(9); rc.font.color.rgb = GREY
            src = doc.add_paragraph(); src.alignment = WD_ALIGN_PARAGRAPH.CENTER
            rs = src.add_run("Fonte: agenda do autor." if mfig.group(1).startswith("evidencia")
                             else "Fonte: elaborado pelo autor a partir da base Movidesk/Infomach.")
            rs.font.size = Pt(8); rs.font.color.rgb = GREY
            i += 1; continue
        # headings
        if ln.startswith("### "):
            doc.add_heading(ln[4:].strip(), level=2); i += 1; continue
        if ln.startswith("## "):
            doc.add_heading(ln[3:].strip(), level=1); i += 1; continue
        if ln.startswith("# "):
            i += 1; continue
        # tabela
        if ln.lstrip().startswith("|") and i+1 < len(lines) and re.match(r"^\s*\|[-:|\s]+\|\s*$", lines[i+1]):
            tbl_lines = []
            while i < len(lines) and lines[i].lstrip().startswith("|"):
                tbl_lines.append(lines[i]); i += 1
            rows = [[c.strip() for c in r.strip().strip("|").split("|")] for r in tbl_lines]
            header = rows[0]; data = rows[2:]
            table_counter[0] += 1
            t = doc.add_table(rows=1, cols=len(header)); t.style = "Table Grid"
            t.alignment = WD_TABLE_ALIGNMENT.CENTER
            for j, h in enumerate(header):
                c = t.rows[0].cells[j]; c.paragraphs[0].text = ""
                rr = c.paragraphs[0].add_run(h.replace("**","")); rr.bold = True
                rr.font.color.rgb = RGBColor(0xFF,0xFF,0xFF); rr.font.size = Pt(9)
                set_cell_bg(c, "13558C")
            for drow in data:
                cells = t.add_row().cells
                for j, val in enumerate(drow[:len(header)]):
                    cells[j].paragraphs[0].text = ""
                    add_runs(cells[j].paragraphs[0], val)
                    for rn in cells[j].paragraphs[0].runs: rn.font.size = Pt(8.5)
            # larguras proporcionais ao maior conteúdo de cada coluna (corpo = 160mm)
            # largura proporcional à raiz do texto total de cada coluna (corpo = 160 mm)
            clean = lambda x: len(re.sub(r"[*`]", "", x))
            weight = [max(clean(header[j]), sum(clean(r[j]) for r in data if j < len(r)) / max(len(data), 1)) ** 0.75
                      for j in range(len(header))]
            widths = [max(12.0, 160.0 * w / sum(weight)) for w in weight]
            widths = [w * 160.0 / sum(widths) for w in widths]
            t.autofit = False; t.allow_autofit = False
            # força layout fixo p/ o Word honrar as larguras (senão auto-ajusta e quebra)
            tblPr = t._tbl.tblPr
            lay = OxmlElement("w:tblLayout"); lay.set(qn("w:type"), "fixed"); tblPr.append(lay)
            tw = OxmlElement("w:tblW"); tw.set(qn("w:w"), str(int(160/25.4*1440))); tw.set(qn("w:type"), "dxa"); tblPr.append(tw)
            dxa = [int(w/25.4*1440) for w in widths]
            grid = t._tbl.find(qn("w:tblGrid"))   # layout fixo usa o tblGrid
            if grid is not None:
                for c, d in zip(grid.findall(qn("w:gridCol")), dxa):
                    c.set(qn("w:w"), str(d))
            for j, d in enumerate(dxa):
                for row in t.rows:
                    if j < len(row.cells): row.cells[j].width = Mm(widths[j])
            # repete o cabeçalho ao quebrar de página e impede linhas partidas
            thr = t.rows[0]._tr.get_or_add_trPr()
            th = OxmlElement("w:tblHeader"); th.set(qn("w:val"), "true"); thr.append(th)
            for row in t.rows:
                row._tr.get_or_add_trPr().append(OxmlElement("w:cantSplit"))
            continue
        # lista
        if ln.lstrip().startswith(("- ", "* ")):
            while i < len(lines) and lines[i].lstrip().startswith(("- ","* ")):
                p = doc.add_paragraph(style="List Bullet")
                add_runs(p, lines[i].lstrip()[2:].strip()); i += 1
            continue
        # parágrafo (pode quebrar em múltiplas linhas até linha em branco)
        buf = [ln]; i += 1
        while i < len(lines) and lines[i].strip() and not lines[i].lstrip().startswith(("#","-","*","|")) and "[FIGURA" not in lines[i].upper() and lines[i].strip()!="---":
            buf.append(lines[i].rstrip()); i += 1
        p = doc.add_paragraph(); p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        add_runs(p, " ".join(buf))

# ----------------------------- documento base ------------------------------ #
def base_doc():
    doc = Document()
    st = doc.styles["Normal"]; st.font.name = "Cambria"; st.font.size = Pt(11)
    st.paragraph_format.line_spacing = 1.13
    st.paragraph_format.space_after = Pt(4)
    for lvl, sz, col in [("Heading 1", 14, H1C), ("Heading 2", 13, H2C)]:
        s = doc.styles[lvl]; s.font.name = "Calibri"; s.font.size = Pt(sz)
        s.font.bold = True; s.font.color.rgb = col
    sec = doc.sections[0]
    sec.page_width = Mm(210); sec.page_height = Mm(297)
    sec.left_margin = Mm(30); sec.top_margin = Mm(30)
    sec.right_margin = Mm(20); sec.bottom_margin = Mm(20)
    return doc

def cover(doc, project_title, aluno="Alcebiades Alves Barbosa Filho", data="02/10/2026"):
    """Capa no estilo do molde da disciplina (PI-4A): instituição + brasão + identificação."""
    from docx.enum.text import WD_BREAK
    def center(text, size, bold=True, color=RGBColor(0,0,0), font="Calibri", after=2):
        p = doc.add_paragraph(); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(after); p.paragraph_format.line_spacing = 1.1
        r = p.add_run(text); r.bold = bold; r.font.size = Pt(size); r.font.name = font
        r.font.color.rgb = color; return p
    center("PONTIFÍCIA UNIVERSIDADE CATÓLICA DE GOIÁS", 12)
    center("COORDENAÇÃO ENSINO A DISTÂNCIA – CEAD", 12)
    center("ESCOLA POLITÉCNICA E DE ARTES", 12)
    center("BIG DATA E INTELIGÊNCIA ARTIFICIAL", 12)
    doc.add_paragraph()
    center("PROJETO INTEGRADOR V – A", 17, True, TITLEC)
    lp = doc.add_paragraph(); lp.alignment = WD_ALIGN_PARAGRAPH.CENTER
    lp.paragraph_format.space_before = Pt(12); lp.paragraph_format.space_after = Pt(12)
    try: lp.add_run().add_picture(str(PUC_LOGO), height=Mm(30))
    except Exception: pass
    for _ in range(2): doc.add_paragraph()
    def label(lbl, val, valbold=False, valsize=12, valcolor=RGBColor(0,0,0)):
        p = doc.add_paragraph(); p.paragraph_format.space_after = Pt(3)
        r = p.add_run(lbl); r.bold = True; r.font.size = Pt(12); r.font.name = "Calibri"
        if val:
            rv = p.add_run(" " + val); rv.bold = valbold; rv.font.size = Pt(valsize)
            rv.font.name = "Calibri"; rv.font.color.rgb = valcolor
        return p
    # Nome do Projeto em duas linhas (rótulo + título), como no molde
    pl = doc.add_paragraph(); pl.paragraph_format.space_after = Pt(2)
    r = pl.add_run("Nome do Projeto:"); r.bold = True; r.font.size = Pt(12); r.font.name = "Calibri"
    pv = doc.add_paragraph(); pv.paragraph_format.space_after = Pt(12)
    rv = pv.add_run(project_title); rv.bold = True; rv.font.size = Pt(13)
    rv.font.name = "Calibri"; rv.font.color.rgb = TITLEC
    label("Data:", data)
    label("Aluno:", aluno)
    doc.paragraphs[-1].add_run().add_break(WD_BREAK.PAGE)


def headings(md):
    """Títulos de seção (## e ###) na ordem do documento."""
    out = []
    for ln in md.split("\n"):
        if ln.startswith("### "):
            out.append((ln[4:].strip(), 2))
        elif ln.startswith("## "):
            out.append((ln[3:].strip(), 1))
    return out


def page_of_headings(docx_path, entries, first_page=3):
    """Converte para PDF (LibreOffice) e descobre a página de cada título."""
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run(["soffice", "--headless", "--convert-to", "pdf", "--outdir", tmp, str(docx_path)],
                       check=True, capture_output=True)
        pdf = Path(tmp) / (docx_path.stem + ".pdf")
        text = subprocess.run(["pdftotext", "-layout", str(pdf), "-"], check=True, capture_output=True,
                              text=True).stdout
    norm = lambda x: re.sub(r"\s+", " ", x).strip().lower()
    pages = [norm(pg) for pg in text.split("\f")]
    result, cur = [], first_page - 1
    for title, lvl in entries:
        t = norm(title)
        k = next((i for i in range(cur, len(pages)) if t in pages[i]), None)
        if k is None:  # título quebrado em duas linhas: procura pelo começo
            k = next((i for i in range(cur, len(pages)) if t[:40] in pages[i]), cur)
        cur = k
        result.append((title, k + 1, lvl))
    return result


def build(md, toc_entries):
    doc = base_doc()
    add_page_number_footer(doc.sections[0])
    cover(doc, "Painel de Inteligência Operacional do Service Desk da Infomach: "
               "indicadores e Data Storytelling sobre a base do Movidesk")
    from docx.enum.text import WD_BREAK
    h = doc.add_paragraph(); h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    h.paragraph_format.space_after = Pt(12)
    r = h.add_run("SUMÁRIO"); r.bold = True; r.font.size = Pt(14)
    add_static_toc(doc, toc_entries)
    doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)
    render_markdown(doc, md, [0], [0])
    OUT.parent.mkdir(exist_ok=True)
    doc.save(OUT)


def main():
    md = (ROOT / "docs" / "relatorio.md").read_text(encoding="utf-8")
    entries = headings(md)
    # 1ª passada com páginas provisórias; 2ª com as páginas reais lidas do PDF
    build(md, [(t, 0, lvl) for t, lvl in entries])
    build(md, page_of_headings(OUT, entries))
    print("[ok]", OUT.relative_to(ROOT))


if __name__ == "__main__":
    main()
