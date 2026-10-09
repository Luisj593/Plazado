import assert from 'node:assert/strict';
import { build } from 'esbuild';
const output = await build({entryPoints:['server/paypal-credentials.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {encryptPayPalSecret,decryptPayPalSecret,testPayPalCredentials} = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString('base64')}`);
process.env.SESSION_SECRET = 'isolated-test-key';
const encrypted = encryptPayPalSecret('isolated-paypal-secret');
assert.ok(!encrypted.includes('isolated-paypal-secret'));
assert.equal(decryptPayPalSecret(encrypted), 'isolated-paypal-secret');
assert.notEqual(encrypted,encryptPayPalSecret('isolated-paypal-secret'));
process.env.SESSION_SECRET = 'wrong-key';
assert.throws(()=>decryptPayPalSecret(encrypted));
process.env.SESSION_SECRET = 'isolated-test-key';
const gateway = {environment:'PRODUCTION',credentials:{clientId:'isolated-id',clientSecret:encrypted}};
await assert.rejects(()=>testPayPalCredentials({credentials:{}}),/Completa/);
for (const environment of ['PRODUCTION','SANDBOX']) {
 await testPayPalCredentials({...gateway,environment},async (url,options)=>{
  assert.equal(url,environment==='PRODUCTION'?'https://api-m.paypal.com/v1/oauth2/token':'https://api-m.sandbox.paypal.com/v1/oauth2/token');
  assert.equal(options.headers.Authorization,`Basic ${Buffer.from('isolated-id:isolated-paypal-secret').toString('base64')}`);
  assert.equal(options.body,'grant_type=client_credentials');
  return new Response(JSON.stringify({access_token:'isolated-token'}));
 });
}
await assert.rejects(()=>testPayPalCredentials(gateway,async()=>new Response('{}',{status:401})),/rechazó/);
await assert.rejects(()=>testPayPalCredentials(gateway,async()=>new Response('{}')),/no confirmó/);
console.log('PayPal: encrypted secret, pending credentials, environment routing and real authentication checks passed.');
// Exercise the real save/mask methods without loading a production database.
const fs = await import('node:fs');
const { transform } = await import('esbuild');
const source = fs.readFileSync('server/database.ts','utf8');
const saveStart=source.indexOf('  public savePaymentGateway(');
const maskStart=source.indexOf('  private maskSecret(');
const methods=source.slice(saveStart,source.indexOf('  public setActivePaymentGateway(',saveStart)) + source.slice(maskStart,source.indexOf('  // --- ADVERTISING',maskStart));
const harnessCode=await transform(`class Harness { memoryData:any={paymentGateways:[],systemSettings:{}}; addAuditLog(){} commit(){} ${methods} }`,{loader:'ts'});
const Harness=new Function('encryptPayPalSecret','INITIAL_PAYMENT_GATEWAYS',harnessCode.code+';return Harness;')(encryptPayPalSecret,[]);
const db = new Harness();
let saved = db.savePaymentGateway({id:'isolated-paypal',providerKey:'PAYPAL',credentials:{clientId:'isolated-client'}});
assert.equal(saved.credentials.hasClientSecret,false);
saved=db.savePaymentGateway({...saved,credentials:{clientId:'isolated-client',clientSecret:'isolated-new-secret'}});
assert.equal(saved.credentials.hasClientSecret,true);
assert.equal(saved.credentials.clientSecret,undefined);
assert.ok(!JSON.stringify(saved).includes('isolated-new-secret'));
const retained=db.memoryData.paymentGateways[0].credentials.clientSecret;
db.savePaymentGateway({...saved,notes:'changed',credentials:{clientId:'isolated-client',clientSecret:''}});
assert.equal(db.memoryData.paymentGateways[0].credentials.clientSecret,retained);
assert.equal(decryptPayPalSecret(retained),'isolated-new-secret');
console.log('PayPal save/mask: pending-secret draft, encrypted write, secret never returned, blank edit preserves existing secret.');
