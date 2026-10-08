import React, { useState } from 'react';
import bundle from '../../legal/documents.json';
import { legalDocumentPdfUrl } from '../../legal/registration';
import { useApp } from '../../context/AppContext';
import { 
  FileText, 
  Download, 
  ShieldCheck, 
  ArrowLeft, 
  FileCheck, 
  Calendar, 
  Search, 
  Sparkles, 
  Layers, 
  Smartphone,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { LegalDocument } from '../../types';
import { triggerFileDownload, downloadOfficialPdfFallback } from '../../utils/fileDownloader';
import { DominicanFlag } from '../common/DominicanFlag';

export const LegalAndPoliciesPage: React.FC = () => {
  const { systemSettings, setCurrentView, showNotification, setOpenPolicySlug } = useApp();

  const canonicalDocs: LegalDocument[] = bundle.documents.map(doc => ({
    ...doc, category: doc.category as LegalDocument['category'], categoryLabel: doc.title,
    version: bundle.version, lastUpdated: bundle.effectiveDate, isPublished: true,
    pdfUrl: legalDocumentPdfUrl(doc.id), pdfFileName: legalDocumentPdfUrl(doc.id).split('/').pop(),
    summaryPoints: doc.sections.slice(0, 3).map(section => section.title)
  }));
  const legalDocs: LegalDocument[] = [...canonicalDocs, ...(systemSettings.legalDocuments || [])
    .filter(doc => doc.isPublished && !canonicalDocs.some(current => current.category === doc.category))];

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'Todos los Documentos' },
    { id: 'customer_terms', label: 'Términos Clientes' },
    { id: 'store_terms', label: 'Términos Comercios' },
    { id: 'privacy', label: 'Privacidad RD' },
    { id: 'returns_refunds', label: 'Devoluciones & Garantías' },
    { id: 'shipping_procedures', label: 'Procedimientos de Envíos' },
    { id: 'store_procedures', label: 'Manual para Tiendas' },
  ];

  const filteredDocs = legalDocs.filter(doc => {
    const matchesCategory = activeCategory === 'all' || doc.category === activeCategory;
    const matchesSearch = !searchFilter.trim() || 
      doc.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Top Header Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentView('home')}
          className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-red-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Marketplace</span>
        </button>

        <span className="text-xs text-stone-500 flex items-center gap-1.5">
          <DominicanFlag className="w-4 h-2.5 rounded-2xs inline-block" />
          <span>Marco Legal de la República Dominicana</span>
        </span>
      </div>

      {/* Hero Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <img src="/legal/plazado-logo.png" alt="Plazado" className="h-16 w-52 object-cover object-center" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-2 bg-red-100 text-red-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <span className="text-xs font-extrabold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200 uppercase tracking-wider">
              Centro Legal & Procedimientos Oficiales
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Términos, Políticas y Procedimientos de PlazaDO.com
          </h1>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            Consulta y descarga en formato PDF la documentación regulatoria que rige nuestras operaciones, compras seguras, protección al consumidor (Ley 358-05), protección de datos personales (Ley 172-13) y procedimientos operativos para tiendas asociadas.
          </p>

          <div className="pt-2 flex items-center gap-4 text-xs text-stone-500 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-stone-400" />
              <span>{systemSettings.legalBusinessName}</span>
            </span>
            <span>•</span>
            <span>RNC: <strong>{systemSettings.rnc}</strong></span>
          </div>
        </div>

        {/* Quick App Shortcut */}
        <div className="w-full md:w-auto p-4 bg-stone-900 text-white rounded-2xl space-y-3 shrink-0">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold">¿Buscas la App Android?</span>
          </div>
          <p className="text-[11px] text-stone-400 max-w-xs">
            Descarga directamente el archivo instalador APK para tu teléfono móvil.
          </p>
          <button
            onClick={() => setCurrentView('download_app')}
            className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar APK Android</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeCategory === cat.id
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar documento..."
              className="w-full pl-9 pr-3.5 py-2 bg-white border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredDocs.map((doc) => {
          const isExpanded = expandedDocId === doc.id;
          const hasUploadedPdf = Boolean(doc.pdfUrl);

          return (
            <div
              key={doc.id}
              className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs hover:border-stone-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block bg-red-50 text-red-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-red-200 uppercase tracking-wider mb-1.5">
                      {doc.categoryLabel || 'Documento Oficial'}
                    </span>
                    <h3 className="font-extrabold text-base text-stone-900 leading-snug">
                      {doc.title}
                    </h3>
                  </div>

                  {hasUploadedPdf ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                      PDF Disponible
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full shrink-0">
                      Oficial PlazaDO
                    </span>
                  )}
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  {doc.description}
                </p>

                {/* Summary points */}
                {doc.summaryPoints && doc.summaryPoints.length > 0 && (
                  <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-2">
                    <p className="text-[11px] font-bold text-stone-900">
                      Garantías y Disposiciones Clave:
                    </p>
                    <ul className="space-y-1 text-xs text-stone-600">
                      {doc.summaryPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                <div className="text-[11px] text-stone-400">
                  <span>Versión: <strong>{doc.version}</strong></span>
                  <span className="mx-1">•</span>
                  <span>{doc.lastUpdated}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOpenPolicySlug(doc.category)}
                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl text-xs transition-colors"
                  >
                    Leer en Pantalla
                  </button>

                  <button
                    onClick={() => handleDownloadPdf(doc)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar PDF</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDocs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl border border-stone-200 p-8 space-y-3">
          <FileText className="w-10 h-10 text-stone-300 mx-auto" />
          <h3 className="font-extrabold text-stone-700 text-sm">No se encontraron documentos</h3>
          <p className="text-xs text-stone-400">
            Intenta con otro término de búsqueda o selecciona otra categoría.
          </p>
        </div>
      )}
    </div>
  );
};
