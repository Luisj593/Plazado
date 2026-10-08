import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {build} from 'esbuild';
const built=await build({entryPoints:['src/utils/androidApp.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {PACKAGED_ANDROID_APP,resolveAndroidApp}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
assert.equal(resolveAndroidApp().versionName,'1.2');assert.equal(resolveAndroidApp({isEnabled:false}).isEnabled,false);
const custom={...PACKAGED_ANDROID_APP,apkUrl:'https://example.invalid/custom.apk',versionName:'custom'};assert.deepEqual(resolveAndroidApp(custom),custom);
const apk=fs.readFileSync('public'+PACKAGED_ANDROID_APP.apkUrl);
assert.equal(apk.length,16876);assert.equal(crypto.createHash('sha256').update(apk).digest('hex'),'b03450aa30b3e0f5a1395104fc91efb23055489efc45392bd6a3a3e6a975022c');
const eocd=apk.lastIndexOf(Buffer.from('PK\x05\x06'));assert.ok(eocd>0);
const central=apk.readUInt32LE(eocd+16);assert.equal(apk.subarray(central-16,central).toString(),'APK Sig Block 42');
const blockSize=Number(apk.readBigUInt64LE(central-24)),blockStart=central-blockSize-8;assert.equal(Number(apk.readBigUInt64LE(blockStart)),blockSize);
let v2;
for(let p=blockStart+8;p<central-24;) {const size=Number(apk.readBigUInt64LE(p));p+=8;const id=apk.readUInt32LE(p);if(id===0x7109871a)v2=apk.subarray(p+4,p+size);p+=size;}
assert.ok(v2);
const lp=(buffer,offset=0)=>{const n=buffer.readUInt32LE(offset);assert.ok(offset+4+n<=buffer.length);return {data:buffer.subarray(offset+4,offset+4+n),next:offset+4+n};};
const signer=lp(lp(v2).data).data;
const signed=lp(signer),signatures=lp(signer,signed.next),key=lp(signer,signatures.next);
const signature=lp(signatures.data).data;assert.equal(signature.readUInt32LE(0),0x0103);
assert.equal(crypto.verify('sha256',signed.data,{key:crypto.createPublicKey({key:key.data,format:'der',type:'spki'}),padding:crypto.constants.RSA_PKCS1_PADDING},lp(signature,4).data),true);
const digests=lp(signed.data),certs=lp(signed.data,digests.next);const certificate=new crypto.X509Certificate(lp(certs.data).data);
assert.deepEqual(certificate.publicKey.export({format:'der',type:'spki'}),key.data);
const digest=lp(digests.data).data;assert.equal(digest.readUInt32LE(0),0x0103);const expected=lp(digest,4).data;
const trailer=Buffer.from(apk.subarray(eocd));trailer.writeUInt32LE(blockStart,16);
const chunks=[];
for(const section of [apk.subarray(0,blockStart),apk.subarray(central,eocd),trailer])for(let p=0;p<section.length;p+=1048576){const chunk=section.subarray(p,p+1048576),head=Buffer.alloc(5);head[0]=0xa5;head.writeUInt32LE(chunk.length,1);chunks.push(crypto.createHash('sha256').update(head).update(chunk).digest());}
const head=Buffer.alloc(5);head[0]=0x5a;head.writeUInt32LE(chunks.length,1);assert.deepEqual(crypto.createHash('sha256').update(head).update(Buffer.concat(chunks)).digest(),expected);
for(const path of ['src/components/public/AndroidAppDownloadPage.tsx','src/components/common/DownloadSectionModal.tsx']) {const text=fs.readFileSync(path,'utf8');assert.ok(!text.includes('dummyApkContent'));assert.ok(text.includes('resolveAndroidApp'));assert.ok(text.includes('disabled={'));}
console.log('Android: packaged APK hash and v2 content signature verified, custom URL/disabled settings preserved, fake downloads removed. No software installed.');
