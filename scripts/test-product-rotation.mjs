import assert from 'node:assert/strict';
import fs from 'node:fs';
import {build} from 'esbuild';
const result=await build({entryPoints:['src/utils/productRotation.ts'],bundle:true,platform:'node',format:'esm',write:false});
const {ProductRotation}=await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
// An optional public catalog export is read only; default fixtures exist in memory only.
const products=process.argv[2] ? JSON.parse(fs.readFileSync(process.argv[2],'utf8')).products : [
 {id:'a',categoryId:'one',images:['https://example.invalid/a1','https://example.invalid/a2','', 'https://example.invalid/a1']},
 {id:'b',categoryId:'two',images:['https://example.invalid/b']},
 {id:'c',categoryId:'two',images:['https://example.invalid/c']}
];
const original=JSON.stringify(products),rotation=new ProductRotation(()=>0.37);
rotation.sync(products);
const eligible=rotation.snapshot().products;
assert.ok(eligible.length);
const seenImages=new Map(),cycles=Math.max(...eligible.map(p=>new Set(p.images.filter(Boolean)).size))+1;
let lastId,lastImage;
for(let cycle=0;cycle<cycles;cycle++) {
 const seen=new Set();
 for(let i=0;i<eligible.length;i++) {
  const snapshot=rotation.snapshot(),product=snapshot.products[snapshot.index];
  assert.ok(!seen.has(product.id),'No premature product repetition');seen.add(product.id);
  if(i===0 && lastId && eligible.length>1) assert.notEqual(product.id,lastId,'No cycle-boundary product repeat');
  if(i===0 && lastImage && eligible.some(p=>p.images.some(image=>image!==lastImage))) assert.notEqual(snapshot.image,lastImage);
  const images=seenImages.get(product.id)||new Set();images.add(snapshot.image);seenImages.set(product.id,images);
  const before=rotation.snapshot();rotation.sync(structuredClone(products));
  assert.equal(rotation.snapshot().image,before.image);assert.deepEqual(rotation.snapshot().products.map(p=>p.id),before.products.map(p=>p.id));
  lastId=product.id;lastImage=snapshot.image;rotation.next();
 }
 assert.equal(seen.size,eligible.length);
}
for(const product of eligible) assert.equal(seenImages.get(product.id).size,new Set(product.images.filter(image=>image && image.trim())).size,'All secondary images participate');
const current=rotation.snapshot(),active=current.products[current.index];
rotation.rejectImage(current.image);assert.notEqual(rotation.snapshot().image,current.image,'Failed images skipped');
rotation.sync(products.filter(product=>product.id!==active.id));assert.ok(rotation.snapshot().products.every(p=>p.id!==active.id));
rotation.sync(products);assert.equal(rotation.snapshot().products.length,eligible.length-(new Set(active.images.filter(Boolean)).size===1?1:0));
assert.equal(JSON.stringify(products),original,'Stored image order and cover untouched');
rotation.sync([]);assert.equal(rotation.snapshot().products.length,0);
const single=new ProductRotation(()=>0.37);single.sync([eligible.find(p=>p.images.length>1)||eligible[0]]);
const first=single.snapshot().image;single.next();
if(single.snapshot().images.length>1) assert.notEqual(single.snapshot().image,first);
let attempts=0;
while(single.snapshot().products.length && attempts++<20) single.rejectImage(single.snapshot().image);
assert.equal(single.snapshot().products.length,0,'All failed images safely exhaust the candidate');
console.log(JSON.stringify({products:eligible.length,cycles,secondaryImagesCovered:true,noPrematureRepeats:true,stableReconciliation:true,failedImagesSkipped:true,sourceUnchanged:true}));
