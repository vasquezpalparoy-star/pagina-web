import {normalizePhone} from './core.mjs';
import {RequestError} from './actions.mjs';
export async function trackPhone(value,address,secret,database){
 let phone;try{phone=normalizePhone(value)}catch(error){throw new RequestError(error.message)}
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const signature=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode('tracking-ip:'+address));
 const bucket=Array.from(new Uint8Array(signature),n=>n.toString(16).padStart(2,'0')).join('');
 const result=await database('rpc/gp_web_track_phone','POST',{p_phone:phone,p_bucket:bucket});
 if(result.limited)throw new RequestError('Demasiadas consultas. Espera un minuto e inténtalo de nuevo.',429);
 return {orders:(result.orders||[]).filter(row=>!['entregado','cancelado'].includes(row.status)).slice(0,1).map(row=>({reference:row.reference,status:row.status,created_at:row.created_at,estimated_at:row.estimated_at}))};
}
