import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../services/api';

let sdkPromise: Promise<any> | null = null;
let sdkClient = '';
function loadSDK(clientId: string) {
  if (sdkPromise && sdkClient === clientId) return sdkPromise;
  if (sdkPromise && sdkClient !== clientId) return Promise.reject(Error('La configuración de PayPal cambió. Recarga la página.'));
  sdkClient = clientId;
  sdkPromise = new Promise((resolve,reject) => {
    const script=document.createElement('script');
    script.src=`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture&components=buttons&disable-funding=card,credit,paylater`;
    script.setAttribute('data-namespace','plazadoPayPal');
    script.onload=()=>resolve((window as any).plazadoPayPal);
    script.onerror=()=>{sdkPromise=null;script.remove();reject(Error('No se pudo cargar PayPal. Recarga e intenta nuevamente.'));};
    document.head.appendChild(script);
  });
  return sdkPromise;
}

export function PayPalButton(props: {totalDop:number;fixedAmountUsd?:string;fixedRate?:number;createOrder:()=>Promise<string>;onApprove:(id:string)=>Promise<void>;onCancel:(id?:string)=>Promise<void>}) {
  const container=useRef<HTMLDivElement>(null),callbacks=useRef(props),orderId=useRef<string | undefined>(undefined);
  callbacks.current=props;
  const [config,setConfig]=useState<Awaited<ReturnType<typeof api.payPalConfig>> | null>(null);
  const [message,setMessage]=useState('Cargando PayPal…');
  const [retryId,setRetryId]=useState<string>();
  useEffect(()=>{let live=true;api.payPalConfig().then(c=>{if(live){setConfig(c);setMessage(c.enabled?'':c.message || 'PayPal pendiente de configuración');}}).catch(()=>{if(live)setMessage('No se pudo consultar la configuración de PayPal');});return()=>{live=false;};},[]);
  useEffect(()=>{
    if(!config?.enabled || !config.clientId || !container.current)return;
    let live=true,buttons:any;
    loadSDK(config.clientId).then(async sdk=>{
      if(!live || !container.current)return;
      buttons=sdk.Buttons({fundingSource:sdk.FUNDING.PAYPAL,style:{layout:'vertical',color:'gold',label:'pay',height:45},
        createOrder:async()=>{setMessage('');const id=await callbacks.current.createOrder();orderId.current=id;return id;},
        onApprove:async(data:any)=>{setMessage('Confirmando pago…');try{await callbacks.current.onApprove(data.orderID);if(live){setRetryId(undefined);setMessage('Pago confirmado');}}catch(error:any){if(live){setRetryId(data.orderID);setMessage(error.message || 'Reintenta confirmar este pago.');}}},
        onCancel:async()=>{try{await callbacks.current.onCancel(orderId.current);if(live)setMessage('Pago cancelado. Tu carrito se conserva.');}catch(error:any){if(live)setMessage(error.message);}},
        onError:()=>{if(live)setMessage('PayPal no pudo completar el proceso. Revisa los datos del pedido y reintenta.');},
      });
      await buttons.render(container.current);
    }).catch(error=>{if(live)setMessage(error.message);});
    return()=>{live=false;buttons?.close().catch(()=>{});};
  },[config?.enabled,config?.clientId]);
  return <div className="w-full max-w-xs space-y-2">
    {config?.enabled && config.dopPerUsd && <p className="text-xs text-stone-700 font-semibold">Cobro PayPal: US$ {props.fixedAmountUsd || (Math.round(props.totalDop / config.dopPerUsd * 100) / 100).toFixed(2)} · RD$ {props.fixedRate || config.dopPerUsd} por US$1</p>}
    <div ref={container} />
    {!config?.enabled && <button type="button" disabled className="w-full p-3 bg-yellow-300 text-blue-900 font-bold rounded-xl opacity-60">Pagar con PayPal</button>}
    {message && <p role="status" className="text-xs text-stone-600">{message}</p>}
    {retryId && <button type="button" className="text-xs font-bold text-blue-800 underline" onClick={async()=>{try{await callbacks.current.onApprove(retryId);setRetryId(undefined);}catch(error:any){setMessage(error.message);}}}>Reintentar confirmar el mismo pago</button>}
  </div>;
}
