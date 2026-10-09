import { applyPayPalCapture } from './paypal-checkout';
import { encryptPayPalSecret } from './paypal-credentials';
import { recordCashCommissionState, transitionOrder, processSettlementState, requestSettlementState, weeklySettlementsState } from './financial-lifecycle';
import { commerceChanges } from './commerce-changes';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { cloudSqlRepo } from './cloudsql-repository';
import { firestoreRepo } from './firestore-repository';
import { storesDb } from './stores-database';
import { 
  User, 
  UserCredential,
  UserVerificationInfo,
  Store, 
  Category, 
  Product, 
  Order, 
  OrderStatus,
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
  StoreStatus,
  PaymentMethodType,
  PaymentTransaction,
  FinancialAuditLog,
  PaymentGatewayConfig,
  AdPlacement,
  Advertisement,
  AdMetricEvent,
  OrderChatMessage,
  CategorySpecification,
  StorageRequest,
  FulfillmentInventoryItem,
  InventoryMovementLog,
  FulfillmentOrder,
  FulfillmentIncidence,
  FulfillmentReturn,
  FulfillmentWithdrawal,
  FulfillmentConfig
} from '../src/types';
import { DEFAULT_FULFILLMENT_CONFIG } from './fulfillment-service';
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
} from '../src/data/initialData';

export interface GlobalDatabaseData {
  stores: Store[];
  products: Product[];
  categories: Category[];
  users: User[];
  userCredentials?: UserCredential[];
  orders: Order[];
  storeBalances: Record<string, StoreBalance>;
  settlements: Settlement[];
  disputes: Dispute[];
  reviews: Review[];
  banners: Banner[];
  coupons: Coupon[];
  systemSettings: SystemSettings;
  auditLogs: AuditLog[];
  paymentTransactions?: PaymentTransaction[];
  financialAuditLogs?: FinancialAuditLog[];
  paymentGateways?: PaymentGatewayConfig[];
  advertisements?: Advertisement[];
  adPlacements?: AdPlacement[];
  adMetricEvents?: AdMetricEvent[];
  orderMessages?: OrderChatMessage[];
  specifications?: CategorySpecification[];
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

class GlobalDatabase {
  private checkoutQueue: Promise<void> = Promise.resolve();
  private stagingCheckout = false;
  private settingsUpdateQueue: Promise<void> = Promise.resolve();
  private dataDir: string;
  private backupDir: string;
  private dataFilePath: string;
  private latestBackupPath: string;
  private snapshotPath: string;
  private memoryData: GlobalDatabaseData;
  private lastFirestoreSync: string | null = null;
  private firestoreSyncStatus: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' = 'DISCONNECTED';

  constructor() {
    this.dataDir = path.resolve(process.cwd(), 'data');
    this.backupDir = path.join(this.dataDir, 'backups');
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    this.dataFilePath = path.join(this.dataDir, 'plazado_global_database.json');
    this.latestBackupPath = path.join(this.backupDir, 'plazado_db_backup_latest.json');
    this.snapshotPath = path.resolve(process.cwd(), 'server', 'data_snapshot.json');

    this.memoryData = this.loadOrInitialize();
    // Each process uses an independent cache version; equal counters across instances must not hide updates.
    this.memoryData.version=crypto.randomInt(1,2**48-1);
  }

