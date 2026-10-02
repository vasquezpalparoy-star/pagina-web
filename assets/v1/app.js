import {USER_FIREBASE_CONFIG,INVENTORY_FIREBASE_CONFIG,normalizeInventoryProduct} from './config.js';
import {PREVIEW_FORMATS,calculatePreviewQuote} from './cotizador.js';
let firebaseSdkPromise;const loadFirebase=()=>firebaseSdkPromise||(firebaseSdkPromise=import('./firebase.js'));
const setDoc=async(...args)=>(await loadFirebase()).setDoc(...args);
(()=>{const root=document.getElementById('grafiplot-preview');const go=id=>root.querySelector('#'+id).scrollIntoView({behavior:'smooth',block:'start'});root.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));root.querySelectorAll('[data-service]').forEach(b=>b.addEventListener('click',()=>{root.querySelector('#gp-selected').textContent='Servicio seleccionado: '+b.dataset.service;go('gp-quote')}));        const update=()=>{
 const r=calculatePreviewQuote({pages:root.querySelector('#gp-pages').value,copies:root.querySelector('#gp-copies').value,format:root.querySelector('#gp-format').value,color:root.querySelector('#gp-color').value,tariff:root.querySelector('#gp-tariff').value,binding:root.querySelector('#gp-binding').checked,extra:root.querySelector('#gp-extra').value,design:root.querySelector('#gp-design').checked,urgent:root.querySelector('#gp-urgent').checked,spiral:'Negro'},quotePrices);
 root.querySelector('#gp-sheets').textContent=r.sheets+' hojas';
 lastQuote=r;root.querySelector('#gp-price').textContent=r.ready?'S/ '+r.total.toFixed(2):'Por confirmar';
 root.querySelector('#gp-price-hint').textContent=r.ready?'Según tarifas configuradas':'Completa las tarifas';
} ;root.querySelectorAll('.gp-fields input,.gp-fields select').forEach(e=>e.addEventListener('input',update));const searchInput=root.querySelector('#gp-search-input');
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const searchEntries=[...Array.from(root.querySelectorAll('.gp-service')).map((e,i)=>{e.id='gp-service-'+i;return {title:e.dataset.service,type:'Servicio',terms:e.textContent,target:e.id}}),...Array.from(root.querySelectorAll('.gp-work')).map(e=>({title:e.querySelector('h3').textContent,type:'Galería de trabajos',terms:e.dataset.search,target:e.id})),...Array.from(root.querySelectorAll('.gp-product')).map((e,i)=>{e.id='gp-product-'+i;return {title:e.querySelector('h3').textContent,type:'Producto',terms:e.textContent,target:e.id}})];
function resetGallery(){root.querySelectorAll('.gp-work').forEach(e=>e.hidden=false);root.querySelectorAll('[data-filter]').forEach(b=>{const active=b.dataset.filter==='all';b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))})}
function search(){
 const query=normalize(searchInput.value.trim());const panel=root.querySelector('#gp-search-results');panel.hidden=!query;if(!query)return;
 const terms=query.split(/\s+/);const matches=searchEntries.filter(e=>terms.every(t=>normalize(e.title+' '+e.terms).includes(t)));
 root.querySelector('#gp-search-summary').textContent=matches.length?matches.length+' resultados para «'+searchInput.value.trim()+'»':'No encontramos coincidencias. Prueba con planos, tesis, tarjetas o impresión.';
 const list=root.querySelector('#gp-search-items');list.replaceChildren();
 matches.forEach(e=>{
 const b=document.createElement('button');b.type='button';b.className='gp-result';
 const media=document.createElement('span');media.className='gp-result-media';
 const missing=document.createElement('span');missing.className='gp-result-no-image';missing.textContent=e.type==='Producto'?'Sin imagen':e.type;
 if(e.image){const image=document.createElement('img');image.src=e.image;image.alt=e.title;image.loading='lazy';image.addEventListener('error',()=>{image.remove();media.append(missing)});media.append(image)}else media.append(missing);
 const text=document.createElement('span');text.className='gp-result-copy';const title=document.createElement('strong');title.textContent=e.title;const small=document.createElement('small');small.textContent=e.type;text.append(title,small);
 if(typeof e.price==='number'){const price=document.createElement('span');price.className='gp-result-price';price.textContent=money(e.price);text.append(price)}
 const arrow=document.createElement('span');arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');b.append(media,text,arrow);
 b.addEventListener('click',()=>{if(e.type==='Galería de trabajos')resetGallery();go(e.target)});list.append(b);
 });
}
searchInput.addEventListener('input',search);
root.querySelector('.gp-search-form').addEventListener('submit',e=>{e.preventDefault();search()});
root.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{root.querySelectorAll('[data-filter]').forEach(e=>{const active=e===b;e.classList.toggle('active',active);e.setAttribute('aria-pressed',String(active))});root.querySelectorAll('.gp-work').forEach(e=>e.hidden=b.dataset.filter!=='all'&&e.dataset.category!==b.dataset.filter)}));

