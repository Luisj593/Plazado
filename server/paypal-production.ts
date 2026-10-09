import type {Express,Request} from 'express';
import {payPalRequest,verifyPayPalOrder} from './paypal-checkout';
export function validateRefund(orders:any[],refund:any){
 const meta=orders[0]?.paypalPayment;
 if(!meta?.captureId || orders.some(o=>o.paypalPayment?.captureId!==meta.captureId) || !refund?.id || refund.status!=='COMPLETED' || refund.amount?.currency_code!=='USD' || Number(refund.amount?.value)!==Number(meta.amountUsd))throw Error('PayPal no confirmó el reembolso completo');
 const captureLink=refund.links?.find((link:any)=>link.rel==='up')?.href;
 if(captureLink && !captureLink.endsWith(`/captures/${meta.captureId}`))throw Error('Reembolso de otra captura');
}
export function applyRefundState(state:any,ids:string[],refund:any){
 const orders=state.orders.filter((o:any)=>ids.includes(o.id));
 if(orders.length!==ids.length)throw Error('Pedidos de reembolso inconsistentes');
 validateRefund(orders,refund);
 if(orders.every((o:any)=>o.paymentStatus==='REFUNDED' && o.paypalPayment.refundId===refund.id))return;
 if(orders.some((o:any)=>o.paymentStatus!=='PAID' || !o.paypalPayment.refundStarted || !o.paypalPayment.refundBucket))throw Error('El reembolso requiere conciliación');
 for(const order of orders){
  const balance=state.storeBalances[order.storeId],bucket=order.paypalPayment.refundBucket;
  if(!balance || !['availableBalance','pendingBalance'].includes(bucket) || balance[bucket]<order.storeNetEarnings)throw Error('Saldo insuficiente para conciliar reembolso');
  for(const [field,amount] of [['totalSales',order.total],['cardSales',order.total],['plazaCommissionsPaid',order.plazaCommissionAmount]] as [string,number][])if(!Number.isFinite(balance[field]) || Math.round(balance[field]*100)<Math.round(amount*100))throw Error('Contabilidad inconsistente. Requiere conciliación');
  const round=(n:number)=>Math.round(n*100)/100;
  balance[bucket]=round(balance[bucket]-order.storeNetEarnings);balance.totalSales=round(balance.totalSales-order.total);balance.cardSales=round(balance.cardSales-order.total);balance.plazaCommissionsPaid=round(balance.plazaCommissionsPaid-order.plazaCommissionAmount);
  order.paymentStatus='REFUNDED';order.settlementStatus='EXEMPT';order.paypalPayment.refundId=refund.id;
  // A financial refund does not assert physical receipt of returned goods or replenish inventory.
  for(const tx of state.paymentTransactions || [])if(tx.orderId===order.id)tx.paymentStatus='REFUNDED';
  state.financialAuditLogs.unshift({id:`refund-${order.id}-${refund.id}`,timestamp:new Date().toISOString(),orderId:order.id,storeId:order.storeId,amount:order.total,commission:order.plazaCommissionAmount,paymentMethod:'PAYPAL',movementType:'ADJUSTMENT',actor:'PAYPAL_REFUND',previousBalance:round(balance[bucket]+order.storeNetEarnings),newBalance:balance[bucket],externalRef:refund.id,status:'REFUNDED',notes:order.paypalPayment.refundReason});
 }
}
export function registerPayPalProduction(app:Express,db:any,admin:(req:Request)=>any){
 async function reconcile(remoteId:string){
  const orders=db.getOrders().filter((o:any)=>o.paypalPayment?.orderId===remoteId);
  if(!orders.length)throw Error('Pago desconocido');
  const gateway=db.getPaymentGatewayById(orders[0].paypalPayment.gatewayId,false);if(!gateway)throw Error('Pasarela no disponible');
  const remote=await payPalRequest(gateway,`/${remoteId}`);verifyPayPalOrder(orders,remote);
  if(orders.every((o:any)=>o.paymentStatus==='REFUNDED'))return {success:true,message:'Pago ya reembolsado.'};
  if(remote.status==='COMPLETED')await db.confirmPayPalCapture(orders.map((o:any)=>o.id),remote);
  return {success:true,message:remote.status==='COMPLETED'?'Cobro conciliado.':'PayPal aún no ha confirmado el cobro.'};
 }
 app.post('/api/admin/paypal/:id/reconcile',async(req,res)=>{
  if(!admin(req))return res.status(403).json({success:false});
  if(!/^[A-Z0-9]{8,40}$/.test(req.params.id))return res.status(400).json({success:false});
  try{res.json(await reconcile(req.params.id));}catch(e:any){res.status(400).json({success:false,message:e.message});}
 });
 app.post('/api/admin/paypal/:id/refund',async(req,res)=>{
  const actor=admin(req);if(!actor)return res.status(403).json({success:false});
  if(!/^[A-Z0-9]{8,40}$/.test(req.params.id) || typeof req.body.reason!=='string' || req.body.reason.trim().length<10)return res.status(400).json({success:false,message:'Ingresa una referencia válida y el motivo del reembolso (mínimo 10 caracteres).'});
  try{
   const orders=db.getOrders().filter((o:any)=>o.paypalPayment?.orderId===req.params.id),ids=orders.map((o:any)=>o.id);
   if(!orders.length)throw Error('Pago desconocido');
   if(orders.every((o:any)=>o.paymentStatus==='REFUNDED'))return res.json({success:true,message:'Este pago ya fue reembolsado.'});
   const meta=orders[0].paypalPayment,gateway=db.getPaymentGatewayById(meta.gatewayId,false);if(!gateway || gateway.environment!=='PRODUCTION' || !meta.captureId)throw Error('Captura de producción no disponible');
   await db.updatePayPalOrders(ids,(rows:any[],state:any)=>{
    if(rows.some(o=>o.paymentStatus!=='PAID' || ['SCHEDULED','SETTLED'].includes(o.settlementStatus) || o.settlementId))throw Error('Hay fondos liquidados o reservados. Requiere conciliación bancaria antes de reembolsar.');
    const needed:Record<string,number>={};
    for(const o of rows){const bucket=o.status==='DELIVERED'?'availableBalance':'pendingBalance';const key=`${o.storeId}:${bucket}`;needed[key]=(needed[key] || 0)+o.storeNetEarnings;}
    for(const [key,amount] of Object.entries(needed)){const [store,bucket]=key.split(':');if((state.storeBalances[store]?.[bucket] || 0)<amount)throw Error('Fondos insuficientes para reembolso');}
    for(const storeId of [...new Set(rows.map(o=>o.storeId))]){const group=rows.filter(o=>o.storeId===storeId),balance=state.storeBalances[storeId];for(const [field,value] of [['totalSales',group.reduce((sum,o)=>sum+o.total,0)],['cardSales',group.reduce((sum,o)=>sum+o.total,0)],['plazaCommissionsPaid',group.reduce((sum,o)=>sum+o.plazaCommissionAmount,0)]] as [string,number][])if(!Number.isFinite(balance?.[field]) || Math.round(balance[field]*100)<Math.round(value*100))throw Error('Contabilidad inconsistente. Concilia antes de reembolsar.');}
    for(const o of rows){o.paypalPayment.refundStarted=true;o.paypalPayment.refundBucket=o.status==='DELIVERED'?'availableBalance':'pendingBalance';o.paypalPayment.refundReason ||= `Solicitado por ${actor.id}: ${req.body.reason.trim().slice(0,500)}`;}
   });
   const existingRefund=db.getOrders().find((o:any)=>o.id===ids[0])?.paypalPayment?.refundProviderId;
   const refund=existingRefund?await payPalRequest(gateway,`/v2/payments/refunds/${existingRefund}`,undefined,undefined,fetch,true):await payPalRequest(gateway,`/v2/payments/captures/${meta.captureId}/refund`,{amount:{currency_code:'USD',value:meta.amountUsd}},`refund:${meta.captureId}`,fetch,true);
   if(typeof refund.id!=='string' || !/^[A-Z0-9-]{8,50}$/.test(refund.id))throw Error('PayPal no devolvió una referencia de reembolso válida');
   await db.updatePayPalOrders(ids,(rows:any[])=>{rows.forEach(o=>{o.paypalPayment.refundProviderId=refund.id;});});
   validateRefund(orders,refund);
   await db.updatePayPalOrders(ids,(rows:any[],state:any)=>applyRefundState(state,rows.map(o=>o.id),refund));
   res.json({success:true,message:'Reembolso completo confirmado por PayPal. La devolución física se gestiona por separado.'});
  }catch(e:any){res.status(400).json({success:false,message:e.message || 'Reembolso pendiente de conciliación. Reintenta la misma operación.'});}
 });
 app.post('/api/paypal/webhook',async(req,res)=>{
  const webhookId=process.env.PAYPAL_WEBHOOK_ID;
  if(!webhookId)return res.status(503).json({success:false});
  try{
   const event=req.body;
   if(!event || typeof event.id!=='string')return res.sendStatus(400);
   const remoteId=event.resource?.supplementary_data?.related_ids?.order_id;
   const rows=db.getOrders().filter((o:any)=>o.paypalPayment?.orderId===remoteId || o.paypalPayment?.captureId===event.resource?.id);
   const gateway=rows.length?db.getPaymentGatewayById(rows[0].paypalPayment.gatewayId,false):db.getPaymentGateways(false).find((g:any)=>g.providerKey==='PAYPAL' && g.isActive);
   if(!gateway)return res.sendStatus(503);
   const verification=await payPalRequest(gateway,'/v1/notifications/verify-webhook-signature',{auth_algo:req.get('paypal-auth-algo'),cert_url:req.get('paypal-cert-url'),transmission_id:req.get('paypal-transmission-id'),transmission_sig:req.get('paypal-transmission-sig'),transmission_time:req.get('paypal-transmission-time'),webhook_id:webhookId,webhook_event:event},undefined,fetch,true);
   if(verification.verification_status!=='SUCCESS')return res.sendStatus(401);
   if(event.event_type==='PAYMENT.CAPTURE.COMPLETED' && rows.length)await reconcile(rows[0].paypalPayment.orderId);
   // Refund events are reconciled from the provider, never from event amounts alone.
   if(event.event_type==='PAYMENT.CAPTURE.REFUNDED'){
    const captureId=event.resource?.links?.find((l:any)=>l.rel==='up')?.href?.split('/').pop();
    const refundRows=db.getOrders().filter((o:any)=>o.paypalPayment?.captureId===captureId);
    if(refundRows.length){const g=db.getPaymentGatewayById(refundRows[0].paypalPayment.gatewayId,false);const refund=await payPalRequest(g,`/v2/payments/refunds/${event.resource.id}`,undefined,undefined,fetch,true);await db.updatePayPalOrders(refundRows.map((o:any)=>o.id),(rows:any[],state:any)=>applyRefundState(state,rows.map(o=>o.id),refund));}
   }
   res.json({success:true});
  }catch{console.error('[PayPal] Webhook requires retry or administrative reconciliation');res.sendStatus(503);}
 });
}
