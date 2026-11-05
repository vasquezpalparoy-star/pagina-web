import {isOwner,statuses,validateDelivery,validateOrder,validateOffer,currentOffer} from './core.mjs';
export class RequestError extends Error {constructor(message,status=400){super(message);this.status=status}}
export async function handleAction(input,claims,database){
 const uid=claims.sub;const owner=isOwner(claims);
  switch(input.action){
      case 'profile':{
        const rows=await database('gp_web_customers?customer_uid=eq.'+encodeURIComponent(uid)+'&select=*');
        const offers=await database('gp_web_customer_offers?customer_uid=eq.'+encodeURIComponent(uid)+'&select=title,kind,amount,active,expires_at');
        return ({profile:rows[0]||null,offer:currentOffer(offers[0])});
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
        if(input.action==='admin_orders'&&input.status){
          if(!statuses.includes(input.status))throw new RequestError('Estado inválido.');
          path+='&status=eq.'+input.status;
        }
        const rows=await database(path);const displayed=rows.slice(0,30);
        let deliveries=[];
        if(displayed.length){
          const ids=displayed.map(order=>order.id).join(',');
          let shippingPath='gp_web_deliveries?order_id=in.('+encodeURIComponent(ids)+')&select=*';
          if(input.action==='orders')shippingPath+='&customer_uid=eq.'+encodeURIComponent(uid);
          deliveries=await database(shippingPath);
        }
        const shipping=new Map(deliveries.map(delivery=>[delivery.order_id,delivery]));
        return {orders:displayed.map(order=>({...order,shipping:shipping.get(order.id)||null})),more:rows.length>30};
      }
      case 'admin_customers':{
        if(!owner)throw new RequestError('Acceso reservado al propietario.',403);
        const offset=Math.max(0,Math.min(100000,Number(input.offset)||0));
        const q=String(input.query||'').trim().slice(0,100).replace(/[^\p{L}\p{N} @.+-]/gu,'');
        let path='gp_web_customers?select=*&order=updated_at.desc,customer_uid&limit=31&offset='+Math.trunc(offset);
        if(q)path+='&or='+encodeURIComponent('(recipient.ilike.*'+q+'*,phone.ilike.*'+q+'*,email.ilike.*'+q+'*)');
        const rows=await database(path);return ({customers:rows.slice(0,30),more:rows.length>30});
      }
      case 'admin_offer':
      case 'admin_save_offer':{
        if(!owner)throw new RequestError('Acceso reservado al propietario.',403);
        const customer=String(input.customer||'');
        if(!customer||customer.length>128)throw new RequestError('Selecciona un cliente.');
        const rows=await database('gp_web_customers?customer_uid=eq.'+encodeURIComponent(customer)+'&select=customer_uid');
        if(!rows.length)throw new RequestError('No se encontró el cliente.',404);
        if(input.action==='admin_offer'){
          const offers=await database('gp_web_customer_offers?customer_uid=eq.'+encodeURIComponent(customer)+'&select=*');
          return {offer:offers[0]||null};
        }
        let offer;try{offer=validateOffer(input.offer)}catch(error){throw new RequestError(error.message)}
        const saved=await database('gp_web_customer_offers?on_conflict=customer_uid','POST',{...offer,customer_uid:customer,updated_by:uid,updated_at:new Date().toISOString()});
        return {offer:saved[0]};
      }
      case 'admin_live':{
        if(!owner)throw new RequestError('Acceso reservado al propietario.',403);
        const latest=await database('gp_web_orders?select=event_seq&order=event_seq.desc&limit=1');
        const latestCursor=String(latest[0]?.event_seq||'0');
        if(input.cursor===undefined||input.cursor===null)return {events:[],cursor:latestCursor,more:false};
        const cursor=String(input.cursor);
        if(!/^\\d{1,18}$/.test(cursor))throw new RequestError('Cursor inválido.');
        const events=await database('gp_web_orders?select=id,event_seq,created_at,delivery,total,status&event_seq=gt.'+cursor+'&order=event_seq.asc&limit=101');
        const page=events.slice(0,100);
        return {events:page,cursor:page.length?String(page[page.length-1].event_seq):cursor,more:events.length>100};
      }
      case 'admin_deliveries':{
        if(!owner)throw new RequestError('Acceso reservado al propietario.',403);
        const offset=Math.max(0,Math.min(100000,Number(input.offset)||0));
        let path='gp_web_deliveries?select=*&order=created_at.desc,order_id&limit=31&offset='+Math.trunc(offset);
        if(input.view==='active')path+='&status=not.in.(entregado,cancelado)';
        if(input.view==='history')path+='&status=in.(entregado,cancelado)';
        const rows=await database(path);return {deliveries:rows.slice(0,30),more:rows.length>30};
      }
      case 'admin_delivery_update':{
        if(!owner)throw new RequestError('Acceso reservado al propietario.',403);
        const value=input.delivery;
        if(!value||!/^[-a-f0-9]{36}$/i.test(value.id||'')||!['recibido','en_proceso','listo','en_camino','entregado','cancelado'].includes(value.status))throw new RequestError('Revisa los datos del delivery.');
        if(typeof value.fee!=='number'||!Number.isFinite(value.fee)||value.fee<0||value.fee>10000)throw new RequestError('Revisa el costo de delivery.');
        const eta=value.estimatedAt||null;
        if(eta&&(typeof eta!=='string'||!Number.isFinite(Date.parse(eta))))throw new RequestError('Revisa la hora de entrega.');
        const delivery=await database('rpc/gp_web_update_delivery','POST',{p_id:value.id,p_status:value.status,p_fee:Math.round(value.fee*100)/100,p_eta:eta});
        return {delivery};
      }
      case 'admin_status':{
        if(!owner)throw new RequestError('Acceso reservado al propietario.',403);
        if(!statuses.includes(input.status)||!/^[-a-f0-9]{36}$/i.test(input.id||''))throw new RequestError('Estado inválido.');
        const order=await database('rpc/gp_web_set_order_status','POST',{p_id:input.id,p_status:input.status});
        return {order};
      }
      default:throw new RequestError('Acción inválida.');
    }
}
