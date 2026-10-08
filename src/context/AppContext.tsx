import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { 
  User, 
  Store, 
  Category, 
  Product, 
  CartItem, 
  Order, 
  OrderStatus, 
  PaymentMethodType, 
  StoreBalance, 
  Settlement, 
  Dispute, 
  Coupon, 
  Banner, 
  AuditLog, 
  SystemSettings, 
  CustomerAddress,
  Review,
  UserRole,
  CustomerRegistrationInput,
  StoreRegistrationInput,
  isStorePubliclyVisible,
  StoreStatus,
  PaymentTransaction,
  FinancialAuditLog,
  PaymentGatewayConfig,
  AdPlacement,
  Advertisement,
  OrderChatMessage,
  CategorySpecification,
  AdminTab,
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
  AppView
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_STORES, 
  INITIAL_CATEGORIES, 
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS, 
  INITIAL_STORE_BALANCES, 
  INITIAL_SETTLEMENTS, 
  INITIAL_BANNERS, 
  INITIAL_COUPONS, 
  INITIAL_SETTINGS, 
  INITIAL_AUDIT_LOGS,
  INITIAL_PAYMENT_GATEWAYS,
  INITIAL_AD_PLACEMENTS,
  INITIAL_ADVERTISEMENTS,
  INITIAL_SPECIFICATIONS
} from '../data/initialData';
import { api, BootstrapResponse } from '../services/api';
import { parseRouteFromLocation, syncBrowserUrl, buildUrlForRoute } from '../utils/router';

export type { AppView };

export interface CartStoreGroup {
  store: Store;
  items: {
    cartItem: CartItem;
    product: Product;
  }[];
  subtotal: number;
  shippingCost: number;
  storeTotal: number;
  freeShippingQualified: boolean;
  freeShippingThreshold?: number;
}

