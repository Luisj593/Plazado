import { PayPalButton } from './PayPalButton';
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
  LogIn,
  Loader2,
  Phone,
  Navigation,
  FileText,
  Star,
  Home,
  Briefcase,
  ExternalLink,
  Check
} from 'lucide-react';
import { DOMINICAN_PROVINCES } from '../../data/initialData';
import { getMunicipalitiesForProvince } from '../../data/dominicanLocations';
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
    completePayPalCheckout,
    cancelPayPalCheckout, 
    addCustomerAddress, 
    systemSettings,
    openAuthModal
  } = useApp();

  const cartGroups = getCartGroups();

  // Address selection state
  const defaultAddr = currentUser?.addresses?.find(a => a.isDefault) || currentUser?.addresses?.[0];
  const [selectedAddressId, setSelectedAddressId] = useState<string>(defaultAddr?.id || '');
  
  // New address form state
  const [showNewAddressForm, setShowNewAddressForm] = useState(!defaultAddr);
  const [newLabel, setNewLabel] = useState('Casa');
  const [newRecipient, setNewRecipient] = useState(currentUser?.name || '');
  const [newPhone, setNewPhone] = useState(currentUser?.phone || '');
  const [newProvince, setNewProvince] = useState(DOMINICAN_PROVINCES[0]);
  const [newMunicipality, setNewMunicipality] = useState(getMunicipalitiesForProvince(DOMINICAN_PROVINCES[0])[0] || '');
  const [newSector, setNewSector] = useState('');
  const [newStreet, setNewStreet] = useState('');
  const [newBuildingNumber, setNewBuildingNumber] = useState('');
  const [newReference, setNewReference] = useState('');
  const [newLocationUrl, setNewLocationUrl] = useState('');
  const [newDeliveryNotes, setNewDeliveryNotes] = useState('');
  const [newIsDefault, setNewIsDefault] = useState(currentUser?.addresses?.length === 0);
  const [isSavingNewAddress, setIsSavingNewAddress] = useState(false);

  // Payment Method state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('CASH_ON_DELIVERY');
  const [customerNotes, setCustomerNotes] = useState('');

  // Simulated AZUL Card Details

  const [isProcessing, setIsProcessing] = useState(false);
  const [chargeProgressMessage, setChargeProgressMessage] = useState<string>('');
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

  const handleProvinceChange = (prov: string) => {
    setNewProvince(prov);
    const munis = getMunicipalitiesForProvince(prov);
    if (munis && munis.length > 0) {
      setNewMunicipality(munis[0]);
    } else {
      setNewMunicipality('');
    }
  };

  const handleCreateNewAddress = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCheckoutError(null);

    if (!newRecipient.trim()) {
      setCheckoutError('Por favor indica el nombre de la persona que recibirá la entrega.');
      return null;
    }
    if (!newPhone.trim()) {
      setCheckoutError('Por favor ingresa un número de teléfono de contacto para la entrega.');
      return null;
    }
    if (!newStreet.trim()) {
      setCheckoutError('Por favor ingresa la calle o avenida de entrega.');
      return null;
    }
    if (!newSector.trim()) {
      setCheckoutError('Por favor ingresa el sector o barrio.');
      return null;
    }
    if (!newMunicipality.trim()) {
      setCheckoutError('Por favor especifica el municipio.');
      return null;
    }

    setIsSavingNewAddress(true);
    try {
      const created = await addCustomerAddress({
        label: newLabel.trim() || 'Casa',
        recipientName: newRecipient.trim(),
        phone: newPhone.trim(),
        province: newProvince.trim(),
        municipality: newMunicipality.trim(),
        sector: newSector.trim(),
        street: newStreet.trim(),
        buildingNumber: newBuildingNumber.trim() || undefined,
        reference: newReference.trim() || undefined,
        locationUrl: newLocationUrl.trim() || undefined,
        deliveryNotes: newDeliveryNotes.trim() || undefined,
        isDefault: newIsDefault
      });

      if (created) {
        setSelectedAddressId(created.id);
        setShowNewAddressForm(false);
        return created;
      }
      return null;
    } catch (err: any) {
      setCheckoutError(err.message || 'Error guardando la nueva dirección');
      return null;
    } finally {
      setIsSavingNewAddress(false);
    }
  };

  const handleConfirmOrder = async () => {
    setCheckoutError(null);

    // Separación automática de los productos del carrito por store_id
    // Garantiza que cada tienda mantenga su propio grupo de productos y genere un pedido independiente
    const storeIds = Array.from(new Set(cart.map(item => item.storeId)));
    if (storeIds.length === 0) {
      setCheckoutError('El carrito no contiene productos válidos');
      return;
    }

    // Get active address
    let activeAddress: CustomerAddress | undefined;
    if (selectedAddressId && selectedAddressId !== 'new' && currentUser?.addresses) {
      activeAddress = currentUser.addresses.find(a => a.id === selectedAddressId);
    }

    // Si está abierto el formulario de nueva dirección o no hay seleccionada
    if (!activeAddress) {
      if (showNewAddressForm) {
        const saved = await handleCreateNewAddress();
        if (!saved) return;
        activeAddress = saved;
      } else if (currentUser?.addresses && currentUser.addresses.length > 0) {
        activeAddress = currentUser.addresses.find(a => a.isDefault) || currentUser.addresses[0];
      }
    }

    if (!activeAddress) {
      setCheckoutError('Debes registrar o seleccionar una dirección de entrega para recibir tu pedido.');
      setShowNewAddressForm(true);
      return;
    }

    // Copia histórica inmutable para preservar la dirección original en el pedido
    const addressSnapshot: CustomerAddress = {
      id: activeAddress.id,
      label: activeAddress.label || 'Dirección de Entrega',
      recipientName: activeAddress.recipientName,
      phone: activeAddress.phone,
      province: activeAddress.province,
      municipality: activeAddress.municipality,
      sector: activeAddress.sector,
      street: activeAddress.street,
      buildingNumber: activeAddress.buildingNumber,
      reference: activeAddress.reference,
      locationUrl: activeAddress.locationUrl,
      deliveryNotes: activeAddress.deliveryNotes,
      isDefault: activeAddress.isDefault,
      userId: activeAddress.userId || currentUser.id
    };

    if (isProcessing) return;
    setIsProcessing(true);
    setChargeProgressMessage('Confirmando pedido...');
    try {
      const res = await processCheckout(addressSnapshot, paymentMethod, customerNotes);
      if (res.success && paymentMethod === 'PAYPAL') return res.paypalOrderId;
      if (res.success) onSuccess(res.orderGroupCode, res.orderIds);
      else setCheckoutError(res.error || 'No se pudo confirmar el pedido');
    } finally {
      setIsProcessing(false);
      setChargeProgressMessage('');
    }

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

          {/* 1. Dirección de entrega */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-600" />
                1. Dirección de entrega
              </h3>
              {!showNewAddressForm && (
                <button
                  type="button"
                  onClick={() => setShowNewAddressForm(true)}
                  className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar nueva dirección</span>
                </button>
              )}
            </div>

            {/* Saved Addresses List */}
            {!showNewAddressForm && currentUser.addresses.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentUser.addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => setSelectedAddressId(addr.id)}
                        className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all relative flex flex-col justify-between space-y-2 ${
                          isSelected 
                            ? 'border-red-600 bg-red-50/40 ring-2 ring-red-100 shadow-2xs' 
                            : 'border-stone-200 hover:border-stone-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between font-bold text-stone-900 mb-1 pb-1 border-b border-stone-100">
                            <span className="flex items-center gap-1.5">
                              <span>📍</span>
                              <span>{addr.label}</span>
                            </span>
                            <div className="flex items-center gap-1">
                              {addr.isDefault && (
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-emerald-600 text-emerald-600" />
                                  <span>Principal</span>
                                </span>
                              )}
                              {isSelected ? (
                                <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  <span>Seleccionada</span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-stone-400 hover:text-stone-700">Seleccionar</span>
                              )}
                            </div>
                          </div>

                          <div className="space-y-0.5 text-stone-700 pt-0.5">
                            <p className="font-semibold text-stone-900">{addr.recipientName}</p>
                            <p className="text-stone-500 font-mono text-[11px] flex items-center gap-1">
                              <Phone className="w-3 h-3 text-stone-400" />
                              <span>{addr.phone}</span>
                            </p>
                            <p className="text-stone-700 leading-snug">
                              {addr.street}
                              {addr.buildingNumber ? ` #${addr.buildingNumber}` : ''}
                            </p>
                            <p className="text-stone-500 text-[11px]">
                              {addr.sector}, {addr.municipality}, {addr.province}
                            </p>

                            {addr.reference && (
                              <p className="text-[11px] text-stone-500 italic pt-1">
                                <strong>Ref:</strong> {addr.reference}
                              </p>
                            )}
                            {addr.deliveryNotes && (
                              <p className="text-[11px] text-blue-900 bg-blue-50/70 p-1.5 rounded border border-blue-100 mt-1">
                                <strong>Indicaciones:</strong> {addr.deliveryNotes}
                              </p>
                            )}
                          </div>
                        </div>

                        {addr.locationUrl && (
                          <div className="pt-1 border-t border-stone-100">
                            <a
                              href={addr.locationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[11px] text-red-600 hover:underline inline-flex items-center gap-1 font-semibold"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Ver ubicación GPS</span>
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setShowNewAddressForm(true)}
                  className="w-full py-2.5 border-2 border-dashed border-stone-300 hover:border-red-500 rounded-xl text-xs font-bold text-stone-600 hover:text-red-600 transition-colors flex items-center justify-center gap-2 bg-stone-50/50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar otra dirección de entrega para este pedido</span>
                </button>
              </div>
            ) : (
              /* New Address Form */
              <div className="p-4 sm:p-5 rounded-2xl border-2 border-red-100 bg-stone-50/90 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <span className="p-1 bg-red-600 text-white rounded-lg">
                      <Plus className="w-3.5 h-3.5" />
                    </span>
                    <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                      Registrar dirección de entrega
                    </h4>
                  </div>
                  {currentUser.addresses && currentUser.addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(false)}
                      className="text-xs font-bold text-stone-500 hover:text-stone-800"
                    >
                      ← Volver a direcciones guardadas
                    </button>
                  )}
                </div>

                {/* Preset aliases */}
                <div>
                  <label className="block font-bold text-stone-800 text-xs mb-1.5">
                    Nombre o alias de la dirección *
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      { label: 'Casa', icon: '🏠' },
                      { label: 'Trabajo / Oficina', icon: '🏢' },
                      { label: 'Apartamento', icon: '🏬' },
                      { label: 'Familiar', icon: '👨‍👩‍👧' },
                      { label: 'Negocio', icon: '🏪' },
                      { label: 'Otro', icon: '📍' }
                    ].map(item => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setNewLabel(item.label)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                          newLabel === item.label
                            ? 'bg-red-600 text-white border-red-600'
                            : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Ej: Casa, Oficina Torre Rey, Casa de Verano..."
                    className="w-full p-2 bg-white border border-stone-300 rounded-lg text-xs outline-none focus:border-red-500 font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-stone-800">Persona que recibe *</label>
                      <button
                        type="button"
                        onClick={() => {
                          if (currentUser?.name) setNewRecipient(currentUser.name);
                          if (currentUser?.phone) setNewPhone(currentUser.phone);
                        }}
                        className="text-[10px] text-red-600 hover:underline font-semibold"
                      >
                        Usar mis datos
                      </button>
                    </div>
                    <input
                      type="text"
                      value={newRecipient}
                      onChange={(e) => setNewRecipient(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-red-500 font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Número de teléfono *</label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                      <input
                        type="tel"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        placeholder="Ej: 809-555-0123"
                        className="w-full pl-8 pr-2 py-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-red-500 font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Provincia *</label>
                    <select
                      value={newProvince}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-red-500 font-medium"
                      required
                    >
                      {DOMINICAN_PROVINCES.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Municipio / Ciudad *</label>
                    <div className="space-y-1">
                      <select
                        value={newMunicipality}
                        onChange={(e) => setNewMunicipality(e.target.value)}
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-red-500 font-medium"
                      >
                        <option value="">-- Seleccionar municipio --</option>
                        {getMunicipalitiesForProvince(newProvince).map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={newMunicipality}
                        onChange={(e) => setNewMunicipality(e.target.value)}
                        placeholder="O escribe otro municipio..."
                        className="w-full p-1.5 bg-white border border-stone-200 rounded-lg text-[11px] outline-none focus:border-red-500 font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Sector o Barrio *</label>
                    <input
                      type="text"
                      value={newSector}
                      onChange={(e) => setNewSector(e.target.value)}
                      placeholder="Ej: Piantini, Bella Vista, Gazcue, Gurabo..."
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-red-500 font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">
                      Número de casa, apto o edificio
                    </label>
                    <input
                      type="text"
                      value={newBuildingNumber}
                      onChange={(e) => setNewBuildingNumber(e.target.value)}
                      placeholder="Ej: #24, Apto 3B, Edificio Torre Real"
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-red-500 font-medium"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-stone-800 mb-1">Calle o Avenida *</label>
                    <input
                      type="text"
                      value={newStreet}
                      onChange={(e) => setNewStreet(e.target.value)}
                      placeholder="Ej: Av. Winston Churchill, Calle El Sol, etc."
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-red-500 font-medium"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Referencia adicional</label>
                    <input
                      type="text"
                      value={newReference}
                      onChange={(e) => setNewReference(e.target.value)}
                      placeholder="Ej: Frente al supermercado, portón blanco"
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-red-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-800 mb-1">Ubicación GPS (Google Maps / Waze)</label>
                    <div className="relative">
                      <Navigation className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                      <input
                        type="url"
                        value={newLocationUrl}
                        onChange={(e) => setNewLocationUrl(e.target.value)}
                        placeholder="https://maps.app.goo.gl/... o enlace"
                        className="w-full pl-8 pr-2 py-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-red-500 font-medium text-[11px]"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-stone-800 mb-1">Indicaciones adicionales de entrega</label>
                    <textarea
                      rows={2}
                      value={newDeliveryNotes}
                      onChange={(e) => setNewDeliveryNotes(e.target.value)}
                      placeholder="Ej: Tocar timbre 2 veces, llamar al llegar, dejar con recepción..."
                      className="w-full p-2 bg-white border border-stone-300 rounded-lg outline-none focus:border-red-500 font-medium resize-none"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-stone-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newIsDefault}
                    onChange={(e) => setNewIsDefault(e.target.checked)}
                    className="w-4 h-4 text-red-600 rounded border-stone-300 focus:ring-red-500"
                  />
                  <span className="text-xs font-semibold text-stone-800">
                    Establecer como mi dirección principal para futuros pedidos
                  </span>
                </label>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                  {currentUser.addresses && currentUser.addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                      disabled={isSavingNewAddress}
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCreateNewAddress}
                    disabled={isSavingNewAddress}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSavingNewAddress ? 'Guardando...' : 'Guardar y usar en este pedido'}</span>
                  </button>
                </div>
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
                        <div key={cartItem.productId} className="flex justify-between items-center text-stone-600 gap-2">
                          <span className="truncate flex-1 min-w-0">
                            {cartItem.quantity}x {product.name}
                          </span>
                          <span className="font-semibold text-stone-900 shrink-0">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tarjetas AZUL */}
              <button
                type="button"
                disabled
                aria-label="Tarjetas próximamente"
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
                  <p className="text-[11px] text-stone-500 mt-0.5">Próximamente: integración bancaria en validación</p>
                </div>
              </button>

              <button type="button" onClick={() => setPaymentMethod('PAYPAL')} className={`p-3.5 rounded-xl border text-left ${paymentMethod === 'PAYPAL' ? 'border-blue-700 bg-blue-50 ring-2 ring-blue-100' : 'border-stone-200 bg-white'}`}>
                <span className="font-black text-lg text-blue-900">Pay<span className="text-blue-500">Pal</span></span>
                <h4 className="font-bold text-xs text-stone-900 mt-2">Pagar con PayPal</h4>
                <p className="text-[11px] text-stone-500 mt-0.5">Cobro seguro en USD. Verás la conversión antes de pagar.</p>
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
                disabled
                aria-label="Transferencias próximamente"
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
                  <p className="text-[11px] text-stone-500 mt-0.5">Próximamente: confirmación bancaria</p>
                </div>
              </button>
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
            <p className="text-[10px] text-stone-500 italic">
              * Los precios de envío pueden variar dependiendo de la distancia.
            </p>
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

          {paymentMethod === 'PAYPAL' ? <PayPalButton totalDop={cartTotal.grandTotal}
            createOrder={async () => { const id = await handleConfirmOrder(); if (!id) throw Error('Valida la dirección y los datos de tu pedido'); return id; }}
            onApprove={async id => { const result = await completePayPalCheckout(id); if (!result.success) throw Error(result.error); onSuccess(result.orderGroupCode,result.orderIds); }}
            onCancel={async id => { if (!id) return; const result = await cancelPayPalCheckout(id); if (!result.success) throw Error(result.message); }}
          /> : <button
            id="checkout-confirm-btn"
            onClick={handleConfirmOrder}
            disabled={isProcessing}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-stone-400 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{chargeProgressMessage || 'Procesando pago seguro...'}</span>
              </span>
            ) : (
              <>
                <span>
                  {paymentMethod === 'CARD_AZUL'
                    ? `Pagar con Tarjeta (Cargo Automático RD$ ${cartTotal.grandTotal.toLocaleString()})`
                    : `Confirmar Pedido (RD$ ${cartTotal.grandTotal.toLocaleString()})`
                  }
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>}
        </div>

      </div>
    </div>
  );
};
