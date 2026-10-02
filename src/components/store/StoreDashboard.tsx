import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { 
  Store, 
  Package, 
  ShoppingBag, 
  DollarSign, 
  Settings, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Edit, 
  Trash2, 
  Key, 
  Eye, 
  Building, 
  ArrowUpRight,
  Search,
  Filter,
  Check,
  X,
  BarChart3,
  TrendingUp,
  Calendar,
  CreditCard,
  Play,
  Pause,
  Printer,
  MessageSquare,
  Phone,
  MapPin,
  FileText,
  ShieldCheck,
  RefreshCw,
  ChevronRight,
  Share2,
  Lock,
  EyeOff,
  KeyRound,
  Shield,
  ExternalLink,
  Warehouse,
  ArrowLeft,
  LogIn
} from 'lucide-react';
import { Dispute, Order, OrderStatus, Product, ProductStatus, Settlement } from '../../types';
import { DOMINICAN_BANKS } from '../../data/initialData';
import { StoreProfileModal, PRESET_STORE_BANNERS } from '../common/StoreProfileModal';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { ProductImagesManager } from './ProductImagesManager';
import { FulfillmentStoreView, FulfillmentStoreSubTab } from './FulfillmentStoreView';

export const StoreDashboard: React.FC = () => {
  const { 
    currentUser, 
    stores, 
    products, 
    categories,
    orders, 
    settlements, 
    storeBalances,
    disputes,
    createDispute,
    updateOrderStatus, 
    updateProduct, 
    addProduct, 
    deleteProduct, 
    requestSettlement, 
    updateStoreDetails,
    showNotification,
    setCurrentView,
    setSelectedStoreSlug,
    copyStoreShareUrl,
    openOrderChat,
    getOrderUnreadCount,
    orderMessages,
    fulfillmentOrders,
    fulfillmentInventory,
    storageRequests,
    confirmOrderByStore,
    rejectOrderByStore,
    deleteMyStore,
    toggleStorePublish,
    adminImpersonatedStoreId,
    adminImpersonateStore,
    adminExitImpersonation
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'chats' | 'products' | 'finances' | 'reports' | 'settings' | 'fulfillment'>('overview');
  const [fulfillmentStoreSubTab, setFulfillmentStoreSubTab] = useState<FulfillmentStoreSubTab>('overview');

  // Multi-tenant Security: Strictly isolate to current store, with support for Super Admin inspection
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const matchingOwnerStore = stores.find(s => s.ownerId === currentUser?.id || (s as any).owner_id === currentUser?.id || s.id === currentUser?.storeId);
  const defaultStoreId = matchingOwnerStore ? matchingOwnerStore.id : (currentUser?.storeId || (stores.length > 0 ? stores[0].id : ''));

  const [adminSelectedStoreId, setAdminSelectedStoreId] = useState<string>(
    adminImpersonatedStoreId || currentUser?.storeId || defaultStoreId
  );
  const effectiveStoreId = isSuperAdmin 
    ? (adminImpersonatedStoreId || adminSelectedStoreId || defaultStoreId) 
    : defaultStoreId;
  const store = stores.find(s => s.id === effectiveStoreId) || matchingOwnerStore;

  // Store-scoped data
  const storeOrders = orders.filter(o => o.storeId === effectiveStoreId);
  const storeProducts = products.filter(p => p.storeId === effectiveStoreId);
  const storeSettlements = settlements.filter(s => s.storeId === effectiveStoreId);
  const storeUnreadTotal = storeOrders.reduce((acc, ord) => acc + getOrderUnreadCount(ord.id, 'STORE'), 0);
  const storeFulfillmentOrders = (fulfillmentOrders || []).filter(o => o.storeId === effectiveStoreId);
  const pendingFulfillmentOrdersCount = storeFulfillmentOrders.filter(o => o.status === 'PENDING_STORE_CONFIRMATION').length;
  const storeFulfillmentItems = (fulfillmentInventory || []).filter(i => i.storeId === effectiveStoreId);

  // Order management states
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');
  const [viewingOrderDetails, setViewingOrderDetails] = useState<Order | null>(null);
  const [validatingDeliveryOrder, setValidatingDeliveryOrder] = useState<Order | null>(null);
  const [printingPackingSlipOrder, setPrintingPackingSlipOrder] = useState<Order | null>(null);
  const [secretCodeInput, setSecretCodeInput] = useState('');
  const [secretCodeError, setSecretCodeError] = useState<string | null>(null);

  // Store Dispute / Reclamación State
  const [disputeOrder, setDisputeOrder] = useState<Order | null>(null);
  const [disputeIssueType, setDisputeIssueType] = useState<Dispute['issueType']>('DELIVERY_ISSUE');
  const [disputeDescription, setDisputeDescription] = useState('');
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  // Product modal state (Create / Edit)
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pName, setPName] = useState('');
  const [pSku, setPSku] = useState('');
  const [pPrice, setPPrice] = useState(0);
  const [pPromoPrice, setPPromoPrice] = useState<number | undefined>(undefined);
  const [pStock, setPStock] = useState(0);
  const [pMinAlert, setPMinAlert] = useState(3);
  const [pCategory, setPCategory] = useState(categories[0]?.id || 'cat-tecnologia');
  const [pDesc, setPDesc] = useState('');
  const [pImagesList, setPImagesList] = useState<string[]>([]);
  const [pStatus, setPStatus] = useState<ProductStatus>('published');

  // Settlement Request State
  const [settlementModalOpen, setSettlementModalOpen] = useState(false);
  const [settlementAmount, setSettlementAmount] = useState(0);

  // Store settings form state
  const [storeName, setStoreName] = useState(store?.name || '');
  const [storeLogo, setStoreLogo] = useState(store?.logo || '');
  const [storeBanner, setStoreBanner] = useState(store?.banner || '');
  const [storeWhatsapp, setStoreWhatsapp] = useState(store?.whatsapp || '');
  const [storeDesc, setStoreDesc] = useState(store?.description || '');
  const [shippingRate, setShippingRate] = useState(store?.shippingConfig?.fixedRate || 200);
  const [freeShippingMin, setFreeShippingMin] = useState(store?.shippingConfig?.freeShippingThreshold || 3000);
  const [shippingDays, setShippingDays] = useState(store?.shippingConfig?.estimatedDays || '24 a 48 horas');
  const [isStoreProfileModalOpen, setIsStoreProfileModalOpen] = useState(false);

  // Bank Info state
  const [bankName, setBankName] = useState(store?.bankInfo?.bank || 'Banco Popular Dominicano');
  const [accountType, setAccountType] = useState(store?.bankInfo?.accountType || 'CORRIENTE');
  const [accountNumber, setAccountNumber] = useState(store?.bankInfo?.accountNumber || '');
  const [accountHolder, setAccountHolder] = useState(store?.bankInfo?.accountHolder || '');
  const [documentId, setDocumentId] = useState(store?.bankInfo?.rncOrCedula || '');

  // Store Owner Password Change States
  const [storeCurrentPass, setStoreCurrentPass] = useState('');
  const [storeNewPass, setStoreNewPass] = useState('');
  const [storeConfirmPass, setStoreConfirmPass] = useState('');
  const [storeShowCurrentPass, setStoreShowCurrentPass] = useState(false);
  const [storeShowNewPass, setStoreShowNewPass] = useState(false);
  const [storeShowConfirmPass, setStoreShowConfirmPass] = useState(false);
  const [storePassLoading, setStorePassLoading] = useState(false);
  const [storePassError, setStorePassError] = useState<string | null>(null);
  const [storePassSuccess, setStorePassSuccess] = useState<string | null>(null);

  // Store Deletion states
  const [deleteStoreConfirmText, setDeleteStoreConfirmText] = useState('');
  const [isDeletingStore, setIsDeletingStore] = useState(false);
  const [deleteStoreError, setDeleteStoreError] = useState<string | null>(null);

  const handleDeleteStoreSubmit = async () => {
    if (!store) return;
    setDeleteStoreError(null);

    if (deleteStoreConfirmText !== 'ELIMINAR') {
      setDeleteStoreError('Debes escribir la palabra "ELIMINAR" en mayúsculas para confirmar.');
      return;
    }

    const confirmed = window.confirm(
      `¿Estás completamente seguro de eliminar permanentemente la tienda "${store.name}" y todos sus productos de Google Cloud? Esta acción es irreversible.`
    );
    if (!confirmed) return;

    setIsDeletingStore(true);
    try {
      const res = await deleteMyStore(store.id, deleteStoreConfirmText);
      if (res.success) {
        setCurrentView('home');
      } else {
        setDeleteStoreError(res.message || 'Error al eliminar tienda.');
      }
    } catch (e: any) {
      setDeleteStoreError(e.message || 'Error de conexión al eliminar tienda.');
    } finally {
      setIsDeletingStore(false);
    }
  };

  const handleStorePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setStorePassError(null);
    setStorePassSuccess(null);

    const targetNew = storeNewPass.trim();
    if (targetNew.length < 6) {
      setStorePassError('La nueva contraseña debe contener al menos 6 caracteres.');
      return;
    }

    if (targetNew !== storeConfirmPass.trim()) {
      setStorePassError('Las contraseñas no coinciden. Verifica e intenta de nuevo.');
      return;
    }

    const targetUserId = currentUser?.id;
    if (!targetUserId) {
      setStorePassError('No se encontró la sesión del usuario del comercio.');
      return;
    }

    setStorePassLoading(true);
    try {
      const res = await api.updateUserPassword(targetUserId, targetNew, storeCurrentPass.trim() || undefined);
      if (res.success) {
        setStorePassSuccess('¡Contraseña del comercio actualizada con éxito!');
        showNotification('Contraseña del comercio actualizada exitosamente', 'success');
        setStoreCurrentPass('');
        setStoreNewPass('');
        setStoreConfirmPass('');
      } else {
        setStorePassError(res.message || 'Error al actualizar la contraseña.');
      }
    } catch (err: any) {
      setStorePassError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setStorePassLoading(false);
    }
  };

  // Store Order Cancellation State
  const [cancellingOrder, setCancellingOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelReasonError, setCancelReasonError] = useState<string | null>(null);
  const [isSubmittingCancellation, setIsSubmittingCancellation] = useState<boolean>(false);

  const handleConfirmCancelOrder = () => {
    if (!cancellingOrder) return;
    const reasonTrimmed = cancelReason.trim();
    if (!reasonTrimmed) {
      setCancelReasonError('Debes indicar el motivo de la cancelación para informar al cliente.');
      return;
    }
    if (reasonTrimmed.length < 4) {
      setCancelReasonError('Por favor detalla el motivo de la cancelación (mínimo 4 caracteres).');
      return;
    }

    setIsSubmittingCancellation(true);
    const res = updateOrderStatus(cancellingOrder.id, 'CANCELLED', reasonTrimmed);
    if (res.success) {
      showNotification(`Pedido #${cancellingOrder.id} cancelado: ${reasonTrimmed}`, 'info');
      if (viewingOrderDetails && viewingOrderDetails.id === cancellingOrder.id) {
        setViewingOrderDetails({
          ...viewingOrderDetails,
          status: 'CANCELLED',
          cancelReason: reasonTrimmed,
          cancelledAt: new Date().toISOString(),
          cancelledBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Tienda'
        });
      }
      setCancellingOrder(null);
      setCancelReason('');
      setCancelReasonError(null);
    } else {
      setCancelReasonError(res.message || 'Error al cancelar pedido');
    }
    setIsSubmittingCancellation(false);
  };

  if (!store) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center text-stone-500">
        <Store className="w-12 h-12 mx-auto text-stone-300 mb-2" />
        <h2 className="text-lg font-bold text-stone-900">No se encontró la tienda asociada.</h2>
        {isSuperAdmin && stores.length > 0 ? (
          <div className="mt-4 max-w-sm mx-auto space-y-2">
            <p className="text-xs text-stone-600">Como Super Administrador, puedes seleccionar cualquier tienda para gestionar:</p>
            <select
              value={adminSelectedStoreId}
              onChange={(e) => setAdminSelectedStoreId(e.target.value)}
              className="w-full text-xs font-semibold p-2 border border-stone-300 rounded-lg bg-white"
            >
              {stores.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-xs mt-1">Inicia sesión con una cuenta de propietario de tienda registrada para acceder a este panel.</p>
        )}
      </div>
    );
  }

  const currentBalance = storeBalances[store.id] || { availableBalance: 0, pendingBalance: 0, totalSales: 0, settledBalance: 0 };

  // Helper for safe money formatting in Dominican Pesos (DOP)
  const formatDOP = (amount?: any) => {
    const num = Number(amount);
    if (isNaN(num)) return '0.00';
    return num.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Safe date formatter that prevents crashes from unexpected formats
  const formatDateSafe = (dateVal: any, opts?: Intl.DateTimeFormatOptions) => {
    if (!dateVal) return 'N/A';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleString('es-DO', opts || { dateStyle: 'short', timeStyle: 'short' });
    } catch {
      return String(dateVal);
    }
  };

  // Safe timestamp parser
  const parseTimeSafe = (dateVal: any) => {
    if (!dateVal) return 0;
    const t = new Date(dateVal).getTime();
    return isNaN(t) ? 0 : t;
  };

  // Financial calculations with defensive fallbacks
  const totalGrossSales = storeOrders.reduce((acc, o) => acc + (Number(o.subtotal) || 0), 0);
  const totalCommissionDeducted = storeOrders.reduce((acc, o) => acc + (Number(o.plazaCommissionAmount) || 0), 0);
  const totalNetEarnings = storeOrders.reduce((acc, o) => acc + (Number(o.storeNetEarnings) || 0), 0);
  
  // Pending orders
  const pendingOrders = storeOrders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const deliveredOrders = storeOrders.filter(o => o.status === 'DELIVERED');

  // Sales reports analytics
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const validOrders = storeOrders.filter(o => o.status !== 'CANCELLED');
  const todayOrders = validOrders.filter(o => parseTimeSafe(o.createdAt) >= startOfToday);
  const todaySales = todayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const todayNet = todayOrders.reduce((sum, o) => sum + (Number(o.storeNetEarnings) || 0), 0);

  const weekOrders = validOrders.filter(o => parseTimeSafe(o.createdAt) >= sevenDaysAgo);
  const weekSales = weekOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const weekNet = weekOrders.reduce((sum, o) => sum + (Number(o.storeNetEarnings) || 0), 0);

  const monthOrders = validOrders.filter(o => parseTimeSafe(o.createdAt) >= startOfMonth);
  const monthSales = monthOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const monthNet = monthOrders.reduce((sum, o) => sum + (Number(o.storeNetEarnings) || 0), 0);

  const totalLifetimeSales = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalLifetimeNet = validOrders.reduce((sum, o) => sum + (Number(o.storeNetEarnings) || 0), 0);
  const totalCommissionPaid = validOrders.reduce((sum, o) => sum + (Number(o.plazaCommissionAmount) || 0), 0);

  // Best selling products ranking
  const productSalesMap: Record<string, {
    id: string;
    name: string;
    image: string;
    unitsSold: number;
    revenue: number;
    stock: number;
    price: number;
  }> = {};

  validOrders.forEach(order => {
    (order.items || []).forEach(item => {
      if (!productSalesMap[item.productId]) {
        const prod = products.find(p => p.id === item.productId);
        productSalesMap[item.productId] = {
          id: item.productId,
          name: item.productName,
          image: item.productImage || prod?.images[0] || '',
          unitsSold: 0,
          revenue: 0,
          stock: prod?.stock || 0,
          price: item.price || 0
        };
      }
      productSalesMap[item.productId].unitsSold += (item.quantity || 0);
      productSalesMap[item.productId].revenue += (item.price || 0) * (item.quantity || 0);
    });
  });

  const bestSellingProducts = Object.values(productSalesMap).sort((a, b) => b.unitsSold - a.unitsSold);

  // Status visual attributes
  const getStatusDisplay = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Pendiente', color: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock };
      case 'CONFIRMED':
        return { label: 'Confirmado', color: 'bg-blue-50 text-blue-800 border-blue-200', icon: Check };
      case 'PREPARING':
        return { label: 'En Preparación', color: 'bg-orange-50 text-orange-800 border-orange-200', icon: Package };
      case 'READY_FOR_PICKUP':
        return { label: 'Listo p/ Despacho', color: 'bg-indigo-50 text-indigo-800 border-indigo-200', icon: ShoppingBag };
      case 'SHIPPED':
        return { label: 'En Camino', color: 'bg-purple-50 text-purple-800 border-purple-200', icon: Truck };
      case 'DELIVERED':
        return { label: 'Entregado y Liquidado', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle2 };
      case 'CANCELLED':
        return { label: 'Cancelado', color: 'bg-stone-100 text-stone-700 border-stone-200', icon: X };
      default:
        return { label: status, color: 'bg-stone-100 text-stone-700 border-stone-200', icon: Package };
    }
  };

  // Handle Order Status Transition
  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus, note?: string) => {
    const res = updateOrderStatus(orderId, newStatus, note);
    if (res.success) {
      showNotification(`Pedido ${orderId} actualizado a: ${newStatus}`);
      if (viewingOrderDetails && viewingOrderDetails.id === orderId) {
        setViewingOrderDetails({
          ...viewingOrderDetails,
          status: newStatus,
          statusHistory: [
            ...(viewingOrderDetails.statusHistory || []),
            {
              status: newStatus,
              timestamp: new Date().toISOString(),
              updatedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Tienda',
              note: note || undefined
            }
          ]
        });
      }
    } else {
      showNotification(res.message || 'Error al actualizar pedido', 'error');
    }
  };

  // Handle Delivery Secret Code Confirmation (Requerimiento #15)
  const handleConfirmDeliveryCode = (order: Order) => {
    if (!order) return;
    const provided = secretCodeInput.trim().toUpperCase();
    const expected = (order.deliveryConfirmationCode || '').trim().toUpperCase();

    if (!provided) {
      setSecretCodeError('Por favor ingresa el código de 6 dígitos que te dio el cliente.');
      return;
    }

    if (provided !== expected && currentUser?.role !== 'SUPER_ADMIN') {
      setSecretCodeError('Código incorrecto. Solicita al cliente su código secreto de 6 dígitos que figura en su orden de PlazaDO.');
      return;
    }

    const res = updateOrderStatus(order.id, 'DELIVERED', 'Entrega completada y validada con código secreto del cliente', provided);
    if (res.success) {
      showNotification('¡Entrega validada exitosamente! Fondos netos transferidos a tu Balance Disponible.', 'success');
      setValidatingDeliveryOrder(null);
      setSecretCodeInput('');
      setSecretCodeError(null);
      if (viewingOrderDetails && viewingOrderDetails.id === order.id) {
        setViewingOrderDetails({
          ...viewingOrderDetails,
          status: 'DELIVERED',
          paymentStatus: 'PAID'
        });
      }
    } else {
      setSecretCodeError(res.message || 'Error al confirmar entrega con código.');
    }
  };

  // Open product editor
  const handleOpenProductModal = (prod?: Product) => {
    if (prod) {
      if (prod.storeId !== store.id) {
        showNotification('No tienes permiso para editar este producto', 'error');
        return;
      }
      setEditingProduct(prod);
      setPName(prod.name);
      setPSku(prod.sku);
      setPPrice(prod.price);
      setPPromoPrice(prod.promoPrice);
      setPStock(prod.stock);
      setPMinAlert(prod.minStockAlert);
      const matchingCat = categories.find(c => c.id === prod.categoryId || c.slug === prod.categoryId);
      setPCategory(matchingCat ? matchingCat.id : (prod.categoryId || categories[0]?.id || ''));
      setPDesc(prod.description);
      setPImagesList(prod.images || []);
      setPStatus(prod.status || 'published');
    } else {
      setEditingProduct(null);
      setPName('');
      setPSku(`SKU-${Date.now().toString().slice(-4)}`);
      setPPrice(1000);
      setPPromoPrice(undefined);
      setPStock(10);
      setPMinAlert(3);
      setPCategory(categories[0]?.id || 'cat-tecnologia');
      setPDesc('');
      setPImagesList([]);
      setPStatus('published');
    }
    setProductModalOpen(true);
  };

  // Save Product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) {
      showNotification('Ingresa el nombre del producto', 'error');
      return;
    }
    if (pImagesList.length === 0) {
      showNotification('Debes subir al menos 1 imagen para el producto (mínimo 1, máximo 5)', 'error');
      return;
    }
    if (pImagesList.length > 5) {
      showNotification('Máximo 5 imágenes permitidas por producto', 'error');
      return;
    }

    if (editingProduct) {
      if (editingProduct.storeId !== store.id) {
        showNotification('No tienes autorización para modificar este producto', 'error');
        return;
      }
      const isFulfillment = Boolean(editingProduct.isFulfillment || storeFulfillmentItems.some(fi => fi.productId === editingProduct.id));
      updateProduct(editingProduct.id, {
        name: pName,
        sku: pSku,
        price: Number(pPrice),
        promoPrice: pPromoPrice ? Number(pPromoPrice) : undefined,
        // Rule: A store cannot directly modify warehouse physical stock of Plazado Fulfillment products
        stock: isFulfillment ? editingProduct.stock : Number(pStock),
        minStockAlert: Number(pMinAlert),
        categoryId: pCategory,
        description: pDesc,
        images: pImagesList,
        status: pStatus,
        updatedAt: new Date().toISOString()
      });
      showNotification('Producto y galería de imágenes actualizados en el catálogo');
    } else {
      addProduct({
        name: pName,
        slug: pName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `prod-${Date.now()}`,
        sku: pSku,
        price: Number(pPrice),
        promoPrice: pPromoPrice ? Number(pPromoPrice) : undefined,
        stock: Number(pStock),
        minStockAlert: Number(pMinAlert),
        categoryId: pCategory,
        description: pDesc,
        images: pImagesList,
        status: pStatus,
        isFeatured: false
      });
      showNotification(
        pStatus === 'published' 
          ? '¡Producto publicado exitosamente! Ya es visible para todos en el catálogo de PlazaDO.'
          : 'Producto guardado en tu panel de tienda.'
      );
    }

    setProductModalOpen(false);
  };

  // Submit Settlement
  const handleRequestSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    const res = requestSettlement(store.id);
    if (res.success) {
      showNotification('Solicitud de liquidación enviada para desembolso bancario');
      setSettlementModalOpen(false);
    } else {
      alert(res.message);
    }
  };

  // Submit Store Dispute / Reclamación
  const handleSubmitStoreDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeOrder) return;
    if (!disputeDescription.trim()) {
      alert('Por favor especifica los detalles de la reclamación.');
      return;
    }
    setIsSubmittingDispute(true);
    createDispute({
      orderId: disputeOrder.id,
      storeId: disputeOrder.storeId,
      storeName: disputeOrder.storeName,
      customerId: disputeOrder.customerId,
      customerName: disputeOrder.customerName,
      customerEmail: disputeOrder.customerEmail || 'cliente@plazado.com',
      issueType: disputeIssueType,
      description: `[Reportado por la tienda ${store.name}]: ${disputeDescription}`,
      refundRequested: false
    });
    showNotification(`Reclamación registrada para el pedido #${disputeOrder.id}`);
    setIsSubmittingDispute(false);
    setDisputeOrder(null);
    setDisputeDescription('');
  };

  // Save Store Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreDetails(store.id, {
      name: storeName,
      logo: storeLogo || store.logo,
      banner: storeBanner || store.banner,
      whatsapp: store.whatsapp,
      description: storeDesc,
      shippingConfig: {
        type: 'fixed',
        fixedRate: Number(shippingRate),
        freeShippingThreshold: Number(freeShippingMin),
        estimatedDays: shippingDays,
        coverageProvinces: store.shippingConfig?.coverageProvinces || []
      },
      bankInfo: {
        bank: bankName,
        accountType: accountType as 'CORRIENTE' | 'AHORROS',
        accountNumber,
        accountHolder,
        rncOrCedula: documentId
      }
    });
    showNotification('Ajustes y configuración comercial guardados.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      
      {/* Super Admin Store Management Bar */}
      {isSuperAdmin && (
        <div className="mb-6 p-4 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white rounded-2xl border border-stone-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center font-black text-white shadow-xs">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-xs text-white uppercase tracking-wider">
                  Acceso Super Admin:
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-bold">
                  {store?.name || 'Tienda Seleccionada'}
                </span>
                <span className="text-[10px] text-stone-400">
                  (ID: {store?.id})
                </span>
              </div>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Estás configurando los productos, horarios, métodos de pago, envíos y datos bancarios de esta tienda.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1.5 bg-stone-800/80 px-2 py-1 rounded-xl border border-stone-700">
              <Store className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={effectiveStoreId}
                onChange={(e) => adminImpersonateStore(e.target.value)}
                className="bg-transparent text-xs font-bold text-white outline-none cursor-pointer pr-2"
                title="Cambiar a otra tienda"
              >
                {stores.map(s => (
                  <option key={s.id} value={s.id} className="bg-stone-900 text-white">
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={adminExitImpersonation}
              className="px-3.5 py-1.5 bg-white hover:bg-stone-100 text-stone-900 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-red-600" />
              <span>Volver a Panel Super Admin</span>
            </button>
          </div>
        </div>
      )}
      
      {/* Pending Approval Banner (Alert) */}
      {(store.status === 'PENDING' || store.status === 'IN_REVIEW') && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3 shadow-2xs">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <h4 className="font-bold text-amber-950 text-sm">Tu solicitud de tienda está pendiente de revisión por el Super Administrador</h4>
            <p className="text-amber-800">
              El equipo de administración de PlazaDO está validando los datos de tu comercio ({store.name}). Mientras tanto, puedes configurar tu inventario, tarifas de entrega e información bancaria. Tus productos se publicarán en el catálogo una vez sea aprobada la tienda.
            </p>
          </div>
        </div>
      )}

      {/* Rejected Store Banner (Alert) */}
      {store.status === 'REJECTED' && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900 space-y-1">
            <h4 className="font-bold text-rose-950 text-sm">Solicitud no aprobada</h4>
            <p className="text-rose-800">
              Motivo: {store.rejectionReason || 'No cumple con las normativas comerciales de PlazaDO.'} Puedes editar tus datos o comunicarte con soporte.
            </p>
          </div>
        </div>
      )}

      {/* Main Layout: Left Sidebar + Right Content Area */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* LEFT SIDEBAR: OPCIONES DE LA TIENDA */}
        <aside className="w-full lg:w-72 lg:shrink-0 space-y-4">
          
          {/* Store Identification Card */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-r from-stone-900 via-stone-800 to-amber-900" />
            
            <div className="relative pt-4 flex flex-col items-center">
              <div className="relative group mb-3">
                <img 
                  src={store.logo} 
                  alt={store.name} 
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md bg-white" 
                />
                <button
                  onClick={() => setIsStoreProfileModalOpen(true)}
                  className="absolute -bottom-1 -right-1 bg-stone-900 hover:bg-amber-600 text-white p-1.5 rounded-full shadow-xs transition-colors"
                  title="Cambiar logo de la tienda"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>

              <h2 className="text-base font-black text-stone-900 leading-tight">{store.name}</h2>
              
              <div className="mt-1.5">
                {store.status === 'APPROVED' ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block">
                    Tienda Activa & Aprobada
                  </span>
                ) : store.status === 'PENDING' || store.status === 'IN_REVIEW' ? (
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 border border-amber-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    En Revisión
                  </span>
                ) : store.status === 'REJECTED' ? (
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block">
                    Rechazada
                  </span>
                ) : (
                  <span className="bg-stone-100 text-stone-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block">
                    {store.status}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-stone-500 mt-2">
                RNC: {store.bankInfo?.rncOrCedula || 'N/A'} • {store.province || 'República Dominicana'}
              </p>

              {/* Super Admin Store Selector */}
              {isSuperAdmin && (
                <div className="w-full mt-3 pt-3 border-t border-stone-100 text-left">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-1">
                    Inspeccionar Tienda (Admin):
                  </label>
                  <select
                    value={adminSelectedStoreId}
                    onChange={(e) => setAdminSelectedStoreId(e.target.value)}
                    className="w-full text-xs font-semibold p-1.5 bg-amber-50 border border-amber-200 rounded-lg outline-none text-stone-900"
                  >
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Store Action Links */}
              <div className="w-full grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-stone-100">
                <button
                  onClick={() => {
                    setSelectedStoreSlug(store.slug || store.id);
                    setCurrentView('store_public');
                  }}
                  className="py-1.5 px-2 text-[11px] font-bold text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors flex items-center justify-center gap-1 border border-stone-200"
                  title="Ver vitrina pública de tu tienda"
                >
                  <Store className="w-3 h-3 text-stone-600" />
                  <span>Ver Vitrina</span>
                </button>
                <button
                  onClick={() => copyStoreShareUrl(store)}
                  className="py-1.5 px-2 text-[11px] font-bold text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center gap-1 border border-red-200"
                  title="Copiar enlace directo oficial de tu tienda"
                >
                  <Share2 className="w-3 h-3 text-red-600" />
                  <span>Copiar Link</span>
                </button>
              </div>

              <button
                onClick={() => setIsStoreProfileModalOpen(true)}
                className="mt-2 w-full py-1.5 px-3 bg-stone-50 hover:bg-stone-100 text-stone-700 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-stone-200"
              >
                <Edit className="w-3 h-3 text-stone-500" />
                <span>Editar Perfil & Datos</span>
              </button>
            </div>
          </div>

          {/* Lateral Navigation Menu */}
          <nav className="bg-white rounded-2xl border border-stone-200 p-2 shadow-xs space-y-1">
            <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-stone-400">
              Menú de Tienda
            </div>

            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Store className="w-4 h-4" />
                <span>Resumen General</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'orders'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4" />
                <span>Gestión de Pedidos</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
              }`}>
                {pendingOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('chats')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'chats'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4" />
                <span>Chat de Clientes</span>
              </div>
              {storeUnreadTotal > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
                  {storeUnreadTotal}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'products'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4" />
                <span>Catálogo de Productos</span>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'products' ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
              }`}>
                {storeProducts.length}
              </span>
            </button>

            <div>
              <button
                id="store-tab-fulfillment-btn"
                onClick={() => setActiveTab('fulfillment')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'fulfillment'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-700 hover:bg-amber-50/70 border border-transparent hover:border-amber-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Warehouse className={`w-4 h-4 ${activeTab === 'fulfillment' ? 'text-white' : 'text-amber-600'}`} />
                  <span>Plazado Fulfillment</span>
                </div>
                {pendingFulfillmentOrdersCount > 0 ? (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-red-500 text-white animate-pulse">
                    {pendingFulfillmentOrdersCount}
                  </span>
                ) : (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                    activeTab === 'fulfillment' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-800'
                  }`}>
                    ALMACÉN
                  </span>
                )}
              </button>

              {/* Sub-options in Store Sidebar when activeTab === 'fulfillment' */}
              {activeTab === 'fulfillment' && (
                <div className="pl-3 space-y-0.5 pt-1 border-l-2 border-amber-300 ml-4 mt-1">
                  <button
                    type="button"
                    onClick={() => setFulfillmentStoreSubTab('overview')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer flex items-center justify-between ${
                      fulfillmentStoreSubTab === 'overview'
                        ? 'bg-amber-500 text-white font-black'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <span>Resumen General</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillmentStoreSubTab('inventory')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer flex items-center justify-between ${
                      fulfillmentStoreSubTab === 'inventory'
                        ? 'bg-amber-500 text-white font-black'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <span>Mi Inventario</span>
                    <span className="font-mono text-[10px] opacity-75">{storeFulfillmentItems.length}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillmentStoreSubTab('requests')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer flex items-center justify-between ${
                      fulfillmentStoreSubTab === 'requests'
                        ? 'bg-amber-500 text-white font-black'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <span>Solicitudes de Envío</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillmentStoreSubTab('orders')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer flex items-center justify-between ${
                      fulfillmentStoreSubTab === 'orders'
                        ? 'bg-amber-500 text-white font-black'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <span>Pedidos Fulfillment</span>
                    {pendingFulfillmentOrdersCount > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillmentStoreSubTab('withdrawals')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer flex items-center justify-between ${
                      fulfillmentStoreSubTab === 'withdrawals'
                        ? 'bg-amber-500 text-white font-black'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <span>Retiros</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillmentStoreSubTab('incidences')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer flex items-center justify-between ${
                      fulfillmentStoreSubTab === 'incidences'
                        ? 'bg-amber-500 text-white font-black'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <span>Incidencias</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFulfillmentStoreSubTab('pricing')}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer flex items-center justify-between ${
                      fulfillmentStoreSubTab === 'pricing'
                        ? 'bg-amber-500 text-white font-black'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    <span>Costos & Tarifas</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveTab('finances')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'finances'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-4 h-4" />
                <span>Finanzas y Liquidación</span>
              </div>
              <span className={`text-[10px] font-black ${
                activeTab === 'finances' ? 'text-white' : 'text-emerald-700'
              }`}>
                RD$ {Math.round(currentBalance.availableBalance).toLocaleString()}
              </span>
            </button>

            <button
              id="store-reports-tab-btn"
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'reports'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4" />
                <span>Reportes de Ventas</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'settings'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4" />
                <span>Configuración & Envíos</span>
              </div>
            </button>
          </nav>

          {/* Quick Action: Add Product Directly */}
          <div className="bg-stone-50 rounded-2xl border border-stone-200 p-4 space-y-3">
            <button
              onClick={() => handleOpenProductModal()}
              className="w-full py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Publicar Nuevo Producto</span>
            </button>

            <div className="pt-2 border-t border-stone-200 flex items-start gap-2 text-[11px] text-stone-500">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="leading-tight">
                <strong>Sesión Aislada:</strong> Solo tienes acceso a las órdenes y catálogo de tu tienda.
              </span>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT AREA */}
        <main className="flex-1 min-w-0 w-full space-y-6">

      {/* TAB 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Balance Disponible</span>
              <div className="text-2xl font-black text-stone-900 mt-1">
                RD$ {currentBalance.availableBalance.toLocaleString()}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Listo para solicitar transferencia a tu cuenta</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Balance en Custodia</span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                RD$ {currentBalance.pendingBalance.toLocaleString()}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Se libera automáticamente al validar la entrega</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Pedidos Pendientes</span>
              <div className="text-2xl font-black text-stone-900 mt-1">
                {pendingOrders.length}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Requieren preparación o despacho</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">Ventas Netas Acumuladas</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                RD$ {totalNetEarnings.toLocaleString()}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Ya descontada la comisión del 5%</p>
            </div>

          </div>

          {/* Quick Actions & Urgent Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Urgent Orders List */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-stone-900">Pedidos que Requieren Atención</h3>
                <button onClick={() => setActiveTab('orders')} className="text-xs font-semibold text-red-600 hover:underline">
                  Ver todos ({storeOrders.length})
                </button>
              </div>

              {pendingOrders.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  ¡No tienes pedidos pendientes de despacho! Todos tus pedidos están al día.
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {pendingOrders.map(order => (
                    <div key={order.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-xs text-stone-900">{order.id}</span>
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-0.5">
                          {order.customerName || 'Cliente'} • {(order.items || []).length} productos • {order.deliveryAddress?.province || (order as any).shippingAddress?.province || 'República Dominicana'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-stone-900">RD$ {formatDOP(order.total)}</span>
                        <button
                          onClick={() => {
                            setViewingOrderDetails(order);
                            setActiveTab('orders');
                          }}
                          className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition-colors"
                        >
                          Gestionar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions Box */}
            <div className="bg-stone-50 rounded-2xl border border-stone-200 p-5 space-y-4">
              <h3 className="font-bold text-sm text-stone-900">Acciones Rápidas</h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => handleOpenProductModal()}
                  className="w-full p-3 bg-white border border-stone-200 hover:border-red-400 rounded-xl text-left text-xs font-bold text-stone-800 flex items-center justify-between transition-colors shadow-2xs"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-red-600" />
                    Publicar Nuevo Producto
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-stone-400" />
                </button>

                <button
                  onClick={() => {
                    setSettlementAmount(currentBalance.availableBalance);
                    setSettlementModalOpen(true);
                  }}
                  disabled={currentBalance.availableBalance < 500}
                  className="w-full p-3 bg-white border border-stone-200 hover:border-emerald-500 rounded-xl text-left text-xs font-bold text-stone-800 flex items-center justify-between transition-colors shadow-2xs disabled:opacity-50"
                >
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    Solicitar Transferencia Bancaria
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-stone-400" />
                </button>
              </div>

              {/* Delivery Secret Code Guide */}
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <Key className="w-4 h-4 text-amber-700" />
                  <span>Validación de Entrega Obligatoria</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Para marcar un pedido como "Entregado" y liberar los fondos a tu balance disponible, debes ingresar el código de 6 dígitos que te suministre el comprador.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: GESTIÓN DE PEDIDOS DE LA TIENDA */}
      {activeTab === 'orders' && (
        <div className="space-y-5">
          {/* Header with Search and Summary */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-stone-900">Gestión de Pedidos Recibidos</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                  {storeOrders.length} {storeOrders.length === 1 ? 'pedido' : 'pedidos'}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Supervisa, prepara, despacha y liquida los pedidos exclusivos de <strong>{store.name}</strong>
              </p>
            </div>

            {/* Quick Search */}
            <div className="w-full md:w-72 relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                placeholder="Buscar por ID, cliente, teléfono..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-red-600 focus:bg-white transition-all font-semibold text-stone-950 placeholder:text-stone-500 placeholder:font-normal caret-red-600"
              />
              {orderSearchQuery && (
                <button
                  onClick={() => setOrderSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter Tabs with Counts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {[
              { id: 'all', label: 'Todos', count: storeOrders.length },
              { id: 'PENDING', label: 'Pendientes', count: storeOrders.filter(o => o.status === 'PENDING').length },
              { id: 'CONFIRMED', label: 'Confirmados', count: storeOrders.filter(o => o.status === 'CONFIRMED').length },
              { id: 'PREPARING', label: 'En Preparación', count: storeOrders.filter(o => o.status === 'PREPARING').length },
              { id: 'READY_FOR_PICKUP', label: 'Listos p/ Envío', count: storeOrders.filter(o => o.status === 'READY_FOR_PICKUP').length },
              { id: 'SHIPPED', label: 'En Camino', count: storeOrders.filter(o => o.status === 'SHIPPED').length },
              { id: 'DELIVERED', label: 'Entregados', count: storeOrders.filter(o => o.status === 'DELIVERED').length },
              { id: 'CANCELLED', label: 'Cancelados', count: storeOrders.filter(o => o.status === 'CANCELLED').length },
            ].map(tab => {
              const isActive = orderStatusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setOrderStatusFilter(tab.id)}
                  className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    isActive 
                      ? 'bg-stone-900 text-white shadow-xs' 
                      : 'bg-white text-stone-600 border border-stone-200 hover:border-stone-300 hover:text-stone-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-stone-700 text-stone-200' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Orders List Container */}
          <div className="space-y-4">
            {(() => {
              const query = orderSearchQuery.trim().toLowerCase();
              const filteredOrders = storeOrders.filter(order => {
                const matchesStatus = orderStatusFilter === 'all' || order.status === orderStatusFilter;
                if (!matchesStatus) return false;
                if (!query) return true;

                const recipient = String(order.deliveryAddress?.recipientName || (order as any).shippingAddress?.recipientName || order.customerName || '');
                const phone = String(order.deliveryAddress?.phone || (order as any).shippingAddress?.phone || order.customerPhone || '');
                const orderId = String(order.id || '');
                const groupCode = String(order.orderGroupCode || '');
                const itemsText = (order.items || []).map(i => i?.productName || '').join(' ');

                return (
                  orderId.toLowerCase().includes(query) ||
                  groupCode.toLowerCase().includes(query) ||
                  recipient.toLowerCase().includes(query) ||
                  phone.toLowerCase().includes(query) ||
                  itemsText.toLowerCase().includes(query)
                );
              });

              if (filteredOrders.length === 0) {
                return (
                  <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-2xs space-y-3">
                    <ShoppingBag className="w-12 h-12 mx-auto text-stone-300" />
                    <h3 className="font-bold text-stone-800 text-base">No hay pedidos para mostrar</h3>
                    <p className="text-xs text-stone-500 max-w-md mx-auto">
                      {orderSearchQuery
                        ? `No se encontraron pedidos que coincidan con "${orderSearchQuery}". Intenta con otro término.`
                        : orderStatusFilter !== 'all'
                        ? `Actualmente no tienes pedidos en estado "${orderStatusFilter}".`
                        : 'Cuando los clientes compren productos de tu tienda en PlazaDO, aparecerán aquí automáticamente en tiempo real.'}
                    </p>
                    {orderSearchQuery && (
                      <button
                        onClick={() => setOrderSearchQuery('')}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold"
                      >
                        Limpiar búsqueda
                      </button>
                    )}
                  </div>
                );
              }

              return filteredOrders.map(order => {
                const statusMeta = getStatusDisplay(order.status);
                const StatusIcon = statusMeta.icon;
                const recipientName = String(order.deliveryAddress?.recipientName || (order as any).shippingAddress?.recipientName || order.customerName || 'Cliente');
                const recipientPhone = String(order.deliveryAddress?.phone || (order as any).shippingAddress?.phone || order.customerPhone || '');
                const cleanPhone = recipientPhone.replace(/\D/g, '');
                const formattedWhatsApp = cleanPhone.startsWith('1') ? cleanPhone : `1${cleanPhone}`;
                const itemsList = order.items || [];

                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs transition-all hover:border-stone-300">
                    {/* Order Card Top Bar */}
                    <div className="p-4 sm:px-5 bg-stone-50/70 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-xs text-stone-900">{order.id}</span>
                          {order.orderGroupCode && (
                            <span className="text-[11px] text-stone-500 bg-stone-200/60 px-1.5 py-0.5 rounded font-mono">
                              {order.orderGroupCode}
                            </span>
                          )}
                        </div>

                        {/* Status Badge */}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${statusMeta.color}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span>{statusMeta.label}</span>
                        </span>

                        {/* Payment status badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.paymentStatus === 'PAID' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {order.paymentStatus === 'PAID' ? '✓ PAGADO' : '⏳ PAGO PENDIENTE'}
                        </span>

                        {/* Payment method */}
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-stone-200 text-stone-600 flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-stone-400" />
                          {order.paymentMethod === 'CARD_AZUL' ? 'Tarjeta AZUL' : order.paymentMethod === 'CASH_ON_DELIVERY' ? 'Contra Entrega' : 'Transferencia'}
                        </span>

                        {order.fulfillmentType === 'PLAZADO_FULFILLMENT' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <Warehouse className="w-3 h-3 text-amber-700" />
                            PLAZADO FULFILLMENT
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-stone-500">
                        <span>{formatDateSafe(order.createdAt)}</span>
                      </div>
                    </div>

                    {/* Order Details: 3 Columns (Products, Destination/Client, Financials) */}
                    <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
                      {/* Col 1: Products (5 cols) */}
                      <div className="lg:col-span-5 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-400 text-[10px] uppercase tracking-wider">
                            Artículos en este pedido ({itemsList.length})
                          </span>
                        </div>

                        <div className="space-y-2">
                          {itemsList.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3 p-2 bg-stone-50 rounded-xl border border-stone-100">
                              <div className="flex items-center gap-2.5 min-w-0">
                                {item.productImage ? (
                                  <img
                                    src={item.productImage}
                                    alt={item.productName}
                                    className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0 bg-white"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-stone-200 flex items-center justify-center shrink-0">
                                    <Package className="w-5 h-5 text-stone-400" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="truncate font-bold text-stone-800 leading-snug">{item.productName}</p>
                                  <p className="text-[11px] text-stone-500">
                                    Cant: <strong className="text-stone-700">{item.quantity}</strong> × RD$ {formatDOP(item.price)}
                                    {item.sku && <span className="ml-1 text-[10px] font-mono text-stone-400">({item.sku})</span>}
                                  </p>
                                </div>
                              </div>
                              <span className="font-bold text-stone-900 shrink-0 text-right">
                                RD$ {formatDOP((item.price || 0) * (item.quantity || 0))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Col 2: Customer & Delivery Information (4 cols) */}
                      <div className="lg:col-span-4 space-y-2.5 bg-stone-50/50 p-3.5 rounded-xl border border-stone-100">
                        <span className="font-bold text-stone-400 text-[10px] uppercase tracking-wider block">
                          Cliente y Entrega
                        </span>

                        <div className="space-y-1">
                          <p className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                            <span>{recipientName}</span>
                          </p>

                          <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                            {recipientPhone && (
                              <span className="text-stone-600 font-mono text-xs">{recipientPhone}</span>
                            )}
                            <button
                              onClick={() => openOrderChat(order.id)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-md font-bold text-xs border border-red-200 transition-colors shadow-2xs"
                              title="Abrir chat oficial en la plataforma con el cliente"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-red-600" />
                              <span>Chat con Cliente</span>
                              {getOrderUnreadCount(order.id, 'STORE') > 0 && (
                                <span className="w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center">
                                  {getOrderUnreadCount(order.id, 'STORE')}
                                </span>
                              )}
                            </button>
                          </div>

                          <div className="pt-1 text-stone-600 leading-relaxed text-xs">
                            <div className="flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                {order.deliveryAddress?.label && (
                                  <span className="inline-block px-1.5 py-0.5 bg-stone-100 text-stone-700 rounded text-[10px] font-bold">
                                    📍 {order.deliveryAddress.label}
                                  </span>
                                )}
                                <p className="font-semibold text-stone-800">
                                  {order.deliveryAddress?.street || (order as any).shippingAddress?.street || 'Dirección de entrega'}
                                  {order.deliveryAddress?.buildingNumber ? ` #${order.deliveryAddress.buildingNumber}` : ''}
                                  {(order.deliveryAddress?.sector || (order as any).shippingAddress?.sector) ? `, ${order.deliveryAddress?.sector || (order as any).shippingAddress?.sector}` : ''}
                                </p>
                                <p className="text-stone-500 text-[11px]">
                                  {order.deliveryAddress?.municipality || (order as any).shippingAddress?.municipality || ''}
                                  {(order.deliveryAddress?.province || (order as any).shippingAddress?.province) ? `, ${order.deliveryAddress?.province || (order as any).shippingAddress?.province}` : 'República Dominicana'}
                                </p>
                                {order.deliveryAddress?.reference && (
                                  <p className="text-[11px] text-stone-500 italic pt-0.5">
                                    <strong className="text-stone-700">Ref:</strong> {order.deliveryAddress.reference}
                                  </p>
                                )}
                                {order.deliveryAddress?.deliveryNotes && (
                                  <p className="text-[11px] text-blue-900 bg-blue-50/70 p-1.5 rounded border border-blue-100 mt-1">
                                    <strong className="text-blue-950">Indicaciones:</strong> {order.deliveryAddress.deliveryNotes}
                                  </p>
                                )}
                                {order.deliveryAddress?.locationUrl && (
                                  <div className="pt-1">
                                    <a
                                      href={order.deliveryAddress.locationUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 hover:underline"
                                    >
                                      <ExternalLink className="w-3 h-3" />
                                      <span>Ver mapa GPS de entrega</span>
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {order.customerNotes && (
                            <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-900">
                              <span className="font-bold block">Nota del Comprador:</span>
                              {order.customerNotes}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Col 3: Financial Summary & Store Earnings (3 cols) */}
                      <div className="lg:col-span-3 space-y-2 bg-stone-50 p-3.5 rounded-xl border border-stone-200 flex flex-col justify-between">
                        <div>
                          <span className="font-bold text-stone-400 text-[10px] uppercase tracking-wider block mb-2">
                            Liquidación de Venta
                          </span>

                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between text-stone-600">
                              <span>Subtotal productos:</span>
                              <span className="font-semibold">RD$ {formatDOP(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-stone-600">
                              <span>Envío tienda:</span>
                              <span className="font-semibold">RD$ {formatDOP(order.shippingCost)}</span>
                            </div>
                            <div className="flex justify-between text-rose-600">
                              <span>Comisión Plaza (5%):</span>
                              <span>-RD$ {formatDOP(order.plazaCommissionAmount)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-stone-200 pt-2">
                          <div className="flex justify-between items-baseline">
                            <span className="font-bold text-stone-800 text-xs">Ganancia Neta:</span>
                            <span className="text-base font-black text-emerald-700">
                              RD$ {formatDOP(order.storeNetEarnings)}
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            {order.status === 'DELIVERED' ? '✓ Fondos acreditados en tu Balance' : 'En custodia hasta validar entrega'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Order Workflow Actions Footer */}
                    <div className="p-3.5 sm:px-5 bg-stone-50/50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
                      {/* Left: Progression Flow Buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {order.fulfillmentType === 'PLAZADO_FULFILLMENT' ? (
                          <>
                            {order.status === 'PENDING_STORE_CONFIRMATION' && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  onClick={async () => {
                                    const res = await confirmOrderByStore(order.id, store.id);
                                    if (res.success) {
                                      showNotification('¡Pedido confirmado! Se ha emitido la orden al almacén de Plazado.', 'success');
                                    } else {
                                      showNotification(res.message, 'error');
                                    }
                                  }}
                                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                                >
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                  <span>Confirmar Pedido (Autorizar Preparación en Almacén)</span>
                                </button>

                                <button
                                  onClick={() => {
                                    const reason = window.prompt('Por favor indique el motivo del rechazo del pedido para liberar la reserva preventiva:');
                                    if (reason && reason.trim()) {
                                      rejectOrderByStore(order.id, store.id, reason.trim()).then(res => {
                                        if (res.success) {
                                          showNotification('Pedido rechazado y unidades devueltas a disponible.', 'info');
                                        } else {
                                          showNotification(res.message, 'error');
                                        }
                                      });
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Rechazar Pedido</span>
                                </button>
                              </div>
                            )}

                            {order.status !== 'PENDING_STORE_CONFIRMATION' && order.status !== 'CANCELLED' && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                                  <Warehouse className="w-4 h-4 text-amber-600" />
                                  <span>Logística a cargo de Plazado Fulfillment</span>
                                </div>
                                <button
                                  onClick={() => setActiveTab('fulfillment')}
                                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                                >
                                  <span>Ver Seguimiento en Almacén</span>
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            {order.status === 'PENDING' && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Confirmar Pedido
                              </button>
                            )}

                            {order.status === 'CONFIRMED' && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                                className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                              >
                                <Package className="w-3.5 h-3.5" />
                                Iniciar Preparación
                              </button>
                            )}

                            {order.status === 'PREPARING' && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'READY_FOR_PICKUP')}
                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                Listo para Despacho
                              </button>
                            )}

                            {order.status === 'READY_FOR_PICKUP' && (
                              <button
                                onClick={() => handleUpdateStatus(order.id, 'SHIPPED')}
                                className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
                              >
                                <Truck className="w-3.5 h-3.5" />
                                Despachar / En Camino
                              </button>
                            )}

                            {order.status === 'SHIPPED' && (
                              <button
                                onClick={() => {
                                  setValidatingDeliveryOrder(order);
                                  setSecretCodeInput('');
                                  setSecretCodeError(null);
                                }}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                              >
                                <Key className="w-4 h-4 text-emerald-200" />
                                <span>Validar Código Secreto de Entrega</span>
                              </button>
                            )}
                          </>
                        )}

                        {order.status === 'DELIVERED' && (
                          <div className="flex flex-col items-start gap-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl shadow-2xs">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Entregado</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setDisputeOrder(order);
                                setDisputeDescription('');
                                setDisputeIssueType('DELIVERY_ISSUE');
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition-colors shadow-2xs"
                            >
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Generar reclamación</span>
                            </button>
                          </div>
                        )}

                        {/* Botón de Cancelación disponible para pedidos en curso */}
                        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setCancellingOrder(order);
                              setCancelReason('');
                              setCancelReasonError(null);
                            }}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
                          >
                            <X className="w-3.5 h-3.5 text-rose-500" />
                            <span>Cancelar Pedido</span>
                          </button>
                        )}

                        {order.status === 'CANCELLED' && (
                          <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-xl shadow-2xs">
                              <X className="w-3.5 h-3.5 text-rose-600" />
                              <span>Pedido cancelado</span>
                            </div>
                            {(order.cancelReason || order.statusHistory?.find(h => h.status === 'CANCELLED')?.note) && (
                              <p className="text-[11px] text-stone-600 font-medium">
                                <strong className="text-stone-800">Motivo:</strong> {order.cancelReason || order.statusHistory?.find(h => h.status === 'CANCELLED')?.note}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Tools (View Details, Print Packing Slip) */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingOrderDetails(order)}
                          className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-stone-500" />
                          <span>Ver Detalle</span>
                        </button>

                        <button
                          onClick={() => setPrintingPackingSlipOrder(order)}
                          className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                          title="Imprimir Hoja de Despacho"
                        >
                          <Printer className="w-3.5 h-3.5 text-stone-500" />
                          <span>Hoja de Despacho</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* MODAL 1: Validar Código Secreto de Entrega (Requerimiento #15) */}
      {validatingDeliveryOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Validar Entrega con Código Secreto</h3>
                  <span className="text-[11px] font-mono text-stone-400">{validatingDeliveryOrder.id}</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  setValidatingDeliveryOrder(null);
                  setSecretCodeInput('');
                  setSecretCodeError(null);
                }} 
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-stone-600 leading-relaxed">
              Solicita al cliente <strong>{validatingDeliveryOrder.deliveryAddress?.recipientName || (validatingDeliveryOrder as any).shippingAddress?.recipientName || validatingDeliveryOrder.customerName || 'Cliente'}</strong> el código secreto de 6 dígitos que figura en su orden de PlazaDO.
            </p>

            <div>
              <label className="block font-bold text-stone-800 mb-1.5">Código de Confirmación (6 dígitos):</label>
              <input
                type="text"
                maxLength={6}
                value={secretCodeInput}
                onChange={(e) => {
                  setSecretCodeInput(e.target.value.toUpperCase());
                  setSecretCodeError(null);
                }}
                placeholder="Ej: 482910"
                className="w-full text-center tracking-widest font-mono text-2xl py-3 bg-stone-50 border-2 border-stone-300 rounded-xl outline-none focus:border-red-500 focus:bg-white uppercase font-black transition-colors"
                autoFocus
              />
              {secretCodeError && (
                <p className="text-[11px] text-rose-600 font-bold mt-2 bg-rose-50 p-2 rounded-lg border border-rose-200">
                  {secretCodeError}
                </p>
              )}
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Liberación Inmediata de Fondos</span>
              </div>
              <p className="text-emerald-800 leading-normal">
                Al validar este código, el pedido se marcará como <strong>ENTREGADO</strong> y tu ganancia neta de <strong>RD$ {formatDOP(validatingDeliveryOrder.storeNetEarnings)}</strong> se acreditará inmediatamente a tu Balance Disponible para retiro.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setValidatingDeliveryOrder(null);
                  setSecretCodeInput('');
                  setSecretCodeError(null);
                }}
                className="px-4 py-2 text-stone-600 font-semibold hover:bg-stone-100 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirmDeliveryCode(validatingDeliveryOrder)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirmar y Acreditar Fondos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Ver Detalle Completo de Pedido */}
      {viewingOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-xs my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-stone-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-stone-900 text-base">Detalle del Pedido #{viewingOrderDetails.id}</h3>
                  {(() => {
                    const meta = getStatusDisplay(viewingOrderDetails.status);
                    return (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${meta.color}`}>
                        {meta.label}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-stone-500 text-[11px] mt-0.5">
                  Grupo de compra: <strong className="font-mono text-stone-700">{viewingOrderDetails.orderGroupCode}</strong> • Creado el {formatDateSafe(viewingOrderDetails.createdAt)}
                </p>
              </div>
              <button onClick={() => setViewingOrderDetails(null)} className="text-stone-400 hover:text-stone-700 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Notice if order was cancelled */}
            {viewingOrderDetails.status === 'CANCELLED' && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                  <X className="w-4 h-4 text-rose-600" />
                  <span>Pedido Cancelado por la Tienda</span>
                </div>
                {(viewingOrderDetails.cancelReason || viewingOrderDetails.statusHistory?.find(h => h.status === 'CANCELLED')?.note) && (
                  <p className="text-xs text-rose-900">
                    <strong className="text-rose-950 font-bold">Motivo de cancelación:</strong> {viewingOrderDetails.cancelReason || viewingOrderDetails.statusHistory?.find(h => h.status === 'CANCELLED')?.note}
                  </p>
                )}
                {viewingOrderDetails.cancelledAt && (
                  <p className="text-[10px] text-rose-600 font-medium">
                    Fecha de cancelación: {formatDateSafe(viewingOrderDetails.cancelledAt, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                  </p>
                )}
              </div>
            )}

            {/* Customer & Shipping Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider block">Datos del Cliente</span>
                <p className="font-bold text-stone-900 text-sm">
                  {viewingOrderDetails.deliveryAddress?.recipientName || (viewingOrderDetails as any).shippingAddress?.recipientName || viewingOrderDetails.customerName || 'Cliente'}
                </p>
                <p className="text-stone-600 font-mono">
                  Tel: {viewingOrderDetails.deliveryAddress?.phone || (viewingOrderDetails as any).shippingAddress?.phone || viewingOrderDetails.customerPhone || 'N/A'}
                </p>
                <p className="text-stone-600">
                  Email: {viewingOrderDetails.customerEmail || 'No especificado'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider block">Dirección de Envío</span>
                <p className="font-semibold text-stone-800">
                  {viewingOrderDetails.deliveryAddress?.street || (viewingOrderDetails as any).shippingAddress?.street || 'Dirección de entrega'}
                </p>
                <p className="text-stone-600">
                  Sector: {viewingOrderDetails.deliveryAddress?.sector || (viewingOrderDetails as any).shippingAddress?.sector || 'N/A'}
                </p>
                <p className="text-stone-600">
                  {viewingOrderDetails.deliveryAddress?.municipality || (viewingOrderDetails as any).shippingAddress?.municipality || ''}, {viewingOrderDetails.deliveryAddress?.province || (viewingOrderDetails as any).shippingAddress?.province || 'República Dominicana'}
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider block">Productos Solicitados</span>
              <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
                {(viewingOrderDetails.items || []).map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between gap-3 bg-white">
                    <div className="flex items-center gap-3 min-w-0">
                      {item.productImage ? (
                        <img src={item.productImage} alt={item.productName} className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-stone-400" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-stone-900 truncate">{item.productName}</p>
                        <p className="text-[11px] text-stone-500 font-mono">
                          {item.sku ? `SKU: ${item.sku} • ` : ''}RD$ {formatDOP(item.price)} × {item.quantity} unidad(es)
                        </p>
                      </div>
                    </div>
                    <span className="font-black text-stone-900 shrink-0">
                      RD$ {formatDOP((item.price || 0) * (item.quantity || 0))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
              <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider block">Resumen Financiero</span>
              <div className="space-y-1">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal de productos:</span>
                  <span className="font-semibold">RD$ {formatDOP(viewingOrderDetails.subtotal)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Costo de envío configurado por tu tienda:</span>
                  <span className="font-semibold">RD$ {formatDOP(viewingOrderDetails.shippingCost)}</span>
                </div>
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Comisión PlazaDO (5%):</span>
                  <span>-RD$ {formatDOP(viewingOrderDetails.plazaCommissionAmount)}</span>
                </div>
                <div className="border-t border-stone-200 pt-2 flex justify-between items-baseline text-stone-900">
                  <span className="font-bold text-sm">Tu Ganancia Neta:</span>
                  <span className="font-black text-lg text-emerald-700">RD$ {formatDOP(viewingOrderDetails.storeNetEarnings)}</span>
                </div>
              </div>
            </div>

            {/* Status History / Audit Trail */}
            {viewingOrderDetails.statusHistory && viewingOrderDetails.statusHistory.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider block">Historial de Estados y Auditoría</span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {viewingOrderDetails.statusHistory.map((hist, idx) => (
                    <div key={idx} className="p-2 bg-stone-50 rounded-lg border border-stone-200 flex items-start justify-between text-[11px] gap-2">
                      <div>
                        <span className="font-bold text-stone-800">{hist.status}</span>
                        {hist.note && <p className="text-stone-600 mt-0.5">{hist.note}</p>}
                        <p className="text-[10px] text-stone-400 mt-0.5">Por: {hist.updatedBy || 'Sistema'}</p>
                      </div>
                      <span className="text-[10px] text-stone-400 whitespace-nowrap">
                        {formatDateSafe(hist.timestamp, { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPrintingPackingSlipOrder(viewingOrderDetails);
                  }}
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-stone-600" />
                  Imprimir Despacho
                </button>
              </div>

              <div className="flex items-center gap-2">
                {viewingOrderDetails.status === 'DELIVERED' && (
                  <div className="flex flex-col items-end gap-1.5 mr-2">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Entregado</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDisputeOrder(viewingOrderDetails);
                        setDisputeDescription('');
                        setDisputeIssueType('DELIVERY_ISSUE');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg transition-colors shadow-2xs"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Generar reclamación</span>
                    </button>
                  </div>
                )}

                {viewingOrderDetails.status === 'SHIPPED' && (
                  <button
                    onClick={() => {
                      setValidatingDeliveryOrder(viewingOrderDetails);
                      setViewingOrderDetails(null);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Key className="w-3.5 h-3.5" />
                    Validar Código de Entrega
                  </button>
                )}

                {/* Cancel Order Action */}
                {viewingOrderDetails.status !== 'DELIVERED' && viewingOrderDetails.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    onClick={() => {
                      setCancellingOrder(viewingOrderDetails);
                      setCancelReason('');
                      setCancelReasonError(null);
                    }}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-rose-600" />
                    <span>Cancelar Pedido</span>
                  </button>
                )}

                <button
                  onClick={() => setViewingOrderDetails(null)}
                  className="px-4 py-2 bg-stone-900 text-white rounded-xl font-bold text-xs hover:bg-stone-800"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Hoja de Despacho / Packing Slip para Impresión */}
      {printingPackingSlipOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-8 shadow-2xl space-y-6 text-stone-900 my-8">
            {/* Action buttons (hidden when printing) */}
            <div className="flex justify-between items-center print:hidden border-b border-stone-200 pb-3">
              <span className="font-bold text-xs text-stone-500">Vista previa para impresión</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir Ahora
                </button>
                <button
                  onClick={() => setPrintingPackingSlipOrder(null)}
                  className="text-stone-400 hover:text-stone-700 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Packing Slip Body */}
            <div className="space-y-5 border-2 border-stone-800 p-6 rounded-xl bg-white text-xs">
              {/* Slip Header */}
              <div className="flex justify-between items-start border-b border-stone-300 pb-4">
                <div>
                  <h1 className="text-xl font-black text-stone-900 tracking-tight">PLAZADO.COM</h1>
                  <p className="text-[11px] text-stone-500 font-semibold">Marketplace Multi-Tienda Dominicano</p>
                  <div className="mt-2 text-xs">
                    <p className="font-bold text-stone-900">Tienda: {store.name}</p>
                    {store.bankInfo?.rncOrCedula && <p className="text-stone-500 text-[10px]">RNC / Cédula: {store.bankInfo.rncOrCedula}</p>}
                    <p className="text-stone-500 text-[10px]">Atención & Soporte: Chat Oficial PlazaDO</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2 py-1 bg-stone-900 text-white font-mono font-bold text-xs rounded">
                    HOJA DE DESPACHO
                  </span>
                  <p className="font-mono font-black text-sm text-stone-900 mt-2">{printingPackingSlipOrder.id}</p>
                  <p className="text-[10px] text-stone-500">Fecha: {new Date(printingPackingSlipOrder.createdAt).toLocaleDateString('es-DO')}</p>
                  <p className="text-[10px] font-bold mt-1 text-stone-800">
                    Método: {printingPackingSlipOrder.paymentMethod === 'CARD_AZUL' ? 'Tarjeta AZUL (PAGADO)' : printingPackingSlipOrder.paymentMethod === 'CASH_ON_DELIVERY' ? 'CONTRA ENTREGA' : 'Transferencia'}
                  </p>
                </div>
              </div>

              {/* Destination Address */}
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200">
                <span className="font-bold text-[10px] uppercase text-stone-400 tracking-wider block mb-1">Destinatario / Entrega</span>
                <p className="font-black text-sm text-stone-900">
                  {printingPackingSlipOrder.deliveryAddress?.recipientName || (printingPackingSlipOrder as any).shippingAddress?.recipientName || printingPackingSlipOrder.customerName || 'Cliente'}
                </p>
                <p className="font-mono text-stone-800 font-bold">
                  Teléfono: {printingPackingSlipOrder.deliveryAddress?.phone || (printingPackingSlipOrder as any).shippingAddress?.phone || printingPackingSlipOrder.customerPhone || 'N/A'}
                </p>
                <p className="text-stone-700 mt-1">
                  {printingPackingSlipOrder.deliveryAddress?.street || (printingPackingSlipOrder as any).shippingAddress?.street || ''}
                  {(printingPackingSlipOrder.deliveryAddress?.sector || (printingPackingSlipOrder as any).shippingAddress?.sector) ? `, ${printingPackingSlipOrder.deliveryAddress?.sector || (printingPackingSlipOrder as any).shippingAddress?.sector}` : ''}
                </p>
                <p className="text-stone-600 font-semibold">
                  {printingPackingSlipOrder.deliveryAddress?.municipality || (printingPackingSlipOrder as any).shippingAddress?.municipality || ''}, {printingPackingSlipOrder.deliveryAddress?.province || (printingPackingSlipOrder as any).shippingAddress?.province || 'República Dominicana'}
                </p>
                {printingPackingSlipOrder.customerNotes && (
                  <p className="mt-2 text-[10px] text-amber-900 font-medium bg-amber-50 p-1.5 rounded border border-amber-200">
                    Nota: {printingPackingSlipOrder.customerNotes}
                  </p>
                )}
              </div>

              {/* Items Table */}
              <div>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-stone-800 text-[10px] uppercase text-stone-600">
                      <th className="py-1">Cant.</th>
                      <th className="py-1">Descripción</th>
                      <th className="py-1 text-right">Precio</th>
                      <th className="py-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {(printingPackingSlipOrder.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2 font-bold">{item.quantity}</td>
                        <td className="py-2">
                          <p className="font-semibold text-stone-800">{item.productName}</p>
                          {item.sku && <span className="text-[10px] text-stone-400 font-mono">SKU: {item.sku}</span>}
                        </td>
                        <td className="py-2 text-right text-stone-600">RD$ {formatDOP(item.price)}</td>
                        <td className="py-2 text-right font-bold text-stone-900">RD$ {formatDOP((item.price || 0) * (item.quantity || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total & Courier signature */}
              <div className="border-t-2 border-stone-800 pt-3 flex justify-between items-end">
                <div className="space-y-6">
                  <div className="w-48 border-b border-stone-400 pb-1 mt-6">
                    <span className="text-[9px] text-stone-400 uppercase">Firma del Destinatario al recibir</span>
                  </div>
                </div>

                <div className="text-right space-y-1 text-xs">
                  <div className="flex justify-between gap-6 text-stone-600">
                    <span>Subtotal:</span>
                    <span>RD$ {formatDOP(printingPackingSlipOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between gap-6 text-stone-600">
                    <span>Envío:</span>
                    <span>RD$ {formatDOP(printingPackingSlipOrder.shippingCost)}</span>
                  </div>
                  <div className="flex justify-between gap-6 font-black text-sm text-stone-900 border-t border-stone-300 pt-1">
                    <span>TOTAL A COBRAR:</span>
                    <span>RD$ {formatDOP(printingPackingSlipOrder.total)}</span>
                  </div>
                  {printingPackingSlipOrder.paymentMethod === 'CARD_AZUL' && (
                    <span className="inline-block text-[10px] font-bold text-emerald-700 uppercase">
                      *** PAGADO CON TARJETA EN LÍNEA ***
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Cancelar Pedido por la Tienda con Motivo Obligatorio */}
      {cancellingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs my-8 animate-in fade-in zoom-in-95 duration-200 border border-stone-200">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-black text-stone-900 text-sm">Cancelar Pedido #{cancellingOrder.id}</h3>
                  <p className="text-[11px] text-stone-500">
                    Cliente: <strong>{cancellingOrder.customerName}</strong> • Total: RD$ {formatDOP(cancellingOrder.total)}
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setCancellingOrder(null);
                  setCancelReason('');
                  setCancelReasonError(null);
                }}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error banner if any */}
            {cancelReasonError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{cancelReasonError}</span>
              </div>
            )}

            {/* Explanatory notice */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
              <span className="font-bold block">Importante sobre la cancelación:</span>
              <p className="text-[11px] leading-relaxed text-amber-800">
                Al cancelar este pedido, el comprador verá el motivo que especifiques a continuación en su historial de compras y el pedido quedará anulado sin cobros ni comisiones.
              </p>
            </div>

            {/* Fast chip selector for common reasons */}
            <div>
              <label className="block font-bold text-stone-700 mb-1.5">
                Motivos comunes (haz clic para autocompletar):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Artículo agotado en inventario',
                  'Cliente solicitó cancelación',
                  'Dirección de entrega fuera de cobertura',
                  'Imposible contactar al comprador',
                  'Discrepancia en precio o variante'
                ].map((reasonChip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCancelReason(reasonChip);
                      setCancelReasonError(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors border ${
                      cancelReason === reasonChip
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                    }`}
                  >
                    {reasonChip}
                  </button>
                ))}
              </div>
            </div>

            {/* Reason Textarea (Requerimiento crítico) */}
            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Motivo de la Cancelación <span className="text-rose-600">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  if (cancelReasonError) setCancelReasonError(null);
                }}
                placeholder="Escribe detalladamente la razón por la cual no es posible completar este pedido..."
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl outline-none focus:border-rose-500 font-medium text-stone-900 placeholder:text-stone-400"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Este mensaje quedará registrado en el historial del pedido y será visible para el cliente y el Super Admin.
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setCancellingOrder(null);
                  setCancelReason('');
                  setCancelReasonError(null);
                }}
                className="px-4 py-2 text-stone-600 hover:text-stone-900 font-semibold rounded-xl"
              >
                No cancelar / Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelOrder}
                disabled={isSubmittingCancellation || !cancelReason.trim()}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>{isSubmittingCancellation ? 'Cancelando...' : 'Confirmar Cancelación'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CHAT DE CLIENTES (CANAL EXCLUSIVO TRAS COMPRA CONFIRMADA) */}
      {activeTab === 'chats' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900">Mensajería y Chat con Clientes</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                  Canal Oficial PlazaDO
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Comunícate exclusivamente a través de la plataforma con los clientes que tengan pedidos confirmados.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-500 font-medium">
                {storeOrders.length} {storeOrders.length === 1 ? 'pedido registrado' : 'pedidos registrados'}
              </span>
            </div>
          </div>

          {storeOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500 space-y-3">
              <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-stone-800">Aún no tienes pedidos registrados</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Cuando los clientes realicen y confirmen compras en tu vitrina, podrás chatear con ellos aquí para coordinar la preparación y entrega.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {storeOrders.map((order) => {
                const unreadCount = getOrderUnreadCount(order.id, 'STORE');
                const orderMsgs = orderMessages.filter(m => m.orderId === order.id);
                const lastMsg = orderMsgs[orderMsgs.length - 1];

                return (
                  <div 
                    key={order.id}
                    className={`bg-white rounded-2xl border p-4 sm:p-5 transition-all hover:shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                      unreadCount > 0 ? 'border-red-300 ring-2 ring-red-100' : 'border-stone-200'
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        unreadCount > 0 ? 'bg-red-600 text-white shadow-xs' : 'bg-stone-100 text-stone-600 border border-stone-200'
                      }`}>
                        <MessageSquare className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-stone-900 text-sm">{order.customerName}</h4>
                          <span className="font-mono text-xs text-stone-400">#{order.id.replace('ORD-', '')}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            order.status === 'DELIVERED' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : order.status === 'SHIPPED'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}>
                            {order.status === 'DELIVERED' ? 'Entregado' : order.status === 'SHIPPED' ? 'En Camino' : 'En Preparación'}
                          </span>
                          {unreadCount > 0 && (
                            <span className="text-[10px] font-extrabold bg-red-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                              {unreadCount} {unreadCount === 1 ? 'nuevo mensaje' : 'nuevos mensajes'}
                            </span>
                          )}
                        </div>

                        {lastMsg ? (
                          <p className="text-xs text-stone-600 truncate max-w-xl">
                            <span className="font-semibold text-stone-700">
                              {lastMsg.senderRole === 'STORE' ? 'Tú: ' : `${lastMsg.senderName}: `}
                            </span>
                            {lastMsg.message}
                          </p>
                        ) : (
                          <p className="text-xs text-stone-400 italic">
                            Sin mensajes todavía. Inicia la conversación con el cliente para coordinar la entrega.
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-stone-500 pt-0.5">
                          <span>{order.items.length} artículos</span>
                          <span>•</span>
                          <span className="font-semibold text-stone-700">Total: RD$ {order.total.toLocaleString()}</span>
                          <span>•</span>
                          <span>{order.deliveryAddress?.municipality || 'Dirección registrada'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 w-full md:w-auto flex items-center justify-end">
                      <button
                        onClick={() => openOrderChat(order.id)}
                        className={`w-full md:w-auto px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${
                          unreadCount > 0
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-stone-900 hover:bg-stone-800 text-white'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Abrir Chat con Cliente</span>
                        {unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-white text-red-600 text-[10px] font-black flex items-center justify-center ml-0.5">
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CATÁLOGO DE PRODUCTOS (Requerimiento #16 y #17) */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-stone-900">Catálogo de Productos de {store.name}</h2>
              <p className="text-xs text-stone-500">Gestiona precios, ofertas, inventario y alertas de stock bajo</p>
            </div>

            <button
              id="store-add-product-btn"
              onClick={() => handleOpenProductModal()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Publicar Nuevo Producto</span>
            </button>
          </div>

          {/* Products Grid / Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {storeProducts.map(product => {
              const isLow = product.stock <= product.minStockAlert;
              const isOutOfStock = product.stock <= 0;
              const isPublished = product.status === 'published' || product.status === 'active';
              const isPaused = product.status === 'paused';
              const isDraft = product.status === 'draft';
              const isFulfillment = Boolean(product.isFulfillment || storeFulfillmentItems.some(fi => fi.productId === product.id));

              return (
                <div key={product.id} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs space-y-3 flex flex-col justify-between">
                  <div className="flex gap-3">
                    <img src={product.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover bg-stone-100 border border-stone-200 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-1 flex-wrap">
                        <span className="font-mono text-[10px] text-stone-400">SKU: {product.sku}</span>
                        {isFulfillment && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                            <Warehouse className="w-2.5 h-2.5 text-amber-700" />
                            Fulfillment
                          </span>
                        )}
                        {isPublished && !isOutOfStock && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Publicado
                          </span>
                        )}
                        {isPaused && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Pausado
                          </span>
                        )}
                        {isDraft && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                            Borrador
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            Agotado
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-xs text-stone-900 line-clamp-2">{product.name}</h4>
                      <p className="text-xs font-bold text-stone-800 mt-1">
                        RD$ {product.price.toLocaleString()}
                        {product.promoPrice && (
                          <span className="ml-1.5 text-red-600 font-extrabold text-[11px]">
                            (Oferta: RD$ {product.promoPrice.toLocaleString()})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                    <span className={`font-semibold ${isOutOfStock ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-700'}`}>
                      {isFulfillment ? (
                        <span className="inline-flex items-center gap-1 text-amber-900 font-bold text-[11px]">
                          <Warehouse className="w-3.5 h-3.5 text-amber-600" />
                          Almacén: {product.stock} {isOutOfStock ? '(Agotado)' : 'uds'}
                        </span>
                      ) : (
                        `Stock: ${product.stock} ${isOutOfStock ? '(Agotado)' : isLow ? '(Bajo stock)' : 'uds'}`
                      )}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          const newStatus: ProductStatus = isPublished ? 'paused' : 'published';
                          updateProduct(product.id, { status: newStatus });
                          showNotification(
                            newStatus === 'published' 
                              ? `"${product.name}" ahora está publicado en el catálogo global de PlazaDO` 
                              : `"${product.name}" pausado (oculto del catálogo público)`
                          );
                        }}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isPublished 
                            ? 'text-amber-600 hover:text-amber-700 bg-amber-50/70 border-amber-200 hover:bg-amber-100' 
                            : 'text-emerald-600 hover:text-emerald-700 bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100'
                        }`}
                        title={isPublished ? 'Pausar del catálogo público' : 'Publicar en el catálogo global'}
                      >
                        {isPublished ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleOpenProductModal(product)}
                        className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('¿Seguro que deseas eliminar este producto?')) {
                            deleteProduct(product.id);
                          }
                        }}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: Crear/Editar Producto */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <h3 className="font-bold text-stone-900 text-sm">
                {editingProduct ? 'Editar Producto' : 'Publicar Nuevo Producto'}
              </h3>
              <button onClick={() => setProductModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">SKU / Código Único *</label>
                <input
                  type="text"
                  required
                  value={pSku}
                  onChange={(e) => setPSku(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Categoría del Catálogo Global *</label>
                  <select
                    id="store-product-category-select"
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg outline-none font-medium text-stone-800 focus:border-red-500 focus:bg-white transition-colors"
                    required
                  >
                    {categories.filter(c => !c.parentId).map(parent => {
                      const children = categories.filter(c => c.parentId === parent.id);
                      if (children.length > 0) {
                        return (
                          <optgroup key={parent.id} label={parent.name}>
                            <option value={parent.id}>{parent.name} (General)</option>
                            {children.map(child => (
                              <option key={child.id} value={child.id}>
                                &nbsp;&nbsp;↳ {child.name}
                              </option>
                            ))}
                          </optgroup>
                        );
                      }
                      return (
                        <option key={parent.id} value={parent.id}>
                          {parent.name}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Estado de Publicación *</label>
                  <select
                    value={pStatus}
                    onChange={(e) => setPStatus(e.target.value as ProductStatus)}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg outline-none font-semibold text-stone-800"
                  >
                    <option value="published">🟢 Publicado (Visible en Catálogo Global)</option>
                    <option value="paused">🟡 Pausado (Oculto del Catálogo)</option>
                    <option value="draft">⚪ Borrador (Solo en tu panel)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Precio Regular (RD$) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={pPrice}
                    onChange={(e) => setPPrice(Number(e.target.value))}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Precio Oferta (Opcional)</label>
                  <input
                    type="number"
                    min={0}
                    value={pPromoPrice || ''}
                    onChange={(e) => setPPromoPrice(e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="Dejar vacío si no aplica"
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              {/* If Fulfillment product, show notice & disable manual stock adjustment */}
              {editingProduct && (editingProduct.isFulfillment || storeFulfillmentItems.some(fi => fi.productId === editingProduct.id)) && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900">
                  <Warehouse className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-black text-amber-950">Producto en Plazado Fulfillment (Stock Físico Protegido)</p>
                    <p className="text-amber-800 text-[11px] mt-0.5">
                      Este producto se encuentra almacenado y custodiado por Plazado.
                      Las cantidades solo se modifican mediante conteo y recepción física en almacén.
                      Para enviar más unidades o solicitar retiro, utiliza el módulo <strong>Plazado Fulfillment</strong>.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Stock Disponible *
                    {editingProduct && (editingProduct.isFulfillment || storeFulfillmentItems.some(fi => fi.productId === editingProduct.id)) && (
                      <span className="ml-2 text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                        Bloqueado (Fulfillment)
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={pStock}
                    disabled={Boolean(editingProduct && (editingProduct.isFulfillment || storeFulfillmentItems.some(fi => fi.productId === editingProduct.id)))}
                    onChange={(e) => setPStock(Number(e.target.value))}
                    className={`w-full p-2 rounded-lg outline-none ${
                      editingProduct && (editingProduct.isFulfillment || storeFulfillmentItems.some(fi => fi.productId === editingProduct.id))
                        ? 'bg-stone-100 text-stone-500 border border-stone-200 cursor-not-allowed'
                        : 'bg-stone-50 border border-stone-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Alerta de Bajo Stock</label>
                  <input
                    type="number"
                    min={1}
                    value={pMinAlert}
                    onChange={(e) => setPMinAlert(Number(e.target.value))}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <ProductImagesManager
                  images={pImagesList}
                  onChange={setPImagesList}
                  maxImages={5}
                  minRecommended={1}
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Descripción del Producto</label>
                <textarea
                  rows={3}
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 text-stone-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-xs"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: FINANZAS Y LIQUIDACIONES (Requerimiento #21, #22, #23) */}
      {activeTab === 'finances' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-base font-bold text-stone-900">Finanzas y Liquidaciones Bancarias</h2>
              <p className="text-xs text-stone-500">Control de cobros, comisiones de PlazaDO y solicitudes de desembolso</p>
            </div>

            <button
              onClick={() => {
                setSettlementAmount(currentBalance.availableBalance);
                setSettlementModalOpen(true);
              }}
              disabled={currentBalance.availableBalance < 500}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 disabled:opacity-40"
            >
              <DollarSign className="w-4 h-4" />
              <span>Solicitar Desembolso a Banco</span>
            </button>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Balance Disponible</span>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                RD$ {currentBalance.availableBalance.toLocaleString()}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Fondos liberados listos para transferir</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Balance en Custodia</span>
              <div className="text-2xl font-black text-amber-600 mt-1">
                RD$ {currentBalance.pendingBalance.toLocaleString()}
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Esperando confirmación con código de entrega</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Cuenta Registrada</span>
              <div className="text-sm font-bold text-stone-900 mt-1 truncate">
                {store.bankInfo?.bank}
              </div>
              <p className="text-[11px] font-mono text-stone-500 mt-1 truncate">
                {store.bankInfo?.accountNumber} ({store.bankInfo?.accountType})
              </p>
            </div>
          </div>

          {/* Settlements History Table */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs p-5 space-y-4">
            <h3 className="font-bold text-sm text-stone-900">Historial de Desembolsos y Transferencias</h3>

            {storeSettlements.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center">No hay liquidaciones solicitadas todavía.</p>
            ) : (
              <div className="divide-y divide-stone-100 text-xs">
                {storeSettlements.map(s => (
                  <div key={s.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-stone-800">{s.id}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {s.status === 'PAID' ? 'PAGADO' : 'PENDIENTE DE TRANSFERENCIA'}
                        </span>
                      </div>
                      <p className="text-stone-500 mt-0.5">
                        {s.paymentMethodName} • Cuenta: {s.accountNumberMasked} • {new Date(s.createdAt).toLocaleDateString()}
                      </p>
                      {s.bankReference && (
                        <p className="text-[11px] text-emerald-800 font-mono mt-0.5">
                          Ref Bancaria: {s.bankReference}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="font-black text-sm text-stone-900">RD$ {s.netAmount.toLocaleString()}</span>
                      <span className="block text-[11px] text-stone-400">Total Solicitado</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Solicitar Liquidación */}
      {settlementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <h3 className="font-bold text-stone-900 text-sm">Solicitar Transferencia Bancaria</h3>
              <button onClick={() => setSettlementModalOpen(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestSettlement} className="space-y-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Monto a retirar (RD$)</label>
                <input
                  type="number"
                  min={500}
                  max={currentBalance.availableBalance}
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg text-sm font-bold outline-none focus:border-red-500"
                />
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Máximo disponible: RD$ {currentBalance.availableBalance.toLocaleString()} (Mínimo: RD$ 500)
                </span>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1 text-stone-600">
                <span className="font-bold text-stone-800 block">Cuenta de Destino:</span>
                <p>{store.bankInfo?.bank}</p>
                <p className="font-mono text-[11px]">{store.bankInfo?.accountNumber} ({store.bankInfo?.accountHolder})</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettlementModalOpen(false)}
                  className="px-4 py-2 text-stone-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold"
                >
                  Confirmar Solicitud
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: REPORTES DE VENTAS (Métricas diarias, semanales, mensuales y ranking de productos) */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-red-600" />
                <span>Reportes y Rendimiento de Ventas</span>
              </h2>
              <p className="text-xs text-stone-500">Métricas consolidadas de facturación, comisiones y productos estrella de {store.name}</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-600 bg-stone-100 px-3 py-1.5 rounded-xl">
              <Calendar className="w-4 h-4 text-stone-500" />
              <span>Actualizado al momento</span>
            </div>
          </div>

          {/* Temporal Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Today */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-stone-500 text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px]">Ventas de Hoy</span>
                <span className="text-[10px] bg-red-50 text-red-700 font-bold px-1.5 py-0.5 rounded">24 Horas</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-stone-900">
                RD$ {todaySales.toLocaleString()}
              </div>
              <div className="text-[11px] text-stone-500 flex justify-between pt-1 border-t border-stone-100">
                <span>{todayOrders.length} pedido(s)</span>
                <span className="text-emerald-700 font-bold">Neto: RD$ {todayNet.toLocaleString()}</span>
              </div>
            </div>

            {/* This Week */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-stone-500 text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px]">Últimos 7 Días</span>
                <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-1.5 py-0.5 rounded">Semanal</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-stone-900">
                RD$ {weekSales.toLocaleString()}
              </div>
              <div className="text-[11px] text-stone-500 flex justify-between pt-1 border-t border-stone-100">
                <span>{weekOrders.length} pedido(s)</span>
                <span className="text-emerald-700 font-bold">Neto: RD$ {weekNet.toLocaleString()}</span>
              </div>
            </div>

            {/* This Month */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-stone-500 text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px]">Mes Actual</span>
                <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-1.5 py-0.5 rounded">Mensual</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-stone-900">
                RD$ {monthSales.toLocaleString()}
              </div>
              <div className="text-[11px] text-stone-500 flex justify-between pt-1 border-t border-stone-100">
                <span>{monthOrders.length} pedido(s)</span>
                <span className="text-emerald-700 font-bold">Neto: RD$ {monthNet.toLocaleString()}</span>
              </div>
            </div>

            {/* Total Lifetime */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-stone-500 text-xs">
                <span className="font-bold uppercase tracking-wider text-[10px]">Total Histórico</span>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Acumulado</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-800">
                RD$ {totalLifetimeSales.toLocaleString()}
              </div>
              <div className="text-[11px] text-stone-500 flex justify-between pt-1 border-t border-stone-100">
                <span>Comisión PlazaDO (5%): -RD$ {totalCommissionPaid.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Ranking de Productos Más Vendidos */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Ranking de Productos Más Vendidos</span>
                </h3>
                <p className="text-xs text-stone-500">Listado ordenado por volumen de unidades facturadas</p>
              </div>
              <span className="text-xs font-semibold text-stone-500">
                {bestSellingProducts.length} producto(s) con ventas
              </span>
            </div>

            {bestSellingProducts.length === 0 ? (
              <div className="py-8 text-center text-stone-400 text-xs">
                <ShoppingBag className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                <p>Aún no se han registrado compras finalizadas para los productos de tu tienda.</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 text-xs">
                {bestSellingProducts.map((prod, index) => (
                  <div key={prod.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        index === 0 ? 'bg-amber-100 text-amber-900 ring-2 ring-amber-300' :
                        index === 1 ? 'bg-stone-200 text-stone-800' :
                        index === 2 ? 'bg-amber-50 text-amber-800' : 'bg-stone-100 text-stone-600'
                      }`}>
                        #{index + 1}
                      </span>
                      {prod.image ? (
                        <img
                          src={prod.image}
                          alt={prod.name}
                          className="w-10 h-10 rounded-xl object-cover border border-stone-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-stone-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-stone-900 text-xs sm:text-sm">{prod.name}</p>
                        <p className="text-[11px] text-stone-500">
                          Precio actual: RD$ {prod.price.toLocaleString()} • Stock restante: {prod.stock} ud(s)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-right sm:text-right pl-9 sm:pl-0">
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase">Unidades Vendidas</span>
                        <span className="font-extrabold text-stone-900 text-sm">{prod.unitsSold} uds</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block uppercase">Total Facturado</span>
                        <span className="font-extrabold text-emerald-700 text-sm">RD$ {prod.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Breakdown por Estados de Pedidos */}
          <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs space-y-3">
            <h3 className="font-bold text-sm text-stone-900">Resumen Operativo por Estado de Pedido</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                <span className="text-stone-500 block text-[11px]">Pendientes</span>
                <span className="text-lg font-black text-amber-600">
                  {storeOrders.filter(o => o.status === 'PENDING').length}
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                <span className="text-stone-500 block text-[11px]">Confirmados</span>
                <span className="text-lg font-black text-blue-600">
                  {storeOrders.filter(o => o.status === 'CONFIRMED').length}
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                <span className="text-stone-500 block text-[11px]">En Preparación</span>
                <span className="text-lg font-black text-indigo-600">
                  {storeOrders.filter(o => o.status === 'PREPARING').length}
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                <span className="text-stone-500 block text-[11px]">En Camino</span>
                <span className="text-lg font-black text-purple-600">
                  {storeOrders.filter(o => o.status === 'SHIPPED').length}
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                <span className="text-stone-500 block text-[11px]">Entregados</span>
                <span className="text-lg font-black text-emerald-700">
                  {storeOrders.filter(o => o.status === 'DELIVERED').length}
                </span>
              </div>
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                <span className="text-stone-500 block text-[11px]">Cancelados</span>
                <span className="text-lg font-black text-rose-600">
                  {storeOrders.filter(o => o.status === 'CANCELLED').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: CONFIGURACIÓN & ENVÍOS (Requerimiento #24 y #25) */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs space-y-6">
          <div>
            <h2 className="text-base font-bold text-stone-900">Configuración Comercial y Envíos</h2>
            <p className="text-xs text-stone-500">Define tus tarifas de mensajería, plazos de entrega y datos bancarios</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Store Information */}
            <div className="space-y-4">
              <h3 className="font-bold text-stone-800 uppercase tracking-wider text-[11px] pb-2 border-b border-stone-100">
                Información de la Tienda
              </h3>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg outline-none"
                />
              </div>

              {/* Logo de la Tienda */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <ImageUploadInput
                  label="Logo de la Tienda"
                  value={storeLogo}
                  onChange={setStoreLogo}
                  shape="rounded"
                  aspectRatioLabel="Sube el logo de tu marca (PNG, JPG)"
                  placeholder="https://ejemplo.com/logo.png"
                  helpText="Se mostrará en la cabecera, vitrina de tu tienda y productos."
                />
              </div>

              {/* Banner de Portada de la Tienda */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                <ImageUploadInput
                  label="Banner de Portada de la Tienda"
                  value={storeBanner}
                  onChange={setStoreBanner}
                  presetAvatars={PRESET_STORE_BANNERS}
                  shape="banner"
                  aspectRatioLabel="Sube el banner o portada de tu comercio (Recomendado: 1200 x 350 px, PNG o JPG)"
                  placeholder="https://ejemplo.com/banner-portada.jpg"
                  helpText="Se mostrará en la cabecera panorámica de tu vitrina y en el directorio de tiendas."
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Descripción del Comercio</label>
                <textarea
                  rows={3}
                  value={storeDesc}
                  onChange={(e) => setStoreDesc(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-lg outline-none"
                />
              </div>
            </div>

            {/* Shipping Configuration (Requerimiento #25) */}
            <div className="space-y-4">
              <h3 className="font-bold text-stone-800 uppercase tracking-wider text-[11px] pb-2 border-b border-stone-100">
                Políticas de Envío y Despacho
              </h3>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Tarifa Fija de Envío (RD$)</label>
                <input
                  type="number"
                  min={0}
                  value={shippingRate}
                  onChange={(e) => setShippingRate(Number(e.target.value))}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg outline-none"
                />
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Este monto se cobra al comprador por los productos de tu tienda.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Monto Mínimo para Envío Gratis (RD$)</label>
                <input
                  type="number"
                  min={0}
                  value={freeShippingMin}
                  onChange={(e) => setFreeShippingMin(Number(e.target.value))}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Tiempo Estimado de Entrega</label>
                <input
                  type="text"
                  value={shippingDays}
                  onChange={(e) => setShippingDays(e.target.value)}
                  placeholder="Ej: 24 a 48 horas en Santo Domingo"
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg outline-none"
                />
              </div>
            </div>

            {/* Bank Account Settings - Cuenta para recibir pagos (Liquidación de los Viernes) */}
            <div className="md:col-span-2 space-y-4 pt-4 border-t border-stone-200">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>Cuenta para Recibir Pagos (Liquidaciones Semanales de los Viernes)</span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
                  En esta cuenta bancaria recibirás la transferencia con tus fondos netos acumulados por ventas de cada semana (todos los viernes). 
                  <strong> Los cobros con tarjeta de crédito de tus clientes son procesados y asegurados a través de la cuenta fiduciaria central de Plazado.com</strong>, 
                  por lo que tu comercio no requiere contratar una pasarela de pago individual.
                </p>
              </div>

              <h3 className="font-bold text-stone-800 uppercase tracking-wider text-[11px] pb-2 border-b border-stone-100">
                Datos de tu Cuenta Bancaria de Destino
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Banco Dominicano</label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg outline-none"
                  >
                    {DOMINICAN_BANKS.map((b: string) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Tipo de Cuenta</label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as any)}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg outline-none"
                  >
                    <option value="Corriente">Corriente</option>
                    <option value="Ahorros">Ahorros</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Número de Cuenta</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Titular de la Cuenta</label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">RNC o Cédula del Titular</label>
                  <input
                    type="text"
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-stone-200">
            <button
              type="submit"
              className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-bold text-xs shadow-sm"
            >
              Guardar Cambios de Configuración
            </button>
          </div>

          {/* Zona de Peligro del Comercio: Desactivar o Eliminar Tienda de Google Cloud */}
          <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5 text-rose-900 pb-2 border-b border-rose-200/80">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <h3 className="font-black text-sm text-rose-950">Zona de Peligro: Gestión y Eliminación de Tienda</h3>
                <p className="text-[11px] text-rose-700">Opciones para pausar la visibilidad o eliminar definitivamente tu comercio de Google Cloud</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Option 1: Pause / Unpublish */}
              <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-2">
                <span className="font-bold text-stone-800 block text-xs">
                  {store?.isPublished ? 'Pausar Publicación de la Tienda' : 'Reanudar Publicación de la Tienda'}
                </span>
                <p className="text-[11px] text-stone-500">
                  {store?.isPublished 
                    ? 'Oculta tu vitrina y catálogo de los clientes sin borrar tus datos en Google Cloud.'
                    : 'Haz visible nuevamente tu tienda y sus productos en el mercado de Plazado.com.'}
                </p>
                <button
                  type="button"
                  onClick={() => store && toggleStorePublish(store.id)}
                  className={`mt-2 px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors ${
                    store?.isPublished 
                      ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' 
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {store?.isPublished ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{store?.isPublished ? 'Pausar / Despublicar Tienda' : 'Publicar Tienda'}</span>
                </button>
              </div>

              {/* Option 2: Permanent Deletion */}
              <div className="bg-white p-4 rounded-xl border border-rose-200 space-y-2">
                <span className="font-bold text-rose-900 block text-xs">
                  Eliminar Tienda Permanentemente
                </span>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Borra de forma irreversible tu comercio, publicaciones, catálogo y balances de Google Cloud (Firestore y Cloud SQL). Tu usuario continuará como comprador.
                </p>

                {deleteStoreError && (
                  <div className="p-2 bg-rose-100 text-rose-800 text-[11px] rounded-lg font-medium">
                    {deleteStoreError}
                  </div>
                )}

                <div className="pt-1 space-y-1.5">
                  <label className="block text-[11px] font-semibold text-stone-700">
                    Escribe <span className="font-mono text-rose-600 font-bold">ELIMINAR</span> para confirmar:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={deleteStoreConfirmText}
                      onChange={(e) => setDeleteStoreConfirmText(e.target.value)}
                      placeholder="ELIMINAR"
                      className="p-2 border border-stone-300 rounded-lg text-xs outline-none focus:border-rose-500 font-medium flex-1"
                    />
                    <button
                      type="button"
                      disabled={isDeletingStore || deleteStoreConfirmText !== 'ELIMINAR'}
                      onClick={handleDeleteStoreSubmit}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isDeletingStore ? 'Borrando...' : 'Eliminar Tienda'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* TAB: PLAZADO FULFILLMENT (ALMACENAMIENTO, INVENTARIO Y LOGÍSTICA) */}
      {activeTab === 'fulfillment' && (
        <FulfillmentStoreView 
          storeId={effectiveStoreId} 
          activeSubTab={fulfillmentStoreSubTab}
          onTabChange={setFulfillmentStoreSubTab}
        />
      )}

        </main>
      </div>

      {/* Store Profile Modal */}
      <StoreProfileModal
        store={store}
        isOpen={isStoreProfileModalOpen}
        onClose={() => setIsStoreProfileModalOpen(false)}
      />

      {/* Modal: Generar Reclamación / Disputa por la Tienda */}
      {disputeOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-start border-b border-stone-200 pb-3">
              <div>
                <h3 className="font-black text-stone-900 text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  Generar Reclamación o Incidencia
                </h3>
                <p className="text-stone-500 text-[11px] mt-0.5">
                  Pedido #{disputeOrder.id} • Cliente: <strong>{disputeOrder.customerName}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDisputeOrder(null)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitStoreDispute} className="space-y-4">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Tipo de Incidencia / Reclamación
                </label>
                <select
                  value={disputeIssueType}
                  onChange={(e) => setDisputeIssueType(e.target.value as Dispute['issueType'])}
                  className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl outline-none font-medium text-stone-800"
                >
                  <option value="DELIVERY_ISSUE">Problema con la Entrega o Receptor</option>
                  <option value="DAMAGED">Producto reportado con daños en transporte</option>
                  <option value="WRONG_ITEM">Inconformidad con el artículo o variante</option>
                  <option value="DESCRIPTION_MISMATCH">Discrepancia en especificaciones</option>
                  <option value="NOT_RECEIVED">Disputa de confirmación de entrega</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Descripción Detallada de la Reclamación
                </label>
                <textarea
                  rows={4}
                  required
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  placeholder="Describe detalladamente qué ocurrió con el pedido o el cliente para que el equipo de soporte y mediación de PlazaDO pueda intervenir..."
                  className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl outline-none text-stone-900 placeholder:text-stone-400"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-900 leading-snug">
                Esta reclamación será registrada en la bitácora central de PlazaDO y el equipo administrativo de soporte intermediará entre tu comercio y el cliente para resolver la situación.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setDisputeOrder(null)}
                  className="px-4 py-2 text-stone-600 font-semibold hover:bg-stone-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDispute}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>{isSubmittingDispute ? 'Enviando...' : 'Enviar Reclamación'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
