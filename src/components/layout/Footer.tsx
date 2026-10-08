import React from 'react';
import { LEGAL_PDF_URL } from '../../legal/registration';
import { triggerFileDownload } from '../../utils/fileDownloader';
import { useApp } from '../../context/AppContext';
import { DominicanFlag } from '../common/DominicanFlag';
import { PlazaDoLogo } from '../common/PlazaDoLogo';
import { Phone, Mail, MapPin, ShieldCheck, CreditCard, Truck, RefreshCw, MessageSquare, Download, Smartphone, FileText } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentView, setOpenPolicySlug, systemSettings, categories, setSelectedCategorySlug, openDownloadModal } = useApp();

  const handleOpenPolicy = (slug: string) => {
    setOpenPolicySlug(slug);
  };

  const handleCategoryClick = (catSlug: string) => {
    setSelectedCategorySlug(catSlug);
    setCurrentView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white dark:bg-stone-950 text-stone-700 dark:text-stone-700 dark:text-stone-300 pt-8 pb-8 border-t border-stone-200 dark:border-stone-200 dark:border-stone-800">
      {/* Value Proposition Highlights */}
      <div className="max-w-7xl mx-auto px-4 pb-10 border-b border-stone-200 dark:border-stone-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-red-950/60 text-red-500 border border-red-900/40">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-950 dark:text-white">Envíos por Tienda</h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Cada comercio gestiona sus envíos con tarifas transparentes y tiempos claros.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-900/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-950 dark:text-white">Entrega Garantizada</h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Código secreto de confirmación para validar que recibes exactamente lo que pediste.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-900/40">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-950 dark:text-white">Pagos Seguros en RD$</h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Pago en efectivo al recibir tu pedido. Confirma la entrega con tu código.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-900/40">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-950 dark:text-white">Muchas Tiendas, 1 Carrito</h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Agrega productos de diferentes establecimientos en un solo pedido ordenado.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-5 gap-8">
        
        {/* Brand Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="pt-1">
            <PlazaDoLogo variant="full" inverted={true} className="w-56 h-auto" />
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-sm">
            El marketplace multi-vendedor de la República Dominicana. Todo en un solo lugar: conectando clientes con tiendas, comercios, emprendedores y marcas locales de todo el país.
          </p>
          <div className="text-xs text-stone-500 dark:text-stone-400 space-y-2 pt-1">
            <p className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="flex items-center gap-1.5">
                <DominicanFlag className="w-4 h-2.5 rounded-2xs border border-stone-700 inline-block shrink-0 shadow-2xs" />
                Santo Domingo, Distrito Nacional, República Dominicana
              </span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              <span>WhatsApp Comercial: <strong className="text-stone-950 dark:text-white">{systemSettings.whatsappCommercial}</strong></span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span>{systemSettings.contactEmail}</span>
            </p>
          </div>
        </div>

        {/* Categories */}
        <div>
          <h5 className="text-xs font-bold uppercase tracking-wider text-stone-200 mb-3">Categorías</h5>
          <ul className="space-y-2 text-xs text-stone-500 dark:text-stone-400">
            {categories.filter(c => !c.parentId).slice(0, 6).map(c => (
              <li key={c.id}>
                <button 
                  onClick={() => handleCategoryClick(c.slug)}
                  className="hover:text-stone-950 dark:text-white transition-colors"
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Para Vendedores */}
        <div>
          <h5 className="text-xs font-bold uppercase tracking-wider text-stone-200 mb-3">Tiendas y Comercios</h5>
          <ul className="space-y-2 text-xs text-stone-500 dark:text-stone-400">
            <li>
              <button 
                id="footer-stores-directory-btn"
                onClick={() => setCurrentView('stores')}
                className="hover:text-stone-950 dark:text-white font-semibold transition-colors text-stone-700 dark:text-stone-300"
              >
                Directorio de Tiendas RD
              </button>
            </li>
            <li>
              <button 
                onClick={() => setCurrentView('sell_with_us')}
                className="hover:text-red-400 font-semibold transition-colors text-red-400"
              >
                Registra tu Tienda
              </button>
            </li>
            <li>
              <button 
                onClick={() => setCurrentView('sell_with_us')}
                className="hover:text-stone-950 dark:text-white transition-colors"
              >
                ¿Cómo funciona?
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleOpenPolicy('store_terms')}
                className="hover:text-stone-950 dark:text-white transition-colors"
              >
                Términos para Comercios
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleOpenPolicy('commission_policy')}
                className="hover:text-stone-950 dark:text-white transition-colors"
              >
                Comisión ({Number(((systemSettings.plazaCommissionRate ?? 0.0005)*100).toFixed(4))}%)
              </button>
            </li>
          </ul>
        </div>

        {/* Legal y Soporte */}
        <div>
          <h5 className="text-xs font-bold uppercase tracking-wider text-stone-200 mb-3">Legal y Políticas</h5>
          <ul className="space-y-2 text-xs text-stone-500 dark:text-stone-400">
            <li>
              <button 
                onClick={() => handleOpenPolicy('customer_terms')}
                className="hover:text-stone-950 dark:text-white transition-colors"
              >
                Términos del Cliente
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleOpenPolicy('privacy')}
                className="hover:text-stone-950 dark:text-white transition-colors"
              >
                Política de Privacidad RD
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleOpenPolicy('returns_refunds')}
                className="hover:text-stone-950 dark:text-white transition-colors"
              >
                Devoluciones y Reclamaciones
              </button>
            </li>
            <li>
              <button 
                onClick={() => handleOpenPolicy('payments')}
                className="hover:text-stone-950 dark:text-white transition-colors"
              >
                Políticas de Pagos
              </button>
            </li>
            <li className="pt-2 border-t border-stone-200 dark:border-stone-800">
              <button 
                id="footer-download-pdf-btn"
                onClick={() => triggerFileDownload(LEGAL_PDF_URL, 'Plazado-Politicas-Plataforma.pdf')}
                className="text-stone-700 dark:text-stone-300 hover:text-stone-950 dark:text-white font-medium transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-red-500" />
                <span>Descargar Políticas (PDF)</span>
              </button>
            </li>
            <li>
              <button 
                id="footer-download-apk-btn"
                onClick={() => openDownloadModal('app')}
                className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors flex items-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Descargar App Android (APK)</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Legal bar */}
      <div className="max-w-7xl mx-auto px-4 pt-6 border-t border-stone-200 dark:border-stone-800 text-xs text-stone-500 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p>
          © {new Date().getFullYear()} Plazado.com{systemSettings.legalEntityRegistered && systemSettings.legalBusinessName ? ` · ${systemSettings.legalBusinessName}${systemSettings.rnc ? ` · RNC: ${systemSettings.rnc}` : ''}` : ''}. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-3">
          <span>Moneda: <strong>DOP (RD$)</strong></span>
          <span>•</span>
          <span className="text-stone-500 dark:text-stone-400 font-medium">“Tus compras, más cerca.”</span>
        </div>
      </div>
    </footer>
  );
};
