import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { isProductPubliclyVisible, isStorePubliclyVisible } from '../../types';
import { DOMINICAN_PROVINCES } from '../../data/initialData';
import { DominicanFlag } from '../common/DominicanFlag';
import { getCategoryEmoji } from '../../utils/categoryIcons';
import { 
  Store, 
  Search, 
  MapPin, 
  Star, 
  Phone, 
  ArrowRight, 
  ShieldCheck, 
  Truck, 
  ShoppingBag, 
  PlusCircle, 
  ExternalLink,
  Layers,
  Sparkles,
  RotateCcw,
  Share2
} from 'lucide-react';

export const StoresDirectoryPage: React.FC = () => {
  const { 
    stores, 
    products, 
    categories, 
    setCurrentView, 
    setSelectedStoreSlug,
    currentUser,
    openAuthModal,
    copyStoreShareUrl
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'products' | 'newest'>('newest');

  // Consulta global de todas las tiendas públicas activas (sin filtrado por usuario ni sesión)
  const activeStores = useMemo(() => {
    return stores.filter(isStorePubliclyVisible);
  }, [stores]);

  // Filtrado reactivo en tiempo real
  const filteredStores = useMemo(() => {
    let result = activeStores;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.province && s.province.toLowerCase().includes(q)) ||
        (s.municipality && s.municipality.toLowerCase().includes(q)) ||
        (s.address && s.address.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(s => s.categoryId === selectedCategory);
    }

    if (selectedProvince !== 'all') {
      result = result.filter(s => s.province === selectedProvince);
    }

    // Ordenamiento
    return [...result].sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'products') {
        const countA = products.filter(p => p.storeId === a.id && isProductPubliclyVisible(p)).length;
        const countB = products.filter(p => p.storeId === b.id && isProductPubliclyVisible(p)).length;
        return countB - countA;
      }
      // 'newest' por fecha de creación o ID
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [activeStores, searchQuery, selectedCategory, selectedProvince, sortBy, products]);

  const handleStoreClick = (slugOrId: string) => {
    setSelectedStoreSlug(slugOrId);
    setCurrentView('store_public');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedProvince('all');
    setSortBy('newest');
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Header Banner */}
      <section className="bg-stone-900 text-white py-12 px-4 border-b border-stone-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-600/90 text-white uppercase tracking-wider shadow-xs">
                  <DominicanFlag className="w-4 h-2.5 rounded-2xs shadow-2xs border border-white/30" />
                  Directorio Oficial
                </span>
                <span className="text-xs text-stone-400 font-medium">
                  {activeStores.length} tienda{activeStores.length === 1 ? '' : 's'} disponible{activeStores.length === 1 ? '' : 's'} a nivel nacional
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight font-display">
                Tiendas y Comercios de República Dominicana
              </h1>
              <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                Descubre marcas locales, comercios verificados y emprendedores dominicanos. Compra directamente de múltiples tiendas en un solo carrito centralizado.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                id="btn-stores-sell-with-us"
                onClick={() => setCurrentView('sell_with_us')}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 group"
              >
                <PlusCircle className="w-4 h-4 transition-transform group-hover:scale-110" />
                <span>Registrar Mi Tienda</span>
              </button>

              <button
                onClick={() => setCurrentView('catalog')}
                className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Layers className="w-4 h-4 text-stone-400" />
                <span>Ver Catálogo de Productos</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Control Panel: Filters & Search */}
      <section className="max-w-7xl mx-auto px-4 -mt-5">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search input */}
            <div className="relative group">
              <Search className="w-4 h-4 text-stone-500 group-focus-within:text-red-600 absolute left-3 top-1/2 -translate-y-1/2 transition-colors pointer-events-none" />
              <input
                id="stores-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, rubro o ciudad..."
                className="w-full pl-9 pr-4 py-2.5 bg-stone-50 hover:bg-white focus:bg-white border-2 border-stone-200 hover:border-stone-300 focus:border-red-600 focus:ring-4 focus:ring-red-500/10 rounded-xl text-xs font-semibold text-stone-950 placeholder:text-stone-500 placeholder:font-normal caret-red-600 outline-none transition-all"
              />
            </div>

            {/* Category filter */}
            <div>
              <select
                id="stores-category-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-red-500 font-medium text-stone-800"
              >
                <option value="all">Todas las Categorías</option>
                {categories.filter(c => !c.parentId).map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {getCategoryEmoji(cat)} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Province filter */}
            <div>
              <select
                id="stores-province-select"
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-red-500 font-medium text-stone-800"
              >
                <option value="all">Todas las Provincias (RD)</option>
                {DOMINICAN_PROVINCES.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            {/* Sort order */}
            <div>
              <select
                id="stores-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-red-500 font-medium text-stone-800"
              >
                <option value="newest">Más recientes</option>
                <option value="rating">Mayor valoración</option>
                <option value="products">Mayor cantidad de productos</option>
              </select>
            </div>
          </div>

          {/* Active filters and counts */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-stone-500 border-t border-stone-100">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-800">
                Mostrando {filteredStores.length} de {activeStores.length} tiendas activas
              </span>
              {(searchQuery || selectedCategory !== 'all' || selectedProvince !== 'all') && (
                <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded-md font-bold text-[11px]">
                  Filtros aplicados
                </span>
              )}
            </div>

            {(searchQuery || selectedCategory !== 'all' || selectedProvince !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-semibold transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer filtros</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Stores Directory Grid */}
      <section className="max-w-7xl mx-auto px-4 mt-8">
        {filteredStores.length === 0 ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner">
              <Store className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-stone-900">
                {activeStores.length === 0
                  ? 'No hay tiendas disponibles'
                  : 'No se encontraron tiendas con los criterios seleccionados'}
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                {activeStores.length === 0
                  ? '¿Tienes un comercio o marca dominicana? Sé el primer establecimiento en registrarte y comenzar a vender en PlazaDO.'
                  : 'Prueba buscando con otro término, seleccionando otra provincia o limpiando los filtros actuales.'}
              </p>
            </div>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              {activeStores.length > 0 && (
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Limpiar Filtros
                </button>
              )}
              <button
                onClick={() => setCurrentView('sell_with_us')}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Registrar Mi Tienda Ahora</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map(store => {
              const category = categories.find(c => c.id === store.categoryId);
              const categoryName = category?.name || 'Comercio General';
              const locationStr = [store.municipality, store.province].filter(Boolean).join(', ') || store.province || 'República Dominicana';
              const storeProductsCount = products.filter(p => p.storeId === store.id && isProductPubliclyVisible(p)).length;

              return (
                <div
                  key={store.id}
                  id={`store-card-directory-${store.id}`}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-lg hover:border-stone-300 transition-all flex flex-col justify-between group"
                >
                  {/* Top Banner and Logo */}
                  <div>
                    <div 
                      className="h-36 w-full bg-stone-100 relative overflow-hidden cursor-pointer"
                      onClick={() => handleStoreClick(store.slug || store.id)}
                    >
                      <img 
                        src={store.banner || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80'} 
                        alt={store.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      {/* Store Logo floating over banner */}
                      <div className="absolute bottom-3 left-4 flex items-center gap-3">
                        <img 
                          src={store.logo || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=300&auto=format&fit=crop&q=80'} 
                          alt={store.name} 
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md bg-white shrink-0"
                          loading="lazy"
                        />
                        <div>
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-black/60 backdrop-blur-xs px-2.5 py-0.5 rounded-md border border-white/20">
                            <span>{getCategoryEmoji(category)}</span>
                            <span>{categoryName}</span>
                          </span>
                        </div>
                      </div>

                      {/* Verified Badge */}
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 bg-emerald-950/80 text-emerald-300 text-[10px] font-extrabold px-2 py-1 rounded-full border border-emerald-500/40 backdrop-blur-xs shadow-xs">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Verificado</span>
                        </span>
                      </div>
                    </div>

                    {/* Store Information */}
                    <div className="p-5 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div 
                          className="cursor-pointer"
                          onClick={() => handleStoreClick(store.slug || store.id)}
                        >
                          <h3 className="font-black text-base text-stone-900 group-hover:text-red-600 transition-colors line-clamp-1">
                            {store.name}
                          </h3>
                          {store.ownerName && (
                            <p className="text-[11px] text-stone-400">
                              Por {store.ownerName}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold shrink-0 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{store.reviewCount > 0 && store.rating > 0 ? store.rating.toFixed(1) : 'Sin reseñas'}</span>
                        </div>
                      </div>

                      <p className="text-xs text-stone-600 mt-2 line-clamp-2 leading-relaxed">
                        {store.description || 'Tienda publicada en Plazado. Consulta su perfil y condiciones de venta.'}
                      </p>

                      {/* Location and Articles */}
                      <div className="mt-3.5 space-y-1.5 text-xs text-stone-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span className="truncate">{locationStr}</span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-1 text-[11px] text-stone-500">
                          <span className="flex items-center gap-1">
                            <Truck className="w-3 h-3 text-stone-400" />
                            <span>Envío: RD$ {store.shippingConfig?.fixedRate || 200}</span>
                          </span>
                          <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full font-semibold">
                            {storeProductsCount} producto{storeProductsCount === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-4 pt-3 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className="px-2.5 py-1.5 bg-stone-100 text-stone-700 rounded-xl border border-stone-200 text-xs font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
                        <span className="hidden sm:inline">Chat en Plataforma</span>
                        <span className="sm:hidden">Oficial</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyStoreShareUrl(store);
                        }}
                        className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 rounded-xl transition-colors border border-stone-200 text-xs font-semibold flex items-center gap-1"
                        title={`Compartir enlace directo de ${store.name}`}
                      >
                        <Share2 className="w-3.5 h-3.5 text-stone-600" />
                        <span className="hidden sm:inline">Compartir</span>
                      </button>
                    </div>

                    {currentUser?.role === 'STORE_OWNER' && currentUser.storeId === store.id ? (
                      <button
                        id={`btn-manage-store-${store.id}`}
                        onClick={() => setCurrentView('store_dashboard')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ml-auto"
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>Administrar mi tienda</span>
                      </button>
                    ) : (
                      <button
                        id={`btn-visit-store-${store.id}`}
                        onClick={() => handleStoreClick(store.slug || store.id)}
                        className="px-4 py-2 bg-stone-900 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ml-auto"
                      >
                        <span>Visitar Tienda</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA: Vende con nosotros */}
      <section className="max-w-7xl mx-auto px-4 mt-16">
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <span className="inline-block bg-white/20 text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full">
              Únete a la Red Comercial
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-display">
              ¿Tienes un negocio, comercio o marca en República Dominicana?
            </h2>
            <p className="text-xs sm:text-sm text-red-100 leading-relaxed">
              Comienza a vender hoy mismo en PlazaDO. Llega a miles de clientes en Santo Domingo, Santiago y todas las provincias con tu propia tienda digital verificada.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => setCurrentView('sell_with_us')}
              className="px-6 py-3.5 bg-white text-red-600 hover:bg-red-50 rounded-xl text-xs font-black shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registra tu Tienda Ahora</span>
            </button>
            <button
              onClick={() => openAuthModal('register_store')}
              className="px-6 py-3.5 bg-red-800/80 hover:bg-red-900 text-white rounded-xl text-xs font-bold transition-colors border border-white/20 flex items-center justify-center gap-2"
            >
              <Store className="w-4 h-4" />
              <span>Acceder como Tienda</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
