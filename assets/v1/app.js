import {initLibrary} from './library.mjs?v=library1';
import {createSettingsAuth,settingsAuthError} from './settings-auth.mjs?v=owner-20261105';
import {USER_FIREBASE_CONFIG,INVENTORY_FIREBASE_CONFIG,normalizeInventoryProduct} from './config.js';
import {PREVIEW_FORMATS,calculatePreviewQuote} from './cotizador.js?v=visual1';
import {updateBotContext} from './grafibot-context.js?v=visual1';
let firebaseSdkPromise;const loadFirebase=()=>firebaseSdkPromise||(firebaseSdkPromise=import('./firebase.js?v=email-settings-20261005'));
const setDoc=async(...args)=>(await loadFirebase()).setDoc(...args);
(()=>{const root=document.getElementById('grafiplot-preview');const cartDialog=root.querySelector('#gp-cart-dialog');
const library=initLibrary(root);library.load();
function openCart(){renderCart();if(!cartDialog.open)cartDialog.showModal();document.body.classList.add('gp-cart-open');root.querySelector('#gp-cart-nav').setAttribute('aria-expanded','true')}
function closeCart(){cartDialog.close()}
root.querySelector('#gp-cart-close').addEventListener('click',closeCart);
cartDialog.addEventListener('close',()=>{document.body.classList.remove('gp-cart-open');root.querySelector('#gp-cart-nav').setAttribute('aria-expanded','false')});
cartDialog.addEventListener('click',event=>{if(event.target!==cartDialog)return;const rect=cartDialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeCart()});
root.querySelector('#gp-cart-nav').setAttribute('aria-controls','gp-cart-dialog');root.querySelector('#gp-cart-nav').setAttribute('aria-haspopup','dialog');root.querySelector('#gp-cart-nav').setAttribute('aria-expanded','false');
const go=id=>{if(id==='gp-cart'){openCart();return}root.querySelector('#'+id).scrollIntoView({behavior:'smooth',block:'start'})};root.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));root.querySelectorAll('[data-service]').forEach(b=>b.addEventListener('click',()=>{root.querySelector('#gp-selected').textContent='Servicio seleccionado: '+b.dataset.service;go('gp-quote')}));        const update=()=>{
 const r=calculatePreviewQuote({pages:root.querySelector('#gp-pages').value,copies:root.querySelector('#gp-copies').value,format:root.querySelector('#gp-format').value,color:root.querySelector('#gp-color').value,tariff:root.querySelector('#gp-tariff').value,binding:root.querySelector('#gp-binding').checked,extra:root.querySelector('#gp-extra').value,design:root.querySelector('#gp-design').checked,urgent:root.querySelector('#gp-urgent').checked,spiral:'Negro'},quotePrices,cloudConfig.autoPriceRanges||{});
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
 if(element.closest('#gp-checkout,#gp-cart-send,#gp-cart-nav,.gp-ui-control,[data-service-key=universitarios]'))return;
 if(element.closest('#gp-campaign-admin,#gp-campaign-banner,#gp-settings-login,#gp-site-settings,#gp-faq')||element.id==='gp-campaign-open'||element.id==='gp-theme-toggle'||element.closest('#gp-theme-toggle'))return;
 Array.from(element.childNodes).forEach(node=>{if(node.nodeType===3&&node.textContent.trim()){settingsTargets.push({node,key:JSON.stringify([element.closest('[id]')?.id||'page',element.tagName,node.textContent.trim()]),original:node.textContent,group:element.closest('section')?.id||'Encabezado y pie'})}});
});
const previewStorage='grafiplot-config-preview-v1';
let storedPreview={};
function applyPreviewConfig(config){
 // Legacy numeric indexes are retained in storage, but cannot safely identify text after layout changes.
 const texts=config.textsByKey||{};settingsTargets.forEach(target=>{target.node.textContent=typeof texts[target.key]==='string'?texts[target.key]:target.original});
 root.dataset.appearance=window.gpTheme||'light';root.querySelector('#gp-settings-theme').value='dark';
 if(/^#[0-9a-f]{6}$/i.test(config.brand||'')){root.style.setProperty('--gp-red',config.brand);root.querySelector('#gp-settings-brand').value=config.brand}
 if(config.map){try{const url=new URL(config.map);if(url.protocol==='https:'){root.querySelector('.gp-route-card a').href=url.href;root.querySelector('#gp-settings-map').value=url.href}}catch(_){}}
}
if(storedPreview&&typeof storedPreview==='object')storedPreview.theme='dark';
if(!storedPreview||typeof storedPreview!=='object'||Array.isArray(storedPreview))storedPreview={};
try{applyPreviewConfig(storedPreview)}catch(_){}
function fillSettingsForm(){const container=root.querySelector('#gp-text-settings');container.replaceChildren();const groups=new Map();settingsTargets.forEach((target,index)=>{if(target.node.parentElement?.closest('.gp-work,.gp-product,.gp-service'))return;if(!groups.has(target.group)){const details=document.createElement('details');details.className='gp-settings-group';const summary=document.createElement('summary');const names={'gp-home':'Portada','gp-services':'Servicios','gp-quote':'Cotizador','gp-gallery':'Galería de trabajos','gp-catalog':'Catálogo','gp-location':'Ubicación','Encabezado y pie':'Menú, contacto y pie de página'};summary.textContent=names[target.group]||'Otros textos';details.append(summary);container.append(details);groups.set(target.group,details)}const label=document.createElement('label');label.textContent=target.original.trim().slice(0,70);const input=document.createElement('textarea');input.rows=2;input.value=target.node.textContent;input.dataset.textKey=target.key;label.append(input);groups.get(target.group).append(label)});}
let ownerAuth,ownerUser;
const ownerFeedback=text=>{root.querySelector('#gp-login-feedback').textContent=text;window.dispatchEvent(new window.CustomEvent('gp-owner-auth-feedback',{detail:text}));};
function ownerSession(allowed,user){
 settingsUnlocked=allowed;ownerUser=user;
 root.dataset.ownerAccess=allowed?'verified':'locked';
 window.dispatchEvent(new window.CustomEvent('gp-owner-session',{detail:allowed?user:null}));
 root.querySelector('#gp-settings-email-verification').hidden=!user||allowed;
 root.querySelector('#gp-settings-login-form').hidden=!!user;
 if(!allowed){siteSettings.hidden=true;campaignAdmin.hidden=true;}
 if(allowed&&!loginPanel.hidden){
  loginPanel.hidden=true;fillSettingsForm();siteSettings.hidden=false;
 }
 if(user&&!allowed)ownerFeedback('Confirma tu correo antes de editar la página.');
}
window.addEventListener('gp-owner-panel-ready',()=>ownerSession(settingsUnlocked,ownerUser));
async function verifyOwnerWrite(){
 try{
  if(!ownerAuth)throw Error('La conexión aún no está lista.');
  const user=await ownerAuth.assertOwner();
  ownerSession(true,user);
  return true;
 }catch(error){
  ownerSession(false,null);loginPanel.hidden=false;
  ownerFeedback(settingsAuthError(error));go('gp-settings-login');
  return false;
 }
}
async function enterOwnerSettings(event){
 event.preventDefault();
 if(!ownerAuth){ownerFeedback('La conexión aún no está lista.');return;}
 const button=root.querySelector('#gp-settings-enter');
 const password=root.querySelector('#gp-settings-owner-password');
 const form=root.querySelector('#gp-settings-login-form');
 button.disabled=true;button.textContent='Verificando acceso…';form.setAttribute('aria-busy','true');
 try{
  const user=await ownerAuth.login(root.querySelector('#gp-settings-owner-email').value,password.value);
  ownerSession(user.emailVerified===true,user);
  if(settingsUnlocked){
   fillSettingsForm();loginPanel.hidden=true;siteSettings.hidden=false;
   go('gp-site-settings');ownerFeedback('');
  }
 }catch(error){ownerFeedback(settingsAuthError(error))}
 finally{
  password.value='';button.disabled=false;button.textContent='Entrar a configuración';form.removeAttribute('aria-busy');
 }
}
root.querySelector('#gp-settings-login-form').addEventListener('submit',enterOwnerSettings);
root.querySelector('#gp-settings-send-verification').addEventListener('click',async()=>{const b=root.querySelector('#gp-settings-send-verification');b.disabled=true;try{await ownerAuth.sendVerification();ownerFeedback('Correo de verificación enviado. Revisa Recibidos y Spam, abre el enlace y pulsa Ya confirmé mi correo.');}catch(error){ownerFeedback(settingsAuthError(error));}finally{b.disabled=false;}});
root.querySelector('#gp-settings-check-verification').addEventListener('click',async()=>{try{const user=await ownerAuth.refresh();ownerSession(user.emailVerified===true,user);if(settingsUnlocked){fillSettingsForm();loginPanel.hidden=true;siteSettings.hidden=false;go('gp-site-settings');ownerFeedback('');}else ownerFeedback('Tu correo aún no está verificado. Abre el enlace recibido.');}catch(error){ownerFeedback(settingsAuthError(error));}});
root.querySelector('#gp-settings-reset').addEventListener('click',async()=>{const b=root.querySelector('#gp-settings-reset');b.disabled=true;try{if(!ownerAuth)throw Error('Firebase aún está conectando.');await ownerAuth.reset(root.querySelector('#gp-settings-owner-email').value);ownerFeedback('Solicitud aceptada. Si el correo tiene una cuenta, recibirás el enlace para restablecer la contraseña. Revisa también Spam.');}catch(error){ownerFeedback(settingsAuthError(error));}finally{b.disabled=false;}});
root.querySelector('#gp-settings-cancel').addEventListener('click',()=>{
 loginPanel.hidden=true;
 root.querySelector('#gp-settings-owner-password').value='';
 if(root.querySelector('#gp-settings-login-form').getAttribute('aria-busy')==='true')closeOwnerSession();
});
async function closeOwnerSession(){
 ownerSession(false,null);
 root.querySelector('#gp-settings-owner-password').value='';
 try{await ownerAuth?.logout();ownerFeedback('Sesión cerrada.')}
 catch(error){loginPanel.hidden=false;ownerFeedback('No se pudo completar el cierre de sesión. '+settingsAuthError(error))}
}
window.addEventListener('gp-owner-revalidate',async()=>{
 if(!settingsUnlocked)return;
 if(await verifyOwnerWrite())ownerFeedback('Cuenta del propietario verificada.');
});
root.querySelector('#gp-settings-logout').addEventListener('click',closeOwnerSession);
root.querySelector('#gp-settings-verification-logout').addEventListener('click',closeOwnerSession);
root.querySelector('#gp-settings-campaign').addEventListener('click',()=>{if(!settingsUnlocked)return;campaignAdmin.hidden=false;go('gp-campaign-admin')});
const formatSelect=root.querySelector('#gp-format');formatSelect.replaceChildren();PREVIEW_FORMATS.forEach(f=>{const option=document.createElement('option');option.value=f.id;option.textContent=f.label;formatSelect.append(option)});formatSelect.value='A4_1c';
let galleryDraft=Array.from(root.querySelectorAll('.gp-work')).map(e=>({title:e.querySelector('h3').textContent,description:'',image:'',category:e.dataset.category}));
let faqDraft=[{question:'¿Qué formatos de archivo aceptan?',answer:'Recomendamos PDF para conservar el diseño. También puedes consultar por archivos JPG, PNG, Word y Excel.'},{question:'¿Realizan envíos?',answer:'Realizamos delivery en Huánuco y coordinamos envíos a otras ciudades por agencia de transporte.'},{question:'¿Dónde están ubicados?',answer:'Consulta nuestra ubicación y cómo llegar en el apartado de Google Maps.'}];
let quotePrices={};
const field=(labelText,value,kind='text')=>{const label=document.createElement('label');label.textContent=labelText;const input=document.createElement(kind==='textarea'?'textarea':'input');if(kind!=='textarea')input.type=kind;input.value=value||'';label.append(input);return {label,input}};
function renderGalleryEditor(){const list=root.querySelector('#gp-gallery-editor');list.replaceChildren();galleryDraft.forEach((item,index)=>{const row=document.createElement('div');row.className='gp-edit-row';[['title','Título','text'],['image','Enlace directo de imagen (https://…)','url'],['description','Descripción','textarea'],['category','Categoría','text']].forEach(([key,label,kind])=>{const f=field(label,item[key],kind);f.input.addEventListener('input',()=>item[key]=f.input.value);row.append(f.label)});const remove=document.createElement('button');remove.type='button';remove.className='gp-button secondary';remove.textContent='Quitar imagen';remove.addEventListener('click',()=>{galleryDraft.splice(index,1);renderGalleryEditor()});row.append(remove);list.append(row)})}
function renderFaqEditor(){const list=root.querySelector('#gp-faq-editor');list.replaceChildren();faqDraft.forEach((item,index)=>{const row=document.createElement('div');row.className='gp-edit-row';[['question','Pregunta','text'],['answer','Respuesta','textarea']].forEach(([key,label,kind])=>{const f=field(label,item[key],kind);f.input.addEventListener('input',()=>item[key]=f.input.value);row.append(f.label)});const remove=document.createElement('button');remove.type='button';remove.className='gp-button secondary';remove.textContent='Quitar pregunta';remove.addEventListener('click',()=>{faqDraft.splice(index,1);renderFaqEditor()});row.append(remove);list.append(row)})}
function renderFaqContent(){const list=root.querySelector('#gp-faq-list');list.replaceChildren();faqDraft.filter(i=>i.question.trim()).forEach(item=>{const details=document.createElement('details');const summary=document.createElement('summary');summary.textContent=item.question;const p=document.createElement('p');p.textContent=item.answer;details.append(summary,p);list.append(details)})}
function renderGalleryContent(){const grid=root.querySelector('.gp-gallery-grid');grid.replaceChildren();(galleryDraft.length?galleryDraft:[{title:'Planos para tu proyecto',description:'Referencia visual de impresión de planos.',category:'Académicos',image:slotImage('examplePlans')},{title:'Presentación de tesis',description:'Referencia visual de anillados y acabados.',category:'Académicos',image:slotImage('exampleThesis')},{title:'Publicidad para tu negocio',description:'Referencia visual de tarjetas y material publicitario.',category:'Publicidad',image:slotImage('exampleCards')}]).filter(i=>i.title.trim()).forEach((item,index)=>{const card=document.createElement('article');card.className='gp-work';card.dataset.category=item.category||'Otros';card.dataset.search=item.title+' '+item.description;card.id='gp-work-custom-'+index;const placeholder=document.createElement('div');placeholder.className='gp-image-fallback';placeholder.textContent=item.image?'No se pudo cargar esta imagen.':'Sube una foto desde Configuración.';placeholder.hidden=!!item.image;card.append(placeholder);if(item.image){const img=document.createElement('img');img.src=item.image;img.alt=item.title;img.className='gp-gallery-photo';img.loading='lazy';img.addEventListener('error',()=>{img.hidden=true;placeholder.hidden=false});card.prepend(img)}const caption=document.createElement('div');caption.className='gp-work-caption';const category=document.createElement('span');category.textContent=item.category;const title=document.createElement('h3');title.textContent=item.title;const description=document.createElement('p');description.textContent=item.description;description.className='gp-subtitle';caption.append(category,title,description);const cta=document.createElement('button');cta.type='button';cta.className='gp-button';cta.textContent='Quiero uno así';cta.onclick=()=>whatsapp('Hola Grafiplot, quisiera cotizar: '+item.title);caption.append(cta);card.append(caption);grid.append(card)});searchEntries.splice(0,searchEntries.length,...searchEntries.filter(e=>e.type!=='Galería de trabajos'));root.querySelectorAll('.gp-work').forEach(e=>searchEntries.push({title:e.querySelector('h3').textContent,type:'Galería de trabajos',terms:e.dataset.search,target:e.id,image:e.querySelector('img')?.src||''}));}
function renderRateEditor(){const host=root.querySelector('#gp-rates-editor');host.replaceChildren();['menor','mayor'].forEach(tariff=>{const group=document.createElement('details');group.className='gp-rate-group';const summary=document.createElement('summary');summary.textContent='Tarifas por '+tariff;group.append(summary);PREVIEW_FORMATS.forEach(format=>{const row=document.createElement('div');row.className='gp-rate-row';const name=document.createElement('strong');name.textContent=format.label;row.append(name);[['color','Color (S/)'],['bn','Blanco y negro (S/)']].forEach(([color,label])=>{const key=format.id+'_'+color+'_'+tariff;const f=field(label,quotePrices[key]??'','number');f.input.min='0';f.input.step='0.01';f.input.placeholder='Por confirmar';f.input.value=quotePrices[key]??'';f.input.dataset.rateKey=key;row.append(f.label)});group.append(row)});host.append(group)});const extras=document.createElement('div');extras.className='gp-campaign-fields';Object.entries({anillado_1:'Anillado · 1–100 hojas / tomo',anillado_2:'Anillado · 101–200 hojas / tomo',anillado_3:'Anillado · 201–300 hojas / tomo',anillado_4:'Anillado · 301–350 hojas / tomo',laminate:'Plastificado · S/ por ejemplar',binding:'Empastado · S/ por ejemplar',cut:'Corte · S/ por ejemplar',design:'Diseño · S/ por pedido',urgent:'Urgencia · porcentaje'}).forEach(([key,label])=>{const f=field(label,quotePrices[key]??'','number');f.input.min='0';f.input.step='0.01';f.input.value=quotePrices[key]??'';f.input.dataset.rateKey=key;extras.append(f.label)});host.append(extras)}
root.querySelector('#gp-gallery-add').addEventListener('click',()=>{galleryDraft.push({title:'',image:'',description:'',category:'Publicidad'});renderGalleryEditor()});
root.querySelector('#gp-faq-add').addEventListener('click',()=>{faqDraft.push({question:'',answer:''});renderFaqEditor()});
renderFaqContent();renderGalleryEditor();renderFaqEditor();renderRateEditor();

let cloudConfig={},cloudReady=false,settingsRef=null,siteDb=null,siteAuth=null,inventoryItems=[],inventorySourceItems=[],siteProducts=[],cart=[];
function mergeSiteProducts(){inventoryItems=[...inventorySourceItems,...siteProducts.map(p=>({...p,isService:false,bulkPrice:p.price,measureUnit:'unidades',createdAt:0}))]}

let lastQuote=null;
function cloudStatus(text,state){root.querySelector('#gp-cloud-status').textContent=text;root.querySelector('#gp-cloud-panel').dataset.state=state}
function saveStatus(text){root.querySelector('#gp-save-status').textContent=text}
function describeSaveError(error){if(error.code==='permission-denied')return 'Firebase rechazó el guardado por falta de permisos (permission-denied). Revisa las reglas de Firestore del proyecto pagina-web-grafiplot-oficial.';if(error.code==='unavailable')return 'No hay conexión con el servidor de Firebase. Vuelve a intentarlo cuando tengas internet.';return error.message||error.code||'Error desconocido'}

const money=n=>'S/ '+Number(n).toFixed(2);
const feedback=(text,error=false)=>{const node=root.querySelector('#gp-settings-feedback');node.textContent=text;node.setAttribute('role',error?'alert':'status')};
const httpsLink=(value,optional=true)=>{const text=String(value||'').trim();if(!text&&optional)return '';const url=new URL(text);if(url.protocol!=='https:')throw Error('Usa enlaces que comiencen con https://.');return url.href};
function configuredPhone(){return '51916133647'}
function whatsapp(message){window.open('https://wa.me/'+configuredPhone()+'?text='+encodeURIComponent(message),'_blank','noopener,noreferrer')}
function applyCampaign(config){
 const active=config.campaignEnabled===true;
 campaignActive.checked=active;campaignType.value=config.campaignType||'sorteo';
 const values={'#gp-campaign-heading':config.campaignTitle||'¡Participa y gana con Grafiplot!','#gp-campaign-copy':config.campaignDescription||'','#gp-campaign-button-text':config.campaignButton||'Inscribirme al sorteo','#gp-campaign-url':config.campaignUrl||''};
 Object.entries(values).forEach(([selector,value])=>root.querySelector(selector).value=value);
 let link='';try{link=httpsLink(config.campaignUrl)}catch(_){}
 // La publicidad activa no requiere enlace de destino para mostrarse.
 campaignBanner.hidden=!active;
 root.querySelector('#gp-campaign-title').textContent=values['#gp-campaign-heading'];root.querySelector('#gp-campaign-description').textContent=values['#gp-campaign-copy'];
 root.querySelector('#gp-campaign-tag').textContent=campaignType.value==='promo'?'OFERTA ESPECIAL':'SORTEO ESPECIAL';
 const cta=root.querySelector('#gp-campaign-link');cta.textContent=values['#gp-campaign-button-text']+' ↗';cta.hidden=!link;if(link)cta.href=link;else cta.removeAttribute('href');
 root.querySelector('#gp-campaign-state').textContent=active?'Campaña activa':'Campaña desactivada';
 root.querySelector('#gp-campaign-extra').value=(Array.isArray(config.campaignSlides)?config.campaignSlides:[]).map(s=>[s.title||'',s.description||'',s.url||'',s.image||''].join(' | ')).join('\n');
 window.dispatchEvent(new CustomEvent('gp-campaign-change',{detail:config}));
}
function applyServiceImages(images={}){
 root.querySelectorAll('.gp-service[data-service-key]').forEach(card=>{let image='';try{image=httpsLink(images[card.dataset.serviceKey])}catch(_){}card.style.backgroundImage=image?'url('+JSON.stringify(image)+')':'none';card.dataset.hasImage=String(!!image);});
}
const defaultServiceImage='https://www.grafiplotvasquez.com/assets/v1/printing-hero.webp';
let servicesDraft=[];
const publicAssets='https://www.grafiplotvasquez.com/assets/v1/';
const imageSlots=[
 ['trackingRecibido','Delivery · Recibido','tracking-recibido.png'],
 ['trackingEnProceso','Delivery · En proceso','tracking-en-proceso.png'],
 ['trackingListo','Delivery · Listo','tracking-listo.png'],
 ['trackingEnCamino','Delivery · En camino','tracking-en-camino.png'],
 ['trackingEntregado','Delivery · Entregado','tracking-entregado.png'],
 ['campaign','Foto del anuncio de promoción','service-2.webp'],
 ['bot','Imagen de Grafibot','grafibot-wolf.png'],
 ['whatsapp','Icono de WhatsApp','whatsapp.svg'],
 ['favicon','Icono de la pestaña','/favicon.png'],
 ['examplePlans','Galería de referencia · planos','service-1.webp'],
 ['exampleThesis','Galería de referencia · tesis','service-2.webp'],
 ['exampleCards','Galería de referencia · publicidad','service-4.webp']
];
function slotImage(key){
 const path=imageSlots.find(slot=>slot[0]===key)[2];
 return cloudConfig.pageImages?.[key]||new URL(path,publicAssets).href;
}
function applyPageImages(){
 window.GrafiplotTracking?.setImages(cloudConfig.pageImages||{});
 const banner=root.querySelector('#gp-campaign-banner');
 banner.style.setProperty('--gp-promotion-photo','url('+JSON.stringify(slotImage('campaign'))+')');
 document.querySelectorAll('#gp-grafibot img').forEach(img=>img.src=slotImage('bot'));
 root.querySelector('.gp-header-whatsapp img').src=slotImage('whatsapp');
 const icon=document.querySelector('link[rel=icon]');if(icon)icon.href=slotImage('favicon');
}
function editPageImages(){
 let panel=root.querySelector('#gp-page-images');
 if(!panel){panel=document.createElement('details');panel.id='gp-page-images';panel.className='gp-settings-group';root.querySelector('#gp-settings-editor').append(panel)}
 panel.replaceChildren();const summary=document.createElement('summary');summary.textContent='Imágenes de la página';panel.append(summary);
 imageSlots.forEach(([key,label])=>{const f=field(label,slotImage(key),'url');f.input.dataset.imageSlot=key;panel.append(f.label)});
}
function showService(item,trigger){
 const dialog=root.querySelector('#gp-service-dialog');
 dialog.querySelector('h2').textContent=item.name;
 dialog.querySelector('.gp-service-description').textContent=item.description;
 const gallery=dialog.querySelector('.gp-service-gallery');gallery.replaceChildren();
 const sources=new Set([item.image||defaultServiceImage,...(item.photos||[])]);
 for(const [index,src] of [...sources].entries()){
  const img=document.createElement('img');img.src=src;img.alt=item.name+' · foto '+(index+1);img.loading=index?'lazy':'eager';
  img.onerror=()=>{const message=document.createElement('span');message.textContent='Foto no disponible';img.replaceWith(message)};gallery.append(img);
 }
 dialog.querySelector('.gp-service-contact').onclick=()=>whatsapp('Hola Grafiplot, deseo cotizar: '+item.name);
 dialog.querySelector('.gp-service-close').onclick=()=>dialog.close();
 dialog.onclick=event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()}};
 dialog.onclose=()=>{if(trigger.isConnected)trigger.focus()};
 dialog.showModal();
}
function renderServices(){
 const grid=root.querySelector('.gp-service-grid');grid.replaceChildren();
 searchEntries.splice(0,searchEntries.length,...searchEntries.filter(e=>e.type!=='Servicio'));
 servicesDraft.forEach((item,i)=>{const card=document.createElement('button');card.type='button';card.className='gp-service';card.id='gp-service-'+i;card.dataset.serviceKey=item.id;card.dataset.service=item.name;
 const title=document.createElement('h3');title.textContent=item.name;const description=document.createElement('p');description.textContent=item.description;const action=document.createElement('span');action.className='gp-link';action.textContent='Ver detalles y fotos →';card.append(title,description,action);
 const image=item.image||defaultServiceImage;const photo=document.createElement('img');photo.src=image;photo.alt=item.name;photo.loading='lazy';photo.className='gp-service-photo';photo.onerror=()=>{photo.onerror=null;photo.src=defaultServiceImage};card.prepend(photo);
 card.setAttribute('aria-haspopup','dialog');card.onclick=()=>showService(item,card);grid.append(card);searchEntries.push({title:item.name,type:'Servicio',terms:item.name+' '+item.description,target:card.id});});
 publishBotContext();
}
function renderServiceImagesEditor(){
 const editor=root.querySelector('#gp-service-images-editor');editor.replaceChildren();
 const previousHero=editor.dataset.heroDraft;const hero=field('Imagen de portada · enlace HTTPS',previousHero??(cloudConfig.heroImage||defaultServiceImage),'url');hero.input.oninput=()=>editor.dataset.heroDraft=hero.input.value;hero.input.id='gp-hero-image';editor.append(hero.label);
 servicesDraft.forEach((item,index)=>{const row=document.createElement('div');row.className='gp-edit-row';for(const [key,label]of [['name','Nombre del servicio'],['description','Descripción'],['image','Foto principal · enlace HTTPS']]){const f=field(label,item[key],key==='image'?'url':key==='description'?'textarea':'text');f.input.oninput=()=>item[key]=f.input.value;row.append(f.label);}const extraLabel=document.createElement('label');extraLabel.textContent='Fotos adicionales';const photos=document.createElement('textarea');photos.rows=3;photos.dataset.uploadPhotos='true';photos.value=(item.photos||[]).join('\n');photos.oninput=()=>item.photos=photos.value.split(/\r?\n/);extraLabel.append(photos);row.append(extraLabel);const remove=document.createElement('button');remove.type='button';remove.textContent='Eliminar servicio';remove.className='gp-button secondary';remove.onclick=()=>{servicesDraft.splice(index,1);renderServiceImagesEditor()};row.append(remove);editor.append(row)});
 const add=document.createElement('button');add.type='button';add.className='gp-button';add.textContent='Añadir servicio';add.onclick=()=>{servicesDraft.push({id:'service-'+Date.now(),name:'Nuevo servicio',description:'',image:defaultServiceImage});renderServiceImagesEditor()};editor.append(add);
}
const originalServices=Array.from(root.querySelectorAll('.gp-service')).map(card=>({id:card.dataset.serviceKey,name:card.querySelector('h3').textContent,description:card.querySelector('p').textContent,image:'https://www.grafiplotvasquez.com/assets/v1/service-'+({'impresiones':0,'planos':1,'anillados':2,'gigantografias':3,'tarjetas':4,'diseno':5,'universitarios':2}[card.dataset.serviceKey]??0)+'.webp'}));
function loadServices(){servicesDraft=Array.isArray(cloudConfig.services)?cloudConfig.services.map(s=>({...s})):originalServices.map(s=>({...s,image:cloudConfig.serviceImages?.[s.id]||s.image}));renderServices();const hero=root.querySelector('.gp-art');hero.replaceChildren();const img=document.createElement('img');img.src=cloudConfig.heroImage||defaultServiceImage;img.alt='Planos, impresiones y anillados de Grafiplot';img.style.cssText='width:100%;height:100%;object-fit:cover;border-radius:12px';hero.append(img);}
function applyOrderPages(links={}){root.querySelectorAll('[data-order-page]').forEach(button=>{let url='';try{url=httpsLink(links[button.dataset.orderPage])}catch(_){}button.disabled=!url;button.title=url?'Abrir página':'Página próximamente disponible';button.onclick=url?()=>{window.location.assign(url)}:null;});}
function loadCloudConfig(data){
 cloudConfig=data||{};
 if(!siteSettings.hidden||!campaignAdmin.hidden||root.dataset.visualSession==='true')return;
 siteProducts=Array.isArray(cloudConfig.siteProducts)?structuredClone(cloudConfig.siteProducts):[];mergeSiteProducts();
 applyPreviewConfig(cloudConfig.designConfig||{});
 library.load(cloudConfig.libraryLinks||'');
 quotePrices=cloudConfig.autoPrices&&typeof cloudConfig.autoPrices==='object'?cloudConfig.autoPrices:{};
 galleryDraft=Array.isArray(cloudConfig.galleryItems)?cloudConfig.galleryItems:[];
 if(Array.isArray(cloudConfig.faqContent))faqDraft=cloudConfig.faqContent.filter(f=>f&&typeof f==='object').map(f=>({question:String(f.question??f.q??''),answer:String(f.answer??f.a??'')}));
 if(cloudConfig.logoUrl){try{root.querySelector('.gp-logo').src=httpsLink(cloudConfig.logoUrl,false)}catch(_){}}
 root.querySelector('#gp-settings-logo').value=cloudConfig.logoUrl||'https://www.grafiplotvasquez.com/logo-grafiplot.webp';
 root.querySelector('#gp-settings-phone').value=configuredPhone();
 root.querySelector('#gp-settings-email').value=cloudConfig.contactEmail||'';
 root.querySelector('#gp-settings-sublimacion').value=cloudConfig.orderPages?.sublimacion||'';root.querySelector('#gp-settings-textil').value=cloudConfig.orderPages?.textil||'';applyOrderPages(cloudConfig.orderPages);
 root.querySelector('#gp-settings-route-bg').value=cloudConfig.routeBackgroundUrl||'https://www.grafiplotvasquez.com/local.jpeg';
 const route=root.querySelector('.gp-route-card');try{const image=httpsLink(cloudConfig.routeBackgroundUrl)||'./local.jpeg';route.style.backgroundImage='url('+JSON.stringify(image)+')'}catch(_){route.style.backgroundImage='none'}

 delete root.querySelector('#gp-service-images-editor').dataset.heroDraft;loadServices();renderServiceImagesEditor();applyPageImages();editPageImages();
 renderCatalog();renderGalleryContent();renderFaqContent();renderGalleryEditor();renderFaqEditor();renderRateEditor();applyCampaign(cloudConfig);update();
 root.querySelector('.gp-gallery-notice').textContent=galleryDraft.length?'':'Imágenes de referencia. Consulta los materiales y acabados disponibles por WhatsApp.';
 if(cloudConfig.seoTitle)document.title=cloudConfig.seoTitle;
 root.querySelector('#gp-ai-enabled').checked=cloudConfig.grafibotAI?.enabled===true;
 root.querySelector('#gp-ai-sitekey').value=cloudConfig.grafibotAI?.siteKey||'';
 publishBotContext();
 window.dispatchEvent(new window.CustomEvent('gp-config-loaded',{detail:cloudConfig}));
}
function publishBotContext(){updateBotContext(cloudConfig,{faqs:faqDraft,services:Array.from(root.querySelectorAll('.gp-service h3')).map(e=>e.textContent),location:root.querySelector('.gp-hero .gp-location').textContent.trim(),hours:root.querySelectorAll('.gp-detail-row')[1].textContent.trim()});}
root.querySelector('#gp-ai-test').addEventListener('click',async()=>{
 const button=root.querySelector('#gp-ai-test'),status=root.querySelector('#gp-ai-test-status');
 const siteKey=root.querySelector('#gp-ai-sitekey').value.trim();
 if(!/^[\w-]{20,200}$/.test(siteKey)||siteKey.startsWith('AIza')){status.textContent='Primero registra App Check e ingresa la clave pública de sitio reCAPTCHA Enterprise.';return;}
 button.disabled=true;status.textContent='Comprobando App Check y Gemini…';
 try{const {generateWithGemini}=await import('./grafibot-ai.js');const response=JSON.parse(await generateWithGemini('Devuelve únicamente {"intent":"greeting"}.',{enabled:true,siteKey,model:'gemini-2.5-flash-lite'}));if(response.intent!=='greeting')throw Error('invalid');status.textContent='Conexión comprobada. Puedes activar Gemini y guardar los cambios. Esta prueba consume una solicitud.';}
 catch{status.textContent='No se pudo conectar. Revisa AI Logic, Gemini Developer API, App Check, los dominios de reCAPTCHA y el cupo disponible. No se ha confirmado la activación.';}
 finally{button.disabled=false;}
});
async function saveSiteSettings(e){
 e.preventDefault();if(!settingsUnlocked)return;
 if(window.GrafiplotPage?.busy){feedback('Espera a que termine la subida de las imágenes.',true);return}
 if(!await verifyOwnerWrite())return;
 if(!cloudReady||!settingsRef){feedback('No hay conexión con Firebase. Tus cambios no se han guardado; inténtalo de nuevo.',true);return}
 const buttons=root.querySelectorAll('#gp-settings-editor button[type="submit"]');buttons.forEach(b=>b.disabled=true);
 try{
 const textsByKey={};root.querySelectorAll('[data-text-key]').forEach(input=>textsByKey[input.dataset.textKey]=input.value);
 const designConfig={...(cloudConfig.designConfig||{}),textsByKey,theme:window.gpTheme||'light',brand:root.querySelector('#gp-settings-brand').value,map:httpsLink(root.querySelector('#gp-settings-map').value,false)};
 const galleryItems=galleryDraft.map(item=>({title:String(item.title||'').trim(),description:String(item.description||''),category:String(item.category||'Otros'),image:httpsLink(item.image)})).filter(item=>item.title||item.image||item.description);
 if(galleryItems.some(item=>!item.title))throw Error('Cada imagen de galería necesita un título.');
 if(galleryItems.length>100)throw Error('Añade como máximo 100 trabajos a la galería.');
 const autoPrices={};root.querySelectorAll('[data-rate-key]').forEach(input=>{if(input.value==='')return;const n=Number(input.value);if(!Number.isFinite(n)||n<0)throw Error('Revisa las tarifas: usa números mayores o iguales a cero.');autoPrices[input.dataset.rateKey]=n});
 const faqContent=faqDraft.filter(item=>item.question.trim()).map(item=>({question:item.question.trim(),answer:item.answer}));
 const serviceImages={};root.querySelectorAll('[data-service-image]').forEach(input=>serviceImages[input.dataset.serviceImage]=httpsLink(input.value));
 const grafibotAI={enabled:root.querySelector('#gp-ai-enabled').checked,siteKey:root.querySelector('#gp-ai-sitekey').value.trim()};
 if(grafibotAI.siteKey.startsWith('AIza')||(grafibotAI.enabled&&!/^[\w-]{20,200}$/.test(grafibotAI.siteKey)))throw Error('Para activar IA, configura la clave pública de sitio reCAPTCHA Enterprise registrada en App Check. No uses una clave privada de Gemini.');
 const catalogTexts=JSON.parse(JSON.stringify(cloudConfig.catalogTexts||{}));root.querySelectorAll('[data-product-copy]').forEach(input=>{const id=input.dataset.productCopy;catalogTexts[id]||={};if(input.dataset.copyField==='image'&&!input.value.trim())delete catalogTexts[id].image;else catalogTexts[id][input.dataset.copyField]=input.dataset.copyField==='image'?httpsLink(input.value):input.value;});
 const services=servicesDraft.map(item=>({...item,name:item.name.trim(),image:httpsLink(item.image),photos:(item.photos||[]).map(v=>httpsLink(v)).filter(Boolean)}));if(services.some(item=>!item.name))throw Error("Escribe el nombre de cada servicio.");const heroImage=httpsLink(root.querySelector("#gp-hero-image").value);
 const pageImages={};root.querySelectorAll('[data-image-slot]').forEach(input=>pageImages[input.dataset.imageSlot]=httpsLink(input.value));
 const addonSettings={};for(const addon of Object.values(window.GrafiplotAddons||{}))Object.assign(addonSettings,addon.value());
 const patch={...addonSettings,libraryLinks:library.value(),pageImages,services,heroImage,catalogTexts,orderPages:{sublimacion:httpsLink(root.querySelector("#gp-settings-sublimacion").value),textil:httpsLink(root.querySelector("#gp-settings-textil").value)},designConfig,galleryItems,faqContent,autoPrices,serviceImages,routeBackgroundUrl:httpsLink(root.querySelector('#gp-settings-route-bg').value),logoUrl:httpsLink(root.querySelector('#gp-settings-logo').value,false),contactPhone:root.querySelector('#gp-settings-phone').value.replace(/\D/g,''),contactEmail:root.querySelector('#gp-settings-email').value.trim(),mapLink:designConfig.map,defaultTheme:'dark'};
 if(!patch.contactPhone)throw Error('Escribe el número de WhatsApp con el código de país.');
 patch.grafibotAI=grafibotAI;
 window.dispatchEvent(new window.CustomEvent('gp-owner-save',{detail:'saving'}));feedback('Guardando cambios en Firebase…');saveStatus('Guardado pendiente de confirmación del servidor.');
 const waitNotice=setTimeout(()=>{feedback('Firebase aún no confirma el guardado. Revisa tu conexión; los cambios siguen pendientes.',true);saveStatus('Sin confirmación del servidor.');},12000);
 try{await setDoc(settingsRef,patch,{mergeFields:Object.keys(patch)});}finally{clearTimeout(waitNotice)}
 window.dispatchEvent(new window.CustomEvent('gp-owner-save',{detail:'saved'}));saveStatus('Último guardado confirmado: '+new Date().toLocaleTimeString('es-PE')+'.');
 const image=patch.routeBackgroundUrl||'./local.jpeg';root.querySelector('.gp-route-card').style.backgroundImage='url('+JSON.stringify(image)+')';
 cloudConfig={...cloudConfig,...patch};library.load(patch.libraryLinks);applyOrderPages(patch.orderPages);applyPreviewConfig(designConfig);loadServices();applyPageImages();quotePrices=autoPrices;galleryDraft=galleryItems;faqDraft=faqContent;
 root.querySelector('.gp-logo').src=patch.logoUrl;renderCatalog();renderGalleryContent();renderFaqContent();update();feedback('Cambios guardados en Firebase. Se recuperarán al abrir de nuevo la página.');
 publishBotContext();
 }catch(error){window.dispatchEvent(new window.CustomEvent('gp-owner-save',{detail:'error'}));feedback('No se pudo guardar: '+describeSaveError(error),true);saveStatus('Error de guardado: '+(error.code||'revisa los campos')+'.')}finally{buttons.forEach(b=>b.disabled=false)}
}
async function saveCampaign(e,disable=false){
 if(e)e.preventDefault();if(!settingsUnlocked)return;
 if(!await verifyOwnerWrite())return;
 if(!cloudReady){campaignFeedback.textContent='No hay conexión con Firebase. La campaña no se ha guardado.';return}
 const button=root.querySelector('#gp-campaign-form button[type="submit"]');button.disabled=true;
 try{
 const enabled=!disable&&campaignActive.checked;const url=httpsLink(root.querySelector('#gp-campaign-url').value);
 const title=root.querySelector('#gp-campaign-heading').value.trim();const text=root.querySelector('#gp-campaign-button-text').value.trim();
 if(enabled&&(!title||!text))throw Error('Completa el título y el texto del botón.');
 const lines=root.querySelector('#gp-campaign-extra').value.split(/\r?\n/).map(v=>v.trim()).filter(Boolean);
 if(lines.length>9)throw Error('Máximo 9 anuncios adicionales.');
 const campaignSlides=lines.map((line,i)=>{
  const parts=line.split('|').map(v=>v.trim());
  if(parts.length<3||parts.length>4||!parts[0])throw Error('Revisa la línea '+(i+1)+'. Usa: título | descripción | enlace | imagen opcional');
  return {title:parts[0].slice(0,100),description:parts[1].slice(0,200),url:httpsLink(parts[2],false),image:httpsLink(parts[3]||'')};
 });
 const patch={campaignEnabled:enabled,campaignType:campaignType.value,campaignTitle:title,campaignDescription:root.querySelector('#gp-campaign-copy').value,campaignButton:text,campaignUrl:url,campaignSlides};
 await setDoc(settingsRef,patch,{merge:true});cloudConfig={...cloudConfig,...patch};applyCampaign(cloudConfig);campaignFeedback.textContent=enabled?'Campaña activada y guardada en Firebase.':'Campaña desactivada y guardada en Firebase.';if(enabled)go('gp-campaign-banner');
 }catch(error){campaignFeedback.textContent='No se pudo guardar la campaña: '+error.message}finally{button.disabled=false}
}
function renderCatalog(){
 let editor=root.querySelector('#gp-product-editor');
 if(!editor){editor=document.createElement('details');editor.id='gp-product-editor';editor.className='gp-settings-group';root.querySelector('#gp-settings-editor').append(editor);}
 if(!editor.contains(document.activeElement)){editor.replaceChildren();const summary=document.createElement('summary');summary.textContent='Productos · corregir nombres y descripciones';editor.append(summary);inventoryItems.forEach(item=>{for(const key of ['name','description','image']){const f=field(item.name+' · '+({name:'Nombre',description:'Descripción',image:'Imagen · enlace HTTPS'})[key],cloudConfig.catalogTexts?.[item.id]?.[key]??item[key]??'',key==='image'?'url':'text');f.input.dataset.productCopy=item.id;f.input.dataset.copyField=key;editor.append(f.label);}});}

 const grid=root.querySelector('.gp-products');grid.replaceChildren();
 searchEntries.splice(0,searchEntries.length,...searchEntries.filter(e=>e.type!=='Producto'));
 const display=inventoryItems.map(item=>({...item,...(cloudConfig.catalogTexts?.[item.id]||{})})).sort((a,b)=>Number(b.isPriority)-Number(a.isPriority)||b.createdAt-a.createdAt);
 display.forEach((item,index)=>{
 const card=document.createElement('article');card.className='gp-product';card.dataset.category=item.category||'Otros';card.id='gp-product-'+index;card.dataset.productId=item.id;
 if(item.image){const img=document.createElement('img');img.src=item.image;img.alt=item.name;img.loading='lazy';img.className='gp-catalog-image';img.addEventListener('error',()=>img.hidden=true);card.append(img)}else{const placeholder=document.createElement('div');placeholder.className='gp-catalog-placeholder';placeholder.textContent='Imagen por actualizar';card.append(placeholder)}
 const name=document.createElement('h3');name.textContent=item.name;const description=document.createElement('p');description.textContent=item.description;
 const price=document.createElement('strong');price.textContent=money(item.price);price.className='gp-product-price';
 const bulk=document.createElement('p');bulk.textContent='Por mayor: '+money(item.bulkPrice);
 const stock=document.createElement('p');stock.textContent=item.isService?'Servicio · consultar disponibilidad':item.stock>0?'En stock: '+item.stock+' '+item.measureUnit:'Sin stock';
 const actions=document.createElement('div');actions.className='gp-product-actions';const consult=document.createElement('button');consult.type='button';consult.className='gp-button secondary';consult.textContent='Consultar';consult.addEventListener('click',()=>whatsapp('Hola Grafiplot, deseo consultar por '+item.name+'. Precio de referencia: '+money(item.price)));
 actions.append(consult);
 if(item.isService||item.stock>0){const quantity=document.createElement('div');quantity.className='gp-quantity';const minus=document.createElement('button');minus.type='button';minus.textContent='−';minus.setAttribute('aria-label','Reducir cantidad de '+item.name);const qty=document.createElement('input');qty.type='number';qty.min='1';qty.max=String(item.isService?10000:item.stock);qty.value='1';qty.setAttribute('aria-label','Cantidad de '+item.name);const plus=document.createElement('button');plus.type='button';plus.textContent='+';plus.setAttribute('aria-label','Aumentar cantidad de '+item.name);const clamp=()=>Math.min(Number(qty.max),Math.max(1,Math.trunc(Number(qty.value)||1)));minus.onclick=()=>qty.value=Math.max(1,clamp()-1);plus.onclick=()=>qty.value=Math.min(Number(qty.max),clamp()+1);qty.onchange=()=>qty.value=clamp();quantity.append(minus,qty,plus);actions.append(quantity);const add=document.createElement('button');add.type='button';add.className='gp-button';add.textContent='Añadir al carrito';add.addEventListener('click',()=>{const existing=cart.find(i=>i.id===item.id);if(existing){existing.quantity=Math.min(existing.quantity+clamp(),item.isService?10000:item.stock)}else cart.push({...item,quantity:clamp()});renderCart();root.querySelector('#gp-cart-notice').textContent=item.name+' añadido al carrito.'});actions.append(add)}
 card.append(name,description,price,bulk,stock,actions);grid.append(card);searchEntries.push({title:item.name,type:'Producto',terms:item.name+' '+item.description,target:card.id,image:item.image,price:item.price});
 });
 const status=root.querySelector('#gp-catalog-status');status.textContent=inventoryItems.length?inventoryItems.length+' productos y servicios en el catálogo.':'No hay productos disponibles por el momento.';
 const notice=root.querySelector('#gp-catalog-note');notice.textContent='Consulta disponibilidad y condiciones de los precios por mayor.';
 renderCart();window.dispatchEvent(new window.Event('gp-catalog-rendered'));if(searchInput.value.trim())search();
}
function updateCartSummary(){window.dispatchEvent(new window.CustomEvent('gp-delivery-changed',{detail:cart.map(({name,quantity,price})=>({name,quantity,price}))}));root.querySelector('#gp-cart-count').textContent=cart.reduce((sum,item)=>sum+item.quantity,0);root.querySelector('#gp-cart-total').textContent=money(cart.reduce((sum,item)=>sum+item.price*item.quantity,0));}
function renderCart(){window.dispatchEvent(new window.CustomEvent('gp-delivery-changed',{detail:cart.map(({name,quantity,price})=>({name,quantity,price}))}));
 const section=root.querySelector('#gp-cart');section.hidden=false;const list=root.querySelector('#gp-cart-items');list.replaceChildren();
 cart=cart.filter(item=>{const latest=inventoryItems.find(p=>p.id===item.id);if(!latest||(!latest.isService&&latest.stock<=0))return false;Object.assign(item,{stock:latest.stock,price:latest.price,isService:latest.isService,quantity:Math.min(item.quantity,latest.isService?10000:latest.stock)});return true});
 root.querySelector('#gp-cart-count').textContent=cart.reduce((total,item)=>total+item.quantity,0);
 root.querySelector('#gp-cart-empty').hidden=!!cart.length;root.querySelector('#gp-cart-send').disabled=!cart.length;
 cart.forEach(item=>{const row=document.createElement('div');row.className='gp-cart-row';const label=document.createElement('span');label.textContent=item.name+' · '+money(item.price)+' c/u';const input=document.createElement('input');input.type='number';input.min='1';input.max=String(item.isService?10000:item.stock);input.value=item.quantity;input.setAttribute('aria-label','Cantidad de '+item.name);input.addEventListener('input',()=>{const n=Number(input.value);if(!Number.isFinite(n)||n<1)return;const max=item.isService?10000:item.stock;item.quantity=Math.min(max,Math.max(1,Math.trunc(n)));if(n>max)input.value=max;updateCartSummary()});input.addEventListener('change',()=>{item.quantity=Math.min(item.isService?10000:item.stock,Math.max(1,Math.trunc(Number(input.value)||1)));renderCart()});const remove=document.createElement('button');remove.type='button';remove.className='gp-button secondary';remove.textContent='Quitar';remove.addEventListener('click',()=>{cart=cart.filter(c=>c.id!==item.id);renderCart()});row.append(label,input,remove);list.append(row)});
 root.querySelector('#gp-cart-total').textContent=money(cart.reduce((sum,item)=>sum+item.price*item.quantity,0));
}
root.querySelector('#gp-cart-send').addEventListener('click',()=>{
 renderCart();
 if(cart.length)window.dispatchEvent(new window.CustomEvent('gp-prepare-delivery',{detail:cart.map(({name,quantity,price})=>({name,quantity,price}))}));
});
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
 const sdk=await loadFirebase();const {initializeApp,getAuth,getFirestore,doc,onSnapshot,collection}=sdk;
 const app=initializeApp(USER_FIREBASE_CONFIG);siteAuth=getAuth(app);siteDb=getFirestore(app);ownerAuth=createSettingsAuth(sdk,siteAuth);await ownerAuth.watch(ownerSession);root.querySelector('#gp-settings-enter').disabled=false;root.querySelector('#gp-settings-reset').disabled=false;if(!ownerUser)ownerFeedback('');
 settingsRef=doc(siteDb,'artifacts','grafiplot-tienda-v4','public','data','settings','config');
 onSnapshot(settingsRef,{includeMetadataChanges:true},snapshot=>{cloudReady=!snapshot.metadata.fromCache;loadCloudConfig(snapshot.exists()?snapshot.data():{});cloudStatus(cloudReady?'Conectado · configuración recibida del servidor.':'Sin conexión confirmada · mostrando datos en caché.',cloudReady?'connected':'connecting')},error=>{cloudReady=false;cloudStatus('Error de lectura: '+error.code,'error')});
 onSnapshot(collection(siteDb,'artifacts','grafiplot-tienda-v4','public','data','faqs'),snapshot=>{if(!Array.isArray(cloudConfig.faqContent)&&siteSettings.hidden){const faqs=snapshot.docs.map(d=>d.data()).filter(f=>f&&typeof f==='object').map(f=>({question:String(f.question??f.q??''),answer:String(f.answer??f.a??'')})).filter(f=>f.question.trim());if(faqs.length){faqDraft=faqs;renderFaqContent();renderFaqEditor();publishBotContext()}}});
 }catch(error){cloudReady=false;cloudStatus('Firebase no está disponible: '+error.code,'error');ownerFeedback('No se pudo preparar el acceso. Revisa la conexión y pulsa Reintentar conexión.');root.querySelector('#gp-settings-retry').hidden=false;}
}
async function connectInventory(){
 try{
 const {initializeApp,getAuth,signInAnonymously,getFirestore,doc,onSnapshot,collection}=await loadFirebase();
 const app=initializeApp(INVENTORY_FIREBASE_CONFIG,'grafiplot-inventory-reader');await signInAnonymously(getAuth(app));
 onSnapshot(collection(getFirestore(app),'inventory'),{includeMetadataChanges:true},snapshot=>{
 inventorySourceItems=snapshot.docs.map(normalizeInventoryProduct);mergeSiteProducts();renderCatalog();if(snapshot.metadata.fromCache)root.querySelector('#gp-catalog-status').textContent='Inventario sin conexión confirmada. Consulta disponibilidad por WhatsApp.';
 },error=>root.querySelector('#gp-catalog-status').textContent='No se pudo cargar el inventario. Consulta disponibilidad por WhatsApp.');
 }catch(error){root.querySelector('#gp-catalog-status').textContent='No se pudo conectar al inventario. Consulta por WhatsApp.'}
}

