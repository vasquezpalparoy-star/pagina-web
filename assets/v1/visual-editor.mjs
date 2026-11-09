import {uploadImage} from './image-upload.mjs?v=visual1';
const ANCHORS=['gp-home','gp-services','gp-quote','gp-catalog','gp-gallery','gp-library','gp-location'];
export function validateVisualPage(value={}){
 const sections=Array.isArray(value.sections)?value.sections:[];
 if(sections.length>30)throw Error('Añade como máximo 30 bloques a la página.');
 const ids=new Set();const clean={texts:{},images:{},sections:sections.map(s=>{
  if(!/^[\w-]{1,80}$/.test(s.id)||ids.has(s.id)||!ANCHORS.includes(s.anchor)||!['text','image','button','section'].includes(s.type))throw Error('Revisa los bloques añadidos.');ids.add(s.id);
  for(const key of ['image','url'])if(s[key]&&!/^https:\/\//.test(s[key]))throw Error('Usa una dirección HTTPS válida.');
  return {id:s.id,anchor:s.anchor,type:s.type,title:String(s.title||'').slice(0,200),text:String(s.text||'').slice(0,5000),image:String(s.image||''),button:String(s.button||'').slice(0,100),url:String(s.url||'')};
 })};
 for(const [key,text] of Object.entries(value.texts||{})){if(key.length>600||typeof text!=='string'||text.length>5000)throw Error('Revisa los textos de la página.');clean.texts[key]=text}
 for(const [key,url] of Object.entries(value.images||{})){if(key.length>600||!/^https:\/\//.test(url))throw Error('Revisa las imágenes de la página.');clean.images[key]=url}
 return clean;
}
export function initVisualEditor(root){
 const doc=root.ownerDocument,win=doc.defaultView;let model={texts:{},images:{},sections:[]},active=false,session=false,dirty=false,busy=0,baseline={},epoch=0;
 const api=()=>win.GrafiplotPage;const originalTexts=new Map(),originalImages=new Map();
 const make=(tag,text,cls)=>{const n=doc.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n};
 const button=(title,fn)=>{const b=make('button',title);b.type='button';b.onclick=fn;return b};
 const toolbar=make('aside',null,'ve-toolbar');toolbar.dataset.veUi='true';toolbar.hidden=true;
 const brand=make('strong','GRAFIPLOT · MODO EDICIÓN');const status=make('span','Solo tú ves estas herramientas.');status.setAttribute('role','status');
 const preview=button('Vista previa',()=>{active=!active;root.dataset.visualEditing=String(active);preview.textContent=active?'Vista previa':'Volver a editar';decorate()});
 const save=button('Guardar cambios',()=>{if(busy){status.textContent='Espera a que terminen las subidas.';return}api()?.save()});save.className='ve-save';
 const panel=button('Configuración',()=>api()?.openSettings());
 const exit=button('Salir y cerrar sesión',()=>{if(stop(false))api()?.logout?.()});toolbar.append(brand,status,preview,panel,save,exit);doc.body.append(toolbar);
 const entry=button('✎ Editar página',()=>{if(api()?.user)start()});entry.className='ve-entry gp-ui-control';entry.dataset.veUi='true';entry.hidden=!api()?.user;(root.querySelector('#gp-site-settings .gp-section-head')||root.querySelector('#gp-site-settings')).append(entry);
 const dialog=make('dialog',null,'ve-dialog');dialog.dataset.veUi='true';dialog.setAttribute('aria-labelledby','ve-dialog-title');doc.body.append(dialog);
 const skip='#gp-site-settings,#gp-settings-login,#gp-checkout,#gp-cart-dialog,#gp-delivery-access,#gp-campaign-admin,#gp-faq,[data-ve-ui],.gp-promo-toast,#gp-search-results,.gp-quote .gp-form';
 function isPublic(node){return node&&root.contains(node)&&!node.closest(skip)}
 function changed(){dirty=true;status.textContent='Tienes cambios sin guardar.';root.querySelector('#gp-settings-editor').dispatchEvent(new win.Event('input',{bubbles:true}))}
 function selector(node){
  if(node.id)return '#'+node.id;
  const parts=[];let current=node;
  while(current&&current!==root){
   if(current.id){parts.unshift('#'+current.id);break}
   const tag=current.tagName.toLowerCase();const siblings=[...current.parentElement.children].filter(n=>n.tagName===current.tagName);parts.unshift(tag+':nth-of-type('+(siblings.indexOf(current)+1)+')');current=current.parentElement;
  }
  return parts.join(' > ');
 }
 function find(key){try{return root.querySelector(key)}catch{return null}}
 function replaceText(node,text){const icons=[...node.children].filter(c=>c.matches('svg,i'));node.replaceChildren(doc.createTextNode(text),...icons)}
 function render(){
  root.querySelectorAll('[data-ve-block]').forEach(node=>node.remove());
  const last=new Map();
  for(const section of model.sections){
   const anchor=last.get(section.anchor)||root.querySelector('#'+section.anchor);if(!anchor)continue;
   const block=make('section',null,'gp-section gp-wrap ve-content-block');block.id='ve-block-'+section.id;block.dataset.veBlock=section.id;
   if(section.title)block.append(make('h2',section.title));
   if(section.text)block.append(make('p',section.text));
   if(section.image){const image=make('img');image.src=section.image;image.alt=section.title||'Imagen de Grafiplot';image.loading='lazy';block.append(image)}
   if(section.button&&section.url){const link=make('a',section.button,'gp-button');link.href=section.url;link.rel='noopener noreferrer';block.append(link)}
   anchor.after(block);last.set(section.anchor,block);
  }
  for(const [key,text] of Object.entries(model.texts)){const node=find(key);if(isPublic(node)){if(!originalTexts.has(key))originalTexts.set(key,node.textContent);replaceText(node,text)}}
  for(const [key,url] of Object.entries(model.images)){const node=find(key);if(isPublic(node)&&node.tagName==='IMG'){if(!originalImages.has(key))originalImages.set(key,node.src);node.src=url}}
  decorate();
 }
 function decorate(){
  root.querySelectorAll('[data-ve-tools]').forEach(node=>node.remove());
  if(!active)return;
  for(const id of ANCHORS){const section=root.querySelector('#'+id);if(!section)continue;
   const tools=make('div',null,'ve-section-tools');tools.dataset.veTools='true';tools.dataset.veUi='true';
   tools.append(button('+ Añadir aquí',()=>addMenu(id)));
   if(id==='gp-quote')tools.append(button('Servicios y precios del cotizador',()=>win.dispatchEvent(new win.CustomEvent('gp-open-rates'))));
   section.append(tools);
  }
  root.querySelectorAll('[data-ve-block]').forEach(block=>{const tools=make('div',null,'ve-section-tools');tools.dataset.veTools='true';tools.dataset.veUi='true';tools.append(button('Editar bloque',()=>editBlock(block.dataset.veBlock)),button('Eliminar bloque',()=>{model.sections=model.sections.filter(s=>s.id!==block.dataset.veBlock);changed();render()}));block.append(tools)});
 }
 function start(){
  if(!api()?.user)return;
  if(!session){baseline=structuredClone(api().config);api().prepare?.();session=true;dirty=false}
  active=true;root.dataset.visualSession='true';root.dataset.visualEditing='true';toolbar.hidden=false;preview.textContent='Vista previa';root.querySelector('#gp-site-settings').hidden=true;root.querySelector('#gp-home').scrollIntoView({behavior:'smooth'});decorate();
 }
 function stop(forced){
  if(!forced&&dirty&&!win.confirm('Tienes cambios sin guardar. ¿Quieres salir y descartarlos?'))return false;
  epoch++;active=false;session=false;toolbar.hidden=true;root.dataset.visualSession='false';root.dataset.visualEditing='false';dialog.close();
  root.querySelectorAll('[data-ve-tools]').forEach(node=>node.remove());
  if(dirty){api()?.discard(baseline);load(baseline)}dirty=false;return true;
 }
 function editor(title,fields,onSave,onRemove){
  dialog.replaceChildren();const heading=make('h2',title);heading.id='ve-dialog-title';const form=make('form');form.method='dialog';const feedback=make('p');feedback.setAttribute('role','status');
  const inputs={};let imageUrl=fields.image??'';
  for(const [key,value] of Object.entries(fields)){
   if(key==='image')continue;const label=make('label',({name:'Nombre',title:'Título',text:'Texto',description:'Descripción',price:'Precio por unidad (S/)',stock:'Stock disponible',button:'Texto del botón',url:'Destino del botón (HTTPS)'})[key]||key);
   const input=make(['text','description'].includes(key)?'textarea':'input');if(input.tagName==='INPUT')input.type=['price','stock'].includes(key)?'number':key==='url'?'url':'text';input.value=value??'';input.maxLength=['text','description'].includes(key)?5000:200;if(['price','stock'].includes(key)){input.min='0';input.step=key==='stock'?'1':'0.01';input.required=true}if(key==='name')input.required=true;label.append(input);form.append(label);inputs[key]=input;
  }
  if(Object.hasOwn(fields,'image')){
   const area=make('div',null,'ve-image-field');const img=make('img');img.alt='Vista previa';img.src=imageUrl;img.hidden=!imageUrl;
   const picker=make('input');picker.type='file';picker.accept='image/png,image/jpeg,image/webp';picker.hidden=true;
   const choose=button('Subir imagen',()=>picker.click());const uploadStatus=make('p');uploadStatus.setAttribute('role','status');
   picker.onchange=async()=>{
    const file=picker.files?.[0];if(!file)return;const version=epoch,user=api()?.user;if(!user)return;
    busy++;api().busy=true;choose.disabled=true;submit.disabled=true;uploadStatus.textContent='Subiendo imagen…';
    try{const url=await uploadImage(user,file);if(version!==epoch||!api()?.user)return;imageUrl=url;img.src=url;img.hidden=false;uploadStatus.textContent='Imagen guardada en Supabase.'}
    catch(error){uploadStatus.textContent=error.message}
    finally{busy--;api().busy=busy>0;choose.disabled=false;submit.disabled=false;picker.value=''}
   };
   area.append(img,choose,picker,uploadStatus);form.append(area);
  }
  const submit=make('button','Aplicar');submit.type='submit';submit.className='ve-save';
  const cancel=button('Cancelar',()=>dialog.close());form.append(feedback,submit,cancel);
  if(onRemove)form.append(button('Eliminar',()=>{onRemove();dialog.close();changed();decorate()}));
  form.onsubmit=event=>{event.preventDefault();if(busy)return;try{const data=Object.fromEntries(Object.entries(inputs).map(([key,input])=>[key,['price','stock'].includes(key)?Number(input.value):input.value]));if(Object.hasOwn(fields,'image'))data.image=imageUrl;onSave(data);changed();dialog.close();decorate()}catch(error){feedback.textContent=error.message}};
  dialog.append(heading,form);dialog.showModal();
 }
 function editService(index=null){const service=index===null?{name:'Nuevo servicio',description:'',image:''}:api().services[index];editor(index===null?'Añadir servicio':'Editar servicio',{name:service.name,description:service.description,image:service.image},data=>{if(!data.name.trim())throw Error('Escribe el nombre.');api().updateService(index,data)},index===null?null:()=>api().remove('service',index))}
 function editProduct(id=null){const product=id===null?{name:'Nuevo producto',description:'',image:'',price:0,stock:0}:api().products.find(p=>p.id===id);if(!product)return;const fields={name:product.name,description:product.description,image:product.image};if(id===null||id.startsWith('web-'))Object.assign(fields,{price:product.price,stock:product.stock});editor(id===null?'Añadir producto':'Editar producto',fields,data=>{if(!data.name.trim())throw Error('Escribe el nombre.');api().updateProduct(id,data)},id?.startsWith('web-')?()=>api().remove('product',id):null)}
 function editGallery(index=null){if(index!==null&&!api().gallery[index])index=null;const item=index===null?{title:'Nuevo trabajo',description:'',image:''}:api().gallery[index];editor('Editar trabajo de la galería',{title:item.title,description:item.description,image:item.image},data=>api().updateGallery(index,{...item,...data,category:item.category||'Otros'}),index===null?null:()=>api().remove('gallery',index))}
 function editBlock(id){const section=model.sections.find(s=>s.id===id);if(!section)return;editor('Editar bloque',{title:section.title,text:section.text,image:section.image,button:section.button,url:section.url},data=>{Object.assign(section,data);model=validateVisualPage(model);render()})}
 function addMenu(anchor){
  dialog.replaceChildren(make('h2','¿Qué deseas añadir aquí?'));dialog.firstChild.id='ve-dialog-title';
  for(const [type,title] of [['text','Texto'],['image','Imagen'],['service','Servicio'],['product','Producto'],['button','Botón'],['section','Nueva sección']]){
   const b=button(title,()=>{dialog.close();if(type==='service'){if(anchor==='gp-quote')win.dispatchEvent(new win.CustomEvent('gp-open-rates'));else editService();return}if(type==='product'){editProduct();return}
    const fields=type==='image'?{title:'',image:''}:type==='button'?{button:'Consultar',url:'https://wa.me/51916133647'}:type==='text'?{title:'Nuevo título',text:'Escribe aquí el texto.'}:{title:'Nueva sección',text:'',image:'',button:'',url:''};
    editor('Añadir '+title.toLowerCase(),fields,data=>{model.sections.push({id:crypto.randomUUID(),anchor,type,...data});model=validateVisualPage(model);render()});
   });b.className='ve-add-option';dialog.append(b);
  }
  if(anchor==='gp-gallery')dialog.append(button('Trabajo en galería',()=>{dialog.close();editGallery()}));
  dialog.append(button('Cancelar',()=>dialog.close()));dialog.showModal();
 }
 root.addEventListener('click',event=>{
  if(!active||!api()?.user||!isPublic(event.target))return;
  const card=event.target.closest('.gp-service,.gp-product,.gp-work,[data-ve-block]');const image=event.target.closest('img');const text=event.target.closest('h1,h2,h3,p,small,a,button,.gp-eyebrow');
  if(!card&&!image&&!text)return;event.preventDefault();event.stopImmediatePropagation();
  if(card?.matches('.gp-service')){editService([...root.querySelectorAll('.gp-service')].indexOf(card));return}
  if(card?.matches('.gp-product')){const product=api().products.find(p=>p.id===card.dataset.productId);if(product)editProduct(product.id);return}
  if(card?.matches('.gp-work')){editGallery([...root.querySelectorAll('.gp-work')].indexOf(card));return}
  if(card?.dataset.veBlock){editBlock(card.dataset.veBlock);return}
  if(image){const kind=image.classList.contains('gp-logo')?'logo':image.closest('.gp-art')?'hero':null;editor('Cambiar imagen',{image:image.src},data=>{if(!data.image)throw Error('Selecciona una imagen.');if(kind)api().updateImage(kind,data.image);else{const key=selector(image);if(!originalImages.has(key))originalImages.set(key,image.src);model.images[key]=data.image;image.src=data.image}});return}
  if(text)editor('Editar texto',{text:text.textContent.trim()},data=>{const key=selector(text);if(!originalTexts.has(key))originalTexts.set(key,text.textContent);model.texts[key]=data.text;replaceText(text,data.text)});
 },true);
 function load(data={}){for(const [key,text] of originalTexts){const node=find(key);if(isPublic(node))replaceText(node,text)}for(const [key,url] of originalImages){const node=find(key);if(isPublic(node))node.src=url}model=validateVisualPage(data.visualPage||{});render()}
 win.addEventListener('gp-config-loaded',event=>{if(!session)load(event.detail)});
 win.addEventListener('gp-owner-session',()=>{entry.hidden=!api()?.user;if(!api()?.user&&session)stop(true)});
 win.addEventListener('gp-page-ready',()=>load(api()?.config||{}));
 win.addEventListener('gp-owner-save',event=>{if(!session)return;if(event.detail==='saving'){status.textContent='Guardando…';save.disabled=true}if(event.detail==='error'){save.disabled=false;queueMicrotask(()=>status.textContent=root.querySelector('#gp-settings-feedback').textContent)}if(event.detail==='saved'){save.disabled=false;dirty=false;status.textContent='Cambios guardados.';setTimeout(()=>{baseline=structuredClone(api().config);render()},0)}});
 win.addEventListener('beforeunload',event=>{if(session&&dirty){event.preventDefault();event.returnValue=''}});
 win.GrafiplotAddons||={};win.GrafiplotAddons.visual={value:()=>({visualPage:validateVisualPage(model)}),load};
 load(api()?.config||{});return {load,start,stop};
}
if(typeof document!=='undefined'){const root=document.getElementById('grafiplot-preview');if(root)initVisualEditor(root)}
