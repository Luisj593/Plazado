import React from 'react';
import { useApp } from '../../context/AppContext';
import { DominicanFlag } from '../common/DominicanFlag';
import { isProductPubliclyVisible, isStorePubliclyVisible } from '../../types';
import { HeroProductSlider } from './HeroProductSlider';
import { AdBanner } from '../common/AdBanner';
import { CategoryIcon, getCategoryEmoji, getCategoryMeta } from '../../utils/categoryIcons';
import { INITIAL_CATEGORIES } from '../../data/initialData';
import { 
  Store, 
  Sparkles, 
  ArrowRight, 
  Star, 
  Truck, 
  ShieldCheck, 
  Tag, 
  TrendingUp, 
  Phone, 
  MapPin, 
  Heart, 
  Check, 
  Layers, 
  ChevronRight, 
  ChevronLeft,
  Package,
  ExternalLink,
  Flame,
  Zap,
  ShoppingBag
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { 
    currentUser,
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
    systemSettings
  } = useApp();

  const approvedStores = stores.filter(isStorePubliclyVisible);
  const publishedProducts = products.filter(p => {
    if (!isProductPubliclyVisible(p)) return false;
    const store = stores.find(s => s.id === p.storeId);
    return store ? isStorePubliclyVisible(store) : false;
  });
  const featuredProducts = publishedProducts.filter(p => p.isFeatured);
  const displayProducts = featuredProducts.length > 0 ? featuredProducts : publishedProducts;
  const offerProducts = publishedProducts.filter(p => p.promoPrice && p.promoPrice < p.price);
  const activeCategories = (categories && categories.length > 0) ? categories : INITIAL_CATEGORIES;
  const mainCategories = activeCategories.filter(c => !c.parentId);

  // Segregate publications by category (5 publications visible per row with horizontal scroll track)
  const segregatedCategories = React.useMemo(() => {
    const rootCats = mainCategories;
    const groups: { category: any; products: typeof publishedProducts }[] = [];

    rootCats.forEach(cat => {
      // Match direct category or child subcategories
      const subCatIds = activeCategories.filter(c => c.parentId === cat.id).map(c => c.id);
      const allowedIds = [cat.id, cat.slug, ...subCatIds];

      const catProds = publishedProducts.filter(p => {
        return allowedIds.includes(p.categoryId) || (p.subcategoryId && allowedIds.includes(p.subcategoryId));
      });

      if (catProds.length > 0) {
        groups.push({
          category: cat,
          products: catProds
        });
      }
    });

    // Check for products in other custom categories not matched above
    const matchedProductIds = new Set(groups.flatMap(g => g.products.map(p => p.id)));
    const remainingProducts = publishedProducts.filter(p => !matchedProductIds.has(p.id));

    if (remainingProducts.length > 0) {
      const remainingMap: { [catId: string]: typeof publishedProducts } = {};
      remainingProducts.forEach(p => {
        const catKey = p.categoryId || 'otras';
        if (!remainingMap[catKey]) remainingMap[catKey] = [];
        remainingMap[catKey].push(p);
      });

      Object.keys(remainingMap).forEach(catKey => {
        const catObj = activeCategories.find(c => c.id === catKey || c.slug === catKey);
        groups.push({
          category: catObj || {
            id: catKey,
            name: catKey === 'otras' ? 'Otras Publicaciones' : 'Publicaciones Generales',
            slug: 'general'
          },
          products: remainingMap[catKey]
        });
      });
    }

    return groups;
  }, [activeCategories, mainCategories, publishedProducts]);

  const handleCategorySelect = (slug: string) => {
    setSelectedCategorySlug(slug);
    setCurrentView('catalog');
  };

  const handleStoreSelect = (slug: string) => {
    setSelectedStoreSlug(slug);
    setCurrentView('store_public');
  };

  const storesTrackRef = React.useRef<HTMLDivElement>(null);
  const categoriesTrackRef = React.useRef<HTMLDivElement>(null);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoriesTrackRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      categoriesTrackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollStores = (direction: 'left' | 'right') => {
    if (storesTrackRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      storesTrackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Section: Full-Width Global Interactive Showcase Slider */}
      <section className="w-full max-w-7xl mx-auto px-2 sm:px-4 pt-2 sm:pt-4">
        <HeroProductSlider 
          products={publishedProducts}
          stores={stores}
          banners={banners}
          categories={categories}
          onSelectProduct={(id) => setSelectedProductId(id)}
          onAddToCart={(prodId, stId, qty) => addToCart(prodId, stId, qty)}
          onSelectStore={(slug) => handleStoreSelect(slug)}
          onSelectCategory={(slug) => handleCategorySelect(slug)}
          onRegisterStore={() => setCurrentView('sell_with_us')}
          onExploreCatalog={() => {
            setSelectedCategorySlug(null);
            setCurrentView('catalog');
          }}
        />
      </section>

      {/* Espacio Publicitario Principal Superior */}
      <section className="max-w-7xl mx-auto px-4">
        <AdBanner placement="HOME_TOP" />
      </section>

      {/* Main Categories Navigation - Muestra 5 y barra de desplazamiento horizontal */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
              Explora por Categorías
            </h2>
            <p className="text-xs text-stone-500">Encuentra exactamente lo que buscas — desliza para ver todas</p>
          </div>

          <div className="flex items-center gap-2">
            {mainCategories.length > 5 && (
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => scrollCategories('left')}
                  className="p-1.5 rounded-lg hover:bg-white text-stone-700 hover:text-red-600 transition-colors shadow-2xs"
                  title="Desplazar categorías a la izquierda"
                  aria-label="Ver categorías anteriores"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCategories('right')}
                  className="p-1.5 rounded-lg hover:bg-white text-stone-700 hover:text-red-600 transition-colors shadow-2xs"
                  title="Desplazar categorías a la derecha"
                  aria-label="Ver más categorías"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={() => {
                setSelectedCategorySlug(null);
                setCurrentView('catalog');
              }}
              className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-red-50 transition-colors"
            >
              <span>Ver catálogo completo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Carrusel con barra desplazable - Muestra 5 categorías visibles en desktop */}
        <div
          ref={categoriesTrackRef}
          className="categories-scroll-track flex gap-3 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth"
        >
          {mainCategories.map(cat => {
            const count = publishedProducts.filter(p => p.categoryId === cat.id || p.categoryId === cat.slug).length;
            const isPopular = cat.slug === 'mascotas' || cat.slug === 'cat-mascotas' || cat.slug === 'tecnologia' || cat.slug === 'cat-tecnologia' || cat.slug === 'electronica' || cat.slug === 'cat-electronica';
            const catMeta = getCategoryMeta(cat);

            return (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.slug)}
                className={`snap-start flex-shrink-0 w-[180px] sm:w-[200px] md:w-[220px] lg:w-[calc((100%-48px)/5)] p-4 rounded-2xl border text-left transition-all group flex flex-col justify-between ${
                  isPopular
                    ? 'bg-amber-50/70 border-amber-200 hover:border-amber-400 shadow-2xs hover:shadow-md'
                    : 'bg-white border-stone-200 hover:border-red-400 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl filter drop-shadow-xs transition-transform group-hover:scale-110">
                    {catMeta.emoji}
                  </span>
                  {isPopular && (
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                      Popular
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm text-stone-900 group-hover:text-red-600 transition-colors line-clamp-1">
                    {cat.name}
                  </h3>
                  <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">
                    {count > 0 ? `${count} publicación${count > 1 ? 'es' : ''}` : (cat.slug.includes('mascotas') ? 'Perros, gatos y más' : 'Ver productos')}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Espacio Publicitario Intermedio */}
      <section className="max-w-7xl mx-auto px-4">
        <AdBanner placement="HOME_MIDDLE" />
      </section>

      {/* Featured Stores Carousel/Scroll Track (Muestra 5 tiendas y barra de desplazamiento para ver las demás) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <Store className="w-5 h-5 text-red-600" />
              Tiendas Oficiales en PlazaDO
            </h2>
            <p className="text-xs text-stone-500">
              Mostrando tiendas verificadas de República Dominicana — desliza para descubrir todas las tiendas
            </p>
          </div>

          <div className="flex items-center gap-2">
            {approvedStores.length > 5 && (
              <div className="hidden sm:flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => scrollStores('left')}
                  className="p-1 rounded-lg hover:bg-white text-stone-700 hover:text-red-600 transition-colors shadow-2xs"
                  title="Desplazar tiendas a la izquierda"
                  aria-label="Ver tiendas anteriores"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollStores('right')}
                  className="p-1 rounded-lg hover:bg-white text-stone-700 hover:text-red-600 transition-colors shadow-2xs"
                  title="Desplazar tiendas a la derecha"
                  aria-label="Ver más tiendas"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              id="home-view-all-stores-btn"
              onClick={() => setCurrentView('stores')}
              className="px-3 py-1.5 rounded-xl border border-stone-200 hover:border-red-500 bg-white text-stone-700 hover:text-red-600 font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-xs"
            >
              <span>Ver Directorio ({approvedStores.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {approvedStores.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center max-w-xl mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-stone-900 text-sm sm:text-base">No hay tiendas disponibles</h3>
            <p className="text-xs text-stone-500">
              ¿Eres comerciante o emprendedor dominicano? Registra tu tienda para comenzar a vender tus productos en PlazaDO.
            </p>
            <button
              onClick={() => setCurrentView('sell_with_us')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              <span>Vender en PlazaDO</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Contenedor con barra de desplazamiento horizontal - Muestra 5 tiendas visibles en desktop */}
            <div
              ref={storesTrackRef}
              className="stores-scroll-track flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth"
            >
              {approvedStores.map(store => {
                const category = categories.find(c => c.id === store.categoryId);
                const categoryName = category?.name || 'Comercio General';
                const locationStr = [store.municipality, store.province].filter(Boolean).join(', ') || store.province || 'República Dominicana';
                const storeProductsCount = publishedProducts.filter(p => p.storeId === store.id).length;

                return (
                  <div
                    key={store.id}
                    id={`store-card-${store.id}`}
                    onClick={() => handleStoreSelect(store.slug || store.id)}
                    className="snap-start flex-shrink-0 w-[260px] sm:w-[250px] md:w-[235px] lg:w-[calc((100%-64px)/5)] bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-stone-300 transition-all cursor-pointer group flex flex-col justify-between"
                  >
                    {/* Banner & Logo */}
                    <div>
                      <div className="h-28 sm:h-32 w-full bg-stone-100 relative overflow-hidden">
                        <img 
                          src={store.banner || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80'} 
                          alt={store.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                        
                        {/* Store Logo floating over banner */}
                        <div className="absolute bottom-2 left-2.5 flex items-center gap-2">
                          <img 
                            src={store.logo || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=300&auto=format&fit=crop&q=80'} 
                            alt={store.name} 
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover border-2 border-white shadow-md bg-white shrink-0"
                            loading="lazy"
                          />
                          <span className="text-[10px] font-bold text-white bg-black/50 backdrop-blur-xs px-1.5 py-0.5 rounded-md border border-white/20 truncate max-w-[120px]">
                            {categoryName}
                          </span>
                        </div>
                      </div>

                      {/* Store Information */}
                      <div className="p-3 pb-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <h3 className="font-bold text-xs sm:text-sm text-stone-900 group-hover:text-red-600 transition-colors line-clamp-1">
                            {store.name}
                          </h3>
                          <div className="flex items-center gap-0.5 text-amber-500 text-xs font-bold shrink-0">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{store.rating ? store.rating.toFixed(1) : '5.0'}</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                          {store.description}
                        </p>

                        {/* Location and Products count */}
                        <div className="mt-2.5 flex items-center justify-between text-[11px] text-stone-600 gap-1.5">
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                            <span className="truncate">{locationStr}</span>
                          </span>
                          <span className="text-[10px] text-stone-500 shrink-0 bg-stone-100 px-1.5 py-0.5 rounded-full font-medium">
                            {storeProductsCount} {storeProductsCount === 1 ? 'art.' : 'arts.'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Action Footer with distance shipping disclaimer */}
                    <div className="p-3 pt-2 mt-1 border-t border-stone-100 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-1 text-[11px]">
                        <span className="text-stone-500">
                          Envío: <span className="font-bold text-stone-800">RD$ {store.shippingConfig?.fixedRate || 200}</span>
                        </span>
                        <button
                          type="button"
                          id={`btn-view-store-${store.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStoreSelect(store.slug || store.id);
                          }}
                          className="px-2.5 py-1 bg-stone-900 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 group/btn shadow-xs"
                        >
                          <span>Ver</span>
                          <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                      <p className="text-[9.5px] text-stone-400 italic leading-tight">
                        * Los precios pueden variar dependiendo de la distancia.
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scroll Indicator helper */}
            <div className="flex items-center justify-between text-[11px] text-stone-400 px-1">
              <span>↔ Desliza la barra horizontal para ver las demás tiendas</span>
              <span className="font-semibold text-stone-500">{approvedStores.length} tiendas registradas</span>
            </div>
          </div>
        )}
      </section>

      {/* Ofertas Especiales del Día */}
      {offerProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-r from-red-600 to-rose-700 rounded-2xl p-6 text-white mb-6 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
                <Tag className="w-3 h-3" />
                Precios de Oportunidad
              </span>
              <h2 className="text-xl sm:text-2xl font-black">
                Ofertas Destacadas en República Dominicana
              </h2>
              <p className="text-xs text-red-100">
                Aprovecha descuentos limitados en múltiples establecimientos
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedCategorySlug(null);
                setCurrentView('catalog');
              }}
              className="px-4 py-2 bg-white text-red-700 hover:bg-stone-100 rounded-lg text-xs font-bold shadow-sm transition-colors"
            >
              Ver todas las ofertas
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {offerProducts.slice(0, 4).map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onSelect={() => setSelectedProductId(product.id)}
                onAddToCart={() => addToCart(product.id, product.storeId, 1)}
                isFavorite={favorites.productIds.includes(product.id)}
                onToggleFavorite={() => toggleFavoriteProduct(product.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Publicaciones Segregadas por Categoría (Muestra 5 publicaciones por categoría y barra de desplazamiento) */}
      <section className="max-w-7xl mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-red-600" />
              Publicaciones en PlazaDO
            </h2>
            <p className="text-xs text-stone-500">
              Mostrando 5 publicaciones por categoría — Desliza la barra horizontal para ver las demás publicaciones
            </p>
          </div>
          {publishedProducts.length > 0 && (
            <button
              onClick={() => {
                setSelectedCategorySlug(null);
                setCurrentView('catalog');
              }}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 group"
            >
              <span>Ver catálogo completo ({publishedProducts.length})</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {segregatedCategories.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center max-w-xl mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-stone-900 text-sm sm:text-base">No hay productos disponibles</h3>
            <p className="text-xs text-stone-500">
              Las publicaciones se mostrarán aquí segregadas por cada categoría, con 5 publicaciones por fila y desplazamiento horizontal a medida que los comercios registren sus productos.
            </p>
            <button
              onClick={() => setCurrentView('sell_with_us')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
            >
              <span>Publicar como Comercio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {segregatedCategories.map(({ category, products: catProducts }) => (
              <CategoryPublicationsRow
                key={category.id || category.slug}
                category={category}
                products={catProducts}
                stores={stores}
                onSelectProduct={(id) => setSelectedProductId(id)}
                onAddToCart={(prodId, stId, qty) => addToCart(prodId, stId, qty)}
                onSelectCategory={(slug) => handleCategorySelect(slug)}
                onSelectStore={(slug) => handleStoreSelect(slug)}
                favorites={favorites}
                onToggleFavorite={(id) => toggleFavoriteProduct(id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Espacio Publicitario sobre Sección de Productos */}
      <section className="max-w-7xl mx-auto px-4">
        <AdBanner placement="HOME_PRODUCTS" />
      </section>

      {/* Las Opciones Más Famosas de PlazaDO (Reemplazo solicitado por el usuario) */}
      <section id="famous-options-section" className="max-w-7xl mx-auto px-4 space-y-8">
        {/* Header de Sección */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-stone-200 pb-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Flame className="w-4 h-4 text-amber-600 fill-amber-500 animate-pulse" />
              <span>LO MÁS BUSCADO Y POPULAR EN RD</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-stone-900 font-display tracking-tight">
              Las Opciones Más Famosas
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Descubre los artículos en tendencia, las marcas favoritas y las categorías más compradas hoy en República Dominicana con garantía de entrega rápida.
            </p>
          </div>

          <button
            id="famous-view-all-btn"
            onClick={() => {
              setSelectedCategorySlug(null);
              setSearchQuery('');
              setCurrentView('catalog');
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 hover:bg-red-600 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm shrink-0 self-start md:self-auto"
          >
            <span>Ver Todo el Catálogo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Búsquedas Más Famosas (Pills en Tendencia) */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-500 uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5 text-red-600" />
            <span>Tendencias Rápidas:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: '📱 iPhone & Celulares', query: 'iPhone' },
              { label: '👟 Tenis Deportivos', query: 'tenis' },
              { label: '🍳 Freidoras de Aire', query: 'freidora' },
              { label: '⌚ Smartwatches', query: 'reloj' },
              { label: '💄 Maquillaje y Skincare', query: 'belleza' },
              { label: '🎮 Accesorios Gaming', query: 'gaming' },
              { label: '🔊 Bocinas Bluetooth', query: 'audio' },
              { label: '🐶 Mascotas & Alimento', query: 'mascotas' },
              { label: '👕 Ropa Casual', query: 'moda' }
            ].map((tag, i) => (
              <button
                key={i}
                onClick={() => {
                  setSearchQuery(tag.query);
                  setCurrentView('catalog');
                }}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-stone-200 text-stone-700 hover:border-red-500 hover:text-red-600 hover:bg-red-50 transition-all shadow-2xs"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categorías Más Populares (Grid de Tarjetas) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {categories.filter(c => !c.parentId).slice(0, 6).map((cat, idx) => {
            const catProds = products.filter(p => {
              if (!isProductPubliclyVisible(p)) return false;
              if (p.categoryId === cat.id || p.categoryId === cat.slug) return true;
              const childIds = categories.filter(c => c.parentId === cat.id).map(c => c.id);
              return childIds.includes(p.categoryId);
            });

            const badges = ['🔥 #1 Más Vendido', '⭐ Favorita', '⚡ Alta Demanda', '✨ Tendencia', '🎉 Ofertas', '🚚 Envío Rápido'];
            const badgeText = badges[idx % badges.length];

            return (
              <div
                key={cat.id}
                onClick={() => {
                  setSelectedCategorySlug(cat.slug);
                  setCurrentView('catalog');
                }}
                className="group cursor-pointer bg-white rounded-2xl p-4 border border-stone-200 hover:border-red-500 hover:shadow-md transition-all flex flex-col justify-between text-left relative overflow-hidden"
              >
                <div className="space-y-2">
                  <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 group-hover:bg-red-50 text-stone-600 group-hover:text-red-600 transition-colors">
                    {badgeText}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-700 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all">
                    <CategoryIcon category={cat} className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-xs sm:text-sm group-hover:text-red-600 transition-colors line-clamp-1">
                      {cat.name}
                    </h3>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {catProds.length} {catProds.length === 1 ? 'producto' : 'productos'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] font-bold text-stone-600 group-hover:text-red-600">
                  <span>Explorar</span>
                  <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Productos Más Famosos y Destacados */}
        {(() => {
          const famousProducts = products
            .filter(p => isProductPubliclyVisible(p))
            .sort((a, b) => {
              // Priorizar por ventas, calificación o productos en oferta
              const scoreA = (a.soldCount || 0) * 3 + (a.rating || 0) * 10 + (a.promoPrice ? 15 : 0);
              const scoreB = (b.soldCount || 0) * 3 + (b.rating || 0) * 10 + (b.promoPrice ? 15 : 0);
              return scoreB - scoreA;
            })
            .slice(0, 4);

          if (famousProducts.length === 0) return null;

          return (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <h3 className="font-bold text-stone-900 text-base">Top Productos Famosos de la Semana</h3>
                </div>
                <span className="text-xs font-semibold text-stone-500">Actualizado en vivo</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {famousProducts.map(prod => {
                  const store = stores.find(s => s.id === prod.storeId);
                  const isFav = favorites.productIds.includes(prod.id);
                  const hasDiscount = prod.promoPrice && prod.promoPrice < prod.price;

                  return (
                    <div
                      key={prod.id}
                      className="bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between group"
                    >
                      <div className="relative aspect-square bg-stone-100 overflow-hidden cursor-pointer" onClick={() => setSelectedProductId(prod.id)}>
                        {prod.images && prod.images[0] ? (
                          <img
                            src={prod.images[0]}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300">
                            <Package className="w-12 h-12" />
                          </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          <span className="px-2 py-0.5 bg-amber-500 text-white rounded-md text-[10px] font-black uppercase shadow-xs flex items-center gap-1">
                            <Flame className="w-3 h-3 fill-white" /> Famoso
                          </span>
                          {hasDiscount && (
                            <span className="px-2 py-0.5 bg-red-600 text-white rounded-md text-[10px] font-bold shadow-xs">
                              OFERTA
                            </span>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteProduct(prod.id);
                          }}
                          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-colors ${
                            isFav ? 'bg-red-50 text-red-600' : 'bg-white/80 text-stone-600 hover:text-red-600'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-red-600' : ''}`} />
                        </button>
                      </div>

                      <div className="p-3.5 flex flex-col justify-between flex-1 gap-2">
                        <div>
                          {store && (
                            <div className="flex items-center gap-1 text-[11px] text-stone-500 mb-1">
                              <Store className="w-3 h-3 text-stone-400" />
                              <span className="font-semibold text-stone-700 truncate">{store.name}</span>
                              <span className="text-emerald-600 font-bold text-[10px]">✓ Verificado</span>
                            </div>
                          )}

                          <h4 
                            onClick={() => setSelectedProductId(prod.id)}
                            className="font-bold text-stone-900 text-xs sm:text-sm line-clamp-2 hover:text-red-600 cursor-pointer transition-colors leading-snug"
                          >
                            {prod.name}
                          </h4>
                        </div>

                        <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                          <div>
                            <span className="text-xs text-stone-400 block font-mono leading-none">RD$</span>
                            <span className="text-base font-black text-stone-900">
                              {(hasDiscount ? prod.promoPrice : prod.price)?.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                            </span>
                            {hasDiscount && (
                              <span className="text-[10px] text-stone-400 line-through block">
                                RD$ {prod.price?.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => addToCart(prod.id, prod.storeId, 1)}
                            className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-2xs"
                            title="Agregar al Carrito"
                          >
                            <ShoppingBag className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Banner Comercial Integrado para Tiendas (Solo visible para visitantes NO autenticados / no registrados) */}
        {!currentUser && (
          <div id="guest-merchant-registration-cta" className="bg-stone-100 rounded-2xl p-4 sm:p-5 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center shrink-0 text-red-600 shadow-2xs">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-xs sm:text-sm">
                  ¿Tienes productos de alta demanda o quieres vender en PlazaDO?
                </h4>
                <p className="text-[11px] text-stone-500">
                  Registra tu tienda en minutos, llega a miles de clientes en todo el país y cobra con pagos seguros.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <button
                id="cta-register-store-btn"
                onClick={() => setCurrentView('sell_with_us')}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
              >
                Comenzar Registro
              </button>
              <a
                href={`https://wa.me/1${systemSettings.whatsappCommercial.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </section>

    </div>
  );
};

interface ProductCardProps {
  product: any;
  onSelect: () => void;
  onAddToCart: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onSelect, 
  onAddToCart, 
  isFavorite, 
  onToggleFavorite 
}) => {
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md transition-all group flex flex-col">
      <div className="aspect-square bg-stone-100 relative overflow-hidden">
        <img 
          src={product.images[0]} 
          alt={product.name}
          onClick={onSelect}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
        />
        {product.promoPrice && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
            OFERTA
          </span>
        )}
        <button
          onClick={onToggleFavorite}
          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-xs shadow-xs transition-colors ${
            isFavorite ? 'bg-red-50 text-red-600' : 'bg-white/80 text-stone-500 hover:text-red-600'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {isOutOfStock && (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-white text-stone-900 text-xs font-bold px-2 py-1 rounded shadow">
              Agotado
            </span>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-1 text-amber-500 text-[11px] font-bold mb-1">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{product.rating.toFixed(1)}</span>
            <span className="text-stone-400 font-normal">({product.reviewCount})</span>
          </div>

          <h3 
            onClick={onSelect}
            className="font-bold text-xs sm:text-sm text-stone-800 line-clamp-2 hover:text-red-600 cursor-pointer transition-colors"
          >
            {product.name}
          </h3>
        </div>

        <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
          <div>
            {product.promoPrice ? (
              <div className="flex flex-col">
                <span className="text-[11px] text-stone-400 line-through">
                  RD$ {product.price.toLocaleString()}
                </span>
                <span className="font-extrabold text-sm sm:text-base text-red-600">
                  RD$ {product.promoPrice.toLocaleString()}
                </span>
              </div>
            ) : (
              <span className="font-extrabold text-sm sm:text-base text-stone-900">
                RD$ {product.price.toLocaleString()}
              </span>
            )}
          </div>

          <button
            onClick={onAddToCart}
            disabled={isOutOfStock}
            className="p-2 bg-stone-100 hover:bg-red-600 hover:text-white text-stone-700 rounded-lg transition-colors disabled:opacity-40"
            title="Agregar al Carrito"
          >
            <Package className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

interface CategoryPublicationsRowProps {
  category: {
    id: string;
    name: string;
    slug: string;
    description?: string;
  };
  products: any[];
  stores: any[];
  onSelectProduct: (id: string) => void;
  onAddToCart: (productId: string, storeId: string, quantity: number) => void;
  onSelectCategory: (slug: string) => void;
  onSelectStore: (slugOrId: string) => void;
  favorites: { productIds: string[] };
  onToggleFavorite: (productId: string) => void;
}

const CategoryPublicationsRow: React.FC<CategoryPublicationsRowProps> = ({
  category,
  products,
  stores,
  onSelectProduct,
  onAddToCart,
  onSelectCategory,
  onSelectStore,
  favorites,
  onToggleFavorite
}) => {
  const trackRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (trackRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-3 bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs">
      {/* Category Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-lg sm:text-xl shrink-0 shadow-2xs">
            {getCategoryEmoji(category)}
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight truncate">
                {category.name}
              </h3>
              <span className="text-[10px] sm:text-[11px] font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full shrink-0">
                {products.length} {products.length === 1 ? 'publicación' : 'publicaciones'}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 truncate">
              {products.length > 5 
                ? 'Mostrando 5 publicaciones — Desliza la barra para ver las demás'
                : 'Publicaciones oficiales verificadas en República Dominicana'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {products.length > 5 && (
            <div className="hidden sm:flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => scroll('left')}
                className="p-1 rounded-lg hover:bg-white text-stone-700 hover:text-red-600 transition-colors shadow-2xs"
                title={`Desplazar publicaciones de ${category.name} a la izquierda`}
                aria-label="Ver publicaciones anteriores"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="p-1 rounded-lg hover:bg-white text-stone-700 hover:text-red-600 transition-colors shadow-2xs"
                title={`Desplazar publicaciones de ${category.name} a la derecha`}
                aria-label="Ver más publicaciones"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={() => onSelectCategory(category.slug)}
            className="px-3 py-1.5 rounded-xl border border-stone-200 hover:border-red-500 bg-white text-stone-700 hover:text-red-600 font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-xs"
          >
            <span>Ver catálogo ({products.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Publications Scroll Track (Muestra 5 publicaciones visibles en desktop) */}
      <div
        ref={trackRef}
        className="publications-scroll-track flex gap-4 overflow-x-auto pb-3 pt-1 snap-x snap-mandatory scroll-smooth"
      >
        {products.map(product => {
          const store = stores.find(s => s.id === product.storeId);
          const isOutOfStock = product.stock <= 0;
          const isFav = favorites.productIds.includes(product.id);
          const hasDiscount = product.promoPrice && product.promoPrice < product.price;

          return (
            <div
              key={product.id}
              className="snap-start flex-shrink-0 w-[240px] sm:w-[220px] md:w-[210px] lg:w-[calc((100%-64px)/5)] bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-stone-300 transition-all flex flex-col justify-between group"
            >
              <div className="relative aspect-square bg-stone-100 overflow-hidden cursor-pointer" onClick={() => onSelectProduct(product.id)}>
                {product.images && product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300">
                    <Package className="w-10 h-10" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {hasDiscount && (
                    <span className="px-2 py-0.5 bg-red-600 text-white rounded-md text-[10px] font-bold shadow-xs">
                      OFERTA
                    </span>
                  )}
                  {product.isFeatured && (
                    <span className="px-2 py-0.5 bg-amber-500 text-white rounded-md text-[10px] font-bold shadow-xs">
                      DESTACADO
                    </span>
                  )}
                </div>

                {/* Favorite button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(product.id);
                  }}
                  className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-md transition-colors ${
                    isFav ? 'bg-red-50 text-red-600' : 'bg-white/80 text-stone-600 hover:text-red-600'
                  }`}
                  aria-label="Guardar favorito"
                >
                  <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-600' : ''}`} />
                </button>

                {isOutOfStock && (
                  <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center">
                    <span className="bg-white text-stone-900 text-xs font-bold px-2.5 py-1 rounded-md shadow">
                      Agotado
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                <div>
                  {store && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStore(store.slug || store.id);
                      }}
                      className="flex items-center gap-1 text-[11px] text-stone-500 hover:text-red-600 cursor-pointer transition-colors mb-1 truncate"
                    >
                      <Store className="w-3 h-3 text-stone-400 shrink-0" />
                      <span className="font-semibold truncate">{store.name}</span>
                    </div>
                  )}

                  <h4
                    onClick={() => onSelectProduct(product.id)}
                    className="font-bold text-stone-800 text-xs sm:text-sm line-clamp-2 hover:text-red-600 cursor-pointer transition-colors leading-snug"
                  >
                    {product.name}
                  </h4>

                  <div className="flex items-center gap-1 text-amber-500 text-[10px] font-bold mt-1">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{product.rating ? product.rating.toFixed(1) : '5.0'}</span>
                    <span className="text-stone-400 font-normal">({product.reviewCount || 0})</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-stone-400 block font-mono leading-none">RD$</span>
                    <span className="text-sm sm:text-base font-black text-stone-900 truncate block">
                      {(hasDiscount ? product.promoPrice : product.price)?.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </span>
                    {hasDiscount && (
                      <span className="text-[10px] text-stone-400 line-through block truncate">
                        RD$ {product.price?.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => onAddToCart(product.id, product.storeId, 1)}
                    disabled={isOutOfStock}
                    className="p-2 sm:p-2.5 bg-red-600 hover:bg-red-700 disabled:bg-stone-200 disabled:text-stone-400 text-white rounded-xl font-bold transition-colors shadow-2xs shrink-0"
                    title="Agregar al Carrito"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scroll helper */}
      {products.length > 5 && (
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-stone-400 px-1">
          <span>↔ Desliza la barra horizontal para ver las demás publicaciones de {category.name}</span>
          <span className="font-semibold text-stone-500">{products.length} publicaciones disponibles</span>
        </div>
      )}
    </div>
  );
};
