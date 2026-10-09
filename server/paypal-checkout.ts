import crypto from 'node:crypto';
import { decryptPayPalSecret } from './paypal-credentials';
import type { PaymentGatewayConfig } from '../src/types';

export function payPalReadiness(gateway: PaymentGatewayConfig | null) {
  if (!gateway || gateway.providerKey !== 'PAYPAL' || !gateway.isActive) return 'Activa la pasarela PayPal desde el Super Admin.';
  if (gateway.environment !== 'PRODUCTION') return 'PayPal está en Sandbox; los cobros reales requieren Producción.';
  if (!gateway.credentials?.clientId || !gateway.credentials?.clientSecret) return 'Completa las credenciales PayPal.';
  if (!Number.isFinite(gateway.paypalDopPerUsd) || gateway.paypalDopPerUsd! < 1 || gateway.paypalDopPerUsd! > 1000) return 'Configura la tasa DOP/USD de PayPal.';
  return null;
}

export function usdQuote(orders: any[], rate: number): string {
  if (!Number.isFinite(rate) || rate < 1 || rate > 1000) throw Error('Tasa DOP/USD inválida');
  const total = orders.reduce((sum, order) => sum + order.total, 0);
  const usd = Math.round(total / rate * 100) / 100;
  if (!Number.isFinite(usd) || usd < 0.01) throw Error('Importe PayPal inválido');
  return usd.toFixed(2);
}

export async function payPalRequest(gateway: PaymentGatewayConfig, path: string, body?: any, key?: string, fetcher: typeof fetch = fetch) {
  if (!gateway.credentials?.clientId || !gateway.credentials?.clientSecret) throw Error('Credenciales PayPal incompletas');
  const host = gateway.environment === 'PRODUCTION' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
  const tokenResponse = await fetcher(`${host}/v1/oauth2/token`, {method:'POST',headers:{Authorization:`Basic ${Buffer.from(`${gateway.credentials.clientId}:${decryptPayPalSecret(gateway.credentials.clientSecret)}`).toString('base64')}`,'Content-Type':'application/x-www-form-urlencoded'},body:'grant_type=client_credentials',signal:AbortSignal.timeout(10000)});
  if (!tokenResponse.ok) throw Error('PayPal rechazó las credenciales. Revisa el ambiente y las llaves.');
  const token = await tokenResponse.json();
  if (!token.access_token) throw Error('PayPal no confirmó la autenticación');
  const response = await fetcher(`${host}/v2/checkout/orders${path}`, {method:body === undefined ? 'GET' : 'POST',headers:{Authorization:`Bearer ${token.access_token}`,'Content-Type':'application/json',...(key ? {'PayPal-Request-Id':crypto.createHash('sha256').update(key).digest('hex').slice(0,38)} : {})},body:body === undefined ? undefined : JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  if (!response.ok) throw Error('No se pudo confirmar la operación con PayPal. Reintenta para consultar su estado; no generes otro pago.');
  return response.json();
}

export function verifyPayPalOrder(orders: any[], remote: any, requireCapture = false) {
  const meta = orders[0]?.paypalPayment;
  if (!meta || !orders.length || orders.some(o => o.paymentMethod !== 'PAYPAL' || !o.paypalPayment || o.paypalPayment.orderId !== meta.orderId || o.paypalPayment.groupCode !== meta.groupCode || o.paypalPayment.amountUsd !== meta.amountUsd || o.paypalPayment.gatewayId !== meta.gatewayId || o.paypalPayment.dopPerUsd !== meta.dopPerUsd || o.status === 'CANCELLED')) throw Error('Pedido PayPal inconsistente');
  if (usdQuote(orders,meta.dopPerUsd) !== meta.amountUsd) throw Error('La conversión del pedido no coincide');
  const unit = remote.purchase_units?.[0];
  if (remote.id !== meta.orderId || remote.purchase_units?.length !== 1 || unit?.custom_id !== meta.groupCode || unit?.amount?.currency_code !== 'USD' || Number(unit?.amount?.value) !== Number(meta.amountUsd)) throw Error('El importe o la referencia PayPal no coincide');
  if (!requireCapture) return;
  const capture = unit.payments?.captures?.[0];
  if (remote.status !== 'COMPLETED' || unit.payments?.captures?.length !== 1 || capture?.status !== 'COMPLETED' || !capture.id || capture.amount?.currency_code !== 'USD' || Number(capture.amount?.value) !== Number(meta.amountUsd)) throw Error('PayPal todavía no ha confirmado el cobro completo');
  return capture;
}

export function applyPayPalCapture(state: any, orders: any[], remote: any) {
  const capture = verifyPayPalOrder(orders, remote, true);
  if (orders.every(o => o.paymentStatus === 'PAID' && o.paypalPayment.captureId === capture.id)) return;
  if (orders.some(o => o.paymentStatus !== 'PENDING')) throw Error('El pago requiere conciliación');
  if (state.orders.some((o: any) => !orders.some(row => row.id === o.id) && o.paypalPayment?.captureId === capture.id)) throw Error('Esta captura ya pertenece a otra compra');
  for (const order of orders) {
    const balance = state.storeBalances[order.storeId];
    if (!balance) throw Error('Balance de tienda no encontrado');
    for (const value of [order.total,order.plazaCommissionAmount,order.storeNetEarnings,balance.totalSales || 0,balance.cardSales || 0,balance.pendingBalance || 0,balance.plazaCommissionsPaid || 0]) if (!Number.isFinite(value) || value < 0) throw Error('Importes de pago inconsistentes');
    const round = (n: number) => Math.round(n * 100) / 100;
    balance.totalSales = round((balance.totalSales || 0) + order.total);
    balance.cardSales = round((balance.cardSales || 0) + order.total);
    balance.pendingBalance = round((balance.pendingBalance || 0) + order.storeNetEarnings);
    balance.plazaCommissionsPaid = round((balance.plazaCommissionsPaid || 0) + order.plazaCommissionAmount);
    balance.lastUpdated = new Date().toISOString();
    order.paymentStatus = 'PAID'; order.paypalPayment.captureId = capture.id;
    for (const tx of state.paymentTransactions || []) if (tx.orderId === order.id) {tx.paymentStatus='PAID';tx.gatewayReference=capture.id;tx.notes='Cobro PayPal confirmado por el servidor';}
    (state.financialAuditLogs ||= []).unshift({id:`fin-${crypto.randomUUID()}`,timestamp:new Date().toISOString(),orderId:order.id,storeId:order.storeId,storeName:order.storeName,amount:order.total,commission:order.plazaCommissionAmount,paymentMethod:'PAYPAL',movementType:'SALE_CARD',actor:'PAYPAL_SERVER_CAPTURE',previousBalance:round(balance.pendingBalance-order.storeNetEarnings),newBalance:balance.pendingBalance,externalRef:capture.id,status:'CAPTURED',notes:`PayPal ${order.paypalPayment.amountUsd} USD; fondos pendientes de entrega`});
  }
}