interface AppContextType {
  // Navigation
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  selectedStoreSlug: string | null;
  setSelectedStoreSlug: (slug: string | null) => void;
  isBootstrapLoading: boolean;
  copyStoreShareUrl: (store: { slug?: string; id: string; name?: string }) => Promise<string>;
  getStoreShareUrl: (store: { slug?: string; id: string }) => string;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  selectedCategorySlug: string | null;
  setSelectedCategorySlug: (slug: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  openPolicySlug: string | null;
  setOpenPolicySlug: (slug: string | null) => void;
  isDownloadModalOpen: boolean;
  downloadModalTab: 'app' | 'pdf';
  openDownloadModal: (tab?: 'app' | 'pdf') => void;
  closeDownloadModal: () => void;
  adminActiveTab: AdminTab;
  setAdminActiveTab: (tab: AdminTab) => void;

  // Auth & RBAC
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  switchPersona: (role: UserRole, storeId?: string) => void;
  allUsers: User[];
  updateUserProfile: (data: Partial<User>) => void;
  addCustomerAddress: (address: Omit<CustomerAddress, 'id'>) => Promise<CustomerAddress | null>;
  updateCustomerAddress: (addressId: string, updatedData: Partial<CustomerAddress>) => Promise<boolean>;
  deleteCustomerAddress: (addressId: string) => Promise<boolean>;
  setDefaultAddress: (addressId: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<void>;
  deleteMyAccount: (password?: string, deleteAssociatedStore?: boolean) => Promise<{ success: boolean; message: string }>;
  deleteMyStore: (storeId: string, confirmationText: string) => Promise<{ success: boolean; message: string }>;
  setUserPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register_select' | 'register_customer' | 'register_store' | 'verify_email';
  openAuthModal: (mode?: 'login' | 'register_select' | 'register_customer' | 'register_store' | 'verify_email') => void;
  closeAuthModal: () => void;
  pendingVerificationEmail: string | null;
  setPendingVerificationEmail: (email: string | null) => void;
  verifyCode: (email: string, code: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  resendVerificationCode: (email: string) => Promise<{ success: boolean; message?: string; remainingSeconds?: number }>;
  pendingPurchaseAction: { productId: string; storeId: string; quantity: number } | null;
  authPurchaseNotice: string | null;
  setAuthPurchaseNotice: (notice: string | null) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  registerCustomer: (data: CustomerRegistrationInput) => Promise<{ success: boolean; message?: string }>;
  registerStoreAccount: (data: StoreRegistrationInput) => Promise<{ success: boolean; storeId?: string; message?: string }>;

  // Stores
  stores: Store[];
  registerStore: (storeData: Omit<Store, 'id' | 'status' | 'rating' | 'reviewCount' | 'salesCount' | 'createdAt'>) => string;
  updateStoreStatus: (storeId: string, status: Store['status'], reason?: string) => void;
  updateStoreDetails: (storeId: string, data: Partial<Store>) => void;
  toggleStorePublish: (storeId: string) => void;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'storeId' | 'reservedStock' | 'soldCount' | 'rating' | 'reviewCount' | 'createdAt'>) => void;
  updateProduct: (productId: string, data: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  cleanTestProducts: () => number;

  // Categories
  categories: Category[];
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (categoryId: string, data: Partial<Category>) => void;
  deleteCategory: (categoryId: string) => void;
  mergeCategories: (sourceId: string, targetId: string) => void;

  // Cart & Checkout
  cart: CartItem[];
  addToCart: (productId: string, storeId: string, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartGroups: () => CartStoreGroup[];
  cartTotal: {
    itemsCount: number;
    subtotal: number;
    shippingTotal: number;
    discountTotal: number;
    grandTotal: number;
  };
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  processCheckout: (
    address: CustomerAddress, 
    paymentMethod: PaymentMethodType, 
    notes?: string,
    simulatedCard?: { number: string; expiry: string; cvc: string; holder?: string }
  ) => { success: boolean; orderIds: string[]; orderGroupCode: string; error?: string };

  // Orders
  orders: Order[];
  updateOrderStatus: (
    orderId: string, 
    newStatus: OrderStatus, 
    note?: string, 
    providedConfirmationCode?: string
  ) => { success: boolean; message: string };

  // Order In-Platform Chat (PlazaDO Exclusive Channel)
  orderMessages: OrderChatMessage[];
  activeChatOrderId: string | null;
  openOrderChat: (orderId: string) => void;
  closeOrderChat: () => void;
  sendOrderMessage: (orderId: string, message: string) => Promise<boolean>;
  markOrderMessagesAsRead: (orderId: string, role?: 'CUSTOMER' | 'STORE') => Promise<void>;
  getOrderUnreadCount: (orderId: string, forRole: 'CUSTOMER' | 'STORE') => number;

  // Finances & Balances
  storeBalances: Record<string, StoreBalance>;
  settlements: Settlement[];
  paymentTransactions: PaymentTransaction[];
  financialAuditLogs: FinancialAuditLog[];
  requestSettlement: (storeId: string, notes?: string) => { success: boolean; message: string };
  processSettlement: (settlementId: string, status: Settlement['status'], reference?: string) => void;
  runWeeklySettlements: () => Promise<{ success: boolean; message: string; settlementsCreated?: Settlement[]; totalLiquidated?: number }>;
  refreshFinancials: () => Promise<void>;

  // Disputes & Claims
  disputes: Dispute[];
  createDispute: (data: Omit<Dispute, 'id' | 'status' | 'createdAt'>) => void;
  resolveDispute: (disputeId: string, status: Dispute['status'], resolutionNotes: string) => void;

  // Favorites & Reviews
  favorites: { productIds: string[]; storeIds: string[] };
  toggleFavoriteProduct: (productId: string) => void;
  toggleFavoriteStore: (storeId: string) => void;
  reviews: Review[];
  addReview: (review: Omit<Review, 'id' | 'createdAt' | 'isVerifiedPurchase' | 'isModerated'>) => void;

  // Banners & Settings & Audits
  banners: Banner[];
  updateBanner: (id: string, data: Partial<Banner>) => void;
  addBanner: (banner: Omit<Banner, 'id'>) => void;
  deleteBanner: (id: string) => void;
  systemSettings: SystemSettings;
  updateSystemSettings: (settings: Partial<SystemSettings>) => Promise<boolean>;
  auditLogs: AuditLog[];
  addAuditLog: (action: string, record: string, prev?: string, next?: string) => void;

  // Pasarelas de Pago & Cuenta Receptora Plazado.com
  paymentGateways: PaymentGatewayConfig[];
  activePaymentGateway: PaymentGatewayConfig | null;
  savePaymentGateway: (gateway: PaymentGatewayConfig) => Promise<{ success: boolean; message?: string }>;
  setActivePaymentGateway: (gatewayId: string) => Promise<{ success: boolean; message?: string }>;
  deletePaymentGateway: (gatewayId: string) => Promise<{ success: boolean; message?: string }>;

  // Gestión de Publicidad & Anuncios
  adCampaigns: Advertisement[];
  adPlacements: AdPlacement[];
  createAdCampaign: (ad: Omit<Advertisement, 'id' | 'impressions' | 'clicks' | 'createdAt'>) => Promise<{ success: boolean; message?: string }>;
  updateAdCampaign: (id: string, data: Partial<Advertisement>) => Promise<{ success: boolean; message?: string }>;
  toggleAdCampaignStatus: (id: string) => Promise<{ success: boolean; message?: string }>;
  deleteAdCampaign: (id: string) => Promise<{ success: boolean; message?: string }>;
  saveAdPlacement: (placement: AdPlacement) => Promise<{ success: boolean; message?: string }>;
  trackAdImpression: (adId: string) => void;
  trackAdClick: (adId: string) => void;

  // Super Admin Universal Deletion Permissions
  deleteStore: (storeId: string) => void;
  deleteOrder: (orderId: string) => void;
  deleteSettlement: (settlementId: string) => void;
  deleteDispute: (disputeId: string) => void;
  deleteAuditLog: (logId: string) => void;
  clearAllAuditLogs: () => void;
  deleteReview: (reviewId: string) => void;
  purgeRecordsByType: (type: 'orders' | 'test_products' | 'disputes' | 'settlements' | 'audit_logs') => number;

  // Plazado Fulfillment
  storageRequests: StorageRequest[];
  fulfillmentInventory: FulfillmentInventoryItem[];
  inventoryMovements: InventoryMovementLog[];
  fulfillmentOrders: FulfillmentOrder[];
  fulfillmentIncidences: FulfillmentIncidence[];
  fulfillmentReturns: FulfillmentReturn[];
  fulfillmentWithdrawals: FulfillmentWithdrawal[];
  fulfillmentConfig: FulfillmentConfig;
  createStorageRequest: (data: any) => Promise<boolean>;
  updateStorageRequestStatus: (id: string, status: StorageRequestStatus, notes?: string) => Promise<boolean>;
  processPhysicalReception: (requestId: string, data: any) => Promise<boolean>;
  adjustInventory: (inventoryItemId: string, data: { newAvailable: number; reason: string; notes?: string }) => Promise<boolean>;
  relocateInventory: (inventoryItemId: string, newLocation: WarehouseLocation) => Promise<boolean>;
  blockUnblockInventory: (inventoryItemId: string, quantity: number, action: 'BLOCK' | 'UNBLOCK', reason: string) => Promise<boolean>;
  recordInventoryDamage: (inventoryItemId: string, quantity: number, reason: string, photos?: string[]) => Promise<boolean>;
  confirmOrderByStore: (fulfillmentOrderId: string, storeId: string) => Promise<{ success: boolean; message: string }>;
  rejectOrderByStore: (fulfillmentOrderId: string, storeId: string, reason: string) => Promise<{ success: boolean; message: string }>;
  validateAndPickItem: (fulfillmentOrderId: string, productId: string, scannedSku: string, scannedLocation: string) => Promise<{ success: boolean; error?: string; order?: FulfillmentOrder }>;
  completePacking: (fulfillmentOrderId: string, data: any) => Promise<boolean>;
  dispatchFulfillmentOrder: (fulfillmentOrderId: string, data: any) => Promise<boolean>;
  deliverFulfillmentOrder: (fulfillmentOrderId: string, data: any) => Promise<boolean>;
  createFulfillmentIncidence: (data: any) => Promise<boolean>;
  updateFulfillmentIncidence: (id: string, data: any) => Promise<boolean>;
  createFulfillmentReturn: (data: any) => Promise<boolean>;
  classifyReturn: (returnId: string, data: any) => Promise<boolean>;
  createWithdrawal: (data: any) => Promise<boolean>;
  updateWithdrawalStatus: (id: string, status: string, notes?: string) => Promise<boolean>;
  updateFulfillmentConfig: (config: Partial<FulfillmentConfig>) => Promise<boolean>;

  // Quick Notification Banner
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;

  // Super Admin Direct Store Management / Impersonation & Admin Creation
  adminImpersonatedStoreId: string | null;
  adminImpersonateStore: (storeId: string) => void;
  adminExitImpersonation: () => void;
  createSuperAdminUser: (data: { name: string; email: string; phone: string; password: string }) => Promise<{ success: boolean; message: string }>;
  assignStoreAdmin: (storeId: string, data: { email: string; password: string; name?: string; phone?: string }) => Promise<{ success: boolean; message: string; user?: User }>;
  submitKycVerification: (data: { cedulaNumber: string; cedulaFrontUrl: string; selfieUrl?: string; biometricScore?: number }) => Promise<{ success: boolean; message: string }>;

  // Theme (Dark / Light mode)
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setThemeMode: (mode: 'light' | 'dark') => void;
}

const AppContext = createContext<AppContextType | null>(null);

// Only client-local session & transient device state
const CLIENT_STORAGE_KEYS = {
  SESSION_USER: 'plazado_session_user_id',
  CART: 'plazado_cart_v3',
  FAVORITES: 'plazado_favorites_v3'
};

function getLocalStoredOrDefault<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

/**
 * Genera UNICAMENTE el enlace limpio y directo hacia una tienda oficial de PlazaDO
 */
export const getCleanStoreShareUrl = (store: { slug?: string; id: string }): string => {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const storeKey = (store.slug || store.id || '').trim();
  return `${origin}/tienda/${encodeURIComponent(storeKey)}`;
};

/**
 * Parsea el identificador de tienda desde la URL (query param ?store=, ?tienda=, /store/..., #/store/...)
 */
export const parseStoreFromLocation = (): { storeKey: string | null; view: AppView } => {
  if (typeof window === 'undefined') return { storeKey: null, view: 'home' };
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const storeParam = 
      searchParams.get('store') || 
      searchParams.get('tienda') || 
      searchParams.get('store_id') || 
      searchParams.get('storeId') ||
      searchParams.get('s');
    
    if (storeParam && storeParam.trim()) {
      return { storeKey: decodeURIComponent(storeParam.trim()), view: 'store_public' };
    }

    // Ruta en pathname: /store/slug o /tienda/slug
    const pathname = window.location.pathname;
    const pathMatch = pathname.match(/^\/(?:store|tienda)\/([^\/?#]+)/i);
    if (pathMatch && pathMatch[1]) {
      return { storeKey: decodeURIComponent(pathMatch[1].trim()), view: 'store_public' };
    }

    // Hash: #/store/slug o #/tienda/slug o #store=slug
    const hash = window.location.hash;
    const hashMatch = hash.match(/^#\/?(?:store|tienda)\/([^\/?#]+)/i);
    if (hashMatch && hashMatch[1]) {
      return { storeKey: decodeURIComponent(hashMatch[1].trim()), view: 'store_public' };
    }
    if (hash.includes('store=')) {
      const hashParams = new URLSearchParams(hash.replace(/^#\/?/, ''));
      const hStore = hashParams.get('store') || hashParams.get('tienda');
      if (hStore && hStore.trim()) {
        return { storeKey: decodeURIComponent(hStore.trim()), view: 'store_public' };
      }
    }
  } catch (err) {
    console.error('[PlazaDO] Error parsing store URL parameter:', err);
  }
  return { storeKey: null, view: 'home' };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation states with direct URL deep linking across the unified application
  const initialRoute = parseRouteFromLocation();
  const [currentView, setCurrentView] = useState<AppView>(initialRoute.view);
  const [selectedStoreSlug, setSelectedStoreSlug] = useState<string | null>(initialRoute.storeSlug);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(initialRoute.categorySlug);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(initialRoute.productId);
  const [isBootstrapLoading, setIsBootstrapLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openPolicySlug, setOpenPolicySlug] = useState<string | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [downloadModalTab, setDownloadModalTab] = useState<'app' | 'pdf'>('app');

  // Synchronize browser URL bar dynamically (HTML5 History API)
  useEffect(() => {
    syncBrowserUrl(currentView, selectedStoreSlug, selectedCategorySlug, selectedProductId);
  }, [currentView, selectedStoreSlug, selectedCategorySlug, selectedProductId]);

  // Handle browser Back / Forward history navigation
  useEffect(() => {
    const handlePopState = () => {
      const route = parseRouteFromLocation();
      setCurrentView(route.view);
      setSelectedStoreSlug(route.storeSlug);
      setSelectedCategorySlug(route.categorySlug);
      setSelectedProductId(route.productId);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Central Session & Authentication verification on app mount
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('plazado_auth_token') : null;
    if (token) {
      api.getMe().then(res => {
        if (res.success && res.user) {
          setCurrentUser(res.user);
          localStorage.setItem('plazado_user_profile_cache', JSON.stringify(res.user));
          localStorage.setItem(CLIENT_STORAGE_KEYS.SESSION_USER, res.user.id);
        } else {
          // Token is invalid or expired - wipe all session traces
          setCurrentUser(null);
          localStorage.removeItem('plazado_auth_token');
          localStorage.removeItem('plazado_user_profile_cache');
          localStorage.removeItem(CLIENT_STORAGE_KEYS.SESSION_USER);
        }
      }).catch(() => {
        setCurrentUser(null);
        localStorage.removeItem('plazado_auth_token');
        localStorage.removeItem('plazado_user_profile_cache');
        localStorage.removeItem(CLIENT_STORAGE_KEYS.SESSION_USER);
      });
    } else {
      // No token present - enforce unauthenticated state
      setCurrentUser(null);
      localStorage.removeItem('plazado_user_profile_cache');
      localStorage.removeItem(CLIENT_STORAGE_KEYS.SESSION_USER);
    }
  }, []);

  const openDownloadModal = (tab: 'app' | 'pdf' = 'app') => {
    setDownloadModalTab(tab);
    setIsDownloadModalOpen(true);
  };

  const closeDownloadModal = () => {
    setIsDownloadModalOpen(false);
  };

  const [adminActiveTab, setAdminActiveTab] = useState<AdminTab>('metrics');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Theme (Dark / Light mode) state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('plazado_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('plazado_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('plazado_theme', 'light');
      }
    } catch (e) {
      console.warn('Theme storage error:', e);
    }
  }, [theme]);

  const setThemeMode = (mode: 'light' | 'dark') => {
    setTheme(mode);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Auth Modal states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register_select' | 'register_customer' | 'register_store' | 'verify_email'>('login');
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [pendingPurchaseAction, setPendingPurchaseAction] = useState<{ productId: string; storeId: string; quantity: number } | null>(null);
  const [authPurchaseNotice, setAuthPurchaseNotice] = useState<string | null>(null);

  const openAuthModal = (mode: 'login' | 'register_select' | 'register_customer' | 'register_store' | 'verify_email' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthPurchaseNotice(null);
  };

  // Purge any legacy browser storage cache to guarantee Single Source of Truth
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('plazado_production_cache_v2');
      localStorage.removeItem('plazado_stores_cache');
      localStorage.removeItem('plazado_products_cache');
    } catch (e) {}
  }

  // Central Global State: initialized from server single source of truth
  const [stores, setStores] = useState<Store[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [storeBalances, setStoreBalances] = useState<Record<string, StoreBalance>>({});
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(INITIAL_SETTINGS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<PaymentTransaction[]>([]);
  const [financialAuditLogs, setFinancialAuditLogs] = useState<FinancialAuditLog[]>([]);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGatewayConfig[]>(INITIAL_PAYMENT_GATEWAYS);
  const [adCampaigns, setAdCampaigns] = useState<Advertisement[]>([]);
  const [adPlacements, setAdPlacements] = useState<AdPlacement[]>(INITIAL_AD_PLACEMENTS);
  const [orderMessages, setOrderMessages] = useState<OrderChatMessage[]>([]);
  const [activeChatOrderId, setActiveChatOrderId] = useState<string | null>(null);

  // Plazado Fulfillment States
  const [storageRequests, setStorageRequests] = useState<StorageRequest[]>([]);
  const [fulfillmentInventory, setFulfillmentInventory] = useState<FulfillmentInventoryItem[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovementLog[]>([]);
  const [fulfillmentOrders, setFulfillmentOrders] = useState<FulfillmentOrder[]>([]);
  const [fulfillmentIncidences, setFulfillmentIncidences] = useState<FulfillmentIncidence[]>([]);
  const [fulfillmentReturns, setFulfillmentReturns] = useState<FulfillmentReturn[]>([]);
  const [fulfillmentWithdrawals, setFulfillmentWithdrawals] = useState<FulfillmentWithdrawal[]>([]);
  const [fulfillmentConfig, setFulfillmentConfig] = useState<FulfillmentConfig>({
    orderConfirmationTimeoutMinutes: 60,
    timeoutAction: 'AUTO_CANCEL_RELEASE',
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
        zones: ['Zona A - Almacén General', 'Zona B - Electrónica & Alto Valor', 'Zona C - Moda & Calzado', 'Zona D - Hogar & Frágil'],
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
        zones: ['Zona A - General Norte', 'Zona B - Envíos Rápidos'],
        isActive: true
      }
    ],
    storageFeePerM3PerDay: 15,
    handlingFeePerOrder: 75,
    packagingFee: 45,
    isFulfillmentEnabledGlobally: true
  });

  // Server sync version tracking: start at 0 so initial sync always grabs production records
  const currentVersionRef = useRef<number>(0);
  const isSyncingRef = useRef<boolean>(false);

  // Client device session user - strictly require active plazado_auth_token
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('plazado_auth_token');
    if (!token) {
      localStorage.removeItem('plazado_user_profile_cache');
      localStorage.removeItem(CLIENT_STORAGE_KEYS.SESSION_USER);
      return null;
    }
    try {
      const cached = localStorage.getItem('plazado_user_profile_cache');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return null;
  });

  // Local client device state
  const [favorites, setFavorites] = useState<{ productIds: string[]; storeIds: string[] }>(() => 
    getLocalStoredOrDefault(CLIENT_STORAGE_KEYS.FAVORITES, { productIds: [], storeIds: [] })
  );
  const [cart, setCart] = useState<CartItem[]>(() => getLocalStoredOrDefault(CLIENT_STORAGE_KEYS.CART, []));
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Toast notification helper
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Central state applier directly from server single source of truth
  const applyServerState = useCallback((state: BootstrapResponse, version: number) => {
    currentVersionRef.current = version;
    if (Array.isArray(state.stores)) {
      setStores(state.stores);
    }
    if (Array.isArray(state.products)) {
      setProducts(state.products);
    }
    if (Array.isArray(state.categories)) {
      setCategories(state.categories);
    }
    setUsers(state.users);
    setOrders(state.orders);
    setStoreBalances(state.storeBalances);
    setSettlements(state.settlements);
    setDisputes(state.disputes);
    setBanners(state.banners);
    setCoupons(state.coupons);
    setSystemSettings(state.systemSettings);
    setAuditLogs(state.auditLogs);
    setReviews(state.reviews);
    if (state.paymentTransactions) setPaymentTransactions(state.paymentTransactions);
    if (state.financialAuditLogs) setFinancialAuditLogs(state.financialAuditLogs);
    if (state.paymentGateways && state.paymentGateways.length > 0) setPaymentGateways(state.paymentGateways);
    if (state.advertisements && state.advertisements.length > 0) setAdCampaigns(state.advertisements);
    if (state.adPlacements && state.adPlacements.length > 0) setAdPlacements(state.adPlacements);
    if (state.orderMessages) setOrderMessages(state.orderMessages);
    if (state.storageRequests) setStorageRequests(state.storageRequests);
    if (state.fulfillmentInventory) setFulfillmentInventory(state.fulfillmentInventory);
    if (state.inventoryMovements) setInventoryMovements(state.inventoryMovements);
    if (state.fulfillmentOrders) setFulfillmentOrders(state.fulfillmentOrders);
    if (state.fulfillmentIncidences) setFulfillmentIncidences(state.fulfillmentIncidences);
    if (state.fulfillmentReturns) setFulfillmentReturns(state.fulfillmentReturns);
    if (state.fulfillmentWithdrawals) setFulfillmentWithdrawals(state.fulfillmentWithdrawals);
    if (state.fulfillmentConfig) setFulfillmentConfig(state.fulfillmentConfig);

    // Reconcile current user session ONLY IF a valid auth token is present
    const token = typeof window !== 'undefined' ? localStorage.getItem('plazado_auth_token') : null;
    const savedUserId = typeof window !== 'undefined' ? localStorage.getItem(CLIENT_STORAGE_KEYS.SESSION_USER) : null;
    if (token && savedUserId) {
      const found = state.users.find(u => u.id === savedUserId);
      if (found) {
        setCurrentUser(found);
        try {
          localStorage.setItem('plazado_user_profile_cache', JSON.stringify(found));
        } catch (e) {}
      }
    } else if (!token) {
      setCurrentUser(null);
      localStorage.removeItem('plazado_user_profile_cache');
      localStorage.removeItem(CLIENT_STORAGE_KEYS.SESSION_USER);
    }
  }, []);

  // Hydrate from central backend on mount
  useEffect(() => {
    let mounted = true;

    async function fetchBootstrap() {
      try {
        const res = await api.getBootstrap();
        if (mounted && res && res.data) {
          applyServerState(res.data, res.version || 1);
        }
      } catch (err) {
        console.warn('[PlazaDO Global Sync] Bootstrap fetch warning, using cache/initial:', err);
      } finally {
        if (mounted) {
          setIsBootstrapLoading(false);
        }
      }
    }

    fetchBootstrap();

    return () => {
      mounted = false;
    };
  }, [applyServerState]);

  // Category auto-recovery if needed
  useEffect(() => {
    if (!categories || categories.length === 0) {
      api.getCategories().then(res => {
        if (res.success && Array.isArray(res.categories) && res.categories.length > 0) {
          setCategories(res.categories);
        } else {
          setCategories(INITIAL_CATEGORIES);
        }
      }).catch(() => {
        setCategories(INITIAL_CATEGORIES);
      });
    }
  }, [categories]);

  /**
   * Copia UNICAMENTE el enlace limpio directo a la tienda y notifica al usuario
   */
  const copyStoreShareUrl = async (store: { slug?: string; id: string; name?: string }): Promise<string> => {
    const cleanUrl = getCleanStoreShareUrl(store);
    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(cleanUrl);
        copied = true;
      }
    } catch (e) {
      // fallback
    }
    if (!copied) {
      try {
        const el = document.createElement('textarea');
        el.value = cleanUrl;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        copied = document.execCommand('copy');
        document.body.removeChild(el);
      } catch (e) {}
    }

    // Actualiza la barra del navegador para garantizar consistencia si el usuario la copia manualmente
    if (typeof window !== 'undefined') {
      const storeKey = (store.slug || store.id || '').trim();
      window.history.replaceState({ store: storeKey }, '', cleanUrl);
    }

    showNotification(`Enlace directo de ${store.name || 'la tienda'} copiado al portapapeles`, 'success');
    return cleanUrl;
  };

  const getStoreShareUrl = (store: { slug?: string; id: string }): string => {
    return getCleanStoreShareUrl(store);
  };

  // Real-time synchronization loop across all devices/tabs/browsers
  useEffect(() => {
    let isMounted = true;

    const performSync = async () => {
      if (isSyncingRef.current || !isMounted) return;
      isSyncingRef.current = true;
      try {
        const res = await api.sync(currentVersionRef.current);
        if (isMounted && res.hasUpdates && res.data) {
          applyServerState(res.data, res.version);
        }
      } catch (err) {
        // Silently tolerate background network blip
      } finally {
        isSyncingRef.current = false;
      }
    };

    // Trigger instant check on mount, then poll every 2.5 seconds for instant multi-device synchronization
    performSync();
    const intervalId = setInterval(performSync, 2500);

    // Also trigger instant sync on window/tab focus or when returning to browser
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        performSync();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [applyServerState]);

  // Sync client-only state to local device storage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(CLIENT_STORAGE_KEYS.SESSION_USER, currentUser.id);
      try {
        localStorage.setItem('plazado_user_profile_cache', JSON.stringify(currentUser));
      } catch (e) {}
    }
    // IMPORTANT: Do NOT call localStorage.removeItem(SESSION_USER) here!
    // Null on mount is a transient hydration state. Removal only happens via explicit logout().
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(CLIENT_STORAGE_KEYS.CART, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(CLIENT_STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  }, [favorites]);

  // Dynamic Favicon synchronization with systemSettings
  useEffect(() => {
    try {
      const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
      if (link) {
        if (systemSettings?.faviconType === 'custom' && systemSettings?.faviconUrl) {
          link.href = systemSettings.faviconUrl;
        } else {
          link.href = '/dominican-flag.svg';
        }
      }
    } catch (err) {
      console.error('Error synchronizing favicon:', err);
    }
  }, [systemSettings?.faviconType, systemSettings?.faviconUrl]);

  // Audit helper
  const addAuditLog = async (action: string, record: string, prev?: string, next?: string) => {
    try {
      const user = currentUser ? { id: currentUser.id, name: currentUser.name, role: currentUser.role } : undefined;
      const res = await api.addAuditLog({ action, record, prev, next, user });
      if (res.success && res.log) {
        setAuditLogs(prevLogs => [res.log, ...prevLogs]);
      }
    } catch (e) {
      // Offline fallback
      const fallbackLog: AuditLog = {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        userId: currentUser?.id || 'system',
        userName: currentUser?.name || 'Sistema PlazaDO',
        userRole: currentUser?.role || 'SUPER_ADMIN',
        action,
        affectedRecord: record,
        previousValue: prev,
        newValue: next,
        ipAddress: '190.166.44.12',
        timestamp: new Date().toISOString()
      };
      setAuditLogs(prevLogs => [fallbackLog, ...prevLogs]);
    }
  };

  // Helper to verify Super Admin authority
  const isSuperAdminEmail = (email?: string) => {
    if (!email) return false;
    const e = email.toLowerCase().trim();
    return e === 'luis.jimenez@msn.com' || e === 'luiss.jimeness@gmail.com';
  };

  // RBAC Persona Switcher (Disabled in production to enforce strict password authentication)
  const switchPersona = (_role: UserRole, _storeId?: string) => {
    showNotification('Para cambiar de usuario debes autenticarte ingresando tu correo y contraseña.', 'info');
    setIsAuthModalOpen(true);
  };

  // Global Centralized Login
  const login = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    // 1. Password must be a non-empty string
    if (!pass || typeof pass !== 'string' || pass.length === 0) {
      setCurrentUser(null);
      localStorage.removeItem('plazado_auth_token');
      localStorage.removeItem('plazado_user_profile_cache');
      localStorage.removeItem(CLIENT_STORAGE_KEYS.SESSION_USER);
      return { success: false, message: 'La contraseña es requerida.' };
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setCurrentUser(null);
      localStorage.removeItem('plazado_auth_token');
      localStorage.removeItem('plazado_user_profile_cache');
      localStorage.removeItem(CLIENT_STORAGE_KEYS.SESSION_USER);
      return { success: false, message: 'El correo electrónico es requerido.' };
    }

    try {
      const res = await api.login(cleanEmail, pass);
      if (!res.success || !res.user || !res.token) {
        // Enforce Section 8: Una autenticación fallida jamás debe heredar una sesión previamente autenticada.
        // Si se intenta iniciar sesión con contraseña incorrecta: NO TOKEN, NO NUEVA SESIÓN, NO ACCESO.
        setCurrentUser(null);
        localStorage.removeItem('plazado_auth_token');
        localStorage.removeItem('plazado_user_profile_cache');
        localStorage.removeItem(CLIENT_STORAGE_KEYS.SESSION_USER);
        return { success: false, message: res.message || 'Credenciales inválidas' };
      }

      const user = res.user;
      localStorage.setItem('plazado_auth_token', res.token);
      localStorage.setItem('plazado_user_profile_cache', JSON.stringify(user));
      localStorage.setItem(CLIENT_STORAGE_KEYS.SESSION_USER, user.id);
      setCurrentUser(user);
      setIsAuthModalOpen(false);

      // Handle pending purchase continuation if user was trying to buy
      if (pendingPurchaseAction) {
        const targetProd = products.find(p => p.id === pendingPurchaseAction.productId);
        if (targetProd && targetProd.stock > 0) {
          setCart(prev => {
            const existingIndex = prev.findIndex(item => item.productId === pendingPurchaseAction.productId);
            if (existingIndex > -1) {
              const newQty = Math.min(targetProd.stock, prev[existingIndex].quantity + pendingPurchaseAction.quantity);
              const updated = [...prev];
              updated[existingIndex].quantity = newQty;
              return updated;
            } else {
              return [...prev, {
                productId: pendingPurchaseAction.productId,
                storeId: pendingPurchaseAction.storeId,
                quantity: Math.min(targetProd.stock, pendingPurchaseAction.quantity),
                addedAt: new Date().toISOString()
              }];
            }
          });
          showNotification(`¡Sesión iniciada! Añadimos "${targetProd.name}" a tu carrito para continuar tu compra`, 'success');
        }
        setPendingPurchaseAction(null);
        setAuthPurchaseNotice(null);
        return { success: true };
      }

      // Automatic role redirection
      if (user.role === 'SUPER_ADMIN') {
        setCurrentView('admin_dashboard');
        showNotification(`Bienvenido, Super Administrador (${user.name})`);
      } else if (user.role === 'STORE_OWNER') {
        setCurrentView('store_dashboard');
        const store = stores.find(s => s.id === user.storeId);
        showNotification(`Bienvenido al panel de tu tienda: ${store ? store.name : 'Vendedor'}`);
      } else {
        setCurrentView('home');
        showNotification(`Bienvenido a PlazaDO, ${user.name}`);
      }

      return { success: true };
    } catch (err: any) {
      setCurrentUser(null);
      localStorage.removeItem('plazado_auth_token');
      localStorage.removeItem('plazado_user_profile_cache');
      localStorage.removeItem(CLIENT_STORAGE_KEYS.SESSION_USER);
      return { success: false, message: err.message || 'Error de conexión con el servidor central' };
    }
  };

  // Logout
  const logout = () => {
    setCurrentUser(null);
    setPendingPurchaseAction(null);
    setAuthPurchaseNotice(null);
    localStorage.removeItem(CLIENT_STORAGE_KEYS.SESSION_USER);
    localStorage.removeItem('plazado_auth_token');
    try {
      localStorage.removeItem('plazado_user_profile_cache');
    } catch (e) {}
    setCurrentView('home');
    showNotification('Has cerrado sesión correctamente');
  };

  // Verification operations
  const verifyCode = async (email: string, code: string): Promise<{ success: boolean; message?: string; user?: User }> => {
    try {
      const res = await api.verifyCode(email, code);
      if (!res.success) {
        return { success: false, message: res.message || 'Código incorrecto' };
      }
      if (res.token && res.user) {
        localStorage.setItem('plazado_auth_token', res.token);
        setCurrentUser(res.user);
        setUsers(prev => [...prev.filter(u => u.id !== res.user!.id), res.user!]);
        setIsAuthModalOpen(false);
        setPendingVerificationEmail(null);
        showNotification('¡Cuenta y correo electrónico verificados exitosamente!', 'success');
      } else {
        setPendingVerificationEmail(null);
        setAuthModalMode('login');
        showNotification('¡Cuenta verificada! Ingresa tu correo y contraseña para iniciar sesión.', 'success');
      }
      return { success: true, message: res.message, user: res.user };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error verificando código' };
    }
  };

  const resendVerificationCode = async (email: string): Promise<{ success: boolean; message?: string; remainingSeconds?: number }> => {
    try {
      const res = await api.resendVerificationCode(email);
      if (res.success) {
        showNotification(res.message || 'Código reenviado a tu correo desde contacto@plazado.com', 'success');
        return { success: true, message: res.message };
      } else {
        return { success: false, message: res.message, remainingSeconds: (res as any).remainingSeconds };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Error reenviando código' };
    }
  };

  // Customer Registration (Centralized)
  const registerCustomer = async (data: CustomerRegistrationInput): Promise<{ success: boolean; message?: string; pendingVerification?: boolean; email?: string }> => {
    try {
      const res = await api.registerCustomer(data);
      if (!res.success) {
        return { success: false, message: res.message || 'Error registrando cliente' };
      }

      if (res.pendingVerification) {
        const targetEmail = res.email || data.email;
        setPendingVerificationEmail(targetEmail);
        setAuthModalMode('verify_email');
        showNotification(res.message || `Código enviado a ${targetEmail} desde contacto@plazado.com`, 'info');
        return { success: true, pendingVerification: true, email: targetEmail, message: res.message };
      }

      if (res.user) {
        const newCustomer = res.user;
        if (res.token) {
          localStorage.setItem('plazado_auth_token', res.token);
        }
        setUsers(prev => [...prev.filter(u => u.id !== newCustomer.id), newCustomer]);
        setCurrentUser(newCustomer);
        setIsAuthModalOpen(false);

        if (pendingPurchaseAction) {
          const targetProd = products.find(p => p.id === pendingPurchaseAction.productId);
          if (targetProd && targetProd.stock > 0) {
            setCart(prev => [...prev, {
              productId: pendingPurchaseAction.productId,
              storeId: pendingPurchaseAction.storeId,
              quantity: Math.min(targetProd.stock, pendingPurchaseAction.quantity),
              addedAt: new Date().toISOString()
            }]);
            showNotification(`¡Bienvenido/a a PlazaDO! Añadimos "${targetProd.name}" a tu carrito`, 'success');
          }
          setPendingPurchaseAction(null);
          setAuthPurchaseNotice(null);
        } else {
          setCurrentView('home');
          showNotification(`¡Bienvenido/a a PlazaDO, ${newCustomer.name}! Tu cuenta ha sido creada.`);
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error registrando cuenta' };
    }
  };

  // Store Registration (Centralized in Global Database)
  const registerStoreAccount = async (data: StoreRegistrationInput): Promise<{ success: boolean; storeId?: string; message?: string; pendingVerification?: boolean; email?: string }> => {
    try {
      const res = await api.registerStore(data);
      if (!res.success) {
        return { success: false, message: res.message || 'Error registrando tienda' };
      }

      if (res.pendingVerification) {
        const targetEmail = res.email || data.email;
        setPendingVerificationEmail(targetEmail);
        setAuthModalMode('verify_email');
        showNotification(res.message || `Código de verificación enviado a ${targetEmail} desde contacto@plazado.com`, 'info');
        return { success: true, pendingVerification: true, email: targetEmail, message: res.message };
      }

      if (res.store && res.user) {
        if (res.token) {
          localStorage.setItem('plazado_auth_token', res.token);
        }
        setStores(prev => [res.store!, ...prev.filter(s => s.id !== res.store!.id)]);
        setUsers(prev => [...prev.filter(u => u.id !== res.user!.id), res.user!]);
        setCurrentUser(res.user!);
        if (res.version) {
          currentVersionRef.current = res.version;
        }
        setIsAuthModalOpen(false);
        setCurrentView('store_dashboard');
        showNotification(`¡Tienda "${res.store.name}" registrada en PlazaDO!`);
        return { success: true, storeId: res.store.id };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error registrando tienda en el servidor global' };
    }
  };

  // User Profile Updates
  const updateUserProfile = async (data: Partial<User>) => {
    if (!currentUser) return;
    if (isSuperAdminEmail(currentUser.email) && data.role && data.role !== 'SUPER_ADMIN') {
      showNotification('Operación bloqueada: La cuenta del Super Administrador no puede convertirse a otro rol', 'error');
      return;
    }

    try {
      const res = await api.updateUser(currentUser.id, data);
      if (res.success && res.user) {
        setUsers(prev => prev.map(u => u.id === currentUser.id ? res.user : u));
        setCurrentUser(res.user);
        showNotification('Perfil actualizado correctamente');
      }
    } catch (err) {
      // Optimistic update
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...data } : u));
      setCurrentUser(prev => prev ? { ...prev, ...data } : null);
    }
  };

  const addCustomerAddress = async (newAddr: Omit<CustomerAddress, 'id'>): Promise<CustomerAddress | null> => {
    if (!currentUser) {
      showNotification('Debes iniciar sesión para registrar una dirección', 'error');
      return null;
    }
    const id = `addr-${Date.now()}`;
    const currentList = currentUser.addresses || [];
    const isFirst = currentList.length === 0;
    const shouldBeDefault = newAddr.isDefault !== undefined ? newAddr.isDefault : isFirst;

    const address: CustomerAddress = {
      ...newAddr,
      id,
      userId: currentUser.id,
      isDefault: shouldBeDefault,
      createdAt: new Date().toISOString()
    };

    let updatedAddresses = currentList.map(a => 
      shouldBeDefault ? { ...a, isDefault: false } : a
    );
    updatedAddresses = [address, ...updatedAddresses];

    await updateUserProfile({ addresses: updatedAddresses });
    showNotification(`Dirección "${address.label || 'de entrega'}" registrada con éxito`, 'success');
    return address;
  };

  const updateCustomerAddress = async (addressId: string, updatedData: Partial<CustomerAddress>): Promise<boolean> => {
    if (!currentUser) return false;
    const currentList = currentUser.addresses || [];
    const target = currentList.find(a => a.id === addressId);
    if (!target) return false;

    const willBeDefault = updatedData.isDefault;

    const updatedAddresses = currentList.map(a => {
      if (a.id === addressId) {
        return {
          ...a,
          ...updatedData,
          updatedAt: new Date().toISOString(),
          isDefault: willBeDefault !== undefined ? willBeDefault : a.isDefault
        };
      }
      if (willBeDefault) {
        return { ...a, isDefault: false };
      }
      return a;
    });

    await updateUserProfile({ addresses: updatedAddresses });
    showNotification('Dirección actualizada correctamente', 'success');
    return true;
  };

  const deleteCustomerAddress = async (addressId: string): Promise<boolean> => {
    if (!currentUser) return false;
    const currentList = currentUser.addresses || [];
    const target = currentList.find(a => a.id === addressId);
    if (!target) return false;

    let remaining = currentList.filter(a => a.id !== addressId);
    if (target.isDefault && remaining.length > 0) {
      remaining = remaining.map((a, idx) => idx === 0 ? { ...a, isDefault: true } : a);
    }

    await updateUserProfile({ addresses: remaining });
    showNotification('Dirección eliminada de tu cuenta', 'info');
    return true;
  };

  const setDefaultAddress = async (addressId: string): Promise<boolean> => {
    if (!currentUser) return false;
    const updated = (currentUser.addresses || []).map(a => ({ ...a, isDefault: a.id === addressId }));
    await updateUserProfile({ addresses: updated });
    showNotification('Dirección establecida como principal', 'success');
    return true;
  };

  const deleteUser = async (userId: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede eliminar usuarios', 'error');
      return;
    }
    if (currentUser.id === userId) {
      showNotification('Operación bloqueada: No puedes eliminar tu propio usuario en sesión activa', 'error');
      return;
    }

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    try {
      await api.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
      showNotification(`Usuario "${targetUser.name}" (${targetUser.email}) eliminado de la plataforma`);
    } catch (err) {
      showNotification('Error al eliminar usuario en el servidor central', 'error');
    }
  };

  const deleteMyAccount = async (password?: string, deleteAssociatedStore: boolean = false): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: 'No hay una sesión activa' };
    }
    if (currentUser.role === 'SUPER_ADMIN') {
      showNotification('Operación bloqueada: Las cuentas de Super Administrador están protegidas y no pueden ser eliminadas.', 'error');
      return { success: false, message: 'Las cuentas de Super Administrador están protegidas y no pueden ser eliminadas.' };
    }

    try {
      const res = await api.deleteAccount(currentUser.id, password, deleteAssociatedStore);
      if (res.success) {
        const uId = currentUser.id;
        const stId = currentUser.storeId;
        logout();
        setUsers(prev => prev.filter(u => u.id !== uId));
        if (deleteAssociatedStore && stId) {
          setStores(prev => prev.filter(s => s.id !== stId));
          setProducts(prev => prev.filter(p => p.storeId !== stId));
        }
        showNotification(res.message || 'Tu cuenta ha sido eliminada permanentemente.', 'info');
        return { success: true, message: res.message };
      } else {
        showNotification(res.message || 'Error al eliminar cuenta', 'error');
        return { success: false, message: res.message || 'Error al procesar solicitud' };
      }
    } catch (e: any) {
      const msg = e.message || 'Error al eliminar cuenta';
      showNotification(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const deleteMyStore = async (storeId: string, confirmationText: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser) {
      return { success: false, message: 'No hay una sesión activa' };
    }
    try {
      const res = await api.deleteMerchantStore(storeId, currentUser.id, confirmationText);
      if (res.success) {
        setStores(prev => prev.filter(s => s.id !== storeId));
        setProducts(prev => prev.filter(p => p.storeId !== storeId));
        setCart(prev => prev.filter(item => item.storeId !== storeId));
        if (currentUser.storeId === storeId) {
          const updatedUser: User = { ...currentUser, storeId: undefined, role: 'CUSTOMER' };
          setCurrentUser(updatedUser);
          localStorage.setItem('plazado_user', JSON.stringify(updatedUser));
        }
        showNotification(res.message || 'La tienda ha sido eliminada permanentemente.', 'info');
        return { success: true, message: res.message };
      } else {
        showNotification(res.message || 'Error al eliminar tienda', 'error');
        return { success: false, message: res.message };
      }
    } catch (e: any) {
      const msg = e.message || 'Error al eliminar tienda';
      showNotification(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const setUserPassword = async (userId: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede modificar contraseñas de usuarios', 'error');
      return { success: false, message: 'Acceso denegado: Se requiere rol de Super Administrador' };
    }
    const cleanPassword = (newPassword || '').trim();
    if (!cleanPassword || cleanPassword.length < 6) {
      showNotification('La contraseña debe contener al menos 6 caracteres', 'error');
      return { success: false, message: 'La contraseña debe contener al menos 6 caracteres' };
    }

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) {
      showNotification('Usuario no encontrado', 'error');
      return { success: false, message: 'Usuario no encontrado' };
    }

    try {
      const res = await api.updateUserPassword(userId, cleanPassword);
      if (res.success) {
        if (res.user) {
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...res.user } : u));
          if (currentUser.id === userId) {
            setCurrentUser(prev => prev ? { ...prev, ...res.user } : null);
          }
        }
        await addAuditLog('SUPER_ADMIN_PASSWORD_CHANGE', userId, undefined, `Super Admin asignó nueva contraseña para ${targetUser.email} (${targetUser.role})`);
        showNotification(`¡Contraseña actualizada exitosamente para ${targetUser.name} (${targetUser.email})!`, 'success');
        return { success: true };
      } else {
        showNotification(res.message || 'Error al actualizar contraseña', 'error');
        return { success: false, message: res.message };
      }
    } catch (err: any) {
      showNotification(err.message || 'Error de conexión con el servidor', 'error');
      return { success: false, message: err.message };
    }
  };

