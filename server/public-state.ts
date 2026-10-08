import { isProductPubliclyVisible, isStorePubliclyVisible } from '../src/types';

const pick = (data: any, keys: readonly string[]) => Object.fromEntries(keys.filter(key => Object.hasOwn(data || {}, key)).map(key => [key, data[key]]));
const publicStoreFields = ['id','name','slug','description','categoryId','logo','banner','province','municipality','address','phone','whatsapp','email','status','isPublished','shippingConfig','rating','reviewCount','isVerified','createdAt','deleted'];
export const STORE_EDIT_FIELDS = ['name','slug','ownerName','email','phone','whatsapp','description','categoryId','logo','banner','province','municipality','address','shippingConfig','bankInfo'];
export const PRODUCT_EDIT_FIELDS = ['name','slug','description','shortDescription','sku','price','promoPrice','stock','minStockAlert','categoryId','subcategoryId','images','status','variants','attributes','specifications'];
export function editableFields(data: any, fields: readonly string[]) { return pick(data, fields); }
export function safeUser(user: any) {
  const { passwordHash, password, verification, ...safe } = user;
  return safe;
}
export function safeOrder(order: any, caller: any) {
  const { deliveryConfirmationCode, ...safe } = order;
  return caller?.role === 'SUPER_ADMIN' || caller?.id === order.customerId ? order : safe;
}
export function publicSettings(settings: any, admin = false) {
  if (admin) return settings;
  return pick(settings, ['platformName','logoUrl','headerBannerUrl','homeHeroMode','plazaCommissionRate','defaultCommissionRate','contactEmail','contactPhone','socialLinks','maintenanceMode','appDownloadUrl','androidApkUrl','privacyPolicyUrl','termsUrl','legalBusinessName','legalEntityRegistered','legalAddress','rnc','whatsappCommercial','itbisTaxRate','currency','currencySymbol','logoType','logoDarkUrl','faviconType','faviconUrl','headerBannerType','activePaymentMethods','deliveryIntegration','policies','legalDocuments','androidApp']);
}
export function sanitizeMarketplaceState(raw: any, caller: any) {
  const admin = caller?.role === 'SUPER_ADMIN';
  const ownStore = caller?.role === 'STORE_OWNER' ? caller.storeId : undefined;
  const stores = (raw.stores || []).filter((s: any) => admin || s.id === ownStore || isStorePubliclyVisible(s));
  const visibleIds = new Set(stores.map((s: any) => s.id));
  const ownOrder = (o: any) => !!caller && (o.customerId === caller.id || (!!ownStore && o.storeId === ownStore));
  const catalog = {
    version: raw.version, lastUpdated: raw.lastUpdated,
    stores: stores.map((s: any) => admin || s.id === ownStore ? s : pick(s, publicStoreFields)),
    products: (raw.products || []).filter((p: any) => admin || p.storeId === ownStore || (isProductPubliclyVisible(p) && visibleIds.has(p.storeId))),
    categories: raw.categories || [], specifications: raw.specifications || [],
    banners: (raw.banners || []).filter((b: any) => admin || b.isActive),
    coupons: raw.coupons || [], reviews: raw.reviews || [],
    systemSettings: publicSettings(raw.systemSettings || {}, admin),
    advertisements: (raw.advertisements || []).filter((a: any) => admin || a.status === 'ACTIVE'),
    adPlacements: raw.adPlacements || [], paymentGateways: [],
    users: (raw.users || []).filter((u: any) => admin || u.id === caller?.id).map(safeUser),
    orders: (raw.orders || []).filter((o: any) => admin || ownOrder(o)).map((o: any) => safeOrder(o, caller)),
    storeBalances: admin ? raw.storeBalances || {} : ownStore && raw.storeBalances?.[ownStore] ? {[ownStore]:raw.storeBalances[ownStore]} : {},
    settlements: (raw.settlements || []).filter((s: any) => admin || (!!ownStore && s.storeId === ownStore)),
    disputes: (raw.disputes || []).filter((d: any) => admin || ownOrder(d)),
    auditLogs: admin ? raw.auditLogs || [] : [], paymentTransactions: admin ? raw.paymentTransactions || [] : [], financialAuditLogs: admin ? raw.financialAuditLogs || [] : [],
    orderMessages: (raw.orderMessages || []).filter((m: any) => admin || (raw.orders || []).some((o: any) => o.id === m.orderId && ownOrder(o))),
  };
  // Explicit projection prevents new internal collections from becoming public.
  const logistics: Record<string, any> = {};
  for (const key of ['storageRequests','fulfillmentInventory','inventoryMovements','fulfillmentOrders','fulfillmentIncidences','fulfillmentReturns','fulfillmentWithdrawals']) {
    logistics[key] = (raw[key] || []).filter((item: any) => admin || (!!ownStore && item.storeId === ownStore));
  }
  logistics.fulfillmentConfig = admin || ownStore ? raw.fulfillmentConfig : undefined;
  if (admin) catalog.paymentGateways = raw.paymentGateways || [];
  return {...catalog, ...logistics};
}
