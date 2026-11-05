import {storeRequest} from './store-api.js?v=delivery-live1';

export const deliveryLabels={recibido:'Recibido',en_proceso:'En proceso',listo:'Listo para salir',en_camino:'En camino',entregado:'Entregado',cancelado:'Cancelado'};
export const formatMoney=value=>'S/ '+Number(value||0).toFixed(2);
export function element(tag,text,className=''){
  const node=document.createElement(tag);
  if(text!==undefined)node.textContent=text;
  if(className)node.className=className;
  return node;
}
function infoList(record){
  const container=element('div',undefined,'web-order-details');
  const delivery=record.delivery;
  container.append(element('p',delivery.recipient+' · '+delivery.phone),element('p',delivery.address));
  if(delivery.reference)container.append(element('p','Referencia: '+delivery.reference));
  container.append(element('p','Pago: '+delivery.payment));
  container.append(element('p',delivery.deliveryOption==='fixed'?'Delivery elegido: S/ 3.00':'Delivery: consultar costo con el administrador'));
  if(delivery.deliveryOption==='fixed'&&record.total!==undefined)container.append(element('strong','Total con delivery: '+formatMoney(Number(record.total)+3)));
  const list=element('ul');
  record.items.forEach(item=>list.append(element('li',item.quantity+' × '+item.name+' · '+formatMoney(item.quantity*item.price))));
  container.append(list);
  return container;
}
function deliveryCard(record,user,refresh){
  const article=element('article',undefined,'web-order-card');
  const heading=element('div',undefined,'web-order-heading');
  heading.append(element('h3',record.delivery.recipient),element('span',deliveryLabels[record.status],'web-order-badge'));
  article.append(heading,element('small','Pedido '+record.order_id),infoList(record));
  article.append(element('strong','Productos: '+formatMoney(record.products_total)));
  if(record.delivery_fee!==null)article.append(element('p','Total con delivery: '+formatMoney(Number(record.products_total)+Number(record.delivery_fee))));
  if(record.estimated_at)article.append(element('p','Entrega estimada: '+new Date(record.estimated_at).toLocaleString('es-PE',{timeZone:'America/Lima'})));
  const form=element('form',undefined,'web-delivery-form');
  const label=(text,input)=>{const node=element('label',text);node.append(input);form.append(node)};
  const state=element('select');state.setAttribute('aria-label','Estado del delivery '+record.order_id);
  for(const [value,text] of Object.entries(deliveryLabels)){const option=element('option',text);option.value=value;state.append(option)}
  state.value=record.status;label('Estado',state);
  const fee=element('input');fee.type='number';fee.min='0';fee.max='10000';fee.step='0.01';fee.required=true;fee.value=record.delivery_fee===null?'':String(record.delivery_fee);fee.placeholder='0 si es gratuito';label('Costo de delivery (S/)',fee);
  const eta=element('input');eta.type='datetime-local';
  eta.value=record.estimated_at?new Date(Date.parse(record.estimated_at)-5*3600000).toISOString().slice(0,16):'';
  label('Entrega estimada (hora de Perú)',eta);
  const save=element('button','Guardar delivery');save.type='submit';
  const status=element('p','');status.setAttribute('role','status');form.append(save,status);
  form.onsubmit=async event=>{
    event.preventDefault();save.disabled=true;status.textContent='Guardando…';
    try{
      await storeRequest(user,'admin_delivery_update',{delivery:{id:record.order_id,status:state.value,fee:Number(fee.value),estimatedAt:eta.value?eta.value+':00-05:00':null}});
      status.textContent='Delivery actualizado.';await refresh(false);
    }catch(error){status.textContent=error.message}finally{save.disabled=false}
  };
  article.append(form);return article;
}
export function mountDeliveryQueue(target,user){
  target.replaceChildren();target.hidden=false;
  target.append(element('h2','Deliveries de pedidos web'));
  const note=element('p','Los pedidos confirmados se agregan aquí con los datos registrados.');target.append(note);
  const controls=element('div',undefined,'web-order-controls');
  const view=element('select');view.setAttribute('aria-label','Ver deliveries web');
  for(const [value,text] of [['active','Entregas activas'],['history','Entregados y cancelados']]){const option=element('option',text);option.value=value;view.append(option)}
  const refreshButton=element('button','Actualizar deliveries');refreshButton.type='button';
  const full=element('a','Abrir página de pedidos y alertas');full.href='./pedidos-delivery.html';
  controls.append(view,refreshButton,full);target.append(controls);
  const status=element('p','');status.setAttribute('role','status');const list=element('div',undefined,'web-orders-grid');
  const more=element('button','Mostrar más deliveries');more.type='button';more.hidden=true;target.append(status,list,more);
  let stopped=false,version=0,offset=0,signature='',pending=false;
  async function read(automatic=false,append=false){
    if(stopped||pending)return;
    if(automatic&&(list.contains(document.activeElement)||offset>30))return;
    pending=true;const epoch=++version;
    if(!append)offset=0;
    refreshButton.disabled=true;more.disabled=true;
    try{
      const result=await storeRequest(user,'admin_deliveries',{view:view.value,offset});
      if(stopped||epoch!==version||(automatic&&list.contains(document.activeElement)))return;
      const nextSignature=JSON.stringify(result.deliveries);
      if(append||!automatic||nextSignature!==signature){
        if(!append)list.replaceChildren();
        result.deliveries.forEach(delivery=>list.append(deliveryCard(delivery,user,read)));
      }
      if(!append)signature=nextSignature;
      offset+=result.deliveries.length;more.hidden=!result.more;
      status.textContent=list.children.length?'':'No hay deliveries en esta vista.';
    }catch(error){if(!stopped&&epoch===version){if(error.status===401||error.status===403)list.replaceChildren();status.textContent=error.message}}
    finally{pending=false;refreshButton.disabled=false;more.disabled=false}
  }
  refreshButton.onclick=()=>read(false);more.onclick=()=>read(false,true);
  view.onchange=()=>{signature='';read(false)};
  read(false);
  return {refresh:()=>read(true),stop(){stopped=true;version++;target.replaceChildren();target.hidden=true}};
}
export function mountPendingOrders(target,user,onChange){
  target.replaceChildren();target.append(element('h2','Pedidos por confirmar'));
  const status=element('p','');status.setAttribute('role','status');
  const list=element('div',undefined,'web-orders-grid');
  const more=element('button','Mostrar más pedidos');more.type='button';more.hidden=true;
  const refreshButton=element('button','Actualizar pedidos');refreshButton.type='button';
  target.append(refreshButton,status,list,more);
  let stopped=false,pending=false,offset=0,signature='',epoch=0;
  const busy=new Set();
  async function read(automatic=false,append=false){
    if(stopped||pending||(automatic&&(busy.size||offset>30)))return;
    pending=true;const version=++epoch;
    if(!append)offset=0;
    refreshButton.disabled=true;more.disabled=true;
    try{
      const result=await storeRequest(user,'admin_orders',{offset,status:'solicitado'});
      if(stopped||version!==epoch||(automatic&&busy.size))return;
      const next=JSON.stringify(result.orders);
      if(append||!automatic||next!==signature){
        if(!append)list.replaceChildren();
        for(const order of result.orders){
          const card=element('article',undefined,'web-order-card');
          card.append(element('h3',order.delivery.recipient),element('small','Pedido '+order.id),infoList(order),element('strong','Total productos: '+formatMoney(order.total)));
          if(Number(order.discount_amount)>0)card.append(element('p','Descuento aplicado: '+formatMoney(order.discount_amount)));
          const controls=element('div',undefined,'web-order-controls');const feedback=element('p','');feedback.setAttribute('role','status');
          for(const [value,text] of [['confirmado','Confirmar y agregar al delivery'],['cancelado','Cancelar pedido']]){
            const button=element('button',text);button.type='button';button.onclick=async()=>{
              if(busy.has(order.id))return;busy.add(order.id);controls.querySelectorAll('button').forEach(node=>node.disabled=true);
              try{await storeRequest(user,'admin_status',{id:order.id,status:value});feedback.textContent=value==='confirmado'?'Confirmado. Agregado al delivery.':'Pedido cancelado.';busy.delete(order.id);signature='';await read(false);onChange?.()}
              catch(error){feedback.textContent=error.message}
              finally{busy.delete(order.id);controls.querySelectorAll('button').forEach(node=>node.disabled=false)}
            };controls.append(button);
          }
          card.append(controls,feedback);list.append(card);
        }
      }
      if(!append)signature=next;offset+=result.orders.length;more.hidden=!result.more;
      status.textContent=list.children.length?'':'No hay pedidos pendientes de confirmación.';
    }catch(error){if(!stopped&&version===epoch){if(error.status===401||error.status===403)list.replaceChildren();status.textContent=error.message}}
    finally{pending=false;refreshButton.disabled=false;more.disabled=false}
  }
  refreshButton.onclick=()=>read(false);more.onclick=()=>read(false,true);read(false);
  return {refresh:()=>read(true),stop(){stopped=true;epoch++;target.replaceChildren()}};
}
