import { CustomerAddress } from './index';

export type StorageRequestStatus = 
  | 'CREATED'               // Solicitud creada
  | 'PENDING_APPROVAL'      // Pendiente de aprobación
  | 'APPROVED'              // Aprobada
  | 'WAITING_GOODS'         // Esperando mercancía
  | 'IN_TRANSIT'            // En tránsito
  | 'RECEIVED'              // Recibida en almacén
  | 'VALIDATING'            // En validación / conteo
  | 'STORED'                // Almacenada
  | 'REJECTED';             // Rechazada

export type FulfillmentOrderStatus =
  | 'PENDING_STORE_CONFIRMATION' // Esperando confirmación de la tienda
  | 'CONFIRMED_BY_STORE'         // Confirmado por tienda -> Orden enviada a almacén
  | 'REJECTED_BY_STORE'          // Rechazado por tienda
  | 'PICKING_IN_PROGRESS'        // En recolección
  | 'PICKING_COMPLETED'          // Picking completado
  | 'PACKING_IN_PROGRESS'        // En empaque
  | 'PACKED'                     // Empacado
  | 'READY_FOR_DISPATCH'         // Listo para despacho
  | 'DISPATCHED'                 // Despachado
  | 'IN_TRANSIT'                 // En ruta
  | 'DELIVERED'                  // Entregado
  | 'CANCELLED';                 // Cancelado

export type InventoryItemStatus =
  | 'PENDING_RECEPTION'  // Pendiente de recepción
  | 'IN_INSPECTION'       // En inspección
  | 'AVAILABLE'           // Disponible
  | 'RESERVED'            // Reservado
  | 'IN_PICKING'          // En picking
  | 'IN_PACKING'          // En packing
  | 'PREPARED'            // Preparado
  | 'DISPATCHED'          // Despachado
  | 'IN_TRANSIT'          // En tránsito
  | 'DELIVERED'           // Entregado
  | 'BLOCKED'             // Bloqueado
  | 'DAMAGED'             // Dañado
  | 'RETURNED'            // Devuelto
  | 'PENDING_WITHDRAWAL'; // Pendiente de retiro

export interface WarehouseLocation {
  warehouseId: string;
  warehouseName: string;
  zone: string;      // ej: "Zona A"
  aisle: string;     // Pasillo ej: "P-03"
  shelf: string;     // Estantería ej: "E-12"
  level: string;     // Nivel ej: "N-02"
  position: string;  // Posición ej: "B-04"
  barcode?: string;  // ej: "LOC-A-03-12-02-04"
}

