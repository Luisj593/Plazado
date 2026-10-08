import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { transform } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundle=JSON.parse(fs.readFileSync(root+'/src/legal/documents.json','utf8'));
const LEGAL_VERSION=bundle.version;
const registrationDocuments=audience=>bundle.documents.filter(d=>[audience==='STORE'?'store_terms':'customer_terms','privacy','returns_refunds','shipping_procedures'].includes(d.id));
const helper=await transform(fs.readFileSync(root+'/src/legal/registration.ts','utf8').replace(/import bundle from .*;/,''),{loader:'ts',format:'cjs'});
const module={exports:{}};new Function('module','exports','bundle',helper.code)(module,module.exports,bundle);
const {hasCurrentLegalConsent}=module.exports;
const source=fs.readFileSync(root+'/server.ts','utf8');
for(const [route,audience] of [['register-customer','CUSTOMER'],['register-store','STORE']]) {
 const begin=source.indexOf(`  app.post('/api/auth/${route}'`);
 const end=source.indexOf('\n  });',begin)+8;
 const code=await transform(source.slice(begin,end),{loader:'ts'});
 let handler;const records=[],events=[];
 const db={getUsers:()=>[],getStores:()=>[],getSystemSettings:()=>({}),addUser:async u=>{records.push(u);events.push(['persist',u.legalAcceptance]);},registerStoreAccount:async (u,s)=>{records.push(u);events.push(['persist',u.legalAcceptance]);assert.equal(s.status,'PENDING');assert.equal(s.isPublished,false);},addAuditLog:()=>{},getVersion:()=>1};
 const firestoreRepo={saveUser:async u=>events.push(['persist',u.legalAcceptance]),saveStoreRegistrationAtomic:async u=>events.push(['persist',u.legalAcceptance])};
 const deps={app:{post:(_,fn)=>handler=fn},hasCurrentLegalConsent,registrationDocuments,LEGAL_VERSION,db,crypto,hashPassword:async()=> 'test-hash-in-memory',firestoreRepo,sendRegistrationOtpEmail:async()=>{events.push(['mail']);return {delivered:true};}};
 new Function(...Object.keys(deps),code.code)(...Object.values(deps));
 const good={name:'Isolated',lastName:'Test',storeName:'Isolated Test',ownerName:'Isolated Test',email:'test@example.invalid',phone:'000',password:'TestPass1234',confirmPassword:'TestPass1234',address:'memory',acceptedTerms:true,legalReadToEnd:true,legalVersion:LEGAL_VERSION,legalAudience:audience};
 for(const bad of [{acceptedTerms:false},{acceptedTerms:'true'},{legalReadToEnd:false},{legalVersion:'old'},{legalAudience:audience==='STORE'?'CUSTOMER':'STORE'}]) {
  const res={statusCode:200,status(n){this.statusCode=n;return this},json(value){this.body=value;return this}};
  await handler({body:{...good,...bad}},res);
  assert.equal(res.statusCode,400);assert.equal(events.length,0);assert.equal(records.length,0);
 }
 const res={statusCode:200,status(n){this.statusCode=n;return this},json(value){this.body=value;return this}};
 await handler({body:good},res);assert.equal(res.statusCode,200);assert.equal(res.body.pendingVerification,true);
 assert.equal(records[0].legalAcceptance.version,LEGAL_VERSION);assert.equal(records[0].legalAcceptance.audience,audience);
 assert.deepEqual(events.map(e=>e[0]),['persist','mail']);
 console.log(`${route}: rejected 5 invalid consents; persisted audience/version/time before OTP`);
}
for(const audience of ['CUSTOMER','STORE']) {
 assert.equal(registrationDocuments(audience).length,4);
 assert.ok(!registrationDocuments(audience).some(d=>d.id===(audience==='STORE'?'customer_terms':'store_terms')));
}
