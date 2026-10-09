import { db } from '../src/db/index.ts';
import { 
  users, 
  stores, 
  storeMembers, 
  categories, 
  products, 
  productImages, 
  carts, 
  cartItems, 
  orders, 
  orderDetails, 
  payments, 
  commissions, 
  storeTransactions, 
  storePayoutAccounts, 
  storePayouts, 
  payoutDetails, 
  shipments, 
  deliveryConfirmations, 
  advertisements, 
  auditLogs, 
  systemSettingsTable 
} from '../src/db/schema.ts';
import { eq, and, sql, desc } from 'drizzle-orm';
import crypto from 'crypto';

// Helpers
export function generateDeliveryCode(): string {
  // 6-digit non-predictable secure PIN
  return crypto.randomInt(100000, 999999).toString();
}

export function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${dateStr}-${rand}`;
}

export function generateOrderGroupCode(): string {
  return `GRP-${Date.now()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

export class CloudSqlRepository {
  // -------------------------------------------------------------
  // USERS
  // -------------------------------------------------------------
  async getAllUsers() {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async findUserById(id: string) {
    const res = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return res[0] || null;
  }

  async findUserByEmail(email: string) {
    const res = await db.select().from(users).where(sql`LOWER(${users.email}) = LOWER(${email})`).limit(1);
    return res[0] || null;
  }

  async createUser(data: {
    id?: string;
    email: string;
    name: string;
    role?: string;
    phone?: string;
    avatar?: string;
    storeId?: string;
    passwordHash?: string;
    addresses?: any[];
  }) {
    const id = data.id || `user-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const [newUser] = await db.insert(users).values({
      id,
      email: data.email.toLowerCase().trim(),
      name: data.name.trim(),
      role: data.role || 'CUSTOMER',
      phone: data.phone || null,
      avatar: data.avatar || null,
      storeId: data.storeId || null,
      passwordHash: data.passwordHash || null,
      addresses: data.addresses || [],
    }).returning();
    return newUser;
  }

  async updateUser(id: string, data: Partial<{
    name: string;
    phone: string;
    avatar: string;
    storeId: string;
    addresses: any[];
    role: string;
  }>) {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated || null;
  }

  async deleteUser(id: string) {
    try {
      await db.delete(storeMembers).where(eq(storeMembers.userId, id));
      await db.update(stores).set({ ownerId: null }).where(eq(stores.ownerId, id));
      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (e) {
      console.error(`[CloudSQL] Error deleting user ${id}:`, e);
      return false;
    }
  }

  // -------------------------------------------------------------
  // STORES
  // -------------------------------------------------------------
  async getAllStores() {
    return await db.select().from(stores).orderBy(desc(stores.createdAt));
  }

  async findStoreById(id: string) {
    const res = await db.select().from(stores).where(eq(stores.id, id)).limit(1);
    return res[0] || null;
  }

  async findStoreBySlug(slug: string) {
    const res = await db.select().from(stores).where(eq(stores.slug, slug.toLowerCase())).limit(1);
    return res[0] || null;
  }

  async createStore(data: {
    id?: string;
    name: string;
    slug?: string;
    ownerId?: string;
    email: string;
    phone?: string;
    whatsapp?: string;
    address?: string;
    province?: string;
    municipality?: string;
    sector?: string;
    logoUrl?: string;
    bannerUrl?: string;
    description?: string;
    shippingConfig?: any;
    bankInfo?: any;
    status?: string;
  }) {
    const id = data.id || `store-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    // If store already exists, update and return it (safe idempotency)
    const existing = await this.findStoreById(id);
    if (existing) {
      const updated = await this.updateStore(id, data);
      return updated || existing;
    }

    let slug = (data.slug || data.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || id;

    // Check slug collision
    const existingSlug = await this.findStoreBySlug(slug);
    if (existingSlug && existingSlug.id !== id) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // Safeguard ownerId against foreign key violation (stores.owner_id -> users.id)
    let finalOwnerId: string | null = null;
    if (data.ownerId) {
      const ownerExists = await this.findUserById(data.ownerId);
      if (ownerExists) {
        finalOwnerId = data.ownerId;
      } else {
        const byEmail = await this.findUserByEmail(data.email);
        if (byEmail) {
          finalOwnerId = byEmail.id;
        } else {
          // If a valid ID is provided, auto-create owner user in users table so foreign key is satisfied
          try {
            const newOwner = await this.createUser({
              id: data.ownerId,
              email: data.email || `${data.ownerId}@plazado.com`,
              name: data.name ? `${data.name} Titular` : 'Propietario',
              role: 'STORE_OWNER',
              phone: data.phone || '',
              storeId: id
            });
            finalOwnerId = newOwner.id;
          } catch (userCreateErr) {
            console.warn('[CloudSQL] Could not auto-create owner user, setting ownerId to null to satisfy foreign key:', userCreateErr);
            finalOwnerId = null;
          }
        }
      }
    }

    const [newStore] = await db.insert(stores).values({
      id,
      name: data.name.trim(),
      slug,
      ownerId: finalOwnerId,
      email: data.email.toLowerCase().trim(),
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      address: data.address || null,
      province: data.province || 'Distrito Nacional',
      municipality: data.municipality || null,
      sector: data.sector || null,
      logoUrl: data.logoUrl || null,
      bannerUrl: data.bannerUrl || null,
      description: data.description || null,
      status: data.status || 'APPROVED',
      isPublished: true,
      balance: 0,
      pendingBalance: 0,
      availableBalance: 0,
      commissionRate: 0.30,
      bankInfo: data.bankInfo || null,
      shippingConfig: data.shippingConfig || null,
    }).returning();

    // Create StoreMember relation only if owner exists
    if (finalOwnerId) {
      try {
        await db.insert(storeMembers).values({
          id: `member-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          storeId: id,
          userId: finalOwnerId,
          role: 'OWNER',
        }).onConflictDoNothing();

        // Update user storeId
        await db.update(users).set({ storeId: id, role: 'STORE_OWNER' }).where(eq(users.id, finalOwnerId));
      } catch (memberErr) {
        console.warn('[CloudSQL] Warning setting storeMember relation:', memberErr);
      }
    }

    return newStore;
  }

  async updateStore(id: string, data: Partial<{
    name: string;
    slug: string;
    email: string;
    phone: string;
    whatsapp: string;
    address: string;
    province: string;
    municipality: string;
    sector: string;
    logoUrl: string;
    bannerUrl: string;
    description: string;
    status: string;
    isPublished: boolean;
    bankInfo: any;
    shippingConfig: any;
  }>) {
    const [updated] = await db.update(stores).set({
      ...data,
      updatedAt: new Date(),
    }).where(eq(stores.id, id)).returning();
    return updated || null;
  }

  async verifyStoreAccess(storeId: string, userId: string): Promise<boolean> {
    const store = await this.findStoreById(storeId);
    if (!store) return false;
    if (store.ownerId === userId) return true;

    // Check store members
    const member = await db.select().from(storeMembers).where(
      and(eq(storeMembers.storeId, storeId), eq(storeMembers.userId, userId))
    ).limit(1);

    return member.length > 0;
  }

  async deleteStore(id: string) {
    try {
      const storeProducts = await db.select({ id: products.id }).from(products).where(eq(products.storeId, id));
      for (const p of storeProducts) {
        await db.delete(productImages).where(eq(productImages.productId, p.id));
      }
      await db.delete(products).where(eq(products.storeId, id));
      await db.delete(storeMembers).where(eq(storeMembers.storeId, id));
      await db.update(users).set({ storeId: null, role: 'BUYER' }).where(eq(users.storeId, id));
      await db.delete(stores).where(eq(stores.id, id));
      return true;
    } catch (e) {
      console.error(`[CloudSQL] Error deleting store ${id}:`, e);
      return false;
    }
  }

  // -------------------------------------------------------------
  // PRODUCTS & IMAGES
  // -------------------------------------------------------------
  async getAllProducts() {
    const prods = await db.select().from(products).orderBy(desc(products.createdAt));
    const images = await db.select().from(productImages).orderBy(productImages.order);

    // Group images by productId
    const imageMap = new Map<string, string[]>();
    for (const img of images) {
      if (!imageMap.has(img.productId)) {
        imageMap.set(img.productId, []);
      }
      imageMap.get(img.productId)!.push(img.url);
    }

    return prods.map(p => ({
      ...p,
      images: imageMap.get(p.id) || [],
      imageUrl: (imageMap.get(p.id) && imageMap.get(p.id)![0]) || null,
    }));
  }

  async getProductsByStore(storeId: string) {
    const all = await this.getAllProducts();
    return all.filter(p => p.storeId === storeId);
  }

  async getProductsByCategory(categoryId: string) {
    const all = await this.getAllProducts();
    return all.filter(p => p.categoryId === categoryId && p.status === 'active');
  }

  async findProductById(id: string) {
    const [prod] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!prod) return null;

    const imgs = await db.select().from(productImages)
      .where(eq(productImages.productId, id))
      .orderBy(productImages.order);

    const imageUrls = imgs.map(i => i.url);
    return {
      ...prod,
      images: imageUrls,
      imageUrl: imageUrls[0] || null,
    };
  }

  async createProduct(data: {
    id?: string;
    storeId: string;
    categoryId: string;
    name: string;
    slug?: string;
    description?: string;
    sku?: string;
    price: number;
    promoPrice?: number | null;
    stock: number;
    status?: string;
    isFeatured?: boolean;
    tags?: string[];
    images?: string[];
  }) {
    const id = data.id || `prod-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    // If product already exists, update and return it (safe idempotency)
    const existing = await this.findProductById(id);
    if (existing) {
      const updated = await this.updateProduct(id, data);
      return updated || existing;
    }

    const slug = (data.slug || data.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || id;
    const sku = data.sku || `SKU-${Date.now().toString().slice(-6)}`;

    const [newProd] = await db.insert(products).values({
      id,
      storeId: data.storeId,
      categoryId: data.categoryId,
      name: data.name.trim(),
      slug,
      description: data.description || null,
      sku,
      price: Number(data.price),
      promoPrice: data.promoPrice ? Number(data.promoPrice) : null,
      stock: Math.max(0, Math.floor(Number(data.stock) || 0)),
      status: data.status || 'active',
      isFeatured: data.isFeatured || false,
      tags: data.tags || [],
    }).returning();

    // Insert images (Max 5 images as required)
    const rawImages = (data.images || []).slice(0, 5);
    for (let i = 0; i < rawImages.length; i++) {
      await db.insert(productImages).values({
        id: `img-${id}-${i}-${Date.now()}`,
        productId: id,
        url: rawImages[i],
        order: i,
        isMain: i === 0,
      });
    }

    return {
      ...newProd,
      images: rawImages,
      imageUrl: rawImages[0] || null,
    };
  }

  async updateProduct(id: string, data: Partial<{
    name: string;
    categoryId: string;
    description: string;
    price: number;
    promoPrice: number | null;
    stock: number;
    status: string;
    isFeatured: boolean;
    tags: string[];
    images: string[];
  }>) {
    const updatePayload: any = { updatedAt: new Date() };
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.categoryId !== undefined) updatePayload.categoryId = data.categoryId;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.price !== undefined) updatePayload.price = Number(data.price);
    if (data.promoPrice !== undefined) updatePayload.promoPrice = data.promoPrice ? Number(data.promoPrice) : null;
    if (data.stock !== undefined) updatePayload.stock = Math.max(0, Math.floor(Number(data.stock)));
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.isFeatured !== undefined) updatePayload.isFeatured = data.isFeatured;
    if (data.tags !== undefined) updatePayload.tags = data.tags;

    const [updated] = await db.update(products).set(updatePayload).where(eq(products.id, id)).returning();
    if (!updated) return null;

    if (data.images && Array.isArray(data.images)) {
      // Replace images (max 5)
      await db.delete(productImages).where(eq(productImages.productId, id));
      const imgs = data.images.slice(0, 5);
      for (let i = 0; i < imgs.length; i++) {
        await db.insert(productImages).values({
          id: `img-${id}-${i}-${Date.now()}`,
          productId: id,
          url: imgs[i],
          order: i,
          isMain: i === 0,
        });
      }
    }

    return await this.findProductById(id);
  }

  async deleteProduct(id: string) {
    await db.delete(productImages).where(eq(productImages.productId, id));
    await db.delete(products).where(eq(products.id, id));
    return true;
  }

  // -------------------------------------------------------------
  // CATEGORIES
  // -------------------------------------------------------------
  async getAllCategories() {
    return await db.select().from(categories).orderBy(categories.order);
  }

  async createCategory(data: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    parentId?: string | null;
    order?: number;
  }) {
    const existing = await db.select().from(categories).where(eq(categories.id, data.id)).limit(1);
    if (existing.length > 0) return existing[0];
    const [cat] = await db.insert(categories).values({
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      icon: data.icon || null,
      parentId: data.parentId || null,
      order: data.order || 0,
      isActive: true
    }).onConflictDoNothing().returning();
    return cat || null;
  }

  // -------------------------------------------------------------
  // CART
  // -------------------------------------------------------------
  async getCartByUser(userId: string) {
    let [userCart] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
    if (!userCart) {
      const cartId = `cart-${userId}`;
      [userCart] = await db.insert(carts).values({
        id: cartId,
        userId,
      }).returning();
    }

    const items = await db.select().from(cartItems).where(eq(cartItems.cartId, userCart.id));
    return {
      cart: userCart,
      items,
    };
  }

  async addToCart(userId: string, productId: string, storeId: string, quantity: number = 1) {
    const { cart } = await this.getCartByUser(userId);

    // Check if product already in cart
    const existing = await db.select().from(cartItems).where(
      and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId))
    ).limit(1);

    if (existing.length > 0) {
      const updatedQty = existing[0].quantity + quantity;
      await db.update(cartItems).set({ quantity: updatedQty }).where(eq(cartItems.id, existing[0].id));
    } else {
      await db.insert(cartItems).values({
        id: `ci-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        cartId: cart.id,
        productId,
        storeId,
        quantity,
      });
    }

    await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cart.id));
    return await this.getCartByUser(userId);
  }

  async clearCart(userId: string) {
    const [userCart] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
    if (userCart) {
      await db.delete(cartItems).where(eq(cartItems.cartId, userCart.id));
    }
  }

  // -------------------------------------------------------------
  // ORDERS & MULTI-STORE SPLIT CHECKOUT
  // -------------------------------------------------------------
  async getAllOrders() {
    const ords = await db.select().from(orders).orderBy(desc(orders.createdAt));
    const details = await db.select().from(orderDetails);

    // Group details by orderId
    const detailsMap = new Map<string, any[]>();
    for (const d of details) {
      if (!detailsMap.has(d.orderId)) detailsMap.set(d.orderId, []);
      detailsMap.get(d.orderId)!.push(d);
    }

    return ords.map(o => ({
      ...o,
      items: (detailsMap.get(o.id) || []).map(d => ({
        id: d.id,
        productId: d.productId,
        productName: d.productName,
        productImage: d.productImage,
        sku: d.sku,
        price: d.price,
        quantity: d.quantity,
        subtotal: d.price * d.quantity,
      })),
    }));
  }

  async getOrdersByStore(storeId: string) {
    const all = await this.getAllOrders();
    return all.filter(o => o.storeId === storeId);
  }

  async getOrdersByCustomer(customerId: string) {
    const all = await this.getAllOrders();
    return all.filter(o => o.customerId === customerId);
  }

  async findOrderById(id: string) {
    const all = await this.getAllOrders();
    return all.find(o => o.id === id) || null;
  }

  /**
   * CRITICAL CHECKOUT ENGINE:
   * 1. Re-queries actual products and prices from backend (never trusts frontend prices/calculations)
   * 2. Groups items by Store: creates an independent Order for each Store
   * 3. Calculates subtotal, shipping, commission (current rate), storeNetEarnings strictly on server
   * 4. Generates unique orderNumber and non-predictable deliveryCode
   * 5. Saves product snapshots in orderDetails
   * 6. Updates stock
   * 7. Handles paymentMethod = CASH vs CARD
   * 8. Records Commission and StoreTransaction ledger
   */
  async createMultiStoreOrders(input: {
    customerId: string;
    items: { productId: string; quantity: number }[];
    shippingAddress: any;
    paymentMethod: 'CARD' | 'CASH' | 'CARD_AZUL' | 'CASH_ON_DELIVERY' | 'BANK_TRANSFER';
    notes?: string;
    commissionRate?: number;
  }) {
    const customer = await this.findUserById(input.customerId);
    if (!customer) throw new Error('Cliente no encontrado en el sistema');

    // 1. Fetch fresh products from Cloud SQL
    const allDbProducts = await this.getAllProducts();
    const productMap = new Map(allDbProducts.map(p => [p.id, p]));

    // 2. Validate items and group by Store
    const storeItemsMap = new Map<string, { product: any; quantity: number }[]>();

    for (const item of input.items) {
      const prod = productMap.get(item.productId);
      if (!prod) throw new Error(`Producto ${item.productId} no existe o fue retirado`);
      if (prod.stock < item.quantity) {
        throw new Error(`Stock insuficiente para "${prod.name}". Disponible: ${prod.stock}`);
      }

      if (!storeItemsMap.has(prod.storeId)) {
        storeItemsMap.set(prod.storeId, []);
      }
      storeItemsMap.get(prod.storeId)!.push({ product: prod, quantity: item.quantity });
    }

    const orderGroupCode = generateOrderGroupCode();
    const createdOrders: any[] = [];
    const commissionRate = input.commissionRate ?? 0.30; // Decimal rate for new orders

    // 3. Process each Store's independent order
    for (const [storeId, storeItems] of storeItemsMap.entries()) {
      const store = await this.findStoreById(storeId);
      if (!store) continue;

      let subtotal = 0;
      for (const entry of storeItems) {
        const itemPrice = entry.product.promoPrice || entry.product.price;
        subtotal += itemPrice * entry.quantity;
      }

      // Calculate server-side shipping
      let shippingCost = 250; // Default local shipping RD$
      if (store.shippingConfig && typeof store.shippingConfig.flatRate === 'number') {
        shippingCost = store.shippingConfig.flatRate;
      }
      if (store.shippingConfig?.freeShippingAbove && subtotal >= store.shippingConfig.freeShippingAbove) {
        shippingCost = 0;
      }

      const total = subtotal + shippingCost;
      const plazaCommissionAmount = Math.round(total * commissionRate * 100) / 100;
      const storeNetEarnings = total - plazaCommissionAmount;

      const orderId = `ord-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const orderNumber = generateOrderNumber();
      const deliveryCode = generateDeliveryCode();

      const isCash = input.paymentMethod === 'CASH' || input.paymentMethod === 'CASH_ON_DELIVERY';
      const initialStatus = 'PENDING';
      const initialPaymentStatus = isCash ? 'PENDING' : 'PAID'; // Card is confirmed by gateway

      const [newOrder] = await db.insert(orders).values({
        id: orderId,
        orderNumber,
        orderGroupCode,
        customerId: customer.id,
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone || '',
        storeId: store.id,
        storeName: store.name,
        status: initialStatus,
        paymentMethod: input.paymentMethod,
        paymentStatus: initialPaymentStatus,
        subtotal,
        shippingCost,
        discount: 0,
        total,
        plazaCommissionRate: commissionRate,
        plazaCommissionAmount,
        storeNetEarnings,
        deliveryCode,
        shippingAddress: input.shippingAddress,
        statusHistory: [{
          status: initialStatus,
          timestamp: new Date().toISOString(),
          note: 'Pedido recibido en plataforma',
        }],
        notes: input.notes || null,
      }).returning();

      // 4. Save snapshots into orderDetails and decrement product stock
      for (const entry of storeItems) {
        const p = entry.product;
        const itemPrice = p.promoPrice || p.price;

        await db.insert(orderDetails).values({
          id: `det-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          orderId: newOrder.id,
          productId: p.id,
          productName: p.name,
          productImage: p.imageUrl || '',
          sku: p.sku || '',
          price: itemPrice,
          quantity: entry.quantity,
        });

        // Decrement stock in Cloud SQL
        const newStock = Math.max(0, p.stock - entry.quantity);
        await db.update(products).set({
          stock: newStock,
          soldCount: (p.soldCount || 0) + entry.quantity,
        }).where(eq(products.id, p.id));
      }

      // 5. Record Commission Record (historical rate preserved)
      await db.insert(commissions).values({
        id: `comm-${newOrder.id}`,
        orderId: newOrder.id,
        storeId: store.id,
        saleAmount: total,
        commissionRate,
        amount: plazaCommissionAmount,
        status: isCash ? 'PENDING' : 'COLLECTED',
      });

      // 6. Financial Ledger: StoreTransaction & Balances
      if (isCash) {
        // When CASH: Store receives cash directly. 
        // The recorded commission is a debt/payable to Plazado.com
        const currentBalance = store.balance || 0;
        const newBalance = currentBalance - plazaCommissionAmount;

        await db.insert(storeTransactions).values({
          id: `tx-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          storeId: store.id,
          orderId: newOrder.id,
          type: 'CASH_COMMISSION',
          amount: -plazaCommissionAmount,
          description: `Comisión PlazaDO ${Number((commissionRate * 100).toFixed(4))}% por venta en efectivo #${orderNumber}`,
          balanceAfter: newBalance,
        });

        await db.update(stores).set({
          balance: newBalance,
          updatedAt: new Date(),
        }).where(eq(stores.id, store.id));
      } else {
        // When CARD: Net amount is credited to store balance
        const currentBalance = store.balance || 0;
        const newBalance = currentBalance + storeNetEarnings;

        await db.insert(storeTransactions).values({
          id: `tx-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          storeId: store.id,
          orderId: newOrder.id,
          type: 'ORDER_SALE',
          amount: storeNetEarnings,
          description: `Venta acreditada con tarjeta #${orderNumber} (Neto tras comisión ${Number((commissionRate * 100).toFixed(4))}%)`,
          balanceAfter: newBalance,
        });

        await db.update(stores).set({
          balance: newBalance,
          availableBalance: (store.availableBalance || 0) + storeNetEarnings,
          updatedAt: new Date(),
        }).where(eq(stores.id, store.id));

        // Create Payment record
        await db.insert(payments).values({
          id: `pay-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
          orderId: newOrder.id,
          orderGroupCode,
          provider: 'AZUL',
          providerTransactionId: `TX-AZUL-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
          amount: total,
          currency: 'DOP',
          status: 'COMPLETED',
          paymentMethod: 'CARD',
          cardBrand: 'VISA',
          lastFourDigits: '4242',
        });
      }

      createdOrders.push(newOrder);
    }

    // Clear customer's cart
    await this.clearCart(customer.id);

    return {
      orderGroupCode,
      orders: createdOrders,
    };
  }

  async saveRawOrders(rawOrders: any[]) {
    for (const ord of rawOrders) {
      const commissionRate = ord.plazaCommissionRate ?? 0.30; // Preserve each order’s recorded rate.
      const orderId = ord.id;
      const orderNumber = ord.orderNumber || generateOrderNumber();
      const deliveryCode = ord.deliveryConfirmationCode || ord.deliveryCode || generateDeliveryCode();
      const subtotal = ord.subtotal || (ord.total - (ord.shippingCost || 0));
      const total = ord.total || subtotal;
      const commissionAmount = ord.plazaCommissionAmount ?? Math.round(total * commissionRate * 100) / 100;
      const storeNetEarnings = ord.storeNetEarnings ?? (total - commissionAmount);
      const isCash = ord.paymentMethod === 'CASH_ON_DELIVERY' || ord.paymentMethod === 'CASH';

      // 1. Insert order
      await db.insert(orders).values({
        id: orderId,
        orderNumber,
        orderGroupCode: ord.orderGroupCode || orderNumber,
        customerId: ord.customerId || 'cust-direct',
        customerName: ord.customerName || 'Cliente PlazaDO',
        customerEmail: ord.customerEmail || 'cliente@plazado.com',
        customerPhone: ord.customerPhone || '',
        storeId: ord.storeId,
        storeName: ord.storeName || '',
        status: ord.status || 'PENDING',
        paymentMethod: ord.paymentMethod || 'CARD_AZUL',
        paymentStatus: ord.paymentStatus || (isCash ? 'PENDING' : 'PAID'),
        subtotal,
        shippingCost: ord.shippingCost || 0,
        discount: ord.discount || 0,
        total,
        plazaCommissionRate: commissionRate,
        plazaCommissionAmount: commissionAmount,
        storeNetEarnings,
        deliveryCode,
        shippingAddress: ord.shippingAddress || {},
        statusHistory: ord.statusHistory || [],
        notes: ord.notes || null,
      }).onConflictDoNothing();

      // 2. Insert order details
      if (Array.isArray(ord.items)) {
        for (const it of ord.items) {
          const detailId = `det-${orderId}-${it.productId || it.id}`;
          await db.insert(orderDetails).values({
            id: detailId,
            orderId,
            productId: it.productId || it.id,
            productName: it.productName || it.name || 'Producto',
            productImage: it.productImage || it.imageUrl || '',
            sku: it.sku || '',
            price: it.price || 0,
            quantity: it.quantity || 1,
          }).onConflictDoNothing();

          // Update stock in Cloud SQL
          if (it.productId) {
            await db.update(products).set({
              stock: sql`GREATEST(0, ${products.stock} - ${it.quantity || 1})`,
              soldCount: sql`${products.soldCount} + ${it.quantity || 1}`,
            }).where(eq(products.id, it.productId));
          }
        }
      }

      // 3. Commission record
      await db.insert(commissions).values({
        id: `comm-${orderId}`,
        orderId,
        storeId: ord.storeId,
        saleAmount: total,
        commissionRate,
        amount: commissionAmount,
        status: isCash ? 'PENDING' : 'COLLECTED',
      }).onConflictDoNothing();

      // 4. Financial Ledger (StoreTransaction & Balance)
      const store = await this.findStoreById(ord.storeId);
      if (store) {
        if (isCash) {
          const newBal = (store.balance || 0) - commissionAmount;
          await db.insert(storeTransactions).values({
            id: `tx-${orderId}-comm`,
            storeId: store.id,
            orderId,
            type: 'CASH_COMMISSION',
            amount: -commissionAmount,
            description: `Comisión PlazaDO ${Number((commissionRate * 100).toFixed(4))}% por venta en efectivo #${orderNumber}`,
            balanceAfter: newBal,
          }).onConflictDoNothing();

          await db.update(stores).set({
            balance: newBal,
            updatedAt: new Date(),
          }).where(eq(stores.id, store.id));
        } else {
          const newBal = (store.balance || 0) + storeNetEarnings;
          await db.insert(storeTransactions).values({
            id: `tx-${orderId}-sale`,
            storeId: store.id,
            orderId,
            type: 'ORDER_SALE',
            amount: storeNetEarnings,
            description: `Venta acreditada con tarjeta #${orderNumber} (Neto tras comisión ${Number((commissionRate * 100).toFixed(4))}%)`,
            balanceAfter: newBal,
          }).onConflictDoNothing();

          await db.update(stores).set({
            balance: newBal,
            availableBalance: (store.availableBalance || 0) + storeNetEarnings,
            updatedAt: new Date(),
          }).where(eq(stores.id, store.id));

          await db.insert(payments).values({
            id: `pay-${orderId}`,
            orderId,
            orderGroupCode: ord.orderGroupCode || orderNumber,
            provider: 'AZUL',
            providerTransactionId: `TX-AZUL-${orderId}`,
            amount: total,
            currency: 'DOP',
            status: 'COMPLETED',
            paymentMethod: 'CARD',
            cardBrand: 'VISA',
            lastFourDigits: '4242',
          }).onConflictDoNothing();
        }
      }
    }
  }

  // -------------------------------------------------------------
  // DELIVERY VERIFICATION WITH SECRET CODE
  // -------------------------------------------------------------
  async confirmDelivery(orderId: string, deliveryCodeProvided: string, confirmedByUserId: string) {
    const order = await this.findOrderById(orderId);
    if (!order) throw new Error('Pedido no encontrado');

    if (order.status === 'DELIVERED') {
      throw new Error('Este pedido ya fue entregado y confirmado previamente');
    }

    // Verify delivery code strictly
    if (order.deliveryCode.trim() !== deliveryCodeProvided.trim()) {
      throw new Error('Código de entrega incorrecto. Verifique el código con el cliente.');
    }

    // Mark Order as DELIVERED
    const now = new Date();
    await db.update(orders).set({
      status: 'DELIVERED',
      updatedAt: now,
    }).where(eq(orders.id, orderId));

    // Record DeliveryConfirmation
    await db.insert(deliveryConfirmations).values({
      id: `conf-${orderId}`,
      orderId,
      validatedDeliveryCode: deliveryCodeProvided.trim(),
      confirmedByUserId,
      confirmedAt: now,
      notes: 'Entrega validada exitosamente mediante código secreto',
    }).onConflictDoNothing();

    // Record AuditLog
    await db.insert(auditLogs).values({
      id: `audit-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      userId: confirmedByUserId,
      action: 'DELIVERY_CONFIRMED',
      entityType: 'ORDER',
      entityId: orderId,
      details: { orderNumber: order.orderNumber, deliveredAt: now.toISOString() },
    });

    return await this.findOrderById(orderId);
  }

  // -------------------------------------------------------------
  // AUDIT LOGS & SETTINGS
  // -------------------------------------------------------------
  async getAllAuditLogs() {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(200);
  }

  async addAuditLog(entry: {
    userId?: string;
    userName?: string;
    userRole?: string;
    action: string;
    entityType: string;
    entityId?: string;
    details?: any;
    ipAddress?: string;
  }) {
    const [log] = await db.insert(auditLogs).values({
      id: `log-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      userId: entry.userId || null,
      userName: entry.userName || null,
      userRole: entry.userRole || null,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId || null,
      details: entry.details || null,
      ipAddress: entry.ipAddress || null,
    }).returning();
    return log;
  }

  // -------------------------------------------------------------
  // ADVERTISEMENTS
  // -------------------------------------------------------------
  async getAllAdvertisements() {
    return await db.select().from(advertisements).orderBy(advertisements.order);
  }

  async createAdvertisement(data: any) {
    const id = data.id || `ad-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const [newAd] = await db.insert(advertisements).values({
      id,
      title: data.title,
      description: data.description || null,
      type: data.type || 'INTERNAL',
      advertiserName: data.advertiserName || 'Plazado Publicidad',
      placement: data.placement,
      startDate: data.startDate || new Date().toISOString().slice(0, 10),
      endDate: data.endDate || '2030-12-31',
      imageUrl: data.imageUrl,
      mobileImageUrl: data.mobileImageUrl || null,
      videoUrl: data.videoUrl || null,
      ctaText: data.ctaText || 'Ver Más',
      targetUrl: data.targetUrl,
      targetWindow: data.targetWindow || '_self',
      priority: data.priority || 5,
      targetDevice: data.targetDevice || 'ALL',
      targetCategory: data.targetCategory || null,
      targetStoreId: data.targetStoreId || null,
      sponsorStoreId: data.sponsorStoreId || null,
      budget: data.budget || null,
      isActive: data.isActive !== false,
      impressions: 0,
      clicks: 0,
      order: data.order || 0,
    }).returning();
    return newAd;
  }
}

export const cloudSqlRepo = new CloudSqlRepository();
