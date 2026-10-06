import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Home, 
  LayoutGrid, 
  Store, 
  Heart, 
  User, 
  Shield 
} from 'lucide-react';

interface MobileNavBarProps {
  onOpenCart?: () => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = () => {
  const { 
    currentView, 
    setCurrentView, 
    currentUser, 
    favorites,
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

  const handleFavoritesClick = () => {
    if (!currentUser) {
      openAuthModal('login');
    } else {
      setCurrentView('customer_portal');
    }
  };

  const isHomeActive = currentView === 'home';
  const isCategoriesActive = currentView === 'catalog';
  const isStoresActive = currentView === 'stores' || currentView === 'store_public';
  const isFavoritesActive = currentView === 'customer_portal' && !isStoresActive;
  const isAccountActive = 
    currentView === 'store_dashboard' || 
    currentView === 'admin_dashboard' || 
    (currentView === 'customer_portal' && isFavoritesActive);

  const favCount = (favorites.productIds.length + favorites.storeIds.length);

  return (
    <nav 
      aria-label="Navegación móvil inferior fija"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-stone-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] safe-area-bottom select-none transition-colors duration-150"
    >
      <div className="grid grid-cols-5 h-14 items-center max-w-lg mx-auto px-1">
        
        {/* 1. 🏠 Inicio */}
        <button
          type="button"
          onClick={() => {
            setSelectedCategorySlug(null);
            setCurrentView('home');
          }}
          className={`flex flex-col items-center justify-center h-full w-full py-1 text-center transition-colors active:scale-95 ${
            isHomeActive 
              ? 'text-[#f20544] dark:text-rose-400 font-bold' 
              : 'text-slate-500 dark:text-stone-400 hover:text-slate-800 dark:hover:text-stone-200 font-medium'
          }`}
        >
          <Home className={`w-5 h-5 ${isHomeActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Inicio</span>
        </button>

        {/* 2. ▦ Categorías */}
        <button
          type="button"
          onClick={() => {
            setSelectedCategorySlug(null);
            setCurrentView('catalog');
          }}
          className={`flex flex-col items-center justify-center h-full w-full py-1 text-center transition-colors active:scale-95 ${
            isCategoriesActive 
              ? 'text-[#f20544] dark:text-rose-400 font-bold' 
              : 'text-slate-500 dark:text-stone-400 hover:text-slate-800 dark:hover:text-stone-200 font-medium'
          }`}
        >
          <LayoutGrid className={`w-5 h-5 ${isCategoriesActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Categorías</span>
        </button>

        {/* 3. 🏪 Tiendas */}
        <button
          type="button"
          onClick={() => {
            setCurrentView('stores');
          }}
          className={`flex flex-col items-center justify-center h-full w-full py-1 text-center transition-colors active:scale-95 ${
            isStoresActive 
              ? 'text-[#f20544] dark:text-rose-400 font-bold' 
              : 'text-slate-500 dark:text-stone-400 hover:text-slate-800 dark:hover:text-stone-200 font-medium'
          }`}
        >
          <Store className={`w-5 h-5 ${isStoresActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] tracking-tight mt-0.5">Tiendas</span>
        </button>

        {/* 4. ♡ Favoritos */}
        <button
          type="button"
          onClick={handleFavoritesClick}
          className={`flex flex-col items-center justify-center h-full w-full py-1 text-center transition-colors active:scale-95 relative ${
            isFavoritesActive && currentView === 'customer_portal'
              ? 'text-[#f20544] dark:text-rose-400 font-bold' 
              : 'text-slate-500 dark:text-stone-400 hover:text-slate-800 dark:hover:text-stone-200 font-medium'
          }`}
        >
          <div className="relative">
            <Heart className={`w-5 h-5 ${isFavoritesActive && currentView === 'customer_portal' ? 'stroke-[2.5] fill-[#f20544] dark:fill-rose-400' : 'stroke-2'}`} />
            {favCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#f20544] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white dark:border-stone-900">
                {favCount > 99 ? '99+' : favCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Favoritos</span>
        </button>

        {/* 5. 👤 Cuenta */}
        <button
          type="button"
          onClick={handleAccountClick}
          className={`flex flex-col items-center justify-center h-full w-full py-1 text-center transition-colors active:scale-95 ${
            isAccountActive 
              ? 'text-[#f20544] dark:text-rose-400 font-bold' 
              : 'text-slate-500 dark:text-stone-400 hover:text-slate-800 dark:hover:text-stone-200 font-medium'
          }`}
        >
          {currentUser?.role === 'SUPER_ADMIN' ? (
            <Shield className={`w-5 h-5 ${isAccountActive ? 'text-[#f20544] dark:text-rose-400 stroke-[2.5]' : 'stroke-2'}`} />
          ) : currentUser?.role === 'STORE_OWNER' ? (
            <Store className={`w-5 h-5 ${isAccountActive ? 'text-[#f20544] dark:text-rose-400 stroke-[2.5]' : 'stroke-2'}`} />
          ) : (
            <User className={`w-5 h-5 ${isAccountActive ? 'text-[#f20544] dark:text-rose-400 stroke-[2.5]' : 'stroke-2'}`} />
          )}
          <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[55px]">
            {!currentUser 
              ? 'Cuenta' 
              : currentUser.role === 'SUPER_ADMIN' 
              ? 'Admin' 
              : currentUser.role === 'STORE_OWNER' 
              ? 'Mi Tienda' 
              : 'Cuenta'}
          </span>
        </button>

      </div>
    </nav>
  );
};
