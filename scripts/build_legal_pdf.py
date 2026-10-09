"""Generate the downloadable PDF from the same text used by registration."""
import json
import io
from PIL import Image
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether, Flowable

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'src/legal/documents.json').read_text())
red = colors.HexColor('#d7193f')
logo_image = Image.open(ROOT / 'public/legal/plazado-logo.png').convert('RGB')
logo_image.thumbnail((700, 700))
logo_stream = io.BytesIO()
logo_image.save(logo_stream, format='JPEG', quality=94, optimize=True)
logo_stream.seek(0)
logo = ImageReader(logo_stream)

# Preserve the supplied logo framing and optimize its embedded resolution.
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

def build_pdf(filename, title, documents):
 output = ROOT / 'public/legal' / filename
 story = [Logo(), Spacer(1, 10), Paragraph(escape(title), styles['TitleLegal']),
          Paragraph(f"Versión {data['version']} · {data['effectiveDate']}<br/>Contacto: {data['contactEmail']}", styles['MetaLegal'])]
 for doc in documents:
  if len(documents) > 1:
   story.append(Paragraph(escape(doc['title']), styles['TitleLegal']))
  for section in doc['sections']:
   story.append(Paragraph(escape(section['title']), styles['SectionLegal']))
   for paragraph in section['paragraphs']:
    story.append(Paragraph(escape(paragraph), styles['BodyLegal']))
 story.append(Paragraph('Referencias normativas oficiales', styles['SectionLegal']))
 for source in data['sources']:
  story.append(Paragraph(f'<link href="{escape(source["url"])}" color="#d7193f">{escape(source["title"])}</link>', styles['MetaLegal']))
 SimpleDocTemplate(str(output), pagesize=A4, rightMargin=48, leftMargin=48, topMargin=95,
                   bottomMargin=58, title=title, author='Plazado.com').build(story, onFirstPage=footer, onLaterPages=branded_page)
 print(output)

for audience, category in [('usuarios', 'customer_terms'), ('tiendas', 'store_terms')]:
 selected = [doc for doc in data['documents'] if doc['id'] == category]
 build_pdf(f'plazado-terminos-{audience}.pdf', selected[0]['title'], selected)
build_pdf('plazado-politicas-plataforma.pdf', 'Políticas de la plataforma Plazado.com',
          [doc for doc in data['documents'] if doc['id'] not in ['customer_terms', 'store_terms']])

build_pdf('plazado-politicas-terminos-2026-10-08.pdf', 'Políticas y términos de Plazado.com', data['documents'])
