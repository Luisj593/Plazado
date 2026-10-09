import React, { useState, useRef } from 'react';
import { 
  Megaphone, 
  Plus, 
  Eye, 
  MousePointer, 
  TrendingUp, 
  Calendar, 
  ExternalLink, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Monitor, 
  Smartphone, 
  Layers, 
  Sparkles, 
  Image as ImageIcon,
  Check,
  XCircle,
  BarChart3,
  Upload,
  Link as LinkIcon,
  RefreshCw,
  X,
  FileImage,
  Loader2
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { Advertisement, AdPlacement, AdPlacementCode, AdType } from '../../types';

export const AdvertisingManagementTab: React.FC = () => {
  const { 
    adCampaigns, 
    adPlacements, 
    createAdCampaign, 
    updateAdCampaign, 
    toggleAdCampaignStatus, 
    deleteAdCampaign,
    stores
  } = useAppContext();

  const [activeSubTab, setActiveSubTab] = useState<'campaigns' | 'placements' | 'analytics'>('campaigns');
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [filterPlacement, setFilterPlacement] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<AdType>('INTERNAL');
  const [formAdvertiserName, setFormAdvertiserName] = useState('Plazado.com');
  const [formPlacement, setFormPlacement] = useState<AdPlacementCode>('HOME_TOP');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState(new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formVideoUrl, setFormVideoUrl] = useState('');
  const [formCtaText, setFormCtaText] = useState('Ver Oferta');
  const [formTargetUrl, setFormTargetUrl] = useState('');
  const [formTargetWindow, setFormTargetWindow] = useState<'_self' | '_blank'>('_self');
  const [formPriority, setFormPriority] = useState<number>(5);
  const [formTargetDevice, setFormTargetDevice] = useState<'ALL' | 'DESKTOP' | 'MOBILE'>('ALL');
  const [formSponsorStoreId, setFormSponsorStoreId] = useState<string>('');

  // Local storage image upload states
  const [imageUploadMode, setImageUploadMode] = useState<'upload' | 'url'>('upload');
  const [imageFileName, setImageFileName] = useState<string>('');
  const [imageFileSize, setImageFileSize] = useState<string>('');
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  const selectedPlacementConfig = adPlacements.find(p => p.code === formPlacement);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const processImageFile = async (file: File) => {
    setImageError(null);
    if (!file.type.startsWith('image/')) {
      setImageError('Por favor selecciona un archivo de imagen válido (PNG, JPG, JPEG, WEBP, SVG o GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setImageError('El archivo excede el tamaño máximo permitido de 10 MB.');
      return;
    }

    setIsProcessingImage(true);

    try {
      // If SVG or animated GIF, keep original vector/frames directly
      if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const res = e.target?.result as string;
          setFormImageUrl(res);
          setImageFileName(file.name);
          setImageFileSize(formatBytes(file.size));
          setIsProcessingImage(false);
        };
        reader.onerror = () => {
          setImageError('Error al leer el archivo desde el almacenamiento local.');
          setIsProcessingImage(false);
        };
        reader.readAsDataURL(file);
        return;
      }

      // Optimize/compress bitmap images with canvas for fast rendering and storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawData = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const maxDim = 1600;
          let w = img.width;
          let h = img.height;

          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
            const quality = file.type === 'image/png' ? undefined : 0.88;
            const optimizedDataUrl = canvas.toDataURL(mime, quality);
            setFormImageUrl(optimizedDataUrl);
          } else {
            setFormImageUrl(rawData);
          }

          setImageFileName(file.name);
          setImageFileSize(formatBytes(file.size));
          setIsProcessingImage(false);
        };
        img.onerror = () => {
          setFormImageUrl(rawData);
          setImageFileName(file.name);
          setImageFileSize(formatBytes(file.size));
          setIsProcessingImage(false);
        };
        img.src = rawData;
      };
      reader.onerror = () => {
        setImageError('Error al procesar la imagen local.');
        setIsProcessingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setImageError(err.message || 'Error al cargar la imagen.');
      setIsProcessingImage(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const getAdStatusBadge = (ad: Advertisement) => {
    if (!ad.isActive) {
      return (
        <span className="bg-stone-100 text-stone-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-stone-200 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pausada
        </span>
      );
    }
    if (ad.endDate && ad.endDate < todayStr) {
      return (
        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Expirada
        </span>
      );
    }
    if (ad.startDate && ad.startDate > todayStr) {
      return (
        <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Programada
        </span>
      );
    }
    return (
      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
        <CheckCircle className="w-3 h-3 text-emerald-600" />
        Activa al Aire
      </span>
    );
  };

  const openCreateModal = () => {
    setIsCreatingNew(true);
    setEditingAd(null);
    setFormTitle('');
    setFormDescription('');
    setFormType('INTERNAL');
    setFormAdvertiserName('Plazado.com');
    setFormPlacement('HOME_TOP');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate(new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0]);
    setFormImageUrl('');
    setImageFileName('');
    setImageFileSize('');
    setImageError(null);
    setImageUploadMode('upload');
    setFormVideoUrl('');
    setFormCtaText('Explorar Promoción');
    setFormTargetUrl('/');
    setFormTargetWindow('_self');
    setFormPriority(8);
    setFormTargetDevice('ALL');
    setFormSponsorStoreId('');
  };

  const openEditModal = (ad: Advertisement) => {
    setIsCreatingNew(false);
    setEditingAd(ad);
    setFormTitle(ad.title);
    setFormDescription(ad.description || '');
    setFormType(ad.type);
    setFormAdvertiserName(ad.advertiserName || 'Plazado.com');
    setFormPlacement(ad.placement);
    setFormStartDate(ad.startDate);
    setFormEndDate(ad.endDate);
    setFormImageUrl(ad.imageUrl);
    setImageFileName('');
    setImageFileSize('');
    setImageError(null);
    setImageUploadMode(ad.imageUrl && ad.imageUrl.startsWith('data:') ? 'upload' : 'url');
    setFormVideoUrl(ad.videoUrl || '');
    setFormCtaText(ad.ctaText || 'Ver Más');
    setFormTargetUrl(ad.targetUrl);
    setFormTargetWindow(ad.targetWindow || '_self');
    setFormPriority(ad.priority);
    setFormTargetDevice(ad.targetDevice);
    setFormSponsorStoreId(ad.sponsorStoreId || '');
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formImageUrl || !formImageUrl.trim()) {
      setImageError('Debes seleccionar o cargar una imagen desde tu almacenamiento local o ingresar una URL.');
      return;
    }

    const payload = {
      title: formTitle,
      description: formDescription,
      type: formType,
      advertiserName: formAdvertiserName,
      placement: formPlacement,
      startDate: formStartDate,
      endDate: formEndDate,
      imageUrl: formImageUrl,
      videoUrl: formVideoUrl || undefined,
      ctaText: formCtaText,
      targetUrl: formTargetUrl,
      targetWindow: formTargetWindow,
      priority: Number(formPriority),
      targetDevice: formTargetDevice,
      sponsorStoreId: formSponsorStoreId || undefined,
      isActive: editingAd ? editingAd.isActive : true
    };

    if (editingAd) {
      await updateAdCampaign(editingAd.id, payload);
    } else {
      await createAdCampaign(payload);
    }

    setIsCreatingNew(false);
    setEditingAd(null);
  };

  // Metrics calculations
  const totalImpressions = adCampaigns.reduce((acc, a) => acc + (a.impressions || 0), 0);
  const totalClicks = adCampaigns.reduce((acc, a) => acc + (a.clicks || 0), 0);
  const globalCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
  const activeCount = adCampaigns.filter(a => a.isActive && (!a.endDate || a.endDate >= todayStr)).length;

  const filteredCampaigns = adCampaigns.filter(ad => {
    if (filterPlacement !== 'all' && ad.placement !== filterPlacement) return false;
    if (filterType !== 'all' && ad.type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6" id="admin-advertising-view">
      
      {/* Header Banner */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-2 bg-red-600 rounded-xl">
              <Megaphone className="w-5 h-5 text-white" />
            </span>
            <h2 className="text-xl font-black tracking-tight">Gestión de Publicidad & Espacios Comerciales</h2>
            <span className="bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Monetización & Promociones
            </span>
          </div>
          <p className="text-xs text-stone-300 mt-1.5 max-w-2xl">
            Crea, programa y controla banners patrocinados, anuncios destacados en el Home, catálogos de categorías y espacios entre productos. 
            Monitoreo en tiempo real de impresiones, clics y ratios de conversión (CTR).
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Anuncio</span>
        </button>
      </div>

      {/* KPI Metrics Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Campañas Activas</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">{activeCount}</div>
          <span className="text-[10px] text-stone-500 mt-0.5 block">de {adCampaigns.length} registradas</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Impresiones Totales</span>
            <Eye className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">{totalImpressions.toLocaleString()}</div>
          <span className="text-[10px] text-stone-500 mt-0.5 block">Vistas efectivas de usuarios</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Clics Generados</span>
            <MousePointer className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">{totalClicks.toLocaleString()}</div>
          <span className="text-[10px] text-stone-500 mt-0.5 block">Interacciones directas</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">CTR Promedio Global</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-stone-900">{globalCtr}%</div>
          <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">Rendimiento de clics/vistas</span>
        </div>
      </div>

      {/* Subtabs navigation */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveSubTab('campaigns')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'campaigns' ? 'bg-red-600 text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Campañas ({adCampaigns.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('placements')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
            activeSubTab === 'placements' ? 'bg-red-600 text-white' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Ubicaciones & Formatos ({adPlacements.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: CAMPAIGNS LIST */}
      {activeSubTab === 'campaigns' && (
        <div className="space-y-4">
          
          {/* Filter Toolbar */}
          <div className="bg-white p-3.5 rounded-xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-stone-600">Filtrar por Ubicación:</span>
              <select 
                value={filterPlacement} 
                onChange={(e) => setFilterPlacement(e.target.value)}
                className="bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 font-medium text-stone-800"
              >
                <option value="all">Todas las ubicaciones</option>
                {adPlacements.map(p => (
                  <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
                ))}
              </select>

              <span className="font-bold text-stone-600 ml-2">Tipo:</span>
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-stone-50 border border-stone-300 rounded-lg px-2.5 py-1.5 font-medium text-stone-800"
              >
                <option value="all">Todos los tipos</option>
                <option value="INTERNAL">Interna (Plazado.com)</option>
                <option value="EXTERNAL">Externa / Marca</option>
                <option value="STORE_SPONSORED">Patrocinada por Tienda</option>
              </select>
            </div>

            <span className="text-stone-500 font-medium">
              Mostrando {filteredCampaigns.length} de {adCampaigns.length} anuncios
            </span>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCampaigns.map((ad) => {
              const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0.0';
              return (
                <div key={ad.id} className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden flex flex-col justify-between group hover:border-stone-300 transition-all">
                  
                  <div>
                    {/* Media Preview Container */}
                    <div className="h-40 bg-stone-100 relative overflow-hidden">
                      <img 
                        src={ad.imageUrl} 
                        alt={ad.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="absolute top-2.5 left-2.5">
                        {getAdStatusBadge(ad)}
                      </div>
                      <div className="absolute top-2.5 right-2.5 bg-stone-950/80 backdrop-blur-xs text-white text-[10px] font-mono px-2 py-0.5 rounded-md">
                        {ad.placement}
                      </div>
                      <div className="absolute bottom-2.5 right-2.5 bg-stone-900/85 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        {ad.targetDevice === 'ALL' && <Monitor className="w-3 h-3" />}
                        {ad.targetDevice === 'MOBILE' && <Smartphone className="w-3 h-3" />}
                        {ad.targetDevice === 'DESKTOP' && <Monitor className="w-3 h-3" />}
                        <span>{ad.targetDevice}</span>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-4 space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1">
                          <span className="font-bold text-red-600">{ad.advertiserName}</span>
                          <span className="font-semibold text-stone-400">Prioridad: {ad.priority}/10</span>
                        </div>
                        <h3 className="font-extrabold text-stone-900 text-sm leading-snug line-clamp-1">{ad.title}</h3>
                        <p className="text-xs text-stone-500 mt-1 line-clamp-2">{ad.description}</p>
                      </div>

                      {/* Dates & CTA */}
                      <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/70 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-stone-600 text-[11px]">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-stone-400" />
                            {ad.startDate} al {ad.endDate}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-stone-800 text-[11px] pt-1 border-t border-stone-200/50">
                          <span className="font-semibold">Botón: <strong className="text-red-700">{ad.ctaText}</strong></span>
                          <span className="text-stone-500 font-mono text-[10px] truncate max-w-[130px]">{ad.targetUrl}</span>
                        </div>
                      </div>

                      {/* Metrics Performance Counters */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs py-1">
                        <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-200">
                          <span className="text-[10px] text-stone-400 block font-bold">VISTAS</span>
                          <span className="font-black text-stone-900">{ad.impressions.toLocaleString()}</span>
                        </div>
                        <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-200">
                          <span className="text-[10px] text-stone-400 block font-bold">CLICS</span>
                          <span className="font-black text-stone-900">{ad.clicks.toLocaleString()}</span>
                        </div>
                        <div className="bg-stone-50 p-1.5 rounded-lg border border-stone-200">
                          <span className="text-[10px] text-stone-400 block font-bold">CTR</span>
                          <span className="font-black text-purple-600">{ctr}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-2 text-xs">
                    <button
                      onClick={() => toggleAdCampaignStatus(ad.id)}
                      className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors ${
                        ad.isActive 
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-800' 
                          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                      }`}
                    >
                      {ad.isActive ? 'Pausar' : 'Activar'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(ad)}
                        className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-lg transition-colors"
                        title="Editar anuncio"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`¿Eliminar la campaña publicitaria "${ad.title}"?`)) {
                            deleteAdCampaign(ad.id);
                          }
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                        title="Eliminar campaña"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {filteredCampaigns.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 text-stone-500">
              <Megaphone className="w-10 h-10 mx-auto text-stone-400 mb-2" />
              <p className="font-bold text-stone-700">No hay campañas publicitarias registradas con este filtro.</p>
              <p className="text-xs text-stone-500 mt-1">Haz clic en "Crear Anuncio" para programar una nueva campaña.</p>
            </div>
          )}

        </div>
      )}

      {/* SUBTAB 2: PLACEMENTS & DIMENSIONS */}
      {activeSubTab === 'placements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adPlacements.map((placement) => (
            <div key={placement.code} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-black bg-stone-100 px-2 py-0.5 rounded text-stone-800 border border-stone-200">
                      {placement.code}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.2 rounded-full">
                      Activo
                    </span>
                  </div>
                  <h3 className="font-extrabold text-stone-900 text-base mt-1">{placement.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-stone-400 uppercase block">Capacidad</span>
                  <span className="font-mono font-bold text-stone-800 text-xs">Hasta {placement.maxSlots} anuncios</span>
                </div>
              </div>

              <p className="text-xs text-stone-600">{placement.description}</p>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 text-xs grid grid-cols-2 gap-2">
                <div>
                  <span className="text-stone-400 text-[10px] font-bold block uppercase">Dimensiones Recomendadas</span>
                  <span className="font-mono font-bold text-stone-800">{placement.recommendedSize}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] font-bold block uppercase">Formatos Soportados</span>
                  <span className="font-semibold text-stone-800">{placement.supportedFormats.join(', ')}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL FOR CREATING / EDITING ADS */}
      {(editingAd || isCreatingNew) && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden my-8 animate-scaleUp">
            
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-red-600 rounded-lg">
                  <Megaphone className="w-5 h-5 text-white" />
                </span>
                <div>
                  <h3 className="font-extrabold text-base">
                    {isCreatingNew ? 'Crear Nueva Campaña Publicitaria' : `Editar Campaña: ${editingAd?.title}`}
                  </h3>
                  <p className="text-[11px] text-stone-300">
                    Control de visualización, fechas y enlaces de conversión
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setEditingAd(null); setIsCreatingNew(false); }}
                className="text-stone-400 hover:text-white p-1 rounded-lg"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="p-6 space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-stone-700 font-bold mb-1">Título de la Campaña / Anuncio *</label>
                  <input 
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    placeholder="Ej. Abre tu tienda oficial en Plazado.com con Promoción de temporada"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-medium text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Tipo de Publicidad</label>
                  <select 
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-medium text-stone-800"
                  >
                    <option value="INTERNAL">Publicidad Interna (Plazado.com Oficial)</option>
                    <option value="EXTERNAL">Anunciante Externo / Marca</option>
                    <option value="STORE_SPONSORED">Patrocinado por Tienda Registrada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Nombre del Anunciante</label>
                  <input 
                    type="text"
                    value={formAdvertiserName}
                    onChange={(e) => setFormAdvertiserName(e.target.value)}
                    required
                    placeholder="Ej. Plazado.com Oficial / Samsung RD"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-medium text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Ubicación Asignada *</label>
                  <select 
                    value={formPlacement}
                    onChange={(e) => setFormPlacement(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-medium text-stone-800"
                  >
                    {adPlacements.map(p => (
                      <option key={p.code} value={p.code}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Dispositivo Objetivo</label>
                  <select 
                    value={formTargetDevice}
                    onChange={(e) => setFormTargetDevice(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-medium text-stone-800"
                  >
                    <option value="ALL">Todos los dispositivos (Desktop & Móvil)</option>
                    <option value="DESKTOP">Solo Computadoras de Escritorio</option>
                    <option value="MOBILE">Solo Dispositivos Móviles</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Fecha de Inicio *</label>
                  <input 
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    required
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-medium text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Fecha de Expiración / Fin *</label>
                  <input 
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    required
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-medium text-stone-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-stone-700 font-bold mb-1">Descripción / Texto Secundario</label>
                  <textarea 
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={2}
                    placeholder="Texto persuasivo que complementa la propuesta de valor del anuncio..."
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-medium text-stone-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-stone-700 font-bold">
                      Imagen del Anuncio / Banner Publicitario *
                    </label>
                    <div className="flex items-center bg-stone-100 p-0.5 rounded-lg text-[11px] font-semibold">
                      <button
                        type="button"
                        onClick={() => { setImageUploadMode('upload'); setImageError(null); }}
                        className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                          imageUploadMode === 'upload' 
                            ? 'bg-white text-stone-900 shadow-2xs font-bold' 
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        <Upload className="w-3 h-3 text-red-600" />
                        <span>Cargar desde tu equipo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setImageUploadMode('url'); setImageError(null); }}
                        className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                          imageUploadMode === 'url' 
                            ? 'bg-white text-stone-900 shadow-2xs font-bold' 
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        <LinkIcon className="w-3 h-3 text-stone-600" />
                        <span>URL Externa</span>
                      </button>
                    </div>
                  </div>

                  {/* Hidden native input for local storage file selection */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  {/* Error Notification */}
                  {imageError && (
                    <div className="mb-2.5 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{imageError}</span>
                    </div>
                  )}

                  {/* MODE: LOCAL UPLOAD */}
                  {imageUploadMode === 'upload' ? (
                    <div>
                      {isProcessingImage ? (
                        <div className="border-2 border-dashed border-stone-300 bg-stone-50/70 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                          <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-2" />
                          <p className="font-bold text-stone-800 text-xs">Procesando y optimizando imagen local...</p>
                          <p className="text-[11px] text-stone-500 mt-0.5">Adaptando dimensiones para almacenamiento y visualización rápida</p>
                        </div>
                      ) : !formImageUrl ? (
                        <div
                          onDragEnter={handleDrag}
                          onDragOver={handleDrag}
                          onDragLeave={handleDrag}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                            dragActive 
                              ? 'border-red-500 bg-red-50/70 scale-[0.99]' 
                              : 'border-stone-300 hover:border-red-400 bg-stone-50/60 hover:bg-stone-50'
                          }`}
                        >
                          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
                            <Upload className="w-6 h-6" />
                          </div>
                          <p className="font-extrabold text-stone-800 text-xs">
                            Arrastra tu imagen publicitaria aquí o <span className="text-red-600 underline">haz clic para examinar tu equipo</span>
                          </p>
                          <p className="text-[11px] text-stone-500 mt-1">
                            Formatos soportados: PNG, JPG, JPEG, WEBP, SVG o GIF (máx. 10 MB)
                          </p>
                          
                          {selectedPlacementConfig && (
                            <div className="inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-[10px] text-stone-600 font-mono font-medium">
                              <span>Dimensiones sugeridas para {formPlacement}:</span>
                              <strong className="text-stone-900">{selectedPlacementConfig.recommendedSize}</strong>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                          {/* Banner preview bar */}
                          <div className="p-2.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 truncate">
                              <span className="p-1 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[10px] flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                Imagen Local
                              </span>
                              <span className="text-stone-600 font-medium truncate max-w-[240px] text-[11px]">
                                {imageFileName || 'Banner cargado correctamente'}
                              </span>
                              {imageFileSize && (
                                <span className="text-stone-400 font-mono text-[10px]">({imageFileSize})</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Cambiar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFormImageUrl('');
                                  setImageFileName('');
                                  setImageFileSize('');
                                }}
                                className="p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Quitar imagen"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Image Box */}
                          <div className="h-36 bg-stone-900 relative overflow-hidden flex items-center justify-center">
                            <img 
                              src={formImageUrl} 
                              alt="Vista previa del anuncio" 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80';
                              }}
                            />
                            <div className="absolute bottom-2 left-2 bg-stone-950/80 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded font-mono">
                              Ubicación: {formPlacement}
                            </div>
                            <div className="absolute bottom-2 right-2 bg-stone-950/80 backdrop-blur-xs text-stone-200 text-[10px] px-2 py-0.5 rounded font-medium">
                              Vista previa del banner
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* MODE: EXTERNAL URL */
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <LinkIcon className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                          <input 
                            type="url"
                            value={formImageUrl}
                            onChange={(e) => setFormImageUrl(e.target.value)}
                            placeholder="https://ejemplo.com/imagenes/banner-promocion.jpg"
                            className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2.5 font-mono text-stone-800 text-[11px]"
                          />
                        </div>
                      </div>
                      <p className="text-[11px] text-stone-400">
                        Introduce la dirección URL pública directa de la imagen (HTTPS).
                      </p>

                      {formImageUrl && (
                        <div className="mt-2 h-32 bg-stone-100 rounded-xl overflow-hidden border border-stone-200 flex items-center justify-center relative">
                          <img 
                            src={formImageUrl} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80';
                            }}
                          />
                          <span className="absolute bottom-1 right-2 bg-stone-900/80 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                            Vista previa URL
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Texto del Botón (CTA)</label>
                  <input 
                    type="text"
                    value={formCtaText}
                    onChange={(e) => setFormCtaText(e.target.value)}
                    required
                    placeholder="Ej. Comprar Ahora / Registrarse"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-medium text-stone-800"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">URL de Destino</label>
                  <input 
                    type="text"
                    value={formTargetUrl}
                    onChange={(e) => setFormTargetUrl(e.target.value)}
                    required
                    placeholder="Ej. /registro-tienda o https://marca.com"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-mono text-stone-800 text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Apertura del Enlace</label>
                  <select 
                    value={formTargetWindow}
                    onChange={(e) => setFormTargetWindow(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-medium text-stone-800"
                  >
                    <option value="_self">Misma Ventana (_self)</option>
                    <option value="_blank">Nueva Pestaña (_blank)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Prioridad de Visualización (1 al 10)</label>
                  <input 
                    type="number"
                    min={1}
                    max={10}
                    value={formPriority}
                    onChange={(e) => setFormPriority(Number(e.target.value))}
                    required
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl p-2.5 font-bold text-stone-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => { setEditingAd(null); setIsCreatingNew(false); }}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-xs"
                >
                  {isCreatingNew ? 'Publicar Anuncio' : 'Guardar Cambios'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
