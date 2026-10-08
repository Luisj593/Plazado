import { isStorePubliclyVisible, isProductPubliclyVisible } from '../src/types';
import { commerceChanges } from './commerce-changes';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { cert, getApps as getAdminApps, initializeApp as initializeAdminApp } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { 
  getFirestore, 
  collection as clientCollection, 
  getDocs as clientGetDocs, 
  doc as clientDoc, 
  getDoc as clientGetDoc, 
  setDoc as clientSetDoc, 
  updateDoc as clientUpdateDoc, 
  deleteDoc as clientDeleteDoc, 
  Firestore 
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
// Compatibility layer: every existing repository operation transparently uses
// Firebase Admin on Railway, while retaining the legacy client fallback locally.
const isAdminFirestore = (value: any) => !!value && typeof value.collection === 'function' && typeof value.doc === 'function';
const isAdminRef = (value: any) => !!value && typeof value.get === 'function' && (typeof value.set === 'function' || typeof value.doc === 'function');

const collection = (db: any, name: string): any =>
  isAdminFirestore(db) ? db.collection(name) : clientCollection(db, name);

const doc = (db: any, collectionName: string, id: string): any =>
  isAdminFirestore(db) ? db.doc(`${collectionName}/${id}`) : clientDoc(db, collectionName, id);

const getDocs = async (ref: any): Promise<any> =>
  isAdminRef(ref) ? ref.get() : clientGetDocs(ref);

const getDoc = async (ref: any): Promise<any> =>
  isAdminRef(ref) ? ref.get() : clientGetDoc(ref);

const setDoc = async (ref: any, data: any, options?: any): Promise<any> =>
  isAdminRef(ref) ? ref.set(data, options) : clientSetDoc(ref, data, options);

const updateDoc = async (ref: any, data: any): Promise<any> =>
  isAdminRef(ref) ? ref.update(data) : clientUpdateDoc(ref, data);

const deleteDoc = async (ref: any): Promise<any> =>
  isAdminRef(ref) ? ref.delete() : clientDeleteDoc(ref);

// Firestore rejects undefined values by default. Domain objects contain optional
// properties, so strip only undefined values before persistence without changing
// null/false/0/empty-string values.
const firestoreSafe = (value: any): any => {
  if (Array.isArray(value)) return value.map(firestoreSafe).filter(v => v !== undefined);
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, firestoreSafe(v)]));
  }
  return value;
};

import { 
  Store, 
  Product, 
  User, 
  Category, 
  Order, 
  Banner, 
  Coupon, 
  SystemSettings, 
  AuditLog, 
  StoreBalance, 
  Settlement, 
  Dispute, 
  Review, 
  PaymentGatewayConfig, 
  Advertisement, 
  AdPlacement, 
  PaymentTransaction, 
  FinancialAuditLog, 
  OrderChatMessage 
} from '../src/types';

export class FirestoreRepository {
  private db: Firestore | null = null;
  private isConfigured: boolean = false;
  private databaseId: string = '';
  private adminDb: any = null;

  constructor() {
    this.initFirebase();
  }

  private initFirebase() {
    try {
      // Production/Railway: prefer server-side Firebase Admin credentials.
      // This path is independent from AI Studio and bypasses client Firestore rules,
      // while IAM limits the service account to the permissions granted in Google Cloud.
      const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT;
      const envProjectId = process.env.FIREBASE_PROJECT_ID;
      const envDatabaseId = process.env.FIREBASE_DATABASE_ID;
      if (serviceAccountRaw && envProjectId && envDatabaseId) {
        const serviceAccount = JSON.parse(serviceAccountRaw);
        const adminApp = getAdminApps().length
          ? getAdminApps()[0]
          : initializeAdminApp({ credential: cert(serviceAccount), projectId: envProjectId });
        this.databaseId = envDatabaseId;
        this.adminDb = getAdminFirestore(adminApp, envDatabaseId);
        this.db = this.adminDb as any;
        this.isConfigured = true;
        console.log(`[FirestoreRepository] Initialized secure Firebase Admin connection to Firestore db: ${this.databaseId}`);
        return;
      }

      const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      if (!fs.existsSync(configPath)) {
        console.warn('[FirestoreRepository] firebase-applet-config.json not found.');
        return;
      }

      const configRaw = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(configRaw);

      this.databaseId = config.firestoreDatabaseId || '(default)';

      const app = getApps().length === 0
        ? initializeApp({
            apiKey: config.apiKey,
            authDomain: config.authDomain,
            projectId: config.projectId,
            appId: config.appId
          })
        : getApp();

      this.db = getFirestore(app, this.databaseId);
      this.isConfigured = true;
      console.log(`[FirestoreRepository] Initialized connection to Firestore db: ${this.databaseId}`);
    } catch (err) {
      console.error('[FirestoreRepository] Initialization error:', err);
    }
  }

