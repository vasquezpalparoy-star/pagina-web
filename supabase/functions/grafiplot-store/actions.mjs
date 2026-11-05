import {isOwner,statuses,validateDelivery,validateOrder} from './core.mjs';
export class RequestError extends Error {constructor(message,status=400){super(message);this.status=status}}
export async function handleAction(input,claims,database){
 const uid=claims.sub;const owner=isOwner(claims);
  switch(input.action){
      case 'profile':{
        const rows=await database('gp_web_customers?customer_uid=eq.'+encodeURIComponent(uid)+'&select=*');
        return ({profile:rows[0]||null});
      }
      case 'save_profile':{
        let profile;try{profile=validateDelivery(input.profile)}catch(e){throw new RequestError(e.message)}
        const rows=await database('gp_web_customers?on_conflict=customer_uid','POST',{...profile,customer_uid:uid,email:claims.email,updated_at:new Date().toISOString()});
        return ({profile:rows[0]});
      }
      case 'submit_order':{
        let order;try{order=validateOrder(input.order)}catch(e){throw new RequestError(e.message)}
        const result=await database('rpc/gp_web_submit_order','POST',{p_uid:uid,p_email:claims.email,p_id:order.id,p_delivery:order.delivery,p_items:order.items,p_total:order.total});
        return ({order:result});
      }
      case 'orders':
      case 'admin_orders':{
        if(input.action==='admin_orders'&&!owner)throw new RequestError('Acceso reservado al propietario.',403);
        const offset=Math.max(0,Math.min(100000,Number(input.offset)||0));
        const customer=input.action==='orders'?uid:String(input.customer||'');
        let path='gp_web_orders?select=*&order=created_at.desc,id.desc&limit=31&offset='+Math.trunc(offset);
        if(customer)path+='&customer_uid=eq.'+encodeURIComponent(customer);
        const rows=await database(path);return ({orders:rows.slice(0,30),more:rows.length>30});
      }
      case 'admin_customers':{
        if(!owner)throw new RequestError('Acceso reservado al propietario.',403);
        const offset=Math.max(0,Math.min(100000,Number(input.offset)||0));
        const q=String(input.query||'').trim().slice(0,100).replace(/[^\p{L}\p{N} @.+-]/gu,'');
        let path='gp_web_customers?select=*&order=updated_at.desc,customer_uid&limit=31&offset='+Math.trunc(offset);
        if(q)path+='&or='+encodeURIComponent('(recipient.ilike.*'+q+'*,phone.ilike.*'+q+'*,email.ilike.*'+q+'*)');
        const rows=await database(path);return ({customers:rows.slice(0,30),more:rows.length>30});
      }
      case 'admin_status':{
        if(!owner)throw new RequestError('Acceso reservado al propietario.',403);
        if(!statuses.includes(input.status)||!/^[-a-f0-9]{36}$/i.test(input.id||''))throw new RequestError('Estado inválido.');
        const rows=await database('gp_web_orders?id=eq.'+encodeURIComponent(input.id),'PATCH',{status:input.status,updated_at:new Date().toISOString()});
        if(!rows.length)throw new RequestError('No se encontró el pedido.',404);
        return ({order:rows[0]});
      }
      default:throw new RequestError('Acción inválida.');
    }
}
