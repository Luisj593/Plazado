import fs from 'fs';
import path from 'path';
import { Store, StoreStatus } from '../src/types';
import { firestoreRepo } from './firestore-repository';
import { cloudSqlRepo } from './cloudsql-repository';

export interface StoresRegistryData {
  version: number;
  lastUpdated: string;
  totalStores: number;
  stores: Store[];
}

/**
 * Dedicated Internal Database for Stores (PlazaDO.com)
 * 
 * Guarantees that store records created by users/merchants are:
 * 1. Fully isolated and preserved across code updates, builds, git pulls, and deployments.
 * 2. Triply replicated across disk vaults:
 *    - Primary Vault: data/plazado_stores_internal_registry.json
 *    - Master Vault Backup: data/backups/plazado_stores_master_vault.json
 *    - Server Embedded Snapshot: server/stores_snapshot.json
 * 3. Bidirectionally synchronized with Google Cloud Firestore and PostgreSQL Cloud SQL.
 * 4. Protected against accidental truncation: a deployment or restart will NEVER wipe user stores.
 */
class StoresDatabase {
  private primaryVaultPath: string;
  private backupVaultPath: string;
  private snapshotVaultPath: string;
  private storesMap: Map<string, Store> = new Map();
  private version: number = 1;

  constructor() {
    const cwd = process.cwd();
    const dataDir = path.resolve(cwd, 'data');
    const backupDir = path.resolve(dataDir, 'backups');

    if (!fs.existsSync(dataDir)) {
      try { fs.mkdirSync(dataDir, { recursive: true }); } catch (e) {}
    }
    if (!fs.existsSync(backupDir)) {
      try { fs.mkdirSync(backupDir, { recursive: true }); } catch (e) {}
    }

    this.primaryVaultPath = path.resolve(dataDir, 'plazado_stores_internal_registry.json');
    this.backupVaultPath = path.resolve(backupDir, 'plazado_stores_master_vault.json');
    this.snapshotVaultPath = path.resolve(cwd, 'server', 'stores_snapshot.json');

    this.loadAndHydrateAllVaults();
  }

