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
  ChevronLeft,
  ArrowRight,
  SlidersHorizontal,
  X,
  Package,
  ArrowUpDown,
  LayoutGrid,
  Layers,
  ShoppingBag,
  Heart
} from 'lucide-react';
import { DOMINICAN_PROVINCES, INITIAL_CATEGORIES } from '../../data/initialData';
import { CategoryIcon, getCategoryEmoji } from '../../utils/categoryIcons';

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

  // Categories fallback guarantee: always populated even before initial sync
  const activeCategories = useMemo(() => {
    return (categories && categories.length > 0) ? categories : INITIAL_CATEGORIES;
  }, [categories]);

  // Main categories (excluding subcategories)
  const mainCategories = useMemo(() => {
    return activeCategories.filter(c => !c.parentId);
  }, [activeCategories]);

  // Filters state
  const [selectedStoreId, setSelectedStoreId] = useState<string>('all');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [priceMax, setPriceMax] = useState<number>(200000);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'rating'>('relevance');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'segregated' | 'grid'>('segregated');

  // Active Category info
  const currentCategory = activeCategories.find(c => c.slug === selectedCategorySlug);

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

  // Segregate filtered products by category when viewing all categories (5 publications per category row)
  const segregatedCategories = useMemo(() => {
    if (selectedCategorySlug || searchQuery.trim()) return [];

    const rootCats = mainCategories;
    const groups: { category: any; products: typeof filteredProducts }[] = [];

    rootCats.forEach(cat => {
      const subCatIds = activeCategories.filter(c => c.parentId === cat.id).map(c => c.id);
      const allowedIds = [cat.id, cat.slug, ...subCatIds];

      const catProds = filteredProducts.filter(p => {
        return allowedIds.includes(p.categoryId) || (p.subcategoryId && allowedIds.includes(p.subcategoryId));
      });

      if (catProds.length > 0) {
        groups.push({
          category: cat,
          products: catProds
        });
      }
    });

    const matchedProductIds = new Set(groups.flatMap(g => g.products.map(p => p.id)));
    const remainingProducts = filteredProducts.filter(p => !matchedProductIds.has(p.id));

    if (remainingProducts.length > 0) {
      const remainingMap: { [catId: string]: typeof filteredProducts } = {};
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
  }, [activeCategories, mainCategories, filteredProducts, selectedCategorySlug, searchQuery]);

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
          {!selectedCategorySlug && !searchQuery && (
            <div className="hidden sm:flex items-center bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('segregated')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                  viewMode === 'segregated' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Segregar publicaciones por cada categoría (5 por fila)"
              >
                <Layers className="w-3.5 h-3.5 text-red-600" />
                <span>Por Categorías</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-stone-900 shadow-2xs font-bold' : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Ver cuadrícula completa"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cuadrícula</span>
              </button>
            </div>
          )}

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
                  setSelectedStoreSlug(s.slug || s.id);
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
          <div className="space-y-2.5 border-b border-stone-200 pb-5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-stone-900 uppercase text-[11px] tracking-wider">
                Categoría ({mainCategories.length})
              </h4>
              {selectedCategorySlug && (
                <button 
                  type="button" 
                  onClick={() => setSelectedCategorySlug(null)}
                  className="text-red-600 text-[10px] font-bold hover:underline"
                >
                  Ver todas
                </button>
              )}
            </div>

            {/* Selector desplegable directo (coherente con Tienda y Ubicación) */}
            <select
              value={selectedCategorySlug || 'all'}
              onChange={(e) => setSelectedCategorySlug(e.target.value === 'all' ? null : e.target.value)}
              className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs font-semibold outline-none focus:border-red-500 text-stone-900"
            >
              <option value="all">Todas las categorías ({mainCategories.length})</option>
              {mainCategories.map(cat => {
                const subCats = activeCategories.filter(c => c.parentId === cat.id);
                return (
                  <optgroup key={cat.id} label={cat.name}>
                    <option value={cat.slug}>{cat.name} (Todo)</option>
                    {subCats.map(sub => (
                      <option key={sub.id} value={sub.slug}>↳ {sub.name}</option>
                    ))}
                  </optgroup>
                );
              })}
            </select>

            {/* Listado interactivo completo con emojis e iconos */}
            <div className="space-y-1 max-h-64 overflow-y-auto pr-1 pt-1">
              <button
                type="button"
                onClick={() => setSelectedCategorySlug(null)}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between text-xs ${
                  !selectedCategorySlug ? 'bg-red-50 font-bold text-red-700 border border-red-200' : 'hover:bg-stone-100 text-stone-700'
                }`}
              >
                <span>Todas las categorías</span>
                <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-full font-bold">
                  {mainCategories.length}
                </span>
              </button>
              {mainCategories.map(c => {
                const isSelected = selectedCategorySlug === c.slug;
                const count = products.filter(p => isProductPubliclyVisible(p) && (p.categoryId === c.id || p.categoryId === c.slug)).length;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCategorySlug(c.slug)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg transition-colors flex items-center justify-between gap-1.5 text-xs ${
                      isSelected ? 'bg-red-600 text-white font-bold shadow-xs' : 'hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <CategoryIcon category={c} className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-stone-500'}`} />
                      <span className="truncate">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {count > 0 && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'}`}>
                          {count}
                        </span>
                      )}
                      <span className="text-xs">{getCategoryEmoji(c)}</span>
                    </div>
                  </button>
                );
              })}
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
          ) : viewMode === 'segregated' && !selectedCategorySlug && !searchQuery && segregatedCategories.length > 0 ? (
            <div className="space-y-6">
              {segregatedCategories.map(({ category, products: catProducts }) => (
                <CategoryRowCatalog
                  key={category.id || category.slug}
                  category={category}
                  products={catProducts}
                  stores={stores}
                  onSelectProduct={(id) => setSelectedProductId(id)}
                  onAddToCart={(prodId, stId, qty) => addToCart(prodId, stId, qty)}
                  onSelectCategory={(slug) => setSelectedCategorySlug(slug)}
                  onSelectStore={(slug) => {
                    setSelectedStoreSlug(slug);
                    setCurrentView('store_public');
                  }}
                  favorites={favorites}
                  onToggleFavorite={(id) => toggleFavoriteProduct(id)}
                />
              ))}
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
                      <img data-product-image="true" 
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
                              setSelectedStoreSlug(store.slug || store.id);
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

      {/* Mobile Filter Slide-over Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden md:hidden">
          <div 
            onClick={() => setMobileFilterOpen(false)}
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity" 
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6">
            <div className="w-screen max-w-xs sm:max-w-sm bg-white shadow-2xl flex flex-col">
              
              {/* Drawer Header */}
              <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-red-600" />
                  <h3 className="font-bold text-stone-900 text-sm">Filtros de Búsqueda</h3>
                </div>
                <button 
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs text-stone-700">
                
                {/* Active Filters Reset */}
                {(selectedCategorySlug || selectedStoreId !== 'all' || selectedProvince !== 'all' || onlyInStock || searchQuery) && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-100 flex items-center justify-between">
                    <span className="font-bold text-red-800">Filtros aplicados</span>
                    <button 
                      onClick={() => {
                        resetFilters();
                        setMobileFilterOpen(false);
                      }} 
                      className="text-red-700 hover:underline font-semibold text-[11px]"
                    >
                      Limpiar todo
                    </button>
                  </div>
                )}

                {/* Categories */}
                <div className="space-y-2 border-b border-stone-200 pb-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-stone-900 uppercase text-[11px] tracking-wider">
                      Categoría ({mainCategories.length})
                    </h4>
                    {selectedCategorySlug && (
                      <button 
                        type="button" 
                        onClick={() => setSelectedCategorySlug(null)}
                        className="text-red-600 text-[10px] font-bold hover:underline"
                      >
                        Ver todas
                      </button>
                    )}
                  </div>

                  {/* Dropdown selector */}
                  <select
                    value={selectedCategorySlug || 'all'}
                    onChange={(e) => setSelectedCategorySlug(e.target.value === 'all' ? null : e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs font-semibold outline-none focus:border-red-500 text-stone-900"
                  >
                    <option value="all">Todas las categorías ({mainCategories.length})</option>
                    {mainCategories.map(cat => {
                      const subCats = activeCategories.filter(c => c.parentId === cat.id);
                      return (
                        <optgroup key={cat.id} label={cat.name}>
                          <option value={cat.slug}>{cat.name} (Todo)</option>
                          {subCats.map(sub => (
                            <option key={sub.id} value={sub.slug}>↳ {sub.name}</option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>

                  {/* Interactive scrollable list */}
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedCategorySlug(null)}
                      className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors flex items-center justify-between ${
                        !selectedCategorySlug ? 'bg-red-50 font-bold text-red-700' : 'hover:bg-stone-100 text-stone-700'
                      }`}
                    >
                      <span>Todas las categorías</span>
                      <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-full font-bold">
                        {mainCategories.length}
                      </span>
                    </button>
                    {mainCategories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedCategorySlug(cat.slug)}
                        className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors flex items-center justify-between ${
                          selectedCategorySlug === cat.slug ? 'bg-red-600 text-white font-bold' : 'hover:bg-stone-100 text-stone-700'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        <span className="text-xs shrink-0">{getCategoryEmoji(cat)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Store Filter */}
                <div className="space-y-2 border-b border-stone-200 pb-4">
                  <h4 className="font-bold text-stone-900 uppercase text-[11px] tracking-wider">Tienda</h4>
                  <select
                    value={selectedStoreId}
                    onChange={(e) => setSelectedStoreId(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs outline-none focus:border-red-500"
                  >
                    <option value="all">Todas las tiendas</option>
                    {stores.filter(isStorePubliclyVisible).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Province Filter */}
                <div className="space-y-2 border-b border-stone-200 pb-4">
                  <h4 className="font-bold text-stone-900 uppercase text-[11px] tracking-wider">Provincia</h4>
                  <select
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs outline-none focus:border-red-500"
                  >
                    <option value="all">Todo el país (31 Provincias + D.N.)</option>
                    {DOMINICAN_PROVINCES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Price Filter */}
                <div className="space-y-2 border-b border-stone-200 pb-4">
                  <div className="flex justify-between font-bold text-stone-900">
                    <span className="uppercase text-[11px] tracking-wider">Precio Máximo</span>
                    <span className="text-red-600 font-mono">RD$ {priceMax.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100000"
                    step="500"
                    value={priceMax}
                    onChange={(e) => setPriceMax(Number(e.target.value))}
                    className="w-full accent-red-600 cursor-pointer h-2 bg-stone-200 rounded-lg"
                  />
                </div>

                {/* In Stock Only */}
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

              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-stone-200 bg-stone-50 flex gap-2">
                <button
                  onClick={() => {
                    resetFilters();
                    setMobileFilterOpen(false);
                  }}
                  className="w-1/2 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded-xl text-xs font-bold transition-colors"
                >
                  Restablecer
                </button>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="w-1/2 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  Aplicar ({filteredProducts.length})
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

interface CategoryRowCatalogProps {
  category: any;
  products: any[];
  stores: any[];
  onSelectProduct: (id: string) => void;
  onAddToCart: (productId: string, storeId: string, quantity: number) => void;
  onSelectCategory: (slug: string) => void;
  onSelectStore: (slugOrId: string) => void;
  favorites: { productIds: string[] };
  onToggleFavorite: (productId: string) => void;
}

const CategoryRowCatalog: React.FC<CategoryRowCatalogProps> = ({
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
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-lg shrink-0 shadow-2xs">
            {getCategoryEmoji(category)}
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-stone-900 tracking-tight truncate">
                {category.name}
              </h3>
              <span className="text-[10px] sm:text-[11px] font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full shrink-0">
                {products.length} {products.length === 1 ? 'publicación' : 'publicaciones'}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 truncate">
              {products.length > 5 
                ? 'Mostrando 5 publicaciones — Desliza la barra para ver más'
                : 'Artículos verificados en República Dominicana'}
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
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                className="p-1 rounded-lg hover:bg-white text-stone-700 hover:text-red-600 transition-colors shadow-2xs"
                title={`Desplazar publicaciones de ${category.name} a la derecha`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={() => onSelectCategory(category.slug)}
            className="px-3 py-1.5 rounded-xl border border-stone-200 hover:border-red-500 bg-white text-stone-700 hover:text-red-600 font-bold text-xs transition-all flex items-center gap-1.5 shadow-2xs hover:shadow-xs"
          >
            <span>Ver categoría ({products.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

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
              className="snap-start flex-shrink-0 w-[220px] sm:w-[210px] md:w-[200px] lg:w-[calc((100%-48px)/4)] xl:w-[calc((100%-64px)/5)] bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-stone-300 transition-all flex flex-col justify-between group"
            >
              <div className="relative aspect-square bg-stone-100 overflow-hidden cursor-pointer" onClick={() => onSelectProduct(product.id)}>
                {product.images && product.images[0] ? (
                  <img data-product-image="true"
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
                    <span>{product.reviewCount > 0 && product.rating > 0 ? product.rating.toFixed(1) : 'Sin reseñas'}</span>
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

      {products.length > 5 && (
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-stone-400 px-1">
          <span>↔ Desliza horizontalmente para ver más publicaciones de {category.name}</span>
          <span className="font-semibold text-stone-500">{products.length} publicaciones disponibles</span>
        </div>
      )}
    </div>
  );
};