  public getDb(): Firestore | null {
    return this.db;
  }

  public isReady(): boolean {
    return this.isConfigured && this.db !== null;
  }

  // --- READ ALL PRODUCTION COLLECTIONS ---
  public async loadFullState(): Promise<{
    stores: Store[];
    products: Product[];
    users: User[];
    categories: Category[];
    orders: Order[];
    banners: Banner[];
    coupons: Coupon[];
    systemSettings?: SystemSettings;
    auditLogs: AuditLog[];
    storeBalances: Record<string, StoreBalance>;
    settlements: Settlement[];
    disputes: Dispute[];
    reviews: Review[];
    paymentGateways: PaymentGatewayConfig[];
    advertisements: Advertisement[];
    adPlacements: AdPlacement[];
    orderMessages: OrderChatMessage[];
    commerceState: Record<string, any[]>;
  } | null> {
    if (!this.db) return null;

    try {
      console.log('[FirestoreRepository] Fetching live state from Firestore...');
      const [
        storesSnap,
        productsSnap,
        usersSnap,
        categoriesSnap,
        ordersSnap,
        bannersSnap,
        couponsSnap,
        settingsDoc,
        balancesSnap,
        settlementsSnap,
        disputesSnap,
        reviewsSnap,
        gatewaysSnap,
        adsSnap,
        placementsSnap,
        messagesSnap
      ] = await Promise.all([
        getDocs(collection(this.db, 'stores')).catch(e => { console.warn('stores read err:', e); return { docs: [] }; }),
        getDocs(collection(this.db, 'products')).catch(e => { console.warn('products read err:', e); return { docs: [] }; }),
        getDocs(collection(this.db, 'users')), // Critical: never treat a failed users read as an empty authoritative collection.
        getDocs(collection(this.db, 'categories')).catch(e => { console.warn('categories read err:', e); return { docs: [] }; }),
        getDocs(collection(this.db, 'orders')).catch(e => { console.warn('orders read err:', e); return { docs: [] }; }),
        getDocs(collection(this.db, 'banners')).catch(e => { console.warn('banners read err:', e); return { docs: [] }; }),
        getDocs(collection(this.db, 'coupons')).catch(e => { console.warn('coupons read err:', e); return { docs: [] }; }),
        getDoc(doc(this.db, 'systemSettings', 'default')).catch(e => { console.warn('settings read err:', e); return { exists: () => false, data: () => null }; }),
        getDocs(collection(this.db, 'storeBalances')).catch(e => { console.warn('balances read err:', e); return { docs: [] }; }),
        getDocs(collection(this.db, 'settlements')).catch(e => { console.warn('settlements read err:', e); return { docs: [] }; }),
        getDocs(collection(this.db, 'disputes')).catch(e => { console.warn('disputes read err:', e); return { docs: [] }; }),
        getDocs(collection(this.db, 'reviews')).catch(e => { console.warn('reviews read err:', e); return { docs: [] }; }),
        getDocs(collection(this.db, 'paymentGateways')).catch(e => { console.warn('gateways read err:', e); return { docs: [] }; }),
        getDocs(collection(this.db, 'advertisements')).catch(e => { console.warn('ads read err:', e); return { docs: [] }; }),
        getDocs(collection(this.db, 'adPlacements')).catch(e => { console.warn('placements read err:', e); return { docs: [] }; }),
        getDocs(collection(this.db, 'orderMessages')).catch(e => { console.warn('messages read err:', e); return { docs: [] }; })
      ]);

      const stores: Store[] = storesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Store));
      const products: Product[] = productsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Product));
      const users: User[] = usersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as User));
      const categories: Category[] = categoriesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Category));
      const orders: Order[] = ordersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Order));
      const banners: Banner[] = bannersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Banner));
      const coupons: Coupon[] = couponsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Coupon));
      const storeBalances: Record<string, StoreBalance> = {};
      balancesSnap.docs.forEach((d: any) => {
        storeBalances[d.id] = { storeId: d.id, ...d.data() } as StoreBalance;
      });
      const settlements: Settlement[] = settlementsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Settlement));
      const disputes: Dispute[] = disputesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Dispute));
      const reviews: Review[] = reviewsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Review));
      const paymentGateways: PaymentGatewayConfig[] = gatewaysSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as PaymentGatewayConfig));
      const advertisements: Advertisement[] = adsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Advertisement));
      const adPlacements: AdPlacement[] = placementsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as unknown as AdPlacement));
      const orderMessages: OrderChatMessage[] = messagesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() } as OrderChatMessage));

      const settingsExists = typeof settingsDoc.exists === 'function' ? settingsDoc.exists() : Boolean(settingsDoc.exists);
      const systemSettings = settingsExists ? (settingsDoc.data() as SystemSettings) : undefined;

      console.log(`[FirestoreRepository] Successfully loaded from Firestore: ${stores.length} stores, ${products.length} products, ${users.length} users, ${categories.length} categories.`);

      const commerceState: Record<string, any[]> = {};
      for (const key of ['paymentTransactions','financialAuditLogs','fulfillmentInventory','inventoryMovements','fulfillmentOrders']) {
        const snapshot = await getDocs(collection(this.db, key));
        commerceState[key] = snapshot.docs.map((d: any) => ({id:d.id,...d.data()}));
      }
      return {
        commerceState,
        stores,
        products,
        users,
        categories,
        orders,
        banners,
        coupons,
        systemSettings,
        auditLogs: [],
        storeBalances,
        settlements,
        disputes,
        reviews,
        paymentGateways,
        advertisements,
        adPlacements,
        orderMessages
      };
    } catch (err) {
      console.error('[FirestoreRepository] Error reading full state from Firestore:', err);
      return null;
    }
  }

  // Keep exactly five recoverable versions per production record:
  // 1 current backup + up to 4 historical backups. Oldest history is deleted automatically.
  private async rotateBackupVersion(type: 'store' | 'user', recordId: string, nextData: any): Promise<void> {
    if (!this.db) return;
    const currentCollection = type === 'store' ? 'stores_backup' : 'users_backup';
    const historyCollection = type === 'store' ? 'stores_backup_history' : 'users_backup_history';
    const currentRef = doc(this.db, currentCollection, recordId);
    const currentSnap = await getDoc(currentRef);
    const now = new Date().toISOString();

    const currentExists = typeof currentSnap.exists === 'function' ? currentSnap.exists() : Boolean(currentSnap.exists);
    if (currentExists) {
      const previous = currentSnap.data() as any;
      // The protection job runs every five minutes. Do not consume the five-version
      // history when the production record itself has not changed.
      const normalizeForComparison = (value: any) => {
        const copy = { ...(value || {}) };
        delete copy.backupUpdatedAt;
        delete copy.backupCreatedAt;
        delete copy.recoveredAt;
        delete copy.originalRecordId;
        return copy;
      };
      const previousComparable = JSON.stringify(normalizeForComparison(previous));
      const nextComparable = JSON.stringify(normalizeForComparison(nextData));
      if (previousComparable === nextComparable) return;

      const versionTime = previous.backupUpdatedAt || previous.updatedAt || now;
      const historyId = `${recordId}__${Date.now()}__${crypto.randomUUID()}`;
      await setDoc(doc(this.db, historyCollection, historyId), {
        ...previous,
        originalRecordId: recordId,
        backupCreatedAt: versionTime
      });

      const historySnap = await getDocs(collection(this.db, historyCollection));
      const versions = historySnap.docs
        .filter((d: any) => (d.data() as any).originalRecordId === recordId)
        .sort((a: any, b: any) => String((b.data() as any).backupCreatedAt || '').localeCompare(String((a.data() as any).backupCreatedAt || '')));

      // Current backup + four history versions = five total copies.
      for (const oldVersion of versions.slice(4)) {
        await deleteDoc(oldVersion.ref);
      }
    }

    await setDoc(currentRef, {
      ...firestoreSafe(nextData),
      backupUpdatedAt: now
    }, { merge: false });
  }

  // --- AUTOMATIC PRODUCTION BACKUP / RECOVERY ---
  // Durable safety copies live in separate Firestore collections and are never used
  // to replace valid live records. Missing live stores/users are restored by ID only.
  public async backupAndRecoverProductionRecords(): Promise<{ backedUpStores: number; backedUpUsers: number; restoredStores: number; restoredUsers: number }> {
    const result = { backedUpStores: 0, backedUpUsers: 0, restoredStores: 0, restoredUsers: 0 };
    if (!this.db) return result;

    try {
      const [storesSnap, usersSnap, storesBackupSnap, usersBackupSnap] = await Promise.all([
        getDocs(collection(this.db, 'stores')),
        getDocs(collection(this.db, 'users')),
        getDocs(collection(this.db, 'stores_backup')),
        getDocs(collection(this.db, 'users_backup'))
      ]);

      const liveStoreIds = new Set(storesSnap.docs.map((d: any) => d.id));
      const liveUserIds = new Set(usersSnap.docs.map((d: any) => d.id));
      const now = new Date().toISOString();

      // Never restore missing production records automatically. A missing live
      // record may have been intentionally deleted. Backups are recovery material
      // only and restoration requires an explicit, audited admin action.

      // Then refresh backups from every currently valid live record.
      for (const liveDoc of storesSnap.docs) {
        await this.rotateBackupVersion('store', liveDoc.id, liveDoc.data());
        result.backedUpStores++;
      }
      for (const liveDoc of usersSnap.docs) {
        await this.rotateBackupVersion('user', liveDoc.id, liveDoc.data());
        result.backedUpUsers++;
      }

      console.log('[FirestoreRepository] Production protection cycle completed:', result);
    } catch (e) {
      console.error('[FirestoreRepository] Production backup/recovery cycle failed:', e);
    }
    return result;
  }

  // --- MUTATIONS: ATOMIC WRITES TO FIRESTORE WITH TRAZABILIDAD ---

  public async saveStoreRegistrationAtomic(user: User, store: Store): Promise<void> {
    if (!this.db || !user.id || !store.id) throw new Error('Firestore no está configurado para registrar tienda');
    const safeUser = firestoreSafe({ ...user, updatedAt: new Date().toISOString() });
    const safeStore = firestoreSafe({ ...store, ownerId: user.id, owner_id: user.id, updatedAt: new Date().toISOString() });

    if (this.adminDb) {
      await this.adminDb.runTransaction(async (tx: any) => {
        tx.set(this.adminDb.doc(`users/${user.id}`), safeUser, { merge: true });
        tx.set(this.adminDb.doc(`stores/${store.id}`), safeStore, { merge: true });
      });
    } else {
      // Local/client fallback. Production Railway always uses Admin SDK.
      await setDoc(doc(this.db, 'users', user.id), safeUser, { merge: true });
      try {
        await setDoc(doc(this.db, 'stores', store.id), safeStore, { merge: true });
      } catch (e) {
        // Compensate only the user created by this registration attempt.
        await deleteDoc(doc(this.db, 'users', user.id)).catch(() => undefined);
        throw e;
      }
    }
  }

  public async saveStore(store: Store): Promise<void> {
    if (!this.db || !store.id) throw new Error('Firestore no está configurado para guardar tienda');
    try {
      const ref = doc(this.db, 'stores', store.id);
      const protectedStore = {
        ...store,
        updatedAt: new Date().toISOString()
      };
      await setDoc(ref, firestoreSafe(protectedStore), { merge: true });
      await this.rotateBackupVersion('store', store.id, protectedStore);
    } catch (e) {
      console.error(`[FirestoreRepository] Error saving store ${store.id}:`, e);
      throw e;
    }
  }

  public async saveProduct(product: Product): Promise<void> {
    if (!this.db || !product.id) throw new Error('Firestore no está configurado para guardar producto');
    try {
      const ref = doc(this.db, 'products', product.id);
      await setDoc(ref, firestoreSafe({
        ...product,
        promoPrice: product.promoPrice ?? null,
        updatedAt: new Date().toISOString()
      }), { merge: true });
    } catch (e) {
      console.error(`[FirestoreRepository] Error saving product ${product.id}:`, e);
      throw e;
    }
  }

  public async softDeleteProduct(productId: string, updatedBy?: string): Promise<void> {
    if (!this.db) return;
    try {
      const ref = doc(this.db, 'products', productId);
      await updateDoc(ref, {
        status: 'inactive',
        deleted: true,
        deletedAt: new Date().toISOString(),
        updatedBy: updatedBy || 'system',
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error(`[FirestoreRepository] Error soft-deleting product ${productId}:`, e);
    }
  }

  public async softDeleteStore(storeId: string, updatedBy?: string): Promise<void> {
    if (!this.db) return;
    try {
      const ref = doc(this.db, 'stores', storeId);
      await updateDoc(ref, {
        status: 'SUSPENDED',
        isPublished: false,
        deleted: true,
        deletedAt: new Date().toISOString(),
        updatedBy: updatedBy || 'admin',
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error(`[FirestoreRepository] Error soft-deleting store ${storeId}:`, e);
    }
  }

  public async saveUser(user: User): Promise<void> {
    if (!this.db || !user.id) throw new Error('Firestore no está configurado para guardar usuario');
    try {
      const ref = doc(this.db, 'users', user.id);
      const protectedUser = {
        ...user,
        updatedAt: new Date().toISOString()
      };
      await setDoc(ref, firestoreSafe(protectedUser), { merge: true });
      await this.rotateBackupVersion('user', user.id, protectedUser);
    } catch (e) {
      console.error(`[FirestoreRepository] Error saving user ${user.id}:`, e);
      throw e;
    }
  }

  public async persistCheckout(previous: any, next: any): Promise<void> {
    if (!this.adminDb) throw new Error('Firebase Admin debe estar configurado para confirmar compras');
    const changes = commerceChanges(previous, next);
    if (changes.length > 450) throw new Error('Compra demasiado grande para confirmar de forma atómica');
    await this.adminDb.runTransaction(async (transaction: any) => {
      const documents = await Promise.all(changes.map(change => transaction.get(this.adminDb.doc(`${change.collection}/${change.id}`))));
      const storeIds = [...new Set(changes.filter(change => change.collection === 'orders').map(change => change.after.storeId))];
      const storeDocs = await Promise.all(storeIds.map(id => transaction.get(this.adminDb.doc(`stores/${id}`))));
      const settingsDoc = await transaction.get(this.adminDb.doc('systemSettings/default'));
      if (settingsDoc.exists && (settingsDoc.data().plazaCommissionRate ?? 0.0005) !== (previous.systemSettings.plazaCommissionRate ?? 0.0005)) throw new Error('La comisión cambió. Actualiza el carrito.');
      for (const document of storeDocs) if (!document.exists || !isStorePubliclyVisible(document.data())) throw new Error('Tienda no disponible');
      for (let i = 0; i < changes.length; i++) {
        const change = changes[i], document = documents[i];
        const current = document.exists ? document.data() : null;
        if (!change.before && current) throw new Error('Compra ya registrada. Actualiza el carrito antes de reintentar.');
        if (change.collection === 'products') {
          if (!current || !isProductPubliclyVisible(current) || current.stock !== change.before.stock || current.price !== change.before.price || (current.promoPrice ?? null) !== (change.before.promoPrice ?? null)) throw new Error('El inventario o precio cambió. Actualiza el carrito.');
        }
        if (change.collection === 'storeBalances' && current) {
          for (const key of ['totalSales','cashSales','cardSales','pendingCashCommissions','pendingBalance','availableBalance']) {
            if ((current[key] || 0) !== (change.before?.[key] || 0)) throw new Error('El balance cambió. Actualiza e intenta nuevamente.');
          }
        }
        if (change.collection === 'fulfillmentInventory' && (!current || current.available !== change.before.available || current.reserved !== change.before.reserved)) throw new Error('El inventario del almacén cambió');
      }
      for (const change of changes) {
        const ref = this.adminDb.doc(`${change.collection}/${change.id}`);
        if (change.collection === 'products') transaction.update(ref, {stock:change.after.stock,soldCount:change.after.soldCount});
        else transaction.set(ref, firestoreSafe(change.after), {merge:true});
      }
    });
  }

  public async saveOrder(order: Order): Promise<void> {
    if (!this.db || !order.id) return;
    try {
      const ref = doc(this.db, 'orders', order.id);
      await setDoc(ref, {
        ...order,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.error(`[FirestoreRepository] Error saving order ${order.id}:`, e);
    }
  }

  public async saveCategory(category: Category): Promise<void> {
    if (!this.db || !category.id) return;
    try {
      const ref = doc(this.db, 'categories', category.id);
      await setDoc(ref, category, { merge: true });
    } catch (e) {
      console.error(`[FirestoreRepository] Error saving category ${category.id}:`, e);
    }
  }

  public async saveSystemSettings(settings: SystemSettings): Promise<void> {
    if (!this.db) throw new Error('Firestore no está configurado para guardar parámetros');
    try {
      const ref = doc(this.db, 'systemSettings', 'default');
      await setDoc(ref, firestoreSafe({
        ...settings,
        updatedAt: new Date().toISOString()
      }), { merge: true });
    } catch (e) {
      console.error('[FirestoreRepository] Error saving systemSettings:', e);
      throw e;
    }
  }

  public async saveBanner(banner: Banner): Promise<void> {
    if (!this.db || !banner.id) return;
    try {
      const ref = doc(this.db, 'banners', banner.id);
      await setDoc(ref, banner, { merge: true });
    } catch (e) {
      console.error(`[FirestoreRepository] Error saving banner ${banner.id}:`, e);
    }
  }

  public async deleteBanner(bannerId: string): Promise<void> {
    if (!this.db) return;
    try {
      await deleteDoc(doc(this.db, 'banners', bannerId));
    } catch (e) {
      console.error(`[FirestoreRepository] Error deleting banner ${bannerId}:`, e);
    }
  }

  public async saveStoreBalance(storeId: string, balance: StoreBalance): Promise<void> {
    if (!this.db || !storeId) return;
    try {
      const ref = doc(this.db, 'storeBalances', storeId);
      await setDoc(ref, balance, { merge: true });
    } catch (e) {
      console.error(`[FirestoreRepository] Error saving store balance ${storeId}:`, e);
    }
  }

  public async saveSettlement(settlement: Settlement): Promise<void> {
    if (!this.db || !settlement.id) return;
    try {
      const ref = doc(this.db, 'settlements', settlement.id);
      await setDoc(ref, settlement, { merge: true });
    } catch (e) {
      console.error(`[FirestoreRepository] Error saving settlement ${settlement.id}:`, e);
    }
  }

  public async saveDispute(dispute: Dispute): Promise<void> {
    if (!this.db || !dispute.id) return;
    try {
      const ref = doc(this.db, 'disputes', dispute.id);
      await setDoc(ref, dispute, { merge: true });
    } catch (e) {
      console.error(`[FirestoreRepository] Error saving dispute ${dispute.id}:`, e);
    }
  }

  public async saveAuditLog(log: AuditLog): Promise<void> {
    if (!this.db || !log.id) return;
    try {
      const ref = doc(this.db, 'auditLogs', log.id);
      await setDoc(ref, log);
    } catch (e) {
      console.error(`[FirestoreRepository] Error saving audit log ${log.id}:`, e);
    }
  }

  public async savePaymentGateway(gw: PaymentGatewayConfig): Promise<void> {
    if (!this.db || !gw.id) return;
    try {
      const ref = doc(this.db, 'paymentGateways', gw.id);
      await setDoc(ref, gw, { merge: true });
    } catch (e) {
      console.error(`[FirestoreRepository] Error saving payment gateway ${gw.id}:`, e);
    }
  }

  public async saveAdvertisement(ad: Advertisement): Promise<void> {
    if (!this.db || !ad.id) return;
    try {
      const ref = doc(this.db, 'advertisements', ad.id);
      await setDoc(ref, ad, { merge: true });
    } catch (e) {
      console.error(`[FirestoreRepository] Error saving advertisement ${ad.id}:`, e);
    }
  }

  public async saveOrderMessage(msg: OrderChatMessage): Promise<void> {
    if (!this.db || !msg.id) return;
    try {
      const ref = doc(this.db, 'orderMessages', msg.id);
      await setDoc(ref, msg);
    } catch (e) {
      console.error(`[FirestoreRepository] Error saving order message ${msg.id}:`, e);
    }
  }

  public async saveReview(review: Review): Promise<void> {
    if (!this.db || !review.id) return;
    try {
      const ref = doc(this.db, 'reviews', review.id);
      await setDoc(ref, review, { merge: true });
    } catch (e) {
      console.error(`[FirestoreRepository] Error saving review ${review.id}:`, e);
    }
  }

  public async deleteReview(reviewId: string): Promise<void> {
    if (!this.db) return;
    try {
      await deleteDoc(doc(this.db, 'reviews', reviewId));
    } catch (e) {
      console.error(`[FirestoreRepository] Error deleting review ${reviewId}:`, e);
    }
  }

  /**
   * Read-only production integrity diagnostic. It never creates, updates or deletes
   * Firestore documents and returns only counts/IDs required to diagnose persistence.
   */
  public async getIntegrityDiagnostic(memoryState?: { users?: User[]; stores?: Store[]; products?: Product[]; orders?: Order[] }): Promise<any> {
    if (!this.db) throw new Error('Firestore no está configurado');
    const names = ['users', 'stores', 'products', 'orders', 'stores_backup', 'users_backup', 'stores_backup_history', 'users_backup_history'] as const;
    // Read each collection independently. Optional backup collections may not exist yet
    // or may have stricter rules; that must not prevent the core production diagnostic.
    const byName: Record<string, any> = {};
    const collectionErrors: Record<string, string> = {};
    await Promise.all(names.map(async name => {
      try {
        if (this.adminDb) {
          const snap = await this.adminDb.collection(name).get();
          byName[name] = { docs: snap.docs, size: snap.size };
        } else {
          byName[name] = await getDocs(collection(this.db!, name));
        }
      } catch (err: any) {
        collectionErrors[name] = err?.code || err?.message || 'READ_ERROR';
        byName[name] = { docs: [], size: 0 };
      }
    }));
    const coreNames = ['users', 'stores', 'products', 'orders'];
    const unavailableCoreCollections = coreNames.filter(name => collectionErrors[name]);

    const users = byName.users.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const stores = byName.stores.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const products = byName.products.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const orders = byName.orders.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const userIds = new Set(users.map((u: any) => u.id));
    const storeIds = new Set(stores.map((s: any) => s.id));
    const storeOwnerIds = new Set(stores.map((s: any) => s.ownerId || s.owner_id).filter(Boolean));

    const storeWithoutOwner = stores
      .filter((s: any) => (s.ownerId || s.owner_id) && !userIds.has(s.ownerId || s.owner_id))
      .map((s: any) => s.id);
    const storeUsersWithoutStore = users
      .filter((u: any) => u.role === 'STORE_OWNER' && u.storeId && !storeIds.has(u.storeId))
      .map((u: any) => u.id);
    const productsWithoutStore = products.filter((p: any) => p.storeId && !storeIds.has(p.storeId)).map((p: any) => p.id);
    const ordersWithoutStore = orders.filter((o: any) => o.storeId && !storeIds.has(o.storeId)).map((o: any) => o.id);
    const ordersWithoutCustomer = orders.filter((o: any) => o.customerId && !userIds.has(o.customerId)).map((o: any) => o.id);

    const emailCounts: Map<string, number> = users.reduce((m: Map<string, number>, u: any) => {
      const key = String(u.email || '').trim().toLowerCase();
      if (key) m.set(key, (m.get(key) || 0) + 1);
      return m;
    }, new Map<string, number>());
    const duplicateEmails = Array.from(emailCounts.entries()).filter(([, count]) => count > 1).map(([email]) => email);

    const memoryCounts = memoryState ? {
      users: memoryState.users?.length || 0,
      stores: memoryState.stores?.length || 0,
      products: memoryState.products?.length || 0,
      orders: memoryState.orders?.length || 0
    } : undefined;
    const firestoreCounts = { users: users.length, stores: stores.length, products: products.length, orders: orders.length };

    return {
      mode: 'READ_ONLY',
      databaseId: this.databaseId,
      checkedAt: new Date().toISOString(),
      firestoreCounts,
      memoryCounts,
      countDifferences: memoryCounts ? {
        users: memoryCounts.users - firestoreCounts.users,
        stores: memoryCounts.stores - firestoreCounts.stores,
        products: memoryCounts.products - firestoreCounts.products,
        orders: memoryCounts.orders - firestoreCounts.orders
      } : undefined,
      backups: {
        storesCurrent: byName.stores_backup.size,
        usersCurrent: byName.users_backup.size,
        storesHistory: byName.stores_backup_history.size,
        usersHistory: byName.users_backup_history.size
      },
      collectionErrors,
      unavailableCoreCollections,
      integrity: {
        duplicateUserEmails: duplicateEmails,
        storesWithoutExistingOwner: storeWithoutOwner,
        storeOwnersWithoutExistingStore: storeUsersWithoutStore,
        productsWithoutExistingStore: productsWithoutStore,
        ordersWithoutExistingStore: ordersWithoutStore,
        ordersWithoutExistingCustomer: ordersWithoutCustomer
      },
      healthy: unavailableCoreCollections.length === 0 && duplicateEmails.length === 0 && storeWithoutOwner.length === 0 && storeUsersWithoutStore.length === 0 &&
        productsWithoutStore.length === 0 && ordersWithoutStore.length === 0 && ordersWithoutCustomer.length === 0
    };
  }

  public async deleteStore(storeId: string): Promise<void> {
    if (!this.db) return;
    try {
      await deleteDoc(doc(this.db, 'stores', storeId));
    } catch (e) {
      console.error(`[FirestoreRepository] Error deleting store ${storeId}:`, e);
    }
  }

  public async deleteProduct(productId: string): Promise<void> {
    if (!this.db) return;
    try {
      await deleteDoc(doc(this.db, 'products', productId));
    } catch (e) {
      console.error(`[FirestoreRepository] Error deleting product ${productId}:`, e);
    }
  }

  public async deleteUser(userId: string): Promise<void> {
    if (!this.db) return;
    try {
      await deleteDoc(doc(this.db, 'users', userId));
    } catch (e) {
      console.error(`[FirestoreRepository] Error deleting user ${userId}:`, e);
    }
  }

  public async deleteOrder(orderId: string): Promise<void> {
    if (!this.db) return;
    try {
      await deleteDoc(doc(this.db, 'orders', orderId));
    } catch (e) {
      console.error(`[FirestoreRepository] Error deleting order ${orderId}:`, e);
    }
  }

  public async deleteCategory(categoryId: string): Promise<void> {
    if (!this.db) return;
    try {
      await deleteDoc(doc(this.db, 'categories', categoryId));
    } catch (e) {
      console.error(`[FirestoreRepository] Error deleting category ${categoryId}:`, e);
    }
  }

  public async deleteDispute(disputeId: string): Promise<void> {
    if (!this.db) return;
    try {
      await deleteDoc(doc(this.db, 'disputes', disputeId));
    } catch (e) {
      console.error(`[FirestoreRepository] Error deleting dispute ${disputeId}:`, e);
    }
  }

  public async deleteSettlement(settlementId: string): Promise<void> {
    if (!this.db) return;
    try {
      await deleteDoc(doc(this.db, 'settlements', settlementId));
    } catch (e) {
      console.error(`[FirestoreRepository] Error deleting settlement ${settlementId}:`, e);
    }
  }

  public async deletePaymentGateway(gatewayId: string): Promise<void> {
    if (!this.db) return;
    try {
      await deleteDoc(doc(this.db, 'paymentGateways', gatewayId));
    } catch (e) {
      console.error(`[FirestoreRepository] Error deleting payment gateway ${gatewayId}:`, e);
    }
  }

  public async deleteAdvertisement(adId: string): Promise<void> {
    if (!this.db) return;
    try {
      await deleteDoc(doc(this.db, 'advertisements', adId));
    } catch (e) {
      console.error(`[FirestoreRepository] Error deleting advertisement ${adId}:`, e);
    }
  }
}

export const firestoreRepo = new FirestoreRepository();
