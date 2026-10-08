import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source=fs.readFileSync(root+'/server/database.ts','utf8');
const start=source.indexOf('  public updateSystemSettings(');
const method=source.slice(start,source.indexOf('\n  // --- BANNERS',start));
const code=await transform(`class SettingsHarness { settingsUpdateQueue: Promise<void> = Promise.resolve(); memoryData: any; constructor(settings: any) { this.memoryData={systemSettings: settings}; } addAuditLog() {} commit() {} ${method} }`,{loader:'ts'});
let persisted={plazaCommissionRate:0.0005,defaultCommissionRate:0.05,contactEmail:'unchanged@example.invalid'},fail=false,writes=0;
const firestoreRepo={saveSystemSettings:async settings=>{if(fail) throw Error('isolated persistence failure');persisted=structuredClone(settings);writes++;}};
const Harness=new Function('firestoreRepo',code.code+';return SettingsHarness;')(firestoreRepo);
let db=new Harness(structuredClone(persisted));
for(const rate of [0,0.0005,0.005,0.05,1]) {
 await db.updateSystemSettings({plazaCommissionRate:rate});
 db=new Harness(structuredClone(persisted)); // Simulate reloading authoritative Firestore after restart.
 assert.equal(db.memoryData.systemSettings.plazaCommissionRate,rate);
 assert.equal(db.memoryData.systemSettings.contactEmail,'unchanged@example.invalid');
}
const previous=structuredClone(db.memoryData.systemSettings),count=writes;
fail=true;await assert.rejects(db.updateSystemSettings({plazaCommissionRate:0.03}));
assert.deepEqual(db.memoryData.systemSettings,previous);assert.equal(writes,count);
fail=false;
await Promise.all([db.updateSystemSettings({plazaCommissionRate:0.005}),db.updateSystemSettings({contactEmail:'retained@example.invalid'})]);
assert.equal(persisted.plazaCommissionRate,0.005);assert.equal(persisted.contactEmail,'retained@example.invalid');
for(const invalid of [-0.01,1.01,NaN,Infinity,'0.05',null]) await assert.rejects(db.updateSystemSettings({plazaCommissionRate:invalid}));
console.log('Persistence: 0%, 0.05%, 0.5%, 5%, 100% survive simulated restart; failures preserve prior rate; queued changes do not overwrite each other.');
const context=fs.readFileSync(root+'/src/context/AppContext.tsx','utf8');
const begin=context.indexOf('  const updateSystemSettings = async');
const frontend=await transform(context.slice(begin,context.indexOf('\n  // --- PASARELAS',begin)),{loader:'ts'});
for(const scenario of ['network-error','rejected','success']) {
 let setCalls=0;const notices=[];
 const api={updateSettings:async()=>{if(scenario==='network-error')throw Error('offline');return {success:scenario==='success',settings:scenario==='success'?persisted:undefined};}};
 const fn=new Function('api','currentUser','setSystemSettings','showNotification',frontend.code+';return updateSystemSettings;')(api,{role:'SUPER_ADMIN'},()=>setCalls++,(...args)=>notices.push(args));
 const result=await fn({plazaCommissionRate:0.005});assert.equal(result,scenario==='success');assert.equal(setCalls,scenario==='success'?1:0);
 if(scenario!=='success')assert.equal(notices[0][1],'error');
}
console.log('Interface: success only on server confirmation; network/rejection failures do not overwrite saved settings.');

await db.updateSystemSettings({legalEntityRegistered:false,legalBusinessName:'',rnc:'',legalAddress:''});
db=new Harness(structuredClone(persisted));assert.equal(db.memoryData.systemSettings.legalEntityRegistered,false);assert.equal(db.memoryData.systemSettings.rnc,'');
await assert.rejects(db.updateSystemSettings({legalEntityRegistered:true}));
await db.updateSystemSettings({legalEntityRegistered:true,legalBusinessName:'Isolated entity',rnc:'ISOLATED-ONLY',legalAddress:'Isolated address'});
db=new Harness(structuredClone(persisted));assert.equal(db.memoryData.systemSettings.legalBusinessName,'Isolated entity');assert.equal(db.memoryData.systemSettings.legalEntityRegistered,true);
console.log('Legal configuration: unregistered state and later entity details persist; incomplete published identity rejected.');
