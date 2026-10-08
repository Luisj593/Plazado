import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Image as ImageIcon, 
  Check, 
  Sparkles, 
  Store, 
  Tag, 
  ExternalLink, 
  ShoppingBag,
  Layers,
  Upload,
  RefreshCw,
  Trash2,
  FileImage,
  Link as LinkIcon
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Banner } from '../../types';

interface CreateBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bannerToEdit?: Banner | null;
}

const SAMPLE_BANNER_PRESETS = [
  {
    label: 'Tecnología & Gadgets',
    url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1600&auto=format&fit=crop&q=80',
    title: 'Tecnología & Innovación Dominicana',
    subtitle: 'Los mejores dispositivos y accesorios con garantía local'
  },
  {
    label: 'Moda & Calzado',
    url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80',
    title: 'Tendencias & Moda Criolla',
    subtitle: 'Prendas exclusivas diseñadas y confeccionadas en República Dominicana'
  },
  {
    label: 'Hogar & Electrodomésticos',
    url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1600&auto=format&fit=crop&q=80',
    title: 'Renueva Tu Espacio con PlazaDO',
    subtitle: 'Mobiliario moderno, electrodomésticos y decoración con envíos a todo el país'
  },
  {
    label: 'Gastronomía & Sabores',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1600&auto=format&fit=crop&q=80',
    title: 'Sabores Auténticos de Nuestra Tierra',
    subtitle: 'Café de especialidad, dulces tradicionales y productos artesanales'
  }
];

