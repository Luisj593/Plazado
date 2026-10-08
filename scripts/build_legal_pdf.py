"""Generate the downloadable PDF from the same text used by registration."""
import json
from pathlib import Path
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / 'src/legal/documents.json').read_text())
output = ROOT / 'public' / data['pdfUrl'].lstrip('/')
output.parent.mkdir(parents=True, exist_ok=True)
red = colors.HexColor('#d7193f')
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='Brand', fontName='Helvetica-Bold', fontSize=30, leading=35, textColor=red, spaceAfter=24))
styles.add(ParagraphStyle(name='TitleLegal', fontName='Helvetica-Bold', fontSize=20, leading=25, spaceBefore=16, spaceAfter=14, keepWithNext=True, textColor=colors.HexColor('#212121')))
styles.add(ParagraphStyle(name='SectionLegal', fontName='Helvetica-Bold', fontSize=11.5, leading=16, spaceBefore=9, spaceAfter=5, textColor=red, keepWithNext=True))
styles.add(ParagraphStyle(name='BodyLegal', fontName='Helvetica', fontSize=9.5, leading=13.5, spaceAfter=7))
styles.add(ParagraphStyle(name='MetaLegal', fontName='Helvetica', fontSize=9, leading=13, textColor=colors.HexColor('#616161'), spaceAfter=10))

story = [Paragraph('Plazado.com', styles['Brand']), Paragraph('Políticas y términos<br/>de uso del marketplace', styles['TitleLegal']), Paragraph('Clientes y tiendas · República Dominicana', styles['Heading2']), Spacer(1,18), Paragraph(f"Versión {data['version']}<br/>Fecha de publicación: {data['effectiveDate']}<br/>Contacto: {data['contactEmail']}", styles['MetaLegal']), Spacer(1,20)]
for i, doc in enumerate(data['documents'],1):
 story.append(Paragraph(f'{i:02d} · {escape(doc["title"])}', styles['SectionLegal']))
 story.append(Paragraph(escape(doc['description']), styles['BodyLegal']))
story.extend([Spacer(1,20),Paragraph('Aplicación al registro',styles['SectionLegal']),Paragraph('Los clientes aceptan sus términos y las políticas comunes. Las tiendas aceptan los términos para vendedores y las mismas políticas comunes. El PDF reúne ambos tipos de cuenta para consulta y descarga; la ventana de registro muestra el conjunto que corresponde al solicitante.',styles['BodyLegal'])])
story.append(Spacer(1,15))
story.append(Paragraph('Referencias normativas oficiales',styles['SectionLegal']))
for source in data['sources']:
 story.append(Paragraph(escape(source['title']),styles['BodyLegal']))
 story.append(Paragraph(f'<link href="{escape(source["url"])}" color="#d7193f">{escape(source["url"])}</link>',styles['MetaLegal']))

story.append(PageBreak())
for doc in data['documents']:
 story.extend([Paragraph(escape(doc['title']),styles['TitleLegal']),Paragraph(f"Plazado.com · Versión {data['version']}",styles['MetaLegal'])])
 for section in doc['sections']:
  story.append(Paragraph(escape(section['title']),styles['SectionLegal']))
  for paragraph in section['paragraphs']: story.append(Paragraph(escape(paragraph),styles['BodyLegal']))

def footer(canvas, doc):
 canvas.saveState()
 canvas.setStrokeColor(red);canvas.setLineWidth(1);canvas.line(48,40,A4[0]-48,40)
 canvas.setFont('Helvetica',8);canvas.setFillColor(colors.HexColor('#616161'))
 canvas.drawString(48,27,f'Plazado.com | {data["version"]} | contacto@plazado.com')
 canvas.drawRightString(A4[0]-48,27,str(doc.page));canvas.restoreState()

SimpleDocTemplate(str(output),pagesize=A4,rightMargin=48,leftMargin=48,topMargin=48,bottomMargin=58,title='Plazado.com - Políticas y términos',author='Plazado.com').build(story,onFirstPage=footer,onLaterPages=footer)
print(output)
