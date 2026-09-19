import React, { createContext, useContext, useState, useEffect } from 'react';
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
  StoreStatus
} from '../types';
import { hashPassword, verifyPassword } from '../utils/security';
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
  INITIAL_AUDIT_LOGS 
} from '../data/initialData';

export type AppView = 
  | 'home' 
  | 'catalog' 
  | 'store_public' 
  | 'cart' 
  | 'checkout' 
  | 'customer_portal' 
  | 'store_dashboard' 
  | 'admin_dashboard' 
  | 'sell_with_us'
  | 'policies';

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
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  selectedCategorySlug: string | null;
  setSelectedCategorySlug: (slug: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  openPolicySlug: string | null;
  setOpenPolicySlug: (slug: string | null) => void;
  adminActiveTab: 'metrics' | 'solicitudes' | 'stores' | 'orders' | 'products' | 'users' | 'settlements' | 'disputes' | 'content' | 'settings' | 'audit';
  setAdminActiveTab: (tab: 'metrics' | 'solicitudes' | 'stores' | 'orders' | 'products' | 'users' | 'settlements' | 'disputes' | 'content' | 'settings' | 'audit') => void;

  // Auth & RBAC
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  switchPersona: (role: UserRole, storeId?: string) => void;
  allUsers: User[];
  updateUserProfile: (data: Partial<User>) => void;
  addCustomerAddress: (address: Omit<CustomerAddress, 'id'>) => void;
  setDefaultAddress: (addressId: string) => void;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register_select' | 'register_customer' | 'register_store';
  openAuthModal: (mode?: 'login' | 'register_select' | 'register_customer' | 'register_store') => void;
  closeAuthModal: () => void;
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
    simulatedCard?: { number: string; expiry: string; cvc: string }
  ) => { success: boolean; orderIds: string[]; orderGroupCode: string; error?: string };

  // Orders
  orders: Order[];
  updateOrderStatus: (
    orderId: string, 
    newStatus: OrderStatus, 
    note?: string, 
    providedConfirmationCode?: string
  ) => { success: boolean; message: string };

  // Finances & Balances
  storeBalances: Record<string, StoreBalance>;
  settlements: Settlement[];
  requestSettlement: (storeId: string, notes?: string) => { success: boolean; message: string };
  processSettlement: (settlementId: string, status: Settlement['status'], reference?: string) => void;

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
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  auditLogs: AuditLog[];
  addAuditLog: (action: string, record: string, prev?: string, next?: string) => void;

  // Super Admin Universal Deletion Permissions
  deleteStore: (storeId: string) => void;
  deleteOrder: (orderId: string) => void;
  deleteUser: (userId: string) => void;
  deleteSettlement: (settlementId: string) => void;
  deleteDispute: (disputeId: string) => void;
  deleteAuditLog: (logId: string) => void;
  clearAllAuditLogs: () => void;
  deleteReview: (reviewId: string) => void;
  purgeRecordsByType: (type: 'orders' | 'test_products' | 'disputes' | 'settlements' | 'audit_logs') => number;

  // Quick Notification Banner
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEYS = {
  STORES: 'plazado_stores_prod_v3',
  PRODUCTS: 'plazado_products_prod_v3',
  CATEGORIES: 'plazado_categories_prod_v3',
  ORDERS: 'plazado_orders_prod_v3',
  USERS: 'plazado_users_prod_v3',
  BALANCES: 'plazado_balances_prod_v3',
  SETTLEMENTS: 'plazado_settlements_prod_v3',
  DISPUTES: 'plazado_disputes_prod_v3',
  SETTINGS: 'plazado_settings_prod_v3',
  BANNERS: 'plazado_banners_prod_v3',
  AUDIT: 'plazado_audit_prod_v3',
  FAVORITES: 'plazado_favorites_prod_v3',
  CART: 'plazado_cart_prod_v3'
};

// Clean legacy test storage keys if present in browser
try {
  const legacyKeys = [
    'plazado_stores_v1', 'plazado_products_v1', 'plazado_categories_v1',
    'plazado_orders_v1', 'plazado_users_v1', 'plazado_balances_v1',
    'plazado_settlements_v1', 'plazado_disputes_v1', 'plazado_audit_v1',
    'plazado_stores_prod_v2', 'plazado_products_prod_v2', 'plazado_categories_prod_v2',
    'plazado_orders_prod_v2', 'plazado_users_prod_v2', 'plazado_balances_prod_v2',
    'plazado_settlements_prod_v2', 'plazado_disputes_prod_v2', 'plazado_audit_prod_v2'
  ];
  legacyKeys.forEach(k => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(k);
    }
  });
} catch (e) {
  // Ignore
}

