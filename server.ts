import { registerPublicMedia } from './server/public-media';
import { registerPayPalProduction } from './server/paypal-production';
import { registerRecovery } from './server/recovery-routes';
import { registerPayPalCheckout } from './server/paypal-routes';
import { testPayPalCredentials } from './server/paypal-credentials';
import { validateOrders, checkoutOrderId } from './server/order-validation';
import { sanitizeMarketplaceState, safeUser, safeOrder, publicSettings, editableFields, STORE_EDIT_FIELDS, PRODUCT_EDIT_FIELDS } from './server/public-state';
import 'dotenv/config';
import { validateProductOffer } from './src/utils/productOffers';
import { LEGAL_VERSION, hasCurrentLegalConsent, registrationDocuments } from './src/legal/registration';
import express, { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { db } from './server/database';
import { fulfillmentService } from './server/fulfillment-service';
import { cloudSqlRepo } from './server/cloudsql-repository';
import { firestoreRepo } from './server/firestore-repository';
import { hashPassword, verifyPassword } from './src/utils/security';
import { User, Store, CustomerRegistrationInput, StoreRegistrationInput, UserRole, isProductPubliclyVisible, isStorePubliclyVisible } from './src/types';
import { sendRegistrationOtpEmail, sendAccountApprovalEmail, verifySmtpConnection, isMailConfigured, mailProvider } from './server/mailer-service';
import { generateProductDescription } from './server/ai-service';
import { storesDb } from './server/stores-database';

const SESSION_SECRET: string = process.env.SESSION_SECRET || '';
if (!SESSION_SECRET.trim()) {
  throw new Error('CRITICAL SECURITY ERROR: SESSION_SECRET is required as an environment variable');
}

export function sanitizeUser(user: User): Omit<User, 'passwordHash'> { return safeUser(user); }

export function createSessionToken(user: User): string {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    storeId: user.storeId,
    authVersion: user.authVersion || 0,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (user.role === 'SUPER_ADMIN' ? 8 * 60 * 60 : 7 * 24 * 60 * 60)
  };
  const head = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(`${head}.${body}`).digest('base64url');
  return `${head}.${body}.${sig}`;
}

export function verifySessionToken(token: string): { userId: string; email: string; role: string; storeId?: string; authVersion?:number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [head, body, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(`${head}.${body}`).digest('base64url');
    const actual = Buffer.from(sig), expected = Buffer.from(expectedSig);
    if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!Number.isFinite(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000) || typeof payload.userId !== 'string') return null;
    return payload;
  } catch (e) {
    return null;
  }
}

export function getAuthenticatedUser(req: Request): User | null {
  if(Object.hasOwn(req,'durableIdentity'))return (req as any).durableIdentity;
  const authHeader = req.headers.authorization;
  const cookieToken=req.headers.cookie?.split(';').map(part=>part.trim()).find(part=>part.startsWith('plazado_session='))?.slice('plazado_session='.length);
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : cookieToken;
  if(!token)return null;
  const session = verifySessionToken(token);
  if (!session) return null;
  const user = db.getUserById(session.userId);
  if(user && (session.authVersion || 0)!==(user.authVersion || 0)) return null;
  return user || null;
}

export function getAuthenticatedSuperAdmin(req: Request): User | null {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'SUPER_ADMIN') return null;
  return user;
}

function sanitizeBootstrapForCaller(rawState: any, caller: User | null) {
  return sanitizeMarketplaceState(rawState, caller);
}

