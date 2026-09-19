import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DominicanFlag } from '../common/DominicanFlag';
import { PlazaDoLogo } from '../common/PlazaDoLogo';
import { UserProfileModal } from '../common/UserProfileModal';
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  Store, 
  Shield, 
  User, 
  Menu, 
  X, 
  Package, 
  Phone,
  ChevronDown,
  Layers,
  Sparkles,
  LogIn,
  UserPlus
} from 'lucide-react';

interface HeaderProps {
  onOpenCart: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCart }) => {
  const { 
    currentView, 
    setCurrentView, 
    currentUser, 
    cartTotal, 
    searchQuery, 
    setSearchQuery, 
    categories, 
    setSelectedCategorySlug,
    favorites,
    systemSettings,
    openAuthModal,
    stores,
    showNotification,
    setAdminActiveTab,
    logout
  } = useApp();

  const pendingStoresCount = stores.filter(s => s.status === 'PENDING' || s.status === 'IN_REVIEW').length;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setCurrentView('catalog');
    }
  };

  const handleCategoryClick = (catSlug: string) => {
    setSelectedCategorySlug(catSlug);
    setCurrentView('catalog');
    setCategoriesDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  // Main categories (excluding subcategories)
  const mainCategories = categories.filter(c => !c.parentId);
  const currentStore = currentUser?.role === 'STORE_OWNER' 
    ? stores.find(s => s.id === currentUser.storeId) 
    : null;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200 shadow-xs">
      {/* Top micro bar with Dominican notice and WhatsApp */}
      <div className="bg-stone-50 border-b border-stone-100 py-1.5 px-4 text-xs text-stone-600">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-medium text-stone-800">
              <DominicanFlag className="w-5 h-3.5 rounded-2xs shadow-2xs border border-stone-300 inline-block shrink-0" />
              <span>República Dominicana</span>
            </span>
            <span className="text-stone-300 hidden sm:inline">|</span>
            <span className="hidden sm:inline text-stone-500 font-normal">
              “Muchas tiendas. Un solo lugar.”
            </span>
          </div>

          <div className="flex items-center gap-4 text-stone-600">
            <a 
              href={`https://wa.me/1${systemSettings.whatsappCommercial.replace(/[^0-9]/g, '')}`} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-red-600 transition-colors font-medium text-stone-700"
            >
              <Phone className="w-3 h-3 text-emerald-600" />
              <span>WhatsApp Comercial: {systemSettings.whatsappCommercial}</span>
            </a>
            
            {currentUser?.role === 'SUPER_ADMIN' && (
              <button 
                onClick={() => {
                  if (pendingStoresCount > 0) setAdminActiveTab('solicitudes');
                  setCurrentView('admin_dashboard');
                }}
                className="text-red-600 font-semibold hover:underline hidden md:inline flex items-center gap-1.5"
              >
                <Shield className="w-3 h-3 inline" />
                <span>Panel Super Admin</span>
                {pendingStoresCount > 0 && (
                  <span className="bg-amber-500 text-stone-950 font-black text-[10px] px-1.5 py-0.5 rounded-full animate-pulse shadow-xs">
                    {pendingStoresCount} solicitud{pendingStoresCount > 1 ? 'es' : ''}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3 md:gap-6">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button 
              id="header-logo-btn"
              onClick={() => {
                setCurrentView('home');
                setSelectedCategorySlug(null);
              }}
              className="text-left flex items-center gap-2.5 group focus:outline-none hover:opacity-95 transition-opacity"
            >
              <PlazaDoLogo variant="compact" className="h-9 sm:h-10 w-auto" />
              <DominicanFlag className="w-5 h-3.5 rounded-2xs shadow-2xs border border-stone-200 hidden sm:inline-block shrink-0" />
            </button>
          </div>

          {/* Search Bar */}
          <form 
            onSubmit={handleSearchSubmit} 
            className="flex-1 max-w-2xl hidden md:flex items-center relative"
          >
            <div className="relative w-full">
              <input 
                id="header-search-input"
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos, marcas, tiendas en República Dominicana..."
                className="w-full pl-11 pr-24 py-2.5 bg-stone-100/90 border border-stone-300 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all outline-none"
              />
              <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button 
                type="submit"
                id="header-search-submit-btn"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
              >
                Buscar
              </button>
            </div>
          </form>

          {/* Action Icons & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Vende en PlazaDO / Portal Tienda */}
            {currentUser?.role === 'STORE_OWNER' ? (
              <button
                id="header-store-dash-btn"
                onClick={() => setCurrentView('store_dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  currentView === 'store_dashboard' 
                    ? 'bg-amber-500 text-white shadow-xs' 
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300/60'
                }`}
              >
                <Store className="w-4 h-4 text-amber-600" />
                <span className="hidden lg:inline">Mi Tienda</span>
              </button>
            ) : currentUser?.role === 'SUPER_ADMIN' ? (
              <button
                id="header-admin-dash-btn"
                onClick={() => {
                  if (pendingStoresCount > 0) setAdminActiveTab('solicitudes');
                  setCurrentView('admin_dashboard');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  currentView === 'admin_dashboard' 
                    ? 'bg-rose-600 text-white shadow-xs' 
                    : 'bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300/60'
                }`}
              >
                <Shield className="w-4 h-4 text-rose-600" />
                <span className="hidden lg:inline">Administración</span>
                {pendingStoresCount > 0 && (
                  <span className="bg-amber-500 text-stone-950 font-black text-[10px] px-1.5 py-0.5 rounded-full animate-pulse shadow-xs">
                    {pendingStoresCount}
                  </span>
                )}
              </button>
            ) : !currentUser ? (
              <button
                id="header-sell-btn"
                onClick={() => openAuthModal('register_store')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors"
                title="Registrar tienda comercial en PlazaDO"
              >
                <Store className="w-4 h-4 text-red-600" />
                <span className="hidden sm:inline">Vende en PlazaDO</span>
              </button>
            ) : null}

            {/* Customer Portal / Mis Pedidos */}
            <button
              id="header-customer-portal-btn"
              onClick={() => {
                if (!currentUser) {
                  showNotification('Inicia sesión o regístrate para ver tus pedidos', 'info');
                  openAuthModal('login');
                } else {
                  setCurrentView('customer_portal');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                currentView === 'customer_portal' 
                  ? 'bg-red-50 text-red-700' 
                  : 'hover:bg-stone-100 text-stone-700'
              }`}
              title="Mis Pedidos y Direcciones"
            >
              <Package className="w-4 h-4 text-stone-600" />
              <span className="hidden md:inline">Mis Pedidos</span>
            </button>

            {/* Favoritos */}
            <button
              id="header-favorites-btn"
              onClick={() => {
                if (!currentUser) {
                  showNotification('Inicia sesión o regístrate para ver tus favoritos', 'info');
                  openAuthModal('login');
                } else {
                  setCurrentView('customer_portal');
                }
              }}
              className="p-2 rounded-lg hover:bg-stone-100 text-stone-700 relative transition-colors"
              title="Favoritos"
            >
              <Heart className="w-5 h-5" />
              {(favorites.productIds.length + favorites.storeIds.length) > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {favorites.productIds.length + favorites.storeIds.length}
                </span>
              )}
            </button>

            {/* Sección de Usuario / Tienda según Registro */}
            {currentUser ? (
              <div className="flex items-center gap-1.5">
                {currentUser.role === 'STORE_OWNER' ? (
                  <button
                    id="header-user-profile-btn"
                    onClick={() => setIsUserProfileOpen(true)}
                    className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-stone-100 border border-stone-200 transition-all text-left focus:outline-none"
                    title={`Comercio: ${currentStore?.name || currentUser.name}`}
                  >
                    {currentUser.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentStore?.name || currentUser.name}
                        className="w-7 h-7 rounded-full object-cover border border-amber-400"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700">
                        <Store className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="hidden xl:block">
                      <p className="text-xs font-bold text-stone-900 leading-tight truncate max-w-[120px]">
                        {currentStore?.name || currentUser.name}
                      </p>
                      <p className="text-[10px] text-amber-700 font-semibold leading-none">Comercio</p>
                    </div>
                  </button>
                ) : currentUser.role === 'SUPER_ADMIN' ? (
                  <button
                    id="header-user-profile-btn"
                    onClick={() => setIsUserProfileOpen(true)}
                    className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-stone-100 border border-stone-200 transition-all text-left focus:outline-none"
                    title={`Super Admin: ${currentUser.name}`}
                  >
                    {currentUser.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-7 h-7 rounded-full object-cover border border-rose-400"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700">
                        <Shield className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="hidden xl:block">
                      <p className="text-xs font-bold text-stone-900 leading-tight truncate max-w-[120px]">
                        {currentUser.name}
                      </p>
                      <p className="text-[10px] text-rose-700 font-semibold leading-none">Super Admin</p>
                    </div>
                  </button>
                ) : (
                  /* Cliente registrado */
                  <button
                    id="header-user-profile-btn"
                    onClick={() => setIsUserProfileOpen(true)}
                    className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-stone-100 border border-stone-200 transition-all text-left focus:outline-none"
                    title={`Cliente: ${currentUser.name}`}
                  >
                    {currentUser.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-7 h-7 rounded-full object-cover border border-stone-300"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-500">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div className="hidden xl:block">
                      <p className="text-xs font-bold text-stone-900 leading-tight truncate max-w-[120px]">
                        {currentUser.name}
                      </p>
                      <p className="text-[10px] text-blue-700 font-semibold leading-none">Cliente</p>
                    </div>
                  </button>
                )}
              </div>
            ) : (
              /* Usuario no registrado (Visitante / Tienda pública) */
              <div className="flex items-center gap-1.5">
                <button
                  id="header-auth-login-btn"
                  onClick={() => openAuthModal('login')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-700 hover:text-stone-950 hover:bg-stone-100 transition-colors"
                  title="Iniciar Sesión"
                >
                  <LogIn className="w-3.5 h-3.5 text-stone-600" />
                  <span>Iniciar Sesión</span>
                </button>

                <button
                  id="header-auth-register-btn"
                  onClick={() => openAuthModal('register_select')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-xs transition-colors"
                  title="Crear una cuenta nueva"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Registrarse</span>
                </button>
              </div>
            )}

            {/* Cart Trigger Button */}
            <button
              id="header-cart-btn"
              onClick={onOpenCart}
              className="flex items-center gap-2 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-xs transition-colors font-medium text-xs sm:text-sm"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cartTotal.itemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-stone-900 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                    {cartTotal.itemsCount}
                  </span>
                )}
              </div>
              <span className="font-bold hidden sm:inline">
                RD$ {cartTotal.subtotal.toLocaleString()}
              </span>
            </button>

            {/* Mobile menu hamburger */}
            <button
              id="header-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden rounded-lg hover:bg-stone-100 text-stone-700"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="mt-2.5 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar productos y tiendas..."
              className="w-full pl-10 pr-20 py-2 bg-stone-100 border border-stone-200 rounded-lg text-xs outline-none"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <button 
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold"
            >
              Buscar
            </button>
          </form>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="bg-stone-100/70 border-t border-stone-200 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-1 overflow-x-auto py-1.5 scrollbar-none text-xs font-medium text-stone-700">
            <button 
              onClick={() => {
                setSelectedCategorySlug(null);
                setCurrentView('catalog');
              }}
              className="px-3 py-1.5 rounded-md hover:bg-white hover:text-red-600 hover:shadow-xs transition-all flex items-center gap-1 text-stone-900 font-semibold"
            >
              <Layers className="w-3.5 h-3.5 text-red-600" />
              Todos los Productos
            </button>

            {mainCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.slug)}
                className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                  cat.slug === 'mascotas' 
                    ? 'font-bold text-amber-900 bg-amber-100/80 hover:bg-amber-200' 
                    : 'hover:bg-white hover:text-red-600 hover:shadow-xs'
                }`}
              >
                {cat.name}
                {cat.slug === 'mascotas' && <span className="ml-1 text-[10px] text-amber-700">🐶🐱</span>}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-stone-500">
            <button 
              onClick={() => setCurrentView('catalog')}
              className="text-stone-700 hover:text-red-600 font-medium py-1"
            >
              Explorar Tiendas
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-stone-200 px-4 py-4 space-y-3">
          <div className="font-bold text-xs uppercase tracking-wider text-stone-400">Categorías</div>
          <div className="grid grid-cols-2 gap-2">
            {mainCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.slug)}
                className="text-left px-3 py-2 text-xs font-medium rounded-lg bg-stone-50 hover:bg-stone-100 text-stone-800"
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="border-t border-stone-100 pt-3 space-y-2">
            {currentUser ? (
              <>
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {currentUser.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-9 h-9 rounded-full object-cover border border-stone-300"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-500">
                        <User className="w-4 h-4 text-stone-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-stone-900">{currentUser.name}</p>
                      <p className="text-[10px] text-stone-500">
                        {currentUser.role === 'SUPER_ADMIN' ? '🛡️ Super Admin' : currentUser.role === 'STORE_OWNER' ? '🏪 Comercio' : '👤 Cliente'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1"
                  >
                    Salir
                  </button>
                </div>

                {currentUser.role === 'STORE_OWNER' && (
                  <button
                    onClick={() => {
                      setCurrentView('store_dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2"
                  >
                    <Store className="w-4 h-4 text-amber-600" />
                    <span>Ir a Mi Panel de Tienda</span>
                  </button>
                )}

                {currentUser.role === 'SUPER_ADMIN' && (
                  <button
                    onClick={() => {
                      setCurrentView('admin_dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 text-xs font-bold text-rose-900 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2"
                  >
                    <Shield className="w-4 h-4 text-rose-600" />
                    <span>Ir a Panel Super Admin</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setCurrentView('customer_portal');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-stone-800 bg-stone-50 rounded-lg flex items-center gap-2"
                >
                  <Package className="w-4 h-4 text-stone-600" />
                  <span>Mis Pedidos y Direcciones</span>
                </button>

                <button
                  onClick={() => {
                    setIsUserProfileOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-stone-800 bg-stone-50 rounded-lg flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-red-600" />
                  <span>Mi Cuenta y Perfil</span>
                </button>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      openAuthModal('login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-center px-3 py-2 text-xs font-semibold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Iniciar Sesión</span>
                  </button>
                  <button
                    onClick={() => {
                      openAuthModal('register_select');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-center px-3 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Registrarse</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setCurrentView('sell_with_us');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 bg-red-50 rounded-lg flex items-center gap-2"
                >
                  <Store className="w-4 h-4" />
                  <span>¿Tienes una tienda? Vende en PlazaDO</span>
                </button>

                <button
                  onClick={() => {
                    showNotification('Inicia sesión para consultar tus pedidos', 'info');
                    openAuthModal('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-stone-800 bg-stone-50 rounded-lg flex items-center gap-2"
                >
                  <Package className="w-4 h-4 text-stone-600" />
                  <span>Mis Pedidos (Iniciar sesión)</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
      />
    </header>
  );
};
