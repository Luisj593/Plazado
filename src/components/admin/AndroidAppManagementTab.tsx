import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Smartphone, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  FileCheck, 
  Trash2, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  QrCode,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { AndroidAppConfig } from '../../types';
import { triggerFileDownload } from '../../utils/fileDownloader';

export const AndroidAppManagementTab: React.FC = () => {
  const { systemSettings, updateSystemSettings, showNotification } = useApp();

  const appConfig: AndroidAppConfig = systemSettings.androidApp || {
    isEnabled: true,
    appName: 'PlazaDO Marketplace RD',
    versionName: '1.0.4',
    versionCode: 104,
    releaseDate: new Date().toISOString().split('T')[0],
    apkFileName: 'PlazaDO-v1.0.4.apk',
    apkFileSize: '18.6 MB',
    minAndroidVersion: 'Android 8.0 (Oreo) o superior',
    packageName: 'com.plazado.marketplace',
    releaseNotes: 'Versión oficial de PlazaDO.com para dispositivos Android. Búsqueda por tiendas, carrito integrado y confirmación segura de entregas con código secreto.',
    downloadCount: 312
  };

  const [isEnabled, setIsEnabled] = useState(appConfig.isEnabled);
  const [appName, setAppName] = useState(appConfig.appName);
  const [versionName, setVersionName] = useState(appConfig.versionName);
  const [versionCode, setVersionCode] = useState(appConfig.versionCode);
  const [minAndroidVersion, setMinAndroidVersion] = useState(appConfig.minAndroidVersion);
  const [packageName, setPackageName] = useState(appConfig.packageName);
  const [releaseNotes, setReleaseNotes] = useState(appConfig.releaseNotes);
  const [releaseDate, setReleaseDate] = useState(appConfig.releaseDate);

  const [uploadMode, setUploadMode] = useState<'local' | 'url'>(
    appConfig.apkUrl && !appConfig.apkUrl.startsWith('data:') ? 'url' : 'local'
  );
  const [apkUrl, setApkUrl] = useState(appConfig.apkUrl || '');
  const [apkFileName, setApkFileName] = useState(appConfig.apkFileName || '');
  const [apkFileSize, setApkFileSize] = useState(appConfig.apkFileSize || '');
  
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processApkFile = (file: File) => {
    setFileError(null);

    // Validate extension
    const isApk = file.name.toLowerCase().endsWith('.apk') || 
                  file.type === 'application/vnd.android.package-archive' ||
                  file.type === 'application/octet-stream';

    if (!isApk && !file.name.toLowerCase().endsWith('.apk')) {
      setFileError('Solo se admiten paquetes de instalación de Android (.apk).');
      return;
    }

    // Limit to 80MB for browser local storage safety
    if (file.size > 80 * 1024 * 1024) {
      setFileError('El archivo APK excede el límite máximo de 80 MB. Si tu APK es mayor, utiliza la opción "Enlace URL directo".');
      return;
    }

    setIsProcessingFile(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setApkUrl(result);
        setApkFileName(file.name);
        const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
        setApkFileSize(`${sizeMb} MB`);
        setIsProcessingFile(false);
        showNotification(`Archivo APK "${file.name}" (${sizeMb} MB) procesado exitosamente.`);
      }
    };
    reader.onerror = () => {
      setFileError('Ocurrió un error al leer el archivo APK desde el almacenamiento local.');
      setIsProcessingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processApkFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processApkFile(e.target.files[0]);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const newConfig: AndroidAppConfig = {
      isEnabled,
      appName: appName.trim() || 'PlazaDO Marketplace RD',
      versionName: versionName.trim() || '1.0.0',
      versionCode: Number(versionCode) || 1,
      releaseDate: releaseDate || new Date().toISOString().split('T')[0],
      apkUrl: apkUrl.trim() || undefined,
      apkFileName: apkFileName.trim() || `PlazaDO-v${versionName}.apk`,
      apkFileSize: apkFileSize.trim() || '18.6 MB',
      minAndroidVersion: minAndroidVersion.trim() || 'Android 8.0+',
      packageName: packageName.trim() || 'com.plazado.marketplace',
      releaseNotes: releaseNotes.trim(),
      downloadCount: appConfig.downloadCount || 0
    };

    await updateSystemSettings({
      androidApp: newConfig
    });

    setIsSaving(false);
    showNotification('Configuración de la Aplicación Android (APK) guardada exitosamente.');
  };

  const handleTestDownload = () => {
    if (apkUrl) {
      triggerFileDownload(apkUrl, apkFileName || `PlazaDO-v${versionName}.apk`);
      showNotification(`Descargando ${apkFileName || 'archivo APK'}...`);
    } else {
      showNotification('Aún no has cargado un archivo APK o enlace de descarga.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-stone-900">
                Distribución de Aplicación Android (Archivo APK)
              </h2>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                isEnabled ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-stone-100 text-stone-600'
              }`}>
                {isEnabled ? 'Disponible para Clientes' : 'Descargas Pausadas'}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Sube el instalador APK para que los usuarios puedan instalar directamente la aplicación de PlazaDO en sus teléfonos móviles Android sin depender exclusivamente de Google Play.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleTestDownload}
            disabled={!apkUrl}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Probar Descarga</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-extrabold text-sm text-stone-900 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Parámetros de la Versión Android</span>
              </h3>

              {/* Status Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-bold text-stone-700">Habilitar descarga pública:</span>
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
                />
              </label>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Nombre de la App *
                </label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Ej: PlazaDO Marketplace RD"
                  className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Paquete Android (Package ID) *
                </label>
                <input
                  type="text"
                  required
                  value={packageName}
                  onChange={(e) => setPackageName(e.target.value)}
                  placeholder="Ej: com.plazado.marketplace"
                  className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Version & Date */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Versión (Version Name) *
                </label>
                <input
                  type="text"
                  required
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  placeholder="Ej: 1.0.4"
                  className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Código Compilación (Code)
                </label>
                <input
                  type="number"
                  value={versionCode}
                  onChange={(e) => setVersionCode(Number(e.target.value))}
                  placeholder="Ej: 104"
                  className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Fecha de Publicación
                </label>
                <input
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                  className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Requisito de Sistema Operativo
              </label>
              <input
                type="text"
                value={minAndroidVersion}
                onChange={(e) => setMinAndroidVersion(e.target.value)}
                placeholder="Ej: Android 8.0 (Oreo) o superior"
                className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Notas de la Versión (Changelog / Novedades)
              </label>
              <textarea
                rows={3}
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                placeholder="Describe las novedades, mejoras de velocidad, soporte para pedidos y correcciones..."
                className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* CARGA DEL ARCHIVO APK */}
            <div className="pt-3 border-t border-stone-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Carga del Archivo Instalador (.APK)</span>
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
                    Cargar archivo APK
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
                    accept=".apk,application/vnd.android.package-archive,application/octet-stream"
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
                        ? 'border-emerald-500 bg-emerald-50/50'
                        : apkUrl
                        ? 'border-emerald-300 bg-emerald-50/30 hover:bg-emerald-50/50'
                        : 'border-stone-300 bg-stone-50 hover:bg-stone-100/80 hover:border-emerald-300'
                    }`}
                  >
                    {apkUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <FileCheck className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-900">
                            {apkFileName || 'Instalador APK Cargado'}
                          </p>
                          {apkFileSize && (
                            <p className="text-[11px] text-stone-500">
                              Tamaño: {apkFileSize}
                            </p>
                          )}
                        </div>
                        <span className="text-[11px] text-emerald-600 font-bold hover:underline">
                          Haz clic o arrastra otro archivo para reemplazarlo
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-stone-900">
                            Arrastra aquí tu archivo APK (.apk) o haz clic para seleccionarlo
                          </p>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            Admite archivos .apk de Android (máx. 80 MB)
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
                <div className="space-y-2">
                  <input
                    type="url"
                    value={apkUrl}
                    onChange={(e) => {
                      setApkUrl(e.target.value);
                      if (!apkFileName) {
                        setApkFileName(e.target.value.split('/').pop() || 'PlazaDO.apk');
                      }
                    }}
                    placeholder="https://tudominio.com/descargas/PlazaDO-v1.0.4.apk"
                    className="w-full px-3.5 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={apkFileName}
                      onChange={(e) => setApkFileName(e.target.value)}
                      placeholder="Nombre del archivo (ej: PlazaDO-v1.0.4.apk)"
                      className="px-3 py-1.5 border border-stone-300 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      value={apkFileSize}
                      onChange={(e) => setApkFileSize(e.target.value)}
                      placeholder="Peso del archivo (ej: 18.6 MB)"
                      className="px-3 py-1.5 border border-stone-300 rounded-lg text-xs"
                    />
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Utiliza este modo si hospedas tu APK en Google Drive, Firebase Hosting, un bucket de Google Cloud o un CDN externo.
                  </p>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2">
              <button
                type="submit"
                disabled={isSaving || isProcessingFile}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSaving ? 'Guardando...' : 'Guardar y Publicar Configuración APK'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Card */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <span className="text-[10px] font-black uppercase tracking-wider text-stone-400">
                Previsualización para Clientes
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                En vivo
              </span>
            </div>

            {/* Card Widget Preview */}
            <div className="bg-stone-900 text-white rounded-2xl p-5 shadow-lg border border-stone-800 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">
                    {appName || 'PlazaDO Marketplace RD'}
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    Versión {versionName} • {apkFileSize || '18.6 MB'}
                  </p>
                </div>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed">
                {releaseNotes || 'Instala la aplicación en tu celular Android para comprar más rápido y dar seguimiento a tus envíos.'}
              </p>

              <div className="space-y-1.5 text-[11px] text-stone-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Compatible: {minAndroidVersion}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <span>Publicación: {releaseDate}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestDownload}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-black rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Download className="w-4 h-4" />
                <span>Descargar APK Oficial (v{versionName})</span>
              </button>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1.5">
              <h5 className="font-bold text-stone-900 text-xs flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-stone-600" />
                <span>Instrucciones para tus Clientes</span>
              </h5>
              <ol className="list-decimal list-inside text-[11px] text-stone-600 space-y-1">
                <li>Al presionar descargar, el navegador guardará el archivo <strong>.apk</strong>.</li>
                <li>Si el teléfono solicita permiso, el usuario selecciona <em>"Permitir desde esta fuente"</em>.</li>
                <li>Presiona <em>"Instalar"</em> y la app quedará lista en la pantalla de inicio.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
