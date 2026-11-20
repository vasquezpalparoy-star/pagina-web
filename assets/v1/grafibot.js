import {detectTracking,lookupTracking,labels,stages} from './grafibot-tracking.mjs?v=trackingchat3';
import {quoteForm} from './grafibot-quote-form.mjs?v=quotechat2';
import {createAssistant} from './grafibot-core.mjs?v=trackingchat3';
import {getBotContext} from './grafibot-context.js?v=trackingchat3';
import {generateWithGemini} from './grafibot-ai.js?v=contact8';
const root=document.getElementById('gp-grafibot');
const panel=root.querySelector('#gp-grafibot-panel'),toggle=root.querySelector('#gp-grafibot-toggle'),close=root.querySelector('#gb-close'),form=root.querySelector('#gb-form'),field=root.querySelector('#gb-input'),messages=root.querySelector('#gb-messages'),thought=root.querySelector('#gb-thought'),wolf=root.querySelector('#gb-wolf');
let state=null,busy=false;
const expand=root.querySelector('#gb-expand'),reset=root.querySelector('#gb-reset');
const welcome=messages.firstElementChild?.cloneNode(true);
const assistant=createAssistant({generate:generateWithGemini,getContext:getBotContext,isOnline:()=>navigator.onLine!==false});
function setOpen(open){panel.hidden=!open;root.classList.toggle('gb-open',open);toggle.setAttribute('aria-expanded',String(open));if(open)field.focus();else toggle.focus()}
expand?.addEventListener('click',()=>{const on=root.classList.toggle('gb-expanded');expand.setAttribute('aria-pressed',String(on));expand.setAttribute('aria-label',on?'Reducir chat':'Ampliar chat')});
reset?.addEventListener('click',()=>{if(busy)return;assistant.reset();state=null;messages.replaceChildren();if(welcome)messages.append(welcome.cloneNode(true));thought.textContent='¿En qué te ayudo?';field.value='';field.placeholder='Escribe un mensaje…';field.focus()});
toggle.addEventListener('click',()=>setOpen(panel.hidden));close.addEventListener('click',()=>setOpen(false));root.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden)setOpen(false)});
function contact(text){return 'https://wa.me/'+getBotContext().phone+'?text='+encodeURIComponent(text)}
function link(parent,text,label='Consultar por WhatsApp'){const a=document.createElement('a');a.className='gb-link';a.href=contact(text);a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;parent.append(a)}
function bubble(role,text){const d=document.createElement('div');d.className='gb-message gb-'+role;const p=document.createElement('p');p.textContent=text;d.append(p);const time=document.createElement('time');time.className='gb-time';time.dateTime=new Date().toISOString();time.textContent=new Date().toLocaleTimeString('es-PE',{hour:'2-digit',minute:'2-digit'});d.append(time);messages.append(d);messages.scrollTop=messages.scrollHeight;return d}
function additions(parent,result){
 if(result.image?.url){try{const u=new URL(result.image.url,location.href);if(u.protocol==='https:'){const img=document.createElement('img');img.className='gb-result-image';img.src=u.href;img.alt=String(result.image.alt||'Referencia');img.loading='lazy';img.referrerPolicy='no-referrer';img.onerror=()=>img.remove();parent.insertBefore(img,parent.querySelector('time'))}}catch{}}
 if(result.actions?.length){const group=document.createElement('div');group.className='gb-actions';for(const action of result.actions){try{const u=new URL(action.href,location.href);if(u.protocol!=='https:'&&u.origin!==location.origin)continue;const a=document.createElement('a');a.textContent=action.label;a.href=u.href;if(u.origin===location.origin){a.addEventListener('click',()=>setOpen(false))}else{a.target='_blank';a.rel='noopener noreferrer'}group.append(a)}catch{}}if(group.children.length)parent.append(group)}
}
const money=value=>new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN'}).format(value);
function quoteCard(parent,q){const card=document.createElement('div');card.className='gb-quote';const title=document.createElement('strong');title.textContent='Cotización de referencia';card.append(title);let total=0;const details=[];for(const item of q.items){const p=document.createElement('div');p.textContent=`${item.qty} ${item.unit} · ${item.name} · ${money(item.price)} c/u`;card.append(p);total+=item.qty*item.price;details.push(p.textContent)}const amount=document.createElement('span');amount.className='gb-total';amount.textContent=money(Number.isFinite(q.total)?q.total:Math.round(total*100)/100);card.append(amount);const note=document.createElement('small');note.textContent=q.notes;card.append(note);link(card,'Hola, quisiera confirmar esta cotización de Grafibot:\n'+details.join('\n')+'\nTotal estimado: '+money(Number.isFinite(q.total)?q.total:Math.round(total*100)/100),'Consultar esta cotización');parent.prepend(card)}
function addQuoteForm(parent,initial){
 parent.classList.add('gb-form-message');
 quoteForm(parent,initial,getBotContext(),(input,label)=>{
  if(busy)return false;
  bubble('user',label);
  let result;try{result=assistant.submitQuote(input)}catch{result={answer:'No se pudo calcular esta combinación. Verifica los datos o consulta por WhatsApp.',handoff:true,state:input}}
  state=result.state;
  const d=bubble('assistant',result.answer);
  if(result.quote)quoteCard(d,result.quote);
  else if(result.handoff)link(d,'Hola, quisiera consultar esta cotización: '+label);
  else if(result.quoteForm)addQuoteForm(d,state);
  if(result.quote){const again=document.createElement('button');again.type='button';again.className='gb-qf-again';again.textContent='Nueva cotización';again.onclick=()=>void send('cotizar');d.append(again)}
  thought.textContent=result.quote?'¡Tu cotización está lista!':'Revisa los datos de la cotización.';
  messages.scrollTop=messages.scrollHeight;return true;
 });
}
function trackField(parent){
 parent.classList.add('gb-form-message');
 const box=document.createElement('form');box.className='gb-track-form';box.setAttribute('aria-label','Seguimiento de delivery');
 const label=document.createElement('label');label.textContent='Celular o enlace privado';
 const input=document.createElement('input');input.type='text';input.required=true;input.maxLength=2048;input.autocomplete='off';input.spellcheck=false;input.placeholder='Ej. 9XX XXX XXX o enlace';
 label.append(input);
 const btn=document.createElement('button');btn.type='submit';btn.textContent='Consultar mi pedido';
 box.append(label,btn);parent.append(box);
 box.onsubmit=e=>{e.preventDefault();if(busy)return;const value=input.value.trim();if(!detectTracking(value)){input.setCustomValidity('Ingresa un celular peruano válido o el enlace de seguimiento.');input.reportValidity();return}input.value='';void send(value)};
 input.oninput=()=>input.setCustomValidity('');
}
function trackingCard(parent,query){
 parent.classList.add('gb-form-message');
 const card=document.createElement('section');card.className='gb-track-card';card.setAttribute('aria-label','Estado del delivery');
 const title=document.createElement('h4');title.textContent='Seguimiento de delivery';
 const content=document.createElement('div');content.className='gb-track-content';content.setAttribute('aria-live','polite');
 const refresh=document.createElement('button');refresh.type='button';refresh.textContent='Actualizar estado';
 card.append(title,content,refresh);parent.append(card);
 let running=false;
 const add=(tag,text,cls)=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;content.append(e);return e};
 async function update(){
  if(running)return;running=true;refresh.disabled=true;content.replaceChildren();add('p','Consultando el estado…');
  try{
   const order=await lookupTracking(query);
   content.replaceChildren();
   if(!order){add('p',query.kind==='phone'?'No encontramos un delivery activo con ese número. Verifica que sea el celular registrado.':'El enlace no está disponible. Puede haber vencido o el pedido haber concluido.');return}
   if(order.reference)add('small','Pedido '+order.reference);
   add('strong',labels[order.status],'gb-track-current');
   const index=stages.indexOf(order.status),list=document.createElement('ol');list.className='gb-track-steps';
   stages.forEach((stage,i)=>{const item=document.createElement('li');item.textContent=labels[stage];item.className=i===index?'gb-step-current':index>i?'gb-step-done':'';if(i===index)item.setAttribute('aria-current','step');list.append(item)});
   content.append(list);
   if(order.estimatedAt)add('p','Entrega estimada: '+new Date(order.estimatedAt).toLocaleString('es-PE',{timeZone:'America/Lima',dateStyle:'medium',timeStyle:'short'}));
   else add('p','Entrega estimada: por confirmar.');
   add('small',query.kind==='phone'?'Último delivery activo · consulta por celular.':'Pedido específico · enlace privado.');
  }catch{content.replaceChildren();add('p',query.kind==='link'?'No pudimos consultar este enlace. Verifica que siga vigente e inténtalo de nuevo.':'No pudimos consultar el sistema de delivery. Inténtalo de nuevo.')}
  finally{running=false;refresh.disabled=false;messages.scrollTop=messages.scrollHeight}
 }
 refresh.onclick=()=>void update();return update();
}
async function send(value){const text=value.trim();if(!text||busy)return;busy=true;field.value='';const tracking=detectTracking(text);bubble('user',tracking?.kind==='phone'?'Celular: ••• ••• '+tracking.value.slice(-3):tracking?'Enlace de seguimiento privado':text);for(const b of root.querySelectorAll('[data-gb-query],#gb-send,#gb-reset'))b.disabled=true;thought.textContent='GrafiBot está escribiendo…';root.classList.add('gb-typing');let result;
try{if(tracking){if(tracking.kind==='invalid'){const d=bubble('assistant','Ese enlace no es válido. Pega el enlace privado de seguimiento que recibiste de Grafiplot.');trackField(d);thought.textContent='Verifica el enlace.';}else{const d=bubble('assistant','Voy a consultar el estado de tu pedido.');await trackingCard(d,tracking);thought.textContent='Consulta de delivery';}return;}if(/^(cotizar|nueva cotizacion|nueva cotización)$/i.test(text))assistant.reset();result=await assistant.reply(text);state=result.state;const d=bubble('assistant',result.answer);additions(d,result);if(result.trackingForm)trackField(d);else if(result.quote)quoteCard(d,result.quote);else if(result.quoteForm&&!result.handoff)addQuoteForm(d,result.state);else if(result.handoff)link(d,'Hola, necesito ayuda con: '+text+'\n'+(state?'Datos de la cotización: '+JSON.stringify(state):''));thought.textContent=result.mode==='unavailable'?'Modo local · cotizador disponible':result.mode==='ai'?'Gemini · '+(result.quote?'cotización lista':'consulta atendida'):result.quote?'¡Tu cotización está lista!':state?'Continúa tu cotización.':'¿Qué más necesitas?';field.placeholder=state?'Escribe tu respuesta…':'Escribe tu pregunta…';}
catch{const d=bubble('assistant','No pude cargar las respuestas. Inténtalo nuevamente o consulta por WhatsApp.');d.classList.add('gb-fail');link(d,'Hola, necesito ayuda con: '+text);thought.textContent='Puedes consultar por WhatsApp.';}
finally{busy=false;root.classList.remove('gb-typing');for(const b of root.querySelectorAll('[data-gb-query],#gb-send,#gb-reset'))b.disabled=false;messages.scrollTop=messages.scrollHeight;if(!panel.hidden&&!result?.quoteForm&&!result?.trackingForm)field.focus()}}
form.addEventListener('submit',event=>{event.preventDefault();void send(field.value)});field.addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.isComposing){event.preventDefault();void send(field.value)}});for(const b of root.querySelectorAll('[data-gb-query]'))b.addEventListener('click',()=>void send(b.dataset.gbQuery));

