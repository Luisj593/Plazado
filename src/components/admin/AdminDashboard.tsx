import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
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
  Eye,
  EyeOff,
  Palette,
  Database,
  RefreshCw,
  Megaphone,
  Smartphone,
  FileCheck,
  Key,
  KeyRound,
  FolderPlus,
  Plus,
  Upload,
  FolderTree,
  Sliders,
  LogIn,
  UserPlus,
  ScanFace
} from 'lucide-react';
import { Dispute, Settlement, UserRole, OrderStatus, Store as StoreType, User as UserType, Banner, isStorePubliclyVisible } from '../../types';
import { StoreProfileModal } from '../common/StoreProfileModal';
import { BrandingSettingsTab } from './BrandingSettingsTab';
import { PersistenceSettingsTab } from './PersistenceSettingsTab';
import { PaymentGatewaysTab } from './PaymentGatewaysTab';
import { AdvertisingManagementTab } from './AdvertisingManagementTab';
import { LegalDocsManagementTab } from './LegalDocsManagementTab';
import { AndroidAppManagementTab } from './AndroidAppManagementTab';
import { CreateCategoryModal } from './CreateCategoryModal';
import { CreateBannerModal } from './CreateBannerModal';
import { UserPasswordModal } from './UserPasswordModal';
import { AssignStoreAdminModal } from './AssignStoreAdminModal';
import { CategoriesAndSpecsManagement } from './CategoriesAndSpecsManagement';
import { FulfillmentAdminView, FulfillmentAdminTab } from './FulfillmentAdminView';
import { UserVerificationsTab } from './UserVerificationsTab';
import { 
  ShieldCheck,
  Warehouse,
  BarChart3,
  Scan,
  Box,
  Truck,
  RotateCcw,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

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
    paymentTransactions,
    financialAuditLogs,
    runWeeklySettlements,
    storageRequests,
    fulfillmentInventory,
    fulfillmentOrders,
    fulfillmentIncidences,
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
    showNotification,
    adminImpersonateStore,
    createSuperAdminUser
  } = useApp();

  const [createSuperAdminModalOpen, setCreateSuperAdminModalOpen] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminConfirmPassword, setNewAdminConfirmPassword] = useState('');
  const [creatingAdminLoading, setCreatingAdminLoading] = useState(false);

  const activeTab = adminActiveTab;
  const setActiveTab = setAdminActiveTab;

  const [fulfillmentSubTab, setFulfillmentSubTab] = useState<FulfillmentAdminTab>('overview');
  const [isFulfillmentMenuExpanded, setIsFulfillmentMenuExpanded] = useState<boolean>(true);

  // Fulfillment KPI counts for sidebar badges
  const totalPhysicalAll = (fulfillmentInventory || []).reduce((sum, i) => sum + (i.totalPhysical || 0), 0);
  const pendingRequestsCount = (storageRequests || []).filter(r => r.status === 'PENDING_APPROVAL' || r.status === 'CREATED').length;
  const pendingConfirmationOrdersCount = (fulfillmentOrders || []).filter(o => o.status === 'PENDING_STORE_CONFIRMATION').length;
  const readyForPickingOrdersCount = (fulfillmentOrders || []).filter(o => o.status === 'CONFIRMED_BY_STORE' || o.status === 'PICKING_IN_PROGRESS').length;
  const readyForPackingOrdersCount = (fulfillmentOrders || []).filter(o => o.status === 'PICKING_COMPLETED' || o.status === 'PACKING_IN_PROGRESS').length;
  const readyForDispatchOrdersCount = (fulfillmentOrders || []).filter(o => o.status === 'PACKED' || o.status === 'READY_FOR_DISPATCH').length;
  const openIncidencesCount = (fulfillmentIncidences || []).filter(i => i.status === 'OPEN' || i.status === 'INVESTIGATING').length;
  const lowStockCount = (fulfillmentInventory || []).filter(item => {
    const prod = products.find(p => p.id === item.productId);
    const minAlert = prod?.minStockAlert ?? 5;
    return item.available <= minAlert;
  }).length;

  const handleSelectFulfillmentSubTab = (subTab: FulfillmentAdminTab) => {
    setActiveTab('fulfillment');
    setFulfillmentSubTab(subTab);
  };

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

  // Category creation modal state
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);

  // Banner creation and editing modal state
  const [isCreateBannerModalOpen, setIsCreateBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // User password modal state
  const [passwordModalUser, setPasswordModalUser] = useState<UserType | null>(null);

  // Store admin assignment modal state (email and password)
  const [assignAdminStore, setAssignAdminStore] = useState<StoreType | null>(null);

  // Dispute resolution modal state
  const [resolvingDispute, setResolvingDispute] = useState<Dispute | null>(null);
  const [disputeResolutionNote, setDisputeResolutionNote] = useState('');
  const [disputeResolutionStatus, setDisputeResolutionStatus] = useState<'RESOLVED' | 'CLOSED'>('RESOLVED');

  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Settings form state
  const [defaultCommRate, setDefaultCommRate] = useState(systemSettings.defaultCommissionRate * 100);
  const [plazaCommRate, setPlazaCommRate] = useState(
    Number(((systemSettings.plazaCommissionRate !== undefined ? systemSettings.plazaCommissionRate : 0.30) * 100).toFixed(4))
  );
  useEffect(() => {
    setPlazaCommRate(Number(((systemSettings.plazaCommissionRate ?? 0.30) * 100).toFixed(4)));
    setDefaultCommRate(systemSettings.defaultCommissionRate * 100);
  }, [systemSettings.plazaCommissionRate, systemSettings.defaultCommissionRate]);
  const [whatsappComm, setWhatsappComm] = useState(systemSettings.whatsappCommercial);
  const [rncVal, setRncVal] = useState(systemSettings.legalEntityRegistered ? systemSettings.rnc : '');
  const [businessName, setBusinessName] = useState(systemSettings.legalEntityRegistered ? systemSettings.legalBusinessName : '');
  const [legalRegistered,setLegalRegistered]=useState(systemSettings.legalEntityRegistered===true);
  const [legalAddress,setLegalAddress]=useState(systemSettings.legalAddress || '');
  const [isRunningSettlements, setIsRunningSettlements] = useState(false);

  // Mailer settings state
  const [mailSenderEmail, setMailSenderEmail] = useState(systemSettings.mailConfig?.senderEmail || 'contacto@plazado.com');
  const [mailSenderName, setMailSenderName] = useState(systemSettings.mailConfig?.senderName || 'PlazaDO.com - Marketplace Dominicano');
  const [mailSmtpHost, setMailSmtpHost] = useState(systemSettings.mailConfig?.smtpHost || 'smtp.ionos.com');
  const [mailSmtpPort, setMailSmtpPort] = useState(systemSettings.mailConfig?.smtpPort || 587);
  const [mailSmtpUser, setMailSmtpUser] = useState(systemSettings.mailConfig?.smtpUser || 'contacto@plazado.com');
  const [mailSmtpPass, setMailSmtpPass] = useState(systemSettings.mailConfig?.smtpPass || '');
  const [showMailPass, setShowMailPass] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (systemSettings.mailConfig) {
      if (systemSettings.mailConfig.senderEmail) setMailSenderEmail(systemSettings.mailConfig.senderEmail);
      if (systemSettings.mailConfig.senderName) setMailSenderName(systemSettings.mailConfig.senderName);
      if (systemSettings.mailConfig.smtpHost) setMailSmtpHost(systemSettings.mailConfig.smtpHost);
      if (systemSettings.mailConfig.smtpPort) setMailSmtpPort(systemSettings.mailConfig.smtpPort);
      if (systemSettings.mailConfig.smtpUser) setMailSmtpUser(systemSettings.mailConfig.smtpUser);
      if (systemSettings.mailConfig.smtpPass) setMailSmtpPass(systemSettings.mailConfig.smtpPass);
    }
  }, [systemSettings.mailConfig]);

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const res = await api.testSmtpConnection({
        testEmail: mailSenderEmail.trim() || 'contacto@plazado.com',
        senderEmail: mailSenderEmail.trim() || 'contacto@plazado.com',
        senderName: mailSenderName.trim() || 'PlazaDO.com - Marketplace Dominicano',
        smtpHost: mailSmtpHost.trim() || 'smtp.ionos.com',
        smtpPort: Number(mailSmtpPort) || 587,
        smtpUser: mailSmtpUser.trim() || mailSenderEmail.trim() || 'contacto@plazado.com',
        smtpPass: mailSmtpPass.trim()
      });
      setSmtpTestResult(res);
      if (res.success) {
        showNotification(res.message, 'success');
      } else {
        showNotification(res.message, 'error');
      }
    } catch (err: any) {
      setSmtpTestResult({ success: false, message: err?.message || 'Error probando conexión SMTP' });
      showNotification(err?.message || 'Error probando conexión SMTP', 'error');
    } finally {
      setTestingSmtp(false);
    }
  };

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
  const totalMarketplaceGross = orders.filter(o=>o.status==='DELIVERED' && o.paymentStatus==='PAID').reduce((acc, o) => acc + o.total, 0);
  const totalPlazaCommissionEarned = orders.filter(o=>o.status==='DELIVERED' && o.paymentStatus==='PAID').reduce((acc, o) => acc + o.plazaCommissionAmount, 0);
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

  const handlePaySettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingSettlement || !bankRefInput.trim()) return;

    const saved=await processSettlement(payingSettlement.id, 'PAID', bankRefInput.trim());
    if(!saved) return;
    setPayingSettlement(null);
    setBankRefInput('');
  };

  const handleResolveDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingDispute) return;

    const saved=await resolveDispute(
      resolvingDispute.id, 
      disputeResolutionStatus,
      disputeResolutionNote
    );
    if(!saved) return;
    setResolvingDispute(null);
    setDisputeResolutionNote('');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingSettings) return;
    setIsSavingSettings(true);
    try {
    await updateSystemSettings({
      plazaCommissionRate: Number(plazaCommRate) / 100,
      defaultCommissionRate: Number(defaultCommRate) / 100,
      whatsappCommercial: whatsappComm,
      legalEntityRegistered: legalRegistered,
      rnc: rncVal.trim(),
      legalBusinessName: businessName.trim(),
      legalAddress: legalAddress.trim(),
      mailConfig: {
        senderEmail: mailSenderEmail.trim() || 'contacto@plazado.com',
        senderName: mailSenderName.trim() || 'PlazaDO.com - Marketplace Dominicano',
        smtpHost: mailSmtpHost.trim() || 'smtp.ionos.com',
        smtpPort: Number(mailSmtpPort) || 465,
        smtpUser: mailSmtpUser.trim() || mailSenderEmail.trim() || 'contacto@plazado.com',
        smtpPass: mailSmtpPass.trim(),
        useSsl: Number(mailSmtpPort) === 465,
        isConfigured: true
      }
    });
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      
      {/* Super Admin Layout: Left Sidebar + Right Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* LEFT SIDEBAR: MENÚ DEL SUPER ADMINISTRADOR GENERAL */}
        <aside className="w-full lg:w-72 lg:shrink-0 space-y-4">
          
          {/* Executive Profile Card */}
          <div className="bg-stone-900 text-white rounded-2xl border border-stone-800 p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-r from-red-700 via-stone-900 to-amber-700 opacity-80" />
            
            <div className="relative pt-3 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-red-600/30 border-2 border-red-500 flex items-center justify-center mb-3 shadow-md backdrop-blur-xs">
                <ShieldAlert className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-base font-black tracking-tight text-white">Super Administrador</h2>
              <span className="inline-block mt-1 bg-red-600/40 text-red-200 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-red-500/50">
                ACCESO MAESTRO GENERAL
              </span>
              
              <p className="text-xs text-stone-300 mt-2 font-medium break-all">
                {currentUser?.email || 'admin@plazado.com'}
              </p>

              <div className="w-full mt-3 pt-3 border-t border-stone-800 flex items-center justify-center gap-1.5 text-[10px] text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-semibold">Auditoría en Tiempo Real Activa</span>
              </div>
            </div>
          </div>

          {/* Menú Lateral Navegación Organizado */}
          <nav className="bg-white rounded-2xl border border-stone-200 p-2 shadow-xs space-y-3">
            
            {/* Grupo 1: Control & Visión Global */}
            <div>
              <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                Control & Métricas
              </div>
              <div className="space-y-0.5 mt-1">
                <button
                  onClick={() => setActiveTab('metrics')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'metrics'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4" />
                    <span>Métricas Globales</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('solicitudes')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'solicitudes'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4" />
                    <span>Solicitudes de Tienda</span>
                  </div>
                  {pendingStoreRequests.length > 0 && (
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500 text-stone-950 animate-pulse">
                      {pendingStoreRequests.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Grupo 2: Comercio & Catálogo */}
            <div className="pt-2 border-t border-stone-100">
              <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                Catálogo & Comercios
              </div>
              <div className="space-y-0.5 mt-1">
                <button
                  onClick={() => setActiveTab('stores')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'stores'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Store className="w-4 h-4" />
                    <span>Tiendas y Comercios</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === 'stores' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {stores.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('products')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'products'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Package className="w-4 h-4" />
                    <span>Catálogo de Productos</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === 'products' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {products.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('categories_specs')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'categories_specs'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FolderTree className="w-4 h-4 text-amber-600" />
                    <span>Categorías & Specs</span>
                  </div>
                  <span className="text-[9px] bg-red-100 text-red-700 font-extrabold px-1.5 py-0.5 rounded-full">
                    25 Cat
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('content')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'content'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4" />
                    <span>Banners Promocionales</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === 'content' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {banners.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Grupo 3: Operaciones & Seguridad */}
            <div className="pt-2 border-t border-stone-100">
              <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                Operaciones & Usuarios
              </div>
              <div className="space-y-0.5 mt-1">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'orders'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Pedidos Globales</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {orders.length}
                  </span>
                </button>



                <button
                  onClick={() => setActiveTab('users')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'users'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4" />
                    <span>Usuarios & Roles</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === 'users' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {allUsers.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('verifications')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'verifications'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ScanFace className="w-4 h-4" />
                    <span>Validación & Cédulas</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === 'verifications' ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'
                  }`}>
                    Fotos & KYC
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('disputes')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'disputes'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Disputas & Arbitraje</span>
                  </div>
                  {disputes.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                      {disputes.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('audit')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'audit'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4" />
                    <span>Bitácora de Auditoría</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === 'audit' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {auditLogs.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Grupo 4: Plazado Fulfillment & Logística de Almacén */}
            <div className="pt-2 border-t border-stone-100">
              <div className="flex items-center justify-between px-3 py-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                  <Warehouse className="w-3.5 h-3.5 text-amber-600" />
                  <span>Plazado Fulfillment</span>
                </span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300/60">
                  {totalPhysicalAll} uds
                </span>
              </div>

              <div className="space-y-1 mt-1">
                {/* Main Fulfillment Hub Button */}
                <div
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'fulfillment'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-stone-700 hover:bg-amber-50 hover:text-amber-900'
                  }`}
                >
                  <button
                    id="admin-tab-fulfillment-btn"
                    type="button"
                    onClick={() => {
                      setActiveTab('fulfillment');
                      setIsFulfillmentMenuExpanded(true);
                    }}
                    className="flex-1 flex items-center gap-2.5 text-left cursor-pointer focus:outline-none"
                  >
                    <Warehouse className={`w-4 h-4 ${activeTab === 'fulfillment' ? 'text-white' : 'text-amber-600'}`} />
                    <span>Centro Logístico</span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    {lowStockCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black animate-pulse">
                        {lowStockCount}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsFulfillmentMenuExpanded(!isFulfillmentMenuExpanded);
                      }}
                      className="p-0.5 hover:bg-black/10 rounded cursor-pointer focus:outline-none"
                      title={isFulfillmentMenuExpanded ? 'Colapsar submenú' : 'Expandir submenú'}
                    >
                      {isFulfillmentMenuExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 opacity-80" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Sub-menu items on left sidebar */}
                {isFulfillmentMenuExpanded && (
                  <div className="pl-2 space-y-0.5 pt-0.5 border-l-2 border-amber-200 ml-3">
                    <button
                      id="admin-sidebar-subtab-overview-btn"
                      onClick={() => handleSelectFulfillmentSubTab('overview')}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        activeTab === 'fulfillment' && fulfillmentSubTab === 'overview'
                          ? 'bg-amber-500 text-white font-black shadow-2xs'
                          : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Resumen General</span>
                      </div>
                      {lowStockCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black">
                          {lowStockCount}
                        </span>
                      )}
                    </button>

                    <button
                      id="admin-sidebar-subtab-receptions-btn"
                      onClick={() => handleSelectFulfillmentSubTab('receptions')}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        activeTab === 'fulfillment' && fulfillmentSubTab === 'receptions'
                          ? 'bg-amber-500 text-white font-black shadow-2xs'
                          : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Inbox className="w-3.5 h-3.5" />
                        <span>Recepciones & Conteo</span>
                      </div>
                      {pendingRequestsCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-stone-950 text-[9px] font-black">
                          {pendingRequestsCount}
                        </span>
                      )}
                    </button>

                    <button
                      id="admin-sidebar-subtab-inventory-btn"
                      onClick={() => handleSelectFulfillmentSubTab('inventory')}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        activeTab === 'fulfillment' && fulfillmentSubTab === 'inventory'
                          ? 'bg-amber-500 text-white font-black shadow-2xs'
                          : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Inventario & Anaqueles</span>
                      </div>
                    </button>

                    <button
                      id="admin-sidebar-subtab-confirmations-btn"
                      onClick={() => handleSelectFulfillmentSubTab('pending_confirmations')}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        activeTab === 'fulfillment' && fulfillmentSubTab === 'pending_confirmations'
                          ? 'bg-amber-500 text-white font-black shadow-2xs'
                          : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Por Confirmar Tienda</span>
                      </div>
                      {pendingConfirmationOrdersCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      )}
                    </button>

                    <button
                      id="admin-sidebar-subtab-picking-btn"
                      onClick={() => handleSelectFulfillmentSubTab('picking')}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        activeTab === 'fulfillment' && fulfillmentSubTab === 'picking'
                          ? 'bg-amber-500 text-white font-black shadow-2xs'
                          : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Scan className="w-3.5 h-3.5" />
                        <span>Estación de Picking</span>
                      </div>
                      {readyForPickingOrdersCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[9px] font-black">
                          {readyForPickingOrdersCount}
                        </span>
                      )}
                    </button>

                    <button
                      id="admin-sidebar-subtab-packing-btn"
                      onClick={() => handleSelectFulfillmentSubTab('packing')}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        activeTab === 'fulfillment' && fulfillmentSubTab === 'packing'
                          ? 'bg-amber-500 text-white font-black shadow-2xs'
                          : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Box className="w-3.5 h-3.5" />
                        <span>Estación de Packing</span>
                      </div>
                      {readyForPackingOrdersCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 text-[9px] font-black">
                          {readyForPackingOrdersCount}
                        </span>
                      )}
                    </button>

                    <button
                      id="admin-sidebar-subtab-dispatch-btn"
                      onClick={() => handleSelectFulfillmentSubTab('dispatch')}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        activeTab === 'fulfillment' && fulfillmentSubTab === 'dispatch'
                          ? 'bg-amber-500 text-white font-black shadow-2xs'
                          : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5" />
                        <span>Despachos & Rutas</span>
                      </div>
                      {readyForDispatchOrdersCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-cyan-100 text-cyan-800 text-[9px] font-black">
                          {readyForDispatchOrdersCount}
                        </span>
                      )}
                    </button>

                    <button
                      id="admin-sidebar-subtab-returns-btn"
                      onClick={() => handleSelectFulfillmentSubTab('returns')}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        activeTab === 'fulfillment' && fulfillmentSubTab === 'returns'
                          ? 'bg-amber-500 text-white font-black shadow-2xs'
                          : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Devoluciones</span>
                      </div>
                    </button>

                    <button
                      id="admin-sidebar-subtab-withdrawals-btn"
                      onClick={() => handleSelectFulfillmentSubTab('withdrawals')}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        activeTab === 'fulfillment' && fulfillmentSubTab === 'withdrawals'
                          ? 'bg-amber-500 text-white font-black shadow-2xs'
                          : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Retiros de Tiendas</span>
                      </div>
                    </button>

                    <button
                      id="admin-sidebar-subtab-incidences-btn"
                      onClick={() => handleSelectFulfillmentSubTab('incidences')}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        activeTab === 'fulfillment' && fulfillmentSubTab === 'incidences'
                          ? 'bg-amber-500 text-white font-black shadow-2xs'
                          : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Incidencias Logísticas</span>
                      </div>
                      {openIncidencesCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-black">
                          {openIncidencesCount}
                        </span>
                      )}
                    </button>

                    <button
                      id="admin-sidebar-subtab-config-btn"
                      onClick={() => handleSelectFulfillmentSubTab('config')}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                        activeTab === 'fulfillment' && fulfillmentSubTab === 'config'
                          ? 'bg-amber-500 text-white font-black shadow-2xs'
                          : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Settings className="w-3.5 h-3.5" />
                        <span>Tarifas & Config</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Grupo 5: Finanzas & Publicidad */}
            <div className="pt-2 border-t border-stone-100">
              <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                Finanzas & Marketing
              </div>
              <div className="space-y-0.5 mt-1">
                <button
                  onClick={() => setActiveTab('settlements')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'settlements'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Liquidaciones Bancarias</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTab === 'settlements' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {settlements.length}
                  </span>
                </button>

                <button
                  id="admin-tab-payments-btn"
                  onClick={() => setActiveTab('payments')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'payments'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4" />
                    <span>Pasarelas de Pago</span>
                  </div>
                </button>

                <button
                  id="admin-tab-advertising-btn"
                  onClick={() => setActiveTab('advertising')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'advertising'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Megaphone className="w-4 h-4" />
                    <span>Publicidad & Anuncios</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Grupo 5: Sistema & Plataforma */}
            <div className="pt-2 border-t border-stone-100">
              <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
                Sistema & Plataforma
              </div>
              <div className="space-y-0.5 mt-1">
                <button
                  id="admin-tab-branding-btn"
                  onClick={() => setActiveTab('branding')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'branding'
                      ? 'bg-[#008f51] text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Palette className="w-4 h-4" />
                    <span>Identidad & Header</span>
                  </div>
                </button>

                <button
                  id="admin-tab-persistence-btn"
                  onClick={() => setActiveTab('persistence')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'persistence'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Database className="w-4 h-4" />
                    <span>Persistencia & Backup</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'settings'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-4 h-4" />
                    <span>Configuración Global</span>
                  </div>
                </button>

                <button
                  id="admin-tab-legal-docs-btn"
                  onClick={() => setActiveTab('legal_docs')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'legal_docs'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileCheck className="w-4 h-4" />
                    <span>Términos & PDFs</span>
                  </div>
                </button>

                <button
                  id="admin-tab-android-app-btn"
                  onClick={() => setActiveTab('android_app')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'android_app'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4" />
                    <span>App Android (APK)</span>
                  </div>
                </button>
              </div>
            </div>
          </nav>
        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <main className="flex-1 min-w-0 w-full space-y-6">

          {/* Super Admin Masthead with High-Privilege Notice */}
          <div className="bg-stone-900 text-white rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="p-1.5 bg-red-600 rounded-lg">
                  <ShieldAlert className="w-4 h-4 text-white" />
                </span>
                <h1 className="text-base sm:text-lg font-black tracking-tight">Super Administrador PlazaDO.com</h1>
                <span className="bg-red-500/30 text-red-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/40">
                  Control Fiduciario & Arbitraje
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-1 max-w-2xl">
                Plataforma en fase de producción. Gestiona comercios, catálogo unificado, seguridad de pagos y fondos en custodia.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-stone-400">Usuario:</span>
              <span className="font-bold text-white bg-stone-800 px-2.5 py-1 rounded-lg border border-stone-700">{currentUser?.name || 'Super Admin'}</span>
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
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Comisiones PlazaDO</span>
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
                          Comisión vigente: <strong>{Number(((systemSettings.plazaCommissionRate ?? 0.30) * 100).toFixed(4))}% sobre el total del pedido, incluido el envío</strong>
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

            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Store Impersonation Switcher */}
              <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
                <Store className="w-3.5 h-3.5 text-stone-500 ml-1.5" />
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      adminImpersonateStore(e.target.value);
                    }
                  }}
                  className="p-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-800 outline-none cursor-pointer"
                >
                  <option value="" disabled>Ingreso directo a tienda...</option>
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>
                      🏪 {s.name} ({s.status})
                    </option>
                  ))}
                </select>
              </div>

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
                  const assignedAdmin = allUsers.find(u => 
                    (u.storeId === st.id && u.role === 'STORE_OWNER') ||
                    (st.ownerId && u.id === st.ownerId) ||
                    (u.storeId === st.id) ||
                    (st.email && u.email.toLowerCase() === st.email.toLowerCase())
                  );
                  return (
                    <div key={st.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        {st.logo ? (
                          <img src={st.logo} alt="" className="w-14 h-14 rounded-xl object-cover border border-stone-200 shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-stone-100 text-stone-700 font-bold flex items-center justify-center shrink-0 border border-stone-200">
                            {st.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm text-stone-900 truncate">{st.name}</h3>
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
                          <p className="text-xs text-stone-500 mt-0.5 truncate">
                            RNC: {st.bankInfo?.rncOrCedula || 'N/A'} • Propietario: {st.ownerName} ({st.email}) • {st.province}
                          </p>

                          {/* Account credentials status */}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {assignedAdmin ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Acceso Admin: <strong>{assignedAdmin.email}</strong> ({assignedAdmin.name})</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Sin usuario administrador asignado</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-stone-600 mt-1 flex-wrap">
                            <span>Balance Disp: <strong>RD$ {bal.availableBalance.toLocaleString()}</strong></span>
                            <span>• En Custodia: RD$ {bal.pendingBalance.toLocaleString()}</span>
                            <span>• Ventas: RD$ {bal.totalSales.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions with Horizontal Scrollbar */}
                      <div className="w-full md:w-auto max-w-full md:max-w-[480px] lg:max-w-[560px] xl:max-w-[640px] 2xl:max-w-[740px] flex items-center gap-2 overflow-x-auto pb-2 pt-1 admin-actions-scroll shrink-0">
                        {/* Envío manual del código de validación junto a la tienda creada */}
                        {assignedAdmin?.verification?.code && !assignedAdmin.isEmailVerified && (
                          <button
                            type="button"
                            onClick={() => {
                              const code = assignedAdmin.verification?.code || '';
                              const message = `Hola ${assignedAdmin.name},

Gracias por registrar ${st.name} en Plazado.com.

Tu código de validación es: ${code}

Utiliza este código para completar la verificación de tu tienda.

Este código es personal. No lo compartas con terceros.

Saludos,
Plazado.com
contacto@plazado.com`;
                              navigator.clipboard.writeText(message).catch(() => undefined);
                              window.open('https://email.ionos.com/appsuite/#!!&app=io.ox/mail&folder=default0/INBOX', '_blank', 'noopener,noreferrer');
                              showNotification(`Código ${code} y mensaje copiados para ${assignedAdmin.email}. Pégalos en Webmail IONOS.`, 'success');
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                            title={`Enviar manualmente el código ${assignedAdmin.verification.code} a ${assignedAdmin.email}`}
                          >
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            <span>Enviar código {assignedAdmin.verification.code}</span>
                          </button>
                        )}

                        {assignedAdmin?.verification?.code && !assignedAdmin.isEmailVerified && (
                          <button
                            type="button"
                            onClick={() => {
                              const code = assignedAdmin.verification?.code || '';
                              const message = `Hola ${assignedAdmin.name},

Gracias por registrar ${st.name} en Plazado.com.

Tu código de validación es: ${code}

Utiliza este código para completar la verificación de tu tienda.

Este código es personal. No lo compartas con terceros.

Saludos,
Plazado.com
contacto@plazado.com`;
                              window.alert(`FORMATO DE MENSAJE

Destinatario: ${assignedAdmin.email}

${message}`);
                            }}
                            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shrink-0"
                            title="Ver el formato del mensaje que se enviará"
                          >
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                            <span>Ver formato de mensaje</span>
                          </button>
                        )}

                        {/* Super Admin Enter Store Directly to Configure */}
                        <button
                          type="button"
                          onClick={() => adminImpersonateStore(st.id)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                          title="Ingresar como Administrador para configurar productos, envíos, métodos de pago y perfil"
                        >
                          <LogIn className="w-3.5 h-3.5 shrink-0" />
                          <span>Administrar Tienda</span>
                        </button>

                        {/* Super Admin Assign Store Credentials (Email & Password) */}
                        <button
                          type="button"
                          onClick={() => setAssignAdminStore(st)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                          title="Asignar o modificar correo y contraseña de acceso para esta tienda"
                        >
                          <KeyRound className="w-3.5 h-3.5 shrink-0" />
                          <span>{assignedAdmin ? 'Credenciales de Tienda' : 'Asignar Correo & Clave'}</span>
                        </button>

                        {/* Super Admin Edit Store Profile & Logo */}
                        <button
                          type="button"
                          onClick={() => setEditingStore(st)}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          title="Editar perfil y logo de la tienda"
                        >
                          <Edit className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Editar Perfil</span>
                        </button>

                        {(st.status === 'PENDING' || st.status === 'IN_REVIEW') && (
                          <>
                            <button
                              type="button"
                              onClick={() => updateStoreStatus(st.id, 'APPROVED')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 shrink-0" />
                              <span>Aprobar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectingStore(st);
                                setRejectionReasonInput('');
                              }}
                              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5 shrink-0" />
                              <span>Rechazar</span>
                            </button>
                          </>
                        )}

                        {st.status === 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => updateStoreStatus(st.id, 'SUSPENDED', 'Suspensión administrativa')}
                            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Suspender
                          </button>
                        )}

                        {st.status === 'SUSPENDED' && (
                          <button
                            type="button"
                            onClick={() => updateStoreStatus(st.id, 'APPROVED')}
                            className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Reactivar
                          </button>
                        )}

                        {/* View Public Store Page */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStoreSlug(st.slug || st.id);
                            setCurrentView('store_public');
                          }}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          title="Ver página pública de la tienda"
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0" />
                          <span>Ver Tienda</span>
                        </button>

                        {/* Super Admin Delete Store Button */}
                        <button
                          type="button"
                          onClick={() => setDeleteModal({
                            typeLabel: 'TIENDA & PUBLICACIONES',
                            title: `Eliminar Tienda: ${st.name}`,
                            recordId: st.id,
                            description: `Esta acción de Super Administrador borrará permanentemente la tienda "${st.name}", sus ${storeProductCount} publicaciones de productos asociadas y su registro de balance fiduciario de la base de datos de PlazaDO.`,
                            action: () => deleteStore(st.id)
                          })}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          title="Borrar registro de tienda (Super Admin)"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600 shrink-0" />
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

                      <div className="text-xs text-stone-600 space-y-0.5">
                        <div>
                          <strong>Cliente:</strong> {order.customerName} ({order.deliveryAddress?.phone || order.customerPhone})
                          {order.deliveryAddress?.label && (
                            <span className="ml-1.5 px-1.5 py-0.2 bg-stone-100 text-stone-700 rounded text-[10px] font-bold">
                              📍 {order.deliveryAddress.label}
                            </span>
                          )}
                        </div>
                        <div className="text-stone-500 text-[11px] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                          <span>
                            {order.deliveryAddress?.street || 'Calle N/A'}
                            {order.deliveryAddress?.buildingNumber ? ` #${order.deliveryAddress.buildingNumber}` : ''}, {order.deliveryAddress?.sector || ''}, {order.deliveryAddress?.municipality || ''}, {order.deliveryAddress?.province || 'RD'}
                          </span>
                        </div>
                        {order.deliveryAddress?.reference && (
                          <div className="text-[10px] text-stone-400 italic pl-4">
                            Ref: {order.deliveryAddress.reference}
                          </div>
                        )}
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
                      <img data-product-image="true" 
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCreateSuperAdminModalOpen(true)}
                className="px-3.5 py-2 bg-stone-900 hover:bg-stone-850 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                <span>Crear Super Admin</span>
              </button>
              <span className="text-xs text-stone-500 bg-stone-100 px-3 py-1 rounded-full font-medium">
                {filteredUsers.length} de {allUsers.length} usuarios
              </span>
            </div>
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

                    <div className="w-full md:w-auto max-w-full flex items-center gap-2 overflow-x-auto pb-2 pt-1 admin-actions-scroll shrink-0">
                      {storeObj && (
                        <button
                          type="button"
                          onClick={() => adminImpersonateStore(storeObj.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors bg-amber-500 hover:bg-amber-600 text-white shadow-xs cursor-pointer whitespace-nowrap shrink-0"
                          title={`Ingresar a configurar la tienda ${storeObj.name}`}
                        >
                          <Store className="w-3.5 h-3.5 shrink-0" />
                          <span>Administrar Tienda</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setPasswordModalUser(usr)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap shrink-0 cursor-pointer"
                        title="Asignar o restablecer contraseña"
                      >
                        <Key className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>Contraseña</span>
                      </button>

                      <button
                        type="button"
                        disabled={isCurrent}
                        onClick={() => setDeleteModal({
                          typeLabel: 'CUENTA DE USUARIO',
                          title: `Eliminar Usuario: ${usr.name}`,
                          recordId: usr.id,
                          description: `Esta acción de Super Administrador borrará permanentemente la cuenta de "${usr.name}" (${usr.email}) con rol ${usr.role}.`,
                          action: () => deleteUser(usr.id)
                        })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0 ${
                          isCurrent 
                            ? 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200' 
                            : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 cursor-pointer'
                        }`}
                        title={isCurrent ? 'No puedes eliminar tu propia cuenta en sesión' : 'Borrar usuario'}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600 shrink-0" />
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

      {/* TAB VERIFICACIÓN DE USUARIOS */}
      {activeTab === 'verifications' && (
        <UserVerificationsTab />
      )}

      {/* TAB 6: LIQUIDACIONES Y DESEMBOLSOS */}
      {activeTab === 'settlements' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-stone-900">Liquidaciones y Finanzas Centralizadas</h2>
              <p className="text-xs text-stone-500">
                Cuenta central de Plazado.com, comisiones ({((systemSettings.plazaCommissionRate ?? 0.30) * 100).toFixed(2)}%), retenciones de efectivo y desembolsos semanales
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-run-weekly-settlement"
                disabled={isRunningSettlements}
                onClick={async () => {
                  if (window.confirm('¿Deseas ejecutar el ciclo de liquidación semanal? Se procesarán los balances disponibles de todas las tiendas, descontando las comisiones adeudadas por ventas en efectivo y generando las transferencias correspondientes.')) {
                    setIsRunningSettlements(true);
                    try {
                      await runWeeklySettlements();
                    } finally {
                      setIsRunningSettlements(false);
                    }
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2 ${
                  isRunningSettlements 
                    ? 'bg-stone-300 text-stone-600 cursor-wait' 
                    : 'bg-red-600 hover:bg-red-700 text-white hover:shadow-red-600/30 active:scale-95'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRunningSettlements ? 'animate-spin' : ''}`} />
                <span>{isRunningSettlements ? 'Ejecutando Ciclo...' : 'Ejecutar Liquidación Semanal (Viernes)'}</span>
              </button>
            </div>
          </div>

          {/* Centralized Financial Indicators Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                Comisión Plazado.com
              </span>
              <div className="text-xl font-black text-red-600 mt-1">
                {((systemSettings.plazaCommissionRate !== undefined ? systemSettings.plazaCommissionRate : 0.30) * 100).toFixed(2)}%
              </div>
              <span className="text-[10px] text-stone-400 mt-0.5 block">
                Fórmula: Total del pedido × {(systemSettings.plazaCommissionRate ?? 0.30).toFixed(2)}
                <br />RD$4,000 × {(systemSettings.plazaCommissionRate ?? 0.30).toFixed(2)} = RD${(4000 * (systemSettings.plazaCommissionRate ?? 0.30)).toLocaleString('en-US')}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                Custodia Central (Tarjetas)
              </span>
              <div className="text-xl font-black text-stone-900 mt-1">
                RD$ {Object.values(storeBalances).reduce((acc, b) => acc + (b.availableBalance || 0) + (b.pendingBalance || 0), 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-stone-400 mt-0.5 block">
                Disponible a liquidar: RD$ {Object.values(storeBalances).reduce((acc, b) => acc + (b.availableBalance || 0), 0).toLocaleString()}
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                Comisiones por Cobrar (Efectivo)
              </span>
              <div className="text-xl font-black text-amber-600 mt-1">
                RD$ {Object.values(storeBalances).reduce((acc, b) => acc + (b.pendingCashCommissions || 0) + (b.carriedOverDebt || 0), 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-stone-400 mt-0.5 block">
                Deducible en ciclo semanal de los viernes
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block">
                Desembolsos Completados
              </span>
              <div className="text-xl font-black text-emerald-600 mt-1">
                RD$ {settlements.filter(s => s.status === 'PAID').reduce((acc, s) => acc + s.netAmount, 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-stone-400 mt-0.5 block">
                {settlements.filter(s => s.status === 'PAID').length} transferencias realizadas
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-stone-700">Historial de Liquidaciones por Tienda</h3>
              <span className="text-xs text-stone-500 bg-stone-100 px-3 py-1 rounded-full font-medium">
                {settlements.length} registros
              </span>
            </div>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-sm text-stone-900">Banners Promocionales de Portada</h3>
                <p className="text-xs text-stone-500">
                  Imágenes destacadas mostradas en la página de inicio ({banners.length} banners registrados). Puedes subir fotos directamente desde tu equipo.
                </p>
              </div>
              <button
                type="button"
                id="admin-create-banner-btn"
                onClick={() => {
                  setEditingBanner(null);
                  setIsCreateBannerModalOpen(true);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Crear Nuevo Banner</span>
              </button>
            </div>

            {banners.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl space-y-3">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">No hay banners promocionales registrados</h4>
                  <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
                    Crea el primer banner promocional de PlazaDO subiendo una foto directamente desde tu equipo (PC, laptop o móvil).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingBanner(null);
                    setIsCreateBannerModalOpen(true);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Subir Foto y Crear Banner</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {banners.map(b => (
                  <div key={b.id} className="rounded-xl border border-stone-200 overflow-hidden bg-stone-50 flex flex-col justify-between shadow-2xs hover:border-stone-300 transition-colors">
                    <div className="relative h-36 bg-stone-900">
                      <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-black rounded-md">
                          #{b.order}
                        </span>
                        {b.badge && (
                          <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black uppercase rounded-md tracking-wider">
                            {b.badge}
                          </span>
                        )}
                      </div>
                      <div className="absolute top-2 right-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-xs ${
                          b.isActive !== false 
                            ? 'bg-emerald-600/90 text-white' 
                            : 'bg-stone-800/90 text-stone-300'
                        }`}>
                          {b.isActive !== false ? 'Activo' : 'Pausado'}
                        </span>
                      </div>
                      {b.imageUrl.startsWith('data:image') && (
                        <div className="absolute bottom-2 left-2">
                          <span className="px-2 py-0.5 bg-blue-600/90 backdrop-blur-xs text-white text-[9px] font-semibold rounded-md">
                            📷 Foto Local
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 flex flex-col justify-between flex-1 gap-3">
                      <div>
                        <h4 className="font-bold text-stone-900 text-sm line-clamp-1">{b.title}</h4>
                        {b.subtitle && <p className="text-stone-500 line-clamp-1 mt-0.5">{b.subtitle}</p>}
                        <div className="mt-2 text-[11px] text-stone-600 font-medium">
                          Destino:{' '}
                          <span className="font-semibold text-stone-800">
                            {b.targetType === 'STORE' && `🏪 Tienda (${b.targetValue || 'General'})`}
                            {b.targetType === 'CATEGORY' && `🏷️ Categoría (${b.targetValue || 'General'})`}
                            {b.targetType === 'PRODUCT' && `📦 Producto (#${b.targetValue})`}
                            {b.targetType === 'URL' && `🌐 Enlace externo`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBanner(b);
                            setIsCreateBannerModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg transition-colors flex items-center gap-1.5 font-bold text-[11px]"
                          title="Editar información y cambiar foto"
                        >
                          <Edit className="w-3.5 h-3.5 text-stone-600" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
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
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-sm text-stone-900">Categorías Principales del Mercado Dominicano</h3>
                <p className="text-xs text-stone-500">Estructura taxonómica de productos en PlazaDO ({categories.length} categorías registradas)</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateCategoryModalOpen(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <FolderPlus className="w-4 h-4" />
                <span>+ Crear Nueva Categoría</span>
              </button>
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

      {/* TAB 8: IDENTIDAD VISUAL (LOGO & FAVICON) */}
      {activeTab === 'branding' && <BrandingSettingsTab />}

      {/* TAB 8.5: BLINDAJE DE PERSISTENCIA & RESPALDOS */}
      {activeTab === 'persistence' && <PersistenceSettingsTab />}

      {/* TAB 9: CONFIGURACIÓN GLOBAL & PURGA DE REGISTROS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Direct link to Branding & Logo */}
          <div className="bg-gradient-to-r from-red-50 via-white to-stone-50 rounded-2xl border border-red-200 p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-600 text-white rounded-xl shadow-xs">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-stone-900">Identidad Visual: Header, Hero y Favicon</h3>
                <p className="text-xs text-stone-500">Configura la imagen del Header (fondos claros y oscuros), la imagen principal del Hero de la portada y el favicon.</p>
              </div>
            </div>
            <button
              type="button"
              id="btn-goto-branding-from-settings"
              onClick={() => setActiveTab('branding')}
              className="px-4 py-2 bg-[#008f51] hover:bg-[#007a44] text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Configurar Header & Identidad</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-6 text-xs">
            <div>
              <h2 className="text-base font-bold text-stone-900">Parámetros Globales de PlazaDO.com</h2>
              <p className="text-stone-500">Configuración de comisiones, números comerciales y datos fiscales de la plataforma</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 bg-red-50/50 rounded-xl border border-red-200">
                <label className="block font-bold text-red-900 mb-1">
                  Comisión de Plazado.com (%) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0.001}
                    max={10}
                    step={0.001}
                    value={plazaCommRate}
                    onChange={(e) => setPlazaCommRate(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-red-300 rounded-lg text-sm font-black text-red-700 outline-none focus:ring-2 focus:ring-red-500/20"
                  />
                  <span className="text-xs font-black text-red-700">%</span>
                </div>
                <span className="text-[11px] text-red-700/80 mt-1 block">
                  Tasa central: {plazaCommRate}% (factor multiplicador {(plazaCommRate / 100).toFixed(6)}). Cobrada automáticamente sobre cada venta.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Comisión Comercial Adicional / Estándar (%)</label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  step={0.5}
                  value={defaultCommRate}
                  onChange={(e) => setDefaultCommRate(Number(e.target.value))}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm font-bold outline-none"
                />
                <span className="text-[11px] text-stone-400 mt-1 block">Referencia para planes premium de tiendas.</span>
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
                <label className="flex items-center gap-2 mb-3 text-sm font-semibold"><input type="checkbox" checked={legalRegistered} onChange={e=>setLegalRegistered(e.target.checked)} /> Empresa formalizada: publicar razón social y RNC</label>
                <p className="text-xs text-stone-500 mb-3">Puedes completar estos datos más adelante. Mientras no actives esta opción, la página mostrará solamente Plazado.com.</p>
                <label className="block font-semibold text-stone-700 mb-1">Razón Social Fiscal</label>
                <input
                  type="text"
                  disabled={!legalRegistered}
                  required={legalRegistered}
                  placeholder="Completar al formalizar la empresa"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">RNC Corporativo</label>
                <input
                  type="text"
                  disabled={!legalRegistered}
                  required={legalRegistered}
                  placeholder="Sin RNC asignado"
                  value={rncVal}
                  onChange={(e) => setRncVal(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg outline-none font-mono"
                />
              </div>
            </div>

            <label className="block text-sm font-semibold">Dirección comercial / del operador
              <input type="text" value={legalAddress} onChange={e=>setLegalAddress(e.target.value)} placeholder="Completar más adelante" className="mt-1 w-full p-2.5 border border-stone-300 rounded-lg" />
            </label>

            {/* SERVICIO DE CORREO ELECTRÓNICO (DISPARADOR DE REGISTROS) */}
            <div className="pt-4 border-t border-stone-200 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <div className="flex items-center gap-2 text-stone-900">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-900">
                      Disparador de Correos de Verificación (OTP)
                    </h3>
                    <p className="text-stone-500 text-[11px]">
                      Configura el correo oficial emisor y servidor SMTP para la validación obligatoria de cuentas
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full border border-emerald-200">
                  ● Servicio Habilitado ({mailSenderEmail})
                </span>
              </div>

              {/* Provider Quick Presets */}
              <div className="flex flex-wrap items-center gap-2 pb-2">
                <span className="text-xs font-semibold text-stone-600">Plantillas rápidas:</span>
                <button
                  type="button"
                  onClick={() => {
                    setMailSmtpHost('smtp.ionos.com');
                    setMailSmtpPort(465);
                    setMailSenderEmail('contacto@plazado.com');
                    setMailSenderName('PlazaDO.com - Marketplace Dominicano');
                    setMailSmtpUser('contacto@plazado.com');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs font-bold transition-all shadow-2xs"
                >
                  ⚡ Google Workspace / Gmail (465 SSL)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMailSmtpHost('smtp.ionos.com');
                    setMailSmtpPort(465);
                    setMailSenderEmail('contacto@plazado.com');
                    setMailSenderName('PlazaDO.com - Marketplace Dominicano');
                    setMailSmtpUser('contacto@plazado.com');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs font-bold transition-all shadow-2xs"
                >
                  🌐 IONOS Mail (465 SSL)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMailSmtpHost('smtp.ionos.com');
                    setMailSmtpPort(587);
                    setMailSenderEmail('contacto@plazado.com');
                    setMailSenderName('PlazaDO.com - Marketplace Dominicano');
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs font-bold transition-all shadow-2xs"
                >
                  🔧 Gmail STARTTLS (587)
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Correo Electrónico Emisor Oficial *
                  </label>
                  <input
                    type="email"
                    value={mailSenderEmail}
                    onChange={(e) => setMailSenderEmail(e.target.value)}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-lg outline-none font-bold text-stone-900 focus:border-red-500"
                    placeholder="contacto@plazado.com"
                  />
                  <span className="text-[10px] text-stone-400 mt-1 block">
                    Desde esta dirección oficial se dispara automáticamente el código de 6 dígitos a nuevos usuarios y comercios.
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Nombre del Remitente
                  </label>
                  <input
                    type="text"
                    value={mailSenderName}
                    onChange={(e) => setMailSenderName(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg outline-none"
                    placeholder="PlazaDO.com - Marketplace Dominicano"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Servidor SMTP (Host)
                  </label>
                  <input
                    type="text"
                    value={mailSmtpHost}
                    onChange={(e) => setMailSmtpHost(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg outline-none font-mono text-xs"
                    placeholder="smtp.ionos.com"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Puerto SMTP
                  </label>
                  <input
                    type="number"
                    value={mailSmtpPort}
                    onChange={(e) => setMailSmtpPort(Number(e.target.value))}
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg outline-none font-mono text-xs"
                    placeholder="465 (SSL) o 587 (STARTTLS)"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Usuario SMTP / Cuenta de Acceso
                  </label>
                  <input
                    type="text"
                    value={mailSmtpUser}
                    onChange={(e) => setMailSmtpUser(e.target.value)}
                    className="w-full p-2.5 bg-white border border-stone-300 rounded-lg outline-none font-mono text-xs"
                    placeholder="contacto@plazado.com"
                  />
                  <span className="text-[10px] text-stone-400 mt-1 block">
                    Usuario de conexión SMTP de IONOS (ej: contacto@plazado.com).
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Contraseña SMTP IONOS
                  </label>
                  <div className="relative">
                    <input
                      type={showMailPass ? 'text' : 'password'}
                      value={mailSmtpPass}
                      onChange={(e) => setMailSmtpPass(e.target.value)}
                      className="w-full p-2.5 bg-white border border-stone-300 rounded-lg outline-none font-mono text-xs pr-10"
                      placeholder="•••• •••• •••• •••• (16 caracteres)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMailPass(!showMailPass)}
                      className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-700"
                    >
                      {showMailPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[10px] text-stone-400 mt-1 block">
                    Contraseña de la cuenta de correo IONOS utilizada para autenticar el envío SMTP.
                  </span>
                </div>

                {/* Envío manual temporal mientras SMTP no esté disponible */}
                <div className="sm:col-span-2 pt-2">
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
                    <div>
                      <p className="font-bold text-xs text-amber-900">Envío manual de código de registro</p>
                      <p className="text-[11px] text-amber-800 mt-1">
                        Copia el código de 6 dígitos generado para el usuario y envíalo manualmente desde Webmail IONOS.
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-amber-200 text-[11px] text-stone-700">
                      <p className="font-bold mb-1">Asunto: Código de verificación de Plazado.com</p>
                      <p>Hola,</p>
                      <p className="mt-2">Tu código de registro para Plazado.com es: <strong>[CÓDIGO DE 6 DÍGITOS]</strong></p>
                      <p>Utiliza este código para completar la verificación de tu cuenta.</p>
                      <p className="mt-2">Saludos,<br />Plazado.com</p>
                    </div>
                    <a href="https://email.ionos.com/appsuite/#!!&app=io.ox/mail&folder=default0/INBOX" target="_blank" rel="noopener noreferrer" className="inline-flex px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      <span>Abrir Webmail IONOS</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 flex justify-end">
              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs shadow-xs"
              >
                {isSavingSettings ? 'Guardando...' : 'Guardar Parámetros de Plataforma'}
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

      {/* TAB 11: CONFIGURACIÓN DE PASARELAS DE PAGO & CUENTA RECEPTORA */}
      {activeTab === 'payments' && (
        <PaymentGatewaysTab />
      )}

      {/* TAB 12: GESTIÓN DE PUBLICIDAD & ESPACIOS COMERCIALES */}
      {activeTab === 'advertising' && (
        <AdvertisingManagementTab />
      )}

      {/* TAB 13: GESTIÓN DE DOCUMENTOS LEGALES & PDFs OFICIALES */}
      {activeTab === 'legal_docs' && (
        <LegalDocsManagementTab />
      )}

      {/* TAB 14: DISTRIBUCIÓN DE APLICACIÓN ANDROID (APK) */}
      {activeTab === 'android_app' && (
        <AndroidAppManagementTab />
      )}

      {/* TAB 15: CATEGORÍAS & ESPECIFICACIONES TÉCNICAS DINÁMICAS */}
      {activeTab === 'categories_specs' && (
        <CategoriesAndSpecsManagement />
      )}

      {/* TAB 16: PLAZADO FULFILLMENT - CENTRO DE OPERACIONES & LOGÍSTICA */}
      {activeTab === 'fulfillment' && (
        <FulfillmentAdminView 
          activeSubTab={fulfillmentSubTab}
          onTabChange={setFulfillmentSubTab}
        />
      )}

        </main>
      </div>

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

      {/* Super Admin Create Category Modal */}
      <CreateCategoryModal
        isOpen={isCreateCategoryModalOpen}
        onClose={() => setIsCreateCategoryModalOpen(false)}
      />

      {/* Super Admin Create / Edit Banner Modal */}
      <CreateBannerModal
        isOpen={isCreateBannerModalOpen}
        bannerToEdit={editingBanner}
        onClose={() => {
          setIsCreateBannerModalOpen(false);
          setEditingBanner(null);
        }}
      />

      {/* Super Admin User Password Management Modal */}
      <UserPasswordModal
        user={passwordModalUser}
        isOpen={Boolean(passwordModalUser)}
        onClose={() => setPasswordModalUser(null)}
      />

      {/* Super Admin Store Admin Assignment Modal (Email & Password) */}
      <AssignStoreAdminModal
        store={assignAdminStore}
        isOpen={Boolean(assignAdminStore)}
        onClose={() => setAssignAdminStore(null)}
      />

      {/* Create Super Admin Modal */}
      {createSuperAdminModalOpen && (
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
                type="button"
                onClick={() => setCreateSuperAdminModalOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newAdminName.trim() || !newAdminEmail.trim()) {
                  showNotification('Nombre y correo son requeridos', 'error');
                  return;
                }
                if (!newAdminPassword || newAdminPassword.length < 6) {
                  showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
                  return;
                }
                if (newAdminPassword !== newAdminConfirmPassword) {
                  showNotification('Las contraseñas no coinciden', 'error');
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
                    setCreateSuperAdminModalOpen(false);
                    setNewAdminName('');
                    setNewAdminEmail('');
                    setNewAdminPhone('');
                    setNewAdminPassword('');
                    setNewAdminConfirmPassword('');
                  }
                } finally {
                  setCreatingAdminLoading(false);
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="Ej: Lic. Carlos Santos"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Correo Electrónico Oficial *</label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="admin.segundo@plazado.com"
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-stone-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Teléfono / Celular</label>
                <input
                  type="tel"
                  value={newAdminPhone}
                  onChange={(e) => setNewAdminPhone(e.target.value)}
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
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Mínimo 6 carácteres"
                    className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs outline-none focus:border-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Confirmar *</label>
                  <input
                    type="password"
                    required
                    value={newAdminConfirmPassword}
                    onChange={(e) => setNewAdminConfirmPassword(e.target.value)}
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
                  onClick={() => setCreateSuperAdminModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingAdminLoading}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creatingAdminLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5 text-amber-400" />}
                  <span>{creatingAdminLoading ? 'Creando...' : 'Crear Super Administrador'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