const campaignAdmin=root.querySelector('#gp-campaign-admin');
const campaignBanner=root.querySelector('#gp-campaign-banner');
const campaignActive=root.querySelector('#gp-campaign-active');
const campaignType=root.querySelector('#gp-campaign-type');
const campaignFeedback=root.querySelector('#gp-campaign-feedback');
root.querySelector('#gp-campaign-open').addEventListener('click',()=>{if(settingsUnlocked){siteSettings.hidden=false;fillSettingsForm();go('gp-site-settings')}else{loginPanel.hidden=false;go('gp-settings-login')}});
root.querySelector('#gp-campaign-close').addEventListener('click',()=>{campaignAdmin.hidden=true});
campaignType.addEventListener('change',()=>{const raffle=campaignType.value==='sorteo';root.querySelector('#gp-campaign-heading').value=raffle?'¡Participa y gana con Grafiplot!':'¡Aprovecha nuestra oferta especial!';root.querySelector('#gp-campaign-copy').value=raffle?'Conoce los premios y completa tu inscripción.':'Descubre la promoción y consulta las condiciones.';root.querySelector('#gp-campaign-button-text').value=raffle?'Inscribirme al sorteo':'Ver oferta'});
function disableCampaign(){campaignActive.checked=false;campaignBanner.hidden=true;root.querySelector('#gp-campaign-state').textContent='Campaña desactivada';campaignFeedback.textContent='El anuncio está oculto en la portada.';campaignFeedback.removeAttribute('role')}
let settingsUnlocked=false;
const loginPanel=root.querySelector('#gp-settings-login');
const siteSettings=root.querySelector('#gp-site-settings');
const settingsTargets=[];
const targetTags='h1,h2,h3,p,span,small,button,a';
root.querySelectorAll(targetTags).forEach(element=>{
 if(element.closest('#gp-cart-nav,.gp-ui-control,[data-service-key=universitarios]'))return;
 if(element.closest('#gp-campaign-admin,#gp-campaign-banner,#gp-settings-login,#gp-site-settings,#gp-faq')||element.id==='gp-campaign-open'||element.id==='gp-theme-toggle'||element.closest('#gp-theme-toggle'))return;
 Array.from(element.childNodes).forEach(node=>{if(node.nodeType===3&&node.textContent.trim()){settingsTargets.push({node,original:node.textContent,group:element.closest('section')?.id||'Encabezado y pie'})}});
});
const previewStorage='grafiplot-config-preview-v1';
let storedPreview={};
function applyPreviewConfig(config){
 const texts=config.texts||{};settingsTargets.forEach((target,index)=>{if(typeof texts[index]==='string'){let value=texts[index];if(target.node.parentElement?.id==='gp-cart-send'&&value==='Consultar pedido por WhatsApp')value='Enviar pedido por WhatsApp';if(target.node.parentElement?.tagName==='H2'&&target.node.parentElement.closest('#gp-cart')&&value==='Tu pedido')value='Carrito de compras';target.node.textContent=value}});
 root.dataset.appearance='dark';root.querySelector('#gp-settings-theme').value='dark';
 if(/^#[0-9a-f]{6}$/i.test(config.brand||'')){root.style.setProperty('--gp-red',config.brand);root.querySelector('#gp-settings-brand').value=config.brand}
 if(config.map){try{const url=new URL(config.map);if(url.protocol==='https:'){root.querySelector('.gp-route-card a').href=url.href;root.querySelector('#gp-settings-map').value=url.href}}catch(_){}}
}
if(storedPreview&&typeof storedPreview==='object')storedPreview.theme='dark';
if(!storedPreview||typeof storedPreview!=='object'||Array.isArray(storedPreview))storedPreview={};
try{applyPreviewConfig(storedPreview)}catch(_){}
function fillSettingsForm(){const container=root.querySelector('#gp-text-settings');container.replaceChildren();const groups=new Map();settingsTargets.forEach((target,index)=>{if(target.node.parentElement?.closest('.gp-work,.gp-product'))return;if(!groups.has(target.group)){const details=document.createElement('details');details.className='gp-settings-group';const summary=document.createElement('summary');const names={'gp-home':'Portada','gp-services':'Servicios','gp-quote':'Cotizador','gp-gallery':'Galería de trabajos','gp-catalog':'Catálogo','gp-location':'Ubicación','Encabezado y pie':'Menú, contacto y pie de página'};summary.textContent=names[target.group]||'Otros textos';details.append(summary);container.append(details);groups.set(target.group,details)}const label=document.createElement('label');label.textContent=target.original.trim().slice(0,70);const input=document.createElement('textarea');input.rows=2;input.value=target.node.textContent;input.dataset.textIndex=index;label.append(input);groups.get(target.group).append(label)});}
function enterSettings(e){
 if(e)e.preventDefault();
 const pass=root.querySelector('#gp-settings-password').value.trim();
 if(pass!=='2024'){root.querySelector('#gp-login-feedback').textContent='Clave incorrecta. Usa 2024 en esta vista previa.';return}
 if(!cloudReady){root.querySelector('#gp-login-feedback').textContent='La configuración todavía no se ha conectado a Firebase. Espera unos segundos y vuelve a entrar.';return}
 settingsUnlocked=true;
 root.querySelector('#gp-login-feedback').textContent='';
 root.querySelector('#gp-settings-password').value='';
 fillSettingsForm();loginPanel.hidden=true;siteSettings.hidden=false;go('gp-site-settings');
}
root.querySelector('#gp-settings-enter').addEventListener('click',enterSettings);
root.querySelector('#gp-settings-login-form').addEventListener('submit',enterSettings);
root.querySelector('#gp-settings-password').addEventListener('keydown',e=>{if(e.key==='Enter')enterSettings(e)});
root.querySelector('#gp-settings-cancel').addEventListener('click',()=>loginPanel.hidden=true);
root.querySelector('#gp-settings-logout').addEventListener('click',()=>{settingsUnlocked=false;siteSettings.hidden=true;campaignAdmin.hidden=true});
root.querySelector('#gp-settings-campaign').addEventListener('click',()=>{if(!settingsUnlocked)return;campaignAdmin.hidden=false;go('gp-campaign-admin')});
const formatSelect=root.querySelector('#gp-format');formatSelect.replaceChildren();PREVIEW_FORMATS.forEach(f=>{const option=document.createElement('option');option.value=f.id;option.textContent=f.label;formatSelect.append(option)});formatSelect.value='A4_1c';
let galleryDraft=Array.from(root.querySelectorAll('.gp-work')).map(e=>({title:e.querySelector('h3').textContent,description:'',image:'',category:e.dataset.category}));
let faqDraft=[{question:'¿Qué formatos de archivo aceptan?',answer:'Recomendamos PDF para conservar el diseño. También puedes consultar por archivos JPG, PNG, Word y Excel.'},{question:'¿Realizan envíos?',answer:'Realizamos delivery en Huánuco y coordinamos envíos a otras ciudades por agencia de transporte.'},{question:'¿Dónde están ubicados?',answer:'Consulta nuestra ubicación y cómo llegar en el apartado de Google Maps.'}];
let quotePrices={};
const field=(labelText,value,kind='text')=>{const label=document.createElement('label');label.textContent=labelText;const input=document.createElement(kind==='textarea'?'textarea':'input');if(kind!=='textarea')input.type=kind;input.value=value||'';label.append(input);return {label,input}};
function renderGalleryEditor(){const list=root.querySelector('#gp-gallery-editor');list.replaceChildren();galleryDraft.forEach((item,index)=>{const row=document.createElement('div');row.className='gp-edit-row';[['title','Título','text'],['image','Enlace directo de imagen (https://…)','url'],['description','Descripción','textarea'],['category','Categoría','text']].forEach(([key,label,kind])=>{const f=field(label,item[key],kind);f.input.addEventListener('input',()=>item[key]=f.input.value);row.append(f.label)});const remove=document.createElement('button');remove.type='button';remove.className='gp-button secondary';remove.textContent='Quitar imagen';remove.addEventListener('click',()=>{galleryDraft.splice(index,1);renderGalleryEditor()});row.append(remove);list.append(row)})}
function renderFaqEditor(){const list=root.querySelector('#gp-faq-editor');list.replaceChildren();faqDraft.forEach((item,index)=>{const row=document.createElement('div');row.className='gp-edit-row';[['question','Pregunta','text'],['answer','Respuesta','textarea']].forEach(([key,label,kind])=>{const f=field(label,item[key],kind);f.input.addEventListener('input',()=>item[key]=f.input.value);row.append(f.label)});const remove=document.createElement('button');remove.type='button';remove.className='gp-button secondary';remove.textContent='Quitar pregunta';remove.addEventListener('click',()=>{faqDraft.splice(index,1);renderFaqEditor()});row.append(remove);list.append(row)})}
function renderFaqContent(){const list=root.querySelector('#gp-faq-list');list.replaceChildren();faqDraft.filter(i=>i.question.trim()).forEach(item=>{const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent=item.question;const p=document.createElement('p');p.textContent=item.answer;details.append(summary,p);list.append(details)})}
function renderGalleryContent(){const grid=root.querySelector('.gp-gallery-grid');grid.replaceChildren();galleryDraft.filter(i=>i.title.trim()).forEach((item,index)=>{const card=document.createElement('article');card.className='gp-work';card.dataset.category=item.category||'Otros';card.dataset.search=item.title+' '+item.description;card.id='gp-work-custom-'+index;const placeholder=document.createElement('div');placeholder.className='gp-image-fallback';placeholder.textContent=item.image?'No se pudo cargar esta imagen.':'Añade el enlace de la foto en Configuración.';placeholder.hidden=!!item.image;card.append(placeholder);if(item.image){const img=document.createElement('img');img.src=item.image;img.alt=item.title;img.className='gp-gallery-photo';img.loading='lazy';img.addEventListener('error',()=>{img.hidden=true;placeholder.hidden=false});card.prepend(img)}const caption=document.createElement('div');caption.className='gp-work-caption';const category=document.createElement('span');category.textContent=item.category;const title=document.createElement('h3');title.textContent=item.title;const description=document.createElement('p');description.textContent=item.description;description.className='gp-subtitle';caption.append(category,title,description);card.append(caption);grid.append(card)});searchEntries.splice(0,searchEntries.length,...searchEntries.filter(e=>e.type!=='Galería de trabajos'));root.querySelectorAll('.gp-work').forEach(e=>searchEntries.push({title:e.querySelector('h3').textContent,type:'Galería de trabajos',terms:e.dataset.search,target:e.id,image:e.querySelector('img')?.src||''}));}
function renderRateEditor(){const host=root.querySelector('#gp-rates-editor');host.replaceChildren();['menor','mayor'].forEach(tariff=>{const group=document.createElement('details');group.className='gp-rate-group';const summary=document.createElement('summary');summary.textContent='Tarifas por '+tariff;group.append(summary);PREVIEW_FORMATS.forEach(format=>{const row=document.createElement('div');row.className='gp-rate-row';const name=document.createElement('strong');name.textContent=format.label;row.append(name);[['color','Color (S/)'],['bn','Blanco y negro (S/)']].forEach(([color,label])=>{const key=format.id+'_'+color+'_'+tariff;const f=field(label,quotePrices[key]??'','number');f.input.min='0';f.input.step='0.01';f.input.placeholder='Por confirmar';f.input.value=quotePrices[key]??'';f.input.dataset.rateKey=key;row.append(f.label)});group.append(row)});host.append(group)});const extras=document.createElement('div');extras.className='gp-campaign-fields';Object.entries({anillado_1:'Anillado · 1–100 hojas / tomo',anillado_2:'Anillado · 101–200 hojas / tomo',anillado_3:'Anillado · 201–300 hojas / tomo',anillado_4:'Anillado · 301–350 hojas / tomo',laminate:'Plastificado · S/ por ejemplar',binding:'Empastado · S/ por ejemplar',cut:'Corte · S/ por ejemplar',design:'Diseño · S/ por pedido',urgent:'Urgencia · porcentaje'}).forEach(([key,label])=>{const f=field(label,quotePrices[key]??'','number');f.input.min='0';f.input.step='0.01';f.input.value=quotePrices[key]??'';f.input.dataset.rateKey=key;extras.append(f.label)});host.append(extras)}
root.querySelector('#gp-gallery-add').addEventListener('click',()=>{galleryDraft.push({title:'',image:'',description:'',category:'Publicidad'});renderGalleryEditor()});
root.querySelector('#gp-faq-add').addEventListener('click',()=>{faqDraft.push({question:'',answer:''});renderFaqEditor()});
renderFaqContent();renderGalleryEditor();renderFaqEditor();renderRateEditor();

let cloudConfig={},cloudReady=false,settingsRef=null,siteDb=null,siteAuth=null,inventoryItems=[],cart=[];
let lastQuote=null;
function cloudStatus(text,state){root.querySelector('#gp-cloud-status').textContent=text;root.querySelector('#gp-cloud-panel').dataset.state=state}
function saveStatus(text){root.querySelector('#gp-save-status').textContent=text}
function describeSaveError(error){if(error.code==='permission-denied')return 'Firebase rechazó el guardado por falta de permisos (permission-denied). Revisa las reglas de Firestore del proyecto pagina-web-grafiplot-oficial.';if(error.code==='unavailable')return 'No hay conexión con el servidor de Firebase. Vuelve a intentarlo cuando tengas internet.';return error.message||error.code||'Error desconocido'}

const money=n=>'S/ '+Number(n).toFixed(2);
const feedback=(text,error=false)=>{const node=root.querySelector('#gp-settings-feedback');node.textContent=text;node.setAttribute('role',error?'alert':'status')};
const httpsLink=(value,optional=true)=>{const text=String(value||'').trim();if(!text&&optional)return '';const url=new URL(text);if(url.protocol!=='https:')throw Error('Usa enlaces que comiencen con https://.');return url.href};
function configuredPhone(){return String(cloudConfig.contactPhone||'51952628844').replace(/\D/g,'')}
function whatsapp(message){window.open('https://wa.me/'+configuredPhone()+'?text='+encodeURIComponent(message),'_blank','noopener,noreferrer')}
function applyCampaign(config){
 const active=config.campaignEnabled===true;
 campaignActive.checked=active;campaignType.value=config.campaignType||'sorteo';
 const values={'#gp-campaign-heading':config.campaignTitle||'¡Participa y gana con Grafiplot!','#gp-campaign-copy':config.campaignDescription||'','#gp-campaign-button-text':config.campaignButton||'Inscribirme al sorteo','#gp-campaign-url':config.campaignUrl||''};
 Object.entries(values).forEach(([selector,value])=>root.querySelector(selector).value=value);
 let link='';try{link=httpsLink(config.campaignUrl)}catch(_){}
 campaignBanner.hidden=!active||!link;
 root.querySelector('#gp-campaign-title').textContent=values['#gp-campaign-heading'];root.querySelector('#gp-campaign-description').textContent=values['#gp-campaign-copy'];
 root.querySelector('#gp-campaign-tag').textContent=campaignType.value==='promo'?'OFERTA ESPECIAL':'SORTEO ESPECIAL';
 const cta=root.querySelector('#gp-campaign-link');cta.textContent=values['#gp-campaign-button-text']+' ↗';if(link)cta.href=link;
 root.querySelector('#gp-campaign-state').textContent=active?'Campaña activa':'Campaña desactivada';
}
function applyServiceImages(images={}){
 root.querySelectorAll('.gp-service[data-service-key]').forEach(card=>{let image='';try{image=httpsLink(images[card.dataset.serviceKey])}catch(_){}card.style.backgroundImage=image?'url('+JSON.stringify(image)+')':'none';card.dataset.hasImage=String(!!image);});
}
function renderServiceImagesEditor(){const editor=root.querySelector('#gp-service-images-editor');editor.replaceChildren();root.querySelectorAll('.gp-service[data-service-key]').forEach(card=>{const f=field(card.dataset.service,cloudConfig.serviceImages?.[card.dataset.serviceKey]||'','url');f.input.dataset.serviceImage=card.dataset.serviceKey;f.input.placeholder='https://…';editor.append(f.label)});}
function loadCloudConfig(data){
 cloudConfig=data||{};
 if(!siteSettings.hidden||!campaignAdmin.hidden)return;
 applyPreviewConfig(cloudConfig.designConfig||{});
 quotePrices=cloudConfig.autoPrices&&typeof cloudConfig.autoPrices==='object'?cloudConfig.autoPrices:{};
 galleryDraft=Array.isArray(cloudConfig.galleryItems)?cloudConfig.galleryItems:[];
 if(Array.isArray(cloudConfig.faqContent))faqDraft=cloudConfig.faqContent.filter(f=>f&&typeof f==='object').map(f=>({question:String(f.question??f.q??''),answer:String(f.answer??f.a??'')}));
 if(cloudConfig.logoUrl){try{root.querySelector('.gp-logo').src=httpsLink(cloudConfig.logoUrl,false)}catch(_){}}
 root.querySelector('#gp-settings-logo').value=cloudConfig.logoUrl||'https://i.postimg.cc/hGWtyqVD/Imagen-de-Chat-GPT-1-oct-2026-23-16-58.png';
 root.querySelector('#gp-settings-phone').value=configuredPhone();
 root.querySelector('#gp-settings-email').value=cloudConfig.contactEmail||'';
 root.querySelector('#gp-settings-route-bg').value=cloudConfig.routeBackgroundUrl||'https://www.grafiplotvasquez.com/local.jpeg';
 const route=root.querySelector('.gp-route-card');try{const image=httpsLink(cloudConfig.routeBackgroundUrl)||'./local.jpeg';route.style.backgroundImage='url('+JSON.stringify(image)+')'}catch(_){route.style.backgroundImage='none'}

 applyServiceImages(cloudConfig.serviceImages);renderServiceImagesEditor();root.querySelector('[data-service-key=anillados] h3').textContent='Anillados y espiralados';
 renderGalleryContent();renderFaqContent();renderGalleryEditor();renderFaqEditor();renderRateEditor();applyCampaign(cloudConfig);update();
 root.querySelector('.gp-gallery-notice').textContent=galleryDraft.length?'':'Nos estamos preparando para compartir nuestros trabajos. Consulta por WhatsApp.';
 if(cloudConfig.seoTitle)document.title=cloudConfig.seoTitle;
}
async function saveSiteSettings(e){
 e.preventDefault();if(!settingsUnlocked)return;
 if(!cloudReady||!settingsRef){feedback('No hay conexión con Firebase. Tus cambios no se han guardado; inténtalo de nuevo.',true);return}
 const buttons=root.querySelectorAll('#gp-settings-editor button[type="submit"]');buttons.forEach(b=>b.disabled=true);
 try{
 const texts={};root.querySelectorAll('[data-text-index]').forEach(input=>texts[input.dataset.textIndex]=input.value);
 const designConfig={texts,theme:'dark',brand:root.querySelector('#gp-settings-brand').value,map:httpsLink(root.querySelector('#gp-settings-map').value,false)};
 const galleryItems=galleryDraft.map(item=>({title:String(item.title||'').trim(),description:String(item.description||''),category:String(item.category||'Otros'),image:httpsLink(item.image)})).filter(item=>item.title||item.image||item.description);
 if(galleryItems.some(item=>!item.title))throw Error('Cada imagen de galería necesita un título.');
 if(galleryItems.length>100)throw Error('Añade como máximo 100 trabajos a la galería.');
 const autoPrices={};root.querySelectorAll('[data-rate-key]').forEach(input=>{if(input.value==='')return;const n=Number(input.value);if(!Number.isFinite(n)||n<0)throw Error('Revisa las tarifas: usa números mayores o iguales a cero.');autoPrices[input.dataset.rateKey]=n});
 const faqContent=faqDraft.filter(item=>item.question.trim()).map(item=>({question:item.question.trim(),answer:item.answer}));
 const serviceImages={};root.querySelectorAll('[data-service-image]').forEach(input=>serviceImages[input.dataset.serviceImage]=httpsLink(input.value));
 const patch={designConfig,galleryItems,faqContent,autoPrices,serviceImages,routeBackgroundUrl:httpsLink(root.querySelector('#gp-settings-route-bg').value),logoUrl:httpsLink(root.querySelector('#gp-settings-logo').value,false),contactPhone:root.querySelector('#gp-settings-phone').value.replace(/\D/g,''),contactEmail:root.querySelector('#gp-settings-email').value.trim(),mapLink:designConfig.map,defaultTheme:'dark'};
 if(!patch.contactPhone)throw Error('Escribe el número de WhatsApp con el código de país.');
 feedback('Guardando cambios en Firebase…');saveStatus('Guardado pendiente de confirmación del servidor.');
 const waitNotice=setTimeout(()=>{feedback('Firebase aún no confirma el guardado. Revisa tu conexión; los cambios siguen pendientes.',true);saveStatus('Sin confirmación del servidor.');},12000);
 try{await setDoc(settingsRef,patch,{mergeFields:Object.keys(patch)});}finally{clearTimeout(waitNotice)}
 saveStatus('Último guardado confirmado: '+new Date().toLocaleTimeString('es-PE')+'.');
 const image=patch.routeBackgroundUrl||'./local.jpeg';root.querySelector('.gp-route-card').style.backgroundImage='url('+JSON.stringify(image)+')';
 cloudConfig={...cloudConfig,...patch};applyPreviewConfig(designConfig);applyServiceImages(serviceImages);quotePrices=autoPrices;galleryDraft=galleryItems;faqDraft=faqContent;
 root.querySelector('.gp-logo').src=patch.logoUrl;renderGalleryContent();renderFaqContent();update();feedback('Cambios guardados en Firebase. Se recuperarán al abrir de nuevo la página.');
 }catch(error){feedback('No se pudo guardar: '+describeSaveError(error),true);saveStatus('Error de guardado: '+(error.code||'revisa los campos')+'.')}finally{buttons.forEach(b=>b.disabled=false)}
}
async function saveCampaign(e,disable=false){
 if(e)e.preventDefault();if(!settingsUnlocked)return;
 if(!cloudReady){campaignFeedback.textContent='No hay conexión con Firebase. La campaña no se ha guardado.';return}
 const button=root.querySelector('#gp-campaign-form button[type="submit"]');button.disabled=true;
 try{
 const enabled=!disable&&campaignActive.checked;const url=httpsLink(root.querySelector('#gp-campaign-url').value,!enabled);
 const title=root.querySelector('#gp-campaign-heading').value.trim();const text=root.querySelector('#gp-campaign-button-text').value.trim();
 if(enabled&&(!title||!text))throw Error('Completa el título y el texto del botón.');
 const patch={campaignEnabled:enabled,campaignType:campaignType.value,campaignTitle:title,campaignDescription:root.querySelector('#gp-campaign-copy').value,campaignButton:text,campaignUrl:url};
 await setDoc(settingsRef,patch,{merge:true});cloudConfig={...cloudConfig,...patch};applyCampaign(cloudConfig);campaignFeedback.textContent=enabled?'Campaña activada y guardada en Firebase.':'Campaña desactivada y guardada en Firebase.';if(enabled)go('gp-campaign-banner');
 }catch(error){campaignFeedback.textContent='No se pudo guardar la campaña: '+error.message}finally{button.disabled=false}
}
function renderCatalog(){
 const grid=root.querySelector('.gp-products');grid.replaceChildren();
 searchEntries.splice(0,searchEntries.length,...searchEntries.filter(e=>e.type!=='Producto'));
 const display=inventoryItems.slice().sort((a,b)=>Number(b.isPriority)-Number(a.isPriority)||b.createdAt-a.createdAt);
 display.forEach((item,index)=>{
 const card=document.createElement('article');card.className='gp-product';card.id='gp-product-'+index;
 if(item.image){const img=document.createElement('img');img.src=item.image;img.alt=item.name;img.loading='lazy';img.className='gp-catalog-image';img.addEventListener('error',()=>img.hidden=true);card.append(img)}
 const name=document.createElement('h3');name.textContent=item.name;const description=document.createElement('p');description.textContent=item.description;
 const price=document.createElement('strong');price.textContent=money(item.price);price.className='gp-product-price';
 const bulk=document.createElement('p');bulk.textContent='Por mayor: '+money(item.bulkPrice);
 const stock=document.createElement('p');stock.textContent=item.isService?'Servicio · consultar disponibilidad':item.stock>0?'En stock: '+item.stock+' '+item.measureUnit:'Sin stock';
 const actions=document.createElement('div');actions.className='gp-product-actions';const consult=document.createElement('button');consult.type='button';consult.className='gp-button secondary';consult.textContent='Consultar';consult.addEventListener('click',()=>whatsapp('Hola Grafiplot, deseo consultar por '+item.name+'. Precio de referencia: '+money(item.price)));
 actions.append(consult);
 if(item.isService||item.stock>0){const add=document.createElement('button');add.type='button';add.className='gp-button';add.textContent='Añadir al carrito';add.addEventListener('click',()=>{const existing=cart.find(i=>i.id===item.id);if(existing){existing.quantity=Math.min(existing.quantity+1,item.isService?10000:item.stock)}else cart.push({...item,quantity:1});renderCart();root.querySelector('#gp-cart-notice').textContent=item.name+' añadido al carrito.'});actions.append(add)}
 card.append(name,description,price,bulk,stock,actions);grid.append(card);searchEntries.push({title:item.name,type:'Producto',terms:item.name+' '+item.description,target:card.id,image:item.image,price:item.price});
 });
 const status=root.querySelector('#gp-catalog-status');status.textContent=inventoryItems.length?inventoryItems.length+' productos y servicios en el catálogo.':'No hay productos disponibles por el momento.';
 const notice=root.querySelector('#gp-catalog-note');notice.textContent='Consulta disponibilidad y condiciones de los precios por mayor.';
 renderCart();if(searchInput.value.trim())search();
}
function updateCartSummary(){root.querySelector('#gp-cart-count').textContent=cart.reduce((sum,item)=>sum+item.quantity,0);root.querySelector('#gp-cart-total').textContent=money(cart.reduce((sum,item)=>sum+item.price*item.quantity,0));}
function renderCart(){
 const section=root.querySelector('#gp-cart');section.hidden=false;const list=root.querySelector('#gp-cart-items');list.replaceChildren();
 cart=cart.filter(item=>{const latest=inventoryItems.find(p=>p.id===item.id);if(!latest||(!latest.isService&&latest.stock<=0))return false;Object.assign(item,{stock:latest.stock,price:latest.price,isService:latest.isService,quantity:Math.min(item.quantity,latest.isService?10000:latest.stock)});return true});
 root.querySelector('#gp-cart-count').textContent=cart.reduce((total,item)=>total+item.quantity,0);
 root.querySelector('#gp-cart-empty').hidden=!!cart.length;root.querySelector('#gp-cart-send').disabled=!cart.length;
 cart.forEach(item=>{const row=document.createElement('div');row.className='gp-cart-row';const label=document.createElement('span');label.textContent=item.name+' · '+money(item.price)+' c/u';const input=document.createElement('input');input.type='number';input.min='1';input.max=String(item.isService?10000:item.stock);input.value=item.quantity;input.setAttribute('aria-label','Cantidad de '+item.name);input.addEventListener('input',()=>{const n=Number(input.value);if(!Number.isFinite(n)||n<1)return;const max=item.isService?10000:item.stock;item.quantity=Math.min(max,Math.max(1,Math.trunc(n)));if(n>max)input.value=max;updateCartSummary()});input.addEventListener('change',()=>{item.quantity=Math.min(item.isService?10000:item.stock,Math.max(1,Math.trunc(Number(input.value)||1)));renderCart()});const remove=document.createElement('button');remove.type='button';remove.className='gp-button secondary';remove.textContent='Quitar';remove.addEventListener('click',()=>{cart=cart.filter(c=>c.id!==item.id);renderCart()});row.append(label,input,remove);list.append(row)});
 root.querySelector('#gp-cart-total').textContent=money(cart.reduce((sum,item)=>sum+item.price*item.quantity,0));
}
root.querySelector('#gp-cart-send').addEventListener('click',()=>{if(!cart.length)return;renderCart();if(!cart.length)return;whatsapp('Hola Grafiplot, deseo realizar este pedido:\n'+cart.map(item=>item.quantity+' × '+item.name+' · '+money(item.price*item.quantity)).join('\n')+'\nTotal de referencia: '+root.querySelector('#gp-cart-total').textContent+'\nPor favor confirmar disponibilidad y entrega.');});
root.querySelector('#gp-send').addEventListener('click',()=>{
 update();const result=lastQuote;if(!result)return;
 const message='Hola Grafiplot, solicito una cotización:\n'+result.pages+' páginas × '+result.copies+' ejemplares\n'+result.format.label+' · '+root.querySelector('#gp-color').selectedOptions[0].textContent+'\n'+result.sheets+' hojas en total\n'+result.lines.map(l=>l.label+': '+(l.amount===null?'Por confirmar':money(l.amount))).join('\n')+'\nTotal estimado: '+(result.ready?money(result.total):'Por confirmar');whatsapp(message);
});
root.querySelector('#gp-more').addEventListener('click',()=>{go('gp-catalog');root.querySelector('#gp-catalog-status').textContent=inventoryItems.length+' productos y servicios. Usa el buscador para encontrar el que necesitas.'});
root.querySelector('#gp-settings-editor').addEventListener('submit',saveSiteSettings);
root.querySelector('#gp-settings-editor').addEventListener('invalid',e=>{let parent=e.target.parentElement;while(parent&&parent!==root){if(parent.tagName==='DETAILS')parent.open=true;parent=parent.parentElement}feedback('Revisa el campo «'+(e.target.closest('label')?.firstChild?.textContent||'Configuración')+'»: '+e.target.validationMessage,true);e.target.scrollIntoView({block:'center'});},true);
root.querySelector('#gp-campaign-form').addEventListener('submit',saveCampaign);
root.querySelector('#gp-campaign-disable').addEventListener('click',e=>saveCampaign(e,true));
async function connectSite(){
 try{
 const {initializeApp,getAuth,signInAnonymously,getFirestore,doc,onSnapshot,collection}=await loadFirebase();
 const app=initializeApp(USER_FIREBASE_CONFIG);siteAuth=getAuth(app);siteDb=getFirestore(app);await signInAnonymously(siteAuth);
 settingsRef=doc(siteDb,'artifacts','grafiplot-tienda-v4','public','data','settings','config');
 onSnapshot(settingsRef,{includeMetadataChanges:true},snapshot=>{cloudReady=!snapshot.metadata.fromCache;loadCloudConfig(snapshot.exists()?snapshot.data():{});cloudStatus(cloudReady?'Conectado · configuración recibida del servidor.':'Sin conexión confirmada · mostrando datos en caché.',cloudReady?'connected':'connecting')},error=>{cloudReady=false;cloudStatus('Error de lectura: '+error.code,'error')});
 onSnapshot(collection(siteDb,'artifacts','grafiplot-tienda-v4','public','data','faqs'),snapshot=>{if(!Array.isArray(cloudConfig.faqContent)&&siteSettings.hidden){const faqs=snapshot.docs.map(d=>d.data()).filter(f=>f&&typeof f==='object').map(f=>({question:String(f.question??f.q??''),answer:String(f.answer??f.a??'')})).filter(f=>f.question.trim());if(faqs.length){faqDraft=faqs;renderFaqContent();renderFaqEditor()}}});
 }catch(error){cloudReady=false;cloudStatus('Firebase no está disponible: '+error.code,'error')}
}
async function connectInventory(){
 try{
 const {initializeApp,getAuth,signInAnonymously,getFirestore,doc,onSnapshot,collection}=await loadFirebase();
 const app=initializeApp(INVENTORY_FIREBASE_CONFIG,'grafiplot-inventory-reader');await signInAnonymously(getAuth(app));
 onSnapshot(collection(getFirestore(app),'inventory'),{includeMetadataChanges:true},snapshot=>{
 inventoryItems=snapshot.docs.map(normalizeInventoryProduct);renderCatalog();if(snapshot.metadata.fromCache)root.querySelector('#gp-catalog-status').textContent='Inventario sin conexión confirmada. Consulta disponibilidad por WhatsApp.';
 },error=>root.querySelector('#gp-catalog-status').textContent='No se pudo cargar el inventario. Consulta disponibilidad por WhatsApp.');
 }catch(error){root.querySelector('#gp-catalog-status').textContent='No se pudo conectar al inventario. Consulta por WhatsApp.'}
}
galleryDraft=[];renderGalleryContent();renderCatalog();connectSite();connectInventory();

update();if(window.lucide)window.lucide.createIcons();else window.addEventListener('load',()=>window.lucide?.createIcons(),{once:true});})();