  // --- STORES OPERATIONS (Global) ---
  const registerStore = (storeData: Omit<Store, 'id' | 'status' | 'rating' | 'reviewCount' | 'salesCount' | 'createdAt'>): string => {
    const tempId = `store-${Date.now()}`;
    const ownerId = storeData.ownerId || (storeData as any).owner_id || currentUser?.id || `owner-${tempId}`;

    const storePayload: Store = {
      ...storeData,
      id: tempId,
      ownerId,
      owner_id: ownerId,
      status: 'APPROVED',
      isPublished: true,
      rating: 5.0,
      reviewCount: 0,
      salesCount: 0,
      createdAt: new Date().toISOString()
    };

    setStores(prev => [storePayload, ...prev.filter(s => s.id !== tempId)]);

    api.createStore(storePayload).then(res => {
      if (res.success && res.store) {
        setStores(prev => [res.store, ...prev.filter(s => s.id !== tempId && s.id !== res.store.id)]);
        if (res.version) {
          currentVersionRef.current = res.version;
        }
      }
    }).catch(err => {
      console.error('[PlazaDO Global Sync] Error guardando tienda en base de datos global:', err);
    });

    showNotification(`Tienda "${storeData.name}" registrada y publicada en el catálogo global de PlazaDO.`, 'success');
    return tempId;
  };

