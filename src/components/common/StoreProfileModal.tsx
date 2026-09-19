import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Store } from '../../types';
import { DOMINICAN_PROVINCES } from '../../data/initialData';
import { X, Building2, Phone, Mail, MapPin, Check, Image as ImageIcon } from 'lucide-react';
import { ImageUploadInput } from './ImageUploadInput';

interface StoreProfileModalProps {
  store: Store;
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_STORE_LOGOS = [
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1513094735237-8f2714d57c13?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=200&auto=format&fit=crop&q=80'
];

export const StoreProfileModal: React.FC<StoreProfileModalProps> = ({ store, isOpen, onClose }) => {
  const { updateStoreDetails, categories } = useApp();

  const [name, setName] = useState(store.name);
  const [logo, setLogo] = useState(store.logo);
  const [banner, setBanner] = useState(store.banner);
  const [description, setDescription] = useState(store.description);
  const [whatsapp, setWhatsapp] = useState(store.whatsapp);
  const [phone, setPhone] = useState(store.phone);
  const [ownerName, setOwnerName] = useState(store.ownerName);
  const [province, setProvince] = useState(store.province);
  const [municipality, setMunicipality] = useState(store.municipality);
  const [address, setAddress] = useState(store.address);
  const [categoryId, setCategoryId] = useState(store.categoryId);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateStoreDetails(store.id, {
      name: name.trim(),
      logo: logo.trim() || store.logo,
      banner: banner.trim() || store.banner,
      description: description.trim(),
      whatsapp: whatsapp.trim(),
      phone: phone.trim(),
      ownerName: ownerName.trim(),
      province,
      municipality: municipality.trim(),
      address: address.trim(),
      categoryId
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 space-y-5 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">Editar Perfil & Logo de la Tienda</h2>
              <p className="text-xs text-stone-500">Actualiza la identidad visual y datos públicos de tu comercio</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Logo uploader */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <ImageUploadInput
              label="Logo Oficial de la Tienda"
              value={logo}
              onChange={setLogo}
              presetAvatars={PRESET_STORE_LOGOS}
              shape="rounded"
              aspectRatioLabel="Sube el logo de tu empresa (1:1 o transparente PNG/JPG)"
              placeholder="https://ejemplo.com/logo-tienda.png"
              helpText="Este logo se muestra en tu vitrina pública, encabezado de productos y comprobantes de compra."
            />
          </div>

          {/* Banner uploader */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-stone-800">Banner de Portada</label>
              <span className="text-[11px] text-stone-400">Recomendado: 1200 x 300 px</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={banner}
                onChange={(e) => setBanner(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="flex-1 p-2 bg-white border border-stone-300 rounded-lg text-xs outline-none focus:border-amber-500"
              />
            </div>
            {banner && (
              <div className="w-full h-20 rounded-xl overflow-hidden border border-stone-200">
                <img src={banner} alt="Banner portada" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Store info fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Nombre Comercial de la Tienda</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: TechZone RD"
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs outline-none focus:bg-white focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Categoría Principal</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs outline-none focus:bg-white focus:border-amber-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Representante o Titular</label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Nombre del propietario o gerente"
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs outline-none focus:bg-white focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">WhatsApp de Ventas & Soporte</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="809-555-0101"
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs outline-none focus:bg-white focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Provincia</label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs outline-none focus:bg-white focus:border-amber-500"
              >
                {DOMINICAN_PROVINCES.map((p: string) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Municipio / Sector</label>
              <input
                type="text"
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                placeholder="Ej: Distrito Nacional, Piantini"
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs outline-none focus:bg-white focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Dirección Física del Local / Despacho</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ej: Av. Winston Churchill #109, Santo Domingo"
              className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg text-xs outline-none focus:bg-white focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">Descripción Comercial de la Tienda</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe lo que ofrece tu comercio, tu propuesta de valor y garantía..."
              className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-xs outline-none focus:bg-white focus:border-amber-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-stone-600 hover:text-stone-900 font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Perfil de Tienda</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
