/**
 * Utility for downloading files (PDFs, APKs, etc.) directly in the browser
 */

export const triggerFileDownload = (urlOrDataUrl: string, fileName: string): boolean => {
  try {
    const link = document.createElement('a');
    link.href = urlOrDataUrl;
    link.download = fileName;
    link.setAttribute('download', fileName);
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (error) {
    console.error('[PlazaDO] Error downloading file:', error);
    return false;
  }
};

/**
 * Creates and triggers download of a standardized official legal PDF document
 * when a custom uploaded PDF binary is not present.
 */
export const downloadOfficialPdfFallback = (doc: {
  title: string;
  version: string;
  lastUpdated: string;
  categoryLabel: string;
  description: string;
  summaryPoints?: string[];
  legalBusinessName?: string;
  rnc?: string;
  contactEmail?: string;
  whatsappCommercial?: string;
  fullContent?: string;
}): void => {
  const fileName = `${doc.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_${doc.version}.html`;
  
  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${doc.title} - PlazaDO.com</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 40px auto;
      max-width: 800px;
      padding: 24px;
      color: #1c1917;
      line-height: 1.6;
    }
    .header {
      border-bottom: 3px solid #dc2626;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand {
      font-size: 28px;
      font-weight: 900;
      color: #dc2626;
      margin: 0;
    }
    .brand span { color: #1c1917; }
    .badge {
      display: inline-block;
      background: #fee2e2;
      color: #991b1b;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta {
      font-size: 12px;
      color: #78716c;
      margin-top: 4px;
    }
    h1 {
      font-size: 22px;
      font-weight: 800;
      margin: 16px 0 8px 0;
      color: #0c0a09;
    }
    .box {
      background: #fafaf9;
      border: 1px solid #e7e5e4;
      border-radius: 12px;
      padding: 16px;
      margin: 20px 0;
      font-size: 13px;
    }
    .points {
      list-style-type: none;
      padding: 0;
      margin: 16px 0;
    }
    .points li {
      padding: 8px 0;
      border-bottom: 1px solid #f5f5f4;
      display: flex;
      gap: 8px;
    }
    .bullet { color: #dc2626; font-weight: bold; }
    .content {
      font-size: 14px;
      white-space: pre-line;
      margin-top: 20px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e7e5e4;
      font-size: 11px;
      color: #a8a29e;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { margin: 0; padding: 12px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h2 class="brand">Plaza<span>DO</span>.com</h2>
      <div class="meta">República Dominicana • Documento Legal Oficial</div>
    </div>
    <div style="text-align: right;">
      <span class="badge">${doc.categoryLabel}</span>
      <div class="meta">Versión: ${doc.version}</div>
      <div class="meta">Actualizado: ${doc.lastUpdated}</div>
    </div>
  </div>

  <h1>${doc.title}</h1>
  <p style="color: #44403c; font-size: 14px;">${doc.description}</p>

  ${doc.summaryPoints && doc.summaryPoints.length > 0 ? `
  <div class="box">
    <strong>Puntos Fundamentales y Compromisos Regulatorios:</strong>
    <ul class="points">
      ${doc.summaryPoints.map(p => `<li><span class="bullet">✔</span> <span>${p}</span></li>`).join('')}
    </ul>
  </div>
  ` : ''}

  ${doc.fullContent ? `
  <div class="content">
    ${doc.fullContent}
  </div>
  ` : ''}

  <div class="footer">
    <div>
      ${doc.legalBusinessName || 'PlazaDO Soluciones Tecnológicas SRL'} • RNC: ${doc.rnc || '132-94812-3'}<br>
      Contacto: ${doc.contactEmail || 'contacto@plazado.com'} • WhatsApp: ${doc.whatsappCommercial || '809-449-3325'}
    </div>
    <div style="text-align: right;">
      Generado oficialmente en PlazaDO.com<br>
      Tus compras, más cerca.
    </div>
  </div>

  <div class="no-print" style="margin-top: 30px; text-align: center;">
    <button onclick="window.print()" style="background: #dc2626; color: white; border: none; padding: 10px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">
      🖨️ Imprimir / Guardar como PDF
    </button>
  </div>
</body>
</html>`;

  // Create printable blob and open / trigger save
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  
  // Open in new tab with print trigger
  const printWindow = window.open(blobUrl, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.focus();
    };
  } else {
    // Fallback direct download
    triggerFileDownload(blobUrl, fileName);
  }
};
