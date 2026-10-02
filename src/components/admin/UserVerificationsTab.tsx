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
  AlertTriangle,
  FileText,
  ScanFace,
  Phone,
  Eye,
  Download,
  ThumbsUp,
  ThumbsDown,
  UserPlus
} from 'lucide-react';

interface VerificationItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  cedulaNumber?: string;
  cedulaFrontUrl?: string;
  selfieUrl?: string;
  biometricScore?: number;
  biometricStatus?: 'VERIFIED' | 'PENDING' | 'REJECTED';
  isKycVerified?: boolean;
  adminApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
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
  const { currentUser, showNotification, createSuperAdminUser, stores, adminImpersonateStore } = useApp();

  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'CUSTOMER' | 'STORE'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');

  // Modals & Action States
  const [selectedDossier, setSelectedDossier] = useState<VerificationItem | null>(null);
  const [zoomImage, setZoomImage] = useState<{ url: string; title: string } | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Reject Modal
  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    item: VerificationItem | null;
    reason: string;
  }>({
    open: false,
    item: null,
    reason: 'Foto de cédula ilegible o no coincide con los datos del titular'
  });

  // Consult code modal
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

  // Super Admin Creation Modal
  const [createAdminModalOpen, setCreateAdminModalOpen] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminConfirmPass, setAdminConfirmPass] = useState('');
  const [creatingAdminLoading, setCreatingAdminLoading] = useState(false);

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
        (item.phone && item.phone.includes(q)) ||
        (item.cedulaNumber && item.cedulaNumber.toLowerCase().includes(q)) ||
        (item.storeName && item.storeName.toLowerCase().includes(q));

      const matchesType = typeFilter === 'all' || item.accountType === typeFilter;
      
      const effectiveApprovalStatus = item.adminApprovalStatus || (item.isEmailVerified ? 'APPROVED' : 'PENDING');
      const matchesStatus = statusFilter === 'all' || effectiveApprovalStatus === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [verifications, searchQuery, typeFilter, statusFilter]);

  // Metrics
  const totalCount = verifications.length;
  const pendingCount = verifications.filter(v => (v.adminApprovalStatus || (v.isEmailVerified ? 'APPROVED' : 'PENDING')) === 'PENDING').length;
  const approvedCount = verifications.filter(v => (v.adminApprovalStatus || (v.isEmailVerified ? 'APPROVED' : 'PENDING')) === 'APPROVED').length;
  const rejectedCount = verifications.filter(v => v.adminApprovalStatus === 'REJECTED').length;

  // Approve User Account & Validate Documents
  const handleApproveUser = async (item: VerificationItem) => {
    setActionLoadingId(item.id);
    try {
      const res = await api.adminApproveUser(item.id);
      if (res.success) {
        showNotification(`Cuenta de ${item.name} autorizada y validada exitosamente.`, 'success');
        if (selectedDossier?.id === item.id) {
          setSelectedDossier(prev => prev ? { ...prev, adminApprovalStatus: 'APPROVED', isApprovedByAdmin: true, isEmailVerified: true } : null);
        }
        fetchVerifications(true);
      } else {
        showNotification(res.message || 'Error al autorizar cuenta', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error de conexión', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject User Documentation
  const executeRejectUser = async () => {
    if (!rejectModal.item) return;
    const targetItem = rejectModal.item;
    setActionLoadingId(targetItem.id);
    try {
      const res = await api.adminRejectUser(targetItem.id, rejectModal.reason);
      if (res.success) {
        showNotification(`Documentación de ${targetItem.name} rechazada.`, 'info');
        setRejectModal({ open: false, item: null, reason: '' });
        if (selectedDossier?.id === targetItem.id) {
          setSelectedDossier(prev => prev ? { ...prev, adminApprovalStatus: 'REJECTED', rejectionReason: rejectModal.reason } : null);
        }
        fetchVerifications(true);
      } else {
        showNotification(res.message || 'Error al rechazar documentación', 'error');
      }
    } catch (err: any) {
      showNotification(err.message || 'Error de conexión', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

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

  // Create Super Admin Submit
  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim() || !adminEmail.trim()) {
      showNotification('Nombre y correo son requeridos', 'error');
      return;
    }
    if (!adminPassword || adminPassword.length < 6) {
      showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    if (adminPassword !== adminConfirmPass) {
      showNotification('Las contraseñas no coinciden', 'error');
      return;
    }

    setCreatingAdminLoading(true);
    try {
      const res = await createSuperAdminUser({
        name: adminName.trim(),
        email: adminEmail.trim(),
        phone: adminPhone.trim(),
        password: adminPassword
      });
      if (res.success) {
        setCreateAdminModalOpen(false);
        setAdminName('');
        setAdminEmail('');
        setAdminPhone('');
        setAdminPassword('');
        setAdminConfirmPass('');
        fetchVerifications(true);
      }
    } finally {
      setCreatingAdminLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    showNotification('Copiado al portapapeles', 'info');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-xs">
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
                Validación de Identidad & Expedientes de Clientes
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  Cédulas & Biometría RD
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                Almacenamiento seguro, inspección visual de cédulas, verificación biométrica y autorización de cuentas en PlazaDO.com
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setCreateAdminModalOpen(true)}
            className="px-3.5 py-2 bg-stone-900 hover:bg-stone-850 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5 text-amber-400" />
            <span>Crear Super Admin</span>
          </button>

          <button
            type="button"
            onClick={() => fetchVerifications(true)}
            disabled={refreshing}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Actualizar expedientes"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          onClick={() => setStatusFilter('all')}
          className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs cursor-pointer hover:border-stone-400 transition-all"
        >
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">Total Expedientes</span>
          <p className="text-2xl font-black text-stone-900 mt-1">{totalCount}</p>
          <span className="text-[10px] text-stone-400 mt-0.5 block">Clientes y Comercios</span>
        </div>

        <div 
          onClick={() => setStatusFilter('PENDING')}
          className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 shadow-2xs cursor-pointer hover:border-amber-400 transition-all"
        >
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Pendientes de Validación
          </span>
          <p className="text-2xl font-black text-amber-900 mt-1">{pendingCount}</p>
          <span className="text-[10px] text-amber-700 mt-0.5 block">Esperando aprobación</span>
        </div>

        <div 
          onClick={() => setStatusFilter('APPROVED')}
          className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 shadow-2xs cursor-pointer hover:border-emerald-400 transition-all"
        >
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Validados & Autorizados</span>
          <p className="text-2xl font-black text-emerald-900 mt-1">{approvedCount}</p>
          <span className="text-[10px] text-emerald-700 mt-0.5 block">Cuentas activas</span>
        </div>

        <div 
          onClick={() => setStatusFilter('REJECTED')}
          className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 shadow-2xs cursor-pointer hover:border-rose-400 transition-all"
        >
          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Rechazados</span>
          <p className="text-2xl font-black text-rose-900 mt-1">{rejectedCount}</p>
          <span className="text-[10px] text-rose-700 mt-0.5 block">Documentos denegados</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, correo, cédula o teléfono..."
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-red-500 focus:bg-white"
            />
          </div>

          {/* Filter: Account Type */}
          <div className="flex items-center gap-1 bg-stone-50 p-1 rounded-xl border border-stone-200 text-xs">
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

          {/* Filter: Verification / Approval Status */}
          <div className="flex items-center gap-1 bg-stone-50 p-1 rounded-xl border border-stone-200 text-xs">
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
              onClick={() => setStatusFilter('APPROVED')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${
                statusFilter === 'APPROVED' ? 'bg-emerald-600 text-white shadow-xs' : 'text-stone-600 hover:text-emerald-700'
              }`}
            >
              Aprobados
            </button>
            <button
              onClick={() => setStatusFilter('REJECTED')}
              className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition-all ${
                statusFilter === 'REJECTED' ? 'bg-rose-600 text-white shadow-xs' : 'text-stone-600 hover:text-rose-700'
              }`}
            >
              Rechazados
            </button>
          </div>

        </div>
      </div>

      {/* Main Expedientes Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-red-600 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-stone-600">Cargando expedientes de identidad desde la base de datos...</p>
          </div>
        ) : filteredVerifications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-stone-300 mx-auto" />
            <p className="text-sm font-bold text-stone-700">No se encontraron expedientes con los filtros seleccionados</p>
            <p className="text-xs text-stone-400">Intenta cambiar el término de búsqueda o seleccionar "Todos".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Documentos (Foto & Cédula)</th>
                  <th className="py-3 px-4">Titular / Cliente</th>
                  <th className="py-3 px-4">Cédula Dominicana</th>
                  <th className="py-3 px-4">Tipo de Cuenta</th>
                  <th className="py-3 px-4">Fecha de Solicitud</th>
                  <th className="py-3 px-4">Estado Autorización</th>
                  <th className="py-3 px-4 text-right">Acciones Super Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredVerifications.map((item) => {
                  const effectiveStatus = item.adminApprovalStatus || (item.isEmailVerified ? 'APPROVED' : 'PENDING');
                  const isApproved = effectiveStatus === 'APPROVED';
                  const isPending = effectiveStatus === 'PENDING';
                  const isRejected = effectiveStatus === 'REJECTED';
                  const hasCedulaPhoto = !!item.cedulaFrontUrl;
                  const hasSelfie = !!item.selfieUrl || !!item.avatar;

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/80 transition-colors">
                      
                      {/* Column 1: Document Photos (Selfie & Cédula) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          
                          {/* Personal Selfie / Avatar Thumbnail */}
                          <div 
                            onClick={() => (hasSelfie ? setZoomImage({ url: item.selfieUrl || item.avatar || '', title: `Foto Personal / Selfie - ${item.name}` }) : null)}
                            className={`w-11 h-11 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 flex items-center justify-center relative group shrink-0 ${hasSelfie ? 'cursor-pointer hover:border-red-500 shadow-2xs' : ''}`}
                            title={hasSelfie ? 'Clic para ampliar foto personal' : 'Sin foto personal registrada'}
                          >
                            {hasSelfie ? (
                              <>
                                <img src={item.selfieUrl || item.avatar} alt={item.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <Eye className="w-3.5 h-3.5" />
                                </div>
                              </>
                            ) : (
                              <User className="w-5 h-5 text-stone-400" />
                            )}
                          </div>

                          {/* Cédula Photo Thumbnail */}
                          <div 
                            onClick={() => (hasCedulaPhoto ? setZoomImage({ url: item.cedulaFrontUrl || '', title: `Foto de Cédula - ${item.name}` }) : null)}
                            className={`w-14 h-11 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 flex items-center justify-center relative group shrink-0 ${hasCedulaPhoto ? 'cursor-pointer hover:border-blue-500 shadow-2xs' : ''}`}
                            title={hasCedulaPhoto ? 'Clic para ampliar foto de cédula' : 'Sin foto de cédula registrada'}
                          >
                            {hasCedulaPhoto ? (
                              <>
                                <img src={item.cedulaFrontUrl} alt="Cédula" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                  <Eye className="w-3.5 h-3.5" />
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center text-[9px] text-stone-400 text-center p-1 font-bold">
                                <span>SIN</span>
                                <span>CÉDULA</span>
                              </div>
                            )}
                          </div>

                        </div>
                      </td>

                      {/* Column 2: User Name & Contacts */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900 flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {item.biometricScore && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-extrabold" title={`Score biométrico: ${item.biometricScore}%`}>
                              {item.biometricScore}% Bio
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                          {item.email}
                        </div>
                        {item.phone && (
                          <div className="flex items-center gap-1.5 text-[11px] text-stone-600 mt-0.5">
                            <Phone className="w-3 h-3 text-stone-400" />
                            <span>{item.phone}</span>
                            <a
                              href={`https://wa.me/1${item.phone.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1 rounded transition-colors"
                              title="Contactar por WhatsApp"
                            >
                              WhatsApp
                            </a>
                          </div>
                        )}
                      </td>

                      {/* Column 3: Cédula Number */}
                      <td className="py-3 px-4">
                        {item.cedulaNumber ? (
                          <div className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-1 rounded-lg inline-block border border-stone-200 text-xs">
                            {item.cedulaNumber}
                          </div>
                        ) : (
                          <span className="text-stone-400 italic text-[11px]">No registrada</span>
                        )}
                      </td>

                      {/* Column 4: Account Type */}
                      <td className="py-3 px-4">
                        {item.accountType === 'STORE' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px] flex items-center gap-1">
                              <Store className="w-3 h-3" />
                              Comercio
                            </span>
                            {item.storeName && (
                              <span className="text-[11px] font-bold text-stone-700">
                                {item.storeName}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-extrabold text-[10px] flex items-center gap-1 w-max">
                            <User className="w-3 h-3" />
                            Cliente
                          </span>
                        )}
                      </td>

                      {/* Column 5: Registration Date */}
                      <td className="py-3 px-4 text-stone-600 text-[11px]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          <span>{new Date(item.registeredAt).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                        <span className="text-[10px] text-stone-400">
                          {new Date(item.registeredAt).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Column 6: Approval Status */}
                      <td className="py-3 px-4">
                        {isApproved && (
                          <div className="space-y-0.5">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] flex items-center gap-1 w-max border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              AUTORIZADO
                            </span>
                            {item.approvedBy && (
                              <span className="text-[9px] text-stone-400 block">
                                Por {item.approvedBy}
                              </span>
                            )}
                          </div>
                        )}

                        {isPending && (
                          <div className="space-y-0.5">
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px] flex items-center gap-1 w-max border border-amber-300 animate-pulse">
                              <Clock className="w-3 h-3" />
                              PENDIENTE REVISIÓN
                            </span>
                            <span className="text-[9px] text-amber-800 block">
                              Esperando validación
                            </span>
                          </div>
                        )}

                        {isRejected && (
                          <div className="space-y-0.5">
                            <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 font-extrabold text-[10px] flex items-center gap-1 w-max border border-rose-200">
                              <AlertCircle className="w-3 h-3" />
                              RECHAZADO
                            </span>
                            {item.rejectionReason && (
                              <span className="text-[9px] text-rose-600 block line-clamp-1 max-w-[140px]" title={item.rejectionReason}>
                                {item.rejectionReason}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Column 7: Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          
                          {/* Ver Expediente Completo */}
                          <button
                            type="button"
                            onClick={() => setSelectedDossier(item)}
                            className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            title="Ver fotos y expediente completo"
                          >
                            <FileText className="w-3.5 h-3.5 text-stone-600" />
                            <span>Expediente</span>
                          </button>

                          {/* Super Admin: Ingresar a Administrar Tienda */}
                          {item.accountType === 'STORE' && (
                            <button
                              type="button"
                              onClick={() => {
                                const targetStoreId = item.storeId || stores.find(s => s.email.toLowerCase() === item.email.toLowerCase() || s.name.toLowerCase() === item.storeName?.toLowerCase())?.id;
                                if (targetStoreId) {
                                  adminImpersonateStore(targetStoreId);
                                } else {
                                  showNotification('No se encontró la tienda vinculada', 'error');
                                }
                              }}
                              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                              title={`Ingresar a configurar la tienda ${item.storeName || item.name}`}
                            >
                              <Store className="w-3.5 h-3.5" />
                              <span>Administrar</span>
                            </button>
                          )}

                          {/* Autorizar Cuenta Directa */}
                          {!isApproved && (
                            <button
                              type="button"
                              disabled={actionLoadingId === item.id}
                              onClick={() => handleApproveUser(item)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs disabled:opacity-50"
                              title="Aprobar y autorizar acceso a esta cuenta"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{actionLoadingId === item.id ? 'Autorizando...' : 'Autorizar'}</span>
                            </button>
                          )}

                          {/* Rechazar Documentación */}
                          {!isRejected && (
                            <button
                              type="button"
                              onClick={() => setRejectModal({ open: true, item, reason: 'Foto de cédula ilegible o no coincide con el titular' })}
                              className="px-2 py-1.5 bg-stone-50 hover:bg-rose-50 text-stone-600 hover:text-rose-700 border border-stone-200 hover:border-rose-300 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                              title="Rechazar documentación"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Consultar Código Auxiliar */}
                          <button
                            type="button"
                            onClick={() => handleConsultCode(item)}
                            className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition-colors cursor-pointer"
                            title="Consultar código o reenviar correo"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

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

      {/* MODAL 1: EXPEDIENTE COMPLETO & COMPARATIVA DE CÉDULA */}
      {selectedDossier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-stone-200 animate-in fade-in duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-sm">
                  <ScanFace className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-stone-900 text-base">
                    Expediente de Identidad: {selectedDossier.name}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Inspección visual de Cédula Dominicana y Fotografía Biométrica
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDossier(null)}
                className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              
              {/* Document Photos Side-by-Side Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Foto Personal / Selfie */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-stone-800 text-xs flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      1. Fotografía Personal / Selfie
                    </span>
                    {selectedDossier.selfieUrl && (
                      <button
                        type="button"
                        onClick={() => setZoomImage({ url: selectedDossier.selfieUrl || selectedDossier.avatar || '', title: `Foto Personal - ${selectedDossier.name}` })}
                        className="text-[10px] font-bold text-red-600 hover:underline flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Ampliar
                      </button>
                    )}
                  </div>

                  <div className="h-64 rounded-2xl bg-stone-100 border-2 border-stone-200 overflow-hidden flex items-center justify-center relative group">
                    {selectedDossier.selfieUrl || selectedDossier.avatar ? (
                      <img 
                        src={selectedDossier.selfieUrl || selectedDossier.avatar} 
                        alt="Selfie" 
                        className="w-full h-full object-contain cursor-pointer" 
                        onClick={() => setZoomImage({ url: selectedDossier.selfieUrl || selectedDossier.avatar || '', title: `Foto Personal - ${selectedDossier.name}` })}
                      />
                    ) : (
                      <div className="text-center p-4 text-stone-400 space-y-1">
                        <User className="w-10 h-10 mx-auto text-stone-300" />
                        <p className="font-semibold text-xs">No se adjuntó selfie</p>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-stone-400 block text-center">
                    Fotografía del titular para prueba de vida y coincidencia facial
                  </span>
                </div>

                {/* 2. Foto de Cédula Dominicana */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-stone-800 text-xs flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-red-600" />
                      2. Cédula Dominicana Frontal
                    </span>
                    {selectedDossier.cedulaFrontUrl && (
                      <button
                        type="button"
                        onClick={() => setZoomImage({ url: selectedDossier.cedulaFrontUrl || '', title: `Cédula Dominicana - ${selectedDossier.name}` })}
                        className="text-[10px] font-bold text-red-600 hover:underline flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Ampliar
                      </button>
                    )}
                  </div>

                  <div className="h-64 rounded-2xl bg-stone-100 border-2 border-stone-200 overflow-hidden flex items-center justify-center relative group">
                    {selectedDossier.cedulaFrontUrl ? (
                      <img 
                        src={selectedDossier.cedulaFrontUrl} 
                        alt="Cédula" 
                        className="w-full h-full object-contain cursor-pointer" 
                        onClick={() => setZoomImage({ url: selectedDossier.cedulaFrontUrl || '', title: `Cédula Dominicana - ${selectedDossier.name}` })}
                      />
                    ) : (
                      <div className="text-center p-4 text-stone-400 space-y-1">
                        <FileText className="w-10 h-10 mx-auto text-stone-300" />
                        <p className="font-semibold text-xs">No se adjuntó foto de cédula</p>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-stone-400 block text-center">
                    Documento oficial de identidad para validación de datos
                  </span>
                </div>

              </div>

              {/* Identity Details Card */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-3">
                <h4 className="font-black text-stone-900 text-xs uppercase tracking-wider">
                  Datos Registrados del Titular
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-stone-400 text-[10px] block font-bold">Nombre Completo:</span>
                    <span className="font-bold text-stone-900">{selectedDossier.name}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] block font-bold">Número de Cédula:</span>
                    <span className="font-bold font-mono text-stone-900 bg-white px-2 py-0.5 rounded border border-stone-200">
                      {selectedDossier.cedulaNumber || 'No registrada'}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] block font-bold">Tipo de Cuenta:</span>
                    <span className="font-bold text-stone-800">
                      {selectedDossier.accountType === 'STORE' ? `Tienda (${selectedDossier.storeName || ''})` : 'Cliente Comprador'}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] block font-bold">Correo Electrónico:</span>
                    <span className="font-mono text-stone-800">{selectedDossier.email}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] block font-bold">Teléfono / WhatsApp:</span>
                    <span className="font-mono text-stone-800">{selectedDossier.phone || 'No registrado'}</span>
                  </div>
                  <div>
                    <span className="text-stone-400 text-[10px] block font-bold">Fecha de Registro:</span>
                    <span className="text-stone-800">
                      {new Date(selectedDossier.registeredAt).toLocaleString('es-DO')}
                    </span>
                  </div>
                </div>

                {selectedDossier.rejectionReason && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                    <span className="font-bold">Motivo de rechazo actual: </span>
                    <span>{selectedDossier.rejectionReason}</span>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-stone-500">
                Estado: <strong>{selectedDossier.adminApprovalStatus || 'PENDING'}</strong>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {selectedDossier.accountType === 'STORE' && (
                  <button
                    type="button"
                    onClick={() => {
                      const targetStoreId = selectedDossier.storeId || stores.find(s => s.email.toLowerCase() === selectedDossier.email.toLowerCase() || s.name.toLowerCase() === selectedDossier.storeName?.toLowerCase())?.id;
                      if (targetStoreId) {
                        setSelectedDossier(null);
                        adminImpersonateStore(targetStoreId);
                      } else {
                        showNotification('No se encontró la tienda vinculada', 'error');
                      }
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    title="Ingresar como Administrador para configurar esta tienda"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Administrar Tienda</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setRejectModal({ open: true, item: selectedDossier, reason: 'Foto de cédula ilegible o no coincide con los datos del titular' });
                  }}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>Rechazar Documentos</span>
                </button>

                <button
                  type="button"
                  disabled={actionLoadingId === selectedDossier.id}
                  onClick={() => handleApproveUser(selectedDossier)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>{actionLoadingId === selectedDossier.id ? 'Autorizando...' : 'Autorizar Esta Cuenta'}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: ZOOM DE IMAGEN EN ALTA RESOLUCIÓN */}
      {zoomImage && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <h4 className="font-bold text-sm">{zoomImage.title}</h4>
              <div className="flex items-center gap-2">
                <a
                  href={zoomImage.url}
                  download="documento-plazado.jpg"
                  className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar
                </a>
                <button
                  onClick={() => setZoomImage(null)}
                  className="p-1.5 text-stone-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="w-full h-full max-h-[80vh] flex items-center justify-center overflow-auto rounded-2xl bg-stone-900 border border-stone-800 p-2">
              <img src={zoomImage.url} alt="Zoom" className="max-w-full max-h-[78vh] object-contain rounded-xl" />
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RECHAZAR DOCUMENTACIÓN CON MOTIVO */}
      {rejectModal.open && rejectModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-600 font-black text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>Rechazar Documentación</span>
            </div>

            <p className="text-xs text-stone-600">
              Indica la razón por la que no se autorizan los documentos de <strong>{rejectModal.item.name}</strong>. Esto quedará registrado en el historial de auditoría del Super Admin.
            </p>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Motivo del Rechazo:</label>
              <textarea
                rows={3}
                value={rejectModal.reason}
                onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-rose-500"
                placeholder="Ej: Foto de cédula borrosa, documento vencido o nombre no coincide..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModal({ open: false, item: null, reason: '' })}
                className="px-3.5 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={executeRejectUser}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CREAR NUEVO SUPER ADMINISTRADOR */}
      {createAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center font-black">
                  🛡️
                </div>
                <div>
                  <h3 className="font-black text-stone-900 text-sm">
                    Crear Nuevo Super Administrador
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Acceso total administrativo a la plataforma PlazaDO
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCreateAdminModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdminSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Ej: Lic. Carlos Santos"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Correo Electrónico Oficial *</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin.segundo@plazado.com"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-stone-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Teléfono / Celular</label>
                <input
                  type="tel"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="809-555-0199"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-stone-900 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Contraseña *</label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Confirmar *</label>
                  <input
                    type="password"
                    required
                    value={adminConfirmPass}
                    onChange={(e) => setAdminConfirmPass(e.target.value)}
                    placeholder="Repetir contraseña"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                <span className="font-bold">⚠️ Permiso Máximo: </span>
                Este usuario tendrá acceso completo al Super Admin (tiendas, finanzas, métricas, pasarelas de pago y validación de usuarios).
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateAdminModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingAdminLoading}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creatingAdminLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{creatingAdminLoading ? 'Creando...' : 'Crear Super Administrador'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: CONSULTA DE CÓDIGO AUXILIAR */}
      {consultModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-stone-900 text-sm flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-red-600" />
                <span>Consulta Administrativa</span>
              </h3>
              <button
                onClick={() => setConsultModal(prev => ({ ...prev, open: false }))}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-stone-900">{consultModal.name}</p>
              <p className="text-[11px] font-mono text-stone-500">{consultModal.email}</p>
            </div>

            {consultModal.loading ? (
              <div className="py-6 text-center">
                <RefreshCw className="w-6 h-6 text-red-600 animate-spin mx-auto" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-stone-100 rounded-xl text-center space-y-1 border border-stone-200">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">Código Generado:</span>
                  <div className="font-mono text-2xl font-black text-stone-900 tracking-widest">
                    {consultModal.code || 'NO ASIGNADO'}
                  </div>
                </div>

                {consultModal.code && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(consultModal.code || '')}
                    className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? '¡Copiado!' : 'Copiar Código'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
