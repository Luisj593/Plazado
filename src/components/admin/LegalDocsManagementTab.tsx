import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  FileCheck, 
  Plus, 
  Edit3, 
  ExternalLink,
  Eye,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import { LegalDocument } from '../../types';
import { triggerFileDownload, downloadOfficialPdfFallback } from '../../utils/fileDownloader';

export const LegalDocsManagementTab: React.FC = () => {
  const { systemSettings, updateSystemSettings, showNotification } = useApp();

  const legalDocs: LegalDocument[] = systemSettings.legalDocuments || [];

  // Modal for editing/uploading PDF to a document
  const [editingDoc, setEditingDoc] = useState<LegalDocument | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<LegalDocument['category']>('custom');
  const [formCategoryLabel, setFormCategoryLabel] = useState('');
  const [formVersion, setFormVersion] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSummaryPoints, setFormSummaryPoints] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'local' | 'url'>('local');
  const [formPdfUrl, setFormPdfUrl] = useState('');
  const [formPdfFileName, setFormPdfFileName] = useState('');
  const [formPdfFileSize, setFormPdfFileSize] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCreateModal = () => {
    setEditingDoc({
      id: `doc-${Date.now()}`,
      title: '',
      category: 'store_procedures',
      categoryLabel: 'Procedimientos Operativos',
      version: 'v1.0-2026-RD',
      lastUpdated: new Date().toISOString().split('T')[0],
      description: '',
      isPublished: true,
      downloadCount: 0
    });
    setFormTitle('');
    setFormCategory('store_procedures');
    setFormCategoryLabel('Procedimientos Operativos');
    setFormVersion('v1.0-2026-RD');
    setFormDescription('');
    setFormSummaryPoints('');
    setFormPdfUrl('');
    setFormPdfFileName('');
    setFormPdfFileSize('');
    setUploadMode('local');
    setFileError(null);
  };

  const openEditModal = (doc: LegalDocument) => {
    setEditingDoc(doc);
    setFormTitle(doc.title);
    setFormCategory(doc.category);
    setFormCategoryLabel(doc.categoryLabel);
    setFormVersion(doc.version);
    setFormDescription(doc.description);
    setFormSummaryPoints(doc.summaryPoints ? doc.summaryPoints.join('\n') : '');
    setFormPdfUrl(doc.pdfUrl || '');
    setFormPdfFileName(doc.pdfFileName || '');
    setFormPdfFileSize(doc.pdfFileSize || '');
    setUploadMode(doc.pdfUrl && !doc.pdfUrl.startsWith('data:') ? 'url' : 'local');
    setFileError(null);
  };

  const processPdfFile = (file: File) => {
    setFileError(null);

    // Validate mime type or extension
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setFileError('Solo se admiten documentos en formato PDF (.pdf).');
      return;
    }

    // Limit to 25MB for safety
    if (file.size > 25 * 1024 * 1024) {
      setFileError('El archivo PDF excede el límite máximo de 25 MB.');
      return;
    }

    setIsProcessingFile(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setFormPdfUrl(result);
        setFormPdfFileName(file.name);
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        const sizeKb = Math.round(file.size / 1024);
        setFormPdfFileSize(file.size > 1024 * 1024 ? `${sizeMb} MB` : `${sizeKb} KB`);
        setIsProcessingFile(false);
        showNotification(`PDF "${file.name}" cargado y listo para guardar.`);
      }
    };
    reader.onerror = () => {
      setFileError('Ocurrió un error al leer el archivo PDF local.');
      setIsProcessingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processPdfFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processPdfFile(e.target.files[0]);
    }
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc) return;
    if (!formTitle.trim()) {
      showNotification('Debes ingresar un título para el documento', 'error');
      return;
    }

    const summaryPoints = formSummaryPoints
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const updatedDoc: LegalDocument = {
      ...editingDoc,
      title: formTitle.trim(),
      category: formCategory,
      categoryLabel: formCategoryLabel.trim() || 'Documento Legal',
      version: formVersion.trim() || 'v1.0-2026',
      lastUpdated: new Date().toISOString().split('T')[0],
      description: formDescription.trim(),
      summaryPoints,
      pdfUrl: formPdfUrl.trim() || undefined,
      pdfFileName: formPdfFileName.trim() || undefined,
      pdfFileSize: formPdfFileSize.trim() || undefined,
      isPublished: true
    };

    const existingIndex = legalDocs.findIndex(d => d.id === editingDoc.id);
    let newDocs: LegalDocument[];
    if (existingIndex >= 0) {
      newDocs = [...legalDocs];
      newDocs[existingIndex] = updatedDoc;
    } else {
      newDocs = [...legalDocs, updatedDoc];
    }

    await updateSystemSettings({
      legalDocuments: newDocs
    });

    showNotification(`Documento "${updatedDoc.title}" guardado exitosamente.`);
    setEditingDoc(null);
  };

  const handleDeleteDocument = async (docId: string, docTitle: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el documento "${docTitle}"?`)) return;

    const filtered = legalDocs.filter(d => d.id !== docId);
    await updateSystemSettings({
      legalDocuments: filtered
    });
    showNotification(`Documento "${docTitle}" eliminado del sistema.`);
  };

  const handleTestDownload = (doc: LegalDocument) => {
    if (doc.pdfUrl) {
      triggerFileDownload(doc.pdfUrl, doc.pdfFileName || `${doc.title}.pdf`);
      showNotification(`Iniciando descarga de ${doc.pdfFileName || doc.title}...`);
    } else {
      downloadOfficialPdfFallback({
        title: doc.title,
        version: doc.version,
        lastUpdated: doc.lastUpdated,
        categoryLabel: doc.categoryLabel,
        description: doc.description,
        summaryPoints: doc.summaryPoints,
        legalBusinessName: systemSettings.legalEntityRegistered ? systemSettings.legalBusinessName : 'Plazado.com',
        rnc: systemSettings.legalEntityRegistered ? systemSettings.rnc : '',
        contactEmail: systemSettings.contactEmail,
        whatsappCommercial: systemSettings.whatsappCommercial
      });
      showNotification(`Generando vista oficial en PDF para ${doc.title}...`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-red-100 text-red-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-stone-900">
                Términos, Condiciones, Políticas y Procedimientos Oficiales
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Carga documentos oficiales en formato PDF para descarga directa de clientes, comercios y autoridades en República Dominicana.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Nuevo Documento o Procedimiento</span>
        </button>
      </div>

      {/* Grid of Legal Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {legalDocs.map((doc) => {
          const hasPdf = Boolean(doc.pdfUrl);

          return (
            <div 
              key={doc.id}
              className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs hover:border-stone-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="inline-block bg-stone-100 text-stone-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-stone-200 uppercase tracking-wider">
                      {doc.categoryLabel || 'Documento Legal'}
                    </span>
                    <h3 className="font-extrabold text-sm text-stone-900">
                      {doc.title}
                    </h3>
                  </div>

                  {hasPdf ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                      PDF Cargado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      Texto Digital
                    </span>
                  )}
                </div>

                <p className="text-xs text-stone-600 leading-relaxed line-clamp-3">
                  {doc.description}
                </p>

                {doc.summaryPoints && doc.summaryPoints.length > 0 && (
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-[11px] text-stone-700 space-y-1">
                    <p className="font-bold text-stone-900 text-[11px]">Compromisos clave:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-stone-600">
                      {doc.summaryPoints.slice(0, 3).map((point, idx) => (
                        <li key={idx} className="truncate">{point}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* PDF Details Chip */}
                {hasPdf && (
                  <div className="flex items-center justify-between p-2.5 bg-red-50/70 border border-red-100 rounded-xl text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-red-600 shrink-0" />
                      <span className="font-bold text-red-950 truncate max-w-[200px]">
                        {doc.pdfFileName || `${doc.title}.pdf`}
                      </span>
                      {doc.pdfFileSize && (
                        <span className="text-[10px] bg-red-200/60 text-red-900 px-1.5 py-0.2 rounded font-semibold shrink-0">
                          {doc.pdfFileSize}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-500 shrink-0">
                      Descargas: <strong>{doc.downloadCount || 0}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
                <div className="text-[10px] text-stone-400">
                  <span>Versión: <strong>{doc.version}</strong></span>
                  <span className="mx-1">•</span>
                  <span>{doc.lastUpdated}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleTestDownload(doc)}
                    className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    title="Probar descarga directa"
                  >
                    <Download className="w-3.5 h-3.5 text-red-600" />
                    <span>Descargar PDF</span>
                  </button>

                  <button
                    onClick={() => openEditModal(doc)}
                    className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors"
                    title="Editar documento o cargar PDF"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {doc.category === 'custom' || doc.category === 'store_procedures' ? (
                    <button
                      onClick={() => handleDeleteDocument(doc.id, doc.title)}
                      className="p-1.5 bg-stone-100 hover:bg-red-100 text-stone-500 hover:text-red-600 rounded-lg transition-colors"
                      title="Eliminar documento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload & Edit Document Modal */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-stone-900 text-base">
                    {editingDoc.title ? `Editar: ${editingDoc.title}` : 'Nuevo Documento o Procedimiento'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Carga el archivo PDF oficial que podrán descargar los usuarios.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDocument} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Título del Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ej: Términos y Condiciones de Envíos"
                    className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Categoría / Etiqueta *
                  </label>
                  <input
                    type="text"
                    required
                    value={formCategoryLabel}
                    onChange={(e) => setFormCategoryLabel(e.target.value)}
                    placeholder="Ej: Procedimiento de Devoluciones"
                    className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Versión del Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={formVersion}
                    onChange={(e) => setFormVersion(e.target.value)}
                    placeholder="Ej: v2.4-2026-RD"
                    className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Tipo de Categoría
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as LegalDocument['category'])}
                    className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden bg-white"
                  >
                    <option value="customer_terms">Términos Clientes Compradores</option>
                    <option value="store_terms">Términos Tiendas y Comercios</option>
                    <option value="privacy">Política de Privacidad y Datos (Ley 172-13)</option>
                    <option value="returns_refunds">Devoluciones y Garantías (Ley 358-05)</option>
                    <option value="shipping_procedures">Procedimientos de Envíos & Despacho</option>
                    <option value="store_procedures">Procedimientos Operativos para Tiendas</option>
                    <option value="payment_policies">Políticas de Pagos (AZUL)</option>
                    <option value="custom">Otro Documento Legal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Descripción o Resumen para la Web
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Resumen del alcance legal de este documento..."
                  className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Puntos Fundamentales (Uno por línea)
                </label>
                <textarea
                  rows={3}
                  value={formSummaryPoints}
                  onChange={(e) => setFormSummaryPoints(e.target.value)}
                  placeholder="Compromiso 1&#10;Compromiso 2&#10;Garantía 3"
                  className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                />
              </div>

              {/* SECCIÓN DE CARGA DE ARCHIVO PDF */}
              <div className="pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-red-600" />
                    <span>Archivo PDF Oficial Descargable</span>
                  </label>

                  {/* Toggle Mode */}
                  <div className="flex items-center bg-stone-100 p-0.5 rounded-lg text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setUploadMode('local')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        uploadMode === 'local' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                      }`}
                    >
                      Subir archivo PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode('url')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        uploadMode === 'url' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                      }`}
                    >
                      Enlace URL
                    </button>
                  </div>
                </div>

                {uploadMode === 'local' ? (
                  <div className="space-y-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleFileDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                        isDragOver
                          ? 'border-red-500 bg-red-50/50'
                          : formPdfUrl
                          ? 'border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/50'
                          : 'border-stone-300 bg-stone-50 hover:bg-stone-100/80 hover:border-red-300'
                      }`}
                    >
                      {formPdfUrl ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <FileCheck className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-900">
                              {formPdfFileName || 'Documento PDF Cargado'}
                            </p>
                            {formPdfFileSize && (
                              <p className="text-[11px] text-stone-500">
                                Tamaño: {formPdfFileSize}
                              </p>
                            )}
                          </div>
                          <span className="text-[11px] text-red-600 font-bold hover:underline">
                            Haz clic o arrastra otro archivo para reemplazarlo
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                            <Upload className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-900">
                              Arrastra aquí tu documento PDF oficial o haz clic para examinar
                            </p>
                            <p className="text-[11px] text-stone-500 mt-0.5">
                              Formatos admitidos: .PDF (máx. 25 MB)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {fileError && (
                      <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {fileError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={formPdfUrl}
                      onChange={(e) => {
                        setFormPdfUrl(e.target.value);
                        if (!formPdfFileName) {
                          setFormPdfFileName(e.target.value.split('/').pop() || 'documento.pdf');
                        }
                      }}
                      placeholder="https://ejemplo.com/documentos/terminos-plazado.pdf"
                      className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-hidden"
                    />
                    <p className="text-[11px] text-stone-500 mt-1">
                      Proporciona un enlace directo a un archivo PDF alojado en Google Drive, Firebase Storage, CDN o tu servidor.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessingFile}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Documento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
