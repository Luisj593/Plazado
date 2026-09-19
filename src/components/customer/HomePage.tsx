import React from 'react';
import { useApp } from '../../context/AppContext';
import { DominicanFlag } from '../common/DominicanFlag';
import { isProductPubliclyVisible, isStorePubliclyVisible } from '../../types';
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
  Package,
  ExternalLink
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
  const mainCategories = categories.filter(c => !c.parentId);

  const handleCategorySelect = (slug: string) => {
    setSelectedCategorySlug(slug);
    setCurrentView('catalog');
  };

  const handleStoreSelect = (slug: string) => {
    setSelectedStoreSlug(slug);
    setCurrentView('store_public');
  };

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Section with High Impact Commercial Banner */}
      <section className="max-w-7xl mx-auto px-4 pt-4 sm:pt-6">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl bg-stone-900 min-h-[360px] sm:min-h-[440px] flex items-center">
          {/* Background Image */}
          <img 
            src={banners[0]?.imageUrl || "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1600&auto=format&fit=crop&q=80"} 
            alt="PlazaDO Banner" 
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-900/80 to-transparent" />

          {/* Hero Content */}
          <div className="relative z-10 max-w-2xl px-6 sm:px-12 py-10 text-white space-y-4">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-stone-900/90 border border-stone-700/80 text-white uppercase tracking-wider shadow-sm">
              <DominicanFlag className="w-4 h-3 rounded-2xs inline-block shrink-0 shadow-xs border border-white/20" />
              <span>Marketplace Oficial de República Dominicana</span>
            </span>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-display leading-tight">
              Muchas tiendas.<br />
              <span className="text-red-500">Todo en un solo lugar.</span>
            </h1>

            <p className="text-sm sm:text-base text-stone-300 font-normal leading-relaxed max-w-lg">
              Compra en tiendas oficiales, boutiques, comercios y emprendedores dominicanos. Agrega productos de diferentes establecimientos en un solo pedido.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                id="hero-explore-btn"
                onClick={() => {
                  setSelectedCategorySlug(null);
                  setCurrentView('catalog');
                }}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-lg hover:shadow-red-600/30 transition-all flex items-center gap-2"
              >
                <span>Explorar Todos los Productos</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-sell-btn"
                onClick={() => setCurrentView('sell_with_us')}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-bold text-xs sm:text-sm backdrop-blur-xs transition-all flex items-center gap-2"
              >
                <Store className="w-4 h-4 text-red-400" />
                <span>Registrar Mi Tienda</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Categories Navigation */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
              Explora por Categorías
            </h2>
            <p className="text-xs text-stone-500">Encuentra exactamente lo que buscas</p>
          </div>
          <button
            onClick={() => {
              setSelectedCategorySlug(null);
              setCurrentView('catalog');
            }}
            className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
          >
            <span>Ver catálogo completo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {mainCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.slug)}
              className={`p-4 rounded-xl border text-left transition-all group flex flex-col justify-between ${
                cat.slug === 'mascotas' 
                  ? 'bg-amber-50/70 border-amber-200 hover:border-amber-400 shadow-xs' 
                  : 'bg-white border-stone-200 hover:border-red-400 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">
                  {cat.slug === 'tecnologia' && '📱'}
                  {cat.slug === 'moda-y-calzado' && '👗'}
                  {cat.slug === 'hogar-y-decoracion' && '🛋️'}
                  {cat.slug === 'mascotas' && '🐾'}
                  {cat.slug === 'belleza-y-cuidado' && '✨'}
                  {cat.slug === 'deportes-y-fitness' && '⚡'}
                  {cat.slug === 'alimentos-y-bebidas' && '☕'}
                </span>
                {cat.slug === 'mascotas' && (
                  <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                    Popular
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-xs text-stone-900 group-hover:text-red-600 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-[10px] text-stone-400 mt-0.5 line-clamp-1">
                  {cat.slug === 'mascotas' ? 'Perros, gatos y más' : 'Ver productos'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Featured Stores Carousel/Grid */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <Store className="w-5 h-5 text-red-600" />
              Tiendas Oficiales en PlazaDO
            </h2>
            <p className="text-xs text-stone-500">Comercios verificados de Santo Domingo, Santiago y todo el país</p>
          </div>
        </div>

        {approvedStores.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center max-w-xl mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Store className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-stone-900 text-sm sm:text-base">Aún no hay tiendas publicadas</h3>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
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
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-stone-300 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  {/* Banner & Logo */}
                  <div>
                    <div className="h-32 w-full bg-stone-100 relative overflow-hidden">
                      <img 
                        src={store.banner || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80'} 
                        alt={store.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      
                      {/* Store Logo floating over banner */}
                      <div className="absolute bottom-2.5 left-3 flex items-center gap-2.5">
                        <img 
                          src={store.logo || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=300&auto=format&fit=crop&q=80'} 
                          alt={store.name} 
                          className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md bg-white shrink-0"
                          loading="lazy"
                        />
                        <span className="text-[11px] font-bold text-white bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md border border-white/20 truncate max-w-[140px]">
                          {categoryName}
                        </span>
                      </div>
                    </div>

                    {/* Store Information */}
                    <div className="p-4 pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-sm text-stone-900 group-hover:text-red-600 transition-colors line-clamp-1">
                          {store.name}
                        </h3>
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold shrink-0">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{store.rating ? store.rating.toFixed(1) : '5.0'}</span>
                        </div>
                      </div>

                      <p className="text-xs text-stone-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {store.description}
                      </p>

                      {/* Location and Products count */}
                      <div className="mt-3 flex items-center justify-between text-xs text-stone-600 gap-2">
                        <span className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span className="truncate">{locationStr}</span>
                        </span>
                        <span className="text-[11px] text-stone-500 shrink-0 bg-stone-100 px-2 py-0.5 rounded-full font-medium">
                          {storeProductsCount} {storeProductsCount === 1 ? 'artículo' : 'artículos'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="p-4 pt-2.5 mt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-stone-500">
                      Envío: <span className="font-semibold text-stone-800">RD$ {store.shippingConfig?.fixedRate || 200}</span>
                    </span>
                    <button
                      type="button"
                      id={`btn-view-store-${store.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStoreSelect(store.slug || store.id);
                      }}
                      className="px-3 py-1.5 bg-stone-900 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1 group/btn shadow-xs"
                    >
                      <span>Ver tienda</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
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

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
              {featuredProducts.length > 0 ? 'Productos Destacados de Tiendas Dominicanas' : 'Catálogo de Productos en PlazaDO'}
            </h2>
            <p className="text-xs text-stone-500">
              Explora artículos publicados por tiendas oficiales y comercios verificados
            </p>
          </div>
          {displayProducts.length > 0 && (
            <button
              onClick={() => {
                setSelectedCategorySlug(null);
                setCurrentView('catalog');
              }}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1 group"
            >
              <span>Ver todos ({publishedProducts.length})</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>

        {displayProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center max-w-xl mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-stone-900 text-sm sm:text-base">Catálogo en fase de carga inicial</h3>
            <p className="text-xs text-stone-500">
              Pronto encontrarás una amplia variedad de productos de comercios locales verificados.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {displayProducts.map(product => (
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
        )}
      </section>

      {/* Call to Action: Vende en PlazaDO (Requerimiento #43) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-stone-900 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white relative overflow-hidden border border-stone-800 shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-red-500">
              Expande tu Comercio
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display">
              ¿Tienes una tienda, negocio o vendes de manera independiente?
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              PlazaDO.com puede ayudarte a llevar tus productos a más clientes en toda la República Dominicana.
              Registra tu tienda, sube tus productos y sé parte de nuestra próxima historia de éxito.
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-3">
              <button
                id="cta-sell-register-btn"
                onClick={() => setCurrentView('sell_with_us')}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition-colors"
              >
                Comenzar Registro de Tienda
              </button>

              <a
                href={`https://wa.me/1${systemSettings.whatsappCommercial.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>Escríbenos por WhatsApp ({systemSettings.whatsappCommercial})</span>
              </a>
            </div>
          </div>
        </div>
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
