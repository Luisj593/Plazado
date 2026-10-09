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
  | 'PENDING_STORE_CONFIRMATION' // Pedido Plazado Fulfillment esperando confirmación de tienda
  | 'CONFIRMED'    // Confirmado por la tienda
  | 'PREPARING'    // En preparación
  | 'READY_FOR_PICKUP' // Listo para recoger / entrega
  | 'SHIPPED'      // Enviado con repartidor/courier
  | 'DELIVERED'    // Entregado y validado con código secreto
  | 'CANCELLED';   // Cancelado

export type PaymentMethodType = 'CARD_AZUL' | 'CASH_ON_DELIVERY' | 'BANK_TRANSFER' | 'PAYPAL';
export type PaymentStatusType = 'PAID' | 'PENDING' | 'REFUNDED' | 'FAILED';
export type SettlementStatus = 'PENDING' | 'SCHEDULED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'RETAINED' | 'CANCELLED' | 'REJECTED';

export interface CustomerAddress {
  id: string;
  label: string; // Nombre o alias de la dirección: Casa, Trabajo, Oficina, etc.
  recipientName: string; // Nombre de la persona que recibe
  phone: string; // Número de teléfono
  province: string; // Provincia
  municipality: string; // Municipio
  sector: string; // Sector
  street: string; // Calle
  buildingNumber?: string; // Número de casa, apartamento o edificio
  reference?: string; // Referencia adicional
  locationUrl?: string; // Ubicación o enlace de ubicación (Google Maps/enlace) si está disponible
  deliveryNotes?: string; // Indicaciones adicionales para realizar la entrega
  isDefault?: boolean; // Dirección principal
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface KycVerificationData {
  cedulaNumber?: string;
  cedulaFrontUrl: string;
  selfieUrl: string;
  biometricScore?: number;
  biometricStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  verifiedAt?: string;
  livenessPassed: boolean;
  facialMatchPassed: boolean;
}

export interface UserVerificationInfo {
  code: string;
  codeExpiresAt: number;
  attempts: number;
  lastSentAt: number;
  isVerified: boolean;
  verifiedAt?: string;
  resendCount: number;
  accountType: 'CUSTOMER' | 'STORE';
  storeName?: string;
}

export interface LegalAcceptance {
  version: string;
  audience: 'CUSTOMER' | 'STORE';
  acceptedAt: string;
  readToEnd: true;
  documentIds: string[];
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
  authVersion?: number;
  cedulaNumber?: string;
  kycData?: KycVerificationData;
  isKycVerified?: boolean;
  isEmailVerified?: boolean;
  verification?: UserVerificationInfo;
  legalAcceptance?: LegalAcceptance;
  isApprovedByAdmin?: boolean;
  adminApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface UserCredential {
  id: string;
  userId: string; // UNIQUE: One-to-One with User
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRegistrationInput {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
  legalVersion?: string;
  legalAudience?: 'CUSTOMER' | 'STORE';
  legalReadToEnd?: boolean;
  cedulaNumber?: string;
  cedulaFrontUrl?: string;
  selfieUrl?: string;
  biometricScore?: number;
  verificationCode?: string;
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
  legalVersion?: string;
  legalAudience?: 'CUSTOMER' | 'STORE';
  legalReadToEnd?: boolean;
  cedulaNumber?: string;
  cedulaFrontUrl?: string;
  selfieUrl?: string;
  biometricScore?: number;
  verificationCode?: string;
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
  ownerId?: string; // ID del usuario propietario (owner)
  owner_id?: string; // Alias de compatibilidad global
  name: string;
  slug: string;
  ownerName: string;
  email: string;
  phone: string;
  whatsapp: string;
  description: string;
  categoryId: string; // Categoría principal
  logo?: string;
  banner?: string;
  province: string;
  municipality: string;
  address: string;
  status: StoreStatus;
  isPublished?: boolean; // Control de publicación en catálogo global de tiendas
  rejectionReason?: string;
  shippingConfig?: StoreShippingConfig;
  bankInfo?: StoreBankInfo;
  rating: number;
  reviewCount: number;
  salesCount: number;
  kycData?: KycVerificationData;
  isKycVerified?: boolean;
  isEmailVerified?: boolean;
  createdAt: string;
  updatedAt?: string;
  deleted?: boolean;
  deletedAt?: string;
  createdBy?: string;
  updatedBy?: string;
  creationSource?: 'USER_REGISTRATION' | 'ADMIN_CREATION' | string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  parentId?: string | null; // null si es categoría principal, o id de categoría padre
  order?: number;
  isActive?: boolean;
  productCount?: number;
}

export type SpecificationFieldType = 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'date';

export interface CategorySpecification {
  id: string; // specificationId
  name: string;
  key: string;
  type: SpecificationFieldType;
  required?: boolean;
  options?: string[]; // Para 'select' o 'multiselect'
  unit?: string; // Unidad de medida (ej: 'GB', 'pulgadas', 'Watts', 'ml', 'kg')
  placeholder?: string;
  order?: number;
  categoryId?: string; // ID de categoría principal a la que aplica
  subcategoryId?: string; // ID de subcategoría específica
  applicableSubcategoryIds?: string[]; // IDs de subcategorías a las que aplica (si son varias o todas)
  isFilterable?: boolean; // Si aparece en los filtros de búsqueda del cliente
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

export type ProductStatus = 'published' | 'active' | 'draft' | 'paused' | 'out_of_stock' | 'archived' | 'inactive';

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
  promoPrice?: number | null; // null elimina explícitamente la oferta persistida
  sku: string;
  images: string[];
  stock: number;
  reservedStock: number;
  soldCount: number;
  minStockAlert: number;
  status: ProductStatus;
  variants?: ProductVariant[];
  attributes?: { name: string; value: string }[];
  specifications?: Record<string, any>;
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  isTestProduct?: boolean; // Para identificar datos de prueba y limpiarlos
  isFulfillment?: boolean; // Almacenado físicamente en Plazado Fulfillment
  fulfillmentWarehouseId?: string;
  fulfillmentInventoryId?: string;
  createdAt: string;
  updatedAt?: string;
  deleted?: boolean;
  deletedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Returns true if a product is publicly visible in the global catalog.
 * A product is visible if it is published/active and not deleted, inactive, paused, draft, or archived.
 * Products with 0 stock can still be visible (with "Agotado" badge).
 */
export function isProductPubliclyVisible(product: Product): boolean {
  if (!product) return false;
  if (product.deleted === true) return false;
  if (product.status === 'paused' || product.status === 'draft' || product.status === 'archived' || product.status === 'inactive') {
    return false;
  }
  return true;
}

/**
 * Returns true if a store is publicly visible in the global catalog of PlazaDO.
 * A store is visible if:
 * 1. It is not explicitly marked as isPublished === false or deleted === true
 * 2. Its status allows publication ('APPROVED', 'active', or published without being INACTIVE/REJECTED/SUSPENDED)
 * 3. Never depends on the current user, ownerId, or active session.
 */
export function isStorePubliclyVisible(store: Store | null | undefined): boolean {
  if (!store) return false;
  if (store.deleted === true) return false;
  if (store.isPublished === false) return false;

  const norm = (store.status || '').toUpperCase();
  // Solamente se ocultan tiendas explícitamente suspendidas, inactivadas o rechazadas por el Super Admin
  if (norm === 'INACTIVE' || norm === 'REJECTED' || norm === 'SUSPENDED') {
    return false;
  }

  // Toda tienda registrada y activa es inmediatamente visible en la plataforma global
  return true;
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
  paypalPayment?: { orderId: string; gatewayId: string; amountUsd: string; dopPerUsd: number; groupCode: string; captureId?: string; captureStarted?: boolean };
  activeDisputeId?: string | null;
  accountingVersion?: number; // New orders recognize cash sale on validated delivery
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
  plazaCommissionRate: number; // Fracción decimal registrada por pedido; 30% = 0.30
  plazaCommissionAmount: number; // comisión en DOP
  storeNetEarnings: number; // total - comisión (+ envío)
  status: OrderStatus;
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatusType;
  deliveryConfirmationCode: string; // Código secreto de 6 dígitos que solo el cliente ve inicialmente
  deliveryAddress: CustomerAddress;
  customerNotes?: string;
  cancelReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  cardLast4?: string;
  cardBrand?: string;
  cardAuthorizationCode?: string;
  cardChargedAt?: string;
  chargeType?: 'AUTOMATIC' | 'MANUAL';
  statusHistory: OrderStatusHistoryItem[];
  settlementId?: string;
  settlementStatus: 'PENDING' | 'SCHEDULED' | 'SETTLED';
  fulfillmentType?: 'STORE_DIRECT' | 'PLAZADO_FULFILLMENT';
  fulfillmentOrderId?: string;
  fulfillmentStatus?: import('./fulfillment').FulfillmentOrderStatus;
  storeConfirmationDeadline?: string;
  storeConfirmedAt?: string;
  storeRejectionReason?: string;
  createdAt: string;
}

export interface OrderChatMessage {
  id: string;
  orderId: string;
  storeId: string;
  customerId: string;
  senderId: string;
  senderName: string;
  senderRole: 'CUSTOMER' | 'STORE' | 'ADMIN';
  message: string;
  createdAt: string;
  readByCustomer: boolean;
  readByStore: boolean;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  orderGroupCode?: string;
  customerId: string;
  customerName: string;
  storeId: string;
  storeName?: string;
  amount: number; // Monto total
  method: PaymentMethodType;
  commissionAmount: number; // Comisión registrada para esta venta
  netAmount: number; // Monto neto tienda
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatusType;
  settlementStatus: 'PENDING' | 'SCHEDULED' | 'SETTLED' | 'RETAINED' | 'EXEMPT';
  settlementId?: string;
  gatewayReference: string; // ej: AZUL-AUTH-892144
  idempotencyKey: string;
  cardLast4?: string;
  cardBrand?: string;
  notes?: string;
  createdAt: string;
}

export interface StoreBalance {
  storeId: string;
  totalSales: number;
  cardSales: number;
  cashSales: number;
  plazaCommissionsPaid: number;
  pendingCashCommissions: number; // Comisiones pendientes de cobro por ventas en efectivo
  pendingBalance: number;    // Ventas de pedidos con tarjeta no entregados aún
  availableBalance: number;  // Ventas de pedidos ya entregados, listos para liquidar
  settledBalance: number;    // Liquidaciones ya pagadas
  retainedBalance: number;   // Por disputas o sin cuenta bancaria
  adjustments: number;       // Ajustes o reembolsos
  carriedOverDebt: number;   // Saldo deudor cuando comisiones efectivo superaron balance
  lastUpdated: string;
}

export interface Settlement {
  id: string;
  storeId: string;
  storeName: string;
  grossAmount: number;
  commissionAmount: number;
  cashCommissionsDeducted?: number;
  adjustments: number;
  netAmount: number;
  status: SettlementStatus;
  bankName?: string;
  bankAccountType?: 'CORRIENTE' | 'AHORROS';
  accountHolder?: string;
  rncOrCedula?: string;
  accountNumberMasked: string;
  paymentMethodName: string;
  bankReference?: string;
  ordersCount?: number;
  orderIds?: string[];
  paidAt?: string;
  notes?: string;
  idempotencyKey?: string;
  createdAt: string;
}

export interface FinancialAuditLog {
  id: string;
  orderId?: string;
  settlementId?: string;
  storeId: string;
  storeName?: string;
  amount: number;
  commission: number;
  paymentMethod: PaymentMethodType | string;
  movementType: 'SALE_CARD' | 'SALE_CASH' | 'COMMISSION_CHARGE' | 'SETTLEMENT_PAYOUT' | 'ADJUSTMENT' | 'REFUND';
  actor: string;
  previousBalance: number;
  newBalance: number;
  externalRef?: string;
  status: string;
  notes?: string;
  timestamp: string;
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
  targetType: 'PRODUCT' | 'STORE' | 'CATEGORY' | 'PROMO' | 'URL' | 'REGISTER_USER' | 'REGISTER_STORE';
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

export interface LegalDocument {
  id: string;
  title: string;
  category: 'customer_terms' | 'store_terms' | 'privacy' | 'returns_refunds' | 'shipping_procedures' | 'payment_policies' | 'store_procedures' | 'custom';
  categoryLabel: string;
  version: string;
  lastUpdated: string;
  description: string;
  summaryPoints?: string[];
  pdfUrl?: string; // Base64 data URL or external download link
  pdfFileName?: string;
  pdfFileSize?: string;
  isPublished: boolean;
  downloadCount?: number;
}

export interface AndroidAppConfig {
  isEnabled: boolean;
  appName: string;
  versionName: string;
  versionCode: number;
  releaseDate: string;
  apkUrl?: string; // Base64 data URL or direct download URL
  apkFileName?: string;
  apkFileSize?: string;
  minAndroidVersion: string;
  packageName: string;
  releaseNotes: string;
  downloadCount: number;
}

export interface SystemMailConfig {
  senderEmail: string;
  senderName: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  useSsl?: boolean;
  isConfigured?: boolean;
}

export type SocialLinks = Partial<Record<'instagram' | 'tiktok' | 'facebook', string>>;

export interface SystemSettings {
  socialLinks?: SocialLinks;
  platformName: string;
  legalEntityRegistered?: boolean;
  legalAddress?: string;
  legalBusinessName: string;
  rnc: string;
  contactEmail: string;
  contactPhone: string;
  whatsappCommercial: string; // ej: "809-449-3325"
  commissionPolicyVersion?: string;
  commissionPolicyAppliedAt?: string;
  plazaCommissionRate: number; // Fracción decimal: 30% = 0.30
  defaultCommissionRate: number; // Fallback legacy
  itbisTaxRate: number; // 0.18
  currency: string; // "DOP"
  currencySymbol: string; // "RD$"
  // Branding & Visual Identity (Super Admin configurable)
  logoType?: 'default' | 'custom';
  logoUrl?: string; // Logo principal (para fondos claros / Header)
  logoDarkUrl?: string; // Logo para fondos oscuros (ej. Footer)
  faviconType?: 'default' | 'custom';
  faviconUrl?: string; // Favicon de la pestaña del navegador (.ico, .png, .svg)
  headerBannerType?: 'default' | 'custom';
  homeHeroMode?: 'header' | 'slider'; // Cabecera fija o slider aleatorio de productos
  headerBannerUrl?: string; // Imagen principal del Header / Hero (configurable por Super Admin)
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
  legalDocuments?: LegalDocument[];
  androidApp?: AndroidAppConfig;
  paymentGateways?: PaymentGatewayConfig[];
  primaryPaymentGatewayId?: string;
  mailConfig?: SystemMailConfig;
}

// ==========================================
// CONFIGURACIÓN DE PAGOS & PROVEEDORES (PLAZADO.COM)
// ==========================================

export interface AssociatedBankAccount {
  bank: string;
  accountType: 'Corriente' | 'Ahorros' | 'CORRIENTE' | 'AHORROS' | string;
  accountNumber: string;
  accountHolder: string;
  rncOrCedula: string;
}

export interface PaymentGatewayCredentials {
  clientId?: string;
  clientSecret?: string;
  hasClientSecret?: boolean;
  apiKey?: string;
  secretKey?: string;
  authKey?: string;
  token?: string;
  merchantSecret?: string;
  hasCredentials?: boolean;
}

export type PaymentProviderType = 'AZUL' | 'CARDNET' | 'STRIPE' | 'PAYPAL' | 'CUSTOM';
export type PaymentProviderKey = PaymentProviderType;

export interface PaymentGatewayConfig {
  paypalDopPerUsd?: number; // Pesos dominicanos por un dólar; configurado por el administrador.
  id: string; // 'azul', 'cardnet', 'stripe', 'paypal', or custom
  providerKey: PaymentProviderType;
  providerName: string; // e.g. "AZUL (Servicios Digitales Popular)", "CardNET", "Stripe", "PayPal"
  accountCommercialName: string; // e.g. "Plazado Dominicana SRL"
  merchantId: string; // ID de comercio
  affiliationNumber: string; // Número de afiliación
  currency: 'DOP' | 'USD';
  associatedBankAccount: AssociatedBankAccount;
  isActive: boolean; // Si es la cuenta receptora activa de Plazado.com
  environment: 'SANDBOX' | 'PRODUCTION'; // Pruebas / Producción
  webhookUrl: string;
  credentials: PaymentGatewayCredentials;
  lastModified: string;
  updatedBy?: string;
  notes?: string;
}

// ==========================================
// GESTIÓN DE PUBLICIDAD (ADVERTISING MANAGEMENT)
// ==========================================

export type AdDeviceTarget = 'ALL' | 'DESKTOP' | 'MOBILE';
export type AdType = 'INTERNAL' | 'EXTERNAL';
export type AdPlacementCode = 
  | 'HOME_TOP' 
  | 'HOME_MIDDLE' 
  | 'HOME_PRODUCTS' 
  | 'CATEGORY_TOP' 
  | 'CATEGORY_MIDDLE' 
  | 'STORE_TOP' 
  | 'PRODUCT_RELATED' 
  | string;

export interface AdPlacement {
  code: AdPlacementCode;
  name: string; // e.g. 'Banner Principal Superior'
  description: string;
  supportedFormats: ('IMAGE' | 'VIDEO')[];
  recommendedSize: string; // e.g. '1200 x 400 px'
  isActive: boolean;
  maxSlots?: number;
}

export interface Advertisement {
  id: string;
  title: string;
  description?: string;
  type: AdType; // 'INTERNAL' | 'EXTERNAL'
  advertiserName: string; // e.g. 'Plazado.com Oficial' o 'Samsung Dominicana'
  placement: AdPlacementCode; // AdPlacement code
  startDate: string; // ISO date 'YYYY-MM-DD'
  endDate: string; // ISO date 'YYYY-MM-DD'
  imageUrl: string;
  mobileImageUrl?: string;
  videoUrl?: string;
  ctaText?: string; // 'Ver Oferta', 'Comprar Ahora', 'Regístrate Aquí'
  targetUrl: string; // Enlace de destino
  targetWindow: '_self' | '_blank';
  priority: number; // 1 to 10 (10 = highest priority)
  targetDevice: AdDeviceTarget; // 'ALL' | 'DESKTOP' | 'MOBILE'
  targetCategory?: string; // slug de categoría
  targetStoreId?: string; // ID de tienda
  sponsorStoreId?: string; // ID de tienda patrocinada
  budget?: number; // Presupuesto o precio contratado RD$
  isActive: boolean;
  impressions: number;
  clicks: number;
  order?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AdMetricEvent {
  id: string;
  adId: string;
  campaignTitle: string;
  placement: string;
  type: 'IMPRESSION' | 'CLICK';
  device: 'DESKTOP' | 'MOBILE' | 'TABLET';
  timestamp: string;
}

export type AdminTab = 
  | 'metrics' 
  | 'solicitudes' 
  | 'verifications'
  | 'stores' 
  | 'orders' 
  | 'products' 
  | 'categories_specs'
  | 'users' 
  | 'settlements' 
  | 'disputes' 
  | 'content' 
  | 'branding' 
  | 'settings' 
  | 'audit' 
  | 'persistence' 
  | 'payments' 
  | 'advertising' 
  | 'legal_docs' 
  | 'android_app'
  | 'fulfillment';

export * from './fulfillment';

export type AppView = 
  | 'home' 
  | 'catalog' 
  | 'stores' 
  | 'store_public' 
  | 'cart'
  | 'checkout'
  | 'sell_with_us' 
  | 'customer_portal' 
  | 'store_dashboard' 
  | 'admin_dashboard' 
  | 'policies' 
  | 'download_app';


