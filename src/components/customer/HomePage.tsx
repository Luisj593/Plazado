import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DominicanFlag } from '../common/DominicanFlag';
import { isProductPubliclyVisible, isStorePubliclyVisible } from '../../types';
import { CategoryIcon, getCategoryEmoji } from '../../utils/categoryIcons';
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
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);

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

  // Slider de cabecera: toma productos REALES publicados y los mezcla al azar
  // cada vez que cambia el catálogo. No crea productos ficticios.
  const heroProducts = useMemo(() => {
    const candidates = publishedProducts.filter(p => p.images && p.images.length > 0);
    // Fisher-Yates para un orden aleatorio real por carga/cambio de catálogo.
    const shuffled = [...candidates];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 10);
  }, [publishedProducts]);

  useEffect(() => {
    if ((systemSettings?.homeHeroMode || 'slider') !== 'slider' || heroProducts.length <= 1 || heroPaused) return;
    const timer = window.setInterval(() => {
      setHeroSlideIndex(current => (current + 1) % heroProducts.length);
      setHeroImageError(false);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [heroProducts.length, heroPaused, systemSettings?.homeHeroMode]);

  useEffect(() => {
    if (heroSlideIndex >= heroProducts.length) setHeroSlideIndex(0);
  }, [heroProducts.length, heroSlideIndex]);

  const heroMode = systemSettings?.homeHeroMode || 'slider';
  const activeHeroProduct = heroMode === 'slider' ? heroProducts[heroSlideIndex] : undefined;

  const activeCategories = categories || [];
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

  // Only real active categories from the platform. Never create visual-only categories.
  const visualCategories = mainCategories.map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    icon: getCategoryEmoji(cat.slug || cat.id)
  }));

  // Real published products grouped strictly by their persisted category relationship.
  const categoryProductGroups = mainCategories
    .map(category => ({
      category,
      products: publishedProducts.filter(product => product.categoryId === category.id)
    }))
    .filter(group => group.products.length > 0);

  const activePromoBanners = useMemo(
    () => [...(banners || [])].filter(b => b.isActive).sort((a, b) => a.order - b.order).slice(0, 3),
    [banners]
  );

  const offerProducts = useMemo(
    () => publishedProducts
      .filter(p => typeof p.promoPrice === 'number' && p.promoPrice > 0 && p.promoPrice < p.price)
      .slice(0, 8),
    [publishedProducts]
  );

  const trendingCategories = useMemo(
    () => mainCategories
      .map(category => ({
        category,
        count: publishedProducts.filter(product => product.categoryId === category.id).length,
        image: publishedProducts.find(product => product.categoryId === category.id && product.images?.[0])?.images?.[0]
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    [mainCategories, publishedProducts]
  );

  const handleBannerClick = (banner: any) => {
    if (banner.targetType === 'PRODUCT' && banner.targetValue) return setSelectedProductId(banner.targetValue);
    if (banner.targetType === 'STORE' && banner.targetValue) return handleStoreSelect(banner.targetValue);
    if (banner.targetType === 'CATEGORY' && banner.targetValue) return handleCategorySelect(banner.targetValue);
    if (banner.targetType === 'URL' && /^https?:\/\//i.test(banner.targetValue || '')) window.open(banner.targetValue, '_blank', 'noopener,noreferrer');
  };


  return (
    <div className="max-w-[1600px] mx-auto px-0 sm:px-4 lg:px-6 space-y-5 sm:space-y-6 pb-10 sm:pb-14 overflow-x-hidden">

      {/* ============================================================== */}
      {/* 2. HERO PRINCIPAL — REPLICA VISUAL EXACTA DE LA REFERENCIA     */}
      {/* ============================================================== */}
      <section className="pt-2 sm:pt-4">
        <div className="relative rounded-none sm:rounded-[20px] overflow-hidden bg-white dark:bg-stone-950 border border-slate-200 dark:border-stone-800 shadow-sm min-h-[380px] sm:min-h-[430px] lg:h-[470px] xl:h-[500px] flex items-center">
          
          {/* Suaves elementos de luz y ambientación de marca */}
          <div className="absolute -right-16 -top-16 w-80 h-80 bg-rose-100/70 dark:bg-rose-900/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-slate-100 dark:bg-stone-900/40 rounded-full blur-3xl pointer-events-none" />

          {/* Contenido en dos zonas perfectamente integradas */}
          <div className="relative z-10 w-full h-full flex flex-col justify-center px-5 sm:px-10 lg:px-12 py-7 sm:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-3 lg:gap-8 h-full">
              
              {/* ZONA IZQUIERDA: Textos y Botones principales */}
              <div className="lg:col-span-5 space-y-3 sm:space-y-5 text-left max-w-xl">
                
                {/* Título Principal Grande con Verde Corporativo de Alta Visibilidad */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-black text-slate-950 dark:text-white tracking-tight leading-[1.02]">
                  Todo lo que buscas,<br />
                  <span className="text-[#f20544] dark:text-rose-400">en un solo lugar</span>
                </h1>

                {/* Texto Descriptivo */}
                <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-stone-300 font-normal leading-relaxed">
                  Descubre productos de tiendas verificadas, compra fácil y disfruta una experiencia segura en Plazado.
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
                    <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
                    <span>Comprar ahora</span>
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

              {/* ZONA DERECHA: Slider moderno de productos publicados */}
              <div
                className="lg:col-span-7 relative h-full flex items-center justify-center lg:-mr-12"
                onMouseEnter={() => setHeroPaused(true)}
                onMouseLeave={() => setHeroPaused(false)}
              >
                
                {/* Contenedor de la Imagen con badges superpuestos */}
                <div className="relative w-full h-[270px] sm:h-[350px] lg:h-[470px] xl:h-[500px] overflow-hidden group flex items-center justify-center bg-slate-50 dark:bg-stone-900">
                  <img 
                    src={heroMode === 'slider' && activeHeroProduct && !heroImageError ? activeHeroProduct.images[0] : heroImageSrc} 
                    alt={activeHeroProduct ? activeHeroProduct.name : "Compras en Plazado.com República Dominicana"} 
                    className="w-full h-full object-cover object-center bg-slate-50 dark:bg-stone-900 transition-all duration-700"
                    loading="eager"
                    onError={() => setHeroImageError(true)}
                  />
                  
                  {heroMode === 'slider' && heroProducts.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setHeroSlideIndex(i => (i - 1 + heroProducts.length) % heroProducts.length);
                          setHeroImageError(false);
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-[#f20544] transition-colors"
                        aria-label="Producto anterior"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setHeroSlideIndex(i => (i + 1) % heroProducts.length);
                          setHeroImageError(false);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-[#f20544] transition-colors"
                        aria-label="Producto siguiente"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 flex gap-1.5">
                        {heroProducts.map((_, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              setHeroSlideIndex(index);
                              setHeroImageError(false);
                            }}
                            className={`h-2 rounded-full transition-all ${index === heroSlideIndex ? 'w-6 bg-[#f20544]' : 'w-2 bg-white/70'}`}
                            aria-label={`Ir al producto ${index + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* Imagen limpia: sin mensajes ni tarjetas flotantes sobre el producto */}

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



                </div>

              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Franja de confianza integrada al hero, siguiendo la referencia aprobada */}
      <section className="-mt-1 sm:-mt-2 relative z-20">
        <div className="bg-white dark:bg-stone-900 border-y sm:border sm:rounded-2xl border-slate-200 dark:border-stone-800 px-4 sm:px-6 py-3 shadow-sm">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
            {[
              [Truck, 'Envío rápido', 'Gestionado por cada tienda'],
              [ShieldCheck, 'Tiendas verificadas', 'Comercios confiables'],
              [Lock, 'Pagos seguros', 'Compra protegida'],
              [Headphones, 'Soporte', 'Siempre contigo']
            ].map(([Icon, title, subtitle]: any) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#f20544] text-white flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></div>
                <div><div className="font-black text-xs sm:text-sm text-slate-900 dark:text-white">{title}</div><div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-stone-400">{subtitle}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. CATEGORÍAS POPULARES — FILA VISUAL DE ECOMMERCE             */}
      {/* ============================================================== */}
      <section className="space-y-3.5">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight">
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
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
          {visualCategories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleCategorySelect(item.slug)}
                className="bg-white dark:bg-stone-900 rounded-xl border border-slate-200/70 dark:border-stone-800 px-3 py-2.5 flex flex-col items-center justify-center text-center hover:border-[#f20544] dark:hover:border-rose-500 hover:shadow-md hover:-translate-y-0.5 transition-all group cursor-pointer min-w-[96px] sm:min-w-[108px] h-[82px]"
                title={`Explorar ${item.name}`}
              >
                <span className="text-2xl sm:text-3xl mb-1.5 filter drop-shadow-2xs group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-stone-200 group-hover:text-[#f20544] dark:group-hover:text-rose-400 transition-colors leading-tight line-clamp-1">
                  {item.name}
                </span>
              </button>
          ))}

          {/* Más categorías card */}
          <button
            type="button"
            onClick={() => {
              setSelectedCategorySlug(null);
              setCurrentView('catalog');
            }}
            className="bg-slate-50 dark:bg-stone-800/60 hover:bg-white dark:hover:bg-stone-800 rounded-xl border border-dashed border-slate-300 dark:border-stone-700 hover:border-[#f20544] dark:hover:border-rose-500 px-3 py-2.5 flex flex-col items-center justify-center text-center transition-all group cursor-pointer min-w-[96px] sm:min-w-[108px] h-[82px]"
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

      {/* Promociones configuradas por el Super Admin: nunca se generan banners ficticios */}
      {activePromoBanners.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {activePromoBanners.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => handleBannerClick(banner)}
              className={`relative overflow-hidden rounded-2xl min-h-[150px] sm:min-h-[180px] text-left group border border-slate-200 dark:border-stone-800 ${activePromoBanners.length === 1 ? 'md:col-span-3' : activePromoBanners.length === 2 && index === 0 ? 'md:col-span-2' : ''}`}
            >
              <img src={banner.imageUrl} alt={banner.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />
              <div className="relative z-10 p-5 sm:p-6 max-w-[70%] text-white">
                {banner.badge && <span className="inline-block mb-2 px-2.5 py-1 rounded-full bg-[#f20544] text-[10px] font-black uppercase tracking-wide">{banner.badge}</span>}
                <h3 className="text-xl sm:text-2xl font-black leading-tight">{banner.title}</h3>
                {banner.subtitle && <p className="text-xs sm:text-sm text-white/90 mt-1.5 line-clamp-2">{banner.subtitle}</p>}
                <span className="inline-flex items-center gap-1 mt-3 text-xs font-bold">Explorar <ArrowRight className="w-3.5 h-3.5" /></span>
              </div>
            </button>
          ))}
        </section>
      )}

      {/* Ofertas reales: solo productos publicados que tengan promoPrice válido */}
      {offerProducts.length > 0 && (
        <section className="space-y-3.5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white flex items-center gap-2"><Percent className="w-5 h-5 text-[#f20544]" /> Ofertas destacadas</h2>
              <p className="text-xs text-slate-500 dark:text-stone-400">Promociones publicadas actualmente por las tiendas.</p>
            </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-none">
            {offerProducts.map(prod => {
              const discount = Math.round((1 - (prod.promoPrice! / prod.price)) * 100);
              const store = stores.find(s => s.id === prod.storeId);
              return (
                <article key={prod.id} className="min-w-[165px] sm:min-w-[190px] max-w-[210px] snap-start bg-white dark:bg-stone-900 rounded-2xl border border-slate-200 dark:border-stone-800 p-2.5 shadow-sm">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-white dark:bg-stone-800 cursor-pointer" onClick={() => setSelectedProductId(prod.id)}>
                    {prod.images?.[0] ? <img src={prod.images[0]} alt={prod.name} loading="lazy" className="w-full h-full object-contain" /> : <Package className="absolute inset-0 m-auto w-10 h-10 text-slate-300" />}
                    <span className="absolute top-2 left-2 bg-[#f20544] text-white text-[10px] font-black px-2 py-1 rounded-lg">-{discount}%</span>
                  </div>
                  <div className="pt-2">
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 cursor-pointer" onClick={() => setSelectedProductId(prod.id)}>{prod.name}</h3>
                    {store && <p className="text-[10px] text-slate-500 truncate mt-1">{store.name}</p>}
                    <div className="flex items-end justify-between gap-2 mt-2">
                      <div><div className="text-[9px] line-through text-slate-400">RD$ {prod.price.toLocaleString()}</div><div className="font-black text-sm text-[#f20544]">RD$ {prod.promoPrice!.toLocaleString()}</div></div>
                      <button type="button" disabled={prod.stock <= 0} onClick={() => addToCart(prod.id, prod.storeId, 1)} className="p-2 rounded-lg bg-[#f20544] text-white disabled:opacity-40"><ShoppingCart className="w-4 h-4" /></button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* 5. PRODUCTOS DESTACADOS — GRID DE 8 TARJETA MARKETPLACE        */}
      {/* ============================================================== */}
      <section className="space-y-3.5">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight">
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
            className="flex sm:grid sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2.5 sm:gap-3 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 snap-x"
          >
            {displayProducts.slice(0, 8).map(prod => {
              const store = stores.find(s => s.id === prod.storeId);
              const isFav = favorites.productIds.includes(prod.id);
              const isOutOfStock = prod.stock <= 0;
              const hasDiscount = prod.promoPrice && prod.promoPrice < prod.price;

              return (
                <div
                  key={prod.id}
                  className="min-w-[165px] sm:min-w-0 snap-start bg-white dark:bg-stone-900 rounded-xl border border-slate-200/80 dark:border-stone-800 p-2.5 shadow-2xs hover:shadow-md hover:border-[#f20544]/40 dark:hover:border-rose-700 transition-all flex flex-col justify-between group"
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
                      {typeof prod.rating === 'number' && prod.rating > 0 && (
                        <div className="flex items-center gap-1 mt-1 text-xs">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span className="font-bold text-slate-800 dark:text-stone-200 text-[11px]">{prod.rating.toFixed(1)}</span>
                          {typeof prod.reviewCount === 'number' && prod.reviewCount > 0 && (
                            <span className="text-[10px] text-slate-400 dark:text-stone-500">({prod.reviewCount})</span>
                          )}
                        </div>
                      )}

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

      {trendingCategories.length > 0 && (
        <section className="space-y-3.5">
          <div className="flex items-end justify-between gap-3">
            <div><h2 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white">Categorías en tendencia</h2><p className="text-xs text-slate-500 dark:text-stone-400">Lo más activo actualmente en Plazado.</p></div>
            <button type="button" onClick={() => { setSelectedCategorySlug(null); setCurrentView('catalog'); }} className="text-xs sm:text-sm font-bold text-[#f20544] flex items-center gap-1">Ver todas <ArrowRight className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {trendingCategories.map(({ category, count, image }) => (
              <button key={category.id} type="button" onClick={() => handleCategorySelect(category.slug)} className="relative min-h-[150px] sm:min-h-[180px] overflow-hidden rounded-2xl border border-slate-200 dark:border-stone-800 text-left group bg-slate-900">
                {image ? <img src={image} alt={category.name} loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300" /> : <div className="absolute inset-0 flex items-center justify-center text-6xl bg-slate-100 dark:bg-stone-800">{getCategoryEmoji(category.slug || category.id)}</div>}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3.5 text-white"><h3 className="font-black text-sm sm:text-base leading-tight">{category.name}</h3><p className="text-[10px] sm:text-xs text-white/80 mt-1">{count} {count === 1 ? 'producto publicado' : 'productos publicados'}</p><span className="inline-flex items-center gap-1 text-[10px] font-bold mt-2">Explorar <ArrowRight className="w-3 h-3" /></span></div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Productos reales segregados por categoría */}
      {categoryProductGroups.map(({ category, products: categoryProducts }) => (
        <section key={category.id} className="space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{getCategoryEmoji(category.slug || category.id)}</span>
              <h2 className="text-lg sm:text-xl font-black text-slate-950 dark:text-white tracking-tight">{category.name}</h2>
            </div>
            <button
              type="button"
              onClick={() => handleCategorySelect(category.slug)}
              className="text-xs sm:text-sm font-bold text-[#f20544] hover:text-[#d9043d] flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-none">
            {categoryProducts.map(prod => {
              const store = stores.find(s => s.id === prod.storeId);
              const isFav = favorites.productIds.includes(prod.id);
              const isOutOfStock = prod.stock <= 0;
              const hasDiscount = typeof prod.promoPrice === 'number' && prod.promoPrice < prod.price;
              return (
                <article key={prod.id} className="min-w-[165px] sm:min-w-[190px] lg:min-w-[210px] max-w-[210px] snap-start bg-white dark:bg-stone-900 rounded-2xl border border-slate-200 dark:border-stone-800 p-2.5 shadow-sm hover:shadow-md transition-all">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-white dark:bg-stone-800 cursor-pointer" onClick={() => setSelectedProductId(prod.id)}>
                    {prod.images?.[0] ? <img src={prod.images[0]} alt={prod.name} loading="lazy" className="w-full h-full object-contain" /> : <Package className="w-10 h-10 text-slate-300 absolute inset-0 m-auto" />}
                    <button type="button" onClick={(e) => { e.stopPropagation(); toggleFavoriteProduct(prod.id); }} className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-slate-600 shadow-sm">
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                  </div>
                  <div className="pt-2 space-y-1.5">
                    <h3 onClick={() => setSelectedProductId(prod.id)} className="font-bold text-xs text-slate-900 dark:text-white line-clamp-2 cursor-pointer">{prod.name}</h3>
                    {store && <p className="text-[10px] text-slate-500 truncate">{store.name}</p>}
                    {typeof prod.rating === 'number' && prod.rating > 0 && <div className="text-[10px] text-amber-500 flex items-center gap-1"><Star className="w-3 h-3 fill-current" />{prod.rating.toFixed(1)}{typeof prod.reviewCount === 'number' && prod.reviewCount > 0 ? ` (${prod.reviewCount})` : ''}</div>}
                    <div className="flex items-end justify-between gap-2 pt-1">
                      <div>{hasDiscount && <div className="text-[9px] line-through text-slate-400">RD$ {prod.price.toLocaleString()}</div>}<div className="font-black text-sm text-[#f20544]">RD$ {(hasDiscount ? prod.promoPrice! : prod.price).toLocaleString()}</div></div>
                      <button type="button" disabled={isOutOfStock} onClick={() => addToCart(prod.id, prod.storeId, 1)} className="p-2 rounded-lg bg-[#f20544] text-white disabled:opacity-40"><ShoppingCart className="w-4 h-4" /></button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}

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
            className="flex sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2.5 sm:gap-3 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 snap-x"
          >
            {approvedStores.slice(0, 7).map(store => {
              const category = categories.find(c => c.id === store.categoryId);
              const categoryName = category?.name || 'Comercio General';

              return (
                <div
                  key={store.id}
                  onClick={() => handleStoreSelect(store.slug || store.id)}
                  className="bg-white dark:bg-stone-900 rounded-xl border border-slate-200/80 dark:border-stone-800 p-2.5 shadow-2xs hover:shadow-md hover:border-[#f20544]/40 dark:hover:border-rose-700 transition-all flex flex-col items-start justify-between gap-2 group cursor-pointer"
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
                      {typeof store.rating === 'number' && store.rating > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mt-0.5">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          <span>{store.rating.toFixed(1)}</span>
                          {typeof store.reviewCount === 'number' && store.reviewCount > 0 && (
                            <span className="text-slate-400 dark:text-stone-500 font-normal">({store.reviewCount})</span>
                          )}
                        </div>
                      )}
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
