import type { Express, Request } from 'express';
import { checkoutOrderId, validateOrders } from './order-validation';
import { payPalReadiness, payPalRequest, usdQuote, verifyPayPalOrder } from './paypal-checkout';
import { transitionOrder } from './financial-lifecycle';

export function registerPayPalCheckout(app: Express, db: any, authenticate: (req: Request) => any, fulfillment?: any) {
  app.get('/api/paypal/config', (_req, res) => {
    const gateway = db.getPaymentGateways(false).find((g: any) => g.providerKey === 'PAYPAL' && g.isActive) || null;
    const reason = payPalReadiness(gateway);
    res.json({success:true,enabled:!reason,message:reason,clientId:reason ? undefined : gateway.credentials.clientId,currency:'USD',dopPerUsd:gateway?.paypalDopPerUsd});
  });

  app.post('/api/paypal/orders', async (req, res) => {
    try {
      const caller = authenticate(req);
      if (!caller || !['CUSTOMER','SUPER_ADMIN'].includes(caller.role)) return res.status(401).json({success:false,message:'Inicia sesión como cliente'});
      const requests = req.body.orders;
      if (!Array.isArray(requests) || !requests.length || requests.length > 20 || requests.some((r: any) => r.paymentMethod !== 'PAYPAL')) throw Error('Carrito PayPal inválido');
      const gateway = db.getPaymentGateways(false).find((g: any) => g.providerKey === 'PAYPAL' && g.isActive) || null;
      const reason = payPalReadiness(gateway); if (reason) throw Error(reason);
      const previous = requests.map((r: any) => db.getOrders().find((o: any) => o.id === checkoutOrderId(caller.id,String(r.id || ''))));
      let orders: any[];
      if (previous.every(Boolean)) {
        if (previous.some((o: any, i: number) => o.customerId !== caller.id || o.paymentMethod !== 'PAYPAL' || o.storeId !== requests[i].storeId || o.total !== requests[i].total || o.status === 'CANCELLED' || JSON.stringify(o.items.map((x: any) => [x.productId,x.quantity])) !== JSON.stringify(requests[i].items?.map((x: any) => [x.productId,x.quantity])))) throw Error('Identificador de compra ya utilizado');
        orders = previous;
      } else {
        if (previous.some(Boolean)) throw Error('Compra parcialmente registrada');
        orders = await db.createOrders(validateOrders(requests,db.getFullState(),caller,true));
      }
      const ids = orders.map(o => o.id);
      let meta = orders[0].paypalPayment;
      if (!meta) {
        meta = {orderId:'',gatewayId:gateway.id,amountUsd:usdQuote(orders,gateway.paypalDopPerUsd),dopPerUsd:gateway.paypalDopPerUsd,groupCode:`PP-${orders[0].id}`};
        orders = await db.updatePayPalOrders(ids,(rows: any[]) => {
          if(rows.some(o => o.paypalPayment)) throw Error('La compra cambió. Reintenta');
          rows.forEach(o => {o.paypalPayment={...meta};});
        });
      }
      const boundGateway = db.getPaymentGatewayById(meta.gatewayId,false);
      if(!boundGateway || boundGateway.environment !== 'PRODUCTION') throw Error('La pasarela de esta compra ya no está disponible');
      if (!meta.orderId) {
        const remote = await payPalRequest(boundGateway,'',{intent:'CAPTURE',purchase_units:[{custom_id:meta.groupCode,description:'Compra en Plazado.com',amount:{currency_code:'USD',value:meta.amountUsd}}]},`create:${meta.groupCode}`);
        if(!/^[A-Z0-9]{8,40}$/.test(remote.id || '')) throw Error('PayPal no devolvió una referencia válida');
        orders = await db.updatePayPalOrders(ids,(rows: any[]) => {
          if(rows.some(o => o.status === 'CANCELLED' || (o.paypalPayment.orderId && o.paypalPayment.orderId !== remote.id))) throw Error('La compra cambió. Requiere revisión');
          rows.forEach(o => {o.paypalPayment.orderId=remote.id;});
        });
        meta = orders[0].paypalPayment;
      }
      res.json({success:true,paypalOrderId:meta.orderId,amountUsd:meta.amountUsd,orderIds:ids});
    } catch(error: any) { res.status(400).json({success:false,message:error.message || 'No se pudo iniciar PayPal'}); }
  });

  app.post('/api/paypal/orders/:id/:action', async (req, res) => {
    try {
      const caller = authenticate(req); if(!caller) return res.status(401).json({success:false,message:'Inicia sesión'});
      if(!/^[A-Z0-9]{8,40}$/.test(req.params.id)) throw Error('Referencia PayPal inválida');
      const orders = db.getOrders().filter((o: any) => o.paypalPayment?.orderId === req.params.id);
      if(!orders.length || orders.some((o: any) => o.customerId !== caller.id)) return res.status(403).json({success:false,message:'Pago no autorizado'});
      const gateway = db.getPaymentGatewayById(orders[0].paypalPayment.gatewayId,false);
      if (!gateway || gateway.environment !== 'PRODUCTION') throw Error('Pasarela no disponible');
      const ids = orders.map((o: any) => o.id);
      if(req.params.action === 'cancel') {
        const remote = await payPalRequest(gateway,`/${req.params.id}`);
        if(remote.status === 'COMPLETED' || orders.some((o: any) => o.paypalPayment.captureStarted || o.paymentStatus === 'PAID')) throw Error('El pago está en confirmación. Reintenta confirmar antes de cancelar');
        verifyPayPalOrder(orders,remote);
        await db.updatePayPalOrders(ids,(rows: any[],state: any) => {
          rows.forEach(o => {
            if(o.paypalPayment.captureStarted || o.paymentStatus === 'PAID') throw Error('El pago ya está en confirmación');
            o.paypalPayment.orderId='';
            if(o.fulfillmentOrderId) {
              if(!fulfillment) throw Error('No se pudo liberar el pedido de almacén');
              fulfillment.rejectOrderByStore(o.fulfillmentOrderId,o.storeId,'Cliente canceló el pago PayPal',caller);
            } else {
              const result=transitionOrder(state,o.id,'CANCELLED','Cliente canceló PayPal');
              if(!result.success) throw Error(result.message);
            }
          });
        });
        return res.json({success:true,message:'Pago cancelado. Tu carrito se conserva.'});
      }
      if(req.params.action !== 'capture') throw Error('Operación inválida');
      await db.updatePayPalOrders(ids,(rows: any[]) => {
        if(rows.some(o => o.status === 'CANCELLED')) throw Error('Compra cancelada');
        rows.forEach(o => {o.paypalPayment.captureStarted=true;});
      });
      let remote = await payPalRequest(gateway,`/${req.params.id}`);
      verifyPayPalOrder(orders,remote);
      if (remote.status !== 'COMPLETED') remote = await payPalRequest(gateway,`/${req.params.id}/capture`,{},`capture:${req.params.id}`);
      // Read the full order even when PayPal returns a minimal capture response.
      remote = await payPalRequest(gateway,`/${req.params.id}`);
      const confirmed = await db.confirmPayPalCapture(ids,remote);
      res.json({success:true,orders:confirmed,version:db.getVersion()});
    } catch(error: any) {res.status(400).json({success:false,message:error.message || 'No se pudo confirmar PayPal. Reintenta consultar este pago.'});}
  });
}