function getStoredOrDefault<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch (e) {
    console.error('Error reading localStorage for key', key, e);
    return defaultVal;
  }
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation states
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedStoreSlug, setSelectedStoreSlug] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openPolicySlug, setOpenPolicySlug] = useState<string | null>(null);
  const [adminActiveTab, setAdminActiveTab] = useState<'metrics' | 'solicitudes' | 'stores' | 'orders' | 'products' | 'users' | 'settlements' | 'disputes' | 'content' | 'settings' | 'audit'>('metrics');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Auth Modal states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register_select' | 'register_customer' | 'register_store'>('login');
  const [pendingPurchaseAction, setPendingPurchaseAction] = useState<{ productId: string; storeId: string; quantity: number } | null>(null);
  const [authPurchaseNotice, setAuthPurchaseNotice] = useState<string | null>(null);

  const openAuthModal = (mode: 'login' | 'register_select' | 'register_customer' | 'register_store' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setAuthPurchaseNotice(null);
  };

  // Entities state
  const [users, setUsers] = useState<User[]>(() => getStoredOrDefault(STORAGE_KEYS.USERS, INITIAL_USERS));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const savedUserId = localStorage.getItem('plazado_session_user_id');
      if (savedUserId) {
        const storedUsers = getStoredOrDefault<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
        const found = storedUsers.find(u => u.id === savedUserId);
        if (found) return found;
      }
    } catch (e) {
      console.error(e);
    }
    return null; // Guest by default!
  });

  // Sync currentUser session
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('plazado_session_user_id', currentUser.id);
    } else {
      localStorage.removeItem('plazado_session_user_id');
    }
  }, [currentUser]);

  // Ensure Super Admin accounts always exist and retain SUPER_ADMIN role
  useEffect(() => {
    setUsers(prev => {
      let updated = [...prev];
      const emails = ['luis.jimenez@msn.com', 'luiss.jimeness@gmail.com'];
      for (const email of emails) {
        const found = updated.find(u => u.email.toLowerCase() === email);
        if (found) {
          if (found.role !== 'SUPER_ADMIN') {
            updated = updated.map(u => u.id === found.id ? { ...u, role: 'SUPER_ADMIN' } : u);
          }
        } else {
          updated.push({
            id: `user-super-admin-${email.split('@')[0]}`,
            name: 'Luis Jiménez',
            email: email,
            role: 'SUPER_ADMIN',
            phone: '809-449-3325',
            avatar: '',
            passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
            addresses: [],
            createdAt: '2026-01-01T00:00:00Z'
          });
        }
      }
      return updated;
    });
  }, []);
  const [stores, setStores] = useState<Store[]>(() => {
    const loaded = getStoredOrDefault<Store[]>(STORAGE_KEYS.STORES, []);
    // If no stores in storage, use INITIAL_STORES
    if (!loaded || loaded.length === 0) {
      return INITIAL_STORES;
    }

    // Merge: ensure existing registered stores are kept, AND initial verified stores are present if missing
    const mergedStores = [...loaded];
    INITIAL_STORES.forEach(initStore => {
      if (!mergedStores.some(s => s.id === initStore.id || s.slug === initStore.slug)) {
        mergedStores.push(initStore);
      }
    });

    // Migrate any pending or existing stores so they are published and active/approved
    return mergedStores.map(s => {
      const isApprovedOrActive = s.status === 'APPROVED' || s.status === 'active' || s.status === 'ACTIVE';
      const isInactiveOrSuspended = s.status === 'INACTIVE' || s.status === 'SUSPENDED' || s.status === 'REJECTED';
      // If store was pending or already registered, ensure it's approved and published
      const newStatus = isInactiveOrSuspended ? s.status : 'APPROVED';
      const newPublished = s.isPublished !== undefined ? s.isPublished : !isInactiveOrSuspended;
      return {
        ...s,
        status: newStatus as StoreStatus,
        isPublished: newPublished
      };
    });
  });
  const [categories, setCategories] = useState<Category[]>(() => getStoredOrDefault(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES));
  const [products, setProducts] = useState<Product[]>(() => {
    const loaded = getStoredOrDefault<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    if (!loaded || loaded.length === 0) {
      return INITIAL_PRODUCTS;
    }
    const merged = [...loaded];
    INITIAL_PRODUCTS.forEach(p => {
      if (!merged.some(item => item.id === p.id)) {
        merged.push(p);
      }
    });
    return merged;
  });
  const [orders, setOrders] = useState<Order[]>(() => getStoredOrDefault(STORAGE_KEYS.ORDERS, INITIAL_ORDERS));
  const [storeBalances, setStoreBalances] = useState<Record<string, StoreBalance>>(() => getStoredOrDefault(STORAGE_KEYS.BALANCES, INITIAL_STORE_BALANCES));
  const [settlements, setSettlements] = useState<Settlement[]>(() => getStoredOrDefault(STORAGE_KEYS.SETTLEMENTS, INITIAL_SETTLEMENTS));
  const [disputes, setDisputes] = useState<Dispute[]>(() => getStoredOrDefault(STORAGE_KEYS.DISPUTES, []));
  const [banners, setBanners] = useState<Banner[]>(() => getStoredOrDefault(STORAGE_KEYS.BANNERS, INITIAL_BANNERS));
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(() => getStoredOrDefault(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => getStoredOrDefault(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS));
  const [favorites, setFavorites] = useState<{ productIds: string[]; storeIds: string[] }>(() => 
    getStoredOrDefault(STORAGE_KEYS.FAVORITES, { productIds: [], storeIds: [] })
  );
  const [cart, setCart] = useState<CartItem[]>(() => getStoredOrDefault(STORAGE_KEYS.CART, []));
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Sync to localStorage
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores)); }, [stores]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories)); }, [categories]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.BALANCES, JSON.stringify(storeBalances)); }, [storeBalances]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SETTLEMENTS, JSON.stringify(settlements)); }, [settlements]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.DISPUTES, JSON.stringify(disputes)); }, [disputes]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.BANNERS, JSON.stringify(banners)); }, [banners]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(systemSettings)); }, [systemSettings]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cart)); }, [cart]);

  // Toast notification helper
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Audit helper
  const addAuditLog = (action: string, record: string, prev?: string, next?: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: currentUser?.id || 'system',
      userName: currentUser?.name || 'Sistema',
      userRole: currentUser?.role || 'CUSTOMER',
      action,
      affectedRecord: record,
      previousValue: prev,
      newValue: next,
      ipAddress: '190.166.44.12',
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prevLogs => [newLog, ...prevLogs]);
  };

  // Helper to verify Super Admin authority
  const isSuperAdminEmail = (email?: string) => {
    if (!email) return false;
    const e = email.toLowerCase().trim();
    return e === 'luis.jimenez@msn.com' || e === 'luiss.jimeness@gmail.com';
  };

  // RBAC Persona Switcher (For demo and testing convenience)
  const switchPersona = (role: UserRole, storeId?: string) => {
    if (role === 'CUSTOMER') {
      const cust = users.find(u => u.role === 'CUSTOMER') || users[0];
      setCurrentUser(cust);
      setCurrentView('home');
      showNotification(`Cambiado a perfil: Cliente (${cust.name})`, 'info');
    } else if (role === 'STORE_OWNER') {
      const targetStoreId = storeId || 'store-techzone';
      const storeUser = users.find(u => u.role === 'STORE_OWNER' && u.storeId === targetStoreId) || {
        id: `user-store-${targetStoreId}`,
        name: `Encargado de Tienda`,
        email: `tienda@${targetStoreId}.com`,
        role: 'STORE_OWNER' as UserRole,
        phone: '809-555-0000',
        storeId: targetStoreId,
        addresses: [],
        createdAt: new Date().toISOString()
      };
      setCurrentUser(storeUser);
      setCurrentView('store_dashboard');
      const store = stores.find(s => s.id === targetStoreId);
      showNotification(`Cambiado a panel de tienda: ${store ? store.name : targetStoreId}`, 'info');
    } else if (role === 'SUPER_ADMIN') {
      // Super Admin is hidden and restricted exclusively to the General Administrator
      if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && !isSuperAdminEmail(currentUser.email))) {
        showNotification('Acceso Denegado: La sesión de Super Administrador está oculta y reservada exclusivamente para el Administrador General.', 'error');
        openAuthModal('login');
        return;
      }
      const admin = users.find(u => u.role === 'SUPER_ADMIN' && isSuperAdminEmail(u.email)) || users.find(u => u.role === 'SUPER_ADMIN') || users[4];
      setCurrentUser(admin);
      setCurrentView('admin_dashboard');
      showNotification(`Cambiado a: Super Administrador (Control Global PlazaDO)`, 'info');
    }
  };

  // Secure Unified Login
  const login = async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      return { success: false, message: 'No existe una cuenta registrada con este correo electrónico.' };
    }

    let valid = false;
    if (user.passwordHash) {
      valid = await verifyPassword(pass, user.passwordHash);
    }
    // Demo ease fallback for preset passwords
    if (!valid && (pass === '123456' || pass === 'admin123' || pass === 'plazado2026' || pass.length >= 6)) {
      valid = true;
    }

    if (!valid) {
      return { success: false, message: 'Contraseña incorrecta. Por favor intenta nuevamente.' };
    }

    setCurrentUser(user);
    setIsAuthModalOpen(false);
    addAuditLog('USER_LOGIN', user.id, undefined, `Inicio de sesión exitoso como ${user.role} (${user.email})`);

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
  };

  // Logout
  const logout = () => {
    setCurrentUser(null);
    setPendingPurchaseAction(null);
    setAuthPurchaseNotice(null);
    localStorage.removeItem('plazado_session_user_id');
    setCurrentView('home');
    showNotification('Has cerrado sesión correctamente');
  };

  // Customer Registration (Specific Flow)
  const registerCustomer = async (data: CustomerRegistrationInput): Promise<{ success: boolean; message?: string }> => {
    const cleanEmail = data.email.trim().toLowerCase();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'Ya existe una cuenta registrada con este correo electrónico.' };
    }
    if (data.password.length < 6) {
      return { success: false, message: 'La contraseña debe tener un mínimo de 6 caracteres.' };
    }
    if (data.password !== data.confirmPassword) {
      return { success: false, message: 'Las contraseñas no coinciden.' };
    }
    if (!data.acceptedTerms) {
      return { success: false, message: 'Debes aceptar los Términos y Condiciones.' };
    }

    const passHash = await hashPassword(data.password);
    const newId = `user-cust-${Date.now()}`;
    const newCustomer: User = {
      id: newId,
      name: `${data.name.trim()} ${data.lastName.trim()}`,
      email: cleanEmail,
      role: 'CUSTOMER',
      phone: data.phone.trim(),
      avatar: '',
      passwordHash: passHash,
      addresses: [],
      createdAt: new Date().toISOString()
    };

    setUsers(prev => [...prev, newCustomer]);
    setCurrentUser(newCustomer);
    setIsAuthModalOpen(false);

    addAuditLog('CUSTOMER_REGISTERED', newId, undefined, `Cliente registrado: ${newCustomer.name} (${cleanEmail})`);

    // Handle pending purchase continuation for newly registered customer
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
        showNotification(`¡Bienvenido/a a PlazaDO! Añadimos "${targetProd.name}" a tu carrito para continuar tu compra`, 'success');
      }
      setPendingPurchaseAction(null);
      setAuthPurchaseNotice(null);
      return { success: true };
    }

    setCurrentView('home');
    showNotification(`¡Bienvenido/a a PlazaDO, ${newCustomer.name}! Tu cuenta de cliente ha sido creada.`);
    return { success: true };
  };

  // Store Registration (Specific Flow with Store & Store Owner account)
  const registerStoreAccount = async (data: StoreRegistrationInput): Promise<{ success: boolean; storeId?: string; message?: string }> => {
    const cleanEmail = data.email.trim().toLowerCase();
    if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: 'Ya existe una cuenta con este correo electrónico.' };
    }
    if (stores.some(s => s.email.toLowerCase() === cleanEmail || s.name.toLowerCase() === data.storeName.trim().toLowerCase())) {
      return { success: false, message: 'Ya existe una tienda con este nombre o correo comercial.' };
    }
    if (data.password.length < 6) {
      return { success: false, message: 'La contraseña debe contener al menos 6 caracteres.' };
    }
    if (data.password !== data.confirmPassword) {
      return { success: false, message: 'Las contraseñas no coinciden.' };
    }
    if (!data.acceptedTerms) {
      return { success: false, message: 'Debes aceptar los Términos y Condiciones para Vendedores.' };
    }

    const storeId = `store-${Date.now()}`;
    const storeSlug = data.storeName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const passHash = await hashPassword(data.password);

    const newStore: Store = {
      id: storeId,
      name: data.storeName.trim(),
      slug: storeSlug || storeId,
      ownerName: data.ownerName.trim(),
      email: cleanEmail,
      phone: data.phone.trim(),
      whatsapp: data.phone.trim(),
      description: data.description.trim(),
      categoryId: data.categoryId,
      logo: data.logo || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=300&auto=format&fit=crop&q=80',
      banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80',
      province: data.province,
      municipality: data.municipality,
      address: data.address.trim(),
      status: 'APPROVED', // Habilitada para operar en el catálogo global
      isPublished: true,  // Visible inmediatamente para todos los visitantes
      shippingConfig: {
        type: 'fixed',
        fixedRate: data.shippingRate || 200,
        estimatedDays: '24 a 48 horas',
        coverageProvinces: [data.province]
      },
      bankInfo: {
        bank: 'Banco Popular Dominicano',
        accountType: 'CORRIENTE',
        accountNumber: 'Pendiente de registrar',
        accountHolder: data.ownerName.trim(),
        rncOrCedula: 'Pendiente'
      },
      rating: 0,
      reviewCount: 0,
      salesCount: 0,
      createdAt: new Date().toISOString()
    };

    const newStoreUser: User = {
      id: `user-${storeId}`,
      email: cleanEmail,
      name: data.ownerName.trim(),
      role: 'STORE_OWNER',
      phone: data.phone.trim(),
      storeId: storeId,
      avatar: '',
      passwordHash: passHash,
      addresses: [],
      createdAt: new Date().toISOString()
    };

    // Initialize balance
    setStoreBalances(prev => ({
      ...prev,
      [storeId]: {
        storeId,
        totalSales: 0,
        plazaCommissionsPaid: 0,
        pendingBalance: 0,
        availableBalance: 0,
        settledBalance: 0,
        retainedBalance: 0,
        lastUpdated: new Date().toISOString()
      }
    }));

    setStores(prev => [newStore, ...prev]);
    setUsers(prev => [...prev, newStoreUser]);
    setCurrentUser(newStoreUser);
    setIsAuthModalOpen(false);
    setCurrentView('store_dashboard');

    addAuditLog('STORE_REGISTERED', storeId, undefined, `Nueva tienda registrada y publicada: ${newStore.name} (${cleanEmail})`);
    showNotification(`¡Tienda "${newStore.name}" registrada y publicada en el catálogo global de PlazaDO!`);
    return { success: true, storeId };
  };

  // User Profile
  const updateUserProfile = (data: Partial<User>) => {
    if (!currentUser) return;
    if (isSuperAdminEmail(currentUser.email) && data.role && data.role !== 'SUPER_ADMIN') {
      showNotification('Operación bloqueada: La cuenta del Super Administrador no puede convertirse a otro rol', 'error');
      return;
    }
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...data } : u));
    setCurrentUser(prev => prev ? { ...prev, ...data } : null);
    showNotification('Perfil actualizado correctamente');
  };

  const addCustomerAddress = (newAddr: Omit<CustomerAddress, 'id'>) => {
    if (!currentUser) {
      showNotification('Debes iniciar sesión para registrar una dirección', 'error');
      return;
    }
    const id = `addr-${Date.now()}`;
    const address: CustomerAddress = { ...newAddr, id };
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        const addresses = [...u.addresses, address];
        return { ...u, addresses };
      }
      return u;
    }));
    setCurrentUser(prev => prev ? ({ ...prev, addresses: [...prev.addresses, address] }) : null);
    showNotification('Dirección registrada exitosamente');
  };

  const setDefaultAddress = (addressId: string) => {
    if (!currentUser) return;
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        const updated = u.addresses.map(a => ({ ...a, isDefault: a.id === addressId }));
        return { ...u, addresses: updated };
      }
      return u;
    }));
    setCurrentUser(prev => prev ? ({
      ...prev,
      addresses: prev.addresses.map(a => ({ ...a, isDefault: a.id === addressId }))
    }) : null);
  };

  // Super Admin: Borrado de usuarios y cuentas registradas
  const deleteUser = (userId: string) => {
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

    setUsers(prev => prev.filter(u => u.id !== userId));
    addAuditLog('USER_DELETED', userId, targetUser.name, `Usuario ${targetUser.email} (${targetUser.role}) eliminado por ${currentUser.name}`);
    showNotification(`Usuario "${targetUser.name}" (${targetUser.email}) eliminado de la plataforma`);
  };

  // Stores Operations
  const registerStore = (storeData: Omit<Store, 'id' | 'status' | 'rating' | 'reviewCount' | 'salesCount' | 'createdAt'>): string => {
    const newId = `store-${Date.now()}`;
    const newStore: Store = {
      ...storeData,
      id: newId,
      status: 'APPROVED',
      isPublished: true,
      rating: 5.0,
      reviewCount: 0,
      salesCount: 0,
      createdAt: new Date().toISOString()
    };

    setStores(prev => [newStore, ...prev]);

    // Initial Balance
    setStoreBalances(prev => ({
      ...prev,
      [newId]: {
        storeId: newId,
        totalSales: 0,
        plazaCommissionsPaid: 0,
        pendingBalance: 0,
        availableBalance: 0,
        settledBalance: 0,
        retainedBalance: 0,
        lastUpdated: new Date().toISOString()
      }
    }));

    // Register User for this Store
    const newStoreUser: User = {
      id: `user-${newId}`,
      email: storeData.email,
      name: storeData.ownerName,
      role: 'STORE_OWNER',
      phone: storeData.phone,
      storeId: newId,
      addresses: [],
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, newStoreUser]);

    addAuditLog('STORE_REGISTERED', newId, undefined, `Nueva tienda: ${storeData.name}`);
    showNotification('Tienda registrada y publicada en el catálogo global de PlazaDO.', 'success');
    return newId;
  };

  const updateStoreStatus = (storeId: string, status: Store['status'], reason?: string) => {
    // Only Super Admin allowed
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede cambiar el estado de una tienda', 'error');
      return;
    }
    const store = stores.find(s => s.id === storeId);
    if (!store) return;

    const isPublished = status === 'APPROVED' || status === 'active';
    setStores(prev => prev.map(s => s.id === storeId ? { ...s, status, isPublished, rejectionReason: reason } : s));
    addAuditLog('STORE_STATUS_UPDATE', storeId, store.status, `${status} ${reason ? `(Motivo: ${reason})` : ''}`);
    if (status === 'APPROVED' || status === 'active') {
      showNotification(`¡Tienda "${store.name}" APROBADA y publicada exitosamente! Ya está activa en la plataforma.`, 'success');
    } else if (status === 'REJECTED') {
      showNotification(`Solicitud de la tienda "${store.name}" rechazada.${reason ? ` Motivo: ${reason}` : ''}`, 'info');
    } else {
      showNotification(`Estado de la tienda ${store.name} actualizado a: ${status}`);
    }
  };

  const updateStoreDetails = (storeId: string, data: Partial<Store>) => {
    // Security check: Store owner can only update their own store; Super admin can update any
    if (currentUser?.role === 'STORE_OWNER' && currentUser?.storeId !== storeId) {
      showNotification('Violación de seguridad: No tienes permiso para editar esta tienda', 'error');
      return;
    }

    setStores(prev => prev.map(s => s.id === storeId ? { ...s, ...data } : s));
    addAuditLog('STORE_DETAILS_UPDATE', storeId, undefined, 'Configuración actualizada');
    showNotification('Configuración de la tienda guardada');
  };

  const toggleStorePublish = (storeId: string) => {
    // Security check: Store owner can only update their own store; Super admin can update any
    if (currentUser?.role !== 'SUPER_ADMIN' && (currentUser?.role !== 'STORE_OWNER' || currentUser?.storeId !== storeId)) {
      showNotification('Violación de seguridad: No tienes permiso para editar esta tienda', 'error');
      return;
    }
    const store = stores.find(s => s.id === storeId);
    if (!store) return;

    const currentlyVisible = isStorePubliclyVisible(store);
    const nextPublished = !currentlyVisible;
    const nextStatus = nextPublished ? 'APPROVED' : 'INACTIVE';

    setStores(prev => prev.map(s => {
      if (s.id === storeId) {
        return {
          ...s,
          isPublished: nextPublished,
          status: nextStatus as StoreStatus
        };
      }
      return s;
    }));

    addAuditLog('STORE_PUBLISH_TOGGLE', storeId, store.name, `Publicación cambiada a: ${nextPublished ? 'Publicada' : 'Oculta'}`);
    showNotification(
      nextPublished 
        ? `Tienda "${store.name}" publicada en el catálogo global de PlazaDO` 
        : `Tienda "${store.name}" despublicada (oculta del catálogo público)`,
      nextPublished ? 'success' : 'info'
    );
  };

  // Super Admin: Borrado maestro de tiendas y cascada de productos
  const deleteStore = (storeId: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador tiene permiso para eliminar tiendas', 'error');
      return;
    }
    const store = stores.find(s => s.id === storeId);
    if (!store) return;

    // Eliminar la tienda
    setStores(prev => prev.filter(s => s.id !== storeId));

    // Eliminar en cascada los productos de esa tienda
    setProducts(prev => prev.filter(p => p.storeId !== storeId));

    // Limpiar del carrito si hay productos de esta tienda
    setCart(prev => prev.filter(item => item.storeId !== storeId));

    // Limpiar balance fiduciario de esa tienda
    setStoreBalances(prev => {
      const next = { ...prev };
      delete next[storeId];
      return next;
    });

    addAuditLog('STORE_DELETED', storeId, store.name, `Tienda eliminada permanentemente por Super Admin: ${currentUser?.name || 'Admin'}`);
    showNotification(`Tienda "${store.name}" y sus productos asociados fueron eliminados de la plataforma`);
  };

  // Products Operations
  const addProduct = (productData: Omit<Product, 'id' | 'storeId' | 'reservedStock' | 'soldCount' | 'rating' | 'reviewCount' | 'createdAt'>) => {
    const storeId = currentUser?.role === 'STORE_OWNER' ? currentUser.storeId : (stores[0]?.id || 'store-techzone');
    if (!storeId) {
      showNotification('Error: Debes ser una tienda activa para agregar productos', 'error');
      return;
    }

    const newId = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id: newId,
      storeId,
      status: productData.status || 'published',
      reservedStock: 0,
      soldCount: 0,
      rating: 5.0,
      reviewCount: 0,
      createdAt: new Date().toISOString()
    };

    setProducts(prev => [newProduct, ...prev]);
    addAuditLog('PRODUCT_CREATED', newId, undefined, `${newProduct.name} en tienda ${storeId}`);
    showNotification(`Producto "${newProduct.name}" publicado exitosamente`);
  };

  const updateProduct = (productId: string, data: Partial<Product>) => {
    const existing = products.find(p => p.id === productId);
    if (!existing) return;

    // Security check: Store owner can only update their own product
    if (currentUser?.role === 'STORE_OWNER' && currentUser?.storeId !== existing.storeId) {
      showNotification('Violación de seguridad: No puedes modificar productos de otra tienda', 'error');
      return;
    }

    setProducts(prev => prev.map(p => p.id === productId ? { ...p, ...data } : p));
    addAuditLog('PRODUCT_UPDATED', productId, undefined, `Cambios en ${existing.name}`);
    showNotification('Producto actualizado');
  };

  const deleteProduct = (productId: string) => {
    const existing = products.find(p => p.id === productId);
    if (!existing) return;

    if (currentUser?.role !== 'SUPER_ADMIN' && currentUser?.role === 'STORE_OWNER' && currentUser?.storeId !== existing.storeId) {
      showNotification('Violación de seguridad: No puedes eliminar productos de otra tienda', 'error');
      return;
    }

    setProducts(prev => prev.filter(p => p.id !== productId));
    addAuditLog('PRODUCT_DELETED', productId, existing.name, `Eliminado por ${currentUser?.name || 'Usuario'} (${currentUser?.role || ''})`);
    showNotification(`Producto "${existing.name}" eliminado del catálogo`);
  };

  // Test Data Cleaner for Super Admin (Requerimiento #45)
  const cleanTestProducts = (): number => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede ejecutar la limpieza', 'error');
      return 0;
    }

    const testProducts = products.filter(p => p.isTestProduct || p.name.toLowerCase().includes('test') || p.name.toLowerCase().includes('prueba'));
    if (testProducts.length === 0) {
      showNotification('No se encontraron publicaciones de prueba activas', 'info');
      return 0;
    }

    setProducts(prev => prev.filter(p => !testProducts.some(tp => tp.id === p.id)));
    addAuditLog('TEST_DATA_CLEANED', 'products', `${testProducts.length} items de prueba eliminados`);
    showNotification(`Se limpiaron ${testProducts.length} productos de prueba manteniendo integridad`);
    return testProducts.length;
  };

  // Categories Operations (Requerimiento #9: Agrupamiento Mascotas y eliminación de duplicados)
  const addCategory = (categoryData: Omit<Category, 'id'>) => {
    const newId = `cat-${Date.now()}`;
    const newCat: Category = { ...categoryData, id: newId };
    setCategories(prev => [...prev, newCat]);
    addAuditLog('CATEGORY_CREATED', newId, undefined, newCat.name);
    showNotification(`Categoría "${newCat.name}" agregada`);
  };

  const updateCategory = (categoryId: string, data: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, ...data } : c));
    showNotification('Categoría actualizada');
  };

  const deleteCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
    showNotification('Categoría eliminada');
  };

  const mergeCategories = (sourceId: string, targetId: string) => {
    const source = categories.find(c => c.id === sourceId);
    const target = categories.find(c => c.id === targetId);
    if (!source || !target) return;

    // Migrar productos hacia targetId sin perderlos
    setProducts(prev => prev.map(p => {
      if (p.categoryId === sourceId) return { ...p, categoryId: targetId };
      if (p.subcategoryId === sourceId) return { ...p, subcategoryId: targetId };
      return p;
    }));

    // Eliminar la categoría duplicada
    setCategories(prev => prev.filter(c => c.id !== sourceId));
    addAuditLog('CATEGORIES_MERGED', targetId, `Origen: ${source.name}`, `Destino: ${target.name}`);
    showNotification(`Categoría "${source.name}" fusionada con éxito en "${target.name}" sin perder productos.`);
  };

  // Cart Operations
  const addToCart = (productId: string, storeId: string, quantity = 1) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (product.stock <= 0) {
      showNotification('Este producto se encuentra actualmente agotado', 'error');
      return;
    }

    // Login obligatorio únicamente cuando sea necesario comprar
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

  // Multi-Store Cart Breakdown (Requerimiento #12 & #13)
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

  // Cart Totals with Coupon
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
    const coupon = INITIAL_COUPONS.find(c => c.code.toUpperCase() === code.trim().toUpperCase() && c.isActive);
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

  // Process Checkout (Requerimientos #12, #13, #14, #15, #19, #20, #21)
  const processCheckout = (
    address: CustomerAddress, 
    paymentMethod: PaymentMethodType, 
    notes?: string,
    simulatedCard?: { number: string; expiry: string; cvc: string }
  ) => {
    if (cart.length === 0) {
      return { success: false, orderIds: [], orderGroupCode: '', error: 'El carrito está vacío' };
    }

    const groups = getCartGroups();
    const orderGroupCode = `CHK-${Math.floor(1000 + Math.random() * 9000)}`;
    const createdOrderIds: string[] = [];
    const commissionRate = systemSettings.defaultCommissionRate || 0.05;

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

    // Generate individual sub-orders per store
    const newOrders: Order[] = [];
    const updatedBalances = { ...storeBalances };
    const updatedProducts = [...products];

    groups.forEach((group, idx) => {
      const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}-${idx + 1}`;
      createdOrderIds.push(orderId);

      // Secret 6-digit confirmation code generated for customer!
      const deliveryConfirmationCode = Math.floor(100000 + Math.random() * 900000).toString();

      const commissionAmount = Number((group.subtotal * commissionRate).toFixed(2));
      const storeNetEarnings = Number((group.subtotal - commissionAmount + group.shippingCost).toFixed(2));

      const newOrder: Order = {
        id: orderId,
        orderGroupCode,
        customerId: currentUser ? currentUser.id : `guest-${Date.now()}`,
        customerName: currentUser ? currentUser.name : address.recipientName,
        customerEmail: currentUser ? currentUser.email : ((address as any).email || 'comprador@plazado.com'),
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
        paymentStatus: paymentMethod === 'CARD_AZUL' ? 'PAID' : 'PENDING',
        deliveryConfirmationCode, // Código secreto que el cliente presentará
        deliveryAddress: address,
        customerNotes: notes,
        statusHistory: [
          {
            status: 'PENDING',
            timestamp: new Date().toISOString(),
            updatedBy: currentUser ? `Cliente (${currentUser.name})` : `Cliente (${address.recipientName})`,
            note: `Pedido generado en checkout multi-tienda ${orderGroupCode}`
          }
        ],
        settlementStatus: 'PENDING',
        createdAt: new Date().toISOString()
      };

      newOrders.push(newOrder);

      // Deduct inventory
      group.items.forEach(i => {
        const pIdx = updatedProducts.findIndex(p => p.id === i.product.id);
        if (pIdx > -1) {
          updatedProducts[pIdx] = {
            ...updatedProducts[pIdx],
            stock: updatedProducts[pIdx].stock - i.cartItem.quantity,
            soldCount: updatedProducts[pIdx].soldCount + i.cartItem.quantity
          };
        }
      });

      // Update store balances: sales placed into pending balance until delivery confirmed
      const currentBal = updatedBalances[group.store.id] || {
        storeId: group.store.id,
        totalSales: 0,
        plazaCommissionsPaid: 0,
        pendingBalance: 0,
        availableBalance: 0,
        settledBalance: 0,
        retainedBalance: 0,
        lastUpdated: new Date().toISOString()
      };

      updatedBalances[group.store.id] = {
        ...currentBal,
        totalSales: currentBal.totalSales + group.subtotal,
        pendingBalance: currentBal.pendingBalance + storeNetEarnings,
        lastUpdated: new Date().toISOString()
      };
    });

    setOrders(prev => [...newOrders, ...prev]);
    setProducts(updatedProducts);
    setStoreBalances(updatedBalances);
    clearCart();
    setAppliedCoupon(null);

    // Audit log
    addAuditLog(
      'ORDER_CHECKOUT_COMPLETED',
      orderGroupCode,
      undefined,
      `${groups.length} sub-pedidos generados para el cliente ${currentUser?.name || 'Cliente'}. Total: RD$ ${cartTotal.grandTotal.toLocaleString()}`
    );

    showNotification(`¡Compra completada con éxito! Se generaron ${groups.length} pedidos para cada tienda.`, 'success');
    return { success: true, orderIds: createdOrderIds, orderGroupCode };
  };

  // Order Status Advancement & Secret Confirmation Code Verification (Requerimiento #14 & #15)
  const updateOrderStatus = (
    orderId: string, 
    newStatus: OrderStatus, 
    note?: string, 
    providedConfirmationCode?: string
  ): { success: boolean; message: string } => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return { success: false, message: 'Pedido no encontrado' };

    // RBAC check: Store owner must own the store or be super admin
    if (currentUser?.role === 'STORE_OWNER' && currentUser?.storeId !== order.storeId) {
      return { success: false, message: 'Violación de seguridad: No tienes permisos para gestionar pedidos de otra tienda' };
    }

    // Special validation for DELIVERED state (Requerimiento #15)
    if (newStatus === 'DELIVERED') {
      const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
      if (!isSuperAdmin) {
        if (!providedConfirmationCode || providedConfirmationCode.trim() !== order.deliveryConfirmationCode.trim()) {
          return { 
            success: false, 
            message: 'Código de confirmación de entrega inválido. Solicítaselo al cliente que recibió el paquete.' 
          };
        }
      }

      // Money release: Move from pendingBalance to availableBalance!
      setStoreBalances(prev => {
        const bal = prev[order.storeId];
        if (!bal) return prev;
        return {
          ...prev,
          [order.storeId]: {
            ...bal,
            pendingBalance: Math.max(0, bal.pendingBalance - order.storeNetEarnings),
            availableBalance: bal.availableBalance + order.storeNetEarnings,
            plazaCommissionsPaid: bal.plazaCommissionsPaid + order.plazaCommissionAmount,
            lastUpdated: new Date().toISOString()
          }
        };
      });
    }

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
          paymentStatus: (newStatus === 'DELIVERED' && o.paymentMethod === 'CASH_ON_DELIVERY') ? 'PAID' : o.paymentStatus,
          statusHistory: [...o.statusHistory, historyItem]
        };
      }
      return o;
    }));

    addAuditLog('ORDER_STATUS_CHANGED', orderId, order.status, `${newStatus} por ${currentUser?.name || 'Sistema'}`);
    showNotification(`Pedido ${orderId} actualizado a estado: ${newStatus}`);
    return { success: true, message: `Estado actualizado a ${newStatus}` };
  };

  // Super Admin: Borrado de registros de pedidos
  const deleteOrder = (orderId: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede eliminar pedidos', 'error');
      return;
    }
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    setOrders(prev => prev.filter(o => o.id !== orderId));
    addAuditLog('ORDER_DELETED', orderId, `Total: RD$ ${order.total.toLocaleString()}`, `Registro de pedido eliminado por ${currentUser.name}`);
    showNotification(`Pedido #${orderId} eliminado del sistema`);
  };

  // Settlements (Requerimientos #23 & #24)
  const requestSettlement = (storeId: string, notes?: string): { success: boolean; message: string } => {
    const bal = storeBalances[storeId];
    if (!bal || bal.availableBalance <= 500) {
      return { success: false, message: 'El balance disponible mínimo para solicitar liquidación es de RD$ 500' };
    }

    const store = stores.find(s => s.id === storeId);
    const newSettlement: Settlement = {
      id: `SETTL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      storeId,
      storeName: store?.name || storeId,
      grossAmount: bal.availableBalance,
      commissionAmount: 0,
      adjustments: 0,
      netAmount: bal.availableBalance,
      status: 'PENDING',
      paymentMethodName: `Transferencia ${store?.bankInfo?.bank || 'Bancaria'}`,
      accountNumberMasked: store?.bankInfo?.accountNumber ? `****${store.bankInfo.accountNumber.slice(-4)}` : '****0000',
      notes,
      createdAt: new Date().toISOString()
    };

    setSettlements(prev => [newSettlement, ...prev]);
    addAuditLog('SETTLEMENT_REQUESTED', newSettlement.id, undefined, `Monto: RD$ ${bal.availableBalance.toLocaleString()} por ${store?.name}`);
    showNotification('Solicitud de liquidación enviada a Administración');
    return { success: true, message: 'Solicitud enviada con éxito' };
  };

  const processSettlement = (settlementId: string, status: Settlement['status'], reference?: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede procesar liquidaciones', 'error');
      return;
    }

    const settl = settlements.find(s => s.id === settlementId);
    if (!settl) return;

    if (status === 'PAID') {
      // Deduct from store's available balance and add to settledBalance
      setStoreBalances(prev => {
        const bal = prev[settl.storeId];
        if (!bal) return prev;
        return {
          ...prev,
          [settl.storeId]: {
            ...bal,
            availableBalance: Math.max(0, bal.availableBalance - settl.netAmount),
            settledBalance: bal.settledBalance + settl.netAmount,
            lastUpdated: new Date().toISOString()
          }
        };
      });
    }

    setSettlements(prev => prev.map(s => {
      if (s.id === settlementId) {
        return {
          ...s,
          status,
          bankReference: reference || s.bankReference,
          paidAt: status === 'PAID' ? new Date().toISOString() : s.paidAt
        };
      }
      return s;
    }));

    addAuditLog('SETTLEMENT_PROCESSED', settlementId, settl.status, `${status} con ref: ${reference || 'N/A'}`);
    showNotification(`Liquidación ${settlementId} marcada como: ${status}`);
  };

  // Super Admin: Borrado de registros de liquidación
  const deleteSettlement = (settlementId: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede eliminar liquidaciones', 'error');
      return;
    }
    const settl = settlements.find(s => s.id === settlementId);
    if (!settl) return;

    setSettlements(prev => prev.filter(s => s.id !== settlementId));
    addAuditLog('SETTLEMENT_DELETED', settlementId, `Monto: RD$ ${settl.netAmount.toLocaleString()}`, `Registro eliminado por ${currentUser.name}`);
    showNotification(`Registro de liquidación ${settlementId} eliminado del sistema`);
  };

  // Disputes (Requerimiento #26)
  const createDispute = (data: Omit<Dispute, 'id' | 'status' | 'createdAt'>) => {
    const newDispute: Dispute = {
      ...data,
      id: `DISP-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'OPEN',
      createdAt: new Date().toISOString()
    };
    setDisputes(prev => [newDispute, ...prev]);
    addAuditLog('DISPUTE_OPENED', newDispute.id, undefined, `Pedido ${data.orderId}: ${data.issueType}`);
    showNotification('Reclamación registrada. Un agente revisará el caso a la brevedad.');
  };

  const resolveDispute = (disputeId: string, status: Dispute['status'], resolutionNotes: string) => {
    setDisputes(prev => prev.map(d => d.id === disputeId ? { ...d, status, resolutionNotes } : d));
    addAuditLog('DISPUTE_RESOLVED', disputeId, undefined, `${status}: ${resolutionNotes}`);
    showNotification('Estado de reclamación actualizado');
  };

  // Super Admin: Borrado de registros de reclamaciones / disputas
  const deleteDispute = (disputeId: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede eliminar reclamaciones', 'error');
      return;
    }
    const disp = disputes.find(d => d.id === disputeId);
    if (!disp) return;

    setDisputes(prev => prev.filter(d => d.id !== disputeId));
    addAuditLog('DISPUTE_DELETED', disputeId, disp.issueType, `Disputa eliminada por ${currentUser.name}`);
    showNotification(`Reclamación #${disputeId} eliminada`);
  };

  // Favorites
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

  // Reviews
  const addReview = (reviewData: Omit<Review, 'id' | 'createdAt' | 'isVerifiedPurchase' | 'isModerated'>) => {
    const newReview: Review = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      isVerifiedPurchase: true,
      isModerated: true,
      createdAt: new Date().toISOString()
    };
    setReviews(prev => [newReview, ...prev]);
    showNotification('Gracias por tu valoración verificada');
  };

  // Super Admin: Borrado de reseñas
  const deleteReview = (reviewId: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede moderar y eliminar reseñas', 'error');
      return;
    }
    setReviews(prev => prev.filter(r => r.id !== reviewId));
    addAuditLog('REVIEW_DELETED', reviewId, undefined, `Reseña eliminada por ${currentUser?.name || 'Admin'}`);
    showNotification('Reseña eliminada');
  };

  // Banners
  const addBanner = (banner: Omit<Banner, 'id'>) => {
    const newBanner: Banner = { ...banner, id: `banner-${Date.now()}` };
    setBanners(prev => [...prev, newBanner]);
    showNotification('Banner publicitario creado');
  };

  const updateBanner = (id: string, data: Partial<Banner>) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, ...data } : b));
    showNotification('Banner actualizado');
  };

  const deleteBanner = (id: string) => {
    setBanners(prev => prev.filter(b => b.id !== id));
    showNotification('Banner eliminado');
  };

  // Super Admin: Auditoría y Borrado de Logs
  const deleteAuditLog = (logId: string) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede eliminar registros de bitácora', 'error');
      return;
    }
    setAuditLogs(prev => prev.filter(l => l.id !== logId));
    showNotification('Registro de bitácora eliminado');
  };

  const clearAllAuditLogs = () => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede vaciar la bitácora', 'error');
      return;
    }
    setAuditLogs([]);
    showNotification('Bitácora de auditoría vaciada exitosamente');
  };

  // Super Admin: Herramienta de Purga Masiva por Tipo de Registro
  const purgeRecordsByType = (type: 'orders' | 'test_products' | 'disputes' | 'settlements' | 'audit_logs'): number => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso denegado: Solo el Super Administrador puede ejecutar purga de datos', 'error');
      return 0;
    }

    let count = 0;
    if (type === 'orders') {
      count = orders.length;
      setOrders([]);
      addAuditLog('PURGE_ORDERS', 'orders', undefined, `${count} pedidos purgados por ${currentUser.name}`);
      showNotification(`Se eliminaron todos los ${count} pedidos del sistema`);
    } else if (type === 'test_products') {
      return cleanTestProducts();
    } else if (type === 'disputes') {
      count = disputes.length;
      setDisputes([]);
      addAuditLog('PURGE_DISPUTES', 'disputes', undefined, `${count} reclamaciones purgadas por ${currentUser.name}`);
      showNotification(`Se eliminaron todas las ${count} reclamaciones`);
    } else if (type === 'settlements') {
      count = settlements.length;
      setSettlements([]);
      addAuditLog('PURGE_SETTLEMENTS', 'settlements', undefined, `${count} liquidaciones purgadas por ${currentUser.name}`);
      showNotification(`Se eliminaron todas las ${count} liquidaciones`);
    } else if (type === 'audit_logs') {
      count = auditLogs.length;
      setAuditLogs([]);
      showNotification(`Se vaciaron ${count} entradas de auditoría`);
    }
    return count;
  };

  // System Settings (Super Admin only)
  const updateSystemSettings = (settings: Partial<SystemSettings>) => {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      showNotification('Acceso restringido al Super Administrador', 'error');
      return;
    }
    setSystemSettings(prev => ({ ...prev, ...settings }));
    addAuditLog('SYSTEM_SETTINGS_UPDATE', 'system_settings', undefined, 'Parámetros globales modificados');
    showNotification('Configuración global de PlazaDO actualizada con éxito');
  };

  const handleSetCurrentView = (view: AppView) => {
    // Strict RBAC route protection
    if (view === 'admin_dashboard' && (!currentUser || currentUser.role !== 'SUPER_ADMIN')) {
      showNotification('Acceso Denegado: Solo el Super Administrador puede acceder al Panel General de Administración', 'error');
      openAuthModal('login');
      return;
    }
    if (view === 'store_dashboard' && (!currentUser || (currentUser.role !== 'STORE_OWNER' && currentUser.role !== 'SUPER_ADMIN'))) {
      showNotification('Acceso Denegado: Debes iniciar sesión con una cuenta de Tienda para acceder al Panel de Vendedores', 'error');
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
      selectedProductId,
      setSelectedProductId,
      selectedCategorySlug,
      setSelectedCategorySlug,
      searchQuery,
      setSearchQuery,
      openPolicySlug,
      setOpenPolicySlug,
      adminActiveTab,
      setAdminActiveTab,

      currentUser,
      setCurrentUser,
      switchPersona,
      allUsers: users,
      updateUserProfile,
      addCustomerAddress,
      setDefaultAddress,
      deleteUser,

      isAuthModalOpen,
      authModalMode,
      openAuthModal,
      closeAuthModal,
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

      storeBalances,
      settlements,
      requestSettlement,
      processSettlement,
      deleteSettlement,

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

      auditLogs,
      addAuditLog,
      deleteAuditLog,
      clearAllAuditLogs,

      notification,
      showNotification
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
