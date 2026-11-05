const ENDPOINT='https://gyvztqpvgtinxoqhyfbw.supabase.co/functions/v1/grafiplot-store';
export async function storeRequest(user,action,data={}){
  if(!user)throw Error('Ingresa con tu cuenta para consultar o guardar en tu historial.');
  const token=await user.getIdToken();
  const response=await fetch(ENDPOINT,{
    method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
    body:JSON.stringify({...data,action}),signal:AbortSignal.timeout(20000)
  });
  const result=await response.json().catch(()=>({}));
  if(!response.ok)throw Error(result.error||'No se pudo conectar con el historial.');
  return result;
}
const labels={solicitado:'Solicitado · por confirmar',confirmado:'Confirmado',entregado:'Entregado',cancelado:'Cancelado'};
const money=value=>'S/ '+Number(value).toFixed(2);
function textElement(tag,text){const node=document.createElement(tag);node.textContent=text;return node;}
function showOrder(order,user,admin=false){
  const card=document.createElement('details');card.className='gp-history-order';
  const date=new Date(order.created_at).toLocaleString('es-PE');
  card.append(textElement('summary',date+' · '+money(order.total)+' · '+(labels[order.status]||order.status)));
  card.append(textElement('p','Pedido '+order.id));
  const info=order.delivery;
  card.append(textElement('p',[info.recipient,info.phone,info.address,info.reference,'Pago: '+info.payment].filter(Boolean).join(' · ')));
  const list=document.createElement('ul');
  order.items.forEach(item=>list.append(textElement('li',item.quantity+' × '+item.name+' · '+money(item.quantity*item.price))));
  card.append(list,textElement('small','Importes de referencia. Costo de delivery por confirmar.'));
  if(admin){
    const controls=document.createElement('div');controls.className='delivery-actions';
    const select=document.createElement('select');select.setAttribute('aria-label','Estado del pedido '+order.id);
    Object.entries(labels).forEach(([value,label])=>{const option=document.createElement('option');option.value=value;option.textContent=label;select.append(option)});
    select.value=order.status;
    const button=textElement('button','Guardar estado');button.type='button';
    const status=textElement('span','');status.setAttribute('role','status');
    button.onclick=async()=>{
      button.disabled=true;
      try{const result=await storeRequest(user,'admin_status',{id:order.id,status:select.value});order=result.order;card.querySelector('summary').textContent=date+' · '+money(order.total)+' · '+labels[order.status];status.textContent='Guardado.'}
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
  return {panel,clear(){epoch++;panel.open=false;list.replaceChildren();status.textContent='';more.hidden=true;offset=0}};
}
// Owner authentication stays in the existing Configuración form.
const admin=document.createElement('section');admin.className='gp-store-admin';admin.hidden=true;
admin.append(textElement('h2','Clientes y pedidos de la web'));
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
      const button=textElement('button','Ver sus pedidos');button.type='button';button.onclick=()=>readOrders(true,customer.customer_uid);card.append(button);customers.append(card);
    });
    customerOffset+=result.customers.length;moreCustomers.hidden=!result.more;status.textContent=customers.children.length?'':'No se encontraron clientes.';
  }catch(error){if(version===adminEpoch)status.textContent=error.message}finally{searchButton.disabled=false;moreCustomers.disabled=false}
}
searchButton.onclick=()=>readCustomers(true);search.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();readCustomers(true)}};
allOrders.onclick=()=>readOrders(true);moreCustomers.onclick=()=>readCustomers(false);moreOrders.onclick=()=>readOrders(false);
window.addEventListener('gp-owner-session',event=>{
  owner=event.detail;adminEpoch++;admin.hidden=!owner;customers.replaceChildren();orders.replaceChildren();status.textContent='';moreCustomers.hidden=true;moreOrders.hidden=true;search.value='';
});
