import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { isStorePubliclyVisible } from '../../types';
import { DominicanFlag } from '../common/DominicanFlag';
import { UserProfileModal } from '../common/UserProfileModal';
import { CategoryIcon, getCategoryEmoji } from '../../utils/categoryIcons';
import { INITIAL_CATEGORIES } from '../../data/initialData';
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
  ChevronDown,
  Layers,
  Sparkles,
  LogIn,
  UserPlus,
  Sun,
  Moon,
  Flame,
  Tag,
  HelpCircle,
  MapPin,
  ArrowRight
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
    selectedCategorySlug,
    setSelectedCategorySlug,
    favorites,
    systemSettings,
    openAuthModal,
    stores,
    showNotification,
    setAdminActiveTab,
    logout,
    orders,
    orderMessages,
    theme,
    toggleTheme,
    setThemeMode,
    setOpenPolicySlug
  } = useApp();

  const [searchCategory, setSearchCategory] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [headerImageError, setHeaderImageError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Imagen personalizada del Header configurada por el Super Admin (con soporte para modo oscuro)
  const customHeaderImage = (systemSettings?.logoType === 'custom' || systemSettings?.logoUrl)
    ? (theme === 'dark' && systemSettings?.logoDarkUrl ? systemSettings.logoDarkUrl : systemSettings?.logoUrl)
    : null;

  // Close categories dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCategoriesDropdownOpen(false);
      }
    };
    if (categoriesDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [categoriesDropdownOpen]);

  const userOrderIds = useMemo(() => {
    if (!currentUser) return new Set<string>();
    return new Set(orders.filter(o => o.customerId === currentUser.id).map(o => o.id));
  }, [orders, currentUser]);

  const customerUnreadChatCount = useMemo(() => {
    if (!currentUser || userOrderIds.size === 0) return 0;
    return orderMessages.filter(m => userOrderIds.has(m.orderId) && !m.readByCustomer && m.senderRole !== 'CUSTOMER').length;
  }, [orderMessages, userOrderIds, currentUser]);

  const publicStoresCount = stores.filter(isStorePubliclyVisible).length;
  const pendingStoresCount = stores.filter(s => s.status === 'PENDING' || s.status === 'IN_REVIEW').length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCategory) {
      setSelectedCategorySlug(searchCategory);
    }
    setCurrentView('catalog');
  };

  const handleCategoryClick = (catSlug: string | null) => {
    setSelectedCategorySlug(catSlug);
    setCurrentView('catalog');
    setCategoriesDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  // Main categories
  const activeCategories = (categories && categories.length > 0) ? categories : INITIAL_CATEGORIES;
  const mainCategories = activeCategories.filter(c => !c.parentId);
  const currentStore = currentUser?.role === 'STORE_OWNER' 
    ? stores.find(s => s.id === currentUser.storeId) 
    : null;

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-stone-950 text-stone-900 dark:text-white border-b border-stone-200 dark:border-stone-800 shadow-sm transition-colors duration-150">
      
      {/* ============================================================== */}
      {/* 1. HEADER DESKTOP — NIVEL 1 (Desktop Max-Width 1440px)          */}
      {/* ============================================================== */}
      <div className="hidden md:block border-b border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-950">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-5 py-2.5 flex items-center justify-between gap-4 lg:gap-6">
          
          {/* Izquierda: Logo oficial Plazado.com con slogan o imagen personalizada del Super Admin */}
          <div className="flex items-center shrink-0">
            <button 
              id="header-logo-btn"
              onClick={() => {
                setCurrentView('home');
                setSelectedCategorySlug(null);
              }}
              className="text-left flex items-center gap-2.5 group focus:outline-none hover:opacity-95 transition-opacity"
              title="Plazado.com — Todo en un solo lugar"
            >
              <img
                src={customHeaderImage && !headerImageError ? customHeaderImage : '/plazado-logo-integrado.png'}
                alt="Plazado.com — Todo en un solo lugar"
                className="w-[220px] h-[74px] object-contain object-center dark:brightness-150"
                onError={customHeaderImage && !headerImageError ? () => setHeaderImageError(true) : undefined}
              />
            </button>
          </div>

          {/* Centro: Buscador grande profesional con selector integrado y botón verde */}
          <form 
            onSubmit={handleSearchSubmit} 
            className="flex-1 max-w-2xl flex items-center relative group"
          >
            <div className="w-full flex items-stretch bg-slate-50 dark:bg-stone-800/90 hover:bg-white dark:hover:bg-stone-800 focus-within:bg-white dark:focus-within:bg-stone-800 border-2 border-slate-200 dark:border-stone-700 hover:border-slate-300 dark:hover:border-stone-600 focus-within:border-[#f20544] focus-within:ring-4 focus-within:ring-rose-500/10 rounded-xl transition-all shadow-2xs overflow-hidden">
              
              {/* Icono de búsqueda a la izquierda */}
              <div className="pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-stone-500">
                <Search className="w-4 h-4" />
              </div>

              {/* Input de texto principal */}
              <div className="relative flex-1 flex items-center">
                <input 
                  id="header-search-input"
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="¿Qué estás buscando?"
                  className="w-full pl-2.5 pr-8 py-2.5 bg-transparent text-sm font-medium text-slate-900 dark:text-stone-900 dark:text-stone-100 placeholder:text-slate-400 dark:placeholder:text-stone-500 placeholder:font-normal caret-[#f20544] outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-stone-700 dark:text-stone-200 hover:bg-slate-200 dark:hover:bg-stone-700 transition-colors absolute right-2 top-1/2 -translate-y-1/2"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Selector de categorías integrado a la derecha del input */}
              <div className="relative flex items-center bg-slate-100/70 dark:bg-stone-800 border-l border-slate-200 dark:border-stone-700 shrink-0">
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="appearance-none bg-transparent pl-3 pr-7 py-2.5 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:text-slate-900 dark:hover:text-white focus:outline-none cursor-pointer"
                  title="Filtrar por categoría"
                >
                  <option value="" className="dark:bg-stone-800 dark:text-stone-900 dark:text-stone-100">Todas las categorías</option>
                  {mainCategories.map(cat => (
                    <option key={cat.id} value={cat.slug} className="dark:bg-stone-800 dark:text-stone-900 dark:text-stone-100">
                      {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-stone-400 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
              </div>

              {/* Botón verde Buscar */}
              <button 
                type="submit"
                id="header-search-submit-btn"
                className="px-6 py-2.5 bg-[#f20544] hover:bg-[#d9043d] active:bg-[#b90334] text-white font-bold text-sm transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
              >
                <span>Buscar</span>
              </button>
            </div>
          </form>

          {/* Derecha: Ubicación, Acceso / Mi Cuenta, Favoritos, Carrito */}
          <div className="flex items-center gap-3 lg:gap-5 shrink-0">
            
            {/* Ubicación: Enviar a República Dominicana */}
            <div className="hidden xl:flex items-center gap-1.5 text-xs text-stone-700 dark:text-stone-200 font-medium">
              <MapPin className="w-4 h-4 text-[#f20544] shrink-0" />
              <div className="leading-tight text-left">
                <span className="text-[10px] text-slate-400 dark:text-stone-500 block font-normal">Enviar a</span>
                <span className="font-bold flex items-center gap-1 text-slate-900 dark:text-stone-900 dark:text-stone-100">
                  República Dominicana <ChevronDown className="w-3 h-3 text-slate-400 dark:text-stone-500" />
                </span>
              </div>
            </div>

            {/* Acceso: "Ingresar" / "Mi cuenta" */}
            {currentUser ? (
              <button
                id="header-user-profile-btn"
                onClick={() => setIsUserProfileOpen(true)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors text-left focus:outline-none group border border-transparent hover:border-slate-200 dark:hover:border-stone-700"
                title={`Mi cuenta: ${currentUser.name}`}
              >
                {currentUser.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-full object-cover border border-[#f20544] shadow-2xs"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-700 flex items-center justify-center text-[#f20544] dark:text-rose-400 font-bold text-xs">
                    {currentUser.role === 'STORE_OWNER' ? <Store className="w-4 h-4" /> : currentUser.role === 'SUPER_ADMIN' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                )}
                <div className="hidden lg:block leading-tight">
                  <span className="text-[10px] text-slate-400 dark:text-stone-400 block font-normal">Hola,</span>
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#f20544] dark:group-hover:text-rose-400 transition-colors truncate max-w-[100px] flex items-center gap-0.5">
                    {currentUser.name.split(' ')[0]} <ChevronDown className="w-3 h-3 text-slate-400 dark:text-stone-500" />
                  </span>
                </div>
              </button>
            ) : (
              <button
                id="header-auth-login-btn"
                onClick={() => openAuthModal('login')}
                className="flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:text-[#f20544] dark:hover:text-rose-400 transition-colors p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-stone-800 cursor-pointer"
                title="Ingresar a mi cuenta"
              >
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-stone-800 flex items-center justify-center text-slate-600 dark:text-stone-300">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-left leading-tight hidden lg:block">
                  <span className="text-[10px] text-slate-400 dark:text-stone-500 font-normal block">Ingresar</span>
                  <span className="font-bold flex items-center gap-0.5 text-slate-900 dark:text-stone-900 dark:text-stone-100">
                    Mi cuenta <ChevronDown className="w-3 h-3 text-slate-400 dark:text-stone-500" />
                  </span>
                </div>
                <span className="lg:hidden font-bold">Ingresar</span>
              </button>
            )}

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
              className="flex items-center gap-1.5 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 hover:text-[#f20544] dark:hover:text-rose-400 relative transition-colors"
              title="Mis Favoritos"
            >
              <div className="relative">
                <Heart className="w-5 h-5 stroke-[2]" />
                {(favorites.productIds.length + favorites.storeIds.length) > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#f20544] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-stone-900 shadow-2xs">
                    {favorites.productIds.length + favorites.storeIds.length}
                  </span>
                )}
              </div>
              <span className="hidden xl:inline text-xs font-bold text-stone-900 dark:text-stone-100">Favoritos</span>
            </button>

            {/* Selector explícito de apariencia: Claro / Oscuro */}
            <div
              id="header-theme-selector"
              className="flex items-center rounded-full border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-900 p-1 shadow-2xs"
              role="group"
              aria-label="Seleccionar apariencia"
            >
              <button
                type="button"
                onClick={() => setThemeMode('light')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${theme === 'light' ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-400 hover:text-white'}`}
                aria-pressed={theme === 'light'}
                title="Usar fondo blanco"
              >
                <Sun className="w-4 h-4" />
                <span className="hidden xl:inline">Claro</span>
              </button>
              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${theme === 'dark' ? 'bg-stone-900 text-white shadow-sm' : 'text-stone-500 hover:text-stone-900 dark:hover:text-white'}`}
                aria-pressed={theme === 'dark'}
                title="Usar fondo oscuro"
              >
                <Moon className="w-4 h-4" />
                <span className="hidden xl:inline">Oscuro</span>
              </button>
            </div>

            {/* Carrito */}
            <button
              id="header-cart-btn"
              onClick={onOpenCart}
              className="flex items-center gap-2 px-3.5 py-2 hover:bg-slate-100 dark:hover:bg-stone-800 text-slate-800 dark:text-stone-900 dark:text-stone-100 rounded-xl transition-colors font-semibold text-xs sm:text-sm cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-stone-700"
              title="Ver Mi Carrito"
            >
              <div className="relative">
                <ShoppingCart className="w-5 h-5 text-stone-900 dark:text-stone-100" />
                <span className="absolute -top-2 -right-2.5 bg-[#f20544] text-white text-[10px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-stone-900 shadow-2xs">
                  {cartTotal.itemsCount}
                </span>
              </div>
              <span className="font-bold hidden sm:inline text-stone-900 dark:text-stone-100">
                Mi carrito
              </span>
            </button>

          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. HEADER DESKTOP — NIVEL 2: BARRA DE NAVEGACIÓN               */}
      {/* ============================================================== */}
      <div className="hidden md:block bg-white dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-5 flex items-center justify-between h-10 text-xs">
          
          {/* Navegación Principal */}
          <div className="flex items-center gap-1 sm:gap-3 text-stone-700 dark:text-stone-200">
            
            {/* ☰ Todas las categorías (Botón verde destacado) */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold bg-[#f20544] hover:bg-[#d9043d] text-white transition-colors shadow-2xs cursor-pointer"
                title="Desplegar todas las categorías oficiales"
              >
                <Menu className="w-4 h-4" />
                <span>Todas las categorías</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${categoriesDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Menú Flotante de Categorías */}
              {categoriesDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-64 bg-black dark:bg-black rounded-2xl shadow-xl border border-slate-200 dark:border-stone-700 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-stone-500 px-3 py-1 tracking-wider">
                    Categorías de Plazado
                  </div>
                  <div className="max-h-80 overflow-y-auto space-y-0.5">
                    <button
                      onClick={() => handleCategoryClick(null)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-stone-900 dark:text-stone-100 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-[#f20544] dark:hover:text-rose-400 transition-colors flex items-center gap-2.5"
                    >
                      <Layers className="w-4 h-4 text-[#f20544] dark:text-rose-400" />
                      <span>Todos los Productos</span>
                    </button>
                    {mainCategories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat.slug)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2.5 ${
                          selectedCategorySlug === cat.slug
                            ? 'bg-rose-50 dark:bg-rose-950/50 text-[#f20544] dark:text-rose-400 font-bold'
                            : 'text-stone-900 dark:text-stone-100 hover:bg-slate-100 dark:hover:bg-stone-800 hover:text-[#f20544] dark:hover:text-rose-400'
                        }`}
                      >
                        <span className="text-sm shrink-0">{getCategoryEmoji(cat)}</span>
                        <span className="truncate">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 🔥 Ofertas */}
            <button
              onClick={() => {
                setSelectedCategorySlug(null);
                setSearchQuery('oferta');
                setCurrentView('catalog');
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-stone-800 hover:text-[#f20544] dark:hover:text-rose-400 transition-colors text-stone-700 dark:text-stone-200"
            >
              <span>🔥</span>
              <span>Ofertas</span>
            </button>

            {/* 🏪 Tiendas */}
            <button
              id="header-nav-stores-link"
              onClick={() => setCurrentView('stores')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-colors ${
                currentView === 'stores' 
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-[#f20544] dark:text-rose-400' 
                  : 'hover:bg-slate-100 dark:hover:bg-stone-800 hover:text-[#f20544] dark:hover:text-rose-400 text-stone-700 dark:text-stone-200'
              }`}
            >
              <Store className="w-3.5 h-3.5 text-slate-500 dark:text-stone-400" />
              <span>Tiendas</span>
            </button>

            {/* 🏷️ Black Friday */}
            <button
              onClick={() => {
                setSelectedCategorySlug(null);
                setSearchQuery('black friday');
                setCurrentView('catalog');
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-stone-800 hover:text-[#f20544] dark:hover:text-rose-400 transition-colors text-stone-700 dark:text-stone-200"
            >
              <Tag className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Black Friday</span>
            </button>

            {/* 📦 Nuevos productos con pill 'Nuevo' */}
            <button
              onClick={() => {
                setSelectedCategorySlug(null);
                setSearchQuery('');
                setCurrentView('catalog');
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold hover:bg-slate-100 dark:hover:bg-stone-800 hover:text-[#f20544] dark:hover:text-rose-400 transition-colors text-stone-700 dark:text-stone-200"
            >
              <Package className="w-3.5 h-3.5 text-slate-500 dark:text-stone-400" />
              <span>Nuevos productos</span>
              <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full leading-tight ml-0.5">
                Nuevo
              </span>
            </button>

            {/* ❓ Ayuda */}
            <button
              onClick={() => {
                setOpenPolicySlug('terminos-condiciones');
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-slate-600 dark:text-stone-400 hover:text-[#f20544] dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Ayuda</span>
            </button>

          </div>

          {/* Extremo Derecho: Vende en Plazado destacado */}
          <div className="flex items-center gap-2">
            
            {/* Acceso para Super Admin si está autenticado */}
            {currentUser?.role === 'SUPER_ADMIN' && (
              <button 
                onClick={() => {
                  if (pendingStoresCount > 0) setAdminActiveTab('solicitudes');
                  setCurrentView('admin_dashboard');
                }}
                className="text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-rose-600" />
                <span>Super Admin</span>
                {pendingStoresCount > 0 && (
                  <span className="bg-amber-500 text-stone-950 font-black text-[10px] px-1.5 py-0.2 rounded-full animate-pulse shadow-xs">
                    {pendingStoresCount}
                  </span>
                )}
              </button>
            )}

            {/* Botón Verde Destacado: Vende en Plazado */}
            <button
              id="header-sell-btn"
              onClick={() => setCurrentView('sell_with_us')}
              className="bg-[#f20544] hover:bg-[#d9043d] active:bg-[#b90334] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Vender en Plazado.com"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Vende en Plazado</span>
            </button>
          </div>

        </div>
      </div>

      {/* ============================================================== */}
      {/* 10. HEADER MÓVIL (Mobile Viewport Only)                         */}
      {/* ============================================================== */}
      <div className="md:hidden px-3 pt-2 pb-2 bg-white dark:bg-stone-950 border-b border-slate-200/80 dark:border-stone-800">
        
        {/* Primera línea: ☰ | Logo Plazado.com | Tema & 🛒 */}
        <div className="flex items-center justify-between gap-2 pb-2">
          
          {/* ☰ Botón menú lateral */}
          <button
            id="mobile-drawer-toggle"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -ml-1 text-stone-700 dark:text-stone-200 hover:text-slate-900 dark:hover:text-white active:scale-95 transition-transform"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logo oficial Plazado.com / Imagen personalizada del Header */}
          <button 
            type="button"
            onClick={() => {
              setCurrentView('home');
              setSelectedCategorySlug(null);
            }}
            className="focus:outline-none flex items-center gap-2"
            title="Inicio Plazado.com"
          >
            <img
                src={customHeaderImage && !headerImageError ? customHeaderImage : '/plazado-logo-integrado.png'}
                alt="Plazado.com — Todo en un solo lugar"
                className="w-[150px] h-[50px] object-contain object-center dark:brightness-150"
                onError={customHeaderImage && !headerImageError ? () => setHeaderImageError(true) : undefined}
              />
          </button>

          {/* Acciones derechas: Tema Claro/Oscuro + 🛒 Carrito */}
          <div className="flex items-center gap-1">
            {/* Selector de tema disponible para todos los visitantes, con o sin sesión */}
            <div
              id="mobile-theme-selector"
              className="flex items-center rounded-lg border border-stone-700 bg-stone-900 p-0.5"
              role="group"
              aria-label="Seleccionar apariencia"
            >
              <button
                type="button"
                onClick={() => setThemeMode('light')}
                className={`p-1.5 rounded-md transition-all ${theme === 'light' ? 'bg-white text-stone-950' : 'text-stone-400'}`}
                aria-label="Vista clara"
                aria-pressed={theme === 'light'}
                title="Vista clara"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setThemeMode('dark')}
                className={`p-1.5 rounded-md transition-all ${theme === 'dark' ? 'bg-stone-700 text-white' : 'text-stone-400'}`}
                aria-label="Vista oscura"
                aria-pressed={theme === 'dark'}
                title="Vista oscura"
              >
                <Moon className="w-4 h-4" />
              </button>
            </div>

            {/* 🛒 Carrito con badge */}
            <button
              type="button"
              onClick={onOpenCart}
              className="p-2 -mr-1 text-stone-700 dark:text-stone-200 hover:text-rose-700 relative active:scale-95 transition-transform"
              aria-label="Ver carrito"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartTotal.itemsCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-[#f20544] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white dark:border-stone-900 shadow-2xs">
                  {cartTotal.itemsCount > 99 ? '99+' : cartTotal.itemsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Segunda línea: Buscador ocupando prácticamente todo el ancho */}
        <form onSubmit={handleSearchSubmit} className="relative mb-2">
          <div className="flex items-center bg-slate-50 dark:bg-stone-800 border border-slate-300 dark:border-stone-700 focus-within:border-[#f20544] focus-within:ring-2 focus-within:ring-rose-500/20 rounded-xl overflow-hidden shadow-2xs">
            <Search className="w-4 h-4 text-slate-400 dark:text-stone-500 ml-3 pointer-events-none shrink-0" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="¿Qué estás buscando?"
              className="w-full px-2.5 py-2 text-sm font-medium text-slate-900 dark:text-stone-900 dark:text-stone-100 placeholder:text-slate-400 dark:placeholder:text-stone-500 outline-none bg-transparent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 mr-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button 
              type="submit"
              className="bg-[#f20544] text-white font-bold text-xs px-3.5 py-2 hover:bg-[#d9043d] shrink-0 transition-colors"
            >
              Buscar
            </button>
          </div>
        </form>

        {/* Tercera línea: Accesos horizontales táctiles */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs whitespace-nowrap">
          <button
            onClick={() => {
              setSelectedCategorySlug(null);
              setSearchQuery('oferta');
              setCurrentView('catalog');
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-full font-medium text-slate-700 flex items-center gap-1 shrink-0"
          >
            <span>🔥</span>
            <span>Ofertas</span>
          </button>

          <button
            onClick={() => setCurrentView('stores')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-full font-medium text-slate-700 flex items-center gap-1 shrink-0"
          >
            <span>🏪</span>
            <span>Tiendas</span>
          </button>

          <button
            onClick={() => {
              setSelectedCategorySlug(null);
              setSearchQuery('black friday');
              setCurrentView('catalog');
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-full font-medium text-slate-700 flex items-center gap-1 shrink-0"
          >
            <span>🏷️</span>
            <span>Black Friday</span>
          </button>

          <button
            onClick={() => {
              setSelectedCategorySlug(null);
              setSearchQuery('');
              setCurrentView('catalog');
            }}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-full font-medium text-slate-700 flex items-center gap-1 shrink-0"
          >
            <span>🆕</span>
            <span>Nuevos</span>
          </button>

          <button
            onClick={() => setCurrentView('sell_with_us')}
            className="px-2.5 py-1 bg-rose-50 text-[#f20544] border border-rose-200 rounded-full font-bold flex items-center gap-1 shrink-0"
          >
            <span>Vender</span>
          </button>
        </div>

      </div>

      {/* ============================================================== */}
      {/* DRAWER MENU MÓVIL EXTENDIDO                                   */}
      {/* ============================================================== */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-4 space-y-4 animate-in slide-in-from-top-2 duration-150">
          
          {/* Acceso Rápido Productos & Tiendas */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setSelectedCategorySlug(null);
                setCurrentView('catalog');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 text-xs font-bold rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center gap-1.5"
            >
              <Layers className="w-4 h-4 text-[#f20544]" />
              <span>Todos los Productos</span>
            </button>
            <button
              onClick={() => {
                setCurrentView('stores');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 text-xs font-bold rounded-xl bg-rose-50 text-rose-800 border border-rose-200 flex items-center justify-center gap-1.5"
            >
              <Store className="w-4 h-4 text-[#f20544]" />
              <span>Tiendas RD ({publicStoresCount})</span>
            </button>
          </div>

          {/* Categorías populares en el drawer */}
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Explorar Categorías
            </div>
            <div className="grid grid-cols-2 gap-2">
              {mainCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.slug)}
                  className="text-left px-3 py-2 text-xs font-medium rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 flex items-center gap-2"
                >
                  <span className="text-base shrink-0">{getCategoryEmoji(cat)}</span>
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cuenta / Auth en Móvil */}
          <div className="border-t border-slate-100 pt-3 space-y-2">
            {currentUser ? (
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {currentUser.avatar ? (
                      <img
                        src={currentUser.avatar}
                        alt={currentUser.name}
                        className="w-8 h-8 rounded-full object-cover border border-[#f20544]"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-rose-100 text-[#f20544] flex items-center justify-center font-bold text-xs">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {currentUser.role === 'SUPER_ADMIN' ? 'Super Admin' : currentUser.role === 'STORE_OWNER' ? 'Comercio' : 'Cliente'}
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
                    className="w-full text-left px-3 py-2 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2"
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
                    className="w-full text-left px-3 py-2 text-xs font-bold text-rose-900 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2"
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
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-800 bg-slate-50 rounded-xl flex items-center gap-2"
                >
                  <Package className="w-4 h-4 text-slate-600" />
                  <span>Mis Pedidos y Direcciones</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      openAuthModal('login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl text-center"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => {
                      openAuthModal('register_select');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 text-xs font-bold text-white bg-[#f20544] hover:bg-[#d9043d] rounded-xl text-center shadow-xs"
                  >
                    Registrarse
                  </button>
                </div>

                <button
                  onClick={() => {
                    setCurrentView('sell_with_us');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2"
                >
                  <Store className="w-4 h-4 text-[#f20544]" />
                  <span>¿Tienes una tienda? Vende en PlazaDO</span>
                </button>
              </div>
            )}

            {/* Ayuda y WhatsApp */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-600">
              <button 
                type="button"
                onClick={() => {
                  setOpenPolicySlug('terminos-condiciones');
                  setMobileMenuOpen(false);
                }}
                className="text-rose-700 font-semibold"
              >
                Ayuda & Soporte
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-1.5 text-slate-600 font-medium"
              >
                {theme === 'dark' ? <Moon className="w-3.5 h-3.5 text-amber-500" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                <span>{theme === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* Modal de perfil de usuario */}
      <UserProfileModal
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
      />

    </header>
  );
};
