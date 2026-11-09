import {defaultQuoteServices,validateQuoteServices,validateRanges,calculateServiceQuote} from './quote-ranges.mjs';
export function initQuoteEditor(root){
 const doc=root.ownerDocument,win=doc.defaultView,form=root.querySelector('#gp-quote .gp-form'),rates=root.querySelector('#gp-rates-editor');
 if(!form||!rates)return;
 let services=defaultQuoteServices(),printingRanges={},config={},owner=false;
 const make=(tag,text)=>{const e=doc.createElement(tag);if(text)e.textContent=text;return e};
 const notify=()=>{root.querySelector('#gp-settings-editor').dispatchEvent(new win.Event('input',{bubbles:true}));update()};
 const id=()=>crypto.randomUUID();
 const label=(title,input)=>{const e=make('label',title);e.append(input);return e};
 const button=(title,fn)=>{const b=make('button',title);b.type='button';b.className='gp-button secondary';b.onclick=fn;return b};
 const option=(text,value)=>{const o=make('option',text);o.value=value;return o};
 const serviceSelect=make('select');serviceSelect.id='gp-quote-service';serviceSelect.setAttribute('aria-label','Servicio a cotizar');
 const choice=label('Servicio',serviceSelect);choice.className='gp-quote-service-choice';form.prepend(choice);
 const custom=make('div');custom.className='gp-custom-quote';custom.hidden=true;
 const formatSelect=make('select');formatSelect.setAttribute('aria-label','Formato del servicio');
 const quantity=make('input');quantity.type='number';quantity.min='1';quantity.max='1000000';quantity.step='1';quantity.value='1';
 const unitLabel=label('Cantidad de hojas',quantity);const result=make('p');result.setAttribute('role','status');
 custom.append(label('Formato',formatSelect),unitLabel,result);choice.after(custom);
 const manage=button('Editar servicios y precios',()=>win.dispatchEvent(new win.CustomEvent('gp-open-rates')));manage.classList.add('gp-editor-only','gp-ui-control');manage.hidden=true;choice.append(manage);
 const admin=make('details');admin.id='gp-quote-services-editor';admin.className='gp-settings-group';admin.open=true;
 const summary=make('summary','Servicios del cotizador y precios por cantidad');const body=make('div');admin.append(summary,make('p','Define el precio por unidad para cada rango. Se aplica a toda la cantidad, no por tramos. «Hasta» vacío significa en adelante. Los precios vacíos y las cantidades sin rango quedan por confirmar.'),body);
 rates.after(admin);
 function input(value,type='text',onInput){const e=make('input');e.type=type;e.value=value??'';if(type==='number'){e.min='0';e.step='0.01'}e.oninput=()=>{onInput(e.value);notify()};return e}
 function rangeEditor(rows,changed){
  const wrap=make('div');wrap.className='gp-range-editor';
  function draw(){wrap.replaceChildren();rows.forEach((row,index)=>{const line=make('div');line.className='gp-range-row';
   for(const [key,title] of [['min','Desde'],['max','Hasta'],['price','S/ por unidad']]){const e=input(row[key],'number',value=>{row[key]=value;changed()});e.min=key==='price'?'0':'1';e.step=key==='price'?'0.01':'1';e.placeholder=key==='max'?'Sin límite':key==='price'?'Por confirmar':'';line.append(label(title,e))}
   line.append(button('Quitar rango',()=>{rows.splice(index,1);draw();changed();notify()}));wrap.append(line)});
   wrap.append(button('Añadir rango',()=>{const last=rows[rows.length-1];rows.push({min:last&&last.max!==null&&last.max!==''?Number(last.max)+1:1,max:null,price:null});draw();changed();notify()}));
  }draw();return wrap;
 }
 function renderAdmin(){
  body.replaceChildren();
  services.forEach((service,index)=>{
   const box=make('details');box.className='gp-quote-service-editor';box.append(make('summary',service.name));
   box.append(label('Nombre del servicio',input(service.name,'text',value=>{service.name=value;box.querySelector('summary').textContent=value;refreshChoices()})),label('Unidad (hoja, plano, unidad…)',input(service.unit,'text',value=>service.unit=value)));
   service.formats.forEach((format,formatIndex)=>{const block=make('div');block.className='gp-quote-format-editor';
    block.append(label('Formato o variante',input(format.label,'text',value=>{format.label=value;refreshChoices()})),rangeEditor(format.ranges,update),button('Eliminar formato',()=>{service.formats.splice(formatIndex,1);renderAdmin();refreshChoices();notify()}));box.append(block);
   });
   box.append(button('Añadir formato',()=>{service.formats.push({id:id(),label:'Nuevo formato',ranges:[{min:1,max:null,price:null}]});renderAdmin();refreshChoices();notify()}),button('Eliminar servicio del cotizador',()=>{services.splice(index,1);renderAdmin();refreshChoices();notify()}));body.append(box);
  });
  body.append(button('Añadir servicio al cotizador',()=>{services.push({id:id(),name:'Nuevo servicio',unit:'unidad',formats:[{id:id(),label:'General',ranges:[{min:1,max:null,price:null}]}]});renderAdmin();body.lastElementChild.previousElementSibling.open=true;refreshChoices();notify()}));
  attachPrintingRanges();
 }
 function attachPrintingRanges(){
  rates.querySelectorAll('[data-rate-key]').forEach(base=>{
   if(base.dataset.rangesReady||!/^.+_(color|bn)_(menor|mayor)$/.test(base.dataset.rateKey))return;
   base.dataset.rangesReady='true';const key=base.dataset.rateKey;const details=make('details');details.className='gp-printing-ranges';details.append(make('summary','Precios por cantidad (opcional)'));
   const rows=printingRanges[key]||(printingRanges[key]=[]);details.append(rangeEditor(rows,()=>{}));base.closest('label').after(details);
  });
 }
 function printVisibility(hide){
  form.querySelectorAll(':scope > .gp-fields,.gp-quote-advanced,.gp-quote-steps,.gp-total').forEach(e=>e.hidden=hide);
 }
 function refreshChoices(){
  const selected=serviceSelect.value;serviceSelect.replaceChildren(option('Impresiones y copias','printing'),...services.map(s=>option(s.name,s.id)));serviceSelect.value=services.some(s=>s.id===selected)?selected:'printing';
  const current=services.find(s=>s.id===serviceSelect.value);const previous=formatSelect.value;formatSelect.replaceChildren(...(current?.formats||[]).map(f=>option(f.label,f.id)));if(current?.formats.some(f=>f.id===previous))formatSelect.value=previous;else if(current?.formats[0])formatSelect.value=current.formats[0].id;update();
 }
 function currentQuote(){const service=services.find(s=>s.id===serviceSelect.value);return service?calculateServiceQuote(service,formatSelect.value,quantity.value):null}
 function update(){
  const service=services.find(s=>s.id===serviceSelect.value);custom.hidden=!service;printVisibility(!!service);
  if(!service){root.querySelector('#gp-pages').dispatchEvent(new win.Event('input'));return}
  unitLabel.firstChild.textContent='Cantidad ('+service.unit+')';
  try{const quote=currentQuote();const range=quote.range;result.textContent=quote.price===null?'Precio por confirmar. Consulta por WhatsApp.':'S/ '+quote.price.toFixed(2)+' por '+quote.unit+' · Rango '+range.min+'–'+(range.max??'en adelante');root.querySelector('#gp-price').textContent=quote.total===null?'Por confirmar':'S/ '+quote.total.toFixed(2);root.querySelector('#gp-status').textContent=''}
  catch(error){result.textContent=error.message;root.querySelector('#gp-price').textContent='Por confirmar'}
 }
 serviceSelect.onchange=refreshChoices;formatSelect.onchange=update;quantity.oninput=update;
 root.querySelector('#gp-send').addEventListener('click',event=>{
  if(serviceSelect.value==='printing')return;event.preventDefault();event.stopImmediatePropagation();
  try{const q=currentQuote();const total=q.total===null?'Por confirmar':'S/ '+q.total.toFixed(2);const text='Hola Grafiplot, solicito cotización de '+q.service+'\nFormato: '+q.format+'\nCantidad: '+q.quantity+' '+q.unit+'(s)\nPrecio unitario: '+(q.price===null?'Por confirmar':'S/ '+q.price.toFixed(2))+'\nTotal estimado: '+total;win.open('https://wa.me/51916133647?text='+encodeURIComponent(text),'_blank','noopener,noreferrer')}
  catch(error){result.textContent=error.message}
 },true);
 function load(data={}){config=data;services=structuredClone(Array.isArray(data.quoteServices)?data.quoteServices:defaultQuoteServices());printingRanges=structuredClone(data.autoPriceRanges||{});rates.querySelectorAll('.gp-printing-ranges').forEach(e=>e.remove());rates.querySelectorAll('[data-ranges-ready]').forEach(e=>delete e.dataset.rangesReady);renderAdmin();refreshChoices()}
 win.addEventListener('gp-config-loaded',event=>load(event.detail));
 win.addEventListener('gp-owner-save',event=>{if(event.detail==='saved')setTimeout(update,0)});
 win.addEventListener('gp-owner-session',event=>{owner=!!event.detail;manage.hidden=!owner});
 const observer=new win.MutationObserver(records=>{if(records.some(r=>r.type==='childList'))attachPrintingRanges()});observer.observe(rates,{childList:true,subtree:true});
 win.GrafiplotAddons||={};win.GrafiplotAddons.quotes={value(){return {quoteServices:validateQuoteServices(services),autoPriceRanges:Object.fromEntries(Object.entries(printingRanges).map(([key,rows])=>[key,validateRanges(rows)]))}},load};
 load(win.GrafiplotPage?.config||{});return {load,currentQuote};
}
if(typeof document!=='undefined'){const root=document.getElementById('grafiplot-preview');if(root)initQuoteEditor(root)}
