import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Star, 
  ShoppingCart, 
  Store, 
  Truck, 
  ShieldCheck, 
  Check, 
  AlertTriangle, 
  Heart, 
  Share2,
  ChevronRight,
  Package
} from 'lucide-react';

export const ProductDetailModal: React.FC = () => {
  const { 
    selectedProductId, 
    setSelectedProductId, 
    currentUser,
    products, 
    stores, 
    addToCart, 
    favorites, 
    toggleFavoriteProduct,
    setSelectedStoreSlug,
    setCurrentView
  } = useApp();

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (!selectedProductId) return null;

  const product = products.find(p => p.id === selectedProductId);
  if (!product) return null;

  const store = stores.find(s => s.id === product.storeId);
  const isFavorite = favorites.productIds.includes(product.id);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;

  const handleAddToCart = () => {
    if (!currentUser) {
      addToCart(product.id, product.storeId, quantity);
      // Keep product modal context so user seamlessly returns to it upon login/register
      return;
    }
    addToCart(product.id, product.storeId, quantity);
    setSelectedProductId(null);
  };

  const handleBuyNow = () => {
    if (!currentUser) {
      addToCart(product.id, product.storeId, quantity);
      return;
    }
    addToCart(product.id, product.storeId, quantity);
    setSelectedProductId(null);
    setCurrentView('checkout');
  };

  const handleVisitStore = () => {
    if (store) {
      setSelectedStoreSlug(store.slug || store.id);
      setCurrentView('store_public');
      setSelectedProductId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top bar with store breadcrumb & close */}
        <div className="px-5 py-3 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2 text-xs text-stone-500 overflow-hidden">
            <span>PlazaDO</span>
            <ChevronRight className="w-3 h-3 text-stone-400" />
            {store && (
              <button 
                onClick={handleVisitStore} 
                className="font-semibold text-stone-800 hover:text-red-600 flex items-center gap-1 truncate"
              >
                <Store className="w-3.5 h-3.5 text-stone-500" />
                <span>{store.name}</span>
              </button>
            )}
          </div>
          <button 
            aria-label="Cerrar producto"
            onClick={() => setSelectedProductId(null)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          
          {/* Images Gallery */}
          <div className="space-y-3">
            <div className="aspect-square w-full rounded-xl overflow-hidden bg-stone-100 border border-stone-200 relative group">
              <img data-product-image="true" 
                src={product.images[selectedImageIndex] || product.images[0]} 
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {product.promoPrice && (
                <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-sm">
                  OFERTA
                </span>
              )}
              <button
                onClick={() => toggleFavoriteProduct(product.id)}
                className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-colors ${
                  isFavorite ? 'bg-red-50 text-red-600' : 'bg-white/90 text-stone-600 hover:text-red-600'
                }`}
                title="Favorito"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    aria-label={`Ver imagen ${idx + 1} de ${product.name}`}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                      selectedImageIndex === idx ? 'border-red-600 ring-2 ring-red-100' : 'border-stone-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img data-product-image="true" src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Store guarantee pill */}
            <div className="bg-stone-50 rounded-xl p-3.5 border border-stone-200 text-xs space-y-2 text-stone-600">
              <div className="flex items-center gap-2 font-medium text-stone-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Confirmación de entrega con código</span>
              </div>
              <p className="text-[11px] leading-relaxed text-stone-500">
                Comparte tu código únicamente después de recibir y revisar el pedido. En efectivo pagas al recibir; para pagos anticipados, consulta las condiciones del método habilitado al finalizar la compra.
              </p>
            </div>
          </div>

          {/* Product Details & Actions */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono font-medium text-stone-400">SKU: {product.sku}</span>
                <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{product.reviewCount > 0 && product.rating > 0 ? product.rating.toFixed(1) : 'Sin reseñas'}</span>
                  <span className="text-stone-400 font-normal">({product.reviewCount} reseñas)</span>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mt-1 leading-snug">
                {product.name}
              </h2>
            </div>

            {/* Pricing */}
            <div className="flex items-baseline gap-3 py-2 border-y border-stone-100">
              {product.promoPrice ? (
                <>
                  <span className="text-2xl sm:text-3xl font-black text-red-600">
                    RD$ {product.promoPrice.toLocaleString()}
                  </span>
                  <span className="text-base text-stone-400 line-through font-medium">
                    RD$ {product.price.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Ahorras RD$ {(product.price - product.promoPrice).toLocaleString()}
                  </span>
                </>
              ) : (
                <span className="text-2xl sm:text-3xl font-black text-stone-900">
                  RD$ {product.price.toLocaleString()}
                </span>
              )}
            </div>

            {/* Stock State */}
            <div>
              {isOutOfStock ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rose-50 text-rose-700 font-semibold text-xs border border-rose-200">
                  <AlertTriangle className="w-4 h-4" />
                  Agotado actualmente en inventario
                </div>
              ) : isLowStock ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-50 text-amber-700 font-semibold text-xs border border-amber-200">
                  <AlertTriangle className="w-4 h-4" />
                  ¡Últimas {product.stock} unidades en stock!
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-200">
                  <Check className="w-4 h-4" />
                  {product.stock} unidades disponibles para envío
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">Descripción</h4>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Attributes */}
            {product.attributes && product.attributes.length > 0 && (
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                {product.attributes.map((attr, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-stone-50 border border-stone-100">
                    <span className="text-stone-400 block text-[10px] uppercase font-bold">{attr.name}</span>
                    <span className="text-stone-800 font-medium">{attr.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Store and shipping info */}
            {store && (
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={store.logo} alt="" className="w-8 h-8 rounded-full object-cover border border-stone-200" />
                    <div>
                      <p className="text-xs font-bold text-stone-900">{store.name}</p>
                      <p className="text-[11px] text-stone-500">{store.municipality}, {store.province}</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleVisitStore}
                    className="text-xs text-red-600 font-semibold hover:underline"
                  >
                    Ver Tienda
                  </button>
                </div>

                <div className="border-t border-stone-200 pt-2 flex items-center justify-between text-xs text-stone-600">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-stone-400" />
                    <span>Envío: <strong>RD$ {store.shippingConfig?.fixedRate || 200}</strong></span>
                  </div>
                  <span>{store.shippingConfig?.estimatedDays || '24-48 horas'}</span>
                </div>
                <p className="text-[10px] text-stone-500 italic mt-1">
                  * Los precios de envío pueden variar dependiendo de la distancia.
                </p>
              </div>
            )}

            {/* Quantity Selector & Purchase Actions */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-stone-300 rounded-lg overflow-hidden bg-white shrink-0">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="px-3 py-2.5 text-stone-600 hover:bg-stone-100 disabled:opacity-40 transition-colors font-bold text-sm"
                  >
                    -
                  </button>
                  <span className="px-3.5 py-2.5 font-bold text-stone-800 text-xs sm:text-sm min-w-[2.5rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    disabled={quantity >= product.stock || isOutOfStock}
                    className="px-3 py-2.5 text-stone-600 hover:bg-stone-100 disabled:opacity-40 transition-colors font-bold text-sm"
                  >
                    +
                  </button>
                </div>

                <button
                  id="modal-add-to-cart-btn"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex-1 py-2.5 px-4 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white rounded-lg font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>{isOutOfStock ? 'Producto Agotado' : 'Agregar al Carrito'}</span>
                </button>
              </div>

              {!isOutOfStock && (
                <button
                  id="modal-buy-now-btn"
                  onClick={handleBuyNow}
                  className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Comprar Ahora</span>
                  <span className="text-red-200 text-xs font-normal">(&rarr; Ir a Pago)</span>
                </button>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
