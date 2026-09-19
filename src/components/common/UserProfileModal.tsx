import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { X, User, Mail, Phone, Shield, Check, LogOut, KeyRound, Store } from 'lucide-react';
import { ImageUploadInput } from './ImageUploadInput';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80'
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUserProfile, openAuthModal, logout, stores } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setAvatar(currentUser.avatar || '');
    }
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const currentStore = currentUser.role === 'STORE_OWNER' && currentUser.storeId 
    ? stores.find(s => s.id === currentUser.storeId) 
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateUserProfile({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      avatar: avatar.trim()
    });

    onClose();
  };

  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'SUPER_ADMIN':
        return <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-200">🛡️ Super Administrador</span>;
      case 'STORE_OWNER':
        return <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200">🏪 Tienda / Comercio</span>;
      default:
        return <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200">👤 Cliente Comprador</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-5 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              {currentUser.role === 'STORE_OWNER' ? <Store className="w-5 h-5 text-amber-600" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                {currentUser.role === 'STORE_OWNER' ? 'Perfil del Comercio' : 'Perfil de Usuario'}
              </h2>
              <p className="text-xs text-stone-500">Información registrada de la cuenta</p>
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
          
          {/* Avatar selector component */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
            <ImageUploadInput
              label={currentUser.role === 'STORE_OWNER' ? "Logo o Foto del Comercio" : "Foto de Perfil"}
              value={avatar}
              onChange={setAvatar}
              presetAvatars={[]}
              shape="circle"
              aspectRatioLabel="Sube tu foto, JPG o PNG recomendados"
              placeholder="https://ejemplo.com/foto.jpg"
              helpText="Por defecto los usuarios se registran con foto vacía. Puedes subir una o dejarla en blanco."
            />
            {avatar ? (
              <div className="mt-2.5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setAvatar('')}
                  className="text-[11px] text-stone-500 hover:text-red-600 font-semibold underline flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Quitar foto (dejar perfil vacío)
                </button>
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-stone-500 italic flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-stone-400" />
                Perfil sin foto establecida (vacío)
              </p>
            )}
          </div>

          {/* User Fields */}
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                {currentUser.role === 'STORE_OWNER' ? 'Nombre del Responsable / Tienda' : 'Nombre Completo'}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre y apellido"
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs outline-none focus:bg-white focus:border-red-500"
                />
              </div>
            </div>

            {currentStore && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-amber-900 block">🏪 Comercio Vinculado:</span>
                <p className="text-xs font-bold text-stone-900">{currentStore.name}</p>
                <p className="text-[11px] text-stone-600">{currentStore.municipality || currentStore.province} • {currentStore.phone}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@dominio.com"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs outline-none focus:bg-white focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Teléfono Móvil (WhatsApp)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="809-555-0123"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs outline-none focus:bg-white focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-stone-100/70 rounded-xl">
              <div>
                <span className="font-semibold text-stone-700 block">Tipo de Cuenta:</span>
                <span className="text-[11px] text-stone-500">ID: <code className="font-mono">{currentUser.id}</code></span>
              </div>
              <div>
                {getRoleBadge()}
              </div>
            </div>

            {/* Quick Session Management */}
            <div className="pt-2 flex items-center justify-between border-t border-stone-200/60">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  openAuthModal('login');
                }}
                className="text-xs text-stone-700 hover:text-red-600 font-semibold flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Cambiar de cuenta</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  logout();
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>

          {/* Footer Buttons */}
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
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
