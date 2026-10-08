import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {build,transform} from 'esbuild';
const changes=await build({entryPoints:['server/commerce-changes.ts'],bundle:true,platform:'node',format:'cjs',write:false});const cm={exports:{}};new Function('module','exports',changes.outputFiles[0].text)(cm,cm.exports);
const source=fs.readFileSync('server/database.ts','utf8');
const between=(a,b)=>source.slice(source.indexOf(a),source.indexOf(b,source.indexOf(a)));
const parts=[between('  private runCommerceMutation','  public updateOrderStatus'),between('  public addUser','  public deleteUser'),between('  public addStore','  public deleteStore'),between('  public addBanner','  // --- FINANCIAL'),between('  public setUserVerification','  public getVerificationsList')];
const compiled=await transform(`class Harness {memoryData:any;checkoutQueue=Promise.resolve();stagingCheckout=false;constructor(state:any){this.memoryData=structuredClone(state);}commit(){}addAuditLog(){}setUserCredential(){} ${parts.join('\n')}}`,{loader:'ts'});
let fail=false,writes=0,stored;
const firestoreRepo={persistCheckout:async (previous,next,newCheckout)=>{assert.equal(newCheckout,false);if(fail)throw Error('isolated rejection');writes++;stored=structuredClone(next);}};
const Harness=new Function('firestoreRepo','commerceChanges','crypto','storesDb',compiled.code+';return Harness;')(firestoreRepo,cm.exports.commerceChanges,crypto,{applyDurableStore:()=>{}});
const initial=()=>({users:[],stores:[],banners:[],orders:[],products:[],storeBalances:{},settlements:[],auditLogs:[],systemSettings:{}});
const user={id:'u',email:'fixture@example.invalid',name:'Isolated',role:'STORE_OWNER',passwordHash:'isolated-hash',storeId:'s',isEmailVerified:false,verification:{code:'123456',codeExpiresAt:Date.now()+60000,attempts:0,isVerified:false}};
const store={id:'s',name:'Isolated',ownerId:'u',status:'PENDING',isPublished:false};
const db=new Harness(initial());fail=true;await assert.rejects(db.registerStoreAccount(user,store));assert.equal(db.memoryData.users.length,0);assert.equal(db.memoryData.stores.length,0);
fail=false;await db.registerStoreAccount(user,store);assert.equal(stored.users.length,1);assert.equal(stored.stores.length,1);assert.equal(db.memoryData.stores[0].status,'PENDING');assert.equal(db.memoryData.stores[0].isPublished,false);
// Restore durable state into a fresh process before validating the OTP.
const restarted=new Harness(stored);fail=true;await assert.rejects(restarted.confirmUserEmail(user.email,'123456'));assert.equal(restarted.memoryData.users[0].isEmailVerified,false);
fail=false;const rejected=await restarted.confirmUserEmail(user.email,'000000');assert.equal(rejected.success,false);assert.equal(stored.users[0].verification.attempts,1);
const verified=await restarted.confirmUserEmail(user.email,'123456');assert.equal(verified.success,true);assert.equal(stored.users[0].isEmailVerified,true);assert.equal(stored.stores[0].isEmailVerified,true);assert.equal(stored.users[0].verification.code,'');assert.equal(stored.stores[0].status,'PENDING');assert.equal((await restarted.confirmUserEmail(user.email,'123456')).success,false);
fail=true;await assert.rejects(restarted.updateStore('s',{name:'Lost update'}));assert.equal(restarted.memoryData.stores[0].name,'Isolated');await assert.rejects(restarted.updateUser('u',{passwordHash:'not-persisted'}));assert.equal(restarted.memoryData.users[0].passwordHash,'isolated-hash');await assert.rejects(restarted.addBanner({title:'Lost',isActive:true}));assert.equal(restarted.memoryData.banners.length,0);
fail=false;await Promise.all([restarted.updateStore('s',{phone:'fixture'}),restarted.updateStore('s',{name:'Saved'})]);assert.equal(stored.stores[0].phone,'fixture');assert.equal(stored.stores[0].name,'Saved');const banner=await restarted.addBanner({title:'Saved',isActive:true});await restarted.updateBanner(banner.id,{title:'Saved edit'});await restarted.deleteBanner(banner.id);assert.equal(stored.banners[0].isActive,false);assert.equal(stored.banners[0].title,'Saved edit');
// Actual client handlers keep the previously confirmed view when offline.
const front=fs.readFileSync('src/context/AppContext.tsx','utf8');
for(const [name,next,method] of [['updateStoreDetails','toggleStorePublish','updateStore'],['updateStoreStatus','updateStoreDetails','updateStoreStatus'],['toggleStorePublish','deleteStore','toggleStorePublish'],['addBanner','updateBanner','createBanner'],['updateBanner','deleteBanner','updateBanner']]) {
 const a=front.indexOf(`  const ${name} = async`),b=front.indexOf(`\n  const ${next}`,a),code=await transform(front.slice(a,b),{loader:'ts'});let changed=0;
 const fn=new Function('api','setStores','setBanners','showNotification',code.code+`;return ${name};`)({[method]:async()=>{throw Error('offline');}},()=>changed++,()=>changed++,()=>{});await fn('s',{});assert.equal(changed,0);
}
console.log('Account persistence: atomic owner/store, pending approval preserved, durable/restart-safe OTP, failed writes preserve identity/banner/store, serialized edits, no fake client success.');

const supportParts=between('  public approveUserAccount','  public rejectUserAccount')+source.slice(source.indexOf('  public regenerateUserVerificationCode'),source.indexOf('\n  public ',source.indexOf('  public regenerateUserVerificationCode')+5)>0?source.indexOf('\n  public ',source.indexOf('  public regenerateUserVerificationCode')+5):source.lastIndexOf('\n}'));
const supportCode=await transform(`class SupportHarness extends Harness {${supportParts}\n}`,{loader:'ts'});
const SupportHarness=new Function('Harness','crypto',supportCode.code+';return SupportHarness;')(Harness,crypto);
const support=new SupportHarness({...initial(),users:[structuredClone(user)],stores:[structuredClone(store)]});
fail=false;await support.approveUserAccount('u','admin@example.invalid');assert.equal(support.memoryData.users[0].isEmailVerified,false);assert.equal(support.memoryData.users[0].verification.code,'123456');assert.equal(support.memoryData.stores[0].isPublished,false);
fail=true;await assert.rejects(support.regenerateUserVerificationCode(user.email,'admin@example.invalid'));assert.equal(support.memoryData.users[0].verification.code,'123456');
fail=false;const fresh=await support.regenerateUserVerificationCode(user.email,'admin@example.invalid');assert.equal(fresh.success,true);assert.match(fresh.code,/^\d{6}$/);assert.ok(fresh.expiresAt>Date.now());
assert.equal((await support.confirmUserEmail(user.email,'123456')).success,false);assert.equal((await support.confirmUserEmail(user.email,fresh.code)).success,true);assert.equal(support.memoryData.stores[0].isPublished,true);
const already=await support.regenerateUserVerificationCode(user.email,'admin@example.invalid');assert.equal(already.success,false);assert.equal(support.memoryData.users[0].isEmailVerified,true);
console.log('Manual registration: administrator approval preserves OTP requirement; durable generation/rollback, replaced-code rejection, verified account protection, publication after approval plus OTP.');
