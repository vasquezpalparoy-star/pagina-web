// Dedicated delivery lookup. Never passes tracking identifiers to the conversational AI.
import {USER_FIREBASE_CONFIG} from './config.js';
export function detectTracking(input){
 const s=String(input||'').trim();
 if(/^(?:\+?51[\s-]*)?9(?:[\s-]*\d){8}$/.test(s)){
  let phone=s.replace(/\D/g,'');if(phone.length===11)phone=phone.slice(2);
  return {kind:'phone',value:phone};
 }
 if(/^[a-f0-9]{64}$/i.test(s))return {kind:'link',value:s.toLowerCase()};
 if(/delivery-track\.html/i.test(s)){
  try{
   const u=new URL(s);
   const valid=(['www.grafiplotvasquez.com','grafiplotvasquez.com'].includes(u.hostname)&&u.pathname==='/delivery-track.html')||(u.hostname==='vasquezpalparoy-star.github.io'&&u.pathname==='/pagina-web/delivery-track.html');
   if(u.protocol==='https:'&&valid&&!u.username&&!u.password&&!u.port&&/^#[a-f0-9]{64}$/i.test(u.hash))return {kind:'link',value:u.hash.slice(1).toLowerCase()};
  }catch{}
  return {kind:'invalid'};
 }
 return null;
}
export const labels={solicitado:'Por confirmar',confirmado:'Confirmado',recibido:'Recibido',en_proceso:'En proceso',listo:'Listo para entregar',en_camino:'En camino',entregado:'Entregado',cancelado:'Cancelado'};
export const stages=['recibido','en_proceso','listo','en_camino','entregado'];
export function publicStatus(o,kind){
 if(!o||!Object.hasOwn(labels,o.status))return null;
 const estimated=kind==='phone'?o.estimated_at:o.estimatedAt;
 const date=estimated?new Date(estimated.toDate?.()||estimated):null;
 return {status:o.status,reference:kind==='phone'?String(o.reference||'').slice(0,80):String(o.orderId||'').slice(-8).toUpperCase(),estimatedAt:date&&Number.isFinite(date.getTime())?date.toISOString():null};
}
let sdkPromise;
async function readPrivateLink(token){
 const sdk=await (sdkPromise||(sdkPromise=Promise.all([
 import('https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js'),
 import('https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js')
 ]).then(parts=>Object.assign({},...parts)).catch(e=>{sdkPromise=null;throw e})));
 const app=sdk.initializeApp(USER_FIREBASE_CONFIG,'grafiplot-chat-tracking');
 const db=sdk.getFirestore(app);
 const snapshot=await sdk.getDocFromServer(sdk.doc(db,'deliveryOrderLinks',token));
 return snapshot.exists()?snapshot.data():null;
}
export async function lookupTracking(query,{fetcher=globalThis.fetch,readLink=readPrivateLink,now=()=>Date.now()}={}){
 if(query?.kind==='phone'&&/^9\d{8}$/.test(query.value)){
  const control=new AbortController(),timer=setTimeout(()=>control.abort(),20000);
  try{
   const response=await fetcher('https://gyvztqpvgtinxoqhyfbw.supabase.co/functions/v1/grafiplot-store',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'track_phone',phone:query.value}),signal:control.signal});
   if(!response.ok)throw Error('lookup-failed');
   const data=await response.json();
   const order=(Array.isArray(data.orders)?data.orders:[]).find(o=>o&&!['entregado','cancelado'].includes(o.status));
   return publicStatus(order,'phone');
  }finally{clearTimeout(timer)}
 }
 if(query?.kind==='link'&&/^[a-f0-9]{64}$/.test(query.value)){
  let timer;
  try{
   const order=await Promise.race([readLink(query.value),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('timeout')),20000)})]);
   const expiry=new Date(order?.expiresAt?.toDate?.()||order?.expiresAt).getTime();
   if(!order||!Number.isFinite(expiry)||expiry<=now()||['entregado','cancelado'].includes(order.status))return null;
   return publicStatus(order,'link');
  }finally{clearTimeout(timer)}
 }
 return null;
}
