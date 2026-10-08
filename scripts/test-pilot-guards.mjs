import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {build,transform} from 'esbuild';
import {createRequire} from 'node:module';
const bundled=await build({entryPoints:['src/data/initialData.ts'],bundle:true,platform:'node',format:'cjs',write:false});const initial={exports:{}};new Function('module','exports','require',bundled.outputFiles[0].text)(initial,initial.exports,createRequire(import.meta.url));
for(const key of ['INITIAL_USERS','INITIAL_STORES','INITIAL_PRODUCTS','INITIAL_PAYMENT_GATEWAYS','INITIAL_ADVERTISEMENTS']) assert.equal(initial.exports[key].length,0,key);
assert.equal(initial.exports.INITIAL_SETTINGS.legalEntityRegistered,false);assert.equal(initial.exports.INITIAL_SETTINGS.rnc,'');
// Run the actual token helpers with isolated identities and key material.
const server=fs.readFileSync('server.ts','utf8'),a=server.indexOf('export function createSessionToken'),b=server.indexOf('function sanitizeBootstrapForCaller',a);const compiled=await transform(server.slice(a,b).replace(/export /g,''),{loader:'ts'});
const user={id:'isolated',email:'fixture@example.invalid',role:'CUSTOMER',authVersion:0};const db={getUserById:id=>id===user.id?user:null};
const tokens=new Function('crypto','SESSION_SECRET','db',compiled.code+';return {createSessionToken,verifySessionToken,getAuthenticatedUser};')(crypto,'isolated-session-secret',db);
const token=tokens.createSessionToken(user),request={headers:{authorization:`Bearer ${token}`}};assert.equal(tokens.getAuthenticatedUser(request).id,user.id);user.authVersion=1;assert.equal(tokens.getAuthenticatedUser(request),null);const fresh=tokens.createSessionToken(user);assert.equal(tokens.getAuthenticatedUser({headers:{authorization:`Bearer ${fresh}`}}).id,user.id);assert.equal(tokens.verifySessionToken(fresh.slice(0,-4)+'xxxx'),null);
// The administrator must preserve the reference/modal if a payment was not saved.
const admin=fs.readFileSync('src/components/admin/AdminDashboard.tsx','utf8'),x=admin.indexOf('  const handlePaySettlement = async'),y=admin.indexOf('\n  const handleResolveDispute',x);const handlerCode=await transform(admin.slice(x,y),{loader:'ts'});
for(const saved of [false,true]) {let closes=0,clears=0,notices=0;const handle=new Function('payingSettlement','bankRefInput','processSettlement','showNotification','setPayingSettlement','setBankRefInput',handlerCode.code+';return handlePaySettlement;')({id:'isolated'},'BANK-ISOLATED',async()=>saved,()=>notices++,()=>closes++,()=>clears++);await handle({preventDefault(){}});assert.equal(closes,saved?1:0);assert.equal(clears,saved?1:0);assert.equal(notices,0);}
console.log('Pilot guards: no seed identities/products/gateways, no fictitious legal entity, password changes invalidate old sessions, failed payout retains confirmation form.');
