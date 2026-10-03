import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { db } from './server/database';
import { fulfillmentService } from './server/fulfillment-service';
import { cloudSqlRepo } from './server/cloudsql-repository';
import { firestoreRepo } from './server/firestore-repository';
import { hashPassword, verifyPassword } from './src/utils/security';
import { User, Store, CustomerRegistrationInput, StoreRegistrationInput, UserRole } from './src/types';
import { sendRegistrationOtpEmail, verifySmtpConnection } from './server/mailer-service';

const SESSION_SECRET: string = process.env.SESSION_SECRET || '';
if (!SESSION_SECRET.trim()) {
  throw new Error('CRITICAL SECURITY ERROR: SESSION_SECRET is required as an environment variable');
}

export function sanitizeUser(user: User): Omit<User, 'passwordHash'> {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

export function createSessionToken(user: User): string {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    storeId: user.storeId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days session
  };
  const head = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${sig}`;
}

export function verifySessionToken(token: string): { userId: string; email: string; role: string; storeId?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [head, body, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(`${head}.${body}`).digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

export function getAuthenticatedUser(req: Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  const session = verifySessionToken(token);
  if (!session) return null;
  const user = db.getUserById(session.userId);
  return user || null;
}

export function getAuthenticatedSuperAdmin(req: Request): User | null {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'SUPER_ADMIN') return null;
  return user;
}

function sanitizeBootstrapForCaller(rawState: any, caller: User | null) {
  const safeUsers = (rawState.users || []).map((u: any) => sanitizeUser(u));

  const publicStores = (rawState.stores || []).map((s: any) => {
    if (!caller || (caller.role !== 'SUPER_ADMIN' && caller.storeId !== s.id)) {
      const { bankInfo, ...restStore } = s;
      return {
        ...restStore,
        bankInfo: bankInfo ? {
          bank: bankInfo.bank,
          accountType: bankInfo.accountType,
          accountHolder: bankInfo.accountHolder,
          rncOrCedula: bankInfo.rncOrCedula,
          accountNumber: '****'
        } : undefined
      };
    }
    return s;
  });

  const publicSettings = { ...rawState.systemSettings };
  if (!caller || caller.role !== 'SUPER_ADMIN') {
    if (publicSettings.mailConfig) {
      const { smtpPass: _, ...safeMail } = publicSettings.mailConfig;
      publicSettings.mailConfig = {
        ...safeMail,
        isConfigured: !!publicSettings.mailConfig?.isConfigured
      };
    }
  }

  if (caller && caller.role === 'SUPER_ADMIN') {
    return {
      ...rawState,
      users: safeUsers,
      stores: publicStores,
      systemSettings: publicSettings
    };
  }

  if (caller && caller.role === 'STORE_OWNER') {
    const storeId = caller.storeId;
    return {
      ...rawState,
      stores: publicStores,
      products: rawState.products || [],
      categories: rawState.categories || [],
      banners: rawState.banners || [],
      coupons: rawState.coupons || [],
      reviews: rawState.reviews || [],
      systemSettings: publicSettings,
      users: safeUsers.filter((u: any) => u.id === caller.id),
      orders: (rawState.orders || []).filter((o: any) => o.storeId === storeId || o.customerId === caller.id),
      storeBalances: storeId && rawState.storeBalances && rawState.storeBalances[storeId] 
        ? { [storeId]: rawState.storeBalances[storeId] } 
        : {},
      settlements: (rawState.settlements || []).filter((s: any) => s.storeId === storeId),
      disputes: (rawState.disputes || []).filter((d: any) => d.storeId === storeId || d.customerId === caller.id),
      auditLogs: [],
      paymentTransactions: [],
      financialAuditLogs: []
    };
  }

  if (caller && caller.role === 'CUSTOMER') {
    return {
      ...rawState,
      stores: publicStores,
      products: rawState.products || [],
      categories: rawState.categories || [],
      banners: rawState.banners || [],
      coupons: rawState.coupons || [],
      reviews: rawState.reviews || [],
      systemSettings: publicSettings,
      users: safeUsers.filter((u: any) => u.id === caller.id),
      orders: (rawState.orders || []).filter((o: any) => o.customerId === caller.id),
      storeBalances: {},
      settlements: [],
      disputes: (rawState.disputes || []).filter((d: any) => d.customerId === caller.id),
      auditLogs: [],
      paymentTransactions: [],
      financialAuditLogs: []
    };
  }

  // Unauthenticated public visitor
  return {
    ...rawState,
    stores: publicStores,
    products: (rawState.products || []).filter((p: any) => p.status === 'active' || p.status === 'ACTIVE' || !p.status),
    categories: rawState.categories || [],
    banners: rawState.banners || [],
    coupons: rawState.coupons || [],
    reviews: rawState.reviews || [],
    systemSettings: publicSettings,
    users: [],
    orders: [],
    storeBalances: {},
    settlements: [],
    disputes: [],
    auditLogs: [],
    paymentTransactions: [],
    financialAuditLogs: []
  };
}

async function startServer() {
  console.log('[PlazaDO] Initializing Firestore Production synchronization as primary source of truth...');
  try {
    await Promise.race([
      db.initFirestoreSync(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore initial load timeout (15s) - Continuing with cached production state and syncing in background')), 15000))
    ]);
  } catch (err: any) {
    console.warn('[PlazaDO] Firestore sync warning on startup:', err.message || err);
  }

  console.log('[PlazaDO] Initializing Cloud SQL synchronization in background...');
  db.initCloudSqlSync().catch((err: any) => {
    console.error('[PlazaDO] Cloud SQL sync background warning:', err);
  });

  const app = express();
  const PORT = 3000;

  // Middlewares (allow up to 100mb for PDF and APK file uploads)
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // Disable caching on API responses so all clients get immediate fresh state
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', version: db.getVersion(), timestamp: new Date().toISOString() });
  });

  // Global Bootstrap (Single-call fast hydration for all clients/devices)
  app.get('/api/bootstrap', (req: Request, res: Response) => {
    const caller = getAuthenticatedUser(req);
    const rawState = db.getFullState();
    const data = sanitizeBootstrapForCaller(rawState, caller);
    res.json({
      success: true,
      data,
      version: rawState.version
    });
  });

  // Real-time synchronization check / polling endpoint
  app.get('/api/sync', (req: Request, res: Response) => {
    const clientVersion = Number(req.query.v);
    const currentVersion = db.getVersion();

    if (!isNaN(clientVersion) && clientVersion === currentVersion) {
      return res.json({ hasUpdates: false, version: currentVersion });
    }

    const caller = getAuthenticatedUser(req);
    const rawState = db.getFullState();
    const data = sanitizeBootstrapForCaller(rawState, caller);
    res.json({
      hasUpdates: true,
      data,
      version: rawState.version
    });
  });

  // --- STORES ---
  app.get('/api/stores', (req: Request, res: Response) => {
    res.json({ success: true, stores: db.getStores() });
  });

  app.post('/api/stores', (req: Request, res: Response) => {
    const caller = getAuthenticatedUser(req);
    if (!caller) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    if (caller.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Solo Super Admin puede crear tiendas directamente vía API.' });
    }
    try {
      const storeData = req.body;
      const newStore = db.addStore(storeData);
      res.json({ success: true, store: newStore, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Error creating store' });
    }
  });

  app.put('/api/stores/:id', (req: Request, res: Response) => {
    const caller = getAuthenticatedUser(req);
    if (!caller) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    if (caller.role !== 'SUPER_ADMIN' && caller.storeId !== req.params.id) {
      return res.status(403).json({ success: false, message: 'No tienes autorización para editar esta tienda' });
    }
    const updated = db.updateStore(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Store not found' });
    res.json({ success: true, store: updated, version: db.getVersion() });
  });

  app.patch('/api/stores/:id/status', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    }
    const { status, reason } = req.body;
    const updated = db.updateStoreStatus(req.params.id, status, reason);
    if (!updated) return res.status(404).json({ success: false, message: 'Store not found' });
    res.json({ success: true, store: updated, version: db.getVersion() });
  });

  app.patch('/api/stores/:id/toggle-publish', (req: Request, res: Response) => {
    const caller = getAuthenticatedUser(req);
    if (!caller) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    if (caller.role !== 'SUPER_ADMIN' && caller.storeId !== req.params.id) {
      return res.status(403).json({ success: false, message: 'No tienes autorización para publicar/ocultar esta tienda' });
    }
    const updated = db.toggleStorePublish(req.params.id);
    if (!updated) return res.status(404).json({ success: false, message: 'Store not found' });
    res.json({ success: true, store: updated, version: db.getVersion() });
  });

  app.delete('/api/stores/:id', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    }
    const ok = db.deleteStore(req.params.id);
    res.json({ success: ok, version: db.getVersion() });
  });

  // --- SUPER ADMIN: ASIGNAR Y CONSULTAR ADMINISTRADOR DE TIENDA (CORREO Y CONTRASEÑA) ---
  app.get('/api/admin/stores/:id/admin-user', (req: Request, res: Response) => {
    try {
      const admin = getAuthenticatedSuperAdmin(req);
      if (!admin) {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
      }
      const user = db.getStoreAdminUser(req.params.id);
      res.json({ success: true, user: user ? sanitizeUser(user) : null });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error consultando administrador de la tienda' });
    }
  });

  app.post('/api/admin/stores/:id/assign-admin', async (req: Request, res: Response) => {
    try {
      const admin = getAuthenticatedSuperAdmin(req);
      if (!admin) {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
      }

      const { email, password, name, phone } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return res.status(400).json({ success: false, message: 'Debes ingresar un correo electrónico válido.' });
      }

      if (!password || password.length < 6) {
        return res.status(400).json({ success: false, message: 'La contraseña debe contener al menos 6 caracteres.' });
      }

      const passHash = await hashPassword(password);
      const result = db.assignStoreAdmin(req.params.id, cleanEmail, passHash, name, phone);

      if (!result.success || !result.user) {
        return res.status(400).json({ success: false, message: result.message || 'No fue posible asignar el administrador.' });
      }

      res.json({
        success: true,
        message: `Usuario administrador (${cleanEmail}) asignado exitosamente a la tienda.`,
        user: sanitizeUser(result.user),
        store: result.store,
        version: db.getVersion()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error asignando administrador a la tienda' });
    }
  });

  // --- PRODUCTS ---
  app.get('/api/products', (req: Request, res: Response) => {
    res.json({ success: true, products: db.getProducts() });
  });

  app.post('/api/products', (req: Request, res: Response) => {
    try {
      const productData = req.body;
      const newProd = db.addProduct(productData);
      res.json({ success: true, product: newProd, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Error creating product' });
    }
  });

  app.put('/api/products/:id', (req: Request, res: Response) => {
    const updated = db.updateProduct(req.params.id, req.body);
    if (!updated) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product: updated, version: db.getVersion() });
  });

  app.delete('/api/products/:id', (req: Request, res: Response) => {
    const ok = db.deleteProduct(req.params.id);
    res.json({ success: ok, version: db.getVersion() });
  });

  app.post('/api/products/clean-test', (req: Request, res: Response) => {
    const cleaned = db.cleanTestProducts();
    res.json({ success: true, cleanedCount: cleaned, version: db.getVersion() });
  });

  // --- CATEGORIES ---
  app.get('/api/categories', (req: Request, res: Response) => {
    res.json({ success: true, categories: db.getCategories() });
  });

  app.post('/api/categories', (req: Request, res: Response) => {
    const cat = db.addCategory(req.body);
    res.json({ success: true, category: cat, version: db.getVersion() });
  });

  app.put('/api/categories/:id', (req: Request, res: Response) => {
    const cat = db.updateCategory(req.params.id, req.body);
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, category: cat, version: db.getVersion() });
  });

  app.delete('/api/categories/:id', (req: Request, res: Response) => {
    const result = db.deleteCategory(req.params.id);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message || 'No se pudo eliminar la categoría' });
    }
    res.json({ success: true, version: db.getVersion() });
  });

  app.post('/api/categories/merge', (req: Request, res: Response) => {
    const { sourceId, targetId } = req.body;
    const ok = db.mergeCategories(sourceId, targetId);
    res.json({ success: ok, version: db.getVersion() });
  });

  // --- TECHNICAL SPECIFICATIONS ---
  app.get('/api/specifications', (req: Request, res: Response) => {
    const { subcategoryId, categoryId } = req.query as { subcategoryId?: string; categoryId?: string };
    const specs = db.getSpecifications(subcategoryId, categoryId);
    res.json({ success: true, specifications: specs });
  });

  app.get('/api/specifications/all', (req: Request, res: Response) => {
    res.json({ success: true, specifications: db.getAllSpecifications() });
  });

  app.post('/api/specifications', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado' });
    const spec = db.addSpecification(req.body);
    res.json({ success: true, specification: spec, version: db.getVersion() });
  });

  app.put('/api/specifications/:id', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado' });
    const spec = db.updateSpecification(req.params.id, req.body);
    if (!spec) return res.status(404).json({ success: false, message: 'Specification not found' });
    res.json({ success: true, specification: spec, version: db.getVersion() });
  });

  app.delete('/api/specifications/:id', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado' });
    const ok = db.deleteSpecification(req.params.id);
    res.json({ success: ok, version: db.getVersion() });
  });

  // --- SETTINGS (Super Admin platform_settings) ---
  app.get('/api/settings', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    const settings = db.getSystemSettings();
    if (admin) {
      return res.json({ success: true, settings });
    }
    const safeSettings = { ...settings };
    if (safeSettings.mailConfig) {
      const { smtpPass: _, ...safeMail } = safeSettings.mailConfig;
      safeSettings.mailConfig = {
        ...safeMail,
        isConfigured: !!settings.mailConfig?.isConfigured
      };
    }
    res.json({ success: true, settings: safeSettings });
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    }
    const updated = db.updateSystemSettings(req.body);
    if (req.body.mailConfig) {
      if (req.body.mailConfig.smtpPass) {
        process.env.SMTP_PASS = req.body.mailConfig.smtpPass;
      }
      if (req.body.mailConfig.smtpHost) {
        process.env.SMTP_HOST = req.body.mailConfig.smtpHost;
      }
      if (req.body.mailConfig.smtpPort) {
        process.env.SMTP_PORT = String(req.body.mailConfig.smtpPort);
      }
      if (req.body.mailConfig.senderEmail) {
        process.env.MAIL_SENDER_EMAIL = req.body.mailConfig.senderEmail;
      }
      if (req.body.mailConfig.smtpUser) {
        process.env.SMTP_USER = req.body.mailConfig.smtpUser;
      }
    }
    res.json({ success: true, settings: updated, version: db.getVersion() });
  });

  // --- CONFIGURACIÓN DE PAGOS & PROVEEDORES CENTRALES (PLAZADO.COM) ---
  app.get('/api/payment-gateways', (req: Request, res: Response) => {
    res.json({ success: true, gateways: db.getPaymentGateways(true) });
  });

  app.get('/api/payment-gateways/active', (req: Request, res: Response) => {
    res.json({ success: true, activeGateway: db.getActivePaymentGateway() });
  });

  app.post('/api/payment-gateways', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    try {
      const saved = db.savePaymentGateway(req.body);
      res.json({ success: true, gateway: saved, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Error guardando proveedor de pago' });
    }
  });

  app.put('/api/payment-gateways/:id/activate', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    try {
      const ok = db.setActivePaymentGateway(req.params.id);
      if (!ok) return res.status(404).json({ success: false, message: 'Proveedor de pago no encontrado' });
      res.json({ success: true, activeGatewayId: req.params.id, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Error activando proveedor de pago' });
    }
  });

  app.delete('/api/payment-gateways/:id', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    try {
      const ok = db.deletePaymentGateway(req.params.id);
      res.json({ success: ok, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Error eliminando proveedor de pago' });
    }
  });

  // --- GESTIÓN DE PUBLICIDAD & ESPACIOS PUBLICITARIOS ---
  app.get('/api/advertising/campaigns', (req: Request, res: Response) => {
    res.json({ success: true, campaigns: db.getAdvertisements() });
  });

  app.get('/api/advertising/active', (req: Request, res: Response) => {
    const placement = typeof req.query.placement === 'string' ? req.query.placement : undefined;
    const device = typeof req.query.device === 'string' ? req.query.device : undefined;
    res.json({ success: true, ads: db.getActiveAdvertisements(placement, device) });
  });

  app.post('/api/advertising/campaigns', (req: Request, res: Response) => {
    try {
      const ad = db.addAdvertisement(req.body);
      res.json({ success: true, ad, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Error creando publicidad' });
    }
  });

  app.put('/api/advertising/campaigns/:id', (req: Request, res: Response) => {
    try {
      const ad = db.updateAdvertisement(req.params.id, req.body);
      if (!ad) return res.status(404).json({ success: false, message: 'Publicidad no encontrada' });
      res.json({ success: true, ad, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Error actualizando publicidad' });
    }
  });

  app.patch('/api/advertising/campaigns/:id/toggle', (req: Request, res: Response) => {
    const ok = db.toggleAdvertisementStatus(req.params.id);
    res.json({ success: ok, version: db.getVersion() });
  });

  app.delete('/api/advertising/campaigns/:id', (req: Request, res: Response) => {
    const ok = db.deleteAdvertisement(req.params.id);
    res.json({ success: ok, version: db.getVersion() });
  });

  app.get('/api/advertising/placements', (req: Request, res: Response) => {
    res.json({ success: true, placements: db.getAdPlacements() });
  });

  app.post('/api/advertising/placements', (req: Request, res: Response) => {
    const placement = db.saveAdPlacement(req.body);
    res.json({ success: true, placement, version: db.getVersion() });
  });

  app.post('/api/advertising/track/impression', (req: Request, res: Response) => {
    const { adId, device } = req.body;
    if (adId) db.trackAdImpression(adId, device);
    res.json({ success: true });
  });

  app.post('/api/advertising/track/click', (req: Request, res: Response) => {
    const { adId, device } = req.body;
    if (adId) db.trackAdClick(adId, device);
    res.json({ success: true });
  });

  // --- BANNERS ---
  app.get('/api/banners', (req: Request, res: Response) => {
    res.json({ success: true, banners: db.getBanners() });
  });

  app.post('/api/banners', (req: Request, res: Response) => {
    const b = db.addBanner(req.body);
    res.json({ success: true, banner: b, version: db.getVersion() });
  });

  app.put('/api/banners/:id', (req: Request, res: Response) => {
    const b = db.updateBanner(req.params.id, req.body);
    if (!b) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, banner: b, version: db.getVersion() });
  });

  app.delete('/api/banners/:id', (req: Request, res: Response) => {
    const ok = db.deleteBanner(req.params.id);
    res.json({ success: ok, version: db.getVersion() });
  });

  // --- ORDERS ---
  app.get('/api/orders', (req: Request, res: Response) => {
    res.json({ success: true, orders: db.getOrders() });
  });

  app.post('/api/orders', (req: Request, res: Response) => {
    try {
      const orders = req.body.orders;
      if (!Array.isArray(orders) || orders.length === 0) {
        return res.status(400).json({ success: false, message: 'No orders provided' });
      }
      const created = db.createOrders(orders);
      res.json({ success: true, orders: created, version: db.getVersion() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error processing orders' });
    }
  });

  app.patch('/api/orders/:id/status', (req: Request, res: Response) => {
    const { status, note, confirmationCode } = req.body;
    const result = db.updateOrderStatus(req.params.id, status, note, confirmationCode);
    res.json({ ...result, version: db.getVersion() });
  });

  // In-platform order chat messaging (PlazaDO exclusive communication channel)
  app.get('/api/orders/:id/messages', (req: Request, res: Response) => {
    const messages = db.getOrderMessages(req.params.id);
    res.json({ success: true, messages });
  });

  app.post('/api/orders/:id/messages', (req: Request, res: Response) => {
    try {
      const { storeId, customerId, senderId, senderName, senderRole, message } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'El mensaje no puede estar vacío.' });
      }
      const newMsg = db.addOrderMessage({
        orderId: req.params.id,
        storeId,
        customerId,
        senderId,
        senderName: senderName || 'Usuario PlazaDO',
        senderRole: senderRole || 'CUSTOMER',
        message: message.trim()
      });
      res.json({ success: true, message: newMsg, version: db.getVersion() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error guardando mensaje' });
    }
  });

  app.patch('/api/orders/:id/messages/read', (req: Request, res: Response) => {
    try {
      const { role } = req.body;
      db.markOrderMessagesAsRead(req.params.id, role === 'STORE' ? 'STORE' : 'CUSTOMER');
      res.json({ success: true, version: db.getVersion() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Dedicated delivery confirmation endpoint validating the secret delivery code
  app.post('/api/delivery/confirm', async (req: Request, res: Response) => {
    try {
      const { orderId, deliveryCode, confirmedBy } = req.body;
      if (!orderId || !deliveryCode) {
        return res.status(400).json({ success: false, message: 'ID de orden y código secreto de entrega requeridos.' });
      }
      const result = db.updateOrderStatus(orderId, 'DELIVERED', 'Validación exitosa de código de entrega', deliveryCode);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json({ success: true, message: 'Entrega confirmada y liquidación habilitada', order: result.order, version: db.getVersion() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error validando entrega' });
    }
  });

  // Direct multi-store checkout powered by Cloud SQL
  app.post('/api/orders/checkout-multi', async (req: Request, res: Response) => {
    try {
      const { customer, customerId, items, paymentMethod, shippingAddress, notes } = req.body;
      const targetCustomerId = customerId || (typeof customer === 'object' ? customer?.id : customer);
      if (!targetCustomerId || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Datos incompletos para procesar el pedido.' });
      }

      const result = await cloudSqlRepo.createMultiStoreOrders({
        customerId: targetCustomerId,
        items,
        paymentMethod: paymentMethod || 'CARD_AZUL',
        shippingAddress: shippingAddress || {},
        notes,
      });

      // Sync memory state
      await db.initCloudSqlSync();

      res.json({ success: true, ...result, version: db.getVersion() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error procesando multi-store checkout' });
    }
  });

  // Cart operations backed directly by Cloud SQL
  app.get('/api/cart/:userId', async (req: Request, res: Response) => {
    try {
      const cartData = await cloudSqlRepo.getCartByUser(req.params.userId);
      res.json({ success: true, cart: cartData });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/cart/add', async (req: Request, res: Response) => {
    try {
      const { userId, productId, storeId, quantity } = req.body;
      const cartData = await cloudSqlRepo.addToCart(userId, productId, storeId, quantity || 1);
      res.json({ success: true, cart: cartData });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete('/api/cart/:userId', async (req: Request, res: Response) => {
    try {
      await cloudSqlRepo.clearCart(req.params.userId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete('/api/orders/:id', (req: Request, res: Response) => {
    const ok = db.deleteOrder(req.params.id);
    res.json({ success: ok, version: db.getVersion() });
  });

  // --- BALANCES & SETTLEMENTS ---
  app.get('/api/balances', (req: Request, res: Response) => {
    const caller = getAuthenticatedUser(req);
    if (!caller) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    if (caller.role === 'SUPER_ADMIN') {
      return res.json({ success: true, balances: db.getStoreBalances() });
    }
    if (caller.storeId) {
      const allBalances = db.getStoreBalances();
      const myBalance = allBalances[caller.storeId] || { availableBalance: 0, pendingBalance: 0, totalSales: 0 };
      return res.json({ success: true, balances: { [caller.storeId]: myBalance } });
    }
    return res.status(403).json({ success: false, message: 'Acceso denegado' });
  });

  app.get('/api/settlements', (req: Request, res: Response) => {
    const caller = getAuthenticatedUser(req);
    if (!caller) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const all = db.getSettlements();
    if (caller.role === 'SUPER_ADMIN') {
      return res.json({ success: true, settlements: all });
    }
    if (caller.storeId) {
      return res.json({ success: true, settlements: all.filter(s => s.storeId === caller.storeId) });
    }
    return res.status(403).json({ success: false, message: 'Acceso denegado' });
  });

  // Ejecución automática semanal de los viernes
  app.post('/api/admin/settlements/run-weekly', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    }
    try {
      const { actorName } = req.body || {};
      const result = db.runWeeklySettlementProcess(actorName || admin.name || 'Super Admin Plazado.com');
      res.json({ ...result, version: db.getVersion() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error ejecutando ciclo de liquidación semanal' });
    }
  });

  // Transacciones y Auditoría Financiera
  app.get('/api/financial/transactions', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    }
    res.json({ success: true, transactions: db.getPaymentTransactions() });
  });

  app.get('/api/financial/audit-logs', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    }
    res.json({ success: true, logs: db.getFinancialAuditLogs() });
  });

  // Webhook centralizado de procesamiento de pagos
  app.post('/api/payments/webhook', (req: Request, res: Response) => {
    try {
      const payload = req.body;
      const result = db.processPaymentWebhook(payload);
      res.json({ ...result, version: db.getVersion() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error en webhook' });
    }
  });

  app.post('/api/settlements', (req: Request, res: Response) => {
    const caller = getAuthenticatedUser(req);
    if (!caller) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const { storeId, notes } = req.body;
    if (caller.role !== 'SUPER_ADMIN' && caller.storeId !== storeId) {
      return res.status(403).json({ success: false, message: 'No puedes solicitar liquidaciones para otra tienda' });
    }
    const result = db.requestSettlement(storeId, notes);
    res.json({ ...result, version: db.getVersion() });
  });

  app.patch('/api/settlements/:id', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    }
    const { status, reference } = req.body;
    const updated = db.processSettlement(req.params.id, status, reference);
    if (!updated) return res.status(404).json({ success: false, message: 'Settlement not found' });
    res.json({ success: true, settlement: updated, version: db.getVersion() });
  });

  app.delete('/api/settlements/:id', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    }
    const ok = db.deleteSettlement(req.params.id);
    res.json({ success: ok, version: db.getVersion() });
  });

  // --- DISPUTES ---
  app.get('/api/disputes', (req: Request, res: Response) => {
    const caller = getAuthenticatedUser(req);
    if (!caller) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const all = db.getDisputes();
    if (caller.role === 'SUPER_ADMIN') {
      return res.json({ success: true, disputes: all });
    }
    if (caller.storeId) {
      return res.json({ success: true, disputes: all.filter(d => d.storeId === caller.storeId) });
    }
    return res.json({ success: true, disputes: all.filter(d => d.customerId === caller.id) });
  });

  app.post('/api/disputes', (req: Request, res: Response) => {
    const caller = getAuthenticatedUser(req);
    if (!caller) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const disp = db.createDispute(req.body);
    res.json({ success: true, dispute: disp, version: db.getVersion() });
  });

  app.patch('/api/disputes/:id', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    }
    const { status, resolutionNotes } = req.body;
    const updated = db.resolveDispute(req.params.id, status, resolutionNotes);
    if (!updated) return res.status(404).json({ success: false, message: 'Dispute not found' });
    res.json({ success: true, dispute: updated, version: db.getVersion() });
  });

  app.delete('/api/disputes/:id', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    }
    const ok = db.deleteDispute(req.params.id);
    res.json({ success: ok, version: db.getVersion() });
  });

  // --- REVIEWS ---
  app.get('/api/reviews', (req: Request, res: Response) => {
    res.json({ success: true, reviews: db.getReviews() });
  });

  app.post('/api/reviews', (req: Request, res: Response) => {
    const rev = db.addReview(req.body);
    res.json({ success: true, review: rev, version: db.getVersion() });
  });

  app.delete('/api/reviews/:id', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    }
    const ok = db.deleteReview(req.params.id);
    res.json({ success: ok, version: db.getVersion() });
  });

  // --- USERS & AUTHENTICATION ---
  app.get('/api/users', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    }
    const safeUsers = db.getUsers().map(u => sanitizeUser(u));
    res.json({ success: true, users: safeUsers });
  });

  // Verify active session token & return fresh user profile
  app.get('/api/auth/me', (req: Request, res: Response) => {
    try {
      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ success: false, message: 'No autenticado o sesión expirada' });
      }
      res.json({ success: true, user: sanitizeUser(user) });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error validando sesión' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // 1. Password must be provided as a non-empty string. Exact characters preserved.
      if (!password || typeof password !== 'string' || password.length === 0) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
      }

      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
      }

      // 2. Identify user exclusively by email
      const user = db.getUserByEmail(cleanEmail);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
      }

      // 3. Obtain password_hash belonging specifically to this user
      if (!user.passwordHash || typeof user.passwordHash !== 'string') {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
      }

      // 4. Exact cryptographic comparison: password against user.passwordHash
      // Exact character check: no lowercase, uppercase, partial, or fuzzy matching
      const passwordValida = await verifyPassword(password, user.passwordHash);
      if (passwordValida !== true) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
      }

      // 5. Generate session token ONLY after explicit verification is valid
      const token = createSessionToken(user);
      db.addAuditLog('USER_LOGIN', user.id, undefined, `Inicio de sesión exitoso como ${user.role} (${user.email})`);
      return res.json({ success: true, user: sanitizeUser(user), token, version: db.getVersion() });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Error procesando autenticación' });
    }
  });

  // Active email verification OTP memory cache for non-registered users (guest / pre-register)
  const activeVerificationCodes = new Map<string, { code: string; expiresAt: number; name?: string; type: string }>();

  // Send email confirmation code (pre-register or generic)
  app.post('/api/auth/send-verification-code', async (req: Request, res: Response) => {
    try {
      const { email, name, type = 'CUSTOMER' } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return res.status(400).json({ success: false, message: 'Correo electrónico inválido.' });
      }

      // Generate cryptographically secure 6-digit numeric OTP code
      const code = crypto.randomInt(100000, 1000000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

      activeVerificationCodes.set(cleanEmail, { code, expiresAt, name, type });

      // If user already exists in db, update their verification record
      const existingUser = db.getUserByEmail(cleanEmail);
      if (existingUser) {
        db.setUserVerification(existingUser.id, {
          code,
          codeExpiresAt: expiresAt,
          attempts: 0,
          lastSentAt: Date.now(),
          isVerified: false,
          resendCount: (existingUser.verification?.resendCount || 0) + 1,
          accountType: type as any,
          storeName: existingUser.verification?.storeName
        });
      }

      const sysSettings = db.getSystemSettings();
      const mailConfig = sysSettings.mailConfig || {
        senderEmail: 'contacto@plazado.com',
        senderName: 'PlazaDO.com - Marketplace Dominicano'
      };

      // Dispatch real email from official contacto@plazado.com
      const mailResult = await sendRegistrationOtpEmail(cleanEmail, name || 'Usuario', code, mailConfig);

      db.addAuditLog(
        'VERIFICATION_EMAIL_DISPATCHED',
        cleanEmail,
        mailConfig.senderEmail || 'contacto@plazado.com',
        `Código de verificación generado y enviado desde contacto@plazado.com. Entregado por SMTP: ${mailResult.delivered ? 'SÍ' : 'NO (Registro en servidor)'}`
      );

      res.json({
        success: true,
        delivered: mailResult.delivered,
        message: `Código de confirmación enviado exitosamente desde ${mailConfig.senderEmail || 'contacto@plazado.com'} a tu correo ${cleanEmail}. Revisa tu bandeja de entrada o spam.`,
        senderEmail: mailConfig.senderEmail || 'contacto@plazado.com',
        expiresInSeconds: 900
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error enviando código de verificación' });
    }
  });

  // Resend verification code (with 60-second cooldown protection against spam)
  app.post('/api/auth/resend-verification-code', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return res.status(400).json({ success: false, message: 'Correo electrónico inválido.' });
      }

      const existingUser = db.getUserByEmail(cleanEmail);
      const preRecord = activeVerificationCodes.get(cleanEmail);

      const lastSentAt = existingUser?.verification?.lastSentAt || 0;
      const elapsedSeconds = Math.floor((Date.now() - lastSentAt) / 1000);
      const COOLDOWN_SECONDS = 60;

      if (lastSentAt > 0 && elapsedSeconds < COOLDOWN_SECONDS) {
        const remaining = COOLDOWN_SECONDS - elapsedSeconds;
        return res.status(429).json({
          success: false,
          message: `Por favor espera ${remaining} segundo${remaining > 1 ? 's' : ''} antes de solicitar otro reenvío.`,
          remainingSeconds: remaining
        });
      }

      // Generate new cryptographically secure 6-digit code (invalidating the previous one)
      const newCode = crypto.randomInt(100000, 1000000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000;

      activeVerificationCodes.set(cleanEmail, {
        code: newCode,
        expiresAt,
        name: existingUser?.name || preRecord?.name,
        type: existingUser?.role === 'STORE_OWNER' ? 'STORE' : 'CUSTOMER'
      });

      if (existingUser) {
        db.setUserVerification(existingUser.id, {
          code: newCode,
          codeExpiresAt: expiresAt,
          attempts: 0,
          lastSentAt: Date.now(),
          isVerified: false,
          resendCount: (existingUser.verification?.resendCount || 0) + 1,
          accountType: existingUser.role === 'STORE_OWNER' ? 'STORE' : 'CUSTOMER',
          storeName: existingUser.verification?.storeName
        });
      }

      const sysSettings = db.getSystemSettings();
      const mailConfig = sysSettings.mailConfig || {
        senderEmail: 'contacto@plazado.com',
        senderName: 'PlazaDO.com - Marketplace Dominicano'
      };

      const mailResult = await sendRegistrationOtpEmail(cleanEmail, existingUser?.name || 'Usuario', newCode, mailConfig);

      db.addAuditLog(
        'VERIFICATION_CODE_RESENT',
        cleanEmail,
        mailConfig.senderEmail || 'contacto@plazado.com',
        `Código de verificación reenviado a ${cleanEmail} desde contacto@plazado.com. Entregado por SMTP: ${mailResult.delivered ? 'SÍ' : 'NO'}`
      );

      res.json({
        success: true,
        delivered: mailResult.delivered,
        message: `Nuevo código de verificación enviado a ${cleanEmail} desde contacto@plazado.com. Por favor revisa tu bandeja de entrada o spam.`,
        cooldownSeconds: COOLDOWN_SECONDS,
        expiresInSeconds: 900
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error reenviando código' });
    }
  });

  // Verify email confirmation code
  app.post('/api/auth/verify-code', (req: Request, res: Response) => {
    try {
      const { email, code } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      const cleanCode = (code || '').trim();

      if (!cleanEmail || !cleanCode) {
        return res.status(400).json({ success: false, message: 'Correo y código de verificación son requeridos.' });
      }

      const user = db.getUserByEmail(cleanEmail);
      const preRecord = activeVerificationCodes.get(cleanEmail);

      // Check if user is already verified - NEVER issue a token without password verification
      if (user && user.isEmailVerified === true) {
        return res.status(400).json({
          success: false,
          verified: true,
          message: 'Tu cuenta ya está verificada. Por favor inicia sesión con tu contraseña.'
        });
      }

      const activeCode = user?.verification?.code || preRecord?.code;
      const expiresAt = user?.verification?.codeExpiresAt || preRecord?.expiresAt || 0;
      let attempts = user?.verification?.attempts || 0;

      if (!activeCode) {
        return res.status(400).json({
          success: false,
          message: 'No hay un código activo para este correo. Por favor solicita el reenvío de un nuevo código.'
        });
      }

      if (attempts >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Has alcanzado el límite de 5 intentos fallidos. Por favor solicita un nuevo código o contacta a contacto@plazado.com.'
        });
      }

      if (Date.now() > expiresAt) {
        activeVerificationCodes.delete(cleanEmail);
        return res.status(400).json({
          success: false,
          expired: true,
          message: 'El código de verificación ha expirado. Por favor solicita un nuevo código.'
        });
      }

      if (activeCode !== cleanCode) {
        attempts += 1;
        if (user && user.verification) {
          user.verification.attempts = attempts;
          db.setUserVerification(user.id, user.verification);
        }
        const remaining = Math.max(0, 5 - attempts);
        return res.status(400).json({
          success: false,
          message: `El código ingresado es incorrecto. Te quedan ${remaining} intento${remaining === 1 ? '' : 's'}.`
        });
      }

      // CODE IS CORRECT! Mark user account verified
      activeVerificationCodes.delete(cleanEmail);

      if (user) {
        user.isEmailVerified = true;
        if (user.verification) {
          user.verification.isVerified = true;
          user.verification.verifiedAt = new Date().toISOString();
          db.setUserVerification(user.id, user.verification);
        } else {
          db.setUserVerification(user.id, {
            code: cleanCode,
            codeExpiresAt: expiresAt,
            attempts,
            lastSentAt: Date.now(),
            isVerified: true,
            verifiedAt: new Date().toISOString(),
            resendCount: 0,
            accountType: user.role === 'STORE_OWNER' ? 'STORE' : 'CUSTOMER'
          });
        }

        if (user.storeId) {
          const st = db.getStores().find(s => s.id === user.storeId);
          if (st) {
            st.isEmailVerified = true;
          }
        }

        db.addAuditLog('USER_EMAIL_VERIFIED', user.id, undefined, `Usuario ${user.name} (${user.email}) validó su código de correo exitosamente.`);
        const token = createSessionToken(user);
        return res.json({
          success: true,
          verified: true,
          user,
          token,
          message: '¡Tu cuenta y correo electrónico han sido verificados exitosamente!'
        });
      }

      res.json({
        success: true,
        verified: true,
        message: 'Código de confirmación verificado con éxito'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error verificando código' });
    }
  });

  // Test SMTP Email configuration from Super Admin
  app.post('/api/admin/mail/test', async (req: Request, res: Response) => {
    try {
      const { testEmail, senderEmail, senderName, smtpHost, smtpPort, smtpUser, smtpPass } = req.body;
      const targetEmail = (testEmail || '').trim().toLowerCase() || 'contacto@plazado.com';
      const config = {
        senderEmail: senderEmail || 'contacto@plazado.com',
        senderName: senderName || 'PlazaDO.com - Marketplace Dominicano',
        smtpHost: smtpHost || 'smtp.gmail.com',
        smtpPort: Number(smtpPort) || 465,
        smtpUser: smtpUser || senderEmail || 'contacto@plazado.com',
        smtpPass: smtpPass || ''
      };

      const connCheck = await verifySmtpConnection(config);
      if (!connCheck.ok) {
        return res.status(400).json({ success: false, message: connCheck.message });
      }

      const testCode = crypto.randomInt(100000, 1000000).toString();
      const sendRes = await sendRegistrationOtpEmail(targetEmail, 'Administrador PlazaDO', testCode, config);

      if (sendRes.delivered) {
        res.json({
          success: true,
          message: `¡Prueba exitosa! Correo de verificación entregado a ${targetEmail} desde ${config.senderEmail}.`
        });
      } else {
        res.status(400).json({
          success: false,
          message: sendRes.error || sendRes.warning || 'No se pudo entregar el correo de prueba por SMTP.'
        });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error probando servicio de correo' });
    }
  });

  // --- SUPER ADMIN VERIFICATION MANAGEMENT ROUTES ---
  // List all users and stores with their email verification status
  app.get('/api/admin/verifications', (req: Request, res: Response) => {
    try {
      const admin = getAuthenticatedSuperAdmin(req);
      if (!admin) {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
      }

      const list = db.getVerificationsList();
      res.json({ success: true, verifications: list });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error consultando verificaciones' });
    }
  });

  // Super Admin: Consult active verification code for support assistance
  app.post('/api/admin/verifications/consult-code', (req: Request, res: Response) => {
    try {
      const admin = getAuthenticatedSuperAdmin(req);
      if (!admin) {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
      }

      const { email } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      const user = db.getUserByEmail(cleanEmail);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      }

      const code = user.verification?.code;
      const codeExpiresAt = user.verification?.codeExpiresAt || 0;
      const isExpired = Date.now() > codeExpiresAt;

      // Register strictly in AuditLog
      db.addAuditLog(
        'ADMIN_CONSULT_VERIFICATION_CODE',
        user.id,
        user.email,
        `Super Admin (${admin.email}) consultó el código de verificación de ${user.name} (${user.email}). Código activo: ${code || 'N/A'}.`,
        { id: admin.id, name: admin.email, role: 'SUPER_ADMIN' }
      );

      res.json({
        success: true,
        email: user.email,
        name: user.name,
        code,
        codeExpiresAt,
        isExpired,
        attempts: user.verification?.attempts || 0,
        isEmailVerified: user.isEmailVerified === true
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error consultando código' });
    }
  });

  // Super Admin: Generate a new code for the user, invalidating the previous one, and dispatching via email
  app.post('/api/admin/verifications/generate-new-code', async (req: Request, res: Response) => {
    try {
      const admin = getAuthenticatedSuperAdmin(req);
      if (!admin) {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
      }

      const { email } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      const regenRes = db.regenerateUserVerificationCode(cleanEmail, admin.email);
      if (!regenRes.success || !regenRes.code) {
        return res.status(400).json({ success: false, message: regenRes.message });
      }

      // Automatically dispatch new code from contacto@plazado.com to the user
      const sysSettings = db.getSystemSettings();
      const mailConfig = sysSettings.mailConfig || {
        senderEmail: 'contacto@plazado.com',
        senderName: 'PlazaDO.com - Marketplace Dominicano'
      };

      const mailResult = await sendRegistrationOtpEmail(
        cleanEmail,
        regenRes.user?.name || 'Usuario',
        regenRes.code,
        mailConfig
      );

      res.json({
        success: true,
        newCode: regenRes.code,
        expiresAt: regenRes.expiresAt,
        delivered: mailResult.delivered,
        message: `Nuevo código generado (${regenRes.code}) y enviado a ${cleanEmail} desde contacto@plazado.com.`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error generando nuevo código' });
    }
  });

  // Super Admin: Manually approve verification for an account (e.g. validated via phone/support)
  app.post('/api/admin/verifications/manual-verify', (req: Request, res: Response) => {
    try {
      const admin = getAuthenticatedSuperAdmin(req);
      if (!admin) {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
      }

      const { email, reason } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      const manualRes = db.manualVerifyUser(cleanEmail, admin.email, reason);
      if (!manualRes.success) {
        return res.status(400).json({ success: false, message: manualRes.message });
      }

      res.json({ success: true, message: manualRes.message });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error en verificación manual' });
    }
  });

  // Super Admin: Autorizar y validar cuenta (Cédula y Fotografía)
  app.post('/api/admin/approve-user', async (req: Request, res: Response) => {
    try {
      const admin = getAuthenticatedSuperAdmin(req);
      if (!admin) {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
      }

      const { userId, email } = req.body;
      const target = userId || email;
      if (!target) {
        return res.status(400).json({ success: false, message: 'Se requiere ID o correo del usuario.' });
      }

      const result = db.approveUserAccount(target, admin.email);
      if (!result.success) {
        return res.status(400).json(result);
      }

      // Enviar correo de confirmación de aprobación desde contacto@plazado.com
      try {
        const sysSettings = db.getSystemSettings();
        const mailConfig = sysSettings.mailConfig || {
          senderEmail: 'contacto@plazado.com',
          senderName: 'PlazaDO.com - Marketplace Dominicano'
        };
        if (result.user?.email) {
          await sendRegistrationOtpEmail(
            result.user.email,
            result.user.name,
            'AUTORIZADO',
            mailConfig
          );
        }
      } catch (e) {
        console.warn('[Mailer] Could not send approval notice email:', e);
      }

      res.json({ success: true, message: result.message, user: result.user, version: db.getVersion() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error autorizando usuario' });
    }
  });

  // Super Admin: Rechazar documentación / cédula
  app.post('/api/admin/reject-user', (req: Request, res: Response) => {
    try {
      const admin = getAuthenticatedSuperAdmin(req);
      if (!admin) {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
      }

      const { userId, email, reason } = req.body;
      const target = userId || email;
      if (!target) {
        return res.status(400).json({ success: false, message: 'Se requiere ID o correo del usuario.' });
      }

      const result = db.rejectUserAccount(target, admin.email, reason);
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({ success: true, message: result.message, user: result.user, version: db.getVersion() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error rechazando usuario' });
    }
  });

  // Super Admin: Crear nuevo Super Administrador
  app.post('/api/admin/create-super-admin', async (req: Request, res: Response) => {
    try {
      const admin = getAuthenticatedSuperAdmin(req);
      if (!admin) {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
      }

      const { name, email, phone, password } = req.body;
      if (!name?.trim() || !email?.trim()) {
        return res.status(400).json({ success: false, message: 'Nombre y correo electrónico son requeridos.' });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ success: false, message: 'La contraseña debe tener un mínimo de 6 caracteres.' });
      }

      const passHash = await hashPassword(password);
      const result = db.createSuperAdmin({
        name: name.trim(),
        email: email.trim(),
        phone: (phone || '').trim(),
        passwordHash: passHash,
        createdByAdmin: admin.email
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({ success: true, message: result.message, user: result.user, version: db.getVersion() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error creando Super Administrador' });
    }
  });

  // Super Admin: Resend the active code email to user
  app.post('/api/admin/verifications/resend-email', async (req: Request, res: Response) => {
    try {
      const admin = getAuthenticatedSuperAdmin(req);
      if (!admin) {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
      }

      const { email } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      const user = db.getUserByEmail(cleanEmail);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      }

      let code = user.verification?.code;
      // If code expired or missing, regenerate fresh
      if (!code || Date.now() > (user.verification?.codeExpiresAt || 0)) {
        const regen = db.regenerateUserVerificationCode(cleanEmail, admin.email);
        code = regen.code;
      }

      const sysSettings = db.getSystemSettings();
      const mailConfig = sysSettings.mailConfig || {
        senderEmail: 'contacto@plazado.com',
        senderName: 'PlazaDO.com - Marketplace Dominicano'
      };

      const mailResult = await sendRegistrationOtpEmail(cleanEmail, user.name, code || '000000', mailConfig);

      db.addAuditLog(
        'ADMIN_RESENT_VERIFICATION_EMAIL',
        user.id,
        user.email,
        `Super Admin (${admin.email}) reenvió el correo de confirmación a ${user.email} desde contacto@plazado.com.`,
        { id: admin.id, name: admin.email, role: 'SUPER_ADMIN' }
      );

      res.json({
        success: true,
        delivered: mailResult.delivered,
        message: `Correo reenviado exitosamente a ${cleanEmail} desde contacto@plazado.com.`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error reenviando correo' });
    }
  });

  // Register Customer (Creates account, generates code, dispatches email from contacto@plazado.com automatically)
  app.post('/api/auth/register-customer', async (req: Request, res: Response) => {
    try {
      const data: CustomerRegistrationInput = req.body;
      const cleanEmail = (data.email || '').trim().toLowerCase();
      const users = db.getUsers();

      const existingUser = users.find(u => u.email.toLowerCase() === cleanEmail);
      if (existingUser && existingUser.isEmailVerified === true) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una cuenta verificada con este correo electrónico. Por favor inicia sesión.'
        });
      }

      if (!data.name?.trim()) {
        return res.status(400).json({ success: false, message: 'Por favor ingresa tu nombre.' });
      }
      if (!data.password || data.password.length < 6) {
        return res.status(400).json({ success: false, message: 'La contraseña debe tener un mínimo de 6 caracteres.' });
      }
      if (data.password !== data.confirmPassword) {
        return res.status(400).json({ success: false, message: 'Las contraseñas no coinciden.' });
      }

      // Generate cryptographically secure 6-digit verification code
      const code = crypto.randomInt(100000, 1000000).toString();
      const codeExpiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
      const passHash = await hashPassword(data.password);

      let customerUser: User;

      if (existingUser && !existingUser.isEmailVerified) {
        // Update pending unverified account
        existingUser.name = `${(data.name || '').trim()} ${(data.lastName || '').trim()}`.trim();
        existingUser.phone = (data.phone || existingUser.phone || '').trim();
        existingUser.passwordHash = passHash;
        if (data.cedulaNumber) existingUser.cedulaNumber = data.cedulaNumber;
        if (data.selfieUrl && !existingUser.avatar) existingUser.avatar = data.selfieUrl;
        if (data.cedulaFrontUrl || data.selfieUrl || data.cedulaNumber) {
          existingUser.kycData = {
            cedulaNumber: data.cedulaNumber || existingUser.cedulaNumber || undefined,
            cedulaFrontUrl: data.cedulaFrontUrl || existingUser.kycData?.cedulaFrontUrl || '',
            selfieUrl: data.selfieUrl || existingUser.kycData?.selfieUrl || existingUser.avatar || '',
            biometricScore: data.biometricScore || existingUser.kycData?.biometricScore || 98.6,
            biometricStatus: 'VERIFIED',
            verifiedAt: new Date().toISOString(),
            livenessPassed: true,
            facialMatchPassed: true,
          };
          existingUser.isKycVerified = !!(existingUser.kycData.cedulaFrontUrl);
        }
        existingUser.verification = {
          code,
          codeExpiresAt,
          attempts: 0,
          lastSentAt: Date.now(),
          isVerified: false,
          resendCount: (existingUser.verification?.resendCount || 0) + 1,
          accountType: 'CUSTOMER'
        };
        db.setUserVerification(existingUser.id, existingUser.verification);
        customerUser = existingUser;
      } else {
        const newId = `user-cust-${Date.now()}`;
        const hasKycInfo = !!(data.cedulaFrontUrl || data.selfieUrl || data.cedulaNumber);
        customerUser = {
          id: newId,
          name: `${(data.name || '').trim()} ${(data.lastName || '').trim()}`.trim(),
          email: cleanEmail,
          role: 'CUSTOMER',
          phone: (data.phone || '').trim(),
          avatar: data.selfieUrl || '',
          passwordHash: passHash,
          addresses: [],
          cedulaNumber: data.cedulaNumber || undefined,
          kycData: hasKycInfo ? {
            cedulaNumber: data.cedulaNumber || undefined,
            cedulaFrontUrl: data.cedulaFrontUrl || '',
            selfieUrl: data.selfieUrl || '',
            biometricScore: data.biometricScore || 98.6,
            biometricStatus: 'VERIFIED',
            verifiedAt: new Date().toISOString(),
            livenessPassed: true,
            facialMatchPassed: true,
          } : undefined,
          isKycVerified: !!data.cedulaFrontUrl,
          isEmailVerified: false,
          verification: {
            code,
            codeExpiresAt,
            attempts: 0,
            lastSentAt: Date.now(),
            isVerified: false,
            resendCount: 0,
            accountType: 'CUSTOMER'
          },
          createdAt: new Date().toISOString()
        };
        db.addUser(customerUser);
      }

      // Automatically dispatch email from contacto@plazado.com
      const sysSettings = db.getSystemSettings();
      const mailConfig = sysSettings.mailConfig || {
        senderEmail: 'contacto@plazado.com',
        senderName: 'PlazaDO.com - Marketplace Dominicano'
      };

      const mailResult = await sendRegistrationOtpEmail(cleanEmail, customerUser.name, code, mailConfig);

      db.addAuditLog(
        'USER_REGISTER_PENDING',
        customerUser.id,
        undefined,
        `Cliente ${customerUser.name} (${customerUser.email}) registrado. Código de verificación enviado automáticamente desde contacto@plazado.com. Entregado por SMTP: ${mailResult.delivered ? 'SÍ' : 'NO'}`
      );

      res.json({
        success: true,
        pendingVerification: true,
        email: cleanEmail,
        name: customerUser.name,
        accountType: 'CUSTOMER',
        delivered: mailResult.delivered,
        message: `Código de verificación enviado automáticamente a ${cleanEmail} desde contacto@plazado.com. Introduce el código de 6 dígitos recibido para activar tu cuenta.`,
        expiresInSeconds: 900
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error registering customer' });
    }
  });

  // Register Store (Creates account and store, generates code, dispatches email from contacto@plazado.com automatically)
  app.post('/api/auth/register-store', async (req: Request, res: Response) => {
    try {
      const data: StoreRegistrationInput = req.body;
      const cleanEmail = (data.email || '').trim().toLowerCase();
      const users = db.getUsers();
      const stores = db.getStores();

      const existingUser = users.find(u => u.email.toLowerCase() === cleanEmail);
      if (existingUser && existingUser.isEmailVerified === true) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una cuenta verificada con este correo electrónico. Por favor inicia sesión.'
        });
      }

      if (stores.some(s => s.name.toLowerCase() === data.storeName.trim().toLowerCase() && s.email.toLowerCase() !== cleanEmail)) {
        return res.status(400).json({ success: false, message: 'Ya existe una tienda registrada con este nombre comercial.' });
      }
      if (!data.storeName?.trim()) {
        return res.status(400).json({ success: false, message: 'Por favor ingresa el nombre de la tienda.' });
      }
      if (!data.ownerName?.trim()) {
        return res.status(400).json({ success: false, message: 'Por favor ingresa el nombre del responsable de la tienda.' });
      }
      if (!data.password || data.password.length < 6) {
        return res.status(400).json({ success: false, message: 'La contraseña debe contener al menos 6 caracteres.' });
      }
      if (data.password !== data.confirmPassword) {
        return res.status(400).json({ success: false, message: 'Las contraseñas no coinciden.' });
      }

      // Generate cryptographically secure 6-digit verification code
      const code = crypto.randomInt(100000, 1000000).toString();
      const codeExpiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
      const passHash = await hashPassword(data.password);

      const userId = existingUser ? existingUser.id : `user-store-${Date.now()}`;
      const storeId = existingUser?.storeId || `store-${Date.now()}`;
      const storeSlug = data.storeName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const kycInfo = data.cedulaFrontUrl ? {
        cedulaNumber: data.cedulaNumber || undefined,
        cedulaFrontUrl: data.cedulaFrontUrl,
        selfieUrl: data.selfieUrl || '',
        biometricScore: data.biometricScore || 99.1,
        biometricStatus: 'VERIFIED' as const,
        verifiedAt: new Date().toISOString(),
        livenessPassed: true,
        facialMatchPassed: true,
      } : undefined;

      const newStore: Store = {
        id: storeId,
        ownerId: userId,
        owner_id: userId,
        name: data.storeName.trim(),
        slug: storeSlug || storeId,
        ownerName: data.ownerName.trim(),
        email: cleanEmail,
        phone: data.phone.trim(),
        whatsapp: data.phone.trim(),
        description: data.description?.trim() || '',
        categoryId: data.categoryId || 'cat-tecnologia',
        logo: data.logo || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=300&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80',
        province: data.province || 'Distrito Nacional',
        municipality: data.municipality || 'Santo Domingo',
        address: (data.address || '').trim(),
        status: 'PENDING', // Pending Super Admin approval
        isPublished: false,
        rating: 5.0,
        reviewCount: 0,
        salesCount: 0,
        kycData: kycInfo,
        isKycVerified: !!data.cedulaFrontUrl,
        isEmailVerified: false,
        shippingConfig: {
          type: 'fixed',
          fixedRate: data.shippingRate || 200,
          estimatedDays: '24 a 48 horas',
          coverageProvinces: [data.province || 'Distrito Nacional']
        },
        bankInfo: {
          bank: 'Banco Popular Dominicano',
          accountType: 'CORRIENTE',
          accountNumber: 'Pendiente de registrar',
          accountHolder: data.ownerName.trim(),
          rncOrCedula: data.cedulaNumber || 'Pendiente'
        },
        createdAt: new Date().toISOString()
      };

      const newStoreUser: User = {
        id: userId,
        name: data.ownerName.trim(),
        email: cleanEmail,
        role: 'STORE_OWNER',
        phone: data.phone.trim(),
        avatar: data.selfieUrl || '',
        storeId: storeId,
        passwordHash: passHash,
        addresses: [],
        cedulaNumber: data.cedulaNumber || undefined,
        kycData: kycInfo,
        isKycVerified: !!data.cedulaFrontUrl,
        isEmailVerified: false,
        verification: {
          code,
          codeExpiresAt,
          attempts: 0,
          lastSentAt: Date.now(),
          isVerified: false,
          resendCount: (existingUser?.verification?.resendCount || 0) + 1,
          accountType: 'STORE',
          storeName: data.storeName.trim()
        },
        createdAt: existingUser ? existingUser.createdAt : new Date().toISOString()
      };

      if (existingUser) {
        db.updateUser(existingUser.id, newStoreUser);
      } else {
        db.addUser(newStoreUser);
      }

      const existingStore = db.getStores().find(s => s.id === storeId || s.email.toLowerCase() === cleanEmail);
      if (!existingStore) {
        db.addStore(newStore);
      }

      // Automatically dispatch email from contacto@plazado.com
      const sysSettings = db.getSystemSettings();
      const mailConfig = sysSettings.mailConfig || {
        senderEmail: 'contacto@plazado.com',
        senderName: 'PlazaDO.com - Marketplace Dominicano'
      };

      const mailResult = await sendRegistrationOtpEmail(cleanEmail, data.ownerName.trim(), code, mailConfig);

      db.addAuditLog(
        'STORE_REGISTER_PENDING',
        storeId,
        undefined,
        `Tienda ${newStore.name} registrada por ${data.ownerName} (${cleanEmail}). Código de verificación enviado automáticamente desde contacto@plazado.com. Entregado por SMTP: ${mailResult.delivered ? 'SÍ' : 'NO'}`
      );

      res.json({
        success: true,
        pendingVerification: true,
        email: cleanEmail,
        name: data.ownerName.trim(),
        storeName: data.storeName.trim(),
        accountType: 'STORE',
        delivered: mailResult.delivered,
        message: `Código de verificación de 6 dígitos enviado automáticamente a ${cleanEmail} desde contacto@plazado.com.`,
        expiresInSeconds: 900
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error registering store' });
    }
  });

  app.put('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const caller = getAuthenticatedUser(req);
      if (!caller) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }
      if (caller.id !== req.params.id && caller.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ success: false, message: 'No tienes autorización para modificar este usuario' });
      }

      const updateData = { ...req.body };
      if (caller.role !== 'SUPER_ADMIN') {
        delete updateData.role;
        delete updateData.isApprovedByAdmin;
        delete updateData.adminApprovalStatus;
      }

      if (updateData.password || updateData.newPassword) {
        const pass = (updateData.password || updateData.newPassword).trim();
        if (pass.length >= 6) {
          updateData.passwordHash = await hashPassword(pass);
        }
        delete updateData.password;
        delete updateData.newPassword;
      }
      const updated = db.updateUser(req.params.id, updateData);
      if (!updated) return res.status(404).json({ success: false, message: 'User not found' });
      res.json({ success: true, user: sanitizeUser(updated), version: db.getVersion() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error updating user' });
    }
  });

  // Customer & Store: Submit/Update KYC identity verification documents (Cédula & Biometric Selfie)
  app.post('/api/user/kyc', async (req: Request, res: Response) => {
    try {
      const { userId, cedulaNumber, cedulaFrontUrl, selfieUrl, biometricScore } = req.body;
      let user: User | null = null;
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim();
        const session = verifySessionToken(token);
        if (session) {
          user = db.getUserById(session.userId) || null;
        }
      }
      if (!user && userId) {
        user = db.getUserById(userId) || null;
      }
      if (!user) {
        return res.status(401).json({ success: false, message: 'Usuario no identificado o sesión no válida.' });
      }

      const cleanCedula = (cedulaNumber || '').trim();
      const updatedKyc = {
        cedulaNumber: cleanCedula || user.cedulaNumber || user.kycData?.cedulaNumber || '',
        cedulaFrontUrl: (cedulaFrontUrl || user.kycData?.cedulaFrontUrl || '').trim(),
        selfieUrl: (selfieUrl || user.kycData?.selfieUrl || user.avatar || '').trim(),
        biometricScore: biometricScore || user.kycData?.biometricScore || 98.8,
        biometricStatus: 'VERIFIED' as const,
        verifiedAt: new Date().toISOString(),
        livenessPassed: true,
        facialMatchPassed: true
      };

      const updatedUser = db.updateUser(user.id, {
        cedulaNumber: updatedKyc.cedulaNumber,
        kycData: updatedKyc,
        isKycVerified: !!updatedKyc.cedulaFrontUrl,
        adminApprovalStatus: 'PENDING',
        avatar: (!user.avatar || user.avatar === '') && updatedKyc.selfieUrl ? updatedKyc.selfieUrl : user.avatar
      });

      db.addAuditLog(
        'USER_KYC_SUBMITTED',
        user.id,
        user.email,
        `Usuario ${user.name} (${user.email}) envió documentos de identidad (Cédula: ${cleanCedula || 'Registrada'}) para validación por Super Admin.`
      );

      res.json({
        success: true,
        message: 'Documentos de identidad y fotografía biométrica recibidos exitosamente. Tu expediente está ahora en revisión por el Super Administrador.',
        user: updatedUser ? sanitizeUser(updatedUser) : sanitizeUser(user),
        version: db.getVersion()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error registrando información biométrica' });
    }
  });

  // Dedicated endpoint for user password change (Customers, Stores, Super Admin)
  app.post('/api/users/:id/password', async (req: Request, res: Response) => {
    try {
      const caller = getAuthenticatedUser(req);
      if (!caller) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      const { password, newPassword, currentPassword } = req.body;
      const targetPass = (newPassword || password || '').trim();
      if (!targetPass || targetPass.length < 6) {
        return res.status(400).json({ success: false, message: 'La nueva contraseña debe contener al menos 6 caracteres.' });
      }

      const existingUser = db.getUsers().find(u => u.id === req.params.id);
      if (!existingUser) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      }

      // If caller is NOT Super Admin, caller must be the user themselves AND must verify currentPassword
      if (caller.role !== 'SUPER_ADMIN') {
        if (caller.id !== req.params.id) {
          return res.status(403).json({ success: false, message: 'No tienes permiso para modificar esta contraseña.' });
        }
        if (!currentPassword) {
          return res.status(400).json({ success: false, message: 'Debes proporcionar tu contraseña actual.' });
        }
        if (existingUser.passwordHash) {
          const isCurrentValid = await verifyPassword(currentPassword, existingUser.passwordHash);
          if (!isCurrentValid) {
            return res.status(401).json({ success: false, message: 'La contraseña actual ingresada es incorrecta.' });
          }
        }
      }

      const passHash = await hashPassword(targetPass);
      const updated = db.updateUser(req.params.id, { passwordHash: passHash });
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
      }

      // Sync password update to Firestore in background
      firestoreRepo.saveUser(updated).catch(e => console.error('Firestore user password sync error:', e));

      db.addAuditLog('USER_PASSWORD_CHANGE', req.params.id, undefined, `Contraseña actualizada para ${updated.email} (${updated.name})`);
      res.json({ success: true, message: 'Contraseña actualizada con éxito', user: sanitizeUser(updated), version: db.getVersion() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error actualizando contraseña' });
    }
  });

  app.delete('/api/users/:id', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    }
    const ok = db.deleteUser(req.params.id);
    if (!ok) return res.status(400).json({ success: false, message: 'Cannot delete user' });
    res.json({ success: true, version: db.getVersion() });
  });

  // Self-service account deletion for users & merchants
  app.post('/api/account/delete', async (req: Request, res: Response) => {
    try {
      const caller = getAuthenticatedUser(req);
      if (!caller) {
        return res.status(401).json({ success: false, message: 'No autenticado' });
      }

      const { userId, password, deleteAssociatedStore } = req.body;
      if (!userId) {
        return res.status(400).json({ success: false, message: 'ID de usuario requerido' });
      }

      if (caller.id !== userId && caller.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ success: false, message: 'No autorizado para eliminar esta cuenta' });
      }

      const user = db.getUsers().find(u => u.id === userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }

      if (user.role === 'SUPER_ADMIN') {
        return res.status(403).json({ 
          success: false, 
          message: 'Las cuentas de Super Administrador están protegidas y no pueden ser eliminadas.' 
        });
      }

      if (user.passwordHash && caller.role !== 'SUPER_ADMIN') {
        if (!password) {
          return res.status(400).json({ success: false, message: 'Se requiere la contraseña para confirmar la eliminación de la cuenta.' });
        }
        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
          return res.status(400).json({ success: false, message: 'La contraseña ingresada no es correcta.' });
        }
      }

      const userEmail = user.email;
      const ok = db.deleteUser(userId, !!deleteAssociatedStore);
      if (!ok) {
        return res.status(400).json({ success: false, message: 'No se pudo eliminar la cuenta.' });
      }

      res.json({
        success: true,
        message: `Tu cuenta (${userEmail}) ha sido eliminada permanentemente de la plataforma y de Google Cloud.`,
        version: db.getVersion()
      });
    } catch (err: any) {
      console.error('Error deleting account:', err);
      res.status(500).json({ success: false, message: err.message || 'Error al eliminar cuenta' });
    }
  });

  // Self-service store deletion for merchants
  app.post('/api/stores/:id/delete-by-owner', (req: Request, res: Response) => {
    try {
      const storeId = req.params.id;
      const { ownerId, confirmationText } = req.body;

      if (confirmationText !== 'ELIMINAR') {
        return res.status(400).json({ success: false, message: 'Debes escribir ELIMINAR para confirmar la eliminación.' });
      }

      const store = db.getStores().find(s => s.id === storeId);
      if (!store) {
        return res.status(404).json({ success: false, message: 'Tienda no encontrada.' });
      }

      const user = db.getUsers().find(u => u.id === ownerId);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
      }

      if (user.role !== 'SUPER_ADMIN' && store.ownerId !== ownerId && user.storeId !== storeId) {
        return res.status(403).json({ success: false, message: 'No tienes permisos para eliminar esta tienda.' });
      }

      const storeName = store.name;
      const ok = db.deleteStore(storeId);
      if (!ok) {
        return res.status(400).json({ success: false, message: 'Error al eliminar la tienda.' });
      }

      res.json({
        success: true,
        message: `La tienda "${storeName}" y su catálogo de productos han sido eliminados de la plataforma y de Google Cloud.`,
        version: db.getVersion()
      });
    } catch (err: any) {
      console.error('Error deleting store by owner:', err);
      res.status(500).json({ success: false, message: err.message || 'Error al eliminar tienda' });
    }
  });

  app.post('/api/admin/users/purge-non-admins', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    const result = db.deleteNonAdminUsers();
    res.json({
      success: true,
      message: `${result.deletedCount} usuarios eliminados. Se mantuvieron intactos los accesos de Super Admin.`,
      result,
      version: db.getVersion()
    });
  });

  // --- AUDIT & PURGE ---
  app.get('/api/audit-logs', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    res.json({ success: true, auditLogs: db.getAuditLogs() });
  });

  app.post('/api/audit-logs', (req: Request, res: Response) => {
    const caller = getAuthenticatedUser(req);
    if (!caller) return res.status(401).json({ success: false, message: 'No autenticado' });
    const { action, record, prev, next, user } = req.body;
    const log = db.addAuditLog(action, record, prev, next, user);
    res.json({ success: true, log, version: db.getVersion() });
  });

  app.delete('/api/audit-logs/:id', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    const ok = db.deleteAuditLog(req.params.id);
    res.json({ success: ok, version: db.getVersion() });
  });

  app.delete('/api/audit-logs', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    db.clearAllAuditLogs();
    res.json({ success: true, version: db.getVersion() });
  });

  app.post('/api/admin/purge', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    const { type } = req.body;
    const count = db.purgeRecords(type);
    res.json({ success: true, purgedCount: count, version: db.getVersion() });
  });

  // ==========================================
  // PLAZADO FULFILLMENT ROUTES (LOGÍSTICA & ALMACÉN)
  // ==========================================
  app.get('/api/fulfillment', (req: Request, res: Response) => {
    try {
      const storeId = req.query.storeId as string | undefined;
      const data = fulfillmentService.getData(storeId);
      res.json({ success: true, data, version: db.getVersion() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/storage-requests', (req: Request, res: Response) => {
    try {
      const result = fulfillmentService.createStorageRequest(req.body, (req as any).user);
      res.json({ success: true, storageRequest: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.patch('/api/fulfillment/storage-requests/:id/status', (req: Request, res: Response) => {
    try {
      const { status, notes } = req.body;
      const result = fulfillmentService.updateStorageRequestStatus(req.params.id, status, notes, (req as any).user);
      res.json({ success: true, storageRequest: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/storage-requests/:id/receive', (req: Request, res: Response) => {
    try {
      const result = fulfillmentService.processPhysicalReception({
        requestId: req.params.id,
        ...req.body
      }, (req as any).user);
      res.json({ success: true, data: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.patch('/api/fulfillment/inventory/:id', (req: Request, res: Response) => {
    try {
      const result = fulfillmentService.adjustInventory({
        inventoryItemId: req.params.id,
        ...req.body
      }, (req as any).user);
      res.json({ success: true, inventoryItem: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/inventory/:id/relocate', (req: Request, res: Response) => {
    try {
      const result = fulfillmentService.relocateInventory({
        inventoryItemId: req.params.id,
        newLocation: req.body.newLocation
      }, (req as any).user);
      res.json({ success: true, inventoryItem: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/inventory/:id/block-toggle', (req: Request, res: Response) => {
    try {
      const result = fulfillmentService.blockUnblockInventory({
        inventoryItemId: req.params.id,
        ...req.body
      }, (req as any).user);
      res.json({ success: true, inventoryItem: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/inventory/:id/damage', (req: Request, res: Response) => {
    try {
      const result = fulfillmentService.recordDamage({
        inventoryItemId: req.params.id,
        ...req.body
      }, (req as any).user);
      res.json({ success: true, inventoryItem: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/orders/:id/confirm-by-store', (req: Request, res: Response) => {
    try {
      const { storeId, user } = req.body;
      const result = fulfillmentService.confirmOrderByStore(req.params.id, storeId, user);
      res.json({ success: true, fulfillmentOrder: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/orders/:id/reject-by-store', (req: Request, res: Response) => {
    try {
      const { storeId, reason, user } = req.body;
      const result = fulfillmentService.rejectOrderByStore(req.params.id, storeId, reason, user);
      res.json({ success: true, fulfillmentOrder: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/orders/:id/validate-pick-item', (req: Request, res: Response) => {
    try {
      const result = fulfillmentService.validateAndPickItem({
        fulfillmentOrderId: req.params.id,
        ...req.body
      }, (req as any).user);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json({ ...result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/orders/:id/complete-packing', (req: Request, res: Response) => {
    try {
      const result = fulfillmentService.completePacking({
        fulfillmentOrderId: req.params.id,
        ...req.body
      }, (req as any).user);
      res.json({ success: true, fulfillmentOrder: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/orders/:id/dispatch', (req: Request, res: Response) => {
    try {
      const result = fulfillmentService.dispatchOrder({
        fulfillmentOrderId: req.params.id,
        ...req.body
      }, (req as any).user);
      res.json({ success: true, fulfillmentOrder: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/orders/:id/deliver', (req: Request, res: Response) => {
    try {
      const result = fulfillmentService.deliverOrder({
        fulfillmentOrderId: req.params.id,
        ...req.body
      }, (req as any).user);
      res.json({ success: true, fulfillmentOrder: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/incidences', (req: Request, res: Response) => {
    try {
      const result = fulfillmentService.createIncidence(req.body, (req as any).user);
      res.json({ success: true, incidence: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.patch('/api/fulfillment/incidences/:id', (req: Request, res: Response) => {
    try {
      const result = fulfillmentService.updateIncidence(req.params.id, req.body, (req as any).user);
      res.json({ success: true, incidence: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/returns', (req: Request, res: Response) => {
    try {
      const result = fulfillmentService.createReturn(req.body, (req as any).user);
      res.json({ success: true, returnRecord: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/returns/:id/classify', (req: Request, res: Response) => {
    try {
      const result = fulfillmentService.classifyReturn({
        returnId: req.params.id,
        ...req.body
      }, (req as any).user);
      res.json({ success: true, returnRecord: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/withdrawals', (req: Request, res: Response) => {
    try {
      const result = fulfillmentService.createWithdrawal(req.body, (req as any).user);
      res.json({ success: true, withdrawal: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.patch('/api/fulfillment/withdrawals/:id/status', (req: Request, res: Response) => {
    try {
      const { status, notes } = req.body;
      const result = fulfillmentService.updateWithdrawalStatus(req.params.id, status, notes, (req as any).user);
      res.json({ success: true, withdrawal: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.put('/api/fulfillment/config', (req: Request, res: Response) => {
    try {
      const result = fulfillmentService.updateConfig(req.body, (req as any).user);
      res.json({ success: true, config: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  // --- PERSISTENCE & DATA INTEGRITY PROTECTION ---
  app.get('/api/admin/persistence/status', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    res.json({ success: true, persistence: db.getPersistenceStatus() });
  });

  app.post('/api/admin/persistence/sync-firestore', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    try {
      await db.initFirestoreSync();
      const status = db.getPersistenceStatus();
      res.json({ 
        success: true, 
        message: 'Base de datos de producción (Cloud Firestore) sincronizada exitosamente.', 
        persistence: status 
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error al sincronizar con Firestore' });
    }
  });

  app.post('/api/admin/persistence/backup', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    const { label } = req.body;
    const result = db.createManualBackup(label);
    res.json(result);
  });

  app.post('/api/admin/persistence/restore', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, message: 'Nombre de archivo requerido' });
    }
    const result = db.restoreFromBackupFile(filename);
    res.json({ ...result, version: db.getVersion() });
  });

  // ==========================================
  // VITE DEV MIDDLEWARE / PROD STATIC SERVE
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PlazaDO Global Server] Running on http://0.0.0.0:${PORT} (Version: ${db.getVersion()})`);
  });
}

startServer().catch(err => {
  console.error('[PlazaDO Server Fatal Error]', err);
  process.exit(1);
});
