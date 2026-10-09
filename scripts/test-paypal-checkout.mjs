import assert from 'node:assert/strict';
import {build} from 'esbuild';
async function module(path) {
 const built=await build({entryPoints:[path],bundle:true,platform:'node',format:'esm',write:false});
 return import(`data:text/javascript;base64,${Buffer.from(built.outputFiles[0].text).toString('base64')}`);
}
const {applyPayPalCapture,verifyPayPalOrder,usdQuote,payPalReadiness}=await module('server/paypal-checkout.ts');
const {registerPayPalCheckout}=await module('server/paypal-routes.ts');
const {encryptPayPalSecret}=await module('server/paypal-credentials.ts');
const {transitionOrder}=await module('server/financial-lifecycle.ts');
process.env.SESSION_SECRET='isolated-paypal-checkout';
const meta={orderId:'ISOLATEDPAYPAL123',gatewayId:'gateway',groupCode:'group',amountUsd:'3.00',dopPerUsd:60};
const state={orders:[{id:'order1',customerId:'buyer',storeId:'store',paymentMethod:'PAYPAL',paymentStatus:'PENDING',status:'PENDING',total:120,plazaCommissionAmount:6,storeNetEarnings:114,accountingVersion:2,deliveryConfirmationCode:'123456',paypalPayment:{...meta},items:[],statusHistory:[]},{id:'order2',customerId:'buyer',storeId:'store',paymentMethod:'PAYPAL',paymentStatus:'PENDING',status:'PENDING',total:60,plazaCommissionAmount:3,storeNetEarnings:57,accountingVersion:2,deliveryConfirmationCode:'123456',paypalPayment:{...meta},items:[],statusHistory:[]}],storeBalances:{store:{totalSales:0,cardSales:0,pendingBalance:0,availableBalance:0,plazaCommissionsPaid:0}},paymentTransactions:[{orderId:'order1',paymentStatus:'PENDING'},{orderId:'order2',paymentStatus:'PENDING'}],financialAuditLogs:[],products:[]};
const remote={id:meta.orderId,status:'COMPLETED',purchase_units:[{custom_id:meta.groupCode,amount:{currency_code:'USD',value:'3.00'},payments:{captures:[{id:'real-capture',status:'COMPLETED',amount:{currency_code:'USD',value:'3.00'}}]}}]};
assert.equal(usdQuote(state.orders,60),'3.00');assert.throws(()=>usdQuote(state.orders,0));
assert.ok(payPalReadiness(null));
const gateway={id:'gateway',providerKey:'PAYPAL',isActive:true,environment:'PRODUCTION',paypalDopPerUsd:60,credentials:{clientId:'isolated-client',clientSecret:encryptPayPalSecret('isolated-secret')}};
assert.equal(payPalReadiness(gateway),null);assert.ok(payPalReadiness({...gateway,environment:'SANDBOX'}));
for(const mutate of [r=>{r.status='APPROVED';},r=>{r.purchase_units[0].amount.value='0.01';},r=>{r.purchase_units[0].payments.captures[0].status='PENDING';},r=>{r.purchase_units[0].custom_id='foreign';},r=>{r.purchase_units[0].payments.captures[0].amount.currency_code='DOP';}]) {
 const altered=structuredClone(remote);mutate(altered);const copy=structuredClone(state);assert.throws(()=>applyPayPalCapture(copy,copy.orders,altered));assert.equal(copy.storeBalances.store.pendingBalance,0);assert.equal(copy.orders[0].paymentStatus,'PENDING');
}
assert.equal(transitionOrder(structuredClone(state),'order1','CONFIRMED').success,false);
const copy=structuredClone(state);applyPayPalCapture(copy,copy.orders,remote);applyPayPalCapture(copy,copy.orders,remote);
assert.equal(copy.storeBalances.store.pendingBalance,171);assert.equal(copy.storeBalances.store.availableBalance,0);assert.equal(copy.storeBalances.store.totalSales,180);assert.equal(copy.financialAuditLogs.length,2);
assert.equal(transitionOrder(copy,'order1','DELIVERED',undefined,'123456').success,true);assert.equal(copy.storeBalances.store.availableBalance,114);
assert.equal(transitionOrder(copy,'order1','DELIVERED',undefined,'123456').success,true);assert.equal(copy.storeBalances.store.availableBalance,114);
// Actual route handlers: customer isolation, interrupted persistence and idempotent capture recovery.
const handlers={};const app={get:(path,fn)=>handlers[path]=fn,post:(path,fn)=>handlers[path]=fn};
const local=structuredClone(state);let failPersistence=true,captureCalls=0;let serverRemote={...structuredClone(remote),status:'APPROVED'};
const db={getPaymentGateways:()=>[gateway],getPaymentGatewayById:()=>gateway,getOrders:()=>local.orders,getVersion:()=>1,updatePayPalOrders:async(ids,mutate)=>{const next=structuredClone(local);const rows=next.orders.filter(o=>ids.includes(o.id));mutate(rows,next);Object.assign(local,next);return rows;},confirmPayPalCapture:async(ids,result)=>{if(failPersistence)throw Error('isolated durable write failure');const next=structuredClone(local);const rows=next.orders.filter(o=>ids.includes(o.id));applyPayPalCapture(next,rows,result);Object.assign(local,next);return rows;}};
registerPayPalCheckout(app,db,req=>req.user);
function response(){return {statusCode:200,status(code){this.statusCode=code;return this;},json(body){this.body=body;return this;}};}
let res=response();await handlers['/api/paypal/config']({},res);assert.equal(res.body.enabled,true);assert.ok(!JSON.stringify(res.body).includes('isolated-secret'));
const req={user:{id:'other'},params:{id:meta.orderId,action:'capture'}};res=response();await handlers['/api/paypal/orders/:id/:action'](req,res);assert.equal(res.statusCode,403);
const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,options)=>{
 if(url.endsWith('/v1/oauth2/token'))return new Response(JSON.stringify({access_token:'isolated-token'}));
 if(url.endsWith('/capture')){captureCalls++;serverRemote=structuredClone(remote);}
 return new Response(JSON.stringify(serverRemote));
};
try {
 req.user={id:'buyer'};res=response();await handlers['/api/paypal/orders/:id/:action'](req,res);assert.equal(res.body.success,false);assert.equal(local.orders[0].paymentStatus,'PENDING');assert.equal(captureCalls,1);
 failPersistence=false;res=response();await handlers['/api/paypal/orders/:id/:action'](req,res);assert.equal(res.body.success,true);assert.equal(captureCalls,1);assert.equal(local.storeBalances.store.pendingBalance,171);
 res=response();await handlers['/api/paypal/orders/:id/:action'](req,res);assert.equal(res.body.success,true);assert.equal(captureCalls,1);assert.equal(local.storeBalances.store.pendingBalance,171);
 req.params.action='cancel';res=response();await handlers['/api/paypal/orders/:id/:action'](req,res);assert.equal(res.body.success,false);
} finally {globalThis.fetch=originalFetch;}
console.log('PayPal checkout: trusted USD quote, secret isolation, customer ownership, exact completed capture, idempotent accounting, recovery after persistence failure, delivery-only release. No real charges or production writes.');
