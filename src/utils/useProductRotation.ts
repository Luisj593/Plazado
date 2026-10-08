import { useEffect, useState } from 'react';
import type { Product } from '../types';
import { ProductRotation } from './productRotation';

// Public slideshow state survives leaving and returning to the home view.
const rotation = new ProductRotation<Product>();
export function useProductRotation(products: Product[], enabled: boolean, paused: boolean) {
  const [snapshot,setSnapshot]=useState(()=>rotation.snapshot());
  useEffect(()=>{rotation.sync(products);setSnapshot(rotation.snapshot());},[products]);
  useEffect(()=>{
    if(!enabled || paused || !snapshot.products.length) return;
    const timer=window.setInterval(()=>{
      if(document.hidden) return;
      rotation.next();setSnapshot(rotation.snapshot());
    },8000);
    return ()=>window.clearInterval(timer);
  },[enabled,paused,snapshot.products.length]);
  const change=(action:()=>void)=>{action();setSnapshot(rotation.snapshot());};
  return {...snapshot,next:()=>change(()=>rotation.next()),select:(index:number)=>change(()=>rotation.select(index)),
    selectPhoto:(image:string)=>change(()=>rotation.selectPhoto(image)),rejectImage:(image:string)=>change(()=>rotation.rejectImage(image))};
}
