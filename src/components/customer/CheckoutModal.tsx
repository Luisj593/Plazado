import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  CheckCircle2, 
  CreditCard, 
  Building, 
  Banknote, 
  MapPin, 
  Truck, 
  ShieldCheck, 
  AlertCircle, 
  Lock,
  Store,
  ArrowRight,
  Plus,
  UserPlus,
  LogIn
} from 'lucide-react';
import { DOMINICAN_PROVINCES } from '../../data/initialData';
import { CustomerAddress, PaymentMethodType } from '../../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderGroupCode: string, orderIds: string[]) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const { 
    currentUser, 
    cart,
    cartTotal, 
    getCartGroups, 
    processCheckout, 
    addCustomerAddress, 
    systemSettings,
    openAuthModal
  } = useApp();

  const cartGroups = getCartGroups();

  // Address selection state
  const defaultAddr = currentUser?.addresses?.find(a => a.isDefault) || currentUser?.addresses?.[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string>(defaultAddr?.id || 'new');
  
  // New address form state
  const [showNewAddressForm, setShowNewAddressForm] = useState(!defaultAddr);
  const [newRecipient, setNewRecipient] = useState(currentUser?.name || '');
  const [newPhone, setNewPhone] = useState(currentUser?.phone || '');
  const [newStreet, setNewStreet] = useState('');
  const [newSector, setNewSector] = useState('');
  const [newMunicipality, setNewMunicipality] = useState('');
  const [newProvince, setNewProvince] = useState('Distrito Nacional');
  const [newReference, setNewReference] = useState('');

  // Payment Method state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CARD_AZUL');
  const [customerNotes, setCustomerNotes] = useState('');

  // Simulated AZUL Card Details
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');
  const [cardHolder, setCardHolder] = useState(currentUser?.name || '');

  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  if (!isOpen) return null;

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-200 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-stone-900">Registro Requerido</h3>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
              Para garantizar una entrega segura y proteger tus compras en PlazaDO, debes iniciar sesión o registrarte con tus datos de cliente.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 pt-3">
            <button
              onClick={() => {
                onClose();
                openAuthModal('register_customer');
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Crear Cuenta de Cliente</span>
            </button>
            <button
              onClick={() => {
                onClose();
                openAuthModal('login');
              }}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Ya tengo cuenta • Iniciar Sesión</span>
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 text-stone-400 hover:text-stone-700 text-xs font-medium"
            >
              Volver a la tienda
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleCreateNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreet.trim() || !newSector.trim()) {
      setCheckoutError('Por favor completa la calle y sector para la entrega');
      return;
    }

    addCustomerAddress({
      label: 'Dirección Reciente',
      recipientName: newRecipient,
      phone: newPhone,
      street: newStreet,
      sector: newSector,
      municipality: newMunicipality || 'Santo Domingo',
      province: newProvince,
      reference: newReference,
      isDefault: false
    });

    setShowNewAddressForm(false);
  };

  const handleConfirmOrder = () => {
    setCheckoutError(null);
    setIsProcessing(true);

    // Separación automática de los productos del carrito por store_id
    // Garantiza que cada tienda mantenga su propio grupo de productos y genere un pedido independiente
    const storeIds = Array.from(new Set(cart.map(item => item.storeId)));
    if (storeIds.length === 0) {
      setCheckoutError('El carrito no contiene productos válidos');
      setIsProcessing(false);
      return;
    }

    const separatedByStoreId: Record<string, typeof cart> = {};
    storeIds.forEach(sId => {
      separatedByStoreId[sId] = cart.filter(item => item.storeId === sId);
    });

    // Get active address
    let activeAddress: CustomerAddress | undefined;
    if (selectedAddressId !== 'new' && currentUser?.addresses) {
      activeAddress = currentUser.addresses.find(a => a.id === selectedAddressId);
    }

    if (!activeAddress) {
      if (!newStreet.trim() || !newSector.trim()) {
        setCheckoutError('Debes registrar o seleccionar una dirección de entrega válida');
        setIsProcessing(false);
        return;
      }
      activeAddress = {
        id: `addr-temp-${Date.now()}`,
        label: 'Entrega',
        recipientName: newRecipient || currentUser.name,
        phone: newPhone || currentUser.phone,
        street: newStreet,
        sector: newSector,
        municipality: newMunicipality || 'Santo Domingo',
        province: newProvince,
        reference: newReference
      };
    }

    // Process checkout generating distinct order records per store_id
    setTimeout(() => {
      const res = processCheckout(activeAddress!, paymentMethod, customerNotes, {
        number: cardNumber,
        expiry: cardExpiry,
        cvc: cardCvc
      });

      setIsProcessing(false);
      if (res.success) {
        onSuccess(res.orderGroupCode, res.orderIds);
      } else {
        setCheckoutError(res.error || 'Ocurrió un error al procesar la compra.');
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-red-600" />
            <div>
              <h2 className="font-bold text-stone-900 text-base sm:text-lg">Checkout Seguro PlazaDO</h2>
              <p className="text-[11px] text-stone-500">Muchas tiendas. Un solo pago unificado en RD$.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          
          {checkoutError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{checkoutError}</span>
            </div>
          )}

          {/* 1. Direcciones de Entrega */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-600" />
                1. Dirección de Entrega en República Dominicana
              </h3>
              {!showNewAddressForm && (
                <button
                  type="button"
                  onClick={() => setShowNewAddressForm(true)}
                  className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nueva dirección</span>
                </button>
              )}
            </div>

            {/* Saved Addresses List */}
            {!showNewAddressForm && currentUser.addresses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentUser.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedAddressId === addr.id 
                        ? 'border-red-600 bg-red-50/40 ring-2 ring-red-100' 
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-stone-800 mb-1">
                      <span>{addr.label} ({addr.recipientName})</span>
                      {selectedAddressId === addr.id && (
                        <CheckCircle2 className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <p className="text-stone-600 leading-snug">{addr.street}, {addr.sector}</p>
                    <p className="text-stone-500 mt-1">{addr.municipality}, {addr.province}</p>
                    <p className="text-stone-400 text-[11px] mt-0.5">Tel: {addr.phone}</p>
                  </div>
                ))}
              </div>
            ) : (
              /* New Address Form */
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Nombre de quien recibe</label>
                    <input
                      type="text"
                      value={newRecipient}
                      onChange={(e) => setNewRecipient(e.target.value)}
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Teléfono de contacto</label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="809-000-0000"
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-red-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-stone-700 mb-1">Calle y Número / Edificio / Apto</label>
                    <input
                      type="text"
                      value={newStreet}
                      onChange={(e) => setNewStreet(e.target.value)}
                      placeholder="Ej: Calle Las Damas #14, Apto 2B"
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Sector o Barrio</label>
                    <input
                      type="text"
                      value={newSector}
                      onChange={(e) => setNewSector(e.target.value)}
                      placeholder="Ej: Piantini, Bella Vista, etc."
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Provincia</label>
                    <select
                      value={newProvince}
                      onChange={(e) => setNewProvince(e.target.value)}
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-red-500"
                    >
                      {DOMINICAN_PROVINCES.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-stone-700 mb-1">Referencia para el mensajero (opcional)</label>
                    <input
                      type="text"
                      value={newReference}
                      onChange={(e) => setNewReference(e.target.value)}
                      placeholder="Ej: Frente al supermercado, portón blanco"
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                {currentUser.addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowNewAddressForm(false)}
                    className="text-xs text-stone-500 hover:text-stone-800 font-semibold"
                  >
                    ← Usar una dirección guardada
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 2. Resumen Desglosado por Tienda (Separación por store_id) */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-red-600" />
                2. Separación Automática por Tienda ({cartGroups.length} {cartGroups.length === 1 ? 'pedido' : 'pedidos independientes'})
              </h3>
              <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full font-semibold">
                Un pedido registrado por cada store_id
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              Cada comercio gestionará su propio pedido y empaque. Al confirmar, el sistema generará automáticamente {cartGroups.length} registro(s) de pedido individual(es) vinculados a tu cuenta.
            </p>

            <div className="space-y-3">
              {cartGroups.map((group) => (
                <div key={group.store.id} className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 text-xs">
                  <div className="flex items-center justify-between font-bold text-stone-900 pb-2 border-b border-stone-200">
                    <span className="flex items-center gap-1.5 text-stone-800">
                      <Store className="w-3.5 h-3.5 text-red-600" />
                      {group.store.name}
                    </span>
                    <span className="text-stone-500 text-[11px]">
                      {group.store.shippingConfig?.estimatedDays || '24-48 hrs'}
                    </span>
                  </div>

                  <div className="py-2 space-y-1.5">
                    {group.items.map(({ cartItem, product }) => {
                      const price = product.promoPrice || product.price;
                      return (
                        <div key={cartItem.productId} className="flex justify-between text-stone-600">
                          <span className="truncate max-w-[280px]">
                            {cartItem.quantity}x {product.name}
                          </span>
                          <span className="font-semibold text-stone-900">
                            RD$ {(price * cartItem.quantity).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-stone-200 flex justify-between items-center text-stone-700">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-stone-400" />
                      Envío {group.store.name}:
                    </span>
                    <span className="font-bold">
                      {group.freeShippingQualified ? 'Gratis' : `RD$ ${group.shippingCost.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Método de Pago */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-red-600" />
              3. Método de Pago Centralizado
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Tarjetas AZUL */}
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD_AZUL')}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  paymentMethod === 'CARD_AZUL'
                    ? 'border-red-600 bg-red-50/50 ring-2 ring-red-100 shadow-xs'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <CreditCard className="w-5 h-5 text-red-600" />
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                    AZUL RD
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-stone-900">Tarjeta Crédito / Débito</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">Visa, Mastercard procesado por Banco Popular</p>
                </div>
              </button>

              {/* Contra Entrega */}
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  paymentMethod === 'CASH_ON_DELIVERY'
                    ? 'border-red-600 bg-red-50/50 ring-2 ring-red-100 shadow-xs'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                    Efectivo
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-stone-900">Contra Entrega</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">Pagas en efectivo al recibir tu paquete</p>
                </div>
              </button>

              {/* Transferencia */}
              <button
                type="button"
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-red-600 bg-red-50/50 ring-2 ring-red-100 shadow-xs'
                    : 'border-stone-200 bg-white hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Building className="w-5 h-5 text-stone-700" />
                  <span className="text-[10px] font-bold bg-stone-200 text-stone-800 px-1.5 py-0.5 rounded">
                    ACH
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-xs text-stone-900">Transferencia Bancaria</h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">Popular o Banreservas corporativo</p>
                </div>
              </button>
            </div>

            {/* If AZUL selected, show simulated payment card form */}
            {paymentMethod === 'CARD_AZUL' && (
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 text-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <span className="font-bold text-stone-800 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    Pasarela Segura AZUL (Ambiente de Pruebas / Sandbox)
                  </span>
                  <span className="text-[11px] text-stone-400">Cifrado SSL 256-bit</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="col-span-2 sm:col-span-4">
                    <label className="block font-semibold text-stone-700 mb-1">Titular de la Tarjeta</label>
                    <input
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg outline-none"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-2">
                    <label className="block font-semibold text-stone-700 mb-1">Número de Tarjeta</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Vence (MM/AA)</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">CVC / CVV</label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notes for delivery */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Notas especiales para los comercios (opcional):</label>
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Instrucciones para la entrega o preparación..."
                rows={2}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* 4. Final Breakdown & Totals */}
          <div className="p-4 rounded-xl bg-stone-100 border border-stone-200 text-xs space-y-2">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal Productos ({cartGroups.length} tiendas):</span>
              <span className="font-semibold text-stone-900">RD$ {cartTotal.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Total Envíos:</span>
              <span className="font-semibold text-stone-900">RD$ {cartTotal.shippingTotal.toLocaleString()}</span>
            </div>
            {cartTotal.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Descuento aplicado:</span>
                <span>-RD$ {cartTotal.discountTotal.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-stone-300 pt-2 flex justify-between text-base font-extrabold text-stone-900">
              <span>Monto Total a Pagar:</span>
              <span className="text-red-600">RD$ {cartTotal.grandTotal.toLocaleString()}</span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-stone-600 hover:text-stone-900 text-xs font-semibold"
          >
            Regresar al Carrito
          </button>

          <button
            id="checkout-confirm-btn"
            onClick={handleConfirmOrder}
            disabled={isProcessing}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-stone-300 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            {isProcessing ? (
              <span>Procesando pago seguro...</span>
            ) : (
              <>
                <span>Confirmar y Pagar RD$ {cartTotal.grandTotal.toLocaleString()}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
