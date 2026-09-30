import React, { useState, useEffect } from 'react';
import { 
  X, 
  Key, 
  Lock, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Check, 
  AlertTriangle, 
  ShieldCheck,
  User as UserIcon,
  Copy
} from 'lucide-react';
import { User as UserType } from '../../types';
import { useApp } from '../../context/AppContext';

interface UserPasswordModalProps {
  user: UserType | null;
  isOpen: boolean;
  onClose: () => void;
}

export const UserPasswordModal: React.FC<UserPasswordModalProps> = ({ user, isOpen, onClose }) => {
  const { setUserPassword, showNotification } = useApp();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedNotice, setCopiedNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setErrorMessage('');
      setIsSubmitting(false);
      setCopiedNotice(false);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  // Generator for secure password
  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let result = 'Plaza';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    result += `${new Date().getFullYear()}!`;
    setNewPassword(result);
    setConfirmPassword(result);
    setShowPassword(true);
    setErrorMessage('');
  };

  const copyToClipboard = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const pass = newPassword.trim();
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
      const res = await setUserPassword(user.id, pass);
      if (res.success) {
        onClose();
      } else {
        setErrorMessage(res.message || 'Error al actualizar la contraseña');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inesperado al actualizar la contraseña');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMinLength = newPassword.length >= 6;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs border border-amber-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 block">
                SEGURIDAD Y CONTROL DE ACCESO
              </span>
              <h3 className="font-extrabold text-stone-900 text-sm">Modificar Contraseña de Usuario</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target User Details */}
        <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center font-bold text-stone-700 shrink-0 overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              user.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-900 truncate">{user.name}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                user.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800' :
                user.role === 'STORE_OWNER' ? 'bg-blue-100 text-blue-800' : 'bg-stone-200 text-stone-700'
              }`}>
                {user.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : user.role === 'STORE_OWNER' ? 'COMERCIO' : 'CLIENTE'}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 truncate">{user.email}</p>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* New password input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-stone-800">
                Nueva Contraseña <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={generateSecurePassword}
                className="text-[10px] text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 hover:underline"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Generar Segura</span>
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres..."
                className="w-full pl-3 pr-20 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium outline-none focus:border-amber-500 focus:bg-white text-xs"
              />
              <div className="absolute right-2 top-2 flex items-center gap-1">
                {newPassword && (
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    title="Copiar contraseña"
                    className="p-1 text-stone-400 hover:text-stone-700 rounded transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-stone-400 hover:text-stone-700 rounded transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {copiedNotice && (
              <p className="text-[10px] text-emerald-600 font-bold mt-1">
                ¡Contraseña copiada al portapapeles!
              </p>
            )}
          </div>

          {/* Confirm password input */}
          <div>
            <label className="block font-bold text-stone-800 mb-1">
              Confirmar Contraseña <span className="text-red-500">*</span>
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Vuelve a escribir la nueva contraseña..."
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-medium outline-none focus:border-amber-500 focus:bg-white text-xs"
            />
          </div>

          {/* Validation Checklist */}
          <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl space-y-1 text-[11px]">
            <div className={`flex items-center gap-1.5 ${isMinLength ? 'text-emerald-700 font-semibold' : 'text-stone-400'}`}>
              <Check className={`w-3.5 h-3.5 ${isMinLength ? 'text-emerald-600' : 'text-stone-300'}`} />
              <span>Longitud mínima de 6 caracteres</span>
            </div>
            <div className={`flex items-center gap-1.5 ${isMatch ? 'text-emerald-700 font-semibold' : 'text-stone-400'}`}>
              <Check className={`w-3.5 h-3.5 ${isMatch ? 'text-emerald-600' : 'text-stone-300'}`} />
              <span>Ambas contraseñas coinciden exactamente</span>
            </div>
          </div>

          {/* Audit Notice */}
          <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2 text-[11px] text-amber-900 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              El usuario podrá iniciar sesión inmediatamente con esta clave. Esta modificación quedará registrada con fecha, hora e IP en la auditoría del Super Admin.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isMinLength || !isMatch}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Key className="w-3.5 h-3.5" />
                  <span>Actualizar Contraseña</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
