import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { RoleBar } from './components/layout/RoleBar';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { HomePage } from './components/customer/HomePage';
import { SearchCatalogPage } from './components/customer/SearchCatalogPage';
import { StorePublicPage } from './components/customer/StorePublicPage';
import { SellWithUsPage } from './components/customer/SellWithUsPage';
import { CustomerPortal } from './components/customer/CustomerPortal';
import { StoreDashboard } from './components/store/StoreDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CartDrawer } from './components/customer/CartDrawer';
import { CheckoutModal } from './components/customer/CheckoutModal';
import { ProductDetailModal } from './components/customer/ProductDetailModal';
import { PolicyModal } from './components/common/PolicyModal';
import { AuthModal } from './components/auth/AuthModal';
import { 
  CheckCircle2, 
  Key, 
  ArrowRight, 
  Package, 
  Store, 
  ShieldCheck,
  X
} from 'lucide-react';

const MarketplaceApp: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    notification, 
    orders, 
    currentUser,
    openAuthModal,
    showNotification
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

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 selection:bg-red-500 selection:text-white font-sans antialiased">
      
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

      {/* Main Viewport Content */}
      <main className="flex-1">
        {currentView === 'home' && <HomePage />}
        {currentView === 'catalog' && <SearchCatalogPage />}
        {currentView === 'store_public' && <StorePublicPage />}
        {currentView === 'sell_with_us' && <SellWithUsPage />}
        {currentView === 'customer_portal' && <CustomerPortal />}
        {currentView === 'store_dashboard' && <StoreDashboard />}
        {currentView === 'admin_dashboard' && <AdminDashboard />}
      </main>

      {/* Marketplace Comprehensive Footer */}
      <Footer />

      {/* Slide-over Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedToCheckout={handleCheckoutProceed}
      />

      {/* Multi-Store Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={handleCheckoutSuccess}
      />

      {/* Product Quick View & Detail Modal */}
      <ProductDetailModal />

      {/* Dominican Legal Policies Modal */}
      <PolicyModal />

      {/* Auth & Registration Modal */}
      <AuthModal />

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

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {completedOrders.map((ord) => (
                  <div key={ord.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
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
    <AppProvider>
      <MarketplaceApp />
    </AppProvider>
  );
}
