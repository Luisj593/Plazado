import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Check, 
  LogOut, 
  KeyRound, 
  Store, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2,
  MapPin,
  Trash2,
  AlertTriangle 
} from 'lucide-react';
import { ImageUploadInput } from './ImageUploadInput';
import { CustomerAddressesManager } from '../customer/CustomerAddressesManager';

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
  const { currentUser, updateUserProfile, openAuthModal, logout, stores, showNotification, deleteMyAccount } = useApp();

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'security' | 'danger'>('profile');

  // Profile Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);
  const [isSubmittingPass, setIsSubmittingPass] = useState(false);

  // Delete Account States
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleteStoreToo, setDeleteStoreToo] = useState(true);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setAvatar(currentUser.avatar || '');
    }
    // Reset password fields when modal opens
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPassError(null);
    setPassSuccess(null);
    setDeletePassword('');
    setDeleteConfirmationText('');
    setDeleteError(null);
    setIsDeletingAccount(false);
  }, [currentUser, isOpen]);

  if (!isOpen || !currentUser) return null;

  const currentStore = currentUser.role === 'STORE_OWNER' && currentUser.storeId 
    ? stores.find(s => s.id === currentUser.storeId) 
    : null;

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateUserProfile({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      avatar: avatar.trim()
    });

    showNotification('Perfil actualizado correctamente', 'success');
    onClose();
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);
    setPassSuccess(null);

    const targetNew = newPassword.trim();
    if (targetNew.length < 6) {
      setPassError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (targetNew !== confirmPassword.trim()) {
      setPassError('Las contraseñas no coinciden. Verifica e intenta de nuevo.');
      return;
    }

    setIsSubmittingPass(true);
    try {
      const res = await api.updateUserPassword(currentUser.id, targetNew, currentPassword.trim() || undefined);
      if (res.success) {
        setPassSuccess('¡Contraseña actualizada con éxito!');
        showNotification('Contraseña cambiada exitosamente', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setPassError(res.message || 'No se pudo actualizar la contraseña.');
      }
    } catch (err: any) {
      setPassError(err.message || 'Error de conexión al actualizar contraseña.');
    } finally {
      setIsSubmittingPass(false);
    }
  };

  const handleDeleteAccountSubmit = async () => {
    setDeleteError(null);
    if (deleteConfirmationText !== 'ELIMINAR') {
      setDeleteError('Debes escribir la palabra "ELIMINAR" en mayúsculas para confirmar.');
      return;
    }

    if (currentUser.role === 'SUPER_ADMIN') {
      setDeleteError('Las cuentas de Super Administrador están protegidas y no pueden ser eliminadas.');
      return;
    }

    const confirmed = window.confirm(
      '¿Estás completamente seguro de que deseas eliminar tu cuenta permanentemente? Esta acción borrará todos tus datos de Google Cloud y no se puede deshacer.'
    );
    if (!confirmed) return;

    setIsDeletingAccount(true);
    try {
      const res = await deleteMyAccount(deletePassword || undefined, deleteStoreToo);
      if (res.success) {
        onClose();
      } else {
        setDeleteError(res.message || 'No se pudo eliminar la cuenta.');
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Error de conexión al eliminar la cuenta.');
    } finally {
      setIsDeletingAccount(false);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-stone-200 space-y-4 my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              {currentUser.role === 'STORE_OWNER' ? <Store className="w-5 h-5 text-amber-600" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                {currentUser.role === 'STORE_OWNER' ? 'Cuenta del Comercio' : 'Mi Cuenta'}
              </h2>
              <p className="text-xs text-stone-500">Gestión de datos de perfil, direcciones y seguridad</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-4 gap-1 bg-stone-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Datos</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('addresses')}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'addresses'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 shrink-0 text-red-600" />
            <span className="truncate">Direcciones</span>
            {currentUser.addresses && currentUser.addresses.length > 0 && (
              <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                activeTab === 'addresses' ? 'bg-red-100 text-red-700' : 'bg-stone-200 text-stone-700'
              }`}>
                {currentUser.addresses.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'security'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Seguridad</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('danger')}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'danger'
                ? 'bg-rose-50 text-rose-700 shadow-xs border border-rose-200'
                : 'text-stone-600 hover:text-rose-600'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0 text-rose-500" />
            <span className="truncate">Eliminar</span>
          </button>
        </div>

        {/* TAB 1: DATOS PERSONALES */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
            {/* Avatar selector component */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <ImageUploadInput
                label={currentUser.role === 'STORE_OWNER' ? "Logo o Foto del Comercio" : "Foto de Perfil"}
                value={avatar}
                onChange={setAvatar}
                shape="circle"
                aspectRatioLabel="Foto Cuadrada (1:1)"
                placeholder="https://ejemplo.com/avatar.jpg"
                helpText="Sube tu imagen o ingresa una URL válida."
              />

              {/* Preset avatars selection */}
              <div className="mt-3 pt-3 border-t border-stone-200/60">
                <span className="block text-[11px] font-semibold text-stone-500 mb-2">O elige un avatar predeterminado:</span>
                <div className="flex gap-2 items-center flex-wrap">
                  {PRESET_AVATARS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(preset)}
                      className={`relative rounded-full overflow-hidden transition-all duration-150 p-0.5 ${
                        avatar === preset ? 'ring-2 ring-red-600 ring-offset-2 scale-105' : 'hover:opacity-80'
                      }`}
                    >
                      <img src={preset} alt={`Avatar ${idx + 1}`} className="w-9 h-9 rounded-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* User Details */}
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nombre Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-red-500 font-medium"
                    placeholder="Tu nombre completo"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-red-500 font-medium"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              {currentUser.role === 'STORE_OWNER' && currentStore && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="font-semibold text-amber-900 block">Comercio Vinculado:</span>
                  <div className="text-amber-800 text-xs font-bold mt-0.5 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-amber-700" />
                    <span>{currentStore.name} ({currentStore.province})</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Teléfono o WhatsApp (Opcional)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-red-500 font-medium"
                    placeholder="Ej. 809-555-0123"
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
        )}

        {/* TAB 2: DIRECCIONES DE ENTREGA */}
        {activeTab === 'addresses' && (
          <div className="pt-1">
            <CustomerAddressesManager isCompactMode={false} />
          </div>
        )}

        {/* TAB 3: CAMBIAR CONTRASEÑA */}
        {activeTab === 'security' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-1">
              <div className="flex items-center gap-2 text-stone-800 font-bold text-xs">
                <Shield className="w-4 h-4 text-red-600" />
                <span>Seguridad de la Cuenta</span>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Ingresa tu contraseña actual y define una nueva clave segura de al menos 6 caracteres para proteger tu cuenta en Plazado.com.
              </p>
            </div>

            {passError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{passError}</span>
              </div>
            )}

            {passSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{passSuccess}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-red-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <span className="text-[10px] text-stone-400 mt-0.5 block">
                  Si no recuerdas tu contraseña anterior, puedes ingresar la clave de acceso habitual.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Nueva Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-9 pr-10 py-2 bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-red-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Confirmar Nueva Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    className="w-full pl-9 pr-10 py-2 bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-red-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700"
                  >
                    {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Security checklist */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1 text-[11px] text-stone-600">
              <span className="font-bold text-stone-700 block">Requisitos de seguridad:</span>
              <div className="flex items-center gap-1.5">
                <Check className={`w-3.5 h-3.5 ${newPassword.length >= 6 ? 'text-emerald-600' : 'text-stone-300'}`} />
                <span>Mínimo 6 caracteres</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className={`w-3.5 h-3.5 ${newPassword && newPassword === confirmPassword ? 'text-emerald-600' : 'text-stone-300'}`} />
                <span>Las contraseñas coinciden</span>
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
                disabled={isSubmittingPass || newPassword.length < 6 || newPassword !== confirmPassword}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmittingPass ? 'Actualizando...' : 'Actualizar Contraseña'}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 4: ZONA DE PELIGRO - ELIMINAR CUENTA (GOOGLE CLOUD PERSISTENCIA) */}
        {activeTab === 'danger' && (
          <div className="space-y-4 text-xs">
            {currentUser.role === 'SUPER_ADMIN' ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold">
                  <Shield className="w-5 h-5 text-amber-600 shrink-0" />
                  <span className="text-sm">Cuenta de Super Administrador Protegida</span>
                </div>
                <p className="text-amber-700 text-xs leading-relaxed">
                  Esta cuenta posee el rol maestro de <strong>Super Administrador</strong> de Plazado.com.
                  Por directriz de seguridad de producción, las credenciales y el acceso administrativo central están protegidos de manera permanente y no pueden ser eliminados desde esta interfaz.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-rose-900 font-bold">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span className="text-sm">Zona de Peligro: Eliminación Permanente de Cuenta</span>
                  </div>
                  <p className="text-rose-700 text-xs leading-relaxed">
                    Esta acción es <strong>permanente e irreversible</strong>. Se eliminará tu perfil, historial, direcciones y accesos de forma inmediata tanto en el servidor como en las bases de datos de <strong>Google Cloud (Firestore y Cloud SQL)</strong>.
                  </p>
                </div>

                {currentUser.role === 'STORE_OWNER' && currentStore && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                    <span className="font-bold text-amber-900 block text-xs">Comercio Asociado:</span>
                    <p className="text-[11px] text-amber-800">
                      Actualmente eres el propietario de la tienda <strong>"{currentStore.name}"</strong>.
                    </p>
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={deleteStoreToo}
                        onChange={(e) => setDeleteStoreToo(e.target.checked)}
                        className="w-4 h-4 text-rose-600 rounded-sm border-stone-300 focus:ring-rose-500"
                      />
                      <span className="font-semibold text-stone-800 text-xs">
                        Eliminar también la tienda "{currentStore.name}" y todos sus productos de Google Cloud
                      </span>
                    </label>
                  </div>
                )}

                {deleteError && (
                  <div className="p-3 bg-rose-100 border border-rose-300 text-rose-800 rounded-xl flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{deleteError}</span>
                  </div>
                )}

                <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Contraseña de tu Cuenta (para confirmar identidad)
                    </label>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-xl outline-none focus:border-rose-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Escribe la palabra <span className="font-mono text-rose-600 font-bold">ELIMINAR</span> para confirmar:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmationText}
                      onChange={(e) => setDeleteConfirmationText(e.target.value)}
                      placeholder="ELIMINAR"
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-xl outline-none focus:border-rose-500 font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-stone-600 hover:text-stone-900 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isDeletingAccount || deleteConfirmationText !== 'ELIMINAR'}
                    onClick={handleDeleteAccountSubmit}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{isDeletingAccount ? 'Eliminando de Google Cloud...' : 'Eliminar Mi Cuenta Permanentemente'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
