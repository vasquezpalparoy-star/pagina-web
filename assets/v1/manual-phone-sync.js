import {storeRequest} from './store-api.js?v=delivery-live1';
export function manualTrackingRows(orders,customers){
 const phones=new Map(customers.map(c=>[c.uid,c.phone]));
 const date=value=>{const d=value?.toDate?.()||value;if(!d)return null;const time=new Date(d);return Number.isFinite(time.getTime())?time.toISOString():null};
 return orders.filter(o=>phones.has(o.customerUid)).map(o=>{
  let phone=String(phones.get(o.customerUid)||'').replace(/\D/g,'');if(phone.length===11&&phone.startsWith('51'))phone=phone.slice(2);
  return {id:o.id,phone:/^9\d{8}$/.test(phone)?phone:null,status:o.status,created_at:date(o.createdAt),estimated_at:date(o.estimatedAt)};
 });
}
export function mountManualPhoneSync(user,target){
 const note=document.createElement('p');note.setAttribute('role','status');target.append(note);
 let stopped=false,rows=[],saved='',timer=null,busy=false;
 async function flush(){
  if(stopped||busy)return;const signature=JSON.stringify(rows);if(signature===saved)return;
  busy=true;const batch=rows.map(r=>({...r}));
  try{
   for(let i=0;i<batch.length;i+=100){if(stopped)return;await storeRequest(user,'admin_sync_tracking',{rows:batch.slice(i,i+100)})}
   if(stopped)return;saved=signature;note.textContent='Estados manuales disponibles para consultar por celular.';
  }catch(error){if(!stopped)note.textContent='No se sincronizó la consulta por celular: '+error.message}
  finally{busy=false;if(!stopped)timer=setTimeout(flush,15000)}
 }
 const change=event=>{rows=event.detail;clearTimeout(timer);flush()};
 window.addEventListener('gp-manual-tracking-changed',change);
 window.dispatchEvent(new window.CustomEvent('gp-manual-tracking-request'));
 return {stop(){stopped=true;clearTimeout(timer);window.removeEventListener('gp-manual-tracking-changed',change);note.remove()}};
}
