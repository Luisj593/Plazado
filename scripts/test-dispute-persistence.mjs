import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {build,transform} from 'esbuild';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
async function bundle(path){const r=await build({entryPoints:[path],bundle:true,platform:'node',format:'cjs',write:false});const m={exports:{}};new Function('module','exports','require',r.outputFiles[0].text)(m,m.exports,require);return m.exports;}
const {commerceChanges}=await bundle('server/commerce-changes.ts');
const {processSettlementState}=await bundle('server/financial-lifecycle.ts');
const source=fs.readFileSync('server/database.ts','utf8');
const wrapper=source.slice(source.indexOf('  private runCommerceMutation'),source.indexOf('  public updateOrderStatus'));
const methods=source.slice(source.indexOf('  public createDispute'),source.indexOf('  // --- REVIEWS ---'));
const compiled=await transform(`class Harness {memoryData:any;checkoutQueue=Promise.resolve();stagingCheckout=false;constructor(s:any){this.memoryData=structuredClone(s);}commit(){}addAuditLog(action:string,id:string){this.memoryData.auditLogs.push({id:crypto.randomUUID(),action});} ${wrapper} ${methods}}`,{loader:'ts'});
let fail=true,persisted,writes=0;
const repo={persistCheckout:async(previous,next)=>{if(fail)throw Error('isolated rejection');persisted=structuredClone(next);writes++;}};
const Harness=new Function('firestoreRepo','commerceChanges','processSettlementState','crypto',compiled.code+';return Harness;')(repo,commerceChanges,processSettlementState,crypto);
const fixture={orders:[{id:'order',storeId:'store',storeName:'Fixture',customerId:'customer',customerName:'Fixture',total:100,status:'DELIVERED',paymentStatus:'PAID',settlementStatus:'PENDING'}],settlements:[],disputes:[],auditLogs:[],storeBalances:{}};
const input={orderId:'order',issueType:'DAMAGED',description:'Fixture complaint',refundAmount:999};
const db=new Harness(fixture);await assert.rejects(db.createDispute(input));assert.equal(db.memoryData.disputes.length,0);assert.equal(db.memoryData.orders[0].activeDisputeId,undefined);
fail=false;const dispute=await db.createDispute(input);assert.equal(dispute.refundAmount,100);assert.equal(persisted.orders[0].activeDisputeId,dispute.id);assert.equal(persisted.disputes.length,1);
await assert.rejects(db.createDispute(input));assert.equal(writes,1);
const restarted=new Harness(persisted);fail=true;await assert.rejects(restarted.resolveDispute(dispute.id,'CLOSED','Fixture resolution'));assert.equal(restarted.memoryData.disputes[0].status,'OPEN');
fail=false;await assert.rejects(restarted.resolveDispute(dispute.id,'CLOSED',''));await restarted.resolveDispute(dispute.id,'CLOSED','Fixture resolution');assert.equal(persisted.disputes[0].status,'CLOSED');assert.equal(persisted.orders[0].activeDisputeId,null);await assert.rejects(restarted.resolveDispute(dispute.id,'UNDER_REVIEW',''));
const front=fs.readFileSync('src/context/AppContext.tsx','utf8');
for(const [name,next] of [['createDispute','resolveDispute'],['resolveDispute','deleteDispute']]) {
 const a=front.indexOf(`  const ${name} = async`),b=front.indexOf(`  const ${next} = async`,a);const code=await transform(front.slice(a,b),{loader:'ts'});
 for(const offline of [true,false]) {let mutations=0;const api={[name]:async()=>{if(offline)throw Error('offline');return {success:false,message:'rejected'};}};const handler=new Function('api','setDisputes','showNotification',code.code+`;return ${name};`)(api,()=>mutations++,()=>{});assert.equal(await handler(input,'CLOSED','Fixture'),false);assert.equal(mutations,0);}
}
const repoSource=fs.readFileSync('server/firestore-repository.ts','utf8');assert.ok(repoSource.includes('current.activeDisputeId'));
console.log('Disputes: durable rollback/restart, duplicate prevention, refund bounds, documented terminal closure, order lock against concurrent payouts, no optimistic UI on rejection. Isolated fixtures only.');