  const updateStoreStatus = async (storeId: string, status: Store['status'], reason?: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede cambiar el estado de una tienda', 'error');
      return;
    }
    const store = stores.find(s => s.id === storeId);
    if (!store) return;

    try {
      const res = await api.updateStoreStatus(storeId, status as StoreStatus, reason);
      if (res.success && res.store) {
        setStores(prev => prev.map(s => s.id === storeId ? res.store : s));
      }
    } catch (e) {
      // Optimistic
      const isPublished = status === 'APPROVED' || status === 'active';
      setStores(prev => prev.map(s => s.id === storeId ? { ...s, status, isPublished, rejectionReason: reason } : s));
    }

    if (status === 'APPROVED' || status === 'active') {
      showNotification(`¡Tienda "${store.name}" APROBADA y publicada globalmente!`, 'success');
    } else if (status === 'REJECTED') {
      showNotification(`Solicitud de la tienda "${store.name}" rechazada.`, 'info');
    } else {
      showNotification(`Estado de la tienda ${store.name} actualizado a: ${status}`);
    }
  };

  const updateStoreDetails = async (storeId: string, data: Partial<Store>) => {
    if (currentUser?.role === 'STORE_OWNER' && currentUser?.storeId !== storeId) {
      showNotification('Violación de seguridad: No tienes permiso para editar esta tienda', 'error');
      return;
    }

    try {
      const res = await api.updateStore(storeId, data);
      if (res.success && res.store) {
        setStores(prev => prev.map(s => s.id === storeId ? res.store : s));
      }
    } catch (e) {
      setStores(prev => prev.map(s => s.id === storeId ? { ...s, ...data } : s));
    }
    showNotification('Configuración de la tienda guardada en la base de datos global');
  };

  const toggleStorePublish = async (storeId: string) => {
    if (currentUser?.role !== 'SUPER_ADMIN' && (currentUser?.role !== 'STORE_OWNER' || currentUser?.storeId !== storeId)) {
      showNotification('Violación de seguridad: No tienes permiso para editar esta tienda', 'error');
      return;
    }

    const store = stores.find(s => s.id === storeId);
    if (!store) return;

    try {
      const res = await api.toggleStorePublish(storeId);
      if (res.success && res.store) {
        setStores(prev => prev.map(s => s.id === storeId ? res.store : s));
        showNotification(res.store.isPublished ? `Tienda "${store.name}" publicada globalmente` : `Tienda "${store.name}" despublicada`, res.store.isPublished ? 'success' : 'info');
      }
    } catch (e) {
      const currentlyVisible = isStorePubliclyVisible(store);
      const nextPublished = !currentlyVisible;
      const nextStatus = nextPublished ? 'APPROVED' : 'INACTIVE';
      setStores(prev => prev.map(s => s.id === storeId ? { ...s, isPublished: nextPublished, status: nextStatus as StoreStatus } : s));
    }
  };

  const deleteStore = async (storeId: string) => {
    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && currentUser.storeId !== storeId)) {
      showNotification('Acceso denegado: No tienes permiso para eliminar esta tienda', 'error');
      return;
    }
    const store = stores.find(s => s.id === storeId);
    if (!store) return;

    try {
      await api.deleteStore(storeId);
      setStores(prev => prev.filter(s => s.id !== storeId));
      setProducts(prev => prev.filter(p => p.storeId !== storeId));
      setCart(prev => prev.filter(item => item.storeId !== storeId));
      if (currentUser.storeId === storeId) {
        const updatedUser: User = { ...currentUser, storeId: undefined, role: 'CUSTOMER' };
        setCurrentUser(updatedUser);
        localStorage.setItem('plazado_user', JSON.stringify(updatedUser));
      }
      showNotification(`Tienda "${store.name}" y sus productos fueron eliminados de la plataforma global`);
    } catch (e) {
      showNotification('Error al eliminar tienda del servidor central', 'error');
    }
  };

  // --- PRODUCTS OPERATIONS (Global) ---
  const addProduct = async (productData: Omit<Product, 'id' | 'storeId' | 'reservedStock' | 'soldCount' | 'rating' | 'reviewCount' | 'createdAt'>) => {
    const storeId = currentUser?.role === 'STORE_OWNER' ? currentUser.storeId : (stores[0]?.id || 'store-techzone');
    if (!storeId) {
      showNotification('Error: Debes ser una tienda activa para agregar productos', 'error');
      return;
    }

    try {
      const res = await api.createProduct({ ...productData, storeId });
      if (res.success && res.product) {
        setProducts(prev => [res.product, ...prev]);
        showNotification(`Producto "${res.product.name}" publicado en el catálogo global`);
      }
    } catch (e) {
      const tempId = `prod-${Date.now()}`;
      const optimisticProd: Product = {
        ...productData,
        id: tempId,
        storeId,
        reservedStock: 0,
        soldCount: 0,
        rating: 5.0,
        reviewCount: 0,
        createdAt: new Date().toISOString()
      };
      setProducts(prev => [optimisticProd, ...prev]);
      showNotification(`Producto "${optimisticProd.name}" publicado`);
    }
  };

  const updateProduct = async (productId: string, data: Partial<Product>) => {
    const existing = products.find(p => p.id === productId);
    if (!existing) return;

    if (currentUser?.role === 'STORE_OWNER' && currentUser?.storeId !== existing.storeId) {
      showNotification('Violación de seguridad: No puedes modificar productos de otra tienda', 'error');
      return;
    }

    try {
      const res = await api.updateProduct(productId, data);
      if (res.success && res.product) {
        setProducts(prev => prev.map(p => p.id === productId ? res.product : p));
      }
    } catch (e) {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...data } : p));
    }
    showNotification('Producto actualizado globalmente');
  };

  const deleteProduct = async (productId: string) => {
    const existing = products.find(p => p.id === productId);
    if (!existing) return;

    if (currentUser?.role !== 'SUPER_ADMIN' && currentUser?.role === 'STORE_OWNER' && currentUser?.storeId !== existing.storeId) {
      showNotification('Violación de seguridad: No puedes eliminar productos de otra tienda', 'error');
      return;
    }

    try {
      await api.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      showNotification(`Producto "${existing.name}" eliminado del catálogo global`);
    } catch (e) {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  };

  const cleanTestProducts = (): number => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede ejecutar la limpieza', 'error');
      return 0;
    }

    const testProducts = products.filter(p => p.isTestProduct || p.name.toLowerCase().includes('test') || p.name.toLowerCase().includes('prueba'));
    api.cleanTestProducts().then(res => {
      if (res.success) {
        setProducts(prev => prev.filter(p => !testProducts.some(tp => tp.id === p.id)));
      }
    }).catch(console.error);

    setProducts(prev => prev.filter(p => !testProducts.some(tp => tp.id === p.id)));
    showNotification(`Se limpiaron ${testProducts.length} productos de prueba manteniendo la integridad global`);
    return testProducts.length;
  };

  // --- CATEGORIES OPERATIONS (Global) ---
  const addCategory = async (categoryData: Omit<Category, 'id'>) => {
    try {
      const res = await api.createCategory(categoryData);
      if (res.success && res.category) {
        setCategories(prev => [...prev, res.category]);
        showNotification(`Categoría "${res.category.name}" agregada`);
      }
    } catch (e) {
      const newCat: Category = { ...categoryData, id: `cat-${Date.now()}` };
      setCategories(prev => [...prev, newCat]);
    }
  };

  const updateCategory = async (categoryId: string, data: Partial<Category>) => {
    try {
      const res = await api.updateCategory(categoryId, data);
      if (res.success && res.category) {
        setCategories(prev => prev.map(c => c.id === categoryId ? res.category : c));
      }
    } catch (e) {
      setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, ...data } : c));
    }
    showNotification('Categoría actualizada globalmente');
  };

  const deleteCategory = async (categoryId: string) => {
    try {
      await api.deleteCategory(categoryId);
      setCategories(prev => prev.filter(c => c.id !== categoryId));
      showNotification('Categoría eliminada globalmente');
    } catch (e) {
      setCategories(prev => prev.filter(c => c.id !== categoryId));
    }
  };

  const mergeCategories = async (sourceId: string, targetId: string) => {
    const source = categories.find(c => c.id === sourceId);
    const target = categories.find(c => c.id === targetId);
    if (!source || !target) return;

    try {
      await api.mergeCategories(sourceId, targetId);
      // Migrate locally
      setProducts(prev => prev.map(p => {
        if (p.categoryId === sourceId) return { ...p, categoryId: targetId };
        if (p.subcategoryId === sourceId) return { ...p, subcategoryId: targetId };
        return p;
      }));
      setCategories(prev => prev.filter(c => c.id !== sourceId));
      showNotification(`Categoría "${source.name}" fusionada con éxito en "${target.name}".`);
    } catch (e) {
      showNotification('Error al fusionar categorías', 'error');
    }
  };

  // --- CART OPERATIONS ---
  const addToCart = (productId: string, storeId: string, quantity = 1) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (product.stock <= 0) {
      showNotification('Este producto se encuentra actualmente agotado', 'error');
      return;
    }

    if (!currentUser) {
      setPendingPurchaseAction({ productId, storeId, quantity });
      setAuthPurchaseNotice('Para realizar tu compra debes iniciar sesión o crear una cuenta.');
      openAuthModal('login');
      return;
    }

    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.productId === productId);
      if (existingIndex > -1) {
        const newQty = prev[existingIndex].quantity + quantity;
        if (newQty > product.stock) {
          showNotification(`Solo hay ${product.stock} unidades disponibles en inventario`, 'error');
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex].quantity = newQty;
        return updated;
      } else {
        return [...prev, { productId, storeId, quantity, addedAt: new Date().toISOString() }];
      }
    });

    showNotification(`"${product.name}" agregado al carrito`);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const product = products.find(p => p.id === productId);
    if (product && quantity > product.stock) {
      showNotification(`Solo hay ${product.stock} unidades en stock`, 'error');
      return;
    }
    setCart(prev => prev.map(item => item.productId === productId ? { ...item, quantity } : item));
  };

  const clearCart = () => setCart([]);

  const getCartGroups = (): CartStoreGroup[] => {
    const storeMap = new Map<string, { cartItem: CartItem; product: Product }[]>();

    cart.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        const list = storeMap.get(item.storeId) || [];
        list.push({ cartItem: item, product: prod });
        storeMap.set(item.storeId, list);
      }
    });

    const groups: CartStoreGroup[] = [];

    storeMap.forEach((items, storeId) => {
      const store = stores.find(s => s.id === storeId) || ({
        id: storeId,
        name: 'Tienda Asociada',
        slug: storeId,
        shippingConfig: { type: 'fixed', fixedRate: 200, estimatedDays: '24-48 horas', coverageProvinces: [] }
      } as unknown as Store);

      const subtotal = items.reduce((sum, i) => {
        const price = i.product.promoPrice || i.product.price;
        return sum + (price * i.cartItem.quantity);
      }, 0);

      const freeThreshold = store.shippingConfig?.freeShippingThreshold;
      const freeShippingQualified = !!(freeThreshold && subtotal >= freeThreshold);
      const shippingCost = freeShippingQualified ? 0 : (store.shippingConfig?.fixedRate || 200);

      groups.push({
        store,
        items,
        subtotal,
        shippingCost,
        storeTotal: subtotal + shippingCost,
        freeShippingQualified,
        freeShippingThreshold: freeThreshold
      });
    });

    return groups;
  };

  const cartGroups = getCartGroups();
  const itemsCount = cart.reduce((sum, i) => sum + i.quantity, 0);
  const rawSubtotal = cartGroups.reduce((sum, g) => sum + g.subtotal, 0);
  const rawShipping = cartGroups.reduce((sum, g) => sum + g.shippingCost, 0);
  
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'PERCENT') {
      discountAmount = (rawSubtotal * appliedCoupon.discountValue) / 100;
    } else {
      discountAmount = appliedCoupon.discountValue;
    }
    if (discountAmount > rawSubtotal) discountAmount = rawSubtotal;
  }

  const cartTotal = {
    itemsCount,
    subtotal: rawSubtotal,
    shippingTotal: rawShipping,
    discountTotal: discountAmount,
    grandTotal: Math.max(0, rawSubtotal + rawShipping - discountAmount)
  };

  const applyCoupon = (code: string) => {
    const coupon = coupons.find(c => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive);
    if (!coupon) {
      return { success: false, message: 'Cupón no válido o expirado' };
    }
    if (coupon.minSpend && rawSubtotal < coupon.minSpend) {
      return { success: false, message: `Monto mínimo de compra para este cupón: RD$ ${coupon.minSpend.toLocaleString()}` };
    }
    setAppliedCoupon(coupon);
    return { success: true, message: `Cupón ${coupon.code} aplicado con éxito` };
  };

  const removeCoupon = () => setAppliedCoupon(null);

  // --- ORDERS & CHECKOUT (Centralized) ---
  const processCheckout = (
    address: CustomerAddress, 
    paymentMethod: PaymentMethodType, 
    notes?: string,
    simulatedCard?: { number: string; expiry: string; cvc: string; holder?: string }
  ) => {
    if (cart.length === 0) {
      return { success: false, orderIds: [], orderGroupCode: '', error: 'El carrito está vacío' };
    }

    const groups = getCartGroups();
    const orderGroupCode = `CHK-${Math.floor(1000 + Math.random() * 9000)}`;
    const createdOrderIds: string[] = [];
    // Comisión de Plazado.com centralizada (0.05% = 0.0005)
    const commissionRate = typeof systemSettings.plazaCommissionRate === 'number' 
      ? systemSettings.plazaCommissionRate 
      : 0.0005;

    // Verify stock availability
    for (const group of groups) {
      for (const item of group.items) {
        if (item.cartItem.quantity > item.product.stock) {
          return {
            success: false,
            orderIds: [],
            orderGroupCode: '',
            error: `Inventario insuficiente para "${item.product.name}". Disponible: ${item.product.stock}`
          };
        }
      }
    }

    const isCard = paymentMethod === 'CARD_AZUL';
    const cleanCard = (simulatedCard?.number || '4111222233334444').replace(/\s+/g, '');
    const cardLast4 = cleanCard.slice(-4) || '4444';
    const cardBrand = cleanCard.startsWith('4') ? 'VISA' : cleanCard.startsWith('5') ? 'MASTERCARD' : 'TARJETA';
    const authCode = `AUTH-AUTO-${Math.floor(100000 + Math.random() * 900000)}`;
    const chargedAt = new Date().toISOString();

    const newOrders: Order[] = [];
    const newTransactions: PaymentTransaction[] = [];

    groups.forEach((group, idx) => {
      const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}-${idx + 1}`;
      createdOrderIds.push(orderId);

      const deliveryConfirmationCode = Math.floor(100000 + Math.random() * 900000).toString();
      // Comisión = Monto de la venta * 0.0005
      // Monto neto tienda = Monto de la venta - Comisión
      const commissionAmount = Number((group.storeTotal * commissionRate).toFixed(2));
      const storeNetEarnings = Number((group.storeTotal - commissionAmount).toFixed(2));

      const newOrder: Order = {
        id: orderId,
        orderGroupCode,
        customerId: currentUser ? currentUser.id : `guest-${Date.now()}`,
        customerName: currentUser ? currentUser.name : address.recipientName,
        customerEmail: currentUser ? currentUser.email : 'comprador@plazado.com',
        customerPhone: address.phone || (currentUser?.phone || ''),
        storeId: group.store.id,
        storeName: group.store.name,
        items: group.items.map(i => ({
          productId: i.product.id,
          productName: i.product.name,
          productImage: i.product.images[0] || '',
          sku: i.product.sku,
          price: i.product.promoPrice || i.product.price,
          quantity: i.cartItem.quantity
        })),
        subtotal: group.subtotal,
        shippingCost: group.shippingCost,
        discount: 0,
        total: group.storeTotal,
        plazaCommissionRate: commissionRate,
        plazaCommissionAmount: commissionAmount,
        storeNetEarnings,
        status: 'PENDING',
        paymentMethod,
        paymentStatus: isCard ? 'PAID' : 'PENDING',
        cardLast4: isCard ? cardLast4 : undefined,
        cardBrand: isCard ? cardBrand : undefined,
        cardAuthorizationCode: isCard ? authCode : undefined,
        cardChargedAt: isCard ? chargedAt : undefined,
        chargeType: isCard ? 'AUTOMATIC' : undefined,
        deliveryConfirmationCode,
        deliveryAddress: { ...address },
        customerNotes: notes,
        statusHistory: [
          {
            status: 'PENDING',
            timestamp: chargedAt,
            updatedBy: currentUser ? `Cliente (${currentUser.name})` : `Cliente (${address.recipientName})`,
            note: isCard
              ? `Cargo automático aprobado de RD$ ${group.storeTotal.toLocaleString()} a tarjeta ${cardBrand} ••••${cardLast4} (Aut: ${authCode}). Fondos recibidos en custodia de Plazado.com.`
              : `Pedido generado en checkout multi-tienda ${orderGroupCode}`
          }
        ],
        settlementStatus: 'PENDING',
        createdAt: chargedAt
      };

      newOrders.push(newOrder);

      // Registrar transacción financiera vinculada
      const tx: PaymentTransaction = {
        id: `TX-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        orderId,
        orderGroupCode,
        customerId: newOrder.customerId,
        customerName: newOrder.customerName,
        storeId: group.store.id,
        storeName: group.store.name,
        amount: group.storeTotal,
        method: paymentMethod,
        commissionAmount,
        netAmount: storeNetEarnings,
        orderStatus: 'PENDING',
        paymentStatus: isCard ? 'PAID' : 'PENDING',
        settlementStatus: 'PENDING',
        gatewayReference: isCard ? `AZUL-${authCode}` : `CASH-${orderId}`,
        idempotencyKey: `PAY-${orderId}-${group.store.id}`,
        cardLast4: isCard ? cardLast4 : undefined,
        cardBrand: isCard ? cardBrand : undefined,
        notes: isCard ? `Cargo automático procesado con éxito (Aut: ${authCode})` : 'Efectivo contra entrega',
        createdAt: chargedAt
      };
      newTransactions.push(tx);
    });

    // Send to global server backend
    api.createOrders(newOrders).then(res => {
      if (res.success && res.orders) {
        setOrders(prev => [...res.orders, ...prev.filter(o => !newOrders.some(no => no.id === o.id))]);
      }
    }).catch(console.error);

    // Optimistic local state update
    setOrders(prev => [...newOrders, ...prev]);
    setPaymentTransactions(prev => [...newTransactions, ...prev]);

    // Update balances optimistically
    setStoreBalances(prev => {
      const updated = { ...prev };
      groups.forEach((group) => {
        const commissionAmount = Number((group.storeTotal * commissionRate).toFixed(2));
        const storeNetEarnings = Number((group.storeTotal - commissionAmount).toFixed(2));
        const current = updated[group.store.id] || {
          storeId: group.store.id,
          totalSales: 0,
          cardSales: 0,
          cashSales: 0,
          plazaCommissionsPaid: 0,
          pendingCashCommissions: 0,
          pendingBalance: 0,
          availableBalance: 0,
          settledBalance: 0,
          retainedBalance: 0,
          adjustments: 0,
          carriedOverDebt: 0,
          lastUpdated: chargedAt
        };

        updated[group.store.id] = {
          ...current,
          totalSales: (current.totalSales || 0) + group.storeTotal,
          cardSales: isCard ? (current.cardSales || 0) + group.storeTotal : (current.cardSales || 0),
          cashSales: !isCard ? (current.cashSales || 0) + group.storeTotal : (current.cashSales || 0),
          pendingBalance: isCard ? (current.pendingBalance || 0) + storeNetEarnings : (current.pendingBalance || 0),
          plazaCommissionsPaid: isCard ? (current.plazaCommissionsPaid || 0) + commissionAmount : (current.plazaCommissionsPaid || 0),
          pendingCashCommissions: !isCard ? (current.pendingCashCommissions || 0) + commissionAmount : (current.pendingCashCommissions || 0),
          lastUpdated: chargedAt
        };
      });
      return updated;
    });

    clearCart();
    setAppliedCoupon(null);

    const totalCharged = groups.reduce((acc, g) => acc + g.storeTotal, 0);
    if (isCard) {
      showNotification(`¡Cargo automático aprobado! Se cargó RD$ ${totalCharged.toLocaleString()} a tu tarjeta (Aut: ${authCode}).`, 'success');
    } else {
      showNotification(`¡Compra completada con éxito! Se generaron ${groups.length} pedidos.`, 'success');
    }
    return { success: true, orderIds: createdOrderIds, orderGroupCode };
  };

  const updateOrderStatus = (
    orderId: string, 
    newStatus: OrderStatus, 
    note?: string, 
    providedConfirmationCode?: string
  ): { success: boolean; message: string } => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false, message: 'Pedido no encontrado' };

    if (currentUser?.role === 'STORE_OWNER' && currentUser?.storeId !== order.storeId) {
      return { success: false, message: 'Violación de seguridad: No tienes permisos para gestionar pedidos de otra tienda' };
    }

    if (newStatus === 'DELIVERED') {
      const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
      if (!isSuperAdmin) {
        const expectedCode = (order.deliveryConfirmationCode || '').trim().toUpperCase();
        const inputCode = (providedConfirmationCode || '').trim().toUpperCase();
        if (!inputCode || (expectedCode && inputCode !== expectedCode)) {
          return { 
            success: false, 
            message: 'Código de confirmación de entrega inválido. Solicítaselo al cliente que recibió el paquete.' 
          };
        }
      }
    }

    api.updateOrderStatus(orderId, newStatus, note, providedConfirmationCode).then(res => {
      if (res.success && res.order) {
        setOrders(prev => prev.map(o => o.id === orderId ? res.order! : o));
      }
    }).catch(console.error);

    const historyItem = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      updatedBy: currentUser ? `${currentUser.name} (${currentUser.role})` : 'Sistema PlazaDO',
      note: note || (newStatus === 'DELIVERED' ? 'Entrega validada con código secreto del cliente' : undefined)
    };

    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: newStatus,
          cancelReason: newStatus === 'CANCELLED' ? (note || o.cancelReason || 'Cancelado por la tienda') : o.cancelReason,
          cancelledBy: newStatus === 'CANCELLED' ? (currentUser ? `${currentUser.name} (${currentUser.role})` : 'Tienda') : o.cancelledBy,
          cancelledAt: newStatus === 'CANCELLED' ? new Date().toISOString() : o.cancelledAt,
          paymentStatus: (newStatus === 'DELIVERED' && o.paymentMethod === 'CASH_ON_DELIVERY') ? 'PAID' : o.paymentStatus,
          statusHistory: [...(o.statusHistory || []), historyItem]
        };
      }
      return o;
    }));

    showNotification(`Pedido ${orderId} actualizado a: ${newStatus}`);
    return { success: true, message: `Estado actualizado a ${newStatus}` };
  };

  const deleteOrder = async (orderId: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede eliminar pedidos', 'error');
      return;
    }
    try {
      await api.deleteOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      showNotification(`Pedido #${orderId} eliminado globalmente`);
    } catch (e) {
      setOrders(prev => prev.filter(o => o.id !== orderId));
    }
  };

  // --- ORDER CHAT (PLATAFORMA EXCLUSIVA DE COMUNICACIÓN) ---
  const openOrderChat = (orderId: string) => {
    setActiveChatOrderId(orderId);
    const order = orders.find(o => o.id === orderId);
    const isStoreUser = currentUser?.role === 'STORE_OWNER' || (order && currentUser?.storeId === order.storeId);
    markOrderMessagesAsRead(orderId, isStoreUser ? 'STORE' : 'CUSTOMER');
  };

  const closeOrderChat = () => {
    setActiveChatOrderId(null);
  };

  const sendOrderMessage = async (orderId: string, message: string): Promise<boolean> => {
    if (!message || !message.trim()) return false;
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    const isStoreUser = currentUser?.role === 'STORE_OWNER' || currentUser?.storeId === order.storeId;
    const isAdmin = currentUser?.role === 'SUPER_ADMIN';
    const senderRole: 'CUSTOMER' | 'STORE' | 'ADMIN' = isAdmin ? 'ADMIN' : (isStoreUser ? 'STORE' : 'CUSTOMER');
    const senderName = isStoreUser 
      ? (order.storeName || currentUser?.name || 'Tienda Oficial')
      : (currentUser?.name || order.customerName || 'Cliente');
    const senderId = currentUser?.id || (isStoreUser ? order.storeId : order.customerId);

    // Optimistic local update
    const tempMsg: OrderChatMessage = {
      id: `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderId,
      storeId: order.storeId,
      customerId: order.customerId,
      senderId,
      senderName,
      senderRole,
      message: message.trim(),
      createdAt: new Date().toISOString(),
      readByCustomer: senderRole === 'CUSTOMER',
      readByStore: senderRole === 'STORE'
    };

    setOrderMessages(prev => [...prev, tempMsg]);

    try {
      const res = await api.sendOrderMessage(orderId, {
        storeId: order.storeId,
        customerId: order.customerId,
        senderId,
        senderName,
        senderRole,
        message: message.trim()
      });
      if (res.success && res.message) {
        setOrderMessages(prev => prev.map(m => m.id === tempMsg.id ? res.message : m));
      }
      return true;
    } catch (e) {
      console.error('Error sending order chat message:', e);
      return true; // Already displayed optimistically
    }
  };

  const markOrderMessagesAsRead = async (orderId: string, role?: 'CUSTOMER' | 'STORE') => {
    const targetRole = role || (currentUser?.role === 'STORE_OWNER' || currentUser?.storeId ? 'STORE' : 'CUSTOMER');
    setOrderMessages(prev => prev.map(m => {
      if (m.orderId === orderId) {
        if (targetRole === 'CUSTOMER') return { ...m, readByCustomer: true };
        if (targetRole === 'STORE') return { ...m, readByStore: true };
      }
      return m;
    }));
    try {
      await api.markOrderMessagesAsRead(orderId, targetRole);
    } catch (e) {}
  };

  const getOrderUnreadCount = (orderId: string, forRole: 'CUSTOMER' | 'STORE'): number => {
    return orderMessages.filter(m => 
      m.orderId === orderId && 
      (forRole === 'CUSTOMER' ? (!m.readByCustomer && m.senderRole !== 'CUSTOMER') : (!m.readByStore && m.senderRole !== 'STORE'))
    ).length;
  };

  // --- SETTLEMENTS & BALANCES (Global) ---
  const requestSettlement = (storeId: string, notes?: string): { success: boolean; message: string } => {
    const bal = storeBalances[storeId];
    if (!bal || bal.availableBalance < 500) {
      return { success: false, message: 'El balance disponible mínimo para solicitar liquidación es de RD$ 500' };
    }

    api.requestSettlement(storeId, notes).then(res => {
      if (res.success && res.settlement) {
        setSettlements(prev => [res.settlement!, ...prev]);
      }
    }).catch(console.error);

    showNotification('Solicitud de liquidación enviada al servidor central');
    return { success: true, message: 'Solicitud enviada con éxito' };
  };

  const processSettlement = async (settlementId: string, status: Settlement['status'], reference?: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede procesar liquidaciones', 'error');
      return;
    }

    try {
      const res = await api.processSettlement(settlementId, status, reference);
      if (res.success && res.settlement) {
        setSettlements(prev => prev.map(s => s.id === settlementId ? res.settlement : s));
      }
    } catch (e) {
      setSettlements(prev => prev.map(s => s.id === settlementId ? { ...s, status } : s));
    }
    showNotification(`Liquidación ${settlementId} marcada como: ${status}`);
  };

  const deleteSettlement = async (settlementId: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede eliminar liquidaciones', 'error');
      return;
    }
    try {
      await api.deleteSettlement(settlementId);
      setSettlements(prev => prev.filter(s => s.id !== settlementId));
      showNotification(`Liquidación ${settlementId} eliminada`);
    } catch (e) {
      setSettlements(prev => prev.filter(s => s.id !== settlementId));
    }
  };

  const runWeeklySettlements = async () => {
    try {
      const actorName = currentUser ? `${currentUser.name} (${currentUser.role})` : 'Super Admin Plazado.com';
      const res = await api.runWeeklySettlements(actorName);
      if (res.success) {
        if (res.settlementsCreated && res.settlementsCreated.length > 0) {
          setSettlements(prev => [...res.settlementsCreated, ...prev]);
        }
        // Refresh bootstrap to get synced balances and logs
        const boot = await api.getBootstrap();
        if (boot && boot.data) {
          applyServerState(boot.data, boot.version || 1);
        }
        showNotification(res.message, 'success');
        return { 
          success: true, 
          message: res.message, 
          settlementsCreated: res.settlementsCreated,
          totalLiquidated: res.totalLiquidated 
        };
      } else {
        showNotification(res.message || 'No se generaron liquidaciones en este ciclo.', 'info');
        return { success: false, message: res.message };
      }
    } catch (err: any) {
      const msg = err.message || 'Error ejecutando ciclo semanal de liquidación';
      showNotification(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const refreshFinancials = async () => {
    try {
      const [txRes, logRes, bootRes] = await Promise.all([
        api.getFinancialTransactions(),
        api.getFinancialAuditLogs(),
        api.getBootstrap()
      ]);
      if (txRes && txRes.transactions) setPaymentTransactions(txRes.transactions);
      if (logRes && logRes.logs) setFinancialAuditLogs(logRes.logs);
      if (bootRes && bootRes.data) {
        applyServerState(bootRes.data, bootRes.version || 1);
      }
    } catch (err) {
      console.warn('Error refreshing financials:', err);
    }
  };

  // --- DISPUTES (Global) ---
  const createDispute = async (data: Omit<Dispute, 'id' | 'status' | 'createdAt'>) => {
    try {
      const res = await api.createDispute(data);
      if (res.success && res.dispute) {
        setDisputes(prev => [res.dispute, ...prev]);
        showNotification('Reclamación registrada en el servidor central.');
      }
    } catch (e) {
      const disp: Dispute = { ...data, id: `DISP-${Date.now()}`, status: 'OPEN', createdAt: new Date().toISOString() };
      setDisputes(prev => [disp, ...prev]);
    }
  };

  const resolveDispute = async (disputeId: string, status: Dispute['status'], resolutionNotes: string) => {
    try {
      const res = await api.resolveDispute(disputeId, status, resolutionNotes);
      if (res.success && res.dispute) {
        setDisputes(prev => prev.map(d => d.id === disputeId ? res.dispute : d));
      }
    } catch (e) {
      setDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, status, resolutionNotes } : d));
    }
    showNotification('Reclamación resuelta en el sistema global');
  };

  const deleteDispute = async (disputeId: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede eliminar reclamaciones', 'error');
      return;
    }
    try {
      await api.deleteDispute(disputeId);
      setDisputes(prev => prev.filter(d => d.id !== disputeId));
      showNotification(`Reclamación #${disputeId} eliminada`);
    } catch (e) {
      setDisputes(prev => prev.filter(d => d.id !== disputeId));
    }
  };

  // --- FAVORITES ---
  const toggleFavoriteProduct = (productId: string) => {
    if (!currentUser) {
      showNotification('Inicia sesión para guardar productos en tus favoritos', 'info');
      openAuthModal('login');
      return;
    }
    setFavorites(prev => {
      const exists = prev.productIds.includes(productId);
      const updated = exists ? prev.productIds.filter(id => id !== productId) : [...prev.productIds, productId];
      showNotification(exists ? 'Eliminado de favoritos' : 'Guardado en favoritos');
      return { ...prev, productIds: updated };
    });
  };

  const toggleFavoriteStore = (storeId: string) => {
    if (!currentUser) {
      showNotification('Inicia sesión para guardar tiendas en tus favoritos', 'info');
      openAuthModal('login');
      return;
    }
    setFavorites(prev => {
      const exists = prev.storeIds.includes(storeId);
      const updated = exists ? prev.storeIds.filter(id => id !== storeId) : [...prev.storeIds, storeId];
      showNotification(exists ? 'Tienda eliminada de favoritas' : 'Tienda guardada en favoritas');
      return { ...prev, storeIds: updated };
    });
  };

  // --- REVIEWS (Global) ---
  const addReview = async (reviewData: Omit<Review, 'id' | 'createdAt' | 'isVerifiedPurchase' | 'isModerated'>) => {
    try {
      const res = await api.createReview(reviewData);
      if (res.success && res.review) {
        setReviews(prev => [res.review, ...prev]);
        showNotification('Gracias por tu valoración verificada');
      }
    } catch (e) {
      const rev: Review = { ...reviewData, id: `rev-${Date.now()}`, isVerifiedPurchase: true, isModerated: true, createdAt: new Date().toISOString() };
      setReviews(prev => [rev, ...prev]);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede moderar reseñas', 'error');
      return;
    }
    try {
      await api.deleteReview(reviewId);
      setReviews(prev => prev.filter(r => r.id !== reviewId));
      showNotification('Reseña eliminada');
    } catch (e) {
      setReviews(prev => prev.filter(r => r.id !== reviewId));
    }
  };

  // --- BANNERS (Global) ---
  const addBanner = async (banner: Omit<Banner, 'id'>) => {
    try {
      const res = await api.createBanner(banner);
      if (res.success && res.banner) {
        setBanners(prev => [...prev, res.banner]);
        showNotification('Banner publicitario creado globalmente');
      }
    } catch (e) {
      setBanners(prev => [...prev, { ...banner, id: `banner-${Date.now()}` }]);
    }
  };

  const updateBanner = async (id: string, data: Partial<Banner>) => {
    try {
      const res = await api.updateBanner(id, data);
      if (res.success && res.banner) {
        setBanners(prev => prev.map(b => b.id === id ? res.banner : b));
        showNotification('Banner actualizado globalmente');
      }
    } catch (e) {
      setBanners(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
    }
  };

  const deleteBanner = async (id: string) => {
    try {
      await api.deleteBanner(id);
      setBanners(prev => prev.filter(b => b.id !== id));
      showNotification('Banner eliminado');
    } catch (e) {
      setBanners(prev => prev.filter(b => b.id !== id));
    }
  };

  // --- AUDITS & PURGE (Global) ---
  const deleteAuditLog = async (logId: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede eliminar registros de bitácora', 'error');
      return;
    }
    try {
      await api.deleteAuditLog(logId);
      setAuditLogs(prev => prev.filter(l => l.id !== logId));
      showNotification('Registro de bitácora eliminado');
    } catch (e) {
      setAuditLogs(prev => prev.filter(l => l.id !== logId));
    }
  };

  const clearAllAuditLogs = async () => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede vaciar la bitácora', 'error');
      return;
    }
    try {
      await api.clearAllAuditLogs();
      setAuditLogs([]);
      showNotification('Bitácora de auditoría vaciada exitosamente');
    } catch (e) {
      setAuditLogs([]);
    }
  };

  const purgeRecordsByType = (type: 'orders' | 'test_products' | 'disputes' | 'settlements' | 'audit_logs'): number => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede ejecutar purga de datos', 'error');
      return 0;
    }

    api.purgeRecords(type).catch(console.error);

    let count = 0;
    if (type === 'orders') {
      count = orders.length;
      setOrders([]);
      showNotification(`Se purgaron todos los ${count} pedidos del sistema global`);
    } else if (type === 'test_products') {
      return cleanTestProducts();
    } else if (type === 'disputes') {
      count = disputes.length;
      setDisputes([]);
      showNotification(`Se purgaron todas las ${count} reclamaciones`);
    } else if (type === 'settlements') {
      count = settlements.length;
      setSettlements([]);
      showNotification(`Se purgaron todas las ${count} liquidaciones`);
    } else if (type === 'audit_logs') {
      count = auditLogs.length;
      setAuditLogs([]);
      showNotification(`Se vaciaron ${count} entradas de auditoría`);
    }
    return count;
  };

  // --- SYSTEM SETTINGS (Super Admin platform_settings Global) ---
  const updateSystemSettings = async (settings: Partial<SystemSettings>): Promise<boolean> => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso restringido al Super Administrador', 'error');
      return false;
    }
    try {
      const res = await api.updateSettings(settings);
      if (!res.success || !res.settings) throw new Error('El servidor no confirmó el guardado');
      setSystemSettings(res.settings);
      showNotification('Configuración guardada permanentemente en la base de datos central');
      return true;
    } catch (e) {
      showNotification('No se pudo guardar. El porcentaje anterior se conserva; intenta nuevamente.', 'error');
      return false;
    }
  };

  // --- PASARELAS DE PAGO & CUENTA RECEPTORA PRINCIPAL (PLAZADO.COM) ---
  const activePaymentGateway = paymentGateways.find(g => g.isActive) || paymentGateways[0] || null;

  const savePaymentGateway = async (gateway: PaymentGatewayConfig): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede configurar pasarelas de pago', 'error');
      return { success: false, message: 'Acceso no autorizado' };
    }
    try {
      const res = await api.savePaymentGateway(gateway);
      if (res.success && res.gateway) {
        setPaymentGateways(prev => {
          const idx = prev.findIndex(g => g.id === res.gateway.id);
          let updated: PaymentGatewayConfig[];
          if (idx !== -1) {
            updated = [...prev];
            updated[idx] = res.gateway;
          } else {
            updated = [...prev, res.gateway];
          }
          if (res.gateway.isActive) {
            updated = updated.map(g => ({
              ...g,
              isActive: g.id === res.gateway.id
            }));
          }
          return updated;
        });
        showNotification(`Pasarela ${res.gateway.providerName} configurada exitosamente`, 'success');
        return { success: true };
      }
      return { success: false, message: 'No se pudo guardar la pasarela' };
    } catch (err: any) {
      showNotification(err.message || 'Error guardando pasarela de pago', 'error');
      return { success: false, message: err.message };
    }
  };

  const setActivePaymentGateway = async (gatewayId: string): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede activar pasarelas de cobro', 'error');
      return { success: false, message: 'Acceso no autorizado' };
    }
    try {
      const res = await api.activatePaymentGateway(gatewayId);
      if (res.success) {
        setPaymentGateways(prev => prev.map(g => ({
          ...g,
          isActive: g.id === gatewayId
        })));
        const activeOne = paymentGateways.find(g => g.id === gatewayId);
        showNotification(`Cuenta receptora principal de Plazado.com cambiada a: ${activeOne?.providerName || gatewayId}`, 'success');
        return { success: true };
      }
      return { success: false, message: 'Error activando pasarela' };
    } catch (err: any) {
      showNotification(err.message || 'Error al cambiar cuenta receptora principal', 'error');
      return { success: false, message: err.message };
    }
  };

  const deletePaymentGateway = async (gatewayId: string): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado', 'error');
      return { success: false, message: 'Acceso denegado' };
    }
    try {
      const res = await api.deletePaymentGateway(gatewayId);
      if (res.success) {
        setPaymentGateways(prev => prev.filter(g => g.id !== gatewayId));
        showNotification('Pasarela de pago eliminada', 'info');
        return { success: true };
      }
      return { success: false, message: 'No se pudo eliminar la pasarela' };
    } catch (err: any) {
      showNotification(err.message || 'Error al eliminar pasarela', 'error');
      return { success: false, message: err.message };
    }
  };

  // --- GESTIÓN DE PUBLICIDAD & ANUNCIOS ---
  const createAdCampaign = async (adData: Omit<Advertisement, 'id' | 'impressions' | 'clicks' | 'createdAt'>): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede crear publicidad', 'error');
      return { success: false, message: 'Acceso denegado' };
    }
    try {
      const res = await api.createAdCampaign(adData);
      if (res.success && res.ad) {
        setAdCampaigns(prev => [res.ad, ...prev]);
        showNotification(`Campaña publicitaria "${res.ad.title}" creada con éxito`, 'success');
        return { success: true };
      }
      return { success: false, message: 'No se pudo crear la campaña' };
    } catch (err: any) {
      showNotification(err.message || 'Error creando publicidad', 'error');
      return { success: false, message: err.message };
    }
  };

  const updateAdCampaign = async (id: string, data: Partial<Advertisement>): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado', 'error');
      return { success: false, message: 'Acceso denegado' };
    }
    try {
      const res = await api.updateAdCampaign(id, data);
      if (res.success && res.ad) {
        setAdCampaigns(prev => prev.map(a => a.id === id ? res.ad : a));
        showNotification(`Campaña "${res.ad.title}" actualizada`, 'success');
        return { success: true };
      }
      return { success: false, message: 'No se pudo actualizar la campaña' };
    } catch (err: any) {
      showNotification(err.message || 'Error actualizando publicidad', 'error');
      return { success: false, message: err.message };
    }
  };

  const toggleAdCampaignStatus = async (id: string): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return { success: false, message: 'Acceso denegado' };
    }
    try {
      const res = await api.toggleAdCampaignStatus(id);
      if (res.success) {
        setAdCampaigns(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
        const target = adCampaigns.find(a => a.id === id);
        const newState = !target?.isActive;
        showNotification(`Campaña "${target?.title}" ${newState ? 'activada' : 'pausada'}`, 'info');
        return { success: true };
      }
      return { success: false };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const deleteAdCampaign = async (id: string): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return { success: false, message: 'Acceso denegado' };
    }
    try {
      const res = await api.deleteAdCampaign(id);
      if (res.success) {
        setAdCampaigns(prev => prev.filter(a => a.id !== id));
        showNotification('Campaña publicitaria eliminada', 'info');
        return { success: true };
      }
      return { success: false };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const saveAdPlacement = async (placement: AdPlacement): Promise<{ success: boolean; message?: string }> => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return { success: false, message: 'Acceso denegado' };
    }
    try {
      const res = await api.saveAdPlacement(placement);
      if (res.success && res.placement) {
        setAdPlacements(prev => {
          const idx = prev.findIndex(p => p.code === res.placement.code);
          if (idx !== -1) {
            const copy = [...prev];
            copy[idx] = res.placement;
            return copy;
          }
          return [...prev, res.placement];
        });
        showNotification(`Ubicación publicitaria "${res.placement.name}" guardada`, 'success');
        return { success: true };
      }
      return { success: false };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const trackAdImpression = (adId: string) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    api.trackAdImpression(adId, isMobile ? 'MOBILE' : 'DESKTOP').catch(() => {});
    setAdCampaigns(prev => prev.map(a => a.id === adId ? { ...a, impressions: (a.impressions || 0) + 1 } : a));
  };

  const trackAdClick = (adId: string) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    api.trackAdClick(adId, isMobile ? 'MOBILE' : 'DESKTOP').catch(() => {});
    setAdCampaigns(prev => prev.map(a => a.id === adId ? { ...a, clicks: (a.clicks || 0) + 1 } : a));
  };

  // --- PLAZADO FULFILLMENT IMPLEMENTATIONS ---
  const createStorageRequest = async (data: any): Promise<boolean> => {
    try {
      const res = await api.createStorageRequest(data);
      if (res.success && res.storageRequest) {
        setStorageRequests(prev => [res.storageRequest, ...prev]);
        const syncRes = await api.sync(0);
        if (syncRes.data) applyServerState(syncRes.data, syncRes.version);
        return true;
      }
      return false;
    } catch (e: any) {
      showNotification(e.message || 'Error al crear solicitud de almacenamiento', 'error');
      return false;
    }
  };

  const updateStorageRequestStatus = async (id: string, status: StorageRequestStatus, notes?: string): Promise<boolean> => {
    try {
      const res = await api.updateStorageRequestStatus(id, status, notes);
      if (res.success) {
        const syncRes = await api.sync(0);
        if (syncRes.data) applyServerState(syncRes.data, syncRes.version);
        return true;
      }
      return false;
    } catch (e: any) {
      showNotification(e.message || 'Error al actualizar estado', 'error');
      return false;
    }
  };

  const processPhysicalReception = async (requestId: string, data: any): Promise<boolean> => {
    try {
      const res = await api.processPhysicalReception(requestId, data);
      if (res.success) {
        const syncRes = await api.sync(0);
        if (syncRes.data) applyServerState(syncRes.data, syncRes.version);
        return true;
      }
      return false;
    } catch (e: any) {
      showNotification(e.message || 'Error en recepción física', 'error');
      return false;
    }
  };

  const adjustInventory = async (inventoryItemId: string, data: { newAvailable: number; reason: string; notes?: string }): Promise<boolean> => {
    try {
      const res = await api.adjustInventory(inventoryItemId, data);
      if (res.success) {
        const syncRes = await api.sync(0);
        if (syncRes.data) applyServerState(syncRes.data, syncRes.version);
        return true;
      }
      return false;
    } catch (e: any) {
      showNotification(e.message || 'Error al ajustar inventario', 'error');
      return false;
    }
  };

  const relocateInventory = async (inventoryItemId: string, newLocation: WarehouseLocation): Promise<boolean> => {
    try {
      const res = await api.relocateInventory(inventoryItemId, newLocation);
      if (res.success) {
        const syncRes = await api.sync(0);
        if (syncRes.data) applyServerState(syncRes.data, syncRes.version);
        return true;
      }
      return false;
    } catch (e: any) {
      showNotification(e.message || 'Error al reubicar', 'error');
      return false;
    }
  };

  const blockUnblockInventory = async (inventoryItemId: string, quantity: number, action: 'BLOCK' | 'UNBLOCK', reason: string): Promise<boolean> => {
    try {
      const res = await api.blockUnblockInventory(inventoryItemId, quantity, action, reason);
      if (res.success) {
        const syncRes = await api.sync(0);
        if (syncRes.data) applyServerState(syncRes.data, syncRes.version);
        return true;
      }
      return false;
    } catch (e: any) {
      showNotification(e.message || 'Error al cambiar bloqueo', 'error');
      return false;
    }
  };

  const recordInventoryDamage = async (inventoryItemId: string, quantity: number, reason: string, photos?: string[]): Promise<boolean> => {
    try {
      const res = await api.recordInventoryDamage(inventoryItemId, quantity, reason, photos);
      if (res.success) {
        const syncRes = await api.sync(0);
        if (syncRes.data) applyServerState(syncRes.data, syncRes.version);
        return true;
      }
      return false;
    } catch (e: any) {
      showNotification(e.message || 'Error al registrar daño', 'error');
      return false;
    }
  };

  const confirmOrderByStore = async (fulfillmentOrderId: string, storeId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await api.confirmOrderByStore(fulfillmentOrderId, storeId, currentUser);
      if (res.success) {
        const syncRes = await api.sync(0);
        if (syncRes.data) applyServerState(syncRes.data, syncRes.version);
        return { success: true, message: 'Pedido confirmado exitosamente. Orden de preparación enviada al almacén.' };
      }
      return { success: false, message: 'No se pudo confirmar el pedido.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error al confirmar pedido' };
    }
  };

  const rejectOrderByStore = async (fulfillmentOrderId: string, storeId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await api.rejectOrderByStore(fulfillmentOrderId, storeId, reason, currentUser);
      if (res.success) {
        const syncRes = await api.sync(0);
        if (syncRes.data) applyServerState(syncRes.data, syncRes.version);
        return { success: true, message: 'Pedido rechazado. Unidades liberadas preventivamente a Disponible.' };
      }
      return { success: false, message: 'No se pudo rechazar el pedido.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error al rechazar pedido' };
    }
  };

  const validateAndPickItem = async (fulfillmentOrderId: string, productId: string, scannedSku: string, scannedLocation: string): Promise<{ success: boolean; error?: string; order?: FulfillmentOrder }> => {
    try {
      const res = await api.validateAndPickItem(fulfillmentOrderId, productId, scannedSku, scannedLocation);
      if (res.success) {
        const syncRes = await api.sync(0);
        if (syncRes.data) applyServerState(syncRes.data, syncRes.version);
        return { success: true, order: res.order };
      }
      return { success: false, error: res.error || 'Discrepancia detectada.' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error en la validación' };
    }
  };

  const completePacking = async (fulfillmentOrderId: string, data: any): Promise<boolean> => {
    try {
      const res = await api.completePacking(fulfillmentOrderId, data);
      if (res.success) {
        const syncRes = await api.sync(0);
        if (syncRes.data) applyServerState(syncRes.data, syncRes.version);
        return true;
      }
      return false;
    } catch (e: any) {
      showNotification(e.message || 'Error al completar packing', 'error');
      return false;
    }
  };

  const dispatchFulfillmentOrder = async (fulfillmentOrderId: string, data: any): Promise<boolean> => {
    try {
      const res = await api.dispatchOrder(fulfillmentOrderId, data);
      if (res.success) {
        const syncRes = await api.sync(0);
        if (syncRes.data) applyServerState(syncRes.data, syncRes.version);
        return true;
      }
      return false;
    } catch (e: any) {
      showNotification(e.message || 'Error al despachar orden', 'error');
      return false;
    }
  };

  const deliverFulfillmentOrder = async (fulfillmentOrderId: string, data: any): Promise<boolean> => {
    try {
      const res = await api.deliverFulfillmentOrder(fulfillmentOrderId, data);
      if (res.success) {
        const syncRes = await api.sync(0);
        if (syncRes.data) applyServerState(syncRes.data, syncRes.version);
        return true;
      }
      return false;
    } catch (e: any) {
      showNotification(e.message || 'Error al entregar orden', 'error');
      return false;
    }
  };

  const createFulfillmentIncidence = async (data: any): Promise<boolean> => {
    try {
      const res = await api.createFulfillmentIncidence(data);
      if (res.success) {
        const syncRes = await api.sync(0);
        if (syncRes.data) applyServerState(syncRes.data, syncRes.version);
        return true;
      }
      return false;
    } catch (e: any) {
      showNotification(e.message || 'Error al reportar incidencia', 'error');
      return false;
    }
  };

  const updateFulfillmentIncidence = async (id: string, data: any): Promise<boolean> => {
    try {
      const res = await api.updateFulfillmentIncidence(id, data);
      if (res.success) {
        const syncRes = await api.sync(0);
        if (syncRes.data) applyServerState(syncRes.data, syncRes.version);
        return true;
      }
      return false;
    } catch (e: any) {
      showNotification(e.message || 'Error al actualizar incidencia', 'error');
      return false;
    }
  };

  const createFulfillmentReturn = async (data: any): Promise<boolean> => {
    try {
      const res = await api.createFulfillmentReturn(data);
      if (res.success) {
        const syncRes = await api.sync(0);
        if (syncRes.data) applyServerState(syncRes.data, syncRes.version);
        return true;
      }
      return false;
    } catch (e: any) {
      showNotification(e.message || 'Error al registrar devolución', 'error');
      return false;
    }
  };

  const classifyReturn = async (returnId: string, data: any): Promise<boolean> => {
    try {
      const res = await api.classifyReturn(returnId, data);
      if (res.success) {
        const syncRes = await api.sync(0);
        if (syncRes.data) applyServerState(syncRes.data, syncRes.version);
        return true;
      }
      return false;
    } catch (e: any) {
      showNotification(e.message || 'Error al clasificar devolución', 'error');
      return false;
    }
  };

  const createWithdrawal = async (data: any): Promise<boolean> => {
    try {
      const res = await api.createWithdrawal(data);
      if (res.success) {
        const syncRes = await api.sync(0);
        if (syncRes.data) applyServerState(syncRes.data, syncRes.version);
        return true;
      }
      return false;
    } catch (e: any) {
      showNotification(e.message || 'Error al solicitar retiro', 'error');
      return false;
    }
  };

  const updateWithdrawalStatus = async (id: string, status: string, notes?: string): Promise<boolean> => {
    try {
      const res = await api.updateWithdrawalStatus(id, status, notes);
      if (res.success) {
        const syncRes = await api.sync(0);
        if (syncRes.data) applyServerState(syncRes.data, syncRes.version);
        return true;
      }
      return false;
    } catch (e: any) {
      showNotification(e.message || 'Error al actualizar estado de retiro', 'error');
      return false;
    }
  };

  const updateFulfillmentConfig = async (config: Partial<FulfillmentConfig>): Promise<boolean> => {
    try {
      const res = await api.updateFulfillmentConfig(config);
      if (res.success) {
        const syncRes = await api.sync(0);
        if (syncRes.data) applyServerState(syncRes.data, syncRes.version);
        return true;
      }
      return false;
    } catch (e: any) {
      showNotification(e.message || 'Error al actualizar configuración', 'error');
      return false;
    }
  };

  const [adminImpersonatedStoreId, setAdminImpersonatedStoreId] = useState<string | null>(null);

  const adminImpersonateStore = (storeId: string) => {
    setAdminImpersonatedStoreId(storeId);
    const targetStore = stores.find(s => s.id === storeId);
    setCurrentView('store_dashboard');
    showNotification(`Ingresando a administrar tienda: ${targetStore?.name || storeId}`, 'info');
  };

  const adminExitImpersonation = () => {
    setAdminImpersonatedStoreId(null);
    setCurrentView('admin_dashboard');
    showNotification('Has regresado al Panel General Super Admin', 'info');
  };

  const createSuperAdminUser = async (data: { name: string; email: string; phone: string; password: string }) => {
    try {
      const res = await api.createSuperAdmin(data);
      if (res.success) {
        showNotification(res.message, 'success');
        const syncRes = await api.sync(0);
        if (syncRes.data) applyServerState(syncRes.data, syncRes.version);
        return { success: true, message: res.message };
      } else {
        showNotification(res.message, 'error');
        return { success: false, message: res.message };
      }
    } catch (err: any) {
      const msg = err.message || 'Error creando Super Administrador';
      showNotification(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const assignStoreAdmin = async (storeId: string, data: { email: string; password: string; name?: string; phone?: string }): Promise<{ success: boolean; message: string; user?: User }> => {
    try {
      const res = await api.assignStoreAdmin(storeId, data);
      if (res.success && res.user) {
        showNotification(res.message || 'Administrador asignado correctamente a la tienda', 'success');
        setUsers(prev => {
          const exists = prev.some(u => u.id === res.user!.id);
          if (exists) {
            return prev.map(u => u.id === res.user!.id ? res.user! : u);
          }
          return [...prev, res.user!];
        });
        if (res.store) {
          setStores(prev => prev.map(s => s.id === res.store!.id ? { ...s, ...res.store } : s));
        }
        const syncRes = await api.sync(0);
        if (syncRes.data) applyServerState(syncRes.data, syncRes.version);
        return { success: true, message: res.message, user: res.user };
      }
      showNotification(res.message || 'Error al asignar administrador', 'error');
      return { success: false, message: res.message || 'Error al asignar administrador' };
    } catch (err: any) {
      const msg = err.message || 'Error al comunicarse con el servidor central';
      showNotification(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const submitKycVerification = async (data: { cedulaNumber: string; cedulaFrontUrl: string; selfieUrl?: string; biometricScore?: number }) => {
    try {
      const res = await api.submitKyc({
        userId: currentUser?.id,
        ...data
      });
      if (res.success) {
        showNotification(res.message, 'success');
        if (res.user && currentUser) {
          setCurrentUser(res.user);
        }
        const syncRes = await api.sync(0);
        if (syncRes.data) applyServerState(syncRes.data, syncRes.version);
        return { success: true, message: res.message };
      } else {
        showNotification(res.message || 'Error enviando documentos', 'error');
        return { success: false, message: res.message || 'Error' };
      }
    } catch (err: any) {
      const msg = err.message || 'Error de conexión enviando documentos';
      showNotification(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const handleSetCurrentView = (view: AppView) => {
    if (view === 'admin_dashboard' && (!currentUser || currentUser.role !== 'SUPER_ADMIN')) {
      showNotification('Acceso Denegado: Solo el Super Administrador puede acceder al Panel General', 'error');
      openAuthModal('login');
      return;
    }
    if (view === 'store_dashboard' && (!currentUser || (currentUser.role !== 'STORE_OWNER' && currentUser.role !== 'SUPER_ADMIN'))) {
      showNotification('Acceso Denegado: Debes iniciar sesión con una cuenta de Tienda', 'error');
      openAuthModal('login');
      return;
    }
    if (view === 'customer_portal' && !currentUser) {
      showNotification('Debes iniciar sesión o registrarte para ver tu portal de compras', 'info');
      openAuthModal('login');
      return;
    }
    setCurrentView(view);
  };

  return (
    <AppContext.Provider value={{
      currentView,
      setCurrentView: handleSetCurrentView,
      selectedStoreSlug,
      setSelectedStoreSlug,
      isBootstrapLoading,
      copyStoreShareUrl,
      getStoreShareUrl,
      selectedProductId,
      setSelectedProductId,
      selectedCategorySlug,
      setSelectedCategorySlug,
      searchQuery,
      setSearchQuery,
      openPolicySlug,
      setOpenPolicySlug,
      isDownloadModalOpen,
      downloadModalTab,
      openDownloadModal,
      closeDownloadModal,
      adminActiveTab,
      setAdminActiveTab,

      currentUser,
      setCurrentUser,
      switchPersona,
      allUsers: users,
      updateUserProfile,
      addCustomerAddress,
      updateCustomerAddress,
      deleteCustomerAddress,
      setDefaultAddress,
      deleteUser,
      deleteMyAccount,
      deleteMyStore,
      setUserPassword,

      isAuthModalOpen,
      authModalMode,
      openAuthModal,
      closeAuthModal,
      pendingVerificationEmail,
      setPendingVerificationEmail,
      verifyCode,
      resendVerificationCode,
      pendingPurchaseAction,
      authPurchaseNotice,
      setAuthPurchaseNotice,
      login,
      logout,
      registerCustomer,
      registerStoreAccount,

      stores,
      registerStore,
      updateStoreStatus,
      updateStoreDetails,
      toggleStorePublish,
      deleteStore,

      products,
      addProduct,
      updateProduct,
      deleteProduct,
      cleanTestProducts,

      categories,
      addCategory,
      updateCategory,
      deleteCategory,
      mergeCategories,

      cart,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      getCartGroups,
      cartTotal,
      appliedCoupon,
      applyCoupon,
      removeCoupon,
      processCheckout,

      orders,
      updateOrderStatus,
      deleteOrder,

      // In-Platform Order Chat
      orderMessages,
      activeChatOrderId,
      openOrderChat,
      closeOrderChat,
      sendOrderMessage,
      markOrderMessagesAsRead,
      getOrderUnreadCount,

      storeBalances,
      settlements,
      paymentTransactions,
      financialAuditLogs,
      requestSettlement,
      processSettlement,
      deleteSettlement,
      runWeeklySettlements,
      refreshFinancials,

      disputes,
      createDispute,
      resolveDispute,
      deleteDispute,

      favorites,
      toggleFavoriteProduct,
      toggleFavoriteStore,
      reviews,
      addReview,
      deleteReview,

      banners,
      updateBanner,
      addBanner,
      deleteBanner,

      systemSettings,
      updateSystemSettings,
      purgeRecordsByType,

      // Pasarelas de Pago & Cuenta Receptora Plazado.com
      paymentGateways,
      activePaymentGateway,
      savePaymentGateway,
      setActivePaymentGateway,
      deletePaymentGateway,

      // Gestión de Publicidad & Anuncios
      adCampaigns,
      adPlacements,
      createAdCampaign,
      updateAdCampaign,
      toggleAdCampaignStatus,
      deleteAdCampaign,
      saveAdPlacement,
      trackAdImpression,
      trackAdClick,

      // Plazado Fulfillment
      storageRequests,
      fulfillmentInventory,
      inventoryMovements,
      fulfillmentOrders,
      fulfillmentIncidences,
      fulfillmentReturns,
      fulfillmentWithdrawals,
      fulfillmentConfig,
      createStorageRequest,
      updateStorageRequestStatus,
      processPhysicalReception,
      adjustInventory,
      relocateInventory,
      blockUnblockInventory,
      recordInventoryDamage,
      confirmOrderByStore,
      rejectOrderByStore,
      validateAndPickItem,
      completePacking,
      dispatchFulfillmentOrder,
      deliverFulfillmentOrder,
      createFulfillmentIncidence,
      updateFulfillmentIncidence,
      createFulfillmentReturn,
      classifyReturn,
      createWithdrawal,
      updateWithdrawalStatus,
      updateFulfillmentConfig,

      auditLogs,
      addAuditLog,
      deleteAuditLog,
      clearAllAuditLogs,

      notification,
      showNotification,

      adminImpersonatedStoreId,
      adminImpersonateStore,
      adminExitImpersonation,
      createSuperAdminUser,
      assignStoreAdmin,
      submitKycVerification,

      theme,
      toggleTheme,
      setThemeMode
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const useAppContext = useApp;
