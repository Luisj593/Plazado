import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  ShoppingCart, 
  Trash2, 
  Store, 
  Truck, 
  ArrowRight, 
  Tag, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, 
  onClose, 
  onProceedToCheckout 
}) => {
  const { 
    cart, 
    removeFromCart, 
    updateCartQuantity, 
    clearCart, 
    getCartGroups, 
    cartTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    setSelectedProductId
  } = useApp();

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ error?: string; success?: string } | null>(null);

  if (!isOpen) return null;

  const cartGroups = getCartGroups();

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;
    const res = applyCoupon(couponCodeInput);
    if (res.success) {
      setCouponFeedback({ success: res.message });
      setCouponCodeInput('');
    } else {
      setCouponFeedback({ error: res.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs transition-opacity" 
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-red-600" />
              <h2 className="font-bold text-stone-900 text-base">Carrito Multi-Tienda</h2>
              <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {cartTotal.itemsCount} {cartTotal.itemsCount === 1 ? 'artículo' : 'artículos'}
              </span>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content */}
          {cart.length === 0 ? (
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center text-stone-500 space-y-3">
              <div className="p-4 bg-stone-100 rounded-full text-stone-400">
                <ShoppingCart className="w-10 h-10" />
              </div>
              <h3 className="font-bold text-stone-800 text-base">Tu carrito está vacío</h3>
              <p className="text-xs text-stone-400 max-w-xs leading-relaxed">
                Explora nuestras tiendas y agrega productos de diferentes comercios dominicanos en un solo pedido.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                Comenzar a Comprar
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Info banner explaining multi-store grouping */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                <Store className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <span className="font-bold">Desglose Multi-Tienda:</span> Tus productos están ordenados por establecimiento. Cada tienda prepara y despacha su paquete de forma independiente.
                </div>
              </div>

              {/* Grouped by Store */}
              {cartGroups.map((group) => (
                <div 
                  key={group.store.id} 
                  className="rounded-xl border border-stone-200 bg-stone-50/50 overflow-hidden shadow-2xs"
                >
                  {/* Store Header */}
                  <div className="px-4 py-2.5 bg-stone-100/90 border-b border-stone-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-red-600" />
                      <span className="font-bold text-xs text-stone-900">{group.store.name}</span>
                    </div>
                    <span className="text-[11px] text-stone-500">
                      {group.items.length} {group.items.length === 1 ? 'artículo' : 'artículos'}
                    </span>
                  </div>

                  {/* Items in this Store */}
                  <div className="divide-y divide-stone-100 bg-white">
                    {group.items.map(({ cartItem, product }) => {
                      const effectivePrice = product.promoPrice || product.price;
                      return (
                        <div key={cartItem.productId} className="p-3.5 flex gap-3">
                          <img 
                            src={product.images[0]} 
                            alt={product.name}
                            onClick={() => {
                              setSelectedProductId(product.id);
                              onClose();
                            }}
                            className="w-16 h-16 rounded-lg object-cover bg-stone-100 border border-stone-200 cursor-pointer shrink-0" 
                          />
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <h4 
                                onClick={() => {
                                  setSelectedProductId(product.id);
                                  onClose();
                                }}
                                className="font-semibold text-xs text-stone-900 truncate hover:text-red-600 cursor-pointer"
                              >
                                {product.name}
                              </h4>
                              <p className="text-[11px] font-bold text-stone-900 mt-0.5">
                                RD$ {effectivePrice.toLocaleString()} c/u
                              </p>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                              {/* Quantity Controls */}
                              <div className="flex items-center border border-stone-200 rounded-md overflow-hidden bg-stone-50 text-xs">
                                <button
                                  onClick={() => updateCartQuantity(cartItem.productId, cartItem.quantity - 1)}
                                  className="px-2 py-0.5 hover:bg-stone-200 font-bold"
                                >
                                  -
                                </button>
                                <span className="px-2 py-0.5 font-semibold text-stone-800 min-w-[1.5rem] text-center">
                                  {cartItem.quantity}
                                </span>
                                <button
                                  onClick={() => updateCartQuantity(cartItem.productId, cartItem.quantity + 1)}
                                  className="px-2 py-0.5 hover:bg-stone-200 font-bold"
                                >
                                  +
                                </button>
                              </div>

                              <button
                                onClick={() => removeFromCart(cartItem.productId)}
                                className="text-stone-400 hover:text-rose-600 p-1 transition-colors"
                                title="Quitar producto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Store Subtotal & Delivery Breakdown */}
                  <div className="p-3 bg-stone-50 border-t border-stone-200 text-xs space-y-1.5 text-stone-600">
                    <div className="flex justify-between">
                      <span>Subtotal {group.store.name}:</span>
                      <span className="font-semibold text-stone-800">RD$ {group.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-stone-400" />
                        Envío de esta tienda:
                      </span>
                      {group.freeShippingQualified ? (
                        <span className="font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
                          ¡Envío Gratis!
                        </span>
                      ) : (
                        <span className="font-semibold text-stone-800">RD$ {group.shippingCost.toLocaleString()}</span>
                      )}
                    </div>
                    <div className="border-t border-stone-200 pt-1 flex justify-between font-bold text-stone-900">
                      <span>Total Tienda:</span>
                      <span>RD$ {group.storeTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Coupon Section */}
              <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50">
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 mb-2">
                  <Tag className="w-4 h-4 text-red-600" />
                  <span>¿Tienes un cupón de descuento?</span>
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                    <div>
                      <span className="font-bold">Cupón {appliedCoupon.code}</span>
                      <span className="ml-2 text-[11px]">
                        (-RD$ {cartTotal.discountTotal.toLocaleString()})
                      </span>
                    </div>
                    <button 
                      onClick={removeCoupon}
                      className="text-stone-400 hover:text-stone-700 font-bold"
                    >
                      Quitar
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value)}
                      placeholder="Ej: PLAZA500 o TECH10"
                      className="flex-1 uppercase px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg outline-none focus:border-red-500"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Aplicar
                    </button>
                  </form>
                )}

                {couponFeedback?.error && (
                  <p className="text-[11px] text-rose-600 mt-1.5 font-medium">{couponFeedback.error}</p>
                )}
                {couponFeedback?.success && (
                  <p className="text-[11px] text-emerald-600 mt-1.5 font-medium">{couponFeedback.success}</p>
                )}
              </div>

            </div>
          )}

          {/* Footer Totals & Checkout Button */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-stone-200 bg-stone-50 space-y-3">
              <div className="space-y-1.5 text-xs text-stone-600">
                <div className="flex justify-between">
                  <span>Suma de productos:</span>
                  <span className="font-semibold text-stone-900">RD$ {cartTotal.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Envíos ({cartGroups.length} tiendas):</span>
                  <span className="font-semibold text-stone-900">RD$ {cartTotal.shippingTotal.toLocaleString()}</span>
                </div>
                {cartTotal.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Descuento aplicado:</span>
                    <span>-RD$ {cartTotal.discountTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-stone-300 pt-2 flex justify-between text-base font-extrabold text-stone-900">
                  <span>Total General:</span>
                  <span className="text-red-600">RD$ {cartTotal.grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <button
                id="cart-checkout-proceed-btn"
                onClick={onProceedToCheckout}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>Proceder al Pago</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-stone-400 text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Pago protegido con código secreto de confirmación de entrega</span>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
