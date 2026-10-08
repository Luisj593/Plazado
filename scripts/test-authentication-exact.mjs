import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build,transform} from 'esbuild';
import crypto from 'node:crypto';
const built=await build({entryPoints:['src/utils/security.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {hashPassword,verifyPassword}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const one='Exact fixture A 123!',two='Exact fixture B 456!';
const hashes=[await hashPassword(one),await hashPassword(two)];assert.equal(await verifyPassword(one,hashes[0]),true);
for(const wrong of [two,one.toLowerCase(),one+' ',one.slice(0,-1),'',null])assert.equal(await verifyPassword(wrong,hashes[0]),false);
for(const hash of ['',null,'invalid','$2b$invalid'])assert.equal(await verifyPassword(one,hash),false);
const source=fs.readFileSync('server.ts','utf8'),start=source.indexOf("  app.post('/api/auth/login'"),end=source.indexOf('  // Active email verification',start);
const compiled=await transform(source.slice(start,end),{loader:'ts'});
let handler,tokens=0;const users=[{id:'a',email:'a@example.invalid',passwordHash:hashes[0],role:'CUSTOMER'},{id:'b',email:'b@example.invalid',passwordHash:hashes[1],role:'CUSTOMER'}];
const deps={app:{post:(_,h)=>handler=h},db:{getUserByEmail:email=>users.find(u=>u.email===email),getUserCredential:id=>({passwordHash:hashes[id==='a'?0:1]}),addAuditLog(){},getVersion:()=>1,setUserCredential(){}},verifyPassword,hashPassword,createSessionToken:u=>{tokens++;return 'isolated-'+u.id;},sanitizeUser:({passwordHash,...u})=>u};
new Function(...Object.keys(deps),compiled.code)(...Object.values(deps));
const call=async(body)=>{let status=200,result;await handler({body},{status:s=>{status=s;return {json:r=>{result=r;}}},json:r=>{result=r;}});return {status,result};};
for(const [email,password] of [['a@example.invalid',two],['b@example.invalid',one],['a@example.invalid','wrong'],['none@example.invalid',one],['a@example.invalid',''],['a@example.invalid',null]]) {const before=tokens,r=await call({email,password});assert.equal(r.status,401);assert.equal(tokens,before);assert.equal(r.result.token,undefined);}
let r=await call({email:' A@EXAMPLE.INVALID ',password:one});assert.equal(r.result.user.id,'a');assert.equal(r.result.user.passwordHash,undefined);assert.equal(r.result.token,'isolated-a');
// Verify actual token functions without importing/starting the production server.
const tokenSource=source.slice(source.indexOf('export function createSessionToken'),source.indexOf('export function getAuthenticatedUser'));
const tokenCode=await transform(tokenSource.replaceAll('export function','function'),{loader:'ts'});
const funcs=new Function('crypto','SESSION_SECRET',tokenCode.code+';return {createSessionToken,verifySessionToken};')(crypto,'isolated-test-secret');
const token=funcs.createSessionToken(users[0]);assert.equal(funcs.verifySessionToken(token).userId,'a');assert.equal(funcs.verifySessionToken(token+'x'),null);assert.equal(funcs.verifySessionToken('invalid'),null);
console.log('Authentication: exact case/space-sensitive password, cross-user rejection, no token on failure, sanitized success and tampered-session rejection. No real accounts used.');
