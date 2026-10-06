import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { DominicanFlag } from '../common/DominicanFlag';
import { isProductPubliclyVisible, isStorePubliclyVisible } from '../../types';
import { CategoryIcon, getCategoryEmoji } from '../../utils/categoryIcons';
import { INITIAL_CATEGORIES } from '../../data/initialData';
import { 
  Store, 
  ArrowRight, 
  Star, 
  Truck, 
  ShieldCheck, 
  Heart, 
  Package, 
  Lock, 
  Headphones, 
  ChevronRight, 
  ChevronLeft,
  ShoppingCart,
  Sparkles,
  ShoppingBag,
  Tag,
  CheckCircle2,
  ExternalLink,
  Flame,
  Info
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { 
    products, 
    stores, 
    categories, 
    banners, 
    setSelectedCategorySlug, 
    setSelectedStoreSlug, 
    setSelectedProductId, 
    setCurrentView,
    setSearchQuery,
    addToCart,
    favorites,
    toggleFavoriteProduct,
    systemSettings,
    setOpenPolicySlug
  } = useApp();

  // Real Database Queries only — Never mock or fake data
  const approvedStores = stores.filter(isStorePubliclyVisible);
  const publishedProducts = products.filter(p => {
    if (!isProductPubliclyVisible(p)) return false;
    const store = stores.find(s => s.id === p.storeId);
    return store ? isStorePubliclyVisible(store) : false;
  });

  const featuredProducts = publishedProducts.filter(p => p.isFeatured);
  const displayProducts = featuredProducts.length > 0 ? featuredProducts : publishedProducts;

  const activeCategories = (categories && categories.length > 0) ? categories : INITIAL_CATEGORIES;
  const mainCategories = activeCategories.filter(c => !c.parentId);

  const handleCategorySelect = (slug: string) => {
    setSelectedCategorySlug(slug);
    setCurrentView('catalog');
  };

  const handleStoreSelect = (slugOrId: string) => {
    setSelectedStoreSlug(slugOrId);
    setCurrentView('store_public');
  };

  const productsTrackRef = useRef<HTMLDivElement>(null);
  const storesTrackRef = useRef<HTMLDivElement>(null);

  const scrollProducts = (dir: 'left' | 'right') => {
    if (productsTrackRef.current) {
      const amount = dir === 'left' ? -320 : 320;
      productsTrackRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const scrollStores = (dir: 'left' | 'right') => {
    if (storesTrackRef.current) {
      const amount = dir === 'left' ? -320 : 320;
      storesTrackRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Check if there is an active promotional banner in systemSettings or banners
  const promoBanner = banners?.find(b => b.isActive && b.imageUrl);

  // Beneficios component reusable for desktop order vs mobile order
  const BeneficiosComponent = ({ className = '' }: { className?: string }) => (
    <div className={`w-full ${className}`}>
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 shadow-xs">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          
          {/* 1. Compra segura */}
          <div className="flex items-center gap-3 pt-3 sm:pt-0 sm:px-2 first:pt-0">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/80">
              <Lock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                Compra segura
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Tus pagos protegidos
              </p>
            </div>
          </div>

          {/* 2. Tiendas verificadas */}
          <div className="flex items-center gap-3 pt-3 sm:pt-0 sm:px-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/80">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                Tiendas verificadas
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Comercios confiables
              </p>
            </div>
          </div>

          {/* 3. Envíos en toda RD */}
          <div className="flex items-center gap-3 pt-3 sm:pt-0 sm:px-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/80">
              <Truck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                Envíos en toda RD
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                A través de las tiendas
              </p>
            </div>
          </div>

          {/* 4. Soporte personalizado */}
          <div className="flex items-center gap-3 pt-3 sm:pt-0 sm:px-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/80">
              <Headphones className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight">
                Soporte personalizado
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Estamos para ayudarte
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 sm:space-y-12 pb-12 sm:pb-16 overflow-x-hidden">

      {/* ============================================================== */}
      {/* 2. HERO PRINCIPAL (Desktop & Mobile)                           */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 pt-3 sm:pt-6">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white border border-slate-800 shadow-lg">
          
          {/* Subtle background glow effect */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-6 p-6 sm:p-10 lg:p-14 relative z-10">
            
            {/* Columna de Texto Principal */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-left">
              
              {/* Badge oficial */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/10 backdrop-blur-md border border-white/15 text-emerald-300">
                <DominicanFlag className="w-4 h-3 rounded-2xs border border-white/20 shrink-0" />
                <span>Marketplace Multi-Tienda Dominicano</span>
              </div>

              {/* Título Principal */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black text-white tracking-tight leading-[1.12]">
                Todo lo que buscas,<br />
                <span className="text-emerald-400">en un solo lugar</span>
              </h1>

              {/* Texto Secundario */}
              <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-xl font-normal leading-relaxed">
                Descubre productos de tiendas dominicanas. Compra fácil, seguro y apoya lo nuestro.
              </p>

              {/* Botones de Acción */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="button"
                  id="hero-explore-btn"
                  onClick={() => {
                    setSelectedCategorySlug(null);
                    setCurrentView('catalog');
                  }}
                  className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-sm sm:text-base font-bold shadow-md hover:shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <span>Explorar productos</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  id="hero-create-store-btn"
                  onClick={() => setCurrentView('sell_with_us')}
                  className="px-6 py-3.5 bg-white/10 hover:bg-white/15 active:bg-white/20 text-white border border-white/25 hover:border-white/40 rounded-xl text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-2 backdrop-blur-sm cursor-pointer"
                >
                  <Store className="w-4 h-4 text-emerald-400" />
                  <span>Crear mi tienda</span>
                </button>
              </div>

              {/* Puntos clave */}
              <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Comercios 100% verificados</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Entregas en República Dominicana</span>
                </span>
              </div>

            </div>

            {/* Columna Visual / Banner Comercial */}
            <div className="lg:col-span-5 relative mt-2 lg:mt-0">
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-slate-800/60 aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/3] group">
                <img 
                  src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1000&auto=format&fit=crop&q=80" 
                  alt="Compras y comercio electrónico en República Dominicana" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent" />
                
                {/* Badge sobre la imagen */}
                <div className="absolute bottom-3 left-3 right-3 p-3 bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">Comercio Dominicano</p>
                      <p className="text-[10px] text-slate-300">Apoya las tiendas locales</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                    Garantizado
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. BENEFICIOS DE PLAZADO (DESKTOP: Inmediatamente debajo Hero)  */}
      {/* ============================================================== */}
      <section className="hidden md:block max-w-7xl mx-auto px-4">
        <BeneficiosComponent />
      </section>

      {/* ============================================================== */}
      {/* 4. CATEGORÍAS POPULARES (Desktop & Móvil)                      */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4">
        
        {/* Cabecera de Categorías */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              Categorías populares
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Encuentra productos por rubro oficial
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedCategorySlug(null);
              setCurrentView('catalog');
            }}
            className="text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 group"
          >
            <span>Ver todas las categorías</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Cuadrícula de Categorías (4 por fila en móvil adaptativo, hasta 6-8 en desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-4">
          {mainCategories.map(cat => {
            const count = publishedProducts.filter(p => p.categoryId === cat.id || p.categoryId === cat.slug).length;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.slug)}
                className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-500 hover:shadow-md transition-all text-left flex flex-col justify-between group active:scale-98 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-50 group-hover:bg-emerald-50 border border-slate-100 group-hover:border-emerald-200 flex items-center justify-center text-xl sm:text-2xl transition-colors shrink-0">
                    {getCategoryEmoji(cat)}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </div>

                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    {count > 0 ? `${count} ${count === 1 ? 'producto' : 'productos'}` : 'Explorar'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

      </section>

      {/* ============================================================== */}
      {/* 5. BANNER PROMOCIONAL (BLACK FRIDAY RD / OFERTAS)              */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4">
        {promoBanner ? (
          <div 
            onClick={() => {
              if (promoBanner.targetType === 'URL' && promoBanner.targetValue) {
                window.location.href = promoBanner.targetValue;
              } else if (promoBanner.targetType === 'CATEGORY' && promoBanner.targetValue) {
                handleCategorySelect(promoBanner.targetValue);
              } else {
                setSearchQuery('oferta');
                setCurrentView('catalog');
              }
            }}
            className="rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200 shadow-sm cursor-pointer group relative"
          >
            <img 
              src={promoBanner.imageUrl} 
              alt={promoBanner.title || 'Promoción Plazado.com'} 
              className="w-full h-44 sm:h-60 object-cover group-hover:scale-101 transition-transform"
              loading="lazy"
            />
            {promoBanner.title && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-white">{promoBanner.title}</h3>
                  {promoBanner.subtitle && <p className="text-xs sm:text-sm text-slate-200">{promoBanner.subtitle}</p>}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950 p-6 sm:p-8 text-white border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            
            <div className="space-y-2 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white tracking-wider uppercase shadow-xs">
                <Flame className="w-3.5 h-3.5" />
                <span>BLACK FRIDAY RD</span>
              </div>
              
              <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                Grandes ofertas de tus tiendas favoritas
              </h3>
              
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Aprovecha promociones exclusivas por tiempo limitado en comercios oficiales verificados de República Dominicana.
              </p>
            </div>

            <div className="shrink-0 relative z-10 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategorySlug(null);
                  setSearchQuery('black friday');
                  setCurrentView('catalog');
                }}
                className="w-full sm:w-auto px-6 py-3.5 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Ver ofertas</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          </div>
        )}
      </section>

      {/* ============================================================== */}
      {/* 6. PRODUCTOS DESTACADOS (Desktop: Grid | Móvil: Carrusel)      */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4">
        
        {/* Cabecera Productos */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              Productos destacados
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Artículos seleccionados de tiendas verificadas
            </p>
          </div>

          <div className="flex items-center gap-2">
            {displayProducts.length > 4 && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => scrollProducts('left')}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-emerald-600 transition-colors shadow-2xs"
                  title="Anterior"
                  aria-label="Ver productos anteriores"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollProducts('right')}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-emerald-600 transition-colors shadow-2xs"
                  title="Siguiente"
                  aria-label="Ver más productos"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setSelectedCategorySlug(null);
                setCurrentView('catalog');
              }}
              className="text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 group"
            >
              <span>Ver más productos</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Estado Vacío Elegante (Sin Datos Falsos) */}
        {displayProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center max-w-xl mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Próximamente productos destacados
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Los artículos publicados por los comercios dominicanos aparecerán en esta sección.
            </p>
            <button
              type="button"
              onClick={() => setCurrentView('sell_with_us')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <span>Publicar como comercio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Carrusel Táctil en Móvil / Grid en Desktop */
          <div
            ref={productsTrackRef}
            className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible pb-3 sm:pb-0 scrollbar-none snap-x snap-mandatory"
          >
            {displayProducts.slice(0, 8).map(prod => {
              const store = stores.find(s => s.id === prod.storeId);
              const isFav = favorites.productIds.includes(prod.id);
              const isOutOfStock = prod.stock <= 0;
              const hasDiscount = prod.promoPrice && prod.promoPrice < prod.price;

              return (
                <div
                  key={prod.id}
                  className="snap-start shrink-0 w-[220px] sm:w-auto bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
                >
                  {/* Imagen Principal y Botón Favoritos */}
                  <div 
                    className="relative aspect-square bg-slate-100 overflow-hidden cursor-pointer"
                    onClick={() => setSelectedProductId(prod.id)}
                  >
                    {prod.images && prod.images[0] ? (
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package className="w-10 h-10" />
                      </div>
                    )}

                    {/* Botón de Favoritos */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteProduct(prod.id);
                      }}
                      className={`absolute top-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-md transition-all shadow-xs ${
                        isFav 
                          ? 'bg-rose-50 text-rose-600' 
                          : 'bg-white/90 text-slate-600 hover:text-rose-600'
                      }`}
                      title={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-600 stroke-rose-600' : 'stroke-[2]'}`} />
                    </button>

                    {/* Badge de Oferta */}
                    {hasDiscount && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-rose-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider shadow-xs">
                        OFERTA
                      </span>
                    )}

                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center">
                        <span className="bg-white text-slate-900 text-xs font-bold px-2 py-1 rounded-md">
                          Agotado
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Información del Producto */}
                  <div className="p-3.5 flex flex-col justify-between flex-1 gap-2">
                    <div>
                      {/* Tienda */}
                      {store && (
                        <p className="text-[11px] text-slate-500 truncate mb-1">
                          {store.name}
                        </p>
                      )}

                      {/* Nombre */}
                      <h3 
                        onClick={() => setSelectedProductId(prod.id)}
                        className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 hover:text-emerald-700 cursor-pointer transition-colors leading-snug"
                        title={prod.name}
                      >
                        {prod.name}
                      </h3>

                      {/* Calificación */}
                      <div className="flex items-center gap-1 mt-1 text-amber-500 text-xs font-bold">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{prod.rating ? prod.rating.toFixed(1) : '4.8'}</span>
                      </div>
                    </div>

                    {/* Precio y Botón Agregar al Carrito */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        {hasDiscount ? (
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 line-through">
                              RD$ {prod.price.toLocaleString()}
                            </span>
                            <span className="font-black text-sm sm:text-base text-rose-600">
                              RD$ {prod.promoPrice?.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="font-black text-sm sm:text-base text-slate-900">
                            RD$ {prod.price.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => addToCart(prod.id, prod.storeId, 1)}
                        disabled={isOutOfStock}
                        className="p-2 sm:p-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-40 text-white rounded-xl font-bold transition-colors shadow-2xs cursor-pointer"
                        title="Agregar al carrito"
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </section>

      {/* ============================================================== */}
      {/* 7. TIENDAS DESTACADAS (Desktop: Grid | Móvil: Carrusel)         */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4">
        
        {/* Cabecera Tiendas */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              Tiendas destacadas
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Comercios verificados de la República Dominicana
            </p>
          </div>

          <div className="flex items-center gap-2">
            {approvedStores.length > 4 && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => scrollStores('left')}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-emerald-600 transition-colors shadow-2xs"
                  title="Anterior"
                  aria-label="Ver tiendas anteriores"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollStores('right')}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-emerald-600 transition-colors shadow-2xs"
                  title="Siguiente"
                  aria-label="Ver más tiendas"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setCurrentView('stores')}
              className="text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 group"
            >
              <span>Ver todas las tiendas</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Estado Vacío Elegante */}
        {approvedStores.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 text-center max-w-xl mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Próximamente tiendas destacadas
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ¿Tienes un negocio en República Dominicana? Únete y sé una de las primeras tiendas verificadas en Plazado.com.
            </p>
            <button
              type="button"
              onClick={() => setCurrentView('sell_with_us')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <span>Crear mi tienda</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Carrusel Táctil en Móvil / Grid en Desktop */
          <div
            ref={storesTrackRef}
            className="flex sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible pb-3 sm:pb-0 scrollbar-none snap-x snap-mandatory"
          >
            {approvedStores.slice(0, 8).map(store => {
              const category = categories.find(c => c.id === store.categoryId);
              const categoryName = category?.name || 'Comercio General';

              return (
                <div
                  key={store.id}
                  onClick={() => handleStoreSelect(store.slug || store.id)}
                  className="snap-start shrink-0 w-[240px] sm:w-auto bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group cursor-pointer"
                >
                  <div className="space-y-3">
                    {/* Logo & Calificación */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                        {store.logo ? (
                          <img
                            src={store.logo}
                            alt={store.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <Store className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{store.rating ? store.rating.toFixed(1) : '5.0'}</span>
                      </div>
                    </div>

                    {/* Nombre y Categoría */}
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {store.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {categoryName}
                      </p>
                    </div>

                    {store.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {store.description}
                      </p>
                    )}
                  </div>

                  {/* Botón Ver Tienda */}
                  <div className="pt-3 border-t border-slate-100 mt-3">
                    <button
                      type="button"
                      className="w-full py-2 bg-slate-100 group-hover:bg-emerald-600 text-slate-800 group-hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <span>Ver tienda</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </section>

      {/* ============================================================== */}
      {/* 8. CTA PARA TIENDAS (Banner Verde)                             */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="rounded-2xl sm:rounded-3xl bg-emerald-700 text-white p-6 sm:p-10 border border-emerald-600 shadow-md relative overflow-hidden">
          
          <div className="max-w-2xl space-y-4 relative z-10 text-left">
            <span className="text-xs font-bold uppercase tracking-wider bg-white/15 px-3 py-1 rounded-full text-emerald-100 inline-block">
              Para Comercios y Emprendedores
            </span>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              ¿Tienes una tienda?
            </h3>

            <p className="text-sm sm:text-base text-emerald-50 leading-relaxed font-normal">
              Vende en Plazado.com y llega a más clientes en toda República Dominicana.
            </p>

            <div>
              <button
                type="button"
                id="cta-create-store-btn"
                onClick={() => setCurrentView('sell_with_us')}
                className="px-6 py-3.5 bg-white text-emerald-800 hover:bg-emerald-50 active:bg-slate-100 rounded-xl text-sm font-bold shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Crear mi tienda</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Beneficios de la tienda (Configurables) */}
          <div className="mt-8 pt-6 border-t border-emerald-600/70 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-emerald-100 relative z-10">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Registro gratis</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>0.5% de comisión por venta</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Tu propia tienda virtual</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Herramientas para crecer</span>
            </div>
          </div>

          {/* Decorative glow */}
          <div className="absolute right-0 top-0 -mr-16 -mt-16 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        </div>
      </section>

      {/* ============================================================== */}
      {/* 9. COMPRA CON CONFIANZA                                         */}
      {/* ============================================================== */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Compra con confianza
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl leading-relaxed">
                Tu dinero permanece protegido hasta confirmar la entrega de tu pedido.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOpenPolicySlug('terminos-condiciones')}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors inline-flex items-center gap-2 shrink-0 cursor-pointer shadow-2xs"
          >
            <span>Cómo funciona</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>
      </section>

      {/* ============================================================== */}
      {/* BENEFICIOS EN MÓVIL (Ubicado justo antes del footer según spec) */}
      {/* ============================================================== */}
      <section className="md:hidden max-w-7xl mx-auto px-3">
        <BeneficiosComponent />
      </section>

    </div>
  );
};