export interface StorageRequest {
  id: string; // ej: "PF-89102"
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
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  declaredValue: number; // DOP
  warehouseId: string;
  warehouseName: string;
  estimatedDeliveryDate: string;
  notes?: string;
  // Branch Transfer Specific Fields (Transferencias de Sucursal a Fulfillment)
  originBranch?: string; // ej. "Sucursal Principal - Piantini", "Sucursal Santiago", etc.
  originBranchAddress?: string;
  dispatchGuideNumber?: string; // Conduce / Guía de despacho (ej. "CON-2026-8910")
  dispatchedByName?: string; // Encargado que despacha en sucursal
  driverOrCarrier?: string; // Transportista o chofer
  vehiclePlate?: string; // Placa o ficha de transporte
  securitySealNumber?: string; // Número de precinto / sello de seguridad
  transferType?: 'BRANCH_TO_FULFILLMENT' | 'SUPPLIER_TO_FULFILLMENT' | 'STANDARD_INBOUND';
  isImmutable?: boolean; // Bloqueo de inmutabilidad contra modificaciones no autorizadas
  tamperProofHash?: string; // Hash criptográfico de verificación de integridad y no repudio
  tamperProofVerified?: boolean; // Verificado formalmente contra alteración
  tamperProofVerifiedAt?: string;
  tamperProofVerifiedBy?: string;
  authorizedBy?: string; // Usuario o firma digital de autorización
  status: StorageRequestStatus;
  receptionDetails?: {
    receivedQuantity: number;
    damagedQuantity: number;
    acceptedQuantity: number;
    differenceQuantity: number;
    location: WarehouseLocation;
    operatorNotes?: string;
    operatorId?: string;
    operatorName?: string;
    evidencePhotos: string[];
    receivedAt: string;
  };
  statusHistory: {
    status: StorageRequestStatus | string;
    timestamp: string;
    note?: string;
    updatedBy: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface FulfillmentInventoryItem {
  id: string; // ej: "F-INV-001"
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  productImage: string;
  variantId?: string;
  variantName?: string;
  sku: string;
  warehouseId: string;
  warehouseName: string;
  location: WarehouseLocation;
  // Quantities
  totalPhysical: number;
  available: number;
  reserved: number;
  inPicking: number;
  inPacking: number;
  prepared: number;
  dispatched: number;
  inTransit: number;
  delivered: number;
  blocked: number;
  damaged: number;
  returned: number;
  pendingWithdrawal: number;
  minStockAlert?: number;
  lastCountDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type InventoryMovementType =
  | 'INBOUND_RECEPTION'
  | 'BRANCH_TRANSFER_DISPATCH'
  | 'BRANCH_TRANSFER_IN_TRANSIT'
  | 'BRANCH_TRANSFER_VERIFIED'
  | 'BRANCH_TRANSFER_IN'
  | 'BRANCH_TRANSFER_DISCREPANCY'
  | 'RESERVATION_HOLD'
  | 'RESERVATION_RELEASE'
  | 'PICKING_START'
  | 'PICKING_DONE'
  | 'PACKING_DONE'
  | 'DISPATCH'
  | 'DELIVERED'
  | 'DAMAGE_REGISTERED'
  | 'COUNT_CORRECTION'
  | 'LOCATION_CHANGE'
  | 'BLOCK'
  | 'UNBLOCK'
  | 'RETURN_RESTOCK'
  | 'RETURN_DAMAGED'
  | 'WITHDRAWAL_OUT';

export interface InventoryMovementLog {
  id: string;
  inventoryItemId: string;
  storeId: string;
  storeName?: string;
  productId: string;
  productName?: string;
  sku: string;
  type: InventoryMovementType;
  quantityChanged: number;
  previousAvailable: number;
  newAvailable: number;
  previousReserved?: number;
  newReserved?: number;
  warehouseId: string;
  warehouseName?: string;
  relatedOrderId?: string;
  relatedStorageRequestId?: string;
  relatedWithdrawalId?: string;
  originBranch?: string;
  dispatchGuideNumber?: string;
  securitySealNumber?: string;
  tamperProofHash?: string;
  reason?: string;
  evidencePhotos?: string[];
  performedBy: string;
  performedByRole: string;
  timestamp: string;
}

export interface FulfillmentOrderItem {
  productId: string;
  productName: string;
  productImage: string;
  sku: string;
  variantName?: string;
  quantity: number;
  warehouseId: string;
  location: WarehouseLocation;
  pickedQuantity: number;
  isPicked: boolean;
  scannedSku?: string;
  scannedLocation?: string;
  verifiedAt?: string;
}

export interface FulfillmentTimelineEvent {
  status: string;
  label: string;
  timestamp: string;
  actor: string;
  notes?: string;
  completed: boolean;
}

export interface FulfillmentOrder {
  id: string; // ej: "FO-88410"
  orderId: string; // ej: "ORD-2026-8912"
  orderGroupCode?: string;
  storeId: string;
  storeName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress: CustomerAddress;
  items: FulfillmentOrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  status: FulfillmentOrderStatus;
  storeConfirmationDeadline: string; // ISO string
  storeConfirmedAt?: string;
  storeRejectionReason?: string;
  rejectionUserDetails?: {
    userId: string;
    userName: string;
    timestamp: string;
  };
  pickingCode: string; // ej: "PICK-44812"
  assignedPickerId?: string;
  assignedPickerName?: string;
  pickingStartedAt?: string;
  pickingCompletedAt?: string;
  packingDetails?: {
    packageCount: number;
    totalWeightKg: number;
    dimensions: { length: number; width: number; height: number };
    packageType: string;
    packagerName: string;
    evidencePhotos: string[];
    packedAt: string;
    packageNotes?: string;
  };
  dispatchDetails?: {
    carrier: string;
    trackingNumber: string;
    dispatchNotes?: string;
    dispatchedAt: string;
    dispatchedBy: string;
    deliveredAt?: string;
    deliveryEvidencePhoto?: string;
    receivedByName?: string;
  };
  timeline: FulfillmentTimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export type IncidenceType =
  | 'PRODUCT_NOT_LOCATED'
  | 'INVENTORY_DISCREPANCY'
  | 'DAMAGED_PRODUCT'
  | 'WRONG_PRODUCT'
  | 'PACKING_ISSUE'
  | 'ADDRESS_ISSUE'
  | 'CARRIER_ISSUE'
  | 'CUSTOMER_NOT_FOUND'
  | 'DELIVERY_REJECTED'
  | 'OTHER';

export interface FulfillmentIncidence {
  id: string; // ej: "INC-2026-001"
  type: IncidenceType;
  orderId?: string;
  pickingCode?: string;
  storageRequestId?: string;
  storeId: string;
  storeName: string;
  productId?: string;
  productName?: string;
  sku?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED';
  description: string;
  evidencePhotos: string[];
  reportedBy: string;
  assignedTo?: string;
  comments: {
    author: string;
    role: string;
    message: string;
    timestamp: string;
  }[];
  resolutionNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FulfillmentReturn {
  id: string; // ej: "RET-2026-001"
  orderId: string;
  fulfillmentOrderId?: string;
  storeId: string;
  storeName: string;
  customerName: string;
  customerPhone?: string;
  items: {
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    condition: 'PENDING_INSPECTION' | 'IN_GOOD_CONDITION' | 'DAMAGED';
    classificationOutcome?: 'RETURNED_TO_AVAILABLE' | 'MOVED_TO_DAMAGED_BLOCKED';
  }[];
  reason: string;
  status: 'REQUESTED' | 'RECEIVED_AT_WAREHOUSE' | 'INSPECTION' | 'CLASSIFIED_RESTOCKED' | 'CLASSIFIED_DAMAGED' | 'COMPLETED';
  inspectorNotes?: string;
  evidencePhotos: string[];
  inspectedBy?: string;
  inspectedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FulfillmentWithdrawal {
  id: string; // ej: "WD-2026-001"
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  productImage?: string;
  variantName?: string;
  sku: string;
  quantity: number;
  reason: string;
  withdrawalMethod: 'STORE_PICKUP_WAREHOUSE' | 'COURIER_DISPATCH_TO_STORE';
  destinationAddress?: string;
  status: 'REQUESTED' | 'APPROVED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'DELIVERED' | 'REJECTED';
  approvedBy?: string;
  notes?: string;
  evidencePhotos?: string[];
  statusHistory: {
    status: string;
    timestamp: string;
    note?: string;
    updatedBy: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseLocationConfig {
  id: string;
  name: string;
  code: string;
  address: string;
  province: string;
  municipality: string;
  contactPhone: string;
  managerName: string;
  zones: string[];
  isActive: boolean;
}

export interface FulfillmentConfig {
  orderConfirmationTimeoutMinutes: number; // e.g. 60
  timeoutAction: 'AUTO_CONFIRM' | 'AUTO_CANCEL_RELEASE';
  warehouses: WarehouseLocationConfig[];
  storageFeePerM3PerDay: number; // DOP
  handlingFeePerOrder: number; // DOP
  packagingFee: number; // DOP
  isFulfillmentEnabledGlobally: boolean;
}
