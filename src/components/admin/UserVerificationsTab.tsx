import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  Mail, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  RefreshCw, 
  KeyRound, 
  Copy, 
  Check, 
  User, 
  Store, 
  Send, 
  ExternalLink,
  ShieldAlert,
  Calendar,
  X,
  UserCheck,
  AlertTriangle
} from 'lucide-react';

interface VerificationItem {
  id: string;
  name: string;
  email: string;
  accountType: 'CUSTOMER' | 'STORE';
  storeName?: string;
  storeId?: string;
  registeredAt: string;
  isEmailVerified: boolean;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'EXPIRED';
  code?: string;
  codeExpiresAt?: number;
  attempts: number;
  resendCount: number;
  lastSentAt: number;
}

export const UserVerificationsTab: React.FC = () => {
  const { currentUser, showNotification } = useApp();

  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'CUSTOMER' | 'STORE'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'VERIFIED' | 'EXPIRED'>('all');

  // Modals & Action States
  const [consultModal, setConsultModal] = useState<{
    open: boolean;
    email: string;
    name: string;
    code?: string;
    codeExpiresAt?: number;
    isExpired?: boolean;
    attempts?: number;
    isEmailVerified?: boolean;
    loading: boolean;
  }>({
    open: false,
    email: '',
    name: '',
    loading: false
  });

  const [copiedCode, setCopiedCode] = useState(false);
  const [actionLoadingEmail, setActionLoadingEmail] = useState<string | null>(null);

  const [manualVerifyConfirm, setManualVerifyConfirm] = useState<{
    open: boolean;
    user: VerificationItem | null;
    reason: string;
  }>({
    open: false,
    user: null,
    reason: 'Confirmación telefónica con el usuario'
  });

  const [newCodeModal, setNewCodeModal] = useState<{
    open: boolean;
    email: string;
    name: string;
    newCode: string;
    expiresAt: number;
  }>({
    open: false,
    email: '',
    name: '',
    newCode: '',
    expiresAt: 0
  });

  // Fetch verifications from backend
  const fetchVerifications = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await api.getVerifications();
      if (res.success && res.verifications) {
        setVerifications(res.verifications);
      } else {
        showNotification(res.message || 'Error cargando lista de verificaciones', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error de conexión con el servidor', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  // Filtered List
  const filteredVerifications = useMemo(() => {
    return verifications.filter(item => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || 
        item.name.toLowerCase().includes(q) || 
        item.email.toLowerCase().includes(q) || 
        (item.storeName && item.storeName.toLowerCase().includes(q));

      const matchesType = typeFilter === 'all' || item.accountType === typeFilter;
      const matchesStatus = statusFilter === 'all' || item.verificationStatus === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [verifications, searchQuery, typeFilter, statusFilter]);

  // Metrics
  const totalCount = verifications.length;
  const pendingCount = verifications.filter(v => v.verificationStatus === 'PENDING').length;
  const verifiedCount = verifications.filter(v => v.verificationStatus === 'VERIFIED').length;
  const expiredCount = verifications.filter(v => v.verificationStatus === 'EXPIRED').length;

  // Consult code
  const handleConsultCode = async (item: VerificationItem) => {
    setConsultModal({
      open: true,
      email: item.email,
      name: item.name,
      loading: true
    });
    setCopiedCode(false);

    try {
      const res = await api.adminConsultVerificationCode(item.email);
      if (res.success) {
        setConsultModal({
          open: true,
          email: res.email,
          name: res.name,
          code: res.code,
          codeExpiresAt: res.codeExpiresAt,
          isExpired: res.isExpired,
          attempts: res.attempts,
          isEmailVerified: res.isEmailVerified,
          loading: false
        });
      } else {
        showNotification(res.message || 'No se pudo consultar el código', 'error');
        setConsultModal(prev => ({ ...prev, open: false, loading: false }));
      }
    } catch (err: any) {
      showNotification(err.message || 'Error de autorización al consultar código', 'error');
      setConsultModal(prev => ({ ...prev, open: false, loading: false }));
    }
  };

  // Generate new code
  const handleGenerateNewCode = async (email: string, name: string) => {
    setActionLoadingEmail(email);
    try {
      const res = await api.adminGenerateNewVerificationCode(email);
      if (res.success && res.newCode) {
        setNewCodeModal({
          open: true,
          email,
          name,
          newCode: res.newCode,
          expiresAt: res.expiresAt
        });
        showNotification(`Nuevo código (${res.newCode}) generado y enviado a ${email} desde contacto@plazado.com`, 'success');
        fetchVerifications(true);
      } else {
        showNotification(res.message || 'Error generando nuevo código', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error de conexión', 'error');
    } finally {
      setActionLoadingEmail(null);
    }
  };

  // Resend email
  const handleResendEmail = async (email: string) => {
    setActionLoadingEmail(email);
    try {
      const res = await api.adminResendVerificationEmail(email);
      if (res.success) {
        showNotification(res.message || `Correo con código reenviado a ${email} desde contacto@plazado.com`, 'success');
        fetchVerifications(true);
      } else {
        showNotification(res.message || 'Error reenviando correo', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error de conexión', 'error');
    } finally {
      setActionLoadingEmail(null);
    }
  };

  // Manual verify confirmation
  const executeManualVerify = async () => {
    if (!manualVerifyConfirm.user) return;
    const targetEmail = manualVerifyConfirm.user.email;
    setActionLoadingEmail(targetEmail);
    try {
      const res = await api.adminManualVerify(targetEmail, manualVerifyConfirm.reason);
      if (res.success) {
        showNotification(`Cuenta de ${manualVerifyConfirm.user.name} verificada manualmente con éxito.`, 'success');
        setManualVerifyConfirm({ open: false, user: null, reason: '' });
        fetchVerifications(true);
      } else {
        showNotification(res.message || 'Error verificando usuario manualmente', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error de conexión', 'error');
    } finally {
      setActionLoadingEmail(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    showNotification('Código copiado al portapapeles', 'info');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl border border-red-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                Verificación de Usuarios & Comercios
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  contacto@plazado.com
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                Auditoría centralizada de cuentas pendientes de validación, consulta administrativa y recuperación manual de códigos
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchVerifications(true)}
            disabled={refreshing}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Actualizar lista de verificaciones"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Total Cuentas</span>
          <p className="text-2xl font-black text-stone-900 mt-1">{totalCount}</p>
          <span className="text-[10px] text-stone-400 mt-0.5 block">Clientes y Comercios</span>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-2xs">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Pendientes
          </span>
          <p className="text-2xl font-black text-amber-900 mt-1">{pendingCount}</p>
          <span className="text-[10px] text-amber-700 mt-0.5 block">Requieren validar código</span>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Verificados</span>
          <p className="text-2xl font-black text-emerald-900 mt-1">{verifiedCount}</p>
          <span className="text-[10px] text-emerald-700 mt-0.5 block">Activos en PlazaDO</span>
        </div>

        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">Expirados</span>
          <p className="text-2xl font-black text-stone-800 mt-1">{expiredCount}</p>
          <span className="text-[10px] text-stone-500 mt-0.5 block">Código vencido (&gt;15 min)</span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, correo o tienda..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-red-500 focus:bg-white"
            />
          </div>

          {/* Filter: Account Type */}
          <div className="flex items-center gap-1.5 bg-stone-50 p-1 rounded-xl border border-stone-200 text-xs">
            <span className="text-[11px] font-bold text-stone-500 pl-2">Tipo:</span>
            <button
              onClick={() => setTypeFilter('all')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${
                typeFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setTypeFilter('CUSTOMER')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${
                typeFilter === 'CUSTOMER' ? 'bg-white text-blue-700 shadow-xs' : 'text-stone-600 hover:text-blue-700'
              }`}
            >
              Clientes
            </button>
            <button
              onClick={() => setTypeFilter('STORE')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${
                typeFilter === 'STORE' ? 'bg-white text-amber-800 shadow-xs' : 'text-stone-600 hover:text-amber-800'
              }`}
            >
              Tiendas
            </button>
          </div>

          {/* Filter: Verification Status */}
          <div className="flex items-center gap-1.5 bg-stone-50 p-1 rounded-xl border border-stone-200 text-xs">
            <span className="text-[11px] font-bold text-stone-500 pl-2">Estado:</span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${
                statusFilter === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${
                statusFilter === 'PENDING' ? 'bg-amber-500 text-white shadow-xs' : 'text-stone-600 hover:text-amber-700'
              }`}
            >
              Pendientes
            </button>
            <button
              onClick={() => setStatusFilter('VERIFIED')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${
                statusFilter === 'VERIFIED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-600 hover:text-emerald-700'
              }`}
            >
              Verificados
            </button>
            <button
              onClick={() => setStatusFilter('EXPIRED')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${
                statusFilter === 'EXPIRED' ? 'bg-stone-700 text-white shadow-xs' : 'text-stone-600'
              }`}
            >
              Expirados
            </button>
          </div>

        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-red-600 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-stone-600">Cargando registros de verificación desde Google Cloud...</p>
          </div>
        ) : filteredVerifications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-sm font-bold text-stone-700">No se encontraron registros con los filtros seleccionados</p>
            <p className="text-xs text-stone-400">Intenta cambiar el término de búsqueda o restablecer los filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Usuario / Titular</th>
                  <th className="py-3 px-4">Correo Electrónico</th>
                  <th className="py-3 px-4">Tipo de Cuenta</th>
                  <th className="py-3 px-4">Fecha Registro</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Expiración Código</th>
                  <th className="py-3 px-4 text-right">Acciones Super Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredVerifications.map((item) => {
                  const isVerified = item.verificationStatus === 'VERIFIED';
                  const isPending = item.verificationStatus === 'PENDING';
                  const isExpired = item.verificationStatus === 'EXPIRED';

                  let expiryLabel = 'N/A';
                  if (isVerified) {
                    expiryLabel = 'Cuenta Activa';
                  } else if (item.codeExpiresAt) {
                    const diffMs = item.codeExpiresAt - Date.now();
                    if (diffMs > 0) {
                      const mins = Math.ceil(diffMs / 60000);
                      expiryLabel = `Vence en ${mins} min`;
                    } else {
                      expiryLabel = 'Expirado';
                    }
                  }

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/80 transition-colors">
                      
                      {/* Nombre */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            item.accountType === 'STORE' 
                              ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                              : 'bg-stone-100 text-stone-700 border border-stone-200'
                          }`}>
                            {item.accountType === 'STORE' ? <Store className="w-4 h-4" /> : <User className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-bold text-stone-900 leading-tight">{item.name}</p>
                            {item.storeName && (
                              <p className="text-[10px] text-amber-800 font-semibold flex items-center gap-1">
                                <Store className="w-2.5 h-2.5 text-amber-700" />
                                {item.storeName}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Correo Electrónico */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-stone-800">
                          <span>{item.email}</span>
                          <button
                            onClick={() => copyToClipboard(item.email)}
                            className="p-1 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-700"
                            title="Copiar correo"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Tipo de Cuenta */}
                      <td className="py-3.5 px-4">
                        {item.accountType === 'STORE' ? (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                            <Store className="w-3 h-3" />
                            Tienda / Comercio
                          </span>
                        ) : (
                          <span className="bg-blue-50 text-blue-800 border border-blue-200 font-bold px-2 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Cliente Comprador
                          </span>
                        )}
                      </td>

                      {/* Fecha de Registro */}
                      <td className="py-3.5 px-4 text-stone-600 text-[11px] whitespace-nowrap">
                        {new Date(item.registeredAt).toLocaleString('es-DO', {
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4">
                        {isVerified && (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Verificado
                          </span>
                        )}
                        {isPending && (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pendiente
                          </span>
                        )}
                        {isExpired && (
                          <span className="bg-rose-100 text-rose-800 border border-rose-300 font-bold px-2.5 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Expirado
                          </span>
                        )}
                      </td>

                      {/* Expiración del código */}
                      <td className="py-3.5 px-4 text-[11px]">
                        <span className={`font-medium ${
                          isVerified ? 'text-emerald-700' : isExpired ? 'text-rose-600' : 'text-amber-800 font-bold'
                        }`}>
                          {expiryLabel}
                        </span>
                        {item.attempts > 0 && !isVerified && (
                          <span className="block text-[9px] text-stone-400">
                            Intentos: {item.attempts}/5
                          </span>
                        )}
                      </td>

                      {/* Acciones Super Admin */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Consultar código (siempre disponible para Super Admin) */}
                          <button
                            onClick={() => handleConsultCode(item)}
                            className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                            title="Consultar código de verificación activo para asistencia de soporte"
                          >
                            <KeyRound className="w-3 h-3 text-amber-400" />
                            <span>Consultar Código</span>
                          </button>

                          {/* Generar nuevo código */}
                          <button
                            onClick={() => handleGenerateNewCode(item.email, item.name)}
                            disabled={actionLoadingEmail === item.email}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            title="Invalidar anterior y generar nuevo código enviado desde contacto@plazado.com"
                          >
                            <RefreshCw className={`w-3 h-3 ${actionLoadingEmail === item.email ? 'animate-spin' : ''}`} />
                            <span>Nuevo Código</span>
                          </button>

                          {/* Reenviar correo */}
                          {!isVerified && (
                            <button
                              onClick={() => handleResendEmail(item.email)}
                              disabled={actionLoadingEmail === item.email}
                              className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              title="Reenviar correo oficial desde contacto@plazado.com"
                            >
                              <Send className="w-3.5 h-3.5 text-stone-600" />
                            </button>
                          )}

                          {/* Aprobar manualmente */}
                          {!isVerified && (
                            <button
                              onClick={() => setManualVerifyConfirm({ open: true, user: item, reason: 'Validación asistida por soporte telefónico / Super Admin' })}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                              title="Verificar y activar cuenta directamente desde Super Admin"
                            >
                              <UserCheck className="w-3 h-3 text-emerald-700" />
                              <span>Aprobar Manual</span>
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: CONSULTA DE CÓDIGO (EXCLUSIVO SUPER ADMIN) */}
      {consultModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-stone-900 text-base">Código de Verificación</h3>
                  <p className="text-[11px] text-stone-500">Acceso reservado para Super Administrador</p>
                </div>
              </div>
              <button
                onClick={() => setConsultModal(prev => ({ ...prev, open: false }))}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {consultModal.loading ? (
              <div className="py-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 text-red-600 animate-spin mx-auto" />
                <p className="text-xs text-stone-500 font-semibold">Consultando registro seguro en Google Cloud...</p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* User info */}
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Usuario:</span>
                    <strong className="text-stone-900">{consultModal.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Correo:</span>
                    <span className="font-mono text-stone-900 font-semibold">{consultModal.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Remitente oficial:</span>
                    <span className="font-bold text-red-700">contacto@plazado.com</span>
                  </div>
                </div>

                {/* Big Code Display */}
                {consultModal.code ? (
                  <div className="bg-amber-50 border-2 border-dashed border-amber-400 rounded-2xl p-5 text-center space-y-2">
                    <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-900 block">
                      Código de 6 Dígitos Activo
                    </span>
                    <div className="text-4xl font-mono font-black text-red-600 tracking-widest my-2 select-all">
                      {consultModal.code}
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <button
                        onClick={() => copyToClipboard(consultModal.code!)}
                        className="px-3.5 py-1.5 bg-white hover:bg-stone-100 text-stone-800 rounded-xl text-xs font-bold border border-amber-300 shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                        <span>{copiedCode ? '¡Copiado!' : 'Copiar Código'}</span>
                      </button>
                    </div>
                    <p className={`text-[10px] font-semibold mt-2 ${
                      consultModal.isExpired ? 'text-rose-600' : 'text-stone-500'
                    }`}>
                      {consultModal.isExpired ? '⚠️ Este código ya ha expirado.' : '⏱️ Código válido por 15 minutos.'}
                    </p>
                  </div>
                ) : (
                  <div className="bg-stone-50 p-4 rounded-xl text-center text-xs text-stone-500">
                    No hay un código pendiente activo para esta cuenta.
                  </div>
                )}

                {/* Security Audit Note */}
                <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl text-[11px] text-red-900 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-red-950">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                    <span>Auditoría de Seguridad</span>
                  </div>
                  <p className="leading-relaxed">
                    Esta consulta ha quedado registrada en el AuditLog con tu usuario ({currentUser?.email}). Utiliza este código exclusivamente para dictárselo al usuario tras confirmar su identidad.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleGenerateNewCode(consultModal.email, consultModal.name)}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Generar Nuevo Código
                  </button>
                  <button
                    onClick={() => setConsultModal(prev => ({ ...prev, open: false }))}
                    className="py-2 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL 2: NUEVO CÓDIGO GENERADO */}
      {newCodeModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-black text-stone-900 text-base">Nuevo Código Generado</h3>
              <p className="text-xs text-stone-500">
                El código anterior ha sido invalidado automáticamente.
              </p>
            </div>

            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-5 text-center space-y-2">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Código para {newCodeModal.name}
              </span>
              <div className="text-4xl font-mono font-black text-emerald-700 tracking-widest my-2 select-all">
                {newCodeModal.newCode}
              </div>
              <button
                onClick={() => copyToClipboard(newCodeModal.newCode)}
                className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-800 rounded-xl text-xs font-bold border border-emerald-300 shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-500" />}
                <span>{copiedCode ? '¡Copiado!' : 'Copiar'}</span>
              </button>
              <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                Disparado por correo a <strong>{newCodeModal.email}</strong> desde <strong>contacto@plazado.com</strong>
              </p>
            </div>

            <button
              onClick={() => setNewCodeModal(prev => ({ ...prev, open: false }))}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold rounded-xl text-xs cursor-pointer"
            >
              Entendido y Cerrar
            </button>

          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRMACIÓN DE VERIFICACIÓN MANUAL */}
      {manualVerifyConfirm.open && manualVerifyConfirm.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            
            <div className="flex items-center gap-2 text-stone-900 pb-2 border-b border-stone-100">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base">Aprobación Manual de Verificación</h3>
                <p className="text-[11px] text-stone-500">Acción ejecutada como Super Administrador</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              ¿Deseas marcar como verificado el correo electrónico y activar la cuenta de{' '}
              <strong>{manualVerifyConfirm.user.name}</strong> ({manualVerifyConfirm.user.email})?
            </p>

            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">Motivo o Justificación (AuditLog):</label>
              <input
                type="text"
                value={manualVerifyConfirm.reason}
                onChange={(e) => setManualVerifyConfirm(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full p-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-red-500"
                placeholder="Ej. Confirmación telefónica de identidad"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={executeManualVerify}
                disabled={!manualVerifyConfirm.reason.trim()}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Confirmar Verificación
              </button>
              <button
                onClick={() => setManualVerifyConfirm({ open: false, user: null, reason: '' })}
                className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cancelar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
