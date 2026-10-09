import crypto from 'node:crypto';
import type { Express } from 'express';
import { sanitizeMarketplaceState } from './public-state';
const prefix='/api/public-media/';
const validImage=/^data:image\/(png|jpe?g|webp|gif|avif);base64,([A-Za-z0-9+/=\r\n]+)$/;
export function createPublicMediaIndex(getState:()=>any) {
  let version:unknown;let initialized=false;
  const images=new Map<string,{data:string;mime:string;body:Buffer}>();
  const hash=(value:string)=>crypto.createHash('sha256').update(value).digest('hex');
  function refresh(){
    const state=getState();if(initialized && version===state.version)return;
    initialized=true;version=state.version;images.clear();
    function collect(value:any):void {
      if(typeof value==='string') {const match=value.match(validImage);if(match){const body=Buffer.from(match[2],'base64');if(body.length<=10*1024*1024)images.set(hash(value),{data:value,mime:`image/${match[1]==='jpg'?'jpeg':match[1]}`,body});}return;}
      if(Array.isArray(value))value.forEach(collect);else if(value && typeof value==='object')Object.values(value).forEach(collect);
    }
    collect(sanitizeMarketplaceState(state,null));
  }
  function project(value:any):any {
    refresh();
    const walk=(item:any):any=>typeof item==='string'?(item.startsWith('data:image/') && images.has(hash(item))?prefix+hash(item):item):Array.isArray(item)?item.map(walk):item && typeof item==='object'?Object.fromEntries(Object.entries(item).map(([k,v])=>[k,walk(v)])):item;
    return walk(value);
  }
  function restore(value:any):any {
    refresh();
    if(typeof value==='string' && value.startsWith(prefix)){const asset=images.get(value.slice(prefix.length));if(!asset)throw Error('La imagen cambió. Actualiza antes de guardar.');return asset.data;}
    if(Array.isArray(value))return value.map(restore);
    if(value && typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,restore(v)]));
    return value;
  }
  return {project,restore,get:(id:string)=>{refresh();return images.get(id);}};
}
export function registerPublicMedia(app:Express,getState:()=>any){
 const index=createPublicMediaIndex(getState);
 app.get(prefix+':id',(req,res)=>{
  if(!/^[a-f0-9]{64}$/.test(req.params.id))return res.sendStatus(404);
  const asset=index.get(req.params.id);if(!asset)return res.sendStatus(404);
  res.setHeader('Content-Type',asset.mime);res.setHeader('Cache-Control','public, max-age=86400');res.setHeader('ETag',`"${req.params.id}"`);
  if(req.headers['if-none-match']===`"${req.params.id}"`)return res.status(304).end();
  res.send(asset.body);
 });
 // Stored data URLs stay intact when an owner edits a form containing projected image URLs.
 app.use('/api',(req,res,next)=>{
  if(['POST','PATCH','PUT'].includes(req.method) && req.body){try{req.body=index.restore(req.body);}catch{return res.status(409).json({success:false,message:'Una imagen cambió. Actualiza antes de guardar.'});}}
  next();
 });
 return index;
}