window.GrafiplotPage={
 prepare(){fillSettingsForm()},get config(){return cloudConfig},get user(){return settingsUnlocked?ownerUser:null},busy:false,
 get services(){return servicesDraft},get products(){return inventoryItems.map(item=>({...item,...cloudConfig.catalogTexts?.[item.id]}))},get gallery(){return galleryDraft},
 openSettings(){if(!settingsUnlocked){root.querySelector('#gp-campaign-open').click();return}siteSettings.hidden=false;fillSettingsForm();go('gp-site-settings')},
 openLogin(){root.querySelector('#gp-campaign-open').click()},
 save(){root.querySelector('#gp-settings-editor').requestSubmit()},
 logout:closeOwnerSession,
 updateService(index,value){if(!settingsUnlocked)return;if(index===null)servicesDraft.push({id:'service-'+crypto.randomUUID(),...value,photos:[]});else servicesDraft[index]={...servicesDraft[index],...value};renderServices();renderServiceImagesEditor()},
 updateProduct(id,value){if(!settingsUnlocked)return;if(id===null){siteProducts.push({id:'web-'+crypto.randomUUID(),name:value.name,description:value.description||'',image:value.image||'',price:value.price,stock:value.stock,category:'Productos'});mergeSiteProducts()}else{const product=siteProducts.find(p=>p.id===id);if(product)Object.assign(product,value);cloudConfig.catalogTexts||={};cloudConfig.catalogTexts[id]={...cloudConfig.catalogTexts[id],name:value.name,description:value.description,image:value.image};}mergeSiteProducts();renderCatalog()},
 updateGallery(index,value){if(!settingsUnlocked)return;if(index===null)galleryDraft.push(value);else galleryDraft[index]={...galleryDraft[index],...value};renderGalleryContent();renderGalleryEditor()},
 updateImage(kind,url){if(!settingsUnlocked)return;if(kind==='logo'){root.querySelector('#gp-settings-logo').value=url;root.querySelector('.gp-logo').src=url}else if(kind==='hero'){root.querySelector('#gp-hero-image').value=url;root.querySelector('#gp-service-images-editor').dataset.heroDraft=url;root.querySelector('.gp-art img').src=url}},
 getSiteProducts(){return siteProducts},
 remove(kind,id){if(!settingsUnlocked)return;if(kind==='service'){servicesDraft.splice(Number(id),1);renderServices();renderServiceImagesEditor()}if(kind==='gallery'){galleryDraft.splice(Number(id),1);renderGalleryContent();renderGalleryEditor()}if(kind==='product'){siteProducts=siteProducts.filter(p=>p.id!==id);mergeSiteProducts();renderCatalog()}},
 discard(data){siteSettings.hidden=true;campaignAdmin.hidden=true;root.dataset.visualSession='false';root.dataset.visualEditing='false';loadCloudConfig(structuredClone(data||cloudConfig))}
};
window.GrafiplotAddons||={};window.GrafiplotAddons.products={value(){return {siteProducts:siteProducts.map(p=>{if(!p.name?.trim()||!Number.isFinite(p.price)||p.price<0||!Number.isInteger(p.stock)||p.stock<0)throw Error('Revisa el nombre, precio y stock de los productos añadidos.');return {...p}})}}};
window.dispatchEvent(new window.Event('gp-page-ready'));

loadServices();renderServiceImagesEditor();galleryDraft=[];renderGalleryContent();renderCatalog();publishBotContext();connectSite();connectInventory();

update();if(window.lucide)window.lucide.createIcons();else window.addEventListener('load',()=>window.lucide?.createIcons(),{once:true});})();
