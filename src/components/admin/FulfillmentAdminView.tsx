import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  StorageRequest, 
  StorageRequestStatus,
  FulfillmentInventoryItem, 
  WarehouseLocation, 
  InventoryMovementLog, 
  FulfillmentOrder, 
  FulfillmentIncidence, 
  FulfillmentReturn, 
  FulfillmentWithdrawal, 
  FulfillmentConfig,
  WarehouseLocationConfig
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
  Settings,
  Filter,
  Scan,
  Box,
  ClipboardCheck,
  CheckSquare,
  Building2,
  TrendingDown,
  Send,
  Bell,
  ExternalLink,
  BarChart3,
  Store,
  Phone,
  Mail
} from 'lucide-react';

export type FulfillmentAdminTab = 
  | 'overview' 
  | 'receptions' 
  | 'inventory' 
  | 'pending_confirmations' 
  | 'picking' 
  | 'packing' 
  | 'dispatch' 
  | 'returns' 
  | 'withdrawals' 
  | 'incidences' 
  | 'config';

export interface FulfillmentAdminViewProps {
  activeSubTab?: FulfillmentAdminTab;
  onTabChange?: (tab: FulfillmentAdminTab) => void;
}

export const FulfillmentAdminView: React.FC<FulfillmentAdminViewProps> = ({
  activeSubTab,
  onTabChange
}) => {
  const { 
    stores, 
    products, 
    storageRequests, 
    fulfillmentInventory, 
    inventoryMovements, 
    fulfillmentOrders, 
    fulfillmentIncidences, 
    fulfillmentReturns, 
    fulfillmentWithdrawals, 
    fulfillmentConfig,
    updateStorageRequestStatus,
    processPhysicalReception,
    adjustInventory,
    relocateInventory,
    blockUnblockInventory,
    recordInventoryDamage,
    validateAndPickItem,
    completePacking,
    dispatchFulfillmentOrder,
    deliverFulfillmentOrder,
    createFulfillmentIncidence,
    updateFulfillmentIncidence,
    classifyReturn,
    updateWithdrawalStatus,
    updateFulfillmentConfig,
    showNotification
  } = useApp();

  const [internalTab, setInternalTab] = useState<FulfillmentAdminTab>(activeSubTab || 'overview');

  useEffect(() => {
    if (activeSubTab && activeSubTab !== internalTab) {
      setInternalTab(activeSubTab);
    }
  }, [activeSubTab]);

  const activeTab = activeSubTab || internalTab;

  const setActiveTab = (tab: FulfillmentAdminTab) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  // Filter states
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // KPIs
  const totalPhysicalAll = (fulfillmentInventory || []).reduce((sum, i) => sum + i.totalPhysical, 0);
  const totalAvailableAll = (fulfillmentInventory || []).reduce((sum, i) => sum + i.available, 0);
  const totalReservedAll = (fulfillmentInventory || []).reduce((sum, i) => sum + i.reserved, 0);
  const pendingRequestsCount = (storageRequests || []).filter(r => r.status === 'PENDING_APPROVAL' || r.status === 'CREATED').length;
  const inTransitRequestsCount = (storageRequests || []).filter(r => r.status === 'IN_TRANSIT' || r.status === 'WAITING_GOODS').length;
  const pendingConfirmationOrders = (fulfillmentOrders || []).filter(o => o.status === 'PENDING_STORE_CONFIRMATION');
  const readyForPickingOrders = (fulfillmentOrders || []).filter(o => o.status === 'CONFIRMED_BY_STORE' || o.status === 'PICKING_IN_PROGRESS');
  const readyForPackingOrders = (fulfillmentOrders || []).filter(o => o.status === 'PICKING_COMPLETED' || o.status === 'PACKING_IN_PROGRESS');
  const readyForDispatchOrders = (fulfillmentOrders || []).filter(o => o.status === 'PACKED' || o.status === 'READY_FOR_DISPATCH');
  const inTransitOrders = (fulfillmentOrders || []).filter(o => o.status === 'DISPATCHED' || o.status === 'IN_TRANSIT');
  const openIncidencesCount = (fulfillmentIncidences || []).filter(i => i.status === 'OPEN' || i.status === 'INVESTIGATING').length;

  // --- OVERVIEW SUB-FILTER & NOTIFICATION STATES ---
  const [overviewSubFilter, setOverviewSubFilter] = useState<'ALL' | 'BRANCHES' | 'LOW_STOCK'>('ALL');
  const [lowStockSeverityFilter, setLowStockSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [replenishmentModalData, setReplenishmentModalData] = useState<{
    storeId: string;
    storeName: string;
    storePhone?: string;
    storeEmail?: string;
    productName: string;
    sku: string;
    available: number;
    minAlert: number;
    warehouseName: string;
    messageText: string;
  } | null>(null);

  // --- CALCULATION OF LOW STOCK ITEMS & STORES IN WAREHOUSES ---
  const lowStockItems = (fulfillmentInventory || []).filter(item => {
    const prod = products.find(p => p.id === item.productId);
    const minAlert = prod?.minStockAlert ?? 5;
    return item.available <= minAlert;
  });

  const lowStockStoreMap = new Map<string, {
    storeId: string;
    storeName: string;
    storePhone?: string;
    storeEmail?: string;
    ownerName?: string;
    items: Array<{
      item: FulfillmentInventoryItem;
      product?: any;
      minAlert: number;
      isCritical: boolean;
    }>;
  }>();

  lowStockItems.forEach(item => {
    const prod = products.find(p => p.id === item.productId);
    const minAlert = prod?.minStockAlert ?? 5;
    const isCritical = item.available <= 0;
    const store = stores.find(s => s.id === item.storeId);
    
    if (!lowStockStoreMap.has(item.storeId)) {
      lowStockStoreMap.set(item.storeId, {
        storeId: item.storeId,
        storeName: item.storeName || store?.name || 'Comercio',
        storePhone: store?.whatsapp || store?.phone || '',
        storeEmail: store?.email || '',
        ownerName: store?.ownerName || '',
        items: []
      });
    }
    lowStockStoreMap.get(item.storeId)!.items.push({
      item,
      product: prod,
      minAlert,
      isCritical
    });
  });

  const lowStockStoresList = Array.from(lowStockStoreMap.values());
  const criticalItemsCount = lowStockItems.filter(i => i.available <= 0).length;

  // --- SUCURSALES / WAREHOUSES WITH STORED PRODUCTS ---
  const warehousesWithStock = (fulfillmentConfig?.warehouses || []).map(wh => {
    const whItems = (fulfillmentInventory || []).filter(
      i => i.warehouseId === wh.id || i.location?.warehouseId === wh.id
    );
    const totalPhysical = whItems.reduce((sum, i) => sum + (i.totalPhysical || 0), 0);
    const available = whItems.reduce((sum, i) => sum + (i.available || 0), 0);
    const reserved = whItems.reduce((sum, i) => sum + (i.reserved || 0), 0);
    const inPrep = whItems.reduce((sum, i) => sum + ((i.inPicking || 0) + (i.inPacking || 0) + (i.prepared || 0)), 0);
    const damaged = whItems.reduce((sum, i) => sum + ((i.damaged || 0) + (i.blocked || 0)), 0);
    
    const branchStoreIds = Array.from(new Set(whItems.map(i => i.storeId)));
    const branchStores = branchStoreIds.map(sid => {
      const st = stores.find(s => s.id === sid);
      const stItems = whItems.filter(i => i.storeId === sid);
      const stUnits = stItems.reduce((sum, i) => sum + (i.totalPhysical || 0), 0);
      return {
        id: sid,
        name: st?.name || whItems.find(i => i.storeId === sid)?.storeName || sid,
        unitsCount: stUnits,
        productsCount: stItems.length
      };
    });

    const totalValuation = whItems.reduce((sum, i) => {
      const p = products.find(prod => prod.id === i.productId);
      return sum + ((p?.price || 0) * (i.totalPhysical || 0));
    }, 0);

    return {
      warehouse: wh,
      items: whItems,
      itemsCount: whItems.length,
      totalPhysical,
      available,
      reserved,
      inPrep,
      damaged,
      stores: branchStores,
      storesCount: branchStoreIds.length,
      totalValuation
    };
  });

  // Real-time countdown timer tick
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

  // --- RECEPTION MODAL STATES ---
  const [receptionModalRequest, setReceptionModalRequest] = useState<StorageRequest | null>(null);
  const [receivedQty, setReceivedQty] = useState<number>(0);
  const [damagedQty, setDamagedQty] = useState<number>(0);
  const [acceptedQty, setAcceptedQty] = useState<number>(0);
  const [targetWarehouseId, setTargetWarehouseId] = useState('wh-sdo-01');
  const [locZone, setLocZone] = useState('Zona A - Almacén General');
  const [locAisle, setLocAisle] = useState('P-01');
  const [locShelf, setLocShelf] = useState('E-01');
  const [locLevel, setLocLevel] = useState('N-01');
  const [locPos, setLocPos] = useState('Pos-01');
  const [operatorNotes, setOperatorNotes] = useState('');
  const [receptionPhotos, setReceptionPhotos] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState('');
  const [isProcessingReception, setIsProcessingReception] = useState(false);

  const openReceptionModal = (req: StorageRequest) => {
    setReceptionModalRequest(req);
    setReceivedQty(req.declaredQuantity);
    setDamagedQty(0);
    setAcceptedQty(req.declaredQuantity);
    setTargetWarehouseId(req.warehouseId || 'wh-sdo-01');
    setLocZone('Zona A - Almacén General');
    setLocAisle('P-01');
    setLocShelf('E-01');
    setLocLevel('N-01');
    setLocPos('Pos-01');
    setOperatorNotes('');
    setReceptionPhotos([]);
  };

  const handleConfirmPhysicalReception = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receptionModalRequest) return;
    if (acceptedQty < 0 || receivedQty < 0 || damagedQty < 0) {
      showNotification('Las cantidades no pueden ser negativas', 'error');
      return;
    }

    setIsProcessingReception(true);
    try {
      const wh = fulfillmentConfig?.warehouses?.find(w => w.id === targetWarehouseId) || fulfillmentConfig?.warehouses?.[0];
      const barcode = `LOC-${locZone.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, '')}-${locAisle}-${locShelf}-${locLevel}-${locPos}`;

      const ok = await processPhysicalReception(receptionModalRequest.id, {
        declaredQuantity: receptionModalRequest.declaredQuantity,
        receivedQuantity: Number(receivedQty),
        damagedQuantity: Number(damagedQty),
        acceptedQuantity: Number(acceptedQty),
        location: {
          warehouseId: targetWarehouseId,
          warehouseName: wh?.name || 'Centro Logístico Santo Domingo Oeste',
          zone: locZone,
          aisle: locAisle,
          shelf: locShelf,
          level: locLevel,
          position: locPos,
          barcode
        },
        operatorNotes,
        evidencePhotos: receptionPhotos
      });

      if (ok) {
        showNotification(`Recepción física completada. ${acceptedQty} unidades añadidas a Disponible para ${receptionModalRequest.storeName}.`, 'success');
        setReceptionModalRequest(null);
      } else {
        showNotification('Error al procesar la recepción física', 'error');
      }
    } finally {
      setIsProcessingReception(false);
    }
  };

  // --- INVENTORY ADJUSTMENT MODAL ---
  const [adjustmentItem, setAdjustmentItem] = useState<FulfillmentInventoryItem | null>(null);
  const [adjustNewAvail, setAdjustNewAvail] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('Conteo físico cíclico de auditoría');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  const openAdjustmentModal = (item: FulfillmentInventoryItem) => {
    setAdjustmentItem(item);
    setAdjustNewAvail(item.available);
    setAdjustReason('Conteo físico cíclico de auditoría');
    setAdjustNotes('');
  };

  const handleConfirmAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentItem) return;

    setIsAdjusting(true);
    try {
      const ok = await adjustInventory(adjustmentItem.id, {
        newAvailable: Number(adjustNewAvail),
        reason: adjustReason,
        notes: adjustNotes
      });
      if (ok) {
        showNotification(`Ajuste de inventario aplicado a SKU ${adjustmentItem.sku}`, 'success');
        setAdjustmentItem(null);
      } else {
        showNotification('Error al ajustar inventario', 'error');
      }
    } finally {
      setIsAdjusting(false);
    }
  };

  // --- PICKING SCAN & VALIDATION MODAL ---
  const [activePickingOrder, setActivePickingOrder] = useState<FulfillmentOrder | null>(null);
  const [scannedSkuInput, setScannedSkuInput] = useState('');
  const [scannedLocInput, setScannedLocInput] = useState('');
  const [pickingErrorAlert, setPickingErrorAlert] = useState<string | null>(null);
  const [isValidatingPick, setIsValidatingPick] = useState(false);

  const handlePickItemScan = async (productId: string) => {
    if (!activePickingOrder) return;
    setPickingErrorAlert(null);
    setIsValidatingPick(true);

    try {
      const res = await validateAndPickItem(
        activePickingOrder.id,
        productId,
        scannedSkuInput,
        scannedLocInput
      );

      if (!res.success) {
        setPickingErrorAlert(res.error || 'Discrepancia en el escaneo.');
      } else {
        showNotification('Ítem verificado y recolectado exitosamente', 'success');
        setScannedSkuInput('');
        setScannedLocInput('');
        // Update local modal state
        if (res.order) {
          setActivePickingOrder(res.order);
        }
      }
    } finally {
      setIsValidatingPick(false);
    }
  };

  // --- PACKING MODAL STATES ---
  const [activePackingOrder, setActivePackingOrder] = useState<FulfillmentOrder | null>(null);
  const [packBoxes, setPackBoxes] = useState(1);
  const [packWeight, setPackWeight] = useState(1.8);
  const [packL, setPackL] = useState(25);
  const [packW, setPackW] = useState(20);
  const [packH, setPackH] = useState(15);
  const [packType, setPackType] = useState('Caja Plazado Mediana con Precinto');
  const [packNotes, setPackNotes] = useState('');
  const [isSubmittingPacking, setIsSubmittingPacking] = useState(false);

  const handleCompletePacking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePackingOrder) return;

    setIsSubmittingPacking(true);
    try {
      const ok = await completePacking(activePackingOrder.id, {
        packageCount: Number(packBoxes),
        totalWeightKg: Number(packWeight),
        dimensions: { length: Number(packL), width: Number(packW), height: Number(packH) },
        packageType: packType,
        packageNotes: packNotes
      });
      if (ok) {
        showNotification(`Orden ${activePackingOrder.orderId} empacada y lista para despacho`, 'success');
        setActivePackingOrder(null);
      } else {
        showNotification('Error al completar el empaque', 'error');
      }
    } finally {
      setIsSubmittingPacking(false);
    }
  };

  // --- DISPATCH MODAL STATES ---
  const [activeDispatchOrder, setActiveDispatchOrder] = useState<FulfillmentOrder | null>(null);
  const [carrierName, setCarrierName] = useState('Plazado Express Courier');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [dispatchNotes, setDispatchNotes] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);

  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDispatchOrder) return;

    setIsDispatching(true);
    try {
      const ok = await dispatchFulfillmentOrder(activeDispatchOrder.id, {
        carrier: carrierName,
        trackingNumber: trackingNumber || `TRK-${Date.now().toString().slice(-6)}`,
        dispatchNotes
      });
      if (ok) {
        showNotification(`Orden ${activeDispatchOrder.orderId} despachada con éxito`, 'success');
        setActiveDispatchOrder(null);
      } else {
        showNotification('Error al despachar orden', 'error');
      }
    } finally {
      setIsDispatching(false);
    }
  };

  // --- CONFIG STATE ---
  const [configTimeout, setConfigTimeout] = useState(fulfillmentConfig?.orderConfirmationTimeoutMinutes || 60);
  const [configTimeoutAction, setConfigTimeoutAction] = useState(fulfillmentConfig?.timeoutAction || 'AUTO_CANCEL_RELEASE');
  const [configStorageFee, setConfigStorageFee] = useState(fulfillmentConfig?.storageFeePerM3PerDay || 15);
  const [configHandlingFee, setConfigHandlingFee] = useState(fulfillmentConfig?.handlingFeePerOrder || 75);
  const [configPackagingFee, setConfigPackagingFee] = useState(fulfillmentConfig?.packagingFee || 45);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      const ok = await updateFulfillmentConfig({
        orderConfirmationTimeoutMinutes: Number(configTimeout),
        timeoutAction: configTimeoutAction as any,
        storageFeePerM3PerDay: Number(configStorageFee),
        handlingFeePerOrder: Number(configHandlingFee),
        packagingFee: Number(configPackagingFee)
      });
      if (ok) {
        showNotification('Configuración de Plazado Fulfillment guardada con éxito', 'success');
      } else {
        showNotification('Error al guardar configuración', 'error');
      }
    } finally {
      setIsSavingConfig(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Operations Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
              <Warehouse className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold px-2.5 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  Centro Logístico
                </span>
                <span className="text-xs text-slate-400">Control Operativo Exclusivo</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight mt-0.5">Plazado Fulfillment — Operaciones</h1>
              <p className="text-xs text-slate-400">
                Gestión integral de recepciones, conteos físicos, anaqueles, picking por escaneo, empaque y despachos nacionales.
              </p>
            </div>
          </div>

          {/* Quick status counters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
              <span className="text-slate-400 block text-[10px]">Stock Custodiado</span>
              <strong className="text-white text-sm font-bold">{totalPhysicalAll} uds.</strong>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
              <span className="text-slate-400 block text-[10px]">Disponible Venta</span>
              <strong className="text-emerald-400 text-sm font-bold">{totalAvailableAll} uds.</strong>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700">
              <span className="text-slate-400 block text-[10px]">Reservado Pedidos</span>
              <strong className="text-amber-400 text-sm font-bold">{totalReservedAll} uds.</strong>
            </div>
          </div>
        </div>

        {/* Global Operational Flow Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-4 mt-4 border-t border-slate-800 text-center text-xs">
          <button 
            onClick={() => setActiveTab('receptions')}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              pendingRequestsCount > 0 ? 'bg-amber-950/40 border-amber-600/50 text-amber-200' : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
            }`}
          >
            <div className="font-bold text-sm">{pendingRequestsCount}</div>
            <div className="text-[10px] text-slate-400">Recepciones Pend.</div>
          </button>

          <button 
            onClick={() => setActiveTab('pending_confirmations')}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              pendingConfirmationOrders.length > 0 ? 'bg-amber-950/40 border-amber-600/50 text-amber-200' : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
            }`}
          >
            <div className="font-bold text-sm">{pendingConfirmationOrders.length}</div>
            <div className="text-[10px] text-slate-400">Por Confirmar Tienda</div>
          </button>

          <button 
            onClick={() => setActiveTab('picking')}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              readyForPickingOrders.length > 0 ? 'bg-blue-950/50 border-blue-600/60 text-blue-200' : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
            }`}
          >
            <div className="font-bold text-sm">{readyForPickingOrders.length}</div>
            <div className="text-[10px] text-slate-400">En Picking</div>
          </button>

          <button 
            onClick={() => setActiveTab('packing')}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              readyForPackingOrders.length > 0 ? 'bg-indigo-950/50 border-indigo-600/60 text-indigo-200' : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
            }`}
          >
            <div className="font-bold text-sm">{readyForPackingOrders.length}</div>
            <div className="text-[10px] text-slate-400">En Packing</div>
          </button>

          <button 
            onClick={() => setActiveTab('dispatch')}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              readyForDispatchOrders.length > 0 ? 'bg-cyan-950/50 border-cyan-600/60 text-cyan-200' : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
            }`}
          >
            <div className="font-bold text-sm">{readyForDispatchOrders.length}</div>
            <div className="text-[10px] text-slate-400">Listos Despacho</div>
          </button>

          <button 
            onClick={() => setActiveTab('dispatch')}
            className="p-2 rounded-lg border bg-slate-800/40 border-slate-700/50 text-slate-300 transition-all cursor-pointer"
          >
            <div className="font-bold text-sm">{inTransitOrders.length}</div>
            <div className="text-[10px] text-slate-400">En Ruta (Couriers)</div>
          </button>

          <button 
            onClick={() => setActiveTab('returns')}
            className="p-2 rounded-lg border bg-slate-800/40 border-slate-700/50 text-slate-300 transition-all cursor-pointer"
          >
            <div className="font-bold text-sm">{(fulfillmentReturns || []).length}</div>
            <div className="text-[10px] text-slate-400">Devoluciones</div>
          </button>

          <button 
            onClick={() => setActiveTab('incidences')}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              openIncidencesCount > 0 ? 'bg-rose-950/50 border-rose-600/60 text-rose-200' : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
            }`}
          >
            <div className="font-bold text-sm">{openIncidencesCount}</div>
            <div className="text-[10px] text-slate-400">Incidencias</div>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          <button
            id="fulfillment-tab-overview-btn"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Resumen General</span>
            {lowStockItems.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black animate-pulse">
                {lowStockItems.length} alertas
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('receptions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              activeTab === 'receptions' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Recepciones & Conteo</span>
            {pendingRequestsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-black">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'inventory' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Control de Inventario
          </button>

          <button
            onClick={() => setActiveTab('pending_confirmations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              activeTab === 'pending_confirmations' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Por Confirmar Tienda</span>
            {pendingConfirmationOrders.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('picking')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              activeTab === 'picking' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Picking ({readyForPickingOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('packing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              activeTab === 'packing' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Packing ({readyForPackingOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('dispatch')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              activeTab === 'dispatch' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Despachos ({readyForDispatchOrders.length + inTransitOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('returns')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'returns' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Devoluciones
          </button>

          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'withdrawals' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Retiros
          </button>

          <button
            onClick={() => setActiveTab('incidences')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              activeTab === 'incidences' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>Incidencias</span>
            {openIncidencesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {openIncidencesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1 ${
              activeTab === 'config' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Configuración</span>
          </button>
        </div>

        {/* Global Store Isolation Selector */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">Filtrar por Tienda:</span>
          <select
            value={selectedStoreFilter}
            onChange={(e) => setSelectedStoreFilter(e.target.value)}
            className="p-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-xs"
          >
            <option value="ALL">Todas las Tiendas (Global)</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* TAB 1: RESUMEN GENERAL (SUCURSALES CON MERCANCÍA & TIENDAS CON STOCK BAJO) */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Sub-Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500">Filtrar Resumen:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setOverviewSubFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    overviewSubFilter === 'ALL'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Vista Consolidada (Todo)
                </button>
                <button
                  type="button"
                  onClick={() => setOverviewSubFilter('BRANCHES')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    overviewSubFilter === 'BRANCHES'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-500" />
                  <span>Sucursales ({warehousesWithStock.filter(w => w.totalPhysical > 0).length} con existencias)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOverviewSubFilter('LOW_STOCK')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    overviewSubFilter === 'LOW_STOCK'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Tiendas con Stock Bajo ({lowStockStoresList.length})</span>
                  {criticalItemsCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">Total existencias en red:</span>
              <span className="font-black text-slate-900 dark:text-white font-mono text-sm">{totalPhysicalAll.toLocaleString()} uds.</span>
            </div>
          </div>

          {/* SECTION 1: SUCURSALES CON PRODUCTOS ALMACENADOS */}
          {(overviewSubFilter === 'ALL' || overviewSubFilter === 'BRANCHES') && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-950/60 rounded-xl">
                    <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                      Sucursales con Productos Almacenados
                      <span className="px-2 py-0.5 rounded-full text-xs font-black bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300">
                        {warehousesWithStock.filter(w => w.totalPhysical > 0).length} de {warehousesWithStock.length} activas
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Centros logísticos administrados por Plazado que albergan inventario físico en custodia, tiendas presentes y estado de anaqueles.
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid of Warehouses */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {warehousesWithStock.map(({ warehouse: wh, itemsCount, totalPhysical, available, reserved, inPrep, damaged, stores: branchStores, storesCount, totalValuation }) => {
                  const hasStock = totalPhysical > 0;
                  return (
                    <div 
                      key={wh.id}
                      className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs space-y-4 transition-all ${
                        hasStock ? 'border-slate-200 dark:border-slate-800 hover:border-blue-400' : 'border-dashed border-slate-200 dark:border-slate-800 opacity-80'
                      }`}
                    >
                      {/* Top Header of the Branch */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-black text-slate-900 dark:text-white text-sm">
                              {wh.name}
                            </h4>
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {wh.id}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>{wh.address} • {wh.municipality}, {wh.province}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400">
                            Responsable de Almacén: <strong>{wh.managerName}</strong> (Tel: {wh.contactPhone})
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                          hasStock ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {hasStock ? '✓ Mercancía Activa' : 'Sin existencias'}
                        </span>
                      </div>

                      {/* Stock Figures Grid */}
                      <div className="grid grid-cols-5 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-center text-xs">
                        <div>
                          <div className="font-mono font-black text-slate-900 dark:text-white text-sm">{totalPhysical}</div>
                          <div className="text-[10px] text-slate-500 font-semibold">Total Físico</div>
                        </div>
                        <div>
                          <div className="font-mono font-black text-emerald-600 text-sm">{available}</div>
                          <div className="text-[10px] text-emerald-700 font-semibold">Disponible</div>
                        </div>
                        <div>
                          <div className="font-mono font-black text-blue-600 text-sm">{reserved}</div>
                          <div className="text-[10px] text-blue-700 font-semibold">Reservado</div>
                        </div>
                        <div>
                          <div className="font-mono font-black text-amber-600 text-sm">{inPrep}</div>
                          <div className="text-[10px] text-amber-700 font-semibold">En Prep.</div>
                        </div>
                        <div>
                          <div className="font-mono font-black text-rose-600 text-sm">{damaged}</div>
                          <div className="text-[10px] text-rose-700 font-semibold">Dañado/Bloq.</div>
                        </div>
                      </div>

                      {/* Branch Highlights: Products, Stores & Valuation */}
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 text-[11px] text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1 font-semibold">
                            <Package className="w-3.5 h-3.5 text-blue-500" />
                            {itemsCount} productos custodiados
                          </span>
                          <span className="flex items-center gap-1 font-semibold">
                            <Store className="w-3.5 h-3.5 text-purple-500" />
                            {storesCount} {storesCount === 1 ? 'tienda' : 'tiendas'} con stock
                          </span>
                        </div>

                        <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Valor en Custodia: <span className="text-emerald-700 font-black font-mono">RD$ {totalValuation.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Stores with stock in this branch */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Tiendas Propietarias en esta Sucursal ({branchStores.length}):
                        </span>
                        {branchStores.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">No hay comercios con stock depositado en este almacén actualmente.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {branchStores.map(bs => (
                              <span 
                                key={bs.id}
                                className="inline-flex items-center gap-1 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold"
                              >
                                <span>{bs.name}</span>
                                <span className="font-mono font-black text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-700 px-1 rounded text-[10px]">
                                  {bs.unitsCount} uds.
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex flex-wrap gap-1">
                          {wh.zones?.slice(0, 3).map((z, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800 text-[10px] text-slate-500 border border-slate-200 dark:border-slate-700">
                              {z}
                            </span>
                          ))}
                          {(wh.zones?.length || 0) > 3 && (
                            <span className="text-[10px] text-slate-400">+{wh.zones!.length - 3} zonas</span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('inventory');
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                        >
                          <span>Ver en Inventario General</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 2: TIENDAS CON STOCK BAJO EN ALMACÉN */}
          {(overviewSubFilter === 'ALL' || overviewSubFilter === 'LOW_STOCK') && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-100 dark:bg-rose-950/60 rounded-xl">
                    <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                      Tiendas con Stock Bajo o Crítico en Almacén
                      {lowStockItems.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300 animate-pulse">
                          {lowStockItems.length} alertas ({criticalItemsCount} agotados)
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Alertas de prevención de quiebres de inventario. Comercios cuyos productos custodiados han alcanzado el umbral mínimo de seguridad o están agotados.
                    </p>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setLowStockSeverityFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      lowStockSeverityFilter === 'ALL'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Todas ({lowStockStoresList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLowStockSeverityFilter('CRITICAL')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                      lowStockSeverityFilter === 'CRITICAL'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                    }`}
                  >
                    <span>Solo Agotados (0 stock)</span>
                    <span className="font-black">({lowStockStoresList.filter(s => s.items.some(i => i.isCritical)).length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLowStockSeverityFilter('WARNING')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                      lowStockSeverityFilter === 'WARNING'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                    }`}
                  >
                    <span>Solo Bajo Stock</span>
                    <span className="font-black">({lowStockStoresList.filter(s => s.items.some(i => !i.isCritical)).length})</span>
                  </button>
                </div>
              </div>

              {/* Content List for Stores with Low Stock */}
              {lowStockStoresList.length === 0 ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-black text-emerald-900 dark:text-emerald-200 text-sm">
                    ¡Inventario en Niveles Saludables!
                  </h4>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 max-w-lg mx-auto">
                    Actualmente no hay ninguna tienda con stock crítico o bajo en las instalaciones de Plazado Fulfillment. Todos los productos almacenados cuentan con existencias operativas por encima de sus límites de alerta.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lowStockStoresList
                    .filter(storeGroup => {
                      if (lowStockSeverityFilter === 'CRITICAL') {
                        return storeGroup.items.some(i => i.isCritical);
                      }
                      if (lowStockSeverityFilter === 'WARNING') {
                        return storeGroup.items.some(i => !i.isCritical);
                      }
                      return true;
                    })
                    .map(storeGroup => {
                      const displayedItems = storeGroup.items.filter(i => {
                        if (lowStockSeverityFilter === 'CRITICAL') return i.isCritical;
                        if (lowStockSeverityFilter === 'WARNING') return !i.isCritical;
                        return true;
                      });
                      if (displayedItems.length === 0) return null;

                      return (
                        <div 
                          key={storeGroup.storeId}
                          className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-5 shadow-xs space-y-3"
                        >
                          {/* Store Header Bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 font-black text-sm flex items-center justify-center shrink-0 border border-rose-200">
                                {storeGroup.storeName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-black text-slate-900 dark:text-white text-sm">
                                    {storeGroup.storeName}
                                  </h4>
                                  <span className="font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                    ID: {storeGroup.storeId}
                                  </span>
                                  {storeGroup.items.some(i => i.isCritical) && (
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white">
                                      CRÍTICO AGOTADO
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5 flex-wrap">
                                  {storeGroup.ownerName && <span>Propietario: <strong>{storeGroup.ownerName}</strong></span>}
                                  {storeGroup.storePhone && (
                                    <span className="flex items-center gap-1 font-mono">
                                      <Phone className="w-3 h-3 text-emerald-600" />
                                      {storeGroup.storePhone}
                                    </span>
                                  )}
                                  {storeGroup.storeEmail && (
                                    <span className="flex items-center gap-1">
                                      <Mail className="w-3 h-3 text-blue-500" />
                                      {storeGroup.storeEmail}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 shrink-0">
                              {displayedItems.length} {displayedItems.length === 1 ? 'producto en alerta' : 'productos en alerta'}
                            </span>
                          </div>

                          {/* Items Table for this store */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                  <th className="py-2.5 px-3">Producto / Variante</th>
                                  <th className="py-2.5 px-2">SKU</th>
                                  <th className="py-2.5 px-2">Sucursal / Ubicación</th>
                                  <th className="py-2.5 px-3 text-center">Disponible vs Alerta</th>
                                  <th className="py-2.5 px-2 text-center">Nivel</th>
                                  <th className="py-2.5 px-3 text-right">Acción de Reposición</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {displayedItems.map(({ item, product, minAlert, isCritical }) => (
                                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                    <td className="py-2.5 px-3">
                                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <span>{item.productName}</span>
                                        {item.variantName && (
                                          <span className="text-[10px] text-slate-500 font-normal bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                                            {item.variantName}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-2 font-mono font-bold text-slate-600 dark:text-slate-400">
                                      {item.sku}
                                    </td>
                                    <td className="py-2.5 px-2 text-slate-600 dark:text-slate-400">
                                      <div className="font-semibold text-slate-800 dark:text-slate-200">{item.warehouseName}</div>
                                      <div className="text-[10px] text-slate-400">
                                        {item.location?.zone || 'Zona A'} • Pasillo {item.location?.aisle || '01'}
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      <div className="font-mono font-black text-sm">
                                        <span className={isCritical ? 'text-rose-600 font-black' : 'text-amber-600 font-bold'}>
                                          {item.available}
                                        </span>
                                        <span className="text-slate-400 text-xs"> / {minAlert} mín</span>
                                      </div>
                                      <div className="w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full ${isCritical ? 'bg-rose-600' : 'bg-amber-500'}`}
                                          style={{ width: `${Math.min(100, Math.max(5, (item.available / minAlert) * 100))}%` }}
                                        />
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-2 text-center">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                        isCritical 
                                          ? 'bg-rose-100 text-rose-800 border border-rose-300' 
                                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                                      }`}>
                                        {isCritical ? 'AGOTADO (0 uds)' : 'STOCK BAJO'}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReplenishmentModalData({
                                            storeId: storeGroup.storeId,
                                            storeName: storeGroup.storeName,
                                            storePhone: storeGroup.storePhone,
                                            storeEmail: storeGroup.storeEmail,
                                            productName: item.productName,
                                            sku: item.sku,
                                            available: item.available,
                                            minAlert,
                                            warehouseName: item.warehouseName,
                                            messageText: `Estimado equipo de ${storeGroup.storeName},\n\nLe notificamos formalmente desde la Dirección de Operaciones de Plazado Fulfillment que su producto "${item.productName}" (SKU: ${item.sku}) en el almacén "${item.warehouseName}" cuenta con solo ${item.available} unidades disponibles (Nivel mínimo de alerta: ${minAlert} unidades).\n\nPara evitar quiebres de inventario y suspensión de ventas en la plataforma, le sugerimos emitir inmediatamente una solicitud de reposición de mercancía (#PF-XXXXX) desde su panel de comercio.\n\nAtentamente,\nEquipo de Logística & Almacenes Plazado.com`
                                          });
                                        }}
                                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 ml-auto shadow-2xs transition-colors cursor-pointer"
                                      >
                                        <Send className="w-3 h-3" />
                                        <span>Notificar a Tienda</span>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* Quick Actions Panel & Active Facilities Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
            {/* Quick Actions Panel */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Acciones Operativas Rápidas</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('receptions')}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-colors cursor-pointer group"
                >
                  <Package className="w-5 h-5 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Conteo Físico & Recepción</div>
                  <span className="text-[11px] text-slate-500">Ingresar bultos a estantería</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('picking')}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-purple-50 dark:hover:bg-purple-950/40 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-colors cursor-pointer group"
                >
                  <Scan className="w-5 h-5 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Estación de Picking</div>
                  <span className="text-[11px] text-slate-500">Escaneo y validación de SKU</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('packing')}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-colors cursor-pointer group"
                >
                  <Box className="w-5 h-5 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Estación de Packing</div>
                  <span className="text-[11px] text-slate-500">Registro de bultos y empaque</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('dispatch')}
                  className="p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-colors cursor-pointer group"
                >
                  <Truck className="w-5 h-5 text-cyan-600 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Mesa de Despachos</div>
                  <span className="text-[11px] text-slate-500">Asignar transportista y guía</span>
                </button>
              </div>
            </div>

            {/* Warehouse Facilities Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Instalaciones de Almacenamiento Activas</h3>
              
              <div className="space-y-3">
                {(fulfillmentConfig?.warehouses || []).map(wh => (
                  <div key={wh.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 dark:text-white">{wh.name}</strong>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        Operativo
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      <span>{wh.address} • {wh.municipality}, {wh.province}</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-400 text-[11px]">
                      Responsable: <strong>{wh.managerName}</strong> (Tel: {wh.contactPhone})
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {wh.zones?.map((z, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[10px] text-slate-700 dark:text-slate-300">
                          {z}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECEPCIONES & CONTEO FÍSICO */}
      {activeTab === 'receptions' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Recepciones Físicas y Validación</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Al llegar la mercancía, el personal de Plazado realiza el conteo físico formal y asigna el anaquel antes de acreditar stock disponible.
              </p>
            </div>
          </div>

          {(storageRequests || []).length === 0 ? (
            <p className="text-center py-12 text-slate-400 text-xs">No hay solicitudes de almacenamiento registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Solicitud #</th>
                    <th className="py-3 px-3">Tienda</th>
                    <th className="py-3 px-3">Producto / SKU</th>
                    <th className="py-3 px-3 text-center">Cant. Declarada</th>
                    <th className="py-3 px-3">Almacén Destino</th>
                    <th className="py-3 px-3">Estado</th>
                    <th className="py-3 px-4 text-right">Acción Operativa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(storageRequests || [])
                    .filter(r => selectedStoreFilter === 'ALL' || r.storeId === selectedStoreFilter)
                    .map(req => (
                      <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {req.id}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          {req.storeName}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-900 dark:text-white">{req.productName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">SKU: {req.sku}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold">
                          {req.declaredQuantity} uds.
                          <div className="text-[10px] text-slate-400">{req.packageCount} bultos ({req.weightKg} kg)</div>
                        </td>
                        <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                          {req.warehouseName}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            req.status === 'STORED' ? 'bg-emerald-100 text-emerald-800' :
                            req.status === 'RECEIVED' ? 'bg-purple-100 text-purple-800' :
                            req.status === 'IN_TRANSIT' ? 'bg-indigo-100 text-indigo-800' :
                            req.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          {req.status === 'PENDING_APPROVAL' && (
                            <button
                              onClick={() => updateStorageRequestStatus(req.id, 'APPROVED', 'Solicitud aprobada por almacén')}
                              className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded font-bold cursor-pointer"
                            >
                              Aprobar Envío
                            </button>
                          )}

                          {req.status === 'APPROVED' && (
                            <button
                              onClick={() => updateStorageRequestStatus(req.id, 'IN_TRANSIT', 'Mercancía en camino al almacén')}
                              className="px-2.5 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold cursor-pointer"
                            >
                              Marcar En Tránsito
                            </button>
                          )}

                          {req.status !== 'STORED' && req.status !== 'REJECTED' && (
                            <button
                              onClick={() => openReceptionModal(req)}
                              className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold shadow-xs cursor-pointer inline-flex items-center gap-1"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              <span>Conteo Físico</span>
                            </button>
                          )}

                          {req.status === 'STORED' && (
                            <span className="text-[11px] text-emerald-600 font-bold">
                              ✓ Almacenado ({req.receptionDetails?.acceptedQuantity} uds.)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CONTROL DE INVENTARIO CENTRALIZADO */}
      {activeTab === 'inventory' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Control Centralizado de Inventario</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Custodia física por tienda. Modificación exclusiva de Plazado con registro obligatorio de trazabilidad.
              </p>
            </div>
          </div>

          {(fulfillmentInventory || []).length === 0 ? (
            <p className="text-center py-12 text-slate-400 text-xs">No hay existencias almacenadas aún.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Tienda Propietaria</th>
                    <th className="py-3 px-3">Producto & SKU</th>
                    <th className="py-3 px-3">Ubicación Anaquel</th>
                    <th className="py-3 px-3 text-center">Físico Total</th>
                    <th className="py-3 px-3 text-center text-emerald-600 font-bold">Disponible</th>
                    <th className="py-3 px-3 text-center text-amber-600 font-bold">Reservado</th>
                    <th className="py-3 px-3 text-center text-rose-600 font-bold">Dañado</th>
                    <th className="py-3 px-4 text-right">Operaciones Plazado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(fulfillmentInventory || [])
                    .filter(i => selectedStoreFilter === 'ALL' || i.storeId === selectedStoreFilter)
                    .map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {inv.storeName}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 dark:text-white">{inv.productName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">SKU: {inv.sku}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-blue-600 dark:text-blue-400">
                          {inv.location?.zone} • {inv.location?.aisle}-{inv.location?.shelf}-{inv.location?.level}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-white">
                          {inv.totalPhysical}
                        </td>
                        <td className="py-3 px-3 text-center font-black text-emerald-600">
                          {inv.available}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-amber-600">
                          {inv.reserved}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-rose-600">
                          {inv.damaged}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5">
                          <button
                            onClick={() => openAdjustmentModal(inv)}
                            className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-bold cursor-pointer"
                          >
                            Ajustar
                          </button>

                          <button
                            onClick={() => {
                              const qty = prompt(`Cantidad a bloquear/desbloquear para SKU ${inv.sku}:`, '1');
                              if (qty && Number(qty) > 0) {
                                const action = confirm('¿Desea BLOQUEAR (Aceptar) o DESBLOQUEAR (Cancelar)?') ? 'BLOCK' : 'UNBLOCK';
                                blockUnblockInventory(inv.id, Number(qty), action, 'Control de calidad');
                              }
                            }}
                            className="px-2.5 py-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded font-bold cursor-pointer"
                          >
                            Bloquear/Desbl.
                          </button>

                          <button
                            onClick={() => {
                              const qty = prompt(`Cantidad de unidades dañadas a registrar para SKU ${inv.sku}:`, '1');
                              if (qty && Number(qty) > 0) {
                                const reason = prompt('Motivo del daño (ej: rotura en anaquel):', 'Deterioro durante manipulación') || 'Daño';
                                recordInventoryDamage(inv.id, Number(qty), reason);
                              }
                            }}
                            className="px-2.5 py-1 text-xs bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded font-bold cursor-pointer"
                          >
                            Registrar Daño
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

      {/* TAB 4: PEDIDOS POR CONFIRMAR */}
      {activeTab === 'pending_confirmations' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Pedidos Esperando Confirmación de Tienda</h3>
              <p className="text-xs text-slate-500">
                La tienda debe pulsar "Confirmar Pedido" antes de que expire el límite para iniciar la recolección física.
              </p>
            </div>
          </div>

          {pendingConfirmationOrders.length === 0 ? (
            <p className="text-center py-10 text-slate-400 text-xs">No hay pedidos pendientes de confirmación en este momento.</p>
          ) : (
            <div className="space-y-3">
              {pendingConfirmationOrders.map(fo => (
                <div key={fo.id} className="p-4 border border-amber-300 dark:border-amber-700/80 bg-amber-50/40 dark:bg-amber-950/20 rounded-xl flex items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 dark:text-white text-sm font-mono">Pedido #{fo.orderId}</strong>
                      <span className="font-mono text-blue-600 font-bold">{fo.id}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold text-[10px]">
                        Esperando Tienda
                      </span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 mt-1">
                      Tienda: <strong>{fo.storeName}</strong> • Cliente: <strong>{fo.customerName}</strong> ({fo.customerPhone})
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {fo.items.map(it => `${it.productName} (${it.quantity} uds)`).join(', ')}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-amber-800 dark:text-amber-300 font-mono font-black text-sm">
                      {formatCountdown(fo.storeConfirmationDeadline)}
                    </div>
                    <span className="text-[10px] text-slate-500">Tiempo restante</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PICKING (PREPARACIÓN & ESCANEO CON VALIDACIÓN) */}
      {activeTab === 'picking' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Estación de Picking & Escaneo</h3>
              <p className="text-xs text-slate-500">
                Verificación estricta: Se valida la ubicación asignada y el código/SKU del producto. Discrepancias bloquean la operación.
              </p>
            </div>
          </div>

          {readyForPickingOrders.length === 0 ? (
            <p className="text-center py-10 text-slate-400 text-xs">No hay órdenes en cola de picking.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readyForPickingOrders.map(fo => (
                <div key={fo.id} className="p-4 border border-blue-200 dark:border-blue-900 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">{fo.pickingCode}</span>
                      <div className="text-slate-500 font-mono text-[11px]">Pedido #{fo.orderId} • {fo.storeName}</div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                      {fo.status}
                    </span>
                  </div>

                  {/* Items to pick */}
                  <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-2">
                    {fo.items.map((it, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg space-y-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900 dark:text-white">{it.productName}</strong>
                          <span className="font-bold text-blue-600">{it.quantity} ud(s).</span>
                        </div>
                        <div className="text-slate-500 font-mono text-[11px]">
                          SKU Esperado: <strong>{it.sku}</strong>
                        </div>
                        <div className="text-slate-600 dark:text-slate-300 text-[11px] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-500" />
                          <span>Ubicación: {it.location?.zone} — Pasillo {it.location?.aisle} / Estante {it.location?.shelf}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Código de Barras Ubicación: {it.location?.barcode || 'N/A'}
                        </div>

                        {it.isPicked ? (
                          <div className="text-emerald-600 font-bold text-[11px] flex items-center gap-1 pt-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>Verificado y Pickeado (SKU: {it.scannedSku})</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setActivePickingOrder(fo);
                              setScannedSkuInput('');
                              setScannedLocInput(it.location?.barcode || '');
                              setPickingErrorAlert(null);
                            }}
                            className="mt-1 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1 text-xs"
                          >
                            <Scan className="w-3.5 h-3.5" />
                            <span>Escanear / Validar Ítem</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: PACKING (EMPAQUE) */}
      {activeTab === 'packing' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Estación de Packing</h3>
              <p className="text-xs text-slate-500">
                Registro de peso, dimensiones y precinto de seguridad antes de transferir a transportista.
              </p>
            </div>
          </div>

          {readyForPackingOrders.length === 0 ? (
            <p className="text-center py-10 text-slate-400 text-xs">No hay órdenes en cola de empaque.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {readyForPackingOrders.map(fo => (
                <div key={fo.id} className="p-4 border border-indigo-200 dark:border-indigo-900 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                        Orden #{fo.orderId}
                      </span>
                      <div className="text-slate-500 font-mono text-[11px]">{fo.pickingCode} • {fo.storeName}</div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold text-[10px]">
                      Listo para Empaque
                    </span>
                  </div>

                  <div className="text-slate-600 dark:text-slate-300">
                    Cliente: <strong>{fo.customerName}</strong> ({fo.customerPhone})
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      Destino: {fo.deliveryAddress?.municipality}, {fo.deliveryAddress?.province}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActivePackingOrder(fo);
                      setPackBoxes(1);
                      setPackWeight(1.5);
                    }}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Box className="w-4 h-4" />
                    <span>Realizar Empaque</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: DESPACHOS & LOGÍSTICA */}
      {activeTab === 'dispatch' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Despachos & Envíos</h3>
              <p className="text-xs text-slate-500">
                Asignación de mensajería (Plazado Express, PedidosYa, Uber Direct, Transporte Propio) y confirmación de entregas.
              </p>
            </div>
          </div>

          {readyForDispatchOrders.length === 0 && inTransitOrders.length === 0 ? (
            <p className="text-center py-10 text-slate-400 text-xs">No hay pedidos en etapa de despacho.</p>
          ) : (
            <div className="space-y-3">
              {/* Ready for dispatch */}
              {readyForDispatchOrders.map(fo => (
                <div key={fo.id} className="p-4 border border-cyan-200 dark:border-cyan-900 rounded-xl flex items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 dark:text-white text-sm font-mono">Pedido #{fo.orderId}</strong>
                      <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 font-bold text-[10px]">Listo para Despacho</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 mt-1">
                      Destino: <strong>{fo.deliveryAddress?.street}</strong>, {fo.deliveryAddress?.municipality}, {fo.deliveryAddress?.province}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Empaque: {fo.packingDetails?.packageCount} bultos ({fo.packingDetails?.totalWeightKg} kg, {fo.packingDetails?.packageType})
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveDispatchOrder(fo);
                      setCarrierName('Plazado Express Courier');
                      setTrackingNumber(`TRK-${Date.now().toString().slice(-6)}`);
                    }}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Truck className="w-4 h-4" />
                    <span>Despachar a Courier</span>
                  </button>
                </div>
              ))}

              {/* In Transit */}
              {inTransitOrders.map(fo => (
                <div key={fo.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-slate-900 dark:text-white text-sm font-mono">Pedido #{fo.orderId}</strong>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">🚚 En Ruta</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 mt-1">
                      Courier: <strong>{fo.dispatchDetails?.carrier}</strong> • Guía: <strong>{fo.dispatchDetails?.trackingNumber}</strong>
                    </div>
                    <div className="text-slate-500 text-[11px]">
                      Destinatario: {fo.customerName} ({fo.customerPhone})
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const name = prompt('Nombre de la persona que recibe el paquete:', fo.customerName);
                      if (name) {
                        deliverFulfillmentOrder(fo.id, { receivedByName: name });
                      }
                    }}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirmar Entrega</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 8: DEVOLUCIONES */}
      {activeTab === 'returns' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Devoluciones de Mercancía</h3>
              <p className="text-xs text-slate-500">
                Inspección física en almacén. Si está conforme, se reingresa a Disponible; si está dañado, a Bloqueado.
              </p>
            </div>
          </div>

          {(fulfillmentReturns || []).length === 0 ? (
            <p className="text-center py-10 text-slate-400 text-xs">No hay devoluciones registradas.</p>
          ) : (
            <div className="space-y-3">
              {(fulfillmentReturns || []).map(ret => (
                <div key={ret.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-purple-600">{ret.id}</span> • Pedido #{ret.orderId}
                      <div className="text-slate-500">Tienda: {ret.storeName} • Cliente: {ret.customerName}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded font-bold bg-slate-100 text-slate-700">
                      {ret.status}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300">Motivo: {ret.reason}</p>

                  {ret.status === 'RECEIVED_AT_WAREHOUSE' && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => {
                          const notes = prompt('Notas de inspección técnica conforme:', 'Producto en estado original') || '';
                          classifyReturn(ret.id, { classification: 'RESTOCK', inspectorNotes: notes });
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold cursor-pointer"
                      >
                        Reingresar a Disponible (Buen Estado)
                      </button>

                      <button
                        onClick={() => {
                          const notes = prompt('Motivo del daño o deterioro:', 'Caja rota / sellos violados') || '';
                          classifyReturn(ret.id, { classification: 'DAMAGE', inspectorNotes: notes });
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold cursor-pointer"
                      >
                        Clasificar Dañado / Bloqueado
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 9: RETIROS */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Solicitudes de Retiro de Mercancía</h3>
              <p className="text-xs text-slate-500">
                Peticiones de comercios para retirar stock almacenado. Al completar la entrega física se descuentan las unidades.
              </p>
            </div>
          </div>

          {(fulfillmentWithdrawals || []).length === 0 ? (
            <p className="text-center py-10 text-slate-400 text-xs">No hay solicitudes de retiro.</p>
          ) : (
            <div className="space-y-3">
              {(fulfillmentWithdrawals || []).map(wd => (
                <div key={wd.id} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-600">{wd.id}</span>
                      <strong className="text-slate-900 dark:text-white">{wd.storeName}</strong>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">{wd.status}</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 mt-1">
                      Producto: <strong>{wd.productName}</strong> ({wd.quantity} uds.) • Motivo: {wd.reason}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {wd.status === 'REQUESTED' && (
                      <button
                        onClick={() => updateWithdrawalStatus(wd.id, 'APPROVED', 'Solicitud aprobada')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold cursor-pointer"
                      >
                        Aprobar
                      </button>
                    )}

                    {wd.status === 'APPROVED' && (
                      <button
                        onClick={() => updateWithdrawalStatus(wd.id, 'READY_FOR_PICKUP', 'Mercancía separada')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold cursor-pointer"
                      >
                        Marcar Listo para Entrega
                      </button>
                    )}

                    {wd.status === 'READY_FOR_PICKUP' && (
                      <button
                        onClick={() => updateWithdrawalStatus(wd.id, 'DELIVERED', 'Entregado a la tienda')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold cursor-pointer"
                      >
                        Confirmar Entrega Física (Deducir Stock)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 10: CONFIGURACIÓN */}
      {activeTab === 'config' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs max-w-2xl space-y-6 text-xs">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Políticas y Tarifas de Fulfillment</h3>
            <p className="text-xs text-slate-500">
              Ajuste el tiempo límite para confirmación comercial y las tarifas operativas del almacén.
            </p>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Tiempo Máximo para que la Tienda Confirme el Pedido (Minutos) *
              </label>
              <input
                type="number"
                min="10"
                max="1440"
                value={configTimeout}
                onChange={(e) => setConfigTimeout(Number(e.target.value))}
                required
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
              />
              <span className="text-[11px] text-slate-500">Ejemplo: 60 minutos (1 hora), 120 minutos (2 horas)</span>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Acción al Expirar el Tiempo Límite *
              </label>
              <select
                value={configTimeoutAction}
                onChange={(e) => setConfigTimeoutAction(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
              >
                <option value="AUTO_CANCEL_RELEASE">Cancelar pedido y liberar reserva preventiva automáticamente</option>
                <option value="AUTO_CONFIRM">Confirmar automáticamente y transferir al almacén</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Tarifa Almacenaje (RD$/m³/día)</label>
                <input
                  type="number"
                  value={configStorageFee}
                  onChange={(e) => setConfigStorageFee(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Tarifa Picking/Orden (RD$)</label>
                <input
                  type="number"
                  value={configHandlingFee}
                  onChange={(e) => setConfigHandlingFee(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Tarifa Empaque/Caja (RD$)</label>
                <input
                  type="number"
                  value={configPackagingFee}
                  onChange={(e) => setConfigPackagingFee(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={isSavingConfig}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSavingConfig ? 'Guardando...' : 'Guardar Políticas'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: CONTEO FÍSICO Y RECEPCIÓN FORMAL */}
      {receptionModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Conteo Físico e Inspección #{receptionModalRequest.id}
                </h3>
              </div>
              <button onClick={() => setReceptionModalRequest(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmPhysicalReception} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <div className="font-bold text-slate-900 dark:text-white text-sm">{receptionModalRequest.productName}</div>
                <div className="text-slate-500 font-mono">Tienda: {receptionModalRequest.storeName} • SKU: {receptionModalRequest.sku}</div>
                <div className="text-blue-600 font-bold">Declarado por Tienda: {receptionModalRequest.declaredQuantity} uds.</div>
              </div>

              {/* Physical Counts */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Recibido Físicamente *</label>
                  <input
                    type="number"
                    min="0"
                    value={receivedQty}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setReceivedQty(v);
                      setAcceptedQty(Math.max(0, v - damagedQty));
                    }}
                    required
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-rose-600">Dañado / Deteriorado *</label>
                  <input
                    type="number"
                    min="0"
                    value={damagedQty}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setDamagedQty(v);
                      setAcceptedQty(Math.max(0, receivedQty - v));
                    }}
                    required
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-rose-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-emerald-600">Aceptado Stock *</label>
                  <input
                    type="number"
                    min="0"
                    value={acceptedQty}
                    readOnly
                    className="w-full p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-lg font-black text-emerald-700 dark:text-emerald-300"
                  />
                </div>
              </div>

              {/* Shelf location assignment */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="font-bold text-slate-900 dark:text-white block">Asignar Ubicación Física en Almacén *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Zona (ej: Zona A)"
                    value={locZone}
                    onChange={(e) => setLocZone(e.target.value)}
                    required
                    className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                  />
                  <input
                    type="text"
                    placeholder="Pasillo (P-01)"
                    value={locAisle}
                    onChange={(e) => setLocAisle(e.target.value)}
                    required
                    className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                  />
                  <input
                    type="text"
                    placeholder="Estante (E-01)"
                    value={locShelf}
                    onChange={(e) => setLocShelf(e.target.value)}
                    required
                    className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                  />
                  <input
                    type="text"
                    placeholder="Nivel (N-01)"
                    value={locLevel}
                    onChange={(e) => setLocLevel(e.target.value)}
                    required
                    className="p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                  />
                </div>
              </div>

              {/* Photo evidence input */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Evidencia Fotográfica (URL de foto)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={photoInput}
                    onChange={(e) => setPhotoInput(e.target.value)}
                    className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (photoInput.trim()) {
                        setReceptionPhotos([...receptionPhotos, photoInput.trim()]);
                        setPhotoInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded font-bold cursor-pointer"
                  >
                    Agregar Foto
                  </button>
                </div>
                {receptionPhotos.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    {receptionPhotos.map((p, idx) => (
                      <img key={idx} src={p} alt="Evidencia" className="w-12 h-12 object-cover rounded border border-slate-200" />
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Notas de la Recepción</label>
                <textarea
                  rows={2}
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                  placeholder="Detalles de embalaje, sellos de seguridad intactos, etc."
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReceptionModalRequest(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isProcessingReception}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isProcessingReception ? 'Registrando...' : 'Confirmar Conteo y Acreditar Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AJUSTE DE INVENTARIO */}
      {adjustmentItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Ajuste Manual de Inventario (Plazado)
              </h3>
              <button onClick={() => setAdjustmentItem(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdjustment} className="space-y-3">
              <div>
                <strong>{adjustmentItem.productName}</strong>
                <div className="text-slate-500 font-mono text-[11px]">Tienda: {adjustmentItem.storeName} • SKU: {adjustmentItem.sku}</div>
                <div className="text-blue-600 font-bold mt-1">Disponible Actual: {adjustmentItem.available} uds.</div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Nueva Cantidad Disponible *</label>
                <input
                  type="number"
                  min="0"
                  value={adjustNewAvail}
                  onChange={(e) => setAdjustNewAvail(Number(e.target.value))}
                  required
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-base"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Motivo de Ajuste *</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                >
                  <option value="Conteo físico cíclico de auditoría">Conteo físico cíclico de auditoría</option>
                  <option value="Sobrante en descarga no registrado">Sobrante en descarga no registrado</option>
                  <option value="Faltante en anaquel detectado">Faltante en anaquel detectado</option>
                  <option value="Deterioro / Pérdida en almacén">Deterioro / Pérdida en almacén</option>
                  <option value="Corrección de SKU asignado">Corrección de SKU asignado</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Detalles adicionales</label>
                <textarea
                  rows={2}
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Observaciones de auditoría"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustmentItem(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isAdjusting ? 'Guardando...' : 'Aplicar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ESCANEO Y VALIDACIÓN DE PICKING */}
      {activePickingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Scan className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Validación de Picking ({activePickingOrder.pickingCode})
                </h3>
              </div>
              <button onClick={() => setActivePickingOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {pickingErrorAlert && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong>ERROR DE VALIDACIÓN: OPERACIÓN BLOQUEADA</strong>
                  <p className="mt-0.5 text-[11px] leading-relaxed">{pickingErrorAlert}</p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {activePickingOrder.items.map((it, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <strong className="text-slate-900 dark:text-white">{it.productName}</strong>
                    <span className="font-bold text-blue-600">{it.quantity} ud(s).</span>
                  </div>
                  <div className="font-mono text-slate-500">SKU Requerido: <strong>{it.sku}</strong></div>
                  <div className="text-emerald-600 font-mono text-[11px]">
                    Ubicación Asignada: {it.location?.barcode || `${it.location?.zone} - ${it.location?.aisle}`}
                  </div>

                  {!it.isPicked ? (
                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">
                          1. Escanear / Ingresar Ubicación:
                        </label>
                        <input
                          type="text"
                          value={scannedLocInput}
                          onChange={(e) => setScannedLocInput(e.target.value)}
                          placeholder="Escanee código de barra del anaquel"
                          className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300">
                          2. Escanear / Ingresar SKU de Producto:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={scannedSkuInput}
                            onChange={(e) => setScannedSkuInput(e.target.value)}
                            placeholder="Escanee código del producto"
                            className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded font-mono font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => handlePickItemScan(it.productId)}
                            disabled={isValidatingPick || !scannedSkuInput.trim()}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold cursor-pointer disabled:opacity-50"
                          >
                            {isValidatingPick ? 'Validando...' : 'Validar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 bg-emerald-100/70 text-emerald-900 font-bold rounded flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      <span>Ítem validado y pickeado conforme</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setActivePickingOrder(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PACKING */}
      {activePackingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Box className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Empaque de Orden #{activePackingOrder.orderId}
                </h3>
              </div>
              <button onClick={() => setActivePackingOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompletePacking} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Número de Paquetes *</label>
                  <input
                    type="number"
                    min="1"
                    value={packBoxes}
                    onChange={(e) => setPackBoxes(Number(e.target.value))}
                    required
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Peso Total (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={packWeight}
                    onChange={(e) => setPackWeight(Number(e.target.value))}
                    required
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Tipo de Empaque *</label>
                <select
                  value={packType}
                  onChange={(e) => setPackType(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg"
                >
                  <option value="Caja Plazado Mediana con Precinto">Caja Plazado Mediana con Precinto</option>
                  <option value="Caja Plazado Grande Reforzada">Caja Plazado Grande Reforzada</option>
                  <option value="Sobre Acolchado Burbuja de Seguridad">Sobre Acolchado Burbuja de Seguridad</option>
                  <option value="Bolsa de Seguridad Courier Plazado">Bolsa de Seguridad Courier Plazado</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Dimensiones (L x W x H cm)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" placeholder="Largo" value={packL} onChange={(e) => setPackL(Number(e.target.value))} className="p-2 border rounded" />
                  <input type="number" placeholder="Ancho" value={packW} onChange={(e) => setPackW(Number(e.target.value))} className="p-2 border rounded" />
                  <input type="number" placeholder="Alto" value={packH} onChange={(e) => setPackH(Number(e.target.value))} className="p-2 border rounded" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActivePackingOrder(null)}
                  className="px-4 py-2 border rounded font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPacking}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold shadow-xs disabled:opacity-50"
                >
                  {isSubmittingPacking ? 'Empacando...' : 'Completar Packing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DESPACHO */}
      {activeDispatchOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-cyan-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Despacho de Pedido #{activeDispatchOrder.orderId}
                </h3>
              </div>
              <button onClick={() => setActiveDispatchOrder(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDispatch} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Empresa de Transporte / Courier *</label>
                <select
                  value={carrierName}
                  onChange={(e) => setCarrierName(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                >
                  <option value="Plazado Express Courier">Plazado Express Courier (Interno)</option>
                  <option value="PedidosYa Envíos Direct">PedidosYa Envíos Direct</option>
                  <option value="Uber Direct Business">Uber Direct Business</option>
                  <option value="Transporte Propio Plazado Nave Herrera">Transporte Propio Plazado Nave Herrera</option>
                  <option value="Caribe Tour / Metro Pac Express">Caribe Tour / Metro Pac Express</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Número de Guía / Tracking *</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  required
                  placeholder="ej: PLZ-881290"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveDispatchOrder(null)}
                  className="px-4 py-2 border rounded font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isDispatching}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-bold shadow-xs disabled:opacity-50"
                >
                  {isDispatching ? 'Despachando...' : 'Confirmar Despacho a Ruta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: NOTIFICACIÓN OFICIAL DE REPOSICIÓN A TIENDA */}
      {replenishmentModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Notificar Reposición de Inventario
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Aviso preventivo oficial de existencias bajas a la tienda
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setReplenishmentModalData(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient Details */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Comercio:</span>
                <strong className="text-slate-900 dark:text-white text-sm">{replenishmentModalData.storeName}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Producto / SKU:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {replenishmentModalData.productName} ({replenishmentModalData.sku})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Almacén de Custodia:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{replenishmentModalData.warehouseName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-semibold">Stock Actual Disponible:</span>
                <span className="font-mono font-black text-rose-600">
                  {replenishmentModalData.available} uds. (Mínimo de alerta: {replenishmentModalData.minAlert})
                </span>
              </div>
            </div>

            {/* Editable Message Preview */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>Mensaje de Notificación Oficial:</span>
                <span className="text-[10px] text-slate-400 font-normal">Editable</span>
              </label>
              <textarea
                rows={5}
                value={replenishmentModalData.messageText}
                onChange={(e) => setReplenishmentModalData({ ...replenishmentModalData, messageText: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-medium"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReplenishmentModalData(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cerrar
              </button>

              <div className="flex items-center gap-2">
                {replenishmentModalData.storePhone && (
                  <a
                    href={`https://wa.me/${replenishmentModalData.storePhone.replace(/\D/g, '')}?text=${encodeURIComponent(replenishmentModalData.messageText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      showNotification(`Canal de WhatsApp abierto para notificar a ${replenishmentModalData.storeName}`, 'info');
                      setReplenishmentModalData(null);
                    }}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => {
                    showNotification(`Notificación oficial de reposición registrada y emitida exitosamente a ${replenishmentModalData.storeName}`, 'success');
                    setReplenishmentModalData(null);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Emitir Notificación</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
