import {storeRequest} from './store-api.js?v=delivery-live1';
export {storeRequest};
const labels={solicitado:'Solicitado · por confirmar',confirmado:'Confirmado',entregado:'Entregado',cancelado:'Cancelado'};
const money=value=>'S/ '+Number(value).toFixed(2);
function textElement(tag,text){const node=document.createElement(tag);node.textContent=text;return node;}
function showOrder(order,user,admin=false){
  const card=document.createElement('details');card.className='gp-history-order';
  const date=new Date(order.created_at).toLocaleString('es-PE');
  card.append(textElement('summary',date+' · '+money(order.total)+' · '+(labels[order.status]||order.status)));
  card.append(textElement('p','Pedido '+order.id));
  if(Number(order.discount_amount)>0){
    card.append(textElement('p','Subtotal: '+money(order.subtotal)+' · Descuento: −'+money(order.discount_amount)+' · '+(order.offer_snapshot?.title||'Beneficio del cliente')));
  }
  if(order.shipping){
    const shippingLabels={recibido:'Recibido',en_proceso:'En proceso',listo:'Listo',en_camino:'En camino',entregado:'Entregado',cancelado:'Cancelado'};
    card.append(textElement('p','Delivery: '+(shippingLabels[order.shipping.status]||order.shipping.status)));
    if(order.shipping.estimated_at)card.append(textElement('p','Entrega estimada: '+new Date(order.shipping.estimated_at).toLocaleString('es-PE',{timeZone:'America/Lima'})));
    if(order.shipping.delivery_fee!==null)card.append(textElement('p','Costo de delivery: '+money(order.shipping.delivery_fee)+' · Total con delivery: '+money(Number(order.total)+Number(order.shipping.delivery_fee))));
  }
  const info=order.delivery;
  card.append(textElement('p',[info.recipient,info.phone,info.address,info.reference,'Pago: '+info.payment].filter(Boolean).join(' · ')));
  const list=document.createElement('ul');
  order.items.forEach(item=>list.append(textElement('li',item.quantity+' × '+item.name+' · '+money(item.quantity*item.price))));
  card.append(list,textElement('small',order.shipping?'Revisa el estado y el costo de envío indicados arriba.':info.deliveryOption==='fixed'?'Delivery elegido: S/ 3.00 · Total con delivery: '+money(Number(order.total)+3):'Delivery: consultar costo con el administrador.'));
  if(admin){
    const controls=document.createElement('div');controls.className='delivery-actions';
    const select=document.createElement('select');select.setAttribute('aria-label','Estado del pedido '+order.id);
    Object.entries(labels).forEach(([value,label])=>{const option=document.createElement('option');option.value=value;option.textContent=label;if(value==='solicitado'&&order.shipping)option.disabled=true;select.append(option)});
    select.value=order.status;
    const button=textElement('button','Guardar estado');button.type='button';
    const status=textElement('span','');status.setAttribute('role','status');
    button.onclick=async()=>{
      button.disabled=true;
      try{const result=await storeRequest(user,'admin_status',{id:order.id,status:select.value});order=result.order;card.querySelector('summary').textContent=date+' · '+money(order.total)+' · '+labels[order.status];status.textContent=order.status==='confirmado'?'Confirmado y agregado al delivery.':'Guardado.'}
      catch(error){status.textContent=error.message}finally{button.disabled=false}
    };
    controls.append(select,button,status);card.append(controls);
  }
  return card;
}
export function createCustomerHistory(getUser){
  const panel=document.createElement('details');panel.id='delivery-history';
  panel.append(textElement('summary','Mi historial de pedidos'));
  const load=textElement('button','Actualizar historial');load.type='button';
  const list=document.createElement('div');const status=textElement('p','');status.setAttribute('role','status');
  const more=textElement('button','Ver pedidos anteriores');more.type='button';more.hidden=true;
  let offset=0,epoch=0;
  async function read(reset){
    const version=++epoch,user=await getUser();if(reset){offset=0;list.replaceChildren()}
    load.disabled=true;more.disabled=true;status.textContent='Consultando pedidos…';
    try{
      const result=await storeRequest(user,'orders',{offset});if(version!==epoch)return;
      result.orders.forEach(order=>list.append(showOrder(order,user)));offset+=result.orders.length;more.hidden=!result.more;
      status.textContent=list.children.length?'':'Aún no tienes pedidos registrados.';
    }catch(error){if(version===epoch)status.textContent=error.message}finally{load.disabled=false;more.disabled=false}
  }
  load.onclick=()=>read(true);more.onclick=()=>read(false);
  panel.addEventListener('toggle',()=>{if(panel.open)read(true)});
  panel.append(load,status,list,more);
  return {panel,refresh:()=>read(true),clear(){epoch++;panel.open=false;list.replaceChildren();status.textContent='';more.hidden=true;offset=0}};
}
function customerOfferEditor(customer,user){
  const panel=document.createElement('details');panel.className='gp-customer-offer';
  panel.append(textElement('summary','Descuento exclusivo para este cliente'));
  const status=textElement('p','');status.setAttribute('role','status');
  const fields=document.createElement('div');fields.className='gp-offer-fields';fields.hidden=true;
  const label=(text,input)=>{const node=textElement('label',text);node.append(input);fields.append(node)};
  const title=document.createElement('input');title.maxLength=120;title.required=true;title.value='Beneficio para ti';label('Nombre del beneficio',title);
  const kind=document.createElement('select');
  for(const [value,text] of [['percent','Porcentaje (%)'],['fixed','Monto en soles (S/)']]){const option=textElement('option',text);option.value=value;kind.append(option)}
  label('Tipo de descuento',kind);
  const amount=document.createElement('input');amount.type='number';amount.min='0.01';amount.step='0.01';amount.required=true;amount.value='10';label('Valor del descuento',amount);
  const expires=document.createElement('input');expires.type='date';label('Vence el día (opcional)',expires);
  const active=document.createElement('input');active.type='checkbox';label('Activar para este cliente',active);
  const button=textElement('button','Guardar descuento');button.type='button';fields.append(button);
  fields.append(textElement('small','Se aplica a los productos de este cliente hasta que lo desactives o venza. El costo de delivery se confirma aparte.'));
  let loaded=false;
  function display(offer){
    if(offer){
      title.value=offer.title;kind.value=offer.kind;amount.value=String(offer.amount);active.checked=offer.active;
      expires.value=offer.expires_at?new Date(Date.parse(offer.expires_at)-5*60*60*1000).toISOString().slice(0,10):'';
    }
    amount.max=kind.value==='percent'?'100':'1000000';
  }
  kind.onchange=()=>amount.max=kind.value==='percent'?'100':'1000000';
  panel.addEventListener('toggle',async()=>{
    if(!panel.open||loaded)return;
    loaded=true;status.textContent='Consultando descuento…';
    try{const result=await storeRequest(user,'admin_offer',{customer:customer.customer_uid});display(result.offer);fields.hidden=false;status.textContent=result.offer?'Edita el beneficio de este cliente.':'Este cliente aún no tiene un descuento asignado.'}
    catch(error){loaded=false;status.textContent=error.message}
  });
  button.onclick=async()=>{
    if(!title.reportValidity()||!amount.reportValidity()||!expires.reportValidity())return;
    button.disabled=true;
    try{
      const result=await storeRequest(user,'admin_save_offer',{customer:customer.customer_uid,offer:{title:title.value,kind:kind.value,amount:Number(amount.value),active:active.checked,expiresOn:expires.value}});
      display(result.offer);status.textContent=result.offer.active?'Descuento guardado para este cliente.':'Descuento desactivado para este cliente.';
    }catch(error){status.textContent=error.message}finally{button.disabled=false}
  };
  panel.append(status,fields);return panel;
}
// Owner authentication stays in the existing Configuración form.
const admin=document.createElement('section');admin.className='gp-store-admin';admin.hidden=true;
admin.append(textElement('h2','Clientes y pedidos de la web'));
const liveLink=textElement('a','Abrir pedidos, alertas y deliveries');
liveLink.href='./pedidos-delivery.html';liveLink.className='gp-button secondary';admin.append(liveLink);
const search=document.createElement('input');search.type='search';search.placeholder='Buscar por cliente, correo o teléfono';search.setAttribute('aria-label','Buscar clientes');
const searchButton=textElement('button','Consultar clientes');searchButton.type='button';
const allOrders=textElement('button','Ver todos los pedidos');allOrders.type='button';
const status=textElement('p','');status.setAttribute('role','status');
const customers=document.createElement('div');const orders=document.createElement('div');
const moreCustomers=textElement('button','Más clientes');moreCustomers.type='button';moreCustomers.hidden=true;
const moreOrders=textElement('button','Pedidos anteriores');moreOrders.type='button';moreOrders.hidden=true;
admin.append(search,searchButton,allOrders,status,customers,moreCustomers,orders,moreOrders);
document.getElementById('gp-site-settings').append(admin);
let owner=null,adminEpoch=0,customerOffset=0,orderOffset=0,selectedCustomer='';
async function readOrders(reset,customer=''){
  const version=++adminEpoch,user=owner;if(reset){orderOffset=0;selectedCustomer=customer;orders.replaceChildren()}
  moreOrders.disabled=true;status.textContent='Consultando pedidos…';
  try{
    const result=await storeRequest(user,'admin_orders',{offset:orderOffset,customer:selectedCustomer});if(version!==adminEpoch)return;
    result.orders.forEach(order=>orders.append(showOrder(order,user,true)));orderOffset+=result.orders.length;moreOrders.hidden=!result.more;
    status.textContent=orders.children.length?'':'No hay pedidos para esta consulta.';
  }catch(error){if(version===adminEpoch)status.textContent=error.message}finally{moreOrders.disabled=false}
}
async function readCustomers(reset){
  const version=++adminEpoch,user=owner;if(reset){customerOffset=0;customers.replaceChildren();orders.replaceChildren();moreOrders.hidden=true}
  searchButton.disabled=true;moreCustomers.disabled=true;status.textContent='Consultando clientes…';
  try{
    const result=await storeRequest(user,'admin_customers',{offset:customerOffset,query:search.value});if(version!==adminEpoch)return;
    result.customers.forEach(customer=>{
      const card=document.createElement('article');card.className='gp-history-customer';
      card.append(textElement('h3',customer.recipient),textElement('p',customer.email+' · '+customer.phone),textElement('p',customer.address),textElement('p',customer.reference),textElement('p','Pago preferido: '+customer.payment));
      const button=textElement('button','Ver sus pedidos');button.type='button';button.onclick=()=>readOrders(true,customer.customer_uid);card.append(button,customerOfferEditor(customer,user));customers.append(card);
    });
    customerOffset+=result.customers.length;moreCustomers.hidden=!result.more;status.textContent=customers.children.length?'':'No se encontraron clientes.';
  }catch(error){if(version===adminEpoch)status.textContent=error.message}finally{searchButton.disabled=false;moreCustomers.disabled=false}
}
searchButton.onclick=()=>readCustomers(true);search.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();readCustomers(true)}};
allOrders.onclick=()=>readOrders(true);moreCustomers.onclick=()=>readCustomers(false);moreOrders.onclick=()=>readOrders(false);
window.addEventListener('gp-owner-session',event=>{
  owner=event.detail;adminEpoch++;admin.hidden=!owner;customers.replaceChildren();orders.replaceChildren();status.textContent='';moreCustomers.hidden=true;moreOrders.hidden=true;search.value='';
});
