import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
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
  Pause
} from 'lucide-react';
import { OrderStatus, Product, ProductStatus, Settlement } from '../../types';
import { DOMINICAN_BANKS } from '../../data/initialData';
import { StoreProfileModal } from '../common/StoreProfileModal';
import { ImageUploadInput } from '../common/ImageUploadInput';
import { ProductImagesManager } from './ProductImagesManager';

export const StoreDashboard: React.FC = () => {
  const { 
    currentUser, 
    stores, 
    products, 
    orders, 
    settlements, 
    storeBalances,
    updateOrderStatus, 
    updateProduct, 
    addProduct, 
    deleteProduct, 
    requestSettlement, 
    updateStoreDetails,
    showNotification
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'finances' | 'reports' | 'settings'>('overview');

  // Multi-tenant Security: Strictly isolate to current store!
  const storeId = currentUser?.storeId;
  const store = stores.find(s => s.id === storeId);

  // Store-scoped data
  const storeOrders = orders.filter(o => o.storeId === storeId);
  const storeProducts = products.filter(p => p.storeId === storeId);
  const storeSettlements = settlements.filter(s => s.storeId === storeId);

  // Filter state for orders
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [secretCodeInput, setSecretCodeInput] = useState('');
  const [secretCodeError, setSecretCodeError] = useState<string | null>(null);

  // Product modal state (Create / Edit)
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pName, setPName] = useState('');
  const [pSku, setPSku] = useState('');
  const [pPrice, setPPrice] = useState(0);
  const [pPromoPrice, setPPromoPrice] = useState<number | undefined>(undefined);
  const [pStock, setPStock] = useState(0);
  const [pMinAlert, setPMinAlert] = useState(3);
  const [pCategory, setPCategory] = useState('tecnologia');
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

  if (!store) {
    return (
      <div className="max-w-7xl mx-auto p-12 text-center text-stone-500">
        <Store className="w-12 h-12 mx-auto text-stone-300 mb-2" />
        <h2 className="text-lg font-bold text-stone-900">No se encontró la tienda asociada a este usuario.</h2>
        <p className="text-xs">Usa la barra superior para cambiar a la persona "TechZone RD" o "PetShop Quisqueya".</p>
      </div>
    );
  }

  const currentBalance = storeBalances[store.id] || { availableBalance: 0, pendingBalance: 0, totalSales: 0, settledBalance: 0 };

  // Financial calculations
  const totalGrossSales = storeOrders.reduce((acc, o) => acc + o.subtotal, 0);
  const totalCommissionDeducted = storeOrders.reduce((acc, o) => acc + o.plazaCommissionAmount, 0);
  const totalNetEarnings = storeOrders.reduce((acc, o) => acc + o.storeNetEarnings, 0);
  
  // Pending orders
  const pendingOrders = storeOrders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
  const deliveredOrders = storeOrders.filter(o => o.status === 'DELIVERED');

  // Sales reports analytics
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const validOrders = storeOrders.filter(o => o.status !== 'CANCELLED');
  const todayOrders = validOrders.filter(o => new Date(o.createdAt).getTime() >= startOfToday);
  const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const todayNet = todayOrders.reduce((sum, o) => sum + o.storeNetEarnings, 0);

  const weekOrders = validOrders.filter(o => new Date(o.createdAt).getTime() >= sevenDaysAgo);
  const weekSales = weekOrders.reduce((sum, o) => sum + o.total, 0);
  const weekNet = weekOrders.reduce((sum, o) => sum + o.storeNetEarnings, 0);

  const monthOrders = validOrders.filter(o => new Date(o.createdAt).getTime() >= startOfMonth);
  const monthSales = monthOrders.reduce((sum, o) => sum + o.total, 0);
  const monthNet = monthOrders.reduce((sum, o) => sum + o.storeNetEarnings, 0);

  const totalLifetimeSales = validOrders.reduce((sum, o) => sum + o.total, 0);
  const totalLifetimeNet = validOrders.reduce((sum, o) => sum + o.storeNetEarnings, 0);
  const totalCommissionPaid = validOrders.reduce((sum, o) => sum + o.plazaCommissionAmount, 0);

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
    order.items.forEach(item => {
      if (!productSalesMap[item.productId]) {
        const prod = products.find(p => p.id === item.productId);
        productSalesMap[item.productId] = {
          id: item.productId,
          name: item.productName,
          image: item.productImage || prod?.images[0] || '',
          unitsSold: 0,
          revenue: 0,
          stock: prod?.stock || 0,
          price: item.price
        };
      }
      productSalesMap[item.productId].unitsSold += item.quantity;
      productSalesMap[item.productId].revenue += item.price * item.quantity;
    });
  });

  const bestSellingProducts = Object.values(productSalesMap).sort((a, b) => b.unitsSold - a.unitsSold);

  // Handle Order Status Transition
  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    if (newStatus === 'DELIVERED') {
      // Must validate secret code!
      if (secretCodeInput.trim() !== selectedOrder.deliveryConfirmationCode) {
        setSecretCodeError('Código incorrecto. Solicita al cliente su código de 6 dígitos que figura en su orden.');
        return;
      }
    }

    const res = updateOrderStatus(orderId, newStatus, undefined, newStatus === 'DELIVERED' ? secretCodeInput : undefined);
    if (res.success) {
      showNotification(`Pedido actualizado a: ${newStatus}`);
      setSelectedOrder(null);
      setSecretCodeInput('');
      setSecretCodeError(null);
    } else {
      setSecretCodeError(res.message || 'Error al actualizar pedido');
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
      setPCategory(prod.categoryId);
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
      setPCategory('tecnologia');
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
      updateProduct(editingProduct.id, {
        name: pName,
        sku: pSku,
        price: Number(pPrice),
        promoPrice: pPromoPrice ? Number(pPromoPrice) : undefined,
        stock: Number(pStock),
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

  // Save Store Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreDetails(store.id, {
      name: storeName,
      logo: storeLogo || store.logo,
      banner: storeBanner || store.banner,
      whatsapp: storeWhatsapp,
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
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Banner: Store Identification & Multi-Tenant Badge */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group shrink-0">
            <img 
              src={store.logo} 
              alt={store.name} 
              className="w-16 h-16 rounded-2xl object-cover border border-stone-200 shadow-2xs" 
            />
            <button
              onClick={() => setIsStoreProfileModalOpen(true)}
              className="absolute -bottom-1 -right-1 bg-stone-900 hover:bg-amber-600 text-white p-1 rounded-full shadow-xs transition-colors"
              title="Cambiar logo de la tienda"
            >
              <Edit className="w-3 h-3" />
            </button>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold text-stone-900">{store.name}</h1>
              {store.status === 'APPROVED' ? (
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Tienda Activa & Aprobada
                </span>
              ) : store.status === 'PENDING' || store.status === 'IN_REVIEW' ? (
                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border border-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Solicitud Pendiente de Aprobación
                </span>
              ) : store.status === 'REJECTED' ? (
                <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Solicitud Rechazada
                </span>
              ) : (
                <span className="bg-stone-100 text-stone-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {store.status}
                </span>
              )}
              <button
                onClick={() => setIsStoreProfileModalOpen(true)}
                className="text-xs font-semibold text-amber-700 hover:text-amber-900 hover:underline flex items-center gap-1 ml-1"
              >
                <Edit className="w-3 h-3" />
                <span>Editar Perfil & Logo</span>
              </button>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              RNC: {store.bankInfo?.rncOrCedula || 'N/A'} • {store.municipality}, {store.province} • ID: <code className="font-mono text-[11px]">{store.id}</code>
            </p>
          </div>
        </div>

        {/* Store Isolation Security Guarantee */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-600 flex items-center gap-2 max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="text-[11px] leading-tight">
            <strong>Sesión Segura Aislada:</strong> Solo tienes acceso a las órdenes, catálogo y fondos de tu establecimiento comercial.
          </span>
        </div>
      </div>

      {/* Pending Approval Banner */}
      {(store.status === 'PENDING' || store.status === 'IN_REVIEW') && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 space-y-1">
            <h4 className="font-bold text-amber-950 text-sm">Tu solicitud de tienda está pendiente de revisión por el Super Administrador</h4>
            <p className="text-amber-800">
              El equipo de administración de PlazaDO está validando los datos de tu comercio ({store.name}). Mientras tanto, puedes configurar tu inventario, tarifas de entrega e información bancaria. Tus productos se publicarán en el catálogo una vez sea aprobada la tienda.
            </p>
          </div>
        </div>
      )}

      {/* Rejected Store Banner */}
      {store.status === 'REJECTED' && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900 space-y-1">
            <h4 className="font-bold text-rose-950 text-sm">Solicitud no aprobada</h4>
            <p className="text-rose-800">
              Motivo: {store.rejectionReason || 'No cumple con las normativas comerciales de PlazaDO.'} Puedes editar tus datos o comunicarte con soporte.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-stone-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'overview' ? 'bg-red-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Resumen General</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'orders' ? 'bg-red-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Gestión de Pedidos ({pendingOrders.length} activos)</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'products' ? 'bg-red-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Catálogo de Productos ({storeProducts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('finances')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'finances' ? 'bg-red-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Finanzas y Liquidaciones</span>
        </button>

        <button
          id="store-reports-tab-btn"
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'reports' ? 'bg-red-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Reportes de Ventas</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
            activeTab === 'settings' ? 'bg-red-600 text-white shadow-xs' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Configuración & Envíos</span>
        </button>
      </div>

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
                          {order.customerName} • {order.items.length} productos • {order.deliveryAddress.province}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-stone-900">RD$ {order.total.toLocaleString()}</span>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setActiveTab('orders');
                          }}
                          className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800"
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

      {/* TAB 2: GESTIÓN DE PEDIDOS (Requerimiento #14 y #15) */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h2 className="text-base font-bold text-stone-900">Listado de Pedidos Recibidos</h2>
              <p className="text-xs text-stone-500">Administra el ciclo de vida de los despachos de tu tienda</p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 text-xs bg-stone-100 p-1 rounded-lg">
              {['all', 'PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setOrderStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                    orderStatusFilter === st ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {st === 'all' ? 'Todos' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Orders Table/List */}
          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
            <div className="divide-y divide-stone-200">
              {storeOrders
                .filter(o => orderStatusFilter === 'all' || o.status === orderStatusFilter)
                .map(order => (
                  <div key={order.id} className="p-4 sm:p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-mono font-bold text-xs text-stone-900">{order.id}</span>
                        <span className="text-[11px] text-stone-400">Grupo: {order.orderGroupCode}</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-stone-100 text-stone-800">
                          {order.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {order.paymentStatus === 'PAID' ? '✓ PAGADO' : '⏳ PAGO PENDIENTE'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-600 flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          {order.paymentMethod === 'CARD_AZUL' ? 'Tarjeta AZUL' : order.paymentMethod === 'CASH_ON_DELIVERY' ? 'Contra Entrega' : 'Transferencia'}
                        </span>
                      </div>

                      <div className="text-xs text-stone-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </div>
                    </div>

                    {/* Order Details & Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {/* Items with product images */}
                      <div className="space-y-2">
                        <span className="font-bold text-stone-400 text-[10px] uppercase block">Productos ({order.items.length})</span>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2 p-1.5 bg-stone-50 rounded-lg border border-stone-100">
                            <div className="flex items-center gap-2 truncate">
                              {item.productImage ? (
                                <img
                                  src={item.productImage}
                                  alt={item.productName}
                                  className="w-9 h-9 rounded-lg object-cover border border-stone-200 shrink-0 bg-white"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-stone-200 flex items-center justify-center shrink-0">
                                  <Package className="w-4 h-4 text-stone-400" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-stone-800 leading-tight">{item.productName}</p>
                                <p className="text-[10px] text-stone-500">{item.quantity} ud(s) × RD$ {item.price.toLocaleString()}</p>
                              </div>
                            </div>
                            <span className="font-bold text-stone-900 shrink-0 text-right">
                              RD$ {(item.price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Delivery Address & Customer Info */}
                      <div className="space-y-1">
                        <span className="font-bold text-stone-400 text-[10px] uppercase">Destino y Cliente</span>
                        <p className="font-semibold text-stone-900">{order.deliveryAddress.recipientName}</p>
                        <p className="text-stone-600 flex items-center gap-1 font-mono text-[11px]">
                          Tel: {order.deliveryAddress.phone || order.customerPhone}
                        </p>
                        <p className="text-stone-600 mt-1">{order.deliveryAddress.street}, {order.deliveryAddress.sector}</p>
                        <p className="text-stone-500">{order.deliveryAddress.municipality}, {order.deliveryAddress.province}</p>
                        {order.customerNotes && (
                          <div className="mt-1.5 p-1.5 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-800">
                            <strong>Nota del comprador:</strong> {order.customerNotes}
                          </div>
                        )}
                      </div>

                      {/* Financial breakdown for store */}
                      <div className="space-y-1 bg-stone-50 p-3 rounded-xl border border-stone-200">
                        <div className="flex justify-between text-stone-600">
                          <span>Subtotal productos:</span>
                          <span className="font-semibold">RD$ {order.subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-stone-600">
                          <span>Envío de tu tienda:</span>
                          <span className="font-semibold">RD$ {order.shippingCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Comisión PlazaDO (5%):</span>
                          <span>-RD$ {order.plazaCommissionAmount.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-stone-200 pt-1 flex justify-between font-bold text-stone-900">
                          <span>Tu Ingreso Neto:</span>
                          <span className="text-emerald-700">RD$ {order.storeNetEarnings.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Workflow Action Bar */}
                    <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                          >
                            Confirmar Pedido
                          </button>
                        )}
                        {order.status === 'CONFIRMED' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold"
                          >
                            Marcar en Preparación
                          </button>
                        )}
                        {order.status === 'PREPARING' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'READY_FOR_PICKUP')}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                          >
                            Listo para Enviar / Despacho
                          </button>
                        )}
                        {order.status === 'READY_FOR_PICKUP' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'SHIPPED')}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold"
                          >
                            Despachar / En Camino
                          </button>
                        )}
                        {order.status === 'SHIPPED' && (
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>Validar Código y Completar Entrega</span>
                          </button>
                        )}
                      </div>

                      {order.status === 'DELIVERED' && (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Entrega confirmada • Fondos acreditados</span>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Validar Código de Entrega (Requerimiento #15) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-stone-900 text-sm">Validar Entrega con Código Secreto</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-stone-600 leading-relaxed">
              Pídele al cliente <strong>{selectedOrder.shippingAddress.recipientName}</strong> el código secreto de 6 dígitos que figura en su orden de PlazaDO.
            </p>

            <div>
              <label className="block font-bold text-stone-800 mb-1">Ingresa el Código de 6 Dígitos:</label>
              <input
                type="text"
                maxLength={6}
                value={secretCodeInput}
                onChange={(e) => setSecretCodeInput(e.target.value.toUpperCase())}
                placeholder="Ej: A93F12"
                className="w-full text-center tracking-widest font-mono text-xl py-2.5 bg-stone-50 border-2 border-stone-300 rounded-xl outline-none focus:border-red-500 uppercase font-black"
              />
              {secretCodeError && (
                <p className="text-[11px] text-rose-600 font-semibold mt-1.5">{secretCodeError}</p>
              )}
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
              Al ingresar el código correcto, el pedido se marcará como <strong>ENTREGADO</strong> y tu ingreso neto de <strong>RD$ {selectedOrder.storeNetEarnings.toLocaleString()}</strong> se transferirá inmediatamente a tu Balance Disponible.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 text-stone-600 font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED')}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm"
              >
                Confirmar y Liberar Fondos
              </button>
            </div>
          </div>
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

              return (
                <div key={product.id} className="bg-white rounded-2xl border border-stone-200 p-4 shadow-2xs space-y-3 flex flex-col justify-between">
                  <div className="flex gap-3">
                    <img src={product.images[0]} alt="" className="w-16 h-16 rounded-xl object-cover bg-stone-100 border border-stone-200 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-mono text-[10px] text-stone-400">SKU: {product.sku}</span>
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
                      Stock: {product.stock} {isOutOfStock ? '(Agotado)' : isLow ? '(Bajo stock)' : 'uds'}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Categoría</label>
                  <select
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value)}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg outline-none"
                  >
                    <option value="tecnologia">Tecnología y Electrónica</option>
                    <option value="mascotas">Mascotas</option>
                    <option value="moda-y-calzado">Moda y Calzado</option>
                    <option value="hogar-y-decoracion">Hogar y Decoración</option>
                    <option value="belleza-y-cuidado">Belleza y Cuidado</option>
                    <option value="alimentos-y-bebidas">Alimentos y Bebidas</option>
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

              <div className="grid grid-cols-2 gap-3">
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Stock Disponible *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={pStock}
                    onChange={(e) => setPStock(Number(e.target.value))}
                    className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg outline-none"
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

              <div>
                <label className="block font-semibold text-stone-700 mb-1">WhatsApp de Contacto Directo</label>
                <input
                  type="text"
                  value={storeWhatsapp}
                  onChange={(e) => setStoreWhatsapp(e.target.value)}
                  className="w-full p-2 bg-stone-50 border border-stone-300 rounded-lg outline-none"
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

            {/* Bank Account Settings */}
            <div className="md:col-span-2 space-y-4 pt-4 border-t border-stone-200">
              <h3 className="font-bold text-stone-800 uppercase tracking-wider text-[11px] pb-2 border-b border-stone-100">
                Datos Bancarios para Transferencias de Liquidación
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
        </form>
      )}

      {/* Store Profile Modal */}
      <StoreProfileModal
        store={store}
        isOpen={isStoreProfileModalOpen}
        onClose={() => setIsStoreProfileModalOpen(false)}
      />

    </div>
  );
};
