import { pgTable, text, integer, doublePrecision, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default('CUSTOMER'), // 'CUSTOMER' | 'STORE_OWNER' | 'SUPER_ADMIN'
  phone: text('phone'),
  avatar: text('avatar'),
  storeId: text('store_id'),
  passwordHash: text('password_hash'),
  addresses: jsonb('addresses').$type<any[]>().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. Stores
export const stores = pgTable('stores', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  ownerId: text('owner_id').references(() => users.id),
  email: text('email').notNull(),
  phone: text('phone'),
  whatsapp: text('whatsapp'),
  address: text('address'),
  province: text('province'),
  municipality: text('municipality'),
  sector: text('sector'),
  logoUrl: text('logo_url'),
  bannerUrl: text('banner_url'),
  description: text('description'),
  status: text('status').notNull().default('APPROVED'), // 'APPROVED', 'PENDING', 'ACTIVE', etc.
  isPublished: boolean('is_published').default(true).notNull(),
  balance: doublePrecision('balance').default(0).notNull(),
  pendingBalance: doublePrecision('pending_balance').default(0).notNull(),
  availableBalance: doublePrecision('available_balance').default(0).notNull(),
  commissionRate: doublePrecision('commission_rate').default(0.30).notNull(),
  bankInfo: jsonb('bank_info').$type<any>(),
  shippingConfig: jsonb('shipping_config').$type<any>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Store Members (Multi-user store management)
export const storeMembers = pgTable('store_members', {
  id: text('id').primaryKey(),
  storeId: text('store_id').references(() => stores.id).notNull(),
  userId: text('user_id').references(() => users.id).notNull(),
  role: text('role').notNull().default('OWNER'), // 'OWNER' | 'MANAGER' | 'STAFF'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 4. Categories
export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  icon: text('icon'),
  imageUrl: text('image_url'),
  parentId: text('parent_id'),
  order: integer('order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
});

// 5. Products
export const products = pgTable('products', {
  id: text('id').primaryKey(),
  storeId: text('store_id').references(() => stores.id).notNull(),
  categoryId: text('category_id').references(() => categories.id).notNull(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  sku: text('sku').notNull(),
  price: doublePrecision('price').notNull(),
  promoPrice: doublePrecision('promo_price'),
  stock: integer('stock').default(0).notNull(),
  status: text('status').notNull().default('active'), // 'active', 'paused', 'draft', 'archived'
  isFeatured: boolean('is_featured').default(false).notNull(),
  rating: doublePrecision('rating').default(0),
  reviewCount: integer('review_count').default(0),
  soldCount: integer('sold_count').default(0),
  tags: jsonb('tags').$type<string[]>().default([]),
  attributes: jsonb('attributes').$type<any>().default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 6. Product Images (Max 5 images per product)
export const productImages = pgTable('product_images', {
  id: text('id').primaryKey(),
  productId: text('product_id').references(() => products.id).notNull(),
  url: text('url').notNull(),
  order: integer('order').default(0).notNull(),
  isMain: boolean('is_main').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Carts
export const carts = pgTable('carts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 8. Cart Items
export const cartItems = pgTable('cart_items', {
  id: text('id').primaryKey(),
  cartId: text('cart_id').references(() => carts.id).notNull(),
  productId: text('product_id').references(() => products.id).notNull(),
  storeId: text('store_id').references(() => stores.id).notNull(),
  quantity: integer('quantity').default(1).notNull(),
  selectedVariantId: text('selected_variant_id'),
  addedAt: timestamp('added_at').defaultNow().notNull(),
});

// 9. Orders
export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(),
  orderGroupCode: text('order_group_code').notNull(),
  customerId: text('customer_id').references(() => users.id).notNull(),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone'),
  storeId: text('store_id').references(() => stores.id).notNull(),
  storeName: text('store_name').notNull(),
  status: text('status').notNull().default('PENDING'),
  paymentMethod: text('payment_method').notNull(),
  paymentStatus: text('payment_status').notNull().default('PENDING'),
  subtotal: doublePrecision('subtotal').notNull(),
  shippingCost: doublePrecision('shipping_cost').notNull().default(0),
  discount: doublePrecision('discount').notNull().default(0),
  total: doublePrecision('total').notNull(),
  plazaCommissionRate: doublePrecision('plaza_commission_rate').notNull().default(0.30),
  plazaCommissionAmount: doublePrecision('plaza_commission_amount').notNull().default(0),
  storeNetEarnings: doublePrecision('store_net_earnings').notNull(),
  deliveryCode: text('delivery_code').notNull(),
  shippingAddress: jsonb('shipping_address').$type<any>().notNull(),
  statusHistory: jsonb('status_history').$type<any[]>().default([]),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 10. Order Details (Snapshots of purchased product)
export const orderDetails = pgTable('order_details', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id).notNull(),
  productId: text('product_id').notNull(),
  productName: text('product_name').notNull(),
  productImage: text('product_image').notNull(),
  sku: text('sku').notNull(),
  price: doublePrecision('price').notNull(),
  quantity: integer('quantity').notNull(),
  variantName: text('variant_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 11. Payments
export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id),
  orderGroupCode: text('order_group_code').notNull(),
  provider: text('provider').notNull(), // 'AZUL' | 'CASH' | 'CARDNET' | 'STRIPE'
  providerTransactionId: text('provider_transaction_id').unique(),
  amount: doublePrecision('amount').notNull(),
  currency: text('currency').default('DOP').notNull(),
  status: text('status').notNull().default('PENDING'), // 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  paymentMethod: text('payment_method').notNull(), // 'CARD' | 'CASH' | 'BANK_TRANSFER'
  cardBrand: text('card_brand'),
  lastFourDigits: text('last_four_digits'), // Safe snapshot, NEVER full number or CVV
  rawResponse: jsonb('raw_response').$type<any>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 12. Commissions
export const commissions = pgTable('commissions', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id).notNull(),
  storeId: text('store_id').references(() => stores.id).notNull(),
  saleAmount: doublePrecision('sale_amount').notNull(),
  commissionRate: doublePrecision('commission_rate').notNull(), // Historical rate saved on the order
  amount: doublePrecision('amount').notNull(),
  status: text('status').notNull().default('COLLECTED'), // 'COLLECTED' | 'PENDING' | 'RETAINED'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 13. Store Transactions (Financial Ledger)
export const storeTransactions = pgTable('store_transactions', {
  id: text('id').primaryKey(),
  storeId: text('store_id').references(() => stores.id).notNull(),
  orderId: text('order_id'),
  type: text('type').notNull(), // 'ORDER_SALE' | 'CASH_COMMISSION' | 'CARD_COMMISSION' | 'PAYOUT' | 'ADJUSTMENT'
  amount: doublePrecision('amount').notNull(),
  description: text('description').notNull(),
  balanceAfter: doublePrecision('balance_after').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 14. Store Payout Accounts
export const storePayoutAccounts = pgTable('store_payout_accounts', {
  id: text('id').primaryKey(),
  storeId: text('store_id').references(() => stores.id).notNull(),
  bankName: text('bank_name').notNull(),
  accountType: text('account_type').notNull(), // 'CORRIENTE' | 'AHORROS'
  accountNumber: text('account_number').notNull(),
  holderName: text('holder_name').notNull(),
  holderIdNumber: text('holder_id_number').notNull(),
  isVerified: boolean('is_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 15. Store Payouts (Liquidaciones)
export const storePayouts = pgTable('store_payouts', {
  id: text('id').primaryKey(),
  payoutNumber: text('payout_number').notNull().unique(),
  storeId: text('store_id').references(() => stores.id).notNull(),
  amount: doublePrecision('amount').notNull(),
  status: text('status').notNull().default('PENDING'), // 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REJECTED'
  bankDetails: jsonb('bank_details').$type<any>().notNull(),
  referenceNumber: text('reference_number'),
  processedAt: timestamp('processed_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 16. Payout Details
export const payoutDetails = pgTable('payout_details', {
  id: text('id').primaryKey(),
  payoutId: text('payout_id').references(() => storePayouts.id).notNull(),
  orderId: text('order_id').references(() => orders.id).notNull(),
  orderAmount: doublePrecision('order_amount').notNull(),
  commissionAmount: doublePrecision('commission_amount').notNull(),
  netAmount: doublePrecision('net_amount').notNull(),
});

// 17. Shipments
export const shipments = pgTable('shipments', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id).notNull(),
  carrierName: text('carrier_name').notNull(),
  trackingNumber: text('tracking_number'),
  status: text('status').notNull().default('PREPARING'),
  shippedAt: timestamp('shipped_at'),
  estimatedDelivery: timestamp('estimated_delivery'),
  deliveredAt: timestamp('delivered_at'),
});

// 18. Delivery Confirmations
export const deliveryConfirmations = pgTable('delivery_confirmations', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id).notNull().unique(),
  validatedDeliveryCode: text('validated_delivery_code').notNull(),
  confirmedByUserId: text('confirmed_by_user_id').references(() => users.id).notNull(),
  confirmedAt: timestamp('confirmed_at').defaultNow().notNull(),
  signatureUrl: text('signature_url'),
  notes: text('notes'),
});

// 19. Advertisements
export const advertisements = pgTable('advertisements', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type').notNull().default('INTERNAL'), // 'INTERNAL' | 'EXTERNAL'
  advertiserName: text('advertiser_name').notNull(),
  placement: text('placement').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  imageUrl: text('image_url').notNull(),
  mobileImageUrl: text('mobile_image_url'),
  videoUrl: text('video_url'),
  ctaText: text('cta_text'),
  targetUrl: text('target_url').notNull(),
  targetWindow: text('target_window').default('_self').notNull(),
  priority: integer('priority').default(5).notNull(),
  targetDevice: text('target_device').default('ALL').notNull(),
  targetCategory: text('target_category'),
  targetStoreId: text('target_store_id'),
  sponsorStoreId: text('sponsor_store_id'),
  budget: doublePrecision('budget'),
  isActive: boolean('is_active').default(true).notNull(),
  impressions: integer('impressions').default(0).notNull(),
  clicks: integer('clicks').default(0).notNull(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 20. Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  userName: text('user_name'),
  userRole: text('user_role'),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  details: jsonb('details').$type<any>(),
  ipAddress: text('ip_address'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// 21. System Settings
export const systemSettingsTable = pgTable('system_settings', {
  id: text('id').primaryKey(), // 'default'
  marketplaceName: text('marketplace_name').default('PlazaDO.com').notNull(),
  supportPhone: text('support_phone').notNull(),
  whatsappCommercial: text('whatsapp_commercial').notNull(),
  contactEmail: text('contact_email').notNull(),
  defaultCommissionRate: doublePrecision('default_commission_rate').default(0.30).notNull(),
  minPayoutAmount: doublePrecision('min_payout_amount').default(1000).notNull(),
  payoutSchedule: text('payout_schedule').default('WEEKLY').notNull(),
  autoApproveStores: boolean('auto_approve_stores').default(false).notNull(),
  maintenanceMode: boolean('maintenance_mode').default(false).notNull(),
  allowedProvinces: jsonb('allowed_provinces').$type<string[]>().default([]),
  rawConfig: jsonb('raw_config').$type<any>().default({}),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const storesRelations = relations(stores, ({ one, many }) => ({
  owner: one(users, {
    fields: [stores.ownerId],
    references: [users.id],
  }),
  members: many(storeMembers),
  products: many(products),
  orders: many(orders),
  transactions: many(storeTransactions),
  payoutAccounts: many(storePayoutAccounts),
  payouts: many(storePayouts),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  store: one(stores, {
    fields: [products.storeId],
    references: [stores.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  images: many(productImages),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(users, {
    fields: [orders.customerId],
    references: [users.id],
  }),
  store: one(stores, {
    fields: [orders.storeId],
    references: [stores.id],
  }),
  details: many(orderDetails),
  payments: many(payments),
  commissions: many(commissions),
  deliveryConfirmation: one(deliveryConfirmations, {
    fields: [orders.id],
    references: [deliveryConfirmations.orderId],
  }),
}));

export const orderDetailsRelations = relations(orderDetails, ({ one }) => ({
  order: one(orders, {
    fields: [orderDetails.orderId],
    references: [orders.id],
  }),
}));
