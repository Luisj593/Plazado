import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  WarehouseLocation, 
  StorageRequest, 
  StorageRequestStatus, 
  FulfillmentInventoryItem, 
  FulfillmentOrder, 
  InventoryMovementLog, 
  FulfillmentWithdrawal,
  FulfillmentIncidence,
  Order
} from '../../types';
import { 
  Warehouse, 
  Package, 
  Truck, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Plus, 
  Search, 
  ArrowRight, 
  Eye, 
  ShieldCheck, 
  Barcode, 
  MapPin, 
  RotateCcw, 
  Camera, 
  FileText, 
  RefreshCw, 
  Calendar, 
  DollarSign, 
  Check, 
  X,
  Layers,
  ChevronRight,
  Info,
  ExternalLink,
  Building2,
  TrendingDown,
  Send,
  BarChart3
} from 'lucide-react';

export type FulfillmentStoreSubTab = 
  | 'overview' 
  | 'inventory' 
  | 'requests' 
  | 'orders' 
  | 'withdrawals' 
  | 'incidences' 
  | 'pricing';

export interface FulfillmentStoreViewProps {
  storeId: string;
  activeSubTab?: FulfillmentStoreSubTab;
  onTabChange?: (tab: FulfillmentStoreSubTab) => void;
}

export const FulfillmentStoreView: React.FC<FulfillmentStoreViewProps> = ({ 
  storeId,
  activeSubTab: externalSubTab,
  onTabChange
}) => {
  const { 
    stores, 
    products, 
    storageRequests, 
    fulfillmentInventory, 
    inventoryMovements, 
    fulfillmentOrders, 
    fulfillmentWithdrawals, 
    fulfillmentIncidences,
    fulfillmentConfig,
    createStorageRequest,
    confirmOrderByStore,
    rejectOrderByStore,
    createWithdrawal,
    showNotification
  } = useApp();

  const currentStore = stores.find(s => s.id === storeId);
  const storeProducts = products.filter(p => p.storeId === storeId);

  // Subtabs for store fulfillment
  const [internalSubTab, setInternalSubTab] = useState<FulfillmentStoreSubTab>(externalSubTab || 'overview');

  useEffect(() => {
    if (externalSubTab && externalSubTab !== internalSubTab) {
      setInternalSubTab(externalSubTab);
    }
  }, [externalSubTab]);

  const activeSubTab = externalSubTab || internalSubTab;

  const setActiveSubTab = (tab: FulfillmentStoreSubTab) => {
    setInternalSubTab(tab);
    onTabChange?.(tab);
  };

  // Filter store-specific records
  const myRequests = (storageRequests || []).filter(r => r.storeId === storeId);
  const myInventory = (fulfillmentInventory || []).filter(i => i.storeId === storeId);
  const myMovements = (inventoryMovements || []).filter(m => m.storeId === storeId);
  const myFulfillmentOrders = (fulfillmentOrders || []).filter(o => o.storeId === storeId);
  const myWithdrawals = (fulfillmentWithdrawals || []).filter(w => w.storeId === storeId);
  const myIncidences = (fulfillmentIncidences || []).filter(inc => inc.storeId === storeId);

  // Calculation of KPIs
  const totalPhysical = myInventory.reduce((sum, item) => sum + item.totalPhysical, 0);
  const totalAvailable = myInventory.reduce((sum, item) => sum + item.available, 0);
  const totalReserved = myInventory.reduce((sum, item) => sum + item.reserved, 0);
  const totalInPrep = myInventory.reduce((sum, item) => sum + (item.inPicking + item.inPacking + item.prepared), 0);
  const totalDamagedBlocked = myInventory.reduce((sum, item) => sum + (item.damaged + item.blocked), 0);

  const pendingConfirmationOrders = myFulfillmentOrders.filter(o => o.status === 'PENDING_STORE_CONFIRMATION');

  // Calculation of store's low stock items in warehouse
  const myLowStockItems = myInventory.filter(item => {
    const prod = products.find(p => p.id === item.productId);
    const minAlert = prod?.minStockAlert ?? 5;
    return item.available <= minAlert;
  });

  // Calculation of warehouses/sucursales holding this store's products
  const myWarehousesWithStock = (fulfillmentConfig?.warehouses || []).map(wh => {
    const whItems = myInventory.filter(
      i => i.warehouseId === wh.id || i.location?.warehouseId === wh.id
    );
    const branchPhysical = whItems.reduce((sum, i) => sum + (i.totalPhysical || 0), 0);
    const branchAvailable = whItems.reduce((sum, i) => sum + (i.available || 0), 0);
    const branchReserved = whItems.reduce((sum, i) => sum + (i.reserved || 0), 0);
    const branchDamaged = whItems.reduce((sum, i) => sum + ((i.damaged || 0) + (i.blocked || 0)), 0);

    return {
      warehouse: wh,
      items: whItems,
      itemsCount: whItems.length,
      totalPhysical: branchPhysical,
      available: branchAvailable,
      reserved: branchReserved,
      damaged: branchDamaged
    };
  });

  // Form states for new storage request
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [declaredQty, setDeclaredQty] = useState<number>(10);
  const [packageCount, setPackageCount] = useState<number>(1);
  const [weightKg, setWeightKg] = useState<number>(2.5);
  const [dimL, setDimL] = useState<number>(30);
  const [dimW, setDimW] = useState<number>(20);
  const [dimH, setDimH] = useState<number>(15);
  const [declaredValue, setDeclaredValue] = useState<number>(5000);
  const [warehouseId, setWarehouseId] = useState(fulfillmentConfig?.warehouses?.[0]?.id || 'wh-sdo-01');
  const [estimatedDate, setEstimatedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  });
  const [requestNotes, setRequestNotes] = useState('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Branch Transfer Specific State (Transferencias de Sucursal a Fulfillment)
  const [originBranch, setOriginBranch] = useState('Sucursal Principal');
  const [dispatchGuideNumber, setDispatchGuideNumber] = useState('');
  const [dispatchedByName, setDispatchedByName] = useState(currentStore?.ownerName || '');
  const [driverOrCarrier, setDriverOrCarrier] = useState('Transporte Propio de Sucursal');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [securitySealNumber, setSecuritySealNumber] = useState('');

  // Modal for viewing request details
  const [selectedRequestDetails, setSelectedRequestDetails] = useState<StorageRequest | null>(null);

  // Modal for Order Timeline
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<FulfillmentOrder | null>(null);

  // Modal for Rejection
  const [rejectingOrder, setRejectingOrder] = useState<FulfillmentOrder | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  // Form states for new withdrawal
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [withdrawalProductId, setWithdrawalProductId] = useState('');
  const [withdrawalQty, setWithdrawalQty] = useState<number>(1);
  const [withdrawalReason, setWithdrawalReason] = useState('Venta por canal físico propio');
  const [withdrawalMethod, setWithdrawalMethod] = useState<'STORE_PICKUP_WAREHOUSE' | 'COURIER_DISPATCH_TO_STORE'>('STORE_PICKUP_WAREHOUSE');
  const [withdrawalDestAddress, setWithdrawalDestAddress] = useState(currentStore?.address || '');
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);

  // Real-time countdown timer tick for pending confirmation orders
  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (deadlineIso?: string) => {
    if (!deadlineIso) return '00:00:00';
    const target = new Date(deadlineIso).getTime();
    const diff = target - now;
    if (diff <= 0) return 'Expirado';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCreateStorageRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = storeProducts.find(p => p.id === selectedProductId);
    if (!prod) {
      showNotification('Seleccione un producto válido de su catálogo', 'error');
      return;
    }
    if (declaredQty <= 0) {
      showNotification('La cantidad declarada debe ser mayor a 0', 'error');
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const randomGuide = dispatchGuideNumber || `CON-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const randomSeal = securitySealNumber || `SEAL-${Math.floor(10000 + Math.random() * 90000)}`;

      const ok = await createStorageRequest({
        storeId,
        storeName: currentStore?.name || 'Comercio Plazado',
        productId: prod.id,
        productName: prod.name,
        productImage: prod.images?.[0] || '',
        sku: prod.sku || `SKU-${prod.id.slice(0, 6)}`,
        declaredQuantity: Number(declaredQty),
        packageCount: Number(packageCount),
        weightKg: Number(weightKg),
        dimensions: { length: Number(dimL), width: Number(dimW), height: Number(dimH) },
        declaredValue: Number(declaredValue),
        warehouseId,
        estimatedDeliveryDate: estimatedDate,
        notes: requestNotes,
        originBranch: originBranch.trim() || 'Sucursal Principal',
        dispatchGuideNumber: randomGuide,
        dispatchedByName: dispatchedByName || currentStore?.ownerName || 'Encargado de Sucursal',
        driverOrCarrier: driverOrCarrier || 'Transporte Propio',
        vehiclePlate: vehiclePlate || 'N/A',
        securitySealNumber: randomSeal,
        transferType: 'BRANCH_TO_FULFILLMENT'
      });

      if (ok) {
        showNotification(`Transferencia registrada formalmente (Guía: ${randomGuide}). Precinto: ${randomSeal}. Registro inmutable auditado.`, 'success');
        setIsNewRequestModalOpen(false);
        setRequestNotes('');
      } else {
        showNotification('Error al crear la solicitud de almacenamiento', 'error');
      }
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    const res = await confirmOrderByStore(orderId, storeId);
    if (res.success) {
      showNotification(res.message, 'success');
    } else {
      showNotification(res.message, 'error');
    }
  };

  const handleOpenRejectModal = (fo: FulfillmentOrder) => {
    setRejectingOrder(fo);
    setRejectionReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingOrder) return;
    if (!rejectionReason.trim()) {
      showNotification('Por favor indique el motivo del rechazo del pedido', 'error');
      return;
    }

    setIsRejecting(true);
    try {
      const res = await rejectOrderByStore(rejectingOrder.id, storeId, rejectionReason);
      if (res.success) {
        showNotification(res.message, 'info');
        setRejectingOrder(null);
      } else {
        showNotification(res.message, 'error');
      }
    } finally {
      setIsRejecting(false);
    }
  };

  const handleCreateWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    const inv = myInventory.find(i => i.productId === withdrawalProductId);
    if (!inv) {
      showNotification('Seleccione un producto con inventario almacenado', 'error');
      return;
    }
    if (withdrawalQty <= 0 || withdrawalQty > inv.available) {
      showNotification(`Cantidad no válida. Disponible para retiro: ${inv.available} unidades`, 'error');
      return;
    }

    setIsSubmittingWithdrawal(true);
    try {
      const ok = await createWithdrawal({
        storeId,
        storeName: currentStore?.name || 'Comercio Plazado',
        productId: inv.productId,
        productName: inv.productName,
        variantName: inv.variantName,
        sku: inv.sku,
        quantity: Number(withdrawalQty),
        reason: withdrawalReason,
        withdrawalMethod,
        destinationAddress: withdrawalDestAddress
      });

      if (ok) {
        showNotification('Solicitud de retiro registrada. El almacén la procesará.', 'success');
        setIsWithdrawalModalOpen(false);
      } else {
        showNotification('Error al registrar solicitud de retiro', 'error');
      }
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Fundamental Rule Notification Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-blue-700/50">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-300 shrink-0">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                Regla Fundamental de Operación
              </span>
              <span className="text-xs text-blue-300 font-medium">Plazado Fulfillment</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">Custodia Centralizada de Inventario y Logística</h2>
            <p className="text-sm text-blue-100/90 leading-relaxed">
              <strong>Su tienda es la propietaria comercial de sus productos</strong>, recibe los pedidos y autoriza las ventas. 
              El <strong>control operativo de los almacenes físicos</strong> (conteo, recepción, picking, packing y despacho) es administrado exclusivamente por Plazado.
            </p>
          </div>
        </div>

        {/* Fundamental Separation Badges */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-4 mt-4 border-t border-blue-800/60 text-xs">
          <div className="bg-blue-950/60 px-3 py-2 rounded-lg border border-blue-700/30">
            <span className="text-blue-300 block font-semibold">Propiedad del Producto:</span>
            <span className="text-white font-bold">Comercio / Tienda</span>
          </div>
          <div className="bg-blue-950/60 px-3 py-2 rounded-lg border border-blue-700/30">
            <span className="text-blue-300 block font-semibold">Control de Almacén:</span>
            <span className="text-white font-bold">Plazado Oficial</span>
          </div>
          <div className="bg-blue-950/60 px-3 py-2 rounded-lg border border-blue-700/30">
            <span className="text-blue-300 block font-semibold">Autorización de Pedido:</span>
            <span className="text-white font-bold">Tienda (Confirmar/Rechazar)</span>
          </div>
          <div className="bg-blue-950/60 px-3 py-2 rounded-lg border border-blue-700/30">
            <span className="text-blue-300 block font-semibold">Preparación y Envío:</span>
            <span className="text-white font-bold">Plazado Almacenes</span>
          </div>
          <div className="bg-blue-950/60 px-3 py-2 rounded-lg border border-blue-700/30 col-span-2 md:col-span-1">
            <span className="text-blue-300 block font-semibold">Seguimiento en Vivo:</span>
            <span className="text-emerald-300 font-bold">Tienda + Plazado</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Físico</span>
            <Warehouse className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {totalPhysical} <span className="text-xs font-normal text-slate-500">uds.</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">En custodia física</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Disponible</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {totalAvailable} <span className="text-xs font-normal text-slate-500">uds.</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Listas para la venta</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Reservadas</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {totalReserved} <span className="text-xs font-normal text-slate-500">uds.</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Pedidos en confirmación</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">En Preparación</span>
            <Package className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {totalInPrep} <span className="text-xs font-normal text-slate-500">uds.</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Picking & Packing</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider">Dañado/Bloqueado</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {totalDamagedBlocked} <span className="text-xs font-normal text-slate-500">uds.</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Fuera de venta</span>
        </div>
      </div>

      {/* Attention Alert for Pending Orders */}
      {pendingConfirmationOrders.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-lg shrink-0">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 dark:text-amber-200">
                ¡Tiene {pendingConfirmationOrders.length} pedido(s) esperando su confirmación comercial!
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-0.5">
                Las unidades están reservadas temporalmente. Confirme antes de que expire el límite para que Plazado inicie el despacho.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveSubTab('orders')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-sm transition-colors shadow-xs shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <span>Ver pedidos pendientes</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'overview'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Resumen General</span>
            {myLowStockItems.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                {myLowStockItems.length} alertas
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'inventory'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mi Inventario Almacenado ({myInventory.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('requests')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'requests'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Solicitudes de Envío ({myRequests.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('orders')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'orders'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pedidos Fulfillment ({myFulfillmentOrders.length})</span>
            {pendingConfirmationOrders.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('withdrawals')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'withdrawals'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retiros de Mercancía ({myWithdrawals.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('incidences')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'incidences'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Incidencias ({myIncidences.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('pricing')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'pricing'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Costos y Facturación</span>
          </button>
        </div>

        {/* Action Button: Enviar productos a Plazado */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (storeProducts.length > 0) {
                setSelectedProductId(storeProducts[0].id);
              }
              setIsNewRequestModalOpen(true);
            }}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Enviar productos a Plazado</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 0: RESUMEN GENERAL (SUCURSALES Y STOCK BAJO) */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Alertas de Stock Bajo / Reposición */}
          {myLowStockItems.length > 0 && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-100 dark:bg-rose-900/60 rounded-xl text-rose-600">
                    <TrendingDown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-rose-900 dark:text-rose-200 text-base flex items-center gap-2">
                      Productos con Stock Bajo en Almacén
                      <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white">
                        {myLowStockItems.length} {myLowStockItems.length === 1 ? 'producto' : 'productos'}
                      </span>
                    </h3>
                    <p className="text-xs text-rose-800 dark:text-rose-300">
                      Tus existencias disponibles en los almacenes de Plazado están en nivel de alerta. Te recomendamos enviar unidades de reposición para evitar suspender tus ventas.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (myLowStockItems.length > 0) {
                      setSelectedProductId(myLowStockItems[0].productId);
                      setWarehouseId(myLowStockItems[0].warehouseId || 'wh-sdo-01');
                    }
                    setIsNewRequestModalOpen(true);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Enviar Reposición a Plazado</span>
                </button>
              </div>

              {/* Low Stock Items Table */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-rose-200/80 dark:border-rose-900/60 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-rose-50/60 dark:bg-slate-800 text-rose-900 dark:text-rose-300 font-bold border-b border-rose-100 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Producto</th>
                      <th className="py-2.5 px-2">SKU</th>
                      <th className="py-2.5 px-3">Almacén / Sucursal</th>
                      <th className="py-2.5 px-3 text-center">Disponible vs Alerta</th>
                      <th className="py-2.5 px-2 text-center">Estado</th>
                      <th className="py-2.5 px-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {myLowStockItems.map(item => {
                      const prod = products.find(p => p.id === item.productId);
                      const minAlert = prod?.minStockAlert ?? 5;
                      const isCritical = item.available <= 0;
                      return (
                        <tr key={item.id} className="hover:bg-rose-50/30">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900 dark:text-white">{item.productName}</span>
                            {item.variantName && (
                              <span className="text-[10px] text-slate-500 ml-1.5 bg-slate-100 px-1 py-0.2 rounded font-normal">
                                {item.variantName}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 font-mono text-slate-600 dark:text-slate-400 font-bold">
                            {item.sku}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                            {item.warehouseName}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`font-mono font-black ${isCritical ? 'text-rose-600' : 'text-amber-600'}`}>
                              {item.available} uds.
                            </span>
                            <span className="text-slate-400 text-xs"> (Alerta: {minAlert})</span>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              isCritical ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
                            }`}>
                              {isCritical ? 'AGOTADO' : 'STOCK BAJO'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedProductId(item.productId);
                                setWarehouseId(item.warehouseId || 'wh-sdo-01');
                                setDeclaredQty(20);
                                setIsNewRequestModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Reposición</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sucursales con productos de tu tienda */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-950/60 rounded-xl">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  Sucursales de Plazado con Productos de tu Tienda
                </h3>
                <p className="text-xs text-slate-500">
                  Instalaciones logísticas donde tus mercancías se encuentran físicamente custodiadas y operadas por Plazado.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {myWarehousesWithStock.map(({ warehouse: wh, items: whItems, itemsCount, totalPhysical: bPhysical, available: bAvail, reserved: bReserved, damaged: bDamaged }) => {
                const hasMyStock = bPhysical > 0;
                return (
                  <div
                    key={wh.id}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs space-y-4 transition-all ${
                      hasMyStock ? 'border-slate-200 dark:border-slate-800' : 'border-dashed border-slate-200 dark:border-slate-800 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-sm">
                          {wh.name}
                        </h4>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                          <span>{wh.address} • {wh.municipality}, {wh.province}</span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                          Contacto: <strong>{wh.managerName}</strong> (Tel: {wh.contactPhone})
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                        hasMyStock ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {hasMyStock ? `${bPhysical} uds. almacenadas` : 'Sin stock de tu tienda'}
                      </span>
                    </div>

                    {/* Stock Figures */}
                    <div className="grid grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-center text-xs">
                      <div>
                        <div className="font-mono font-black text-slate-900 dark:text-white text-sm">{bPhysical}</div>
                        <div className="text-[10px] text-slate-500">Total Físico</div>
                      </div>
                      <div>
                        <div className="font-mono font-black text-emerald-600 text-sm">{bAvail}</div>
                        <div className="text-[10px] text-emerald-700 font-semibold">Disponible</div>
                      </div>
                      <div>
                        <div className="font-mono font-black text-blue-600 text-sm">{bReserved}</div>
                        <div className="text-[10px] text-blue-700 font-semibold">Reservado</div>
                      </div>
                      <div>
                        <div className="font-mono font-black text-rose-600 text-sm">{bDamaged}</div>
                        <div className="text-[10px] text-rose-700">Dañado/Bloq.</div>
                      </div>
                    </div>

                    {/* Items List in this Branch */}
                    {whItems.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Tus productos en esta sucursal ({whItems.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {whItems.map(it => (
                            <span 
                              key={it.id} 
                              className="text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 font-medium flex items-center gap-1 text-slate-700 dark:text-slate-300"
                            >
                              <span>{it.productName}</span>
                              <strong className="font-mono text-blue-600 dark:text-blue-400">({it.available} disp)</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setWarehouseId(wh.id);
                          if (storeProducts.length > 0) setSelectedProductId(storeProducts[0].id);
                          setIsNewRequestModalOpen(true);
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Enviar mercancía a este almacén</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 1: MI INVENTARIO ALMACENADO */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Existencias en Almacenes Plazado</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Consulta de stock físico y estados en tiempo real. Modificación exclusiva por personal de Plazado.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsWithdrawalModalOpen(true)}
                  disabled={myInventory.filter(i => i.available > 0).length === 0}
                  className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  Solicitar Retiro
                </button>
              </div>
            </div>

            {myInventory.length === 0 ? (
              <div className="p-12 text-center">
                <Warehouse className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <h4 className="text-slate-700 dark:text-slate-300 font-bold">No tiene productos almacenados en Plazado</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
                  Envíe sus productos a nuestras instalaciones logísticas para agilizar entregas el mismo día y automatizar la preparación.
                </p>
                <button
                  onClick={() => {
                    if (storeProducts.length > 0) setSelectedProductId(storeProducts[0].id);
                    setIsNewRequestModalOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Primera Solicitud de Almacenamiento</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Producto & SKU</th>
                      <th className="py-3 px-3">Almacén & Ubicación</th>
                      <th className="py-3 px-3 text-center">Físico Total</th>
                      <th className="py-3 px-3 text-center text-emerald-600 dark:text-emerald-400">Disponible</th>
                      <th className="py-3 px-3 text-center text-amber-600 dark:text-amber-400">Reservado</th>
                      <th className="py-3 px-3 text-center text-indigo-600 dark:text-indigo-400">En Picking/Packing</th>
                      <th className="py-3 px-3 text-center text-rose-600 dark:text-rose-400">Dañado / Bloq.</th>
                      <th className="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {myInventory.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {item.productImage ? (
                              <img data-product-image="true" src={item.productImage} alt={item.productName} className="w-9 h-9 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shrink-0" />
                            ) : (
                              <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white leading-tight">{item.productName}</div>
                              <div className="text-[11px] text-slate-500 font-mono mt-0.5">SKU: {item.sku}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{item.warehouseName}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                            <span>
                              {item.location.zone} - {item.location.aisle} / {item.location.shelf}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">
                          {item.totalPhysical}
                        </td>

                        <td className="py-3 px-3 text-center font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">
                          {item.available}
                        </td>

                        <td className="py-3 px-3 text-center font-bold text-amber-600 dark:text-amber-400">
                          {item.reserved}
                        </td>

                        <td className="py-3 px-3 text-center font-medium text-indigo-600 dark:text-indigo-400">
                          {item.inPicking + item.inPacking + item.prepared}
                        </td>

                        <td className="py-3 px-3 text-center font-medium text-rose-600 dark:text-rose-400">
                          {item.damaged + item.blocked}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedProductId(item.productId);
                              setIsNewRequestModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Enviar más</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Traceability & Movement Log Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <h3 className="font-bold text-slate-900 dark:text-white text-base mb-1">Trazabilidad y Movimientos</h3>
            <p className="text-xs text-slate-500 mb-4">
              Registro inmutable de todas las operaciones físicas realizadas sobre el inventario de su tienda.
            </p>

            {myMovements.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No hay registros de movimientos aún.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 text-[11px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Producto / SKU</th>
                      <th className="py-2.5 px-3">Tipo de Operación</th>
                      <th className="py-2.5 px-3 text-center">Cant.</th>
                      <th className="py-2.5 px-3">Motivo / Detalle</th>
                      <th className="py-2.5 px-3">Operador</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {myMovements.slice(0, 15).map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                          {new Date(m.timestamp).toLocaleDateString()} {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                          {m.productName} <span className="text-slate-400 text-[11px]">({m.sku})</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            m.type === 'INBOUND_RECEPTION' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                            m.type === 'BRANCH_TRANSFER_IN' ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300' :
                            m.type === 'BRANCH_TRANSFER_DISCREPANCY' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
                            m.type === 'RESERVATION_HOLD' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                            m.type === 'RESERVATION_RELEASE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                            m.type === 'DISPATCH' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' :
                            m.type === 'DAMAGE_REGISTERED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {m.type === 'BRANCH_TRANSFER_IN' ? 'Transferencia desde Sucursal' :
                             m.type === 'BRANCH_TRANSFER_DISCREPANCY' ? 'Discrepancia en Transferencia' :
                             m.type === 'INBOUND_RECEPTION' ? 'Recepción de Mercancía' :
                             m.type === 'RESERVATION_HOLD' ? 'Reserva por Pedido' :
                             m.type === 'RESERVATION_RELEASE' ? 'Reserva Liberada' :
                             m.type === 'DISPATCH' ? 'Despachado a Courier' :
                             m.type === 'DAMAGE_REGISTERED' ? 'Daño Registrado' :
                             m.type === 'WITHDRAWAL_OUT' ? 'Retiro de Tienda' :
                             m.type === 'COUNT_CORRECTION' ? 'Ajuste de Conteo' : m.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">
                          {m.quantityChanged > 0 ? `+${m.quantityChanged}` : m.quantityChanged}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 text-[11px]">
                          {m.reason || 'Sin observaciones'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          {m.performedBy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: SOLICITUDES DE ENVÍO (#PF-XXXXX) */}
      {activeSubTab === 'requests' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Solicitudes de Almacenamiento</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Envíos declarados hacia almacenes de Plazado. La existencia aumenta únicamente tras el conteo físico de Plazado.
              </p>
            </div>
            <button
              onClick={() => {
                if (storeProducts.length > 0) setSelectedProductId(storeProducts[0].id);
                setIsNewRequestModalOpen(true);
              }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Solicitud</span>
            </button>
          </div>

          {myRequests.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="text-slate-700 dark:text-slate-300 font-bold">No ha generado solicitudes de envío</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Registre los productos que enviará físicamente para que el almacén prepare la recepción.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Transferencia / Conduce #</th>
                    <th className="py-3 px-3">Sucursal Origen</th>
                    <th className="py-3 px-3">Producto & SKU</th>
                    <th className="py-3 px-3 text-center">Cant. Declarada</th>
                    <th className="py-3 px-3">Almacén Destino</th>
                    <th className="py-3 px-3">Precinto / Sello</th>
                    <th className="py-3 px-3">Estado</th>
                    <th className="py-3 px-4 text-right">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {myRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-blue-600 dark:text-blue-400">{req.id}</div>
                        {req.dispatchGuideNumber && (
                          <div className="text-[10px] text-slate-500 font-mono">Guía: {req.dispatchGuideNumber}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-1 font-bold">
                          <Building2 className="w-3.5 h-3.5 text-blue-500" />
                          <span>{req.originBranch || 'Sucursal Principal'}</span>
                        </div>
                        {req.dispatchedByName && (
                          <div className="text-[10px] text-slate-400">Por: {req.dispatchedByName}</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">{req.productName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">SKU: {req.sku}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold">
                        {req.declaredQuantity} uds.
                        <div className="text-[10px] text-slate-400">{req.packageCount} bulto(s)</div>
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        {req.warehouseName}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                        <div className="font-bold text-slate-700 dark:text-slate-300">{req.securitySealNumber || 'Sin precinto'}</div>
                        <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Inmutable</span>
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                          req.status === 'STORED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          req.status === 'RECEIVED' || req.status === 'VALIDATING' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' :
                          req.status === 'IN_TRANSIT' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' :
                          req.status === 'APPROVED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                          req.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {req.status === 'STORED' ? '✓ Almacenado' :
                           req.status === 'RECEIVED' ? 'Recibido en almacén' :
                           req.status === 'VALIDATING' ? 'En validación / conteo' :
                           req.status === 'IN_TRANSIT' ? 'En tránsito' :
                           req.status === 'APPROVED' ? 'Aprobada para envío' :
                           req.status === 'REJECTED' ? 'Rechazada' : 'Pendiente de aprobación'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedRequestDetails(req)}
                          className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: PEDIDOS FULFILLMENT (CONFIRMAR O RECHAZAR CON TIMELINE) */}
      {activeSubTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Pedidos con Plazado Fulfillment</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Revise las solicitudes de compra de sus productos almacenados en Plazado. 
              <strong> Autorice con "Confirmar Pedido"</strong> para que el almacén comience de inmediato el picking y despacho.
            </p>
          </div>

          {myFulfillmentOrders.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center rounded-xl">
              <Clock className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="text-slate-700 dark:text-slate-300 font-bold">No hay pedidos con Plazado Fulfillment aún</h4>
              <p className="text-xs text-slate-500 mt-1">
                Cuando los clientes compren productos almacenados en Plazado, aparecerán aquí para su confirmación comercial.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {myFulfillmentOrders.map(fo => {
                const isPendingConfirmation = fo.status === 'PENDING_STORE_CONFIRMATION';
                const countdown = formatCountdown(fo.storeConfirmationDeadline);

                return (
                  <div 
                    key={fo.id} 
                    className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-xs transition-all ${
                      isPendingConfirmation 
                        ? 'border-amber-400 dark:border-amber-600/80 ring-2 ring-amber-400/20' 
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:divide-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                            Pedido #{fo.orderId}
                          </span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {fo.id}
                          </span>
                          {fo.pickingCode && (
                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {fo.pickingCode}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Cliente: <strong>{fo.customerName}</strong> ({fo.customerPhone}) • Dirección: {fo.deliveryAddress?.municipality}, {fo.deliveryAddress?.province}
                        </div>
                      </div>

                      {/* State Badge and Countdown */}
                      <div className="flex flex-col items-start md:items-end gap-1.5">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                          fo.status === 'PENDING_STORE_CONFIRMATION' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-700' :
                          fo.status === 'CONFIRMED_BY_STORE' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300' :
                          fo.status === 'PICKING_IN_PROGRESS' || fo.status === 'PICKING_COMPLETED' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300' :
                          fo.status === 'PACKED' || fo.status === 'READY_FOR_DISPATCH' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300' :
                          fo.status === 'IN_TRANSIT' || fo.status === 'DISPATCHED' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300' :
                          fo.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300' :
                          'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                        }`}>
                          {fo.status === 'PENDING_STORE_CONFIRMATION' ? '⏳ PENDIENTE DE CONFIRMACIÓN' :
                           fo.status === 'CONFIRMED_BY_STORE' ? 'Confirmado por tienda' :
                           fo.status === 'PICKING_IN_PROGRESS' ? 'En Picking (Almacén)' :
                           fo.status === 'PICKING_COMPLETED' ? 'Picking Completado' :
                           fo.status === 'PACKED' ? 'Empacado' :
                           fo.status === 'READY_FOR_DISPATCH' ? 'Listo para despacho' :
                           fo.status === 'DISPATCHED' || fo.status === 'IN_TRANSIT' ? '🚚 En ruta con transportista' :
                           fo.status === 'DELIVERED' ? '✓ Entregado con éxito' : 'Rechazado / Cancelado'}
                        </span>

                        {isPendingConfirmation && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-mono font-bold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                            <Clock className="w-3.5 h-3.5 animate-spin" />
                            <span>Tiempo restante para confirmar: {countdown}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Items list */}
                    <div className="py-3 space-y-2">
                      {fo.items.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-slate-50 dark:border-slate-800/40 last:border-0">
                          <div className="flex items-center gap-2">
                            <Package className="w-3.5 h-3.5 text-slate-400" />
                            <span className="font-bold text-slate-900 dark:text-white">{it.productName}</span>
                            <span className="text-slate-400 font-mono">({it.sku})</span>
                            {it.location && (
                              <span className="text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
                                Ubicación: {it.location.zone} - {it.location.aisle}
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {it.quantity} ud(s).
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Order Footer & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-slate-500">Total a liquidar:</span>{' '}
                        <strong className="text-slate-900 dark:text-white text-sm">RD$ {fo.total?.toLocaleString()}</strong>
                        {isPendingConfirmation && (
                          <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">
                            • (Unidades en reserva preventiva)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedOrderDetails(fo)}
                          className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Seguimiento & Timeline</span>
                        </button>

                        {isPendingConfirmation && (
                          <>
                            <button
                              onClick={() => handleOpenRejectModal(fo)}
                              className="px-3 py-1.5 text-xs bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 rounded-lg font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Rechazar</span>
                            </button>

                            <button
                              onClick={() => handleConfirmOrder(fo.id)}
                              className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>CONFIRMAR PEDIDO</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 4: RETIROS DE MERCANCÍA */}
      {activeSubTab === 'withdrawals' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Solicitudes de Retiro de Mercancía</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                La tienda puede solicitar retirar unidades de sus existencias. El personal de Plazado prepara y formaliza la entrega física.
              </p>
            </div>
            <button
              onClick={() => setIsWithdrawalModalOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Solicitar Retiro</span>
            </button>
          </div>

          {myWithdrawals.length === 0 ? (
            <div className="p-12 text-center">
              <RotateCcw className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="text-slate-700 dark:text-slate-300 font-bold">No hay solicitudes de retiro activas</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Si necesita unidades para venta física o exhibición propia, genere una solicitud de retiro aquí.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Solicitud #</th>
                    <th className="py-3 px-3">Producto & SKU</th>
                    <th className="py-3 px-3 text-center">Cantidad</th>
                    <th className="py-3 px-3">Método de Retiro</th>
                    <th className="py-3 px-3">Motivo</th>
                    <th className="py-3 px-3">Estado</th>
                    <th className="py-3 px-4">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {myWithdrawals.map(wd => (
                    <tr key={wd.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {wd.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">{wd.productName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">SKU: {wd.sku}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-bold">
                        {wd.quantity} uds.
                      </td>
                      <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                        {wd.withdrawalMethod === 'STORE_PICKUP_WAREHOUSE' ? 'Retiro en Almacén' : 'Envío por Courier'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {wd.reason}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          wd.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          wd.status === 'READY_FOR_PICKUP' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300' :
                          wd.status === 'PREPARING' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' :
                          wd.status === 'APPROVED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                          wd.status === 'REJECTED' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {wd.status === 'DELIVERED' ? '✓ Entregado' :
                           wd.status === 'READY_FOR_PICKUP' ? 'Listo para entrega' :
                           wd.status === 'PREPARING' ? 'Preparando retiro' :
                           wd.status === 'APPROVED' ? 'Aprobado' :
                           wd.status === 'REJECTED' ? 'Rechazado' : 'Solicitado'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(wd.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 5: INCIDENCIAS */}
      {activeSubTab === 'incidences' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Incidencias Asociadas a su Mercancía</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Trazabilidad transparente de roturas, diferencias físicas o problemas de entrega reportados por el centro logístico.
            </p>
          </div>

          {myIncidences.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h4 className="text-slate-700 dark:text-slate-300 font-bold">Sin incidencias registradas</h4>
              <p className="text-xs text-slate-500 mt-1">
                Todas sus operaciones en almacén se encuentran conformes y sin novedades abiertas.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {myIncidences.map(inc => (
                <div key={inc.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-rose-600 dark:text-rose-400">{inc.id}</span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">{inc.type}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      inc.status === 'RESOLVED' || inc.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {inc.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{inc.description}</p>
                  {inc.resolutionNotes && (
                    <div className="text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                      <strong>Resolución de Plazado:</strong> {inc.resolutionNotes}
                    </div>
                  )}
                  {inc.evidencePhotos && inc.evidencePhotos.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      {inc.evidencePhotos.map((photo, i) => (
                        <a key={i} href={photo} target="_blank" rel="noopener noreferrer">
                          <img src={photo} alt="Evidencia" className="w-12 h-12 object-cover rounded border border-slate-200" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 6: COSTOS Y FACTURACIÓN */}
      {activeSubTab === 'pricing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs space-y-2">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl w-fit">
                <Warehouse className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Almacenamiento por m³</h4>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                RD$ {fulfillmentConfig?.storageFeePerM3PerDay || 15} <span className="text-xs font-normal text-slate-500">/ m³ por día</span>
              </div>
              <p className="text-xs text-slate-500">
                Calculado diariamente según el volumen ocupado por sus bultos en nuestros anaqueles seguros.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs space-y-2">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl w-fit">
                <Package className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Preparación y Picking</h4>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                RD$ {fulfillmentConfig?.handlingFeePerOrder || 75} <span className="text-xs font-normal text-slate-500">/ orden gestionada</span>
              </div>
              <p className="text-xs text-slate-500">
                Incluye escaneo con código de barras, verificación de SKU y traslado a estación de empaque.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-xs space-y-2">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl w-fit">
                <Truck className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-base">Empaque y Material</h4>
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                RD$ {fulfillmentConfig?.packagingFee || 45} <span className="text-xs font-normal text-slate-500">/ paquete</span>
              </div>
              <p className="text-xs text-slate-500">
                Caja de cartón reforzada Plazado, precinto de seguridad, plástico burbuja y etiqueta térmica.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <h5 className="font-bold text-slate-900 dark:text-white text-sm">Liquidación de Tarifas Logísticas</h5>
            <p>
              Los costos operativos del servicio de fulfillment son deducidos automáticamente durante el corte semanal de liquidaciones ACH en el panel de finanzas, junto con la comisión ordinaria de Plazado.com.
            </p>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA SOLICITUD DE ALMACENAMIENTO (#PF-XXXXX) */}
      {isNewRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/60 text-blue-600 rounded-xl">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">Enviar Productos a Plazado</h3>
                  <p className="text-xs text-slate-500">Generar Solicitud de Almacenamiento #PF-XXXXX</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewRequestModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStorageRequest} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Seleccionar Producto del Catálogo *</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                >
                  {storeProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — SKU: {p.sku || p.id.slice(0, 8)} (RD$ {p.price?.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Cantidad a Enviar *</label>
                  <input
                    type="number"
                    min="1"
                    value={declaredQty}
                    onChange={(e) => setDeclaredQty(Number(e.target.value))}
                    required
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                  />
                  <span className="text-[10px] text-slate-500">Unidades declaradas</span>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Número de Cajas/Bultos *</label>
                  <input
                    type="number"
                    min="1"
                    value={packageCount}
                    onChange={(e) => setPackageCount(Number(e.target.value))}
                    required
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Peso Total Estimado (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    required
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                  />
                </div>
              </div>

              {/* Dimensions */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Dimensiones de la Caja / Bulto (cm) *</label>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="number"
                    placeholder="Largo (cm)"
                    value={dimL}
                    onChange={(e) => setDimL(Number(e.target.value))}
                    className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Ancho (cm)"
                    value={dimW}
                    onChange={(e) => setDimW(Number(e.target.value))}
                    className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                  <input
                    type="number"
                    placeholder="Alto (cm)"
                    value={dimH}
                    onChange={(e) => setDimH(Number(e.target.value))}
                    className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Valor Declarado (RD$) *</label>
                  <input
                    type="number"
                    value={declaredValue}
                    onChange={(e) => setDeclaredValue(Number(e.target.value))}
                    required
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                  />
                  <span className="text-[10px] text-slate-500">Para fines de póliza y custodia</span>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Fecha Estimada de Envío *</label>
                  <input
                    type="date"
                    value={estimatedDate}
                    onChange={(e) => setEstimatedDate(e.target.value)}
                    required
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                  />
                </div>
              </div>

              {/* Sección de Datos de la Transferencia de Sucursal a Fulfillment */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200/80 dark:border-slate-700 pb-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Datos de Sucursal de Origen y Despacho</span>
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 ml-auto">
                    Conduce Oficial
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Sucursal de Origen *</label>
                    <input
                      type="text"
                      placeholder="Ej: Sucursal Principal Piantini"
                      value={originBranch}
                      onChange={(e) => setOriginBranch(e.target.value)}
                      required
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">No. Conduce / Guía de Despacho</label>
                    <input
                      type="text"
                      placeholder="Ej: CON-2026-0042 (Auto si se omite)"
                      value={dispatchGuideNumber}
                      onChange={(e) => setDispatchGuideNumber(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Despachado por (Encargado) *</label>
                    <input
                      type="text"
                      placeholder="Nombre del despachador"
                      value={dispatchedByName}
                      onChange={(e) => setDispatchedByName(e.target.value)}
                      required
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Transportista / Chofer</label>
                    <input
                      type="text"
                      placeholder="Ej: Transporte Propio / Metro Pac"
                      value={driverOrCarrier}
                      onChange={(e) => setDriverOrCarrier(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">Precinto / Sello de Seguridad</label>
                    <input
                      type="text"
                      placeholder="Ej: SEAL-58912 (Auto si se omite)"
                      value={securitySealNumber}
                      onChange={(e) => setSecuritySealNumber(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Almacén Destino Plazado *</label>
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  {(fulfillmentConfig?.warehouses || []).map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} — {w.address} ({w.province})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Notas para el equipo de Almacén</label>
                <textarea
                  rows={2}
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="Instrucciones especiales de manipulación, fragilidad, lote, etc."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl space-y-1 text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Cadena de Custodia y Protección Contra Modificaciones No Autorizadas</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Toda transferencia de sucursal a Fulfillment queda registrada formal e inmutablemente en la bitácora de auditoría. Una vez emitida, no se permiten modificaciones no autorizadas sobre el origen ni las unidades para proteger la trazabilidad física. Al arribar a almacén, Plazado cotejará el precinto y el conteo físico frente a este conduce.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewRequestModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRequest}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingRequest ? 'Creando Solicitud...' : 'Confirmar Envío a Plazado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETALLES DE SOLICITUD DE ALMACENAMIENTO */}
      {selectedRequestDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-base text-blue-600 dark:text-blue-400">
                  {selectedRequestDetails.id}
                </span>
                <span className="px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {selectedRequestDetails.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedRequestDetails(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-slate-500 block">Producto:</span>
                <strong className="text-sm text-slate-900 dark:text-white">{selectedRequestDetails.productName}</strong>
                <div className="text-slate-500 font-mono">SKU: {selectedRequestDetails.sku}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <div>
                  <span className="text-slate-500 block">Sucursal de Origen:</span>
                  <strong className="text-sm flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-500" />
                    <span>{selectedRequestDetails.originBranch || 'Sucursal Principal'}</span>
                  </strong>
                  {selectedRequestDetails.dispatchGuideNumber && (
                    <div className="text-[10px] text-slate-500 font-mono">Conduce: {selectedRequestDetails.dispatchGuideNumber}</div>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 block">Precinto de Seguridad:</span>
                  <strong className="font-mono text-sm">{selectedRequestDetails.securitySealNumber || 'Sin precinto'}</strong>
                  {selectedRequestDetails.tamperProofHash && (
                    <div className="text-[9px] text-emerald-600 font-mono">Hash: {selectedRequestDetails.tamperProofHash.slice(0, 16)}...</div>
                  )}
                </div>
                <div>
                  <span className="text-slate-500 block">Cantidad Declarada:</span>
                  <strong className="text-sm">{selectedRequestDetails.declaredQuantity} uds.</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Cajas / Peso:</span>
                  <strong>{selectedRequestDetails.packageCount} bultos ({selectedRequestDetails.weightKg} kg)</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Almacén Destino:</span>
                  <strong>{selectedRequestDetails.warehouseName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Fecha Envío:</span>
                  <strong>{selectedRequestDetails.estimatedDeliveryDate}</strong>
                </div>
              </div>

              <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Registro Inmutable y Auditado</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Modificaciones no autorizadas bloqueadas</span>
              </div>

              {/* Physical Count Details from Plazado Operator */}
              {selectedRequestDetails.receptionDetails ? (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900 dark:text-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Informe de Conteo Físico Realizado por Plazado</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded">
                      <span className="text-[10px] text-slate-500 block">Recibido Físico</span>
                      <strong className="text-sm">{selectedRequestDetails.receptionDetails.receivedQuantity}</strong>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded">
                      <span className="text-[10px] text-slate-500 block">Dañado / Roto</span>
                      <strong className="text-sm text-rose-600">{selectedRequestDetails.receptionDetails.damagedQuantity}</strong>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900/80 p-2 rounded">
                      <span className="text-[10px] text-slate-500 block">Aceptado Stock</span>
                      <strong className="text-sm text-emerald-600">{selectedRequestDetails.receptionDetails.acceptedQuantity}</strong>
                    </div>
                  </div>
                  <div className="text-[11px] text-emerald-800 dark:text-emerald-300">
                    <strong>Ubicación Asignada:</strong> {selectedRequestDetails.receptionDetails.location.zone} - Pasillo {selectedRequestDetails.receptionDetails.location.aisle}, Estante {selectedRequestDetails.receptionDetails.location.shelf} (Operador: {selectedRequestDetails.receptionDetails.operatorName})
                  </div>
                  {selectedRequestDetails.receptionDetails.operatorNotes && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-300">
                      <strong>Observaciones:</strong> {selectedRequestDetails.receptionDetails.operatorNotes}
                    </div>
                  )}
                  {selectedRequestDetails.receptionDetails.evidencePhotos?.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      {selectedRequestDetails.receptionDetails.evidencePhotos.map((photo, i) => (
                        <a key={i} href={photo} target="_blank" rel="noopener noreferrer">
                          <img src={photo} alt="Evidencia" className="w-14 h-14 object-cover rounded border border-slate-200" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 text-[11px]">
                  Esperando llegada física de la mercancía al almacén para realizar el conteo formal.
                </div>
              )}

              {/* Status History */}
              <div className="space-y-1.5 pt-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">Historial de la Solicitud:</span>
                <div className="space-y-1">
                  {selectedRequestDetails.statusHistory?.map((sh, idx) => (
                    <div key={idx} className="flex items-start justify-between text-[11px] p-1.5 rounded bg-slate-50 dark:bg-slate-800/40">
                      <div>
                        <strong>{sh.status}</strong> • {sh.note}
                      </div>
                      <span className="text-slate-400 font-mono shrink-0 ml-2">
                        {new Date(sh.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedRequestDetails(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SEGUIMIENTO EN VIVO & TIMELINE DEL PEDIDO */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Seguimiento de Pedido #{selectedOrderDetails.orderId}
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  {selectedOrderDetails.id} • Picking: {selectedOrderDetails.pickingCode}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Shared Timeline Requirement */}
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Seguimiento Compartido en Tiempo Real</span>
                </div>
                <p className="text-[11px] text-blue-800/80 dark:text-blue-300 mt-0.5">
                  Este mismo estado operativo es visible simultáneamente por su tienda y por el personal autorizado de Plazado.
                </p>
              </div>

              {/* Timeline Items */}
              <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                {selectedOrderDetails.timeline?.map((ev, idx) => (
                  <div key={idx} className="relative flex items-start gap-3">
                    <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white ${
                      ev.completed ? 'bg-emerald-500 shadow-xs' : 'bg-slate-300 dark:bg-slate-700'
                    }`}>
                      {ev.completed ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3 text-slate-500" />}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 dark:text-white text-xs">{ev.label}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(ev.timestamp).toLocaleDateString()} {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">{ev.notes}</p>
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Actor: {ev.actor}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dispatch & Delivery details if available */}
              {selectedOrderDetails.dispatchDetails && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white">Datos de Despacho Logístico:</div>
                  <div className="text-slate-600 dark:text-slate-300">
                    Transportista: <strong>{selectedOrderDetails.dispatchDetails.carrier}</strong> • Guía: <strong>{selectedOrderDetails.dispatchDetails.trackingNumber}</strong>
                  </div>
                  {selectedOrderDetails.dispatchDetails.deliveredAt && (
                    <div className="text-emerald-600 dark:text-emerald-400 font-bold">
                      ✓ Entregado a {selectedOrderDetails.dispatchDetails.receivedByName} el {new Date(selectedOrderDetails.dispatchDetails.deliveredAt).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RECHAZAR PEDIDO (SOLICITAR MOTIVO & LIBERAR RESERVA PREVENTIVA) */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <XCircle className="w-6 h-6" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Rechazar Pedido #{rejectingOrder.orderId}</h3>
            </div>

            <p className="text-slate-600 dark:text-slate-300">
              Al rechazar el pedido, el sistema <strong>liberará automáticamente las unidades reservadas</strong>, devolviéndolas inmediatamente al estado <strong>Disponible</strong> para otros compradores.
            </p>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">Motivo del Rechazo (Obligatorio) *</label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Indique la causa: Sin confirmación comercial, error de precio, solicitud del cliente, etc."
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setRejectingOrder(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isRejecting || !rejectionReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isRejecting ? 'Liberando unidades...' : 'Confirmar Rechazo y Liberar Stock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SOLICITAR RETIRO DE MERCANCÍA */}
      {isWithdrawalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Solicitar Retiro de Mercancía</h3>
              </div>
              <button onClick={() => setIsWithdrawalModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWithdrawal} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Seleccionar Producto Almacenado *</label>
                <select
                  value={withdrawalProductId}
                  onChange={(e) => setWithdrawalProductId(e.target.value)}
                  required
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="">-- Seleccionar --</option>
                  {myInventory.map(i => (
                    <option key={i.id} value={i.productId} disabled={i.available <= 0}>
                      {i.productName} — Disponible: {i.available} uds.
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Cantidad a Retirar *</label>
                <input
                  type="number"
                  min="1"
                  value={withdrawalQty}
                  onChange={(e) => setWithdrawalQty(Number(e.target.value))}
                  required
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Método de Retiro *</label>
                <select
                  value={withdrawalMethod}
                  onChange={(e) => setWithdrawalMethod(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                >
                  <option value="STORE_PICKUP_WAREHOUSE">Retiro Personal por la Tienda en Almacén</option>
                  <option value="COURIER_DISPATCH_TO_STORE">Despacho por Courier a Dirección de Tienda</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Motivo del Retiro *</label>
                <input
                  type="text"
                  value={withdrawalReason}
                  onChange={(e) => setWithdrawalReason(e.target.value)}
                  required
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsWithdrawalModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWithdrawal || !withdrawalProductId}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs disabled:opacity-50"
                >
                  {isSubmittingWithdrawal ? 'Enviando...' : 'Enviar Solicitud de Retiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