export const CreateBannerModal: React.FC<CreateBannerModalProps> = ({ isOpen, onClose, bannerToEdit }) => {
  const { banners, stores, categories, products, addBanner, updateBanner, showNotification } = useApp();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [targetType, setTargetType] = useState<Banner['targetType']>('STORE');
  const [targetValue, setTargetValue] = useState('');
  const [order, setOrder] = useState(banners.length + 1);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Local file upload states
  const [imageSourceMode, setImageSourceMode] = useState<'LOCAL_FILE' | 'URL' | 'PRESET'>('LOCAL_FILE');
  const [localFileInfo, setLocalFileInfo] = useState<{ name: string; size: string; dimensions?: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or reset form when modal opens or bannerToEdit changes
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setIsSubmitting(false);
      setIsProcessingFile(false);

      if (bannerToEdit) {
        // Edit mode
        setTitle(bannerToEdit.title || '');
        setSubtitle(bannerToEdit.subtitle || '');
        setBadge(bannerToEdit.badge || '');
        setImageUrl(bannerToEdit.imageUrl || '');
        setTargetType(bannerToEdit.targetType || 'STORE');
        setTargetValue(bannerToEdit.targetValue || '');
        setOrder(bannerToEdit.order || 1);
        setIsActive(bannerToEdit.isActive !== false);

        if (bannerToEdit.imageUrl?.startsWith('data:image')) {
          setImageSourceMode('LOCAL_FILE');
          setLocalFileInfo({ name: 'Foto local guardada', size: 'Optimizado en Base64' });
        } else {
          setImageSourceMode('URL');
          setLocalFileInfo(null);
        }
      } else {
        // Create mode
        setTitle('');
        setSubtitle('');
        setBadge('DESTACADO');
        setImageUrl('');
        setTargetType('STORE');
        setTargetValue(stores[0]?.slug || stores[0]?.id || '');
        setOrder(banners.length + 1);
        setIsActive(true);
        setImageSourceMode('LOCAL_FILE');
        setLocalFileInfo(null);
      }
    }
  }, [isOpen, bannerToEdit, banners.length, stores]);

  if (!isOpen) return null;

  // Process and optimize local photo file
  const processLocalImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('El archivo seleccionado no es una imagen válida. Usa formatos PNG, JPG, WEBP o SVG.');
      return;
    }

    setIsProcessingFile(true);
    setErrorMessage('');

    const fileSizeFormatted = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` 
      : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onerror = () => {
      setIsProcessingFile(false);
      setErrorMessage('Error al leer el archivo desde el equipo.');
    };

    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) {
        setIsProcessingFile(false);
        return;
      }

      // If SVG, no canvas compression is needed
      if (file.type === 'image/svg+xml') {
        setImageUrl(rawDataUrl);
        setLocalFileInfo({
          name: file.name,
          size: fileSizeFormatted,
          dimensions: 'Vectorial (SVG)'
        });
        setIsProcessingFile(false);
        return;
      }

      // Use HTML5 Canvas to scale and optimize large images for fast loading
      const img = new Image();
      img.onload = () => {
        const originalWidth = img.width;
        const originalHeight = img.height;
        const maxDimension = 1920;

        let targetWidth = originalWidth;
        let targetHeight = originalHeight;

        if (targetWidth > maxDimension || targetHeight > maxDimension) {
          if (targetWidth > targetHeight) {
            targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
            targetWidth = maxDimension;
          } else {
            targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
            targetHeight = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          // Convert to WebP or high-quality JPEG
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          setImageUrl(optimizedDataUrl);
          setLocalFileInfo({
            name: file.name,
            size: fileSizeFormatted,
            dimensions: `${targetWidth} × ${targetHeight} px`
          });
        } else {
          // Fallback to raw data url if canvas 2d context unavailable
          setImageUrl(rawDataUrl);
          setLocalFileInfo({
            name: file.name,
            size: fileSizeFormatted,
            dimensions: `${originalWidth} × ${originalHeight} px`
          });
        }
        setIsProcessingFile(false);
      };

      img.onerror = () => {
        setImageUrl(rawDataUrl);
        setLocalFileInfo({
          name: file.name,
          size: fileSizeFormatted
        });
        setIsProcessingFile(false);
      };

      img.src = rawDataUrl;
    };

    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processLocalImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processLocalImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setLocalFileInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanTitle = title.trim();
    const cleanImg = imageUrl.trim();

    if (!cleanTitle) {
      setErrorMessage('Por favor introduce un título para el banner.');
      return;
    }
    if (!cleanImg) {
      setErrorMessage('Por favor selecciona o sube una foto para el banner.');
      return;
    }

    try {
      setIsSubmitting(true);

      const bannerData = {
        title: cleanTitle,
        subtitle: subtitle.trim(),
        badge: badge.trim() || undefined,
        imageUrl: cleanImg,
        targetType,
        targetValue: targetValue.trim() || '',
        isActive,
        order: Number(order) || 1
      };

      if (bannerToEdit) {
        await updateBanner(bannerToEdit.id, bannerData);
        showNotification(`¡Banner "${cleanTitle}" actualizado permanentemente!`, 'success');
      } else {
        await addBanner(bannerData);
        showNotification(`¡Banner "${cleanTitle}" creado y publicado exitosamente!`, 'success');
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar el banner publicitario');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-5 border border-stone-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 block">
                SUPER ADMIN — GESTIÓN DE PORTADA GLOBAL
              </span>
              <h3 className="font-extrabold text-stone-900 text-base">
                {bannerToEdit ? 'Editar Banner Promocional' : 'Crear Nuevo Banner Promocional'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Title */}
          <div>
            <label className="block font-bold text-stone-800 mb-1">
              Título Principal del Banner <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Gran Feria de Compras Dominicanas, Ofertas de Verano..."
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium outline-none focus:border-red-500 focus:bg-white transition-all text-xs"
            />
          </div>

          {/* Subtitle & Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-stone-800 mb-1">
                Subtítulo / Mensaje Promocional
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Ej: Envíos express a todo el país y pagos seguros"
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 outline-none focus:border-red-500 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Etiqueta / Badge
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="Ej: NUEVO, OFERTA"
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-semibold outline-none focus:border-red-500 text-xs"
              />
            </div>
          </div>

          {/* Image Selection Section with Local File Upload */}
          <div className="space-y-2 border border-stone-200 rounded-2xl p-3.5 bg-stone-50/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="font-bold text-stone-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-red-600" />
                <span>Foto del Banner <span className="text-red-500">*</span></span>
              </label>
              
              {/* Tab Selector for Image Source */}
              <div className="flex items-center bg-stone-200/70 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setImageSourceMode('LOCAL_FILE')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                    imageSourceMode === 'LOCAL_FILE' 
                      ? 'bg-white text-red-600 shadow-2xs font-extrabold' 
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Upload className="w-3 h-3" />
                  <span>Subir desde mi equipo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageSourceMode('URL')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                    imageSourceMode === 'URL' 
                      ? 'bg-white text-red-600 shadow-2xs font-extrabold' 
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>Enlace (URL)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setImageSourceMode('PRESET')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                    imageSourceMode === 'PRESET' 
                      ? 'bg-white text-red-600 shadow-2xs font-extrabold' 
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Sugerencias</span>
                </button>
              </div>
            </div>

            {/* Mode 1: Subir desde el equipo local */}
            {imageSourceMode === 'LOCAL_FILE' && (
              <div className="space-y-2 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    isDragging 
                      ? 'border-red-500 bg-red-50/80 scale-[0.99]' 
                      : 'border-stone-300 hover:border-red-400 bg-white hover:bg-stone-50'
                  }`}
                >
                  {isProcessingFile ? (
                    <div className="flex flex-col items-center justify-center py-2 text-stone-500">
                      <RefreshCw className="w-6 h-6 animate-spin text-red-600 mb-1" />
                      <span className="font-semibold text-xs">Optimizando imagen desde tu dispositivo...</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="w-10 h-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-1">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-stone-800 text-xs">
                        Haz clic para seleccionar una foto desde tu equipo o arrástrala aquí
                      </p>
                      <p className="text-[10.5px] text-stone-400">
                        Compatible con fotos JPG, PNG, WEBP o SVG (Recomendado: panorámico horizontal 16:9 o 21:9)
                      </p>
                    </div>
                  )}
                </div>

                {localFileInfo && imageUrl && (
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800">
                    <div className="flex items-center gap-2 truncate">
                      <FileImage className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="truncate">
                        <span className="font-bold truncate block">{localFileInfo.name}</span>
                        <span className="text-[10px] text-emerald-600">
                          {localFileInfo.size} {localFileInfo.dimensions ? `• ${localFileInfo.dimensions}` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2 py-1 bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-[10px] font-bold transition-colors"
                      >
                        Cambiar foto
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="p-1 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                        title="Quitar foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mode 2: Enlace URL */}
            {imageSourceMode === 'URL' && (
              <div className="space-y-1.5 pt-1">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setLocalFileInfo(null);
                  }}
                  placeholder="https://ejemplo.com/mi-banner.jpg"
                  className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-stone-900 font-mono text-xs outline-none focus:border-red-500"
                />
                <p className="text-[10px] text-stone-400">
                  Pega el enlace directo a una imagen alojada en un servidor o servicio web seguro (HTTPS).
                </p>
              </div>
            )}

            {/* Mode 3: Sugerencias Dominicanas */}
            {imageSourceMode === 'PRESET' && (
              <div className="pt-1">
                <span className="text-[10px] text-stone-500 font-medium block mb-1.5">
                  Selecciona una imagen prediseñada de alta resolución:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {SAMPLE_BANNER_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setImageUrl(preset.url);
                        setLocalFileInfo(null);
                        if (!title) setTitle(preset.title);
                        if (!subtitle) setSubtitle(preset.subtitle);
                      }}
                      className={`p-1.5 rounded-lg border text-[10px] font-semibold truncate transition-colors text-left ${
                        imageUrl === preset.url 
                          ? 'border-red-500 bg-red-50 text-red-700' 
                          : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Live Banner Preview */}
            {imageUrl && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 mb-1">
                  <span>Previsualización en Portada:</span>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-red-500 hover:text-red-700 text-[10px] font-medium inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Quitar foto</span>
                  </button>
                </div>
                <div className="rounded-xl overflow-hidden border border-stone-300 relative h-36 bg-stone-900 shadow-inner">
                  <img
                    src={imageUrl}
                    alt="Vista previa del banner"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-3 text-white">
                    <div className="space-y-0.5">
                      {badge && (
                        <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wide inline-block mb-0.5">
                          {badge}
                        </span>
                      )}
                      <h4 className="font-bold text-xs sm:text-sm drop-shadow-md text-white line-clamp-1">
                        {title || 'Título del Banner'}
                      </h4>
                      {subtitle && (
                        <p className="text-[10.5px] text-stone-200 drop-shadow-xs line-clamp-1">
                          {subtitle}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Destination (Target) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Al hacer clic, redirigir a:
              </label>
              <select
                value={targetType}
                onChange={(e) => {
                  const type = e.target.value as any;
                  setTargetType(type);
                  if (type === 'STORE') {
                    setTargetValue(stores[0]?.slug || stores[0]?.id || '');
                  } else if (type === 'CATEGORY') {
                    setTargetValue(categories[0]?.slug || categories[0]?.id || '');
                  } else if (type === 'PRODUCT') {
                    setTargetValue(products[0]?.id || '');
                  } else if (type === 'REGISTER_USER' || type === 'REGISTER_STORE') {
                    setTargetValue('');
                  } else {
                    setTargetValue('https://');
                  }
                }}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 outline-none focus:border-red-500 text-xs font-medium"
              >
                <option value="STORE">🏪 Tienda Oficial</option>
                <option value="CATEGORY">🏷️ Categoría de Catálogo</option>
                <option value="PRODUCT">📦 Producto Específico</option>
                <option value="REGISTER_USER">👤 Registro de Usuario</option>
                <option value="REGISTER_STORE">🏪 Registro de Tienda</option>
                <option value="URL">🌐 Enlace Externo (URL)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Destino Seleccionado
              </label>
              {targetType === 'STORE' ? (
                <select
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 outline-none focus:border-red-500 text-xs"
                >
                  {stores.map(s => (
                    <option key={s.id} value={s.slug || s.id}>
                      {s.name} ({s.province || 'Dominicana'})
                    </option>
                  ))}
                </select>
              ) : targetType === 'CATEGORY' ? (
                <select
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 outline-none focus:border-red-500 text-xs"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.slug || c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              ) : targetType === 'PRODUCT' ? (
                <select
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 outline-none focus:border-red-500 text-xs"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — RD$ {p.price.toLocaleString()}
                    </option>
                  ))}
                </select>
              ) : targetType === 'REGISTER_USER' ? (
                <div className="w-full p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-xs font-semibold">Dirige al registro de usuario</div>
              ) : targetType === 'REGISTER_STORE' ? (
                <div className="w-full p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">Dirige al registro de tienda</div>
              ) : (
                <input
                  type="url"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  placeholder="https://..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 outline-none focus:border-red-500 text-xs"
                />
              )}
            </div>
          </div>

          {/* Position Order & Active status */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Posición / Orden
              </label>
              <input
                type="number"
                min={1}
                max={99}
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 outline-none focus:border-red-500 text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Estado del Banner
              </label>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-full p-2 rounded-xl border text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                  isActive 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                    : 'bg-stone-100 border-stone-300 text-stone-500'
                }`}
              >
                <Check className={`w-3.5 h-3.5 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                <span>{isActive ? 'Activo (Visible)' : 'Pausado'}</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !imageUrl.trim()}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 text-xs"
            >
              {isSubmitting ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{bannerToEdit ? 'Guardar Cambios' : 'Crear Banner'}</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
