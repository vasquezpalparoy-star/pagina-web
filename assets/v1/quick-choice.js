/* Ventana de orientación independiente. No altera las secciones ni los eventos originales. */
(()=>{'use strict';
function init(){
 if(document.getElementById('gp-quick-backdrop'))return;
 const overlay=document.createElement('div');
 overlay.id='gp-quick-backdrop';overlay.className='gp-quick-backdrop';overlay.hidden=true;
 overlay.innerHTML='<section class="gp-quick-modal" role="dialog" aria-modal="true" aria-labelledby="gp-quick-title" aria-describedby="gp-quick-description">'+
 '<button type="button" class="gp-quick-close" aria-label="Cerrar y continuar en la página" title="Cerrar">×</button>'+
 '<div class="gp-quick-header"><img src="./logo-grafiplot.webp" alt="Logo GRAFIPLOT VASQUEZ"><strong>GRAFIPLOT VASQUEZ</strong><p id="gp-quick-description">Impresiones · Copias · Diseño · Herramientas · Biblioteca</p></div>'+
 '<h2 id="gp-quick-title" class="gp-quick-title">¿Qué quieres hacer hoy?</h2>'+
 '<div class="gp-quick-options">'+
 '<a class="gp-quick-option" href="#gp-quote" data-action="quote"><span class="gp-quick-symbol" aria-hidden="true">🖨️</span><strong>Imprimir o cotizar</strong><small>Precios y enviar pedido</small><span class="gp-quick-arrow" aria-hidden="true">➜</span></a>'+
 '<a class="gp-quick-option" href="./delivery.html" data-action="orders"><span class="gp-quick-symbol" aria-hidden="true">📦</span><strong>Ver mi pedido</strong><small>Consultar el estado</small><span class="gp-quick-arrow" aria-hidden="true">➜</span></a>'+
 '<a class="gp-quick-option" href="./pdf.html" data-action="tools"><span class="gp-quick-symbol" aria-hidden="true">🛠️</span><strong>Herramientas gratis</strong><small>FUT, PDF, carátulas y más</small><span class="gp-quick-arrow" aria-hidden="true">➜</span></a>'+
 '<a class="gp-quick-option" href="./navegador-libros.html" data-action="books"><span class="gp-quick-symbol" aria-hidden="true">📚</span><strong>Buscar libros e imágenes</strong><small>Biblioteca GRAFIPLOT e Internet</small><span class="gp-quick-arrow" aria-hidden="true">➜</span></a>'+
 '</div></section>';
 document.body.append(overlay);
 const close=overlay.querySelector('.gp-quick-close');
 let lastFocus=null,decisionReceived=false,initialTimer=null,adAlreadyDisplayed=false,dismissed=false;
 function show(){
  if(!lastFocus)lastFocus=document.activeElement;
  overlay.hidden=false;document.body.classList.add('gp-quick-visible');close.focus({preventScroll:true});
 }
 function hide(){
  dismissed=true;
  overlay.hidden=true;document.body.classList.remove('gp-quick-visible');
  if(lastFocus?.isConnected&&lastFocus!==document.body)lastFocus.focus({preventScroll:true});else close.blur();
 }
 close.addEventListener('click',hide);
 overlay.addEventListener('click',e=>{if(e.target===overlay)hide()});
 overlay.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();hide();return}
  if(e.key!=='Tab')return;
  const controls=[...overlay.querySelectorAll('button,a[href]')].filter(n=>!n.disabled);
  const first=controls[0],last=controls[controls.length-1];
  if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
 });
 overlay.querySelector('[data-action="quote"]').addEventListener('click',e=>{
  e.preventDefault();hide();const target=document.querySelector('#grafiplot-preview [data-go="gp-quote"]');
  if(target)target.click();else document.getElementById('gp-quote')?.scrollIntoView({behavior:'smooth',block:'start'});
 });

 // Las promociones activas de Firebase tienen prioridad al entrar.
 // Si no hay campaña, se muestran las opciones habituales.
 const adBackdrop=document.createElement('div');
 adBackdrop.id='gp-quick-promo';
 adBackdrop.className='gp-quick-backdrop gp-quick-promo';
 adBackdrop.hidden=true;
 adBackdrop.innerHTML='<section class="gp-quick-promo-card" role="dialog" aria-modal="true" aria-labelledby="gp-quick-promo-title">'+
  '<button type="button" class="gp-quick-close" aria-label="Cerrar publicidad y continuar en la página">×</button>'+
  '<span class="gp-quick-promo-label">PUBLICIDAD GRAFIPLOT</span>'+
  '<div class="gp-quick-promo-image" role="img" aria-label="Imagen de la promoción"></div>'+
  '<div class="gp-quick-promo-content"><h2 id="gp-quick-promo-title"></h2>'+
  '<p class="gp-quick-promo-description"></p><a class="gp-quick-promo-link" target="_blank" rel="noopener noreferrer">Ver promoción ↗</a></div>'+
  '</section>';
 document.body.append(adBackdrop);
 const adClose=adBackdrop.querySelector('.gp-quick-close');
 const videoWrap=document.createElement('div');
 videoWrap.className='gp-quick-promo-video';
 videoWrap.hidden=true;
 adBackdrop.querySelector('.gp-quick-promo-image').insertAdjacentElement('afterend',videoWrap);
 let stopCover=()=>{};
 function stopAdVideo(){stopCover();stopCover=()=>{};videoWrap.replaceChildren()}
 function setAdMedia(config){
  stopAdVideo();
  const source=config.campaignMediaType==='video'?window.GrafiplotAdVideo?.parse(config.campaignVideoUrl):null;
  const cover=adBackdrop.querySelector('.gp-quick-promo-image');
  if(source){
   cover.hidden=true;videoWrap.hidden=false;
   const frame=window.GrafiplotAdVideo.frame(config.campaignVideoUrl,'Publicidad de GRAFIPLOT');
   if(frame){
    videoWrap.append(frame);
    stopCover=window.GrafiplotAdVideo.cover(frame,videoWrap);
   }
   // Drive puede ignorar autoplay: mostrar un acceso manual al video.
   if(source.provider==='drive'){
    const note=document.createElement('a');
    note.className='gp-drive-video-fallback';
    note.href=source.url;note.target='_blank';note.rel='noopener noreferrer';
    note.textContent='Si Drive no inicia, abrir video ↗';
    videoWrap.append(note);
   }
  }else{
   videoWrap.hidden=true;
   const image=String(config.pageImages?.campaign||'');
   let safeImage='';
   try{const url=new URL(image,location.href);if(url.protocol==='https:'||url.origin===location.origin)safeImage=url.href}catch{}
   cover.style.backgroundImage=safeImage?'url('+JSON.stringify(safeImage)+')':'none';
   cover.hidden=!safeImage;
  }
 }
 function closeAd(){
  dismissed=true;
  adBackdrop.hidden=true;stopAdVideo();document.body.classList.remove('gp-quick-visible');
  adClose.blur();
 }
 adClose.addEventListener('click',closeAd);
 adBackdrop.addEventListener('click',e=>{if(e.target===adBackdrop)closeAd()});
 adBackdrop.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeAd()}});
 function showAd(config){
  if(adAlreadyDisplayed)return;
  adAlreadyDisplayed=true;
  if(!overlay.hidden){overlay.hidden=true;document.body.classList.remove('gp-quick-visible')}
  const title=String(config.campaignTitle||'¡Conoce nuestra promoción!').slice(0,150);
  const desc=String(config.campaignDescription||'').slice(0,1500);
  adBackdrop.querySelector('.gp-quick-promo-label').textContent=config.campaignType==='sorteo'?'SORTEO GRAFIPLOT':'PROMOCIÓN GRAFIPLOT';
  adBackdrop.querySelector('#gp-quick-promo-title').textContent=title;
  adBackdrop.querySelector('.gp-quick-promo-description').textContent=desc;
  setAdMedia(config);
  const link=adBackdrop.querySelector('.gp-quick-promo-link');
  let safeLink='';
  try{const url=new URL(String(config.campaignUrl||''));if(url.protocol==='https:')safeLink=url.href}catch{}
  link.hidden=!safeLink;
  if(safeLink){link.href=safeLink;link.textContent=String(config.campaignButton||'Ver promoción').slice(0,80)+' ↗'}
  else link.removeAttribute('href');
  adBackdrop.hidden=false;document.body.classList.add('gp-quick-visible');
  adClose.focus({preventScroll:true});
 }
 function campaignChange(event){
  const config=event.detail;
  if(!config||typeof config.campaignEnabled!=='boolean')return;
  decisionReceived=true;
  clearTimeout(initialTimer);
  if(config.campaignEnabled===true){
   showAd(config);
  }else{
   // Si Firebase confirma que la campaña fue desactivada, retirar su popup.
   if(!adBackdrop.hidden){adBackdrop.hidden=true;document.body.classList.remove('gp-quick-visible')}
   adAlreadyDisplayed=false;
   if(!dismissed&&overlay.hidden)show();
  }
 }
 window.addEventListener('gp-campaign-change',campaignChange);
 // Si Firebase falla, no dejamos la portada bloqueada ni vacía.
 initialTimer=setTimeout(()=>{if(!decisionReceived&&!adAlreadyDisplayed&&overlay.hidden)show()},4500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();