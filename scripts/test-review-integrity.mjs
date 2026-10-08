import assert from 'node:assert/strict';
import fs from 'node:fs';
import { build, transform } from 'esbuild';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
async function bundle(path) {
 const result = await build({entryPoints:[path],bundle:true,platform:'node',format:'cjs',write:false});
 const module={exports:{}};new Function('module','exports','require',result.outputFiles[0].text)(module,module.exports,require);return module.exports;
}
const {commerceChanges}=await bundle('server/commerce-changes.ts');
const {sanitizeMarketplaceState}=await bundle('server/public-state.ts');
const source=fs.readFileSync('server/database.ts','utf8');
const mutation=source.slice(source.indexOf('  private runCommerceMutation'),source.indexOf('  public deleteOrder',source.indexOf('  private runCommerceMutation')));
const reviews=source.slice(source.indexOf('  public async addReview('),source.indexOf('  // --- USERS & AUTH ---',source.indexOf('  public async addReview(')));
const code=await transform(`class Harness {memoryData:any;checkoutQueue=Promise.resolve();stagingCheckout=false;constructor(state:any){this.memoryData=structuredClone(state);}commit(){}setUserCredential(){} ${mutation} ${reviews}}`,{loader:'ts'});
let fail=false,persisted;
const repo={persistCheckout:async(previous,next)=>{if(fail)throw Error('isolated write rejection');persisted=structuredClone(next);}};
const Harness=new Function('firestoreRepo','commerceChanges','storesDb',code.code+';return Harness;')(repo,commerceChanges,{applyDurableStore(){}});
const fixture=()=>({users:[{id:'buyer',name:'Buyer',role:'CUSTOMER'}],stores:[{id:'store',status:'APPROVED',rating:5,reviewCount:0}],products:[{id:'product',storeId:'store',status:'published',rating:5,reviewCount:0}],orders:[{id:'order',customerId:'buyer',storeId:'store',status:'DELIVERED',items:[{productId:'product'}]}],reviews:[],systemSettings:{}});
const input={customerId:'buyer',customerName:'Forged',storeId:'store',productId:'product',rating:4,comment:'Review'};
for(const change of [state=>state.orders[0].status='CONFIRMED',state=>state.orders[0].customerId='other',state=>state.products[0].storeId='other']) {
 const state=fixture();change(state);const db=new Harness(state);await assert.rejects(db.addReview(input));assert.equal(db.memoryData.reviews.length,0);
}
for(const rating of [0,6,1.5,'5',NaN]) await assert.rejects(new Harness(fixture()).addReview({...input,rating}));
const db=new Harness(fixture());fail=true;await assert.rejects(db.addReview(input));assert.equal(db.memoryData.reviews.length,0);
fail=false;const review=await db.addReview(input);assert.equal(review.customerName,'Buyer');assert.equal(persisted.reviews.length,1);await assert.rejects(db.addReview(input));
const restart=new Harness(persisted);assert.equal(restart.memoryData.reviews.length,1);
let publicState=sanitizeMarketplaceState(db.memoryData,null);assert.equal(publicState.products[0].rating,4);assert.equal(publicState.products[0].reviewCount,1);
fail=true;await assert.rejects(db.deleteReview(review.id));assert.equal(db.memoryData.reviews[0].isModerated,true);
fail=false;await db.deleteReview(review.id);publicState=sanitizeMarketplaceState(db.memoryData,null);assert.equal(publicState.products[0].rating,0);assert.equal(publicState.products[0].reviewCount,0);assert.equal(publicState.reviews.length,0);assert.equal(db.memoryData.reviews.length,1);
const raw=fixture(),original=JSON.stringify(raw);assert.equal(sanitizeMarketplaceState(raw,null).products[0].rating,0);assert.equal(JSON.stringify(raw),original);
console.log('Reviews: delivered purchase required, 1–5 validation, identity protection, duplicate rejection, durable rollback/restart, moderation and derived public ratings. Isolated fixtures only.');
