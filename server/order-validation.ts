import crypto from 'crypto';
import { isProductPubliclyVisible, isStorePubliclyVisible } from '../src/types';
export const checkoutOrderId = (customerId: string, key: string) => `ORD-${crypto.createHash('sha256').update(`${customerId}:${key}`).digest('hex').slice(0,32)}`;
const money = (amount: number) => Math.round(amount * 100) / 100;
export function validateOrders(requests: any[], state: any, customer: any): any[] {
  if (!Array.isArray(requests) || !requests.length || requests.length > 20) throw Error('Carrito inválido');
  const quantities = new Map<string, number>();
  const seenStores = new Set<string>();
  return requests.map(request => {
    if (request.paymentMethod !== 'CASH_ON_DELIVERY') throw Error('Este método de pago todavía no tiene una integración verificada. Elige efectivo contra entrega.');
    if (state.systemSettings.activePaymentMethods?.cashOnDelivery === false) throw Error('El pago contra entrega no está habilitado');
    const store = state.stores.find((s: any) => s.id === request.storeId);
    if (!store || !isStorePubliclyVisible(store) || seenStores.has(store.id)) throw Error('Tienda no disponible o duplicada');
    seenStores.add(store.id);
    if (!Array.isArray(request.items) || !request.items.length || request.items.length > 100) throw Error('Artículos inválidos');
    const items = request.items.map((item: any) => {
      const product = state.products.find((p: any) => p.id === item.productId);
      if (!product || product.storeId !== store.id || !isProductPubliclyVisible(product)) throw Error('Producto no disponible');
      if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) throw Error('La cantidad debe ser un entero positivo');
      const quantity = (quantities.get(product.id) || 0) + item.quantity;
      quantities.set(product.id, quantity);
      if (quantity > product.stock) throw Error(`Inventario insuficiente para ${product.name}`);
      const price = typeof product.promoPrice === 'number' && product.promoPrice > 0 && product.promoPrice < product.price ? product.promoPrice : product.price;
      if (!Number.isFinite(price) || price <= 0) throw Error('Precio de catálogo inválido');
      return {productId:product.id,productName:product.name,productImage:product.images?.[0] || '',sku:product.sku,price,quantity:item.quantity};
    });
    const address = request.deliveryAddress;
    if (!address || !address.recipientName || !address.phone || !address.province || !address.municipality || !address.street) throw Error('Dirección de entrega incompleta');
    const config = store.shippingConfig;
    const subtotal = money(items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0));
    let shippingCost = config?.fixedRate ?? 200;
    if (config?.type === 'free' || (config?.freeShippingThreshold && subtotal >= config.freeShippingThreshold)) shippingCost = 0;
    else if (config?.type === 'by_zone') {
      const zone = config.zones?.find((z: any) => z.name.toLowerCase() === address.province.toLowerCase());
      if (!zone) throw Error('La tienda no tiene una tarifa definida para esta zona');
      shippingCost = zone.rate;
    }
    if (config?.coverageProvinces?.length && !config.coverageProvinces.includes(address.province)) throw Error('Dirección fuera de la cobertura de la tienda');
    if (!Number.isFinite(shippingCost) || shippingCost < 0) throw Error('Tarifa de envío inválida');
    const total = money(subtotal + shippingCost);
    if (request.total !== total) throw Error('El total cambió. Actualiza el carrito y confirma el nuevo importe.');
    const idempotency = String(request.id || '');
    if (!/^[a-zA-Z0-9-]{8,120}$/.test(idempotency)) throw Error('Identificador de compra inválido');
    const id = checkoutOrderId(customer.id,idempotency);
    const now = new Date().toISOString();
    return {
      id,orderGroupCode:request.orderGroupCode,customerId:customer.id,customerName:customer.name,customerEmail:customer.email,customerPhone:customer.phone,
      storeId:store.id,storeName:store.name,items,subtotal,shippingCost:money(shippingCost),discount:0,total,
      status:'PENDING',paymentMethod:'CASH_ON_DELIVERY',paymentStatus:'PENDING',
      deliveryConfirmationCode:crypto.randomInt(100000,1000000).toString(),deliveryAddress:{...address,userId:customer.id},customerNotes:String(request.customerNotes || '').slice(0,2000),
      statusHistory:[{status:'PENDING',timestamp:now,updatedBy:customer.name,note:'Pedido contra entrega pendiente de confirmación'}],settlementStatus:'PENDING',createdAt:now,
      plazaCommissionRate:state.systemSettings.plazaCommissionRate ?? 0.0005,plazaCommissionAmount:0,storeNetEarnings:0,
    };
  });
}
