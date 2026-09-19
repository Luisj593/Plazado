import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { isProductPubliclyVisible, isStorePubliclyVisible } from '../../types';
import { 
  Search, 
  Filter, 
  Store, 
  Star, 
  MapPin, 
  Check, 
  ChevronRight, 
  SlidersHorizontal,
  X,
  Package,
  ArrowUpDown
} from 'lucide-react';
import { DOMINICAN_PROVINCES } from '../../data/initialData';

export const SearchCatalogPage: React.FC = () => {
  const { 
    products, 
    stores, 
    categories, 
    searchQuery, 
    setSearchQuery, 
    selectedCategorySlug, 
    setSelectedCategorySlug,
    setSelectedProductId,
    setSelectedStoreSlug,
    setCurrentView,
    addToCart,
    favorites,
    toggleFavoriteProduct
  } = useApp();

  // Filters state
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [priceMax, setPriceMax] = useState<number>(200000);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'rating'>('relevance');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Active Category info
  const currentCategory = categories.find(c => c.slug === selectedCategorySlug);

  // Filtered Products Calculation
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!isProductPubliclyVisible(p)) return false;

      // Verify that product's store is actively published
      const productStore = stores.find(s => s.id === p.storeId);
      if (!productStore || !isStorePubliclyVisible(productStore)) return false;

      // Text search in name, description, SKU
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        const matchesSku = p.sku.toLowerCase().includes(q);
        const store = stores.find(s => s.id === p.storeId);
        const matchesStore = store ? store.name.toLowerCase().includes(q) : false;

        if (!matchesName && !matchesDesc && !matchesSku && !matchesStore) {
          return false;
        }
      }

      // Category filter (including subcategories or child categories)
      if (selectedCategorySlug && currentCategory) {
        if (currentCategory.parentId === null) {
          // If parent category (e.g. Mascotas), match products with this categoryId OR subcategory belonging to it
          const subCategoryIds = categories.filter(c => c.parentId === currentCategory.id).map(c => c.id);
          const allowedCategoryIds = [currentCategory.id, ...subCategoryIds];
          if (!allowedCategoryIds.includes(p.categoryId) && (!p.subcategoryId || !allowedCategoryIds.includes(p.subcategoryId))) {
            return false;
          }
        } else {
          // Subcategory
          if (p.categoryId !== currentCategory.id && p.subcategoryId !== currentCategory.id) {
            return false;
          }
        }
      }

      // Store filter
      if (selectedStoreId !== 'all' && p.storeId !== selectedStoreId) {
        return false;
      }

      // Province filter (Store's location)
      if (selectedProvince !== 'all') {
        const store = stores.find(s => s.id === p.storeId);
        if (!store || store.province !== selectedProvince) {
          return false;
        }
      }

      // In stock
      if (onlyInStock && p.stock <= 0) {
        return false;
      }

      // Price filter
      const effectivePrice = p.promoPrice || p.price;
      if (effectivePrice > priceMax) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const priceA = a.promoPrice || a.price;
      const priceB = b.promoPrice || b.price;

      if (sortBy === 'price_asc') return priceA - priceB;
      if (sortBy === 'price_desc') return priceB - priceA;
      if (sortBy === 'rating') return b.rating - a.rating;
      return b.soldCount - a.soldCount; // Relevance / Popularity
    });
  }, [products, stores, searchQuery, selectedCategorySlug, currentCategory, selectedStoreId, selectedProvince, onlyInStock, priceMax, sortBy]);

  // Matching Stores list for query
  const matchingStores = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return stores.filter(s => isStorePubliclyVisible(s) && (s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)));
  }, [stores, searchQuery]);

  const resetFilters = () => {
    setSelectedCategorySlug(null);
    setSelectedStoreId('all');
    setSelectedProvince('all');
    setPriceMax(10000);
    setOnlyInStock(false);
    setSearchQuery('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-1">
            <button onClick={() => setCurrentView('home')} className="hover:underline">PlazaDO</button>
            <ChevronRight className="w-3 h-3 text-stone-400" />
            <span className="font-semibold text-stone-800">
              {currentCategory ? currentCategory.name : 'Catálogo General'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            {searchQuery ? `Resultados para "${searchQuery}"` : currentCategory ? currentCategory.name : 'Todos los Productos y Comercios'}
          </h1>
          <p className="text-xs text-stone-500">
            {filteredProducts.length} productos encontrados en República Dominicana
          </p>
        </div>

        {/* Sort selector & Mobile filter toggle */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="md:hidden px-3 py-2 bg-stone-100 border border-stone-300 rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs bg-white border border-stone-300 rounded-lg px-2.5 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-stone-400 hidden sm:inline">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-semibold text-stone-800 outline-none text-xs"
            >
              <option value="relevance">Más Populares</option>
              <option value="price_asc">Precio: Menor a Mayor</option>
              <option value="price_desc">Precio: Mayor a Menor</option>
              <option value="rating">Mejor Valorados</option>
            </select>
          </div>
        </div>
      </div>

      {/* If matching stores found for search term, highlight them */}
      {matchingStores.length > 0 && (
        <div className="my-6 p-4 rounded-xl bg-amber-50/60 border border-amber-200">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-2">
            <Store className="w-4 h-4 text-amber-600" />
            <span>Tiendas que coinciden con tu búsqueda:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {matchingStores.map(s => (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedStoreSlug(s.slug);
                  setCurrentView('store_public');
                }}
                className="p-3 bg-white rounded-lg border border-amber-200 hover:border-amber-400 text-left flex items-center gap-3 transition-colors shadow-2xs"
              >
                <img src={s.logo} alt="" className="w-10 h-10 rounded-lg object-cover border border-stone-200" />
                <div className="truncate">
                  <h4 className="font-bold text-xs text-stone-900 truncate">{s.name}</h4>
                  <p className="text-[11px] text-stone-500 truncate">{s.municipality}, {s.province}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Layout: Sidebar Filters + Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:block space-y-6 text-xs text-stone-700 pr-2">
          
          {/* Active Filter Tags with Reset */}
          {(selectedCategorySlug || selectedStoreId !== 'all' || selectedProvince !== 'all' || onlyInStock || searchQuery) && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-center justify-between">
              <span className="font-bold text-red-800">Filtros aplicados</span>
              <button onClick={resetFilters} className="text-red-700 hover:underline font-semibold text-[11px]">
                Limpiar todo
              </button>
            </div>
          )}

          {/* Categories Filter */}
          <div className="space-y-2 border-b border-stone-200 pb-5">
            <h4 className="font-bold text-stone-900 uppercase text-[11px] tracking-wider">Categoría</h4>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedCategorySlug(null)}
                className={`w-full text-left px-2 py-1.5 rounded-md transition-colors ${
                  !selectedCategorySlug ? 'bg-stone-200 font-bold text-stone-900' : 'hover:bg-stone-100'
                }`}
              >
                Todas las categorías
              </button>
              {categories.filter(c => !c.parentId).map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategorySlug(c.slug)}
                  className={`w-full text-left px-2 py-1.5 rounded-md transition-colors flex items-center justify-between ${
                    selectedCategorySlug === c.slug ? 'bg-red-50 text-red-700 font-bold' : 'hover:bg-stone-100'
                  }`}
                >
                  <span>{c.name}</span>
                  {c.slug === 'mascotas' && <span className="text-[10px] text-amber-700">🐶🐱</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Tiendas Filter */}
          <div className="space-y-2 border-b border-stone-200 pb-5">
            <h4 className="font-bold text-stone-900 uppercase text-[11px] tracking-wider">Tienda / Comercio</h4>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs outline-none focus:border-red-500"
            >
              <option value="all">Todas las tiendas</option>
              {stores.filter(isStorePubliclyVisible).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Ubicación / Provincia Filter */}
          <div className="space-y-2 border-b border-stone-200 pb-5">
            <h4 className="font-bold text-stone-900 uppercase text-[11px] tracking-wider">Ubicación (Provincia RD)</h4>
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs outline-none focus:border-red-500"
            >
              <option value="all">Todas las provincias</option>
              {DOMINICAN_PROVINCES.map(prov => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="space-y-2 border-b border-stone-200 pb-5">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-stone-900 uppercase text-[11px] tracking-wider">Precio Máximo</h4>
              <span className="font-bold text-red-600">RD$ {priceMax.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="200"
              max="10000"
              step="200"
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full accent-red-600 cursor-pointer"
            />
          </div>

          {/* In Stock Only Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="w-4 h-4 rounded text-red-600 accent-red-600"
              />
              <span className="font-medium text-stone-800">Solo productos con stock disponible</span>
            </label>
          </div>

        </aside>

        {/* Products Grid */}
        <main className="md:col-span-3">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500">
              <Package className="w-12 h-12 mx-auto text-stone-300 mb-3" />
              <h3 className="font-bold text-base text-stone-800">No encontramos productos con esos filtros</h3>
              <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1 mb-4">
                Prueba relajando los filtros de precio o seleccionando otra categoría o provincia.
              </p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition-colors"
              >
                Limpiar Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
              {filteredProducts.map(product => {
                const store = stores.find(s => s.id === product.storeId);
                const isOutOfStock = product.stock <= 0;
                const isFavorite = favorites.productIds.includes(product.id);

                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md transition-all group flex flex-col"
                  >
                    <div className="aspect-square bg-stone-100 relative overflow-hidden">
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        onClick={() => setSelectedProductId(product.id)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                      />
                      {product.promoPrice && (
                        <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                          OFERTA
                        </span>
                      )}
                      <button
                        onClick={() => toggleFavoriteProduct(product.id)}
                        className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-xs shadow-xs transition-colors ${
                          isFavorite ? 'bg-red-50 text-red-600' : 'bg-white/80 text-stone-500 hover:text-red-600'
                        }`}
                      >
                        <span className="sr-only">Favorito</span>
                        <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                      </button>

                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center">
                          <span className="bg-white text-stone-900 text-xs font-bold px-2 py-1 rounded shadow">
                            Agotado
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <div>
                        {store && (
                          <p 
                            onClick={() => {
                              setSelectedStoreSlug(store.slug);
                              setCurrentView('store_public');
                            }}
                            className="text-[11px] font-medium text-stone-400 hover:text-red-600 cursor-pointer truncate mb-1"
                          >
                            {store.name}
                          </p>
                        )}
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
                          onClick={() => addToCart(product.id, product.storeId, 1)}
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
              })}
            </div>
          )}
        </main>
      </div>

    </div>
  );
};
