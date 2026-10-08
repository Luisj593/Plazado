import React from 'react';
import bundle from '../../legal/documents.json';
import { legalDocumentPdfUrl } from '../../legal/registration';
import { useApp } from '../../context/AppContext';
import { X, ShieldCheck, FileText, CheckCircle2, Download, FileCheck } from 'lucide-react';
import { triggerFileDownload, downloadOfficialPdfFallback } from '../../utils/fileDownloader';

export const PolicyModal: React.FC = () => {
  const { openPolicySlug, setOpenPolicySlug, systemSettings, showNotification } = useApp();

  if (!openPolicySlug) return null;

  const legalDocs = systemSettings.legalDocuments || [];
  const matchedDoc = legalDocs.find(d => d.category === openPolicySlug || d.id === openPolicySlug);

  let title = matchedDoc?.title || 'Términos y Condiciones';
  let content = '';

  if (openPolicySlug === 'customer_terms') {
    title = 'Términos y Condiciones para Clientes Compradores';
    content = `
### 1. Objeto y Alcance
PlazaDO.com es una plataforma tecnológica multi-vendedor operada por ${systemSettings.legalBusinessName} (RNC: ${systemSettings.rnc}) en la República Dominicana. PlazaDO actúa como intermediario tecnológico que facilita el encuentro comercial entre compradores y vendedores independientes o comercios formalmente registrados.

### 2. Responsabilidad sobre Productos y Envíos
Conforme a la Ley No. 358-05 de Protección de los Derechos del Consumidor o Usuario en la República Dominicana:
- Cada tienda asociada a PlazaDO.com es la única responsable directa de la calidad, especificaciones, inventario, garantía legal y despacho de los productos que comercializa.
- **PlazaDO.com NO es el transportista directo**. Cada tienda fija su propia tarifa de despacho, cobertura geográfica y plazos de entrega estimados, los cuales se desglosan transparentemente antes de completar la orden de compra.

### 3. Código Secreto de Confirmación de Entrega
Para proteger la seguridad de tu compra:
- Al completarse el pedido se genera un **Código Secreto de Entrega de 6 dígitos**.
- Este código debe ser entregado al repartidor o vendedor ÚNICAMENTE cuando hayas recibido y verificado satisfactoriamente tus artículos.
- La validación del código confirma ante la plataforma que la entrega fue completada.

### 4. Pagos y Reclamaciones
Los pagos con tarjeta de crédito/débito son procesados a través de pasarelas bancarias autorizadas (AZUL de Servicios Digitales Popular). Ante cualquier discrepancia, puedes abrir una disputa dentro de los primeros 3 días hábiles posteriores a la fecha estimada de entrega.
    `;
  } else if (openPolicySlug === 'store_terms') {
    title = 'Términos y Condiciones para Tiendas y Vendedores Asociados';
    content = `
### 1. Registro y Aprobación
Toda tienda o vendedor independiente debe someter su solicitud con información fidedigna de su negocio (RNC o Cédula, cuenta bancaria en entidad de intermediación financiera dominicana, dirección física y datos de contacto). La activación en la plataforma requiere aprobación previa por parte de la Administración de PlazaDO.com.

### 2. Aislamiento de Información
Cada tienda opera con un identificador único (\`store_id\`). Ningún vendedor podrá visualizar, manipular ni acceder a información de pedidos, clientes o estados financieros pertenecientes a otras tiendas de la plataforma.

### 3. Comisión por Venta
- El modelo comercial vigente contempla una comisión del **${(systemSettings.defaultCommissionRate * 100).toFixed(0)}%** sobre el valor bruto de los productos vendidos.
- Las tarifas de envío cobradas por la tienda no están sujetas a comisión.
- No se cobra mensualidad obligatoria de suscripción durante la fase inicial.

### 4. Liquidaciones y Desembolsos
Los fondos correspondientes a cada pedido completado pasan a **Balance Disponible** una vez que el cliente confirma la entrega mediante el código de validación. La tienda puede solicitar transferencias bancarias a su cuenta registrada (Banco Popular, Banreservas, BHD u otros bancos nacionales) con un monto mínimo de RD$ 500.
    `;
  } else if (openPolicySlug === 'privacy') {
    title = 'Política de Privacidad y Protección de Datos Personales';
    content = `
Conforme a la Ley No. 172-13 sobre Protección Integral de los Datos Personales de la República Dominicana:
- **Datos Recopilados**: Recabamos nombre, correo, teléfono, direcciones de envío y registros transaccionales para procesar órdenes de compra.
- **Seguridad en Pagos**: PlazaDO.com NO almacena números completos de tarjetas de crédito ni códigos de seguridad CVV. Todas las transacciones electrónicas se canalizan cifradas mediante la pasarela bancaria AZUL.
- **No Comercialización**: Tus datos nunca serán vendidos a terceros. Solo se comparten con la tienda vendedora los datos indispensables para ejecutar el despacho (nombre, dirección y teléfono de entrega).
    `;
  } else if (openPolicySlug === 'returns_refunds') {
    title = 'Política de Devoluciones, Reembolsos y Disputas';
    content = `
### Casos Elegibles para Reclamación:
1. **Producto no recibido** habiendo transcurrido el tiempo límite estipulado por la tienda.
2. **Producto recibido en condiciones dañadas** o con defectos de fábrica evidentes.
3. **Divergencia sustancial** respecto a la descripción, fotos o especificaciones publicadas.
4. **Envío de artículo incorrecto** (talla, modelo o producto diferente).

### Procedimiento:
El cliente puede ingresar a **Mis Pedidos → Abrir Reclamación**, adjuntando fotografías de evidencia. El comercio dispondrá de 48 horas para subsanar el envío o emitir una reposición. En caso de falta de acuerdo, el Super Administrador de PlazaDO intervendrá para dictaminar el reembolso correspondiente mediante la pasarela original o transferencia bancaria.
    `;
  } else if (openPolicySlug === 'payments') {
    title = 'Políticas de Pagos y Pasarela AZUL';
    content = `
### Métodos Admitidos:
- **Tarjetas de Crédito y Débito Visa y Mastercard** procesadas mediante Servicios Digitales Popular (AZUL) bajo cifrado TLS 1.3 y estándares PCI-DSS.
- **Transferencia Bancaria directa** a las cuentas corporativas de PlazaDO.com en Banco Popular Dominicano o Banreservas.
- **Pago Contra Entrega (Efectivo)** en comercios y zonas que tengan habilitada dicha cobertura.

Todas las transacciones se realizan en pesos dominicanos (DOP / RD$). Se aplican comprobantes fiscales cuando sean solicitados.
    `;
  } else if (matchedDoc) {
    title = matchedDoc.title;
    content = matchedDoc.description;
  } else {
    title = 'Comisión Comercial PlazaDO';
    content = `
PlazaDO.com opera con una comisión comercial fija del **5%** sobre las ventas generadas por cada tienda. Dicho monto cubre el mantenimiento tecnológico de la plataforma, el soporte a compradores, la seguridad transaccional y la exposición en el catálogo unificado de comercios dominicanos.
    `;
  }

  const canonicalDoc = bundle.documents.find(doc => doc.id === openPolicySlug);
  if (canonicalDoc) {
    title = canonicalDoc.title;
    content = canonicalDoc.sections.map(section => `${section.title}\n\n${section.paragraphs.join('\n\n')}`).join('\n\n');
  }

  const handleDownloadPdf = () => {
    if (canonicalDoc) {
      const url = legalDocumentPdfUrl(canonicalDoc.id);
      triggerFileDownload(url, url.split('/').pop() || 'Plazado.pdf');
    } else if (matchedDoc?.pdfUrl) {
      triggerFileDownload(matchedDoc.pdfUrl, matchedDoc.pdfFileName || `${matchedDoc.title}.pdf`);
      showNotification(`Descargando ${matchedDoc.pdfFileName || matchedDoc.title}...`);
    } else {
      downloadOfficialPdfFallback({
        title,
        version: matchedDoc?.version || systemSettings.policies.customerTermsVersion || 'v2.1-2026-RD',
        lastUpdated: matchedDoc?.lastUpdated || new Date().toISOString().split('T')[0],
        categoryLabel: matchedDoc?.categoryLabel || 'Documento Oficial',
        description: matchedDoc?.description || title,
        summaryPoints: matchedDoc?.summaryPoints,
        legalBusinessName: systemSettings.legalBusinessName,
        rnc: systemSettings.rnc,
        contactEmail: systemSettings.contactEmail,
        whatsappCommercial: systemSettings.whatsappCommercial,
        fullContent: content
      });
      showNotification(`Generando vista oficial en PDF para ${title}...`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <img src="/legal/plazado-logo.png" alt="Plazado" className="h-10 w-32 object-cover object-center shrink-0" />
            <ShieldCheck className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-stone-900 text-sm md:text-base">{title}</h3>
          </div>
          <button 
            onClick={() => setOpenPolicySlug(null)}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs md:text-sm text-stone-700 leading-relaxed">
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 shrink-0 text-red-600" />
              <span>Marco legal aplicable: República Dominicana • Vigencia {canonicalDoc ? bundle.version : matchedDoc?.version || systemSettings.policies.customerTermsVersion}</span>
            </div>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>
          </div>

          <div className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-stone-900 prose-p:text-stone-600 whitespace-pre-line">
            {content}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="px-3 py-2 text-stone-700 hover:text-red-600 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-red-600" />
            <span>Descargar Documento Oficial (PDF)</span>
          </button>

          <button
            onClick={() => setOpenPolicySlug(null)}
            className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
