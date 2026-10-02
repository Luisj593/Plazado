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
  AlertTriangle,
  UserPlus,
  Search,
  LogIn,
  ScanFace,
  ChevronRight,
  ExternalLink
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
  const { 
    currentUser, 
    updateUserProfile, 
    openAuthModal, 
    logout, 
    stores, 
    showNotification, 
    deleteMyAccount,
    adminImpersonateStore,
    createSuperAdminUser,
    setAdminActiveTab,
    setCurrentView,
    products,
    storeBalances
  } = useApp();

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'security' | 'stores' | 'superadmin' | 'danger'>('profile');

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

  // Store Management from Admin Profile
  const [storeSearchQuery, setStoreSearchQuery] = useState('');

  // Super Admin Creation States
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminConfirmPassword, setNewAdminConfirmPassword] = useState('');
  const [creatingAdminLoading, setCreatingAdminLoading] = useState(false);
  const [createAdminSuccess, setCreateAdminSuccess] = useState<string | null>(null);
  const [createAdminError, setCreateAdminError] = useState<string | null>(null);

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
    setCreateAdminSuccess(null);
    setCreateAdminError(null);
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
      setPassError('Las contraseñas no coinciden. Verifica e intenta nuevamente.');
      return;
    }

    setIsSubmittingPass(true);
    try {
      const res = await api.changePassword(currentUser.id, {
        currentPassword: currentPassword.trim(),
        newPassword: targetNew
      });

      if (res.success) {
        setPassSuccess('¡Contraseña actualizada exitosamente!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showNotification('Contraseña actualizada con éxito', 'success');
      } else {
        setPassError(res.message || 'Error al actualizar la contraseña');
      }
    } catch (err: any) {
      setPassError(err.message || 'Error de conexión al actualizar la contraseña');
    } finally {
      setIsSubmittingPass(false);
    }
  };

  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateAdminError(null);
    setCreateAdminSuccess(null);

    if (!newAdminName.trim() || !newAdminEmail.trim()) {
      setCreateAdminError('Nombre y correo electrónico son requeridos.');
      return;
    }
    if (!newAdminPassword || newAdminPassword.length < 6) {
      setCreateAdminError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newAdminPassword !== newAdminConfirmPassword) {
      setCreateAdminError('Las contraseñas no coinciden.');
      return;
    }

    setCreatingAdminLoading(true);
    try {
      const res = await createSuperAdminUser({
        name: newAdminName.trim(),
        email: newAdminEmail.trim(),
        phone: newAdminPhone.trim(),
        password: newAdminPassword
      });
      if (res.success) {
        setCreateAdminSuccess(res.message);
        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminPhone('');
        setNewAdminPassword('');
        setNewAdminConfirmPassword('');
      } else {
        setCreateAdminError(res.message);
      }
    } finally {
      setCreatingAdminLoading(false);
    }
  };

  const handleEnterStore = (storeId: string) => {
    adminImpersonateStore(storeId);
    onClose();
  };

  const handleNavigateToVerifications = () => {
    setAdminActiveTab('verifications');
    setCurrentView('admin_dashboard');
    onClose();
  };

  const handleNavigateToAdminStores = () => {
    setAdminActiveTab('stores');
    setCurrentView('admin_dashboard');
    onClose();
  };

  const handleDeleteAccountSubmit = async () => {
    setDeleteError(null);

    if (currentUser.role === 'SUPER_ADMIN') {
      setDeleteError('Por políticas de seguridad, las cuentas Super Admin no pueden ser auto-eliminadas.');
      return;
    }

    if (deleteConfirmationText !== 'ELIMINAR') {
      setDeleteError('Debes escribir la palabra "ELIMINAR" en mayúsculas para confirmar.');
      return;
    }

    if (!deletePassword) {
      setDeleteError('Ingresa tu contraseña para autorizar la eliminación.');
      return;
    }

    const confirmed = window.confirm(
      '¿Estás completamente seguro de que deseas eliminar permanentemente tu cuenta? Esta acción borrará tus datos y no se puede deshacer.'
    );
    if (!confirmed) return;

    setIsDeletingAccount(true);
    try {
      const res = await deleteMyAccount(deletePassword, deleteStoreToo);
      if (res.success) {
        onClose();
      } else {
        setDeleteError(res.message || 'Error al eliminar cuenta');
      }
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const filteredStores = stores.filter(s => {
    const q = storeSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return s.name.toLowerCase().includes(q) ||
      s.ownerName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.province?.toLowerCase().includes(q);
  });

  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'SUPER_ADMIN':
        return (
          <span className="bg-red-100 text-red-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-red-200">
            <Shield className="w-3 h-3 text-red-600" />
            Super Administrador
          </span>
        );
      case 'STORE_OWNER':
        return (
          <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
            <Store className="w-3 h-3 text-amber-600" />
            Propietario de Tienda
          </span>
        );
      default:
        return (
          <span className="bg-blue-100 text-blue-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-blue-200">
            <User className="w-3 h-3 text-blue-600" />
            Cliente Comprador
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-stone-200 animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-xs ${
              isSuperAdmin ? 'bg-red-600 text-white' : 'bg-stone-900 text-white'
            }`}>
              {isSuperAdmin ? <Shield className="w-5 h-5" /> : (currentUser.role === 'STORE_OWNER' ? <Store className="w-5 h-5" /> : <User className="w-5 h-5" />)}
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                {currentUser.role === 'STORE_OWNER' ? 'Cuenta del Comercio' : isSuperAdmin ? 'Perfil Super Administrador' : 'Mi Cuenta'}
                {getRoleBadge()}
              </h2>
              <p className="text-xs text-stone-500">
                {isSuperAdmin 
                  ? 'Gestión de perfil, acceso directo a tiendas, creación de Super Admin y seguridad'
                  : 'Gestión de datos de perfil, direcciones y seguridad'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className={`grid gap-1 bg-stone-100 p-1.5 rounded-2xl mx-6 mt-4 ${
          isSuperAdmin ? 'grid-cols-5 text-[11px]' : 'grid-cols-4 text-xs'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Datos</span>
          </button>

          {isSuperAdmin ? (
            <>
              {/* Tab: Administrar Tiendas (Super Admin) */}
              <button
                type="button"
                onClick={() => setActiveTab('stores')}
                className={`py-2 px-1 font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'stores'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-stone-600 hover:text-amber-800'
                }`}
                title="Ingresar a configurar cualquier tienda"
              >
                <Store className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Tiendas ({stores.length})</span>
              </button>

              {/* Tab: Crear Super Admin */}
              <button
                type="button"
                onClick={() => setActiveTab('superadmin')}
                className={`py-2 px-1 font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  activeTab === 'superadmin'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Crear un nuevo usuario Super Administrador"
              >
                <UserPlus className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span className="truncate">+ Super Admin</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setActiveTab('addresses')}
              className={`py-2 px-1 font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeTab === 'addresses'
                  ? 'bg-white text-red-600 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0 text-red-600" />
              <span className="truncate">Direcciones</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`py-2 px-1 font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
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
            className={`py-2 px-1 font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'danger'
                ? 'bg-rose-50 text-rose-700 shadow-xs border border-rose-200'
                : 'text-stone-600 hover:text-rose-600'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0 text-rose-500" />
            <span className="truncate">Eliminar</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: DATOS PERSONALES */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              {/* Super Admin Quick Shortcuts Banner */}
              {isSuperAdmin && (
                <div className="p-4 bg-gradient-to-r from-stone-900 to-stone-850 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 block">
                      Acceso Rápido Super Administrador
                    </span>
                    <h4 className="font-bold text-sm text-white mt-0.5">Centro de Control & Verificaciones</h4>
                    <p className="text-[11px] text-stone-400">
                      Gestiona tiendas, expedientes de identidad con fotos de cédula y crea nuevos administradores.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleNavigateToVerifications}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Ver expedientes de cédulas y fotografías de clientes"
                    >
                      <ScanFace className="w-3.5 h-3.5" />
                      <span>Validación Cédulas</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNavigateToAdminStores}
                      className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Store className="w-3.5 h-3.5 text-amber-400" />
                      <span>Panel Tiendas</span>
                    </button>
                  </div>
                </div>
              )}

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
                        className={`relative rounded-full overflow-hidden transition-all duration-150 p-0.5 cursor-pointer ${
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
                  className="text-xs text-stone-700 hover:text-red-600 font-semibold flex items-center gap-1 cursor-pointer"
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
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
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
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: TIENDAS REGISTRADAS & INGRESO COMO ADMIN (SUPER ADMIN) */}
          {activeTab === 'stores' && isSuperAdmin && (
            <div className="space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-xl shadow-2xs shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-amber-950 text-sm">
                    Ingreso a Tiendas desde el Perfil Super Admin
                  </h3>
                  <p className="text-amber-800 text-xs mt-0.5 leading-relaxed">
                    Selecciona cualquier comercio registrado para ingresar a su panel con permisos de administrador. Podrás auditar o configurar sus productos, precios, envíos, métodos de pago, horarios y perfil de la tienda.
                  </p>
                </div>
              </div>

              {/* Search Stores Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={storeSearchQuery}
                  onChange={(e) => setStoreSearchQuery(e.target.value)}
                  placeholder="Buscar tienda por nombre, propietario, provincia o correo..."
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              {/* Stores Directory List */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredStores.length === 0 ? (
                  <div className="p-8 text-center text-stone-400 bg-stone-50 rounded-2xl border border-stone-200">
                    <Store className="w-8 h-8 mx-auto text-stone-300 mb-1" />
                    <p className="font-semibold">No se encontraron tiendas que coincidan con la búsqueda.</p>
                  </div>
                ) : (
                  filteredStores.map(st => {
                    const storeProductsCount = products.filter(p => p.storeId === st.id).length;
                    const bal = storeBalances[st.id] || { availableBalance: 0 };
                    return (
                      <div 
                        key={st.id}
                        className="p-3.5 bg-white border border-stone-200 hover:border-amber-400 rounded-2xl transition-all shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-3">
                          {st.logo ? (
                            <img src={st.logo} alt="" className="w-11 h-11 rounded-xl object-cover border border-stone-200 shrink-0" />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 border border-amber-200 text-sm">
                              {st.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-stone-900 text-xs">{st.name}</h4>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                st.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                                st.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-600'
                              }`}>
                                {st.status}
                              </span>
                              <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded font-medium">
                                {storeProductsCount} productos
                              </span>
                            </div>
                            <p className="text-[11px] text-stone-500 mt-0.5">
                              Propietario: {st.ownerName} • {st.province || 'RD'} • {st.email}
                            </p>
                            <p className="text-[10px] text-stone-400">
                              Balance disponible: RD$ {bal.availableBalance?.toLocaleString() || '0'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleEnterStore(st.id)}
                          className="w-full sm:w-auto px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer group-hover:scale-102"
                          title={`Ingresar a configurar ${st.name}`}
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Administrar Tienda</span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CREAR USUARIO SUPER ADMIN (SUPER ADMIN) */}
          {activeTab === 'superadmin' && isSuperAdmin && (
            <form onSubmit={handleCreateAdminSubmit} className="space-y-4 text-xs">
              <div className="bg-stone-900 text-white rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <div className="p-2 bg-red-600 text-white rounded-xl shadow-2xs shrink-0">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Creación de Usuario Super Administrador
                  </h3>
                  <p className="text-stone-300 text-xs mt-0.5 leading-relaxed">
                    Crea cuentas con acceso total para la moderación de tiendas, autorización de cédulas, configuración SMTP y control fiduciario de PlazaDO.com.
                  </p>
                </div>
              </div>

              {createAdminSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{createAdminSuccess}</span>
                </div>
              )}

              {createAdminError && (
                <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{createAdminError}</span>
                </div>
              )}

              <div className="space-y-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Nombre Completo del Administrador *</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      placeholder="Ej. Carlos Martínez"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-xl outline-none focus:border-red-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Correo Electrónico Oficial *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="admin2@plazado.com"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-xl outline-none focus:border-red-500 font-medium font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Teléfono o WhatsApp (Opcional)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={newAdminPhone}
                      onChange={(e) => setNewAdminPhone(e.target.value)}
                      placeholder="809-555-0199"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-xl outline-none focus:border-red-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Contraseña de Acceso *</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-xl outline-none focus:border-red-500 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Confirmar Contraseña *</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        value={newAdminConfirmPassword}
                        onChange={(e) => setNewAdminConfirmPassword(e.target.value)}
                        placeholder="Repite la contraseña"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-stone-300 rounded-xl outline-none focus:border-red-500 font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={handleNavigateToVerifications}
                  className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ScanFace className="w-3.5 h-3.5" />
                  <span>Ir a Validación de Cédulas</span>
                </button>

                <button
                  type="submit"
                  disabled={creatingAdminLoading}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-850 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>{creatingAdminLoading ? 'Creando Super Admin...' : 'Crear Super Administrador'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB: DIRECCIONES DE ENTREGA (CLIENTES) */}
          {activeTab === 'addresses' && !isSuperAdmin && (
            <div className="pt-1">
              <CustomerAddressesManager isCompactMode={false} />
            </div>
          )}

          {/* TAB: CAMBIAR CONTRASEÑA */}
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
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-medium flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{passSuccess}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Contraseña Actual *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-red-500 font-medium"
                      placeholder="Tu contraseña actual"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Nueva Contraseña Segura *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-red-500 font-medium"
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Confirmar Nueva Contraseña *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-red-500 font-medium"
                      placeholder="Repite la nueva contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPass}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-850 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmittingPass ? 'Actualizando...' : 'Cambiar Contraseña'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB: ELIMINAR CUENTA */}
          {activeTab === 'danger' && (
            <div className="space-y-4 text-xs">
              {currentUser.role === 'SUPER_ADMIN' ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
                    <Shield className="w-5 h-5 text-amber-600" />
                    <span>Cuenta de Super Administrador Protegida</span>
                  </div>
                  <p className="text-xs leading-relaxed text-amber-800">
                    Las cuentas de Super Administrador no pueden auto-eliminarse directamente por seguridad operativa y continuidad del marketplace PlazaDO. Si requieres reasignar o modificar credenciales, utiliza las pestañas de Datos o Seguridad.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-rose-950">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>Zona de Peligro: Eliminación de Cuenta</span>
                    </div>
                    <p className="text-xs leading-relaxed text-rose-800">
                      Esta acción eliminará de forma permanente tu perfil de usuario, historial y direcciones guardadas de los servidores de Google Cloud.
                    </p>
                  </div>

                  {currentUser.role === 'STORE_OWNER' && currentStore && (
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-1">
                      <p className="font-bold text-stone-900 text-xs">
                        Tienda vinculada: <span className="text-amber-800">{currentStore.name}</span>
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
                      className="px-4 py-2 text-stone-600 hover:text-stone-900 font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={isDeletingAccount || deleteConfirmationText !== 'ELIMINAR'}
                      onClick={handleDeleteAccountSubmit}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
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
    </div>
  );
};
