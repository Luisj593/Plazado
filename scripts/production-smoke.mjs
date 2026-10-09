// Read-only smoke verification: never creates accounts, orders, payments or stock movements.
import assert from 'node:assert/strict';
const origin=process.env.APP_URL || 'https://www.plazado.com';
const get=async path=>{const response=await fetch(new URL(path,origin),{signal:AbortSignal.timeout(20000)});return response;};
const home=await get('/');assert.equal(home.status,200);assert.ok(home.headers.get('content-security-policy'));assert.ok(home.headers.get('permissions-policy')?.includes('camera=(self)'));
const response=await get('/api/bootstrap');assert.equal(response.status,200);const text=await response.text();const body=JSON.parse(text);assert.equal(body.success,true);
for(const secret of ['passwordHash','passwordRecovery','clientSecret','verification'])assert.equal(text.includes(`"${secret}"`),false,`Public exposure: ${secret}`);
for(const list of ['users','orders','settlements','disputes','financialAuditLogs'])assert.equal(body.data[list].length,0);
assert.ok(Buffer.byteLength(text)<500000,'Initial catalog exceeds 500 KB; review pagination and image projections');
const image=body.data.products.flatMap(p=>p.images || []).find(url=>url.startsWith('/api/public-media/'));
if(image){const asset=await get(image);assert.equal(asset.status,200);assert.ok(asset.headers.get('content-type').startsWith('image/'));assert.ok((await asset.arrayBuffer()).byteLength>0);}
const health=await get('/api/health/ready');const state=await health.json();assert.equal(state.checks.firebaseAdmin,true);assert.equal(state.checks.firestoreLoaded,true);
const paypal=await(await get('/api/paypal/config')).json();
console.log(JSON.stringify({readOnly:true,catalogBytes:Buffer.byteLength(text),products:body.data.products.length,mailProvider:state.mailProvider,automaticEmailReady:state.automaticEmailReady,paypalEnabled:paypal.enabled,technicalSmoke:'PASS',productionCertification:false},null,2));
