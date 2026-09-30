import crypto from 'crypto';
import { 
  StorageRequest, 
  StorageRequestStatus,
  FulfillmentInventoryItem, 
  WarehouseLocation, 
  InventoryMovementLog, 
  InventoryMovementType, 
  FulfillmentOrder, 
  FulfillmentOrderItem, 
  FulfillmentOrderStatus, 
  FulfillmentIncidence, 
  FulfillmentReturn, 
  FulfillmentWithdrawal, 
  FulfillmentConfig,
  Order,
  UserRole
} from '../src/types';
import { db } from './database';

export const DEFAULT_FULFILLMENT_CONFIG: FulfillmentConfig = {
  orderConfirmationTimeoutMinutes: 60, // 60 minutos configurables
  timeoutAction: 'AUTO_CANCEL_RELEASE', // Al expirar, cancela pedido y libera reserva preventiva
  warehouses: [
    {
      id: 'wh-sdo-01',
      name: 'Centro Logístico Central Santo Domingo Oeste',
      code: 'WH-SDO-01',
      address: 'Av. Luperón esq. Autopista Duarte, Nave 4B, Zona Industrial Herrera',
      province: 'Santo Domingo',
      municipality: 'Santo Domingo Oeste',
      contactPhone: '809-449-3325',
      managerName: 'Ing. Carlos Mendoza (Operaciones Plazado)',
      zones: [
        'Zona A - Almacén General',
        'Zona B - Electrónica & Alto Valor',
        'Zona C - Moda & Calzado',
        'Zona D - Hogar & Frágil'
      ],
      isActive: true
    },
    {
      id: 'wh-sti-02',
      name: 'Centro Logístico Norte Santiago',
      code: 'WH-STI-02',
      address: 'Av. Circunvalación Norte, Parque Industrial Cibao, Módulo 12',
      province: 'Santiago',
      municipality: 'Santiago de los Caballeros',
      contactPhone: '809-580-1200',
      managerName: 'Lic. Ramón Batista',
      zones: [
        'Zona A - General Norte',
        'Zona B - Envíos Rápidos'
      ],
      isActive: true
    }
  ],
  storageFeePerM3PerDay: 15,
  handlingFeePerOrder: 75,
  packagingFee: 45,
  isFulfillmentEnabledGlobally: true
};

export class FulfillmentService {
  private getDbData() {
    return (db as any).memoryData;
  }

  private commit(auditAction?: string, recordId?: string, detail?: string) {
    if (auditAction && recordId) {
      db.addAuditLog(auditAction, recordId, undefined, detail);
    }
    (db as any).commit();
  }

  // --- QUERY FULFILLMENT DATA ---
  public getData(storeId?: string) {
    const data = this.getDbData();
    const storageRequests: StorageRequest[] = data.storageRequests || [];
    const fulfillmentInventory: FulfillmentInventoryItem[] = data.fulfillmentInventory || [];
    const inventoryMovements: InventoryMovementLog[] = data.inventoryMovements || [];
    const fulfillmentOrders: FulfillmentOrder[] = data.fulfillmentOrders || [];
    const fulfillmentIncidences: FulfillmentIncidence[] = data.fulfillmentIncidences || [];
    const fulfillmentReturns: FulfillmentReturn[] = data.fulfillmentReturns || [];
    const fulfillmentWithdrawals: FulfillmentWithdrawal[] = data.fulfillmentWithdrawals || [];
    const fulfillmentConfig: FulfillmentConfig = data.fulfillmentConfig || DEFAULT_FULFILLMENT_CONFIG;

    if (storeId) {
      // Store view: STRICT ISOLATION - Store only sees its own records
      return {
        storageRequests: storageRequests.filter(r => r.storeId === storeId),
        fulfillmentInventory: fulfillmentInventory.filter(i => i.storeId === storeId),
        inventoryMovements: inventoryMovements.filter(m => m.storeId === storeId),
        fulfillmentOrders: fulfillmentOrders.filter(o => o.storeId === storeId),
        fulfillmentIncidences: fulfillmentIncidences.filter(inc => inc.storeId === storeId),
        fulfillmentReturns: fulfillmentReturns.filter(ret => ret.storeId === storeId),
        fulfillmentWithdrawals: fulfillmentWithdrawals.filter(w => w.storeId === storeId),
        fulfillmentConfig
      };
    }

    // Super Admin / Warehouse staff view: sees everything with store separation intact
    return {
      storageRequests,
      fulfillmentInventory,
      inventoryMovements,
      fulfillmentOrders,
      fulfillmentIncidences,
      fulfillmentReturns,
      fulfillmentWithdrawals,
      fulfillmentConfig
    };
  }

  // --- STORAGE & BRANCH TRANSFERS (TRANSFERENCIAS DE SUCURSAL A FULFILLMENT #PF-XXXXX / #TRF-XXXXX) ---
  public createStorageRequest(payload: {
    storeId: string;
    storeName: string;
    productId: string;
    productName: string;
    productImage?: string;
    variantId?: string;
    variantName?: string;
    sku: string;
    declaredQuantity: number;
    packageCount: number;
    weightKg: number;
    dimensions: { length: number; width: number; height: number };
    declaredValue: number;
    warehouseId: string;
    estimatedDeliveryDate: string;
    notes?: string;
    originBranch?: string;
    originBranchAddress?: string;
    dispatchGuideNumber?: string;
    dispatchedByName?: string;
    driverOrCarrier?: string;
    vehiclePlate?: string;
    securitySealNumber?: string;
    transferType?: 'BRANCH_TO_FULFILLMENT' | 'SUPPLIER_TO_FULFILLMENT' | 'STANDARD_INBOUND';
  }, user?: any): StorageRequest {
    const data = this.getDbData();
    data.storageRequests = data.storageRequests || [];

    const config: FulfillmentConfig = data.fulfillmentConfig || DEFAULT_FULFILLMENT_CONFIG;
    const warehouse = config.warehouses.find(w => w.id === payload.warehouseId) || config.warehouses[0];

    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const isBranchTransfer = payload.transferType === 'BRANCH_TO_FULFILLMENT' || Boolean(payload.originBranch);
    const reqId = isBranchTransfer ? `TRF-${randomSuffix}` : `PF-${randomSuffix}`;
    const timestamp = new Date().toISOString();

    // Generate cryptographic-style tamper-proof verification hash for non-repudiation
    const rawHashString = `${reqId}:${payload.storeId}:${payload.sku}:${payload.declaredQuantity}:${payload.originBranch || 'SUCURSAL'}:${payload.dispatchGuideNumber || 'CON'}:${timestamp}`;
    const tamperProofHash = `SEAL-${Buffer.from(rawHashString).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 18).toUpperCase()}`;

    const originBranch = payload.originBranch || 'Sucursal Principal';
    const dispatchGuideNumber = payload.dispatchGuideNumber || `CON-${new Date().getFullYear()}-${randomSuffix.toString().slice(0, 4)}`;
    const securitySealNumber = payload.securitySealNumber || `SEAL-${Math.floor(10000 + Math.random() * 90000)}`;
    const dispatchedByName = payload.dispatchedByName || user?.name || payload.storeName;
    const driverOrCarrier = payload.driverOrCarrier || 'Transporte de Sucursal Propio';

    const newRequest: StorageRequest = {
      id: reqId,
      storeId: payload.storeId,
      storeName: payload.storeName,
      productId: payload.productId,
      productName: payload.productName,
      productImage: payload.productImage || '',
      variantId: payload.variantId,
      variantName: payload.variantName,
      sku: payload.sku,
      declaredQuantity: payload.declaredQuantity,
      packageCount: payload.packageCount || 1,
      weightKg: payload.weightKg || 0,
      dimensions: payload.dimensions || { length: 0, width: 0, height: 0 },
      declaredValue: payload.declaredValue || 0,
      warehouseId: warehouse.id,
      warehouseName: warehouse.name,
      estimatedDeliveryDate: payload.estimatedDeliveryDate,
      notes: payload.notes,
      originBranch,
      originBranchAddress: payload.originBranchAddress || '',
      dispatchGuideNumber,
      dispatchedByName,
      driverOrCarrier,
      vehiclePlate: payload.vehiclePlate || 'N/A',
      securitySealNumber,
      transferType: payload.transferType || 'BRANCH_TO_FULFILLMENT',
      isImmutable: true,
      tamperProofHash,
      authorizedBy: user?.name || payload.storeName,
      status: 'PENDING_APPROVAL',
      statusHistory: [
        {
          status: 'CREATED',
          timestamp,
          note: `Transferencia emitida desde ${originBranch} hacia ${warehouse.name}. Conduce de Despacho: ${dispatchGuideNumber}. Precinto: ${securitySealNumber}. Unidades declaradas: ${payload.declaredQuantity}. Registro inmutable bloqueado contra modificaciones no autorizadas. Hash: ${tamperProofHash}.`,
          updatedBy: user?.name || payload.storeName
        },
        {
          status: 'PENDING_APPROVAL',
          timestamp,
          note: 'En espera de inspección de precinto de seguridad y conteo físico por personal de Plazado Fulfillment.',
          updatedBy: 'Sistema Plazado (Auditoría)'
        }
      ],
      createdAt: timestamp,
      updatedAt: timestamp
    };

    data.storageRequests.unshift(newRequest);
    this.commit('STORAGE_REQUEST_CREATED', reqId, `Transferencia ${reqId} emitida desde ${originBranch} hacia ${warehouse.name} por ${payload.storeName}`);
    return newRequest;
  }

