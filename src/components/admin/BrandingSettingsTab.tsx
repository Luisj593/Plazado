import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Palette, 
  Image as ImageIcon, 
  Upload, 
  Check, 
  RefreshCw, 
  Globe, 
  Sparkles, 
  AlertCircle, 
  Eye, 
  Monitor, 
  Smartphone, 
  Trash2,
  Lock,
  Search,
  ShoppingCart,
  Store
} from 'lucide-react';
import { PlazaDoLogo } from '../common/PlazaDoLogo';
import { DominicanFlag } from '../common/DominicanFlag';

export const BrandingSettingsTab: React.FC = () => {
  const { systemSettings, updateSystemSettings, showNotification } = useApp();

  // Local state for branding options
  const [logoType, setLogoType] = useState<'default' | 'custom'>(systemSettings.logoType || 'default');
  const [logoUrl, setLogoUrl] = useState<string>(systemSettings.logoUrl || '');
  const [logoDarkUrl, setLogoDarkUrl] = useState<string>(systemSettings.logoDarkUrl || '');
  const [useCustomDarkLogo, setUseCustomDarkLogo] = useState<boolean>(Boolean(systemSettings.logoDarkUrl));
  
  // Header / Hero commercial banner image state
  const [headerBannerType, setHeaderBannerType] = useState<'default' | 'custom'>(
    systemSettings.headerBannerType || (systemSettings.headerBannerUrl ? 'custom' : 'default')
  );
  const [headerBannerUrl, setHeaderBannerUrl] = useState<string>(systemSettings.headerBannerUrl || '');
  const [homeHeroMode, setHomeHeroMode] = useState<'header' | 'slider'>(systemSettings.homeHeroMode || 'slider');
  const [headerBannerError, setHeaderBannerError] = useState<string | null>(null);
  const [isDraggingHeaderBanner, setIsDraggingHeaderBanner] = useState(false);
  const headerBannerInputRef = useRef<HTMLInputElement>(null);

  const [faviconType, setFaviconType] = useState<'default' | 'custom'>(systemSettings.faviconType || 'default');
  const [faviconUrl, setFaviconUrl] = useState<string>(systemSettings.faviconUrl || '/dominican-flag.svg');

  const [isSaving, setIsSaving] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [faviconError, setFaviconError] = useState<string | null>(null);

  // Drag and drop states
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isDraggingLogoDark, setIsDraggingLogoDark] = useState(false);
  const [isDraggingFavicon, setIsDraggingFavicon] = useState(false);

  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoDarkInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // File processing helper (reads file to Base64 data URL)
  const processImageFile = (
    file: File, 
    onSuccess: (dataUrl: string) => void, 
    setError: (msg: string | null) => void,
    maxSizeMb: number = 2
  ) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido (PNG, SVG, JPG, WebP o ICO).');
      return;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      setError(`La imagen excede el límite recomendado de ${maxSizeMb} MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onSuccess(result);
        setError(null);
      }
    };
    reader.onerror = () => {
      setError('Ocurrió un error al procesar el archivo seleccionado.');
    };
    reader.readAsDataURL(file);
  };

  // Save changes to global system settings
  const handleSaveBranding = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setLogoError(null);
    setFaviconError(null);
    setHeaderBannerError(null);

    try {
      const cleanLogoUrl = logoType === 'custom' ? logoUrl.trim() : '';
      const cleanLogoDarkUrl = logoType === 'custom' && useCustomDarkLogo ? logoDarkUrl.trim() : '';
      const cleanHeaderBannerUrl = headerBannerType === 'custom' ? headerBannerUrl.trim() : '';
      const cleanFaviconUrl = faviconType === 'custom' 
        ? (faviconUrl.trim() || '/dominican-flag.svg') 
        : '/dominican-flag.svg';

      await updateSystemSettings({
        logoType,
        logoUrl: cleanLogoUrl,
        logoDarkUrl: cleanLogoDarkUrl,
        headerBannerType,
        headerBannerUrl: cleanHeaderBannerUrl,
        homeHeroMode,
        faviconType,
        faviconUrl: cleanFaviconUrl
      });

      showNotification('¡Identidad visual e imágenes del Header actualizadas con éxito!', 'success');
    } catch (err) {
      console.error('Error saving branding settings:', err);
      showNotification('Hubo un inconveniente al guardar la identidad visual', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default branding
  const handleResetToDefault = async () => {
    if (!window.confirm('¿Deseas restablecer el logo, el banner del header y el favicon a los valores oficiales predeterminados de PlazaDO?')) {
      return;
    }
    setIsSaving(true);
    try {
      setLogoType('default');
      setLogoUrl('');
      setLogoDarkUrl('');
      setUseCustomDarkLogo(false);
      setHeaderBannerType('default');
      setHeaderBannerUrl('');
      setHomeHeroMode('slider');
      setFaviconType('default');
      setFaviconUrl('/dominican-flag.svg');

      await updateSystemSettings({
        logoType: 'default',
        logoUrl: '',
        logoDarkUrl: '',
        headerBannerType: 'default',
        headerBannerUrl: '',
        homeHeroMode: 'slider',
        faviconType: 'default',
        faviconUrl: '/dominican-flag.svg'
      });

      showNotification('Identidad visual restablecida a los valores oficiales de PlazaDO.', 'info');
    } catch (err) {
      console.error('Error resetting branding:', err);
      showNotification('Error al restablecer la identidad visual', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Current effective logo image preview for testing
  const effectiveLightLogo = logoType === 'custom' && logoUrl ? logoUrl : null;
  const effectiveDarkLogo = logoType === 'custom' 
    ? (useCustomDarkLogo && logoDarkUrl ? logoDarkUrl : logoUrl) 
    : null;
  const effectiveHeaderBanner = headerBannerType === 'custom' && headerBannerUrl 
    ? headerBannerUrl 
    : 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&auto=format&fit=crop&q=80';

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-emerald-50 text-[#008f51] rounded-xl border border-emerald-100 shrink-0">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-stone-900">Configuración de Identidad Visual y Header</h2>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
                Super Admin
              </span>
            </div>
            <p className="text-stone-500 text-xs mt-0.5">
              Personaliza la imagen o logo del Header (desktop y móvil), la imagen principal de la cabecera / hero de la portada y el favicon de la plataforma.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <button
            type="button"
            id="btn-reset-branding-default"
            onClick={handleResetToDefault}
            disabled={isSaving}
            className="flex-1 md:flex-none px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restablecer Oficiales</span>
          </button>

          <button
            type="button"
            id="btn-save-branding-changes"
            onClick={() => handleSaveBranding()}
            disabled={isSaving}
            className="flex-1 md:flex-none px-5 py-2.5 bg-[#008f51] hover:bg-[#007a44] text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: LOGO & FAVICON CONFIGURATION (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* SECTION 1: LOGO / HEADER IMAGE CONFIGURATION */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#008f51]" />
                <h3 className="text-sm font-bold text-stone-900">1. Imagen / Logotipo del Header (Barra Superior)</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                logoType === 'custom' 
                  ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {logoType === 'custom' ? 'Imagen Personalizada Activa' : 'Logo Oficial Vectorial Activo'}
              </span>
            </div>

            {/* Mode selection radio / pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-select-logo-default"
                onClick={() => setLogoType('default')}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                  logoType === 'default'
                    ? 'border-[#008f51] bg-emerald-50/40 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">Logo Oficial Vectorial</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    logoType === 'default' ? 'border-[#008f51] bg-[#008f51] text-white' : 'border-stone-300'
                  }`}>
                    {logoType === 'default' && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
                <p className="text-[11px] text-stone-500">
                  Emblema oficial de PlazaDO en verde corporativo y tipografía moderna.
                </p>
                <div className="pt-2 border-t border-stone-200/60 flex items-center justify-center py-1">
                  <PlazaDoLogo variant="compact" forceDefault className="h-6 w-auto" />
                </div>
              </button>

              <button
                type="button"
                id="btn-select-logo-custom"
                onClick={() => setLogoType('custom')}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                  logoType === 'custom'
                    ? 'border-[#008f51] bg-emerald-50/40 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">Imagen / Logo Personalizado</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    logoType === 'custom' ? 'border-[#008f51] bg-[#008f51] text-white' : 'border-stone-300'
                  }`}>
                    {logoType === 'custom' && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
                <p className="text-[11px] text-stone-500">
                  Sube tu propio archivo o ingresa una URL de imagen para colocar en el Header.
                </p>
                <div className="pt-2 border-t border-stone-200/60 flex items-center justify-center py-1 text-stone-400">
                  <Upload className="w-4 h-4 mr-1 text-[#008f51]" />
                  <span className="text-[11px] font-semibold text-stone-600">Subir PNG, SVG o JPG</span>
                </div>
              </button>
            </div>

            {/* Custom Logo Form Fields */}
            {logoType === 'custom' && (
              <div className="space-y-4 pt-2 border-t border-stone-100">
                
                {/* Main Logo (Light Background / Header) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-stone-800">
                      Logo Principal (Fondo Claro - Barra Superior)
                    </label>
                    <span className="text-[11px] text-stone-400 font-medium">Recomendado: PNG o SVG transparente (450x100px)</span>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingLogo(true);
                    }}
                    onDragLeave={() => setIsDraggingLogo(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingLogo(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        processImageFile(file, (dataUrl) => setLogoUrl(dataUrl), setLogoError);
                      }
                    }}
                    onClick={() => logoInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                      isDraggingLogo 
                        ? 'border-[#008f51] bg-emerald-50' 
                        : 'border-stone-300 hover:border-[#008f51] bg-stone-50 hover:bg-stone-100/70'
                    }`}
                  >
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/svg+xml,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          processImageFile(file, (dataUrl) => setLogoUrl(dataUrl), setLogoError);
                        }
                      }}
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <div className="w-9 h-9 rounded-full bg-white shadow-2xs border border-stone-200 flex items-center justify-center text-[#008f51]">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-stone-700 text-xs">
                        Arrastra y suelta tu archivo de logo aquí, o haz clic para explorar
                      </span>
                      <span className="text-[11px] text-stone-400">
                        Soporta PNG, SVG, JPG o WebP (hasta 2 MB)
                      </span>
                    </div>
                  </div>

                  {/* URL Input Alternative */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="url"
                      id="input-logo-url"
                      placeholder="O pega una URL directa de imagen (https://.../logo.png)"
                      value={logoUrl}
                      onChange={(e) => {
                        setLogoUrl(e.target.value);
                        setLogoError(null);
                      }}
                      className="flex-1 p-2.5 bg-stone-50 border border-stone-300 rounded-lg outline-none text-xs focus:bg-white focus:border-[#008f51]"
                    />
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="p-2.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Limpiar imagen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {logoError && (
                    <div className="flex items-center gap-1.5 text-rose-600 text-[11px] font-medium bg-rose-50 p-2 rounded-lg border border-rose-200">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{logoError}</span>
                    </div>
                  )}
                </div>

                {/* Dark Background Logo (Optional for Footer / Dark Header) */}
                <div className="space-y-3 pt-3 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-800">Versión para Fondo Oscuro (Header Oscuro / Footer)</span>
                      <p className="text-[11px] text-stone-500">Logo en color blanco o claro para resaltar sobre fondos oscuros.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useCustomDarkLogo}
                        onChange={(e) => setUseCustomDarkLogo(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#008f51]"></div>
                    </label>
                  </div>

                  {useCustomDarkLogo && (
                    <div className="space-y-2 p-3.5 bg-stone-900 rounded-xl text-white">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-stone-300">Archivo o URL para Logo Fondo Oscuro:</span>
                        <button
                          type="button"
                          onClick={() => logoDarkInputRef.current?.click()}
                          className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Subir Imagen</span>
                        </button>
                      </div>

                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDraggingLogoDark(true);
                        }}
                        onDragLeave={() => setIsDraggingLogoDark(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDraggingLogoDark(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) {
                            processImageFile(file, (dataUrl) => setLogoDarkUrl(dataUrl), setLogoError);
                          }
                        }}
                        onClick={() => logoDarkInputRef.current?.click()}
                        className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                          isDraggingLogoDark ? 'border-emerald-400 bg-stone-800' : 'border-stone-700 hover:border-stone-500 bg-stone-800/60'
                        }`}
                      >
                        <input
                          ref={logoDarkInputRef}
                          type="file"
                          accept="image/png,image/svg+xml,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              processImageFile(file, (dataUrl) => setLogoDarkUrl(dataUrl), setLogoError);
                            }
                          }}
                        />
                        <span className="text-[11px] text-stone-300">
                          Arrastra aquí el logo blanco/claro, o haz clic para subir
                        </span>
                      </div>

                      <input
                        type="url"
                        placeholder="O URL directa de logo para fondo oscuro (ej: https://.../logo-white.png)"
                        value={logoDarkUrl}
                        onChange={(e) => setLogoDarkUrl(e.target.value)}
                        className="w-full p-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-xs outline-none focus:border-[#008f51]"
                      />
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* SECTION 2: HERO / HEADER COMMERCIAL BANNER IMAGE */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#008f51]" />
                <h3 className="text-sm font-bold text-stone-900">2. Imagen Principal del Hero / Cabecera de la Portada</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                headerBannerType === 'custom' && headerBannerUrl
                  ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {headerBannerType === 'custom' && headerBannerUrl ? 'Imagen Personalizada Activa' : 'Imagen Comercial Oficial Activa'}
              </span>
            </div>

            <p className="text-[11px] text-stone-500 leading-relaxed">
              Esta es la fotografía comercial destacada que se muestra a la derecha en la sección Hero / Cabecera de la portada de Plazado.com.
            </p>

            <div className="space-y-2">
              <span className="font-bold text-stone-800">Contenido de la cabecera de inicio</span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="btn-hero-mode-header"
                  onClick={() => setHomeHeroMode('header')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${homeHeroMode === 'header' ? 'border-[#f20544] bg-rose-50 ring-2 ring-rose-500/20' : 'border-stone-200 bg-stone-50 hover:border-stone-300'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-stone-900">Cabecera</span>
                    {homeHeroMode === 'header' && <Check className="w-4 h-4 text-[#f20544]" />}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">Muestra la imagen fija configurada para el Hero.</p>
                </button>
                <button
                  type="button"
                  id="btn-hero-mode-slider"
                  onClick={() => setHomeHeroMode('slider')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${homeHeroMode === 'slider' ? 'border-[#f20544] bg-rose-50 ring-2 ring-rose-500/20' : 'border-stone-200 bg-stone-50 hover:border-stone-300'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-stone-900">Slider de productos</span>
                    {homeHeroMode === 'slider' && <Check className="w-4 h-4 text-[#f20544]" />}
                  </div>
                  <p className="text-[11px] text-stone-500 mt-1">Rota automáticamente productos reales publicados.</p>
                </button>
              </div>
              <p className="text-[10px] text-stone-400">Pulsa “Guardar Cambios” para aplicar la opción elegida a la portada.</p>
            </div>

            {/* Mode selection radio / pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-select-header-banner-default"
                onClick={() => {
                  setHeaderBannerType('default');
                  setHeaderBannerUrl('');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                  headerBannerType === 'default' || !headerBannerUrl
                    ? 'border-[#008f51] bg-emerald-50/40 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">Fotografía Oficial de Compras</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    headerBannerType === 'default' || !headerBannerUrl ? 'border-[#008f51] bg-[#008f51] text-white' : 'border-stone-300'
                  }`}>
                    {(headerBannerType === 'default' || !headerBannerUrl) && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
                <p className="text-[11px] text-stone-500">
                  Foto comercial de alta resolución con compradora y bolsas de compras en RD.
                </p>
                <div className="pt-2 border-t border-stone-200/60 flex items-center justify-center py-1">
                  <span className="text-[10px] font-semibold text-emerald-700">Preconfigurada</span>
                </div>
              </button>

              <button
                type="button"
                id="btn-select-header-banner-custom"
                onClick={() => setHeaderBannerType('custom')}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                  headerBannerType === 'custom' && headerBannerUrl
                    ? 'border-[#008f51] bg-emerald-50/40 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">Imagen Personalizada</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    headerBannerType === 'custom' && headerBannerUrl ? 'border-[#008f51] bg-[#008f51] text-white' : 'border-stone-300'
                  }`}>
                    {headerBannerType === 'custom' && headerBannerUrl && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
                <p className="text-[11px] text-stone-500">
                  Sube tu propio archivo de imagen o ingresa una URL web para el Hero.
                </p>
                <div className="pt-2 border-t border-stone-200/60 flex items-center justify-center py-1 text-stone-400">
                  <Upload className="w-4 h-4 mr-1 text-[#008f51]" />
                  <span className="text-[11px] font-semibold text-stone-600">Subir PNG, JPG o WebP</span>
                </div>
              </button>
            </div>

            {/* Custom Banner Form Fields */}
            {headerBannerType === 'custom' && (
              <div className="space-y-4 pt-2 border-t border-stone-100">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-stone-800">
                      Archivo o URL de la Imagen del Hero / Cabecera
                    </label>
                    <span className="text-[11px] text-stone-400 font-medium">Recomendado: 900x700px (JPG/WebP/PNG)</span>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingHeaderBanner(true);
                    }}
                    onDragLeave={() => setIsDraggingHeaderBanner(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingHeaderBanner(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        processImageFile(file, (dataUrl) => setHeaderBannerUrl(dataUrl), setHeaderBannerError, 4);
                      }
                    }}
                    onClick={() => headerBannerInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                      isDraggingHeaderBanner 
                        ? 'border-[#008f51] bg-emerald-50' 
                        : 'border-stone-300 hover:border-[#008f51] bg-stone-50 hover:bg-stone-100/70'
                    }`}
                  >
                    <input
                      ref={headerBannerInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          processImageFile(file, (dataUrl) => setHeaderBannerUrl(dataUrl), setHeaderBannerError, 4);
                        }
                      }}
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <div className="w-9 h-9 rounded-full bg-white shadow-2xs border border-stone-200 flex items-center justify-center text-[#008f51]">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-stone-700 text-xs">
                        Arrastra tu imagen para el Hero / Cabecera aquí, o haz clic para explorar
                      </span>
                      <span className="text-[11px] text-stone-400">
                        Soporta JPG, WebP o PNG (hasta 4 MB)
                      </span>
                    </div>
                  </div>

                  {/* URL Input */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="url"
                      id="input-header-banner-url"
                      placeholder="O pega una URL directa de imagen (https://.../banner.jpg)"
                      value={headerBannerUrl}
                      onChange={(e) => {
                        setHeaderBannerUrl(e.target.value);
                        setHeaderBannerError(null);
                      }}
                      className="flex-1 p-2.5 bg-stone-50 border border-stone-300 rounded-lg outline-none text-xs focus:bg-white focus:border-[#008f51]"
                    />
                    {headerBannerUrl && (
                      <button
                        type="button"
                        onClick={() => setHeaderBannerUrl('')}
                        className="p-2.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Limpiar imagen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {headerBannerError && (
                    <div className="flex items-center gap-1.5 text-rose-600 text-[11px] font-medium bg-rose-50 p-2 rounded-lg border border-rose-200">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{headerBannerError}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: FAVICON CONFIGURATION */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#008f51]" />
                <h3 className="text-sm font-bold text-stone-900">3. Favicon del Navegador (Pestaña)</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                faviconType === 'custom' 
                  ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {faviconType === 'custom' ? 'Favicon Personalizado' : 'Bandera Dominicana Oficial'}
              </span>
            </div>

            {/* Mode selection radio / pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-select-favicon-default"
                onClick={() => {
                  setFaviconType('default');
                  setFaviconUrl('/dominican-flag.svg');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                  faviconType === 'default'
                    ? 'border-[#008f51] bg-emerald-50/40 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">Predeterminado (Bandera RD)</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    faviconType === 'default' ? 'border-[#008f51] bg-[#008f51] text-white' : 'border-stone-300'
                  }`}>
                    {faviconType === 'default' && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
                <p className="text-[11px] text-stone-500">
                  Icono nacional de la Bandera Dominicana oficial de la República Dominicana.
                </p>
                <div className="pt-2 border-t border-stone-200/60 flex items-center justify-center py-1">
                  <div className="w-7 h-5 shadow-xs rounded-sm overflow-hidden border border-stone-200">
                    <DominicanFlag size="custom" className="w-full h-full object-cover" />
                  </div>
                </div>
              </button>

              <button
                type="button"
                id="btn-select-favicon-custom"
                onClick={() => setFaviconType('custom')}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                  faviconType === 'custom'
                    ? 'border-[#008f51] bg-emerald-50/40 ring-2 ring-emerald-500/20'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">Favicon Personalizado</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    faviconType === 'custom' ? 'border-[#008f51] bg-[#008f51] text-white' : 'border-stone-300'
                  }`}>
                    {faviconType === 'custom' && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
                <p className="text-[11px] text-stone-500">
                  Sube un archivo .ico, .png, o .svg cuadrado o ingresa una URL web.
                </p>
                <div className="pt-2 border-t border-stone-200/60 flex items-center justify-center py-1 text-stone-400">
                  <Upload className="w-4 h-4 mr-1 text-[#008f51]" />
                  <span className="text-[11px] font-semibold text-stone-600">Subir ICO, PNG o SVG</span>
                </div>
              </button>
            </div>

            {/* Custom Favicon Form Fields */}
            {faviconType === 'custom' && (
              <div className="space-y-3 pt-2 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-stone-800">
                    Archivo o URL del Favicon
                  </label>
                  <span className="text-[11px] text-stone-400 font-medium">Recomendado: 32x32px o 64x64px cuadrado</span>
                </div>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFavicon(true);
                  }}
                  onDragLeave={() => setIsDraggingFavicon(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFavicon(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      processImageFile(file, (dataUrl) => setFaviconUrl(dataUrl), setFaviconError, 1);
                    }
                  }}
                  onClick={() => faviconInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    isDraggingFavicon 
                      ? 'border-[#008f51] bg-emerald-50' 
                      : 'border-stone-300 hover:border-[#008f51] bg-stone-50 hover:bg-stone-100/70'
                  }`}
                >
                  <input
                    ref={faviconInputRef}
                    type="file"
                    accept="image/x-icon,image/png,image/svg+xml,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        processImageFile(file, (dataUrl) => setFaviconUrl(dataUrl), setFaviconError, 1);
                      }
                    }}
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="w-8 h-8 rounded-full bg-white shadow-2xs border border-stone-200 flex items-center justify-center text-[#008f51]">
                      <Globe className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-stone-700 text-xs">
                      Arrastra y suelta tu archivo de favicon (.png, .ico, .svg)
                    </span>
                    <span className="text-[11px] text-stone-400">
                      Recomendado formato cuadrado con fondo transparente
                    </span>
                  </div>
                </div>

                {/* URL Input Alternative */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="url"
                    id="input-favicon-url"
                    placeholder="O pega una URL directa de favicon (https://.../favicon.ico)"
                    value={faviconUrl}
                    onChange={(e) => {
                      setFaviconUrl(e.target.value);
                      setFaviconError(null);
                    }}
                    className="flex-1 p-2.5 bg-stone-50 border border-stone-300 rounded-lg outline-none text-xs focus:bg-white focus:border-[#008f51]"
                  />
                  {faviconUrl && (
                    <button
                      type="button"
                      onClick={() => setFaviconUrl('/dominican-flag.svg')}
                      className="p-2.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Restablecer a bandera"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {faviconError && (
                  <div className="flex items-center gap-1.5 text-rose-600 text-[11px] font-medium bg-rose-50 p-2 rounded-lg border border-rose-200">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{faviconError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: LIVE REAL-TIME SIMULATORS & PREVIEWS (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">

          <div className="bg-stone-900 text-white rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-stone-300">
                  Simulador en Tiempo Real
                </h3>
              </div>
              <span className="text-[10px] text-emerald-300 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full font-bold">
                Vista Previa en Vivo
              </span>
            </div>

            {/* PREVIEW 1: MOCK BROWSER TAB (Favicon Simulation) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-stone-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pestaña del Navegador (Favicon):</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Chrome / Safari</span>
              </div>

              {/* Mock Browser Window */}
              <div className="bg-stone-800/90 rounded-xl border border-stone-700/80 overflow-hidden shadow-md">
                {/* Browser Tab Header */}
                <div className="bg-stone-950 px-3 pt-2.5 pb-0 flex items-center gap-2 border-b border-stone-800">
                  <div className="flex items-center gap-1.5 pr-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
                  </div>

                  {/* Active Tab */}
                  <div className="bg-stone-800 text-stone-200 px-3 py-1.5 rounded-t-lg text-[11px] font-medium flex items-center gap-2 border-t border-x border-stone-700 shadow-sm max-w-[240px] truncate">
                    {/* Render Favicon */}
                    {faviconType === 'custom' && faviconUrl ? (
                      <img 
                        src={faviconUrl} 
                        alt="Favicon" 
                        className="w-4 h-4 object-contain rounded-xs shrink-0"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-4 h-3 rounded-xs overflow-hidden shrink-0 border border-stone-600">
                        <DominicanFlag size="custom" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <span className="truncate font-semibold text-stone-100">
                      PlazaDO.com – Todo en un solo lugar
                    </span>
                  </div>
                </div>

                {/* Address Bar */}
                <div className="bg-stone-900 px-3 py-1.5 flex items-center gap-2 border-b border-stone-800 text-[11px] text-stone-400">
                  <div className="bg-stone-950/80 flex-1 px-3 py-1 rounded-md flex items-center gap-1.5 border border-stone-800 font-mono text-[10px]">
                    <Lock className="w-3 h-3 text-emerald-400" />
                    <span className="text-stone-300">https://plazado.com</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PREVIEW 2: HEADER NAVBAR PREVIEW (Light Background) */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-[11px] text-stone-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                  <span>En Header (Fondo Blanco / Claro):</span>
                </span>
                <span className="text-[10px] text-stone-400">Barra Superior</span>
              </div>

              <div className="bg-white rounded-xl border border-stone-200 p-3 shadow-sm text-stone-900 space-y-2">
                <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2.5">
                  {/* Logo in light background */}
                  <div className="h-8 flex items-center">
                    {effectiveLightLogo ? (
                      <img 
                        src={effectiveLightLogo} 
                        alt="Logo Preview" 
                        className="max-h-8 max-w-[140px] object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-lg bg-[#008f51] flex items-center justify-center text-white shrink-0">
                          <ShoppingCart className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="font-black text-sm tracking-tight text-slate-900">
                          Plazado<span className="text-[#008f51]">.com</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Mock Search input */}
                  <div className="hidden sm:flex flex-1 max-w-[150px] bg-stone-100 rounded-lg px-2 py-1 items-center gap-1 text-[10px] text-stone-400">
                    <Search className="w-3 h-3 text-stone-400" />
                    <span className="truncate">¿Qué estás buscando?</span>
                  </div>

                  {/* Mock Actions */}
                  <div className="flex items-center gap-1.5 text-stone-700">
                    <div className="p-1 rounded-md bg-stone-100">
                      <Store className="w-3.5 h-3.5 text-[#008f51]" />
                    </div>
                    <div className="p-1 rounded-md bg-emerald-50 text-[#008f51]">
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-stone-500 text-center font-medium">
                  {logoType === 'custom' && effectiveLightLogo ? 'Mostrando tu imagen personalizada en el Header' : 'Mostrando diseño oficial de Plazado.com'}
                </div>
              </div>
            </div>

            {/* PREVIEW 3: HERO COMMERCIAL BANNER PREVIEW */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-[11px] text-stone-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>En Hero / Cabecera de la Portada:</span>
                </span>
                <span className="text-[10px] text-stone-400">Zona Derecha</span>
              </div>

              <div className="relative rounded-xl overflow-hidden border border-stone-700 h-32 bg-stone-800 group">
                <img 
                  src={effectiveHeaderBanner} 
                  alt="Hero Preview" 
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white font-bold">
                  <span className="bg-stone-900/80 px-2 py-0.5 rounded backdrop-blur-xs">
                    {headerBannerType === 'custom' && headerBannerUrl ? 'Imagen Personalizada' : 'Imagen Oficial'}
                  </span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Visible en Portada
                  </span>
                </div>
              </div>
            </div>

            {/* PREVIEW 4: FOOTER PREVIEW (Dark Background) */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-[11px] text-stone-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                  <span>En Pie de Página (Fondo Oscuro):</span>
                </span>
                <span className="text-[10px] text-stone-400">Footer Oficial</span>
              </div>

              <div className="bg-stone-950 rounded-xl border border-stone-800 p-3.5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  {/* Logo in dark background */}
                  <div className="h-8 flex items-center">
                    {effectiveDarkLogo ? (
                      <img 
                        src={effectiveDarkLogo} 
                        alt="Dark Logo Preview" 
                        className="max-h-8 max-w-[150px] object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-lg bg-[#008f51] flex items-center justify-center text-white shrink-0">
                          <ShoppingCart className="w-3 h-3 text-white" />
                        </div>
                        <span className="font-black text-sm tracking-tight text-white">
                          Plazado<span className="text-[#008f51]">.com</span>
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-stone-500">© 2026 PlazaDO.com</span>
                </div>
                <p className="text-[10px] text-stone-400 leading-relaxed">
                  El marketplace multi-vendedor de la República Dominicana.
                </p>
              </div>
            </div>

            {/* Quick Tips Box */}
            <div className="pt-2 border-t border-stone-800 space-y-1.5 text-[11px] text-stone-400">
              <div className="flex items-center gap-1.5 text-amber-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Impacto en la Plataforma:</span>
              </div>
              <p className="text-[10px] text-stone-400 leading-normal">
                Al guardar, la configuración se sincroniza de forma inmediata en la base de datos central de PlazaDO. Todos los clientes, tiendas y administradores verán la nueva imagen al instante en desktop y móvil.
              </p>
            </div>

          </div>

          {/* Quick Presets / Samples Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-3 text-xs">
            <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#008f51]" />
              <span>Ejemplos Listos para Probar</span>
            </h4>
            <p className="text-[11px] text-stone-500">
              Si deseas probar cómo se comporta la plataforma con imágenes externas, puedes aplicar cualquiera de estos ejemplos con un solo clic:
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setLogoType('custom');
                  setLogoUrl('https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&auto=format&fit=crop&q=80');
                  setHeaderBannerType('custom');
                  setHeaderBannerUrl('https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&auto=format&fit=crop&q=80');
                  setFaviconType('custom');
                  setFaviconUrl('https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=64&auto=format&fit=crop&q=80');
                  showNotification('Ejemplo comercial cargado en el formulario. Haz clic en "Guardar Cambios" para aplicar.', 'info');
                }}
                className="w-full p-2.5 bg-stone-50 hover:bg-emerald-50 text-stone-800 hover:text-emerald-800 rounded-xl border border-stone-200 text-left font-semibold transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Muestra: Comercio & Tienda General</span>
                <span className="text-[10px] text-[#008f51] font-bold">Cargar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLogoType('default');
                  setLogoUrl('');
                  setHeaderBannerType('default');
                  setHeaderBannerUrl('');
                  setFaviconType('default');
                  setFaviconUrl('/dominican-flag.svg');
                  showNotification('Valores oficiales cargados en el formulario.', 'info');
                }}
                className="w-full p-2.5 bg-stone-50 hover:bg-stone-100 text-stone-800 rounded-xl border border-stone-200 text-left font-semibold transition-colors flex items-center justify-between cursor-pointer"
              >
                <span>Muestra: Oficial PlazaDO (Vectorial)</span>
                <span className="text-[10px] text-stone-500 font-bold">Oficial</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