  private tryParseJson(filePath: string): GlobalDatabaseData | null {
    try {
      if (!fs.existsSync(filePath)) return null;
      const content = fs.readFileSync(filePath, 'utf-8');
      if (!content || !content.trim()) return null;
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.stores) && Array.isArray(parsed.users)) {
        return parsed as GlobalDatabaseData;
      }
    } catch (e) {
      console.warn(`[GlobalDatabase] Warning: Could not parse JSON from ${filePath}:`, e);
    }
    return null;
  }

  private loadOrInitialize(): GlobalDatabaseData {
    let activeData: GlobalDatabaseData | null = null;
    let loadedFrom = 'none';

    // 1. Primary datastore check: data/plazado_global_database.json
    if (fs.existsSync(this.dataFilePath)) {
      try {
        const raw = fs.readFileSync(this.dataFilePath, 'utf-8');
        if (raw && raw.trim()) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object') {
            activeData = parsed as GlobalDatabaseData;
            loadedFrom = 'primary_file';
          }
        }
      } catch (err) {
        console.error('[GlobalDatabase CRITICAL] Error parsing primary database file. Preserving corrupt file for recovery:', err);
        try {
          const corruptBackupPath = path.join(this.backupDir, `corrupt_${Date.now()}_plazado_db.json`);
          fs.copyFileSync(this.dataFilePath, corruptBackupPath);
          console.log(`[GlobalDatabase] Corrupted file saved to backup: ${corruptBackupPath}`);
        } catch (copyErr) {
          console.error('[GlobalDatabase] Failed to preserve corrupted file:', copyErr);
        }
      }
    }

    // 2. If primary file was missing or invalid, check rolling backup
    if (!activeData && fs.existsSync(this.latestBackupPath)) {
      const backupData = this.tryParseJson(this.latestBackupPath);
      if (backupData) {
        activeData = backupData;
        loadedFrom = 'latest_backup';
        console.log('[GlobalDatabase] Recovered database state from latest backup snapshot.');
      }
    }

    // 3. If still missing, check immutable server snapshot (persists across fresh container builds)
    if (!activeData && fs.existsSync(this.snapshotPath)) {
      const snapshotData = this.tryParseJson(this.snapshotPath);
      if (snapshotData) {
        activeData = snapshotData;
        loadedFrom = 'server_snapshot';
        console.log('[GlobalDatabase] Recovered database state from repository server snapshot.');
      }
    }

    // 4. In pure production, if no data exists, start with clean baseline (0 stores, 0 products)
    if (!activeData) {
      console.log('[GlobalDatabase] No database found on disk. Initializing clean production baseline (0 stores, 0 products).');
      activeData = {
        stores: [],
        products: [],
        categories: INITIAL_CATEGORIES,
        users: INITIAL_USERS,
        orders: [],
        storeBalances: {},
        settlements: [],
        disputes: [],
        banners: [],
        coupons: [],
        systemSettings: INITIAL_SETTINGS,
        auditLogs: [],
        reviews: [],
        version: 1,
        lastUpdated: new Date().toISOString()
      };
      loadedFrom = 'clean_production';
    }

    // Ensure all critical collections are always valid arrays/objects (protect against undefined properties)
    activeData.stores = Array.isArray(activeData.stores) ? activeData.stores : [];
    activeData.products = Array.isArray(activeData.products) ? activeData.products : [];

    // Non-destructive synchronization with dedicated Stores Database internal registry
    const dedicatedStores = storesDb.getAllAdminStores();
    if (dedicatedStores.length > 0) {
      for (const dst of dedicatedStores) {
        const exIdx = activeData.stores.findIndex(s => s.id === dst.id);
        if (exIdx === -1) {
          activeData.stores.push(dst);
        } else {
          activeData.stores[exIdx] = { ...dst, ...activeData.stores[exIdx] };
        }
      }
    } else if (activeData.stores.length > 0) {
      for (const st of activeData.stores) {
        storesDb.applyDurableStore(st);
      }
    }

    // Non-destructive synchronization of official categories and subcategories
    if (Array.isArray(activeData.categories) && activeData.categories.length > 0) {
      for (const offCat of INITIAL_CATEGORIES) {
        const existingIdx = activeData.categories.findIndex(c => c.id === offCat.id);
        if (existingIdx === -1) {
          activeData.categories.push(offCat);
        } else {
          activeData.categories[existingIdx] = {
            ...offCat,
            ...activeData.categories[existingIdx],
            isActive: activeData.categories[existingIdx].isActive !== undefined ? activeData.categories[existingIdx].isActive : true
          };
        }
      }
    } else {
      activeData.categories = [...INITIAL_CATEGORIES];
    }

    // Non-destructive synchronization of technical specifications
    if (Array.isArray(activeData.specifications) && activeData.specifications.length > 0) {
      for (const offSpec of INITIAL_SPECIFICATIONS) {
        if (!activeData.specifications.some(s => s.id === offSpec.id)) {
          activeData.specifications.push(offSpec);
        }
      }
    } else {
      activeData.specifications = [...INITIAL_SPECIFICATIONS];
    }

    activeData.users = Array.isArray(activeData.users) ? activeData.users : [];
    activeData.orders = Array.isArray(activeData.orders) ? activeData.orders : [];
    activeData.storeBalances = activeData.storeBalances && typeof activeData.storeBalances === 'object' ? activeData.storeBalances : {};
    activeData.settlements = Array.isArray(activeData.settlements) ? activeData.settlements : [];
    activeData.disputes = Array.isArray(activeData.disputes) ? activeData.disputes : [];
    activeData.banners = Array.isArray(activeData.banners) ? activeData.banners : [];
    activeData.coupons = Array.isArray(activeData.coupons) ? activeData.coupons : [];
    activeData.auditLogs = Array.isArray(activeData.auditLogs) ? activeData.auditLogs : [];
    activeData.reviews = Array.isArray(activeData.reviews) ? activeData.reviews : [];
    activeData.paymentTransactions = Array.isArray((activeData as any).paymentTransactions) ? (activeData as any).paymentTransactions : [];
    activeData.financialAuditLogs = Array.isArray((activeData as any).financialAuditLogs) ? (activeData as any).financialAuditLogs : [];
    activeData.paymentGateways = Array.isArray((activeData as any).paymentGateways) && (activeData as any).paymentGateways.length > 0 
      ? (activeData as any).paymentGateways 
      : INITIAL_PAYMENT_GATEWAYS;
    activeData.adPlacements = Array.isArray((activeData as any).adPlacements) && (activeData as any).adPlacements.length > 0
      ? (activeData as any).adPlacements
      : INITIAL_AD_PLACEMENTS;
    activeData.advertisements = Array.isArray((activeData as any).advertisements) && (activeData as any).advertisements.length > 0
      ? (activeData as any).advertisements
      : INITIAL_ADVERTISEMENTS;
    activeData.adMetricEvents = Array.isArray((activeData as any).adMetricEvents) ? (activeData as any).adMetricEvents : [];
    activeData.orderMessages = Array.isArray((activeData as any).orderMessages) ? (activeData as any).orderMessages : [];
    activeData.storageRequests = Array.isArray((activeData as any).storageRequests) ? (activeData as any).storageRequests : [];
    activeData.fulfillmentInventory = Array.isArray((activeData as any).fulfillmentInventory) ? (activeData as any).fulfillmentInventory : [];
    activeData.inventoryMovements = Array.isArray((activeData as any).inventoryMovements) ? (activeData as any).inventoryMovements : [];
    activeData.fulfillmentOrders = Array.isArray((activeData as any).fulfillmentOrders) ? (activeData as any).fulfillmentOrders : [];
    activeData.fulfillmentIncidences = Array.isArray((activeData as any).fulfillmentIncidences) ? (activeData as any).fulfillmentIncidences : [];
    activeData.fulfillmentReturns = Array.isArray((activeData as any).fulfillmentReturns) ? (activeData as any).fulfillmentReturns : [];
    activeData.fulfillmentWithdrawals = Array.isArray((activeData as any).fulfillmentWithdrawals) ? (activeData as any).fulfillmentWithdrawals : [];
    activeData.fulfillmentConfig = (activeData as any).fulfillmentConfig || DEFAULT_FULFILLMENT_CONFIG;

    // Ensure systemSettings includes all default keys (branding, logo, favicon, commission) without erasing custom values
    activeData.systemSettings = {
      ...INITIAL_SETTINGS,
      ...(activeData.systemSettings || {})
    };
    if (typeof activeData.systemSettings.plazaCommissionRate !== 'number') {
      activeData.systemSettings.plazaCommissionRate = 0.30; // 30%
    }
    if (!activeData.systemSettings.mailConfig) {
      activeData.systemSettings.mailConfig = {
        senderEmail: 'contacto@plazado.com',
        senderName: 'PlazaDO.com - Marketplace Dominicano',
        smtpHost: 'smtp.gmail.com',
        smtpPort: 465,
        smtpUser: 'contacto@plazado.com',
        useSsl: true,
        isConfigured: true
      };
    } else {
      if (!activeData.systemSettings.mailConfig.senderEmail || activeData.systemSettings.mailConfig.senderEmail.toLowerCase() === 'luiss.jimeness@gmail.com') {
        activeData.systemSettings.mailConfig.senderEmail = 'contacto@plazado.com';
      }
      if (!activeData.systemSettings.mailConfig.smtpUser || activeData.systemSettings.mailConfig.smtpUser.toLowerCase() === 'luiss.jimeness@gmail.com') {
        activeData.systemSettings.mailConfig.smtpUser = 'contacto@plazado.com';
      }
      activeData.systemSettings.mailConfig.senderName = activeData.systemSettings.mailConfig.senderName || 'PlazaDO.com - Marketplace Dominicano';
    }

    // Ensure financial structure on all store balances
    Object.keys(activeData.storeBalances).forEach(sId => {
      const b = activeData.storeBalances[sId];
      if (b) {
        b.cardSales = typeof b.cardSales === 'number' ? b.cardSales : (b.totalSales || 0);
        b.cashSales = typeof b.cashSales === 'number' ? b.cashSales : 0;
        b.pendingCashCommissions = typeof b.pendingCashCommissions === 'number' ? b.pendingCashCommissions : 0;
        b.retainedBalance = typeof b.retainedBalance === 'number' ? b.retainedBalance : 0;
        b.adjustments = typeof b.adjustments === 'number' ? b.adjustments : 0;
        b.carriedOverDebt = typeof b.carriedOverDebt === 'number' ? b.carriedOverDebt : 0;
      }
    });

    // Ensure Super Admin accounts exist and are intact without altering any user passwords or other accounts
    // User identities and roles are loaded from persistent storage; startup must not seed accounts.

    // Safeguard: Check immutable backup to restore persistent production stores/products/users if empty
    const immutableBackupPath = path.join(this.backupDir, 'plazado_db_backup_immutable.json');
    if (activeData.stores.length === 0 && fs.existsSync(immutableBackupPath)) {
      const imm = this.tryParseJson(immutableBackupPath);
      if (imm && Array.isArray(imm.stores) && imm.stores.length > 0) {
        console.log(`[GlobalDatabase] Restoring ${imm.stores.length} production stores and ${imm.products?.length || 0} products from immutable backup.`);
        activeData.stores = [...imm.stores];
        if (Array.isArray(imm.products) && imm.products.length > 0) {
          activeData.products = [...imm.products];
        }
        // Never restore users from the immutable local backup. Firestore is the
        // authoritative identity store; restoring stale users here resurrected
        // accounts intentionally removed from production.
      }
    }

    // Ensure initial verified stores are present, while safeguarding all custom user-created stores
    this.normalizeStores(activeData);

    // Save baseline snapshot to ensure synchronization
    this.saveToDisk(activeData);

    console.log(`[GlobalDatabase] Loaded successfully from ${loadedFrom}. Counts: ${activeData.users.length} users, ${activeData.stores.length} stores, ${activeData.products.length} products, ${activeData.orders.length} orders. Version: ${activeData.version}`);
    return activeData;
  }

  private normalizeStores(data: GlobalDatabaseData) {
    // 1. Safeguard ALL registered stores: ensure unique slugs and link owner account
    const seenIds = new Set<string>();
    const seenSlugs = new Set<string>();
    const safeStores: Store[] = [];

    for (const store of data.stores) {
      if (!store.id || seenIds.has(store.id)) continue;
      seenIds.add(store.id);

      // Resolve slug collision without dropping the store
      let slug = (store.slug || store.id).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || store.id;
      if (seenSlugs.has(slug)) {
        let counter = 2;
        while (seenSlugs.has(`${slug}-${counter}`)) {
          counter++;
        }
        slug = `${slug}-${counter}`;
      }
      seenSlugs.add(slug);

      // Link owner account if available
      let ownerId = store.ownerId || (store as any).owner_id;
      if (!ownerId) {
        const ownerUser = data.users.find(u => u.storeId === store.id || (u.email && u.email.toLowerCase() === store.email?.toLowerCase()));
        if (ownerUser) {
          ownerId = ownerUser.id;
        } else {
          ownerId = `owner-${store.id}`;
        }
      }

      // Preserve exact store fields created by users without altering their decisions
      safeStores.push({
        ...store,
        slug,
        ownerId: ownerId,
        owner_id: ownerId,
        status: store.status || 'APPROVED',
        isPublished: store.isPublished !== undefined ? store.isPublished : true,
        rating: typeof store.rating === 'number' ? store.rating : 0,
        reviewCount: typeof store.reviewCount === 'number' ? store.reviewCount : 0,
        salesCount: typeof store.salesCount === 'number' ? store.salesCount : 0
      } as Store);
    }

    data.stores = safeStores;
  }

  private saveToDisk(dataToSave: GlobalDatabaseData) {
    try {
      dataToSave.version = (dataToSave.version || 0) + 1;
      dataToSave.lastUpdated = new Date().toISOString();
      const serialized = JSON.stringify(dataToSave, null, 2);

      // 1. Atomic write to primary database file
      const tmpPath = `${this.dataFilePath}.tmp`;
      fs.writeFileSync(tmpPath, serialized, 'utf-8');
      fs.renameSync(tmpPath, this.dataFilePath);

      // 2. Synchronous write to latest backup snapshot
      try {
        fs.writeFileSync(this.latestBackupPath, serialized, 'utf-8');
      } catch (backupErr) {
        console.warn('[GlobalDatabase] Could not write to backup snapshot:', backupErr);
      }

      // 3. Synchronous write to server snapshot (preserves data in repository across builds)
      try {
        fs.writeFileSync(this.snapshotPath, serialized, 'utf-8');
      } catch (snapshotErr) {
        console.warn('[GlobalDatabase] Could not write to server snapshot:', snapshotErr);
      }

      // 4. Safely synchronize backup snapshot
      try {
        const immutablePath = path.join(this.backupDir, 'plazado_db_backup_immutable.json');
        fs.writeFileSync(immutablePath, serialized, 'utf-8');
      } catch (immErr) {
        console.warn('[GlobalDatabase] Could not write to immutable backup:', immErr);
      }
    } catch (err) {
      console.error('[GlobalDatabase FATAL] Failed writing database file:', err);
    }
  }

  private commit() {
    if (this.stagingCheckout) return;
    this.saveToDisk(this.memoryData);
  }

  public async initFirestoreSync(): Promise<void> {
    try {
      console.log('[GlobalDatabase] Connecting directly to Firestore Production Database (dazzling-spirit-271219)...');
      const firestoreData = await firestoreRepo.loadFullState();
      if (!firestoreData) {
        this.firestoreSyncStatus = 'ERROR';
        console.error('[GlobalDatabase] Firestore state unavailable; memory users were NOT synchronized.');
        throw new Error('No se pudo leer el estado completo de Firestore. No se modificaron usuarios.');
      }

      let updated = false;
      // Firestore is authoritative for stores in production. Never merge an
      // ephemeral/local copy over persisted store configuration.
      if (Array.isArray(firestoreData.stores)) {
        console.log(`[GlobalDatabase] Loading ${firestoreData.stores.length} authoritative stores from Firestore.`);
        this.memoryData.stores = [...firestoreData.stores];
        storesDb.syncFromFirestore(firestoreData.stores);
        updated = true;
      }
      if (Array.isArray(firestoreData.products)) {
        console.log(`[GlobalDatabase] Loading ${firestoreData.products.length} authoritative products from Firestore.`);
        this.memoryData.products = [...firestoreData.products];
        updated = true;
      }
      if (firestoreData.categories && firestoreData.categories.length > 0) {
        console.log(`[GlobalDatabase] Loaded ${firestoreData.categories.length} official categories from Firestore.`);
        // Non-destructively merge: keep all existing production categories from Firestore, and ensure new categories (like Rent Car and Dealer) are preserved
        const mergedCategories = [...firestoreData.categories];
        for (const offCat of INITIAL_CATEGORIES) {
          const exists = mergedCategories.some(c => c.id === offCat.id || c.slug === offCat.slug);
          if (!exists) {
            mergedCategories.push(offCat);
            firestoreRepo.saveCategory(offCat).catch(e => console.warn(`[GlobalDatabase] Error syncing category ${offCat.name} to Firestore:`, e));
          }
        }
        this.memoryData.categories = mergedCategories;
        updated = true;
      }
      if (Array.isArray(firestoreData.users)) {
        console.log(`[GlobalDatabase] Firestore is authoritative for users: ${firestoreData.users.length} users loaded.`);
        // Firestore is the persistent source of truth. Never let an ephemeral Railway
        // snapshot silently replace authenticated Firestore users after a redeploy.
        this.memoryData.users = [...firestoreData.users];
        updated = true;
      }
      if (Array.isArray(firestoreData.orders)) {
        this.memoryData.orders = [...firestoreData.orders];
        updated = true;
      }
      if (Array.isArray(firestoreData.banners)) {
        this.memoryData.banners = [...firestoreData.banners];
        updated = true;
      }
      if (Array.isArray(firestoreData.coupons)) {
        this.memoryData.coupons = [...firestoreData.coupons];
        updated = true;
      }
      if (Array.isArray(firestoreData.paymentGateways)) {
        this.memoryData.paymentGateways = [...firestoreData.paymentGateways];
        updated = true;
      }
      if (firestoreData.storeBalances && Object.keys(firestoreData.storeBalances).length > 0) {
        this.memoryData.storeBalances = { ...this.memoryData.storeBalances, ...firestoreData.storeBalances };
        updated = true;
      }
      if (Array.isArray(firestoreData.settlements)) {
        this.memoryData.settlements = [...firestoreData.settlements];
        updated = true;
      }
      if (Array.isArray(firestoreData.disputes)) {
        this.memoryData.disputes = [...firestoreData.disputes];
        updated = true;
      }
      if (Array.isArray(firestoreData.reviews)) {
        this.memoryData.reviews = [...firestoreData.reviews];
        updated = true;
      }
      if (Array.isArray(firestoreData.advertisements)) {
        this.memoryData.advertisements = [...firestoreData.advertisements];
        updated = true;
      }
      if (Array.isArray(firestoreData.orderMessages)) {
        this.memoryData.orderMessages = [...firestoreData.orderMessages];
        updated = true;
      }
      for (const [key, rows] of Object.entries(firestoreData.commerceState || {})) {
        const merged = new Map(((this.memoryData as any)[key] || []).map((row: any) => [row.id, row]));
        for (const row of rows) merged.set(row.id, row);
        (this.memoryData as any)[key] = Array.from(merged.values());
      }
      if(firestoreData.fulfillmentConfig) this.memoryData.fulfillmentConfig=firestoreData.fulfillmentConfig;
      if (firestoreData.systemSettings) {
        this.memoryData.systemSettings = { ...this.memoryData.systemSettings, ...firestoreData.systemSettings };
        updated = true;
      }

      // One-time, narrowly scoped commission change explicitly requested by the owner.
      // Historical orders, balances and all other settings remain untouched.
      const commissionSettings = await firestoreRepo.applyRequestedCommissionPolicy();
      this.memoryData.systemSettings = { ...this.memoryData.systemSettings, ...commissionSettings };
      updated = true;

      this.lastFirestoreSync = new Date().toISOString();
      this.firestoreSyncStatus = 'CONNECTED';

      if (updated) {
        this.memoryData.version += 1;
        this.memoryData.lastUpdated = new Date().toISOString();
        this.commit();
        console.log('[GlobalDatabase] Firestore Production database successfully synchronized as primary source of truth.');
      }
    } catch (err) {
      this.firestoreSyncStatus = 'ERROR';
      console.error('[GlobalDatabase] Firestore synchronization warning:', err);
    }
  }


  public refreshDurableState():Promise<void> {
    const priorSettings=this.settingsUpdateQueue;
    const execute=async()=>{
      await priorSettings;
      const durable=await firestoreRepo.loadConsistentState();
      durable.specifications=Array.from(new Map([...(this.memoryData.specifications || []),...(durable.specifications || [])].map(row=>[row.id,row])).values());
      durable.adPlacements=Array.from(new Map([...(this.memoryData.adPlacements || []),...(durable.adPlacements || [])].map(row=>[row.code,row])).values());
      const changed=Object.entries(durable).some(([key,value])=>JSON.stringify((this.memoryData as any)[key])!==JSON.stringify(value));
      if(changed){
        for(const [key,value] of Object.entries(durable)) (this.memoryData as any)[key]=value;
        storesDb.syncFromFirestore(this.memoryData.stores);
        this.memoryData.userCredentials=this.memoryData.users.filter(u=>u.passwordHash).map(u=>({id:`cred-${u.id}`,userId:u.id,passwordHash:u.passwordHash!,createdAt:u.createdAt,updatedAt:new Date().toISOString()}));
        this.commit();
      }
      this.lastFirestoreSync=new Date().toISOString();this.firestoreSyncStatus='CONNECTED';
    };
    const operation=this.checkoutQueue.then(execute,execute);
    this.checkoutQueue=operation.then(()=>undefined,()=>undefined);
    return operation;
  }

  public async initCloudSqlSync(): Promise<void> {
    if(firestoreRepo.isAdminReady()) {console.log('[CloudSQL] Production authority is Firestore; legacy bidirectional import disabled.');return;}
    try {
      console.log('[GlobalDatabase] Initiating Cloud SQL synchronization...');
      const [sqlUsers, sqlStores, sqlProducts, sqlCategories, sqlOrders, sqlAds] = await Promise.all([
        cloudSqlRepo.getAllUsers().catch(e => { console.warn('CloudSQL users query err:', e); return []; }),
        cloudSqlRepo.getAllStores().catch(e => { console.warn('CloudSQL stores query err:', e); return []; }),
        cloudSqlRepo.getAllProducts().catch(e => { console.warn('CloudSQL products query err:', e); return []; }),
        cloudSqlRepo.getAllCategories().catch(e => { console.warn('CloudSQL categories query err:', e); return []; }),
        cloudSqlRepo.getAllOrders().catch(e => { console.warn('CloudSQL orders query err:', e); return []; }),
        cloudSqlRepo.getAllAdvertisements().catch(e => { console.warn('CloudSQL ads query err:', e); return []; })
      ]);

      console.log(`[GlobalDatabase] Cloud SQL records retrieved: ${sqlUsers.length} users, ${sqlStores.length} stores, ${sqlProducts.length} products, ${sqlCategories.length} categories, ${sqlOrders.length} orders.`);

      // 1. SYNC CATEGORIES FIRST (so products foreign keys pass)
      for (const cat of this.memoryData.categories) {
        if (!sqlCategories.some(c => c.id === cat.id)) {
          await cloudSqlRepo.createCategory({
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            icon: cat.icon,
            parentId: cat.parentId,
            order: cat.order
          }).catch(e => console.warn('[CloudSQL] Error syncing category:', cat.name, e));
        }
      }
      if (sqlCategories.length > 0) {
        for (const c of sqlCategories) {
          if (!this.memoryData.categories.some(mc => mc.id === c.id)) {
            this.memoryData.categories.push({
              id: c.id,
              name: c.name,
              slug: c.slug,
              description: c.description || undefined,
              icon: c.icon || 'tag',
              parentId: c.parentId || null,
              order: c.order
            });
          }
        }
      }

      // 2. USERS: Firestore is authoritative in production.
      // Cloud SQL may keep a secondary copy, but it must never re-inject stale users
      // into application memory after Firestore has completed its startup load.
      if (!process.env.FIREBASE_SERVICE_ACCOUNT && !process.env.FIREBASE_PROJECT_ID) {
        for (const u of this.memoryData.users) {
          if (!sqlUsers.some(su => su.id === u.id || (su.email && su.email.toLowerCase() === u.email.toLowerCase()))) {
            await cloudSqlRepo.createUser({
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              phone: u.phone,
              avatar: u.avatar,
              storeId: u.storeId,
              passwordHash: u.passwordHash,
              addresses: u.addresses
            }).catch(e => console.warn('[CloudSQL] Error syncing memory user to CloudSQL:', u.email, e));
          }
        }
        if (sqlUsers.length > 0) {
          for (const u of sqlUsers) {
            const existingIdx = this.memoryData.users.findIndex(mu => mu.id === u.id || mu.email.toLowerCase() === u.email.toLowerCase());
            const mappedUser: User = {
              id: u.id,
              name: u.name,
              email: u.email,
              role: (u.role as UserRole) || 'CUSTOMER',
              phone: u.phone || '',
              avatar: u.avatar || '',
              storeId: u.storeId || undefined,
              passwordHash: u.passwordHash || (existingIdx !== -1 ? this.memoryData.users[existingIdx].passwordHash : undefined),
              addresses: (u.addresses as any) || [],
              createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString()
            };
            if (existingIdx === -1) this.memoryData.users.push(mappedUser);
            else this.memoryData.users[existingIdx] = {
              ...this.memoryData.users[existingIdx],
              ...mappedUser,
              passwordHash: this.memoryData.users[existingIdx].passwordHash || mappedUser.passwordHash
            };
          }
        }
      } else {
        console.log('[GlobalDatabase] Firestore authoritative for users; Cloud SQL user merge skipped.');
      }

      // 3. SYNC STORES (Safe bidirectional merge: push memory stores to Cloud SQL and vice-versa)
      // A. Push memory stores to Cloud SQL if missing
      for (const s of this.memoryData.stores) {
        if (!sqlStores.some(ss => ss.id === s.id)) {
          await cloudSqlRepo.createStore({
            id: s.id,
            name: s.name,
            slug: s.slug,
            ownerId: s.ownerId || s.owner_id || undefined,
            email: s.email,
            phone: s.phone,
            whatsapp: s.whatsapp,
            address: s.address,
            province: s.province,
            municipality: s.municipality,
            description: s.description,
            logoUrl: s.logo,
            bannerUrl: s.banner,
            shippingConfig: s.shippingConfig,
            bankInfo: s.bankInfo,
            status: s.status,
          }).catch(e => console.warn('[CloudSQL] Error syncing memory store to CloudSQL:', s.name, e));
        }
      }

      // B. Merge Cloud SQL stores into memory without overwriting valid memory fields
      if (sqlStores.length > 0) {
        for (const s of sqlStores) {
          const existingIdx = this.memoryData.stores.findIndex(ms => ms.id === s.id);
          const mappedStore: Store = {
            id: s.id,
            name: s.name,
            slug: s.slug,
            ownerId: s.ownerId || (existingIdx !== -1 ? this.memoryData.stores[existingIdx].ownerId : ''),
            owner_id: s.ownerId || (existingIdx !== -1 ? this.memoryData.stores[existingIdx].owner_id : ''),
            ownerName: existingIdx !== -1 ? (this.memoryData.stores[existingIdx].ownerName || '') : '',
            email: s.email,
            phone: s.phone || '',
            whatsapp: s.whatsapp || '',
            description: s.description || (existingIdx !== -1 ? this.memoryData.stores[existingIdx].description : ''),
            categoryId: existingIdx !== -1 ? (this.memoryData.stores[existingIdx].categoryId || '') : '',
            logo: s.logoUrl || (existingIdx !== -1 ? this.memoryData.stores[existingIdx].logo : ''),
            banner: s.bannerUrl || (existingIdx !== -1 ? this.memoryData.stores[existingIdx].banner : ''),
            province: s.province || 'Distrito Nacional',
            municipality: s.municipality || '',
            address: s.address || '',
            status: (s.status as StoreStatus) || 'APPROVED',
            isPublished: s.isPublished !== undefined ? s.isPublished : true,
            rating: existingIdx !== -1 && typeof this.memoryData.stores[existingIdx].rating === 'number' ? this.memoryData.stores[existingIdx].rating : 0,
            reviewCount: existingIdx !== -1 ? (this.memoryData.stores[existingIdx].reviewCount || 0) : 0,
            salesCount: existingIdx !== -1 ? (this.memoryData.stores[existingIdx].salesCount || 0) : 0,
            shippingConfig: (s.shippingConfig as any) || (existingIdx !== -1 ? this.memoryData.stores[existingIdx].shippingConfig : { type: 'fixed', fixedRate: 200, estimatedDays: '24 a 48 horas', coverageProvinces: [s.province || 'Distrito Nacional'] }),
            bankInfo: (s.bankInfo as any) || (existingIdx !== -1 ? this.memoryData.stores[existingIdx].bankInfo : { bank: 'Banco Popular Dominicano', accountType: 'CORRIENTE', accountNumber: '', accountHolder: '', rncOrCedula: '' }),
            createdAt: s.createdAt ? s.createdAt.toISOString() : (existingIdx !== -1 ? this.memoryData.stores[existingIdx].createdAt : new Date().toISOString())
          };

          if (existingIdx === -1) {
            this.memoryData.stores.push(mappedStore);
          } else {
            this.memoryData.stores[existingIdx] = {
              ...this.memoryData.stores[existingIdx],
              ...mappedStore,
              // Never downgrade approval or published status of verified stores
              status: (mappedStore.status === 'SUSPENDED' || mappedStore.status === 'REJECTED') ? mappedStore.status : (this.memoryData.stores[existingIdx].status || 'APPROVED'),
              isPublished: (mappedStore.status === 'SUSPENDED' || mappedStore.status === 'REJECTED') ? false : (this.memoryData.stores[existingIdx].isPublished !== false)
            };
          }
        }
        storesDb.syncFromCloudSql(sqlStores);
      }

      // 4. SYNC PRODUCTS (Safe bidirectional merge: push memory products to Cloud SQL and vice-versa)
      for (const p of this.memoryData.products) {
        if (!sqlProducts.some(sp => sp.id === p.id)) {
          await cloudSqlRepo.createProduct({
            id: p.id,
            storeId: p.storeId,
            categoryId: p.categoryId,
            name: p.name,
            slug: p.slug,
            description: p.description,
            sku: p.sku,
            price: p.price,
            promoPrice: p.promoPrice,
            stock: p.stock,
            status: p.status,
            isFeatured: p.isFeatured,
            images: p.images || []
          }).catch(e => console.warn('[CloudSQL] Error syncing memory product to CloudSQL:', p.name, e));
        }
      }

      // Firestore is authoritative for products; do not restore stale Cloud SQL products into memory.
      if (false && sqlProducts.length > 0) {
        for (const p of sqlProducts) {
          const existingIdx = this.memoryData.products.findIndex(mp => mp.id === p.id);
          const mappedProd: Product = {
            id: p.id,
            storeId: p.storeId,
            categoryId: p.categoryId,
            name: p.name,
            slug: p.slug,
            description: p.description || '',
            sku: p.sku,
            price: p.price,
            promoPrice: p.promoPrice || undefined,
            stock: p.stock,
            reservedStock: 0,
            soldCount: p.soldCount || 0,
            minStockAlert: 5,
            images: p.images || [],
            rating: p.rating || 5.0,
            reviewCount: p.reviewCount || 0,
            status: (p.status as any) || 'published',
            isFeatured: p.isFeatured,
            createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString()
          };

          if (existingIdx === -1) {
            this.memoryData.products.push(mappedProd);
          } else {
            this.memoryData.products[existingIdx] = {
              ...this.memoryData.products[existingIdx],
              ...mappedProd
            };
          }
        }
      }

      // 5. ORDERS & ADS
      if (this.firestoreSyncStatus !== 'CONNECTED' && sqlOrders.length > 0) {
        for (const o of sqlOrders) {
          if (!this.memoryData.orders.some(mo => mo.id === o.id)) {
            this.memoryData.orders.push({
              id: o.id,
              orderGroupCode: o.orderGroupCode,
              customerId: o.customerId,
              customerName: o.customerName,
              customerEmail: o.customerEmail,
              customerPhone: o.customerPhone || '',
              storeId: o.storeId,
              storeName: o.storeName,
              status: (o.status as OrderStatus) || 'PENDING',
              paymentMethod: (o.paymentMethod as PaymentMethodType) || 'CARD_AZUL',
              paymentStatus: (o.paymentStatus as any) || 'PENDING',
              subtotal: o.subtotal,
              shippingCost: o.shippingCost,
              discount: o.discount,
              total: o.total,
              plazaCommissionRate: o.plazaCommissionRate ?? 0.05, // Historical SQL fallback; never apply current rate to old sales.
              plazaCommissionAmount: o.plazaCommissionAmount ?? Math.round(o.total * (o.plazaCommissionRate ?? 0.05) * 100) / 100,
              storeNetEarnings: o.storeNetEarnings ?? (o.total - (o.plazaCommissionAmount ?? 0)),
              deliveryConfirmationCode: o.deliveryCode || '000000',
              deliveryAddress: (o.shippingAddress as any) || { province: 'Distrito Nacional', municipality: 'Santo Domingo', street: '', phone: o.customerPhone || '' },
              items: (o.items as any) || [],
              statusHistory: (o.statusHistory as any) || [],
              customerNotes: o.notes || undefined,
              settlementStatus: 'PENDING',
              createdAt: o.createdAt ? o.createdAt.toISOString() : new Date().toISOString()
            });
          }
        }
      }

      if (sqlAds.length > 0) {
        for (const a of sqlAds) {
          if (!this.memoryData.advertisements?.some(ma => ma.id === a.id)) {
            this.memoryData.advertisements = this.memoryData.advertisements || [];
            this.memoryData.advertisements.push({
              id: a.id,
              title: a.title,
              description: a.description || undefined,
              type: (a.type as any) || 'INTERNAL',
              advertiserName: a.advertiserName,
              placement: a.placement,
              startDate: a.startDate,
              endDate: a.endDate,
              imageUrl: a.imageUrl,
              mobileImageUrl: a.mobileImageUrl || undefined,
              videoUrl: a.videoUrl || undefined,
              ctaText: a.ctaText || undefined,
              targetUrl: a.targetUrl,
              targetWindow: (a.targetWindow as any) || '_self',
              priority: a.priority,
              targetDevice: (a.targetDevice as any) || 'ALL',
              targetCategory: a.targetCategory || undefined,
              targetStoreId: a.targetStoreId || undefined,
              sponsorStoreId: a.sponsorStoreId || undefined,
              budget: a.budget || undefined,
              isActive: a.isActive,
              impressions: a.impressions,
              clicks: a.clicks,
              order: a.order,
              createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString()
            });
          }
        }
      }

      this.commit();
      console.log(`[GlobalDatabase] Cloud SQL bidirectional sync completed successfully. Active: ${this.memoryData.users.length} users, ${this.memoryData.stores.length} stores, ${this.memoryData.products.length} products.`);
    } catch (err) {
      console.error('[GlobalDatabase] Cloud SQL sync exception:', err);
    }
  }

  // --- PERSISTENCE & BACKUP MANAGEMENT ---
  public createManualBackup(label?: string): { success: boolean; filename: string; path: string; timestamp: string } {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `plazado_backup_${label ? `${label}_` : ''}${timestamp}.json`;
      const fullPath = path.join(this.backupDir, filename);
      fs.writeFileSync(fullPath, JSON.stringify(this.memoryData, null, 2), 'utf-8');
      return { success: true, filename, path: fullPath, timestamp: new Date().toISOString() };
    } catch (err: any) {
      console.error('[GlobalDatabase] Failed creating manual backup:', err);
      return { success: false, filename: '', path: '', timestamp: new Date().toISOString() };
    }
  }

  public getPersistenceStatus() {
    let primarySize = 0;
    let latestBackupSize = 0;
    let backupsList: Array<{ name: string; size: number; mtime: string }> = [];

    try {
      if (fs.existsSync(this.dataFilePath)) {
        primarySize = fs.statSync(this.dataFilePath).size;
      }
      if (fs.existsSync(this.latestBackupPath)) {
        latestBackupSize = fs.statSync(this.latestBackupPath).size;
      }
      if (fs.existsSync(this.backupDir)) {
        const files = fs.readdirSync(this.backupDir);
        backupsList = files
          .filter(f => f.endsWith('.json'))
          .map(f => {
            const stat = fs.statSync(path.join(this.backupDir, f));
            return { name: f, size: stat.size, mtime: stat.mtime.toISOString() };
          })
          .sort((a, b) => b.mtime.localeCompare(a.mtime));
      }
    } catch (e) {
      // Ignore
    }

    return {
      status: 'PROTECTED_PERSISTENT',
      databasePath: this.dataFilePath,
      primarySize,
      latestBackupSize,
      version: this.memoryData.version,
      lastUpdated: this.memoryData.lastUpdated,
      googleCloud: {
        status: 'CONNECTED',
        projectId: 'dazzling-spirit-271219',
        region: 'us-east1 / us-east5',
        provider: 'Google Cloud Platform',
        firestore: {
          status: this.firestoreSyncStatus,
          lastSync: this.lastFirestoreSync,
          databaseId: 'ai-studio-plazadocommarket-bdb8ac78-6fcb-4d18-bf24-2ca374dda0e5',
          recordCounts: {
            users: this.memoryData.users.length,
            stores: this.memoryData.stores.length,
            products: this.memoryData.products.length,
            orders: this.memoryData.orders.length,
            categories: this.memoryData.categories.length,
            banners: this.memoryData.banners.length,
            paymentGateways: (this.memoryData.paymentGateways || []).length
          }
        },
        cloudSql: {
          status: 'CONNECTED',
          database: process.env.SQL_DB_NAME || 'cloud_sql_development_database',
          instance: 'dazzling-spirit-271219:us-east1:ai-studio-bdb8ac78',
          engine: 'PostgreSQL 15 (Google Cloud SQL)',
          recordCounts: {
            users: this.memoryData.users.length,
            stores: this.memoryData.stores.length,
            products: this.memoryData.products.length,
            orders: this.memoryData.orders.length,
            categories: this.memoryData.categories.length
          }
        }
      },
      recordCounts: {
        users: this.memoryData.users.length,
        stores: this.memoryData.stores.length,
        products: this.memoryData.products.length,
        orders: this.memoryData.orders.length,
        categories: this.memoryData.categories.length,
        storeBalances: Object.keys(this.memoryData.storeBalances).length,
        settlements: this.memoryData.settlements.length,
        disputes: this.memoryData.disputes.length,
        reviews: this.memoryData.reviews.length,
        auditLogs: this.memoryData.auditLogs.length
      },
      backups: backupsList
    };
  }

  public restoreFromBackupFile(filename: string): { success: boolean; message: string } {
    try {
      const fullPath = path.join(this.backupDir, filename);
      const restored = this.tryParseJson(fullPath);
      if (!restored) {
        return { success: false, message: 'El archivo de respaldo no es válido o está dañado.' };
      }
      // Create pre-restore safety snapshot
      this.createManualBackup('pre_restore');
      this.memoryData = restored;
      this.commit();
      return { success: true, message: `Base de datos restaurada exitosamente desde ${filename}` };
    } catch (err: any) {
      return { success: false, message: `Error restaurando respaldo: ${err.message}` };
    }
  }

  // --- GETTERS ---
  public getFullState(): GlobalDatabaseData {
    return { 
      ...this.memoryData,
      paymentGateways: this.getPaymentGateways(true)
    };
  }

  public isFirestoreConnected():boolean { return this.firestoreSyncStatus==='CONNECTED'; }

  public getVersion(): number {
    return this.memoryData.version;
  }

  // --- STORES ---
  public getStores(): Store[] {
    return this.memoryData.stores;
  }

  public addStore(storeData: any) {
    return this.runCommerceMutation(() => {
      const id = storeData.id || `store-${crypto.randomUUID()}`;
      if(this.memoryData.stores.some(s=>s.id===id)) throw Error('La tienda ya existe');
      const slug=(storeData.slug || storeData.name || id).toLowerCase().replace(/[^a-z0-9]+/g,'-');
      if(this.memoryData.stores.some(s=>s.slug===slug)) throw Error('El nombre de enlace de la tienda ya existe');
      const store:Store={rating:0,reviewCount:0,salesCount:0,...storeData,id,slug,status:storeData.status || 'PENDING',isPublished:storeData.isPublished ?? false,createdAt:storeData.createdAt || new Date().toISOString()};
      this.memoryData.stores.push(store);
      this.addAuditLog('STORE_REGISTERED',id,undefined,'Tienda registrada de forma durable');
      return store;
    });
  }

  public updateStore(storeId:string,data:Partial<Store>) {
    return this.runCommerceMutation(() => {
      const index=this.memoryData.stores.findIndex(s=>s.id===storeId);
      if(index<0) return null;
      const previous=this.memoryData.stores[index];
      const updated={...previous,...data,id:previous.id};
      this.memoryData.stores[index]=updated;
      this.addAuditLog('STORE_UPDATED',storeId,undefined,'Configuración de tienda guardada');
      return updated;
    });
  }

  public updateStoreStatus(storeId:string,status:StoreStatus,reason?:string) {
    return this.runCommerceMutation(() => {
      const store=this.memoryData.stores.find(s=>s.id===storeId);
      if(!store) return null;
      if(!['PENDING','IN_REVIEW','APPROVED','REJECTED','SUSPENDED','INACTIVE','active','ACTIVE'].includes(status)) throw Error('Estado de tienda inválido');
      store.status=status;
      store.isPublished=['APPROVED','active','ACTIVE'].includes(status);
      if(reason) store.rejectionReason=reason;
      this.addAuditLog('STORE_STATUS_CHANGE',storeId,undefined,status);
      return store;
    });
  }

  public toggleStorePublish(storeId:string) {
    return this.runCommerceMutation(() => {
      const store=this.memoryData.stores.find(s=>s.id===storeId);
      if(!store) return null;
      if(!['APPROVED','active','ACTIVE'].includes(store.status)) throw Error('La tienda debe ser aprobada antes de publicarse');
      store.isPublished=!store.isPublished;
      return store;
    });
  }

  public deleteStore(storeId: string): boolean {
    const idx = this.memoryData.stores.findIndex(s => s.id === storeId);
    if (idx === -1) return false;
    const store = this.memoryData.stores[idx];
    const name = store.name;
    const productsToDelete = this.memoryData.products.filter(p => p.storeId === storeId);

    // Remove store from memory & dedicated stores database
    this.memoryData.stores.splice(idx, 1);
    storesDb.deleteStore(storeId);
    this.memoryData.products = this.memoryData.products.filter(p => p.storeId !== storeId);
    if (this.memoryData.storeBalances && this.memoryData.storeBalances[storeId]) {
      delete this.memoryData.storeBalances[storeId];
    }

    // Reset storeId for users associated with this store
    for (const u of this.memoryData.users) {
      if (u.storeId === storeId) {
        u.storeId = undefined;
        if (u.role === 'STORE_OWNER') {
          u.role = 'CUSTOMER';
        }
        firestoreRepo.saveUser(u).catch(e => console.error('[Firestore] User update error on store delete:', e));
      }
    }

    this.addAuditLog('STORE_DELETED', storeId, name, 'Tienda y sus productos eliminados de la plataforma global y Google Cloud');
    this.commit();

    // Bind deletion to Google Cloud Firestore & Cloud SQL
    firestoreRepo.deleteStore(storeId).catch(err => console.error('[Firestore] Error deleting store:', err));
    for (const p of productsToDelete) {
      firestoreRepo.deleteProduct(p.id).catch(err => console.error('[Firestore] Error deleting store product:', err));
    }
    cloudSqlRepo.deleteStore(storeId).catch(err => console.error('[CloudSQL] Error deleting store:', err));

    return true;
  }

  public getStoreAdminUser(storeId: string): User | undefined {
    const store = this.memoryData.stores.find(s => s.id === storeId);
    if (!store) return undefined;
    return this.memoryData.users.find(u =>
      (u.storeId === storeId && u.role === 'STORE_OWNER') ||
      (store.ownerId && u.id === store.ownerId) ||
      (u.storeId === storeId) ||
      (store.email && u.email.toLowerCase() === store.email.toLowerCase())
    );
  }

  public assignStoreAdmin(storeId:string,email:string,passwordHash:string,name?:string,phone?:string) {
    return this.runCommerceMutation(() => this.buildassignStoreAdmin(storeId,email,passwordHash,name,phone));
  }

  private buildassignStoreAdmin(
    storeId: string,
    email: string,
    passwordHash: string,
    name?: string,
    phone?: string
  ): { success: boolean; user?: User; store?: Store; message?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const store = this.memoryData.stores.find(s => s.id === storeId);
    if (!store) {
      return { success: false, message: 'Tienda no encontrada' };
    }

    // Check if an admin user already exists for this store or matching email
    let user = this.memoryData.users.find(u => 
      u.storeId === storeId || 
      (store.ownerId && u.id === store.ownerId) || 
      u.email.toLowerCase() === cleanEmail
    );

    if (user) {
      // If user exists for a different store, verify conflict
      if (user.storeId && user.storeId !== storeId && user.email.toLowerCase() === cleanEmail) {
        return { success: false, message: 'Este correo electrónico ya pertenece a otra tienda registrada.' };
      }
      user.email = cleanEmail;
      user.passwordHash = passwordHash;
      user.role = 'STORE_OWNER';
      user.storeId = storeId;
      if (name && name.trim()) user.name = name.trim();
      if (phone && phone.trim()) user.phone = phone.trim();
      user.isEmailVerified = true;
      user.isApprovedByAdmin = true;
      user.adminApprovalStatus = 'APPROVED';
      user.approvedAt = new Date().toISOString();
      user.approvedBy = 'SUPER_ADMIN';
    } else {
      user = {
        id: `user-store-${Date.now()}`,
        name: (name && name.trim()) || `Admin ${store.name}`,
        email: cleanEmail,
        role: 'STORE_OWNER',
        phone: (phone && phone.trim()) || store.phone || '',
        avatar: store.logo || '',
        storeId: storeId,
        passwordHash: passwordHash,
        addresses: [],
        isEmailVerified: true,
        isApprovedByAdmin: true,
        adminApprovalStatus: 'APPROVED',
        approvedAt: new Date().toISOString(),
        approvedBy: 'SUPER_ADMIN',
        createdAt: new Date().toISOString()
      };
      this.memoryData.users.push(user);
    }

    this.setUserCredential(user.id, passwordHash);

    // Link store to user
    store.ownerId = user.id;
    store.owner_id = user.id;
    store.email = cleanEmail;
    if (name && name.trim()) store.ownerName = name.trim();
    if (phone && phone.trim()) {
      store.phone = phone.trim();
      store.whatsapp = phone.trim();
    }

    this.addAuditLog(
      'STORE_ADMIN_ASSIGNED',
      storeId,
      undefined,
      `Super Admin asignó administrador para la tienda "${store.name}": ${user.email} (${user.name})`
    );
    this.commit();

    return { success: true, user, store };
  }

  // --- PRODUCTS ---
  public getProducts(): Product[] {
    return this.memoryData.products;
  }

  public async addProduct(productData: Omit<Product, 'id' | 'reservedStock' | 'soldCount' | 'rating' | 'reviewCount' | 'createdAt'>): Promise<Product> {
    const newId = `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newProduct: Product = {
      ...productData,
      id: newId,
      status: productData.status || 'published',
      reservedStock: 0,
      soldCount: 0,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString()
    };
    await firestoreRepo.saveProduct(newProduct);
    this.memoryData.products.unshift(newProduct);
    this.addAuditLog('PRODUCT_CREATED', newId, undefined, `Producto publicado: ${newProduct.name} (Tienda: ${newProduct.storeId})`);
    this.commit();

    cloudSqlRepo.createProduct({
      id: newProduct.id,
      storeId: newProduct.storeId,
      categoryId: newProduct.categoryId,
      name: newProduct.name,
      slug: newProduct.slug,
      description: newProduct.description,
      sku: newProduct.sku,
      price: newProduct.price,
      promoPrice: newProduct.promoPrice,
      stock: newProduct.stock,
      images: newProduct.images || [],
      tags: [],
      isFeatured: newProduct.isFeatured,
    }).catch(err => console.error('[CloudSQL] Error syncing createProduct:', err));

    return newProduct;
  }

  public async updateProduct(productId: string, data: Partial<Product>): Promise<Product | null> {
    const idx = this.memoryData.products.findIndex(p => p.id === productId);
    if (idx === -1) return null;
    const prev = this.memoryData.products[idx];
    const updated = { ...prev, ...data, id:prev.id };
    await firestoreRepo.saveProduct(updated);
    this.memoryData.products[idx] = updated;
    this.addAuditLog('PRODUCT_UPDATED', productId, prev.name, updated.name);
    this.commit();

    cloudSqlRepo.updateProduct(productId, {
      name: updated.name,
      description: updated.description,
      categoryId: updated.categoryId,
      price: updated.price,
      promoPrice: updated.promoPrice ?? null,
      stock: updated.stock,
      images: updated.images,
      status: updated.status,
      isFeatured: updated.isFeatured,
    }).catch(err => console.error('[CloudSQL] Error syncing updateProduct:', err));

    return updated;
  }

  public deleteProduct(productId: string): boolean {
    const idx = this.memoryData.products.findIndex(p => p.id === productId);
    if (idx === -1) return false;
    const name = this.memoryData.products[idx].name;
    this.memoryData.products.splice(idx, 1);
    this.addAuditLog('PRODUCT_DELETED', productId, name, 'Producto eliminado');
    this.commit();

    firestoreRepo.deleteProduct(productId).catch(err => console.error('[Firestore] Error syncing deleteProduct:', err));
    cloudSqlRepo.deleteProduct(productId).catch(err => console.error('[CloudSQL] Error syncing deleteProduct:', err));

    return true;
  }

  public cleanTestProducts(): number {
    this.createManualBackup('pre_clean_test_products');
    const prevCount = this.memoryData.products.length;
    this.memoryData.products = this.memoryData.products.filter(p => {
      const n = p.name.toLowerCase();
      const d = (p.description || '').toLowerCase();
      const isTest = n.includes('[test-purge]') || d.includes('[test-purge]');
      return !isTest;
    });
    const cleaned = prevCount - this.memoryData.products.length;
    if (cleaned > 0) {
      this.addAuditLog('TEST_PRODUCTS_CLEANED', 'products', `${prevCount}`, `${this.memoryData.products.length}`);
      this.commit();
    }
    return cleaned;
  }

  // --- CATEGORIES ---
  public getCategories(): Category[] {
    return this.memoryData.categories.filter((row:any)=>!row.deleted);
  }

  public addCategory(cat: Omit<Category, 'id'>): Promise<Category> {
    return this.runCommerceMutation(()=>this.buildAddCategory(cat));
  }

  private buildAddCategory(cat: Omit<Category, 'id'>): Category {
    const newId = `cat-${crypto.randomUUID()}`;
    const newCat: Category = {
      ...cat,
      id: newId,
      order: this.memoryData.categories.length + 1
    };
    this.memoryData.categories.push(newCat);
    this.addAuditLog('CATEGORY_CREATED', newId, undefined, `Categoría creada: ${newCat.name}`);
    this.commit();
    return newCat;
  }

  public updateCategory(categoryId: string, data: Partial<Category>): Promise<Category | null> {
    return this.runCommerceMutation(()=>this.buildUpdateCategory(categoryId,data));
  }

  private buildUpdateCategory(categoryId: string, data: Partial<Category>): Category | null {
    const idx = this.memoryData.categories.findIndex(c => c.id === categoryId);
    if (idx === -1) return null;
    const prev = this.memoryData.categories[idx];
    const updated = { ...prev, ...data, id:prev.id };
    this.memoryData.categories[idx] = updated;
    this.addAuditLog('CATEGORY_UPDATED', categoryId, prev.name, updated.name);
    this.commit();
    return updated;
  }

  public deleteCategory(categoryId: string): Promise<{ success: boolean; message?: string }> {
    return this.runCommerceMutation(()=>this.buildDeleteCategory(categoryId));
  }

  private buildDeleteCategory(categoryId: string): { success: boolean; message?: string } {
    const idx = this.memoryData.categories.findIndex(c => c.id === categoryId);
    if (idx === -1) return { success: false, message: 'Categoría no encontrada' };

    // Regla crítica: No permitir eliminar físicamente una categoría que tenga productos asociados
    const associatedProducts = this.memoryData.products.filter(p => 
      (p.categoryId === categoryId || p.subcategoryId === categoryId) && p.deleted !== true
    );

    if (associatedProducts.length > 0) {
      return {
        success: false,
        message: `No se puede eliminar físicamente la categoría "${this.memoryData.categories[idx].name}" porque tiene ${associatedProducts.length} producto(s) asociado(s). En su lugar, puedes desactivarla.`
      };
    }

    const name = this.memoryData.categories[idx].name;
    (this.memoryData.categories[idx] as any).deleted=true;
    this.addAuditLog('CATEGORY_DELETED', categoryId, name, 'Categoría eliminada');
    this.commit();
    return { success: true };
  }

  // --- TECHNICAL SPECIFICATIONS ---
  public getSpecifications(subcategoryId?: string, categoryId?: string): CategorySpecification[] {
    let specs = (this.memoryData.specifications || []).filter((row:any)=>!row.deleted);
    if (subcategoryId) {
      specs = specs.filter(s => 
        s.subcategoryId === subcategoryId || 
        (s.applicableSubcategoryIds && s.applicableSubcategoryIds.includes(subcategoryId)) ||
        (s.categoryId && s.categoryId === categoryId && !s.subcategoryId && (!s.applicableSubcategoryIds || s.applicableSubcategoryIds.length === 0))
      );
    } else if (categoryId) {
      specs = specs.filter(s => s.categoryId === categoryId);
    }
    return specs.sort((a, b) => (a.order || 99) - (b.order || 99));
  }

  public getAllSpecifications(): CategorySpecification[] {
    return (this.memoryData.specifications || []).filter((row:any)=>!row.deleted).sort((a, b) => (a.order || 99) - (b.order || 99));
  }

  public addSpecification(specData: Omit<CategorySpecification, 'id'>): Promise<CategorySpecification> {
    return this.runCommerceMutation(()=>this.buildAddSpecification(specData));
  }

  private buildAddSpecification(specData: Omit<CategorySpecification, 'id'>): CategorySpecification {
    const newId = `spec-${crypto.randomUUID()}`;
    const newSpec: CategorySpecification = {
      ...specData,
      id: newId,
      order: (this.memoryData.specifications?.length || 0) + 1
    };
    this.memoryData.specifications = this.memoryData.specifications || [];
    this.memoryData.specifications.push(newSpec);
    this.addAuditLog('SPECIFICATION_CREATED', newId, undefined, `Especificación técnica creada: ${newSpec.name}`);
    this.commit();
    return newSpec;
  }

  public updateSpecification(specId: string, data: Partial<CategorySpecification>): Promise<CategorySpecification | null> {
    return this.runCommerceMutation(()=>this.buildUpdateSpecification(specId,data));
  }

  private buildUpdateSpecification(specId: string, data: Partial<CategorySpecification>): CategorySpecification | null {
    this.memoryData.specifications = this.memoryData.specifications || [];
    const idx = this.memoryData.specifications.findIndex(s => s.id === specId);
    if (idx === -1) return null;
    const prev = this.memoryData.specifications[idx];
    const updated = { ...prev, ...data, id:prev.id };
    this.memoryData.specifications[idx] = updated;
    this.addAuditLog('SPECIFICATION_UPDATED', specId, prev.name, updated.name);
    this.commit();
    return updated;
  }

  public deleteSpecification(specId: string): Promise<boolean> {
    return this.runCommerceMutation(()=>this.buildDeleteSpecification(specId));
  }

  private buildDeleteSpecification(specId: string): boolean {
    this.memoryData.specifications = this.memoryData.specifications || [];
    const idx = this.memoryData.specifications.findIndex(s => s.id === specId);
    if (idx === -1) return false;
    const name = this.memoryData.specifications[idx].name;
    (this.memoryData.specifications[idx] as any).deleted=true;
    this.addAuditLog('SPECIFICATION_DELETED', specId, name, 'Especificación técnica eliminada');
    this.commit();
    return true;
  }

  public mergeCategories(sourceId: string, targetId: string): Promise<boolean> {
    return this.runCommerceMutation(()=>this.buildMergeCategories(sourceId,targetId));
  }

  private buildMergeCategories(sourceId: string, targetId: string): boolean {
    const source = this.memoryData.categories.find(c => c.id === sourceId);
    const target = this.memoryData.categories.find(c => c.id === targetId);
    if (!source || !target) return false;

    // Migrate products
    this.memoryData.products.forEach(p => {
      if (p.categoryId === sourceId) {
        p.categoryId = targetId;
      }
    });
    // Migrate stores
    this.memoryData.stores.forEach(s => {
      if (s.categoryId === sourceId) {
        s.categoryId = targetId;
      }
    });
    // Remove source
    (source as any).deleted=true;
    this.addAuditLog('CATEGORY_MERGED', sourceId, source.name, `Fusionada hacia ${target.name}`);
    this.commit();
    return true;
  }

  // --- SYSTEM SETTINGS (Super Admin) ---
  public getSystemSettings(): SystemSettings {
    return this.memoryData.systemSettings;
  }

  public updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
    const patch = { ...settings };
    const priorCheckout=this.checkoutQueue;
    const operation = this.settingsUpdateQueue.then(async () => {
      await priorCheckout;
      for (const key of ['plazaCommissionRate', 'defaultCommissionRate'] as const) {
        const value = patch[key];
        if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1)) {
          throw new Error('El porcentaje de comisión debe ser un número entre 0 y 100.');
        }
      }
      if(patch.legalEntityRegistered!==undefined && typeof patch.legalEntityRegistered!=='boolean') throw new Error('La opción de empresa formalizada debe ser verdadera o falsa');
      if (patch.socialLinks !== undefined) {
        if (!patch.socialLinks || typeof patch.socialLinks !== 'object' || Array.isArray(patch.socialLinks)) throw new Error('Enlaces de redes sociales inválidos.');
        const domains = { instagram: 'instagram.com', tiktok: 'tiktok.com', facebook: 'facebook.com' };
        const links: NonNullable<SystemSettings['socialLinks']> = {};
        for (const [key, value] of Object.entries(patch.socialLinks)) {
          if (!(key in domains) || typeof value !== 'string') throw new Error('Solo se permiten Instagram, TikTok y Facebook.');
          const network = key as keyof typeof domains;
          const trimmed = value.trim();
          if (!trimmed) { links[network] = ''; continue; }
          const url = new URL(trimmed);
          if (url.protocol !== 'https:' || url.username || url.password || url.port || !(url.hostname === domains[network] || url.hostname.endsWith('.' + domains[network]))) throw new Error(`El enlace de ${network} debe usar HTTPS y su dominio oficial.`);
          links[network] = url.href;
        }
        patch.socialLinks = { ...this.memoryData.systemSettings.socialLinks, ...links };
      }
      const next = { ...this.memoryData.systemSettings, ...patch };
      if(next.legalEntityRegistered && (!next.legalBusinessName?.trim() || !next.rnc?.trim())) throw new Error('Completa la razón social y RNC reales antes de publicarlos');
      // Firestore is authoritative across Railway restarts and redeployments.
      // Do not change memory or acknowledge success until the write succeeds.
      await firestoreRepo.saveSystemSettings(next);
      this.memoryData.systemSettings = next;
      this.addAuditLog('SETTINGS_UPDATED', 'platform_settings', undefined, 'Configuración global persistida en Firestore por Super Admin');
      this.commit();
      return next;
    });
    this.settingsUpdateQueue = operation.then(() => undefined, () => undefined);
    return operation;
  }

  // --- BANNERS ---
  public getBanners(): Banner[] {
    return this.memoryData.banners;
  }

  public addBanner(bannerData:Omit<Banner,'id'>) {
    return this.runCommerceMutation(() => {
      const banner:Banner={...bannerData,id:`banner-${crypto.randomUUID()}`};
      this.memoryData.banners.push(banner);return banner;
    });
  }

  public updateBanner(id:string,data:Partial<Banner>) {
    return this.runCommerceMutation(() => {
      const index=this.memoryData.banners.findIndex(b=>b.id===id);
      if(index<0) return null;
      const banner={...this.memoryData.banners[index],...data,id};
      this.memoryData.banners[index]=banner;return banner;
    });
  }

  public deleteBanner(id:string) {
    // Archive without destroying the production record or its images.
    return this.runCommerceMutation(() => {
      const banner=this.memoryData.banners.find(b=>b.id===id);
      if(!banner) return false;
      banner.isActive=false;return true;
    });
  }

  // --- FINANCIAL & TRANSACTIONS ---
  public getPaymentTransactions(): PaymentTransaction[] {
    return this.memoryData.paymentTransactions || [];
  }

  public getFinancialAuditLogs(): FinancialAuditLog[] {
    return this.memoryData.financialAuditLogs || [];
  }

  public addFinancialAuditLog(logData: Omit<FinancialAuditLog, 'id' | 'timestamp'>): FinancialAuditLog {
    if (!this.memoryData.financialAuditLogs) {
      this.memoryData.financialAuditLogs = [];
    }
    const log: FinancialAuditLog = {
      ...logData,
      id: `fin-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };
    this.memoryData.financialAuditLogs.unshift(log);
    if (this.memoryData.financialAuditLogs.length > 2000) {
      this.memoryData.financialAuditLogs = this.memoryData.financialAuditLogs.slice(0, 2000);
    }
    return log;
  }

  // --- PAYMENT GATEWAYS & RECEIVER (Plazado.com Central Account) ---
  public getPaymentGateways(mask: boolean = true): PaymentGatewayConfig[] {
    const gateways = (this.memoryData.paymentGateways || []).filter((row:any)=>!row.deleted);
    if (!mask) return gateways;
    return gateways.map(g => this.maskGateway(g));
  }

  public getPaymentGatewayById(id: string, mask: boolean = true): PaymentGatewayConfig | null {
    const gateways = (this.memoryData.paymentGateways || []).filter((row:any)=>!row.deleted);
    const found = gateways.find(g => g.id === id);
    if (!found) return null;
    return mask ? this.maskGateway(found) : found;
  }

  public getActivePaymentGateway(): PaymentGatewayConfig | null {
    const gateways = (this.memoryData.paymentGateways || []).filter((row:any)=>!row.deleted);
    return gateways.find(g => g.isActive) || gateways[0] || null;
  }

  public savePaymentGateway(gatewayData: PaymentGatewayConfig): Promise<PaymentGatewayConfig> {
    return this.runCommerceMutation(()=>this.buildSavePaymentGateway(gatewayData));
  }

  private buildSavePaymentGateway(gatewayData: PaymentGatewayConfig): PaymentGatewayConfig {
    if (!this.memoryData.paymentGateways) {
      this.memoryData.paymentGateways = [...INITIAL_PAYMENT_GATEWAYS];
    }
    const idx = this.memoryData.paymentGateways.findIndex(g => g.id === gatewayData.id);
    let existingCredentials = {};
    if (idx !== -1) {
      existingCredentials = this.memoryData.paymentGateways[idx].credentials || {};
    }

    // Merge credentials without overwriting with masked strings
    const incomingCreds = gatewayData.credentials || {};
    const mergedCreds: any = { ...existingCredentials };

    (['apiKey', 'secretKey', 'authKey', 'token', 'merchantSecret'] as const).forEach(k => {
      const val = incomingCreds[k];
      if (val && !val.startsWith('••••••••')) {
        mergedCreds[k] = val;
      }
    });
    if (gatewayData.providerKey === 'PAYPAL') {
      if (typeof incomingCreds.clientId === 'string' && incomingCreds.clientId.trim()) mergedCreds.clientId = incomingCreds.clientId.trim();
      if (typeof incomingCreds.clientSecret === 'string' && incomingCreds.clientSecret.trim() && !incomingCreds.clientSecret.startsWith('••••••••')) {
        mergedCreds.clientSecret = encryptPayPalSecret(incomingCreds.clientSecret.trim());
      }
      mergedCreds.hasClientSecret = !!mergedCreds.clientSecret;
    }
    mergedCreds.hasCredentials = !!(mergedCreds.clientSecret || mergedCreds.apiKey || mergedCreds.secretKey || mergedCreds.authKey || mergedCreds.token || mergedCreds.merchantSecret);

    const updatedGateway: PaymentGatewayConfig = {
      ...gatewayData,
      credentials: mergedCreds,
      lastModified: new Date().toISOString()
    };

    if (idx !== -1) {
      this.memoryData.paymentGateways[idx] = updatedGateway;
    } else {
      this.memoryData.paymentGateways.push(updatedGateway);
    }

    // If marked active, ensure others are inactive
    if (updatedGateway.isActive) {
      this.memoryData.paymentGateways.forEach(g => {
        if (g.id !== updatedGateway.id) {
          g.isActive = false;
        }
      });
      this.memoryData.systemSettings.primaryPaymentGatewayId = updatedGateway.id;
      if (updatedGateway.providerKey === 'AZUL') {
        this.memoryData.systemSettings.azulConfig = {
          merchantId: updatedGateway.merchantId,
          authKey: updatedGateway.credentials?.authKey || this.memoryData.systemSettings.azulConfig.authKey,
          isSandbox: updatedGateway.environment === 'SANDBOX',
          isEnabled: true,
          webhookUrl: updatedGateway.webhookUrl
        };
      }
    }

    this.addAuditLog('PAYMENT_GATEWAY_UPDATED', updatedGateway.id, undefined, `Configuración de pasarela ${updatedGateway.providerName} guardada. Activa: ${updatedGateway.isActive}`);
    this.commit();
    return this.maskGateway(updatedGateway);
  }

  public setActivePaymentGateway(gatewayId: string): Promise<boolean> {
    return this.runCommerceMutation(()=>this.buildSetActivePaymentGateway(gatewayId));
  }

  private buildSetActivePaymentGateway(gatewayId: string): boolean {
    if (!this.memoryData.paymentGateways) return false;
    const target = this.memoryData.paymentGateways.find(g => g.id === gatewayId);
    if (!target) return false;

    this.memoryData.paymentGateways.forEach(g => {
      g.isActive = g.id === gatewayId;
    });
    this.memoryData.systemSettings.primaryPaymentGatewayId = gatewayId;

    if (target.providerKey === 'AZUL') {
      this.memoryData.systemSettings.azulConfig = {
        merchantId: target.merchantId,
        authKey: target.credentials?.authKey || this.memoryData.systemSettings.azulConfig.authKey,
        isSandbox: target.environment === 'SANDBOX',
        isEnabled: true,
        webhookUrl: target.webhookUrl
      };
    }

    this.addAuditLog('PRIMARY_PAYMENT_RECEIVER_CHANGED', gatewayId, undefined, `Cuenta receptora principal de Plazado.com cambiada a: ${target.providerName} (${target.accountCommercialName})`);
    this.commit();
    return true;
  }

  public deletePaymentGateway(gatewayId: string): Promise<boolean> {
    return this.runCommerceMutation(()=>this.buildDeletePaymentGateway(gatewayId));
  }

  private buildDeletePaymentGateway(gatewayId: string): boolean {
    if (!this.memoryData.paymentGateways) return false;
    const idx = this.memoryData.paymentGateways.findIndex(g => g.id === gatewayId);
    if (idx === -1) return false;
    if (this.memoryData.paymentGateways[idx].isActive) {
      throw new Error('No se puede eliminar la cuenta receptora que actualmente está activa.');
    }
    const name = this.memoryData.paymentGateways[idx].providerName;
    if(this.memoryData.orders.some(o=>o.paypalPayment?.gatewayId===gatewayId))throw Error('Esta pasarela tiene pedidos asociados. Desactívala y conserva su historial.');
    (this.memoryData.paymentGateways[idx] as any).deleted=true;
    this.addAuditLog('PAYMENT_GATEWAY_DELETED', gatewayId, name, 'Pasarela de pago eliminada');
    this.commit();
    return true;
  }

  private maskSecret(str: string): string {
    if (!str) return '';
    if (str.startsWith('••••••••')) return str;
    const last4 = str.slice(-4);
    return '••••••••' + last4;
  }

  private maskGateway(g: PaymentGatewayConfig): PaymentGatewayConfig {
    return {
      ...g,
      credentials: {
        clientId: g.credentials?.clientId,
        hasClientSecret: !!g.credentials?.clientSecret,
        hasCredentials: !!(g.credentials?.apiKey || g.credentials?.secretKey || g.credentials?.authKey || g.credentials?.token || g.credentials?.merchantSecret || g.credentials?.hasCredentials),
        apiKey: g.credentials?.apiKey ? this.maskSecret(g.credentials.apiKey) : undefined,
        secretKey: g.credentials?.secretKey ? this.maskSecret(g.credentials.secretKey) : undefined,
        authKey: g.credentials?.authKey ? this.maskSecret(g.credentials.authKey) : undefined,
        token: g.credentials?.token ? this.maskSecret(g.credentials.token) : undefined,
        merchantSecret: g.credentials?.merchantSecret ? this.maskSecret(g.credentials.merchantSecret) : undefined
      }
    };
  }

  // --- ADVERTISING MANAGEMENT (Publicidad) ---
  public getAdvertisements(): Advertisement[] {
    return (this.memoryData.advertisements || []).filter((row:any)=>!row.deleted);
  }

  public getActiveAdvertisements(placement?: string, device?: string): Advertisement[] {
    const ads = this.memoryData.advertisements || [];
    const today = new Date().toISOString().split('T')[0];

    return ads.filter(ad => {
      if (!ad.isActive || (ad as any).deleted) return false;
      // Auto-expire check: do not show expired ads
      if (ad.startDate && ad.startDate > today) return false;
      if (ad.endDate && ad.endDate < today) return false;
      if (placement && ad.placement !== placement) return false;
      if (device && ad.targetDevice !== 'ALL' && ad.targetDevice !== device) return false;
      return true;
    }).sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return (a.order || 0) - (b.order || 0);
    });
  }

  public addAdvertisement(data: Omit<Advertisement, 'id' | 'impressions' | 'clicks' | 'createdAt'>): Promise<Advertisement> {
    return this.runCommerceMutation(()=>this.buildAddAdvertisement(data));
  }

  private buildAddAdvertisement(data: Omit<Advertisement, 'id' | 'impressions' | 'clicks' | 'createdAt'>): Advertisement {
    if (!this.memoryData.advertisements) {
      this.memoryData.advertisements = [];
    }
    const newId = `ad-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newAd: Advertisement = {
      ...data,
      id: newId,
      impressions: 0,
      clicks: 0,
      order: data.order || (this.memoryData.advertisements.length + 1),
      createdAt: new Date().toISOString()
    };
    this.memoryData.advertisements.unshift(newAd);
    this.addAuditLog('AD_CAMPAIGN_CREATED', newId, undefined, `Campaña publicitaria creada: "${newAd.title}" (${newAd.type}) en ${newAd.placement}`);
    this.commit();
    return newAd;
  }

  public updateAdvertisement(id: string, data: Partial<Advertisement>): Promise<Advertisement | null> {
    return this.runCommerceMutation(()=>this.buildUpdateAdvertisement(id,data));
  }

  private buildUpdateAdvertisement(id: string, data: Partial<Advertisement>): Advertisement | null {
    if (!this.memoryData.advertisements) return null;
    const idx = this.memoryData.advertisements.findIndex(a => a.id === id);
    if (idx === -1) return null;
    const prev = this.memoryData.advertisements[idx];
    const updated: Advertisement = {
      ...prev,
      ...data,
      id:prev.id,
      updatedAt: new Date().toISOString()
    };
    this.memoryData.advertisements[idx] = updated;
    this.addAuditLog('AD_CAMPAIGN_UPDATED', id, prev.title, `Campaña publicitaria actualizada: "${updated.title}"`);
    this.commit();
    return updated;
  }

  public toggleAdvertisementStatus(id: string): Promise<boolean> {
    return this.runCommerceMutation(()=>this.buildToggleAdvertisementStatus(id));
  }

  private buildToggleAdvertisementStatus(id: string): boolean {
    if (!this.memoryData.advertisements) return false;
    const ad = this.memoryData.advertisements.find(a => a.id === id);
    if (!ad) return false;
    ad.isActive = !ad.isActive;
    ad.updatedAt = new Date().toISOString();
    this.addAuditLog('AD_CAMPAIGN_STATUS_TOGGLED', id, undefined, `Campaña "${ad.title}" ${ad.isActive ? 'activada' : 'desactivada'}`);
    this.commit();
    return true;
  }

  public deleteAdvertisement(id: string): Promise<boolean> {
    return this.runCommerceMutation(()=>this.buildDeleteAdvertisement(id));
  }

  private buildDeleteAdvertisement(id: string): boolean {
    if (!this.memoryData.advertisements) return false;
    const idx = this.memoryData.advertisements.findIndex(a => a.id === id);
    if (idx === -1) return false;
    const title = this.memoryData.advertisements[idx].title;
    (this.memoryData.advertisements[idx] as any).deleted=true;this.memoryData.advertisements[idx].isActive=false;
    this.addAuditLog('AD_CAMPAIGN_DELETED', id, title, 'Campaña publicitaria eliminada');
    this.commit();
    return true;
  }

  public getAdPlacements(): AdPlacement[] {
    return this.memoryData.adPlacements || INITIAL_AD_PLACEMENTS;
  }

  public saveAdPlacement(placement: AdPlacement): Promise<AdPlacement> {
    return this.runCommerceMutation(()=>this.buildSaveAdPlacement(placement));
  }

  private buildSaveAdPlacement(placement: AdPlacement): AdPlacement {
    if (!this.memoryData.adPlacements) {
      this.memoryData.adPlacements = [...INITIAL_AD_PLACEMENTS];
    }
    const idx = this.memoryData.adPlacements.findIndex(p => p.code === placement.code);
    if (idx !== -1) {
      this.memoryData.adPlacements[idx] = placement;
    } else {
      this.memoryData.adPlacements.push(placement);
    }
    this.addAuditLog('AD_PLACEMENT_SAVED', placement.code, undefined, `Ubicación publicitaria guardada: ${placement.name}`);
    this.commit();
    return placement;
  }

  public trackAdImpression(adId: string, device?: string): boolean {
    if (!this.memoryData.advertisements) return false;
    const ad = this.memoryData.advertisements.find(a => a.id === adId);
    if (!ad) return false;
    ad.impressions = (ad.impressions || 0) + 1;
    this.commit();
    return true;
  }

  public trackAdClick(adId: string, device?: string): boolean {
    if (!this.memoryData.advertisements) return false;
    const ad = this.memoryData.advertisements.find(a => a.id === adId);
    if (!ad) return false;
    ad.clicks = (ad.clicks || 0) + 1;
    this.commit();
    return true;
  }
  public getOrders(): Order[] {
    return this.memoryData.orders;
  }

  public createOrders(orders: Order[]): Promise<Order[]> {
    const execute = async () => {
      const existing = orders.map(order => this.memoryData.orders.find(saved => saved.id === order.id));
      if (existing.every(Boolean)) return existing as Order[];
      if (existing.some(Boolean)) throw new Error('Compra parcialmente registrada. Contacta a soporte.');
      const current = this.memoryData;
      const previous = structuredClone(current);
      this.memoryData = structuredClone(previous);
      this.stagingCheckout = true;
      let next: GlobalDatabaseData;
      let created: Order[];
      try {
        created = this.buildCheckout(orders);
        next = this.memoryData;
      } finally {
        this.memoryData = current;
        this.stagingCheckout = false;
      }
      await firestoreRepo.persistCheckout(previous, next!);
      for (const change of commerceChanges(previous, next!)) {
        if (change.collection === 'storeBalances') this.memoryData.storeBalances[change.id] = change.after;
        else {
          const list = ((this.memoryData as any)[change.collection] ||= []);
          const index = list.findIndex((row: any) => row.id === change.id);
          if (change.collection === 'products' && index >= 0) list[index] = {...list[index],stock:change.after.stock,soldCount:change.after.soldCount};
          else if (index >= 0) list[index] = change.after;
          else list.unshift(change.after);
        }
      }
      this.commit();
      cloudSqlRepo.saveRawOrders(created!).catch(err => console.error('[CloudSQL] Checkout mirror failed:', err));
      return created!;
    };
    const result = this.checkoutQueue.then(execute, execute);
    this.checkoutQueue = result.then(() => undefined, () => undefined);
    return result;
  }

  private buildCheckout(orders: Order[]): Order[] {

    const rate = this.memoryData.systemSettings.plazaCommissionRate !== undefined 
      ? this.memoryData.systemSettings.plazaCommissionRate 
      : 0.30; // 30% de Plazado.com

    orders.forEach((ord, idx) => {
      // Recalcular formalmente con la tasa de comisión oficial de Plazado.com
      const commission = Number((ord.total * rate).toFixed(2));
      const netStore = Number((ord.total - commission).toFixed(2));
      ord.plazaCommissionRate = rate;
      ord.plazaCommissionAmount = commission;
      ord.storeNetEarnings = netStore;
      ord.settlementStatus = 'PENDING';

      this.memoryData.orders.unshift(ord);

      // Check if this order contains items stored in Plazado Fulfillment
      const hasFulfillmentItem = ord.items.some(item => {
        const prod = this.memoryData.products.find(p => p.id === item.productId);
        const inv = (this.memoryData.fulfillmentInventory || []).find(
          i => i.storeId === ord.storeId && (i.productId === item.productId || i.sku === item.sku)
        );
        return prod?.isFulfillment || (inv && inv.available > 0);
      });

      if (hasFulfillmentItem) {
        ord.fulfillmentType = 'PLAZADO_FULFILLMENT';
        ord.fulfillmentStatus = 'PENDING_STORE_CONFIRMATION';
        const timeoutMins = this.memoryData.fulfillmentConfig?.orderConfirmationTimeoutMinutes || 60;
        ord.storeConfirmationDeadline = new Date(Date.now() + timeoutMins * 60 * 1000).toISOString();

        // Perform AUTOMATIC PREVENTIVE RESERVATION
        const currentFulfillmentInv = this.memoryData.fulfillmentInventory || [];
        this.memoryData.fulfillmentInventory = currentFulfillmentInv;
        const currentInvMovements = this.memoryData.inventoryMovements || [];
        this.memoryData.inventoryMovements = currentInvMovements;

        ord.items.forEach(item => {
          const inv = currentFulfillmentInv.find(
            (i: any) => i.storeId === ord.storeId && (i.productId === item.productId || i.sku === item.sku)
          );
          if (inv) {
            const reservedQty = Math.min(inv.available, item.quantity);
            const prevAvail = inv.available;
            inv.available = Math.max(0, inv.available - reservedQty);
            inv.reserved += reservedQty;
            inv.updatedAt = new Date().toISOString();

            // Log movement
            currentInvMovements.unshift({
              id: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              inventoryItemId: inv.id,
              storeId: inv.storeId,
              storeName: inv.storeName,
              productId: inv.productId,
              productName: inv.productName,
              sku: inv.sku,
              type: 'RESERVATION_HOLD',
              quantityChanged: reservedQty,
              previousAvailable: prevAvail,
              newAvailable: inv.available,
              warehouseId: inv.warehouseId,
              warehouseName: inv.warehouseName,
              relatedOrderId: ord.id,
              reason: `Reserva preventiva automática para pedido #${ord.id}. En espera de confirmación de tienda.`,
              performedBy: 'Sistema Plazado Fulfillment',
              performedByRole: 'SUPER_ADMIN',
              timestamp: new Date().toISOString()
            });
          }
        });

        // Create official FulfillmentOrder (FO-XXXXX)
        const currentFulfillmentOrders = this.memoryData.fulfillmentOrders || [];
        this.memoryData.fulfillmentOrders = currentFulfillmentOrders;
        const foId = `FO-${ord.id.replace('ORD-', '')}`;
        ord.fulfillmentOrderId = foId;

        const fulfillmentOrder: FulfillmentOrder = {
          id: foId,
          orderId: ord.id,
          orderGroupCode: ord.orderGroupCode,
          storeId: ord.storeId,
          storeName: ord.storeName,
          customerId: ord.customerId,
          customerName: ord.customerName,
          customerPhone: ord.customerPhone,
          customerEmail: ord.customerEmail,
          deliveryAddress: ord.deliveryAddress,
          items: ord.items.map(it => {
            const inv = currentFulfillmentInv.find(
              (i: any) => i.storeId === ord.storeId && (i.productId === it.productId || i.sku === it.sku)
            );
            return {
              productId: it.productId,
              productName: it.productName,
              productImage: it.productImage,
              sku: it.sku,
              variantName: it.variantName,
              quantity: it.quantity,
              warehouseId: inv?.warehouseId || 'wh-sdo-01',
              location: inv?.location || {
                warehouseId: 'wh-sdo-01',
                warehouseName: 'Centro Logístico Central Santo Domingo Oeste',
                zone: 'Zona A',
                aisle: 'P-01',
                shelf: 'E-01',
                level: 'N-01',
                position: 'Pos-01',
                barcode: 'LOC-A-01-01-01-01'
              },
              pickedQuantity: 0,
              isPicked: false
            };
          }),
          subtotal: ord.subtotal,
          shippingCost: ord.shippingCost,
          total: ord.total,
          status: 'PENDING_STORE_CONFIRMATION',
          storeConfirmationDeadline: ord.storeConfirmationDeadline,
          pickingCode: `PICK-${Math.floor(10000 + Math.random() * 90000)}`,
          timeline: [
            {
              status: 'ORDER_RECEIVED',
              label: 'Pedido recibido',
              timestamp: new Date().toISOString(),
              actor: 'Cliente',
              notes: 'Pedido recibido con productos de Plazado Fulfillment. Unidades reservadas preventivamente.',
              completed: true
            },
            {
              status: 'WAITING_STORE_CONFIRMATION',
              label: 'Esperando confirmación de tienda',
              timestamp: new Date().toISOString(),
              actor: 'Sistema Plazado',
              notes: `Tiempo límite: ${timeoutMins} minutos para confirmar o rechazar.`,
              completed: false
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        this.memoryData.fulfillmentOrders.unshift(fulfillmentOrder);
      }

      // Reduce product stock & increment soldCount
      ord.items.forEach(item => {
        const p = this.memoryData.products.find(prod => prod.id === item.productId);
        if (p) {
          p.stock = Math.max(0, p.stock - item.quantity);
          p.soldCount = (p.soldCount || 0) + item.quantity;
        }
      });

      // Update store balance
      const currentBalance = this.memoryData.storeBalances[ord.storeId] || {
        storeId: ord.storeId,
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
        lastUpdated: new Date().toISOString()
      };

      if (ord.accountingVersion !== 2) currentBalance.totalSales += ord.total;

      const isPayPal = ord.paymentMethod === 'PAYPAL';
      const isCard = ord.paymentMethod === 'CARD_AZUL';
      const authCode = ord.cardAuthorizationCode || `AUTH-AUTO-${Math.floor(100000 + Math.random() * 900000)}`;
      const cardLast4 = ord.cardLast4 || '4111';
      const cardBrand = ord.cardBrand || 'VISA';
      if (isCard) {
        ord.cardAuthorizationCode = authCode;
        ord.cardLast4 = cardLast4;
        ord.cardBrand = cardBrand;
        ord.chargeType = 'AUTOMATIC';
        ord.cardChargedAt = ord.cardChargedAt || new Date().toISOString();
      }

      const gatewayRef = isCard 
        ? `AZUL-${authCode}` 
        : isPayPal ? `PAYPAL-PENDING-${ord.id}` : `CASH-ORD-${ord.id}`;
      const idempotencyKey = `PAY-${ord.id}-${ord.storeId}`;

      // 1. CUENTA CENTRAL DE PLAZADO.COM / 3. PAGOS CON TARJETA / 4. PAGOS EN EFECTIVO
      if (isCard) {
        // Tarjeta: El 100% ingresa primero a la cuenta central de Plazado.com
        // Cargo automático aprobado de inmediato
        currentBalance.cardSales = (currentBalance.cardSales || 0) + ord.total;
        currentBalance.pendingBalance = (currentBalance.pendingBalance || 0) + netStore;
        currentBalance.plazaCommissionsPaid = (currentBalance.plazaCommissionsPaid || 0) + commission;
        ord.paymentStatus = 'PAID';

        this.addFinancialAuditLog({
          orderId: ord.id,
          storeId: ord.storeId,
          storeName: ord.storeName,
          amount: ord.total,
          commission: commission,
          paymentMethod: 'CARD_AZUL',
          movementType: 'SALE_CARD',
          actor: 'PLAZADO_CENTRAL_PAYMENT_GATEWAY',
          previousBalance: currentBalance.pendingBalance - netStore,
          newBalance: currentBalance.pendingBalance,
          externalRef: gatewayRef,
          status: 'CAPTURED',
          notes: `Cargo automático aprobado a tarjeta ${cardBrand} ••••${cardLast4} (Aut: ${authCode}). Ingresado 100% en cuenta de custodia Plazado.com. Comisión: RD$ ${commission} (${(rate * 100).toFixed(2)}%). Neto retenido en balance pendiente: RD$ ${netStore}.`
        });
      } else if (isPayPal) {
        ord.paymentStatus = 'PENDING';
      } else {
        // Efectivo: La tienda cobra directamente.
        // Comisión calculada como deuda pendiente de cobro en liquidación semanal.
        if (ord.accountingVersion !== 2) currentBalance.cashSales = (currentBalance.cashSales || 0) + ord.total;
        if (ord.accountingVersion !== 2) currentBalance.pendingCashCommissions = (currentBalance.pendingCashCommissions || 0) + commission;
        ord.paymentStatus = 'PENDING';

        this.addFinancialAuditLog({
          orderId: ord.id,
          storeId: ord.storeId,
          storeName: ord.storeName,
          amount: ord.total,
          commission: commission,
          paymentMethod: 'CASH_ON_DELIVERY',
          movementType: 'COMMISSION_CHARGE',
          actor: 'PLAZADO_CENTRAL_PAYMENT_GATEWAY',
          previousBalance: currentBalance.pendingCashCommissions - commission,
          newBalance: currentBalance.pendingCashCommissions,
          externalRef: gatewayRef,
          status: 'PENDING_COLLECTION',
          notes: `Venta en efectivo recibida directamente por la tienda. Comisión de Plazado.com (${(rate * 100).toFixed(2)}% = RD$ ${commission}) acumulada para descuento en liquidación de viernes.`
        });
      }

      currentBalance.lastUpdated = new Date().toISOString();
      this.memoryData.storeBalances[ord.storeId] = currentBalance;

      // Registrar transacción vinculada
      if (!this.memoryData.paymentTransactions) {
        this.memoryData.paymentTransactions = [];
      }
      const tx: PaymentTransaction = {
        id: `TX-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        orderId: ord.id,
        orderGroupCode: ord.orderGroupCode,
        customerId: ord.customerId,
        customerName: ord.customerName,
        storeId: ord.storeId,
        storeName: ord.storeName,
        amount: ord.total,
        method: ord.paymentMethod,
        commissionAmount: commission,
        netAmount: netStore,
        orderStatus: ord.status,
        paymentStatus: ord.paymentStatus,
        settlementStatus: 'PENDING',
        gatewayReference: gatewayRef,
        idempotencyKey: idempotencyKey,
        cardLast4: isCard ? cardLast4 : undefined,
        cardBrand: isCard ? cardBrand : undefined,
        notes: isCard ? `Cargo automático procesado con éxito (Aut: ${authCode})` : isPayPal ? 'Pendiente de confirmación real PayPal' : 'Efectivo contra entrega',
        createdAt: new Date().toISOString()
      };
      this.memoryData.paymentTransactions.unshift(tx);

      this.addAuditLog('ORDER_CREATED', ord.id, undefined, `Orden creada ${ord.orderGroupCode} para tienda ${ord.storeId} por DOP ${ord.total}. Comisión Plazado: RD$ ${commission}`);
    });

    this.commit();

    if (!this.stagingCheckout) cloudSqlRepo.saveRawOrders(orders).catch(err => console.error('[CloudSQL] Error syncing saveRawOrders:', err));

    return orders;
  }

  private runCommerceMutation<T>(mutate: () => T): Promise<T> {
    const priorSettings=this.settingsUpdateQueue;
    const execute = async () => {
      await priorSettings;
      const current = this.memoryData;
      const previous = structuredClone(current);
      this.memoryData = structuredClone(previous);
      this.stagingCheckout = true;
      let result: T, next: GlobalDatabaseData;
      try { result = mutate(); next = this.memoryData; }
      finally { this.memoryData = current; this.stagingCheckout = false; }
      if ((result as any)?.success === false && !(result as any)?.commitFailure) return result!;
      const changes = commerceChanges(previous,next!);
      if (!changes.length) return result!;
      for(const change of changes) if(change.collection==='users' && change.before && change.after.passwordHash!==change.before.passwordHash) change.after.authVersion=(change.before.authVersion || 0)+1;
      await firestoreRepo.persistCheckout(previous,next!,false);
      for (const change of changes) {
        if (change.collection === 'systemSettings') this.memoryData.systemSettings=change.after;
        else if (change.collection === 'fulfillmentConfig') this.memoryData.fulfillmentConfig=change.after;
        else if (change.collection === 'storeBalances') this.memoryData.storeBalances[change.id]=change.after;
        else {
          const list=((this.memoryData as any)[change.collection] ||= []),index=list.findIndex((row:any)=>(row.id || row.code)===change.id);
          if (change.collection==='products' && index>=0) list[index]={...list[index],...change.after};
          else if(index>=0) list[index]=change.after;else list.unshift(change.after);
        }
      }
      for(const change of changes) {
        if(change.collection==='users' && change.after.passwordHash) this.setUserCredential(change.id,change.after.passwordHash);
        if(change.collection==='stores') storesDb.applyDurableStore(change.after);
      }
      this.commit();
      return result!;
    };
    const operation=this.checkoutQueue.then(execute,execute);
    this.checkoutQueue=operation.then(()=>undefined,()=>undefined);
    return operation;
  }

  public runFulfillmentMutation<T>(mutate:()=>T):Promise<T> {
    return this.runCommerceMutation(() => {
      const result=mutate();
      for(const item of this.memoryData.fulfillmentInventory || []) for(const field of ['available','reserved','inTransit','delivered','totalPhysical','damaged','blocked','inPicking','inPacking','prepared']) {
        const quantity=(item as any)[field];
        if(quantity!==undefined && (!Number.isSafeInteger(quantity) || quantity<0)) throw new Error('Inventario de almacén inconsistente. Se requiere revisión antes de guardar');
      }
      return result;
    });
  }

  public updatePayPalOrders(ids: string[], mutate: (orders: Order[], state: any) => void): Promise<Order[]> {
    return this.runCommerceMutation(() => {
      const orders = ids.map(id => this.memoryData.orders.find(order => order.id === id));
      if (orders.some(order => !order)) throw new Error('Pedido PayPal no encontrado');
      mutate(orders as Order[], this.memoryData);
      return orders as Order[];
    });
  }

  public confirmPayPalCapture(ids: string[], remote: any): Promise<Order[]> {
    return this.updatePayPalOrders(ids, (orders, state) => applyPayPalCapture(state, orders, remote));
  }

  public updateOrderStatus(orderId: string, status: OrderStatus, note?: string, confirmationCode?: string) {
    return this.runCommerceMutation(() => transitionOrder(this.memoryData,orderId,status,note,confirmationCode));
  }

  public deleteOrder(orderId: string): boolean {
    const idx = this.memoryData.orders.findIndex(o => o.id === orderId);
    if (idx === -1) return false;
    const num = this.memoryData.orders[idx].id;
    this.memoryData.orders.splice(idx, 1);
    this.addAuditLog('ORDER_DELETED', orderId, num, 'Pedido eliminado permanentemente');
    this.commit();
    return true;
  }

  // --- ORDER CHAT MESSAGING (CANAL EXCLUSIVO EN PLATAFORMA TRAS COMPRA) ---
  public getOrderMessages(orderId: string): OrderChatMessage[] {
    if (!Array.isArray(this.memoryData.orderMessages)) {
      this.memoryData.orderMessages = [];
    }
    return this.memoryData.orderMessages.filter(m => m.orderId === orderId);
  }

  public getAllOrderMessages(): OrderChatMessage[] {
    if (!Array.isArray(this.memoryData.orderMessages)) {
      this.memoryData.orderMessages = [];
    }
    return this.memoryData.orderMessages;
  }

  public addOrderMessage(data: {
    orderId: string;
    storeId: string;
    customerId: string;
    senderId: string;
    senderName: string;
    senderRole: 'CUSTOMER' | 'STORE' | 'ADMIN';
    message: string;
  }): Promise<OrderChatMessage> {
    return this.runCommerceMutation(() => {
    if(typeof data.message!=='string' || !data.message.trim() || data.message.length>5000) throw new Error('El mensaje debe contener entre 1 y 5000 caracteres');
    if (!Array.isArray(this.memoryData.orderMessages)) {
      this.memoryData.orderMessages = [];
    }

    const newMessage: OrderChatMessage = {
      id: `MSG-${crypto.randomUUID()}`,
      orderId: data.orderId,
      storeId: data.storeId,
      customerId: data.customerId,
      senderId: data.senderId,
      senderName: data.senderName,
      senderRole: data.senderRole,
      message: (data.message || '').trim(),
      createdAt: new Date().toISOString(),
      readByCustomer: data.senderRole === 'CUSTOMER',
      readByStore: data.senderRole === 'STORE'
    };

    this.memoryData.orderMessages.push(newMessage);
    this.commit();
    return newMessage;
    });
  }

  public markOrderMessagesAsRead(orderId: string, role: 'CUSTOMER' | 'STORE'): Promise<boolean> {
    return this.runCommerceMutation(() => {
    if (!Array.isArray(this.memoryData.orderMessages)) {
      this.memoryData.orderMessages = [];
      return true;
    }

    let modified = false;
    this.memoryData.orderMessages.forEach(m => {
      if (m.orderId === orderId) {
        if (role === 'CUSTOMER' && !m.readByCustomer) {
          m.readByCustomer = true;
          modified = true;
        } else if (role === 'STORE' && !m.readByStore) {
          m.readByStore = true;
          modified = true;
        }
      }
    });

    if (modified) {
      this.commit();
    }
    return true;
    });
  }

  // --- BALANCES & SETTLEMENTS (PROCESO AUTOMÁTICO DE LOS VIERNES) ---
  public getStoreBalances(): Record<string, StoreBalance> {
    return this.memoryData.storeBalances;
  }

  public getSettlements(): Settlement[] {
    return this.memoryData.settlements;
  }

  // 5, 6, 7. LIQUIDACIONES AUTOMÁTICAS LOS VIERNES
  public runWeeklySettlementProcess(actorName: string = 'SUPER_ADMIN') {
    return this.runCommerceMutation(() => weeklySettlementsState(this.memoryData, actorName));
  }

  public requestSettlement(storeId: string, notes?: string) {
    return this.runCommerceMutation(() => requestSettlementState(this.memoryData, storeId, notes));
  }

  public processSettlement(settlementId: string, status: Settlement['status'], reference?: string): Promise<Settlement | null> {
    return this.runCommerceMutation(() => processSettlementState(this.memoryData,settlementId,status,reference));
  }

  public deleteSettlement(id: string): boolean {
    const idx = this.memoryData.settlements.findIndex(s => s.id === id);
    if (idx === -1) return false;
    this.memoryData.settlements.splice(idx, 1);
    this.addAuditLog('SETTLEMENT_DELETED', id, undefined, 'Liquidación eliminada');
    this.commit();
    return true;
  }

  // 14. WEBHOOK DE CONFIRMACIÓN DE PAGOS
  public processPaymentWebhook(payload: any): { success: boolean; message: string; transaction?: PaymentTransaction } {
    try {
      const { event, transactionId, orderId, amount, status, idempotencyKey } = payload || {};
      if (!orderId && !transactionId) {
        return { success: false, message: 'Payload inválido: faltan campos obligatorios.' };
      }

      // Idempotencia
      const key = idempotencyKey || `WEBHOOK-${transactionId || orderId}`;
      const existingTx = (this.memoryData.paymentTransactions || []).find(t => t.idempotencyKey === key || t.gatewayReference === transactionId);

      if (existingTx && event === 'PAYMENT_PROCESSED') {
        return { success: true, message: 'Evento ya procesado previamente (Idempotente).', transaction: existingTx };
      }

      const order = this.memoryData.orders.find(o => o.id === orderId);
      if (order && status === 'SUCCESS') {
        order.paymentStatus = 'PAID';
      }

      this.addFinancialAuditLog({
        orderId,
        storeId: order?.storeId || 'UNKNOWN',
        storeName: order?.storeName,
        amount: Number(amount || order?.total || 0),
        commission: Number(order?.plazaCommissionAmount || 0),
        paymentMethod: order?.paymentMethod || 'CARD_AZUL',
        movementType: 'SALE_CARD',
        actor: 'PAYMENT_WEBHOOK_HANDLER',
        previousBalance: 0,
        newBalance: 0,
        externalRef: transactionId,
        status: status || 'SUCCESS',
        notes: `Webhook de pago recibido y procesado para orden ${orderId}. Evento: ${event || 'PAYMENT_CONFIRMED'}.`
      });

      this.commit();
      return { success: true, message: 'Webhook procesado correctamente.' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Error procesando webhook.' };
    }
  }

  // --- DISPUTES ---
  public getDisputes(): Dispute[] {
    return this.memoryData.disputes;
  }

  public createDispute(data: Omit<Dispute, 'id' | 'status' | 'createdAt'>): Promise<Dispute> {
    return this.runCommerceMutation(() => {
      const order=this.memoryData.orders.find(o=>o.id===data.orderId);
      if(!order) throw new Error('Pedido no encontrado');
      if(!['WRONG_ITEM','NOT_RECEIVED','DAMAGED','DESCRIPTION_MISMATCH','DELIVERY_ISSUE'].includes(data.issueType) || !data.description?.trim() || data.description.length>5000) throw new Error('Tipo o descripción de reclamación inválidos');
      if(this.memoryData.disputes.some(d=>d.orderId===order.id && !['CLOSED','RESOLVED'].includes(d.status))) throw new Error('El pedido ya tiene una reclamación abierta');
      for(const settlement of this.memoryData.settlements.filter(s=>['PENDING','RETAINED'].includes(s.status) && s.orderIds?.includes(order.id))) processSettlementState(this.memoryData,settlement.id,'REJECTED');
      const dispute:Dispute={id:`disp-${crypto.randomUUID()}`,orderId:order.id,storeId:order.storeId,storeName:order.storeName,customerId:order.customerId,customerName:order.customerName,customerEmail:data.customerEmail,issueType:data.issueType,description:data.description.trim(),refundRequested:!!data.refundRequested,refundAmount:Math.max(0,Math.min(Number(data.refundAmount)||0,order.total)),status:'OPEN',createdAt:new Date().toISOString()};
      order.activeDisputeId=dispute.id;
      this.memoryData.disputes.unshift(dispute);
      this.addAuditLog('DISPUTE_OPENED',dispute.id,undefined,`Reclamación del pedido ${order.id}`);
      return dispute;
    });
  }

  public resolveDispute(disputeId:string,status:Dispute['status'],resolutionNotes:string):Promise<Dispute|null> {
    return this.runCommerceMutation(() => {
      const dispute=this.memoryData.disputes.find(d=>d.id===disputeId);
      if(!dispute) return null;
      if(!['UNDER_REVIEW','WAITING_RESPONSE','RESOLVED','CLOSED'].includes(status)) throw new Error('Estado de reclamación inválido');
      if(['CLOSED','RESOLVED'].includes(dispute.status) && status!==dispute.status) throw new Error('La reclamación ya fue cerrada');
      if(['CLOSED','RESOLVED'].includes(status) && !resolutionNotes?.trim()) throw new Error('Documenta la resolución antes de cerrar');
      const order=this.memoryData.orders.find(o=>o.id===dispute.orderId);
      if(order && ['CLOSED','RESOLVED'].includes(status) && order.activeDisputeId===disputeId) order.activeDisputeId=null;
      dispute.status=status;dispute.resolutionNotes=String(resolutionNotes || '').trim().slice(0,5000);
      this.addAuditLog('DISPUTE_RESOLVED',disputeId,undefined,`Estado ${status}. El cierre no ejecuta un reembolso bancario`);
      return dispute;
    });
  }

  // --- REVIEWS ---
  public getReviews(): Review[] {
    return this.memoryData.reviews;
  }

  public async addReview(reviewData: Omit<Review, 'id' | 'createdAt' | 'isVerifiedPurchase' | 'isModerated'>): Promise<Review> {
    return this.runCommerceMutation(() => {
      const customer = this.memoryData.users.find(u => u.id === reviewData.customerId && u.role === 'CUSTOMER');
      const product = this.memoryData.products.find(p => p.id === reviewData.productId && p.storeId === reviewData.storeId);
      const purchased = this.memoryData.orders.some(o => o.customerId === reviewData.customerId && o.storeId === reviewData.storeId && o.status === 'DELIVERED' && o.items.some(item => item.productId === reviewData.productId));
      if (!customer || !product || !purchased) throw new Error('Solo puedes valorar productos de tus compras entregadas.');
      if (!Number.isInteger(reviewData.rating) || reviewData.rating < 1 || reviewData.rating > 5) throw new Error('La valoración debe ser un número entero entre 1 y 5.');
      if (typeof reviewData.comment !== 'string' || reviewData.comment.length > 2000) throw new Error('Comentario inválido: máximo 2000 caracteres.');
      if (this.memoryData.reviews.some(review => review.customerId === customer.id && review.productId === product.id)) throw new Error('Ya has valorado este producto.');
      const review: Review = { id: `rev-${encodeURIComponent(customer.id)}-${encodeURIComponent(product.id)}`, customerId: customer.id, customerName: customer.name, productId: product.id, storeId: product.storeId, rating: reviewData.rating, comment: reviewData.comment.trim(), isVerifiedPurchase: true, isModerated: true, createdAt: new Date().toISOString() };
      this.memoryData.reviews.unshift(review);
      return review;
    });
  }

  public async deleteReview(reviewId: string): Promise<boolean> {
    return this.runCommerceMutation(() => {
      const review = this.memoryData.reviews.find(r => r.id === reviewId);
      if (!review) return false;
      review.isModerated = false;
      return true;
    });
  }

  // --- USERS & AUTH ---
  public getUsers(): User[] {
    return this.memoryData.users;
  }

  public getUserById(id: string): User | undefined {
    if (!id) return undefined;
    return this.memoryData.users.find(u => u.id === id);
  }

  public getUserCredentials(): UserCredential[] {
    if (!this.memoryData.userCredentials) {
      this.memoryData.userCredentials = [];
    }
    return this.memoryData.userCredentials;
  }

  public getUserCredential(userId: string): UserCredential | undefined {
    if (!this.memoryData.userCredentials) {
      this.memoryData.userCredentials = [];
    }
    return this.memoryData.userCredentials.find(c => c.userId === userId);
  }

  public setUserCredential(userId: string, passwordHash: string): UserCredential {
    if (!this.memoryData.userCredentials) {
      this.memoryData.userCredentials = [];
    }
    const idx = this.memoryData.userCredentials.findIndex(c => c.userId === userId);
    const now = new Date().toISOString();
    let cred: UserCredential;
    if (idx !== -1) {
      cred = {
        ...this.memoryData.userCredentials[idx],
        passwordHash,
        updatedAt: now
      };
      this.memoryData.userCredentials[idx] = cred;
    } else {
      cred = {
        id: `cred-${userId}`,
        userId,
        passwordHash,
        createdAt: now,
        updatedAt: now
      };
      this.memoryData.userCredentials.push(cred);
    }

    const u = this.memoryData.users.find(user => user.id === userId);
    if (u) {
      u.passwordHash = passwordHash;
    }

    this.commit();
    return cred;
  }

  public addUser(user:User) {
    return this.runCommerceMutation(() => {
      if(this.memoryData.users.some(u=>u.id===user.id || u.email.toLowerCase()===user.email.toLowerCase())) throw Error('La cuenta ya existe');
      this.memoryData.users.push(structuredClone(user));return user;
    });
  }

  public requestPasswordRecovery(email:string,codeHash:string) {
    return this.runCommerceMutation(() => {
      const user=this.memoryData.users.find(u=>u.email.toLowerCase()===email);
      if(!user || Date.now()-(user.passwordRecovery?.requestedAt || 0)<60000) return false;
      user.passwordRecovery={codeHash,expiresAt:Date.now()+15*60000,attempts:0,requestedAt:Date.now()};
      return true;
    });
  }

  public completePasswordRecovery(email:string,codeHash:string,passwordHash:string) {
    return this.runCommerceMutation(() => {
      const user=this.memoryData.users.find(u=>u.email.toLowerCase()===email),recovery=user?.passwordRecovery;
      if(!user || !recovery || recovery.expiresAt<Date.now() || recovery.attempts>=5) return {success:false};
      if(recovery.codeHash!==codeHash) {recovery.attempts++;return {success:false,commitFailure:true};}
      user.passwordHash=passwordHash;user.passwordRecovery=null;
      this.addAuditLog('PASSWORD_RECOVERED',user.id,undefined,'Contraseña recuperada; sesiones anteriores revocadas');
      return {success:true};
    });
  }

  public recordCashCommission(storeId:string,amount:number,reference:string,actor:string) {
    return this.runCommerceMutation(()=>recordCashCommissionState(this.memoryData,storeId,amount,reference,actor));
  }

  public updateUser(userId:string,data:Partial<User>) {
    return this.runCommerceMutation(() => {
      const index=this.memoryData.users.findIndex(u=>u.id===userId);
      if(index<0) return null;
      const updated={...this.memoryData.users[index],...data,id:userId};
      this.memoryData.users[index]=updated;return updated;
    });
  }

  public registerStoreAccount(user:User,store:Store) {
    return this.runCommerceMutation(() => {
      const index=this.memoryData.users.findIndex(u=>u.id===user.id);
      if(index>=0 && this.memoryData.users[index].isEmailVerified) throw Error('La cuenta ya está verificada');
      if(this.memoryData.users.some(u=>u.id!==user.id && u.email.toLowerCase()===user.email.toLowerCase())) throw Error('El correo ya pertenece a otra cuenta');
      if(index<0) this.memoryData.users.push(structuredClone(user));else this.memoryData.users[index]=structuredClone(user);
      const existing=this.memoryData.stores.find(s=>s.id===store.id);
      if(existing) {
        if(existing.ownerId!==user.id && existing.owner_id!==user.id) throw Error('La tienda pertenece a otra cuenta');
        Object.assign(existing,{isEmailVerified:false});
      } else this.memoryData.stores.push(structuredClone(store));
      return {user,store:existing || store};
    });
  }

  public deleteUser(userId: string, deleteAssociatedStore: boolean = false): boolean {
    const idx = this.memoryData.users.findIndex(u => u.id === userId);
    if (idx === -1) return false;
    const user = this.memoryData.users[idx];
    if (user.role === 'SUPER_ADMIN') {
      return false; // Cannot delete Super Admin
    }

    const ownedStores = this.memoryData.stores.filter(s =>
      s.ownerId === userId || (s as any).owner_id === userId || (user.storeId && s.id === user.storeId)
    );
    if (ownedStores.length > 0 && !deleteAssociatedStore) {
      console.warn(`[GlobalDatabase] Blocked deletion of owner ${userId}: ${ownedStores.length} associated store(s).`);
      return false;
    }
    if (deleteAssociatedStore) {
      for (const ownedStore of ownedStores) this.deleteStore(ownedStore.id);
    }

    this.memoryData.users.splice(idx, 1);
    if (this.memoryData.userCredentials) {
      this.memoryData.userCredentials = this.memoryData.userCredentials.filter(c => c.userId !== userId);
    }
    this.addAuditLog('USER_DELETED', userId, user.email, 'Usuario eliminado de la base de datos y Google Cloud');
    this.commit();
    firestoreRepo.deleteUser(userId).catch(err => console.error('[Firestore] Error deleting user:', err));
    cloudSqlRepo.deleteUser(userId).catch(err => console.error('[CloudSQL] Error deleting user:', err));
    return true;
  }

  public deleteNonAdminUsers(): { deletedCount: number; remainingAdmins: User[] } {
    const nonAdminUsers = this.memoryData.users.filter(u => u.role !== 'SUPER_ADMIN');
    const remainingAdmins = this.memoryData.users.filter(u => u.role === 'SUPER_ADMIN');
    
    for (const u of nonAdminUsers) {
      firestoreRepo.deleteUser(u.id).catch(err => console.error('[Firestore] Error deleting user:', err));
      cloudSqlRepo.deleteUser(u.id).catch(err => console.error('[CloudSQL] Error deleting user:', err));
    }

    this.memoryData.users = remainingAdmins;
    this.addAuditLog('NON_ADMIN_USERS_DELETED', 'users', `${nonAdminUsers.length} eliminados`, `Super Admins conservados: ${remainingAdmins.map(a => a.email).join(', ')}`);
    this.commit();

    return {
      deletedCount: nonAdminUsers.length,
      remainingAdmins
    };
  }

  // --- USER EMAIL VERIFICATION & SUPPORT SYSTEM ---
  public getUserByEmail(email: string): User | undefined {
    const clean = (email || '').trim().toLowerCase();
    return this.memoryData.users.find(u => u.email.toLowerCase() === clean);
  }

  public setUserVerification(emailOrId:string,verification:UserVerificationInfo) {
    return this.runCommerceMutation(() => {
      const user=this.memoryData.users.find(u=>u.id===emailOrId || u.email.toLowerCase()===emailOrId.toLowerCase());
      if(!user) return false;
      user.verification=structuredClone(verification);user.isEmailVerified=verification.isVerified;return true;
    });
  }

  public confirmUserEmail(email:string,code:string) {
    return this.runCommerceMutation(() => {
      const user=this.memoryData.users.find(u=>u.email.toLowerCase()===email.toLowerCase());
      if(!user || !user.verification) return {success:false,message:'No existe un registro pendiente para este correo'};
      if(user.isEmailVerified) return {success:false,message:'Tu cuenta ya está verificada. Inicia sesión con tu contraseña'};
      const verification=user.verification;
      if(verification.attempts>=5) return {success:false,message:'Alcanzaste el límite de intentos. Solicita un nuevo código'};
      if(Date.now()>verification.codeExpiresAt) return {success:false,message:'El código ha expirado. Solicita uno nuevo'};
      if(code!==verification.code) {verification.attempts++;return {success:false,commitFailure:true,message:'Código incorrecto'};}
      verification.isVerified=true;verification.verifiedAt=new Date().toISOString();verification.code='';verification.codeExpiresAt=0;user.isEmailVerified=true;
      const store=this.memoryData.stores.find(s=>s.id===user.storeId);
      if(store) {store.isEmailVerified=true;if(store.status==='APPROVED') store.isPublished=true;}
      return {success:true,message:'Correo verificado. Inicia sesión con tu contraseña.',user};
    });
  }

  public getVerificationsList(): Array<{
    id: string;
    name: string;
    email: string;
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
  }> {
    const storesMap = new Map(this.memoryData.stores.map(s => [s.id, s]));
    return this.memoryData.users.map(u => {
      const isStore = u.role === 'STORE_OWNER' || !!u.storeId;
      const store = u.storeId ? storesMap.get(u.storeId) : undefined;
      const v = u.verification;
      const isVerified = u.isEmailVerified === true || v?.isVerified === true;
      let status: 'PENDING' | 'VERIFIED' | 'EXPIRED' = 'PENDING';
      if (isVerified) {
        status = 'VERIFIED';
      } else if (v && Date.now() > v.codeExpiresAt) {
        status = 'EXPIRED';
      }

      const isApproved = u.isApprovedByAdmin === true || (u.isEmailVerified === true && u.adminApprovalStatus !== 'REJECTED');
      const approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = u.adminApprovalStatus || (isApproved ? 'APPROVED' : 'PENDING');

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        avatar: u.avatar || u.kycData?.selfieUrl || '',
        cedulaNumber: u.cedulaNumber || u.kycData?.cedulaNumber || '',
        cedulaFrontUrl: u.kycData?.cedulaFrontUrl || '',
        selfieUrl: u.kycData?.selfieUrl || u.avatar || '',
        biometricScore: u.kycData?.biometricScore,
        biometricStatus: u.kycData?.biometricStatus || (u.isKycVerified ? 'VERIFIED' : 'PENDING'),
        isKycVerified: u.isKycVerified ?? !!u.kycData?.cedulaFrontUrl,
        adminApprovalStatus: approvalStatus,
        approvedAt: u.approvedAt,
        approvedBy: u.approvedBy,
        rejectedAt: u.rejectedAt,
        rejectedBy: u.rejectedBy,
        rejectionReason: u.rejectionReason,
        accountType: (isStore ? 'STORE' : 'CUSTOMER') as 'CUSTOMER' | 'STORE',
        storeName: store?.name || v?.storeName,
        storeId: u.storeId,
        registeredAt: u.createdAt,
        isEmailVerified: isVerified,
        verificationStatus: status,
        code: !isVerified && (v?.codeExpiresAt || 0)>Date.now() && (v?.attempts || 0)<5 ? v?.code : undefined,
        codeExpiresAt: v?.codeExpiresAt,
        attempts: v?.attempts || 0,
        resendCount: v?.resendCount || 0,
        lastSentAt: v?.lastSentAt || new Date(u.createdAt).getTime()
      };
    }).sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
  }

  public approveUserAccount(userIdOrEmail: string, adminEmail: string) {
    return this.runCommerceMutation(() => this.buildapproveUserAccount(userIdOrEmail,adminEmail));
  }

  private buildapproveUserAccount(userIdOrEmail: string, adminEmail: string): { success: boolean; message: string; user?: User } {
    const clean = userIdOrEmail.trim().toLowerCase();
    const user = this.memoryData.users.find(u => u.id === userIdOrEmail || u.email.toLowerCase() === clean);
    if (!user) return { success: false, message: 'Usuario no encontrado' };

    user.adminApprovalStatus = 'APPROVED';
    user.isApprovedByAdmin = true;
    user.isKycVerified = true;
    user.approvedAt = new Date().toISOString();
    user.approvedBy = adminEmail;
    user.rejectionReason = undefined;

    if (user.storeId) {
      const store = this.memoryData.stores.find(s => s.id === user.storeId);
      if (store && (store.status === 'PENDING' || store.status === 'IN_REVIEW')) {
        store.status = 'APPROVED';
        store.isPublished = user.isEmailVerified === true;
        store.isEmailVerified = user.isEmailVerified === true;
        store.isKycVerified = true;
      }
    }

    this.addAuditLog(
      'ADMIN_APPROVED_USER_ACCOUNT',
      user.id,
      user.email,
      `Super Admin (${adminEmail}) autorizó la cuenta y validó la cédula/identidad de ${user.name} (${user.email}).`,
      { id: 'super-admin', name: adminEmail, role: 'SUPER_ADMIN' }
    );
    this.commit();
    return { success: true, message: `Cuenta de ${user.name} autorizada y validada exitosamente.`, user };
  }

  public rejectUserAccount(userIdOrEmail: string, adminEmail: string, reason: string) {
    return this.runCommerceMutation(() => this.buildrejectUserAccount(userIdOrEmail,adminEmail,reason));
  }

  private buildrejectUserAccount(userIdOrEmail: string, adminEmail: string, reason: string): { success: boolean; message: string; user?: User } {
    const clean = userIdOrEmail.trim().toLowerCase();
    const user = this.memoryData.users.find(u => u.id === userIdOrEmail || u.email.toLowerCase() === clean);
    if (!user) return { success: false, message: 'Usuario no encontrado' };

    user.adminApprovalStatus = 'REJECTED';
    user.isApprovedByAdmin = false;
    user.rejectedAt = new Date().toISOString();
    user.rejectedBy = adminEmail;
    user.rejectionReason = reason || 'Documentación de identidad no válida o ilegible';

    if (user.storeId) {
      const store = this.memoryData.stores.find(s => s.id === user.storeId);
      if (store) {
        store.status = 'REJECTED';
        store.rejectionReason = user.rejectionReason;
      }
    }

    this.addAuditLog(
      'ADMIN_REJECTED_USER_ACCOUNT',
      user.id,
      user.email,
      `Super Admin (${adminEmail}) rechazó la documentación de ${user.name} (${user.email}). Motivo: ${user.rejectionReason}`,
      { id: 'super-admin', name: adminEmail, role: 'SUPER_ADMIN' }
    );
    this.commit();
    return { success: true, message: `Documentación de ${user.name} marcada como rechazada.`, user };
  }

  public createSuperAdmin(data: {name:string;email:string;phone:string;passwordHash:string;createdByAdmin:string}) {
    return this.runCommerceMutation(() => this.buildcreateSuperAdmin(data));
  }

  private buildcreateSuperAdmin(data: { name: string; email: string; phone: string; passwordHash: string; createdByAdmin: string }): { success: boolean; message: string; user?: User } {
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = this.memoryData.users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      if (existing.role === 'SUPER_ADMIN') {
        return { success: false, message: 'Ya existe un Super Administrador con este correo electrónico.' };
      }
      existing.role = 'SUPER_ADMIN';
      existing.passwordHash = data.passwordHash;
      existing.isEmailVerified = true;
      existing.isApprovedByAdmin = true;
      existing.adminApprovalStatus = 'APPROVED';
      this.commit();
      return { success: true, message: `El usuario existente ${cleanEmail} ha sido elevado a Super Administrador.`, user: existing };
    }

    const newAdmin: User = {
      id: `user-super-admin-${Date.now()}`,
      name: data.name.trim(),
      email: cleanEmail,
      role: 'SUPER_ADMIN',
      phone: data.phone.trim(),
      addresses: [],
      passwordHash: data.passwordHash,
      isEmailVerified: true,
      isApprovedByAdmin: true,
      adminApprovalStatus: 'APPROVED',
      isKycVerified: true,
      createdAt: new Date().toISOString()
    };

    this.memoryData.users.push(newAdmin);
    this.addAuditLog(
      'SUPER_ADMIN_CREATED',
      newAdmin.id,
      newAdmin.email,
      `Nuevo Super Administrador ${newAdmin.name} (${newAdmin.email}) creado por ${data.createdByAdmin}`,
      { id: 'super-admin', name: data.createdByAdmin, role: 'SUPER_ADMIN' }
    );
    return { success: true, message: `Super Administrador ${newAdmin.name} creado exitosamente.`, user: newAdmin };
  }

  public manualVerifyUser(email: string, adminEmail: string, reason?: string) {
    return this.runCommerceMutation(() => this.buildmanualVerifyUser(email,adminEmail,reason));
  }

  private buildmanualVerifyUser(email: string, adminEmail: string, reason?: string): { success: boolean; message: string; user?: User } {
    const clean = email.trim().toLowerCase();
    const user = this.memoryData.users.find(u => u.email.toLowerCase() === clean);
    if (!user) return { success: false, message: 'Usuario no encontrado' };

    user.isEmailVerified = true;
    if (user.verification) {
      user.verification.isVerified = true;
      user.verification.verifiedAt = new Date().toISOString();
    } else {
      user.verification = {
        code: 'MANUAL',
        codeExpiresAt: Date.now() + 86400000,
        attempts: 0,
        lastSentAt: Date.now(),
        isVerified: true,
        verifiedAt: new Date().toISOString(),
        resendCount: 0,
        accountType: user.role === 'STORE_OWNER' ? 'STORE' : 'CUSTOMER'
      };
    }

    this.addAuditLog(
      'ADMIN_MANUAL_VERIFICATION_APPROVED',
      user.id,
      'PENDING',
      'VERIFIED_BY_ADMIN',
      { id: 'super-admin', name: adminEmail, role: 'SUPER_ADMIN' }
    );
    this.commit();

    return {
      success: true,
      message: `Cuenta de ${user.name} (${user.email}) verificada manualmente con éxito.`,
      user
    };
  }

  public regenerateUserVerificationCode(email: string, adminEmail: string) {
    return this.runCommerceMutation(() => this.buildregenerateUserVerificationCode(email,adminEmail));
  }

  private buildregenerateUserVerificationCode(email: string, adminEmail: string): { 
    success: boolean; 
    message: string; 
    code?: string; 
    expiresAt?: number; 
    user?: User 
  } {
    const clean = email.trim().toLowerCase();
    const user = this.memoryData.users.find(u => u.email.toLowerCase() === clean);
    if (!user) return { success: false, message: 'Usuario no encontrado' };

    if(user.isEmailVerified || user.verification?.isVerified) return {success:false,message:'La cuenta ya fue verificada. No requiere otro código de registro.'};

    // Generate cryptographically secure 6-digit code
    const newCode = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    user.isEmailVerified = false;
    user.verification = {
      code: newCode,
      codeExpiresAt: expiresAt,
      attempts: 0,
      lastSentAt: Date.now(),
      isVerified: false,
      resendCount: (user.verification?.resendCount || 0) + 1,
      accountType: user.role === 'STORE_OWNER' ? 'STORE' : 'CUSTOMER',
      storeName: user.verification?.storeName
    };

    this.addAuditLog(
      'ADMIN_REGENERATE_VERIFICATION_CODE',
      user.id,
      user.email,
      `Nuevo código generado por Super Admin (${adminEmail}) (Vence en 15m)`,
      { id: 'super-admin', name: adminEmail, role: 'SUPER_ADMIN' }
    );
    this.commit();

    return {
      success: true,
      message: `Nuevo código generado para ${user.name}: ${newCode}`,
      code: newCode,
      expiresAt,
      user
    };
  }

  // --- AUDIT LOGS ---
  public getAuditLogs(): AuditLog[] {
    return this.memoryData.auditLogs;
  }

  public addAuditLog(action: string, record: string, prev?: string, next?: string, user?: { id: string; name: string; role: UserRole }): AuditLog {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: user?.id || 'system',
      userName: user?.name || 'Sistema PlazaDO',
      userRole: user?.role || 'SUPER_ADMIN',
      action,
      affectedRecord: record,
      previousValue: prev,
      newValue: next,
      ipAddress: '190.166.44.12',
      timestamp: new Date().toISOString()
    };
    this.memoryData.auditLogs.unshift(log);
    // Keep max 1000 audit logs
    if (this.memoryData.auditLogs.length > 1000) {
      this.memoryData.auditLogs = this.memoryData.auditLogs.slice(0, 1000);
    }

    if (!this.stagingCheckout) cloudSqlRepo.addAuditLog({
      userId: user?.id,
      userName: user?.name,
      userRole: user?.role,
      action,
      entityType: record ? record.split('-')[0] : 'SYSTEM',
      entityId: record,
      details: { previousValue: prev, newValue: next },
      ipAddress: '190.166.44.12',
    }).catch(err => console.error('[CloudSQL] Error syncing addAuditLog:', err));

    return log;
  }

  public deleteAuditLog(logId: string): boolean {
    const idx = this.memoryData.auditLogs.findIndex(l => l.id === logId);
    if (idx === -1) return false;
    this.memoryData.auditLogs.splice(idx, 1);
    this.commit();
    return true;
  }

  public clearAllAuditLogs(): void {
    this.memoryData.auditLogs = [];
    this.commit();
  }

  public purgeRecords(type: 'orders' | 'test_products' | 'disputes' | 'settlements' | 'audit_logs'): number {
    this.createManualBackup(`pre_purge_${type}`);
    let count = 0;
    if (type === 'orders') {
      count = this.memoryData.orders.length;
      this.memoryData.orders = [];
    } else if (type === 'test_products') {
      return this.cleanTestProducts();
    } else if (type === 'disputes') {
      count = this.memoryData.disputes.length;
      this.memoryData.disputes = [];
    } else if (type === 'settlements') {
      count = this.memoryData.settlements.length;
      this.memoryData.settlements = [];
    } else if (type === 'audit_logs') {
      count = this.memoryData.auditLogs.length;
      this.memoryData.auditLogs = [];
    }
    this.addAuditLog('PURGE_RECORDS', type, `${count}`, 'Registros purgados por Super Admin (respaldo previo guardado)');
    this.commit();
    return count;
  }
}

export const db = new GlobalDatabase();