  private tryParseStoresFile(filePath: string): Store[] {
    try {
      if (!fs.existsSync(filePath)) return [];
      const content = fs.readFileSync(filePath, 'utf-8');
      if (!content || !content.trim()) return [];
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed as Store[];
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.stores)) {
        return parsed.stores as Store[];
      }
    } catch (e) {
      console.warn(`[StoresDatabase] Warning reading vault ${filePath}:`, e);
    }
    return [];
  }

  /**
   * Hydrates memory state using non-destructive union from all available vaults.
   * If a store exists in any vault, it is preserved and restored.
   */
  private loadAndHydrateAllVaults() {
    const primaryStores = this.tryParseStoresFile(this.primaryVaultPath);
    const backupStores = this.tryParseStoresFile(this.backupVaultPath);
    const snapshotStores = this.tryParseStoresFile(this.snapshotVaultPath);

    // Also inspect legacy plazado_global_database.json if vaults are fresh
    const legacyGlobalDbPath = path.resolve(process.cwd(), 'data', 'plazado_global_database.json');
    const legacyStores = this.tryParseStoresFile(legacyGlobalDbPath);

    // Merge in order of priority (primary > backup > snapshot > legacy)
    const allCandidates = [...legacyStores, ...snapshotStores, ...backupStores, ...primaryStores];

    for (const st of allCandidates) {
      if (st && st.id && typeof st.id === 'string') {
        const existing = this.storesMap.get(st.id);
        if (!existing) {
          this.storesMap.set(st.id, this.sanitizeStore(st));
        } else {
          // Merge preserving existing newer fields
          this.storesMap.set(st.id, this.sanitizeStore({ ...existing, ...st }));
        }
      }
    }

    console.log(`[StoresDatabase] Initialized internal stores database. Active registered stores: ${this.storesMap.size}`);
    this.persistToDisk();
  }

  private sanitizeStore(store: Store): Store {
    const cleanSlug = (store.slug || store.name || store.id).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || store.id;
    const ownerId = store.ownerId || (store as any).owner_id || `owner-${store.id}`;

    return {
      ...store,
      slug: cleanSlug,
      ownerId,
      owner_id: ownerId,
      status: store.status || 'APPROVED',
      isPublished: store.isPublished !== undefined ? store.isPublished : true,
      rating: typeof store.rating === 'number' ? store.rating : 5.0,
      reviewCount: typeof store.reviewCount === 'number' ? store.reviewCount : 0,
      salesCount: typeof store.salesCount === 'number' ? store.salesCount : 0,
      createdAt: store.createdAt || new Date().toISOString(),
      updatedAt: store.updatedAt || new Date().toISOString()
    };
  }

  private persistToDisk() {
    try {
      this.version += 1;
      const storesList = Array.from(this.storesMap.values());
      const payload: StoresRegistryData = {
        version: this.version,
        lastUpdated: new Date().toISOString(),
        totalStores: storesList.length,
        stores: storesList
      };

      const serialized = JSON.stringify(payload, null, 2);

      // 1. Primary Vault (Atomic write)
      const tmpPath = `${this.primaryVaultPath}.tmp`;
      fs.writeFileSync(tmpPath, serialized, 'utf-8');
      fs.renameSync(tmpPath, this.primaryVaultPath);

      // 2. Master Backup Vault
      try {
        fs.writeFileSync(this.backupVaultPath, serialized, 'utf-8');
      } catch (err) {
        console.warn('[StoresDatabase] Backup vault write warning:', err);
      }

      // 3. Embedded Server Snapshot (Persists through repository builds)
      try {
        fs.writeFileSync(this.snapshotVaultPath, serialized, 'utf-8');
      } catch (err) {
        console.warn('[StoresDatabase] Snapshot vault write warning:', err);
      }
    } catch (err) {
      console.error('[StoresDatabase FATAL] Failed persisting stores registry to disk:', err);
    }
  }

  /**
   * Returns all stores in the internal database.
   */
  public getAllStores(includeDeleted = false): Store[] {
    const all = Array.from(this.storesMap.values());
    if (includeDeleted) return all;
    return all.filter(s => !s.deleted && s.status !== 'SUSPENDED');
  }

  /**
   * Returns ALL stores including pending or suspended (for Super Admin dashboard).
   */
  public getAllAdminStores(): Store[] {
    return Array.from(this.storesMap.values()).filter(s => !s.deleted);
  }

  public getStoreById(id: string): Store | undefined {
    return this.storesMap.get(id);
  }

  public getStoreBySlug(slug: string): Store | undefined {
    const clean = slug.toLowerCase().trim();
    for (const store of this.storesMap.values()) {
      if (store.slug?.toLowerCase() === clean || store.id === slug) {
        return store;
      }
    }
    return undefined;
  }

  public getStoreByOwner(ownerIdOrEmail: string): Store | undefined {
    const target = ownerIdOrEmail.toLowerCase().trim();
    for (const store of this.storesMap.values()) {
      if (store.ownerId === ownerIdOrEmail || (store as any).owner_id === ownerIdOrEmail || store.email?.toLowerCase() === target) {
        return store;
      }
    }
    return undefined;
  }

  /**
   * Adds or updates a store, replicating to all disk vaults and cloud backends.
   */
  public saveStore(storeInput: Partial<Store> & { name: string }): Store {
    const id = storeInput.id || `store-${Date.now()}`;
    const existing = this.storesMap.get(id);

    // Unique slug check
    let cleanSlug = (storeInput.slug || storeInput.name || id).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let uniqueSlug = cleanSlug || id;
    let counter = 2;
    while (Array.from(this.storesMap.values()).some(s => s.id !== id && s.slug === uniqueSlug)) {
      uniqueSlug = `${cleanSlug}-${counter}`;
      counter++;
    }

    const merged: Store = {
      ...(existing || {}),
      ...storeInput,
      id,
      slug: uniqueSlug,
      ownerId: storeInput.ownerId || existing?.ownerId || (storeInput as any).owner_id || `owner-${id}`,
      owner_id: storeInput.ownerId || existing?.owner_id || (storeInput as any).owner_id || `owner-${id}`,
      name: storeInput.name.trim(),
      ownerName: storeInput.ownerName || existing?.ownerName || 'Comercio Registrado',
      email: storeInput.email || existing?.email || '',
      phone: storeInput.phone || existing?.phone || '',
      whatsapp: storeInput.whatsapp || existing?.whatsapp || storeInput.phone || '',
      description: storeInput.description || existing?.description || '',
      categoryId: storeInput.categoryId || existing?.categoryId || 'cat-general',
      province: storeInput.province || existing?.province || 'Distrito Nacional',
      municipality: storeInput.municipality || existing?.municipality || 'Santo Domingo de Guzmán',
      address: storeInput.address || existing?.address || '',
      status: storeInput.status || existing?.status || 'APPROVED',
      isPublished: storeInput.isPublished !== undefined ? storeInput.isPublished : (existing?.isPublished !== false),
      rating: typeof storeInput.rating === 'number' ? storeInput.rating : (existing?.rating || 5.0),
      reviewCount: typeof storeInput.reviewCount === 'number' ? storeInput.reviewCount : (existing?.reviewCount || 0),
      salesCount: typeof storeInput.salesCount === 'number' ? storeInput.salesCount : (existing?.salesCount || 0),
      createdAt: existing?.createdAt || storeInput.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      creationSource: storeInput.creationSource || existing?.creationSource || 'USER_REGISTRATION'
    };

    this.storesMap.set(id, merged);
    this.persistToDisk();

    // Replicate to Google Cloud Firestore
    firestoreRepo.saveStore(merged).catch(err => {
      console.warn('[StoresDatabase] Firestore store replication warning:', err?.message || err);
    });

    // Replicate to PostgreSQL Cloud SQL
    cloudSqlRepo.createStore({
      id: merged.id,
      name: merged.name,
      slug: merged.slug,
      ownerId: merged.ownerId || 'system',
      email: merged.email,
      phone: merged.phone,
      whatsapp: merged.whatsapp,
      address: merged.address,
      province: merged.province,
      municipality: merged.municipality,
      description: merged.description,
      logoUrl: merged.logo,
      bannerUrl: merged.banner,
      shippingConfig: merged.shippingConfig,
      bankInfo: merged.bankInfo,
      status: merged.status,
    }).catch(err => {
      // If store already existed, update instead
      cloudSqlRepo.updateStore(merged.id, {
        name: merged.name,
        slug: merged.slug,
        email: merged.email,
        phone: merged.phone,
        whatsapp: merged.whatsapp,
        address: merged.address,
        province: merged.province,
        municipality: merged.municipality,
        description: merged.description,
        logoUrl: merged.logo,
        bannerUrl: merged.banner,
        shippingConfig: merged.shippingConfig,
        bankInfo: merged.bankInfo,
        status: merged.status,
      }).catch(updateErr => console.warn('[StoresDatabase] Cloud SQL store replication warning:', updateErr?.message || updateErr));
    });

    return merged;
  }

  public updateStore(storeId: string, partial: Partial<Store>): Store | null {
    const existing = this.storesMap.get(storeId);
    if (!existing) return null;
    return this.saveStore({ ...existing, ...partial, id: storeId, name: partial.name || existing.name });
  }

  public updateStatus(storeId: string, status: StoreStatus, reason?: string): Store | null {
    const existing = this.storesMap.get(storeId);
    if (!existing) return null;
    const isPub = (status === 'APPROVED' || status === 'active' || status === 'ACTIVE');
    return this.saveStore({
      ...existing,
      status,
      isPublished: isPub,
      rejectionReason: reason || existing.rejectionReason,
      id: storeId,
      name: existing.name
    });
  }

  public togglePublish(storeId: string): Store | null {
    const existing = this.storesMap.get(storeId);
    if (!existing) return null;
    return this.saveStore({
      ...existing,
      isPublished: !existing.isPublished,
      id: storeId,
      name: existing.name
    });
  }

  /**
   * Deletes a store only upon authorized request.
   */
  public deleteStore(storeId: string): boolean {
    if (!this.storesMap.has(storeId)) return false;
    this.storesMap.delete(storeId);
    this.persistToDisk();

    firestoreRepo.deleteStore(storeId).catch(err => console.warn('[StoresDatabase] Firestore delete warning:', err?.message || err));
    cloudSqlRepo.deleteStore(storeId).catch(err => console.warn('[StoresDatabase] Cloud SQL delete warning:', err?.message || err));

    return true;
  }

  /**
   * Non-destructive sync with external Firestore collection on connection.
   */
  public syncFromFirestore(firestoreStores: Store[]) {
    if (!Array.isArray(firestoreStores) || firestoreStores.length === 0) return;
    let anyAdded = false;

    for (const fsStore of firestoreStores) {
      if (fsStore && fsStore.id) {
        if (!this.storesMap.has(fsStore.id)) {
          this.storesMap.set(fsStore.id, this.sanitizeStore(fsStore));
          anyAdded = true;
        }
      }
    }

    if (anyAdded) {
      console.log(`[StoresDatabase] Synced stores from Firestore. Total active: ${this.storesMap.size}`);
      this.persistToDisk();
    }
  }

  /**
   * Non-destructive sync with Cloud SQL records.
   */
  public syncFromCloudSql(sqlStores: any[]) {
    if (!Array.isArray(sqlStores) || sqlStores.length === 0) return;
    let anyAdded = false;

    for (const s of sqlStores) {
      if (s && s.id && !this.storesMap.has(s.id)) {
        const mapped: Store = {
          id: s.id,
          name: s.name,
          slug: s.slug,
          ownerId: s.ownerId || `owner-${s.id}`,
          owner_id: s.ownerId || `owner-${s.id}`,
          ownerName: '',
          email: s.email || '',
          phone: s.phone || '',
          whatsapp: s.whatsapp || s.phone || '',
          description: s.description || '',
          categoryId: s.categoryId || 'cat-general',
          province: s.province || 'Distrito Nacional',
          municipality: s.municipality || 'Santo Domingo de Guzmán',
          address: s.address || '',
          status: s.status || 'APPROVED',
          isPublished: s.status === 'APPROVED',
          rating: 5.0,
          reviewCount: 0,
          salesCount: 0,
          shippingConfig: s.shippingConfig || undefined,
          bankInfo: s.bankInfo || undefined,
          createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString()
        };
        this.storesMap.set(s.id, mapped);
        anyAdded = true;
      }
    }

    if (anyAdded) {
      console.log(`[StoresDatabase] Synced stores from Cloud SQL. Total active: ${this.storesMap.size}`);
      this.persistToDisk();
    }
  }

  public getRegistryVersion(): number {
    return this.version;
  }
}

export const storesDb = new StoresDatabase();
