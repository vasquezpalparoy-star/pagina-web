/* Shared illustrated delivery progress. Status and customer data remain separate from images. */
(()=>{
 const stages=[
  ['recibido','Recibido','Pedido registrado','trackingRecibido','recibido'],
  ['en_proceso','En proceso','Preparamos tu trabajo','trackingEnProceso','en-proceso'],
  ['listo','Listo','Preparado para salir','trackingListo','listo'],
  ['en_camino','En camino','Rumbo a tu dirección','trackingEnCamino','en-camino'],
  ['entregado','Entregado','Entrega completada','trackingEntregado','entregado']
 ];
 const captions={recibido:'Recibimos tu pedido. En breve empezaremos a prepararlo.',en_proceso:'Estamos preparando tu pedido. Pronto estará listo para salir.',listo:'Tu pedido está listo. Estamos coordinando su salida.',en_camino:'Tu pedido salió del local y va rumbo a tu dirección.',entregado:'Tu pedido fue entregado. ¡Gracias por confiar en Grafiplot!',confirmado:'Tu pedido está confirmado. En breve empezaremos a prepararlo.',solicitado:'Recibimos tu solicitud. Espera la confirmación de la tienda.',cancelado:'Este pedido fue cancelado. Consulta con la tienda si necesitas ayuda.'};
 const sources={};
 const node=(tag,text,className)=>{const e=document.createElement(tag);if(text)e.textContent=text;if(className)e.className=className;return e};
 const defaultImage=stage=>'./assets/v1/tracking-'+stage[4]+'.png';
 function updateImage(img,stage){const fallback=defaultImage(stage);img.onerror=()=>{img.onerror=null;img.src=fallback};img.src=sources[stage[3]]||fallback}
 function setImages(images={}){for(const stage of stages){const value=images[stage[3]];sources[stage[3]]=typeof value==='string'&&/^https:\/\//i.test(value)?value:defaultImage(stage);document.querySelectorAll('img[data-tracking-image="'+stage[3]+'"]').forEach(img=>updateImage(img,stage))}}
 function create(status){
  const tracker=node('section',null,'gv-tracker');tracker.dataset.status=status||'pending';tracker.setAttribute('aria-label','Seguimiento de delivery');
  const brand=node('div',null,'gv-brand');brand.append(node('strong','GRAFIPLOT'),node('span','VASQUEZ'));tracker.append(brand);
  const title=node('h3',null,'gv-title');title.append(document.createTextNode('Sigue tu '),node('span','delivery'));tracker.append(title);
  const stage=stages.find(s=>s[0]===status);const index=stages.findIndex(s=>s[0]===status);
  const subtitle=status==='confirmado'?'Tu pedido está confirmado':status==='solicitado'?'Tu pedido está por confirmar':status==='cancelado'?'Tu pedido fue cancelado':stage?'Tu pedido '+(status==='entregado'?'fue entregado':'está '+(status==='recibido'?'registrado':stage[1].toLowerCase())):'Consulta el avance de tu pedido con tu celular';
  tracker.append(node('p',subtitle,'gv-subtitle'));
  const viewport=node('div',null,'gv-viewport');viewport.tabIndex=0;viewport.setAttribute('aria-label','Cinco etapas del delivery. Desliza para ver todas.');
  const list=node('ol',null,'gv-stages');list.setAttribute('aria-label','Avance del pedido');
  stages.forEach((s,i)=>{
   const current=i===index,done=index>=0&&i<index;const item=node('li',null,'gv-stage'+(current?' is-current':done?' is-done':''));item.dataset.stage=s[0];
   if(current)item.setAttribute('aria-current','step');
   const art=node('div',null,'gv-art');if(current)art.append(node('span','ESTADO ACTUAL','gv-current-badge'));
   const img=node('img');img.alt=s[1]+': '+s[2];img.width=256;img.height=256;img.dataset.trackingImage=s[3];img.decoding='async';updateImage(img,s);art.append(img);
   const rail=node('div',null,'gv-rail');rail.setAttribute('aria-hidden','true');rail.append(node('span',done?'✓':current?'•':'','gv-dot'));
   item.append(art,rail,node('strong',s[1],'gv-label'),node('span',s[2],'gv-caption'));list.append(item);
  });viewport.append(list);tracker.append(viewport);
  tracker.append(node('p','Desliza para ver todas las etapas →','gv-swipe'));
  const footer=node('div',null,'gv-footer');footer.append(node('p',captions[status]||'Aquí verás el estado real de tu último delivery activo.','gv-message'));
  const contact=node('a','Consultar mi entrega ↗','gv-contact');contact.href='https://wa.me/51916133647?text=Hola%2C%20quiero%20consultar%20mi%20delivery.';contact.target='_blank';contact.rel='noopener noreferrer';footer.append(contact);tracker.append(footer);
  return tracker;
 }
 window.GrafiplotTracking={create,setImages};
})();
