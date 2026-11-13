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
 const reopen=document.createElement('button');reopen.id='gp-quick-reopen';reopen.type='button';reopen.className='gp-quick-reopen';reopen.textContent='✨ ¿Qué quieres hacer hoy?';reopen.setAttribute('aria-label','Volver a abrir las opciones rápidas');reopen.hidden=true;
 document.body.append(overlay,reopen);
 const close=overlay.querySelector('.gp-quick-close');
 let lastFocus=null,initialized=false,adWasShown=false,autoTimer=null;
 function show(){
  if(!lastFocus)lastFocus=document.activeElement;
  overlay.hidden=false;reopen.hidden=true;document.body.classList.add('gp-quick-visible');close.focus({preventScroll:true});
 }
 function hide(){
  overlay.hidden=true;reopen.hidden=false;document.body.classList.remove('gp-quick-visible');
  if(lastFocus?.isConnected&&lastFocus!==document.body)lastFocus.focus({preventScroll:true});else reopen.focus({preventScroll:true});
 }
 close.addEventListener('click',hide);
 reopen.addEventListener('click',show);
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
 // La publicidad configurada en Firebase tiene prioridad sobre la ventana de opciones.
 const promo=document.createElement('div');
 promo.id='gp-quick-promo';promo.className='gp-quick-backdrop gp-quick-promo';promo.hidden=true;
 const promoBox=document.createElement('section');promoBox.className='gp-quick-promo-box';promoBox.setAttribute('role','dialog');promoBox.setAttribute('aria-modal','true');
 promoBox.setAttribute('aria-labelledby','gp-quick-promo-title');
 const promoClose=document.createElement('button');promoClose.type='button';promoClose.className='gp-quick-close';
 promoClose.setAttribute('aria-label','Cerrar publicidad y continuar en la página');promoClose.textContent='×';
 const promoCover=document.createElement('div');promoCover.className='gp-quick-promo-cover';
 const promoTag=document.createElement('span');promoTag.className='gp-quick-promo-tag';promoTag.textContent='PROMOCIÓN GRAFIPLOT';
 const promoTitle=document.createElement('h2');promoTitle.id='gp-quick-promo-title';
 const promoDescription=document.createElement('p');promoDescription.className='gp-quick-promo-description';
 const promoLink=document.createElement('a');promoLink.className='gp-quick-promo-link';
 promoLink.target='_blank';promoLink.rel='noopener noreferrer';
 promoBox.append(promoClose,promoCover,promoTag,promoTitle,promoDescription,promoLink);
 promo.append(promoBox);document.body.append(promo);
 function closePromo(){promo.hidden=true;document.body.classList.remove('gp-quick-visible');reopen.hidden=false;initialized=true;reopen.focus({preventScroll:true})}
 promoClose.addEventListener('click',closePromo);
 promo.addEventListener('click',e=>{if(e.target===promo)closePromo()});
 promo.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closePromo()}});
 function showAd(config){
  if(!config||config.campaignEnabled!==true||adWasShown)return;
  adWasShown=true;initialized=true;
  clearTimeout(autoTimer);
  if(!overlay.hidden)hide();
  promoTag.textContent=config.campaignType==='sorteo'?'SORTEO ESPECIAL':'PROMOCIÓN ESPECIAL';
  promoTitle.textContent=String(config.campaignTitle||'¡Participa y gana con Grafiplot!');
  promoDescription.textContent=String(config.campaignDescription||'');
  const imageUrl=String(config.pageImages?.campaign||'');
  let safeImage='';
  try{const parsed=new URL(imageUrl,location.href);if(parsed.protocol==='https:'||parsed.origin===location.origin)safeImage=parsed.href}catch{}
  promoCover.style.backgroundImage=safeImage?'linear-gradient(90deg,rgba(5,15,58,.4),rgba(0,0,0,.04)),url('+JSON.stringify(safeImage)+')':'none';
  let safeLink='';
  try{const parsed=new URL(String(config.campaignUrl||''));if(parsed.protocol==='https:')safeLink=parsed.href}catch{}
  promoLink.hidden=!safeLink;
  if(safeLink)promoLink.href=safeLink;else promoLink.removeAttribute('href');
  promoLink.textContent=String(config.campaignButton||'Ver promoción')+' ↗';
  promo.hidden=false;reopen.hidden=true;document.body.classList.add('gp-quick-visible');
  promoClose.focus({preventScroll:true});
 }
 window.addEventListener('gp-campaign-change',e=>showAd(e.detail));
 // Dar tiempo a Firebase para resolver qué promoción está activa.
 autoTimer=setTimeout(()=>{if(!initialized){initialized=true;show()}},2800);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();