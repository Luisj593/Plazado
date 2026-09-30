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

    try {
      const cleanLogoUrl = logoType === 'custom' ? logoUrl.trim() : '';
      const cleanLogoDarkUrl = logoType === 'custom' && useCustomDarkLogo ? logoDarkUrl.trim() : '';
      const cleanFaviconUrl = faviconType === 'custom' 
        ? (faviconUrl.trim() || '/dominican-flag.svg') 
        : '/dominican-flag.svg';

      await updateSystemSettings({
        logoType,
        logoUrl: cleanLogoUrl,
        logoDarkUrl: cleanLogoDarkUrl,
        faviconType,
        faviconUrl: cleanFaviconUrl
      });

      showNotification('¡Identidad visual (Logo y Favicon) actualizada con éxito en toda la plataforma!', 'success');
    } catch (err) {
      console.error('Error saving branding settings:', err);
      showNotification('Hubo un inconveniente al guardar la identidad visual', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default branding
  const handleResetToDefault = async () => {
    if (!window.confirm('¿Deseas restablecer el logo y el favicon a los valores oficiales predeterminados de PlazaDO?')) {
      return;
    }
    setIsSaving(true);
    try {
      setLogoType('default');
      setLogoUrl('');
      setLogoDarkUrl('');
      setUseCustomDarkLogo(false);
      setFaviconType('default');
      setFaviconUrl('/dominican-flag.svg');

      await updateSystemSettings({
        logoType: 'default',
        logoUrl: '',
        logoDarkUrl: '',
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

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 shrink-0">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-stone-900">Configuración de Identidad Visual y Marca</h2>
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[11px] font-bold rounded-full">
                Super Admin
              </span>
            </div>
            <p className="text-stone-500 text-xs mt-0.5">
              Personaliza el logotipo comercial de PlazaDO (para cabecera y pie de página) y el favicon de la pestaña del navegador para toda la plataforma.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <button
            type="button"
            id="btn-reset-branding-default"
            onClick={handleResetToDefault}
            disabled={isSaving}
            className="flex-1 md:flex-none px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Restablecer Oficiales</span>
          </button>

          <button
            type="button"
            id="btn-save-branding-changes"
            onClick={() => handleSaveBranding()}
            disabled={isSaving}
            className="flex-1 md:flex-none px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Guardar Identidad Visual</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: LOGO & FAVICON CONFIGURATION (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* SECTION 1: LOGO CONFIGURATION */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-red-600" />
                <h3 className="text-sm font-bold text-stone-900">1. Logotipo de la Plataforma</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                logoType === 'custom' 
                  ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {logoType === 'custom' ? 'Logo Personalizado Activo' : 'Logo Oficial Vectorial Activo'}
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
                    ? 'border-red-600 bg-red-50/50 ring-2 ring-red-500/20'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">Logo Oficial Vectorial</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    logoType === 'default' ? 'border-red-600 bg-red-600 text-white' : 'border-stone-300'
                  }`}>
                    {logoType === 'default' && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
                <p className="text-[11px] text-stone-500">
                  Emblema oficial de PlazaDO con tipografía corporativa y shopping bag con sonrisa.
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
                    ? 'border-red-600 bg-red-50/50 ring-2 ring-red-500/20'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">Logotipo Personalizado</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    logoType === 'custom' ? 'border-red-600 bg-red-600 text-white' : 'border-stone-300'
                  }`}>
                    {logoType === 'custom' && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
                <p className="text-[11px] text-stone-500">
                  Sube tu propio archivo de imagen corporativo o especifica una URL externa.
                </p>
                <div className="pt-2 border-t border-stone-200/60 flex items-center justify-center py-1 text-stone-400">
                  <Upload className="w-4 h-4 mr-1 text-red-500" />
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
                        ? 'border-red-500 bg-red-50' 
                        : 'border-stone-300 hover:border-red-400 bg-stone-50 hover:bg-stone-100/70'
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
                      <div className="w-9 h-9 rounded-full bg-white shadow-2xs border border-stone-200 flex items-center justify-center text-red-600">
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
                      className="flex-1 p-2.5 bg-stone-50 border border-stone-300 rounded-lg outline-none text-xs focus:bg-white focus:border-red-500"
                    />
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="p-2.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Limpiar imagen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {logoError && (
                    <div className="flex items-center gap-1.5 text-red-600 text-[11px] font-medium bg-red-50 p-2 rounded-lg border border-red-200">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{logoError}</span>
                    </div>
                  )}
                </div>

                {/* Dark Background Logo (Optional for Footer) */}
                <div className="space-y-3 pt-3 border-t border-stone-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-800">Versión para Fondo Oscuro (Pie de Página)</span>
                      <p className="text-[11px] text-stone-500">Logo en color blanco o claro para resaltar sobre el fondo oscuro del footer.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useCustomDarkLogo}
                        onChange={(e) => setUseCustomDarkLogo(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>

                  {useCustomDarkLogo && (
                    <div className="space-y-2 p-3.5 bg-stone-900 rounded-xl text-white">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-stone-300">Archivo o URL para Logo Fondo Oscuro:</span>
                        <button
                          type="button"
                          onClick={() => logoDarkInputRef.current?.click()}
                          className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
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
                          isDraggingLogoDark ? 'border-red-400 bg-stone-800' : 'border-stone-700 hover:border-stone-500 bg-stone-800/60'
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
                        className="w-full p-2 bg-stone-800 border border-stone-700 rounded-lg text-white text-xs outline-none focus:border-red-500"
                      />
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* SECTION 2: FAVICON CONFIGURATION */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-red-600" />
                <h3 className="text-sm font-bold text-stone-900">2. Favicon del Navegador</h3>
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
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                  faviconType === 'default'
                    ? 'border-red-600 bg-red-50/50 ring-2 ring-red-500/20'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">Predeterminado (Bandera RD)</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    faviconType === 'default' ? 'border-red-600 bg-red-600 text-white' : 'border-stone-300'
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
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                  faviconType === 'custom'
                    ? 'border-red-600 bg-red-50/50 ring-2 ring-red-500/20'
                    : 'border-stone-200 hover:border-stone-300 bg-stone-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-stone-900">Favicon Personalizado</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    faviconType === 'custom' ? 'border-red-600 bg-red-600 text-white' : 'border-stone-300'
                  }`}>
                    {faviconType === 'custom' && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
                <p className="text-[11px] text-stone-500">
                  Sube un archivo .ico, .png, o .svg cuadrado o ingresa una URL web.
                </p>
                <div className="pt-2 border-t border-stone-200/60 flex items-center justify-center py-1 text-stone-400">
                  <Upload className="w-4 h-4 mr-1 text-red-500" />
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
                      ? 'border-red-500 bg-red-50' 
                      : 'border-stone-300 hover:border-red-400 bg-stone-50 hover:bg-stone-100/70'
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
                    <div className="w-8 h-8 rounded-full bg-white shadow-2xs border border-stone-200 flex items-center justify-center text-red-600">
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
                    className="flex-1 p-2.5 bg-stone-50 border border-stone-300 rounded-lg outline-none text-xs focus:bg-white focus:border-red-500"
                  />
                  {faviconUrl && (
                    <button
                      type="button"
                      onClick={() => setFaviconUrl('/dominican-flag.svg')}
                      className="p-2.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Restablecer a bandera"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {faviconError && (
                  <div className="flex items-center gap-1.5 text-red-600 text-[11px] font-medium bg-red-50 p-2 rounded-lg border border-red-200">
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
                <Eye className="w-4 h-4 text-red-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-stone-300">
                  Simulador en Tiempo Real
                </h3>
              </div>
              <span className="text-[10px] text-stone-400 bg-stone-800 px-2 py-0.5 rounded-full">
                Vista Previa Interactiva
              </span>
            </div>

            {/* PREVIEW 1: MOCK BROWSER TAB (Favicon Simulation) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-stone-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-red-400" />
                  <span>Pestaña del Navegador (Favicon):</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Chrome / Safari</span>
              </div>

              {/* Mock Browser Window */}
              <div className="bg-stone-800/90 rounded-xl border border-stone-700/80 overflow-hidden shadow-md">
                {/* Browser Tab Header */}
                <div className="bg-stone-950 px-3 pt-2.5 pb-0 flex items-center gap-2 border-b border-stone-800">
                  <div className="flex items-center gap-1.5 pr-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
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
                  <Monitor className="w-3.5 h-3.5 text-red-400" />
                  <span>En Barra Superior (Fondo Blanco):</span>
                </span>
                <span className="text-[10px] text-stone-400">Navbar Principal</span>
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
                      <PlazaDoLogo variant="compact" forceDefault className="h-7 w-auto" />
                    )}
                  </div>

                  {/* Mock Search input */}
                  <div className="hidden sm:flex flex-1 max-w-[150px] bg-stone-100 rounded-lg px-2 py-1 items-center gap-1 text-[10px] text-stone-400">
                    <Search className="w-3 h-3 text-stone-400" />
                    <span className="truncate">Buscar productos...</span>
                  </div>

                  {/* Mock Actions */}
                  <div className="flex items-center gap-1.5 text-stone-700">
                    <div className="p-1 rounded-md bg-stone-100">
                      <Store className="w-3.5 h-3.5 text-red-600" />
                    </div>
                    <div className="p-1 rounded-md bg-red-50 text-red-600">
                      <ShoppingCart className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-stone-400 text-center font-medium">
                  {logoType === 'custom' && effectiveLightLogo ? 'Mostrando tu imagen personalizada' : 'Mostrando logo vectorial oficial de PlazaDO'}
                </div>
              </div>
            </div>

            {/* PREVIEW 3: FOOTER PREVIEW (Dark Background) */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-[11px] text-stone-400 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-red-400" />
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
                      <PlazaDoLogo variant="compact" inverted forceDefault className="h-7 w-auto" />
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
                Al guardar, la configuración se sincroniza de forma inmediata en la base de datos central de PlazaDO. Todos los clientes, tiendas y administradores verán la nueva imagen al instante.
              </p>
            </div>

          </div>

          {/* Quick Presets / Samples Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-3 text-xs">
            <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-red-600" />
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
                  setFaviconType('custom');
                  setFaviconUrl('https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=64&auto=format&fit=crop&q=80');
                  showNotification('Ejemplo comercial cargado en el formulario. Haz clic en "Guardar Identidad Visual" para aplicar.', 'info');
                }}
                className="w-full p-2.5 bg-stone-50 hover:bg-red-50 text-stone-800 hover:text-red-700 rounded-xl border border-stone-200 text-left font-semibold transition-colors flex items-center justify-between"
              >
                <span>Muestra: Comercio & Tienda General</span>
                <span className="text-[10px] text-red-600 font-bold">Cargar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLogoType('default');
                  setLogoUrl('');
                  setFaviconType('default');
                  setFaviconUrl('/dominican-flag.svg');
                  showNotification('Valores oficiales cargados en el formulario.', 'info');
                }}
                className="w-full p-2.5 bg-stone-50 hover:bg-stone-100 text-stone-800 rounded-xl border border-stone-200 text-left font-semibold transition-colors flex items-center justify-between"
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
