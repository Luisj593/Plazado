import { resolveAndroidApp } from '../../utils/androidApp';
import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Smartphone, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  Calendar, 
  Package, 
  Layers, 
  Sparkles,
  ShoppingBag,
  Bell,
  Truck,
  ExternalLink,
  HelpCircle,
  QrCode
} from 'lucide-react';
import { triggerFileDownload } from '../../utils/fileDownloader';
import { DominicanFlag } from '../common/DominicanFlag';
import { PlazaDoLogo } from '../common/PlazaDoLogo';

export const AndroidAppDownloadPage: React.FC = () => {
  const { systemSettings, setCurrentView, showNotification } = useApp();

  const appConfig = resolveAndroidApp(systemSettings.androidApp);

  const handleDownload = () => {
    if (!appConfig.isEnabled || !appConfig.apkUrl) {
      showNotification('La descarga de Android no está disponible en este momento.', 'error');
      return;
    }
    const started = triggerFileDownload(appConfig.apkUrl, appConfig.apkFileName || 'Plazado.apk');
    showNotification(started ? 'Descarga solicitada. Revisa las descargas de tu navegador.' : 'No se pudo iniciar la descarga.', started ? 'success' : 'error');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-200">
      
      {/* Navigation Breadcrumb */}
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
          <span>Marketplace Oficial de la República Dominicana</span>
        </span>
      </div>

      {/* Main Hero Card */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-950 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-stone-800 relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          <div className="md:col-span-8 space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                {appConfig.isEnabled ? 'Aplicación Móvil para Android' : 'Descarga Android no disponible'}
              </span>
              <span className="text-xs text-stone-400">
                Versión {appConfig.versionName} • {appConfig.apkFileSize || 'Tamaño no informado'}
              </span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Lleva <span className="text-red-500">PlazaDO</span> en tu Teléfono Móvil
              </h1>
              <p className="text-sm sm:text-base text-stone-300 max-w-xl leading-relaxed">
                Descarga el archivo instalador oficial <strong>APK para Android</strong>. Explora los productos de tiendas dominicanas, compra y confirma la recepción de tus pedidos.
              </p>
            </div>

            {/* Key Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-stone-800/60 rounded-xl border border-stone-700/60 flex items-start gap-2.5">
                <ShoppingBag className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Muchas Tiendas</h4>
                  <p className="text-[11px] text-stone-400">1 Solo Carrito</p>
                </div>
              </div>

              <div className="p-3 bg-stone-800/60 rounded-xl border border-stone-700/60 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Código Secreto</h4>
                  <p className="text-[11px] text-stone-400">Entrega Garantizada</p>
                </div>
              </div>

              <div className="p-3 bg-stone-800/60 rounded-xl border border-stone-700/60 flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Envíos en RD</h4>
                  <p className="text-[11px] text-stone-400">Rastreo en vivo</p>
                </div>
              </div>
            </div>

            {/* Download CTA */}
            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                disabled={!appConfig.isEnabled || !appConfig.apkUrl}
                  onClick={handleDownload}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black rounded-2xl text-sm transition-all shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-98"
              >
                <Download className="w-5 h-5 text-stone-950" />
                <span>Descargar APK para Android ({appConfig.apkFileSize || 'Tamaño no informado'})</span>
              </button>

              <span className="text-xs text-stone-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Instalador publicado por Plazado</span>
              </span>
            </div>
          </div>

          {/* Visual Phone Mockup Column */}
          <div className="md:col-span-4 flex justify-center">
            <div className="w-60 bg-stone-950 border-4 border-stone-800 rounded-3xl p-3 shadow-2xl space-y-3 relative">
              <div className="w-16 h-3.5 bg-stone-800 rounded-full mx-auto" />
              
              <div className="bg-stone-900 rounded-2xl p-4 space-y-3 border border-stone-800">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-[11px] font-black">DO</span>
                  </div>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                    Android App
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-[11px] font-extrabold text-white">PlazaDO Móvil</p>
                  <p className="text-[9px] text-stone-400">República Dominicana</p>
                </div>

                <div className="p-2.5 bg-stone-800 rounded-xl space-y-1.5 text-[10px] text-stone-300">
                  <div className="flex justify-between">
                    <span className="text-stone-400">Versión:</span>
                    <strong className="text-white">{appConfig.versionName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Requisito:</span>
                    <strong className="text-emerald-400">{appConfig.minAndroidVersion}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-400">Actualizado:</span>
                    <strong className="text-white">{appConfig.releaseDate}</strong>
                  </div>
                </div>

                <div className="w-full py-2 bg-emerald-500/20 text-emerald-300 rounded-xl text-center text-[10px] font-bold border border-emerald-500/30">
                  Instalador Directo APK
                </div>
              </div>

              <div className="w-12 h-1 bg-stone-800 rounded-full mx-auto mt-2" />
            </div>
          </div>
        </div>
      </div>

      {/* 3 Easy Steps to Install Android APK */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <span className="text-xs font-black uppercase tracking-wider text-red-600">
            Guía de Instalación Rápida
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-stone-900">
            ¿Cómo instalar la App de PlazaDO en tu celular?
          </h2>
          <p className="text-xs text-stone-500">
            Es un proceso 100% seguro que solo toma 30 segundos. Sigue estos 3 pasos:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-black text-sm">
              1
            </div>
            <h3 className="font-extrabold text-sm text-stone-900">
              Descargar el Archivo APK
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Presiona el botón verde de descarga. Si tu navegador (Google Chrome) te pregunta <em>"¿Descargar de todos modos?"</em>, selecciona <strong>"Descargar"</strong>.
            </p>
          </div>

          <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm">
              2
            </div>
            <h3 className="font-extrabold text-sm text-stone-900">
              Abrir el Instalador
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Toca la notificación de descarga completada en tu barra de notificaciones o ve a tu carpeta de <strong>Descargas</strong> y toca el archivo <em>{appConfig.apkFileName || 'PlazaDO.apk'}</em>.
            </p>
          </div>

          <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
              3
            </div>
            <h3 className="font-extrabold text-sm text-stone-900">
              Autorizar e Instalar
            </h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Si Android te lo solicita, activa el interruptor <strong>"Permitir desde esta fuente"</strong> y presiona <strong>"Instalar"</strong>. ¡La app quedará lista en tu pantalla principal!
            </p>
          </div>
        </div>
      </div>

      {/* Release Notes & Technical Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <Package className="w-5 h-5 text-red-600" />
            <h3 className="font-extrabold text-sm text-stone-900">
              Novedades de la Versión {appConfig.versionName}
            </h3>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line">
            {appConfig.releaseNotes || 'Versión oficial con rendimiento mejorado para compras en línea en la República Dominicana.'}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-stone-900">
              Seguridad y Garantía Oficial
            </h3>
          </div>
          <div className="space-y-2 text-xs text-stone-600">
            <p>
              • <strong>Desarrollador:</strong> {systemSettings.legalBusinessName} (RNC: {systemSettings.rnc})
            </p>
            <p>
              • <strong>Paquete oficial:</strong> {appConfig.packageName}
            </p>
            <p>
              • <strong>Soporte técnico directo:</strong> WhatsApp {systemSettings.whatsappCommercial} o {systemSettings.contactEmail}
            </p>
          </div>
        </div>
      </div>

      {/* Final Action Banner */}
      <div className="p-6 bg-stone-100 rounded-3xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-extrabold text-sm text-stone-900">¿Listo para comenzar a comprar o vender?</h4>
          <p className="text-xs text-stone-500">Descarga el APK oficial o explora el catálogo web directamente.</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            disabled={!appConfig.isEnabled || !appConfig.apkUrl}
                  onClick={handleDownload}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Descargar APK</span>
          </button>
          <button
            onClick={() => setCurrentView('catalog')}
            className="px-5 py-2.5 bg-white hover:bg-stone-50 text-stone-800 font-bold rounded-xl text-xs border border-stone-300 transition-colors"
          >
            Explorar en la Web
          </button>
        </div>
      </div>
    </div>
  );
};
