import React, { useRef, useMemo, useState } from 'react';
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
  Search,
  Sparkles,
  CheckCircle2,
  Users,
  MapPin,
  TrendingUp,
  Percent,
  Plus,
  Palette
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
    setOpenPolicySlug,
    systemSettings,
    currentUser,
    setAdminActiveTab
  } = useApp();

  const [heroImageError, setHeroImageError] = useState(false);

  // Imagen del Header/Hero configurable por el Super Admin
  const heroImageSrc = (!heroImageError && systemSettings?.headerBannerUrl)
    ? systemSettings.headerBannerUrl
    : "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&auto=format&fit=crop&q=80";

  // Real Database Queries only — Never mock or fake data
  const approvedStores = useMemo(() => stores.filter(isStorePubliclyVisible), [stores]);
  
  const publishedProducts = useMemo(() => {
    return products.filter(p => {
      if (!isProductPubliclyVisible(p)) return false;
      const store = stores.find(s => s.id === p.storeId);
      return store ? isStorePubliclyVisible(store) : false;
    });
  }, [products, stores]);

  // Fallback Rule #7: If featuredProducts is empty, fallback to active published products
  const featuredProducts = useMemo(() => publishedProducts.filter(p => p.isFeatured), [publishedProducts]);
  const displayProducts = useMemo(() => {
    return featuredProducts.length > 0 ? featuredProducts : publishedProducts;
  }, [featuredProducts, publishedProducts]);

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
      const amount = dir === 'left' ? -360 : 360;
      productsTrackRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const scrollStores = (dir: 'left' | 'right') => {
    if (storesTrackRef.current) {
      const amount = dir === 'left' ? -360 : 360;
      storesTrackRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Preset mapping for categories in the exact order and style of the reference image
  const visualCategories = [
    { name: 'Tecnología', icon: '💻', slug: 'tecnologia' },
    { name: 'Moda', icon: '👕', slug: 'moda' },
    { name: 'Hogar', icon: '🛋️', slug: 'hogar' },
    { name: 'Belleza y Cuidado', icon: '💄', slug: 'belleza-cuidado' },
    { name: 'Deportes', icon: '🏋️', slug: 'deportes' },
    { name: 'Mascotas', icon: '🐶', slug: 'mascotas' },
    { name: 'Electrónica', icon: '🎧', slug: 'electronica' },
    { name: 'Robótica', icon: '🤖', slug: 'robotica' },
    { name: 'Vehículos', icon: '🚗', slug: 'vehiculos' },
    { name: 'Juguetes', icon: '🧸', slug: 'juguetes' },
    { name: 'Salud', icon: '❤️', slug: 'salud' },
    { name: 'Alimentos y Bebidas', icon: '🛒', slug: 'alimentos-bebidas' },
    { name: 'Herramientas', icon: '🔧', slug: 'herramientas' },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-0 sm:px-4 lg:px-6 space-y-4 sm:space-y-6 pb-12 sm:pb-16 overflow-x-hidden">

      {/* ============================================================== */}
      {/* 2. HERO PRINCIPAL — REPLICA VISUAL EXACTA DE LA REFERENCIA     */}
      {/* ============================================================== */}
      <section className="pt-2 sm:pt-4">
        <div className="relative rounded-none sm:rounded-2xl overflow-hidden bg-gradient-to-br from-stone-950 via-black to-stone-900 dark:from-stone-950 dark:via-black dark:to-stone-900 border border-slate-200/90 dark:border-stone-800 shadow-xs min-h-[330px] sm:min-h-[400px] lg:h-[390px] flex items-center">
          
          {/* Suaves elementos de luz y ambientación de marca */}
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-rose-100/40 dark:bg-rose-900/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-teal-100/30 dark:bg-teal-900/20 rounded-full blur-3xl pointer-events-none" />

          {/* Contenido en dos zonas perfectamente integradas */}
          <div className="relative z-10 w-full h-full flex flex-col justify-center px-5 sm:px-10 lg:px-12 py-7 sm:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-3 lg:gap-8 h-full">
              
              {/* ZONA IZQUIERDA: Textos y Botones principales */}
              <div className="lg:col-span-5 space-y-3 sm:space-y-5 text-left max-w-xl">
                
                {/* Título Principal Grande con Verde Corporativo de Alta Visibilidad */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[46px] font-black text-white tracking-tight leading-[1.05]">
                  Todo lo que buscas,<br />
                  <span className="text-[#f20544] dark:text-rose-400">en un solo lugar</span>
                </h1>

                {/* Texto Descriptivo */}
                <p className="text-sm sm:text-base lg:text-lg text-stone-200 font-normal leading-relaxed">
                  Descubre miles de productos de tiendas Dominicanas. Compra fácil, seguro y apoya lo nuestro.
                </p>

                {/* Botones de Acción */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    type="button"
                    id="hero-explore-btn"
                    onClick={() => {
                      setSelectedCategorySlug(null);
                      setCurrentView('catalog');
                    }}
                    className="px-6 py-3.5 bg-[#f20544] hover:bg-[#d9043d] active:bg-[#b90334] text-white rounded-full text-sm sm:text-base font-bold shadow-md hover:shadow-rose-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Search className="w-4 h-4 stroke-[2.5]" />
                    <span>Explorar productos</span>
                    <ArrowRight className="w-4 h-4 ml-0.5" />
                  </button>

                  <button
                    type="button"
                    id="hero-create-store-btn"
                    onClick={() => setCurrentView('sell_with_us')}
                    className="px-6 py-3.5 bg-white dark:bg-stone-800 hover:bg-slate-50 dark:hover:bg-stone-700 active:bg-slate-100 text-slate-800 dark:text-stone-100 rounded-full text-sm sm:text-base font-bold shadow-xs hover:shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-300 dark:border-stone-700"
                  >
                    <Store className="w-4 h-4 text-[#f20544] dark:text-rose-400" />
                    <span>Crear mi tienda</span>
                  </button>
                </div>

              </div>

              {/* ZONA DERECHA: Imagen comercial atractiva y luminosa & Floating Badges */}
              <div className="lg:col-span-7 relative h-full flex items-center justify-center">
                
                {/* Contenedor de la Imagen con badges superpuestos */}
                <div className="relative w-full h-[190px] sm:h-[300px] lg:h-[390px] rounded-xl sm:rounded-2xl overflow-hidden shadow-md border border-slate-200/80 dark:border-stone-800 group">
                  <img 
                    src={heroImageSrc} 
                    alt="Compras en Plazado.com República Dominicana" 
                    className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-500"
                    loading="eager"
                    onError={() => setHeroImageError(true)}
                  />
                  
                  {/* Sutil gradiente para integrar badges */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

                  {/* Acceso rápido para el Super Admin para cambiar la imagen del Header / Hero */}
                  {currentUser?.role === 'SUPER_ADMIN' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAdminActiveTab('branding');
                        setCurrentView('admin_dashboard');
                      }}
                      className="absolute top-3 left-3 bg-stone-900/85 hover:bg-stone-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-full backdrop-blur-md border border-stone-700 shadow-md flex items-center gap-1.5 z-30 transition-all cursor-pointer hover:border-rose-500"
                      title="Super Admin: Establecer imagen del Header / Hero"
                    >
                      <Palette className="w-3.5 h-3.5 text-rose-400" />
                      <span>Cambiar imagen Header</span>
                    </button>
                  )}

                  {/* Doodle 'Apoya tiendas Dominicanas ♡' */}
                  <div className="absolute top-3 right-3 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-slate-200 dark:border-stone-700 text-slate-900 dark:text-white text-xs font-bold flex items-center gap-1.5 animate-bounce-subtle z-20">
                    <span>Apoya tiendas Dominicanas</span>
                    <span className="text-rose-500">♡</span>
                    <DominicanFlag className="w-4 h-3 rounded-2xs inline-block" />
                  </div>

                  {/* Badges de confianza sobre la imagen */}
                  <div className="absolute bottom-3 left-3 right-3 grid grid-cols-2 gap-2 z-20">
                    {/* Badge 1: Productos de tiendas en RD */}
                    <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-xl p-2.5 shadow-md border border-slate-200/80 dark:border-stone-700 flex items-center gap-2.5 hover:-translate-y-0.5 transition-transform text-left">
                      <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-[#f20544] dark:text-rose-400 flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">Tiendas en RD</p>
                        <p className="text-[10px] text-slate-500 dark:text-stone-400 truncate">Envío local</p>
                      </div>
                    </div>

                    {/* Badge 2: Pago seguro */}
                    <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-xl p-2.5 shadow-md border border-slate-200/80 dark:border-stone-700 flex items-center gap-2.5 hover:-translate-y-0.5 transition-transform text-left">
                      <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-[#f20544] dark:text-rose-400 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 dark:text-white truncate">Pago seguro</p>
                        <p className="text-[10px] text-slate-500 dark:text-stone-400 truncate">Protegido</p>
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. FRANJA DE CONFIANZA (4 Columnas uniformes a todo lo ancho)   */}
      {/* ============================================================== */}
      <section>
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-slate-200/80 dark:border-stone-800 p-4 sm:p-5 shadow-xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-stone-800">
            
            {/* 1. Compra segura */}
            <div className="flex items-center gap-3.5 pt-3 sm:pt-0 sm:px-3 first:pt-0">
              <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-[#f20544] dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100/70 dark:border-rose-800/40">
                <Lock className="w-5 h-5 stroke-[2.3]" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                  Compra segura
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-stone-400 mt-0.5 leading-snug">
                  Tus pagos protegidos
                </p>
              </div>
            </div>

            {/* 2. Tiendas verificadas */}
            <div className="flex items-center gap-3.5 pt-3 sm:pt-0 sm:px-3">
              <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-[#f20544] dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100/70 dark:border-rose-800/40">
                <ShieldCheck className="w-5 h-5 stroke-[2.3]" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                  Tiendas verificadas
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-stone-400 mt-0.5 leading-snug">
                  Comercios confiables
                </p>
              </div>
            </div>

            {/* 3. Envíos en toda RD */}
            <div className="flex items-center gap-3.5 pt-3 sm:pt-0 sm:px-3">
              <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-[#f20544] dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100/70 dark:border-rose-800/40">
                <Truck className="w-5 h-5 stroke-[2.3]" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                  Envíos en toda RD
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-stone-400 mt-0.5 leading-snug">
                  A través de las tiendas
                </p>
              </div>
            </div>

            {/* 4. Soporte personalizado */}
            <div className="flex items-center gap-3.5 pt-3 sm:pt-0 sm:px-3">
              <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-[#f20544] dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100/70 dark:border-rose-800/40">
                <Headphones className="w-5 h-5 stroke-[2.3]" />
              </div>
              <div className="text-left">
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                  Soporte personalizado
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-stone-400 mt-0.5 leading-snug">
                  Estamos para ayudarte
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. CATEGORÍAS POPULARES — FILA VISUAL DE ECOMMERCE             */}
      {/* ============================================================== */}
      <section className="space-y-3.5">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Categorías populares
          </h2>

          <button
            type="button"
            onClick={() => {
              setSelectedCategorySlug(null);
              setCurrentView('catalog');
            }}
            className="text-xs sm:text-sm font-bold text-[#f20544] dark:text-rose-400 hover:text-[#d9043d] transition-colors flex items-center gap-1 group cursor-pointer"
          >
            <span>Ver todas las categorías</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {/* Fila Horizontal de Tarjetas Visuales (Idéntica a la referencia) */}
        <div className="grid grid-cols-4 sm:grid-cols-7 lg:grid-cols-10 xl:grid-cols-[repeat(14,minmax(0,1fr))] gap-2.5 sm:gap-3 overflow-x-auto pb-1 scrollbar-none">
          {visualCategories.map((item, idx) => {
            // Find if this category exists in real database categories
            const realCat = mainCategories.find(c => c.slug === item.slug || c.name.toLowerCase().includes(item.name.toLowerCase()));
            const targetSlug = realCat ? realCat.slug : item.slug;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleCategorySelect(targetSlug)}
                className="bg-white dark:bg-stone-900 rounded-2xl border border-slate-200/70 dark:border-stone-800 p-3 sm:p-3.5 flex flex-col items-center justify-center text-center hover:border-[#f20544] dark:hover:border-rose-500 hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-pointer aspect-square min-w-[80px]"
                title={`Explorar ${item.name}`}
              >
                <span className="text-2xl sm:text-3xl mb-1.5 filter drop-shadow-2xs group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-stone-200 group-hover:text-[#f20544] dark:group-hover:text-rose-400 transition-colors leading-tight line-clamp-1">
                  {item.name}
                </span>
              </button>
            );
          })}

          {/* Más categorías card */}
          <button
            type="button"
            onClick={() => {
              setSelectedCategorySlug(null);
              setCurrentView('catalog');
            }}
            className="bg-slate-50 dark:bg-stone-800/60 hover:bg-white dark:hover:bg-stone-800 rounded-2xl border border-dashed border-slate-300 dark:border-stone-700 hover:border-[#f20544] dark:hover:border-rose-500 p-3 sm:p-3.5 flex flex-col items-center justify-center text-center transition-all group cursor-pointer aspect-square min-w-[80px]"
            title="Ver catálogo completo"
          >
            <span className="text-2xl mb-1.5 text-slate-400 dark:text-stone-500 group-hover:text-[#f20544] dark:group-hover:text-rose-400 group-hover:scale-110 transition-transform">
              •••
            </span>
            <span className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-stone-400 group-hover:text-[#f20544] dark:group-hover:text-rose-400 transition-colors leading-tight line-clamp-1">
              Más categorías
            </span>
          </button>
        </div>

      </section>

      {/* ============================================================== */}
      {/* 5. PRODUCTOS DESTACADOS — GRID DE 8 TARJETA MARKETPLACE        */}
      {/* ============================================================== */}
      <section className="space-y-3.5">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Productos destacados
          </h2>

          <div className="flex items-center gap-2">
            {displayProducts.length > 4 && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => scrollProducts('left')}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-[#f20544] transition-colors shadow-2xs cursor-pointer"
                  title="Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollProducts('right')}
                  className="p-1.5 rounded-lg hover:bg-white text-slate-700 hover:text-[#f20544] transition-colors shadow-2xs cursor-pointer"
                  title="Siguiente"
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
              className="text-xs sm:text-sm font-bold text-[#f20544] hover:text-[#d9043d] transition-colors flex items-center gap-1 group cursor-pointer"
            >
              <span>Ver más productos</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Fallback si no hay productos disponibles aún */}
        {displayProducts.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-slate-200 dark:border-stone-800 p-8 text-center max-w-lg mx-auto space-y-3">
            <Package className="w-10 h-10 text-slate-400 dark:text-stone-500 mx-auto" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              No hay productos disponibles en este momento
            </h3>
            <p className="text-xs text-slate-500 dark:text-stone-400 leading-relaxed">
              Los comercios dominicanos publicarán nuevos artículos próximamente. ¡Puedes ser el primero en vender!
            </p>
            <button
              type="button"
              onClick={() => setCurrentView('sell_with_us')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f20544] hover:bg-[#d9043d] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <span>Publicar como comercio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Grid de 8 productos destacados en Desktop / Carrusel en móvil */
          <div
            ref={productsTrackRef}
            className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-3.5 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0"
          >
            {displayProducts.slice(0, 8).map(prod => {
              const store = stores.find(s => s.id === prod.storeId);
              const isFav = favorites.productIds.includes(prod.id);
              const isOutOfStock = prod.stock <= 0;
              const hasDiscount = prod.promoPrice && prod.promoPrice < prod.price;

              return (
                <div
                  key={prod.id}
                  className="bg-white dark:bg-stone-900 rounded-2xl border border-slate-200/80 dark:border-stone-800 p-3 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-stone-700 transition-all flex flex-col justify-between group"
                >
                  {/* Imagen del Producto en fondo blanco/limpio */}
                  <div 
                    className="relative aspect-square w-full bg-white dark:bg-stone-800/80 flex items-center justify-center overflow-hidden cursor-pointer rounded-xl mb-2.5"
                    onClick={() => setSelectedProductId(prod.id)}
                  >
                    {prod.images && prod.images[0] ? (
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <Package className="w-10 h-10 text-slate-300 dark:text-stone-600" />
                    )}

                    {/* Botón de favoritos ♡ */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteProduct(prod.id);
                      }}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-stone-700 transition-colors"
                      title={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : 'stroke-[1.8]'}`} />
                    </button>
                  </div>

                  {/* Datos del Producto */}
                  <div className="space-y-1.5 text-left flex-1 flex flex-col justify-between">
                    <div>
                      {/* Título de 2 líneas */}
                      <h3 
                        onClick={() => setSelectedProductId(prod.id)}
                        className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 hover:text-[#f20544] dark:hover:text-rose-400 cursor-pointer transition-colors leading-snug"
                        title={prod.name}
                      >
                        {prod.name}
                      </h3>

                      {/* Calificación por estrellas */}
                      <div className="flex items-center gap-1 mt-1 text-xs">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="font-bold text-slate-800 dark:text-stone-200 text-[11px]">{prod.rating ? prod.rating.toFixed(1) : '4.8'}</span>
                        <span className="text-[10px] text-slate-400 dark:text-stone-500">({prod.reviewCount || 95})</span>
                      </div>

                      {/* Nombre de la tienda */}
                      {store && (
                        <p className="text-[10px] text-slate-500 dark:text-stone-400 truncate mt-0.5 flex items-center gap-1">
                          <Store className="w-3 h-3 text-slate-400 dark:text-stone-500 shrink-0" />
                          <span className="truncate">{store.name}</span>
                        </p>
                      )}
                    </div>

                    {/* Fila inferior: Precio en RD$ y Botón Carrito verde */}
                    <div className="pt-2 border-t border-slate-100 dark:border-stone-800 flex items-center justify-between gap-1 mt-1">
                      <div>
                        {hasDiscount ? (
                          <div className="flex flex-col">
                            <span className="text-[9px] text-slate-400 dark:text-stone-500 line-through leading-none">
                              RD$ {prod.price.toLocaleString()}
                            </span>
                            <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                              RD$ {prod.promoPrice?.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white leading-tight">
                            RD$ {prod.price.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => addToCart(prod.id, prod.storeId, 1)}
                        disabled={isOutOfStock}
                        className="p-2 bg-[#f20544] hover:bg-[#d9043d] active:bg-[#b90334] disabled:opacity-40 text-white rounded-xl font-bold transition-colors shadow-2xs cursor-pointer shrink-0"
                        title="Agregar al carrito"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
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
      {/* 6. TIENDAS DESTACADAS — ROW DE 6 TIENDAS HORIZONTALES           */}
      {/* ============================================================== */}
      <section className="space-y-3.5">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Tiendas destacadas
          </h2>

          <div className="flex items-center gap-2">
            {approvedStores.length > 6 && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-stone-800 p-1 rounded-xl border border-slate-200 dark:border-stone-700">
                <button
                  type="button"
                  onClick={() => scrollStores('left')}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-stone-700 text-slate-700 dark:text-stone-300 hover:text-[#f20544] transition-colors shadow-2xs cursor-pointer"
                  title="Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollStores('right')}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-stone-700 text-slate-700 dark:text-stone-300 hover:text-[#f20544] transition-colors shadow-2xs cursor-pointer"
                  title="Siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setCurrentView('stores')}
              className="text-xs sm:text-sm font-bold text-[#f20544] dark:text-rose-400 hover:text-[#d9043d] transition-colors flex items-center gap-1 group cursor-pointer"
            >
              <span>Ver todas las tiendas</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Fallback si no hay tiendas */}
        {approvedStores.length === 0 ? (
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-slate-200 dark:border-stone-800 p-8 text-center max-w-lg mx-auto space-y-3">
            <Store className="w-10 h-10 text-slate-400 dark:text-stone-500 mx-auto" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              No hay tiendas disponibles en este momento
            </h3>
            <p className="text-xs text-slate-500 dark:text-stone-400 leading-relaxed">
              ¿Tienes un negocio en República Dominicana? Únete a Plazado.com y sé una de las primeras tiendas verificadas.
            </p>
            <button
              type="button"
              onClick={() => setCurrentView('sell_with_us')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#f20544] hover:bg-[#d9043d] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <span>Crear mi tienda</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* Grid de 6 tiendas horizontales como en la referencia */
          <div
            ref={storesTrackRef}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0"
          >
            {approvedStores.slice(0, 6).map(store => {
              const category = categories.find(c => c.id === store.categoryId);
              const categoryName = category?.name || 'Comercio General';

              return (
                <div
                  key={store.id}
                  onClick={() => handleStoreSelect(store.slug || store.id)}
                  className="bg-white dark:bg-stone-900 rounded-2xl border border-slate-200/80 dark:border-stone-800 p-3.5 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-stone-700 transition-all flex items-center justify-between gap-3 group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Logo circular grande */}
                    <div className="w-11 h-11 rounded-full bg-slate-900 dark:bg-stone-800 text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden border border-slate-200 dark:border-stone-700 shadow-2xs">
                      {store.logo ? (
                        <img
                          src={store.logo}
                          alt={store.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span>{store.name.substring(0, 2).toUpperCase()}</span>
                      )}
                    </div>

                    {/* Nombre y categoría */}
                    <div className="min-w-0 text-left">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-[#f20544] dark:group-hover:text-rose-400 transition-colors truncate">
                        {store.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 dark:text-stone-500 truncate">
                        {categoryName}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mt-0.5">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>{store.rating ? store.rating.toFixed(1) : '4.8'}</span>
                        <span className="text-slate-400 dark:text-stone-500 font-normal">({store.reviewCount || 120})</span>
                      </div>
                    </div>
                  </div>

                  {/* Botón Ver Tienda */}
                  <span className="bg-rose-50 dark:bg-rose-950/50 text-[#f20544] dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-full px-2.5 py-1 text-[11px] font-bold shrink-0 transition-colors">
                    Ver tienda
                  </span>
                </div>
              );
            })}
          </div>
        )}

      </section>

      {/* ============================================================== */}
      {/* 7. CTA VERDE "¿TIENES UNA TIENDA?" — REPLICA EXACTA            */}
      {/* ============================================================== */}
      <section>
        <div className="rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#e6003d] via-[#ff174f] to-[#f20544] text-white p-5 sm:p-7 shadow-md flex flex-col lg:flex-row items-center justify-between gap-6">
          
          {/* Zona Izquierda: Icono + Título + Subtítulo */}
          <div className="flex items-center gap-4 text-left w-full lg:w-auto">
            <div className="w-14 h-14 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-inner">
              <Store className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                ¿Tienes una tienda?
              </h3>
              <p className="text-xs sm:text-sm text-rose-100 mt-0.5 leading-snug">
                Vende en Plazado.com y llega a más clientes en toda República Dominicana
              </p>
            </div>
          </div>

          {/* Zona Centro: 4 Beneficios en pastillas */}
          <div className="flex flex-wrap items-center justify-start lg:justify-center gap-2 sm:gap-3 text-xs font-semibold text-white w-full lg:w-auto">
            
            <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full backdrop-blur-2xs border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-rose-200" />
              <span>Registro gratis</span>
            </div>

            <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full backdrop-blur-2xs border border-white/10">
              <Percent className="w-4 h-4 text-rose-200" />
              <span>0.5% de comisión por venta</span>
            </div>

            <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full backdrop-blur-2xs border border-white/10">
              <Store className="w-4 h-4 text-rose-200" />
              <span>Tu propia tienda virtual</span>
            </div>

            <div className="flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-full backdrop-blur-2xs border border-white/10">
              <TrendingUp className="w-4 h-4 text-rose-200" />
              <span>Herramientas para crecer</span>
            </div>

          </div>

          {/* Zona Derecha: Botón Crear mi tienda */}
          <div className="shrink-0 w-full sm:w-auto text-right">
            <button
              type="button"
              id="cta-bottom-create-store-btn"
              onClick={() => setCurrentView('sell_with_us')}
              className="w-full sm:w-auto px-6 py-3 bg-white text-slate-900 hover:bg-slate-100 active:bg-slate-200 rounded-full text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Crear mi tienda</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

    </div>
  );
};
