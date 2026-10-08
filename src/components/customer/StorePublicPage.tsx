import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { isProductPubliclyVisible, isStorePubliclyVisible } from '../../types';
import { 
  Store, 
  MapPin, 
  MessageSquare, 
  Truck, 
  Star, 
  ShieldCheck, 
  Heart, 
  Share2, 
  Search, 
  ArrowLeft,
  CheckCircle2,
  Package,
  Edit,
  Check
} from 'lucide-react';
import { StoreProfileModal } from '../common/StoreProfileModal';

export const StorePublicPage: React.FC = () => {
  const { 
    selectedStoreSlug, 
    stores, 
    products, 
    setCurrentView, 
    setSelectedProductId, 
    addToCart,
    favorites,
    toggleFavoriteStore,
    showNotification,
    currentUser,
    isBootstrapLoading,
    copyStoreShareUrl
  } = useApp();

  const [productSearch, setProductSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Función de normalización de claves/slugs para búsquedas directas
  const normalizeKey = (str?: string) => 
    (str || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  // Resolución robusta de la tienda solicitada
  const matchedStore = useMemo(() => {
    if (!selectedStoreSlug) return null;
    const target = selectedStoreSlug.trim();
    const targetLower = target.toLowerCase();
    const targetNorm = normalizeKey(target);

    // 1. Coincidencia directa por id o slug
    let found = stores.find(s => s.id === target || s.slug?.toLowerCase() === targetLower);
    if (found) return found;

    // 2. Coincidencia normalizada de slug
    found = stores.find(s => normalizeKey(s.slug) === targetNorm);
    if (found) return found;

    // 3. Coincidencia por nombre de la tienda (ej. "Phoenix caps" -> "phoenix-caps")
    found = stores.find(s => normalizeKey(s.name) === targetNorm || s.name?.toLowerCase().trim() === targetLower);
    if (found) return found;

    // 4. Subcadena en slug o nombre
    found = stores.find(s => 
      (s.slug && normalizeKey(s.slug).includes(targetNorm)) || 
      normalizeKey(s.name).includes(targetNorm)
    );
    return found || null;
  }, [stores, selectedStoreSlug]);

  // Si se solicitó una tienda específica mediante enlace o slug, NUNCA mostrar otra tienda como fallback
  const store = selectedStoreSlug ? matchedStore : (stores.find(isStorePubliclyVisible) || stores[0]);

  // Pantalla de carga mientras se sincroniza el estado inicial del servidor
  if (isBootstrapLoading && !store) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mb-4 shadow-sm animate-pulse">
          <Store className="w-8 h-8" />
        </div>
        <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mb-3 mx-auto" />
        <h2 className="text-base font-bold text-stone-900">Cargando tienda oficial...</h2>
        <p className="text-xs text-stone-500 mt-1 max-w-sm">
          Accediendo a la vitrina comercial de PlazaDO
        </p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center text-stone-500 mb-3">
          <Store className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-stone-900">Tienda no encontrada</h2>
        <p className="text-xs text-stone-500 mt-1 max-w-md">
          {selectedStoreSlug 
            ? `No se encontró ninguna tienda asociada a "${selectedStoreSlug}". Es posible que el enlace haya cambiado o la tienda esté inactiva.` 
            : 'La tienda solicitada no se encuentra disponible en el catálogo de PlazaDO.'}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setCurrentView('stores')}
            className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors shadow-xs"
          >
            Ver Directorio de Tiendas
          </button>
          <button
            onClick={() => setCurrentView('catalog')}
            className="px-4 py-2 bg-stone-100 text-stone-700 text-xs font-bold rounded-lg hover:bg-stone-200 transition-colors"
          >
            Explorar catálogo general
          </button>
        </div>
      </div>
    );
  }

  const isOwner = currentUser?.role === 'STORE_OWNER' && currentUser?.storeId === store.id;
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isPubliclyVisible = isStorePubliclyVisible(store);

  if (!isPubliclyVisible && !isOwner && !isSuperAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mb-3">
          <Store className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-stone-900">Tienda temporalmente no disponible</h2>
        <p className="text-xs text-stone-500 mt-1 max-w-md">
          Esta tienda se encuentra temporalmente inactiva o en mantenimiento. Puedes explorar las demás tiendas oficiales activas en PlazaDO.
        </p>
        <button
          onClick={() => setCurrentView('catalog')}
          className="mt-4 px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
        >
          Ver Tiendas Oficiales
        </button>
      </div>
    );
  }

  // Filter products scoped strictly to this store that are published/active!
  const storeProducts = products.filter(p => p.storeId === store.id && isProductPubliclyVisible(p));

  const filteredProducts = storeProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                          p.description.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = filterCategory === 'all' || p.categoryId === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const isFavorite = favorites.storeIds.includes(store.id);

  // Genera UNICAMENTE el link directo a la tienda correspondiente y lo copia
  const handleShare = async () => {
    if (!store) return;
    setCopiedLink(true);
    await copyStoreShareUrl(store);
    setTimeout(() => {
      setCopiedLink(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-stone-50 pb-16">
      {/* Back Button Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <button
          onClick={() => setCurrentView('catalog')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al catálogo general</span>
        </button>
      </div>

      {/* Store Banner & Profile Header */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          
          {/* Cover image */}
          <div className="h-44 sm:h-64 w-full relative bg-stone-800">
            <img 
              src={store.banner} 
              alt={store.name} 
              className="w-full h-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            
            {/* Action buttons on banner */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
              {(currentUser?.role === 'SUPER_ADMIN' || (currentUser?.role === 'STORE_OWNER' && currentUser?.storeId === store.id)) && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Cambiar Portada & Logo</span>
                </button>
              )}
              <button
                id="btn-share-store-public"
                onClick={handleShare}
                className="px-3.5 py-1.5 rounded-lg bg-white/95 hover:bg-white text-stone-800 text-xs font-bold backdrop-blur-xs flex items-center gap-1.5 shadow-sm hover:shadow transition-all active:scale-95"
                title={`Compartir enlace directo de ${store.name}`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    <span className="text-emerald-700">¡Enlace Copiado!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-stone-700" />
                    <span>Compartir</span>
                  </>
                )}
              </button>
              <button
                onClick={() => toggleFavoriteStore(store.id)}
                className={`p-2 rounded-lg backdrop-blur-xs shadow-sm transition-all ${
                  isFavorite ? 'bg-red-600 text-white' : 'bg-white/90 hover:bg-white text-stone-700'
                }`}
                title="Guardar tienda"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Profile Details Container */}
          <div className="p-5 sm:p-6 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-white bg-white shadow-md relative z-10 shrink-0">
                  <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
                      {store.name}
                    </h1>
                    <span title={store.isKycVerified ? "Identidad del comercio validada por la administración; no garantiza cada producto." : "Comercio aprobado para publicar; identidad pendiente de verificación."} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      {store.isKycVerified ? 'Identidad verificada' : 'Tienda publicada'}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{store.municipality}, {store.province}</span>
                  </p>
                </div>
              </div>

              {/* Rating & Sales */}
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg text-amber-900 font-bold">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  <span className="text-sm">{store.reviewCount > 0 && store.rating > 0 ? store.rating.toFixed(1) : 'Sin reseñas'}</span>
                  <span className="text-stone-400 font-normal">({store.reviewCount})</span>
                </div>
                <div className="bg-stone-50 border border-stone-200 px-3 py-1.5 rounded-lg text-stone-700 font-semibold">
                  <span>{store.salesCount} ventas realizadas</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-stone-600 max-w-3xl leading-relaxed mt-2">
              {store.description}
            </p>

            {/* Commercial terms & shipping banner */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white rounded-lg border border-stone-200 text-red-600 shadow-2xs">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Envío por Tienda</span>
                  <span className="font-bold text-stone-800">
                    RD$ {store.shippingConfig?.fixedRate || 200} tarifa fija
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white rounded-lg border border-stone-200 text-emerald-600 shadow-2xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Tiempo Estimado</span>
                  <span className="font-bold text-stone-800">{store.shippingConfig?.estimatedDays || '24 a 48 hrs'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white rounded-lg border border-stone-200 text-red-600 shadow-2xs">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px] uppercase font-bold">Chat en Plataforma</span>
                  <span className="font-bold text-stone-800">Canal Oficial tras Compra</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Store Catalog Section */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        
        {/* Search & filters within store */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-stone-900">
              Productos de {store.name}
            </h2>
            <p className="text-xs text-stone-500">
              {storeProducts.length} productos publicados por este comercio
            </p>
          </div>

          <div className="w-full sm:w-72 relative">
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Buscar en esta tienda..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-stone-300 rounded-lg text-xs outline-none focus:border-red-500 focus:ring-1 focus:ring-red-200"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-200 p-12 text-center text-stone-500">
            <Package className="w-10 h-10 mx-auto text-stone-300 mb-2" />
            <p className="font-semibold text-sm">No se encontraron productos con esos términos</p>
            <p className="text-xs text-stone-400 mt-1">Prueba con otra palabra clave en el buscador.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map(product => {
              const isOutOfStock = product.stock <= 0;
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md transition-all group flex flex-col"
                >
                  <div 
                    onClick={() => setSelectedProductId(product.id)}
                    className="aspect-square bg-stone-100 relative overflow-hidden cursor-pointer"
                  >
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.promoPrice && (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                        OFERTA
                      </span>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center">
                        <span className="bg-white text-stone-900 text-xs font-bold px-2.5 py-1 rounded shadow">
                          Agotado
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-amber-500 text-[11px] font-bold mb-1">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{product.reviewCount > 0 && product.rating > 0 ? product.rating.toFixed(1) : 'Sin reseñas'}</span>
                      </div>
                      <h3 
                        onClick={() => setSelectedProductId(product.id)}
                        className="font-bold text-xs sm:text-sm text-stone-800 line-clamp-2 hover:text-red-600 cursor-pointer transition-colors"
                      >
                        {product.name}
                      </h3>
                    </div>

                    <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        {product.promoPrice ? (
                          <div className="flex flex-col">
                            <span className="text-xs font-normal text-stone-400 line-through">
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
                        onClick={() => addToCart(product.id, product.storeId, 1)}
                        disabled={isOutOfStock}
                        className="p-2 bg-stone-100 hover:bg-red-600 hover:text-white text-stone-700 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-stone-100 disabled:hover:text-stone-700"
                        title="Agregar al Carrito"
                      >
                        <Package className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Store Profile Edit Modal */}
      <StoreProfileModal
        store={store}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </div>
  );
};
