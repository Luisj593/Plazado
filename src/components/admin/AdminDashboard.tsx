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

  // Settings form state
  const [defaultCommRate, setDefaultCommRate] = useState(systemSettings.defaultCommissionRate * 100);
  const [plazaCommRate, setPlazaCommRate] = useState(
    Number(((systemSettings.plazaCommissionRate !== undefined ? systemSettings.plazaCommissionRate : 0.0005) * 100).toFixed(4))
  );
  const [whatsappComm, setWhatsappComm] = useState(systemSettings.whatsappCommercial);
  const [rncVal, setRncVal] = useState(systemSettings.rnc);
  const [businessName, setBusinessName] = useState(systemSettings.legalBusinessName);
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
      plazaCommissionRate: Number(plazaCommRate) / 100,
      defaultCommissionRate: Number(defaultCommRate) / 100,
      whatsappCommercial: whatsappComm,
      rnc: rncVal,
      legalBusinessName: businessName,
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
    showNotification('Configuración global y servicio de correo de PlazaDO.com guardados exitosamente.');
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
                    placeholder="smtp.gmail.com o smtp.ionos.com"
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

                {/* Botón de Prueba Directa de SMTP */}
                <div className="sm:col-span-2 pt-2">
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
                    <div>
                      <p className="font-bold text-xs text-amber-900">Envío manual de código de registro</p>
                      <p className="text-[11px] text-amber-800 mt-1">
                        Mientras el SMTP esté temporalmente deshabilitado, copia el código generado para el usuario y envíalo manualmente desde Webmail IONOS.
                      </p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-amber-200 text-[11px] text-stone-700">
                      <p className="font-bold mb-1">Formato recomendado:</p>
                      <p>Asunto: Código de verificación de Plazado.com</p>
                      <p className="mt-2">Hola,</p>
                      <p>Tu código de registro para Plazado.com es: <strong>[CÓDIGO DE 6 DÍGITOS]</strong></p>
                      <p>Este código es personal y debe utilizarse para completar la verificación de tu cuenta.</p>
                      <p className="mt-2">Saludos,<br/>Plazado.com</p>
                    </div>
                    <a
                      href="https://email.ionos.com/appsuite/#!!&app=io.ox/mail&folder=default0/INBOX"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Abrir Webmail IONOS</span>
                    </a>
                  </div>

                  {smtpTestResult && (
                    <div className={`mt-2 p-3 rounded-xl border text-xs ${
                      smtpTestResult.success 
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900' 
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}>
                      <span className="font-bold">{smtpTestResult.success ? '✅ ÉXITO: ' : '❌ ERROR: '}</span>
                      <span>{smtpTestResult.message}</span>
                    </div>
                  )}
                </div>
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
