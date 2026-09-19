import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldAlert, 
  Store, 
  DollarSign, 
  AlertTriangle, 
  Settings, 
  Layers, 
  Activity, 
  Check, 
  X, 
  CreditCard, 
  FileText,
  Trash2,
  Users,
  ShoppingBag,
  Package,
  Search,
  Filter,
  Sparkles,
  Edit,
  Clock,
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  ExternalLink,
  Calendar,
  Inbox,
  Pause,
  Play,
  Eye
} from 'lucide-react';
import { Dispute, Settlement, UserRole, OrderStatus, Store as StoreType, User as UserType, isStorePubliclyVisible } from '../../types';
import { StoreProfileModal } from '../common/StoreProfileModal';

export const AdminDashboard: React.FC = () => {
  const { 
    currentUser, 
    stores, 
    orders, 
    products,
    allUsers,
    settlements, 
    storeBalances,
    disputes, 
    auditLogs, 
    banners, 
    categories, 
    systemSettings, 
    adminActiveTab,
    setAdminActiveTab,
    setCurrentView,
    setSelectedStoreSlug,
    updateStoreStatus,
    updateStoreDetails,
    updateProduct,
    deleteStore,
    deleteProduct,
    deleteOrder,
    deleteUser,
    deleteSettlement,
    deleteDispute,
    deleteAuditLog,
    clearAllAuditLogs,
    deleteBanner,
    deleteCategory,
    processSettlement,
    resolveDispute, 
    updateSystemSettings,
    cleanTestProducts,
    purgeRecordsByType,
    showNotification
  } = useApp();

  const activeTab = adminActiveTab;
  const setActiveTab = setAdminActiveTab;

  // Universal Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    typeLabel: string;
    title: string;
    recordId: string;
    description: string;
    action: () => void;
  } | null>(null);

  // Settlement payout modal state
  const [payingSettlement, setPayingSettlement] = useState<Settlement | null>(null);
  const [bankRefInput, setBankRefInput] = useState('');
  const [editingStore, setEditingStore] = useState<StoreType | null>(null);

  // Store rejection modal state
  const [rejectingStore, setRejectingStore] = useState<StoreType | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Dispute resolution modal state
  const [resolvingDispute, setResolvingDispute] = useState<Dispute | null>(null);
  const [disputeResolutionNote, setDisputeResolutionNote] = useState('');
  const [disputeResolutionStatus, setDisputeResolutionStatus] = useState<'RESOLVED' | 'CLOSED'>('RESOLVED');

  // Settings form state
  const [defaultCommRate, setDefaultCommRate] = useState(systemSettings.defaultCommissionRate * 100);
  const [whatsappComm, setWhatsappComm] = useState(systemSettings.whatsappCommercial);
  const [rncVal, setRncVal] = useState(systemSettings.rnc);
  const [businessName, setBusinessName] = useState(systemSettings.legalBusinessName);

  // Search & Filter States
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderStoreFilter, setOrderStoreFilter] = useState<string>('all');

  const [productSearch, setProductSearch] = useState('');
  const [productStoreFilter, setProductStoreFilter] = useState<string>('all');

  const [storeSearch, setStoreSearch] = useState('');
  const [storeStatusFilter, setStoreStatusFilter] = useState<string>('all');

  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');

  // Metrics
  const totalMarketplaceGross = orders.reduce((acc, o) => acc + o.total, 0);
  const totalPlazaCommissionEarned = orders.reduce((acc, o) => acc + o.plazaCommissionAmount, 0);
  const totalEscrowHeld = Object.values(storeBalances).reduce((acc, b) => acc + (b.pendingBalance || 0), 0);
  const pendingStoreRequests = stores.filter(s => s.status === 'PENDING' || s.status === 'IN_REVIEW');
  const activeStores = stores.filter(s => s.status === 'APPROVED');
  const pendingSettlements = settlements.filter(s => s.status === 'PENDING' || s.status === 'SCHEDULED');
  const openDisputes = disputes.filter(d => d.status === 'OPEN' || d.status === 'UNDER_REVIEW');

  // Filtered Lists
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.storeName.toLowerCase().includes(orderSearch.toLowerCase());
    const matchesStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    const matchesStore = orderStoreFilter === 'all' || o.storeId === orderStoreFilter;
    return matchesSearch && matchesStatus && matchesStore;
  });

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.categoryId.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(productSearch.toLowerCase()));
    const matchesStore = productStoreFilter === 'all' || p.storeId === productStoreFilter;
    return matchesSearch && matchesStore;
  });

  const filteredStores = stores.filter(st => {
    const q = storeSearch.trim().toLowerCase();
    const name = (st.name || '').toLowerCase();
    const owner = (st.ownerName || '').toLowerCase();
    const email = (st.email || '').toLowerCase();
    const rnc = (st.bankInfo?.rncOrCedula || '').toLowerCase();
    const province = (st.province || '').toLowerCase();
    const slug = (st.slug || '').toLowerCase();

    const matchesSearch = !q || name.includes(q) || owner.includes(q) || email.includes(q) || rnc.includes(q) || province.includes(q) || slug.includes(q);
    const matchesStatus = storeStatusFilter === 'all' || st.status === storeStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.phone && u.phone.includes(userSearch));
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const handlePaySettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingSettlement || !bankRefInput.trim()) return;

    processSettlement(payingSettlement.id, 'PAID', bankRefInput.trim());
    showNotification(`Liquidación ${payingSettlement.id} confirmada con ref: ${bankRefInput.trim()}`);
    setPayingSettlement(null);
    setBankRefInput('');
  };

  const handleResolveDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingDispute) return;

    resolveDispute(
      resolvingDispute.id, 
      disputeResolutionStatus,
      disputeResolutionNote
    );
    showNotification(`Disputa #${resolvingDispute.id} resuelta.`);
    setResolvingDispute(null);
    setDisputeResolutionNote('');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSystemSettings({
      defaultCommissionRate: Number(defaultCommRate) / 100,
      whatsappCommercial: whatsappComm,
      rnc: rncVal,
      legalBusinessName: businessName
    });
    showNotification('Configuración global de PlazaDO.com guardada.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Super Admin Masthead with High-Privilege Notice */}
      <div className="bg-stone-900 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 bg-red-600 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-white" />
            </span>
            <h1 className="text-xl font-extrabold tracking-tight">Super Administrador PlazaDO.com</h1>
            <span className="bg-red-500/30 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/40">
              ACCESO MAESTRO CON PERMISOS TOTALES
            </span>
          </div>
          <p className="text-xs text-stone-300 mt-1.5 max-w-2xl">
            Control de infraestructura, custodia fiduciaria escrow y arbitraje legal. Como Super Usuario tienes autorización plena para editar o <strong>borrar permanentemente cualquier registro</strong> realizado en la plataforma con trazabilidad en bitácora.
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-stone-400">Sesión activa:</span>
            <span className="font-bold text-white bg-stone-800 px-2.5 py-1 rounded-lg border border-stone-700">{currentUser?.name || 'Super Admin'}</span>
          </div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Auditoría de acciones activada
          </span>
        </div>
      </div>

      {/* Banner de Solicitudes Pendientes para Super Admin */}
      {pendingStoreRequests.length > 0 && activeTab !== 'solicitudes' && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 border-2 border-amber-300/90 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm text-stone-900">
                  {pendingStoreRequests.length} Solicitud{pendingStoreRequests.length > 1 ? 'es' : ''} de Tienda Pendiente{pendingStoreRequests.length > 1 ? 's' : ''} de Aprobación
                </h3>
                <span className="bg-amber-200 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Acción Requerida
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-0.5">
                Nuevos comercios dominicanos han enviado su registro y están esperando la aprobación de Super Admin para activar su vitrina.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('solicitudes')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0 shadow-xs flex items-center gap-1.5"
          >
            <span>Revisar Solicitudes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-stone-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'metrics' ? 'bg-red-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Métricas</span>
        </button>

        <button
          onClick={() => setActiveTab('solicitudes')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 relative ${
            activeTab === 'solicitudes' ? 'bg-red-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Solicitudes</span>
          {pendingStoreRequests.length > 0 ? (
            <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
              activeTab === 'solicitudes' ? 'bg-white text-red-600' : 'bg-amber-500 text-stone-950 animate-pulse'
            }`}>
              {pendingStoreRequests.length}
            </span>
          ) : (
            <span className="text-[10px] opacity-60">(0)</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('stores')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'stores' ? 'bg-red-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Tiendas ({stores.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'orders' ? 'bg-red-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Pedidos ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'products' ? 'bg-red-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Productos ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'users' ? 'bg-red-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuarios ({allUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settlements')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'settlements' ? 'bg-red-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Liquidaciones ({settlements.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('disputes')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'disputes' ? 'bg-red-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Disputas ({disputes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('content')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'content' ? 'bg-red-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Banners & Categorías</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'settings' ? 'bg-red-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configuración & Purgas</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'audit' ? 'bg-red-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Auditoría ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: MÉTRICAS GLOBALES */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Ventas Totales Brutas</span>
              <div className="text-2xl font-black text-stone-900 mt-1">
                RD$ {totalMarketplaceGross.toLocaleString()}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Suma bruta de transacciones procesadas</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Comisiones PlazaDO (5%)</span>
              <div className="text-2xl font-black text-red-600 mt-1">
                RD$ {totalPlazaCommissionEarned.toLocaleString()}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Ingresos netos por servicio de intermediación</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Fondos en Custodia (Escrow)</span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                RD$ {totalEscrowHeld.toLocaleString()}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Retenidos hasta validación con código de entrega</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Tiendas Afiliadas</span>
              <div className="text-2xl font-black text-stone-900 mt-1">
                {activeStores.length} activas
              </div>
              <p className="text-[11px] text-stone-500 mt-1">{pendingStoreRequests.length} pendientes de revisión</p>
            </div>

          </div>

          {/* Configuration Status Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-3">
              <h3 className="font-bold text-sm text-stone-900">Pasarela de Pagos AZUL (Banco Popular)</h3>
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-600">Estado de Pasarela:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Operativa (Sandbox & Prod)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Merchant ID Afiliado:</span>
                  <span className="font-semibold text-stone-800 font-mono">{systemSettings.azulConfig.merchantId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Cuenta Concentradora:</span>
                  <span className="font-semibold text-stone-800">Banco Popular Dominicano • Cuenta Fiduciaria</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-3">
              <h3 className="font-bold text-sm text-stone-900">Protocolo de Custodia y Envíos</h3>
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-600">Modelo Logístico:</span>
                  <span className="font-bold text-stone-800">Despacho Descentralizado por Tienda</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Liberación de Fondos:</span>
                  <span className="font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">Validación por Código Secreto (6 dígitos)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Cobertura:</span>
                  <span className="font-semibold text-stone-800">32 Provincias de la República Dominicana</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SOLICITUDES DE TIENDAS PENDIENTES DE APROBACIÓN */}
      {activeTab === 'solicitudes' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-stone-900">Solicitudes de Registro de Tiendas</h2>
                <span className="bg-amber-100 text-amber-900 font-extrabold text-xs px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {pendingStoreRequests.length} pendiente{pendingStoreRequests.length === 1 ? '' : 's'} de aprobación
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Comercios y emprendedores dominicanos registrados en espera de evaluación y autorización por el Super Administrador
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('stores')}
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Directorio de Tiendas ({stores.length})</span>
              </button>
            </div>
          </div>

          {pendingStoreRequests.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center shadow-2xs space-y-4 max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-stone-900">
                  No hay solicitudes pendientes de aprobación
                </h3>
                <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
                  Todas las solicitudes de registro han sido procesadas. Cuando una tienda se registre a través del formulario público "Vender en PlazaDO", su expediente comercial aparecerá inmediatamente aquí para tu revisión y aprobación.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setActiveTab('stores')}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2 shadow-xs"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Ver Tiendas Registradas ({stores.length})</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-900">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  Hay <strong>{pendingStoreRequests.length} solicitud{pendingStoreRequests.length > 1 ? 'es' : ''}</strong> esperando tu revisión. Al pulsar <strong>"Aprobar Tienda"</strong>, el comercio queda activado de inmediato en PlazaDO y sus productos serán visibles en la tienda pública.
                </span>
              </div>

              <div className="grid grid-cols-1 gap-5">
                {pendingStoreRequests.map(st => {
                  const categoryName = categories.find(c => c.id === st.categoryId)?.name || st.categoryId;
                  return (
                    <div
                      key={st.id}
                      className="bg-white rounded-2xl border-2 border-amber-200/90 hover:border-amber-400 p-6 shadow-xs transition-all space-y-5"
                    >
                      {/* Solicitud Header */}
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                        <div className="flex items-center gap-4">
                          {st.logo ? (
                            <img
                              src={st.logo}
                              alt={st.name}
                              className="w-16 h-16 rounded-2xl object-cover border border-stone-200 shrink-0 shadow-2xs"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-2xs">
                              {st.name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="space-y-1">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h3 className="text-lg font-black text-stone-900">{st.name}</h3>
                              <span className="bg-amber-100 text-amber-900 font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                SOLICITUD PENDIENTE
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-stone-400">ID: {st.id}</span>
                              <span>•</span>
                              <span>Slug: <code className="font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">/tienda/{st.slug}</code></span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-stone-600">
                                <Calendar className="w-3 h-3 text-stone-400" />
                                Registrada el: {new Date(st.createdAt).toLocaleString('es-DO', { dateStyle: 'medium', timeStyle: 'short' })}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Top Direct Actions */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            onClick={() => updateStoreStatus(st.id, 'APPROVED')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                            title="Aprobar tienda y habilitar en PlazaDO"
                          >
                            <Check className="w-4 h-4" />
                            <span>Aprobar Tienda</span>
                          </button>

                          <button
                            onClick={() => {
                              setRejectingStore(st);
                              setRejectionReasonInput('');
                            }}
                            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                            title="Rechazar solicitud"
                          >
                            <X className="w-4 h-4" />
                            <span>Rechazar</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedStoreSlug(st.slug || st.id);
                              setCurrentView('store_public');
                            }}
                            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            title="Previsualizar cómo se ve la tienda en PlazaDO"
                          >
                            <Eye className="w-3.5 h-3.5 text-stone-600" />
                            <span>Previsualizar</span>
                          </button>

                          <button
                            onClick={() => setEditingStore(st)}
                            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                            title="Editar datos o logo de la tienda"
                          >
                            <Edit className="w-3.5 h-3.5 text-stone-600" />
                            <span>Editar</span>
                          </button>

                          <button
                            onClick={() => setDeleteModal({
                              typeLabel: 'SOLICITUD DE TIENDA',
                              title: `Descartar Solicitud: ${st.name}`,
                              recordId: st.id,
                              description: `Esta acción descartará y eliminará permanentemente la solicitud de registro del comercio "${st.name}" de la base de datos.`,
                              action: () => deleteStore(st.id)
                            })}
                            className="p-2 hover:bg-rose-50 text-stone-400 hover:text-rose-600 rounded-xl transition-colors"
                            title="Descartar solicitud"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Solicitud Expediente 3-Column Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        {/* Column 1: Contacto & Representante */}
                        <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-2.5">
                          <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5 uppercase tracking-wide text-[11px] text-stone-700">
                            <Users className="w-3.5 h-3.5 text-red-600" />
                            <span>Representante & Contacto</span>
                          </h4>
                          <div className="space-y-1.5 text-stone-600">
                            <div>
                              <span className="text-stone-400 block text-[10px] font-bold uppercase">Propietario / Gestor:</span>
                              <span className="font-bold text-stone-800">{st.ownerName}</span>
                            </div>
                            <div>
                              <span className="text-stone-400 block text-[10px] font-bold uppercase">Correo de Acceso:</span>
                              <a href={`mailto:${st.email}`} className="text-red-600 hover:underline font-medium flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {st.email}
                              </a>
                            </div>
                            <div>
                              <span className="text-stone-400 block text-[10px] font-bold uppercase">Teléfono / WhatsApp:</span>
                              <span className="font-medium text-stone-800 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-emerald-600" />
                                {st.whatsapp || st.phone || 'No especificado'}
                              </span>
                            </div>
                            <div>
                              <span className="text-stone-400 block text-[10px] font-bold uppercase">Ubicación Geográfica:</span>
                              <span className="text-stone-700 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-stone-400" />
                                {st.municipality}, {st.province}
                              </span>
                              {st.address && <p className="text-[11px] text-stone-500 mt-0.5">{st.address}</p>}
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Comercial & Envíos */}
                        <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-2.5">
                          <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5 uppercase tracking-wide text-[11px] text-stone-700">
                            <Store className="w-3.5 h-3.5 text-amber-600" />
                            <span>Categoría & Logística</span>
                          </h4>
                          <div className="space-y-1.5 text-stone-600">
                            <div>
                              <span className="text-stone-400 block text-[10px] font-bold uppercase">Categoría Principal:</span>
                              <span className="font-bold text-stone-800 bg-stone-200/70 px-2 py-0.5 rounded text-[11px]">
                                {categoryName}
                              </span>
                            </div>
                            <div>
                              <span className="text-stone-400 block text-[10px] font-bold uppercase">Tarifa de Envío:</span>
                              <span className="font-bold text-stone-900">
                                {st.shippingConfig?.fixedRate ? `RD$ ${st.shippingConfig.fixedRate.toLocaleString()}` : 'Envío Gratis'}
                              </span>
                            </div>
                            <div>
                              <span className="text-stone-400 block text-[10px] font-bold uppercase">Tiempo de Entrega Estimado:</span>
                              <span className="text-stone-800 font-medium">
                                {st.shippingConfig?.estimatedDays || '24 a 48 horas'}
                              </span>
                            </div>
                            <div>
                              <span className="text-stone-400 block text-[10px] font-bold uppercase">Cobertura declarada:</span>
                              <span className="text-stone-700 text-[11px]">
                                {st.shippingConfig?.coverageProvinces && st.shippingConfig.coverageProvinces.length > 0 
                                  ? `${st.shippingConfig.coverageProvinces.length} provincia(s)` 
                                  : `${st.province} y nacional`}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Column 3: Datos Fiduciarios & Bancarios */}
                        <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-2.5">
                          <h4 className="font-bold text-stone-900 text-xs flex items-center gap-1.5 uppercase tracking-wide text-[11px] text-stone-700">
                            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                            <span>Liquidación & Datos Fiscales (RD)</span>
                          </h4>
                          <div className="space-y-1.5 text-stone-600">
                            <div>
                              <span className="text-stone-400 block text-[10px] font-bold uppercase">RNC o Cédula:</span>
                              <span className="font-mono font-bold text-stone-900 bg-white px-1.5 py-0.5 rounded border border-stone-200">
                                {st.bankInfo?.rncOrCedula || 'Pendiente'}
                              </span>
                            </div>
                            <div>
                              <span className="text-stone-400 block text-[10px] font-bold uppercase">Entidad Bancaria:</span>
                              <span className="font-semibold text-stone-800">
                                {st.bankInfo?.bank || 'Banco Dominicano'}
                              </span>
                            </div>
                            <div>
                              <span className="text-stone-400 block text-[10px] font-bold uppercase">Titular & Tipo:</span>
                              <span className="text-stone-800">
                                {st.bankInfo?.accountHolder || st.ownerName} ({st.bankInfo?.accountType || 'CORRIENTE'})
                              </span>
                            </div>
                            <div>
                              <span className="text-stone-400 block text-[10px] font-bold uppercase">Número de Cuenta:</span>
                              <span className="font-mono text-stone-900 font-bold">
                                {st.bankInfo?.accountNumber || 'Pendiente de registrar'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Store Description if any */}
                      {st.description && (
                        <div className="p-3 bg-stone-50 rounded-xl text-xs text-stone-600 border border-stone-200">
                          <span className="font-bold text-stone-700 block text-[10px] uppercase mb-0.5">Descripción del Comercio:</span>
                          <p className="italic leading-relaxed">"{st.description}"</p>
                        </div>
                      )}

                      {/* Bottom Action bar */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-100">
                        <span className="text-[11px] text-stone-400">
                          Comisión estándar aplicable: <strong>5% sobre ventas netas</strong>
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setRejectingStore(st);
                              setRejectionReasonInput('');
                            }}
                            className="px-3.5 py-1.5 bg-stone-100 hover:bg-rose-50 hover:text-rose-700 text-stone-600 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Rechazar Solicitud</span>
                          </button>
                          <button
                            onClick={() => updateStoreStatus(st.id, 'APPROVED')}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            <span>Aprobar Tienda</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GESTIÓN DE TIENDAS */}
      {activeTab === 'stores' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-base font-bold text-stone-900">Directorio y Moderación de Tiendas</h2>
              <p className="text-xs text-stone-500">Supervisión completa, edición de perfiles, control de estado y moderación de comercios</p>
            </div>
            <span className="text-xs text-stone-500 bg-stone-100 px-3 py-1 rounded-full font-medium">
              {filteredStores.length} de {stores.length} tiendas
            </span>
          </div>

          {/* Filters Bar for Stores */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={storeSearch}
                onChange={(e) => setStoreSearch(e.target.value)}
                placeholder="Buscar por nombre, propietario, RNC, provincia o correo..."
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs outline-none focus:border-red-500"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={storeStatusFilter}
                onChange={(e) => setStoreStatusFilter(e.target.value)}
                className="p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-700 outline-none"
              >
                <option value="all">Todos los estados</option>
                <option value="PENDING">Pendientes ({pendingStoreRequests.length})</option>
                <option value="APPROVED">Aprobadas ({activeStores.length})</option>
                <option value="SUSPENDED">Suspendidas</option>
                <option value="REJECTED">Rechazadas</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
            {filteredStores.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400">
                No se encontraron tiendas con los criterios de búsqueda o filtro seleccionados.
              </div>
            ) : (
              <div className="divide-y divide-stone-200">
                {filteredStores.map(st => {
                  const bal = storeBalances[st.id] || { availableBalance: 0, pendingBalance: 0, totalSales: 0 };
                  const storeProductCount = products.filter(p => p.storeId === st.id).length;
                  return (
                    <div key={st.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {st.logo ? (
                          <img src={st.logo} alt="" className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-stone-100 text-stone-700 font-bold flex items-center justify-center shrink-0 border border-stone-200">
                            {st.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm text-stone-900">{st.name}</h3>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              st.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                              st.status === 'PENDING' || st.status === 'IN_REVIEW' ? 'bg-amber-100 text-amber-800' :
                              st.status === 'SUSPENDED' ? 'bg-rose-100 text-rose-800' : 
                              st.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-stone-100 text-stone-700'
                            }`}>
                              {st.status === 'PENDING' ? 'PENDIENTE DE APROBACIÓN' : st.status}
                            </span>
                            <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                              {storeProductCount} productos
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5">
                            RNC: {st.bankInfo?.rncOrCedula || 'N/A'} • Propietario: {st.ownerName} ({st.email}) • {st.province}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-stone-600 mt-1">
                            <span>Balance Disp: <strong>RD$ {bal.availableBalance.toLocaleString()}</strong></span>
                            <span>• En Custodia: RD$ {bal.pendingBalance.toLocaleString()}</span>
                            <span>• Ventas: RD$ {bal.totalSales.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions including Super Admin Approval & Delete */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {/* Super Admin Edit Store Profile & Logo */}
                        <button
                          onClick={() => setEditingStore(st)}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Editar perfil y logo de la tienda"
                        >
                          <Edit className="w-3.5 h-3.5 text-amber-600" />
                          <span>Editar Perfil</span>
                        </button>

                        {(st.status === 'PENDING' || st.status === 'IN_REVIEW') && (
                          <>
                            <button
                              onClick={() => updateStoreStatus(st.id, 'APPROVED')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Aprobar</span>
                            </button>
                            <button
                              onClick={() => {
                                setRejectingStore(st);
                                setRejectionReasonInput('');
                              }}
                              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Rechazar</span>
                            </button>
                          </>
                        )}

                        {st.status === 'APPROVED' && (
                          <button
                            onClick={() => updateStoreStatus(st.id, 'SUSPENDED', 'Suspensión administrativa')}
                            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-semibold"
                          >
                            Suspender
                          </button>
                        )}

                        {st.status === 'SUSPENDED' && (
                          <button
                            onClick={() => updateStoreStatus(st.id, 'APPROVED')}
                            className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-xs font-semibold"
                          >
                            Reactivar
                          </button>
                        )}

                        {/* View Public Store Page */}
                        <button
                          onClick={() => {
                            setSelectedStoreSlug(st.slug || st.id);
                            setCurrentView('store_public');
                          }}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Ver página pública de la tienda"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Tienda</span>
                        </button>

                        {/* Super Admin Delete Store Button */}
                        <button
                          onClick={() => setDeleteModal({
                            typeLabel: 'TIENDA & PUBLICACIONES',
                            title: `Eliminar Tienda: ${st.name}`,
                            recordId: st.id,
                            description: `Esta acción de Super Administrador borrará permanentemente la tienda "${st.name}", sus ${storeProductCount} publicaciones de productos asociadas y su registro de balance fiduciario de la base de datos de PlazaDO.`,
                            action: () => deleteStore(st.id)
                          })}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Borrar registro de tienda (Super Admin)"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          <span>Borrar Tienda</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: GESTIÓN DE PEDIDOS & ÓRDENES (SUPER ADMIN) */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-base font-bold text-stone-900">Historial Global de Pedidos y Órdenes</h2>
              <p className="text-xs text-stone-500">Supervisión centralizada de ventas en toda la República Dominicana con capacidad de eliminación directa</p>
            </div>
            <span className="text-xs text-stone-500 bg-stone-100 px-3 py-1 rounded-full font-medium">
              {filteredOrders.length} de {orders.length} pedidos
            </span>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Buscar por ID de pedido, cliente o tienda..."
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs outline-none focus:border-red-500"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-700 outline-none"
              >
                <option value="all">Todos los estados</option>
                <option value="PENDING">PENDING</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PREPARING">PREPARING</option>
                <option value="READY_FOR_PICKUP">READY_FOR_PICKUP</option>
                <option value="SHIPPED">SHIPPED</option>
                <option value="DELIVERED">DELIVERED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>

              <select
                value={orderStoreFilter}
                onChange={(e) => setOrderStoreFilter(e.target.value)}
                className="p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-700 outline-none max-w-[180px]"
              >
                <option value="all">Todas las tiendas</option>
                {stores.map(st => (
                  <option key={st.id} value={st.id}>{st.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Orders List */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400">
                No se encontraron pedidos con los criterios de búsqueda especificados.
              </div>
            ) : (
              <div className="divide-y divide-stone-200">
                {filteredOrders.map(order => (
                  <div key={order.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-stone-900 text-xs">#{order.id}</span>
                        <span className="text-xs font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded">
                          Tienda: {order.storeName}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                          order.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'PREPARING' || order.status === 'CONFIRMED' ? 'bg-amber-100 text-amber-800' :
                          order.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' : 'bg-stone-100 text-stone-700'
                        }`}>
                          {order.status}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {new Date(order.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-xs text-stone-600">
                        <strong>Cliente:</strong> {order.customerName} ({order.deliveryAddress?.phone || order.customerPhone}) • 
                        <span className="text-stone-500"> Destino: {order.deliveryAddress?.sector || 'Sector N/A'}, {order.deliveryAddress?.province || 'RD'}</span>
                      </div>

                      <div className="text-xs text-stone-500 flex items-center gap-2">
                        <span>Items: {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}</span>
                        {order.deliveryConfirmationCode && (
                          <span className="font-mono text-[10px] bg-stone-100 px-1.5 py-0.5 rounded font-bold text-stone-700">
                            Código: {order.deliveryConfirmationCode}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-base font-black text-stone-900">RD$ {order.total.toLocaleString()}</div>
                        <div className="text-[10px] text-stone-400">Comisión Plaza: RD$ {order.plazaCommissionAmount.toLocaleString()}</div>
                      </div>

                      <button
                        onClick={() => setDeleteModal({
                          typeLabel: 'REGISTRO DE PEDIDO',
                          title: `Eliminar Pedido #${order.id}`,
                          recordId: order.id,
                          description: `Esta acción de Super Administrador borrará permanentemente el registro del pedido #${order.id} por un total de RD$ ${order.total.toLocaleString()} de la tienda "${order.storeName}".`,
                          action: () => deleteOrder(order.id)
                        })}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="Borrar pedido (Super Admin)"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span>Borrar Pedido</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CATÁLOGO MAESTRO DE PRODUCTOS (SUPER ADMIN) */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-base font-bold text-stone-900">Catálogo Maestro de Productos</h2>
              <p className="text-xs text-stone-500">Moderación y depuración de productos en todas las tiendas afiliadas a PlazaDO</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => cleanTestProducts()}
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Limpiar publicaciones con palabras de prueba o flag test"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Limpiar Items de Prueba</span>
              </button>
              <span className="text-xs text-stone-500 bg-stone-100 px-3 py-1 rounded-full font-medium">
                {filteredProducts.length} de {products.length} productos
              </span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Buscar por nombre de producto o categoría..."
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs outline-none focus:border-red-500"
              />
            </div>

            <select
              value={productStoreFilter}
              onChange={(e) => setProductStoreFilter(e.target.value)}
              className="p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-700 outline-none max-w-[200px]"
            >
              <option value="all">Todas las tiendas</option>
              {stores.map(st => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(p => {
              const storeObj = stores.find(s => s.id === p.storeId);
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs flex flex-col justify-between">
                  <div className="p-4 space-y-3">
                    <div className="flex gap-3 items-start">
                      <img 
                        src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'} 
                        alt="" 
                        className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0" 
                      />
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                            {storeObj?.name || p.storeId}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            p.status === 'published' || p.status === 'active' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : p.status === 'paused'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : p.status === 'draft'
                              ? 'bg-stone-100 text-stone-600 border border-stone-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {p.status === 'published' || p.status === 'active' ? 'PUBLICADO' : 
                             p.status === 'paused' ? 'PAUSADO' : 
                             p.status === 'draft' ? 'BORRADOR' : p.status}
                          </span>
                          {p.isTestProduct && (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                              PRUEBA
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-xs text-stone-900 line-clamp-2">{p.name}</h4>
                        <div className="text-sm font-black text-stone-900">RD$ {p.price.toLocaleString()}</div>
                      </div>
                    </div>

                    <div className="text-[11px] text-stone-500 flex justify-between border-t border-stone-100 pt-2">
                      <span>Stock: <strong>{p.stock}</strong></span>
                      <span>Categoría: <strong>{p.categoryId}</strong></span>
                      <span>ID: <code className="text-[10px]">{p.id.slice(0, 8)}</code></span>
                    </div>
                  </div>

                  <div className="p-3 bg-stone-50 border-t border-stone-200 flex justify-between items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          const isPub = p.status === 'published' || p.status === 'active';
                          const newStatus = isPub ? 'paused' : 'published';
                          updateProduct(p.id, { status: newStatus });
                          showNotification(
                            newStatus === 'published' 
                              ? `Producto "${p.name}" activado en el catálogo global` 
                              : `Producto "${p.name}" pausado del catálogo público`
                          );
                        }}
                        className={`px-2 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 border transition-colors ${
                          p.status === 'published' || p.status === 'active'
                            ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                        }`}
                        title={p.status === 'published' || p.status === 'active' ? 'Pausar visibilidad pública' : 'Publicar en catálogo'}
                      >
                        {p.status === 'published' || p.status === 'active' ? (
                          <>
                            <Pause className="w-3 h-3 text-amber-600" />
                            <span>Pausar</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 text-emerald-600" />
                            <span>Publicar</span>
                          </>
                        )}
                      </button>
                    </div>

                    <button
                      onClick={() => setDeleteModal({
                        typeLabel: 'PRODUCTO DEL CATÁLOGO',
                        title: `Eliminar Producto: ${p.name}`,
                        recordId: p.id,
                        description: `Esta acción de Super Administrador borrará permanentemente "${p.name}" (RD$ ${p.price.toLocaleString()}) perteneciente a la tienda "${storeObj?.name || p.storeId}".`,
                        action: () => deleteProduct(p.id)
                      })}
                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                      title="Borrar producto del marketplace"
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                      <span>Borrar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: USUARIOS & CUENTAS REGISTRADAS (SUPER ADMIN) */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-base font-bold text-stone-900">Directorio de Usuarios y Clientes</h2>
              <p className="text-xs text-stone-500">Gestión de cuentas registradas en PlazaDO con facultad de borrado de perfiles</p>
            </div>
            <span className="text-xs text-stone-500 bg-stone-100 px-3 py-1 rounded-full font-medium">
              {filteredUsers.length} de {allUsers.length} usuarios
            </span>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Buscar por nombre, correo electrónico o teléfono..."
                className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs outline-none focus:border-red-500"
              />
            </div>

            <select
              value={userRoleFilter}
              onChange={(e) => setUserRoleFilter(e.target.value)}
              className="p-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-700 outline-none"
            >
              <option value="all">Todos los roles</option>
              <option value="CUSTOMER">Solo Clientes</option>
              <option value="STORE_OWNER">Solo Comercios (Store Owners)</option>
              <option value="SUPER_ADMIN">Super Administradores</option>
            </select>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
            <div className="divide-y divide-stone-200">
              {filteredUsers.map(usr => {
                const isCurrent = usr.id === currentUser?.id;
                const storeObj = usr.storeId ? stores.find(s => s.id === usr.storeId) : null;
                return (
                  <div key={usr.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-700 text-sm border border-stone-200 shrink-0">
                        {usr.avatar ? (
                          <img src={usr.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          usr.name.slice(0, 2).toUpperCase()
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-stone-900">{usr.name}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            usr.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800' :
                            usr.role === 'STORE_OWNER' ? 'bg-blue-100 text-blue-800' : 'bg-stone-100 text-stone-700'
                          }`}>
                            {usr.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : usr.role === 'STORE_OWNER' ? 'COMERCIO' : 'CLIENTE'}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                              TÚ (SESIÓN ACTUAL)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500">
                          {usr.email} • Tel: {usr.phone || 'No registrado'}
                          {storeObj && ` • Tienda: ${storeObj.name}`}
                        </p>
                        <p className="text-[11px] text-stone-400">
                          Direcciones registradas: {usr.addresses?.length || 0} • Registrado el {new Date(usr.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        disabled={isCurrent}
                        onClick={() => setDeleteModal({
                          typeLabel: 'CUENTA DE USUARIO',
                          title: `Eliminar Usuario: ${usr.name}`,
                          recordId: usr.id,
                          description: `Esta acción de Super Administrador borrará permanentemente la cuenta de "${usr.name}" (${usr.email}) con rol ${usr.role}.`,
                          action: () => deleteUser(usr.id)
                        })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                          isCurrent 
                            ? 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200' 
                            : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                        }`}
                        title={isCurrent ? 'No puedes eliminar tu propia cuenta en sesión' : 'Borrar usuario'}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span>{isCurrent ? 'Sesión Protegida' : 'Borrar Usuario'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: LIQUIDACIONES Y DESEMBOLSOS */}
      {activeTab === 'settlements' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-base font-bold text-stone-900">Liquidaciones y Desembolsos a Comercios</h2>
              <p className="text-xs text-stone-500">
                Autoriza pagos ACH, registra números de comprobante bancario y elimina solicitudes
              </p>
            </div>
            <span className="text-xs text-stone-500 bg-stone-100 px-3 py-1 rounded-full font-medium">
              {settlements.length} solicitudes
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs p-5">
            {settlements.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">No hay solicitudes de liquidación registradas.</p>
            ) : (
              <div className="divide-y divide-stone-100 text-xs">
                {settlements.map(s => (
                  <div key={s.id} className="py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-stone-900">{s.id}</span>
                        <span className="font-bold text-stone-800">Tienda: {s.storeName}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {s.status === 'PAID' ? 'PAGADO' : 'PENDIENTE DE DESEMBOLSO'}
                        </span>
                      </div>
                      <p className="text-stone-500 mt-1">
                        Método: {s.paymentMethodName} • Cuenta: {s.accountNumberMasked} • Solicitado el {new Date(s.createdAt).toLocaleDateString()}
                      </p>
                      {s.bankReference && (
                        <p className="text-[11px] font-mono text-emerald-700 mt-0.5">
                          Comprobante ACH: {s.bankReference} (Pagado: {s.paidAt ? new Date(s.paidAt).toLocaleDateString() : 'Hoy'})
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-base font-black text-stone-900">RD$ {s.netAmount.toLocaleString()}</span>
                        <span className="text-[10px] text-stone-400 block">Monto a Transferir</span>
                      </div>

                      {s.status === 'PENDING' && (
                        <button
                          onClick={() => setPayingSettlement(s)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Marcar Pagada</span>
                        </button>
                      )}

                      <button
                        onClick={() => setDeleteModal({
                          typeLabel: 'REGISTRO DE LIQUIDACIÓN',
                          title: `Eliminar Registro de Liquidación ${s.id}`,
                          recordId: s.id,
                          description: `Esta acción de Super Administrador borrará permanentemente la liquidación ${s.id} de la tienda "${s.storeName}" por valor de RD$ ${s.netAmount.toLocaleString()}.`,
                          action: () => deleteSettlement(s.id)
                        })}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors"
                        title="Borrar liquidación (Super Admin)"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Marcar Liquidación Pagada */}
      {payingSettlement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-stone-900 text-sm">Registrar Transferencia Bancaria ACH</h3>
            <p className="text-stone-600">
              Ingresa el número de referencia bancaria o confirmación ACH para la tienda <strong>{payingSettlement.storeName}</strong> por el monto neto de <strong>RD$ {payingSettlement.netAmount.toLocaleString()}</strong>.
            </p>

            <form onSubmit={handlePaySettlement} className="space-y-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Número de Referencia Bancaria / Comprobante *</label>
                <input
                  type="text"
                  required
                  value={bankRefInput}
                  onChange={(e) => setBankRefInput(e.target.value)}
                  placeholder="Ej: BPD-ACH-9823412"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg font-mono text-xs outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingSettlement(null)}
                  className="px-3 py-1.5 text-stone-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                >
                  Confirmar Pago y Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 7: DISPUTAS Y RECLAMACIONES */}
      {activeTab === 'disputes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-base font-bold text-stone-900">Mediación y Arbitraje de Reclamaciones</h2>
              <p className="text-xs text-stone-500">Revisa incidentes entre clientes y comercios para dictaminar soluciones o eliminar reclamaciones resueltas</p>
            </div>
            <span className="text-xs text-stone-500 bg-stone-100 px-3 py-1 rounded-full font-medium">
              {disputes.length} casos
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs p-5">
            {disputes.length === 0 ? (
              <p className="text-xs text-stone-400 py-6 text-center">No hay ninguna reclamación activa.</p>
            ) : (
              <div className="divide-y divide-stone-100 text-xs">
                {disputes.map(d => (
                  <div key={d.id} className="py-4 space-y-2">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-900">Caso #{d.id}</span>
                        <span className="font-semibold text-stone-800">Pedido: {d.orderId}</span>
                        <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[10px]">
                          {d.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-stone-400">{new Date(d.createdAt).toLocaleDateString()}</span>
                        <button
                          onClick={() => setDeleteModal({
                            typeLabel: 'CASO DE DISPUTA',
                            title: `Eliminar Caso de Reclamación #${d.id}`,
                            recordId: d.id,
                            description: `Esta acción de Super Administrador borrará permanentemente la reclamación #${d.id} correspondiente al pedido ${d.orderId}.`,
                            action: () => deleteDispute(d.id)
                          })}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors"
                          title="Borrar caso de disputa (Super Admin)"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                      <p className="font-semibold text-stone-900">
                        Cliente: {d.customerName} ({d.customerEmail}) • Tienda: {d.storeName}
                      </p>
                      <p className="text-stone-700"><strong>Motivo:</strong> {d.issueType}</p>
                      <p className="text-stone-600 italic">"{d.description}"</p>
                      {d.resolutionNotes && (
                        <p className="text-emerald-800 font-medium pt-1 border-t border-stone-200">
                          Dictamen: {d.resolutionNotes}
                        </p>
                      )}
                    </div>

                    {d.status !== 'RESOLVED' && d.status !== 'CLOSED' && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => setResolvingDispute(d)}
                          className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold"
                        >
                          Dictaminar Resolución
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Dictaminar Disputa */}
      {resolvingDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-stone-900 text-sm">Dictaminar Disputa #{resolvingDispute.id}</h3>
            
            <form onSubmit={handleResolveDispute} className="space-y-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Estado de Resolución</label>
                <select
                  value={disputeResolutionStatus}
                  onChange={(e) => setDisputeResolutionStatus(e.target.value as 'RESOLVED' | 'CLOSED')}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg outline-none"
                >
                  <option value="RESOLVED">Marcar Resuelta (Con acuerdo o reembolso)</option>
                  <option value="CLOSED">Cerrar Disputa (Sin acción posterior)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Notas del Dictamen y Justificación</label>
                <textarea
                  rows={3}
                  required
                  value={disputeResolutionNote}
                  onChange={(e) => setDisputeResolutionNote(e.target.value)}
                  placeholder="Explicación de la resolución basada en los términos de PlazaDO..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResolvingDispute(null)}
                  className="px-3 py-1.5 text-stone-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"
                >
                  Aplicar Resolución
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 8: BANNERS & CATEGORÍAS */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-stone-900">Banners Promocionales de Portada</h3>
                <p className="text-xs text-stone-500">Imágenes destacadas mostradas en la página de inicio</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {banners.map(b => (
                <div key={b.id} className="rounded-xl border border-stone-200 overflow-hidden bg-stone-50 flex flex-col justify-between">
                  <img src={b.imageUrl} alt="" className="w-full h-32 object-cover" />
                  <div className="p-3 flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-stone-900">{b.title}</h4>
                      <p className="text-stone-500">{b.subtitle}</p>
                    </div>
                    <button
                      onClick={() => setDeleteModal({
                        typeLabel: 'BANNER PUBLICITARIO',
                        title: `Eliminar Banner: ${b.title}`,
                        recordId: b.id,
                        description: `Esta acción de Super Administrador eliminará el banner publicitario "${b.title}".`,
                        action: () => deleteBanner(b.id)
                      })}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors"
                      title="Borrar banner"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="font-bold text-sm text-stone-900">Categorías Principales del Mercado Dominicano</h3>
              <p className="text-xs text-stone-500">Estructura taxonómica de productos en PlazaDO</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {categories.filter(c => !c.parentId).map(cat => (
                <div key={cat.id} className="p-3 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-stone-800 block">{cat.name}</span>
                    <span className="text-stone-400 text-[10px] font-mono">/{cat.slug}</span>
                  </div>
                  <button
                    onClick={() => setDeleteModal({
                      typeLabel: 'CATEGORÍA DE PRODUCTO',
                      title: `Eliminar Categoría: ${cat.name}`,
                      recordId: cat.id,
                      description: `Esta acción de Super Administrador eliminará la categoría "${cat.name}".`,
                      action: () => deleteCategory(cat.id)
                    })}
                    className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Borrar categoría"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: CONFIGURACIÓN GLOBAL & PURGA DE REGISTROS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-6 text-xs">
            <div>
              <h2 className="text-base font-bold text-stone-900">Parámetros Globales de PlazaDO.com</h2>
              <p className="text-stone-500">Configuración de comisiones, números comerciales y datos fiscales de la plataforma</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Comisión por Defecto sobre Ventas (%)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  step={0.5}
                  value={defaultCommRate}
                  onChange={(e) => setDefaultCommRate(Number(e.target.value))}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm font-bold outline-none"
                />
                <span className="text-[11px] text-stone-400 mt-1 block">Vigente: 5% comercial.</span>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">WhatsApp Comercial de Soporte</label>
                <input
                  type="text"
                  value={whatsappComm}
                  onChange={(e) => setWhatsappComm(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Razón Social Fiscal</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">RNC Corporativo</label>
                <input
                  type="text"
                  value={rncVal}
                  onChange={(e) => setRncVal(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg outline-none font-mono"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs shadow-xs"
              >
                Guardar Parámetros de Plataforma
              </button>
            </div>
          </form>

          {/* Super Admin Bulk Purge & Maintenance Section */}
          <div className="bg-white rounded-2xl border border-red-200 p-6 shadow-2xs space-y-4 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <h2 className="text-base font-bold text-stone-900">Mantenimiento y Purga Masiva de Registros</h2>
              </div>
              <p className="text-stone-500 mt-1">
                Herramientas exclusivas del Super Administrador para limpiar historiales, datos de prueba o tablas de la plataforma.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                <h4 className="font-bold text-stone-900">Purgar Todos los Pedidos ({orders.length})</h4>
                <p className="text-stone-500 text-[11px]">Elimina de la base de datos todos los registros históricos de pedidos.</p>
                <button
                  type="button"
                  onClick={() => setDeleteModal({
                    typeLabel: 'PURGA MASIVA DE PEDIDOS',
                    title: 'Eliminar Todos los Pedidos Registrados',
                    recordId: 'ALL_ORDERS',
                    description: `Esta acción purgará los ${orders.length} pedidos existentes en la plataforma. Es irreversible.`,
                    action: () => purgeRecordsByType('orders')
                  })}
                  className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purgar Pedidos</span>
                </button>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                <h4 className="font-bold text-stone-900">Limpiar Productos de Prueba</h4>
                <p className="text-stone-500 text-[11px]">Depura publicaciones creadas con propósitos de prueba en el catálogo.</p>
                <button
                  type="button"
                  onClick={() => cleanTestProducts()}
                  className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Limpiar Items Test</span>
                </button>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                <h4 className="font-bold text-stone-900">Purgar Disputas ({disputes.length})</h4>
                <p className="text-stone-500 text-[11px]">Elimina todas las reclamaciones y casos de arbitraje registrados.</p>
                <button
                  type="button"
                  onClick={() => setDeleteModal({
                    typeLabel: 'PURGA MASIVA DE DISPUTAS',
                    title: 'Eliminar Todos los Casos de Reclamaciones',
                    recordId: 'ALL_DISPUTES',
                    description: `Esta acción purgará las ${disputes.length} disputas del marketplace.`,
                    action: () => purgeRecordsByType('disputes')
                  })}
                  className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purgar Disputas</span>
                </button>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                <h4 className="font-bold text-stone-900">Purgar Liquidaciones ({settlements.length})</h4>
                <p className="text-stone-500 text-[11px]">Elimina las solicitudes y registros de transferencias ACH a tiendas.</p>
                <button
                  type="button"
                  onClick={() => setDeleteModal({
                    typeLabel: 'PURGA DE LIQUIDACIONES',
                    title: 'Eliminar Registros de Liquidaciones',
                    recordId: 'ALL_SETTLEMENTS',
                    description: `Esta acción purgará las ${settlements.length} liquidaciones guardadas.`,
                    action: () => purgeRecordsByType('settlements')
                  })}
                  className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purgar Liquidaciones</span>
                </button>
              </div>

              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                <h4 className="font-bold text-stone-900">Vaciar Bitácora de Auditoría ({auditLogs.length})</h4>
                <p className="text-stone-500 text-[11px]">Reinicia el registro de logs de eventos y actividades de la plataforma.</p>
                <button
                  type="button"
                  onClick={() => setDeleteModal({
                    typeLabel: 'PURGA DE AUDITORÍA',
                    title: 'Vaciar Bitácora Completa de Auditoría',
                    recordId: 'ALL_LOGS',
                    description: 'Esta acción eliminará todas las entradas históricas de la bitácora.',
                    action: () => clearAllAuditLogs()
                  })}
                  className="w-full py-2 bg-stone-200 hover:bg-red-50 hover:text-red-700 text-stone-700 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vaciar Bitácora</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: AUDITORÍA & LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-base font-bold text-stone-900">Bitácora de Auditoría del Sistema</h2>
              <p className="text-stone-500">Registros de transacciones, modificaciones y eliminaciones con IP y operador responsable</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDeleteModal({
                  typeLabel: 'BITÁCORA DE AUDITORÍA',
                  title: 'Vaciar Bitácora Completa',
                  recordId: 'ALL_LOGS',
                  description: 'Esta acción de Super Administrador vaciará todos los registros históricos de auditoría guardados.',
                  action: () => clearAllAuditLogs()
                })}
                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Vaciar todos los logs"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Vaciar Bitácora</span>
              </button>

              <span className="text-xs text-stone-500 bg-stone-100 px-3 py-1 rounded-full font-medium">
                {auditLogs.length} eventos
              </span>
            </div>
          </div>

          <div className="divide-y divide-stone-100 font-mono text-[11px]">
            {auditLogs.length === 0 ? (
              <p className="text-center py-6 text-stone-400">La bitácora de auditoría está vacía.</p>
            ) : (
              auditLogs.map(log => (
                <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-stone-400 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className="font-bold text-stone-800 shrink-0">{log.action}:</span>
                    <span className="text-stone-600 truncate">{log.affectedRecord}</span>
                    {log.newValue && <span className="text-stone-500 truncate">({log.newValue})</span>}
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-stone-400 text-[10px]">{log.userName} ({log.userRole})</span>
                    <button
                      onClick={() => deleteAuditLog(log.id)}
                      className="p-1 text-stone-300 hover:text-red-600 rounded transition-colors"
                      title="Borrar entrada individual de auditoría"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* UNIVERSAL DELETE CONFIRMATION MODAL */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs border border-red-200">
            <div className="flex items-center gap-2.5 text-red-600">
              <div className="p-2 bg-red-100 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-600 block">
                  [{deleteModal.typeLabel}] • AUTORIZACIÓN SUPER ADMIN
                </span>
                <h3 className="font-extrabold text-stone-900 text-sm">{deleteModal.title}</h3>
              </div>
            </div>

            <div className="p-3 bg-red-50/70 border border-red-100 rounded-xl space-y-1.5">
              <p className="text-stone-700 leading-relaxed font-medium">
                {deleteModal.description}
              </p>
              <p className="text-[11px] text-red-700 font-bold">
                ⚠️ Esta acción es irreversible y quedará registrada en la bitácora de auditoría bajo el usuario "{currentUser?.name || 'Administrador'}".
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteModal.action();
                  setDeleteModal(null);
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Sí, Borrar Registro</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Store Profile & Logo Modal */}
      {editingStore && (
        <StoreProfileModal
          store={editingStore}
          isOpen={Boolean(editingStore)}
          onClose={() => setEditingStore(null)}
        />
      )}

    </div>
  );
};
