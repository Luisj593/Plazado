"""Generate the downloadable PDF from the same text used by registration."""
import json
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether, Flowable

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'src/legal/documents.json').read_text())
output = ROOT / 'public' / data['pdfUrl'].lstrip('/')
output.parent.mkdir(parents=True, exist_ok=True)
red = colors.HexColor('#d7193f')
logo = ImageReader(str(ROOT / 'public/legal/plazado-logo.png'))

# Frame the supplied logo without changing the original image bytes.
def draw_logo(canvas, x, y, width, height):
 canvas.saveState()
 clip = canvas.beginPath(); clip.rect(x, y, width, height)
 canvas.clipPath(clip, stroke=0, fill=0)
 scale = width / 1130
 canvas.drawImage(logo, x - 60 * scale, y - (1254 - 815) * scale,
                  width=1254 * scale, height=1254 * scale, mask='auto')
 canvas.restoreState()

class Logo(Flowable):
 def __init__(self, width=240):
  Flowable.__init__(self); self.width=width; self.height=370 * width / 1130
 def draw(self):
  draw_logo(self.canv, 0, 0, self.width, self.height)

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='Brand', fontName='Helvetica-Bold', fontSize=30, leading=35, textColor=red, spaceAfter=24))
styles.add(ParagraphStyle(name='TitleLegal', fontName='Helvetica-Bold', fontSize=20, leading=25, spaceBefore=16, spaceAfter=14, keepWithNext=True, textColor=colors.HexColor('#212121')))
styles.add(ParagraphStyle(name='SectionLegal', fontName='Helvetica-Bold', fontSize=11.5, leading=16, spaceBefore=9, spaceAfter=5, textColor=red, keepWithNext=True))
styles.add(ParagraphStyle(name='BodyLegal', fontName='Helvetica', fontSize=9.5, leading=13.5, spaceAfter=7))
styles.add(ParagraphStyle(name='MetaLegal', fontName='Helvetica', fontSize=9, leading=13, textColor=colors.HexColor('#616161'), spaceAfter=10))

story = [Logo(), Spacer(1, 10), Paragraph('Políticas y términos<br/>de uso del marketplace', styles['TitleLegal']), Paragraph('Clientes y tiendas · República Dominicana', styles['Heading2']), Spacer(1,18), Paragraph(f"Versión {data['version']}<br/>Fecha de publicación: {data['effectiveDate']}<br/>Contacto: {data['contactEmail']}", styles['MetaLegal']), Spacer(1,20)]
for i, doc in enumerate(data['documents'],1):
 story.append(Paragraph(f'{i:02d} · {escape(doc["title"])}', styles['SectionLegal']))
 story.append(Paragraph(escape(doc['description']), styles['BodyLegal']))
story.extend([Spacer(1,20),Paragraph('Aplicación al registro',styles['SectionLegal']),Paragraph('Los clientes aceptan sus términos y las políticas comunes. Las tiendas aceptan los términos para vendedores y las mismas políticas comunes. El PDF reúne ambos tipos de cuenta para consulta y descarga; la ventana de registro muestra el conjunto que corresponde al solicitante.',styles['BodyLegal'])])
story.append(PageBreak())
for doc in data['documents']:
 story.extend([Paragraph(escape(doc['title']),styles['TitleLegal']),Paragraph(f"Plazado.com · Versión {data['version']}",styles['MetaLegal'])])
 for section in doc['sections']:
  story.append(Paragraph(escape(section['title']),styles['SectionLegal']))
  for paragraph in section['paragraphs']: story.append(Paragraph(escape(paragraph),styles['BodyLegal']))

story.append(Spacer(1,15))
story.append(Paragraph('Referencias normativas oficiales',styles['SectionLegal']))
for source in data['sources']:
 story.append(Paragraph(escape(source['title']),styles['BodyLegal']))
 story.append(Paragraph(f'<link href="{escape(source["url"])}" color="#d7193f">{escape(source["url"])}</link>',styles['MetaLegal']))


def footer(canvas, doc):
 canvas.saveState()
 canvas.setStrokeColor(red);canvas.setLineWidth(1);canvas.line(48,40,A4[0]-48,40)
 canvas.setFont('Helvetica',8);canvas.setFillColor(colors.HexColor('#616161'))
 canvas.drawString(48,27,f'Plazado.com | {data["version"]} | contacto@plazado.com')
 canvas.drawRightString(A4[0]-48,27,str(doc.page));canvas.restoreState()

def branded_page(canvas, doc):
 draw_logo(canvas, 48, A4[1] - 70, 125, 370 * 125 / 1130)
 canvas.saveState(); canvas.setStrokeColor(colors.HexColor('#eeeeee'))
 canvas.line(48, A4[1] - 80, A4[0] - 48, A4[1] - 80); canvas.restoreState()
 footer(canvas, doc)

SimpleDocTemplate(str(output),pagesize=A4,rightMargin=48,leftMargin=48,topMargin=95,bottomMargin=58,title='Plazado.com - Políticas y términos',author='Plazado.com').build(story,onFirstPage=footer,onLaterPages=branded_page)
print(output)
