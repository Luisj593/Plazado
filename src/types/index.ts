export type UserRole = 'CUSTOMER' | 'STORE_OWNER' | 'SUPER_ADMIN';

export type StoreStatus = 
  | 'PENDING'      // Pendiente de aprobación inicial
  | 'IN_REVIEW'    // En revisión de documentos
  | 'APPROVED'     // Aprobada para vender
  | 'active'       // Activa para vender (equivalente a APPROVED)
  | 'ACTIVE'
  | 'REJECTED'     // Rechazada
  | 'SUSPENDED'    // Suspendida por infracción
  | 'INACTIVE'     // Desactivada temporalmente
  | 'inactive';

export type OrderStatus =
  | 'PENDING'      // Pedido recibido
  | 'CONFIRMED'    // Confirmado por la tienda
  | 'PREPARING'    // En preparación
  | 'READY_FOR_PICKUP' // Listo para recoger / entrega
  | 'SHIPPED'      // Enviado con repartidor/courier
  | 'DELIVERED'    // Entregado y validado con código secreto
  | 'CANCELLED';   // Cancelado

export type PaymentMethodType = 'CARD_AZUL' | 'CASH_ON_DELIVERY' | 'BANK_TRANSFER';
export type PaymentStatusType = 'PAID' | 'PENDING' | 'REFUNDED' | 'FAILED';
export type SettlementStatus = 'PENDING' | 'SCHEDULED' | 'PROCESSED' | 'PAID' | 'REJECTED';

export interface CustomerAddress {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  sector: string;
  municipality: string;
  province: string;
  reference?: string;
  isDefault?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  storeId?: string; // Solo si role === 'STORE_OWNER'
  addresses: CustomerAddress[];
  passwordHash?: string;
  createdAt: string;
}