async function startServer() {
  // Protect production identities before loading application state.
  // The recovery routine only recreates records missing by ID; it never overwrites valid live stores/users.
  console.log('[PlazaDO] Running automatic production backup/recovery protection...');
  try {
    const protectionResult = await firestoreRepo.backupAndRecoverProductionRecords();
    console.log('[PlazaDO] Production records protected:', protectionResult);
  } catch (err) {
    console.error('[PlazaDO] Production protection warning:', err);
  }

  console.log('[PlazaDO] Initializing Firestore Production synchronization as primary source of truth...');
  // Do not race Firestore against a timeout and then start Cloud SQL concurrently.
  // That race allowed Cloud SQL to re-inject stale users while Firestore was still loading.
  try {
    await db.initFirestoreSync();
  } catch (err: any) {
    console.warn('[PlazaDO] Firestore sync warning on startup:', err.message || err);
  }

  console.log('[PlazaDO] Initializing Cloud SQL synchronization after Firestore authority is established...');
  db.initCloudSqlSync().catch((err: any) => {
    console.error('[PlazaDO] Cloud SQL sync background warning:', err);
  });

  // Refresh authoritative data across instances without racing local transactions.
  const requestedRefreshMs=Number(process.env.FIRESTORE_REFRESH_INTERVAL_MS);
  const refreshIntervalMs=Number.isFinite(requestedRefreshMs) && requestedRefreshMs>=300000 ? requestedRefreshMs : 300000;
  let refreshing=false, refreshFailures=0, nextFirestoreAttempt=0;
  const refreshTimer=setInterval(()=>{
    if(refreshing || !firestoreRepo.isAdminReady() || Date.now()<nextFirestoreAttempt)return;
    refreshing=true;
    db.refreshDurableState().then(()=>{refreshFailures=0;nextFirestoreAttempt=0;}).catch(()=>{
      refreshFailures+=1;
      nextFirestoreAttempt=Date.now()+Math.min(3600000,refreshIntervalMs*Math.pow(2,Math.min(refreshFailures,10)));
      console.error('[Firestore] Durable refresh failed; previous state preserved; retries backed off');
    }).finally(()=>{refreshing=false;});
  },refreshIntervalMs);
  refreshTimer.unref();

  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  app.set('trust proxy', 1);
  let smtpVerified=false;
  let smtpFailureReason:string | undefined;
  const verifyPilotMail = async () => {
    const config=db.getSystemSettings().mailConfig;
    if(!isMailConfigured(config)) {smtpVerified=false;smtpFailureReason=mailProvider()==='MANUAL'?'MANUAL_DELIVERY_REQUIRED':mailProvider()==='RESEND'?'MISSING_RESEND_API_KEY':'MISSING_SMTP_PASS';return;}
    const result=await verifySmtpConnection(config);
    smtpVerified=result.ok;smtpFailureReason=result.reason;
  };
  // SMTP authentication check sends no email and does not delay the HTTP listener.
  void verifyPilotMail().catch(()=>{smtpVerified=false;});
  setInterval(()=>{void verifyPilotMail().catch(()=>{smtpVerified=false;});},300000).unref();


  // Keep an independent durable copy refreshed while production is running.
  // This protects user-created stores/users from accidental disappearance between deployments.
  let protectingRecords=false;
  setInterval(() => {
    if(protectingRecords || !db.isFirestoreConnected() || Date.now()<nextFirestoreAttempt)return;
    protectingRecords=true;
    firestoreRepo.backupAndRecoverProductionRecords().catch(() => {
      nextFirestoreAttempt=Date.now()+3600000;
      console.error('[PlazaDO] Scheduled production protection failed; existing backups preserved');
    }).finally(()=>{protectingRecords=false;});
  }, 60 * 60 * 1000).unref();

  // Production security headers
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(self)');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    if(process.env.NODE_ENV==='production') res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' https://www.paypal.com https://www.paypalobjects.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' https://*.paypal.com https://*.paypalobjects.com https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com; frame-src https://*.paypal.com https://*.paypalobjects.com; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests");
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // Verify revocation and current privileges against durable identity for authenticated API requests.
  app.use('/api',async(req,res,next)=>{
    if(req.path.startsWith('/public-media/') || req.path.startsWith('/health'))return next();
    const auth=req.headers.authorization;
    const cookie=req.headers.cookie?.split(';').map(part=>part.trim()).find(part=>part.startsWith('plazado_session='))?.slice('plazado_session='.length);
    const token=auth?.startsWith('Bearer ')?auth.slice(7).trim():cookie;
    (req as any).durableIdentity=null;
    if(!token)return next();
    const session=verifySessionToken(token);if(!session)return next();
    try {
      const user=await firestoreRepo.getDurableUser(session.userId);
      if(user && (user.authVersion || 0)===(session.authVersion || 0) && user.adminApprovalStatus!=='REJECTED') (req as any).durableIdentity=user;
      return next();
    }catch{return res.status(503).json({success:false,message:'No se pudo validar la sesión. Reintenta.'});}
  });

  // Lightweight in-memory abuse protection for authentication/verification endpoints.
  // It does not touch production data and resets naturally when the process restarts.
  const securityRateBuckets = new Map<string, { count: number; resetAt: number }>();
  app.use(['/api/auth','/api/admin'], (req, res, next) => {
    const ip = req.ip || 'unknown';
    const key = `${ip}:${req.path}`;
    const now = Date.now();
    const existing = securityRateBuckets.get(key);
    const bucket = !existing || existing.resetAt <= now
      ? { count: 0, resetAt: now + 15 * 60 * 1000 }
      : existing;
    bucket.count += 1;
    securityRateBuckets.set(key, bucket);
    res.setHeader('X-RateLimit-Limit', '60');
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, 60 - bucket.count)));
    if (bucket.count > 60) {
      return res.status(429).json({ error: 'Demasiadas solicitudes. Intenta nuevamente en unos minutos.' });
    }
    next();
  });

  // Periodic cleanup prevents the rate-limit map from growing indefinitely.
  setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of securityRateBuckets.entries()) {
      if (bucket.resetAt <= now) securityRateBuckets.delete(key);
    }
  }, 15 * 60 * 1000);

  // Cookie-authenticated writes must originate from this application.
  app.use('/api',(req,res,next)=>{
    if(!['GET','HEAD','OPTIONS'].includes(req.method) && req.headers.cookie?.includes('plazado_session=')){
      const origin=req.get('origin');
      let sameOrigin=false;try{sameOrigin=!!origin && new URL(origin).host===req.get('host');}catch{}
      if(!sameOrigin && req.get('sec-fetch-site')!=='same-origin')return res.status(403).json({success:false,message:'Origen de solicitud no permitido.'});
    }
    next();
  });

  // Bounded JSON uploads; privileged uploads receive a larger limit.
  app.use('/api', (req,res,next)=>{const auth=getAuthenticatedUser(req);const upload=auth && (auth.role==='SUPER_ADMIN' || (auth.role==='STORE_OWNER' && /^\/products(?:\/|$)/.test(req.path)) || /^\/users\/[^/]+\/kyc$/.test(req.path));express.json({limit:upload?'25mb':'10mb'})(req,res,next);});
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Disable caching on API responses so all clients get immediate fresh state
  app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  app.use((error:any,_req:Request,res:Response,next:any)=>{if(error?.type==='entity.too.large')return res.status(413).json({success:false,message:'El archivo supera el tamaño permitido.'});if(error instanceof SyntaxError)return res.status(400).json({success:false,message:'Solicitud inválida.'});next(error);});

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', version: db.getVersion(), timestamp: new Date().toISOString() });
  });

  app.get('/api/health/ready', (_req:Request,res:Response) => {
    const settings=db.getSystemSettings(), mail=settings.mailConfig;
    const checks={firebaseAdmin:firestoreRepo.isAdminReady(),firestoreLoaded:db.isFirestoreConnected(),smtpConfigured:isMailConfigured(mail),smtpVerified};
    const manual=mailProvider()==='MANUAL';
    const ready=checks.firebaseAdmin && checks.firestoreLoaded && (manual || (checks.smtpConfigured && checks.smtpVerified));
    res.status(ready?200:503).json({status:ready?'ready':'blocked',mode:'CASH_ON_DELIVERY_PILOT',registrationDelivery:manual?'SUPER_ADMIN_MANUAL':'AUTOMATIC_EMAIL',automaticEmailReady:checks.smtpVerified,mailProvider:mailProvider(),checks,...(!smtpVerified && smtpFailureReason ? {smtpFailureReason}:{}),timestamp:new Date().toISOString()});
  });

  const publicMedia=registerPublicMedia(app,()=>db.getFullState());
  app.post('/api/auth/logout',(_req,res)=>{res.clearCookie('plazado_session',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/'});res.json({success:true});});
  registerRecovery(app,db,getAuthenticatedSuperAdmin);
  registerPayPalProduction(app,db,getAuthenticatedSuperAdmin);
  app.post('/api/admin/commissions/cash-receipts',async(req,res)=>{
    const actor=getAuthenticatedSuperAdmin(req);if(!actor)return res.status(403).json({success:false});
    try {const result=await db.recordCashCommission(req.body.storeId,req.body.amount,req.body.reference,actor.id);res.json({...result,version:db.getVersion()});}
    catch(error:any){res.status(400).json({success:false,message:error.message || 'No se guardó el cobro'});}
  });

  // Global Bootstrap (Single-call fast hydration for all clients/devices)
  app.get('/api/bootstrap', (req: Request, res: Response) => {
    const caller = getAuthenticatedUser(req);
    const rawState = db.getFullState();
    const data = publicMedia.project(sanitizeBootstrapForCaller(rawState, caller));
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
    const data = publicMedia.project(sanitizeBootstrapForCaller(rawState, caller));
    res.json({
      hasUpdates: true,
      data,
      version: rawState.version
    });
  });

  // --- STORES ---
  app.get('/api/stores', (req: Request, res: Response) => {
    res.json({ success: true, stores: sanitizeMarketplaceState(db.getFullState(), getAuthenticatedUser(req)).stores });
  });

  app.post('/api/stores', async (req: Request, res: Response) => {
    try {
    const caller = getAuthenticatedUser(req);
    if (!caller) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    if (caller.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Solo Super Admin puede crear tiendas directamente vía API.' });
    }
    try {
      const storeData = req.body;
      const newStore = await db.addStore(storeData);
      res.json({ success: true, store: newStore, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Error creating store' });
    }
    } catch(error:any) {res.status(503).json({success:false,message:error.message || 'No se pudo guardar el cambio'}); }
  });

  app.put('/api/stores/:id', async (req: Request, res: Response) => {
    try {
    const caller = getAuthenticatedUser(req);
    if (!caller) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    if (caller.role !== 'SUPER_ADMIN' && caller.storeId !== req.params.id) {
      return res.status(403).json({ success: false, message: 'No tienes autorización para editar esta tienda' });
    }
    const changes = caller.role === 'SUPER_ADMIN' ? { ...req.body } : editableFields(req.body, STORE_EDIT_FIELDS);
    delete changes.id; delete changes.ownerId; delete changes.owner_id;
    const updated = await db.updateStore(req.params.id, changes);
    if (!updated) return res.status(404).json({ success: false, message: 'Store not found' });
    res.json({ success: true, store: updated, version: db.getVersion() });
    } catch(error:any) {res.status(503).json({success:false,message:error.message || 'No se pudo guardar el cambio'}); }
  });

  app.patch('/api/stores/:id/status', async (req: Request, res: Response) => {
    try {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    }
    const { status, reason } = req.body;
    const updated = await db.updateStoreStatus(req.params.id, status, reason);
    if (!updated) return res.status(404).json({ success: false, message: 'Store not found' });
    res.json({ success: true, store: updated, version: db.getVersion() });
    } catch(error:any) {res.status(503).json({success:false,message:error.message || 'No se pudo guardar el cambio'}); }
  });

  app.patch('/api/stores/:id/toggle-publish', async (req: Request, res: Response) => {
    try {
    const caller = getAuthenticatedUser(req);
    if (!caller) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    if (caller.role !== 'SUPER_ADMIN' && caller.storeId !== req.params.id) {
      return res.status(403).json({ success: false, message: 'No tienes autorización para publicar/ocultar esta tienda' });
    }
    const updated = await db.toggleStorePublish(req.params.id);
    if (!updated) return res.status(404).json({ success: false, message: 'Store not found' });
    res.json({ success: true, store: updated, version: db.getVersion() });
    } catch(error:any) {res.status(503).json({success:false,message:error.message || 'No se pudo guardar el cambio'}); }
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

      if (!password || password.length < 10 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
        return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 10 caracteres e incluir mayúscula, minúscula y número.' });
      }

      const passHash = await hashPassword(password);
      const result = await db.assignStoreAdmin(req.params.id, cleanEmail, passHash, name, phone);

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
    res.json({ success: true, products: sanitizeMarketplaceState(db.getFullState(), getAuthenticatedUser(req)).products });
  });

  app.post('/api/products', async (req: Request, res: Response) => {
    const caller = getAuthenticatedUser(req);
    if (!caller) return res.status(401).json({ success: false, message: 'No autenticado' });
    if (caller.role !== 'SUPER_ADMIN' && caller.role !== 'STORE_OWNER') {
      return res.status(403).json({ success: false, message: 'No autorizado para crear productos' });
    }
    try {
      const productData = caller.role === 'SUPER_ADMIN' ? { ...req.body } : editableFields(req.body, PRODUCT_EDIT_FIELDS);
      if (caller.role === 'STORE_OWNER') {
        if (!caller.storeId) return res.status(403).json({ success: false, message: 'Usuario sin tienda asignada' });
        // Never trust a storeId supplied by the client.
        productData.storeId = caller.storeId;
      }
      const offerError = validateProductOffer(productData.price, productData.promoPrice);
      if (offerError) return res.status(400).json({ success: false, message: offerError });
      const newProd = await db.addProduct(productData);
      res.json({ success: true, product: newProd, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Error creating product' });
    }
  });

  app.put('/api/products/:id', async (req: Request, res: Response) => {
    const caller = getAuthenticatedUser(req);
    if (!caller) return res.status(401).json({ success: false, message: 'No autenticado' });
    const existing = db.getProducts().find((p: any) => p.id === req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });
    if (caller.role !== 'SUPER_ADMIN' && (caller.role !== 'STORE_OWNER' || caller.storeId !== existing.storeId)) {
      return res.status(403).json({ success: false, message: 'No puedes modificar productos de otra tienda' });
    }
    const safeBody = caller.role === 'SUPER_ADMIN' ? { ...req.body } : editableFields(req.body, PRODUCT_EDIT_FIELDS);
    delete safeBody.id;
    if (caller.role !== 'SUPER_ADMIN') {
      safeBody.storeId = existing.storeId;
      if (existing.isFulfillment || db.getFullState().fulfillmentInventory?.some(item => item.productId === existing.id)) delete safeBody.stock;
    }
    if (Object.hasOwn(safeBody, 'price') || Object.hasOwn(safeBody, 'promoPrice')) {
      const offerError = validateProductOffer(safeBody.price ?? existing.price, Object.hasOwn(safeBody, 'promoPrice') ? safeBody.promoPrice : existing.promoPrice);
      if (offerError) return res.status(400).json({ success: false, message: offerError });
    }
    try {
      const updated = await db.updateProduct(req.params.id, safeBody);
      res.json({ success: true, product: updated, version: db.getVersion() });
    } catch (err: any) {
      res.status(503).json({ success: false, message: 'No se pudo guardar el producto' });
    }
  });

  app.delete('/api/products/:id', (req: Request, res: Response) => {
    const caller = getAuthenticatedUser(req);
    if (!caller) return res.status(401).json({ success: false, message: 'No autenticado' });
    const existing = db.getProducts().find((p: any) => p.id === req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });
    if (caller.role !== 'SUPER_ADMIN' && (caller.role !== 'STORE_OWNER' || caller.storeId !== existing.storeId)) {
      return res.status(403).json({ success: false, message: 'No puedes eliminar productos de otra tienda' });
    }
    const ok = db.deleteProduct(req.params.id);
    res.json({ success: ok, version: db.getVersion() });
  });

  app.post('/api/products/clean-test', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    const cleaned = db.cleanTestProducts();
    res.json({ success: true, cleanedCount: cleaned, version: db.getVersion() });
  });

  // --- AI PRODUCT DESCRIPTION AGENT ---
  app.post('/api/ai/generate-product-description', async (req: Request, res: Response) => {
    try {
      const caller = getAuthenticatedUser(req);
      if (!caller) return res.status(401).json({ success: false, message: 'No autenticado' });
      if (caller.role !== 'SUPER_ADMIN' && caller.role !== 'STORE_OWNER') return res.status(403).json({ success: false, message: 'Acceso denegado' });
      const { productName, categoryName, storeName, price, promoPrice, tone, keywords } = req.body;
      if (!productName || typeof productName !== 'string' || !productName.trim()) {
        return res.status(400).json({ success: false, message: 'El nombre del producto es obligatorio para generar la descripción.' });
      }

      const result = await generateProductDescription({
        productName: productName.trim(),
        categoryName: typeof categoryName === 'string' ? categoryName.trim() : undefined,
        storeName: typeof storeName === 'string' ? storeName.trim() : undefined,
        price: price ? Number(price) : undefined,
        promoPrice: promoPrice ? Number(promoPrice) : undefined,
        tone: ['persuasive', 'technical', 'premium', 'concise'].includes(tone) ? tone : 'persuasive',
        keywords: typeof keywords === 'string' ? keywords.trim() : undefined
      });

      res.json({
        success: true,
        ...result
      });
    } catch (err: any) {
      console.error('[AI Product Description Agent Error]:', err);
      res.status(500).json({ success: false, message: err.message || 'Error generando descripción con IA' });
    }
  });

  // --- CATEGORIES ---
  app.get('/api/categories', (req: Request, res: Response) => {
    res.json({ success: true, categories: db.getCategories() });
  });

  app.post('/api/categories', async (req: Request, res: Response) => {
    try {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    const cat = await db.addCategory(req.body);
    res.json({ success: true, category: cat, version: db.getVersion() });
    }catch(error:any){res.status(503).json({success:false,message:error.message || 'No se pudo guardar la configuración.'});}
  });

  app.put('/api/categories/:id', async (req: Request, res: Response) => {
    try {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    const cat = await db.updateCategory(req.params.id, req.body);
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, category: cat, version: db.getVersion() });
    }catch(error:any){res.status(503).json({success:false,message:error.message || 'No se pudo guardar la configuración.'});}
  });

  app.delete('/api/categories/:id', async (req: Request, res: Response) => {
    try {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    const result = await db.deleteCategory(req.params.id);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message || 'No se pudo eliminar la categoría' });
    }
    res.json({ success: true, version: db.getVersion() });
    }catch(error:any){res.status(503).json({success:false,message:error.message || 'No se pudo guardar la configuración.'});}
  });

  app.post('/api/categories/merge', async (req: Request, res: Response) => {
    try {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    const { sourceId, targetId } = req.body;
    const ok = await db.mergeCategories(sourceId, targetId);
    res.json({ success: ok, version: db.getVersion() });
    }catch(error:any){res.status(503).json({success:false,message:error.message || 'No se pudo guardar la configuración.'});}
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

  app.post('/api/specifications', async (req: Request, res: Response) => {
    try {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado' });
    const spec = await db.addSpecification(req.body);
    res.json({ success: true, specification: spec, version: db.getVersion() });
    }catch(error:any){res.status(503).json({success:false,message:error.message || 'No se pudo guardar la configuración.'});}
  });

  app.put('/api/specifications/:id', async (req: Request, res: Response) => {
    try {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado' });
    const spec = await db.updateSpecification(req.params.id, req.body);
    if (!spec) return res.status(404).json({ success: false, message: 'Specification not found' });
    res.json({ success: true, specification: spec, version: db.getVersion() });
    }catch(error:any){res.status(503).json({success:false,message:error.message || 'No se pudo guardar la configuración.'});}
  });

  app.delete('/api/specifications/:id', async (req: Request, res: Response) => {
    try {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado' });
    const ok = await db.deleteSpecification(req.params.id);
    res.json({ success: ok, version: db.getVersion() });
    }catch(error:any){res.status(503).json({success:false,message:error.message || 'No se pudo guardar la configuración.'});}
  });

  // --- SETTINGS (Super Admin platform_settings) ---
  app.get('/api/settings', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    const settings = db.getSystemSettings();
    if (admin) {
      return res.json({ success: true, settings });
    }
    const safeSettings = publicSettings(settings);
    res.json({ success: true, settings: safeSettings });
  });

  app.put('/api/settings', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    }
    try {
    const updated = await db.updateSystemSettings(req.body);
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
    } catch (error: any) {
      const invalidRate = error.message === 'El porcentaje de comisión debe ser un número entre 0 y 100.';
      res.status(invalidRate ? 400 : 503).json({ success: false, message: invalidRate ? error.message : 'No se pudo guardar la configuración de forma permanente. Intenta nuevamente.' });
    }
  });

  // --- CONFIGURACIÓN DE PAGOS & PROVEEDORES CENTRALES (PLAZADO.COM) ---
  app.get('/api/payment-gateways', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    res.json({ success: true, gateways: db.getPaymentGateways(true) });
  });

  app.get('/api/payment-gateways/active', (req: Request, res: Response) => {
    const gateway = db.getActivePaymentGateway();
    res.json({ success: true, activeGateway: gateway ? editableFields(gateway, ['id','providerKey','providerName','currency','isActive','environment']) : null });
  });

  app.post('/api/payment-gateways', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    try {
      const saved = await db.savePaymentGateway(req.body);
      res.json({ success: true, gateway: saved, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Error guardando proveedor de pago' });
    }
  });

  app.post('/api/payment-gateways/:id/test', async (req: Request, res: Response) => {
    if (!getAuthenticatedSuperAdmin(req)) return res.status(403).json({success:false,message:'Acceso denegado'});
    const gateway = db.getPaymentGatewayById(req.params.id, false);
    if (!gateway) return res.status(404).json({success:false,message:'Pasarela no encontrada'});
    if (gateway.providerKey !== 'PAYPAL') return res.status(400).json({success:false,message:'Este proveedor todavía no dispone de una prueba de conexión real.'});
    try {
      await testPayPalCredentials(gateway);
      res.json({success:true,message:`Credenciales PayPal verificadas (${gateway.environment}). Esta prueba no realiza cobros.`});
    } catch (error: any) {
      res.status(400).json({success:false,message:error.message});
    }
  });

  app.put('/api/payment-gateways/:id/activate', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    try {
      const ok = await db.setActivePaymentGateway(req.params.id);
      if (!ok) return res.status(404).json({ success: false, message: 'Proveedor de pago no encontrado' });
      res.json({ success: true, activeGatewayId: req.params.id, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Error activando proveedor de pago' });
    }
  });

  app.delete('/api/payment-gateways/:id', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    try {
      const ok = await db.deletePaymentGateway(req.params.id);
      res.json({ success: ok, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Error eliminando proveedor de pago' });
    }
  });

  // --- GESTIÓN DE PUBLICIDAD & ESPACIOS PUBLICITARIOS ---
  app.get('/api/advertising/campaigns', (req: Request, res: Response) => {
    const admin=getAuthenticatedSuperAdmin(req);
    res.json({ success: true, campaigns: admin?db.getAdvertisements():db.getActiveAdvertisements() });
  });

  app.get('/api/advertising/active', (req: Request, res: Response) => {
    const placement = typeof req.query.placement === 'string' ? req.query.placement : undefined;
    const device = typeof req.query.device === 'string' ? req.query.device : undefined;
    res.json({ success: true, ads: db.getActiveAdvertisements(placement, device) });
  });

  app.post('/api/advertising/campaigns', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    try {
      const ad = await db.addAdvertisement(req.body);
      res.json({ success: true, ad, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Error creando publicidad' });
    }
  });

  app.put('/api/advertising/campaigns/:id', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    try {
      const ad = await db.updateAdvertisement(req.params.id, req.body);
      if (!ad) return res.status(404).json({ success: false, message: 'Publicidad no encontrada' });
      res.json({ success: true, ad, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message || 'Error actualizando publicidad' });
    }
  });

  app.patch('/api/advertising/campaigns/:id/toggle', async (req: Request, res: Response) => {
    try {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    const ok = await db.toggleAdvertisementStatus(req.params.id);
    res.json({ success: ok, version: db.getVersion() });
    }catch(error:any){res.status(503).json({success:false,message:error.message || 'No se pudo guardar la configuración.'});}
  });

  app.delete('/api/advertising/campaigns/:id', async (req: Request, res: Response) => {
    try {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    const ok = await db.deleteAdvertisement(req.params.id);
    res.json({ success: ok, version: db.getVersion() });
    }catch(error:any){res.status(503).json({success:false,message:error.message || 'No se pudo guardar la configuración.'});}
  });

  app.get('/api/advertising/placements', (req: Request, res: Response) => {
    res.json({ success: true, placements: db.getAdPlacements() });
  });

  app.post('/api/advertising/placements', async (req: Request, res: Response) => {
    try {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    const placement = await db.saveAdPlacement(req.body);
    res.json({ success: true, placement, version: db.getVersion() });
    }catch(error:any){res.status(503).json({success:false,message:error.message || 'No se pudo guardar la configuración.'});}
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

  app.post('/api/banners', async (req: Request, res: Response) => {
    try {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    const b = await db.addBanner(req.body);
    res.json({ success: true, banner: b, version: db.getVersion() });
    } catch(error:any) {res.status(503).json({success:false,message:error.message || 'No se pudo guardar el cambio'}); }
  });

  app.put('/api/banners/:id', async (req: Request, res: Response) => {
    try {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    const b = await db.updateBanner(req.params.id, req.body);
    if (!b) return res.status(404).json({ success: false, message: 'Banner not found' });
    res.json({ success: true, banner: b, version: db.getVersion() });
    } catch(error:any) {res.status(503).json({success:false,message:error.message || 'No se pudo guardar el cambio'}); }
  });

  app.delete('/api/banners/:id', async (req: Request, res: Response) => {
    try {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    const ok = await db.deleteBanner(req.params.id);
    res.json({ success: ok, version: db.getVersion() });
    } catch(error:any) {res.status(503).json({success:false,message:error.message || 'No se pudo guardar el cambio'}); }
  });

  registerPayPalCheckout(app, db, getAuthenticatedUser, fulfillmentService);

  // --- ORDERS ---
  app.get('/api/orders', (req: Request, res: Response) => {
    const caller = getAuthenticatedUser(req);
    if (!caller) return res.status(401).json({ success: false, message: 'No autenticado' });
    const orders = db.getOrders();
    if (caller.role === 'SUPER_ADMIN') return res.json({ success: true, orders });
    if (caller.storeId) return res.json({ success: true, orders: orders.filter((o: any) => o.storeId === caller.storeId).map((o: any) => safeOrder(o, caller)) });
    return res.json({ success: true, orders: orders.filter((o: any) => o.customerId === caller.id) });
  });

  app.post('/api/orders', async (req: Request, res: Response) => {
    try {
      const caller = getAuthenticatedUser(req);
      if (!caller) return res.status(401).json({ success: false, message: 'No autenticado' });
      if (caller.role !== 'CUSTOMER' && caller.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ success: false, message: 'No autorizado para crear pedidos de clientes' });
      }
      const orders = req.body.orders;
      if (!Array.isArray(orders) || orders.length === 0) {
        return res.status(400).json({ success: false, message: 'No orders provided' });
      }
      const previous = orders.map((o: any) => db.getOrders().find(saved => saved.id === checkoutOrderId(caller.id, String(o.id || ''))));
      if (previous.every(Boolean)) {
        const matches = previous.every((saved: any, index: number) => saved.customerId === caller.id && saved.storeId === orders[index].storeId && saved.total === orders[index].total && JSON.stringify(saved.items.map((item: any) => [item.productId,item.quantity])) === JSON.stringify(orders[index].items?.map((item: any) => [item.productId,item.quantity])));
        if (!matches) return res.status(409).json({success:false,message:'Identificador de compra ya utilizado'});
        return res.json({success:true,orders:previous,version:db.getVersion()});
      }
      if (previous.some(Boolean)) return res.status(409).json({success:false,message:'Compra parcialmente registrada. Contacta a soporte.'});
      const safeOrders = validateOrders(orders, db.getFullState(), caller);
      const created = await db.createOrders(safeOrders);
      res.json({ success: true, orders: created, version: db.getVersion() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error processing orders' });
    }
  });

  app.patch('/api/orders/:id/status', async (req: Request, res: Response) => {
    const caller = getAuthenticatedUser(req);
    if (!caller) return res.status(401).json({ success: false, message: 'No autenticado' });
    const order = db.getOrders().find((o: any) => o.id === req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Orden no encontrada' });
    if (caller.role !== 'SUPER_ADMIN' && (!caller.storeId || caller.storeId !== order.storeId)) {
      return res.status(403).json({ success: false, message: 'No autorizado para cambiar el estado de esta orden' });
    }
    const { status, note, confirmationCode } = req.body;
    try {
      const result = await db.updateOrderStatus(req.params.id, status, note, confirmationCode);
      res.status(result.success ? 200 : 400).json({ ...result, ...("order" in result && result.order ? {order:safeOrder(result.order,caller)}:{}), version: db.getVersion() });
    } catch (error: any) { res.status(503).json({success:false,message:error.message}); }
  });

  // In-platform order chat messaging (PlazaDO exclusive communication channel)
  app.get('/api/orders/:id/messages', (req: Request, res: Response) => {
    const caller = getAuthenticatedUser(req);
    if (!caller) return res.status(401).json({ success: false, message: 'No autenticado' });
    const order = db.getOrders().find((o: any) => o.id === req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Orden no encontrada' });
    if (caller.role !== 'SUPER_ADMIN' && caller.storeId !== order.storeId && caller.id !== order.customerId) {
      return res.status(403).json({ success: false, message: 'No autorizado para consultar este pedido' });
    }
    const messages = db.getOrderMessages(req.params.id);
    res.json({ success: true, messages });
  });

  app.post('/api/orders/:id/messages', async (req: Request, res: Response) => {
    try {
      const caller = getAuthenticatedUser(req);
      if (!caller) return res.status(401).json({ success: false, message: 'No autenticado' });
      const order = db.getOrders().find((o: any) => o.id === req.params.id);
      if (!order) return res.status(404).json({ success: false, message: 'Orden no encontrada' });
      if (caller.role !== 'SUPER_ADMIN' && caller.storeId !== order.storeId && caller.id !== order.customerId) {
        return res.status(403).json({ success: false, message: 'No autorizado para escribir en este pedido' });
      }
      const { message } = req.body;
      const storeId = order.storeId;
      const customerId = order.customerId;
      const senderId = caller.id;
      const senderName = caller.name || 'Usuario PlazaDO';
      const senderRole = caller.role === 'SUPER_ADMIN' ? 'ADMIN' : caller.storeId === order.storeId ? 'STORE' : 'CUSTOMER';
      if (typeof message!=='string' || !message.trim() || message.length>5000) {
        return res.status(400).json({ success: false, message: 'El mensaje debe contener entre 1 y 5000 caracteres.' });
      }
      const newMsg = await db.addOrderMessage({
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

  app.patch('/api/orders/:id/messages/read', async (req: Request, res: Response) => {
    try {
      const caller = getAuthenticatedUser(req);
      if (!caller) return res.status(401).json({ success: false, message: 'No autenticado' });
      const order = db.getOrders().find((o: any) => o.id === req.params.id);
      if (!order) return res.status(404).json({ success: false, message: 'Orden no encontrada' });
      if (caller.role !== 'SUPER_ADMIN' && caller.storeId !== order.storeId && caller.id !== order.customerId) {
        return res.status(403).json({ success: false, message: 'No autorizado para este pedido' });
      }
      const role = caller.storeId === order.storeId || caller.role === 'SUPER_ADMIN' ? 'STORE' : 'CUSTOMER';
      await db.markOrderMessagesAsRead(req.params.id, role);
      res.json({ success: true, version: db.getVersion() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Dedicated delivery confirmation endpoint validating the secret delivery code
  app.post('/api/delivery/confirm', async (req: Request, res: Response) => {
    try {
      const caller = getAuthenticatedUser(req);
      if (!caller) return res.status(401).json({success:false,message:'No autenticado'});
      const { orderId, deliveryCode } = req.body;
      const order = db.getOrders().find(o => o.id === orderId);
      if (!order || (caller.role !== 'SUPER_ADMIN' && caller.storeId !== order.storeId && caller.id !== order.customerId)) return res.status(403).json({success:false,message:'No autorizado'});
      if (!orderId || !deliveryCode) {
        return res.status(400).json({ success: false, message: 'ID de orden y código secreto de entrega requeridos.' });
      }
      const result = await db.updateOrderStatus(orderId, 'DELIVERED', 'Validación exitosa de código de entrega', deliveryCode);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json({ success: true, message: 'Entrega confirmada y liquidación habilitada', order: safeOrder(result.order,caller), version: db.getVersion() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error validando entrega' });
    }
  });

  // Direct multi-store checkout powered by Cloud SQL
  app.post('/api/orders/checkout-multi', (req: Request, res: Response) => {
    res.status(503).json({ success: false, message: 'Usa el checkout de la plataforma. El checkout alternativo está pendiente de integración.' });
  });

  // Cart operations backed directly by Cloud SQL
  app.get('/api/cart/:userId', async (req: Request, res: Response) => {
    try {
      const caller = getAuthenticatedUser(req);
      if (!caller) return res.status(401).json({ success: false, message: 'No autenticado' });
      if (caller.role !== 'SUPER_ADMIN' && caller.id !== req.params.userId) return res.status(403).json({ success: false, message: 'No autorizado para consultar este carrito' });
      const cartData = await cloudSqlRepo.getCartByUser(req.params.userId);
      res.json({ success: true, cart: cartData });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/cart/add', async (req: Request, res: Response) => {
    try {
      const caller = getAuthenticatedUser(req);
      if (!caller) return res.status(401).json({ success: false, message: 'No autenticado' });
      const { userId, productId, storeId, quantity } = req.body;
      const targetUserId = caller.role === 'SUPER_ADMIN' ? userId : caller.id;
      if (!targetUserId) return res.status(400).json({ success: false, message: 'Usuario requerido' });
      const cartData = await cloudSqlRepo.addToCart(targetUserId, productId, storeId, quantity || 1);
      res.json({ success: true, cart: cartData });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete('/api/cart/:userId', async (req: Request, res: Response) => {
    try {
      const caller = getAuthenticatedUser(req);
      if (!caller) return res.status(401).json({ success: false, message: 'No autenticado' });
      if (caller.role !== 'SUPER_ADMIN' && caller.id !== req.params.userId) return res.status(403).json({ success: false, message: 'No autorizado para modificar este carrito' });
      await cloudSqlRepo.clearCart(req.params.userId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.delete('/api/orders/:id', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    res.status(409).json({success:false,message:'El historial financiero debe conservarse. Cancela el pedido mediante su flujo de estados.'});
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
  app.post('/api/admin/settlements/run-weekly', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    }
    try {
      const { actorName } = req.body || {};
      const result = await db.runWeeklySettlementProcess(actorName || admin.name || 'Super Admin Plazado.com');
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
  app.post('/api/payments/webhook', (_req: Request, res: Response) => {
    res.status(503).json({success:false,message:'La integración del proveedor de pagos está pendiente de validación. No se registró ningún cobro.'});
  });

  app.post('/api/settlements', async (req: Request, res: Response) => {
    const caller = getAuthenticatedUser(req);
    if (!caller) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const { storeId, notes } = req.body;
    if (caller.role !== 'SUPER_ADMIN' && caller.storeId !== storeId) {
      return res.status(403).json({ success: false, message: 'No puedes solicitar liquidaciones para otra tienda' });
    }
    try {
      const result = await db.requestSettlement(storeId, notes);
      res.status(result.success ? 200 : 400).json({ ...result, version: db.getVersion() });
    } catch (error: any) { res.status(503).json({success:false,message:error.message}); }
  });

  app.patch('/api/settlements/:id', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    }
    const { status, reference } = req.body;
    try {
      const updated = await db.processSettlement(req.params.id, status, reference);
      if (!updated) return res.status(404).json({ success: false, message: 'Liquidación no encontrada' });
      res.json({ success: true, settlement: updated, version: db.getVersion() });
    } catch (error: any) { res.status(503).json({success:false,message:error.message}); }
  });

  app.delete('/api/settlements/:id', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    }
    res.status(409).json({success:false,message:'El historial de liquidaciones debe conservarse. Usa rechazo o cancelación para liberar fondos.'});
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

  app.post('/api/disputes', async (req: Request, res: Response) => {
    try {
    const caller = getAuthenticatedUser(req);
    if (!caller) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    const orderId = req.body?.orderId;
    const order = orderId ? db.getOrders().find((o: any) => o.id === orderId) : null;
    if (!order) return res.status(400).json({ success: false, message: 'La disputa debe corresponder a una orden válida' });
    const isAdmin = caller.role === 'SUPER_ADMIN';
    const isStore = !!caller.storeId && caller.storeId === order.storeId;
    const isCustomer = caller.id === order.customerId;
    if (!isAdmin && !isStore && !isCustomer) {
      return res.status(403).json({ success: false, message: 'No autorizado para abrir una disputa sobre esta orden' });
    }
    const safeDispute = {
      ...req.body,
      orderId: order.id,
      storeId: order.storeId,
      customerId: order.customerId,
      createdBy: caller.id
    };
    const disp = await db.createDispute(safeDispute);
    res.json({ success: true, dispute: disp, version: db.getVersion() });
    } catch(err:any) {res.status(400).json({success:false,message:err.message || 'No se pudo guardar la reclamación'});}
  });

  app.patch('/api/disputes/:id', async (req: Request, res: Response) => {
    try {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    }
    const { status, resolutionNotes } = req.body;
    const updated = await db.resolveDispute(req.params.id, status, resolutionNotes);
    if (!updated) return res.status(404).json({ success: false, message: 'Dispute not found' });
    res.json({ success: true, dispute: updated, version: db.getVersion() });
    } catch(err:any) {res.status(400).json({success:false,message:err.message || 'No se pudo guardar la reclamación'});}
  });

  app.delete('/api/disputes/:id', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    }
    res.status(409).json({success:false,message:'Las reclamaciones se conservan como historial. Documenta la resolución y cierra el caso.'});
  });

  // --- REVIEWS ---
  app.get('/api/reviews', (req: Request, res: Response) => {
    res.json({ success: true, reviews: db.getReviews().filter(review => review.isModerated) });
  });

  app.post('/api/reviews', async (req: Request, res: Response) => {
    const caller = getAuthenticatedUser(req);
    if (!caller) return res.status(401).json({ success: false, message: 'No autenticado' });
    if (caller.role !== 'CUSTOMER') return res.status(403).json({ success: false, message: 'Solo clientes pueden publicar reseñas' });
    const safeReview = { ...req.body, userId: caller.id, customerId: caller.id };
    try {
      const rev = await db.addReview(safeReview);
      res.json({ success: true, review: rev, version: db.getVersion() });
    } catch (error) {
      res.status(400).json({ success: false, message: error instanceof Error ? error.message : 'No se pudo guardar la reseña' });
    }
  });

  app.delete('/api/reviews/:id', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) {
      return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    }
    try {
      const ok = await db.deleteReview(req.params.id);
      res.json({ success: ok, version: db.getVersion() });
    } catch { res.status(503).json({ success: false, message: 'No se pudo guardar la moderación' }); }
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
      if(req.headers.authorization)res.cookie('plazado_session',createSessionToken(user),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:(user.role==='SUPER_ADMIN'?8*60*60:7*24*60*60)*1000});
    res.json({ success: true, user: sanitizeUser(user) });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error validando sesión' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // PASO 1: Recibir email y password (validar presencia de caracteres)
      if (!password || typeof password !== 'string' || password.length === 0) {
        return res.status(401).json({ success: false, message: 'Correo electrónico o contraseña incorrectos.' });
      }

      const normalizedEmail = (email || '').trim().toLowerCase();
      if (!normalizedEmail) {
        return res.status(401).json({ success: false, message: 'Correo electrónico o contraseña incorrectos.' });
      }

      // PASO 2: Buscar exactamente UN usuario por email normalizado
      const user = db.getUserByEmail(normalizedEmail);

      // PASO 3: Si el usuario NO existe -> DENEGAR ACCESO inmediatamente
      if (!user) {
        return res.status(401).json({ success: false, message: 'Correo electrónico o contraseña incorrectos.' });
      }

      // PASO 4: Obtener EXCLUSIVAMENTE el passwordHash asociado al user.id encontrado
      const credential = db.getUserCredential(user.id);
      const storedHash = user.passwordHash || credential?.passwordHash;
      if (!storedHash || typeof storedHash !== 'string' || storedHash.length === 0) {
        return res.status(401).json({ success: false, message: 'Correo electrónico o contraseña incorrectos.' });
      }

      // PASO 5: Comparar la contraseña introducida contra ese hash exacto (sin alterar mayúsculas/minúsculas)
      const passwordIsValid = await verifyPassword(password, storedHash);

      // PASO 6: ÚNICAMENTE si passwordIsValid === true se autoriza acceso
      if (passwordIsValid !== true) {
        return res.status(401).json({ success: false, message: 'Correo electrónico o contraseña incorrectos.' });
      }

      // Si el hash almacenado requiere actualización a bcrypt moderno, actualizar credencial 1:1
      if (!storedHash.startsWith('$2')) {
        const upgradedHash = await hashPassword(password);
        db.setUserCredential(user.id, upgradedHash);
      }

      // Generar sesión / token EXCLUSIVAMENTE tras validar la contraseña correctamente
      const token = createSessionToken(user);
      res.cookie?.('plazado_session',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:(user.role==='SUPER_ADMIN'?8*60*60:7*24*60*60)*1000});
      db.addAuditLog('USER_LOGIN', user.id, undefined, `Inicio de sesión exitoso como ${user.role} (${user.email})`);
      return res.json({ success: true, user: sanitizeUser(user), token, version: db.getVersion() });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'Error procesando autenticación' });
    }
  });

  // Active email verification OTP memory cache for non-registered users (guest / pre-register)
  const activeVerificationCodes = new Map<string, { code: string; expiresAt: number; name?: string; type: string; lastSentAt?: number }>();

  // Send email confirmation code (pre-register or generic)
  app.post('/api/auth/send-verification-code', async (req: Request, res: Response) => {
    try {
      const { email, name, type = 'CUSTOMER' } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        return res.status(400).json({ success: false, message: 'Correo electrónico inválido.' });
      }

      const consentUser = db.getUserByEmail(cleanEmail);
      const audience = consentUser?.role === 'STORE_OWNER' || type === 'STORE' ? 'STORE' : 'CUSTOMER';
      if (consentUser?.isEmailVerified) {
        return res.status(400).json({ success: false, message: 'Esta cuenta ya está verificada. Inicia sesión con tu contraseña.' });
      }
      const recordedConsent = consentUser?.legalAcceptance;
      if (!(recordedConsent?.version === LEGAL_VERSION && recordedConsent.audience === audience && recordedConsent.readToEnd === true)) {
        return res.status(400).json({ success: false, message: 'Completa el formulario de registro y acepta los términos vigentes antes de solicitar el código.' });
      }

      // Generate cryptographically secure 6-digit numeric OTP code
      const code = crypto.randomInt(100000, 1000000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

      activeVerificationCodes.set(cleanEmail, { code, expiresAt, name, type, lastSentAt: Date.now() });

      // Existing verified accounts must never be reverted to unverified by this public endpoint.
      const existingUser = db.getUserByEmail(cleanEmail);
      if (existingUser?.isEmailVerified) {
        return res.status(400).json({ success: false, message: 'Esta cuenta ya está verificada. Inicia sesión con tu contraseña.' });
      }
      if (existingUser) {
        await db.setUserVerification(existingUser.id, {
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
        `Código de verificación generado y enviado desde contacto@plazado.com. Aceptado por el proveedor de correo: ${mailResult.delivered ? 'SÍ' : 'NO'}`
      );

      res.json({
        success: true,
        delivered: mailResult.delivered,
        message: mailResult.delivered ? `Código aceptado para envío a ${cleanEmail}.` : 'Código guardado. Solicítalo al Super Admin mediante contacto@plazado.com.',
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

      const audience = existingUser?.role === 'STORE_OWNER' ? 'STORE' : 'CUSTOMER';
      if (existingUser?.isEmailVerified) {
        return res.status(400).json({ success: false, message: 'Esta cuenta ya está verificada. Inicia sesión.' });
      }
      if (existingUser?.legalAcceptance?.version !== LEGAL_VERSION || existingUser.legalAcceptance.audience !== audience || existingUser.legalAcceptance.readToEnd !== true) {
        return res.status(400).json({ success: false, message: 'Vuelve al registro y acepta los términos vigentes antes de recibir un nuevo código.' });
      }

      const lastSentAt = existingUser?.verification?.lastSentAt || preRecord?.lastSentAt || 0;
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
        type: existingUser?.role === 'STORE_OWNER' ? 'STORE' : 'CUSTOMER',
        lastSentAt: Date.now()
      });

      if (existingUser) {
        await db.setUserVerification(existingUser.id, {
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
        `Código de verificación reenviado a ${cleanEmail} desde contacto@plazado.com. Aceptado por el proveedor de correo: ${mailResult.delivered ? 'SÍ' : 'NO'}`
      );

      res.json({
        success: true,
        delivered: mailResult.delivered,
        message: mailResult.delivered ? `Código enviado a ${cleanEmail}. Revisa tu correo o spam.` : 'Código guardado. Solicítalo al Super Admin mediante contacto@plazado.com.',
        cooldownSeconds: COOLDOWN_SECONDS,
        expiresInSeconds: 900
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error reenviando código' });
    }
  });

  // Verify email confirmation code
  app.post('/api/auth/verify-code', async (req:Request,res:Response) => {
    try {
      const email=(req.body.email || '').trim().toLowerCase(), code=(req.body.code || '').trim();
      if(!email || !/^\d{6}$/.test(code)) return res.status(400).json({success:false,message:'Correo y código de 6 dígitos requeridos'});
      const result=await db.confirmUserEmail(email,code);
      if(!result.success) return res.status(400).json({success:false,message:result.message});
      activeVerificationCodes.delete(email);
      res.json({success:true,verified:true,user:result.user ? sanitizeUser(result.user):undefined,message:result.message});
    } catch(error:any) {res.status(503).json({success:false,message:error.message || 'No se guardó la verificación'});}
  });  // Test SMTP Email configuration from Super Admin
  app.post('/api/admin/mail/test', async (req: Request, res: Response) => {
    try {
      const admin = getAuthenticatedSuperAdmin(req);
      if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
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
          message: `¡Prueba exitosa! Correo de verificación aceptado para envío a ${targetEmail} desde ${config.senderEmail}.`
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

      const storedCode = user.verification?.code;
      const codeExpiresAt = user.verification?.codeExpiresAt || 0;
      const isExpired = Date.now() >= codeExpiresAt;
      const code=!isExpired && !user.isEmailVerified && (user.verification?.attempts || 0)<5 ? storedCode : undefined;

      // Register strictly in AuditLog
      db.addAuditLog(
        'ADMIN_CONSULT_VERIFICATION_CODE',
        user.id,
        user.email,
        `Super Admin (${admin.email}) consultó el código de verificación de ${user.name} (${user.email}). Código consultado para asistencia; no se registra su valor.`,
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
      const regenRes = await db.regenerateUserVerificationCode(cleanEmail, admin.email);
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
        message: mailResult.delivered ? `Nuevo código aceptado para envío a ${cleanEmail}.` : 'Código guardado. Cópialo y envíalo manualmente desde contacto@plazado.com. Vence en 15 minutos.'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error generando nuevo código' });
    }
  });

  // Super Admin: Manually approve verification for an account (e.g. validated via phone/support)
  app.post('/api/admin/verifications/manual-verify', async (req: Request, res: Response) => {
    try {
    try {
      const admin = getAuthenticatedSuperAdmin(req);
      if (!admin) {
        return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
      }

      const { email, reason } = req.body;
      const cleanEmail = (email || '').trim().toLowerCase();
      const manualRes = await db.manualVerifyUser(cleanEmail, admin.email, reason);
      if (!manualRes.success) {
        return res.status(400).json({ success: false, message: manualRes.message });
      }

      res.json({ success: true, message: manualRes.message });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error en verificación manual' });
    }
    } catch(error:any) {res.status(503).json({success:false,message:error.message || 'No se pudo guardar el cambio'}); }
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

      const result = await db.approveUserAccount(target, admin.email);
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
          await sendAccountApprovalEmail(result.user.email,result.user.name,mailConfig);
        }
      } catch (e) {
        console.warn('[Mailer] Could not send approval notice email:', e);
      }

      res.json({ success: true, message: result.message, user: result.user ? sanitizeUser(result.user):undefined, version: db.getVersion() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error autorizando usuario' });
    }
  });

  // Super Admin: Rechazar documentación / cédula
  app.post('/api/admin/reject-user', async (req: Request, res: Response) => {
    try {
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

      const result = await db.rejectUserAccount(target, admin.email, reason);
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({ success: true, message: result.message, user: result.user ? sanitizeUser(result.user):undefined, version: db.getVersion() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error rechazando usuario' });
    }
    } catch(error:any) {res.status(503).json({success:false,message:error.message || 'No se pudo guardar el cambio'}); }
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
      if (!password || password.length < 10 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
        return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 10 caracteres e incluir mayúscula, minúscula y número.' });
      }

      const passHash = await hashPassword(password);
      const result = await db.createSuperAdmin({
        name: name.trim(),
        email: email.trim(),
        phone: (phone || '').trim(),
        passwordHash: passHash,
        createdByAdmin: admin.email
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({ success: true, message: result.message, user: result.user ? sanitizeUser(result.user):undefined, version: db.getVersion() });
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
        const regen = await db.regenerateUserVerificationCode(cleanEmail, admin.email);
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
        message: mailResult.delivered ? `Correo enviado a ${cleanEmail}.` : 'El correo no se pudo enviar. Revisa la configuración SMTP.'
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error reenviando correo' });
    }
  });

  // Register Customer (Creates account, generates code, dispatches email from contacto@plazado.com automatically)
  app.post('/api/auth/register-customer', async (req: Request, res: Response) => {
    try {
      const data: CustomerRegistrationInput = req.body;
      if (!hasCurrentLegalConsent(data, 'CUSTOMER')) {
        return res.status(400).json({ success: false, message: 'Debes leer hasta el final y aceptar los términos y políticas vigentes de tu tipo de cuenta antes de recibir el código.' });
      }
      const legalAcceptance = {
        version: LEGAL_VERSION,
        audience: 'CUSTOMER' as const,
        acceptedAt: new Date().toISOString(),
        readToEnd: true as const,
        documentIds: registrationDocuments('CUSTOMER').map(doc => doc.id)
      };
      const cleanEmail = (data.email || '').trim().toLowerCase();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return res.status(400).json({success:false,message:'Ingresa un correo válido'});
      const users = db.getUsers();

      const existingUser = structuredClone(users.find(u => u.email.toLowerCase() === cleanEmail));
      if (existingUser && existingUser.isEmailVerified === true) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una cuenta verificada con este correo electrónico. Por favor inicia sesión.'
        });
      }

      if (!data.name?.trim()) {
        return res.status(400).json({ success: false, message: 'Por favor ingresa tu nombre.' });
      }
      if (!data.password || data.password.length < 10 || !/[A-Z]/.test(data.password) || !/[a-z]/.test(data.password) || !/\d/.test(data.password)) {
        return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 10 caracteres e incluir mayúscula, minúscula y número.' });
      }
      if(existingUser?.passwordHash && !(await verifyPassword(data.password,existingUser.passwordHash))) return res.status(409).json({success:false,message:'Ya existe un registro pendiente. Usa su contraseña y completa la verificación o contacta a soporte.'});
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
        existingUser.legalAcceptance = legalAcceptance;
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
            biometricScore: undefined,
            biometricStatus: 'PENDING',
            livenessPassed: false,
            facialMatchPassed: false,
          };
          existingUser.isKycVerified = false;
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
        await db.updateUser(existingUser.id,existingUser);
        customerUser = existingUser;
      } else {
        const newId = `user-${crypto.createHash('sha256').update(cleanEmail).digest('hex').slice(0,32)}`;
        const hasKycInfo = !!(data.cedulaFrontUrl || data.selfieUrl || data.cedulaNumber);
        customerUser = {
          id: newId,
          legalAcceptance,
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
            biometricScore: undefined,
            biometricStatus: 'PENDING',
            livenessPassed: false,
            facialMatchPassed: false,
          } : undefined,
          isKycVerified: false,
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
        await db.addUser(customerUser);
      }

      db.addAuditLog('LEGAL_TERMS_ACCEPTED', customerUser.id, undefined, `Aceptación ${legalAcceptance.version} CUSTOMER ${legalAcceptance.acceptedAt}`);

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
        `Cliente ${customerUser.name} (${customerUser.email}) registrado. Código de verificación enviado automáticamente desde contacto@plazado.com. Aceptado por el proveedor de correo: ${mailResult.delivered ? 'SÍ' : 'NO'}`
      );

      res.json({
        success: true,
        pendingVerification: true,
        email: cleanEmail,
        name: customerUser.name,
        accountType: 'CUSTOMER',
        delivered: mailResult.delivered,
        message: mailResult.delivered ? `Código enviado a ${cleanEmail}. Introduce el código recibido.` : 'Tu registro pendiente fue guardado. Solicita tu código al Super Admin mediante contacto@plazado.com para completarlo.',
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
      if (!hasCurrentLegalConsent(data, 'STORE')) {
        return res.status(400).json({ success: false, message: 'Debes leer hasta el final y aceptar los términos y políticas vigentes de tu tipo de cuenta antes de recibir el código.' });
      }
      const legalAcceptance = {
        version: LEGAL_VERSION,
        audience: 'STORE' as const,
        acceptedAt: new Date().toISOString(),
        readToEnd: true as const,
        documentIds: registrationDocuments('STORE').map(doc => doc.id)
      };
      const cleanEmail = (data.email || '').trim().toLowerCase();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return res.status(400).json({success:false,message:'Ingresa un correo válido'});
      const users = db.getUsers();
      const stores = db.getStores();

      const existingUser = structuredClone(users.find(u => u.email.toLowerCase() === cleanEmail));
      if (existingUser && existingUser.isEmailVerified === true) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe una cuenta verificada con este correo electrónico. Por favor inicia sesión.'
        });
      }

      if (stores.some(s => s.name.toLowerCase() === (data.storeName || '').trim().toLowerCase() && s.email.toLowerCase() !== cleanEmail)) {
        return res.status(400).json({ success: false, message: 'Ya existe una tienda registrada con este nombre comercial.' });
      }
      if (!data.storeName?.trim()) {
        return res.status(400).json({ success: false, message: 'Por favor ingresa el nombre de la tienda.' });
      }
      if (!data.ownerName?.trim()) {
        return res.status(400).json({ success: false, message: 'Por favor ingresa el nombre del responsable de la tienda.' });
      }
      if (!data.password || data.password.length < 10 || !/[A-Z]/.test(data.password) || !/[a-z]/.test(data.password) || !/\d/.test(data.password)) {
        return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 10 caracteres e incluir mayúscula, minúscula y número.' });
      }
      if(existingUser?.passwordHash && !(await verifyPassword(data.password,existingUser.passwordHash))) return res.status(409).json({success:false,message:'Ya existe un registro pendiente. Usa su contraseña y completa la verificación o contacta a soporte.'});
      if (data.password !== data.confirmPassword) {
        return res.status(400).json({ success: false, message: 'Las contraseñas no coinciden.' });
      }

      // Generate cryptographically secure 6-digit verification code
      const code = crypto.randomInt(100000, 1000000).toString();
      const codeExpiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes
      const passHash = await hashPassword(data.password);

      const userId = existingUser ? existingUser.id : `user-${crypto.createHash('sha256').update(cleanEmail).digest('hex').slice(0,32)}`;
      const storeId = existingUser?.storeId || `store-${crypto.createHash('sha256').update(cleanEmail).digest('hex').slice(0,32)}`;
      const storeSlug = data.storeName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const kycInfo = data.cedulaFrontUrl ? {
        cedulaNumber: data.cedulaNumber || undefined,
        cedulaFrontUrl: data.cedulaFrontUrl,
        selfieUrl: data.selfieUrl || '',
        biometricScore: undefined,
        biometricStatus: 'PENDING' as const,
        livenessPassed: false,
        facialMatchPassed: false,
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
        rating: 0,
        reviewCount: 0,
        salesCount: 0,
        kycData: kycInfo,
        isKycVerified: false,
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
        legalAcceptance,
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
        isKycVerified: false,
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

      await db.registerStoreAccount(newStoreUser,newStore);

      db.addAuditLog('LEGAL_TERMS_ACCEPTED', userId, storeId, `Aceptación ${legalAcceptance.version} STORE ${legalAcceptance.acceptedAt}`);

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
        `Tienda ${newStore.name} registrada por ${data.ownerName} (${cleanEmail}). Código de verificación enviado automáticamente desde contacto@plazado.com. Aceptado por el proveedor de correo: ${mailResult.delivered ? 'SÍ' : 'NO'}`
      );

      res.json({
        success: true,
        pendingVerification: true,
        email: cleanEmail,
        name: data.ownerName.trim(),
        storeName: data.storeName.trim(),
        accountType: 'STORE',
        delivered: mailResult.delivered,
        message: mailResult.delivered ? `Código enviado a ${cleanEmail}. Introduce el código recibido.` : 'Tu tienda quedó registrada y pendiente de validación. Solicita tu código al Super Admin mediante contacto@plazado.com para completar el registro.',
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

      const updateData = caller.role === 'SUPER_ADMIN' ? { ...req.body } : editableFields(req.body, ['name','phone','avatar','addresses']);
      delete updateData.id;
      // Credential changes use the dedicated password endpoint, which verifies the current password.
      delete updateData.password;
      delete updateData.newPassword;
      delete updateData.passwordHash;
      delete updateData.verification;
      delete updateData.passwordRecovery;
      delete updateData.authVersion;
      delete updateData.isEmailVerified;
      delete updateData.storeId;
      delete updateData.createdAt;
      if (caller.role !== 'SUPER_ADMIN') {
        delete updateData.role;
        delete updateData.isApprovedByAdmin;
        delete updateData.adminApprovalStatus;
        delete updateData.isKycVerified;
        delete updateData.kycData;
        delete updateData.cedulaNumber;
      }
      const updated = await db.updateUser(req.params.id, updateData);
      if (!updated) return res.status(404).json({ success: false, message: 'User not found' });
      res.json({ success: true, user: sanitizeUser(updated), version: db.getVersion() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Error updating user' });
    }
  });

  // Customer & Store: Submit/Update KYC identity verification documents (Cédula & Biometric Selfie)
  app.post('/api/user/kyc', async (req: Request, res: Response) => {
    try {
      const { cedulaNumber, cedulaFrontUrl, selfieUrl, biometricScore } = req.body;
      const user = getAuthenticatedUser(req);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Usuario no identificado o sesión no válida.' });
      }

      const cleanCedula = (cedulaNumber || '').trim();
      const updatedKyc = {
        cedulaNumber: cleanCedula || user.cedulaNumber || user.kycData?.cedulaNumber || '',
        cedulaFrontUrl: (cedulaFrontUrl || user.kycData?.cedulaFrontUrl || '').trim(),
        selfieUrl: (selfieUrl || user.kycData?.selfieUrl || user.avatar || '').trim(),
        biometricScore: undefined,
        biometricStatus: 'PENDING' as const,
        livenessPassed: false,
        facialMatchPassed: false
      };

      const updatedUser = await db.updateUser(user.id, {
        cedulaNumber: updatedKyc.cedulaNumber,
        kycData: updatedKyc,
        isKycVerified: false,
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
      const targetPass = typeof (newPassword || password)==='string' ? (newPassword || password) : '';
      if (!targetPass || targetPass.length < 10 || !/[A-Z]/.test(targetPass) || !/[a-z]/.test(targetPass) || !/\d/.test(targetPass)) {
        return res.status(400).json({ success: false, message: 'La nueva contraseña debe tener al menos 10 caracteres e incluir mayúscula, minúscula y número.' });
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
      const updated = await db.updateUser(req.params.id, { passwordHash: passHash });
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
  app.post('/api/stores/:id/delete-by-owner', async (req: Request, res: Response) => {
    try {
      const storeId = req.params.id;
      const { confirmationText, password } = req.body;
      const user = getAuthenticatedUser(req);
      if (!user) return res.status(401).json({ success: false, message: 'Usuario no autenticado.' });

      if (confirmationText !== 'ELIMINAR') {
        return res.status(400).json({ success: false, message: 'Debes escribir ELIMINAR para confirmar la eliminación.' });
      }

      const store = db.getStores().find(s => s.id === storeId);
      if (!store) {
        return res.status(404).json({ success: false, message: 'Tienda no encontrada.' });
      }

      if (user.role !== 'SUPER_ADMIN' && store.ownerId !== user.id && user.storeId !== storeId) {
        return res.status(403).json({ success: false, message: 'No tienes permisos para eliminar esta tienda.' });
      }
      if (user.role !== 'SUPER_ADMIN') {
        if (!password || !user.passwordHash || !(await verifyPassword(password, user.passwordHash))) {
          return res.status(401).json({ success: false, message: 'Contraseña incorrecta. No se eliminó la tienda.' });
        }
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
      const caller = getAuthenticatedUser(req);
      if (!caller) return res.status(401).json({ success: false, message: 'No autenticado' });
      const requestedStoreId = req.query.storeId as string | undefined;
      const storeId = caller.role === 'SUPER_ADMIN' ? requestedStoreId : caller.storeId;
      if (caller.role !== 'SUPER_ADMIN' && !storeId) return res.status(403).json({ success: false, message: 'Acceso denegado a fulfillment' });
      const data = fulfillmentService.getData(storeId);
      res.json({ success: true, data, version: db.getVersion() });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/storage-requests', async (req: Request, res: Response) => {
    try {
      const caller = getAuthenticatedUser(req);
      if (!caller) return res.status(401).json({ success: false, message: 'No autenticado' });
      if (caller.role !== 'SUPER_ADMIN' && !caller.storeId) return res.status(403).json({ success: false, message: 'Solo una tienda o Super Admin puede crear solicitudes de almacén' });
      const payload = { ...req.body };
      if (caller.role !== 'SUPER_ADMIN') payload.storeId = caller.storeId;
      const result = await db.runFulfillmentMutation(() => fulfillmentService.createStorageRequest(payload, caller));
      res.json({ success: true, storageRequest: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.patch('/api/fulfillment/storage-requests/:id/status', async (req: Request, res: Response) => {
    try {
      const caller = getAuthenticatedUser(req);
      if (!caller) return res.status(401).json({ success: false, message: 'No autenticado' });
      const { status, notes } = req.body;
      const result = await db.runFulfillmentMutation(() => fulfillmentService.updateStorageRequestStatus(req.params.id, status, notes, caller));
      res.json({ success: true, storageRequest: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/storage-requests/:id/receive', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Operación exclusiva de Super Admin / almacén autorizado.' });
    try {
      const result = await db.runFulfillmentMutation(() => fulfillmentService.processPhysicalReception({
        ...req.body,
        requestId: req.params.id
      }, admin));
      res.json({ success: true, data: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.patch('/api/fulfillment/inventory/:id', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Operación exclusiva de Super Admin / almacén autorizado.' });
    try {
      const result = await db.runFulfillmentMutation(() => fulfillmentService.adjustInventory({
        inventoryItemId: req.params.id,
        ...req.body
      }, admin));
      res.json({ success: true, inventoryItem: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/inventory/:id/relocate', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Operación exclusiva de Super Admin / almacén autorizado.' });
    try {
      const result = await db.runFulfillmentMutation(() => fulfillmentService.relocateInventory({
        inventoryItemId: req.params.id,
        newLocation: req.body.newLocation
      }, admin));
      res.json({ success: true, inventoryItem: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/inventory/:id/block-toggle', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Operación exclusiva de Super Admin / almacén autorizado.' });
    try {
      const result = await db.runFulfillmentMutation(() => fulfillmentService.blockUnblockInventory({
        inventoryItemId: req.params.id,
        ...req.body
      }, admin));
      res.json({ success: true, inventoryItem: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/inventory/:id/damage', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Operación exclusiva de Super Admin / almacén autorizado.' });
    try {
      const result = await db.runFulfillmentMutation(() => fulfillmentService.recordDamage({
        inventoryItemId: req.params.id,
        ...req.body
      }, admin));
      res.json({ success: true, inventoryItem: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/orders/:id/confirm-by-store', async (req: Request, res: Response) => {
    try {
      const caller = getAuthenticatedUser(req);
      if (!caller) return res.status(401).json({ success: false, message: 'No autenticado' });
      const storeId = caller.role === 'SUPER_ADMIN' ? req.body.storeId : caller.storeId;
      if (!storeId) return res.status(403).json({ success: false, message: 'Tienda no autorizada' });
      const result = await db.runFulfillmentMutation(() => fulfillmentService.confirmOrderByStore(req.params.id, storeId, caller));
      res.json({ success: true, fulfillmentOrder: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/orders/:id/reject-by-store', async (req: Request, res: Response) => {
    try {
      const caller = getAuthenticatedUser(req);
      if (!caller) return res.status(401).json({ success: false, message: 'No autenticado' });
      const storeId = caller.role === 'SUPER_ADMIN' ? req.body.storeId : caller.storeId;
      const { reason } = req.body;
      if (!storeId) return res.status(403).json({ success: false, message: 'Tienda no autorizada' });
      const result = await db.runFulfillmentMutation(() => fulfillmentService.rejectOrderByStore(req.params.id, storeId, reason, caller));
      res.json({ success: true, fulfillmentOrder: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/orders/:id/validate-pick-item', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Operación exclusiva de Super Admin / almacén autorizado.' });
    try {
      const result = await db.runFulfillmentMutation(() => fulfillmentService.validateAndPickItem({
        ...req.body,
        fulfillmentOrderId: req.params.id
      }, admin));
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json({ ...result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/orders/:id/complete-packing', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Operación exclusiva de Super Admin / almacén autorizado.' });
    try {
      const result = await db.runFulfillmentMutation(() => fulfillmentService.completePacking({
        ...req.body,
        fulfillmentOrderId: req.params.id
      }, admin));
      res.json({ success: true, fulfillmentOrder: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/orders/:id/dispatch', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Operación exclusiva de Super Admin / almacén autorizado.' });
    try {
      const result = await db.runFulfillmentMutation(() => fulfillmentService.dispatchOrder({
        ...req.body,
        fulfillmentOrderId: req.params.id
      }, admin));
      res.json({ success: true, fulfillmentOrder: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/orders/:id/deliver', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Operación exclusiva de Super Admin / almacén autorizado.' });
    try {
      const result = await db.runFulfillmentMutation(() => fulfillmentService.deliverOrder({
        ...req.body,
        fulfillmentOrderId: req.params.id
      }, admin));
      res.json({ success: true, fulfillmentOrder: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/incidences', async (req: Request, res: Response) => {
    const caller = getAuthenticatedUser(req);
    if (!caller) return res.status(401).json({ success: false, message: 'No autenticado' });
    try {
      const result = await db.runFulfillmentMutation(() => fulfillmentService.createIncidence(req.body, caller));
      res.json({ success: true, incidence: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.patch('/api/fulfillment/incidences/:id', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Operación exclusiva de Super Admin / almacén autorizado.' });
    try {
      const result = await db.runFulfillmentMutation(() => fulfillmentService.updateIncidence(req.params.id, req.body, admin));
      res.json({ success: true, incidence: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/returns', async (req: Request, res: Response) => {
    const caller = getAuthenticatedUser(req);
    if (!caller) return res.status(401).json({ success: false, message: 'No autenticado' });
    try {
      const result = await db.runFulfillmentMutation(() => fulfillmentService.createReturn(req.body, caller));
      res.json({ success: true, returnRecord: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/returns/:id/classify', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Operación exclusiva de Super Admin / almacén autorizado.' });
    try {
      const result = await db.runFulfillmentMutation(() => fulfillmentService.classifyReturn({
        returnId: req.params.id,
        ...req.body
      }, admin));
      res.json({ success: true, returnRecord: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.post('/api/fulfillment/withdrawals', async (req: Request, res: Response) => {
    const caller = getAuthenticatedUser(req);
    if (!caller) return res.status(401).json({ success: false, message: 'No autenticado' });
    try {
      const result = await db.runFulfillmentMutation(() => fulfillmentService.createWithdrawal(req.body, caller));
      res.json({ success: true, withdrawal: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.patch('/api/fulfillment/withdrawals/:id/status', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Operación exclusiva de Super Admin / almacén autorizado.' });
    try {
      const { status, notes } = req.body;
      const result = await db.runFulfillmentMutation(() => fulfillmentService.updateWithdrawalStatus(req.params.id, status, notes, admin));
      res.json({ success: true, withdrawal: result, version: db.getVersion() });
    } catch (err: any) {
      res.status(400).json({ success: false, message: err.message });
    }
  });

  app.put('/api/fulfillment/config', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Operación exclusiva de Super Admin / almacén autorizado.' });
    try {
      const result = await db.runFulfillmentMutation(() => fulfillmentService.updateConfig(req.body, admin));
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

  // Read-only Firestore integrity diagnostic. Does not write or repair data.
  app.get('/api/admin/persistence/firestore-diagnostic', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    try {
      const diagnostic = await firestoreRepo.getIntegrityDiagnostic({
        users: db.getUsers(),
        stores: db.getStores(),
        products: db.getProducts(),
        orders: db.getOrders()
      });
      res.json({ success: true, diagnostic });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'No fue posible ejecutar el diagnóstico de Firestore.' });
    }
  });

  // One-time controlled reconciliation: persist only users that already exist in
  // application memory but are missing from Firestore. Never deletes or overwrites
  // existing Firestore users. Super Admin only.
  app.post('/api/admin/persistence/reconcile-missing-users', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    try {
      const diagnostic = await firestoreRepo.getIntegrityDiagnostic({ users: db.getUsers() });
      if (diagnostic.unavailableCoreCollections?.includes('users')) {
        return res.status(503).json({ success: false, message: 'No se pudo leer la colección users de Firestore.' });
      }
      // The diagnostic already read the production users successfully through
      // Firebase Admin. Reuse its safe identifiers instead of loadFullState(), which
      // reads many unrelated collections and can fail because one optional collection
      // is unavailable.
      const firestoreIds = new Set((diagnostic.userIdentifiers || []).map((u: any) => u.id).filter(Boolean));
      const firestoreEmails = new Set((diagnostic.userIdentifiers || []).map((u: any) => String(u.email || '').toLowerCase()).filter(Boolean));
      const missing = db.getUsers().filter((u: any) =>
        u.id && !firestoreIds.has(u.id) && !firestoreEmails.has(String(u.email || '').toLowerCase())
      );
      for (const user of missing) await firestoreRepo.saveUser(user);
      res.json({ success: true, persisted: missing.length, userIds: missing.map((u: any) => u.id) });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'No fue posible reconciliar usuarios.' });
    }
  });

  // --- DEDICATED STORES DATABASE REGISTRY STATUS ---
  app.get('/api/admin/stores-database/status', (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    const allStores = storesDb.getAllAdminStores();
    res.json({
      success: true,
      registryVersion: storesDb.getRegistryVersion(),
      totalStores: allStores.length,
      stores: allStores.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        ownerId: s.ownerId,
        email: s.email,
        status: s.status,
        isPublished: s.isPublished,
        createdAt: s.createdAt
      })),
      vaults: {
        primary: 'data/plazado_stores_internal_registry.json',
        backup: 'data/backups/plazado_stores_master_vault.json',
        snapshot: 'server/stores_snapshot.json'
      }
    });
  });

  app.post('/api/admin/persistence/sync-firestore', async (req: Request, res: Response) => {
    const admin = getAuthenticatedSuperAdmin(req);
    if (!admin) return res.status(403).json({ success: false, message: 'Acceso denegado. Se requiere rol SUPER_ADMIN.' });
    try {
      // Safety gate: this action is pull-only. Firestore is authoritative for users,
      // and this endpoint must never push memory users or delete production records.
      const before = await firestoreRepo.getIntegrityDiagnostic({ users: db.getUsers(), stores: db.getStores(), products: db.getProducts(), orders: db.getOrders() });
      if (before.unavailableCoreCollections?.length) {
        return res.status(503).json({ success: false, message: 'Sincronización bloqueada: no se pudieron leer todas las colecciones principales de Firestore.' });
      }
      await db.initFirestoreSync();
      const after = await firestoreRepo.getIntegrityDiagnostic({ users: db.getUsers(), stores: db.getStores(), products: db.getProducts(), orders: db.getOrders() });
      const status = db.getPersistenceStatus();
      res.json({ 
        success: true, 
        message: 'Sincronización segura completada. Firestore se mantuvo como fuente principal y no se eliminaron registros.',
        diagnostic: after,
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
    const { filename, confirmation } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, message: 'Nombre de archivo requerido' });
    }
    // A restore is destructive by nature: require an explicit confirmation and create
    // a safety backup of the current production state before replacing anything.
    if (confirmation !== 'RESTAURAR_RESPALDO') {
      return res.status(400).json({ success: false, message: 'Restauración bloqueada: confirmación explícita requerida.' });
    }
    const safetyBackup = db.createManualBackup(`pre-restore-${Date.now()}`);
    if (!(safetyBackup as any)?.success) {
      return res.status(500).json({ success: false, message: 'No se pudo crear la copia de seguridad previa. Restauración cancelada.' });
    }
    const result = db.restoreFromBackupFile(filename);
    res.json({ ...result, safetyBackup, version: db.getVersion() });
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

  const listenOnPort = (port: number) => {
    const listener = app.listen(port, '0.0.0.0', () => {
      console.log(`[PlazaDO Global Server] Listening on 0.0.0.0:${port}`);
    });
    listener.on('error', (error) => {
      console.error(`[PlazaDO] Listener error on port ${port}:`, error);
      process.exit(1);
    });
  };
  // Preserve the existing Railway domain target (3000) while supporting injected PORT.
  listenOnPort(PORT);
  if (PORT !== 3000) listenOnPort(3000);
}

startServer().catch(err => {
  console.error('[PlazaDO Server Fatal Error]', err);
  process.exit(1);
});
