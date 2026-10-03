import React, { useState, useEffect } from 'react';
import { 
  X, 
  KeyRound, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Check, 
  AlertTriangle, 
  ShieldCheck,
  Store as StoreIcon,
  Mail,
  User as UserIcon,
  Phone,
  Copy,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Store as StoreType, User as UserType } from '../../types';
import { useApp } from '../../context/AppContext';

interface AssignStoreAdminModalProps {
  store: StoreType | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: UserType, store: StoreType) => void;
}

export const AssignStoreAdminModal: React.FC<AssignStoreAdminModalProps> = ({ 
  store, 
  isOpen, 
  onClose,
  onSuccess 
}) => {
  const { allUsers, assignStoreAdmin, showNotification } = useApp();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedNotice, setCopiedNotice] = useState(false);

  // Success view state once credentials are saved
  const [savedCredentials, setSavedCredentials] = useState<{
    email: string;
    password: string;
    name: string;
    storeName: string;
  } | null>(null);

  // Find currently linked admin user for this store if exists
  const existingAdminUser = store ? allUsers.find(u => 
    (u.storeId === store.id && u.role === 'STORE_OWNER') ||
    (store.ownerId && u.id === store.ownerId) ||
    (u.storeId === store.id) ||
    (store.email && u.email.toLowerCase() === store.email.toLowerCase())
  ) : null;

  useEffect(() => {
    if (isOpen && store) {
      const defaultEmail = existingAdminUser?.email || store.email || '';
      const defaultName = existingAdminUser?.name || store.ownerName || `Admin ${store.name}`;
      const defaultPhone = existingAdminUser?.phone || store.phone || '';

      setEmail(defaultEmail);
      setName(defaultName);
      setPhone(defaultPhone);
      setPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setErrorMessage('');
      setIsSubmitting(false);
      setCopiedNotice(false);
      setSavedCredentials(null);
    }
  }, [isOpen, store, existingAdminUser]);

  if (!isOpen || !store) return null;

  // Generator for secure password
  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let result = 'Tienda';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    result += `${new Date().getFullYear()}!`;
    setPassword(result);
    setConfirmPassword(result);
    setShowPassword(true);
    setErrorMessage('');
  };

  const copyCredentialsText = () => {
    if (!savedCredentials) return;
    const text = `🏪 CREDENCIALES DE ACCESO - PLAZADO.COM\n---------------------------------------\nTienda: ${savedCredentials.storeName}\nAdministrador: ${savedCredentials.name}\nCorreo de acceso: ${savedCredentials.email}\nContraseña: ${savedCredentials.password}\nPlataforma: https://plazado.com\nRol: Dueño de Tienda (STORE_OWNER)\n---------------------------------------\nGuarda estos datos en un lugar seguro. Puedes iniciar sesión directamente en PlazaDO.`;
    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMessage('Por favor introduce un correo electrónico válido.');
      return;
    }

    const pass = password.trim();
    if (!pass || pass.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (pass !== confirmPassword.trim()) {
      setErrorMessage('Las contraseñas no coinciden. Por favor verifica.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await assignStoreAdmin(store.id, {
        email: cleanEmail,
        password: pass,
        name: name.trim(),
        phone: phone.trim()
      });

      if (res.success && res.user) {
        setSavedCredentials({
          email: cleanEmail,
          password: pass,
          name: name.trim(),
          storeName: store.name
        });
        if (onSuccess) {
          onSuccess(res.user, store);
        }
      } else {
        setErrorMessage(res.message || 'Error al asignar las credenciales a la tienda.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inesperado al asignar credenciales.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMinLength = password.length >= 6;
  const isMatch = password.length > 0 && password === confirmPassword;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-5 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-stone-900 text-base leading-tight">
                Asignar Administrador de Tienda
              </h3>
              <p className="text-xs text-stone-500">
                Configurar correo y contraseña de acceso comercial para la tienda
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Store Summary Card */}
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {store.logo ? (
              <img src={store.logo} alt="" className="w-12 h-12 rounded-xl object-cover border border-stone-200 shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-stone-200 text-stone-700 font-bold flex items-center justify-center shrink-0">
                <StoreIcon className="w-6 h-6 text-stone-500" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-sm text-stone-900 truncate">{store.name}</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  store.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                  store.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-stone-200 text-stone-700'
                }`}>
                  {store.status === 'APPROVED' ? 'APROBADA' : store.status}
                </span>
              </div>
              <p className="text-xs text-stone-500 truncate mt-0.5">
                Propietario registrado: {store.ownerName} • {store.province}
              </p>
            </div>
          </div>
        </div>

        {/* Success View */}
        {savedCredentials ? (
          <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-emerald-900 space-y-3">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-950">
                    ¡Credenciales asignadas exitosamente!
                  </h4>
                  <p className="text-xs text-emerald-700">
                    La tienda ya puede iniciar sesión en PlazaDO con las siguientes credenciales:
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-emerald-200/80 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-stone-100 font-sans">
                  <span className="text-stone-500 font-semibold">Tienda:</span>
                  <span className="font-bold text-stone-900">{savedCredentials.storeName}</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-stone-100">
                  <span className="text-stone-500 font-sans font-semibold">Correo de Acceso:</span>
                  <span className="font-bold text-blue-700 select-all">{savedCredentials.email}</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-stone-100">
                  <span className="text-stone-500 font-sans font-semibold">Contraseña:</span>
                  <span className="font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded select-all">
                    {savedCredentials.password}
                  </span>
                </div>
                <div className="flex items-center justify-between font-sans text-[11px] text-stone-500 pt-1">
                  <span>Rol asignado:</span>
                  <span className="font-bold text-stone-700">STORE_OWNER (Dueño de Tienda)</span>
                </div>
              </div>

              <p className="text-[11px] text-emerald-800 leading-relaxed font-sans">
                💡 Puedes copiar este paquete de credenciales y enviarlo directamente al comerciante por WhatsApp o correo.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyCredentialsText}
                className="flex-1 py-3 px-4 bg-stone-900 hover:bg-stone-850 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedNotice ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>¡Credenciales copiadas al portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-stone-300" />
                    <span>Copiar Datos de Acceso para Enviar a la Tienda</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Existing User Notification if any */}
            {existingAdminUser ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5 text-blue-900">
                <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold">Usuario actualmente asignado: </span>
                  <span>{existingAdminUser.name} ({existingAdminUser.email})</span>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Modificar los campos a continuación actualizará la cuenta de acceso y la contraseña de esta tienda.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold">Esta tienda no tiene una cuenta de usuario vinculada.</span>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Al guardar este formulario, se creará un usuario administrador con rol STORE_OWNER vinculado permanentemente a esta tienda.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Correo Electrónico de Acceso a la Tienda <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ej: contacto@tienda.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 outline-none focus:border-blue-600 focus:bg-white text-xs font-medium"
                />
              </div>
              <p className="text-[11px] text-stone-400 mt-1">
                Este es el correo que usará el comerciante para iniciar sesión en PlazaDO.
              </p>
            </div>

            {/* Name and Phone Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Nombre del Administrador / Responsable
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ej: Juan Pérez"
                    className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 outline-none focus:border-blue-600 focus:bg-white text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Teléfono / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="ej: 809-555-0123"
                    className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 outline-none focus:border-blue-600 focus:bg-white text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Password Generator Button */}
            <div className="flex items-center justify-between pt-1">
              <label className="font-bold text-stone-700">
                Nueva Contraseña de Acceso <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={generateSecurePassword}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Generar Contraseña Segura</span>
              </button>
            </div>

            {/* Password Input */}
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 outline-none focus:border-blue-600 focus:bg-white text-xs font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Confirmar Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full pl-10 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-stone-900 outline-none focus:border-blue-600 focus:bg-white text-xs font-medium"
                />
              </div>
            </div>

            {/* Validation Checklist */}
            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 font-medium">
                <span className={isMinLength ? 'text-emerald-600' : 'text-stone-400'}>
                  {isMinLength ? '✓' : '○'}
                </span>
                <span className={isMinLength ? 'text-emerald-800 font-bold' : 'text-stone-500'}>
                  Al menos 6 caracteres requeridos
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className={isMatch ? 'text-emerald-600' : 'text-stone-400'}>
                  {isMatch ? '✓' : '○'}
                </span>
                <span className={isMatch ? 'text-emerald-800 font-bold' : 'text-stone-500'}>
                  Las contraseñas coinciden
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isMinLength || !isMatch}
                className={`px-5 py-2.5 rounded-xl font-bold text-white transition-all shadow-md flex items-center gap-2 ${
                  isSubmitting || !isMinLength || !isMatch
                    ? 'bg-stone-300 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-blue-500/20'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Guardando y Asignando...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Guardar y Asignar Credenciales</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