export interface CustomerRegistrationInput {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

export interface StoreRegistrationInput {
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  address: string;
  province: string;
  municipality: string;
  categoryId: string;
  description: string;
  logo?: string;
  shippingMethods: string[];
  shippingRate: number;
  acceptedTerms: boolean;
}

export interface StoreShippingConfig {
  type: 'fixed' | 'free' | 'by_zone';
  fixedRate: number; // en DOP
  freeShippingThreshold?: number; // envío gratis por encima de X monto
  estimatedDays: string; // ej: "24-48 horas", "Mismo día"
  coverageProvinces: string[];
  zones?: { name: string; rate: number }[];
}

export interface StoreBankInfo {
  bank: string;
  accountType: 'CORRIENTE' | 'AHORROS';
  accountNumber: string;
  accountHolder: string;
  rncOrCedula: string;
}

export interface Store {
  id: string; // store_id único
  name: string;
  slug: string;
  ownerName: string;
  email: string;
  phone: string;
  whatsapp: string;
  description: string;
  categoryId: string; // Categoría principal
  logo: string;
  banner: string;
  province: string;
  municipality: string;
  address: string;
  status: StoreStatus;
  isPublished?: boolean; // Control de publicación en catálogo global de tiendas
  rejectionReason?: string;
  shippingConfig: StoreShippingConfig;
  bankInfo: StoreBankInfo;
  rating: number;
  reviewCount: number;
  salesCount: number;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  parentId?: string | null; // null si es categoría principal
  order?: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

export type ProductStatus = 'published' | 'active' | 'draft' | 'paused' | 'out_of_stock' | 'archived';

export interface Product {
  id: string;
  storeId: string; // store_id isolation
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  categoryId: string;
  subcategoryId?: string;
  price: number; // DOP
  promoPrice?: number; // DOP opcional
  sku: string;
  images: string[];
  stock: number;
  reservedStock: number;
  soldCount: number;
  minStockAlert: number;
  status: ProductStatus;
  variants?: ProductVariant[];
  attributes?: { name: string; value: string }[];
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  isTestProduct?: boolean; // Para identificar datos de prueba y limpiarlos
  createdAt: string;
  updatedAt?: string;
}

/**
 * Returns true if a product is publicly visible in the global catalog.
 * A product is visible if it is published/active and not explicitly paused, draft, or archived.
 * Products with 0 stock can still be visible (with "Agotado" badge).
 */
export function isProductPubliclyVisible(product: Product): boolean {
  if (!product) return false;
  if (product.status === 'paused' || product.status === 'draft' || product.status === 'archived') {
    return false;
  }
  return true;
}

/**
 * Returns true if a store is publicly visible in the global catalog of PlazaDO.
 * A store is visible if:
 * 1. It is not explicitly marked as isPublished === false
 * 2. Its status allows publication ('APPROVED', 'active', or published without being INACTIVE/REJECTED/SUSPENDED)
 * 3. Never depends on the current user, ownerId, or active session.
 */
export function isStorePubliclyVisible(store: Store | null | undefined): boolean {
  if (!store) return false;
  if (store.isPublished === false) return false;

  const norm = (store.status || '').toUpperCase();
  if (norm === 'INACTIVE' || norm === 'REJECTED' || norm === 'SUSPENDED') {
    return false;
  }

  if (norm === 'APPROVED' || norm === 'ACTIVE') {
    return true;
  }

  if (store.isPublished === true) {
    return true;
  }

  return false;
}

export interface CartItem {
  productId: string;
  storeId: string;
  quantity: number;
  selectedVariantId?: string;
  addedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  sku: string;
  price: number;
  quantity: number;
  variantName?: string;
}

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  updatedBy: string;
  note?: string;
}

export interface Order {
  id: string; // ej: "ORD-2026-8912"
  orderGroupCode: string; // Agrupador de checkout multi-tienda ej: "CHK-7712"
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  storeId: string; // Tienda específica
  storeName: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  plazaCommissionRate: number; // ej: 0.05 (5%)
  plazaCommissionAmount: number; // comisión en DOP
  storeNetEarnings: number; // total - comisión (+ envío)
  status: OrderStatus;
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatusType;
  deliveryConfirmationCode: string; // Código secreto de 6 dígitos que solo el cliente ve inicialmente
  deliveryAddress: CustomerAddress;
  customerNotes?: string;
  statusHistory: OrderStatusHistoryItem[];
  settlementId?: string;
  settlementStatus: 'PENDING' | 'SCHEDULED' | 'SETTLED';
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  orderGroupCode: string;
  customerId: string;
  customerName: string;
  storeId: string;
  amount: number;
  method: PaymentMethodType;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED';
  gatewayReference: string; // ej: AZUL-AUTH-892144
  idempotencyKey: string;
  cardLast4?: string;
  cardBrand?: string;
  createdAt: string;
}

export interface StoreBalance {
  storeId: string;
  totalSales: number;
  plazaCommissionsPaid: number;
  pendingBalance: number;    // Ventas de pedidos no entregados aún
  availableBalance: number;  // Ventas de pedidos ya entregados, listos para liquidar
  settledBalance: number;    // Liquidaciones ya pagadas
  retainedBalance: number;   // Por disputas
  lastUpdated: string;
}

export interface Settlement {
  id: string;
  storeId: string;
  storeName: string;
  grossAmount: number;
  commissionAmount: number;
  adjustments: number;
  netAmount: number;
  status: SettlementStatus;
  bankReference?: string;
  paymentMethodName: string;
  accountNumberMasked: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
}

export interface Dispute {
  id: string;
  orderId: string;
  storeId: string;
  storeName: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  issueType: 'WRONG_ITEM' | 'NOT_RECEIVED' | 'DAMAGED' | 'DESCRIPTION_MISMATCH' | 'DELIVERY_ISSUE';
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'WAITING_RESPONSE' | 'RESOLVED' | 'CLOSED';
  refundRequested?: boolean;
  refundAmount?: number;
  resolutionNotes?: string;
  evidenceImages?: string[];
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  storeId: string;
  customerId: string;
  customerName: string;
  rating: number; // 1-5
  comment: string;
  isVerifiedPurchase: boolean;
  isModerated: boolean;
  createdAt: string;
}

export interface FavoriteStoreAndProduct {
  productIds: string[];
  storeIds: string[];
}

export interface Coupon {
  id: string;
  code: string;
  storeId?: string | null; // null para cupón global PlazaDO
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  minSpend?: number;
  usageLimit?: number;
  usageCount: number;
  validUntil: string;
  isActive: boolean;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  imageUrl: string;
  targetType: 'PRODUCT' | 'STORE' | 'CATEGORY' | 'PROMO' | 'URL';
  targetValue: string;
  isActive: boolean;
  order: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: UserRole;
  subject: string;
  category: 'ORDERS' | 'PAYMENTS' | 'PRODUCTS' | 'STORES' | 'TECHNICAL' | 'CLAIMS';
  status: 'OPEN' | 'IN_REVIEW' | 'WAITING_RESPONSE' | 'RESOLVED' | 'CLOSED';
  messages: {
    senderName: string;
    senderRole: string;
    message: string;
    timestamp: string;
  }[];
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  affectedRecord: string;
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface AzulConfig {
  merchantId: string;
  authKey: string;
  isSandbox: boolean;
  isEnabled: boolean;
  webhookUrl: string;
}

export interface SystemSettings {
  platformName: string;
  legalBusinessName: string;
  rnc: string;
  contactEmail: string;
  contactPhone: string;
  whatsappCommercial: string; // ej: "809-449-3325"
  defaultCommissionRate: number; // 0.05 (5%)
  itbisTaxRate: number; // 0.18
  currency: string; // "DOP"
  currencySymbol: string; // "RD$"
  azulConfig: AzulConfig;
  activePaymentMethods: {
    cardAzul: boolean;
    cashOnDelivery: boolean;
    bankTransfer: boolean;
  };
  deliveryIntegration: {
    pedidosYaEnabled: boolean;
    uberDirectEnabled: boolean;
    localCouriersEnabled: boolean;
  };
  policies: {
    customerTermsVersion: string;
    storeTermsVersion: string;
    privacyPolicyVersion: string;
    refundPolicyVersion: string;
  };
}
