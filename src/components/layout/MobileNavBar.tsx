import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Home, 
  Search, 
  Store, 
  ShoppingCart, 
  User, 
  Shield, 
  Package
} from 'lucide-react';

interface MobileNavBarProps {
  onOpenCart: () => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({ onOpenCart }) => {
  const { 
    currentView, 
    setCurrentView, 
    currentUser, 
    cartTotal, 
    openAuthModal,
    setSelectedCategorySlug
  } = useApp();

  const handleAccountClick = () => {
    if (!currentUser) {
      openAuthModal('login');
    } else if (currentUser.role === 'SUPER_ADMIN') {
      setCurrentView('admin_dashboard');
    } else if (currentUser.role === 'STORE_OWNER') {
      setCurrentView('store_dashboard');
    } else {
      setCurrentView('customer_portal');
    }
  };

  const isAccountActive = 
    currentView === 'customer_portal' || 
    currentView === 'store_dashboard' || 
    currentView === 'admin_dashboard';

  return (
    <nav 
      aria-label="Navegación móvil inferior"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] safe-area-bottom select-none"
    >
      <div className="grid grid-cols-5 h-14 items-center max-w-lg mx-auto px-1">
        
        {/* 1. Inicio */}
        <button
          type="button"
          onClick={() => {
            setSelectedCategorySlug(null);
            setCurrentView('home');
          }}
          className={`flex flex-col items-center justify-center h-full w-full py-1 text-center transition-colors active:scale-95 ${
            currentView === 'home' 
              ? 'text-red-600 font-bold' 
              : 'text-stone-500 hover:text-stone-800 font-medium'
          }`}
        >
          <Home className={`w-5 h-5 ${currentView === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Inicio</span>
        </button>

        {/* 2. Catálogo / Explorar */}
        <button
          type="button"
          onClick={() => {
            setCurrentView('catalog');
          }}
          className={`flex flex-col items-center justify-center h-full w-full py-1 text-center transition-colors active:scale-95 ${
            currentView === 'catalog' 
              ? 'text-red-600 font-bold' 
              : 'text-stone-500 hover:text-stone-800 font-medium'
          }`}
        >
          <Search className={`w-5 h-5 ${currentView === 'catalog' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Catálogo</span>
        </button>

        {/* 3. Tiendas */}
        <button
          type="button"
          onClick={() => {
            setCurrentView('stores');
          }}
          className={`flex flex-col items-center justify-center h-full w-full py-1 text-center transition-colors active:scale-95 ${
            currentView === 'stores' || currentView === 'store_public'
              ? 'text-red-600 font-bold' 
              : 'text-stone-500 hover:text-stone-800 font-medium'
          }`}
        >
          <Store className={`w-5 h-5 ${currentView === 'stores' || currentView === 'store_public' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Tiendas</span>
        </button>

        {/* 4. Carrito con Badge en tiempo real */}
        <button
          type="button"
          onClick={onOpenCart}
          className="flex flex-col items-center justify-center h-full w-full py-1 text-center text-stone-500 hover:text-stone-800 font-medium relative transition-colors active:scale-95"
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5 stroke-2" />
            {cartTotal.itemsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white animate-in zoom-in-50">
                {cartTotal.itemsCount > 99 ? '99+' : cartTotal.itemsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Carrito</span>
        </button>

        {/* 5. Mi Cuenta / Perfil / Login */}
        <button
          type="button"
          onClick={handleAccountClick}
          className={`flex flex-col items-center justify-center h-full w-full py-1 text-center transition-colors active:scale-95 ${
            isAccountActive 
              ? 'text-red-600 font-bold' 
              : 'text-stone-500 hover:text-stone-800 font-medium'
          }`}
        >
          {currentUser?.role === 'SUPER_ADMIN' ? (
            <Shield className={`w-5 h-5 ${isAccountActive ? 'text-rose-600 stroke-[2.5]' : 'stroke-2'}`} />
          ) : currentUser?.role === 'STORE_OWNER' ? (
            <Store className={`w-5 h-5 ${isAccountActive ? 'text-amber-600 stroke-[2.5]' : 'stroke-2'}`} />
          ) : (
            <User className={`w-5 h-5 ${isAccountActive ? 'text-red-600 stroke-[2.5]' : 'stroke-2'}`} />
          )}
          <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[55px]">
            {!currentUser 
              ? 'Ingresar' 
              : currentUser.role === 'SUPER_ADMIN' 
              ? 'Admin' 
              : currentUser.role === 'STORE_OWNER' 
              ? 'Mi Tienda' 
              : 'Perfil'}
          </span>
        </button>

      </div>
    </nav>
  );
};