  public updateStorageRequestStatus(id: string, status: StorageRequestStatus, notes?: string, user?: any): StorageRequest {
    const data = this.getDbData();
    const req = (data.storageRequests || []).find((r: StorageRequest) => r.id === id);
    if (!req) throw new Error(`Transferencia o solicitud ${id} no encontrada.`);

    // Strict Authorization & Immutability Enforcement:
    // Unauthorized alterations of transfer logs are blocked
    const isSuperAdmin = user?.role === 'SUPER_ADMIN';
    if (!isSuperAdmin) {
      if (user && req.storeId !== user?.storeId && req.storeId !== user?.id) {
        throw new Error('Acceso no autorizado: No tiene autorización para alterar transferencias de otro comercio.');
      }
      if (req.status === 'STORED' || req.status === 'RECEIVED' || req.status === 'VALIDATING' || req.status === 'IN_TRANSIT') {
        throw new Error('Operación rechazada: La transferencia está en custodia o procesada. Los registros históricos y de conteo son inmutables para proteger la trazabilidad de la sucursal.');
      }
    }

    req.status = status;
    req.updatedAt = new Date().toISOString();
    req.statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      note: notes || `Estado de transferencia actualizado a ${status}`,
      updatedBy: user?.name || (isSuperAdmin ? 'Operaciones Plazado' : 'Encargado de Sucursal')
    });

    this.commit('STORAGE_REQUEST_STATUS_UPDATED', id, `Transferencia ${id} actualizada a ${status} por ${user?.name || 'Sistema'}`);
    return req;
  }

  // --- RECEPCIÓN FÍSICA Y CONTEO (CONTROL EXCLUSIVO PLAZADO) ---
  public processPhysicalReception(payload: {
    requestId: string;
    declaredQuantity: number;
    receivedQuantity: number;
    damagedQuantity: number;
    acceptedQuantity: number;
    location: WarehouseLocation;
    operatorNotes?: string;
    evidencePhotos?: string[];
  }, user?: any): { request: StorageRequest; inventoryItem: FulfillmentInventoryItem } {
    const data = this.getDbData();
    const req: StorageRequest | undefined = (data.storageRequests || []).find((r: StorageRequest) => r.id === payload.requestId);
    if (!req) throw new Error(`Solicitud ${payload.requestId} no encontrada.`);

    const difference = payload.receivedQuantity - payload.declaredQuantity;

    req.receptionDetails = {
      receivedQuantity: payload.receivedQuantity,
      damagedQuantity: payload.damagedQuantity,
      acceptedQuantity: payload.acceptedQuantity,
      differenceQuantity: difference,
      location: payload.location,
      operatorNotes: payload.operatorNotes,
      operatorId: user?.id,
      operatorName: user?.name || 'Operador de Almacén',
      evidencePhotos: payload.evidencePhotos || [],
      receivedAt: new Date().toISOString()
    };

    req.status = 'STORED';
    req.updatedAt = new Date().toISOString();
    req.statusHistory.push({
      status: 'STORED',
      timestamp: new Date().toISOString(),
      note: `Conteo físico completado: Declaradas ${payload.declaredQuantity}, Recibidas ${payload.receivedQuantity}, Dañadas ${payload.damagedQuantity}, Aceptadas ${payload.acceptedQuantity}. Ubicación: ${payload.location.zone} - Pasillo ${payload.location.aisle} - Estante ${payload.location.shelf}.`,
      updatedBy: user?.name || 'Operador de Almacén'
    });

    // Update or create FulfillmentInventoryItem for this store + product + SKU
    data.fulfillmentInventory = data.fulfillmentInventory || [];
    let inv: FulfillmentInventoryItem | undefined = data.fulfillmentInventory.find(
      (item: FulfillmentInventoryItem) => 
        item.storeId === req.storeId && 
        item.productId === req.productId && 
        item.sku.trim().toUpperCase() === req.sku.trim().toUpperCase() &&
        item.warehouseId === payload.location.warehouseId
    );

    const prevAvail = inv ? inv.available : 0;

    if (inv) {
      inv.totalPhysical += (payload.acceptedQuantity + payload.damagedQuantity);
      inv.available += payload.acceptedQuantity;
      inv.damaged += payload.damagedQuantity;
      inv.location = payload.location;
      inv.lastCountDate = new Date().toISOString();
      inv.updatedAt = new Date().toISOString();
    } else {
      inv = {
        id: `F-INV-${Math.floor(10000 + Math.random() * 90000)}`,
        storeId: req.storeId,
        storeName: req.storeName,
        productId: req.productId,
        productName: req.productName,
        productImage: req.productImage || '',
        variantId: req.variantId,
        variantName: req.variantName,
        sku: req.sku,
        warehouseId: payload.location.warehouseId,
        warehouseName: payload.location.warehouseName,
        location: payload.location,
        totalPhysical: payload.acceptedQuantity + payload.damagedQuantity,
        available: payload.acceptedQuantity,
        reserved: 0,
        inPicking: 0,
        inPacking: 0,
        prepared: 0,
        dispatched: 0,
        inTransit: 0,
        delivered: 0,
        blocked: 0,
        damaged: payload.damagedQuantity,
        returned: 0,
        pendingWithdrawal: 0,
        lastCountDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      data.fulfillmentInventory.unshift(inv);
    }

    // Mark the original Product with fulfillment badge and sync available stock
    const prod = (data.products || []).find((p: any) => p.id === req.productId);
    if (prod) {
      prod.isFulfillment = true;
      prod.fulfillmentWarehouseId = payload.location.warehouseId;
      prod.fulfillmentInventoryId = inv.id;
      // Fulfillment inventory availability feeds product stock directly
      prod.stock = inv.available;
    }

    // Record Inbound Movement Log for strict audit traceability
    data.inventoryMovements = data.inventoryMovements || [];
    const moveLog: InventoryMovementLog = {
      id: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      inventoryItemId: inv.id,
      storeId: req.storeId,
      storeName: req.storeName,
      productId: req.productId,
      productName: req.productName,
      sku: req.sku,
      type: 'BRANCH_TRANSFER_IN',
      quantityChanged: payload.acceptedQuantity,
      previousAvailable: prevAvail,
      newAvailable: inv.available,
      warehouseId: payload.location.warehouseId,
      warehouseName: payload.location.warehouseName,
      relatedStorageRequestId: req.id,
      originBranch: req.originBranch || 'Sucursal Principal',
      dispatchGuideNumber: req.dispatchGuideNumber,
      securitySealNumber: req.securitySealNumber,
      tamperProofHash: req.tamperProofHash,
      reason: `Transferencia completada desde ${req.originBranch || 'sucursal'} (Conduce: ${req.dispatchGuideNumber || req.id}). Precinto validado: ${req.securitySealNumber || 'N/A'}. Aceptadas: ${payload.acceptedQuantity} uds. Registro inmutable bloqueado contra alteraciones.`,
      evidencePhotos: payload.evidencePhotos || [],
      performedBy: user?.name || 'Operaciones Plazado',
      performedByRole: user?.role || 'SUPER_ADMIN',
      timestamp: new Date().toISOString()
    };
    data.inventoryMovements.unshift(moveLog);

    if (difference !== 0) {
      const discrepancyLog: InventoryMovementLog = {
        id: `MOV-DISC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        inventoryItemId: inv.id,
        storeId: req.storeId,
        storeName: req.storeName,
        productId: req.productId,
        productName: req.productName,
        sku: req.sku,
        type: 'BRANCH_TRANSFER_DISCREPANCY',
        quantityChanged: difference,
        previousAvailable: inv.available,
        newAvailable: inv.available,
        warehouseId: payload.location.warehouseId,
        warehouseName: payload.location.warehouseName,
        relatedStorageRequestId: req.id,
        originBranch: req.originBranch,
        dispatchGuideNumber: req.dispatchGuideNumber,
        securitySealNumber: req.securitySealNumber,
        tamperProofHash: req.tamperProofHash,
        reason: `Acta de discrepancia inmutable en transferencia #${req.id} desde ${req.originBranch || 'sucursal'}: Declaradas ${payload.declaredQuantity}, recibidas físicamente ${payload.receivedQuantity} (Diferencia: ${difference > 0 ? `+${difference}` : difference} uds).`,
        evidencePhotos: payload.evidencePhotos || [],
        performedBy: user?.name || 'Operaciones Plazado',
        performedByRole: user?.role || 'SUPER_ADMIN',
        timestamp: new Date().toISOString()
      };
      data.inventoryMovements.unshift(discrepancyLog);
    }

    if (payload.damagedQuantity > 0) {
      const damageLog: InventoryMovementLog = {
        id: `MOV-${Date.now()}-DMG`,
        inventoryItemId: inv.id,
        storeId: req.storeId,
        storeName: req.storeName,
        productId: req.productId,
        productName: req.productName,
        sku: req.sku,
        type: 'DAMAGE_REGISTERED',
        quantityChanged: payload.damagedQuantity,
        previousAvailable: inv.available,
        newAvailable: inv.available,
        warehouseId: payload.location.warehouseId,
        warehouseName: payload.location.warehouseName,
        relatedStorageRequestId: req.id,
        originBranch: req.originBranch,
        dispatchGuideNumber: req.dispatchGuideNumber,
        securitySealNumber: req.securitySealNumber,
        tamperProofHash: req.tamperProofHash,
        reason: `Recepción física #${req.id} desde ${req.originBranch || 'sucursal'}: ${payload.damagedQuantity} unidades registradas como dañadas/rotas en descarga.`,
        evidencePhotos: payload.evidencePhotos || [],
        performedBy: user?.name || 'Operaciones Plazado',
        performedByRole: user?.role || 'SUPER_ADMIN',
        timestamp: new Date().toISOString()
      };
      data.inventoryMovements.unshift(damageLog);
    }

    this.commit('FULFILLMENT_RECEPTION_COMPLETED', req.id, `Recepción y conteo físico de ${req.id} completados. Aceptadas: ${payload.acceptedQuantity}, Dañadas: ${payload.damagedQuantity}`);
    return { request: req, inventoryItem: inv };
  }

  // --- INVENTORY ADJUSTMENTS (ONLY PLAZADO AUTHORIZED USERS) ---
  public adjustInventory(payload: {
    inventoryItemId: string;
    newAvailable: number;
    reason: string;
    notes?: string;
  }, user?: any): FulfillmentInventoryItem {
    const data = this.getDbData();
    const inv: FulfillmentInventoryItem | undefined = (data.fulfillmentInventory || []).find((i: FulfillmentInventoryItem) => i.id === payload.inventoryItemId);
    if (!inv) throw new Error('Ítem de inventario no encontrado.');

    const prevAvail = inv.available;
    const diff = payload.newAvailable - prevAvail;
    inv.available = Math.max(0, payload.newAvailable);
    inv.totalPhysical = Math.max(0, inv.totalPhysical + diff);
    inv.lastCountDate = new Date().toISOString();
    inv.updatedAt = new Date().toISOString();

    // Sync product stock
    const prod = (data.products || []).find((p: any) => p.id === inv.productId);
    if (prod) {
      prod.stock = inv.available;
    }

    data.inventoryMovements = data.inventoryMovements || [];
    data.inventoryMovements.unshift({
      id: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      inventoryItemId: inv.id,
      storeId: inv.storeId,
      storeName: inv.storeName,
      productId: inv.productId,
      productName: inv.productName,
      sku: inv.sku,
      type: 'COUNT_CORRECTION',
      quantityChanged: diff,
      previousAvailable: prevAvail,
      newAvailable: inv.available,
      warehouseId: inv.warehouseId,
      warehouseName: inv.warehouseName,
      reason: `Ajuste manual de inventario: ${payload.reason}. Notas: ${payload.notes || 'N/A'}`,
      performedBy: user?.name || 'Operador de Inventario',
      performedByRole: user?.role || 'SUPER_ADMIN',
      timestamp: new Date().toISOString()
    });

    this.commit('INVENTORY_ADJUSTED', inv.id, `Ajuste de inventario en SKU ${inv.sku}: de ${prevAvail} a ${inv.available} (${payload.reason})`);
    return inv;
  }

  public relocateInventory(payload: {
    inventoryItemId: string;
    newLocation: WarehouseLocation;
  }, user?: any): FulfillmentInventoryItem {
    const data = this.getDbData();
    const inv: FulfillmentInventoryItem | undefined = (data.fulfillmentInventory || []).find((i: FulfillmentInventoryItem) => i.id === payload.inventoryItemId);
    if (!inv) throw new Error('Ítem de inventario no encontrado.');

    const prevLoc = `${inv.location.zone} - ${inv.location.aisle}-${inv.location.shelf}-${inv.location.level}-${inv.location.position}`;
    inv.location = payload.newLocation;
    inv.warehouseId = payload.newLocation.warehouseId;
    inv.warehouseName = payload.newLocation.warehouseName;
    inv.updatedAt = new Date().toISOString();

    const newLoc = `${inv.location.zone} - ${inv.location.aisle}-${inv.location.shelf}-${inv.location.level}-${inv.location.position}`;

    data.inventoryMovements = data.inventoryMovements || [];
    data.inventoryMovements.unshift({
      id: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      inventoryItemId: inv.id,
      storeId: inv.storeId,
      storeName: inv.storeName,
      productId: inv.productId,
      productName: inv.productName,
      sku: inv.sku,
      type: 'LOCATION_CHANGE',
      quantityChanged: 0,
      previousAvailable: inv.available,
      newAvailable: inv.available,
      warehouseId: inv.warehouseId,
      warehouseName: inv.warehouseName,
      reason: `Reubicación física: de [${prevLoc}] a [${newLoc}]`,
      performedBy: user?.name || 'Operador de Almacén',
      performedByRole: user?.role || 'SUPER_ADMIN',
      timestamp: new Date().toISOString()
    });

    this.commit('INVENTORY_RELOCATED', inv.id, `Reubicación de SKU ${inv.sku} a ${newLoc}`);
    return inv;
  }

  public blockUnblockInventory(payload: {
    inventoryItemId: string;
    quantity: number;
    action: 'BLOCK' | 'UNBLOCK';
    reason: string;
  }, user?: any): FulfillmentInventoryItem {
    const data = this.getDbData();
    const inv: FulfillmentInventoryItem | undefined = (data.fulfillmentInventory || []).find((i: FulfillmentInventoryItem) => i.id === payload.inventoryItemId);
    if (!inv) throw new Error('Ítem de inventario no encontrado.');

    const prevAvail = inv.available;
    const qty = Math.max(1, payload.quantity);

    if (payload.action === 'BLOCK') {
      const actualBlock = Math.min(inv.available, qty);
      inv.available -= actualBlock;
      inv.blocked += actualBlock;
    } else {
      const actualUnblock = Math.min(inv.blocked, qty);
      inv.blocked -= actualUnblock;
      inv.available += actualUnblock;
    }

    inv.updatedAt = new Date().toISOString();

    // Sync product stock
    const prod = (data.products || []).find((p: any) => p.id === inv.productId);
    if (prod) {
      prod.stock = inv.available;
    }

    data.inventoryMovements = data.inventoryMovements || [];
    data.inventoryMovements.unshift({
      id: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      inventoryItemId: inv.id,
      storeId: inv.storeId,
      storeName: inv.storeName,
      productId: inv.productId,
      productName: inv.productName,
      sku: inv.sku,
      type: payload.action === 'BLOCK' ? 'BLOCK' : 'UNBLOCK',
      quantityChanged: payload.action === 'BLOCK' ? -qty : qty,
      previousAvailable: prevAvail,
      newAvailable: inv.available,
      warehouseId: inv.warehouseId,
      warehouseName: inv.warehouseName,
      reason: `${payload.action === 'BLOCK' ? 'Bloqueo/Cuarentena' : 'Desbloqueo'}: ${payload.reason}`,
      performedBy: user?.name || 'Control de Calidad',
      performedByRole: user?.role || 'SUPER_ADMIN',
      timestamp: new Date().toISOString()
    });

    this.commit('INVENTORY_BLOCK_TOGGLED', inv.id, `${payload.action === 'BLOCK' ? 'Bloqueadas' : 'Desbloqueadas'} ${qty} unidades de SKU ${inv.sku}`);
    return inv;
  }

  public recordDamage(payload: {
    inventoryItemId: string;
    quantity: number;
    reason: string;
    evidencePhotos?: string[];
  }, user?: any): FulfillmentInventoryItem {
    const data = this.getDbData();
    const inv: FulfillmentInventoryItem | undefined = (data.fulfillmentInventory || []).find((i: FulfillmentInventoryItem) => i.id === payload.inventoryItemId);
    if (!inv) throw new Error('Ítem de inventario no encontrado.');

    const prevAvail = inv.available;
    const qty = Math.min(inv.available, Math.max(1, payload.quantity));
    inv.available -= qty;
    inv.damaged += qty;
    inv.updatedAt = new Date().toISOString();

    const prod = (data.products || []).find((p: any) => p.id === inv.productId);
    if (prod) {
      prod.stock = inv.available;
    }

    data.inventoryMovements = data.inventoryMovements || [];
    data.inventoryMovements.unshift({
      id: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      inventoryItemId: inv.id,
      storeId: inv.storeId,
      storeName: inv.storeName,
      productId: inv.productId,
      productName: inv.productName,
      sku: inv.sku,
      type: 'DAMAGE_REGISTERED',
      quantityChanged: -qty,
      previousAvailable: prevAvail,
      newAvailable: inv.available,
      warehouseId: inv.warehouseId,
      warehouseName: inv.warehouseName,
      reason: `Daño registrado: ${payload.reason}`,
      evidencePhotos: payload.evidencePhotos || [],
      performedBy: user?.name || 'Operaciones Almacén',
      performedByRole: user?.role || 'SUPER_ADMIN',
      timestamp: new Date().toISOString()
    });

    this.commit('INVENTORY_DAMAGE_RECORDED', inv.id, `Registradas ${qty} unidades dañadas en SKU ${inv.sku}`);
    return inv;
  }

  // --- STORE ACTIONS: CONFIRM OR REJECT ORDERS ---
  public confirmOrderByStore(fulfillmentOrderId: string, storeId: string, user?: any): FulfillmentOrder {
    const data = this.getDbData();
    const fo: FulfillmentOrder | undefined = (data.fulfillmentOrders || []).find(
      (f: FulfillmentOrder) => f.id === fulfillmentOrderId && f.storeId === storeId
    );
    if (!fo) throw new Error('Orden de Fulfillment no encontrada o no pertenece a tu tienda.');

    if (fo.status !== 'PENDING_STORE_CONFIRMATION') {
      throw new Error(`Esta orden ya fue procesada (estado actual: ${fo.status}).`);
    }

    fo.status = 'CONFIRMED_BY_STORE';
    fo.storeConfirmedAt = new Date().toISOString();
    fo.updatedAt = new Date().toISOString();

    // Move inventory from 'reserved' to 'inPicking'
    fo.items.forEach(it => {
      const inv: FulfillmentInventoryItem | undefined = (data.fulfillmentInventory || []).find(
        (i: FulfillmentInventoryItem) => i.storeId === fo.storeId && (i.productId === it.productId || i.sku === it.sku)
      );
      if (inv) {
        inv.reserved = Math.max(0, inv.reserved - it.quantity);
        inv.inPicking += it.quantity;
        inv.updatedAt = new Date().toISOString();
      }
    });

    // Update shared timeline
    const waitEvent = fo.timeline.find(e => e.status === 'WAITING_STORE_CONFIRMATION');
    if (waitEvent) waitEvent.completed = true;

    fo.timeline.push({
      status: 'CONFIRMED_BY_STORE',
      label: 'Confirmado por tienda',
      timestamp: new Date().toISOString(),
      actor: user?.name || fo.storeName,
      notes: 'La tienda autorizó la venta. Orden de Fulfillment transferida inmediatamente al almacén central.',
      completed: true
    });

    fo.timeline.push({
      status: 'ORDER_SENT_TO_WAREHOUSE',
      label: 'Orden enviada al almacén',
      timestamp: new Date().toISOString(),
      actor: 'Sistema Plazado',
      notes: `Asignado código de preparación: ${fo.pickingCode}`,
      completed: true
    });

    fo.timeline.push({
      status: 'PICKING_PENDING',
      label: 'Preparando pedido (Picking)',
      timestamp: new Date().toISOString(),
      actor: 'Operador de Almacén',
      notes: 'Esperando escaneo de ubicación y producto.',
      completed: false
    });

    // Update parent Order in memoryData.orders
    const parentOrder = (data.orders || []).find((o: Order) => o.id === fo.orderId);
    if (parentOrder) {
      parentOrder.status = 'CONFIRMED';
      parentOrder.fulfillmentStatus = 'CONFIRMED_BY_STORE';
      parentOrder.storeConfirmedAt = fo.storeConfirmedAt;
      parentOrder.statusHistory.push({
        status: 'CONFIRMED',
        timestamp: new Date().toISOString(),
        updatedBy: user?.name || fo.storeName,
        note: `Pedido confirmado por la tienda propietaria. Orden de Fulfillment ${fo.id} enviada al almacén.`
      });
    }

    this.commit('FULFILLMENT_ORDER_CONFIRMED', fo.id, `Pedido ${fo.orderId} confirmado por tienda ${fo.storeName}`);
    return fo;
  }

  public rejectOrderByStore(fulfillmentOrderId: string, storeId: string, reason: string, user?: any): FulfillmentOrder {
    const data = this.getDbData();
    const fo: FulfillmentOrder | undefined = (data.fulfillmentOrders || []).find(
      (f: FulfillmentOrder) => f.id === fulfillmentOrderId && f.storeId === storeId
    );
    if (!fo) throw new Error('Orden de Fulfillment no encontrada o no pertenece a tu tienda.');

    if (fo.status !== 'PENDING_STORE_CONFIRMATION') {
      throw new Error(`Esta orden ya fue procesada (estado actual: ${fo.status}).`);
    }

    if (!reason || !reason.trim()) {
      throw new Error('Debe proporcionar un motivo para el rechazo del pedido.');
    }

    fo.status = 'REJECTED_BY_STORE';
    fo.storeRejectionReason = reason;
    fo.rejectionUserDetails = {
      userId: user?.id || 'unknown',
      userName: user?.name || fo.storeName,
      timestamp: new Date().toISOString()
    };
    fo.updatedAt = new Date().toISOString();

    // AUTOMATIC PREVENTIVE RESERVATION RELEASE
    // Release reserved quantity back to available for each item!
    fo.items.forEach(it => {
      const inv: FulfillmentInventoryItem | undefined = (data.fulfillmentInventory || []).find(
        (i: FulfillmentInventoryItem) => i.storeId === fo.storeId && (i.productId === it.productId || i.sku === it.sku)
      );
      if (inv) {
        inv.reserved = Math.max(0, inv.reserved - it.quantity);
        inv.available += it.quantity;
        inv.updatedAt = new Date().toISOString();

        // Sync product stock
        const prod = (data.products || []).find((p: any) => p.id === it.productId);
        if (prod) prod.stock = inv.available;

        // Log movement
        data.inventoryMovements = data.inventoryMovements || [];
        data.inventoryMovements.unshift({
          id: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          inventoryItemId: inv.id,
          storeId: inv.storeId,
          storeName: inv.storeName,
          productId: inv.productId,
          productName: inv.productName,
          sku: inv.sku,
          type: 'RESERVATION_RELEASE',
          quantityChanged: it.quantity,
          previousAvailable: inv.available - it.quantity,
          newAvailable: inv.available,
          warehouseId: inv.warehouseId,
          warehouseName: inv.warehouseName,
          relatedOrderId: fo.orderId,
          reason: `Liberación preventiva por rechazo comercial de la tienda: ${reason}`,
          performedBy: user?.name || fo.storeName,
          performedByRole: user?.role || 'STORE_OWNER',
          timestamp: new Date().toISOString()
        });
      }
    });

    fo.timeline.push({
      status: 'REJECTED_BY_STORE',
      label: 'Rechazado por tienda',
      timestamp: new Date().toISOString(),
      actor: user?.name || fo.storeName,
      notes: `Motivo del rechazo: ${reason}. Unidades liberadas automáticamente a inventario disponible.`,
      completed: true
    });

    // Update parent order
    const parentOrder = (data.orders || []).find((o: Order) => o.id === fo.orderId);
    if (parentOrder) {
      parentOrder.status = 'CANCELLED';
      parentOrder.fulfillmentStatus = 'REJECTED_BY_STORE';
      parentOrder.cancelReason = reason;
      parentOrder.cancelledBy = user?.name || fo.storeName;
      parentOrder.cancelledAt = new Date().toISOString();
      parentOrder.statusHistory.push({
        status: 'CANCELLED',
        timestamp: new Date().toISOString(),
        updatedBy: user?.name || fo.storeName,
        note: `Pedido rechazado comercialmente por la tienda. Motivo: ${reason}. Reserva de stock liberada.`
      });
    }

    this.commit('FULFILLMENT_ORDER_REJECTED', fo.id, `Pedido ${fo.orderId} rechazado por tienda ${fo.storeName}. Motivo: ${reason}`);
    return fo;
  }

  // --- PICKING OPERATIONS (VALIDATION & STRICT SCANNING) ---
  public validateAndPickItem(payload: {
    fulfillmentOrderId: string;
    productId: string;
    scannedSku: string;
    scannedLocation: string;
  }, user?: any): { success: boolean; error?: string; order?: FulfillmentOrder } {
    const data = this.getDbData();
    const fo: FulfillmentOrder | undefined = (data.fulfillmentOrders || []).find((f: FulfillmentOrder) => f.id === payload.fulfillmentOrderId);
    if (!fo) return { success: false, error: 'Orden de Fulfillment no encontrada.' };

    const item = fo.items.find(i => i.productId === payload.productId);
    if (!item) return { success: false, error: 'Producto no encontrado en esta orden.' };

    // STRICT VALIDATION
    const expectedSku = item.sku.trim().toUpperCase();
    const providedSku = payload.scannedSku.trim().toUpperCase();

    if (providedSku !== expectedSku) {
      return {
        success: false,
        error: `ALERTA DE SEGURIDAD OPERATIVA: El código/SKU escaneado [${payload.scannedSku}] no coincide con el SKU esperado [${item.sku}] de la tienda [${fo.storeName}]. Operación bloqueada para prevenir despachos erróneos.`
      };
    }

    // Verify location if provided
    if (payload.scannedLocation && item.location?.barcode) {
      const expLoc = item.location.barcode.trim().toUpperCase();
      const provLoc = payload.scannedLocation.trim().toUpperCase();
      if (expLoc !== provLoc) {
        return {
          success: false,
          error: `ALERTA DE UBICACIÓN: La ubicación escaneada [${payload.scannedLocation}] no corresponde al anaquel asignado [${item.location.barcode}]. Verifique la posición física.`
        };
      }
    }

    item.isPicked = true;
    item.pickedQuantity = item.quantity;
    item.scannedSku = payload.scannedSku;
    item.scannedLocation = payload.scannedLocation;
    item.verifiedAt = new Date().toISOString();

    fo.assignedPickerName = user?.name || 'Operador de Almacén';
    fo.pickingStartedAt = fo.pickingStartedAt || new Date().toISOString();

    // Check if all items in order are picked
    const allPicked = fo.items.every(i => i.isPicked);
    if (allPicked) {
      fo.status = 'PICKING_COMPLETED';
      fo.pickingCompletedAt = new Date().toISOString();

      // Shift inventory from inPicking to inPacking
      fo.items.forEach(it => {
        const inv: FulfillmentInventoryItem | undefined = (data.fulfillmentInventory || []).find(
          (i: FulfillmentInventoryItem) => i.storeId === fo.storeId && (i.productId === it.productId || i.sku === it.sku)
        );
        if (inv) {
          inv.inPicking = Math.max(0, inv.inPicking - it.quantity);
          inv.inPacking += it.quantity;
          inv.updatedAt = new Date().toISOString();
        }
      });

      fo.timeline.push({
        status: 'PICKING_COMPLETED',
        label: 'Picking completado',
        timestamp: new Date().toISOString(),
        actor: user?.name || 'Operador de Almacén',
        notes: `Todos los ítems verificados y recolectados correctamente (Orden ${fo.pickingCode}). Pasa a estación de Packing.`,
        completed: true
      });
    }

    this.commit('ITEM_PICKED_VALIDATED', fo.id, `Ítem SKU ${item.sku} validado y pickeado exitosamente para orden ${fo.id}`);
    return { success: true, order: fo };
  }

  // --- PACKING OPERATIONS ---
  public completePacking(payload: {
    fulfillmentOrderId: string;
    packageCount: number;
    totalWeightKg: number;
    dimensions: { length: number; width: number; height: number };
    packageType: string;
    packageNotes?: string;
    evidencePhotos?: string[];
  }, user?: any): FulfillmentOrder {
    const data = this.getDbData();
    const fo: FulfillmentOrder | undefined = (data.fulfillmentOrders || []).find((f: FulfillmentOrder) => f.id === payload.fulfillmentOrderId);
    if (!fo) throw new Error('Orden de Fulfillment no encontrada.');

    fo.packingDetails = {
      packageCount: payload.packageCount || 1,
      totalWeightKg: payload.totalWeightKg || 1,
      dimensions: payload.dimensions || { length: 20, width: 20, height: 10 },
      packageType: payload.packageType || 'Caja Plazado Estándar',
      packagerName: user?.name || 'Operador de Empaque',
      evidencePhotos: payload.evidencePhotos || [],
      packedAt: new Date().toISOString(),
      packageNotes: payload.packageNotes
    };

    fo.status = 'READY_FOR_DISPATCH';
    fo.updatedAt = new Date().toISOString();

    // Shift inventory from inPacking to prepared
    fo.items.forEach(it => {
      const inv: FulfillmentInventoryItem | undefined = (data.fulfillmentInventory || []).find(
        (i: FulfillmentInventoryItem) => i.storeId === fo.storeId && (i.productId === it.productId || i.sku === it.sku)
      );
      if (inv) {
        inv.inPacking = Math.max(0, inv.inPacking - it.quantity);
        inv.prepared += it.quantity;
        inv.updatedAt = new Date().toISOString();
      }
    });

    fo.timeline.push({
      status: 'PACKED',
      label: 'Empacado',
      timestamp: new Date().toISOString(),
      actor: user?.name || 'Operador de Empaque',
      notes: `Empaque completado: ${payload.packageCount} bulto(s), peso ${payload.totalWeightKg} kg, ${payload.packageType}.`,
      completed: true
    });

    fo.timeline.push({
      status: 'READY_FOR_DISPATCH',
      label: 'Listo para despacho',
      timestamp: new Date().toISOString(),
      actor: 'Almacén Central Plazado',
      notes: 'Paquete precintado con etiqueta y guía de seguridad. Esperando asignación de transportista.',
      completed: true
    });

    // Update parent order
    const parentOrder = (data.orders || []).find((o: Order) => o.id === fo.orderId);
    if (parentOrder) {
      parentOrder.status = 'READY_FOR_PICKUP';
      parentOrder.fulfillmentStatus = 'READY_FOR_DISPATCH';
      parentOrder.statusHistory.push({
        status: 'READY_FOR_PICKUP',
        timestamp: new Date().toISOString(),
        updatedBy: user?.name || 'Operador de Empaque',
        note: `Pedido empacado en almacén (${payload.packageCount} bultos, ${payload.totalWeightKg} kg). Listo para despacho.`
      });
    }

    this.commit('PACKING_COMPLETED', fo.id, `Packing completado para orden ${fo.id}`);
    return fo;
  }

  // --- DISPATCH OPERATIONS ---
  public dispatchOrder(payload: {
    fulfillmentOrderId: string;
    carrier: string;
    trackingNumber: string;
    dispatchNotes?: string;
  }, user?: any): FulfillmentOrder {
    const data = this.getDbData();
    const fo: FulfillmentOrder | undefined = (data.fulfillmentOrders || []).find((f: FulfillmentOrder) => f.id === payload.fulfillmentOrderId);
    if (!fo) throw new Error('Orden de Fulfillment no encontrada.');

    fo.dispatchDetails = {
      carrier: payload.carrier || 'Plazado Express Courier',
      trackingNumber: payload.trackingNumber || `TRK-${Date.now().toString().slice(-6)}`,
      dispatchNotes: payload.dispatchNotes,
      dispatchedAt: new Date().toISOString(),
      dispatchedBy: user?.name || 'Operador Logístico'
    };

    fo.status = 'IN_TRANSIT';
    fo.updatedAt = new Date().toISOString();

    // Shift inventory from prepared to inTransit
    fo.items.forEach(it => {
      const inv: FulfillmentInventoryItem | undefined = (data.fulfillmentInventory || []).find(
        (i: FulfillmentInventoryItem) => i.storeId === fo.storeId && (i.productId === it.productId || i.sku === it.sku)
      );
      if (inv) {
        inv.prepared = Math.max(0, inv.prepared - it.quantity);
        inv.inTransit += it.quantity;
        inv.updatedAt = new Date().toISOString();
      }
    });

    fo.timeline.push({
      status: 'DISPATCHED',
      label: 'Despachado',
      timestamp: new Date().toISOString(),
      actor: user?.name || 'Operador Logístico',
      notes: `Entregado al transportista: ${payload.carrier}. Guía: ${payload.trackingNumber}`,
      completed: true
    });

    fo.timeline.push({
      status: 'IN_TRANSIT',
      label: 'En ruta',
      timestamp: new Date().toISOString(),
      actor: payload.carrier,
      notes: 'En camino hacia la dirección del cliente final.',
      completed: false
    });

    const parentOrder = (data.orders || []).find((o: Order) => o.id === fo.orderId);
    if (parentOrder) {
      parentOrder.status = 'SHIPPED';
      parentOrder.fulfillmentStatus = 'IN_TRANSIT';
      parentOrder.statusHistory.push({
        status: 'SHIPPED',
        timestamp: new Date().toISOString(),
        updatedBy: user?.name || 'Operaciones Plazado',
        note: `Despachado desde almacén central con ${payload.carrier}. Guía de seguimiento: ${payload.trackingNumber}`
      });
    }

    this.commit('ORDER_DISPATCHED', fo.id, `Orden ${fo.id} despachada con ${payload.carrier} (Guía: ${payload.trackingNumber})`);
    return fo;
  }

  // --- DELIVERY OPERATIONS ---
  public deliverOrder(payload: {
    fulfillmentOrderId: string;
    deliveryEvidencePhoto?: string;
    receivedByName?: string;
  }, user?: any): FulfillmentOrder {
    const data = this.getDbData();
    const fo: FulfillmentOrder | undefined = (data.fulfillmentOrders || []).find((f: FulfillmentOrder) => f.id === payload.fulfillmentOrderId);
    if (!fo) throw new Error('Orden de Fulfillment no encontrada.');

    fo.status = 'DELIVERED';
    fo.updatedAt = new Date().toISOString();

    if (fo.dispatchDetails) {
      fo.dispatchDetails.deliveredAt = new Date().toISOString();
      fo.dispatchDetails.deliveryEvidencePhoto = payload.deliveryEvidencePhoto;
      fo.dispatchDetails.receivedByName = payload.receivedByName || fo.customerName;
    }

    // Shift inventory from inTransit to delivered
    fo.items.forEach(it => {
      const inv: FulfillmentInventoryItem | undefined = (data.fulfillmentInventory || []).find(
        (i: FulfillmentInventoryItem) => i.storeId === fo.storeId && (i.productId === it.productId || i.sku === it.sku)
      );
      if (inv) {
        inv.inTransit = Math.max(0, inv.inTransit - it.quantity);
        inv.delivered += it.quantity;
        inv.totalPhysical = Math.max(0, inv.totalPhysical - it.quantity);
        inv.updatedAt = new Date().toISOString();
      }
    });

    const inTransitEv = fo.timeline.find(e => e.status === 'IN_TRANSIT');
    if (inTransitEv) inTransitEv.completed = true;

    fo.timeline.push({
      status: 'DELIVERED',
      label: 'Entregado',
      timestamp: new Date().toISOString(),
      actor: fo.dispatchDetails?.carrier || 'Repartidor',
      notes: `Entrega completada exitosamente a ${payload.receivedByName || fo.customerName}. Validación conforme.`,
      completed: true
    });

    const parentOrder = (data.orders || []).find((o: Order) => o.id === fo.orderId);
    if (parentOrder) {
      parentOrder.status = 'DELIVERED';
      parentOrder.fulfillmentStatus = 'DELIVERED';
      parentOrder.statusHistory.push({
        status: 'DELIVERED',
        timestamp: new Date().toISOString(),
        updatedBy: user?.name || 'Transportista',
        note: `Pedido entregado al cliente (${payload.receivedByName || fo.customerName}). Proceso de Plazado Fulfillment finalizado con éxito.`
      });
    }

    this.commit('ORDER_DELIVERED', fo.id, `Orden ${fo.id} entregada al cliente final`);
    return fo;
  }

  // --- INCIDENCES MANAGEMENT (GESTIÓN DE INCIDENCIAS) ---
  public createIncidence(payload: {
    type: any;
    orderId?: string;
    pickingCode?: string;
    storageRequestId?: string;
    storeId: string;
    storeName: string;
    productId?: string;
    productName?: string;
    sku?: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    evidencePhotos?: string[];
  }, user?: any): FulfillmentIncidence {
    const data = this.getDbData();
    data.fulfillmentIncidences = data.fulfillmentIncidences || [];

    const newInc: FulfillmentIncidence = {
      id: `INC-${Math.floor(10000 + Math.random() * 90000)}`,
      type: payload.type,
      orderId: payload.orderId,
      pickingCode: payload.pickingCode,
      storageRequestId: payload.storageRequestId,
      storeId: payload.storeId,
      storeName: payload.storeName,
      productId: payload.productId,
      productName: payload.productName,
      sku: payload.sku,
      severity: payload.severity || 'MEDIUM',
      status: 'OPEN',
      description: payload.description,
      evidencePhotos: payload.evidencePhotos || [],
      reportedBy: user?.name || 'Operador de Almacén',
      comments: [
        {
          author: user?.name || 'Operaciones Plazado',
          role: user?.role || 'SUPER_ADMIN',
          message: payload.description,
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.fulfillmentIncidences.unshift(newInc);
    this.commit('FULFILLMENT_INCIDENCE_CREATED', newInc.id, `Incidencia ${newInc.id} (${newInc.type}) reportada en tienda ${newInc.storeName}`);
    return newInc;
  }

  public updateIncidence(id: string, updates: {
    status?: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
    comment?: string;
    resolutionNotes?: string;
    assignedTo?: string;
  }, user?: any): FulfillmentIncidence {
    const data = this.getDbData();
    const inc: FulfillmentIncidence | undefined = (data.fulfillmentIncidences || []).find((i: FulfillmentIncidence) => i.id === id);
    if (!inc) throw new Error('Incidencia no encontrada.');

    if (updates.status) inc.status = updates.status;
    if (updates.resolutionNotes) {
      inc.resolutionNotes = updates.resolutionNotes;
      inc.resolvedAt = new Date().toISOString();
    }
    if (updates.assignedTo) inc.assignedTo = updates.assignedTo;

    if (updates.comment && updates.comment.trim()) {
      inc.comments.push({
        author: user?.name || 'Personal Plazado',
        role: user?.role || 'SUPER_ADMIN',
        message: updates.comment.trim(),
        timestamp: new Date().toISOString()
      });
    }

    inc.updatedAt = new Date().toISOString();
    this.commit('FULFILLMENT_INCIDENCE_UPDATED', inc.id, `Incidencia ${inc.id} actualizada (Estado: ${inc.status})`);
    return inc;
  }

  // --- RETURNS MANAGEMENT (ADMINISTRADAS EXCLUSIVAMENTE POR PLAZADO) ---
  public createReturn(payload: {
    orderId: string;
    storeId: string;
    storeName: string;
    customerName: string;
    customerPhone?: string;
    items: { productId: string; productName: string; sku: string; quantity: number }[];
    reason: string;
    evidencePhotos?: string[];
  }, user?: any): FulfillmentReturn {
    const data = this.getDbData();
    data.fulfillmentReturns = data.fulfillmentReturns || [];

    const newRet: FulfillmentReturn = {
      id: `RET-${Math.floor(10000 + Math.random() * 90000)}`,
      orderId: payload.orderId,
      storeId: payload.storeId,
      storeName: payload.storeName,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      items: payload.items.map(it => ({
        ...it,
        condition: 'PENDING_INSPECTION'
      })),
      reason: payload.reason,
      status: 'RECEIVED_AT_WAREHOUSE',
      evidencePhotos: payload.evidencePhotos || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.fulfillmentReturns.unshift(newRet);
    this.commit('FULFILLMENT_RETURN_CREATED', newRet.id, `Devolución ${newRet.id} registrada para orden ${payload.orderId}`);
    return newRet;
  }

  public classifyReturn(payload: {
    returnId: string;
    classification: 'RESTOCK' | 'DAMAGE';
    inspectorNotes: string;
    evidencePhotos?: string[];
  }, user?: any): FulfillmentReturn {
    const data = this.getDbData();
    const ret: FulfillmentReturn | undefined = (data.fulfillmentReturns || []).find((r: FulfillmentReturn) => r.id === payload.returnId);
    if (!ret) throw new Error('Devolución no encontrada.');

    ret.inspectorNotes = payload.inspectorNotes;
    ret.inspectedBy = user?.name || 'Inspector de Devoluciones Plazado';
    ret.inspectedAt = new Date().toISOString();
    ret.updatedAt = new Date().toISOString();

    if (payload.evidencePhotos) {
      ret.evidencePhotos = [...(ret.evidencePhotos || []), ...payload.evidencePhotos];
    }

    if (payload.classification === 'RESTOCK') {
      ret.status = 'CLASSIFIED_RESTOCKED';
      // Shift quantity to available for this store
      ret.items.forEach(it => {
        it.condition = 'IN_GOOD_CONDITION';
        it.classificationOutcome = 'RETURNED_TO_AVAILABLE';

        const inv: FulfillmentInventoryItem | undefined = (data.fulfillmentInventory || []).find(
          (i: FulfillmentInventoryItem) => i.storeId === ret.storeId && (i.productId === it.productId || i.sku === it.sku)
        );
        if (inv) {
          inv.available += it.quantity;
          inv.totalPhysical += it.quantity;
          inv.updatedAt = new Date().toISOString();

          // Sync product stock
          const prod = (data.products || []).find((p: any) => p.id === it.productId);
          if (prod) prod.stock = inv.available;

          data.inventoryMovements = data.inventoryMovements || [];
          data.inventoryMovements.unshift({
            id: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            inventoryItemId: inv.id,
            storeId: inv.storeId,
            storeName: inv.storeName,
            productId: inv.productId,
            productName: inv.productName,
            sku: inv.sku,
            type: 'RETURN_RESTOCK',
            quantityChanged: it.quantity,
            previousAvailable: inv.available - it.quantity,
            newAvailable: inv.available,
            warehouseId: inv.warehouseId,
            warehouseName: inv.warehouseName,
            reason: `Devolución #${ret.id} aprobada e ingresada a Disponible: ${payload.inspectorNotes}`,
            evidencePhotos: payload.evidencePhotos || [],
            performedBy: user?.name || 'Inspector Plazado',
            performedByRole: user?.role || 'SUPER_ADMIN',
            timestamp: new Date().toISOString()
          });
        }
      });
    } else {
      ret.status = 'CLASSIFIED_DAMAGED';
      // Shift quantity to damaged / blocked
      ret.items.forEach(it => {
        it.condition = 'DAMAGED';
        it.classificationOutcome = 'MOVED_TO_DAMAGED_BLOCKED';

        const inv: FulfillmentInventoryItem | undefined = (data.fulfillmentInventory || []).find(
          (i: FulfillmentInventoryItem) => i.storeId === ret.storeId && (i.productId === it.productId || i.sku === it.sku)
        );
        if (inv) {
          inv.damaged += it.quantity;
          inv.totalPhysical += it.quantity;
          inv.updatedAt = new Date().toISOString();

          data.inventoryMovements = data.inventoryMovements || [];
          data.inventoryMovements.unshift({
            id: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            inventoryItemId: inv.id,
            storeId: inv.storeId,
            storeName: inv.storeName,
            productId: inv.productId,
            productName: inv.productName,
            sku: inv.sku,
            type: 'RETURN_DAMAGED',
            quantityChanged: it.quantity,
            previousAvailable: inv.available,
            newAvailable: inv.available,
            warehouseId: inv.warehouseId,
            warehouseName: inv.warehouseName,
            reason: `Devolución #${ret.id} con producto dañado/inutilizable: ${payload.inspectorNotes}`,
            evidencePhotos: payload.evidencePhotos || [],
            performedBy: user?.name || 'Inspector Plazado',
            performedByRole: user?.role || 'SUPER_ADMIN',
            timestamp: new Date().toISOString()
          });
        }
      });
    }

    this.commit('FULFILLMENT_RETURN_CLASSIFIED', ret.id, `Devolución ${ret.id} clasificada como ${payload.classification}`);
    return ret;
  }

  // --- WITHDRAWALS (RETIRO DE INVENTARIO SOLICITADO POR TIENDA) ---
  public createWithdrawal(payload: {
    storeId: string;
    storeName: string;
    productId: string;
    productName: string;
    variantName?: string;
    sku: string;
    quantity: number;
    reason: string;
    withdrawalMethod: 'STORE_PICKUP_WAREHOUSE' | 'COURIER_DISPATCH_TO_STORE';
    destinationAddress?: string;
  }, user?: any): FulfillmentWithdrawal {
    const data = this.getDbData();
    data.fulfillmentWithdrawals = data.fulfillmentWithdrawals || [];

    const inv: FulfillmentInventoryItem | undefined = (data.fulfillmentInventory || []).find(
      (i: FulfillmentInventoryItem) => i.storeId === payload.storeId && (i.productId === payload.productId || i.sku === payload.sku)
    );
    if (!inv || inv.available < payload.quantity) {
      throw new Error(`Inventario disponible insuficiente para retirar. Disponible actual: ${inv?.available || 0} unidades.`);
    }

    const newWd: FulfillmentWithdrawal = {
      id: `WD-${Math.floor(10000 + Math.random() * 90000)}`,
      storeId: payload.storeId,
      storeName: payload.storeName,
      productId: payload.productId,
      productName: payload.productName,
      variantName: payload.variantName,
      sku: payload.sku,
      quantity: payload.quantity,
      reason: payload.reason,
      withdrawalMethod: payload.withdrawalMethod,
      destinationAddress: payload.destinationAddress,
      status: 'REQUESTED',
      statusHistory: [
        {
          status: 'REQUESTED',
          timestamp: new Date().toISOString(),
          note: `Solicitud de retiro de ${payload.quantity} unidades creada por la tienda. Esperando autorización de Plazado.`,
          updatedBy: user?.name || payload.storeName
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.fulfillmentWithdrawals.unshift(newWd);
    this.commit('FULFILLMENT_WITHDRAWAL_REQUESTED', newWd.id, `Solicitud de retiro ${newWd.id} de ${payload.storeName}`);
    return newWd;
  }

  public updateWithdrawalStatus(id: string, status: string, notes?: string, user?: any): FulfillmentWithdrawal {
    const data = this.getDbData();
    const wd: FulfillmentWithdrawal | undefined = (data.fulfillmentWithdrawals || []).find((w: FulfillmentWithdrawal) => w.id === id);
    if (!wd) throw new Error('Solicitud de retiro no encontrada.');

    const prevStatus = wd.status;
    wd.status = status as any;
    wd.updatedAt = new Date().toISOString();
    wd.statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      note: notes || `Estado de retiro cambiado a ${status}`,
      updatedBy: user?.name || 'Operaciones Plazado'
    });

    if (status === 'DELIVERED' && prevStatus !== 'DELIVERED') {
      // Physically deduct units from inventory
      const inv: FulfillmentInventoryItem | undefined = (data.fulfillmentInventory || []).find(
        (i: FulfillmentInventoryItem) => i.storeId === wd.storeId && (i.productId === wd.productId || i.sku === wd.sku)
      );
      if (inv) {
        const prevAvail = inv.available;
        inv.available = Math.max(0, inv.available - wd.quantity);
        inv.totalPhysical = Math.max(0, inv.totalPhysical - wd.quantity);
        inv.updatedAt = new Date().toISOString();

        const prod = (data.products || []).find((p: any) => p.id === wd.productId);
        if (prod) prod.stock = inv.available;

        data.inventoryMovements = data.inventoryMovements || [];
        data.inventoryMovements.unshift({
          id: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          inventoryItemId: inv.id,
          storeId: inv.storeId,
          storeName: inv.storeName,
          productId: inv.productId,
          productName: inv.productName,
          sku: inv.sku,
          type: 'WITHDRAWAL_OUT',
          quantityChanged: -wd.quantity,
          previousAvailable: prevAvail,
          newAvailable: inv.available,
          warehouseId: inv.warehouseId,
          warehouseName: inv.warehouseName,
          relatedWithdrawalId: wd.id,
          reason: `Retiro de mercancía completado #${wd.id}: ${wd.reason}`,
          performedBy: user?.name || 'Operaciones Plazado',
          performedByRole: user?.role || 'SUPER_ADMIN',
          timestamp: new Date().toISOString()
        });
      }
    }

    this.commit('WITHDRAWAL_STATUS_UPDATED', wd.id, `Retiro ${wd.id} cambió a ${status}`);
    return wd;
  }

  // --- FULFILLMENT CONFIGURATION (SUPER ADMIN) ---
  public updateConfig(newConfig: Partial<FulfillmentConfig>, user?: any): FulfillmentConfig {
    const data = this.getDbData();
    data.fulfillmentConfig = {
      ...(data.fulfillmentConfig || DEFAULT_FULFILLMENT_CONFIG),
      ...newConfig
    };

    this.commit('FULFILLMENT_CONFIG_UPDATED', 'GLOBAL_CONFIG', 'Configuración de Plazado Fulfillment actualizada por Super Admin');
    return data.fulfillmentConfig;
  }
}

export const fulfillmentService = new FulfillmentService();
