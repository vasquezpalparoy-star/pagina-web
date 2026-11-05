(()=>{
 const section=document.getElementById('gp-delivery-access'),form=section?.querySelector('#gp-phone-tracking');if(!form)return;
 const results=section.querySelector('#gp-phone-results'),message=section.querySelector('.gp-phone-message'),button=form.querySelector('button');
 const labels={solicitado:'Por confirmar',confirmado:'Confirmado',recibido:'Recibido',en_proceso:'En proceso',listo:'Listo',en_camino:'En camino',entregado:'Entregado',cancelado:'Cancelado'};
 const steps=['recibido','en_proceso','listo','en_camino','entregado'];let epoch=0,controller=null;
 if(window.GrafiplotTracking)results.replaceChildren(window.GrafiplotTracking.create(null));
 const node=(tag,text)=>{const e=document.createElement(tag);e.textContent=text;return e};
 function clear(){epoch++;controller?.abort();controller=null;button.disabled=false;results.replaceChildren();message.textContent=''}
 form.elements.phone.addEventListener('input',clear);
 window.addEventListener('pagehide',clear);
 form.onsubmit=async event=>{
  event.preventDefault();clear();const version=epoch;
  let phone=form.elements.phone.value.replace(/\D/g,'');if(phone.length===11&&phone.startsWith('51'))phone=phone.slice(2);
  if(!/^9\d{8}$/.test(phone)){message.textContent='Escribe el celular peruano de nueve dígitos usado en tu pedido.';return}
  button.disabled=true;message.textContent='Consultando el estado…';const requestController=new AbortController();controller=requestController;const timeout=setTimeout(()=>requestController.abort(),20000);
  try{
   const response=await fetch('https://gyvztqpvgtinxoqhyfbw.supabase.co/functions/v1/grafiplot-store',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'track_phone',phone}),signal:requestController.signal});
   const data=await response.json();if(epoch!==version)return;
   if(!response.ok)throw Error(data.error||'No se pudo consultar el pedido.');
   const orders=(data.orders||[]).filter(order=>!['entregado','cancelado'].includes(order.status)).slice(0,1);
   results.append(node('h3','Tu último delivery activo'));
   if(!orders.length){message.textContent='No hay deliveries activos con ese celular. Los pedidos entregados o cancelados no aparecen aquí. Verifica que sea el número registrado.';return}
   for(const order of orders){
    const card=node('article','');card.className='gp-phone-result';
    const date=new Date(order.created_at).toLocaleDateString('es-PE',{timeZone:'America/Lima'});
    card.append(node('h4','Pedido '+order.reference+' · '+date),...(window.GrafiplotTracking?[]:[node('strong',labels[order.status]||'Por confirmar')]));
    if(window.GrafiplotTracking)card.append(window.GrafiplotTracking.create(order.status));
    else if(steps.includes(order.status)){
     const list=node('ol','');list.className='gp-status-steps';const current=steps.indexOf(order.status);
     steps.forEach((step,index)=>{const item=node('li',(index<current?'✓ ':index===current?'● ':'○ ')+labels[step]);item.className=index<current?'done':index===current?'current':'';if(index===current)item.setAttribute('aria-current','step');list.append(item)});card.append(list);
    }
    if(order.estimated_at)card.append(node('p','Entrega estimada: '+new Date(order.estimated_at).toLocaleString('es-PE',{timeZone:'America/Lima'})));
    results.append(card);
   }
   message.textContent='Mostramos únicamente tu último delivery activo.';
  }catch(error){if(version===epoch)message.textContent=error.name==='AbortError'?'La consulta tardó demasiado. Inténtalo de nuevo.':error.message}
  finally{clearTimeout(timeout);if(version===epoch){button.disabled=false;controller=null}}
 };
})();
