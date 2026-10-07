import { 
  Store, 
  Product, 
  Category, 
  User, 
  Order, 
  OrderStatus,
  StoreBalance, 
  Settlement, 
  Dispute, 
  Banner, 
  SystemSettings, 
  Review, 
  AuditLog,
  CustomerRegistrationInput,
  StoreRegistrationInput,
  StoreStatus,
  Coupon,
  PaymentTransaction,
  FinancialAuditLog,
  PaymentGatewayConfig,
  AdPlacement,
  Advertisement,
  OrderChatMessage,
  CategorySpecification,
  StorageRequest,
  StorageRequestStatus,
  FulfillmentInventoryItem,
  WarehouseLocation,
  InventoryMovementLog,
  FulfillmentOrder,
  FulfillmentIncidence,
  FulfillmentReturn,
  FulfillmentWithdrawal,
  FulfillmentConfig
} from '../types';

export interface BootstrapResponse {
  stores: Store[];
  products: Product[];
  categories: Category[];
  users: User[];
  orders: Order[];
  storeBalances: Record<string, StoreBalance>;
  settlements: Settlement[];
  disputes: Dispute[];
  banners: Banner[];
  coupons: Coupon[];
  systemSettings: SystemSettings;
  auditLogs: AuditLog[];
  reviews: Review[];
  orderMessages?: OrderChatMessage[];
  paymentTransactions?: PaymentTransaction[];
  financialAuditLogs?: FinancialAuditLog[];
  paymentGateways?: PaymentGatewayConfig[];
  adPlacements?: AdPlacement[];
  advertisements?: Advertisement[];
  storageRequests?: StorageRequest[];
  fulfillmentInventory?: FulfillmentInventoryItem[];
  inventoryMovements?: InventoryMovementLog[];
  fulfillmentOrders?: FulfillmentOrder[];
  fulfillmentIncidences?: FulfillmentIncidence[];
  fulfillmentReturns?: FulfillmentReturn[];
  fulfillmentWithdrawals?: FulfillmentWithdrawal[];
  fulfillmentConfig?: FulfillmentConfig;
  version: number;
  lastUpdated: string;
}

export interface SyncResponse {
  hasUpdates: boolean;
  version: number;
  data?: BootstrapResponse;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('plazado_auth_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {})
  };
  const res = await fetch(endpoint, {
    ...options,
    headers
  });
  const json = await res.json();
  return json;
}

