import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CustomerAddress } from '../../types';
import { DOMINICAN_PROVINCES } from '../../data/initialData';
import { getMunicipalitiesForProvince } from '../../data/dominicanLocations';
import { 
  MapPin, 
  Plus, 
  Home, 
  Briefcase, 
  Building, 
  Users, 
  Check, 
  Edit3, 
  Trash2, 
  Star, 
  Phone, 
  ExternalLink, 
  AlertCircle, 
  Info, 
  X,
  FileText,
  Navigation
} from 'lucide-react';

interface CustomerAddressesManagerProps {
  onSelectAddressForCheckout?: (address: CustomerAddress) => void;
  selectedAddressId?: string;
  isCompactMode?: boolean;
}

const PRESET_ALIASES = [
  { label: 'Casa', icon: '🏠' },
  { label: 'Trabajo / Oficina', icon: '🏢' },
  { label: 'Apartamento', icon: '🏬' },
  { label: 'Familiar', icon: '👨‍👩‍👧' },
  { label: 'Negocio', icon: '🏪' },
  { label: 'Otro', icon: '📍' }
];

export const CustomerAddressesManager: React.FC<CustomerAddressesManagerProps> = ({
  onSelectAddressForCheckout,
  selectedAddressId,
  isCompactMode = false
}) => {
  const { 
    currentUser, 
    addCustomerAddress, 
    updateCustomerAddress, 
    deleteCustomerAddress, 
    setDefaultAddress,
    showNotification 
  } = useApp();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<CustomerAddress | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form states
  const [label, setLabel] = useState('Casa');
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState(DOMINICAN_PROVINCES[0]);
  const [municipality, setMunicipality] = useState('');
  const [sector, setSector] = useState('');
  const [street, setStreet] = useState('');
  const [buildingNumber, setBuildingNumber] = useState('');
  const [reference, setReference] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const addresses = currentUser?.addresses || [];

  const openNewForm = () => {
    setEditingAddressId(null);
    setLabel('Casa');
    setRecipientName(currentUser?.name || '');
    setPhone(currentUser?.phone || '');
    setProvince(DOMINICAN_PROVINCES[0]);
    const defaultMuni = getMunicipalitiesForProvince(DOMINICAN_PROVINCES[0])[0] || '';
    setMunicipality(defaultMuni);
    setSector('');
    setStreet('');
    setBuildingNumber('');
    setReference('');
    setLocationUrl('');
    setDeliveryNotes('');
    setIsDefault(addresses.length === 0);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (addr: CustomerAddress) => {
    setEditingAddressId(addr.id);
    setLabel(addr.label || 'Casa');
    setRecipientName(addr.recipientName || '');
    setPhone(addr.phone || '');
    setProvince(addr.province || DOMINICAN_PROVINCES[0]);
    setMunicipality(addr.municipality || '');
    setSector(addr.sector || '');
    setStreet(addr.street || '');
    setBuildingNumber(addr.buildingNumber || '');
    setReference(addr.reference || '');
    setLocationUrl(addr.locationUrl || '');
    setDeliveryNotes(addr.deliveryNotes || '');
    setIsDefault(!!addr.isDefault);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleProvinceChange = (newProv: string) => {
    setProvince(newProv);
    const munis = getMunicipalitiesForProvince(newProv);
    if (munis && munis.length > 0) {
      setMunicipality(munis[0]);
    } else {
      setMunicipality('');
    }
  };

  const handleUseUserData = () => {
    if (currentUser) {
      if (currentUser.name) setRecipientName(currentUser.name);
      if (currentUser.phone) setPhone(currentUser.phone);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validaciones
    if (!recipientName.trim()) {
      setFormError('Por favor indica el nombre de la persona que recibirá el pedido.');
      return;
    }
    if (!phone.trim()) {
      setFormError('Por favor ingresa un número de teléfono de contacto para la entrega.');
      return;
    }
    if (!province.trim()) {
      setFormError('Por favor selecciona la provincia.');
      return;
    }
    if (!municipality.trim()) {
      setFormError('Por favor especifica el municipio o ciudad.');
      return;
    }
    if (!sector.trim()) {
      setFormError('Por favor indica el sector o barrio.');
      return;
    }
    if (!street.trim()) {
      setFormError('Por favor ingresa el nombre de la calle o avenida.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Omit<CustomerAddress, 'id'> = {
        label: label.trim() || 'Dirección',
        recipientName: recipientName.trim(),
        phone: phone.trim(),
        province: province.trim(),
        municipality: municipality.trim(),
        sector: sector.trim(),
        street: street.trim(),
        buildingNumber: buildingNumber.trim() || undefined,
        reference: reference.trim() || undefined,
        locationUrl: locationUrl.trim() || undefined,
        deliveryNotes: deliveryNotes.trim() || undefined,
        isDefault
      };

      if (editingAddressId) {
        await updateCustomerAddress(editingAddressId, payload);
      } else {
        const created = await addCustomerAddress(payload);
        if (created && onSelectAddressForCheckout) {
          onSelectAddressForCheckout(created);
        }
      }

      setIsFormOpen(false);
      setEditingAddressId(null);
    } catch (err: any) {
      setFormError(err.message || 'No se pudo guardar la dirección. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!addressToDelete) return;
    try {
      await deleteCustomerAddress(addressToDelete.id);
      setAddressToDelete(null);
    } catch (err) {
      showNotification('Error al eliminar la dirección', 'error');
    }
  };

  const getAliasIcon = (lbl: string) => {
    const lower = (lbl || '').toLowerCase();
    if (lower.includes('casa') || lower.includes('hogar')) return <Home className="w-3.5 h-3.5" />;
    if (lower.includes('trabajo') || lower.includes('oficina')) return <Briefcase className="w-3.5 h-3.5" />;
    if (lower.includes('apto') || lower.includes('apartamento') || lower.includes('edificio')) return <Building className="w-3.5 h-3.5" />;
    if (lower.includes('familiar') || lower.includes('mama') || lower.includes('papa')) return <Users className="w-3.5 h-3.5" />;
    return <MapPin className="w-3.5 h-3.5" />;
  };

  if (!currentUser) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center space-y-3">
        <MapPin className="w-10 h-10 text-stone-300 mx-auto" />
        <h3 className="font-bold text-stone-900 text-sm">Inicia sesión para gestionar tus direcciones</h3>
        <p className="text-xs text-stone-500 max-w-sm mx-auto">
          Podrás guardar tus lugares de entrega favoritos y utilizarlos rápidamente en tus compras.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Mis direcciones de entrega</h3>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Administra tus lugares de entrega para recibir pedidos de comercios en toda República Dominicana.
          </p>
        </div>

        {!isFormOpen && (
          <button
            type="button"
            onClick={openNewForm}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar nueva dirección</span>
          </button>
        )}
      </div>

      {/* Formulario Modal / En línea */}
      {isFormOpen && (
        <div className="bg-stone-50/90 rounded-2xl border-2 border-red-100 p-4 sm:p-5 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-stone-200">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-red-600 text-white rounded-lg">
                {editingAddressId ? <Edit3 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </span>
              <h4 className="text-sm font-bold text-stone-900">
                {editingAddressId ? 'Editar dirección de entrega' : 'Registrar nueva dirección de entrega'}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                setEditingAddressId(null);
              }}
              className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Alias selector */}
            <div>
              <label className="block font-bold text-stone-800 mb-1.5">
                Nombre o alias de la dirección *
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {PRESET_ALIASES.map(item => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setLabel(item.label)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                      label === item.label
                        ? 'bg-red-600 text-white border-red-600 shadow-2xs'
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
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ej: Casa, Oficina Torre Rey, Casa de Verano..."
                className="w-full p-2.5 bg-white border border-stone-300 rounded-xl outline-none focus:border-red-600 font-medium"
                required
              />
            </div>

            {/* Recipient info */}
            <div className="bg-white p-3.5 rounded-xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-800 text-xs uppercase tracking-wide">
                  Persona que recibe el pedido
                </span>
                <button
                  type="button"
                  onClick={handleUseUserData}
                  className="text-[11px] font-bold text-red-600 hover:underline"
                >
                  Usar mis datos ({currentUser.name})
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Nombre completo *</label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg outline-none focus:border-red-600 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Número de teléfono *</label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej: 809-555-0123"
                      className="w-full pl-8 pr-2 py-2 bg-stone-50 border border-stone-300 rounded-lg outline-none focus:border-red-600 font-medium"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Geographic Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-800 mb-1">Provincia *</label>
                <select
                  value={province}
                  onChange={(e) => handleProvinceChange(e.target.value)}
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl outline-none focus:border-red-600 font-medium"
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
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-xl outline-none focus:border-red-600 font-medium"
                  >
                    <option value="">-- Seleccionar o escribir municipio --</option>
                    {getMunicipalitiesForProvince(province).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={municipality}
                    onChange={(e) => setMunicipality(e.target.value)}
                    placeholder="O escribe otro municipio..."
                    className="w-full p-2 bg-white border border-stone-200 rounded-lg text-[11px] outline-none focus:border-red-500 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Sector o Barrio *</label>
                <input
                  type="text"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  placeholder="Ej: Piantini, Bella Vista, Gazcue, Gurabo..."
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl outline-none focus:border-red-600 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Número de casa, apto o edificio
                </label>
                <input
                  type="text"
                  value={buildingNumber}
                  onChange={(e) => setBuildingNumber(e.target.value)}
                  placeholder="Ej: #24, Edificio Torre Real, Apto 3B"
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl outline-none focus:border-red-600 font-medium"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-stone-800 mb-1">Calle o Avenida *</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Ej: Av. Winston Churchill, Calle El Sol, etc."
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl outline-none focus:border-red-600 font-medium"
                  required
                />
              </div>
            </div>

            {/* Reference & Delivery Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Referencia adicional
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ej: Frente al supermercado, portón blanco con reja negra"
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl outline-none focus:border-red-600 font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Ubicación o enlace GPS (Google Maps / Waze)
                </label>
                <div className="relative">
                  <Navigation className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-3" />
                  <input
                    type="url"
                    value={locationUrl}
                    onChange={(e) => setLocationUrl(e.target.value)}
                    placeholder="https://maps.app.goo.gl/... o coordenadas"
                    className="w-full pl-8 pr-2 py-2.5 bg-white border border-stone-300 rounded-xl outline-none focus:border-red-600 font-medium text-[11px]"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-stone-800 mb-1">
                  Indicaciones adicionales para realizar la entrega
                </label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Ej: Tocar timbre 2 veces, llamar al llegar, dejar con el conserje en recepción..."
                  className="w-full p-2.5 bg-white border border-stone-300 rounded-xl outline-none focus:border-red-600 font-medium text-xs resize-none"
                />
              </div>
            </div>

            {/* Default address toggle */}
            <label className="flex items-center gap-2 p-3 bg-white rounded-xl border border-stone-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 text-red-600 rounded border-stone-300 focus:ring-red-500"
              />
              <span className="text-xs font-semibold text-stone-800">
                Seleccionar como dirección principal de entrega
              </span>
            </label>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingAddressId(null);
                }}
                className="px-4 py-2 border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 rounded-xl font-bold transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <span>Guardando...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{editingAddressId ? 'Actualizar Dirección' : 'Guardar Dirección'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List of Saved Addresses */}
      {addresses.length === 0 && !isFormOpen ? (
        <div className="bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 bg-white rounded-2xl border border-stone-200 flex items-center justify-center mx-auto text-stone-400 shadow-2xs">
            <MapPin className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h4 className="font-bold text-stone-800 text-sm">Aún no has registrado direcciones de entrega</h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              Guarda tu casa, oficina o dirección preferida para que tus compras en PlazaDO se envíen directamente con total precisión.
            </p>
          </div>
          <button
            type="button"
            onClick={openNewForm}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar mi primera dirección</span>
          </button>
        </div>
      ) : (
        <div className={`grid ${isCompactMode ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
          {addresses.map((addr) => {
            const isSelected = selectedAddressId === addr.id;

            return (
              <div
                key={addr.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-2xs transition-all relative flex flex-col justify-between space-y-3 ${
                  isSelected 
                    ? 'border-red-600 ring-2 ring-red-100 bg-red-50/20' 
                    : addr.isDefault 
                    ? 'border-emerald-200 shadow-xs' 
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div>
                  {/* Top: Alias & Principal badge */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-100">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 rounded-md bg-stone-100 text-stone-700">
                        {getAliasIcon(addr.label)}
                      </span>
                      <span className="font-bold text-sm text-stone-900">{addr.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {addr.isDefault && (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                          <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                          <span>Principal</span>
                        </span>
                      )}
                      {isSelected && (
                        <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Seleccionada
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Recipient Details */}
                  <div className="pt-2.5 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-stone-800 font-semibold">
                      <span>{addr.recipientName}</span>
                      <span className="text-stone-300">•</span>
                      <span className="text-stone-600 font-mono flex items-center gap-1">
                        <Phone className="w-3 h-3 text-stone-400" />
                        {addr.phone}
                      </span>
                    </div>

                    {/* Street & Number */}
                    <p className="text-stone-700 font-medium leading-relaxed">
                      {addr.street}
                      {addr.buildingNumber ? ` #${addr.buildingNumber}` : ''}
                    </p>

                    {/* Sector, Municipality, Province */}
                    <p className="text-stone-600">
                      {addr.sector}, {addr.municipality}
                    </p>
                    <p className="text-stone-500 font-medium">
                      {addr.province}, República Dominicana
                    </p>

                    {/* Reference */}
                    {addr.reference && (
                      <div className="mt-2 p-2 bg-stone-50 rounded-lg border border-stone-100 text-[11px] text-stone-600 flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-stone-700">Referencia: </span>
                          <span>{addr.reference}</span>
                        </div>
                      </div>
                    )}

                    {/* Delivery Notes */}
                    {addr.deliveryNotes && (
                      <div className="mt-1.5 p-2 bg-blue-50/70 rounded-lg border border-blue-100 text-[11px] text-blue-900 flex items-start gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Indicaciones de entrega: </span>
                          <span>{addr.deliveryNotes}</span>
                        </div>
                      </div>
                    )}

                    {/* Location Link */}
                    {addr.locationUrl && (
                      <div className="pt-1">
                        <a
                          href={addr.locationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Ver ubicación GPS / Mapa</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
                  <div>
                    {!addr.isDefault && (
                      <button
                        type="button"
                        onClick={() => setDefaultAddress(addr.id)}
                        className="text-[11px] font-bold text-stone-600 hover:text-stone-900 hover:underline"
                      >
                        Hacer principal
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {onSelectAddressForCheckout && (
                      <button
                        type="button"
                        onClick={() => onSelectAddressForCheckout(addr)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                          isSelected
                            ? 'bg-red-600 text-white'
                            : 'bg-stone-100 text-stone-800 hover:bg-red-600 hover:text-white'
                        }`}
                      >
                        {isSelected ? 'Usar esta' : 'Seleccionar'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openEditForm(addr)}
                      className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors"
                      title="Editar dirección"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setAddressToDelete(addr)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Eliminar dirección"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de confirmación para eliminar dirección */}
      {addressToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-rose-600">
              <div className="p-2 bg-rose-50 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-stone-900 text-sm">¿Eliminar esta dirección?</h4>
            </div>

            <p className="text-xs text-stone-600">
              Estás a punto de eliminar la dirección <strong>"{addressToDelete.label}"</strong> ({addressToDelete.street}, {addressToDelete.sector}).
              Esta acción no afectará los pedidos históricos que ya realizaste con esta dirección.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setAddressToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-2xs"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
