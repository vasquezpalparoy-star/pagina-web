/* Ventana de orientación independiente. No altera las secciones ni los eventos originales. */
(()=>{'use strict';
function init(){
 if(document.getElementById('gp-quick-backdrop'))return;
 const overlay=document.createElement('div');
 overlay.id='gp-quick-backdrop';overlay.className='gp-quick-backdrop';
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
 let lastFocus=null;
 function show(){lastFocus=document.activeElement;overlay.hidden=false;reopen.hidden=true;document.body.classList.add('gp-quick-visible');close.focus({preventScroll:true})}
 function hide(){overlay.hidden=true;reopen.hidden=false;document.body.classList.remove('gp-quick-visible');if(lastFocus?.isConnected&&lastFocus!==document.body)lastFocus.focus({preventScroll:true});else reopen.focus({preventScroll:true})}
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
 show();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();