export const api = {
  // Bootstrap & Real-time Sync
  async getBootstrap(): Promise<{ success: boolean; data: BootstrapResponse; version: number }> {
    return request('/api/bootstrap');
  },

  async sync(version: number): Promise<SyncResponse> {
    return request(`/api/sync?v=${version}`);
  },

  // Stores
  async getStores(): Promise<{ success: boolean; stores: Store[] }> {
    return request('/api/stores');
  },

  async createStore(data: Omit<Store, 'id' | 'status' | 'rating' | 'reviewCount' | 'salesCount' | 'createdAt'>): Promise<{ success: boolean; store: Store; version: number }> {
    return request('/api/stores', { method: 'POST', body: JSON.stringify(data) });
  },

  async updateStore(id: string, data: Partial<Store>): Promise<{ success: boolean; store: Store; version: number }> {
    return request(`/api/stores/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async updateStoreStatus(id: string, status: StoreStatus, reason?: string): Promise<{ success: boolean; store: Store; version: number }> {
    return request(`/api/stores/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, reason }) });
  },

  async toggleStorePublish(id: string): Promise<{ success: boolean; store: Store; version: number }> {
    return request(`/api/stores/${id}/toggle-publish`, { method: 'PATCH' });
  },

  async deleteStore(id: string): Promise<{ success: boolean; version: number }> {
    return request(`/api/stores/${id}`, { method: 'DELETE' });
  },

  // Products
  async getProducts(): Promise<{ success: boolean; products: Product[] }> {
    return request('/api/products');
  },

  async createProduct(data: Omit<Product, 'id' | 'reservedStock' | 'soldCount' | 'rating' | 'reviewCount' | 'createdAt'>): Promise<{ success: boolean; product: Product; version: number }> {
    return request('/api/products', { method: 'POST', body: JSON.stringify(data) });
  },

  async updateProduct(id: string, data: Partial<Product>): Promise<{ success: boolean; product: Product; version: number }> {
    return request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async deleteProduct(id: string): Promise<{ success: boolean; version: number }> {
    return request(`/api/products/${id}`, { method: 'DELETE' });
  },

  async cleanTestProducts(): Promise<{ success: boolean; cleanedCount: number; version: number }> {
    return request('/api/products/clean-test', { method: 'POST' });
  },

  // Categories
  async getCategories(): Promise<{ success: boolean; categories: Category[] }> {
    return request('/api/categories');
  },

  async createCategory(data: Omit<Category, 'id'>): Promise<{ success: boolean; category: Category; version: number }> {
    return request('/api/categories', { method: 'POST', body: JSON.stringify(data) });
  },

  async updateCategory(id: string, data: Partial<Category>): Promise<{ success: boolean; category: Category; version: number }> {
    return request(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async deleteCategory(id: string): Promise<{ success: boolean; version: number }> {
    return request(`/api/categories/${id}`, { method: 'DELETE' });
  },

  async mergeCategories(sourceId: string, targetId: string): Promise<{ success: boolean; version: number }> {
    return request('/api/categories/merge', { method: 'POST', body: JSON.stringify({ sourceId, targetId }) });
  },

  // Technical Specifications
  async getSpecifications(subcategoryId?: string, categoryId?: string): Promise<{ success: boolean; specifications: CategorySpecification[] }> {
    const params = new URLSearchParams();
    if (subcategoryId) params.append('subcategoryId', subcategoryId);
    if (categoryId) params.append('categoryId', categoryId);
    return request(`/api/specifications?${params.toString()}`);
  },

  async getAllSpecifications(): Promise<{ success: boolean; specifications: CategorySpecification[] }> {
    return request('/api/specifications/all');
  },

  async createSpecification(data: Omit<CategorySpecification, 'id'>): Promise<{ success: boolean; specification: CategorySpecification; version: number }> {
    return request('/api/specifications', { method: 'POST', body: JSON.stringify(data) });
  },

  async updateSpecification(id: string, data: Partial<CategorySpecification>): Promise<{ success: boolean; specification: CategorySpecification; version: number }> {
    return request(`/api/specifications/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async deleteSpecification(id: string): Promise<{ success: boolean; version: number }> {
    return request(`/api/specifications/${id}`, { method: 'DELETE' });
  },

  // Settings
  async updateSettings(data: Partial<SystemSettings>): Promise<{ success: boolean; settings: SystemSettings; version: number }> {
    return request('/api/settings', { method: 'PUT', body: JSON.stringify(data) });
  },

  // Banners
  async createBanner(data: Omit<Banner, 'id'>): Promise<{ success: boolean; banner: Banner; version: number }> {
    return request('/api/banners', { method: 'POST', body: JSON.stringify(data) });
  },

  async updateBanner(id: string, data: Partial<Banner>): Promise<{ success: boolean; banner: Banner; version: number }> {
    return request(`/api/banners/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async deleteBanner(id: string): Promise<{ success: boolean; version: number }> {
    return request(`/api/banners/${id}`, { method: 'DELETE' });
  },

  // Orders
  async createOrders(orders: Order[]): Promise<{ success: boolean; orders: Order[]; version: number }> {
    return request('/api/orders', { method: 'POST', body: JSON.stringify({ orders }) });
  },

  async updateOrderStatus(id: string, status: OrderStatus, note?: string, confirmationCode?: string): Promise<{ success: boolean; message: string; order?: Order; version: number }> {
    return request(`/api/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, note, confirmationCode }) });
  },

  async deleteOrder(id: string): Promise<{ success: boolean; version: number }> {
    return request(`/api/orders/${id}`, { method: 'DELETE' });
  },

  // Balances & Settlements
  async requestSettlement(storeId: string, notes?: string): Promise<{ success: boolean; message: string; settlement?: Settlement; version: number }> {
    return request('/api/settlements', { method: 'POST', body: JSON.stringify({ storeId, notes }) });
  },

  async runWeeklySettlements(actorName?: string): Promise<{ 
    success: boolean; 
    message: string; 
    settlementsCreated: Settlement[]; 
    totalLiquidated: number; 
    totalCommissionsDeducted: number; 
    totalCashCommissionsDeducted: number; 
    storesProcessed: number; 
    version: number;
  }> {
    return request('/api/admin/settlements/run-weekly', { method: 'POST', body: JSON.stringify({ actorName }) });
  },

  async getFinancialTransactions(): Promise<{ success: boolean; transactions: PaymentTransaction[] }> {
    return request('/api/financial/transactions');
  },

  async getFinancialAuditLogs(): Promise<{ success: boolean; logs: FinancialAuditLog[] }> {
    return request('/api/financial/audit-logs');
  },

  async sendPaymentWebhook(payload: any): Promise<{ success: boolean; message: string; version: number }> {
    return request('/api/payments/webhook', { method: 'POST', body: JSON.stringify(payload) });
  },

  async processSettlement(id: string, status: Settlement['status'], reference?: string): Promise<{ success: boolean; settlement: Settlement; version: number }> {
    return request(`/api/settlements/${id}`, { method: 'PATCH', body: JSON.stringify({ status, reference }) });
  },

  async deleteSettlement(id: string): Promise<{ success: boolean; version: number }> {
    return request(`/api/settlements/${id}`, { method: 'DELETE' });
  },

  // Disputes
  async createDispute(data: Omit<Dispute, 'id' | 'status' | 'createdAt'>): Promise<{ success: boolean; dispute: Dispute; version: number }> {
    return request('/api/disputes', { method: 'POST', body: JSON.stringify(data) });
  },

  async resolveDispute(id: string, status: Dispute['status'], resolutionNotes: string): Promise<{ success: boolean; dispute: Dispute; version: number }> {
    return request(`/api/disputes/${id}`, { method: 'PATCH', body: JSON.stringify({ status, resolutionNotes }) });
  },

  async deleteDispute(id: string): Promise<{ success: boolean; version: number }> {
    return request(`/api/disputes/${id}`, { method: 'DELETE' });
  },

  // Reviews
  async createReview(data: Omit<Review, 'id' | 'createdAt' | 'isVerifiedPurchase' | 'isModerated'>): Promise<{ success: boolean; review: Review; version: number }> {
    return request('/api/reviews', { method: 'POST', body: JSON.stringify(data) });
  },

  async deleteReview(id: string): Promise<{ success: boolean; version: number }> {
    return request(`/api/reviews/${id}`, { method: 'DELETE' });
  },

  // Auth & Users
  async sendVerificationCode(email: string, name?: string, type?: 'CUSTOMER' | 'STORE'): Promise<{ success: boolean; message: string; code?: string; delivered?: boolean; warning?: string; expiresInSeconds?: number }> {
    return request('/api/auth/send-verification-code', { method: 'POST', body: JSON.stringify({ email, name, type }) });
  },

  async resendVerificationCode(email: string): Promise<{ success: boolean; message: string; delivered?: boolean; cooldownSeconds?: number; expiresInSeconds?: number }> {
    return request('/api/auth/resend-verification-code', { method: 'POST', body: JSON.stringify({ email }) });
  },

  async testSmtpConnection(data: any): Promise<{ success: boolean; message: string }> {
    return request('/api/admin/mail/test', { method: 'POST', body: JSON.stringify(data) });
  },

  async verifyCode(email: string, code: string): Promise<{ success: boolean; message: string; verified?: boolean; user?: User; token?: string }> {
    return request('/api/auth/verify-code', { method: 'POST', body: JSON.stringify({ email, code }) });
  },

  async submitKyc(data: {
    userId?: string;
    cedulaNumber: string;
    cedulaFrontUrl: string;
    selfieUrl?: string;
    biometricScore?: number;
  }): Promise<{ success: boolean; message: string; user?: User; version?: number }> {
    return request('/api/user/kyc', { method: 'POST', body: JSON.stringify(data) });
  },

  // Super Admin Verification & Identity Validation Operations
  async getVerifications(): Promise<{ success: boolean; verifications: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    cedulaNumber?: string;
    cedulaFrontUrl?: string;
    selfieUrl?: string;
    biometricScore?: number;
    biometricStatus?: 'VERIFIED' | 'PENDING' | 'REJECTED';
    isKycVerified?: boolean;
    adminApprovalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedAt?: string;
    approvedBy?: string;
    rejectedAt?: string;
    rejectedBy?: string;
    rejectionReason?: string;
    accountType: 'CUSTOMER' | 'STORE';
    storeName?: string;
    storeId?: string;
    registeredAt: string;
    isEmailVerified: boolean;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'EXPIRED';
    code?: string;
    codeExpiresAt?: number;
    attempts: number;
    resendCount: number;
    lastSentAt: number;
  }>; message?: string }> {
    return request('/api/admin/verifications');
  },

  async adminApproveUser(userIdOrEmail: string): Promise<{ success: boolean; message: string; user?: User; version?: number }> {
    return request('/api/admin/approve-user', { method: 'POST', body: JSON.stringify({ userId: userIdOrEmail, email: userIdOrEmail }) });
  },

  async adminRejectUser(userIdOrEmail: string, reason: string): Promise<{ success: boolean; message: string; user?: User; version?: number }> {
    return request('/api/admin/reject-user', { method: 'POST', body: JSON.stringify({ userId: userIdOrEmail, email: userIdOrEmail, reason }) });
  },

  async createSuperAdmin(data: { name: string; email: string; phone: string; password: string }): Promise<{ success: boolean; message: string; user?: User; version?: number }> {
    return request('/api/admin/create-super-admin', { method: 'POST', body: JSON.stringify(data) });
  },

  async adminConsultVerificationCode(email: string): Promise<{
    success: boolean;
    email: string;
    name: string;
    code?: string;
    codeExpiresAt?: number;
    isExpired?: boolean;
    attempts?: number;
    isEmailVerified?: boolean;
    message?: string;
  }> {
    return request('/api/admin/verifications/consult-code', { method: 'POST', body: JSON.stringify({ email }) });
  },

  async adminGenerateNewVerificationCode(email: string): Promise<{
    success: boolean;
    newCode: string;
    expiresAt: number;
    delivered?: boolean;
    message: string;
  }> {
    return request('/api/admin/verifications/generate-new-code', { method: 'POST', body: JSON.stringify({ email }) });
  },

  async adminManualVerify(email: string, reason?: string): Promise<{ success: boolean; message: string }> {
    return request('/api/admin/verifications/manual-verify', { method: 'POST', body: JSON.stringify({ email, reason }) });
  },

  async adminResendVerificationEmail(email: string): Promise<{ success: boolean; delivered?: boolean; message: string }> {
    return request('/api/admin/verifications/resend-email', { method: 'POST', body: JSON.stringify({ email }) });
  },

  async getMe(): Promise<{ success: boolean; user?: User; message?: string }> {
    return request('/api/auth/me');
  },

  async login(email: string, password: string): Promise<{ success: boolean; user?: User; token?: string; message?: string; version?: number }> {
    return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  },

  async registerCustomer(data: CustomerRegistrationInput): Promise<{ success: boolean; user?: User; token?: string; message?: string; pendingVerification?: boolean; email?: string; name?: string; accountType?: string; version?: number }> {
    return request('/api/auth/register-customer', { method: 'POST', body: JSON.stringify(data) });
  },

  async registerStore(data: StoreRegistrationInput): Promise<{ success: boolean; store?: Store; user?: User; token?: string; message?: string; pendingVerification?: boolean; email?: string; name?: string; storeName?: string; accountType?: string; version?: number }> {
    return request('/api/auth/register-store', { method: 'POST', body: JSON.stringify(data) });
  },

  // Super Admin: Asignar usuario administrador (correo y contraseña) a una tienda
  async assignStoreAdmin(storeId: string, data: { email: string; password: string; name?: string; phone?: string }): Promise<{ success: boolean; message: string; user?: User; store?: Store; version?: number }> {
    return request(`/api/admin/stores/${storeId}/assign-admin`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async getStoreAdminUser(storeId: string): Promise<{ success: boolean; user: User | null }> {
    return request(`/api/admin/stores/${storeId}/admin-user`);
  },

  async updateUser(id: string, data: Partial<User>): Promise<{ success: boolean; user: User; version: number }> {
    return request(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async updateUserPassword(id: string, newPassword: string, currentPassword?: string): Promise<{ success: boolean; message?: string; user?: User; version: number }> {
    return request(`/api/users/${id}/password`, { method: 'POST', body: JSON.stringify({ newPassword, currentPassword }) });
  },

  async changePassword(id: string, data: { newPassword: string; currentPassword?: string }): Promise<{ success: boolean; message?: string; user?: User; version: number }> {
    return this.updateUserPassword(id, data.newPassword, data.currentPassword);
  },

  async deleteUser(id: string): Promise<{ success: boolean; version: number }> {
    return request(`/api/users/${id}`, { method: 'DELETE' });
  },

  async deleteAccount(userId: string, password?: string, deleteAssociatedStore?: boolean): Promise<{ success: boolean; message: string; version: number }> {
    return request('/api/account/delete', {
      method: 'POST',
      body: JSON.stringify({ userId, password, deleteAssociatedStore })
    });
  },

  async deleteMerchantStore(storeId: string, ownerId: string, confirmationText: string): Promise<{ success: boolean; message: string; version: number }> {
    return request(`/api/stores/${storeId}/delete-by-owner`, {
      method: 'POST',
      body: JSON.stringify({ ownerId, confirmationText })
    });
  },

  // Audits & Purge
  async addAuditLog(data: { action: string; record: string; prev?: string; next?: string; user?: any }): Promise<{ success: boolean; log: AuditLog; version: number }> {
    return request('/api/audit-logs', { method: 'POST', body: JSON.stringify(data) });
  },

  async deleteAuditLog(id: string): Promise<{ success: boolean; version: number }> {
    return request(`/api/audit-logs/${id}`, { method: 'DELETE' });
  },

  async clearAllAuditLogs(): Promise<{ success: boolean; version: number }> {
    return request('/api/audit-logs', { method: 'DELETE' });
  },

  async purgeRecords(type: 'orders' | 'test_products' | 'disputes' | 'settlements' | 'audit_logs'): Promise<{ success: boolean; purgedCount: number; version: number }> {
    return request('/api/admin/purge', { method: 'POST', body: JSON.stringify({ type }) });
  },

  // Persistence & Backups
  async getPersistenceStatus(): Promise<{ success: boolean; persistence: any }> {
    return request('/api/admin/persistence/status');
  },

  async getFirestoreDiagnostic(): Promise<{ success: boolean; diagnostic: any }> {
    return request('/api/admin/persistence/firestore-diagnostic');
  },

  async syncFirestore(): Promise<{ success: boolean; message: string; persistence: any }> {
    return request('/api/admin/persistence/sync-firestore', { method: 'POST' });
  },

  async createBackup(label?: string): Promise<{ success: boolean; filename: string; timestamp: string }> {
    return request('/api/admin/persistence/backup', { method: 'POST', body: JSON.stringify({ label }) });
  },

  async restoreBackup(filename: string): Promise<{ success: boolean; message: string; version: number }> {
    return request('/api/admin/persistence/restore', { method: 'POST', body: JSON.stringify({ filename }) });
  },

  // Payment Gateways & Central Receivers
  async fetchPaymentGateways(): Promise<{ success: boolean; gateways: PaymentGatewayConfig[] }> {
    return request('/api/payment-gateways');
  },

  async fetchActivePaymentGateway(): Promise<{ success: boolean; activeGateway: PaymentGatewayConfig | null }> {
    return request('/api/payment-gateways/active');
  },

  async savePaymentGateway(gateway: PaymentGatewayConfig): Promise<{ success: boolean; gateway: PaymentGatewayConfig; version: number }> {
    return request('/api/payment-gateways', { method: 'POST', body: JSON.stringify(gateway) });
  },

  async activatePaymentGateway(id: string): Promise<{ success: boolean; activeGatewayId: string; version: number }> {
    return request(`/api/payment-gateways/${id}/activate`, { method: 'PUT' });
  },

  async deletePaymentGateway(id: string): Promise<{ success: boolean; version: number }> {
    return request(`/api/payment-gateways/${id}`, { method: 'DELETE' });
  },

  // Advertising & Ad Placements
  async fetchAdCampaigns(): Promise<{ success: boolean; campaigns: Advertisement[] }> {
    return request('/api/advertising/campaigns');
  },

  async fetchActiveAds(placement?: string, device?: string): Promise<{ success: boolean; ads: Advertisement[] }> {
    const params = new URLSearchParams();
    if (placement) params.set('placement', placement);
    if (device) params.set('device', device);
    const qs = params.toString();
    return request(`/api/advertising/active${qs ? `?${qs}` : ''}`);
  },

  async createAdCampaign(ad: Omit<Advertisement, 'id' | 'impressions' | 'clicks' | 'createdAt'>): Promise<{ success: boolean; ad: Advertisement; version: number }> {
    return request('/api/advertising/campaigns', { method: 'POST', body: JSON.stringify(ad) });
  },

  async updateAdCampaign(id: string, data: Partial<Advertisement>): Promise<{ success: boolean; ad: Advertisement; version: number }> {
    return request(`/api/advertising/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async toggleAdCampaignStatus(id: string): Promise<{ success: boolean; version: number }> {
    return request(`/api/advertising/campaigns/${id}/toggle`, { method: 'PATCH' });
  },

  async deleteAdCampaign(id: string): Promise<{ success: boolean; version: number }> {
    return request(`/api/advertising/campaigns/${id}`, { method: 'DELETE' });
  },

  async fetchAdPlacements(): Promise<{ success: boolean; placements: AdPlacement[] }> {
    return request('/api/advertising/placements');
  },

  async saveAdPlacement(placement: AdPlacement): Promise<{ success: boolean; placement: AdPlacement; version: number }> {
    return request('/api/advertising/placements', { method: 'POST', body: JSON.stringify(placement) });
  },

  async trackAdImpression(adId: string, device?: string): Promise<{ success: boolean }> {
    return request('/api/advertising/track/impression', { method: 'POST', body: JSON.stringify({ adId, device }) });
  },

  async trackAdClick(adId: string, device?: string): Promise<{ success: boolean }> {
    return request('/api/advertising/track/click', { method: 'POST', body: JSON.stringify({ adId, device }) });
  },

  // --- IN-PLATFORM ORDER CHAT ---
  async fetchOrderMessages(orderId: string): Promise<{ success: boolean; messages: OrderChatMessage[] }> {
    return request(`/api/orders/${orderId}/messages`);
  },

  async sendOrderMessage(orderId: string, data: {
    storeId: string;
    customerId: string;
    senderId: string;
    senderName: string;
    senderRole: 'CUSTOMER' | 'STORE' | 'ADMIN';
    message: string;
  }): Promise<{ success: boolean; message: OrderChatMessage; version: number }> {
    return request(`/api/orders/${orderId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async markOrderMessagesAsRead(orderId: string, role: 'CUSTOMER' | 'STORE'): Promise<{ success: boolean; version: number }> {
    return request(`/api/orders/${orderId}/messages/read`, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
  },

  // --- PLAZADO FULFILLMENT CLIENT API ---
  async getFulfillmentData(storeId?: string): Promise<{ success: boolean; data: any; version: number }> {
    const q = storeId ? `?storeId=${encodeURIComponent(storeId)}` : '';
    return request(`/api/fulfillment${q}`);
  },

  async createStorageRequest(data: any): Promise<{ success: boolean; storageRequest: StorageRequest; version: number }> {
    return request('/api/fulfillment/storage-requests', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateStorageRequestStatus(id: string, status: StorageRequestStatus, notes?: string): Promise<{ success: boolean; storageRequest: StorageRequest; version: number }> {
    return request(`/api/fulfillment/storage-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes })
    });
  },

  async processPhysicalReception(requestId: string, data: any): Promise<{ success: boolean; data: { request: StorageRequest; inventoryItem: FulfillmentInventoryItem }; version: number }> {
    return request(`/api/fulfillment/storage-requests/${requestId}/receive`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async adjustInventory(inventoryItemId: string, data: { newAvailable: number; reason: string; notes?: string }): Promise<{ success: boolean; inventoryItem: FulfillmentInventoryItem; version: number }> {
    return request(`/api/fulfillment/inventory/${inventoryItemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async relocateInventory(inventoryItemId: string, newLocation: WarehouseLocation): Promise<{ success: boolean; inventoryItem: FulfillmentInventoryItem; version: number }> {
    return request(`/api/fulfillment/inventory/${inventoryItemId}/relocate`, {
      method: 'POST',
      body: JSON.stringify({ newLocation })
    });
  },

  async blockUnblockInventory(inventoryItemId: string, quantity: number, action: 'BLOCK' | 'UNBLOCK', reason: string): Promise<{ success: boolean; inventoryItem: FulfillmentInventoryItem; version: number }> {
    return request(`/api/fulfillment/inventory/${inventoryItemId}/block-toggle`, {
      method: 'POST',
      body: JSON.stringify({ quantity, action, reason })
    });
  },

  async recordInventoryDamage(inventoryItemId: string, quantity: number, reason: string, evidencePhotos?: string[]): Promise<{ success: boolean; inventoryItem: FulfillmentInventoryItem; version: number }> {
    return request(`/api/fulfillment/inventory/${inventoryItemId}/damage`, {
      method: 'POST',
      body: JSON.stringify({ quantity, reason, evidencePhotos })
    });
  },

  async confirmOrderByStore(fulfillmentOrderId: string, storeId: string, user?: any): Promise<{ success: boolean; fulfillmentOrder: FulfillmentOrder; version: number }> {
    return request(`/api/fulfillment/orders/${fulfillmentOrderId}/confirm-by-store`, {
      method: 'POST',
      body: JSON.stringify({ storeId, user })
    });
  },

  async rejectOrderByStore(fulfillmentOrderId: string, storeId: string, reason: string, user?: any): Promise<{ success: boolean; fulfillmentOrder: FulfillmentOrder; version: number }> {
    return request(`/api/fulfillment/orders/${fulfillmentOrderId}/reject-by-store`, {
      method: 'POST',
      body: JSON.stringify({ storeId, reason, user })
    });
  },

  async validateAndPickItem(fulfillmentOrderId: string, productId: string, scannedSku: string, scannedLocation: string): Promise<{ success: boolean; error?: string; order?: FulfillmentOrder; version: number }> {
    return request(`/api/fulfillment/orders/${fulfillmentOrderId}/validate-pick-item`, {
      method: 'POST',
      body: JSON.stringify({ productId, scannedSku, scannedLocation })
    });
  },

  async completePacking(fulfillmentOrderId: string, data: any): Promise<{ success: boolean; fulfillmentOrder: FulfillmentOrder; version: number }> {
    return request(`/api/fulfillment/orders/${fulfillmentOrderId}/complete-packing`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async dispatchOrder(fulfillmentOrderId: string, data: any): Promise<{ success: boolean; fulfillmentOrder: FulfillmentOrder; version: number }> {
    return request(`/api/fulfillment/orders/${fulfillmentOrderId}/dispatch`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async deliverFulfillmentOrder(fulfillmentOrderId: string, data: any): Promise<{ success: boolean; fulfillmentOrder: FulfillmentOrder; version: number }> {
    return request(`/api/fulfillment/orders/${fulfillmentOrderId}/deliver`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async createFulfillmentIncidence(data: any): Promise<{ success: boolean; incidence: FulfillmentIncidence; version: number }> {
    return request('/api/fulfillment/incidences', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateFulfillmentIncidence(id: string, data: any): Promise<{ success: boolean; incidence: FulfillmentIncidence; version: number }> {
    return request(`/api/fulfillment/incidences/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  async createFulfillmentReturn(data: any): Promise<{ success: boolean; returnRecord: FulfillmentReturn; version: number }> {
    return request('/api/fulfillment/returns', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async classifyReturn(returnId: string, data: any): Promise<{ success: boolean; returnRecord: FulfillmentReturn; version: number }> {
    return request(`/api/fulfillment/returns/${returnId}/classify`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async createWithdrawal(data: any): Promise<{ success: boolean; withdrawal: FulfillmentWithdrawal; version: number }> {
    return request('/api/fulfillment/withdrawals', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateWithdrawalStatus(id: string, status: string, notes?: string): Promise<{ success: boolean; withdrawal: FulfillmentWithdrawal; version: number }> {
    return request(`/api/fulfillment/withdrawals/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes })
    });
  },

  async updateFulfillmentConfig(config: Partial<FulfillmentConfig>): Promise<{ success: boolean; config: FulfillmentConfig; version: number }> {
    return request('/api/fulfillment/config', {
      method: 'PUT',
      body: JSON.stringify(config)
    });
  },

  async generateProductDescription(params: {
    productName: string;
    categoryName?: string;
    storeName?: string;
    price?: number;
    promoPrice?: number;
    tone?: 'persuasive' | 'technical' | 'premium' | 'concise';
    keywords?: string;
  }): Promise<{ success: boolean; description: string; highlights?: string[]; tags?: string[]; source?: string }> {
    return request('/api/ai/generate-product-description', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }
};
