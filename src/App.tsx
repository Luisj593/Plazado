import React, { useState, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { RoleBar } from './components/layout/RoleBar';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './components/customer/HomePage';
import { SearchCatalogPage } from './components/customer/SearchCatalogPage';
import { StoresDirectoryPage } from './components/customer/StoresDirectoryPage';
import { StorePublicPage } from './components/customer/StorePublicPage';
import { SellWithUsPage } from './components/customer/SellWithUsPage';
const CustomerPortal=lazy(()=>import('./components/customer/CustomerPortal').then(module=>({default:module.CustomerPortal})));
const StoreDashboard=lazy(()=>import('./components/store/StoreDashboard').then(module=>({default:module.StoreDashboard})));
const AdminDashboard=lazy(()=>import('./components/admin/AdminDashboard').then(module=>({default:module.AdminDashboard})));
import { LegalAndPoliciesPage } from './components/public/LegalAndPoliciesPage';
import { AndroidAppDownloadPage } from './components/public/AndroidAppDownloadPage';
import { CartDrawer } from './components/customer/CartDrawer';
const CheckoutModal=lazy(()=>import('./components/customer/CheckoutModal').then(module=>({default:module.CheckoutModal})));
const ProductDetailModal=lazy(()=>import('./components/customer/ProductDetailModal').then(module=>({default:module.ProductDetailModal})));
import { PolicyModal } from './components/common/PolicyModal';
import { DownloadSectionModal } from './components/common/DownloadSectionModal';
const AuthModal=lazy(()=>import('./components/auth/AuthModal').then(module=>({default:module.AuthModal})));
const OrderChatModal=lazy(()=>import('./components/chat/OrderChatModal').then(module=>({default:module.OrderChatModal})));
import { MobileNavBar } from './components/layout/MobileNavBar';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { 
  CheckCircle2, 
  Key, 
  ArrowRight, 
  Package, 
  Store, 
  ShieldCheck,
  MessageSquare,
  X
} from 'lucide-react';

const MarketplaceApp: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    notification, 
    orders, 
    stores,
    currentUser,
    openAuthModal,
    showNotification,
    isDownloadModalOpen,
    downloadModalTab,
    closeDownloadModal,
    openOrderChat,
    isBootstrapLoading, isAuthModalOpen, selectedProductId, activeChatOrderId
  } = useApp();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [lastOrderSuccess, setLastOrderSuccess] = useState<{
    groupCode: string;
    orderIds: string[];
  } | null>(null);

  const handleCheckoutProceed = () => {
    setIsCartOpen(false);
    if (!currentUser) {
      showNotification('Debes iniciar sesión o registrarte para completar tu compra', 'info');
      openAuthModal('login');
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSuccess = (orderGroupCode: string, orderIds: string[]) => {
    setIsCheckoutOpen(false);
    setLastOrderSuccess({
      groupCode: orderGroupCode,
      orderIds
    });
  };

  // Find the created orders for the success modal
  const completedOrders = lastOrderSuccess 
    ? orders.filter(o => lastOrderSuccess.orderIds.includes(o.id))
    : [];

  // Dedicated Production Loader: Wait for authoritative server state to guarantee identical view across devices
  if (isBootstrapLoading) {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center p-6 text-white selection:bg-red-600">
        <div className="flex flex-col items-center gap-5 text-center max-w-sm animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-2xl shadow-red-600/30 animate-pulse border border-red-500/40">
            <span className="text-3xl font-black text-white tracking-tighter">P<span className="text-stone-950">.</span></span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">PlazaDO.com</h1>
            <p className="text-xs text-stone-400 mt-1.5 font-medium leading-relaxed">
              Cargando catálogo central oficial…
            </p>
          </div>
          <div className="w-48 h-1.5 bg-stone-800 rounded-full overflow-hidden border border-stone-700/60">
            <div className="w-full h-full bg-gradient-to-r from-red-600 via-amber-400 to-red-600 animate-pulse rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0c0a09] text-stone-900 dark:text-stone-100 selection:bg-red-600 selection:text-white font-sans antialiased transition-colors duration-200">
      
      {/* Dynamic Role Switcher Bar */}
      <RoleBar />

      {/* Global Toast Notification */}
      {notification && (
        <div className="fixed top-16 right-4 z-50 animate-in slide-in-from-top-3 duration-200">
          <div className="bg-stone-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl border border-stone-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Marketplace Navigation Header */}
      <Header onOpenCart={() => setIsCartOpen(true)} />

      {/* Main Viewport Content with mobile bottom nav compensation */}
      <main className="flex-1 pb-20 md:pb-0">
        {currentView === 'home' && <HomePage />}
        {currentView === 'catalog' && <SearchCatalogPage />}
        {currentView === 'stores' && <StoresDirectoryPage />}
        {currentView === 'store_public' && <StorePublicPage />}
        {currentView === 'sell_with_us' && <SellWithUsPage />}
        {currentView === 'customer_portal' && <CustomerPortal />}
        {currentView === 'store_dashboard' && <StoreDashboard />}
        {currentView === 'admin_dashboard' && <AdminDashboard />}
        {currentView === 'policies' && <LegalAndPoliciesPage />}
        {currentView === 'download_app' && <AndroidAppDownloadPage />}
      </main>

      {/* Marketplace Comprehensive Footer */}
      <Footer />

      {/* Persistent Mobile Bottom Navigation Bar */}
      <MobileNavBar onOpenCart={() => setIsCartOpen(true)} />

      {/* Slide-over Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedToCheckout={handleCheckoutProceed}
      />

      {/* Multi-Store Checkout Modal */}
      {isCheckoutOpen && <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={handleCheckoutSuccess}
      />}

      {/* Product Quick View & Detail Modal */}
      {selectedProductId && <ProductDetailModal />}

      {/* Dominican Legal Policies Modal */}
      <PolicyModal />

      {/* Official Download Section Modal (Android APK & Legal PDFs) */}
      <DownloadSectionModal 
        isOpen={isDownloadModalOpen} 
        onClose={closeDownloadModal} 
        defaultTab={downloadModalTab} 
      />

      {/* Auth & Registration Modal */}
      {isAuthModalOpen && <AuthModal />}

      {/* Official In-Platform Order Chat Modal */}
      {activeChatOrderId && <OrderChatModal />}

      {/* Purchase Success Celebration Modal with Delivery Confirmation Code */}
      {lastOrderSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900 font-display">
                ¡Tu Pedido ha sido Confirmado!
              </h2>
              <p className="text-xs text-stone-500">
                Grupo de Orden: <span className="font-mono font-bold text-stone-800">{lastOrderSuccess.groupCode}</span>
              </p>
            </div>

            {/* Secret Codes List for each store order */}
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <Key className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <span className="font-bold">Guarda tus Códigos Secretos de Entrega:</span> Debes facilitar este código al repartidor únicamente cuando recibas tus artículos a satisfacción.
                </div>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {completedOrders.map((ord) => (
                  <div key={ord.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-stone-900 block">{ord.storeName}</span>
                        <span className="text-[11px] text-stone-500">{ord.items.length} artículos • RD$ {ord.total.toLocaleString()}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-stone-400 block">Código Secreto</span>
                        <span className="font-mono font-black text-base text-red-600 tracking-wider">
                          {ord.deliveryConfirmationCode}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-stone-200">
                      <span className="text-[10px] text-stone-500">Comunicación con la tienda:</span>
                      <button
                        onClick={() => {
                          setLastOrderSuccess(null);
                          openOrderChat(ord.id);
                        }}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Abrir Chat con Tienda</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => {
                  setLastOrderSuccess(null);
                  setCurrentView('customer_portal');
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Ver en Mis Pedidos</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setLastOrderSuccess(null);
                  setCurrentView('home');
                }}
                className="py-3 px-5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold text-xs transition-colors"
              >
                Seguir Comprando
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary><Suspense fallback={<div role="status" className="p-6 text-center">Cargando tu espacio…</div>}>
      <AppProvider>
        <MarketplaceApp />
      </AppProvider>
    </Suspense></ErrorBoundary>
  );
}
