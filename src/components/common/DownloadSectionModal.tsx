import { resolveAndroidApp } from '../../utils/androidApp';
import React, { useState } from 'react';
import { SocialLinks } from './SocialLinks';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Smartphone, 
  Download, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  Package,
  Layers,
  Sparkles,
  ArrowDownToLine,
  Info
} from 'lucide-react';
import { triggerFileDownload, downloadOfficialPdfFallback } from '../../utils/fileDownloader';
import { LegalDocument } from '../../types';

interface DownloadSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'app' | 'pdf';
}

export const DownloadSectionModal: React.FC<DownloadSectionModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'app'
}) => {
  const { systemSettings, showNotification } = useApp();
  const [activeTab, setActiveTab] = useState<'app' | 'pdf'>(defaultTab);

  if (!isOpen) return null;

  const androidConfig = resolveAndroidApp(systemSettings.androidApp);

  const legalDocs: LegalDocument[] = systemSettings.legalDocuments && systemSettings.legalDocuments.length > 0 
    ? systemSettings.legalDocuments 
    : [
        {
          id: 'doc-customer-terms',
          title: 'Términos y Condiciones para Clientes Compradores',
          category: 'customer_terms',
          categoryLabel: 'Consumidores',
          version: systemSettings.policies.customerTermsVersion || 'v2.1-2026-RD',
          lastUpdated: new Date().toISOString().split('T')[0],
          description: 'Reglamento de uso para compradores, garantías de productos, despacho por tiendas y código secreto de entrega de 6 dígitos bajo la Ley 358-05.',
          isPublished: true,
          pdfFileName: 'PlazaDO_Terminos_Clientes_RD.pdf',
          pdfFileSize: '240 KB'
        },
        {
          id: 'doc-store-terms',
          title: 'Términos y Condiciones para Tiendas y Comercios Asociados',
          category: 'store_terms',
          categoryLabel: 'Vendedores',
          version: systemSettings.policies.storeTermsVersion || 'v2.1-2026-RD',
          lastUpdated: new Date().toISOString().split('T')[0],
          description: 'Regulaciones de operaciones comerciales, comisiones según la configuración vigente, aislamiento de cuentas, liquidaciones a bancos dominicanos y deberes de garantía.',
          isPublished: true,
          pdfFileName: 'PlazaDO_Terminos_Comercios_RD.pdf',
          pdfFileSize: '290 KB'
        },
        {
          id: 'doc-privacy',
          title: 'Política de Privacidad y Protección de Datos Personales',
          category: 'privacy',
          categoryLabel: 'Privacidad',
          version: systemSettings.policies.privacyPolicyVersion || 'v2.1-2026-RD',
          lastUpdated: new Date().toISOString().split('T')[0],
          description: 'Tratamiento confidencial de datos bajo la Ley No. 172-13. Pasarela de pagos AZUL cifrada y no almacenamiento de datos de tarjetas.',
          isPublished: true,
          pdfFileName: 'PlazaDO_Politica_Privacidad_RD.pdf',
          pdfFileSize: '210 KB'
        },
        {
          id: 'doc-returns',
          title: 'Procedimiento de Reclamaciones, Devoluciones y Reembolsos',
          category: 'returns_refunds',
          categoryLabel: 'Garantías',
          version: systemSettings.policies.refundPolicyVersion || 'v2.1-2026-RD',
          lastUpdated: new Date().toISOString().split('T')[0],
          description: 'Plazos y causales para reportar productos defectuosos, no recibidos o divergencias, con custodia de fondos de PlazaDO.',
          isPublished: true,
          pdfFileName: 'PlazaDO_Politica_Devoluciones_RD.pdf',
          pdfFileSize: '195 KB'
        }
      ];

  const handleDownloadApk = () => {
    if (!androidConfig.isEnabled || !androidConfig.apkUrl) {
      showNotification('La descarga de Android no está disponible en este momento.', 'error');
      return;
    }
    const started = triggerFileDownload(androidConfig.apkUrl, androidConfig.apkFileName || 'Plazado.apk');
    showNotification(started ? 'Descarga solicitada. Revisa las descargas de tu navegador.' : 'No se pudo iniciar la descarga.', started ? 'success' : 'error');
  };

  const handleDownloadPdf = (doc: LegalDocument) => {
    if (doc.pdfUrl) {
      triggerFileDownload(doc.pdfUrl, doc.pdfFileName || `${doc.title}.pdf`);
      showNotification(`Descargando ${doc.pdfFileName || doc.title}...`);
    } else {
      downloadOfficialPdfFallback({
        title: doc.title,
        version: doc.version,
        lastUpdated: doc.lastUpdated,
        categoryLabel: doc.categoryLabel,
        description: doc.description,
        summaryPoints: doc.summaryPoints,
        legalBusinessName: systemSettings.legalBusinessName,
        rnc: systemSettings.rnc,
        contactEmail: systemSettings.contactEmail,
        whatsappCommercial: systemSettings.whatsappCommercial
      });
      showNotification(`Generando vista oficial en PDF para ${doc.title}...`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div role="dialog" aria-modal="true" aria-labelledby="download-center-title" className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-6 flex flex-col max-h-[90vh] supports-[height:100dvh]:max-h-[90dvh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-600 text-white rounded-xl shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 id="download-center-title" className="font-extrabold text-stone-900 text-base sm:text-lg">
                Centro de Descargas Oficiales
              </h2>
              <p className="text-[11px] text-stone-500">
                PlazaDO.com • Aplicación móvil Android y documentos legales en PDF
              </p>
            </div>
          </div>
          <button
            aria-label="Cerrar descargas"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 bg-white px-5 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('app')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'app'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>App Android (APK)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'pdf'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Términos y Documentos (PDF)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 min-h-0 overflow-y-auto space-y-4">
          
          {/* TAB 1: ANDROID APP APK */}
          {activeTab === 'app' && (
            <div className="space-y-5">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-emerald-600 text-white rounded-xl shrink-0 shadow-xs">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">
                      {androidConfig.isEnabled ? 'Versión Android' : 'Descarga no disponible'} {androidConfig.versionName}
                    </span>
                    <h3 className="font-extrabold text-stone-900 text-base mt-1">
                      {androidConfig.appName}
                    </h3>
                    <p className="text-xs text-stone-600 mt-0.5">
                      Paquete: <code className="font-mono text-[11px] text-stone-700">{androidConfig.packageName}</code> • Peso: <strong>{androidConfig.apkFileSize || 'Tamaño no informado'}</strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!androidConfig.isEnabled || !androidConfig.apkUrl}
                  onClick={handleDownloadApk}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  <span>Descargar APK ({androidConfig.apkFileSize || 'Tamaño no informado'})</span>
                </button>
              </div>

              <SocialLinks links={systemSettings.socialLinks} />

              {/* Specs & Requirements */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[10px] font-bold uppercase text-stone-400 block">Compatibilidad</span>
                  <span className="font-bold text-stone-800">{androidConfig.minAndroidVersion}</span>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[10px] font-bold uppercase text-stone-400 block">Compilación</span>
                  <span className="font-bold text-stone-800">Build {androidConfig.versionCode}</span>
                </div>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-[10px] font-bold uppercase text-stone-400 block">Actualización</span>
                  <span className="font-bold text-stone-800">{androidConfig.releaseDate}</span>
                </div>
              </div>

              {/* Description & Installation notes */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
                <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-stone-500" />
                  <span>Notas de la versión</span>
                </h4>
                <p className="text-stone-600 leading-relaxed">
                  {androidConfig.releaseNotes}
                </p>
                <div className="pt-2 border-t border-stone-200/70 text-[11px] text-stone-500 space-y-1">
                  <p className="font-semibold text-stone-700">Instrucciones de instalación en Android:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Descarga el archivo APK en tu dispositivo móvil.</li>
                    <li>Abre el archivo descargado desde las notificaciones o tu carpeta de Descargas.</li>
                    <li>Si Android lo solicita, autoriza "Instalar aplicaciones de fuentes desconocidas" para tu navegador o explorador de archivos.</li>
                    <li>Presiona "Instalar" y abre PlazaDO para comprar o gestionar tu tienda.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LEGAL DOCUMENTS PDF */}
          {activeTab === 'pdf' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-600">
                Descarga los documentos normativos oficiales de PlazaDO.com en formato PDF para archivo o impresión, conformes a las leyes de la República Dominicana:
              </p>

              <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden bg-white">
                {legalDocs.map((doc) => (
                  <div key={doc.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-stone-50/60 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-50 text-red-600 rounded-xl shrink-0 mt-0.5">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-stone-100 text-stone-700 rounded-full">
                            {doc.categoryLabel}
                          </span>
                          <span className="text-[11px] text-stone-400 font-mono">
                            {doc.version}
                          </span>
                        </div>
                        <h4 className="font-bold text-stone-900 text-xs sm:text-sm mt-0.5">
                          {doc.title}
                        </h4>
                        <p className="text-xs text-stone-500 mt-1 line-clamp-2">
                          {doc.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(doc)}
                      className="w-full sm:w-auto px-3.5 py-2 bg-stone-900 hover:bg-red-600 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar PDF</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Archivos publicados por Plazado.com</span>
          </div>
          <button
            type="button"
            aria-label="Cerrar descargas"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
